/* Catálogo base. Define QUÉ existe; nunca decide qué entra en el plan (eso lo activa el usuario). */
var TW = window.TW = {};

TW.MUSCLES = {
  pecho: 'Pecho', espalda: 'Espalda', hombros: 'Hombros', biceps: 'Bíceps', triceps: 'Tríceps',
  cuadriceps: 'Cuádriceps', isquiotibiales: 'Isquiotibiales', gluteos: 'Glúteos', abdomen: 'Abdomen',
  pantorrillas: 'Pantorrillas', cuerpo_completo: 'Cuerpo completo', cardio: 'Cardio', movilidad: 'Movilidad'
};
TW.PATTERNS = {
  empuje: 'Empuje', tiron: 'Tirón', sentadilla: 'Sentadilla', bisagra: 'Bisagra de cadera',
  zancada: 'Zancada', aislamiento: 'Aislamiento', core: 'Core', cardio: 'Cardio', flexibilidad: 'Flexibilidad'
};
TW.EQUIPMENT = {
  mancuernas: 'Mancuernas', barra: 'Barra', discos: 'Discos', barra_dominadas: 'Barra de dominadas',
  banda_rosa: 'Banda HAWK rosa 66×8 cm (más firme)', banda_turquesa: 'Banda HAWK turquesa 72×8 cm (ligera)',
  cuerda_saltar: 'Cuerda de saltar', bicicleta: 'Bicicleta estática', kettlebell: 'Kettlebell', banco: 'Banco',
  gimnasio: 'Gimnasio (actívalo cuando tengas acceso)'
};
/* Resistencia de cada banda: no viene impresa en la caja; se completa al probarlas (ligera / media / fuerte). */
TW.BANDS_NOTE = 'Resistencia según tu prueba: la turquesa es ligera y la rosa más firme. La caja no indica la carga en kg.';
/* Zonas donde conviene cada banda (criterio práctico, no de un estudio). */
TW.BAND_ZONES = {
  banda_turquesa: 'Ligera: calentamiento, activación de glúteo medio, abducción de cadera y remo de técnica.',
  banda_rosa: 'Más firme: puente de glúteo, remo con más tensión y patadas o sentadilla con banda.'
};
/* Calentamiento según el lugar (se muestra en Hoy). */
TW.WARMUP = {
  casa: ['Caminar en el sitio o trote suave 3 min', 'Círculos de cadera y hombros, 10 c/u', 'Sentadilla sin peso, 2 × 10 lenta', 'Puente de glúteo sin peso, 2 × 12', 'Plancha corta, 20 s'],
  abierto: ['Caminata rápida 5 min', 'Trote suave 3–5 min (o alterna 1 min trote / 1 min caminar)', 'Zancadas sin peso, 2 × 8 por pierna', 'Círculos de cadera y hombros, 10 c/u', 'Saltos suaves con cuerda o sin ella, 1 min']
};
/* Equipo con cargas en kg. Lo usan logic.js y app.js (Ajustes y asistente). */
TW.LOADABLE = ['mancuernas', 'discos', 'barra', 'kettlebell'];
/* Discos del usuario (foto): piezas totales por peso. */
TW.PLATE_POOL = [{ kg: 2.5, n: 16 }, { kg: 1.25, n: 8 }, { kg: 0.5, n: 8 }];
/* Totales alcanzables con las piezas dadas. parts: [{ kg, max }] (max = piezas de ese peso disponibles). */
TW.achievable = function (parts) {
  var vals = [0];
  parts.forEach(function (p) {
    var next = [];
    vals.forEach(function (v) { for (var k = 0; k <= p.max; k++) next.push(Math.round((v + p.kg * k) * 100) / 100); });
    vals = Array.from(new Set(next));
  });
  return vals.sort(function (a, b) { return a - b; });
};
/* Cargas precargadas en Ajustes (editables). Mancuerna = las dos mancuernas comparten el pool (n/2 piezas por peso).
   Barra = ambos lados con la misma carga; no incluye el peso de la barra (desconocido). */
