/* Lógica pura: fechas, equipo, progresión, nivel, propuesta semanal, validaciones, fases y análisis corporal. */
(function () {
  'use strict';
  var TW = window.TW;

  TW.DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  TW.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  TW.ymd = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  TW.parseYmd = function (s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  TW.addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  TW.dowMon = function (d) { return (d.getDay() + 6) % 7; };
  TW.weekStart = function (d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return TW.addDays(x, -TW.dowMon(x)); };
  TW.weekKey = function (s) { return TW.ymd(TW.weekStart(TW.parseYmd(s))); };
  TW.fmt = function (sec) { return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };

  TW.allEx = function (S) { return TW.CATALOG.concat(S.custom || []); };
  TW.getEx = function (S, id) { return TW.allEx(S).find(function (e) { return e.id === id; }); };
  TW.status = function (S, id) { return (S.status && S.status[id]) || 'disponible'; };
  TW.hasEquip = function (S, e) {
    return (e.equip || []).every(function (q) { return S.equipment && S.equipment[q] && S.equipment[q].on; });
  };

  var LOADABLE = TW.LOADABLE;
  TW.loadsFor = function (S, e) {
    var set = new Set();
    (e.equip || []).forEach(function (q) {
      if (LOADABLE.indexOf(q) >= 0 && S.equipment[q] && S.equipment[q].on) {
        (S.equipment[q].loads || []).forEach(function (v) { set.add(v); });
      }
    });
    return Array.from(set).sort(function (a, b) { return a - b; });
  };
  /* Redondea siempre hacia abajo a una carga disponible en el equipo. */
  TW.floorLoad = function (loads, v) {
    if (!loads.length) return null;
    var best = loads[0];
    loads.forEach(function (x) { if (x <= v) best = x; });
    return best;
  };
  TW.nextLoad = function (loads, v) {
    var n = loads.find(function (x) { return x > v; });
    return n === undefined ? null : n;
  };

  /* Escaleras y nivel */
  TW.startStep = function (lad, v) {
    var idx = 0;
    lad.thresholds.forEach(function (t, i) { if (v >= t) idx = i; });
    return idx;
  };
  TW.level = function (S) {
    var ids = Object.keys(TW.LADDERS);
    var avg = ids.reduce(function (s, id) {
      return s + TW.startStep(TW.LADDERS[id], ((S.assess || {})[id]) || 0);
    }, 0) / ids.length;
    return avg < 1.5 ? 1 : avg < 2.75 ? 2 : 3;
  };
  /* Carga inicial orientativa: posición dentro de las cargas disponibles según experiencia.
     No usa 1RM (no lo conocemos); se ajusta con la doble progresión tras 1–2 sesiones. */
  TW.EXP = { principiante: { label: 'Principiante', frac: 0.3 }, retomando: { label: 'He entrenado y retomo', frac: 0.5 }, experto: { label: 'Experto', frac: 0.7 } };
  TW.startLoad = function (loads, exp) {
    if (!loads || !loads.length) return null;
    var f = (TW.EXP[exp] || TW.EXP.principiante).frac;
    return TW.floorLoad(loads, loads[loads.length - 1] * f);
  };
  TW.progOf = function (S, e) {
    S.exProg = S.exProg || {};
    if (!S.exProg[e.id]) {
      var lad = e.ladder && TW.LADDERS[e.ladder];
      S.exProg[e.id] = {
        step: lad ? TW.startStep(lad, ((S.assess || {})[e.ladder]) || 0) : 0,
        streak: 0, stage: 0, flexCount: 0
      };
    }
    return S.exProg[e.id];
  };
  TW.target = function (S, e) {
    var lad = TW.LADDERS[e.ladder], p = TW.progOf(S, e), st = lad.steps[p.step];
    return { name: st.name, target: st.target, unit: lad.unit, step: p.step, total: lad.steps.length };
  };

  /* Última sesión ANTERIOR a hoy (la sesión de hoy no altera la sugerencia de hoy). */
  TW.lastSession = function (S, exId, today) {
    var list = (S.logs || []).filter(function (l) {
      return l.ex === exId && l.date < today && l.sets && l.sets.some(Boolean);
    });
    list.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return list[0] || null;
  };

  /* Sugerencia: doble progresión (reps dentro del rango → luego siguiente carga disponible). */
  TW.suggest = function (S, e, today) {
    if (e.ladder) return { reps: TW.target(S, e).target, load: null };
    if (e.prog === 'tiempo') return { reps: e.range[0], load: null };
    var loads = TW.loadsFor(S, e), lo = e.range[0], hi = e.range[1];
    var last = TW.lastSession(S, e.id, today);
    if (!last) return { reps: lo, load: loads.length ? loads[0] : null, upgrade: false };
    var sets = last.sets.filter(Boolean);
    var minReps = Math.min.apply(null, sets.map(function (s) { return s.reps || 0; }));
    var lastLoad = sets[0].load == null ? null : sets[0].load;
    var allHit = sets.every(function (s) { return (s.reps || 0) >= hi; });
    if (e.prog === 'carga') {
      if (allHit) {
        var nl = lastLoad == null ? null : TW.nextLoad(loads, lastLoad);
        return { reps: lo, load: nl == null ? lastLoad : nl, upgrade: nl != null };
      }
      return { reps: TW.clamp(minReps + 1, lo, hi), load: lastLoad };
    }
    return { reps: allHit ? hi : TW.clamp(minReps + 1, lo, hi), load: null, upgrade: allHit };
  };

  /* Evaluación de escalera al terminar la sesión: dos sesiones seguidas con técnica limpia en la serie objetivo. */
  TW.evaluateLadder = function (S, e, session) {
    if (!e.ladder) return null;
    var p = TW.progOf(S, e), lad = TW.LADDERS[e.ladder], target = lad.steps[p.step].target;
    var sets = (session.sets || []).filter(Boolean);
    var ok = !!session.clean && sets.length > 0 && sets.every(function (s) { return (s.reps || 0) >= target; });
    p.streak = ok ? p.streak + 1 : 0;
    if (p.streak >= 2 && p.step < lad.steps.length - 1) {
      p.step += 1; p.streak = 0;
      return { advanced: true, to: lad.steps[p.step].name };
    }
    return { advanced: false, streak: p.streak };
  };

  /* Sustitutos: mismo patrón, equipo disponible, no descartado, dificultad alcanzable. */
  TW.substitutes = function (S, e) {
    var lvl = TW.level(S);
    return TW.allEx(S).filter(function (x) {
      return x.id !== e.id && x.pattern === e.pattern && TW.hasEquip(S, x) &&
        TW.status(S, x.id) !== 'descartado' && x.diff <= lvl + 1;
    });
  };

  /* Información del día */
  TW.dayName = function (exs) {
    if (exs.every(function (e) { return e.type === 'flex'; })) return 'Flexibilidad';
    var m = new Set();
    exs.forEach(function (e) { e.muscles.forEach(function (x) { m.add(x); }); });
    var has = function (arr) { return arr.some(function (x) { return m.has(x); }); };
    var parts = [];
    if (has(['pecho', 'triceps', 'hombros'])) parts.push('Empuje');
    if (has(['espalda', 'biceps'])) parts.push('Tirón');
    if (has(['cuadriceps', 'isquiotibiales', 'gluteos', 'pantorrillas'])) parts.push('Piernas');
    if (m.has('abdomen')) parts.push('Core');
    if (exs.some(function (e) { return e.type === 'cardio'; })) parts.push('Cardio');
    return parts.length ? parts.join(' + ') : 'Movilidad';
  };
  TW.dayInfo = function (S, day) {
    var exs = day.exs.map(function (id) { return TW.getEx(S, id); }).filter(Boolean);
    if (!exs.length) return { name: 'Descanso activo', type: 'descanso activo', groups: [], exs: [] };
    var groups = Array.from(new Set([].concat.apply([], exs.map(function (e) { return e.muscles; }))));
    var types = new Set(exs.map(function (e) { return e.type; }));
    var type = types.size > 1 ? 'mixto' : types.has('cardio') ? 'cardio' : types.has('flex') ? 'flexibilidad' : 'fuerza';
    return { name: TW.dayName(exs), type: type, groups: groups, exs: exs };
  };

  /* Validaciones de la semana: bloqueos, advertencias y duplicados (que requieren confirmación). */
  TW.validateWeek = function (S, week) {
    var warn = [], block = [], dups = [];
    var days = week.map(function (d) { return d.exs.map(function (id) { return TW.getEx(S, id); }).filter(Boolean); });
    var all = [].concat.apply([], days);
    if (!all.length) return { warn: warn, block: block, dups: dups };

    var pats = new Set(all.map(function (e) { return e.pattern; }));
    [['empuje'], ['tiron'], ['sentadilla', 'bisagra', 'zancada'], ['core']].forEach(function (g) {
      if (!g.some(function (p) { return pats.has(p); })) {
        warn.push('Falta patrón de movimiento: ' + g.map(function (p) { return TW.PATTERNS[p]; }).join(' o ') + '.');
      }
    });
    [['pecho'], ['espalda'], ['hombros'], ['cuadriceps', 'isquiotibiales', 'gluteos'], ['abdomen']].forEach(function (g) {
      var covered = all.some(function (e) { return g.some(function (m) { return e.muscles.indexOf(m) >= 0; }); });
      if (!covered) warn.push('Grupo sin trabajar esta semana: ' + TW.MUSCLES[g[0]] + '.');
    });

    all.forEach(function (e) {
      if (!TW.hasEquip(S, e)) block.push(e.name + ' requiere equipo que no tienes.');
      else if (TW.status(S, e.id) !== 'activo') block.push(e.name + ' no está activo.');
    });

    var vol = {};
    days.forEach(function (list) {
      list.forEach(function (e) {
        if (e.type !== 'fuerza') return;
        e.muscles.forEach(function (m) { vol[m] = (vol[m] || 0) + e.sets; });
      });
    });
    Object.keys(vol).forEach(function (m) {
      if (vol[m] > S.settings.volMax) {
        warn.push('Volumen semanal de ' + TW.MUSCLES[m] + ': ' + vol[m] + ' series (máximo configurado ' + S.settings.volMax + ').');
      }
    });

    var planned = all.filter(function (e) { return e.type === 'cardio'; }).reduce(function (s, e) { return s + e.minutes; }, 0);
    var prev = TW.cardioMinutes(S, TW.weekKey(TW.ymd(TW.addDays(new Date(), -7))));
    if (prev > 0 && planned > prev * 1.1) {
      warn.push('Cardio previsto ' + planned + ' min: supera +10% sobre la semana anterior (' + prev + ' min).');
    }

    var seen = {};
    week.forEach(function (d) {
      d.exs.forEach(function (id) {
        if (seen[id]) { var e = TW.getEx(S, id); if (e) dups.push(e.name); }
        seen[id] = true;
      });
    });
    return { warn: warn, block: block, dups: dups };
  };

  TW.cardioMinutes = function (S, weekKey) {
    return (S.logs || []).filter(function (l) { return l.cardio && TW.weekKey(l.date) === weekKey; })
      .reduce(function (s, l) { return s + (Number(l.cardio.min) || 0); }, 0);
  };

  /* Propuesta semanal: solo ejercicios activables (equipo + nivel), repartidos por patrón. */
  TW.proposeWeek = function (S) {
    var n = TW.clamp(Number(S.profile.days) || 3, 3, 6);
    var slots = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] }[n];
    var level = TW.level(S), goal = S.profile.goal;
    var focus = new Set(S.focusAreas || []);
    var pool = TW.allEx(S).filter(function (e) {
      return TW.hasEquip(S, e) && e.diff <= level && ['disponible', 'activo'].indexOf(TW.status(S, e.id)) >= 0;
    });
    var score = function (e) {
      return (e.goals.indexOf(goal) >= 0 ? 3 : 0) +
        (e.muscles.some(function (m) { return focus.has(m); }) ? 2 : 0) +
        (TW.status(S, e.id) === 'activo' ? 1 : 0);
    };
    var pick = function (filterFn, used) {
      return pool.filter(function (e) { return filterFn(e) && !used.has(e.id); })
        .sort(function (a, b) { return score(b) - score(a); })[0];
    };
    var PLAN = [['empuje', 'core'], ['tiron', 'bisagra', 'aislamiento'], ['sentadilla', 'zancada', 'core']];
    var week = [0, 1, 2, 3, 4, 5, 6].map(function () { return { exs: [] }; });
    var lastIdx = slots[slots.length - 1];

    slots.forEach(function (dayIdx, i) {
      var used = new Set(), picks = [];
      PLAN[i % 3].forEach(function (p) {
        var e = pick(function (x) {
          return x.type === 'fuerza' && (p === 'aislamiento' ? x.pattern === 'aislamiento' : (Array.isArray(p) ? p : [p]).indexOf(x.pattern) >= 0);
        }, used);
        if (e) { used.add(e.id); picks.push(e.id); }
      });
      if ((goal === 'resistencia' || goal === 'definicion') && i % 2 === 1) {
        var c = pick(function (x) { return x.type === 'cardio'; }, used);
        if (c) { used.add(c.id); picks.push(c.id); }
      }
      if (goal === 'flexibilidad' || dayIdx === lastIdx) {
        var f = pick(function (x) { return x.type === 'flex'; }, used);
        if (f) { used.add(f.id); picks.push(f.id); }
      }
      week[dayIdx].exs = picks;
    });
    return week;
  };

  /* Métricas para hitos */
  TW.maxReps = function (S, id) {
    var m = 0;
    (S.logs || []).forEach(function (l) {
      if (l.ex === id && l.sets) l.sets.forEach(function (s) { if (s && s.reps > m) m = s.reps; });
    });
    return m;
  };
  TW.maxKm = function (S, id) {
    var m = 0;
    (S.logs || []).forEach(function (l) { if (l.ex === id && l.cardio && Number(l.cardio.km) > m) m = Number(l.cardio.km); });
    return m;
  };
  TW.trainedDates = function (S) {
    var set = new Set();
    (S.logs || []).forEach(function (l) {
      if ((l.sets && l.sets.some(Boolean)) || l.cardio || l.flexDone) set.add(l.date);
    });
    return set;
  };
  TW.compliance = function (S, weeks) {
    var dates = TW.trainedDates(S), now = new Date(), out = [];
    for (var w = weeks - 1; w >= 0; w--) {
      var start = TW.weekStart(TW.addDays(now, -7 * w)), done = 0;
      for (var k = 0; k < 7; k++) { if (dates.has(TW.ymd(TW.addDays(start, k)))) done++; }
      out.push({ start: TW.ymd(start), done: done, planned: S.profile.days, pct: Math.min(100, Math.round(done / S.profile.days * 100)) });
    }
    return out;
  };

  /* Fases y hitos */
  TW.metric = function (S, key) {
    if (key === 'dominadas') return TW.maxReps(S, 'dominadas');
    if (key === 'pies') return TW.maxReps(S, 'flexiones_pies_elevados');
    if (key === 'bici') return TW.maxKm(S, 'bici_estatica');
    if (key === 'sitreach') { var t = (S.tests || []).filter(function (x) { return x.name === 'sitreach'; }).slice(-1)[0]; return t ? t.value : 0; }
    if (key === 'peso') { var b = S.body.slice(-1)[0]; return b ? b.kg : S.profile.weight; }
    return 0;
  };
  TW.defaultPhases = function (S) {
    var start = TW.ymd(new Date()), goal = S.profile.goal;
    var others = TW.ALL_GOALS.filter(function (g) { return g !== goal; });
    var T = S.profile.targetKg || S.profile.weight;
    var tg = { dominadas: 3, pies: 8, bici: 10, sitreach: 10, peso: T };
    return [
      { id: 'p1', name: 'Fase 1 · Base', months: 2, goal: goal, sessions: S.profile.days, start: start, criteria: 'Técnica limpia en todos los ejercicios y asistencia ≥ 85% durante 4 semanas.', targets: tg },
      { id: 'p2', name: 'Fase 2 · Construcción', months: 3, goal: others[0], sessions: S.profile.days, start: start, criteria: 'Completar el máximo de repeticiones en todas las series durante 2 semanas.', targets: tg },
      { id: 'p3', name: 'Fase 3 · Consolidación', months: 2, goal: others[1], sessions: S.profile.days, start: start, criteria: 'Hitos de la fase en ≥ 80% y asistencia ≥ 85%.', targets: tg }
    ];
  };
  TW.phaseProgress = function (S, ph) {
    var start = TW.parseYmd(ph.start), now = new Date();
    var weeks = Math.max(1, Math.min(ph.months * 4.3, (now - start) / (7 * 864e5) + 1));
    var planned = Math.max(1, Math.round(weeks * ph.sessions)), done = 0;
    TW.trainedDates(S).forEach(function (d) {
      var x = TW.parseYmd(d);
      if (x >= start && x <= now) done++;
    });
    return { done: done, planned: planned, pct: Math.min(100, Math.round(done / planned * 100)) };
  };

  /* Análisis corporal (reglas simples, sin IA ni diagnóstico) */
  TW.analyze = function (p) {
    var h = (p.height || 0) / 100;
    var bmi = h ? p.weight / (h * h) : null;
    var cat = bmi == null ? '—' : bmi < 18.5 ? 'Bajo peso' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Sobrepeso' : 'Obesidad';
    var ratio = p.waist && p.height ? p.waist / p.height : null;
    var toLose = Math.max(0, p.weight - (p.targetKg || p.weight));
    var TYPES = {
      ectomorfo: { focus: ['pecho', 'espalda', 'cuadriceps', 'gluteos'], note: 'Complexión delgada: prioriza progresión de cargas y repeticiones en rango; cardio moderado.' },
      mesomorfo: { focus: ['espalda', 'hombros', 'pecho'], note: 'Buena respuesta a la progresión: equilibra empuje y tirón y evita excesos de volumen.' },
      endomorfo: { focus: ['abdomen', 'cuadriceps', 'gluteos', 'espalda'], note: 'Mayor tendencia a acumular grasa: combina fuerza con cardio regular y prioriza piernas y espalda.' },
      mixto: { focus: ['espalda', 'abdomen'], note: 'Complexión mixta: plan equilibrado entre fuerza y resistencia.' }
    };
    var t = TYPES[p.bodyType] || TYPES.mixto;
    var focus = t.focus.slice();
    if (ratio != null && ratio >= 0.5 && focus.indexOf('abdomen') < 0) focus.push('abdomen');
    return {
      bmi: bmi == null ? null : Math.round(bmi * 10) / 10,
      cat: cat,
      ratio: ratio == null ? null : Math.round(ratio * 100) / 100,
      toLose: Math.round(toLose * 10) / 10,
      weeksMin: toLose ? Math.ceil(toLose / 0.8) : 0,
      weeksMax: toLose ? Math.ceil(toLose / 0.5) : 0,
      bodyType: p.bodyType || 'mixto',
      note: t.note,
      focus: focus,
      ratioNote: ratio != null && ratio >= 0.5 ? 'La relación cintura/estatura es igual o mayor a 0,5. Es un indicador de referencia: consulta a un profesional de salud.' : ''
    };
  };

  /* Promedio móvil de los últimos 7 registros de peso. */
  TW.ma7 = function (arr) {
    return arr.map(function (p, i) {
      var slice = arr.slice(Math.max(0, i - 6), i + 1);
      return { date: p.date, v: slice.reduce(function (s, x) { return s + x.kg; }, 0) / slice.length };
    });
  };

  TW.hrZone = function (hr, age) {
    if (!hr || !age) return null;
    var pct = hr / (220 - age) * 100;
    if (pct < 50) return 'Por debajo de Z1';
    var zones = [[60, 'Z1 · Recuperación'], [70, 'Z2 · Base aeróbica'], [80, 'Z3 · Aeróbica'], [90, 'Z4 · Umbral'], [Infinity, 'Z5 · Máximo']];
    for (var i = 0; i < zones.length; i++) {
      if (pct < zones[i][0]) return zones[i][1] + ' (' + Math.round(pct) + '% FCmáx)';
    }
    return null;
  };
})();
