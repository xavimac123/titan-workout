// Pruebas de humo de la lógica (sin navegador): node tests/logic-smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {}, console };
ctx.window = ctx;
for (const f of ['js/catalog.js', 'js/logic.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx);
}
const TW = ctx.TW;
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.error('FALLO:', msg); } else console.log('ok -', msg); };

const eqAll = Object.fromEntries(Object.keys(TW.EQUIPMENT).map(k => [k, { on: true, loads: [2, 4, 6, 8, 10, 12, 16, 20] }]));
const eqNone = Object.fromEntries(Object.keys(TW.EQUIPMENT).map(k => [k, { on: false, loads: [] }]));
const base = (equipment, extra = {}) => Object.assign({
  profile: { weight: 80, height: 178, age: 30, days: 4, goal: 'calistenia' }, equipment, assess: { flexiones: 10, dominadas: 2, remo_invertido: 6, bulgara: 5, sentadilla: 12, plancha: 40 },
  status: {}, autoPaused: {}, exProg: {}, custom: [], logs: [], body: [], tests: [], phases: [], focusAreas: [],
  week: Array.from({ length: 7 }, () => ({ exs: [] })), settings: { volMax: 20, protein: [1.6, 2.2] }
}, extra);

// 1) Nivel y escalera de inicio
const S = base(eqAll);
ok(TW.startStep(TW.LADDERS.flexiones, 10) === 2, 'flexiones 10 reps empieza en "Flexiones completas" (paso 3)');
ok(TW.level(S) >= 1 && TW.level(S) <= 3, 'nivel dentro de 1–3');

// 2) Propuesta: solo ejercicios con equipo, todos activados al aceptar
const week = TW.proposeWeek(S);
const ids = week.flatMap(d => d.exs);
ok(ids.length > 0, 'la propuesta genera ejercicios');
ok(ids.every(id => TW.hasEquip(S, TW.getEx(S, id))), 'la propuesta solo usa equipo disponible');
const v1 = TW.validateWeek(Object.assign(S, { status: Object.fromEntries(ids.map(i => [i, 'activo'])) }), week);
ok(v1.block.length === 0, 'propuesta sin bloqueos: ' + JSON.stringify(v1.block));

// 3) Sin equipo: ningún ejercicio que requiera equipo aparece
const S0 = base(eqNone);
const w0 = TW.proposeWeek(S0);
const ids0 = w0.flatMap(d => d.exs);
ok(ids0.every(id => TW.getEx(S0, id).equip.length === 0), 'sin equipo solo se proponen ejercicios de peso corporal/cardio/flex');
ok(!ids0.includes('dominadas'), 'sin barra no aparecen dominadas');

// 4) Bloqueo por equipo ausente y por estado no activo
const bad = [{ exs: ['dominadas'] }, ...Array.from({ length: 6 }, () => ({ exs: [] }))];
const vb = TW.validateWeek(S0, bad);
ok(vb.block.some(m => m.indexOf('Dominadas') === 0), 'dominadas bloqueada sin barra');
const vs = TW.validateWeek(base(eqAll), [{ exs: ['flexiones'] }, ...Array.from({ length: 6 }, () => ({ exs: [] }))]);
ok(vs.block.some(m => m.indexOf('no está activo') >= 0), 'ejercicio no activado no se programa');

// 5) Doble progresión con carga
const SC = base(eqAll);
const exC = TW.getEx(SC, 'curl_biceps');
ok(TW.suggest(SC, exC, '2026-11-22').load === 2, 'primera sesión: carga mínima disponible');
SC.logs.push({ date: '2026-11-20', ex: 'curl_biceps', sets: [{ reps: 15, load: 8 }, { reps: 15, load: 8 }, { reps: 15, load: 8 }], clean: true });
const sug = TW.suggest(SC, exC, '2026-11-22');
ok(sug.load === 10 && sug.reps === 10, 'al completar el máximo sube a la siguiente carga y vuelve al mínimo');
SC.logs.push({ date: '2026-11-21', ex: 'curl_biceps', sets: [{ reps: 12, load: 8 }, { reps: 11, load: 8 }, { reps: 11, load: 8 }] });
const s2 = TW.suggest(SC, exC, '2026-11-22');
ok(s2.load === 8 && s2.reps === 12, 'sin completar el máximo sube una repetición con la misma carga (usa la última sesión)');

// 6) Escalera: avanza tras dos sesiones seguidas con técnica limpia
const SL = base(eqAll);
const exF = TW.getEx(SL, 'flexiones');
const sess = { clean: true, sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }] };
const p0 = TW.progOf(SL, exF).step;
TW.evaluateLadder(SL, exF, sess);
ok(TW.progOf(SL, exF).step === p0, 'una sesión limpia no avanza');
const r2 = TW.evaluateLadder(SL, exF, sess);
ok(r2.advanced && TW.progOf(SL, exF).step === p0 + 1, 'dos sesiones limpias avanzan un paso');
TW.evaluateLadder(SL, exF, { clean: false, sets: [{ reps: 12 }] });
ok(TW.progOf(SL, exF).streak === 0, 'sesión sin técnica limpia reinicia la racha');

// 7) Cardio: crecimiento > 10% se advierte
const SR = base(eqAll);
SR.logs.push({ date: TW.ymd(TW.addDays(new Date(), -7)), ex: 'bici_estatica', sets: [], cardio: { km: 10, min: 30, rpe: 6 } });
const wr = Array.from({ length: 7 }, () => ({ exs: [] })); wr[0].exs = ['bici_estatica'];
wr[2].exs = ['high_knees']; // 30 + 10 min = 40 > 30 * 1.1
const vr = TW.validateWeek(Object.assign(SR, { status: { bici_estatica: 'activo', high_knees: 'activo' } }), wr);
ok(vr.warn.some(m => m.indexOf('+10%') >= 0), 'advierte cardio > +10% semanal');

// 8) Frecuencia cardíaca y análisis corporal
ok(TW.hrZone(140, 30).indexOf('Z') === 0, 'zona de FC calculada');
const an = TW.analyze({ weight: 90, height: 180, targetKg: 80, bodyType: 'endomorfo', waist: 100 });
ok(an.toLose === 10 && an.focus.indexOf('abdomen') >= 0, 'análisis: peso a bajar y áreas de enfoque');

// 9) Fases y promedio móvil
const ma = TW.ma7([{ date: 'a', kg: 80 }, { date: 'b', kg: 82 }]);
ok(Math.abs(ma[1].v - 81) < 1e-9, 'promedio móvil de los registros');

console.log(fails ? '\n' + fails + ' fallos' : '\nTodas las pruebas pasaron');
process.exit(fails ? 1 : 0);