TW.PRESET_LOADS = (function () {
  var perDb = TW.achievable(TW.PLATE_POOL.map(function (p) { return { kg: p.kg, max: p.n / 2 }; }));
  return {
    mancuernas: perDb,
    barra: perDb.map(function (x) { return Math.round(x * 2 * 100) / 100; }),
    discos: [],
    kettlebell: [8]
  };
})();
TW.GOALS = { definicion: 'Definición muscular', calistenia: 'Calistenia', resistencia: 'Resistencia cardiovascular', flexibilidad: 'Flexibilidad' };
TW.ALL_GOALS = Object.keys(TW.GOALS);
TW.TYPES = { fuerza: 'Fuerza', cardio: 'Cardio', flex: 'Flexibilidad' };
TW.PROGS = { reps: 'Repeticiones (sin carga)', carga: 'Doble progresión con carga', tiempo: 'Tiempo (segundos)', ladder: 'Escalera de progresión' };
TW.STAGES = ['Pasivo · rango corto', 'Pasivo · rango completo', 'Activo · rango corto', 'Activo · rango completo'];
TW.ASSESS = {
  flexiones: 'Flexiones limpias seguidas', dominadas: 'Dominadas limpias', remo_invertido: 'Remo invertido limpio',
  bulgara: 'Sentadilla búlgara limpia (por pierna)', sentadilla: 'Sentadilla profunda limpia', plancha: 'Plancha (segundos)'
};

/* Escaleras: thresholds[i] = valor mínimo de evaluación para empezar en el paso i. */
TW.LADDERS = {
  flexiones: { id: 'flexiones', name: 'Flexiones', unit: 'reps', thresholds: [0, 3, 8, 15, 25], steps: [
    { name: 'Flexiones inclinadas (manos en banco)', target: 12 },
    { name: 'Flexiones de rodillas', target: 12 },
    { name: 'Flexiones completas', target: 10 },
    { name: 'Flexiones declinadas (pies en banco)', target: 10 },
    { name: 'Flexiones con pies elevados', target: 8 } ] },
  dominadas: { id: 'dominadas', name: 'Dominadas', unit: 'reps', thresholds: [0, 1, 3, 6, 12], steps: [
    { name: 'Dominada asistida con banda', target: 8 },
    { name: 'Dominadas negativas (bajada de 3 s)', target: 5 },
    { name: 'Dominadas asistidas con banda ligera', target: 6 },
    { name: 'Dominadas completas', target: 8 },
    { name: 'Dominadas con pausa arriba de 2 s', target: 6 } ] },
  remo_invertido: { id: 'remo_invertido', name: 'Remo invertido', unit: 'reps', thresholds: [0, 4, 10, 16], steps: [
    { name: 'Remo invertido con pies en el suelo', target: 12 },
    { name: 'Remo invertido cuerpo recto', target: 10 },
    { name: 'Remo invertido con pies elevados', target: 10 },
    { name: 'Remo invertido con pausa', target: 8 } ] },
  bulgara: { id: 'bulgara', name: 'Sentadilla búlgara', unit: 'reps', thresholds: [0, 4, 8], steps: [
    { name: 'Búlgara con pie en banco bajo', target: 10 },
    { name: 'Búlgara estándar', target: 10 },
    { name: 'Búlgara con mancuernas', target: 8 } ] },
  sentadilla: { id: 'sentadilla', name: 'Sentadilla profunda', unit: 'reps', thresholds: [0, 10, 20, 30], steps: [
    { name: 'Sentadilla a banco (toca y sube)', target: 15 },
    { name: 'Sentadilla profunda', target: 15 },
    { name: 'Sentadilla profunda con pausa de 2 s', target: 10 },
    { name: 'Sentadilla goblet con mancuerna', target: 10 } ] },
  plancha: { id: 'plancha', name: 'Plancha', unit: 'seg', thresholds: [0, 20, 45, 60], steps: [
    { name: 'Plancha sobre rodillas', target: 30 },
    { name: 'Plancha estándar', target: 45 },
    { name: 'Plancha con elevación alterna de brazos', target: 40 },
    { name: 'Plancha con pausa de 10 s', target: 60 } ] }
};

