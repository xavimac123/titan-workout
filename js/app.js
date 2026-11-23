/* Interfaz: pantallas, registro de series, asistente de configuración y ajustes. */
(function () {
  'use strict';
  var TW = window.TW;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var view = $('#view');
  var S = null, W = null, selDay = null, progSel = null, restIv = null, toastTo = null, sheetCtx = null;
  var libFilter = { pat: '', goal: '', mus: '' };
  var curNum = 0, quoteIdx = null;
  var run = null;
  function bsvg(m, size, heat) { return TW.bodySVG(m, size, (S && S.profile && S.profile.sex) || 'm', heat); }
  function numB() { return curNum ? '<span class="num">' + curNum + '</span>' : ''; }
  function muscleNames(e) { return (e.muscles || []).map(function (m) { return TW.MUSCLES[m]; }).join(' · '); }
  function infoBtn(e) { return '<button class="info-btn" data-a="info" data-ex="' + e.id + '" aria-label="Información de ' + esc(TW.exName(e)) + '">i</button>'; }
  var BLOCKS = [
    { id: 'main', name: 'Fuerza principal', hint: 'Empieza aquí: lo más exigente, con la mente fresca' },
    { id: 'acc', name: 'Accesorios y core', hint: 'Músculos más pequeños y abdomen' },
    { id: 'cardio', name: 'Cardio suave', hint: 'Bajo impacto' },
    { id: 'cool', name: 'Flexibilidad', hint: 'Vuelta a la calma' }
  ];
  function blockOf(e) {
    if (e.type === 'flex') return 'cool';
    if (e.type === 'cardio') return 'cardio';
    return ['sentadilla', 'bisagra', 'empuje', 'tiron', 'zancada'].indexOf(e.pattern) >= 0 ? 'main' : 'acc';
  }
  function estMin(e) {
    if (e.type === 'cardio') return e.minutes || 10;
    if (e.type === 'flex') return Math.max(1, Math.round((e.positions || []).reduce(function (a, p) { return a + p.sec; }, 0) / 60));
    return Math.max(1, Math.round((e.sets || 3) * (40 + (e.rest || 60)) / 60));
  }
  function orderedExs(exs) {
    var out = [];
    BLOCKS.forEach(function (b) {
      out = out.concat(exs.filter(function (e) { return blockOf(e) === b.id; }).sort(function (x, y) {
        return (y.diff || 1) - (x.diff || 1) || ((y.equip || []).length ? 1 : 0) - ((x.equip || []).length ? 1 : 0);
      }));
    });
    return out;
  }
  function exSub(e) {
    if (e.type === 'cardio') return (e.minutes || 10) + ' min';
    if (e.type === 'flex') return estMin(e) + ' min';
    if (e.ladder) { var t = TW.target(S, e); return e.sets + ' × ' + t.target + (t.unit === 'seg' ? ' s' : ''); }
    return e.sets + ' × ' + (e.range ? e.range[0] + '–' + e.range[1] : '');
  }
  function levelName() { return ['', 'Principiante', 'Intermedio', 'Avanzado'][TW.level(S)]; }
  function overviewHTML(info) {
    var total = info.exs.reduce(function (a, e) { return a + estMin(e); }, 0) + 6;
    var eq = {};
    info.exs.forEach(function (e) { (e.equip || []).forEach(function (k) { eq[k] = 1; }); });
    var ico = Object.keys(eq).map(function (k) { return '<span class="pill">' + TW.equipIcon(k, 20) + ' ' + esc(String(TW.EQUIPMENT[k]).split(' (')[0]) + '</span>'; }).join('') || '<span class="pill">Peso corporal</span>';
    return '<article class="card sess"><div class="chips2"><span class="pill">~' + total + ' min</span><span class="pill">' + levelName() + '</span><span class="pill">' + info.exs.length + ' ejercicios</span></div>' +
      '<p class="lbl">Equipo</p><div class="chips2">' + ico + '</div>' +
      '<button class="wide" data-a="startRun">Iniciar sesión</button></article>';
  }
  function rowsHTML(exs, canLog) {
    var order = orderedExs(exs), out = '', n = 0;
    BLOCKS.forEach(function (b) {
      var list = order.filter(function (e) { return blockOf(e) === b.id; });
      if (!list.length) return;
      out += '<h3 class="blk">' + b.name + ' <small>~' + list.reduce(function (a, e) { return a + estMin(e); }, 0) + ' min</small></h3>';
      list.forEach(function (e) {
        var idx = order.indexOf(e), done = doneCount(e) >= (e.type === 'fuerza' ? e.sets : 1);
        out += '<div class="xrow' + (done ? ' done' : '') + '"><button class="xmain" data-a="runAt" data-i="' + idx + '"><span class="xn">' + (done ? '✓' : ++n) + '</span>' +
          '<span class="xt"><b>' + esc(TW.exName(e)) + (isExtra(weekDates(0)[selDay], e.id) ? ' <span class="pill ex">Extra</span>' : '') + '</b><small>' + esc(e.name) + ' · ' + muscleNames(e) + '</small></span><span class="xm">' + exSub(e) + '<small>~' + estMin(e) + ' min</small></span></button>' + infoBtn(e) + '</div>';
      });
    });
    return out;
  }
  function renderRun() {
    var info = TW.dayInfo(S, S.week[selDay]), order = orderedExs(info.exs), n = order.length, i = TW.clamp(run.i, 0, n + 1);
    run.i = i;
    var seg = '';
    for (var k = 0; k <= n + 1; k++) seg += '<i class="' + (k < i ? 'd' : k === i ? 'c' : '') + '"></i>';
    var body = '';
    if (i === 0) {
      body = '<h2 class="title">Calentamiento</h2><p class="sub">5–10 min · prepara articulaciones y músculos</p><article class="card">' +
        warmItems(TW.WARMUP.casa).map(function (t) { return '<label class="check"><input type="checkbox"> ' + esc(t) + '</label>'; }).join('') + '</article>' +
        (order[0] ? '<p class="meta">Sigue: <b>' + esc(TW.exName(order[0])) + '</b></p>' : '');
    } else if (i <= n) {
      var e = order[i - 1], nx = order[i];
      body = '<p class="meta">Ejercicio ' + i + ' de ' + n + ' · ' + esc(muscleNames(e)) + '</p><div class="runfig">' + bsvg(e.muscles, 'big') + '</div>' +
        exCard(e, true) + '<p class="how">' + esc(TW.exHow(e)) + '</p>' +
        (nx ? '<p class="meta">Sigue: <b>' + esc(TW.exName(nx)) + '</b></p>' : '<p class="meta">Este es el último ejercicio.</p>');
    } else {
      body = '<h2 class="title">¡Sesión completa!</h2><article class="card"><h3>Vuelta a la calma</h3><ul class="plain"><li>Camina 2–3 min para bajar pulsaciones.</li><li>Estira 20–30 s los grupos que trabajaste.</li><li>Bebe agua y anota cómo te sentiste.</li></ul></article>' +
        '<button class="wide" data-a="finishDay" data-d="' + selDay + '">Terminar día</button>';
    }
    view.innerHTML = '<section class="page run"><div class="runbar"><div class="segs">' + seg + '</div><button class="ghost" data-a="runExit">Salir</button></div>' + body +
      '<div class="runnav"><button class="ghost" data-a="runPrev"' + (i === 0 ? ' disabled' : '') + '>Anterior</button>' +
      '<button data-a="runNext"' + (i > n ? ' disabled' : '') + '>' + (i === n ? 'Finalizar' : 'Siguiente') + '</button></div></section>';
  }
  function muscleWeek() {
    var skip = ['cuerpo_completo', 'cardio', 'movilidad'], done = {}, plan = {};
    var add = function (map, e, sets) {
      var m = (e.muscles || []).filter(function (x) { return skip.indexOf(x) < 0; });
      m.forEach(function (g, k) { map[g] = (map[g] || 0) + sets * (k === 0 ? 1 : 0.5); });
    };
    var dates = weekDates(0);
    S.logs.forEach(function (l) {
      if (dates.indexOf(l.date) < 0 || !l.sets) return;
      var e = TW.getEx(S, l.ex); if (e && e.type === 'fuerza') add(done, e, l.sets.filter(Boolean).length);
    });
    S.week.forEach(function (d) { d.exs.forEach(function (id) { var e = TW.getEx(S, id); if (e && e.type === 'fuerza') add(plan, e, e.sets || 3); }); });
    return { done: done, plan: plan };
  }
  function muscleChartHTML() {
    var mw = muscleWeek(), td = Object.keys(mw.done).reduce(function (a, k) { return a + mw.done[k]; }, 0);
    var src = td > 0 ? mw.done : mw.plan, keys = Object.keys(src).sort(function (a, b) { return src[b] - src[a]; });
    if (!keys.length) return '';
    var mx = Math.max.apply(null, keys.map(function (k) { return Math.max(src[k], mw.plan[k] || 0); })) || 1;
    var heat = {}; keys.forEach(function (k) { heat[k] = src[k] / mx; });
    var bars = keys.slice(0, 8).map(function (k) {
      return '<div class="mrow"><span>' + TW.MUSCLES[k] + '</span><div class="mbar"><i class="pl" style="width:' + Math.round((mw.plan[k] || 0) / mx * 100) + '%"></i><i style="width:' + Math.round((mw.done[k] || 0) / mx * 100) + '%"></i></div>' +
        '<b>' + Math.round((mw.done[k] || 0) * 10) / 10 + '/' + Math.round((mw.plan[k] || 0) * 10) / 10 + '</b></div>';
    }).join('');
    return '<article class="card"><h3>Músculos de la semana</h3><div class="runfig">' + bsvg([], 'big', heat) + '</div>' +
      '<p class="meta">' + (td > 0 ? 'Más trabajado: <b>' + TW.MUSCLES[keys[0]] + '</b>. ' : 'Aún sin registros: se muestra el plan. ') + 'Series efectivas (hechas/plan); el músculo principal cuenta 1 y los secundarios 0,5.</p>' + bars + '</article>';
  }
  function blocksHTML(exs, canLog) {
    var n = 0, out = '';
    BLOCKS.forEach(function (b) {
      var list = exs.filter(function (e) { return blockOf(e) === b.id; }).sort(function (x, y) {
        return (y.diff || 1) - (x.diff || 1) || ((y.equip || []).length ? 1 : 0) - ((x.equip || []).length ? 1 : 0);
      });
      if (!list.length) return;
      var mins = list.reduce(function (a, e) { return a + estMin(e); }, 0);
      out += '<h3 class="blk">' + b.name + ' <small>~' + mins + ' min · ' + b.hint + '</small></h3>' +
        list.map(function (e) { curNum = ++n; return exCard(e, canLog); }).join('');
    });
    curNum = 0;
    return out;
  }
  function extrasHTML(info) {
    var plan = info.exs.reduce(function (a, e) { return a + TW.estMin(e); }, 0);
    var rem = (S.profile.minutes || 20) - plan, top = urgency()[0];
    var date = weekDates(0)[selDay], n = ((S.extras || {})[date] || []).length;
    return '<article class="card"><h3>Ejercicios adicionales' + (rem >= 4 ? ' <small>+' + rem + ' min libres</small>' : '') + '</h3>' +
      '<p class="meta">Tú eliges: se abre el listado por grupo muscular. Zona que más lo necesita esta semana: <b>' + TW.MUSCLES[top.k] + '</b>.' + (n ? ' Hoy llevas ' + n + ' extra.' : '') + ' El tiempo extra se registra y se reporta en Inicio.</p>' +
      '<button class="wide ghost" data-a="openPicker" data-extra="1">Elegir ejercicios adicionales</button></article>';
  }
  function addExPhoto(file, id) {
    if (!file) return;
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var m = Math.min(1, 640 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * m); c.height = Math.round(img.height * m);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      S.exPhotos = S.exPhotos || {}; S.exPhotos[id] = c.toDataURL('image/jpeg', 0.75);
      save(); openInfo(id);
    };
    img.src = url;
  }
  function quoteHTML() {
    var Q = TW.QUOTES; if (!Q || !Q.length) return '';
    var i;
    do { i = Math.floor(Math.random() * Q.length); } while (i === quoteIdx && Q.length > 1);
    quoteIdx = i;
    return '<article class="card quote"><p>“' + esc(Q[i][0]) + '”</p><small>— ' + esc(Q[i][1]) + '</small></article>';
  }
  function loadTag(e) {
    var L = TW.loadByLevel(S, e); if (!L) return '';
    var v = L.vals[TW.clamp(TW.level(S), 1, 3) - 1];
    return '<span class="pill ld">≈ ' + v.got + ' kg</span>';
  }
  function loadBlock(e) {
    var mode = TW.exMode(e), lvl = TW.level(S), L = TW.loadByLevel(S, e), out = '';
    if (mode.k === 'pc') {
      return '<p class="lbl">Carga</p><p><b>Peso corporal</b>: sin carga externa. Progresas con más repeticiones o con una variante más difícil.</p>';
    }
    if (mode.k === 'bd') {
      return '<p class="lbl">Resistencia</p><p>La <b>banda rosa</b> es más firme y la <b>turquesa</b> más ligera. Elige la que te deje completar todo el rango con técnica limpia y las últimas repeticiones exigentes; si no llegas, usa la más ligera o acorta el rango.</p>';
    }
    if (mode.k === 'mov') return '';
    if (L) {
      var names = ['Principiante', 'Intermedio', 'Avanzado'];
      out = '<p class="lbl">Carga sugerida · ' + L.unit + '</p><div class="lvgrid">' + L.vals.map(function (v, i) {
        var diff = v.got !== v.want ? '<small>(ideal ' + v.want + ')</small>' : '';
        return '<div class="lv' + (i + 1 === lvl ? ' on' : '') + '"><small>' + names[i] + '</small><b>' + v.got + '</b>' + diff + '</div>';
      }).join('') + '</div><p class="meta">Punto de partida, redondeado hacia abajo a las cargas que tienes' + (L.have ? '' : ' (activa tu equipo para ajustarlo)') +
        '. Sube cuando completes el tope de repeticiones en todas las series; si pierdes la técnica, baja una carga.</p>';
    } else if (mode.k === 'eq') {
      out = '<p class="lbl">Carga</p><p>Elige un peso con el que las últimas 2 repeticiones sean exigentes pero limpias.</p>';
    }
    return out;
  }
  function openInfo(id) {
    var e = TW.getEx(S, id), mus = (e.muscles || []).filter(function (m) { return m !== 'cuerpo_completo'; });
    var prim = mus[0] ? TW.MUSCLES[mus[0]] : null, sec = mus.slice(1).map(function (m) { return TW.MUSCLES[m]; });
    var eq = (e.equip || []).map(function (k) { return '<span class="pill">' + TW.equipIcon(k, 20) + ' ' + esc(String(TW.EQUIPMENT[k]).split(' (')[0]) + '</span>'; }).join(' ');
    var mode = TW.exMode(e), inBlock = BLOCKS.filter(function (b) { return b.id === blockOf(e); })[0];
    var ph = (S.exPhotos || {})[e.id], svg = TW.animSVG(e), mo = TW.MOTION_OF && TW.MOTION_OF[e.id];
    var cues = mo && TW.CUES[mo[0]], steps = '';
    if (cues) {
      steps = '<ol class="steps">' + ['Inicio', 'Movimiento', 'Final'].map(function (t, i) { return '<li><b>' + t + '</b><span>' + esc(cues[i]) + '</span></li>'; }).join('') + '</ol>';
    }
    var src = TW.sourcesFor(e).map(function (x) { return '<li><a href="' + x[1] + '" target="_blank" rel="noopener">' + esc(x[0]) + '</a></li>'; }).join('');
    openSheet(
      (svg ? '<div class="animbox">' + svg + '<div class="animbar"><span>Inicio ⇄ Final · animación en bucle</span><button class="ghost sm" data-a="animToggle">⏸ Pausar</button></div></div>'
        : '<div class="big">' + bsvg(e.muscles, 'big') + '</div>') +
      (ph ? '<img class="preview" src="' + ph + '" alt="Mi foto del ejercicio">' : '') +
      '<h3>' + exTitle(e) + '</h3>' +
      '<div class="chips2"><span class="pill md ' + mode.k + '">' + mode.t + '</span><span class="pill">Nivel ' + (e.diff || 1) + '/3</span>' + (eq || '') + '</div>' +
      '<p class="lbl">Qué trabaja</p><p>' + (prim ? '<b>' + prim + '</b>' : 'Todo el cuerpo') + (sec.length ? ' <span class="meta">· también: ' + sec.join(', ') + '</span>' : '') + '</p>' +
      (svg ? '<div class="big small">' + bsvg(e.muscles, 'big') + '</div>' : '') +
      loadBlock(e) +
      '<p class="lbl">Cómo hacerlo</p>' + (steps || '<p>' + esc(TW.exHow(e)) + '</p>') +
      (steps ? '<p class="meta"><em>' + esc(TW.exHow(e)) + '</em></p>' : '') +
      '<p class="lbl">Calentamiento antes de este ejercicio</p><p>' + esc(TW.PATTERN_WARM[e.pattern] || 'Calienta 3–5 min antes.') + '</p>' +
      '<p class="lbl">Dónde va en la sesión</p><p>' + (inBlock ? esc(inBlock.name) + ' · ' + esc(inBlock.hint) : '') + '.</p>' +
      '<details class="srcbox"><summary>Fuentes técnicas</summary><ul class="plain">' + src + '</ul><p class="meta">Las animaciones son esquemas propios para entender el movimiento; las cargas son puntos de partida, no una prescripción médica.</p></details>' +
      '<label class="field">' + (ph ? 'Cambiar mi foto o imagen' : 'Agregar mi foto o imagen del ejercicio') + '<input type="file" id="exPhoto" data-ex="' + e.id + '" accept="image/*"></label>' +
      (ph ? '<button class="ghost" data-a="delExPhoto" data-ex="' + e.id + '">Quitar mi foto</button>' : '') +
      '<button class="wide ghost" data-a="closeSheet">Cerrar</button>');
  }
  /* ---- Selector "Añadir ejercicio": glassbox con sugerencias por zona urgente ---- */
  var pick = { g: null, p: 'all' }, pickDay = null;
  function pd() { return pickDay != null ? pickDay : selDay; }
  var PICK_TARGET = { pecho: 10, espalda: 10, hombros: 8, biceps: 6, triceps: 6, cuadriceps: 10, isquiotibiales: 8, gluteos: 8, abdomen: 6, pantorrillas: 6 };
  function urgency() {
    var mw = muscleWeek();
    return Object.keys(PICK_TARGET).map(function (k) {
      var have = Math.max(mw.plan[k] || 0, mw.done[k] || 0), def = PICK_TARGET[k] - have;
      return { k: k, have: have, target: PICK_TARGET[k], def: def, tier: def >= 5 ? 'u' : def >= 2.5 ? 'b' : 'ok' };
    }).sort(function (a, b) { return b.def / b.target - a.def / a.target; });
  }
  function pickList(g) {
    var level = TW.level(S), day = S.week[pd()] ? S.week[pd()].exs : [];
    return TW.allEx(S).filter(function (e) {
      if (day.indexOf(e.id) >= 0 || TW.status(S, e.id) === 'descartado') return false;
      if (g === 'cardio') return e.type === 'cardio';
      if (g === 'movilidad') return e.type === 'flex';
      return e.type === 'fuerza' && e.muscles.indexOf(g) >= 0;
    }).map(function (e) {
      var why = !TW.hasEquip(S, e) ? ((e.equip || []).filter(function (q) { return !(S.equipment[q] && S.equipment[q].on); }).map(function (q) { return String(TW.EQUIPMENT[q]).split(' (')[0]; }).join(', ') || 'Bajo impacto: pausado') : (e.diff > level ? 'Nivel avanzado' : '');
      return { e: e, why: why, main: e.muscles[0] === g };
    }).sort(function (a, b) {
      return (a.why ? 1 : 0) - (b.why ? 1 : 0) || (b.main ? 1 : 0) - (a.main ? 1 : 0) || (a.e.diff || 1) - (b.e.diff || 1);
    });
  }
  function openPicker() {
    var u = urgency(), heat = {}, dayName = TW.DOW[pd()];
    u.forEach(function (x) { heat[x.k] = TW.clamp(x.def / x.target, 0.18, 1); });
    $('#sheet').classList.add('glass');
    var head = '<div class="phead"><h3>Añadir a ' + dayName + '</h3><button class="ghost sm" data-a="closeSheet" aria-label="Cerrar">✕</button></div>';
    if (!pick.g) {
      var top = u.filter(function (x) { return x.tier !== 'ok'; }).slice(0, 3);
      openSheet(head + '<p class="meta">Toca un grupo muscular en el mapa. Más brillante = más urgente esta semana.</p>' +
        '<div class="pmap">' + TW.bodySVG([], 'big', (S.profile && S.profile.sex) || 'm', heat, true) + '</div>' +
        (top.length ? '<p class="lbl">Más urgentes</p><div class="gchips wrap">' + top.map(function (x) {
          return '<button class="gchip ' + x.tier + '" data-a="pickG" data-g="' + x.k + '"><b>' + TW.MUSCLES[x.k] + '</b><small>' + (x.tier === 'u' ? 'Urgente' : 'Bajo') + ' · ' + Math.round(x.have * 10) / 10 + '/' + x.target + '</small></button>';
        }).join('') + '</div>' : '<p class="meta">Tus zonas principales ya están cubiertas esta semana.</p>') +
        '<p class="lbl">Otros</p><div class="gchips wrap"><button class="gchip" data-a="pickG" data-g="cardio"><b>Cardio</b></button><button class="gchip" data-a="pickG" data-g="movilidad"><b>Movilidad</b></button></div>');
      return;
    }
    var info = u.filter(function (x) { return x.k === pick.g; })[0];
    var all = pickList(pick.g);
    var pats = []; all.forEach(function (r) { if (pats.indexOf(r.e.pattern) < 0) pats.push(r.e.pattern); });
    if (pick.p !== 'all' && pats.indexOf(pick.p) < 0) pick.p = 'all';
    var ptabs = pats.length > 1 ? '<div class="pchips"><button class="pchip' + (pick.p === 'all' ? ' sel' : '') + '" data-a="pickP" data-p="all">Todos</button>' +
      pats.map(function (q) { return '<button class="pchip' + (pick.p === q ? ' sel' : '') + '" data-a="pickP" data-p="' + q + '">' + TW.PATTERNS[q] + '</button>'; }).join('') + '</div>' : '';
    var filt = all.filter(function (r) { return pick.p === 'all' || r.e.pattern === pick.p; });
    var rowOf = function (r) {
      var e = r.e, eq = (e.equip || []).map(function (k) { return TW.equipIcon(k, 18); }).join('') || '<span class="meta">Sin equipo</span>';
      return '<div class="prow' + (r.why ? ' lock' : '') + '"><div class="pmain"><b>' + esc(TW.exName(e)) + '</b>' +
        '<small class="es">' + esc(TW.PATTERNS[e.pattern]) + (r.main ? '' : ' · apoyo') + ' · Nivel ' + (e.diff || 1) + '/3 · ~' + TW.estMin(e) + ' min</small>' +
        '<span class="peq"><span class="pill md ' + TW.exMode(e).k + '">' + TW.exMode(e).t + '</span>' + eq + loadTag(e) + (r.why ? '<em>Requiere: ' + esc(r.why) + '</em>' : '') + '</span></div>' +
        '<div class="pact"><button class="ghost sm" data-a="info" data-ex="' + e.id + '" aria-label="Información">i</button>' +
        (r.why ? '' : '<button class="sm" data-a="addPick" data-ex="' + e.id + '">Añadir</button>') + '</div></div>';
    };
    var okR = filt.filter(function (r) { return !r.why; }).map(rowOf).join(''), lockR = filt.filter(function (r) { return r.why; });
    var rows = (okR || '<p class="meta">No hay ejercicios disponibles en esta zona con tu equipo y nivel actuales.</p>') +
      (lockR.length ? '<details class="lockbox"><summary>' + lockR.length + ' que requieren otro equipo o nivel</summary>' + lockR.map(rowOf).join('') + '</details>' : '');
    openSheet(head + '<button class="linkback" data-a="pickBack">← Mapa muscular</button>' +
      '<h4 class="pgroup">' + TW.MUSCLES[pick.g] + (info ? ' <small class="t' + info.tier + '">' + (info.tier === 'u' ? 'Urgente' : info.tier === 'b' ? 'Bajo' : 'Cubierto') + ' · ' + Math.round(info.have * 10) / 10 + '/' + info.target + ' series</small>' : '') + '</h4>' +
      '<p class="meta">Se añade a ' + dayName + ' con el tiempo estimado de cada ejercicio.</p>' + ptabs + '<div class="plist enter">' + rows + '</div>');
    var sb = $('#sheetBody'); if (sb) sb.scrollTop = 0;
  }
  function myEquipHTML() {
    var keys = Object.keys(TW.EQUIPMENT);
    return '<div class="card"><h3>Mi equipo</h3><p class="meta">Toca un equipo para activarlo o desactivarlo.</p><div class="eqgrid">' +
      keys.map(function (k) {
        var x = S.equipment[k] || { on: false, loads: [] }, loadable = TW.LOADABLE.indexOf(k) >= 0;
        var lv = (x.loads && x.loads.length) ? x.loads : (TW.PRESET_LOADS[k] || []);
        var sub = loadable && lv.length ? (lv[0] === lv[lv.length - 1] ? lv[0] + ' kg' : lv[0] + '–' + lv[lv.length - 1] + ' kg') : '';
        return '<button class="eqtile' + (x.on ? ' on' : '') + '" data-a="toggleEq" data-k="' + k + '" aria-pressed="' + (x.on ? 'true' : 'false') + '">' +
          TW.equipIcon(k, 40) + '<span>' + esc(String(TW.EQUIPMENT[k]).split(' (')[0]) + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</button>';
      }).join('') + '</div>' + newEquipHTML() + '</div>';
  }

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var today = function () { return TW.ymd(new Date()); };
  var todayIdx = function () { return TW.dowMon(new Date()); };

  function defaults() {
    return {
      profile: null, equipment: {}, assess: {}, status: {}, autoPaused: {}, exProg: {}, custom: [],
      week: [0, 1, 2, 3, 4, 5, 6].map(function () { return { exs: [] }; }), logs: [], body: [], tests: [], phases: [],
      settings: { volMax: 20, protein: [1.6, 2.2] }, focusAreas: [], analysis: null, photo: null, notice: false
    };
  }
  function load() {
    return TW.db.get('state').then(function (saved) { S = Object.assign(defaults(), saved || {}); regEquip(); });
  }
  function save() { return TW.db.set('state', S); }

  /* ---------- utilidades de UI ---------- */
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastTo); toastTo = setTimeout(function () { t.classList.add('hidden'); }, 2400);
  }
  function openSheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').classList.remove('hidden'); }
  function closeSheet() { $('#sheet').classList.add('hidden'); $('#sheet').classList.remove('glass'); }
  function collect(root) {
    var out = {};
    root.querySelectorAll('input[name],select[name],textarea[name],input[data-group]').forEach(function (el) {
      if (el.dataset.group) {
        out[el.dataset.group] = out[el.dataset.group] || [];
        if (el.checked) out[el.dataset.group].push(el.value);
        return;
      }
      if (el.type === 'checkbox') { out[el.name] = el.checked; return; }
      out[el.name] = el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value;
    });
    return out;
  }
  function parseLoads(str) {
    var arr = String(str || '').split(',').map(function (x) { return Number(x.trim().replace(',', '.')); });
    return Array.from(new Set(arr.filter(function (x) { return isFinite(x) && x > 0; }))).sort(function (a, b) { return a - b; });
  }
  function warnHTML(list, cls) {
    if (!list || !list.length) return '';
    return '<ul class="warns ' + (cls || '') + '">' + list.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>';
  }
  function fmtPace(e, km, min) {
    if (!(km > 0 && min > 0)) return '';
    if (e.id === 'bici_estatica') return (km / (min / 60)).toFixed(1) + ' km/h';
    return TW.fmt(Math.round(min / km * 60)) + ' min/km';
  }
  function touchSession() {
    var d = today(), n = Date.now();
    S.sess = S.sess || {};
    if (!S.sess[d]) S.sess[d] = { s: n - 60000, e: n }; else S.sess[d].e = n;
  }
  function dayMinutes(date) {
    var sess = (S.sess || {})[date], est = 0;
    S.logs.forEach(function (l) {
      if (l.date !== date) return;
      est += (l.sets || []).filter(Boolean).length * 1.5;
      if (l.cardio) est += l.cardio.min || 0;
      if (l.flexDone) est += 5;
    });
    var act = sess ? Math.round((sess.e - sess.s) / 60000) : 0;
    return Math.min(150, Math.round(Math.max(act, est)) + ((S.extraMin || {})[date] || 0));
  }
  function isExtra(date, id) { return ((S.extras || {})[date] || []).indexOf(id) >= 0; }
  function planMin(i) {
    var date = weekDates(0)[i], d = S.week[i];
    if (!d) return 0;
    return d.exs.reduce(function (a, id) { var e = TW.getEx(S, id); return a + (e && !isExtra(date, id) ? estMin(e) : 0); }, 0);
  }
  function markExtra(id) {
    var date = weekDates(0)[pd()]; S.extras = S.extras || {};
    (S.extras[date] = S.extras[date] || []).push(id);
  }
  function timeCardHTML(canLog) {
    var date = weekDates(0)[selDay], real = dayMinutes(date), plan = planMin(selDay), ex = Math.max(0, real - plan);
    var n = ((S.extras || {})[date] || []).length;
    return '<article class="card"><h3>Tiempo de hoy</h3><div class="stats3"><div><small>Plan</small><b>' + plan + '</b></div><div><small>Real</small><b>' + real + '</b></div><div><small>Extra</small><b>' + (ex ? '+' + ex : '0') + '</b></div></div>' +
      '<p class="meta">Minutos. El tiempo real se registra solo al marcar series' + (n ? ' · ' + n + ' ejercicio' + (n > 1 ? 's' : '') + ' extra añadido' + (n > 1 ? 's' : '') : '') + '. Si entrenaste algo más que no marcaste, súmalo:</p>' +
      (canLog ? '<div class="grid2"><button class="ghost" data-a="addMin" data-m="5">+5 min</button><button class="ghost" data-a="addMin" data-m="10">+10 min</button></div>' : '') + '</article>';
  }
  function weekDates(offset) {
    var st = TW.addDays(TW.weekStart(new Date()), (offset || 0) * 7);
    return [0, 1, 2, 3, 4, 5, 6].map(function (i) { return TW.ymd(TW.addDays(st, i)); });
  }
  function getLog(date, exId, create) {
    var l = S.logs.find(function (x) { return x.date === date && x.ex === exId; });
    if (!l && create) { l = { date: date, ex: exId, sets: [], clean: false }; S.logs.push(l); }
    return l;
  }
  function regEquip() {
    (S.customEquip || []).forEach(function (c) { TW.EQUIPMENT[c.id] = c.name; });
  }
  function mineEquip() {
    var eq = Object.assign({}, S.equipment);
    Object.keys(TW.EQUIPMENT).forEach(function (k) {
      if (TW.MY.equip.indexOf(k) >= 0) eq[k] = { on: true, loads: [] };
      else if (!eq[k]) eq[k] = { on: false, loads: [] };
    });
    return eq;
  }
  function applyMine() {
    if (!confirm('Cargar tu peso, estatura, 4 días, medidas y tu equipo guardado?')) return;
    var had = S.profile && S.profile.days;
    S.profile = Object.assign({}, S.profile, TW.MY.profile);
    S.equipment = mineEquip();
    if (!S.body.length) S.body.push({ date: today(), kg: TW.MY.profile.weight, waist: TW.MY.profile.waist });
    if (had !== TW.MY.profile.days) {
      var w = TW.proposeWeek(S); w.forEach(function (d) { d.exs.forEach(activate); }); S.week = w;
    }
    save(); toast('Perfil y equipo cargados'); renderSettings();
  }
  function addEquip() {
    var inp = $('#newEquip'), name = inp ? inp.value.trim() : '';
    if (!name) { toast('Escribe el nombre del equipo'); return; }
    if (W) S.equipment = readEquip(view); else if (view.querySelector('input[data-group="equip"]')) S.equipment = readEquip(view);
    var id = 'x_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24);
    if (TW.EQUIPMENT[id]) { toast('Ese equipo ya existe'); return; }
    S.customEquip = (S.customEquip || []).concat([{ id: id, name: name }]);
    TW.EQUIPMENT[id] = name; S.equipment[id] = { on: true, loads: [] };
    save(); toast('Equipo agregado');
    if (W) renderWizard(); else renderSettings();
  }
  function newEquipHTML() {
    return '<div class="eqrow"><input id="newEquip" maxlength="40" placeholder="Equipo nuevo (ej: Banco, Barra de dominadas)" aria-label="Nombre del equipo nuevo"><button class="ghost" data-a="addEquip">Agregar</button></div>';
  }
  function activate(id) {
    if (TW.status(S, id) !== 'activo') S.status[id] = 'activo';
    var e = TW.getEx(S, id);
    if (e && e.ladder) TW.progOf(S, e);
  }
  function repLabel(e, sug) {
    if (e.ladder) { var t = TW.target(S, e); return 'Objetivo: ' + t.target + ' ' + (t.unit === 'seg' ? 'seg' : 'reps'); }
    var unit = e.prog === 'tiempo' ? 'seg' : 'reps';
    return e.range[0] + '–' + e.range[1] + ' ' + unit + (sug && sug.load != null ? ' · Carga sugerida ' + sug.load + ' kg' : '');
  }

  /* ---------- temporizador (descanso y estiramientos) ---------- */
  /* Sonido sin archivos: tonos generados con Web Audio (se activa con el toque que inicia el temporizador). */
  var audioCtx = null;
  function beep(freq, ms) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
      g.gain.value = 0.25; o.start();
      o.stop(audioCtx.currentTime + ms / 1000);
    } catch (err) { /* sin audio disponible: solo vibración */ }
  }
  function startTimer(sec, label) {
    clearInterval(restIv);
    var t = sec, bar = $('#restBar');
    $('#restLbl').textContent = label;
    bar.classList.remove('hidden');
    var show = function () { $('#restTime').textContent = TW.fmt(t); };
    show();
    restIv = setInterval(function () {
      t--; show();
      if (t > 0 && t <= 3) beep(660, 120);
      if (t <= 0) {
        clearInterval(restIv); bar.classList.add('hidden');
        beep(880, 500);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        toast(label + ' terminado');
      }
    }, 1000);
  }
  function skipTimer() { clearInterval(restIv); $('#restBar').classList.add('hidden'); }

  /* ---------- enrutado ---------- */
  function route() {
    var name = (location.hash.slice(1) || 'inicio').split('?')[0];
    if (!S.profile && name !== 'config') { location.hash = '#config'; return; }
    document.querySelectorAll('#tabs a').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === name); });
    $('#tabs').classList.toggle('hidden', name === 'config');
    var R = { inicio: renderHome, hoy: renderToday, semana: renderWeek, ruta: renderRoad, progreso: renderProgress,
      biblioteca: renderLibrary, ajustes: renderSettings, config: renderWizard }[name] || renderHome;
    closeSheet();
    R();
  }

  /* ---------- INICIO (dashboard) ---------- */
  function renderHome() {
    var p = S.profile, ti = todayIdx(), dates = weekDates(0), prev = weekDates(-1);
    var start = (S.body[0] && S.body[0].kg) || p.weight, cur = TW.metric(S, 'peso'), tgt = p.targetKg || null;
    var pct = tgt && start !== tgt ? TW.clamp(Math.round((start - cur) / (start - tgt) * 100), 0, 100) : 0;
    var planned = 0, done = 0, total = 0, last = 0;
    var days = dates.map(function (d, i) {
      var plan = S.week[i] && S.week[i].exs.length > 0, m = dayMinutes(d), did = m > 0;
      if (plan) planned++;
      if (plan && did) done++;
      total += m;
      var pm = planMin(i);
      return { i: i, plan: plan, did: did, m: m, pm: pm, x: Math.max(0, m - pm), today: i === ti };
    });
    prev.forEach(function (d) { last += dayMinutes(d); });
    var maxM = Math.max(20, days.reduce(function (a, d) { return Math.max(a, d.m); }, 0));
    var info = TW.dayInfo(S, S.week[ti]);
    var cta = info.exs.length ? (days[ti].did ? 'Continuar entrenamiento' : 'Iniciar entrenamiento') : 'Hoy descansas · ver Hoy';
    var cols = days.map(function (d) {
      return '<div class="wkcol' + (d.today ? ' today' : '') + '"><div class="wkbar"><i style="height:' + Math.round(Math.min(d.m, d.pm || d.m) / maxM * 100) + '%"></i>' + (d.x && d.pm ? '<i class="x" style="height:' + Math.round(d.x / maxM * 100) + '%"></i>' : '') + '</div>' +
        '<b>' + TW.DOW[d.i] + '</b><small>' + (d.m ? d.m + ' min' : d.plan ? '·' : '–') + '</small></div>';
    }).join('');
    var diff = total - last, planTot = days.reduce(function (a, d) { return a + d.pm; }, 0), xTot = days.reduce(function (a, d) { return a + d.x; }, 0);
    view.innerHTML = '<section class="page"><h2 class="title">Inicio</h2>' +
      '<article class="card hero"><div class="hero-l">' + ringHTML(planned ? Math.round(done / planned * 100) : 0) +
      '</div><div class="hero-r"><p class="lbl">Esta semana</p><p class="big">' + done + '/' + planned + ' <small>días</small></p>' +
      '<p class="meta">Hoy: ' + esc(info.name) + '</p></div>' +
      '<button class="wide" data-a="startTraining">' + cta + '</button></article>' +
      '<article class="card"><h3>Peso</h3><div class="stats3">' +
      '<div><small>Inicial</small><b>' + start + '</b></div><div><small>Actual</small><b>' + cur + '</b></div><div><small>Meta</small><b>' + (tgt || '—') + '</b></div></div>' +
      (tgt ? '<div class="pbar"><i style="width:' + pct + '%"></i></div><p class="meta">' + pct + '% del camino · ' + (cur > tgt ? 'faltan ' + (Math.round((cur - tgt) * 10) / 10) + ' kg' : 'meta alcanzada') + '</p>' : '<p class="meta">Define tu peso objetivo en Ajustes.</p>') +
      '<p class="meta">Objetivo: ' + esc(TW.GOALS[p.goal] || '') + ' · ' + (p.days || 4) + ' días/semana · ' + (p.minutes || 20) + ' min por sesión</p></article>' +
      '<article class="card"><h3>Tiempo entrenado</h3><div class="wkgrid">' + cols + '</div>' +
      '<p class="meta"><b>' + total + ' min</b> esta semana' + (planTot ? ' · plan ' + planTot + (xTot ? ' · <b class="xt2">+' + xTot + ' min extra</b>' : '') : '') + (last ? ' · semana pasada ' + last + ' min (' + (diff >= 0 ? '+' : '') + diff + ')' : '') + '</p></article>' +
      sleepCardHTML() + muscleChartHTML() + quoteHTML() +
      '<div class="row"><a class="ghost linkbtn" href="#ruta">Ver ruta</a><a class="ghost linkbtn" href="#semana">Editar semana</a></div></section>';
  }

  /* ---------- Tarjeta de sueño (Inicio) ---------- */
  function skyHTML() {
    var A = [[0, '#0a0f2c'], [5, '#1b2250'], [6, '#e8895a'], [7, '#7fc0ee'], [12, '#4aa3e6'], [17, '#7fb2e0'], [18, '#e0714e'], [19, '#3b2f5e'], [20, '#0a0f2c'], [24, '#0a0f2c']];
    var kt = A.map(function (a) { return (a[0] / 24).toFixed(3); }).join(';'), cols = A.map(function (a) { return a[1]; }).join(';');
    var arc = function (f) { return [Math.round(20 + 280 * f), Math.round(88 - 62 * Math.sin(Math.PI * f))]; };
    var sunV = [], moonV = [], t = [];
    for (var h = 0; h <= 24; h++) {
      t.push((h / 24).toFixed(4));
      var fs = (h - 6) / 12, fm = (((h - 18) % 24) + 24) % 24 / 12;
      sunV.push(fs >= 0 && fs <= 1 ? arc(fs).join(' ') : (h < 6 ? '20 125' : '300 125'));
      moonV.push(fm >= 0 && fm <= 1 ? arc(fm).join(' ') : (fm < 0 ? '20 125' : '300 125'));
    }
    var now = new Date(), off = -((now.getHours() + now.getMinutes() / 60) / 24 * 16).toFixed(2), dur = '16s';
    var tt = t.join(';'), an = function (attr, vals, k) { return '<animate attributeName="' + attr + '" values="' + vals + '" keyTimes="' + k + '" dur="' + dur + '" begin="' + off + 's" repeatCount="indefinite"/>'; };
    var tr = function (v) { return '<animateTransform attributeName="transform" type="translate" values="' + v.join(';') + '" keyTimes="' + tt + '" dur="' + dur + '" begin="' + off + 's" repeatCount="indefinite"/>'; };
    var stars = [[30, 14], [70, 30], [110, 12], [150, 26], [190, 10], [230, 32], [270, 16], [300, 34], [50, 48], [210, 52]].map(function (p, i) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.3" fill="#fff"><animate attributeName="opacity" values="1;.35;1" dur="' + (2 + i % 3) + 's" repeatCount="indefinite"/></circle>';
    }).join('');
    return '<svg class="skyw" viewBox="0 0 320 110" role="img" aria-label="Animación de día y noche"><rect width="320" height="110" fill="#0a0f2c">' + an('fill', cols, kt) + '</rect>' +
      '<g>' + stars + an('opacity', '1;1;0;0;0;1;1', '0;.2;.27;.5;.73;.8;1') + '</g>' +
      '<g><g><circle r="22" fill="#ffd25e" opacity=".25"/><circle r="11" fill="#ffd25e"/>' + tr(sunV) + '</g></g>' +
      '<g><g><circle r="9" fill="#e9ecff"/><circle cx="-3" cy="-2" r="2" fill="#c9cdee"/><circle cx="3" cy="3" r="1.5" fill="#c9cdee"/>' + tr(moonV) + '</g></g>' +
      '<path d="M0 98 Q60 84 120 95 T240 92 T320 96 V110 H0Z" fill="#0f1014"/></svg>';
  }
  function fmtDur(m) { return Math.floor(m / 60) + ' h ' + (m % 60 ? (m % 60) + ' min' : ''); }
  function sleepGoalText(r) {
    var out = [];
    out.push(r.avgH >= 7 ? 'Con ' + r.avgH + ' h de promedio estás en el rango recomendado (7 h o más). Para tu meta de bajar grasa sin perder músculo, es el mínimo que conviene sostener: en un ensayo con dieta hipocalórica, dormir 5,5 h en vez de 8,5 h redujo 55 % la grasa perdida y aumentó 60 % la masa magra perdida (estudio pequeño, 10 personas).'
      : 'Tu promedio de ' + r.avgH + ' h está bajo las 7 h recomendadas. Dormir poco frena la pérdida de grasa y favorece perder músculo cuando hay déficit de calorías (ensayo pequeño de 10 personas). Acerca tu hora de dormir 15–30 min por semana.');
    if (r.circ) out.push(r.circ.label === 'Alineado' ? 'Tus horarios son regulares: eso ayuda a fijar tu ritmo circadiano. En un estudio con 60 000 personas, la regularidad predijo mejor la mortalidad que la duración.' : 'Tus horarios varían: lo que más corrige el ritmo circadiano es acostarte y levantarte a la misma hora (±30 min), también en fin de semana, y recibir luz natural al despertar.');
    else out.push('Registra al menos 3 noches para medir la regularidad de tu ritmo circadiano.');
    return out.map(function (t) { return '<p class="meta">' + t + '</p>'; }).join('');
  }
  function sleepCardHTML() {
    var arr = S.sleep || [], d = today(), cur = arr.filter(function (x) { return x.date === d; })[0] || {}, r = TW.sleepScore(arr), res = '';
    if (r) {
      var isToday = r.last.date === d;
      var bars = r.parts.map(function (p) { return p.v == null ? '' : '<div class="ms"><span>' + p.k + '</span><div class="pbar small"><i style="width:' + p.v + '%"></i></div><b>' + p.v + '</b></div>'; }).join('');
      var mx = Math.max(600, r.series.reduce(function (a, x) { return Math.max(a, x.durMin); }, 0)), nb = r.series.map(function (x) {
        var ok = x.durMin >= 420 && x.durMin <= 540;
        return '<div class="slb"><i class="' + (ok ? 'ok' : '') + '" style="height:' + Math.round(x.durMin / mx * 100) + '%"></i><small>' + x.date.slice(8) + '</small></div>';
      }).join('');
      res = '<div class="slres"><div class="slbig"><small>' + (isToday ? 'Anoche' : 'Última noche · ' + r.last.date.slice(5)) + '</small><b>' + fmtDur(r.durMin) + '</b>' +
        '<span class="pill sl ' + r.label.toLowerCase() + '">Calidad ' + r.label + ' · ' + r.score + '</span></div>' +
        (r.circ ? '<p class="circ ' + (r.circ.label === 'Alineado' ? 'ok' : r.circ.label === 'En ajuste' ? 'mid' : 'bad') + '">Ritmo circadiano: <b>' + r.circ.label + '</b> (' + r.circ.score + '/100)</p>' : '<p class="meta">Ritmo circadiano: registra 3 noches para medirlo.</p>') +
        bars + '<p class="lbl">Últimas noches (verde = 7–9 h)</p><div class="slbars">' + nb + '</div>' +
        '<p class="lbl">Tu aporte al objetivo</p>' + sleepGoalText(r) +
        '<p class="meta"><em>Estimación orientativa a partir de lo que registras (duración, regularidad, horario y cómo te sentiste); no es un diagnóstico.</em></p></div>';
    }
    return '<article class="card sleepcard"><h3>Sueño</h3>' + skyHTML() +
      '<div class="grid2"><label class="field">Me acosté<input type="time" id="sleepBed" value="' + (cur.bed || '') + '"></label>' +
      '<label class="field">Me levanté<input type="time" id="sleepWake" value="' + (cur.wake || '') + '"></label></div>' +
      '<label class="field">Cómo me sentí al despertar<select id="sleepQ"><option value="1"' + (cur.q === 1 ? ' selected' : '') + '>Mal</option><option value="3"' + (cur.q == null || cur.q === 3 ? ' selected' : '') + '>Regular</option><option value="5"' + (cur.q === 5 ? ' selected' : '') + '>Bien</option></select></label>' +
      '<button class="wide" data-a="saveSleep">' + (cur.bed ? 'Actualizar sueño de hoy' : 'Registrar sueño') + '</button>' + res +
      '<details class="srcbox"><summary>Fuentes</summary><ul class="plain">' +
      '<li><a href="https://pubmed.ncbi.nlm.nih.gov/25979105/" target="_blank" rel="noopener">AASM y SRS 2015: 7 h o más de sueño regular</a></li>' +
      '<li><a href="https://pubmed.ncbi.nlm.nih.gov/20921542/" target="_blank" rel="noopener">Nedeltcheva 2010: sueño insuficiente y pérdida de grasa</a></li>' +
      '<li><a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10782501/" target="_blank" rel="noopener">Windred 2024: regularidad del sueño y mortalidad</a></li></ul></details></article>';
  }

  /* ---------- HOY ---------- */
  /* Título con el nombre en inglés y el español en letra pequeña. */
  function exTitle(e) {
    return esc(TW.exName(e)) + (TW.EX_EN[e.id] ? ' <small class="es">' + esc(e.name) + '</small>' : '');
  }
  function ringHTML(pct) {
    var r = 28, c = 2 * Math.PI * r;
    return '<div class="ring"><svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">' +
      '<circle cx="36" cy="36" r="' + r + '" fill="none" stroke="#2a2a2e" stroke-width="7"/>' +
      '<circle cx="36" cy="36" r="' + r + '" fill="none" stroke="var(--gold)" stroke-width="7" stroke-linecap="round" ' +
      'stroke-dasharray="' + (c * pct / 100).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 36 36)"/></svg>' +
      '<b>' + pct + '%</b></div>';
  }
  function renderToday() {
    if (run) { renderRun(); return; }
    var ti = todayIdx();
    if (selDay == null) selDay = ti;
    var info = TW.dayInfo(S, S.week[selDay]);
    var canLog = selDay === ti;
    var total = info.exs.reduce(function (s, e) { return s + (e.type === 'fuerza' ? e.sets : 1); }, 0);
    var done = info.exs.reduce(function (s, e) { return s + doneCount(e); }, 0);
    var pct = total ? Math.round(done / total * 100) : 0;
    var dows = TW.DOW.map(function (d, i) {
      return '<button class="dow' + (i === selDay ? ' sel' : '') + '" data-a="selDay" data-d="' + i + '" aria-label="' + d + (i === ti ? ' (hoy)' : '') + '">' +
        d + (i === ti ? '<i class="today-dot"></i>' : '') + '</button>';
    }).join('');
    var body = info.exs.length
      ? overviewHTML(info) + ringHTML(pct) + '<p class="meta">' + done + '/' + total + ' series completadas' + (canLog ? '' : ' · solo puedes registrar el día de hoy') + '</p>' +
        rowsHTML(info.exs, canLog) + extrasHTML(info) +
        (canLog ? timeCardHTML(canLog) : '') +
        '<button class="wide" data-a="finishDay" data-d="' + selDay + '"' + (canLog ? '' : ' disabled') + '>Terminar día</button>'
      : restDayHTML();
    view.innerHTML = '<section class="page"><nav class="dows">' + dows + '</nav>' +
      '<h2 class="title">' + esc(info.name) + '</h2>' +
      '<p class="sub">' + (info.groups.map(function (g) { return TW.MUSCLES[g]; }).join(' · ') || 'Sin entrenamiento programado') + '</p>' +
      minCardHTML() + (info.exs.length ? warmupHTML() : '') + body + '</section>';
  }
  function minCardHTML() {
    var p = S.profile || {}, wk = TW.weekKey(today());
    if (p.minCheck === wk) return '';
    var mins = p.minutes || 20;
    return '<article class="card"><h3>Revisión semanal</h3>' +
      '<p class="meta">Tus sesiones están en ' + mins + ' min. ¿Subimos 5 min esta semana? Si dices no, se mantiene la rutina.</p>' +
      '<div class="grid2"><button class="wide" data-a="minUp"' + (mins >= 60 ? ' disabled' : '') + '>Sí, +5 min</button>' +
      '<button class="ghost" data-a="minKeep">No, mantener</button></div></article>';
  }
  function photosHTML() {
    var ph = S.photos || [], last = ph[ph.length - 1];
    var days = last ? Math.floor((TW.parseYmd(today()) - TW.parseYmd(last.date)) / 86400000) : null;
    var due = !last || days >= 28;
    var msg = !last ? 'Aún no hay fotos. Toma la primera: de frente, misma luz y misma distancia.'
      : due ? 'Han pasado ' + days + ' días: toca tu foto de progreso (cada 4 semanas).'
      : 'Última foto hace ' + days + ' días. La próxima toca en ' + (28 - days) + ' días.';
    var cmp = ph.length >= 2 ? '<div class="grid2"><figure><img class="preview" src="' + ph[0].data + '" alt="Primera foto"><figcaption class="meta">Inicio · ' + ph[0].date + '</figcaption></figure>' +
      '<figure><img class="preview" src="' + last.data + '" alt="Última foto"><figcaption class="meta">Última · ' + last.date + '</figcaption></figure></div>' : (last ? '<img class="preview" src="' + last.data + '" alt="Foto">' : '');
    return '<div class="card"><h3>Fotos de progreso</h3><p class="meta">' + msg + '</p>' + cmp +
      '<label class="field">' + (due ? 'Tomar foto ahora' : 'Añadir foto') + '<input type="file" id="progPhoto" accept="image/*" capture="user"></label>' +
      '<p class="meta">La app guarda y compara las fotos en tu teléfono; no las analiza. Para una valoración, sube la foto a Claude junto con tu peso y cintura de ese día.</p></div>';
  }
  function addProgPhoto(file) {
    if (!file) return;
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var w = 480, h = Math.round(img.height * w / img.width), c = document.createElement('canvas');
      c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      S.photos = (S.photos || []).concat([{ date: today(), data: c.toDataURL('image/jpeg', 0.7) }]);
      save(); toast('Foto guardada'); renderProgress();
    };
    img.onerror = function () { toast('No se pudo leer la foto'); };
    img.src = url;
  }
  function warmItems(list) {
    return TW.lowImpact(S) ? list.filter(function (t) { return !/trote|salto/i.test(t); }) : list;
  }
  function warmupHTML() {
    return '<details class="card"><summary><b>Calentamiento</b> <small>~5–10 min · antes de empezar</small></summary><div class="grid2">' +
      '<div><p class="lbl">En casa</p>' + warmItems(TW.WARMUP.casa).map(function (t) { return '<label class="check"><input type="checkbox"> ' + esc(t) + '</label>'; }).join('') + '</div>' +
      '<div><p class="lbl">Espacio abierto</p>' + warmItems(TW.WARMUP.abierto).map(function (t) { return '<label class="check"><input type="checkbox"> ' + esc(t) + '</label>'; }).join('') + '</div>' +
      '</div></details>';
  }
  function startLoadsHTML() {
    var exp = (S.profile && S.profile.exp) || 'principiante';
    var rows = ['mancuernas', 'barra', 'kettlebell'].map(function (k) {
      var x = S.equipment[k] || { loads: [] };
      var loads = (x.loads && x.loads.length) ? x.loads : (TW.PRESET_LOADS[k] || []);
      var v = TW.startLoad(loads, exp);
      if (v == null) return '';
      var txt = k === 'barra' ? v + ' kg totales (sin peso de la barra)' : v + ' kg' + (k === 'mancuernas' ? ' por mancuerna' : '');
      return '<li>' + TW.EQUIPMENT[k] + ': ' + txt + '</li>';
    }).join('');
    return '<div class="card"><p class="lbl">Carga inicial sugerida · ' + TW.EXP[exp].label + '</p><ul class="plain">' + rows + '</ul>' +
      '<p class="meta">Punto de partida orientativo. Ajusta con la doble progresión tras 1–2 sesiones.</p></div>';
  }
  function doneCount(e) {
    var L = getLog(today(), e.id);
    if (!L) return 0;
    if (e.type === 'fuerza') return L.sets.filter(Boolean).length;
    if (e.type === 'cardio') return L.cardio ? 1 : 0;
    return L.flexDone ? 1 : 0;
  }
  function restDayHTML() {
    var flex = S.status ? TW.allEx(S).filter(function (e) { return e.type === 'flex' && TW.status(S, e.id) === 'activo'; }) : [];
    return '<article class="card"><h3>Descanso activo</h3><p class="note"><em>Recuperación sin carga: el cuerpo se adapta al descanso.</em></p>' +
      '<ul class="plain"><li>Caminata suave de 20–30 min.</li><li>Hidratación y sueño de calidad.</li></ul><button class="wide ghost" data-a="openPicker">+ Añadir ejercicio</button>' +
      (flex.length ? '<p class="lbl">Movilidad activa</p>' + flex.map(function (e) {
        return '<div class="pos"><span>' + esc(e.name) + '</span><button data-a="flexTimer" data-sec="' + e.positions[0].sec + '">▶ ' + e.positions[0].sec + ' s</button></div>';
      }).join('') : '<p class="meta">Activa ejercicios de flexibilidad en Biblioteca para verlos aquí.</p>') + '</article>';
  }
  function exCard(e, canLog) {
    if (e.type === 'cardio') return cardioCard(e, canLog);
    if (e.type === 'flex') return flexCard(e);
    return strengthCard(e, canLog);
  }
  function strengthCard(e, canLog) {
    var date = today(), L = getLog(date, e.id), sug = TW.suggest(S, e, date);
    var sets = [], filled = 0;
    for (var i = 0; i < e.sets; i++) { var s = L && L.sets[i]; sets.push(s || null); if (s) filled++; }
    var pct = Math.round(filled / e.sets * 100);
    var tgt = e.ladder ? TW.target(S, e) : null;
    var needLoad = e.prog === 'carga' && !TW.loadsFor(S, e).length
      ? '<p class="warn">Configura las cargas de tu equipo en Ajustes.</p>' : '';
    return '<article class="card" data-ex="' + e.id + '">' +
      '<div class="card-h"><div><h3>' + exTitle(e) + '</h3><small class="step">' + muscleNames(e) + '</small>' +
      (tgt ? '<small class="step">Paso ' + (tgt.step + 1) + '/' + tgt.total + ': ' + esc(tgt.name) + '</small>' : '') +
      '</div>' + infoBtn(e) + '</div>' +
      '<p class="reps">' + repLabel(e, sug) + '</p>' + needLoad +
      '<div class="sets">' + sets.map(function (s, k) {
        return '<button class="set' + (s ? ' done' : '') + '" data-a="logSet" data-ex="' + e.id + '" data-i="' + k + '"' +
          (canLog ? '' : ' disabled') + ' aria-label="Serie ' + (k + 1) + (s ? ': ' + s.reps + ' repeticiones' : '') + '">' + (s ? s.reps : k + 1) + '</button>';
      }).join('') + '</div>' +
      '<div class="row"><button class="ghost" data-a="rest" data-s="' + e.rest + '">Descanso ' + TW.fmt(e.rest) + '</button>' +
      '<button class="ghost' + (L && L.clean ? ' on' : '') + '" data-a="clean" data-ex="' + e.id + '"' + (canLog ? '' : ' disabled') + '>Técnica limpia' + (L && L.clean ? ' ✓' : '') + '</button></div>' +
      '</article>';
  }
  function cardioCard(e, canLog) {
    var L = getLog(today(), e.id), c = L && L.cardio;
    return '<article class="card cardio" data-ex="' + e.id + '">' +
      '<div class="card-h"><div><h3>' + exTitle(e) + '</h3><small class="step">Duración objetivo: ' + e.minutes + ' min</small></div>' + infoBtn(e) + '</div>' +
      '<form class="grid2" data-cardio="' + e.id + '">' +
      '<label>Distancia (km)<input type="number" step="0.01" min="0" name="km" value="' + (c && c.km != null ? c.km : '') + '"' + (canLog ? '' : ' disabled') + '></label>' +
      '<label>Tiempo (min)<input type="number" step="0.5" min="0" name="min" value="' + (c && c.min != null ? c.min : '') + '"' + (canLog ? '' : ' disabled') + '></label>' +
      '<label>RPE (1–10)<input type="number" min="1" max="10" name="rpe" value="' + (c && c.rpe != null ? c.rpe : '') + '"' + (canLog ? '' : ' disabled') + '></label>' +
      '<label>FC media (opcional)<input type="number" min="30" max="230" name="hr" value="' + (c && c.hr != null ? c.hr : '') + '"' + (canLog ? '' : ' disabled') + '></label>' +
      '</form>' +
      (c ? '<p class="blue">Ritmo: ' + esc(c.pace || '—') + (c.zone ? ' · ' + esc(c.zone) : '') + '</p>' : '') +
      '<button class="ghost" data-a="saveCardio" data-ex="' + e.id + '"' + (canLog ? '' : ' disabled') + '>Guardar sesión</button>' +
      '</article>';
  }
  function flexCard(e) {
    var p = TW.progOf(S, e), st = p.stage || 0;
    var canLog = selDay === todayIdx();
    var L = getLog(today(), e.id);
    return '<article class="card flex" data-ex="' + e.id + '">' +
      '<div class="card-h"><div><h3>' + exTitle(e) + '</h3><small class="step blue">Etapa ' + (st + 1) + '/4: ' + TW.STAGES[st] + '</small></div>' + infoBtn(e) + '</div>' +
      e.positions.map(function (ps) {
        return '<div class="pos"><span>' + esc(ps.name) + '</span><button class="ghost" data-a="flexTimer" data-sec="' + ps.sec + '">▶ ' + ps.sec + ' s</button></div>';
      }).join('') +
      '<p class="meta">Sesiones en esta etapa: ' + (p.flexCount || 0) + '/2 · avanza tras 2 sesiones completas</p>' +
      '<button class="ghost' + (L && L.flexDone ? ' on' : '') + '" data-a="flexDone" data-ex="' + e.id + '"' + (canLog ? '' : ' disabled') + '>' + (L && L.flexDone ? 'Sesión registrada ✓' : 'Marcar sesión completada') + '</button>' +
      '</article>';
  }

  /* Registro de serie: peso (1 toque), repeticiones prellenadas y guardar (1 toque). */
  function openSetSheet(exId, idx) {
    var e = TW.getEx(S, exId), date = today(), L = getLog(date, exId);
    var cur = L && L.sets[idx], sug = TW.suggest(S, e, date);
    sheetCtx = {
      exId: exId, idx: idx,
      reps: cur ? cur.reps : (sug.reps != null ? sug.reps : e.range[0]),
      load: cur ? cur.load : (sug.load != null ? sug.load : null),
      rpe: cur && cur.rpe != null ? cur.rpe : null
    };
    renderSetSheet(e);
  }
  function renderSetSheet(e) {
    var c = sheetCtx, loads = TW.loadsFor(S, e);
    openSheet('<h3>' + esc(e.name) + ' · Serie ' + (c.idx + 1) + '</h3>' +
      (loads.length ? '<p class="lbl">Peso (kg)</p><div class="chips">' + loads.map(function (v) {
        return '<button class="chip' + (v === c.load ? ' on' : '') + '" data-a="pickLoad" data-v="' + v + '">' + v + '</button>';
      }).join('') + '</div>' : '') +
      '<p class="lbl">' + (e.prog === 'tiempo' ? 'Segundos' : 'Repeticiones') + '</p>' +
      '<div class="stepper"><button data-a="rep" data-d="-1" aria-label="Menos">−</button><output aria-live="polite">' + c.reps + '</output><button data-a="rep" data-d="1" aria-label="Más">+</button></div>' +
      '<button class="ghost" data-a="tapRep">+1 repetición</button>' +
      '<p class="lbl">RPE (opcional)</p><div class="chips">' + [6, 7, 8, 9, 10].map(function (v) {
        return '<button class="chip' + (v === c.rpe ? ' on' : '') + '" data-a="pickRpe" data-v="' + v + '">' + v + '</button>';
      }).join('') + '</div>' +
      '<button class="wide" data-a="saveSet">Guardar serie</button>');
  }
  function saveSet() {
    var c = sheetCtx, e = TW.getEx(S, c.exId), L = getLog(today(), e.id, true);
    var isNew = !L.sets[c.idx];
    L.sets[c.idx] = { reps: c.reps, load: c.load, rpe: c.rpe };
    for (var i = 0; i < e.sets; i++) { if (L.sets[i] === undefined) L.sets[i] = null; }
    touchSession(); save(); closeSheet(); renderToday(); toast('Serie guardada');
    if (isNew && e.rest) startTimer(e.rest, 'Descanso');
  }
  function saveCardio(id) {
    var e = TW.getEx(S, id), f = view.querySelector('form[data-cardio="' + id + '"]');
    var v = collect(f), km = Number(v.km) || 0, min = Number(v.min) || 0;
    var pace = fmtPace(e, km, min);
    var L = getLog(today(), id, true);
    L.cardio = { km: km, min: min, rpe: Number(v.rpe) || null, hr: Number(v.hr) || null, pace: pace,
      zone: TW.hrZone(Number(v.hr), S.profile.age) };
    touchSession(); save(); renderToday(); toast('Sesión guardada' + (pace ? ' · ' + pace : ''));
  }
  function flexDone(id) {
    var e = TW.getEx(S, id), p = TW.progOf(S, e), L = getLog(today(), id, true);
    if (L.flexDone) { toast('Ya registraste esta sesión hoy'); return; }
    L.flexDone = true;
    p.flexCount = (p.flexCount || 0) + 1;
    var msg = 'Sesión registrada';
    if (p.flexCount >= 2) {
      p.stage = Math.min(3, (p.stage || 0) + 1); p.flexCount = 0;
      msg = 'Etapa avanzada: ' + TW.STAGES[p.stage];
    }
    touchSession(); save(); renderToday(); toast(msg);
  }
  function finishDay() {
    var info = TW.dayInfo(S, S.week[selDay]), date = today(), msgs = [];
    info.exs.forEach(function (e) {
      if (e.type !== 'fuerza') return;
      var L = getLog(date, e.id);
      if (L && L.sets.some(Boolean) && !L.evaluated) {
        L.evaluated = true;
        var r = TW.evaluateLadder(S, e, L);
        if (r && r.advanced) msgs.push(e.name + ' → ' + r.to);
      }
    });
    var ss = (S.sess || {})[date], nw = Date.now();
    if (ss && nw - ss.e <= 10 * 60000) ss.e = nw;
    save(); renderToday();
    toast(msgs.length ? 'Escalera avanzada: ' + msgs.join('; ') : 'Día terminado');
  }

  /* ---------- SEMANA ---------- */
  var wkSel = null;
  function dayPanelHTML(i) {
    var d = S.week[i], inf = TW.dayInfo(S, d), ti = todayIdx(), date = weekDates(0)[i];
    var mins = inf.exs.reduce(function (a, e) { return a + estMin(e); }, 0);
    var head = '<div class="dphead"><div><small>' + TW.DOW_FULL[i] + (i === ti ? ' · hoy' : '') + '</small><h3>' + esc(inf.name) + '</h3></div>' +
      (inf.exs.length ? '<div class="chips2"><span class="pill">~' + mins + ' min</span><span class="pill">' + inf.exs.length + ' ej.</span></div>' : '') + '</div>';
    if (!inf.exs.length) {
      return head + '<div class="restfig"><p class="meta">Día de recuperación: caminata suave, movilidad e hidratación. Si quieres, suma un ejercicio.</p></div>' +
        '<div class="grid2"><button data-a="openPicker" data-d="' + i + '">+ Añadir ejercicio</button><button class="ghost" data-a="editDay" data-d="' + i + '">Editar día</button></div>';
    }
    var rows = orderedExs(inf.exs).map(function (e, k) {
      return '<div class="wrow"><span class="xn">' + (k + 1) + '</span><span class="xt"><b>' + esc(TW.exName(e)) + (isExtra(date, e.id) ? ' <span class="pill ex">Extra</span>' : '') + '</b>' +
        '<small>' + esc(muscleNames(e)) + '</small></span><span class="xm">' + exSub(e) + '<small>~' + estMin(e) + ' min</small></span>' +
        '<button class="ghost sm" data-a="rmEx" data-ex="' + e.id + '" aria-label="Quitar">✕</button></div>';
    }).join('');
    return head + '<div class="runfig">' + bsvg(inf.groups, 'big') + '</div>' + '<div class="wlist">' + rows + '</div>' +
      '<div class="grid2"><button data-a="openPicker" data-d="' + i + '">+ Añadir</button><button class="ghost" data-a="editDay" data-d="' + i + '">Editar día</button></div>' +
      (i === ti ? '<button class="wide ghost" data-a="goDay" data-d="' + i + '">Entrenar hoy →</button>' : '');
  }
  function selectWeekDay(i) {
    wkSel = i;
    document.querySelectorAll('.wkt').forEach(function (t) { t.classList.toggle('sel', Number(t.dataset.d) === i); });
    var pn = $('#wkPanel'); if (!pn) return;
    pn.classList.remove('enter'); pn.innerHTML = dayPanelHTML(i); void pn.offsetWidth; pn.classList.add('enter');
  }
  function renderWeek() {
    var ti = todayIdx(), v = TW.validateWeek(S, S.week);
    if (wkSel == null) wkSel = ti;
    var tiles = S.week.map(function (d, i) {
      var inf = TW.dayInfo(S, d), m = inf.exs.reduce(function (a, e) { return a + estMin(e); }, 0);
      return '<button class="wkt' + (i === wkSel ? ' sel' : '') + (inf.exs.length ? '' : ' off') + (i === ti ? ' today' : '') + '" data-a="wkSel" data-d="' + i + '" aria-label="' + TW.DOW_FULL[i] + '">' +
        '<b>' + TW.DOW[i] + '</b>' + bsvg(inf.groups, 'mini') + '<small>' + (inf.exs.length ? m + "'" : '—') + '</small></button>';
    }).join('');
    var nw = v.block.length + v.warn.length;
    var total = S.week.reduce(function (a, d) { return a + TW.dayInfo(S, d).exs.reduce(function (x, e) { return x + estMin(e); }, 0); }, 0);
    var days = S.week.filter(function (d) { return d.exs.length; }).length;
    view.innerHTML = '<section class="page"><div class="wkhead"><div><h2 class="title">Semana</h2><p class="sub">' + days + ' días · ~' + total + ' min</p></div>' +
      '<button class="ghost sm" data-a="suggest">Sugerir semana</button></div>' +
      '<div class="wktiles">' + tiles + '</div>' +
      (nw ? '<details class="warnbox"><summary>⚠ ' + nw + ' aviso' + (nw > 1 ? 's' : '') + '</summary>' + warnHTML(v.block, 'err') + warnHTML(v.warn) + '</details>' : '') +
      '<article class="card dpanel enter" id="wkPanel">' + dayPanelHTML(wkSel) + '</article></section>';
  }
  function openDayEditor(i) {
    var day = S.week[i];
    var list = TW.allEx(S).filter(function (e) { return TW.status(S, e.id) === 'activo' && TW.hasEquip(S, e); });
    var avail = TW.allEx(S).filter(function (e) { return TW.status(S, e.id) === 'disponible' && TW.hasEquip(S, e); });
    openSheet('<h3>' + TW.DOW[i] + ' · Editar día</h3><p class="sub">Solo aparecen ejercicios activos y con tu equipo.</p>' +
      '<div class="checks">' + (list.map(function (e) {
        return '<label class="check"><input type="checkbox" data-group="dayex" value="' + e.id + '"' + (day.exs.indexOf(e.id) >= 0 ? ' checked' : '') + '> ' +
          esc(e.name) + ' <small>' + TW.PATTERNS[e.pattern] + '</small></label>';
      }).join('') || '<p class="meta">No tienes ejercicios activos. Actívalos en Biblioteca.</p>') + '</div>' +
      (avail.length ? '<p class="meta">Disponibles para activar en Biblioteca: ' + avail.map(function (e) { return esc(e.name); }).join(', ') + '</p>' : '') +
      '<div id="dayMsg"></div><button class="wide" data-a="saveDay" data-d="' + i + '">Guardar día</button>');
  }
  function saveDay(i) {
    var sel = Array.from($('#sheetBody').querySelectorAll('input[data-group="dayex"]:checked')).map(function (x) { return x.value; });
    var valid = sel.filter(function (id) {
      var e = TW.getEx(S, id);
      return e && TW.status(S, id) === 'activo' && TW.hasEquip(S, e);
    });
    var nw = S.week.map(function (d, k) { return { exs: k === i ? valid : d.exs.slice() }; });
    var v = TW.validateWeek(S, nw);
    if (v.block.length) { $('#dayMsg').innerHTML = warnHTML(v.block, 'err'); return; }
    var others = [].concat.apply([], S.week.map(function (d, k) { return k === i ? [] : d.exs; }));
    var dup = valid.filter(function (id) { return others.indexOf(id) >= 0; }).map(function (id) { return TW.getEx(S, id).name; });
    if (dup.length && !confirm('Repites en otro día: ' + dup.join(', ') + '. ¿Confirmas el mismo volumen?')) return;
    S.week = nw; save(); closeSheet(); renderWeek(); toast('Día guardado');
  }
  function applySuggestion() {
    if (!confirm('Reemplazar la semana actual por la propuesta de la app?')) return;
    var w = TW.proposeWeek(S);
    w.forEach(function (d) { d.exs.forEach(activate); });
    S.week = w; save(); renderWeek(); toast('Propuesta aplicada');
  }

  /* ---------- RUTA ---------- */
  function renderRoad() {
    if (!S.phases.length) { S.phases = TW.defaultPhases(S); save(); }
    var startW = (S.body[0] && S.body[0].kg) || S.profile.weight;
    view.innerHTML = '<section class="page"><h2 class="title">Hoja de ruta</h2>' +
      '<div class="card info"><h3>Cómo llegar al fallo</h3>' +
      '<p>Fallo técnico: la última repetición sale con técnica limpia y no podrías hacer otra sin perderla.</p>' +
      '<ol class="plain"><li>Elige el escalón o carga de la serie.</li><li>Haz repeticiones con técnica constante.</li>' +
      '<li>Deja de hacerlas cuando te queden 3 (fase base), 1–2 (construcción) o 0–1 (consolidación) repeticiones en reserva.</li>' +
      '<li>Repite el objetivo en dos sesiones seguidas antes de subir.</li></ol></div>' +
      S.phases.map(function (p) {
        var pr = TW.phaseProgress(S, p);
        var ms = milestones(p, startW);
        var okMs = ms.length ? ms.every(function (m) { return m.pct >= 80; }) : true;
        var ready = pr.pct >= 85 && okMs;
        return '<article class="card phase"><div class="card-h"><div><h3>' + esc(p.name) + '</h3>' +
          '<small class="step">' + p.months + ' meses · ' + TW.GOALS[p.goal] + ' · ' + p.sessions + ' días/semana</small></div>' +
          '<button class="ghost" data-a="editPhase" data-id="' + p.id + '">Editar</button></div>' +
          '<p class="note"><em>Criterio para avanzar: ' + esc(p.criteria) + '</em></p>' +
          '<p class="meta">Asistencia: ' + pr.done + '/' + pr.planned + ' sesiones (' + pr.pct + '%)</p>' +
          '<div class="pbar small"><i style="width:' + pr.pct + '%"></i></div>' +
          ms.map(function (m) {
            return '<div class="ms"><span>' + esc(m.label) + ': ' + m.cur + ' / ' + m.tgt + '</span><div class="pbar small"><i style="width:' + m.pct + '%"></i></div></div>';
          }).join('') +
          '<p class="meta">' + (ready ? '<b class="ok">Listo para la siguiente fase</b>' : 'Aún no cumples los criterios de avance') + '</p>' +
          calendarHTML(p) + '</article>';
      }).join('') + '</section>';
  }
  function milestones(p, startW) {
    var t = p.targets || {}, out = [];
    var pct = function (cur, tgt, down) {
      if (!tgt) return 0;
      if (down) { if (cur <= tgt) return 100; var span = startW - tgt; return span > 0 ? Math.max(0, Math.min(100, Math.round((startW - cur) / span * 100))) : 0; }
      return Math.min(100, Math.round(cur / tgt * 100));
    };
    if (p.goal === 'calistenia') {
      out.push({ label: 'Dominadas limpias', cur: TW.metric(S, 'dominadas'), tgt: t.dominadas });
      out.push({ label: 'Flexiones pies elevados', cur: TW.metric(S, 'pies'), tgt: t.pies });
    }
    if (p.goal === 'resistencia') out.push({ label: 'Bici: km en una sesión', cur: TW.metric(S, 'bici'), tgt: t.bici });
    if (p.goal === 'flexibilidad') out.push({ label: 'Sit-and-reach (cm)', cur: TW.metric(S, 'sitreach'), tgt: t.sitreach });
    if (p.goal === 'definicion') out.push({ label: 'Peso corporal (kg)', cur: TW.metric(S, 'peso'), tgt: t.peso, down: true });
    return out.map(function (m) {
      m.pct = pct(m.cur, m.tgt, m.down);
      return m;
    });
  }
  function calendarHTML(p) {
    var n = Math.round(p.months * 4.3), start = TW.parseYmd(p.start), now = new Date(), dates = TW.trainedDates(S);
    var cells = '';
    for (var w = 0; w < n; w++) {
      var ws = TW.addDays(start, 7 * w), we = TW.addDays(ws, 6), done = 0;
      dates.forEach(function (d) { var x = TW.parseYmd(d); if (x >= ws && x <= we) done++; });
      var cls = ws > now ? 'fut' : done >= p.sessions ? 'full' : done > 0 ? 'part' : 'miss';
      cells += '<div class="cell ' + cls + '" title="Semana ' + (w + 1) + ': ' + done + '/' + p.sessions + '"><small>S' + (w + 1) + '</small><b>' + done + '/' + p.sessions + '</b></div>';
    }
    return '<p class="lbl">Calendario de la fase</p><div class="cal">' + cells + '</div>';
  }
  function openPhaseForm(id) {
    var p = S.phases.find(function (x) { return x.id === id; }), t = p.targets;
    openSheet('<h3>Editar fase</h3>' +
      '<label class="field">Nombre<input name="name" value="' + esc(p.name) + '"></label>' +
      '<label class="field">Duración (meses)<select name="months">' + [2, 3, 4].map(function (m) { return '<option value="' + m + '"' + (m === p.months ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label>' +
      '<label class="field">Objetivo prioritario<select name="goal">' + TW.ALL_GOALS.map(function (g) { return '<option value="' + g + '"' + (g === p.goal ? ' selected' : '') + '>' + TW.GOALS[g] + '</option>'; }).join('') + '</select></label>' +
      '<label class="field">Días por semana<input type="number" min="3" max="6" name="sessions" value="' + p.sessions + '"></label>' +
      '<label class="field">Criterio para avanzar<textarea name="criteria" rows="2">' + esc(p.criteria) + '</textarea></label>' +
      '<p class="lbl">Hitos</p>' +
      '<label class="field">Dominadas limpias<input type="number" min="0" name="t_dominadas" value="' + t.dominadas + '"></label>' +
      '<label class="field">Flexiones pies elevados<input type="number" min="0" name="t_pies" value="' + t.pies + '"></label>' +
      '<label class="field">Bici: km en una sesión<input type="number" min="0" step="0.5" name="t_bici" value="' + t.bici + '"></label>' +
      '<label class="field">Sit-and-reach (cm)<input type="number" min="0" name="t_sitreach" value="' + t.sitreach + '"></label>' +
      '<label class="field">Peso objetivo (kg)<input type="number" min="0" step="0.1" name="t_peso" value="' + t.peso + '"></label>' +
      '<button class="wide" data-a="savePhase" data-id="' + id + '">Guardar fase</button>');
  }
  function savePhase(id) {
    var p = S.phases.find(function (x) { return x.id === id; }), v = collect($('#sheetBody'));
    p.name = v.name || p.name; p.months = Number(v.months) || p.months; p.goal = v.goal || p.goal;
    p.sessions = TW.clamp(Number(v.sessions) || p.sessions, 3, 6); p.criteria = v.criteria || p.criteria;
    p.targets = { dominadas: v.t_dominadas, pies: v.t_pies, bici: v.t_bici, sitreach: v.t_sitreach, peso: v.t_peso };
    save(); closeSheet(); renderRoad(); toast('Fase guardada');
  }

  /* ---------- PROGRESO ---------- */
  function lineSVG(series, label) {
    var all = []; series.forEach(function (s) { s.pts.forEach(function (p) { all.push(p.y); }); });
    if (!all.length) return '<p class="meta">Sin datos todavía.</p>';
    var W = 320, H = 150, P = 26, min = Math.min.apply(null, all), max = Math.max.apply(null, all), span = (max - min) || 1;
    var n = Math.max.apply(null, series.map(function (s) { return s.pts.length; }));
    var x = function (i) { return n < 2 ? W / 2 : P + i * (W - 2 * P) / (n - 1); };
    var y = function (v) { return H - P - (v - min) / span * (H - 2 * P); };
    var paths = series.map(function (s) {
      var d = s.pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.y).toFixed(1); }).join(' ');
      return '<path d="' + d + '" class="ln ' + (s.cls || '') + '"/>' + (s.dots ? s.pts.map(function (p, i) {
        return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.y).toFixed(1) + '" r="3.5" class="dot"><title>' + esc(p.x) + ': ' + Math.round(p.y * 10) / 10 + '</title></circle>';
      }).join('') : '');
    }).join('');
    var first = series[0].pts[0] ? series[0].pts[0].x : '', lastPts = series[0].pts, last = lastPts[lastPts.length - 1] ? lastPts[lastPts.length - 1].x : '';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="' + esc(label) + '">' + paths +
      '<text x="' + P + '" y="' + (H - 6) + '" class="ax">' + esc(first) + '</text>' +
      '<text x="' + (W - P) + '" y="' + (H - 6) + '" text-anchor="end" class="ax">' + esc(last) + '</text>' +
      '<text x="4" y="' + (P) + '" class="ax">' + Math.round(max * 10) / 10 + '</text>' +
      '<text x="4" y="' + (H - P) + '" class="ax">' + Math.round(min * 10) / 10 + '</text></svg>';
  }
  function barSVG(items, label) {
    if (!items.length) return '<p class="meta">Sin datos todavía.</p>';
    var W = 320, H = 150, P = 22, max = Math.max.apply(null, items.map(function (i) { return i.v; })) || 1;
    var bw = (W - 2 * P) / items.length;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="' + esc(label) + '">' + items.map(function (it, i) {
      var h = (it.v / max) * (H - 2 * P);
      return '<rect x="' + (P + i * bw + 4).toFixed(1) + '" y="' + (H - P - h).toFixed(1) + '" width="' + (bw - 8).toFixed(1) + '" height="' + h.toFixed(1) + '" class="bar"><title>' + esc(it.l) + ': ' + Math.round(it.v * 10) / 10 + '</title></rect>' +
        '<text x="' + (P + i * bw + bw / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="ax">' + esc(it.l.slice(5)) + '</text>';
    }).join('') + '</svg>';
  }
  function renderProgress() {
    var exIds = Array.from(new Set(S.logs.filter(function (l) { return l.sets && l.sets.some(Boolean); }).map(function (l) { return l.ex; })));
    progSel = exIds.indexOf(progSel) >= 0 ? progSel : exIds[0];
    var pts = S.logs.filter(function (l) { return l.ex === progSel && l.sets && l.sets.some(Boolean); })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; })
      .map(function (l) {
        var best = 0;
        l.sets.forEach(function (s) {
          if (!s) return;
          var v = s.load ? s.load * (1 + s.reps / 30) : s.reps;
          if (v > best) best = v;
        });
        return { x: l.date, y: best };
      });
    var ex = progSel && TW.getEx(S, progSel);
    var weeks = [];
    for (var w = 7; w >= 0; w--) {
      var ws = TW.weekStart(TW.addDays(new Date(), -7 * w)), k = TW.ymd(ws), km = 0;
      S.logs.forEach(function (l) { if (l.cardio && TW.weekKey(l.date) === k) km += Number(l.cardio.km) || 0; });
      weeks.push({ l: k, v: km });
    }
    var body = S.body.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var ma = TW.ma7(body);
    var comp = TW.compliance(S, 4);
    var lw = body.length ? body[body.length - 1].kg : S.profile.weight;
    var pr = S.settings.protein;
    view.innerHTML = '<section class="page"><h2 class="title">Progreso</h2>' +
      '<div class="card"><h3>Por ejercicio</h3>' +
      (exIds.length ? '<select class="full" data-f="progSel" aria-label="Ejercicio">' + exIds.map(function (id) {
        return '<option value="' + id + '"' + (id === progSel ? ' selected' : '') + '>' + esc(TW.getEx(S, id).name) + '</option>';
      }).join('') + '</select>' + lineSVG([{ pts: pts, dots: true }], 'Evolución de ' + (ex ? ex.name : '')) +
      '<p class="meta">' + (ex && ex.type === 'fuerza' && ex.prog === 'carga' ? 'Valor: 1RM estimado (Epley). ' : 'Valor: mejor repetición (o segundos). ') + '</p>'
        : '<p class="meta">Registra series para ver tu evolución.</p>') + '</div>' +
      '<div class="card"><h3>Distancia semanal (km)</h3>' + barSVG(weeks, 'Distancia semanal') + '</div>' +
      '<div class="card"><h3>Peso corporal</h3>' +
      lineSVG([{ pts: body.map(function (b) { return { x: b.date, y: b.kg }; }), dots: true, cls: 'raw' },
        { pts: ma.map(function (m) { return { x: m.date, y: m.v }; }), cls: 'avg' }], 'Peso corporal') +
      '<p class="meta">Línea dorada: promedio móvil de los últimos 7 registros.</p>' +
      '<div class="grid2"><label class="field">Peso (kg)<input type="number" step="0.1" id="bodyKg" value="' + lw + '"></label>' +
      '<label class="field">Cintura (cm, opcional)<input type="number" step="0.5" id="bodyWaist"></label></div>' +
      '<button class="ghost" data-a="saveBody">Registrar peso</button>' +
      '<p class="meta">Proteína objetivo: ' + Math.round(lw * pr[0]) + '–' + Math.round(lw * pr[1]) + ' g/día (' + pr[0] + '–' + pr[1] + ' g/kg)</p></div>' +
      photosHTML() + sleepHTML() +
      '<div class="card"><h3>Cumplimiento (4 semanas)</h3>' + comp.map(function (c) {
        return '<div class="ms"><span>Semana ' + c.start.slice(5) + ': ' + c.done + '/' + c.planned + ' días</span><div class="pbar small"><i style="width:' + c.pct + '%"></i></div></div>';
      }).join('') + '</div>' +
      '<div class="card"><h3>Prueba de flexibilidad</h3><div class="grid2"><label class="field">Sit-and-reach (cm)<input type="number" step="0.5" id="testVal"></label></div>' +
      '<button class="ghost" data-a="saveTest">Guardar prueba</button></div></section>';
  }
  function sleepHTML() {
    var st = TW.sleepStats(S.sleep || []);
    var info = '';
    if (st) {
      info = '<p class="meta">Últimos ' + st.nights + ' registros: promedio ' + st.avgH + ' h; última noche ' + st.lastH + ' h; hora de dormir varía ±' + st.bedSdMin + ' min.</p>' +
        (st.avgH < 7 ? '<p class="note">La AASM recomienda 7 horas o más de forma regular.</p>' : '') +
        (st.bedSdMin > 30 ? '<p class="note">Tu hora de dormir cambia mucho. Criterio práctico: intentar ±30 min.</p>' : '');
    }
    return '<div class="card"><h3>Sueño y ritmo</h3>' +
      '<div class="grid2"><label class="field">Hora de dormir<input type="time" id="sleepBed"></label>' +
      '<label class="field">Hora de despertar<input type="time" id="sleepWake"></label>' +
      '<label class="field">Cómo dormiste<select id="sleepQ"><option value="3">Regular</option><option value="1">Mal</option><option value="5">Bien</option></select></label></div>' +
      '<button class="ghost" data-a="saveSleep">Registrar sueño</button>' + info +
      '<p class="lbl">Buenas prácticas</p><ul class="plain">' +
      '<li>Mantén la misma hora de despertar, incluso los fines de semana.</li>' +
      '<li>Expón los ojos a luz natural en la mañana y evita pantallas y cafeína las horas previas a dormir.</li>' +
      '<li>Ajusta la hora de dormir 15–30 min por semana hasta llegar a 7 h o más.</li>' +
      '</ul>' +
      '<p class="lbl">Cuándo consultar a un médico</p><p class="meta">Con sueño corto y cansancio diurno, conviene revisar apnea del sueño. Consulta si roncas fuerte, notas pausas en la respiración mientras duermes o tienes somnolencia que afecta tu día.</p>' +
      '<p class="lbl">Cuestionario STOP-BANG (marca lo que aplique)</p><div class="checks">' +
      [['snore', 'Ronquido fuerte'], ['tired', 'Cansancio o sueño durante el día'], ['observed', 'Te han visto dejar de respirar al dormir'], ['bp', 'Presión alta (tratada o diagnosticada)'], ['bmi', 'IMC mayor a 35'], ['age', 'Mayor de 50 años'], ['neck', 'Cuello mayor a 40 cm'], ['male', 'Hombre']].map(function (q) {
        return '<label class="check"><input type="checkbox" data-group="stop" value="' + q[0] + '"> ' + q[1] + '</label>';
      }).join('') + '</div><button class="ghost" data-a="stopBang">Calcular riesgo</button>' +
      '<p class="meta">Un puntaje de 3 o más indica riesgo alto de apnea y amerita evaluación médica. Es un cuestionario de cribado, no un diagnóstico.</p>' +
      '</div>';
  }
  function stopBang() {
    var n = view.querySelectorAll('input[data-group="stop"]:checked').length;
    toast('STOP-BANG: ' + n + ' de 8' + (n >= 3 ? '. Riesgo alto: consulta médica para evaluar apnea del sueño.' : '. Riesgo bajo según este cribado.'));
  }
  function saveSleep() {
    var bed = $('#sleepBed').value, wake = $('#sleepWake').value, q = Number($('#sleepQ').value);
    if (!bed || !wake) { toast('Ingresa hora de dormir y de despertar'); return; }
    var d = today();
    S.sleep = (S.sleep || []).filter(function (x) { return x.date !== d; });
    S.sleep.push({ date: d, bed: bed, wake: wake, q: q });
    save(); route(); toast('Sueño registrado');
  }
  function saveBody() {
    var kg = Number($('#bodyKg').value), waist = Number($('#bodyWaist').value) || null;
    if (!(kg > 0)) { toast('Ingresa un peso válido'); return; }
    var d = today();
    S.body = S.body.filter(function (b) { return b.date !== d; });
    S.body.push({ date: d, kg: kg, waist: waist });
    save(); renderProgress(); toast('Peso registrado');
  }
  function saveTest() {
    var v = Number($('#testVal').value);
    if (!isFinite(v)) { toast('Ingresa un valor'); return; }
    S.tests.push({ date: today(), name: 'sitreach', value: v });
    save(); renderProgress(); toast('Prueba guardada');
  }

  /* ---------- BIBLIOTECA ---------- */
  function renderLibrary() {
    var all = TW.allEx(S);
    var shown = all.filter(function (e) {
      var st = TW.status(S, e.id);
      if (st === 'descartado') return false;
      if (libFilter.pat && e.pattern !== libFilter.pat) return false;
      if (libFilter.goal && e.goals.indexOf(libFilter.goal) < 0) return false;
      if (libFilter.mus && e.muscles.indexOf(libFilter.mus) < 0) return false;
      return TW.hasEquip(S, e) || st === 'pausa';
    });
    var discarded = all.filter(function (e) { return TW.status(S, e.id) === 'descartado'; });
    var pats = Object.keys(TW.PATTERNS).map(function (p) {
      return '<option value="' + p + '"' + (libFilter.pat === p ? ' selected' : '') + '>' + TW.PATTERNS[p] + '</option>';
    }).join('');
    var goals = TW.ALL_GOALS.map(function (g) {
      return '<option value="' + g + '"' + (libFilter.goal === g ? ' selected' : '') + '>' + TW.GOALS[g] + '</option>';
    }).join('');
    view.innerHTML = '<section class="page"><div class="card-h"><h2 class="title">Biblioteca</h2>' +
      '<button class="ghost" data-a="customNew">+ Propio</button></div>' +
      '<div class="grid2"><select data-f="mus" aria-label="Grupo muscular"><option value="">Todos los grupos musculares</option>' + Object.keys(TW.MUSCLES).map(function (m) { return '<option value="' + m + '"' + (libFilter.mus === m ? ' selected' : '') + '>' + TW.MUSCLES[m] + '</option>'; }).join('') + '</select></div>' +
      '<div class="grid2"><select data-f="pat" aria-label="Patrón"><option value="">Todos los patrones</option>' + pats + '</select>' +
      '<select data-f="goal" aria-label="Objetivo"><option value="">Todos los objetivos</option>' + goals + '</select></div>' +
      '<p class="meta">Solo ves ejercicios que puedes hacer con tu equipo.</p>' +
      shown.map(function (e) { return libItem(e); }).join('') +
      (discarded.length ? '<h3 class="sec">Descartados</h3>' + discarded.map(function (e) { return libItem(e); }).join('') : '') +
      '</section>';
  }
  function libItem(e) {
    var st = TW.status(S, e.id);
    var label = { activo: 'Activo', pausa: 'En pausa', disponible: 'Disponible', descartado: 'Descartado' }[st];
    var btns = st === 'descartado' ? '<button class="ghost" data-a="setStatus" data-ex="' + e.id + '" data-st="disponible">Recuperar</button>' :
      '<button data-a="setStatus" data-ex="' + e.id + '" data-st="activo"' + (st === 'activo' ? ' disabled' : '') + '>Activar</button>' +
      '<button class="ghost" data-a="setStatus" data-ex="' + e.id + '" data-st="pausa"' + (st === 'pausa' ? ' disabled' : '') + '>Pausar</button>' +
      '<button class="ghost" data-a="setStatus" data-ex="' + e.id + '" data-st="descartado">Descartar</button>';
    return '<article class="card lib"><div class="card-h"><div><h3>' + exTitle(e) + (e.custom ? ' <small>(propio)</small>' : '') + '</h3><p class="how">' + esc(TW.exHow(e)) + '</p>' +
      '<small class="step">' + TW.PATTERNS[e.pattern] + ' · ' + (e.muscles.map(function (m) { return TW.MUSCLES[m]; }).join(', ')) + '</small></div>' +
      '<span class="pill ' + st + '">' + label + '</span></div>' +
      '<p class="meta"><span class="pill md ' + TW.exMode(e).k + '">' + TW.exMode(e).t + '</span> Dificultad ' + e.diff + '/3' + (e.equip.length ? ' · ' + e.equip.map(function (q) { return String(TW.EQUIPMENT[q]).split(' (')[0]; }).join(', ') : '') + '</p>' +
      '<div class="row wrap">' + btns + '<button class="ghost" data-a="detail" data-ex="' + e.id + '">Ver</button></div></article>';
  }
  function setStatus(id, st) {
    var prev = TW.status(S, id);
    S.status[id] = st;
    if (st === 'activo') { activate(id); delete S.autoPaused[id]; }
    if (st === 'pausa' || st === 'descartado') {
      S.week.forEach(function (d) { d.exs = d.exs.filter(function (x) { return x !== id; }); });
    }
    save(); renderLibrary();
    if (prev !== st) toast(st === 'activo' ? 'Activado' : st === 'pausa' ? 'En pausa' : st === 'descartado' ? 'Descartado' : 'Disponible');
  }
  function openDetail(id) {
    var e = TW.getEx(S, id), loads = TW.loadsFor(S, e), subs = TW.substitutes(S, e);
    var prog = e.ladder ? 'Escalera: ' + TW.LADDERS[e.ladder].steps.map(function (s) { return s.name; }).join(' → ') : TW.PROGS[e.prog] || 'Repeticiones';
    openSheet('<div class="big">' + bsvg(e.muscles, 'big') + '</div><h3>' + esc(e.name) + '</h3>' +
      '<p class="note"><em>' + esc(e.note) + '</em></p>' +
      '<p class="meta">Progresión: ' + esc(prog) + '</p>' +
      (loads.length ? '<p class="meta">Cargas disponibles: ' + loads.join(', ') + ' kg</p>' : '') +
      '<p class="meta">Objetivos: ' + e.goals.map(function (g) { return TW.GOALS[g]; }).join(', ') + '</p>' +
      (TW.status(S, id) === 'pausa' && subs.length ? '<p class="lbl">Sustitutos del mismo patrón</p>' + subs.map(function (s) {
        return '<div class="pos"><span>' + esc(s.name) + '</span><button data-a="setStatus" data-ex="' + s.id + '" data-st="activo">Activar</button></div>';
      }).join('') : '') +
      '<button class="wide ghost" data-a="closeSheet">Cerrar</button>');
  }
  function openCustomForm() {
    openSheet('<h3>Ejercicio propio</h3>' +
      '<label class="field">Nombre<input name="name" maxlength="60"></label>' +
      '<label class="field">Patrón<select name="pattern">' + Object.keys(TW.PATTERNS).map(function (p) { return '<option value="' + p + '">' + TW.PATTERNS[p] + '</option>'; }).join('') + '</select></label>' +
      '<label class="field">Tipo<select name="type">' + Object.keys(TW.TYPES).map(function (t) { return '<option value="' + t + '">' + TW.TYPES[t] + '</option>'; }).join('') + '</select></label>' +
      '<label class="field">Progresión<select name="prog">' + Object.keys(TW.PROGS).filter(function (p) { return p !== 'ladder'; }).map(function (p) { return '<option value="' + p + '">' + TW.PROGS[p] + '</option>'; }).join('') + '</select></label>' +
      '<div class="grid2"><label class="field">Reps/seg mín.<input type="number" min="1" name="rmin" value="8"></label>' +
      '<label class="field">Reps/seg máx.<input type="number" min="1" name="rmax" value="12"></label></div>' +
      '<label class="field">Series<input type="number" min="1" max="6" name="sets" value="3"></label>' +
      '<label class="field">Descanso (seg)<input type="number" min="0" name="rest" value="90"></label>' +
      '<label class="field">Dificultad<select name="diff"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label>' +
      '<p class="lbl">Músculos</p><div class="checks">' + Object.keys(TW.MUSCLES).map(function (m) {
        return '<label class="check"><input type="checkbox" data-group="muscles" value="' + m + '"> ' + TW.MUSCLES[m] + '</label>';
      }).join('') + '</div>' +
      '<p class="lbl">Equipo requerido</p><div class="checks">' + Object.keys(TW.EQUIPMENT).map(function (q) {
        return '<label class="check"><input type="checkbox" data-group="equip" value="' + q + '"> ' + TW.EQUIPMENT[q] + '</label>';
      }).join('') + '</div>' +
      '<p class="lbl">Objetivos</p><div class="checks">' + TW.ALL_GOALS.map(function (g) {
        return '<label class="check"><input type="checkbox" data-group="goals" value="' + g + '"> ' + TW.GOALS[g] + '</label>';
      }).join('') + '</div>' +
      '<label class="field">Nota técnica<textarea name="note" rows="2" maxlength="240"></textarea></label>' +
      '<button class="wide" data-a="saveCustom">Guardar ejercicio</button>');
  }
  function saveCustom() {
    var v = collect($('#sheetBody'));
    if (!v.name || !v.name.trim()) { toast('Ponle un nombre'); return; }
    var rmin = Math.max(1, Number(v.rmin) || 1), rmax = Math.max(rmin, Number(v.rmax) || rmin);
    var e = TW.makeEx({
      id: 'c_' + Date.now(), name: v.name.trim(), pattern: v.pattern, type: v.type, prog: v.prog,
      unit: v.prog === 'tiempo' ? 'seg' : 'reps', range: [rmin, rmax], sets: TW.clamp(Number(v.sets) || 3, 1, 6),
      rest: Math.max(0, Number(v.rest) || 0), diff: Number(v.diff) || 1, muscles: v.muscles || [], equip: v.equip || [],
      goals: v.goals || [], note: (v.note || '').trim() || 'Sin nota técnica.', custom: true, minutes: 20
    });
    S.custom.push(e); S.status[e.id] = 'disponible';
    save(); closeSheet(); renderLibrary(); toast('Ejercicio creado');
  }

  /* ---------- AJUSTES ---------- */
  function renderSettings() {
    var p = S.profile, a = S.assess || {};
    var eq = Object.keys(TW.EQUIPMENT).map(function (k) {
      var x = S.equipment[k] || { on: false, loads: [] }, loadable = TW.LOADABLE.indexOf(k) >= 0;
      var lv = (x.loads && x.loads.length) ? x.loads : (TW.PRESET_LOADS[k] || []);
      return '<div class="eqrow"><label class="check"><input type="checkbox" data-group="equip" value="' + k + '"' + (x.on ? ' checked' : '') + '> ' + TW.EQUIPMENT[k] + '</label>' +
        (loadable ? '<input name="load_' + k + '" placeholder="Ej: 2, 4, 6, 8" value="' + lv.join(', ') + '" aria-label="Cargas de ' + TW.EQUIPMENT[k] + ' en kg">' : '') + '</div>';
    }).join('');
    view.innerHTML = '<section class="page"><h2 class="title">Ajustes</h2>' +
      '<div class="card"><h3>Mi perfil guardado</h3><p class="meta">Carga de una vez tu peso, estatura, 4 días, medidas y tu equipo (mancuernas, discos, barra, kettlebell, bandas y cuerda). No borra tu historial.</p><button class="ghost" data-a="applyMine">Cargar mis datos y equipo</button></div>' +
      '<div class="card"><h3>Perfil</h3><div class="grid2">' +
      '<label class="field">Peso (kg)<input type="number" step="0.1" name="weight" value="' + p.weight + '"></label>' +
      '<label class="field">Estatura (cm)<input type="number" name="height" value="' + p.height + '"></label>' +
      '<label class="field">Edad<input type="number" name="age" value="' + p.age + '"></label>' +
      '<label class="field">Días/semana<input type="number" min="3" max="6" name="days" value="' + p.days + '"></label>' +
      '<label class="field">Peso objetivo (kg)<input type="number" step="0.1" name="targetKg" value="' + (p.targetKg || '') + '"></label>' +
      '<label class="field">Objetivo prioritario<select name="goal">' + TW.ALL_GOALS.map(function (g) { return '<option value="' + g + '"' + (g === p.goal ? ' selected' : '') + '>' + TW.GOALS[g] + '</option>'; }).join('') + '</select></label>' +
      '<label class="field">Experiencia<select name="exp">' + Object.keys(TW.EXP).map(function (k) { return '<option value="' + k + '"' + ((p.exp || 'principiante') === k ? ' selected' : '') + '>' + TW.EXP[k].label + '</option>'; }).join('') + '</select></label>' +
      '<label class="field">Minutos por sesión<input type="number" min="10" max="90" step="5" name="minutes" value="' + (p.minutes || 20) + '"></label>' +
      '<label class="field">Bajo impacto (sin saltos ni trote)<select name="lowImpact"><option value="si"' + (TW.lowImpact(S) ? ' selected' : '') + '>Sí</option><option value="no"' + (TW.lowImpact(S) ? '' : ' selected') + '>No</option></select></label>' +
      '<label class="field">Sexo (para las ilustraciones)<select name="sex"><option value="m"' + (p.sex !== 'f' ? ' selected' : '') + '>Hombre</option><option value="f"' + (p.sex === 'f' ? ' selected' : '') + '>Mujer</option></select></label>' +
      '<label class="field">Cuello (cm)<input type="number" step="0.5" name="neck" value="' + (p.neck || '') + '"></label>' +
      '<label class="field">Medida de brazo (cm)<input type="number" step="0.5" name="arm" value="' + (p.arm || 37) + '"></label>' +
      '</div><p class="meta">Empieza con 20 min y sube de forma gradual; la app te preguntará cada semana si subes.</p><button class="ghost" data-a="saveProfile">Guardar perfil</button></div>' +
      myEquipHTML() +
      '<details class="card"><summary><b>Editar equipo y cargas</b></summary>' + equipScanHTML() + '<p class="meta">Marca lo que tienes y escribe las cargas disponibles. La app solo redondea a esos valores.</p>' +
      eq + startLoadsHTML() + '<p class="meta">' + TW.BANDS_NOTE + '</p><ul class="plain">' + Object.keys(TW.BAND_ZONES).map(function (k) { return '<li>' + esc(TW.EQUIPMENT[k]) + ': ' + esc(TW.BAND_ZONES[k]) + '</li>'; }).join('') + '</ul><button class="ghost" data-a="saveEquip">Guardar equipo</button></details>' +
      '<div class="card"><h3>Nivel</h3><p class="meta">Nivel actual: ' + ['', 'Principiante', 'Intermedio', 'Avanzado'][TW.level(S)] + '</p><div class="grid2">' +
      Object.keys(TW.ASSESS).map(function (k) {
        return '<label class="field">' + TW.ASSESS[k] + '<input type="number" min="0" name="as_' + k + '" value="' + (a[k] || 0) + '"></label>';
      }).join('') + '</div><button class="ghost" data-a="saveAssess">Guardar y reiniciar escaleras</button></div>' +
      '<div class="card"><h3>Volumen y proteína</h3><div class="grid2">' +
      '<label class="field">Máx. series semanales por grupo<input type="number" min="1" name="volMax" value="' + S.settings.volMax + '"></label>' +
      '<label class="field">Proteína mín. (g/kg)<input type="number" step="0.1" name="pmin" value="' + S.settings.protein[0] + '"></label>' +
      '<label class="field">Proteína máx. (g/kg)<input type="number" step="0.1" name="pmax" value="' + S.settings.protein[1] + '"></label></div>' +
      '<button class="ghost" data-a="saveRanges">Guardar rangos</button></div>' +
      '<div class="card"><h3>Glosario</h3><dl class="gloss">' + TW.GLOSSARY.map(function (g) {
        return '<dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd>';
      }).join('') + '</dl></div>' +
      '<div class="card"><h3>Datos</h3><p class="meta">Todo se guarda en este dispositivo. Haz respaldos periódicos para pasar los datos a otro teléfono.</p>' +
      '<div class="row wrap"><button class="ghost" data-a="exportCsv">Exportar CSV</button><button class="ghost" data-a="exportJson">Respaldo JSON</button>' +
      '<button class="ghost" data-a="importPick">Importar JSON</button><button class="ghost danger" data-a="resetAll">Borrar todo</button></div>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden></div>' +
      '<div class="card info"><p class="meta">Aviso: esta app no ofrece recomendaciones médicas. Consulta a un profesional antes de iniciar o cambiar tu entrenamiento o alimentación.</p></div>' +
      '</section>';
  }
  function saveProfile() {
    var v = collect(view);
    S.profile = Object.assign({}, S.profile, {
      weight: v.weight, height: v.height, age: v.age, days: TW.clamp(Number(v.days) || 3, 3, 6),
      targetKg: v.targetKg || null, goal: v.goal, exp: TW.EXP[v.exp] ? v.exp : 'principiante',
      minutes: TW.clamp(Number(v.minutes) || 20, 10, 90),
      arm: Number(v.arm) || null, neck: Number(v.neck) || null, sex: v.sex === 'f' ? 'f' : 'm',
      lowImpact: v.lowImpact !== 'no'
    });
    save(); toast('Perfil guardado'); renderSettings();
  }
  function saveEquip() {
    var newEq = {};
    Object.keys(TW.EQUIPMENT).forEach(function (k) {
      var on = !!view.querySelector('input[data-group="equip"][value="' + k + '"]:checked');
      var raw = view.querySelector('input[name="load_' + k + '"]');
      newEq[k] = { on: on, loads: parseLoads(raw ? raw.value : '') };
    });
    var removed = Object.keys(S.equipment).filter(function (k) { return S.equipment[k].on && !(newEq[k] && newEq[k].on); });
    S.equipment = newEq;
    var affected = TW.allEx(S).filter(function (e) {
      return e.equip.some(function (q) { return removed.indexOf(q) >= 0; }) && TW.status(S, e.id) === 'activo';
    });
    affected.forEach(function (e) { S.status[e.id] = 'pausa'; S.autoPaused[e.id] = true; });
    S.week.forEach(function (d) { d.exs = d.exs.filter(function (id) { return !affected.some(function (a) { return a.id === id; }); }); });
    TW.allEx(S).forEach(function (e) {
      if (S.autoPaused[e.id] && TW.hasEquip(S, e)) { S.status[e.id] = 'activo'; delete S.autoPaused[e.id]; }
    });
    save(); renderSettings();
    if (affected.length) {
      openSheet('<h3>Ejercicios en pausa</h3><p class="sub">Quitaste equipo. Estos ejercicios quedaron en pausa sin borrar su historial.</p>' +
        affected.map(function (e) {
          var subs = TW.substitutes(S, e);
          return '<div class="pos"><span>' + esc(e.name) + '</span></div>' + (subs.length ? subs.map(function (s) {
            return '<div class="pos sub-row"><span>↳ ' + esc(s.name) + ' <small>(mismo patrón)</small></span><button data-a="setStatus" data-ex="' + s.id + '" data-st="activo">Activar</button></div>';
          }).join('') : '<p class="meta">Sin sustitutos disponibles con tu equipo.</p>');
        }).join('') + '<button class="wide ghost" data-a="closeSheet">Cerrar</button>');
    } else {
      toast('Equipo guardado');
    }
  }
  function saveAssess() {
    if (!confirm('Esto reinicia el paso de las escaleras según tu nueva evaluación. ¿Continuar?')) return;
    var v = collect(view);
    S.assess = {};
    Object.keys(TW.ASSESS).forEach(function (k) { S.assess[k] = Math.max(0, Number(v['as_' + k]) || 0); });
    S.exProg = {};
    save(); renderSettings(); toast('Escaleras reiniciadas');
  }
  function saveRanges() {
    var v = collect(view);
    S.settings.volMax = Math.max(1, Number(v.volMax) || 20);
    S.settings.protein = [Number(v.pmin) || 1.6, Number(v.pmax) || 2.2];
    save(); toast('Rangos guardados');
  }
  function csvCell(v) { var s = v == null ? '' : String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function exportCsv() {
    var rows = [['tipo', 'fecha', 'ejercicio', 'serie', 'reps_o_seg', 'carga_kg', 'rpe', 'km', 'min', 'fc', 'ritmo', 'peso_kg', 'cintura_cm']];
    S.logs.forEach(function (l) {
      var e = TW.getEx(S, l.ex), name = e ? e.name : l.ex;
      (l.sets || []).forEach(function (s, i) {
        if (s) rows.push(['fuerza', l.date, name, i + 1, s.reps, s.load, s.rpe, '', '', '', '', '', '']);
      });
      if (l.cardio) rows.push(['cardio', l.date, name, '', '', '', l.cardio.rpe, l.cardio.km, l.cardio.min, l.cardio.hr, l.cardio.pace, '', '']);
    });
    S.body.forEach(function (b) { rows.push(['cuerpo', b.date, '', '', '', '', '', '', '', '', '', b.kg, b.waist]); });
    var text = '﻿' + rows.map(function (r) { return r.map(csvCell).join(';'); }).join('\n');
    download('titan-workout-' + today() + '.csv', text, 'text/csv;charset=utf-8');
  }
  function exportJson() {
    download('titan-backup-' + today() + '.json', JSON.stringify(S), 'application/json');
  }
  function importFile(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        if (!data || typeof data !== 'object' || !('logs' in data)) throw new Error('formato');
        S = Object.assign(defaults(), data); regEquip();
        save().then(function () { toast('Respaldo importado'); route(); });
      } catch (err) { toast('El archivo no es un respaldo válido'); }
    };
    r.readAsText(file);
  }
  function resetAll() {
    if (!confirm('Borrar todos los datos de este dispositivo? Esta acción no se puede deshacer.')) return;
    S = defaults(); W = null;
    save().then(function () { location.hash = '#config'; });
  }

  /* ---------- ASISTENTE (5 pasos) ---------- */
  var STEPS = ['Perfil', 'Equipo', 'Evaluación de nivel', 'Revisión', 'Análisis corporal'];
  function renderWizard() {
    if (!W) W = { step: 1, week: null, photo: null, analysis: null };
    var s = W.step, body = '';
    if (s === 1) {
      var pf = W.mine ? TW.MY.profile : {};
      body = '<button class="ghost" data-a="wizMine">Usar mi perfil guardado</button>' +
        '<label class="field">Peso actual (kg)<input type="number" step="0.1" name="weight" value="' + (pf.weight || '') + '" required></label>' +
        '<div class="grid2"><label class="field">Estatura (cm)<input type="number" name="height" value="' + (pf.height || '') + '" required></label>' +
        '<label class="field">Edad<input type="number" name="age" min="10" max="99" required></label></div>' +
        '<label class="field">Sexo (para las ilustraciones)<select name="sex"><option value="m"' + (pf.sex !== 'f' ? ' selected' : '') + '>Hombre</option><option value="f"' + (pf.sex === 'f' ? ' selected' : '') + '>Mujer</option></select></label>' +
        '<div class="grid2"><label class="field">Días de entrenamiento<select name="days">' + [3, 4, 5, 6].map(function (d) { return '<option value="' + d + '"' + (d === pf.days ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></label>' +
        '<label class="field">Peso objetivo (kg)<input type="number" step="0.1" name="targetKg" value="' + (pf.targetKg || '') + '"></label></div>' +
        '<label class="field">Objetivo prioritario de la fase inicial<select name="goal">' + TW.ALL_GOALS.map(function (g) { return '<option value="' + g + '"' + (g === pf.goal ? ' selected' : '') + '>' + TW.GOALS[g] + '</option>'; }).join('') + '</select></label>' +
        '<label class="check"><input type="checkbox" name="notice"> Entiendo que esta app no ofrece recomendaciones médicas.</label>';
    } else if (s === 2) {
      var srcEq = W.mine ? mineEquip() : S.equipment;
      body = equipScanHTML() + '<p class="meta">Marca lo que tienes. Para los que llevan peso, escribe las cargas disponibles (kg).</p>' +
        Object.keys(TW.EQUIPMENT).map(function (k) {
          var x = srcEq[k] || { on: false, loads: [] }, loadable = TW.LOADABLE.indexOf(k) >= 0;
          var lv = (x.loads && x.loads.length) ? x.loads : (TW.PRESET_LOADS[k] || []);
          return '<div class="eqrow"><label class="check"><input type="checkbox" data-group="equip" value="' + k + '"' + (x.on ? ' checked' : '') + '> ' + TW.EQUIPMENT[k] + '</label>' +
            (loadable ? '<input name="load_' + k + '" placeholder="Ej: 2, 4, 6, 8" value="' + lv.join(', ') + '">' : '') + '</div>';
        }).join('') + newEquipHTML();
    } else if (s === 3) {
      body = '<p class="meta">Anota tus repeticiones limpias actuales. Con esto la app elige el escalón de inicio. Si no puedes hacer ninguna, pon 0.</p>' +
        '<div class="grid2">' + Object.keys(TW.ASSESS).map(function (k) {
          return '<label class="field">' + TW.ASSESS[k] + '<input type="number" min="0" name="as_' + k + '" value="' + ((S.assess || {})[k] || 0) + '"></label>';
        }).join('') + '</div>';
    } else if (s === 4) {
      var v = W.week ? TW.validateWeek(S, W.week) : { warn: [], block: [] };
      body = '<p class="meta">Propuesta según tu equipo, nivel y objetivo. Al aceptar, estos ejercicios se activan. Puedes ajustarla en Semana.</p>' +
        warnHTML(v.warn) +
        (W.week || []).map(function (d, i) {
          var inf = TW.dayInfo(S, d);
          return '<article class="card"><small>' + TW.DOW[i] + '</small><h3>' + esc(inf.name) + '</h3><p class="meta">' +
            (inf.exs.map(function (e) { return esc(e.name); }).join(', ') || 'Descanso activo') + '</p></article>';
        }).join('');
    } else {
      body = '<p class="meta">Opcional. La foto se guarda solo en este dispositivo. El análisis lo haces tú con la guía de tipo de cuerpo: la app no interpreta la imagen automáticamente.</p>' +
        '<label class="field">Foto (frente, cuerpo completo)<input type="file" id="photo" accept="image/*"></label>' +
        (W.photo ? '<img class="preview" src="' + W.photo + '" alt="Vista previa de la foto">' : '') +
        '<label class="field">Tipo de cuerpo (autoevaluación)<select name="bodyType">' +
        ['mixto', 'ectomorfo', 'mesomorfo', 'endomorfo'].map(function (t) { return '<option value="' + t + '">' + t[0].toUpperCase() + t.slice(1) + '</option>'; }).join('') + '</select></label>' +
        '<label class="field">Cintura (cm, opcional)<input type="number" step="0.5" name="waist"></label>' +
        '<button class="ghost" data-a="analyze">Calcular análisis</button>' +
        (W.analysis ? analysisHTML(W.analysis) : '');
    }
    view.innerHTML = '<section class="wiz"><div class="stepper" aria-label="Paso ' + s + ' de 5">' +
      STEPS.map(function (t, i) { return '<span class="' + (i + 1 === s ? 'on' : i + 1 < s ? 'done' : '') + '">' + (i + 1) + '</span>'; }).join('') +
      '</div><h2 class="title">' + s + '. ' + STEPS[s - 1] + '</h2>' + body +
      '<div class="row between"><button class="ghost" data-a="wizPrev"' + (s === 1 ? ' disabled' : '') + '>Atrás</button>' +
      '<button data-a="wizNext">' + (s === 5 ? 'Terminar' : 'Siguiente') + '</button></div></section>';
  }
  function analysisHTML(a) {
    return '<div class="card info"><h3>Análisis</h3>' +
      '<p>IMC: <b>' + (a.bmi == null ? '—' : a.bmi) + '</b> (' + a.cat + ')' + (a.ratio != null ? ' · Cintura/estatura: ' + a.ratio : '') + '</p>' +
      (a.toLose ? '<p>Peso a bajar: <b>' + a.toLose + ' kg</b>. Ritmo orientativo 0,5–0,8 kg/semana: ' + a.weeksMin + '–' + a.weeksMax + ' semanas.</p>' : '<p>Sin peso objetivo por bajar.</p>') +
      '<p>Tipo de cuerpo: <b>' + a.bodyType + '</b>. ' + esc(a.note) + '</p>' +
      '<p>Áreas a trabajar: <b>' + a.focus.map(function (m) { return TW.MUSCLES[m]; }).join(', ') + '</b>.</p>' +
      (a.ratioNote ? '<p class="warn">' + esc(a.ratioNote) + '</p>' : '') +
      '<p class="meta">Estimación orientativa, no diagnóstico.</p>' +
      '<button class="ghost" data-a="reproposeFocus">Re-proponer semana con estas áreas</button></div>';
  }
  function readEquip(root) {
    var eq = {};
    Object.keys(TW.EQUIPMENT).forEach(function (k) {
      var on = !!root.querySelector('input[data-group="equip"][value="' + k + '"]:checked');
      var raw = root.querySelector('input[name="load_' + k + '"]');
      eq[k] = { on: on, loads: parseLoads(raw ? raw.value : '') };
    });
    return eq;
  }
  function wizNext() {
    var s = W.step;
    if (s === 1) {
      var v = collect(view);
      if (!(v.weight > 0) || !(v.height > 0) || !(v.age > 0)) { toast('Completa peso, estatura y edad'); return; }
      if (!v.notice) { toast('Confirma el aviso para continuar'); return; }
      S.profile = { weight: v.weight, height: v.height, age: v.age, days: TW.clamp(Number(v.days) || 3, 3, 6),
        goal: v.goal, targetKg: v.targetKg || null, bodyType: 'mixto', waist: null, sex: v.sex === 'f' ? 'f' : 'm' };
      if (W.mine) {
        var m = TW.MY.profile;
        Object.assign(S.profile, { exp: m.exp, minutes: m.minutes, arm: m.arm, neck: m.neck, waist: m.waist, lowImpact: m.lowImpact });
      }
      if (!S.body.length) S.body.push({ date: today(), kg: v.weight, waist: W.mine ? TW.MY.profile.waist : null });
      S.notice = true;
      save(); W.step = 2;
    } else if (s === 2) {
      S.equipment = readEquip(view); save(); W.step = 3;
    } else if (s === 3) {
      var a = collect(view); S.assess = {};
      Object.keys(TW.ASSESS).forEach(function (k) { S.assess[k] = Math.max(0, Number(a['as_' + k]) || 0); });
      S.exProg = {};
      W.week = TW.proposeWeek(S);
      save(); W.step = 4;
    } else if (s === 4) {
      S.week = W.week;
      S.week.forEach(function (d) { d.exs.forEach(activate); });
      save(); W.step = 5;
    } else {
      W = null; location.hash = '#inicio'; return;
    }
    renderWizard();
  }
  function handlePhoto(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var m = Math.min(1, 640 / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * m); c.height = Math.round(img.height * m);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        W.photo = c.toDataURL('image/jpeg', 0.8);
        renderWizard();
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }
  function analyzeBody() {
    var bt = view.querySelector('select[name="bodyType"]').value;
    var waist = Number(view.querySelector('input[name="waist"]').value) || null;
    var prof = Object.assign({}, S.profile, { bodyType: bt, waist: waist });
    S.profile = prof;
    W.analysis = TW.analyze(prof);
    S.analysis = W.analysis; S.focusAreas = W.analysis.focus;
    if (W.photo) S.photo = W.photo;
    save(); renderWizard();
  }

  /* ---------- escaneo del equipo por foto (OCR en el navegador) ---------- */
  var scanPreview = null, tessPromise = null;
  var EQUIP_RULES = {
    mancuernas: /mancuern|dumbbell|pesas? de mano/,
    barra: /\bbarra\b|barbell/,
    discos: /\bdiscos?\b|plate/,
    barra_dominadas: /dominad|pull.?up|chin.?up/,
    banda_rosa: /banda.*rosa|rosa|pink/,
    banda_turquesa: /banda.*turquesa|turquoise|turquesa|celeste/,
    cuerda_saltar: /cuerda|rope|jump/,
    bicicleta: /bicicleta|\bbici\b|\bbike\b|cycle/,
    kettlebell: /kettlebell|pesa rusa|\bkb\b/,
    banco: /\bbanco\b|\bbench\b/
  };
  function equipScanHTML() {
    return '<div class="scan"><label class="field">Foto del equipo (opcional)<input type="file" id="equipPhoto" accept="image/*" capture="environment"></label>' +
      (scanPreview ? '<img class="preview" src="' + scanPreview + '" alt="Foto del equipo">' : '') +
      '<p id="scanMsg" class="meta">Toma una foto de tu equipo. La app intentará leer los pesos y marcar lo que reconozca; revisa antes de guardar.</p></div>';
  }
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!tessPromise) {
      tessPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        s.onload = function () { resolve(window.Tesseract); };
        s.onerror = function () { tessPromise = null; reject(new Error('cdn')); };
        document.head.appendChild(s);
      });
    }
    return tessPromise;
  }
  function fileToDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function shrink(dataURL, max) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var m = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * m); c.height = Math.round(img.height * m);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = dataURL;
    });
  }
  /* Marca el equipo reconocido y añade los pesos leídos a los campos de carga; el usuario confirma al guardar. */
  function applyEquipScan(text) {
    var t = text.toLowerCase(), keys = [], labels = [], nums = [], m;
    Object.keys(EQUIP_RULES).forEach(function (k) { if (EQUIP_RULES[k].test(t)) keys.push(k); });
    var re = /(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:kg|kgs|lb|lbs)?/gi;
    while ((m = re.exec(text))) {
      var v = Number(m[1].replace(',', '.'));
      if (v >= 1 && v <= 100) nums.push(v);
    }
    var loads = Array.from(new Set(nums)).sort(function (a, b) { return a - b; });
    var applied = false;
    keys.forEach(function (k) {
      var cb = document.querySelector('input[data-group="equip"][value="' + k + '"]');
      if (cb) cb.checked = true;
      labels.push(TW.EQUIPMENT[k]);
      var inp = document.querySelector('input[name="load_' + k + '"]');
      if (inp && loads.length) {
        inp.value = parseLoads(parseLoads(inp.value).concat(loads).join(',')).join(', ');
        applied = true;
      }
    });
    return { labels: labels, loads: loads, applied: applied };
  }
  async function scanEquipPhoto(file) {
    if (!file) return;
    var setMsg = function (t) { var el = $('#scanMsg'); if (el) el.textContent = t; };
    setMsg('Preparando la foto…');
    try {
      scanPreview = await shrink(await fileToDataURL(file), 1280);
      var box = document.querySelector('.scan');
      var img = box.querySelector('.preview') || document.createElement('img');
      img.className = 'preview'; img.alt = 'Foto del equipo'; img.src = scanPreview;
      if (!img.parentNode) box.insertBefore(img, $('#scanMsg'));
    } catch (err) { setMsg('No pude abrir la foto. Intenta de nuevo.'); return; }
    setMsg('Leyendo pesos… la primera vez descarga el reconocimiento de texto.');
    try {
      var T = await loadTesseract();
      var res = await T.recognize(scanPreview, 'spa+eng');
      var r = applyEquipScan(res.data.text || '');
      var parts = [];
      if (r.labels.length) parts.push('Reconocí: ' + r.labels.join(', ') + '.');
      if (r.loads.length && !r.applied) parts.push('Leí los números ' + r.loads.join(', ') + ' kg, pero no sé a qué equipo pertenecen: escríbelos tú.');
      if (r.applied) parts.push('Pesos añadidos a las cargas.');
      setMsg((parts.join(' ') || 'No reconocí equipo ni pesos con claridad. Marca el equipo y escribe las cargas a mano.') + ' Revisa antes de guardar.');
    } catch (err) {
      setMsg('No pude leer la foto (¿hay conexión?). Marca el equipo y escribe las cargas a mano.');
    }
  }

  /* ---------- acciones ---------- */
  var ACT = {
    selDay: function (el, d) { selDay = Number(d.d); run = null; renderToday(); },
    startRun: function () { S.sess = S.sess || {}; var k = today(); if (!S.sess[k]) S.sess[k] = { s: Date.now(), e: Date.now() }; run = { i: 0 }; save(); renderToday(); window.scrollTo(0, 0); },
    runAt: function (el, d) { run = { i: Number(d.i) + 1 }; renderToday(); window.scrollTo(0, 0); },
    runNext: function () { run.i++; renderToday(); window.scrollTo(0, 0); },
    runPrev: function () { run.i--; renderToday(); window.scrollTo(0, 0); },
    runExit: function () { run = null; renderToday(); },
    logSet: function (el, d) { openSetSheet(d.ex, Number(d.i)); },
    pickLoad: function (el, d) { sheetCtx.load = Number(d.v); renderSetSheet(TW.getEx(S, sheetCtx.exId)); },
    rep: function (el, d) { sheetCtx.reps = Math.max(0, sheetCtx.reps + Number(d.d)); renderSetSheet(TW.getEx(S, sheetCtx.exId)); },
    tapRep: function () { sheetCtx.reps += 1; beep(520, 80); renderSetSheet(TW.getEx(S, sheetCtx.exId)); },
    minUp: function () { S.profile.minutes = TW.clamp((S.profile.minutes || 20) + 5, 10, 60); S.profile.minCheck = TW.weekKey(today()); save(); toast('Sesiones: ' + S.profile.minutes + ' min'); renderToday(); },
    minKeep: function () { S.profile.minCheck = TW.weekKey(today()); save(); renderToday(); },
    pickRpe: function (el, d) { var v = Number(d.v); sheetCtx.rpe = sheetCtx.rpe === v ? null : v; renderSetSheet(TW.getEx(S, sheetCtx.exId)); },
    saveSet: function () { saveSet(); },
    rest: function (el, d) { startTimer(Number(d.s), 'Descanso'); },
    clean: function (el, d) { var L = getLog(today(), d.ex, true); L.clean = !L.clean; save(); renderToday(); },
    finishDay: function () { run = null; finishDay(); },
    saveCardio: function (el, d) { saveCardio(d.ex); },
    flexTimer: function (el, d) { startTimer(Number(d.sec), 'Estiramiento'); },
    flexDone: function (el, d) { flexDone(d.ex); },
    skipTimer: skipTimer,
    suggest: applySuggestion,
    editDay: function (el, d) { wkSel = Number(d.d); openDayEditor(Number(d.d)); },
    saveDay: function (el, d) { saveDay(Number(d.d)); },
    editPhase: function (el, d) { openPhaseForm(d.id); },
    savePhase: function (el, d) { savePhase(d.id); },
    saveBody: saveBody,
    saveSleep: saveSleep,
    info: function (el, d) { openInfo(d.ex); },

    openPicker: function (el, d) { pickDay = d.d != null ? Number(d.d) : null; pick = { g: null, p: 'all' }; openPicker(); },
    pickBack: function () { pick = { g: null, p: 'all' }; openPicker(); },
    wkSel: function (el, d) { selectWeekDay(Number(d.d)); },
    goDay: function (el, d) { selDay = Number(d.d); run = null; location.hash = '#hoy'; },
    rmEx: function (el, d) { var day = S.week[wkSel]; day.exs = day.exs.filter(function (x) { return x !== d.ex; }); var dt = weekDates(0)[wkSel]; if (S.extras && S.extras[dt]) S.extras[dt] = S.extras[dt].filter(function (x) { return x !== d.ex; }); save(); renderWeek(); toast('Ejercicio quitado'); },
    pickG: function (el, d) { pick.g = d.g; pick.p = 'all'; openPicker(); },
    pickP: function (el, d) { pick.p = d.p; openPicker(); },
    addPick: function (el, d) { var pdv = pd(); S.week[pdv].exs.push(d.ex); markExtra(d.ex); activate(d.ex); save(); closeSheet(); var m = TW.estMin(TW.getEx(S, d.ex)); if ((location.hash || '').indexOf('semana') >= 0) { wkSel = pdv; renderWeek(); } else renderToday(); toast('Añadido a ' + TW.DOW[pdv] + ' · +' + m + ' min'); },
    addMin: function (el, d) { var k = today(); S.extraMin = S.extraMin || {}; S.extraMin[k] = (S.extraMin[k] || 0) + Number(d.m); touchSession(); save(); renderToday(); toast('+' + d.m + ' min registrados'); },
    delExPhoto: function (el, d) { if (S.exPhotos) delete S.exPhotos[d.ex]; save(); openInfo(d.ex); },
    startTraining: function () {
      var d = today(); S.sess = S.sess || {};
      if (!S.sess[d]) S.sess[d] = { s: Date.now(), e: Date.now() };
      save(); selDay = todayIdx(); location.hash = '#hoy';
    },
    toggleEq: function (el, d) {
      var x = S.equipment[d.k] || { on: false, loads: [] }; x.on = !x.on; S.equipment[d.k] = x;
      save(); renderSettings();
    },
    applyMine: applyMine,
    addEquip: addEquip,
    wizMine: function () { W.mine = true; renderWizard(); },
    stopBang: stopBang,
    saveTest: saveTest,
    setStatus: function (el, d) { setStatus(d.ex, d.st); },
    detail: function (el, d) { openInfo(d.ex); },
    animToggle: function (el) { var sv = document.querySelector('#sheetBody svg.anim'); if (!sv) return; if (sv.animationsPaused()) { sv.unpauseAnimations(); el.textContent = '⏸ Pausar'; } else { sv.pauseAnimations(); el.textContent = '▶ Reproducir'; } },
    customNew: openCustomForm,
    saveCustom: saveCustom,
    saveProfile: saveProfile,
    saveEquip: saveEquip,
    saveAssess: saveAssess,
    saveRanges: saveRanges,
    exportCsv: exportCsv,
    exportJson: exportJson,
    importPick: function () { $('#importFile').click(); },
    resetAll: resetAll,
    closeSheet: closeSheet,
    wizPrev: function () { W.step = Math.max(1, W.step - 1); renderWizard(); },
    wizNext: wizNext,
    analyze: analyzeBody,
    reproposeFocus: function () {
      if (!confirm('Reemplazar la semana por una propuesta con estas áreas?')) return;
      var w = TW.proposeWeek(S); w.forEach(function (d) { d.exs.forEach(activate); });
      S.week = w; save(); toast('Semana actualizada'); location.hash = '#semana';
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    var fn = ACT[el.dataset.a];
    if (fn) fn.call(el, el, el.dataset);
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'exPhoto') addExPhoto(t.files[0], t.dataset.ex);
    else if (t.id === 'photo') handlePhoto(t.files[0]);
    else if (t.id === 'progPhoto') addProgPhoto(t.files[0]);
    else if (t.id === 'equipPhoto') scanEquipPhoto(t.files[0]);
    else if (t.id === 'importFile') importFile(t.files[0]);
    else if (t.dataset.f === 'progSel') { progSel = t.value; renderProgress(); }
    else if (t.dataset.f === 'mus') { libFilter.mus = t.value; renderLibrary(); }
    else if (t.dataset.f === 'pat') { libFilter.pat = t.value; renderLibrary(); }
    else if (t.dataset.f === 'goal') { libFilter.goal = t.value; renderLibrary(); }
  });
  $('#btnSettings').addEventListener('click', function () { location.hash = '#ajustes'; });
  $('#restSkip').addEventListener('click', skipTimer);

  /* ---------- arranque ---------- */
  load().then(function () {
    if ('serviceWorker' in navigator) {
      var had = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').catch(function () {});
      navigator.serviceWorker.addEventListener('controllerchange', function () { if (had && !window.__twReload) { window.__twReload = 1; location.reload(); } });
    }
    window.addEventListener('hashchange', route);
    route();
  }).catch(function () {
    view.innerHTML = '<section class="page"><p class="warn">No se pudo abrir el almacenamiento local de este navegador.</p></section>';
  });
})();
