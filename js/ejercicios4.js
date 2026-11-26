/* Ejercicios de pecho, bíceps, espalda y tríceps tomados de una rutina "gimnasio vs. casa" (carrusel de Instagram de @biomusclelap).
   Se usó solo la lista de ejercicios y sus series × repeticiones; las animaciones son propias de la app, no las del carrusel.
   Los que ya existían en el catálogo (p. ej. press de banca, flexiones, dominadas) no se duplican. Se carga después de ejercicios3.js. */
(function () {
  var TW = window.TW, E = TW.makeEx;
  TW.EQUIPMENT.mochila = 'Mochila con peso (libros o botellas de agua)';
  var G = ['hipertrofia', 'definicion'], C = { prog: 'carga' };
  /* X(id, inglés, español, cómo, patrón, músculos, equipo, nivel, series, [min,max], opciones, movimiento, cargas por nivel) */
  function X(id, en, es, how, pat, mus, eq, diff, sets, range, o, mo, lv) {
    TW.CATALOG.push(E(Object.assign({ id: id, name: es, pattern: pat, muscles: mus, equip: eq, diff: diff, goals: G, note: how, sets: sets, range: range, src: eq.indexOf('gimnasio') >= 0 ? 'gym' : 'casa' }, o || {})));
    TW.EX_EN[id] = [en, how];
    if (mo) TW.MOTION_OF[id] = mo;
    if (lv) TW.LV[id] = lv;
  }

  /* ---------- Pecho ---------- */
  X('press_inclinado', 'Incline dumbbell press', 'Press inclinado con mancuernas', 'Banco a 30–45°; baja las mancuernas a los lados del pecho alto controlando 2–3 s y empuja hasta casi estirar los codos. Hombros atrás y abajo.', 'empuje', ['pecho', 'hombros', 'triceps'], ['mancuernas', 'banco'], 2, 4, [8, 10], Object.assign({ rest: 90 }, C), null, [6, 12, 20]);
  X('aperturas_polea', 'Cable fly', 'Aperturas en polea', 'Poleas a la altura del pecho, un paso adelante; abre los brazos con codos ligeramente flexionados y cierra en arco apretando el pecho.', 'aislamiento', ['pecho'], ['gimnasio'], 2, 3, [10, 12], { rest: 60 });
  X('fondos_paralelas', 'Parallel-bar dips', 'Fondos en paralelas', 'Torso ligeramente inclinado al frente para cargar el pecho; baja hasta unos 90° de codo, sin hundir los hombros. Es exigente para el hombro y con tu peso actual conviene empezar con asistencia (máquina o banda).', 'empuje', ['pecho', 'triceps', 'hombros'], ['gimnasio'], 3, 3, [8, 10], { rest: 90 });
  X('flexiones_banda', 'Band-resisted push-up', 'Flexiones con banda', 'Banda rosa por la espalda y sujeta bajo las manos; baja con el cuerpo recto y empuja venciendo la banda arriba. Más difícil que la flexión clásica.', 'empuje', ['pecho', 'triceps', 'hombros'], ['banda_rosa'], 2, 3, [8, 10], { rest: 75 }, ['pushup']);
  X('press_suelo_mochila', 'Backpack floor press', 'Press en suelo con mochila', 'Tumbado, sujeta la mochila cargada con ambas manos contra el pecho; empuja hacia arriba hasta estirar los codos y baja lento hasta rozar el suelo.', 'empuje', ['pecho', 'triceps'], ['mochila'], 1, 4, [10, 12], { rest: 75 }, ['floor_press']);

  /* ---------- Bíceps ---------- */
  X('curl_inclinado', 'Incline dumbbell curl', 'Curl inclinado con mancuernas', 'Banco a 45–60°, brazos colgando detrás del tronco; sube sin mover los codos adelante. Estira mucho el bíceps: usa poco peso.', 'aislamiento', ['biceps'], ['mancuernas', 'banco'], 2, 3, [8, 10], Object.assign({ rest: 60 }, C), null, [4, 7, 10]);
  X('curl_predicador', 'Preacher curl', 'Curl predicador', 'Brazos apoyados en el atril; baja hasta casi extender el codo en 3 s sin despegar el pecho y sube sin balanceo.', 'aislamiento', ['biceps'], ['gimnasio'], 2, 3, [8, 10], { rest: 60 });
  X('curl_mochila', 'Backpack curl', 'Curl con mochila', 'Sujeta la mochila por las asas o con ambas manos al frente; flexiona los codos fijos junto al cuerpo y baja lento.', 'aislamiento', ['biceps'], ['mochila'], 1, 4, [10, 12], { rest: 60 }, ['curl']);
  X('curl_concentrado_mochila', 'Backpack concentration curl', 'Curl concentrado con mochila', 'Sentado, codo apoyado en la cara interna del muslo; sube la mochila por el asa sin balancear y baja controlado.', 'aislamiento', ['biceps'], ['mochila'], 1, 3, [10, 12], { rest: 60 }, ['curl']);
  X('dominadas_supinas_banda', 'Band-assisted chin-up', 'Dominadas supinas con banda', 'Banda bajo los pies o rodillas, agarre supino al ancho de hombros; sube hasta pasar la barbilla y baja en 3 s. La banda quita parte de tu peso al inicio.', 'tiron', ['biceps', 'espalda'], ['barra_dominadas', 'banda_rosa'], 2, 3, [8, 10], { rest: 90 }, ['pullup']);
  X('curl_martillo_banda', 'Band hammer curl', 'Curl martillo con banda', 'Pisa la banda, palmas enfrentadas (agarre neutro); sube sin mover los codos y baja lento.', 'aislamiento', ['biceps'], ['banda_rosa'], 1, 3, [10, 12], { rest: 45 }, ['curl']);

  /* ---------- Espalda ---------- */
  X('pullover_polea', 'Cable pullover', 'Pullover en polea', 'De pie frente a la polea alta, brazos casi rectos; lleva la barra o cuerda desde arriba hasta los muslos con los dorsales, sin doblar los codos.', 'aislamiento', ['espalda'], ['gimnasio'], 2, 3, [10, 12], { rest: 60 });
  X('dominadas_banda', 'Band-assisted pull-up', 'Dominadas con banda', 'Agarre prono algo más ancho que los hombros, banda bajo los pies o rodillas; lleva el pecho hacia la barra y baja en 3 s. Reduce la ayuda de la banda con las semanas.', 'tiron', ['espalda', 'biceps'], ['barra_dominadas', 'banda_rosa'], 2, 4, [8, 10], { rest: 90 }, ['pullup']);
  X('remo_mochila', 'Backpack bent-over row', 'Remo con mochila', 'Tronco inclinado con espalda plana, mochila colgando de ambas manos; jala hacia el abdomen juntando escápulas y baja controlado.', 'tiron', ['espalda', 'biceps'], ['mochila'], 1, 4, [10, 12], { rest: 75 }, ['row_bent']);
  X('jalon_banda', 'Band lat pulldown', 'Jalón con banda', 'Banda anclada arriba (barra de dominadas o puerta); de rodillas o sentado, jala los codos hacia las costillas llevando el pecho adelante.', 'tiron', ['espalda', 'biceps'], ['banda_rosa'], 1, 3, [10, 12], { rest: 60 });

  /* ---------- Tríceps ---------- */
  X('press_frances_barra', 'Lying barbell triceps extension', 'Press francés con barra', 'Tumbado en el banco, barra sobre el pecho con codos hacia arriba; baja hacia la frente flexionando solo los codos y estira. Empieza ligero para cuidar los codos.', 'aislamiento', ['triceps'], ['barra', 'discos', 'banco'], 2, 3, [8, 10], Object.assign({ rest: 75 }, C), ['skull'], [10, 20, 30]);
  X('press_cerrado', 'Close-grip bench press', 'Press cerrado en banca', 'Agarre al ancho de hombros, codos cerca del cuerpo; baja al pecho bajo controlado y empuja. Carga más el tríceps que la banca normal.', 'empuje', ['triceps', 'pecho'], ['barra', 'discos', 'banco'], 2, 4, [8, 10], Object.assign({ rest: 90 }, C), ['floor_press'], [30, 50, 80]);
  X('fondos_silla', 'Chair dips', 'Fondos en silla', 'Manos en el borde de una silla firme, piernas dobladas (más fácil) o estiradas; baja hasta unos 90° de codo y sube. Si el hombro molesta, reduce el recorrido.', 'empuje', ['triceps', 'pecho'], [], 1, 3, [10, 12], { rest: 60 });
  X('extension_mochila', 'Backpack overhead extension', 'Extensión con mochila sobre la cabeza', 'Mochila sostenida con ambas manos detrás de la cabeza, codos apuntando arriba; estira los codos y baja lento.', 'aislamiento', ['triceps'], ['mochila'], 1, 3, [10, 12], { rest: 60 }, ['overhead_ext']);
  X('pushdown_banda', 'Band triceps pushdown', 'Extensión de tríceps con banda (empuje abajo)', 'Banda anclada arriba (puerta o barra); codos pegados a las costillas y empuja las manos hacia abajo hasta estirar los codos.', 'aislamiento', ['triceps'], ['banda_rosa'], 1, 3, [10, 12], { rest: 45 });
  X('press_frances_mochila', 'Backpack lying triceps extension', 'Press francés con mochila', 'Tumbado en el suelo, mochila con ambas manos sobre el pecho; baja detrás de la cabeza flexionando solo los codos y estira.', 'aislamiento', ['triceps'], ['mochila'], 1, 3, [10, 12], { rest: 60 }, ['skull']);

  TW.CATALOG.forEach(function (e) { if (TW.LV[e.id]) e.lv = TW.LV[e.id]; if (TW.MOTION_OF[e.id]) e.motion = TW.MOTION_OF[e.id]; });
})();
