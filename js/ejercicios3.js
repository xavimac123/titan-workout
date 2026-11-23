/* Ejercicios para hipertrofia (calistenia y pesas) y flexibilidad. Se carga después de ejercicios2.js.
   Criterios: ejercicios multiarticulares y de aislamiento con fase excéntrica controlada, rango completo y series
   cerca del fallo técnico (1–3 repeticiones en reserva); el volumen semanal por músculo se reparte en 2+ días. */
(function () {
  var TW = window.TW, E = TW.makeEx;
  TW.GOALS.hipertrofia = 'Hipertrofia (masa muscular)';
  if (TW.ALL_GOALS.indexOf('hipertrofia') < 0) TW.ALL_GOALS.push('hipertrofia');
  var H = ['hipertrofia', 'definicion'], HC = ['hipertrofia', 'calistenia', 'definicion'], C = { prog: 'carga' };
  function X(id, en, es, how, pat, mus, eq, diff, o, mo, lv) {
    TW.CATALOG.push(E(Object.assign({ id: id, name: es, pattern: pat, muscles: mus, equip: eq, diff: diff, goals: H, note: how }, o || {})));
    TW.EX_EN[id] = [en, how];
    if (mo) TW.MOTION_OF[id] = mo;
    if (lv) TW.LV[id] = lv;
  }

  /* ---------- Calistenia para hipertrofia (tempo lento = más tiempo bajo tensión) ---------- */
  X('flexiones_tempo', 'Tempo push-up (4 s down)', 'Flexiones con bajada lenta', 'Baja contando 4 segundos hasta casi tocar el suelo, pausa 1 s abajo y sube con fuerza. Cuerpo recto; si pierdes la línea, apoya las rodillas.', 'empuje', ['pecho', 'triceps', 'hombros'], [], 2, { goals: HC, range: [6, 12], rest: 90 }, ['pushup']);
  X('sentadilla_tempo', 'Tempo bodyweight squat', 'Sentadilla con tempo (4-1-1)', 'Baja en 4 s, pausa 1 s abajo y sube en 1 s. Talones apoyados, rodillas siguen la línea de los pies, espalda neutra.', 'sentadilla', ['cuadriceps', 'gluteos'], [], 1, { goals: HC, range: [10, 15], rest: 75 }, ['squat']);
  X('crunch_inverso', 'Reverse crunch', 'Crunch inverso', 'Tumbado, rodillas dobladas a 90°; enrolla la pelvis hacia el pecho elevando la cadera unos centímetros, sin balancear. Baja en 3 s.', 'core', ['abdomen'], [], 1, { goals: HC, range: [10, 15], rest: 45 });

  /* ---------- Pesas para hipertrofia ---------- */
  X('goblet_pausa', 'Paused goblet squat', 'Sentadilla goblet con pausa', 'Pesa pegada al pecho; baja en 3 s, pausa 2 s abajo con el torso erguido y sube sin rebotar.', 'sentadilla', ['cuadriceps', 'gluteos'], ['mancuernas'], 2, Object.assign({ range: [8, 12], rest: 90 }, C), ['squat', 'chest'], [8, 14, 20]);
  X('rdl_tempo', 'Tempo Romanian deadlift (3 s)', 'Peso muerto rumano con bajada lenta', 'Mancuernas cerca de las piernas; lleva la cadera atrás y baja en 3 s hasta sentir el estiramiento en isquiotibiales, espalda plana; sube empujando la cadera adelante.', 'bisagra', ['isquiotibiales', 'gluteos', 'espalda'], ['mancuernas'], 2, Object.assign({ range: [8, 12], rest: 90 }, C), ['hinge'], [8, 14, 22]);
  X('curl_excentrico', 'Eccentric dumbbell curl (4 s)', 'Curl con bajada lenta', 'Sube en 1–2 s y baja en 4 s hasta extender casi por completo el codo; codos fijos junto al cuerpo.', 'aislamiento', ['biceps'], ['mancuernas'], 1, Object.assign({ range: [8, 12], rest: 60 }, C), ['curl'], [5, 8, 12]);
  X('pullover_mancuerna', 'Floor dumbbell pullover', 'Pullover con mancuerna en el suelo', 'Tumbado, mancuerna con ambas manos sobre el pecho; baja los brazos casi rectos por detrás de la cabeza hasta el suelo sin arquear la espalda y regresa.', 'aislamiento', ['espalda', 'pecho'], ['mancuernas'], 2, Object.assign({ range: [10, 15], rest: 60 }, C), null, [8, 14, 22]);
  X('pajaros_mancuernas', 'Bent-over rear delt fly', 'Pájaros (deltoides posterior)', 'Tronco inclinado con espalda plana; abre los brazos a los lados con codos ligeramente flexionados hasta la altura del tronco. Pesa ligera y control.', 'aislamiento', ['hombros', 'espalda'], ['mancuernas'], 1, Object.assign({ range: [12, 20], rest: 45 }, C), null, [3, 5, 8]);
  X('aperturas_banda', 'Standing band fly', 'Aperturas con banda', 'Banda rosa pasada por la espalda; de pie, cierra los brazos al frente en arco apretando el pecho y vuelve despacio.', 'aislamiento', ['pecho'], ['banda_rosa'], 1, { range: [12, 20], rest: 45 }, ['fly']);
  X('press_pecho_banda', 'Band chest press', 'Press de pecho con banda', 'Banda rosa por la espalda y bajo las axilas; empuja las manos al frente hasta estirar los codos y regresa en 3 s.', 'empuje', ['pecho', 'triceps'], ['banda_rosa'], 1, { range: [10, 15], rest: 60 });
  X('face_pull_banda', 'Band face pull', 'Face pull con banda', 'Banda turquesa anclada firme a la altura del rostro; jala hacia la cara abriendo los codos y rota los antebrazos hacia arriba. Trabaja deltoides posterior y escápulas.', 'tiron', ['hombros', 'espalda'], ['banda_turquesa'], 1, { range: [12, 20], rest: 45 });
  X('zancada_caminando', 'Walking dumbbell lunge', 'Zancadas caminando con mancuernas', 'Paso largo al frente, baja la rodilla trasera cerca del suelo con el tronco erguido y avanza alternando. Necesita espacio.', 'zancada', ['cuadriceps', 'gluteos'], ['mancuernas'], 2, Object.assign({ range: [8, 12], rest: 90 }, C), null, [6, 10, 16]);

  /* ---------- Flexibilidad y movilidad (en posiciones con tiempo; tensión intensa pero tolerable, sin dolor) ---------- */
  function F(id, es, mus, positions, note, mo) {
    TW.CATALOG.push(E({ id: id, name: es, pattern: 'flexibilidad', muscles: mus.concat(['movilidad']), diff: 1, goals: ['flexibilidad'], type: 'flex', sets: 1, positions: positions, note: note }));
    TW.EX_EN[id] = [es, note];
    if (mo) TW.MOTION_OF[id] = mo;
  }
  F('flex_gluteos', 'Movilidad de glúteos y cadera', ['gluteos'], [{ name: 'Figura 4 tumbado', sec: 40 }, { name: 'Paloma o 90/90 sentado', sec: 40 }], 'Espalda apoyada, cadera quieta. Siente el estiramiento en el glúteo, no en la rodilla.');
  F('flex_aductores', 'Movilidad de aductores', ['cuadriceps'], [{ name: 'Mariposa sentado', sec: 40 }, { name: 'Sapo a cuatro apoyos', sec: 30 }], 'Pelvis neutra; abre las rodillas hasta tensión moderada y respira lento.');
  F('flex_cuadriceps', 'Movilidad de cuádriceps', ['cuadriceps'], [{ name: 'De pie, talón al glúteo (cada pierna)', sec: 30 }, { name: 'Rodilla al suelo, pie en la pared', sec: 30 }], 'Rodillas juntas, pelvis hacia delante, sin arquear la lumbar.');
  F('flex_dorsal', 'Movilidad de dorsales', ['espalda'], [{ name: 'Postura del niño con brazos largos', sec: 40 }, { name: 'Colgado de puerta o barra, suave', sec: 20 }, { name: 'Inclinación lateral con brazo arriba', sec: 30 }], 'Costillas hacia dentro; alarga el costado sin encoger el hombro.');
  F('flex_brazos', 'Movilidad de tríceps y hombro', ['triceps', 'hombros'], [{ name: 'Tríceps sobre la cabeza', sec: 30 }, { name: 'Brazo cruzado al pecho', sec: 30 }], 'Cuello relajado; empuja suavemente con la otra mano, sin rebotes.');
  F('flex_tobillo', 'Movilidad de tobillo (sentadilla profunda)', ['pantorrillas', 'cuadriceps'], [{ name: 'Rodilla a la pared, talón en el suelo', sec: 30 }, { name: 'Sentadilla profunda asistida', sec: 40 }], 'Talones siempre apoyados. Mejora la profundidad de sentadilla.');
  F('flex_toracica', 'Rotación torácica', ['espalda'], [{ name: 'Libro abierto tumbado de lado', sec: 40 }, { name: 'Hilo de la aguja a cuatro apoyos', sec: 40 }], 'Gira desde la espalda media, cadera quieta; sigue la mano con la mirada.');
  F('flex_cuello', 'Movilidad de cuello y trapecio', ['hombros'], [{ name: 'Oreja al hombro (cada lado)', sec: 25 }, { name: 'Mentón al pecho', sec: 25 }], 'Muy suave; sin tirar de la cabeza con fuerza. Detente ante hormigueo o dolor.');

  /* Fuentes técnicas adicionales por tipo de ejercicio */
  TW.SOURCES.hipertrofia = [
    ['Schoenfeld et al.: relación dosis-respuesta entre volumen semanal y masa muscular (meta-análisis)', 'https://researchgate.net/profile/Brad-Schoenfeld/publication/305455324_Dose-response_relationship_between_weekly_resistance_training_volume_and_increases_in_muscle_mass_A_systematic_review_and_meta-analysis'],
    ['Schoenfeld (NSCA): Training for Muscle Hypertrophy, resumen de consenso de expertos', 'https://www.nsca.com/globalassets/events/pdf/nat22/schoenfeld-brad.pdf'],
    ['Kassiano et al. 2022: ¿variar ejercicios mejora la hipertrofia? (revisión sistemática)', 'https://pubmed.ncbi.nlm.nih.gov/35438660/'],
    ['Biolayne Reps: ¿basta el peso corporal para ganar masa? (resumen de un estudio)', 'https://biolayne.com/reps/issue-15/is-body-weight-training-enough-to-maximize-gains/']
  ];
  TW.SOURCES.flex = [
    ['Bryant et al. 2023: intensidad del estiramiento estático y rango de movimiento (revisión)', 'https://pubmed.ncbi.nlm.nih.gov/37092369/'],
    ['Afonso et al. 2021: entrenamiento de fuerza vs estiramiento para el rango de movimiento (meta-análisis)', 'https://estudogeral.sib.uc.pt/bitstream/10316/104612/1/Strength-training-versus-stretching-for-improving-range-of-motion-A-systematic-review-and-metaanalysisHealthcare-Switzerland.pdf'],
    ['Behm et al. 2023: efectos agudos de técnicas de estiramiento (meta-análisis)', 'https://doaj.org/article/de530a5c3ffa4ee99b73e52e542239b2']
  ];
  TW.SOURCES.core = [
    ['McGill y Karpowicz 2009: ejercicios de estabilización de columna (EMG)', 'https://pubmed.ncbi.nlm.nih.gov/19154838/'],
    ['ACE: los "Big Three" de Stuart McGill para la zona lumbar', 'https://www.acefitness.org/resources/pros/expert-articles/7077/low-back-exercises-stuart-mcgill-s-big-three/']
  ];
  TW.SOURCES.pushup = [
    ['Calatayud et al. 2015: variantes de flexiones y activación muscular (EMG)', 'https://pubmed.ncbi.nlm.nih.gov/26488636/'],
    ['Revisión de alcance: activación muscular en variaciones de flexiones', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9121296']
  ];
  var base = TW.sourcesFor;
  TW.sourcesFor = function (e) {
    var out = base(e), add = [];
    if (e.type === 'flex') add = add.concat(TW.SOURCES.flex);
    if ((e.goals || []).indexOf('hipertrofia') >= 0) add = add.concat(TW.SOURCES.hipertrofia);
    if (e.pattern === 'core' || /plancha|bird_dog|dead_bug/.test(e.id)) add = add.concat(TW.SOURCES.core);
    if (/flexiones|pushup|push_up/.test(e.id)) add = add.concat(TW.SOURCES.pushup);
    return add.concat(out);
  };
  TW.CATALOG.forEach(function (e) { if (TW.LV[e.id]) e.lv = TW.LV[e.id]; if (TW.MOTION_OF[e.id]) e.motion = TW.MOTION_OF[e.id]; });
})();
