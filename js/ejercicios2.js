/* Catálogo ampliado: ejercicios por grupo muscular, modalidad (peso corporal / equipo / banda),
   carga sugerida por nivel y animación asociada. Las cargas son puntos de partida: se ajustan a tu equipo real. */
(function () {
  var TW = window.TW, E = TW.makeEx;
  TW.MOTION_OF = TW.MOTION_OF || {};
  TW.LV = TW.LV || {};

  /* X(id, inglés, español, cómo, patrón, músculos, equipo, nivel, opciones, [movimiento, variante], cargas por nivel) */
  function X(id, en, es, how, pat, mus, eq, diff, o, mo, lv) {
    o = o || {};
    TW.CATALOG.push(E(Object.assign({ id: id, name: es, pattern: pat, muscles: mus, equip: eq, diff: diff, goals: ['definicion'], note: how }, o)));
    TW.EX_EN[id] = [en, how];
    if (mo) TW.MOTION_OF[id] = mo;
    if (lv) TW.LV[id] = lv;
  }
  var C = { prog: 'carga' };

  /* ---------- Pecho ---------- */
  X('flexiones_rodillas', 'Knee push-up', 'Flexiones sobre rodillas', 'Rodillas apoyadas, cuerpo recto de rodillas a cabeza; baja el pecho y empuja sin hundir la cadera.', 'empuje', ['pecho', 'triceps', 'hombros'], [], 1, { range: [8, 15], goals: ['calistenia', 'definicion'] }, ['pushup', 'knees']);
  X('flexiones_diamante', 'Diamond push-up', 'Flexiones diamante', 'Manos juntas bajo el pecho formando un rombo; codos cerca del cuerpo. Enfoca el tríceps.', 'empuje', ['triceps', 'pecho'], [], 2, { range: [6, 12], goals: ['calistenia'] }, ['pushup']);
  X('press_suelo', 'Dumbbell floor press', 'Press de pecho en el suelo', 'Tumbado con rodillas dobladas; empuja las mancuernas hasta estirar los brazos y baja hasta que el codo toque el suelo.', 'empuje', ['pecho', 'triceps'], ['mancuernas'], 1, Object.assign({ range: [8, 12], goals: ['definicion'] }, C), ['floor_press'], [8, 14, 22]);
  X('aperturas_suelo', 'Floor fly', 'Aperturas en el suelo', 'Codos ligeramente flexionados; abre en arco hasta que los codos toquen el suelo y cierra apretando el pecho.', 'aislamiento', ['pecho'], ['mancuernas'], 1, Object.assign({ range: [10, 15], rest: 60 }, C), ['fly'], [4, 7, 11]);

  /* ---------- Hombros ---------- */
  X('press_arnold', 'Arnold press', 'Press Arnold', 'Parte con las palmas hacia ti frente al pecho; gira las palmas hacia delante mientras empujas por encima de la cabeza.', 'empuje', ['hombros', 'triceps'], ['mancuernas'], 2, Object.assign({ range: [8, 12] }, C), ['ohp'], [5, 9, 14]);
  X('elevacion_frontal', 'Front raise', 'Elevación frontal', 'Sube las pesas al frente con brazos casi rectos hasta la altura de los hombros; baja en 2–3 s sin balancear.', 'aislamiento', ['hombros'], ['mancuernas'], 1, Object.assign({ range: [10, 15], rest: 60 }, C), ['front_raise'], [3, 5, 8]);
  X('elevacion_lateral_banda', 'Band lateral raise', 'Elevación lateral con banda', 'Pisa la banda turquesa, sujeta los extremos y eleva los brazos a los lados hasta los hombros.', 'aislamiento', ['hombros'], ['banda_turquesa'], 1, { range: [12, 20], rest: 45 }, ['lateral_raise']);
  X('pull_apart_banda', 'Band pull-apart', 'Separación de banda', 'Banda tensa frente al pecho; separa las manos llevando los brazos a los lados y junta las escápulas.', 'tiron', ['hombros', 'espalda'], ['banda_turquesa'], 1, { range: [12, 20], rest: 45 }, ['pull_apart']);
  X('encogimientos', 'Dumbbell shrug', 'Encogimientos de hombros', 'Pesas a los lados; sube los hombros hacia las orejas sin doblar los codos, pausa y baja lento.', 'aislamiento', ['espalda', 'hombros'], ['mancuernas'], 1, Object.assign({ range: [10, 15], rest: 60 }, C), ['shrug'], [10, 16, 24]);

  /* ---------- Espalda ---------- */
  X('remo_mancuernas_2', 'Bent-over dumbbell row', 'Remo inclinado con mancuernas', 'Tronco inclinado con espalda plana; lleva los codos atrás juntando escápulas y baja controlado.', 'tiron', ['espalda', 'biceps'], ['mancuernas'], 2, Object.assign({ range: [8, 12] }, C), ['row_bent'], [8, 13, 20]);
  X('remo_banda_sentado', 'Seated band row', 'Remo sentado con banda', 'Sentado con la banda en los pies; jala los codos atrás pegados al cuerpo y vuelve despacio.', 'tiron', ['espalda', 'biceps'], ['banda_rosa'], 1, { range: [10, 15] }, ['row_seated']);
  X('remo_kb', 'Kettlebell row', 'Remo con kettlebell', 'Tronco inclinado, espalda plana; lleva la kettlebell hacia la cadera con el codo pegado.', 'tiron', ['espalda', 'biceps'], ['kettlebell'], 1, Object.assign({ range: [8, 12] }, C), ['row_bent'], [8, 12, 16]);
  X('superman', 'Superman', 'Superman (extensión lumbar)', 'Boca abajo; eleva brazos, pecho y piernas unos centímetros y sostén 1–2 s. Cuello neutro.', 'aislamiento', ['espalda', 'gluteos'], [], 1, { range: [10, 15], rest: 45 }, ['superman']);

  /* ---------- Bíceps ---------- */
  X('curl_martillo', 'Hammer curl', 'Curl martillo', 'Palmas enfrentadas (agarre neutro); sube sin mover el codo. Trabaja también el antebrazo.', 'aislamiento', ['biceps'], ['mancuernas'], 1, Object.assign({ range: [10, 15], rest: 60 }, C), ['curl'], [5, 8, 12]);
  X('curl_barra', 'Barbell curl', 'Curl con barra', 'Agarre al ancho de hombros, codos fijos; sube la barra sin balancear el tronco.', 'aislamiento', ['biceps'], ['barra', 'discos'], 2, Object.assign({ range: [8, 12], rest: 60 }, C), ['curl'], [10, 20, 30]);
  X('curl_banda', 'Band curl', 'Curl con banda', 'Pisa la banda rosa, sujeta los extremos y sube flexionando el codo; baja lento.', 'aislamiento', ['biceps'], ['banda_rosa'], 1, { range: [12, 20], rest: 45 }, ['curl']);
  X('curl_concentrado', 'Concentration curl', 'Curl concentrado', 'Sentado, codo apoyado en la parte interna del muslo; sube y baja lento aislando el bíceps.', 'aislamiento', ['biceps'], ['mancuernas'], 1, Object.assign({ range: [10, 15], rest: 60 }, C), ['curl'], [4, 7, 10]);

  /* ---------- Tríceps ---------- */
  X('patada_triceps', 'Triceps kickback', 'Patada de tríceps', 'Tronco inclinado, brazo pegado al cuerpo; estira el codo hacia atrás y regresa lento.', 'aislamiento', ['triceps'], ['mancuernas'], 1, Object.assign({ range: [10, 15], rest: 60 }, C), ['kickback'], [3, 5, 8]);
  X('extension_tumbado', 'Lying triceps extension', 'Extensión de tríceps tumbado', 'Brazos verticales; baja las pesas hacia la frente flexionando solo los codos y estira.', 'aislamiento', ['triceps'], ['mancuernas'], 2, Object.assign({ range: [8, 12], rest: 60 }, C), ['skull'], [4, 7, 10]);
  X('extension_triceps_banda', 'Band overhead triceps extension', 'Extensión de tríceps con banda', 'Banda pisada o sujeta; lleva el antebrazo detrás de la cabeza y estira el codo hacia arriba.', 'aislamiento', ['triceps'], ['banda_rosa'], 1, { range: [12, 20], rest: 45 }, ['overhead_ext']);

  /* ---------- Piernas: cuádriceps / glúteos / isquiotibiales / pantorrillas ---------- */
  X('sentadilla_sumo', 'Sumo squat', 'Sentadilla sumo', 'Pies muy abiertos, puntas hacia fuera, pesa entre las piernas; baja con espalda erguida. Trabaja más aductores y glúteo.', 'sentadilla', ['cuadriceps', 'gluteos'], ['mancuernas'], 1, Object.assign({ range: [10, 15] }, C), ['squat', 'chest'], [10, 16, 24]);
  X('sentadilla_banda', 'Banded squat', 'Sentadilla con banda', 'Banda sobre los muslos (arriba de las rodillas): empuja las rodillas hacia fuera al bajar y subir.', 'sentadilla', ['cuadriceps', 'gluteos'], ['banda_rosa'], 1, { range: [12, 20] }, ['squat']);
  X('sentadilla_frontal', 'Front squat', 'Sentadilla frontal con barra', 'Barra apoyada en la parte delantera de los hombros, codos altos; baja con tronco muy erguido.', 'sentadilla', ['cuadriceps', 'gluteos'], ['barra', 'discos'], 3, Object.assign({ range: [6, 10], rest: 120 }, C), ['squat', 'chest'], [20, 40, 60]);
  X('sentadilla_pared', 'Wall sit', 'Sentadilla isométrica en pared', 'Espalda en la pared, rodillas a ~90° sobre los tobillos; aguanta el tiempo indicado respirando normal.', 'sentadilla', ['cuadriceps'], [], 1, { prog: 'tiempo', unit: 'seg', range: [20, 45], rest: 60 }, ['wall_sit']);
  X('zancada_atras', 'Reverse lunge', 'Zancada hacia atrás', 'Da un paso atrás y baja la rodilla trasera cerca del suelo; empuja con el pie de adelante. Más amable con las rodillas.', 'zancada', ['cuadriceps', 'gluteos'], [], 1, { range: [8, 12], goals: ['definicion', 'calistenia'] }, ['split_squat']);
  X('zancada_atras_mancuernas', 'Dumbbell reverse lunge', 'Zancada atrás con mancuernas', 'Igual que la zancada atrás, con una mancuerna en cada mano a los lados.', 'zancada', ['cuadriceps', 'gluteos'], ['mancuernas'], 2, Object.assign({ range: [8, 12] }, C), ['split_squat'], [5, 8, 12]);
  X('step_up', 'Step-up', 'Subida al escalón', 'Sube a un escalón o cajón estable empujando con la pierna de arriba; baja controlado. Alta activación de glúteo.', 'zancada', ['gluteos', 'cuadriceps'], [], 1, { range: [8, 12], goals: ['definicion', 'calistenia'] }, ['step_up']);
  X('step_up_mancuernas', 'Dumbbell step-up', 'Subida al escalón con mancuernas', 'Igual que la subida al escalón, con mancuerna en cada mano.', 'zancada', ['gluteos', 'cuadriceps'], ['mancuernas'], 2, Object.assign({ range: [8, 12] }, C), ['step_up'], [5, 8, 12]);
  X('peso_muerto_kb', 'Kettlebell deadlift', 'Peso muerto con kettlebell', 'Kettlebell entre los pies, cadera atrás, espalda neutra; empuja el suelo y extiende cadera y rodillas.', 'bisagra', ['gluteos', 'isquiotibiales'], ['kettlebell'], 1, Object.assign({ range: [10, 15] }, C), ['deadlift'], [8, 12, 16]);
  X('peso_muerto_barra', 'Barbell deadlift', 'Peso muerto con barra', 'Barra cerca de las espinillas, espalda neutra; empuja el suelo y termina erguido apretando glúteos.', 'bisagra', ['gluteos', 'isquiotibiales', 'espalda'], ['barra', 'discos'], 3, Object.assign({ range: [5, 8], rest: 150 }, C), ['deadlift'], [30, 50, 80]);
  X('peso_muerto_1pierna', 'Single-leg RDL', 'Peso muerto a una pierna', 'Lleva una pierna atrás mientras inclinas el tronco con espalda plana; apóyate en una mano al principio. Gran activación de glúteo e isquios.', 'bisagra', ['isquiotibiales', 'gluteos'], ['mancuernas'], 2, Object.assign({ range: [8, 12] }, C), ['hinge', 'single'], [4, 8, 12]);
  X('puente_una_pierna', 'Single-leg glute bridge', 'Puente de glúteo a una pierna', 'Una pierna estirada al aire; empuja con el talón de apoyo y sube la cadera sin rotarla.', 'bisagra', ['gluteos', 'isquiotibiales'], [], 2, { range: [8, 15] }, ['bridge', 'single']);
  X('puente_mancuerna_suelo', 'Dumbbell glute bridge', 'Puente de glúteo con mancuerna', 'Mancuerna sobre la cadera; sube apretando glúteos y mantén 1 s arriba.', 'bisagra', ['gluteos', 'isquiotibiales'], ['mancuernas'], 1, Object.assign({ range: [10, 15] }, C), ['bridge'], [10, 16, 24]);
  X('patada_gluteo', 'Glute kickback', 'Patada de glúteo en cuatro apoyos', 'En cuatro apoyos, estira una pierna atrás y arriba apretando el glúteo, sin arquear la espalda.', 'aislamiento', ['gluteos'], [], 1, { range: [12, 20], rest: 45 }, ['quad_kick']);
  X('curl_femoral_toalla', 'Towel hamstring curl', 'Curl femoral con toalla', 'Cadera arriba, talones sobre una toalla en suelo liso; desliza los talones lejos y tráelos de vuelta.', 'aislamiento', ['isquiotibiales', 'gluteos'], [], 2, { range: [8, 12], rest: 60 }, ['ham_slide']);
  X('hip_thrust_barra', 'Barbell hip thrust', 'Hip thrust con barra', 'Espalda alta en el banco, barra sobre la cadera (con almohadilla); empuja hasta alinear hombros, cadera y rodillas.', 'bisagra', ['gluteos'], ['barra', 'discos', 'banco'], 2, Object.assign({ range: [8, 12] }, C), ['bridge', 'bench'], [20, 40, 60]);
  X('pantorrillas_mancuernas', 'Dumbbell calf raise', 'Elevación de pantorrillas con mancuernas', 'Pesas a los lados; sube sobre las puntas, pausa 1 s y baja lento.', 'aislamiento', ['pantorrillas'], ['mancuernas'], 1, Object.assign({ range: [12, 20], rest: 45 }, C), ['calf_raise'], [8, 14, 20]);
  X('pantorrilla_1pierna', 'Single-leg calf raise', 'Pantorrilla a una pierna', 'Apoyo ligero con una mano; sube sobre la punta de un pie y baja lento. Cambia de pierna.', 'aislamiento', ['pantorrillas'], [], 2, { range: [10, 15], rest: 45 }, ['calf_raise']);

  /* ---------- Core ---------- */
  X('plancha_lateral', 'Side plank', 'Plancha lateral', 'Codo bajo el hombro, cuerpo en línea recta de cabeza a pies; aguanta sin dejar caer la cadera.', 'core', ['abdomen'], [], 1, { prog: 'tiempo', unit: 'seg', range: [20, 40], rest: 45 }, ['side_plank']);
  X('bicycle_crunch', 'Bicycle crunch', 'Crunch bicicleta', 'Manos suaves tras la cabeza; lleva codo y rodilla opuestos a encontrarse alternando, con la lumbar apoyada.', 'core', ['abdomen'], [], 1, { range: [12, 24], rest: 45 }, ['bicycle']);
  X('dead_bug', 'Dead bug', 'Bicho muerto', 'Lumbar pegada al suelo; baja un brazo y la pierna contraria sin arquear la espalda.', 'core', ['abdomen'], [], 1, { range: [8, 12], rest: 45 }, ['dead_bug']);
  X('bird_dog', 'Bird dog', 'Perro de caza', 'En cuatro apoyos, estira brazo y pierna contrarios manteniendo la cadera quieta; pausa 2 s.', 'core', ['abdomen', 'espalda'], [], 1, { range: [8, 12], rest: 45 }, ['bird_dog']);
  X('elevacion_piernas_suelo', 'Lying leg raise', 'Elevación de piernas tumbado', 'Boca arriba, manos bajo la cadera; sube las piernas casi rectas y baja lento sin arquear la lumbar.', 'core', ['abdomen'], [], 1, { range: [8, 15], rest: 45 }, ['leg_raise']);

  /* ---------- Cardio de bajo impacto ---------- */
  X('marcha_sitio', 'Marching in place', 'Marcha en el sitio', 'Eleva las rodillas alternando y balancea los brazos; sin saltos. Ideal para entrar en calor o sumar minutos suaves.', 'cardio', ['cardio'], [], 1, { type: 'cardio', minutes: 10, goals: ['resistencia', 'definicion'] }, ['march']);
  X('boxeo_sombra', 'Shadow boxing', 'Boxeo de sombra', 'Postura ligera, puños en guardia; lanza golpes rectos alternando sin saltar. Cardio de bajo impacto.', 'cardio', ['cardio', 'hombros'], [], 1, { type: 'cardio', minutes: 10, goals: ['resistencia', 'definicion'] }, ['boxing']);

  /* ---------- Animaciones de los ejercicios que ya existían ---------- */
  var MAP = {
    flexiones: ['pushup'], flexiones_pies_elevados: ['pushup'], dominadas: ['pullup'], dominadas_supinas: ['pullup'],
    remo_banda: ['row_seated'], remo_banda_turquesa: ['row_seated'], puente_banda_rosa: ['bridge'], sentadilla_bulgara: ['split_squat', 'bul'],
    sentadilla: ['squat'], zancadas: ['split_squat'], puente_gluteo: ['bridge'], plancha: ['plank'], crunch: ['crunch'], mountain_climbers: ['mountain'],
    elevacion_pantorrillas: ['calf_raise'], kb_swing: ['kb_swing'], kb_goblet: ['squat', 'chest'], kb_press: ['ohp'], press_banca: ['floor_press'],
    press_mancuernas: ['floor_press'], press_hombro: ['ohp'], elevaciones_laterales: ['lateral_raise'], curl_biceps: ['curl'], extension_triceps: ['overhead_ext'],
    remo_mancuerna: ['row_bent'], remo_barra: ['row_bent'], sentadilla_goblet: ['squat', 'chest'], sentadilla_barra: ['squat', 'chest'],
    peso_muerto_rumano: ['hinge'], rdl_barra: ['hinge'], hip_thrust_mancuerna: ['bridge', 'bench'],
    flex_isquios: ['hinge', 'fold'], flex_cadera: ['split_squat'], flex_pecho_hombro: ['pull_apart'], flex_columna: ['catcow'], flex_pantorrilla: ['calfstretch']
  };
  Object.keys(MAP).forEach(function (k) { TW.MOTION_OF[k] = MAP[k]; });

  /* Cargas por nivel (kg por mancuerna; en barra, total; en kettlebell, una pieza) para ejercicios que ya existían. */
  var LV0 = {
    press_banca: [30, 50, 80], press_mancuernas: [8, 14, 22], press_hombro: [6, 10, 16], elevaciones_laterales: [3, 5, 8], curl_biceps: [5, 8, 12],
    extension_triceps: [6, 10, 14], remo_mancuerna: [8, 14, 22], remo_barra: [20, 40, 60], sentadilla_goblet: [8, 14, 20], sentadilla_barra: [20, 40, 70],
    peso_muerto_rumano: [8, 14, 22], rdl_barra: [20, 40, 70], hip_thrust_mancuerna: [10, 16, 25], kb_swing: [8, 12, 16], kb_goblet: [8, 12, 16], kb_press: [8, 12, 16]
  };
  Object.keys(LV0).forEach(function (k) { TW.LV[k] = LV0[k]; });
  TW.CATALOG.forEach(function (e) { if (TW.LV[e.id]) e.lv = TW.LV[e.id]; if (TW.MOTION_OF[e.id]) e.motion = TW.MOTION_OF[e.id]; });

  /* Modalidad: peso corporal, banda o equipo (el banco y la barra de dominadas son solo apoyos). */
  var SUPPORT = ['banco', 'barra_dominadas'];
  TW.exMode = function (e) {
    var eq = (e.equip || []).filter(function (q) { return SUPPORT.indexOf(q) < 0; });
    if (e.type === 'flex') return { k: 'mov', t: 'Movilidad' };
    if (!eq.length) return { k: 'pc', t: 'Peso corporal' };
    if (eq.every(function (q) { return q.indexOf('banda') === 0; })) return { k: 'bd', t: 'Banda elástica' };
    if (eq.indexOf('gimnasio') >= 0) return { k: 'gy', t: 'Máquina / gimnasio' };
    return { k: 'eq', t: 'Con equipo' };
  };
  /* Carga sugerida por nivel, ajustada a las cargas que tú tienes (siempre redondeada hacia abajo). */
  TW.loadByLevel = function (S, e) {
    if (!e.lv) return null;
    var loads = TW.loadsFor(S, e), kb = (e.equip || []).indexOf('kettlebell') >= 0, bar = (e.equip || []).indexOf('barra') >= 0;
    var unit = bar ? 'kg en total' : kb ? 'kg' : 'kg por mancuerna';
    return { unit: unit, vals: e.lv.map(function (v) { var f = loads.length ? TW.floorLoad(loads, v) : v; return { want: v, got: f == null ? v : f }; }), have: loads.length > 0 };
  };

  /* Fuentes técnicas y de respaldo científico usadas para elegir y describir los ejercicios. */
  TW.SOURCES = {
    gluteos: [['Gluteus Maximus Activation during Common Strength and Hypertrophy Exercises (revisión sistemática, JSSM 2020)', 'https://www.jssm.org/jssm-19-195.xml-Fulltext'], ['McCurdy et al. 2018, activación de glúteo e isquios (J Strength Cond Res)', 'https://pubmed.ncbi.nlm.nih.gov/29076958/']],
    pecho: [['ACE-sponsored research: los 3 ejercicios de pecho más efectivos (EMG, 2012)', 'https://www.acefitness.org/certifiednewsarticle/2884/ace-sponsored-research-top-3-most-effective-chest-exercises/']],
    general: [['ACE Exercise Library: técnica por grupo muscular', 'https://www.acefitness.org/resources/everyone/exercise-library/'], ['ACSM Position Stand: modelos de progresión en entrenamiento de fuerza (2009)', 'https://pubmed.ncbi.nlm.nih.gov/19204579/'], ['NSCA: cómo elegir la resistencia (rango de repeticiones objetivo)', 'https://www.nsca.com/education/articles/kinetic-select/intensity-or-resistance/']]
  };
  TW.sourcesFor = function (e) {
    var m = e.muscles || [], out = [];
    if (m.indexOf('gluteos') >= 0 || m.indexOf('isquiotibiales') >= 0) out = out.concat(TW.SOURCES.gluteos);
    if (m.indexOf('pecho') >= 0) out = out.concat(TW.SOURCES.pecho);
    return out.concat(TW.SOURCES.general);
  };
})();
