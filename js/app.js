/* Interfaz: pantallas, registro de series, asistente de configuración y ajustes. */
(function () {
  'use strict';
  var TW = window.TW;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var view = $('#view');
  var S = null, W = null, selDay = null, progSel = null, restIv = null, toastTo = null, sheetCtx = null;
  var libFilter = { pat: '', goal: '' };

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
    return TW.db.get('state').then(function (saved) { S = Object.assign(defaults(), saved || {}); });
  }
  function save() { return TW.db.set('state', S); }

  /* ---------- utilidades de UI ---------- */
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastTo); toastTo = setTimeout(function () { t.classList.add('hidden'); }, 2400);
  }
  function openSheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').classList.remove('hidden'); }
  function closeSheet() { $('#sheet').classList.add('hidden'); }
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
  function getLog(date, exId, create) {
    var l = S.logs.find(function (x) { return x.date === date && x.ex === exId; });
    if (!l && create) { l = { date: date, ex: exId, sets: [], clean: false }; S.logs.push(l); }
    return l;
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
  function startTimer(sec, label) {
    clearInterval(restIv);
    var t = sec, bar = $('#restBar');
    $('#restLbl').textContent = label;
    bar.classList.remove('hidden');
    var show = function () { $('#restTime').textContent = TW.fmt(t); };
    show();
    restIv = setInterval(function () {
      t--; show();
      if (t <= 0) {
        clearInterval(restIv); bar.classList.add('hidden');
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        toast(label + ' terminado');
      }
    }, 1000);
  }
  function skipTimer() { clearInterval(restIv); $('#restBar').classList.add('hidden'); }

  /* ---------- enrutado ---------- */
  function route() {
    var name = (location.hash.slice(1) || 'hoy').split('?')[0];
    if (!S.profile && name !== 'config') { location.hash = '#config'; return; }
    document.querySelectorAll('#tabs a').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === name); });
    $('#tabs').classList.toggle('hidden', name === 'config');
    var R = { hoy: renderToday, semana: renderWeek, ruta: renderRoad, progreso: renderProgress,
      biblioteca: renderLibrary, ajustes: renderSettings, config: renderWizard }[name] || renderToday;
    closeSheet();
    R();
  }

  /* ---------- HOY ---------- */
  function renderToday() {
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
      ? '<div class="pbar"><i style="width:' + pct + '%"></i></div><p class="meta">' + done + '/' + total + ' series completadas' + (canLog ? '' : ' · solo puedes registrar el día de hoy') + '</p>' +
        info.exs.map(function (e) { return exCard(e, canLog); }).join('') +
        '<button class="wide" data-a="finishDay" data-d="' + selDay + '"' + (canLog ? '' : ' disabled') + '>Terminar día</button>'
      : restDayHTML();
    view.innerHTML = '<section class="page"><nav class="dows">' + dows + '</nav>' +
      '<h2 class="title">' + esc(info.name) + '</h2>' +
      '<p class="sub">' + (info.groups.map(function (g) { return TW.MUSCLES[g]; }).join(' · ') || 'Sin entrenamiento programado') + '</p>' +
      body + '</section>';
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
      '<ul class="plain"><li>Caminata suave de 20–30 min.</li><li>Hidratación y sueño de calidad.</li></ul>' +
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
      '<div class="card-h"><div><h3>' + esc(e.name) + '</h3>' +
      (tgt ? '<small class="step">Paso ' + (tgt.step + 1) + '/' + tgt.total + ': ' + esc(tgt.name) + '</small>' : '') +
      '</div>' + TW.bodySVG(e.muscles, 'mini') + '</div>' +
      '<p class="note"><em>' + esc(e.note) + '</em></p>' +
      '<p class="reps">' + repLabel(e, sug) + '</p>' + needLoad +
      '<div class="pbar small" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' +
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
      '<div class="card-h"><div><h3>' + esc(e.name) + '</h3><small class="step">Duración objetivo: ' + e.minutes + ' min</small></div>' + TW.bodySVG(e.muscles, 'mini') + '</div>' +
      '<p class="note"><em>' + esc(e.note) + '</em></p>' +
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
      '<div class="card-h"><div><h3>' + esc(e.name) + '</h3><small class="step blue">Etapa ' + (st + 1) + '/4: ' + TW.STAGES[st] + '</small></div>' + TW.bodySVG(e.muscles, 'mini') + '</div>' +
      '<p class="note"><em>' + esc(e.note) + '</em></p>' +
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
    save(); closeSheet(); renderToday(); toast('Serie guardada');
    if (isNew && e.rest) startTimer(e.rest, 'Descanso');
  }
  function saveCardio(id) {
    var e = TW.getEx(S, id), f = view.querySelector('form[data-cardio="' + id + '"]');
    var v = collect(f), km = Number(v.km) || 0, min = Number(v.min) || 0;
    var pace = fmtPace(e, km, min);
    var L = getLog(today(), id, true);
    L.cardio = { km: km, min: min, rpe: Number(v.rpe) || null, hr: Number(v.hr) || null, pace: pace,
      zone: TW.hrZone(Number(v.hr), S.profile.age) };
    save(); renderToday(); toast('Sesión guardada' + (pace ? ' · ' + pace : ''));
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
    save(); renderToday(); toast(msg);
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
    save(); renderToday();
    toast(msgs.length ? 'Escalera avanzada: ' + msgs.join('; ') : 'Día terminado');
  }

  /* ---------- SEMANA ---------- */
  function renderWeek() {
    var ti = todayIdx(), v = TW.validateWeek(S, S.week);
    view.innerHTML = '<section class="page"><h2 class="title">Semana</h2>' +
      '<div class="row"><button class="ghost" data-a="suggest">Aplicar sugerencia</button></div>' +
      warnHTML(v.block, 'err') + warnHTML(v.warn) +
      S.week.map(function (d, i) {
        var inf = TW.dayInfo(S, d);
        return '<article class="card day' + (i === ti ? ' today' : '') + '">' +
          '<div class="card-h"><div><small>' + TW.DOW[i] + (i === ti ? ' · hoy' : '') + '</small><h3>' + esc(inf.name) + '</h3></div>' +
          '<span class="tag">' + esc(inf.type) + '</span></div>' +
          '<p class="sub">' + (inf.groups.map(function (g) { return TW.MUSCLES[g]; }).join(' · ') || 'Caminata y movilidad') + '</p>' +
          '<p class="meta">' + (inf.exs.map(function (e) { return esc(e.name); }).join(', ') || 'Sin ejercicios') + '</p>' +
          '<button class="ghost" data-a="editDay" data-d="' + i + '">Editar día</button></article>';
      }).join('') + '</section>';
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
      '<div class="card"><h3>Cumplimiento (4 semanas)</h3>' + comp.map(function (c) {
        return '<div class="ms"><span>Semana ' + c.start.slice(5) + ': ' + c.done + '/' + c.planned + ' días</span><div class="pbar small"><i style="width:' + c.pct + '%"></i></div></div>';
      }).join('') + '</div>' +
      '<div class="card"><h3>Prueba de flexibilidad</h3><div class="grid2"><label class="field">Sit-and-reach (cm)<input type="number" step="0.5" id="testVal"></label></div>' +
      '<button class="ghost" data-a="saveTest">Guardar prueba</button></div></section>';
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
    return '<article class="card lib"><div class="card-h"><div><h3>' + esc(e.name) + (e.custom ? ' <small>(propio)</small>' : '') + '</h3>' +
      '<small class="step">' + TW.PATTERNS[e.pattern] + ' · ' + (e.muscles.map(function (m) { return TW.MUSCLES[m]; }).join(', ')) + '</small></div>' +
      '<span class="pill ' + st + '">' + label + '</span></div>' +
      '<p class="meta">Dificultad ' + e.diff + '/3 · ' + (e.equip.length ? 'Equipo: ' + e.equip.map(function (q) { return TW.EQUIPMENT[q]; }).join(', ') : 'Peso corporal') + '</p>' +
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
    openSheet('<div class="big">' + TW.bodySVG(e.muscles, 'big') + '</div><h3>' + esc(e.name) + '</h3>' +
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
      '<div class="card"><h3>Perfil</h3><div class="grid2">' +
      '<label class="field">Peso (kg)<input type="number" step="0.1" name="weight" value="' + p.weight + '"></label>' +
      '<label class="field">Estatura (cm)<input type="number" name="height" value="' + p.height + '"></label>' +
      '<label class="field">Edad<input type="number" name="age" value="' + p.age + '"></label>' +
      '<label class="field">Días/semana<input type="number" min="3" max="6" name="days" value="' + p.days + '"></label>' +
      '<label class="field">Peso objetivo (kg)<input type="number" step="0.1" name="targetKg" value="' + (p.targetKg || '') + '"></label>' +
      '<label class="field">Objetivo prioritario<select name="goal">' + TW.ALL_GOALS.map(function (g) { return '<option value="' + g + '"' + (g === p.goal ? ' selected' : '') + '>' + TW.GOALS[g] + '</option>'; }).join('') + '</select></label>' +
      '</div><button class="ghost" data-a="saveProfile">Guardar perfil</button></div>' +
      '<div class="card"><h3>Equipo</h3>' + equipScanHTML() + '<p class="meta">Marca lo que tienes y escribe las cargas disponibles. La app solo redondea a esos valores.</p>' +
      eq + '<button class="ghost" data-a="saveEquip">Guardar equipo</button></div>' +
      '<div class="card"><h3>Nivel</h3><p class="meta">Nivel actual: ' + ['', 'Principiante', 'Intermedio', 'Avanzado'][TW.level(S)] + '</p><div class="grid2">' +
      Object.keys(TW.ASSESS).map(function (k) {
        return '<label class="field">' + TW.ASSESS[k] + '<input type="number" min="0" name="as_' + k + '" value="' + (a[k] || 0) + '"></label>';
      }).join('') + '</div><button class="ghost" data-a="saveAssess">Guardar y reiniciar escaleras</button></div>' +
      '<div class="card"><h3>Volumen y proteína</h3><div class="grid2">' +
      '<label class="field">Máx. series semanales por grupo<input type="number" min="1" name="volMax" value="' + S.settings.volMax + '"></label>' +
      '<label class="field">Proteína mín. (g/kg)<input type="number" step="0.1" name="pmin" value="' + S.settings.protein[0] + '"></label>' +
      '<label class="field">Proteína máx. (g/kg)<input type="number" step="0.1" name="pmax" value="' + S.settings.protein[1] + '"></label></div>' +
      '<button class="ghost" data-a="saveRanges">Guardar rangos</button></div>' +
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
      targetKg: v.targetKg || null, goal: v.goal
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
        S = Object.assign(defaults(), data);
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
      body = '<label class="field">Peso actual (kg)<input type="number" step="0.1" name="weight" required></label>' +
        '<div class="grid2"><label class="field">Estatura (cm)<input type="number" name="height" required></label>' +
        '<label class="field">Edad<input type="number" name="age" min="10" max="99" required></label></div>' +
        '<div class="grid2"><label class="field">Días de entrenamiento<select name="days">' + [3, 4, 5, 6].map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join('') + '</select></label>' +
        '<label class="field">Peso objetivo (kg)<input type="number" step="0.1" name="targetKg"></label></div>' +
        '<label class="field">Objetivo prioritario de la fase inicial<select name="goal">' + TW.ALL_GOALS.map(function (g) { return '<option value="' + g + '">' + TW.GOALS[g] + '</option>'; }).join('') + '</select></label>' +
        '<label class="check"><input type="checkbox" name="notice"> Entiendo que esta app no ofrece recomendaciones médicas.</label>';
    } else if (s === 2) {
      body = equipScanHTML() + '<p class="meta">Marca lo que tienes. Para los que llevan peso, escribe las cargas disponibles (kg).</p>' +
        Object.keys(TW.EQUIPMENT).map(function (k) {
          var x = S.equipment[k] || { on: false, loads: [] }, loadable = TW.LOADABLE.indexOf(k) >= 0;
          var lv = (x.loads && x.loads.length) ? x.loads : (TW.PRESET_LOADS[k] || []);
          return '<div class="eqrow"><label class="check"><input type="checkbox" data-group="equip" value="' + k + '"' + (x.on ? ' checked' : '') + '> ' + TW.EQUIPMENT[k] + '</label>' +
            (loadable ? '<input name="load_' + k + '" placeholder="Ej: 2, 4, 6, 8" value="' + lv.join(', ') + '">' : '') + '</div>';
        }).join('');
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
        goal: v.goal, targetKg: v.targetKg || null, bodyType: 'mixto', waist: null };
      if (!S.body.length) S.body.push({ date: today(), kg: v.weight, waist: null });
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
      W = null; location.hash = '#hoy'; return;
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
    bandas: /banda|\bband|el[aá]stic|resistance/,
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
    selDay: function (el, d) { selDay = Number(d.d); renderToday(); },
    logSet: function (el, d) { openSetSheet(d.ex, Number(d.i)); },
    pickLoad: function (el, d) { sheetCtx.load = Number(d.v); renderSetSheet(TW.getEx(S, sheetCtx.exId)); },
    rep: function (el, d) { sheetCtx.reps = Math.max(0, sheetCtx.reps + Number(d.d)); renderSetSheet(TW.getEx(S, sheetCtx.exId)); },
    pickRpe: function (el, d) { var v = Number(d.v); sheetCtx.rpe = sheetCtx.rpe === v ? null : v; renderSetSheet(TW.getEx(S, sheetCtx.exId)); },
    saveSet: function () { saveSet(); },
    rest: function (el, d) { startTimer(Number(d.s), 'Descanso'); },
    clean: function (el, d) { var L = getLog(today(), d.ex, true); L.clean = !L.clean; save(); renderToday(); },
    finishDay: function () { finishDay(); },
    saveCardio: function (el, d) { saveCardio(d.ex); },
    flexTimer: function (el, d) { startTimer(Number(d.sec), 'Estiramiento'); },
    flexDone: function (el, d) { flexDone(d.ex); },
    skipTimer: skipTimer,
    suggest: applySuggestion,
    editDay: function (el, d) { openDayEditor(Number(d.d)); },
    saveDay: function (el, d) { saveDay(Number(d.d)); },
    editPhase: function (el, d) { openPhaseForm(d.id); },
    savePhase: function (el, d) { savePhase(d.id); },
    saveBody: saveBody,
    saveTest: saveTest,
    setStatus: function (el, d) { setStatus(d.ex, d.st); },
    detail: function (el, d) { openDetail(d.ex); },
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
    if (t.id === 'photo') handlePhoto(t.files[0]);
    else if (t.id === 'equipPhoto') scanEquipPhoto(t.files[0]);
    else if (t.id === 'importFile') importFile(t.files[0]);
    else if (t.dataset.f === 'progSel') { progSel = t.value; renderProgress(); }
    else if (t.dataset.f === 'pat') { libFilter.pat = t.value; renderLibrary(); }
    else if (t.dataset.f === 'goal') { libFilter.goal = t.value; renderLibrary(); }
  });
  $('#btnSettings').addEventListener('click', function () { location.hash = '#ajustes'; });
  $('#restSkip').addEventListener('click', skipTimer);

  /* ---------- arranque ---------- */
  load().then(function () {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
    window.addEventListener('hashchange', route);
    route();
  }).catch(function () {
    view.innerHTML = '<section class="page"><p class="warn">No se pudo abrir el almacenamiento local de este navegador.</p></section>';
  });
})();