/* Constructor con valores por defecto. */
TW.makeEx = function (o) {
  return Object.assign({ sets: 3, rest: 90, prog: 'reps', range: [8, 12], type: 'fuerza', unit: 'reps', equip: [], minutes: 20, positions: null, ladder: null, custom: false, muscles: [], goals: [] }, o);
};
const E = TW.makeEx;

TW.CATALOG = [
  /* Peso corporal / calistenia */
  E({ id: 'flexiones', name: 'Flexiones', pattern: 'empuje', muscles: ['pecho', 'triceps', 'hombros'], diff: 1, goals: ['calistenia', 'definicion'], prog: 'ladder', ladder: 'flexiones', note: 'Cuerpo en línea recta, codos a unos 45° del tronco. Baja hasta casi tocar el pecho.' }),
  E({ id: 'flexiones_pies_elevados', name: 'Flexiones con pies elevados', pattern: 'empuje', muscles: ['pecho', 'hombros', 'triceps'], equip: ['banco'], diff: 3, goals: ['calistenia'], range: [6, 12], note: 'Pies sobre el banco, manos a la altura del pecho. Cuello neutro.' }),
  E({ id: 'fondos_banco', name: 'Fondos en banco', pattern: 'empuje', muscles: ['triceps', 'pecho'], equip: ['banco'], diff: 1, goals: ['definicion', 'calistenia'], range: [8, 15], note: 'Hombros lejos de las orejas. Baja hasta 90° de codo sin encoger los hombros.' }),
  E({ id: 'pike_push_up', name: 'Flexiones pike', pattern: 'empuje', muscles: ['hombros', 'triceps'], diff: 2, goals: ['calistenia'], range: [6, 12], note: 'Cadera alta en V invertida; baja la cabeza hacia el suelo entre las manos.' }),
  E({ id: 'dominadas', name: 'Dominadas', pattern: 'tiron', muscles: ['espalda', 'biceps'], equip: ['barra_dominadas'], diff: 2, goals: ['calistenia', 'definicion'], prog: 'ladder', ladder: 'dominadas', rest: 120, note: 'Agarre prono a la altura de los hombros. Sube hasta que la barbilla supere la barra.' }),
  E({ id: 'dominadas_supinas', name: 'Dominadas supinas', pattern: 'tiron', muscles: ['biceps', 'espalda'], equip: ['barra_dominadas'], diff: 2, goals: ['calistenia'], range: [3, 8], rest: 120, note: 'Agarre supino a la anchura de los hombros. Evita balancear el cuerpo.' }),
  E({ id: 'remo_invertido', name: 'Remo invertido', pattern: 'tiron', muscles: ['espalda', 'biceps'], equip: ['barra_dominadas'], diff: 1, goals: ['calistenia'], prog: 'ladder', ladder: 'remo_invertido', note: 'Cuerpo rígido, pecho hacia la barra, codos cerca del cuerpo.' }),
  E({ id: 'remo_banda', name: 'Remo con banda rosa', pattern: 'tiron', muscles: ['espalda', 'biceps'], equip: ['banda_rosa'], diff: 1, goals: ['definicion'], range: [10, 15], note: 'Retrae las escápulas al final del movimiento; no uses el tronco como impulso.' }),
  E({ id: 'remo_banda_turquesa', name: 'Remo con banda turquesa', pattern: 'tiron', muscles: ['espalda', 'biceps'], equip: ['banda_turquesa'], diff: 1, goals: ['definicion'], range: [10, 15], note: 'Retrae las escápulas al final del movimiento; no uses el tronco como impulso.' }),
  E({ id: 'puente_banda_rosa', name: 'Puente de glúteo con banda rosa', pattern: 'bisagra', muscles: ['gluteos', 'isquiotibiales'], equip: ['banda_rosa'], diff: 1, goals: ['definicion'], range: [12, 15], rest: 60, note: 'Banda por encima de las rodillas o sobre la cadera; empuja con talones y aprieta glúteos arriba.' }),
  E({ id: 'abduccion_banda_turquesa', name: 'Abducción de cadera con banda turquesa', pattern: 'aislamiento', muscles: ['gluteos'], equip: ['banda_turquesa'], diff: 1, goals: ['definicion'], range: [15, 20], rest: 45, note: 'Banda en los tobillos o rodillas; abre sin balancear el tronco y controla la vuelta.' }),
  E({ id: 'saltar_cuerda', name: 'Saltar cuerda', pattern: 'cardio', muscles: ['cardio', 'pantorrillas'], equip: ['cuerda_saltar'], diff: 1, goals: ['resistencia', 'definicion'], type: 'cardio', minutes: 10, note: 'Saltos bajos, codos cerca del cuerpo, aterriza suave sobre la punta de los pies.' }),
  E({ id: 'sentadilla_bulgara', name: 'Sentadilla búlgara', pattern: 'zancada', muscles: ['cuadriceps', 'gluteos'], equip: ['banco'], diff: 2, goals: ['calistenia', 'definicion'], prog: 'ladder', ladder: 'bulgara', note: 'Pie trasero apoyado en el banco. Rodilla delantera alineada con el pie.' }),
  E({ id: 'sentadilla', name: 'Sentadilla profunda', pattern: 'sentadilla', muscles: ['cuadriceps', 'gluteos'], diff: 1, goals: ['calistenia', 'definicion'], prog: 'ladder', ladder: 'sentadilla', note: 'Talones apoyados, rodillas en la línea de los pies, pecho erguido.' }),
  E({ id: 'zancadas', name: 'Zancadas', pattern: 'zancada', muscles: ['cuadriceps', 'gluteos'], diff: 1, goals: ['definicion'], range: [10, 14], note: 'Paso largo, rodilla trasera casi al suelo, tronco erguido.' }),
  E({ id: 'puente_gluteo', name: 'Puente de glúteo', pattern: 'bisagra', muscles: ['gluteos', 'isquiotibiales'], diff: 1, goals: ['definicion'], range: [12, 20], note: 'Empuja con talones y aprieta glúteos arriba. Pausa de 1 s.' }),
  E({ id: 'plancha', name: 'Plancha', pattern: 'core', muscles: ['abdomen'], diff: 1, goals: ['calistenia', 'definicion'], prog: 'ladder', ladder: 'plancha', unit: 'seg', rest: 60, note: 'Cuerpo en línea recta desde la cabeza a los talones. No dejes caer la cadera.' }),
  E({ id: 'crunch', name: 'Crunch', pattern: 'core', muscles: ['abdomen'], diff: 1, goals: ['definicion'], range: [15, 25], rest: 60, note: 'Eleva los hombros del suelo con el abdomen; la lumbar se mantiene apoyada.' }),
  E({ id: 'elevacion_piernas', name: 'Elevación de piernas colgado', pattern: 'core', muscles: ['abdomen'], equip: ['barra_dominadas'], diff: 2, goals: ['calistenia', 'definicion'], range: [8, 12], rest: 60, note: 'Colgado de la barra, eleva las piernas sin balancear el cuerpo.' }),
  E({ id: 'mountain_climbers', name: 'Escaladores', pattern: 'core', muscles: ['abdomen', 'cuerpo_completo'], diff: 1, goals: ['resistencia', 'definicion'], type: 'fuerza', prog: 'tiempo', unit: 'seg', range: [30, 45], rest: 45, note: 'Posición de plancha, lleva rodillas al pecho alternando sin subir la cadera.' }),
  E({ id: 'burpees', name: 'Burpees', pattern: 'cardio', muscles: ['cuerpo_completo', 'cardio'], diff: 2, goals: ['resistencia', 'definicion'], range: [8, 15], rest: 60, note: 'Baja a plancha, flexión opcional, salto con palmada arriba.' }),
  E({ id: 'elevacion_pantorrillas', name: 'Elevación de pantorrillas', pattern: 'aislamiento', muscles: ['pantorrillas'], diff: 1, goals: ['definicion'], range: [15, 25], rest: 45, note: 'Sube sobre la punta de los pies, pausa arriba y baja lento.' }),

  /* Con equipo */
  E({ id: 'kb_swing', name: 'Swing con kettlebell', pattern: 'bisagra', muscles: ['gluteos', 'isquiotibiales', 'cuerpo_completo'], equip: ['kettlebell'], diff: 2, goals: ['resistencia', 'definicion'], range: [15, 20], rest: 60, prog: 'carga', note: 'Impulso desde la cadera, no con los brazos; espalda neutra y la pesa sube hasta la altura del pecho.' }),
  E({ id: 'kb_goblet', name: 'Sentadilla goblet con kettlebell', pattern: 'sentadilla', muscles: ['cuadriceps', 'gluteos'], equip: ['kettlebell'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Kettlebell pegada al pecho; codos entre las rodillas al bajar.' }),
  E({ id: 'kb_press', name: 'Press con kettlebell', pattern: 'empuje', muscles: ['hombros', 'triceps'], equip: ['kettlebell'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Kettlebell en la posición de rack; empuja sin arquear la lumbar.' }),
  E({ id: 'gym_prensa', name: 'Prensa de pierna', pattern: 'sentadilla', muscles: ['cuadriceps', 'gluteos'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Espalda pegada al respaldo; baja hasta 90° sin levantar la pelvis.' }),
  E({ id: 'gym_jalon', name: 'Jalón al pecho', pattern: 'tiron', muscles: ['espalda', 'biceps'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Lleva la barra al esternón con el pecho alto; no balancees el tronco.' }),
  E({ id: 'gym_remo_polea', name: 'Remo en polea sentado', pattern: 'tiron', muscles: ['espalda', 'biceps'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Junta las escápulas al final del recorrido; mantén la columna neutra.' }),
  E({ id: 'gym_press_pecho', name: 'Press de pecho en máquina', pattern: 'empuje', muscles: ['pecho', 'triceps'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Ajusta el asiento para que los agarres queden a la altura del pecho.' }),
  E({ id: 'gym_aperturas', name: 'Aperturas en máquina', pattern: 'aislamiento', muscles: ['pecho'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [10, 15], prog: 'carga', note: 'Codos ligeramente flexionados y fijos; cierra con control.' }),
  E({ id: 'gym_curl_femoral', name: 'Curl femoral tumbado', pattern: 'aislamiento', muscles: ['isquiotibiales'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [10, 15], prog: 'carga', note: 'Caderas apoyadas en el banco; flexiona sin levantar la pelvis.' }),
  E({ id: 'gym_extension_cuad', name: 'Extensión de cuádriceps', pattern: 'aislamiento', muscles: ['cuadriceps'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [10, 15], prog: 'carga', note: 'Extiende sin bloquear bruscamente la rodilla; baja en 2-3 segundos.' }),
  E({ id: 'gym_abductor', name: 'Abductor en máquina', pattern: 'aislamiento', muscles: ['gluteos'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [12, 15], prog: 'carga', note: 'Espalda recta y movimiento lento; no rebotes en el tope.' }),
  E({ id: 'gym_press_hombro', name: 'Press de hombro en máquina', pattern: 'empuje', muscles: ['hombros', 'triceps'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Empuja en línea con los hombros; evita arquear la zona lumbar.' }),
  E({ id: 'gym_crunch_polea', name: 'Crunch en polea', pattern: 'core', muscles: ['abdomen'], equip: ['gimnasio'], diff: 2, goals: ['definicion'], range: [10, 15], prog: 'carga', note: 'Flexiona el tronco llevando el pecho hacia las caderas; la cadera no se mueve.' }),
  E({ id: 'gym_triceps_polea', name: 'Extensión de tríceps en polea', pattern: 'aislamiento', muscles: ['triceps'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [10, 15], prog: 'carga', note: 'Codos pegados al cuerpo; extiende completamente sin mover los hombros.' }),
  E({ id: 'gym_curl_polea', name: 'Curl de bíceps en polea', pattern: 'aislamiento', muscles: ['biceps'], equip: ['gimnasio'], diff: 1, goals: ['definicion'], range: [10, 15], prog: 'carga', note: 'Codos fijos junto al torso; sube y baja con control.' }),
  E({ id: 'gym_puente_maquina', name: 'Puente de glúteo en máquina', pattern: 'bisagra', muscles: ['gluteos', 'isquiotibiales'], equip: ['gimnasio'], diff: 2, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Empuja con los talones y aprieta el glúteo arriba; no arquees la lumbar.' }),
  E({ id: 'press_banca', name: 'Press de banca', pattern: 'empuje', muscles: ['pecho', 'triceps'], equip: ['barra', 'discos', 'banco'], diff: 2, goals: ['definicion'], range: [6, 10], rest: 120, prog: 'carga', note: 'Escápulas juntas y abajo; barra al esternón; empuja en diagonal hacia los hombros.' }),
  E({ id: 'press_mancuernas', name: 'Press con mancuernas en banco', pattern: 'empuje', muscles: ['pecho', 'triceps'], equip: ['mancuernas', 'banco'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Codos a unos 45°; baja hasta sentir estiramiento en el pecho.' }),
  E({ id: 'press_hombro', name: 'Press de hombro con mancuernas', pattern: 'empuje', muscles: ['hombros', 'triceps'], equip: ['mancuernas'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Abdomen apretado; no arquees la lumbar al empujar.' }),
  E({ id: 'elevaciones_laterales', name: 'Elevaciones laterales', pattern: 'aislamiento', muscles: ['hombros'], equip: ['mancuernas'], diff: 1, goals: ['definicion'], range: [12, 15], rest: 60, prog: 'carga', note: 'Codos ligeramente flexionados; sube hasta la altura del hombro, sin impulso.' }),
  E({ id: 'curl_biceps', name: 'Curl de bíceps', pattern: 'aislamiento', muscles: ['biceps'], equip: ['mancuernas'], diff: 1, goals: ['definicion'], range: [10, 15], rest: 60, prog: 'carga', note: 'Codos fijos junto al tronco; baja en 2–3 s.' }),
  E({ id: 'extension_triceps', name: 'Extensión de tríceps', pattern: 'aislamiento', muscles: ['triceps'], equip: ['mancuernas'], diff: 1, goals: ['definicion'], range: [10, 15], rest: 60, prog: 'carga', note: 'Sobre la cabeza, codos apuntando al techo; solo se mueven los antebrazos.' }),
  E({ id: 'remo_mancuerna', name: 'Remo a una mano con mancuerna', pattern: 'tiron', muscles: ['espalda', 'biceps'], equip: ['mancuernas', 'banco'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Apoya la rodilla y la mano en el banco; codo hacia la cadera.' }),
  E({ id: 'remo_barra', name: 'Remo con barra', pattern: 'tiron', muscles: ['espalda', 'biceps'], equip: ['barra', 'discos'], diff: 2, goals: ['definicion'], range: [6, 10], rest: 120, prog: 'carga', note: 'Tronco a unos 45°, espalda neutra; barra hacia el ombligo.' }),
  E({ id: 'sentadilla_goblet', name: 'Sentadilla goblet', pattern: 'sentadilla', muscles: ['cuadriceps', 'gluteos'], equip: ['mancuernas'], diff: 1, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Mancuerna pegada al pecho; codos entre las rodillas al bajar.' }),
  E({ id: 'sentadilla_barra', name: 'Sentadilla con barra', pattern: 'sentadilla', muscles: ['cuadriceps', 'gluteos'], equip: ['barra', 'discos'], diff: 2, goals: ['definicion'], range: [6, 10], rest: 120, prog: 'carga', note: 'Barra sobre el trapecio, pecho arriba, rodillas siguen la línea de los pies.' }),
  E({ id: 'peso_muerto_rumano', name: 'Peso muerto rumano con mancuernas', pattern: 'bisagra', muscles: ['isquiotibiales', 'gluteos'], equip: ['mancuernas'], diff: 2, goals: ['definicion'], range: [8, 12], prog: 'carga', note: 'Bisagra desde la cadera con rodillas semiflexionadas; espalda plana.' }),
  E({ id: 'rdl_barra', name: 'Peso muerto rumano con barra', pattern: 'bisagra', muscles: ['isquiotibiales', 'gluteos'], equip: ['barra', 'discos'], diff: 2, goals: ['definicion'], range: [6, 10], rest: 120, prog: 'carga', note: 'Barra pegada a las piernas; baja hasta sentir el estiramiento de isquiotibiales.' }),
  E({ id: 'hip_thrust_mancuerna', name: 'Puente de glúteo con mancuerna', pattern: 'bisagra', muscles: ['gluteos'], equip: ['mancuernas', 'banco'], diff: 1, goals: ['definicion'], range: [10, 15], prog: 'carga', note: 'Espalda alta apoyada en el banco; mancuerna sobre la cadera.' }),

  /* Cardio */
  E({ id: 'caminata_rapida', name: 'Caminata rápida', pattern: 'cardio', muscles: ['cardio'], diff: 1, goals: ['resistencia', 'definicion'], type: 'cardio', minutes: 30, note: 'Ritmo que permita hablar en frases cortas.' }),
  E({ id: 'bici_estatica', name: 'Bicicleta estática', pattern: 'cardio', muscles: ['cardio'], equip: ['bicicleta'], diff: 1, goals: ['resistencia', 'definicion'], type: 'cardio', minutes: 30, note: 'Asiento a la altura de la cadera; cadencia constante.' }),
  E({ id: 'jumping_jacks', name: 'Saltos de tijera', pattern: 'cardio', muscles: ['cardio'], diff: 1, goals: ['resistencia'], type: 'cardio', minutes: 10, note: 'Aterriza suave sobre la punta de los pies.' }),
  E({ id: 'high_knees', name: 'Rodillas arriba', pattern: 'cardio', muscles: ['cardio'], diff: 1, goals: ['resistencia', 'definicion'], type: 'cardio', minutes: 10, note: 'Eleva las rodillas a la altura de la cadera alternando, con brazos activos.' }),

  /* Flexibilidad (progresión pasivo→activo y rango corto→completo por etapas) */
  E({ id: 'flex_isquios', name: 'Movilidad de isquiotibiales', pattern: 'flexibilidad', muscles: ['isquiotibiales', 'movilidad'], diff: 1, goals: ['flexibilidad'], type: 'flex', sets: 1, positions: [
    { name: 'Sentado, alcanzar punta de pies', sec: 30 }, { name: 'De pie, bisagra con espalda plana', sec: 30 }, { name: 'Zancada con talón apoyado', sec: 30 } ], note: 'Sin rebotes. Respira lento y busca tensión suave, no dolor.' }),
  E({ id: 'flex_cadera', name: 'Movilidad de flexores de cadera', pattern: 'flexibilidad', muscles: ['cuadriceps', 'movilidad'], diff: 1, goals: ['flexibilidad'], type: 'flex', sets: 1, positions: [
    { name: 'Zancada baja, rodilla al suelo', sec: 30 }, { name: 'Mariposa', sec: 30 }, { name: 'Paloma', sec: 30 } ], note: 'Pelvis neutra; empuja la cadera hacia delante.' }),
  E({ id: 'flex_pecho_hombro', name: 'Movilidad de pecho y hombro', pattern: 'flexibilidad', muscles: ['pecho', 'hombros', 'movilidad'], diff: 1, goals: ['flexibilidad'], type: 'flex', sets: 1, positions: [
    { name: 'Brazo en marco de puerta', sec: 30 }, { name: 'Dorsal en pared', sec: 30 }, { name: 'Ángel en pared', sec: 30 } ], note: 'Mantén las costillas abajo; no arquees la lumbar.' }),
  E({ id: 'flex_columna', name: 'Movilidad de columna', pattern: 'flexibilidad', muscles: ['espalda', 'movilidad'], diff: 1, goals: ['flexibilidad'], type: 'flex', sets: 1, positions: [
    { name: 'Gato-vaca', sec: 45 }, { name: 'Postura del niño', sec: 45 }, { name: 'Torsión sentada', sec: 30 } ], note: 'Movimiento lento, de vértebra en vértebra.' }),
  E({ id: 'flex_pantorrilla', name: 'Movilidad de pantorrillas', pattern: 'flexibilidad', muscles: ['pantorrillas', 'movilidad'], diff: 1, goals: ['flexibilidad'], type: 'flex', sets: 1, positions: [
    { name: 'Pared, rodilla estirada', sec: 30 }, { name: 'Escalón con talón abajo', sec: 30 } ], note: 'Talón firme en el suelo durante todo el estiramiento.' })
];

/* Silueta con zonas resaltadas (dibujo propio, no copia de las imágenes de referencia). */
TW.bodySVG = function (muscles, size) {
  const all = muscles.includes('cuerpo_completo');
  const on = (...g) => (all || g.some(x => muscles.includes(x))) ? '#FF7A1A' : '#34343B';
  const outline = '<path d="M50 30 Q60 26 64 36 L78 42 L82 66 L76 68 L74 112 L66 114 L62 192 L55 192 L50 124 L45 192 L38 192 L34 114 L26 112 L24 68 L18 66 L22 42 L36 36 Q40 26 50 30Z" fill="#202027" stroke="#4A4A55" stroke-width="1"/><circle cx="50" cy="18" r="12" fill="#202027" stroke="#4A4A55"/>';
  const front = `<g fill="${on('pecho')}"><ellipse cx="41" cy="54" rx="8" ry="6"/><ellipse cx="59" cy="54" rx="8" ry="6"/></g>
    <g fill="${on('hombros')}"><circle cx="22" cy="46" r="6"/><circle cx="78" cy="46" r="6"/></g>
    <g fill="${on('biceps', 'triceps')}"><rect x="18" y="58" width="7" height="36" rx="3.5"/><rect x="75" y="58" width="7" height="36" rx="3.5"/></g>
    <g fill="${on('abdomen')}"><rect x="43" y="68" width="14" height="32" rx="4"/></g>
    <g fill="${on('cuadriceps')}"><rect x="36" y="118" width="12" height="46" rx="6"/><rect x="52" y="118" width="12" height="46" rx="6"/></g>`;
  const back = `<g fill="${on('espalda')}"><rect x="38" y="44" width="24" height="46" rx="8"/></g>
    <g fill="${on('hombros')}"><circle cx="22" cy="46" r="6"/><circle cx="78" cy="46" r="6"/></g>
    <g fill="${on('biceps', 'triceps')}"><rect x="18" y="58" width="7" height="36" rx="3.5"/><rect x="75" y="58" width="7" height="36" rx="3.5"/></g>
    <g fill="${on('gluteos')}"><ellipse cx="50" cy="106" rx="13" ry="8"/></g>
    <g fill="${on('isquiotibiales')}"><rect x="37" y="120" width="11" height="44" rx="5"/><rect x="52" y="120" width="11" height="44" rx="5"/></g>`;
  const calves = `<g fill="${on('pantorrillas')}"><rect x="38" y="168" width="9" height="22" rx="4"/><rect x="53" y="168" width="9" height="22" rx="4"/></g>`;
  const label = muscles.length ? muscles.map(m => TW.MUSCLES[m]).join(', ') : 'Sin grupo';
  return `<svg class="body ${size || 'mini'}" viewBox="0 0 220 200" role="img" aria-label="Grupos musculares: ${label}">
    <g>${outline}${front}${calves}</g>
    <g transform="translate(110,0)">${outline}${back}${calves}</g></svg>`;
};
