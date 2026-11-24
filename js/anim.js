/* Animaciones de técnica (SVG animado, funciona sin conexión). Un "rig" de esqueleto con longitudes
   fijas: cada movimiento define dos poses (inicio → final) y se interpola; las articulaciones se
   resuelven con cinemática inversa para que manos y pies queden apoyados. Vista lateral (y frontal para algunos). */
(function () {
  var TW = window.TW;
  var LEN = { tor: 24, ua: 13, fa: 12, th: 16, sh: 16, ft: 6 };
  var FLOOR = 73;
  function D(a) { var r = a * Math.PI / 180; return [Math.cos(r), -Math.sin(r)]; }
  function add(p, a, l) { var d = D(a); return [p[0] + d[0] * l, p[1] + d[1] * l]; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function lp(p, q, u) { return [lerp(p[0], q[0], u), lerp(p[1], q[1], u)]; }
  /* Cinemática inversa de 2 huesos: devuelve [articulación media, extremo]; hint = hacia dónde apunta el codo/rodilla. */
  function ik(A, B, l1, l2, hint) {
    var dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
    d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(d, l1 + l2 - 0.01));
    var a = Math.atan2(dy, dx), c = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))), g = Math.acos(c);
    var p1 = [A[0] + l1 * Math.cos(a + g), A[1] + l1 * Math.sin(a + g)], p2 = [A[0] + l1 * Math.cos(a - g), A[1] + l1 * Math.sin(a - g)];
    var m = (p1[0] * hint[0] + p1[1] * hint[1]) >= (p2[0] * hint[0] + p2[1] * hint[1]) ? p1 : p2;
    return [m, [A[0] + d * Math.cos(a), A[1] + d * Math.sin(a)]];
  }
  /* Esqueleto lateral. o: hip | shd (hombro fijo), tor, brazo (ua,fa | wr), pierna (th,sh | an), pierna lejana (th2,sh2 | an2). */
  function rig(o) {
    var tor = o.tor, hip = o.hip || add(o.shd, tor + 180, LEN.tor), sho = add(hip, tor, LEN.tor);
    var head = add(sho, tor + (o.hd || 0), 8.5), el, wr, kn, an, kn2, an2, toe, toe2;
    if (o.wr) { var a = ik(sho, o.wr, LEN.ua, LEN.fa, o.eh || [0, 1]); el = a[0]; wr = a[1]; }
    else { el = add(sho, o.ua, LEN.ua); wr = add(el, o.fa, LEN.fa); }
    if (o.an) { var b = ik(hip, o.an, LEN.th, LEN.sh, o.kh || [1, 0]); kn = b[0]; an = b[1]; }
    else { kn = add(hip, o.th, LEN.th); an = add(kn, o.sh, LEN.sh); }
    toe = add(an, o.ft == null ? 0 : o.ft, LEN.ft);
    var far = o.an2 || o.th2 != null;
    if (far) {
      if (o.an2) { var c = ik(hip, o.an2, LEN.th, LEN.sh, o.kh2 || o.kh || [1, 0]); kn2 = c[0]; an2 = c[1]; }
      else { kn2 = add(hip, o.th2, LEN.th); an2 = add(kn2, o.sh2, LEN.sh); }
      toe2 = add(an2, o.ft2 == null ? 0 : o.ft2, LEN.ft);
    }
    var pts = { hip: hip, sho: sho, el: el, wr: wr, kn: kn, an: an, toe: toe, head: head };
    if (far) { pts.kn2 = kn2; pts.an2 = an2; pts.toe2 = toe2; }
    if (o.pin) {
      var q = pts[o.pin.j], dx = o.pin.p[0] - q[0], dy = o.pin.p[1] - q[1];
      Object.keys(pts).forEach(function (k) { pts[k] = [pts[k][0] + dx, pts[k][1] + dy]; });
    }
    var bones = [];
    if (far) { bones.push([pts.hip, pts.kn2, 'thigh', 1], [pts.kn2, pts.an2, 'shin', 1], [pts.an2, pts.toe2, 'foot', 1]); }
    bones.push([pts.hip, pts.kn, 'thigh'], [pts.kn, pts.an, 'shin'], [pts.an, pts.toe, 'foot'], [pts.hip, pts.sho, 'torso'], [pts.sho, pts.el, 'uarm'], [pts.el, pts.wr, 'farm']);
    return { bones: bones, head: pts.head, hands: [pts.wr], an: pts.an, an2: pts.an2, sho: pts.sho, hip: pts.hip, delts: [pts.sho], glutes: [pts.hip] };
  }
  /* Esqueleto frontal (para elevaciones laterales, encogimientos, aperturas). o: sy, hy, ar/fr (ángulos) o wrR (destino mano derecha). */
  function front(o) {
    var cx = 60, sy = o.sy == null ? 15 : o.sy, hy = o.hy == null ? 39 : o.hy, sw = 9, bones = [], hands = [];
    var shR = [cx + sw, sy], shL = [cx - sw, sy];
    bones.push([[cx - 5, 71], [cx - 5, 55], 'shin'], [[cx - 5, 55], [cx - 5, hy], 'thigh'], [[cx + 5, hy], [cx + 5, 55], 'thigh'], [[cx + 5, 55], [cx + 5, 71], 'shin'],
      [[cx, hy], [cx, sy], 'torso'], [shL, shR, 'torso'], [[cx - 5, hy], [cx + 5, hy], 'torso']);
    [1, -1].forEach(function (s) {
      var sh = s > 0 ? shR : shL, el, wr;
      if (o.wr) { var w = [cx + s * (o.wr[0] - cx), o.wr[1]], r = ik(sh, w, LEN.ua, LEN.fa, [0, 1]); el = r[0]; wr = r[1]; }
      else {
        var ua = s > 0 ? o.ar : 180 - o.ar, fa = s > 0 ? o.fr : 180 - o.fr;
        el = add(sh, ua, LEN.ua); wr = add(el, fa, LEN.fa);
      }
      bones.push([sh, el, 'uarm'], [el, wr, 'farm']); hands.push(wr);
    });
    return { bones: bones, head: [cx, sy - 9], hands: hands, an: [cx + 5, 71], delts: [shL, shR], glutes: [], fr: true };
  }

  /* Cuerpo apoyado (flexiones/planchas): el cuerpo es una recta desde el pivote (puntas o rodillas) hasta el hombro;
     se busca el ángulo en el que el hombro queda a la distancia pedida de la mano fija. */
  function plankBody(P, Lb, W, dist) {
    var best = 0, bd = 1e9;
    for (var f = 0; f <= 50; f += 0.25) {
      var S = add(P, f, Lb), d = Math.hypot(S[0] - W[0], S[1] - W[1]);
      if (Math.abs(d - dist) < bd) { bd = Math.abs(d - dist); best = f; }
    }
    return best;
  }
  var TOE = [16, 71.5], HANDW = [88, 71];
  function pushupPose(u, knees) {
    var A, Lb, phi, o;
    var dist = lerp(24.3, 9, u);
    if (knees) {
      var K = [38, 70];
      phi = plankBody(K, 40, [HANDW[0] - 4, HANDW[1]], dist);
      var hip = add(K, phi, 16);
      o = { hip: hip, tor: phi, th: phi + 180, sh: 172, ft: 180, wr: [HANDW[0] - 4, HANDW[1]], eh: [-1, -0.4] };
    } else {
      A = [TOE[0] - 3, TOE[1] - 5.2]; Lb = 56;
      phi = plankBody(A, Lb, HANDW, dist);
      o = { hip: add(A, phi, 32), tor: phi, th: phi + 180, sh: phi + 180, ft: -60, wr: HANDW, eh: [-1, -0.4] };
    }
    return o;
  }

  /* ---- Movimientos: f(u, v) -> pose. u: 0 inicio, 1 final. ---- */
  var ST = function (x) { return { hip: [x, 39], tor: 90, th: 270, sh: 270 }; };
  var M = {};
  M.curl = { sc: 'floor', f: function (u) { var o = ST(56); o.ua = 272; o.fa = lerp(270, 428, u); return o; } };
  M.ohp = { sc: 'floor', f: function (u) { var o = ST(56); o.ua = lerp(290, 450, u); o.fa = lerp(80, 90, u); return o; } };
  M.front_raise = { sc: 'floor', f: function (u) { var o = ST(56); o.ua = o.fa = lerp(270, 358, u); return o; } };
  M.overhead_ext = { sc: 'floor', f: function (u) { var o = ST(56); o.ua = 92; o.fa = lerp(92, 235, u); return o; } };
  M.squat = { sc: 'floor', f: function (u, v) {
    var o = { an: [54, 71], hip: lp([54, 39], [41, 58], u), tor: lerp(90, 60, u), kh: [1, 0] };
    if (v === 'chest') { o.ua = 285; o.fa = 72; }
    else if (v === 'down') { o.ua = o.fa = 272; }
    else { o.ua = o.fa = lerp(270, 358, u); }
    return o;
  } };
  M.wall_sit = { sc: 'wall', f: function (u) {
    return { an: [68, 71], hip: [50, 55 + Math.sin(u * Math.PI) * 0.6], tor: 90, kh: [1, 0], ua: 285, fa: 340 };
  } };
  M.split_squat = { sc: 'floor', f: function (u, v) {
    var hipY = lerp(42, 56, u), bul = v === 'bul', R = bul ? [34, 55] : [38, 68];
    return { hip: [53, hipY], tor: 90, an: [66, 71], kh: [1, 0], an2: R, kh2: [0.2, 1], ft: 0, ft2: bul ? 0 : -55, ua: 272, fa: 272 };
  } };
  M.step_up = { sc: 'step', f: function (u) {
    var e = u * u * (3 - 2 * u);
    return { hip: lp([57, 43], [66, 27], e), tor: 90, an: [66, 57], kh: [1, 0], an2: lp([48, 71], [68, 40], e), kh2: [1, 0], ft2: lerp(0, -20, e), ua: 272, fa: 272 };
  } };
  M.hinge = { sc: 'floor', f: function (u, v) {
    var deep = v === 'fold', o = { an: [56, 71], hip: lp([56, 39], [deep ? 40 : 42, deep ? 44 : 42], u), tor: lerp(90, deep ? 8 : 24, u), kh: [0.8, -0.3] };
    o.ua = o.fa = 270;
    if (v === 'single') { o.th2 = lerp(270, 190, u); o.sh2 = lerp(270, 190, u); o.ft2 = 0; }
    return o;
  } };
  M.deadlift = { sc: 'floor', f: function (u) {
    return { an: [56, 71], hip: lp([41, 53], [56, 39], u), tor: lerp(40, 90, u), kh: [1, 0], ua: 270, fa: 270 };
  } };
  M.kb_swing = { sc: 'floor', f: function (u) {
    var e = u * u * (3 - 2 * u);
    return { an: [56, 71], hip: lp([42, 42], [56, 39], e), tor: lerp(25, 90, e), kh: [0.8, -0.3], ua: lerp(250, 358, e), fa: lerp(250, 358, e) };
  } };
  M.bridge = { sc: 'bridge', f: function (u, v) {
    var bench = v === 'bench', single = v === 'single', sh = bench ? [26, 58] : [26, 70];
    var th = bench ? lerp(-16, 8, u) : lerp(0, 34, u), o = { shd: sh, tor: 180 + th, an: [68, 71], kh: [0.3, -1], ua: 0, fa: 0, hd: -th };
    if (single) { o.th2 = lerp(60, 70, u); o.sh2 = lerp(60, 70, u); o.ft2 = 0; }
    o.wr = null;
    var r = o; return r;
  } };
  M.ham_slide = { sc: 'bridge', f: function (u) {
    return { shd: [26, 70], tor: 212, an: lp([74, 71], [56, 71], u), kh: [0.2, -1], ua: 0, fa: 0, hd: -32 };
  } };
  M.row_bent = { sc: 'floor', f: function (u) {
    var o = { an: [56, 71], hip: [42, 42], tor: 22, kh: [0.8, -0.3] };
    o.ua = lerp(270, 202, u); o.fa = lerp(270, 292, u); return o;
  } };
  M.kickback = { sc: 'floor', f: function (u) {
    var o = { an: [56, 71], hip: [42, 42], tor: 22, kh: [0.8, -0.3] };
    o.ua = 172; o.fa = lerp(270, 172, u); return o;
  } };
  M.row_seated = { sc: 'floor', f: function (u) {
    return { hip: [44, 69], tor: lerp(92, 100, u), th: 2, sh: 2, ft: 80, ua: lerp(360, 192, u), fa: lerp(360, 350, u), hd: 0 };
  } };
  M.pullup = { sc: 'bar', f: function (u) {
    var e = u * u * (3 - 2 * u);
    return { shd: lp([58, 19], [58, 6], e), tor: 90, wr: [60, -6], eh: [-1, 0.2], th: 270, sh: lerp(262, 235, e), ft: 0 };
  } };
  M.superman = { sc: 'floor', f: function (u) {
    return { hip: [64, 68], tor: lerp(180, 163, u), th: lerp(0, 12, u), sh: lerp(0, 12, u), ft: 0, ua: lerp(180, 162, u), fa: lerp(180, 162, u), hd: 0 };
  } };
  M.pushup = { sc: 'floor', f: function (u, v) { return pushupPose(u, v === 'knees'); } };
  M.plank = { sc: 'floor', f: function (u, v) {
    var A = [TOE[0] - 3, TOE[1] - 5.2], phi = 10.6 + Math.sin(u * Math.PI) * 0.9;
    return { hip: add(A, phi, 32), tor: phi, th: phi + 180, sh: phi + 180, ft: -60, ua: 270, fa: 0 };
  } };
  M.side_plank = { sc: 'floor', f: function (u) {
    var S = [80, 55], lift = lerp(-8, 0, u), tor = 22;
    return { shd: S, tor: tor + 180 - 180 + 0, hip: add(S, tor + 180, 24), th: tor + 180 + lift, sh: tor + 180 + lift, ft: -60, ua: 270, fa: 0, __sp: 1 };
  } };
  M.crunch = { sc: 'floor', f: function (u) {
    var o = { hip: [62, 69], tor: lerp(180, 150, u), an: [82, 71], kh: [0.3, -1] };
    var sho = add(o.hip, o.tor, LEN.tor); o.wr = add(sho, o.tor + 0, 9); o.eh = [0, -1]; return o;
  } };
  M.bicycle = { sc: 'floor', f: function (u) {
    var o = { hip: [62, 69], tor: 152, wr: null, ua: 120, fa: 200, hd: 0 };
    o.th = lerp(108, 14, u); o.sh = lerp(8, 12, u); o.th2 = lerp(14, 108, u); o.sh2 = lerp(12, 8, u); return o;
  } };
  M.dead_bug = { sc: 'floor', f: function (u) {
    return { hip: [62, 69], tor: 180, th: 95, sh: 2, th2: lerp(95, 16, u), sh2: lerp(2, 12, u), ua: lerp(90, 178, u), fa: lerp(90, 178, u) };
  } };
  M.leg_raise = { sc: 'floor', f: function (u) {
    return { hip: [62, 69], tor: 180, th: lerp(4, 84, u), sh: lerp(4, 84, u), th2: lerp(2, 82, u), sh2: lerp(2, 82, u), ua: 0, fa: 0 };
  } };
  M.bird_dog = { sc: 'floor', f: function (u) {
    return { hip: [52, 53], tor: 12, th: 270, sh: 186, ft: 180, th2: lerp(270, 176, u), sh2: lerp(186, 176, u), ft2: 180, ua: lerp(270, 358, u), fa: lerp(270, 358, u) };
  } };
  M.quad_kick = { sc: 'floor', f: function (u) {
    return { hip: [52, 53], tor: 12, th: lerp(270, 172, u), sh: lerp(186, 172, u), ft: lerp(180, 168, u), th2: 270, sh2: 186, ft2: 180, ua: 270, fa: 270 };
  } };
  M.mountain = { sc: 'floor', f: function (u) {
    var A = [TOE[0] - 3, TOE[1] - 5.2], phi = 17, o = { hip: add(A, phi, 32), tor: phi, wr: HANDW, eh: [-1, -0.4], ft: -60, ft2: -60 };
    o.th = lerp(phi + 180, 300, u); o.sh = lerp(phi + 180, 252, u); o.th2 = lerp(300, phi + 180, u); o.sh2 = lerp(252, phi + 180, u); return o;
  } };
  M.calf_raise = { sc: 'floor', f: function (u) {
    var o = ST(56); o.ua = o.fa = 270; o.ft = lerp(0, -52, u); o.pin = { j: 'toe', p: [lerp(62, 62, u), 72.5] }; return o;
  } };
  M.march = { sc: 'floor', f: function (u) {
    var o = ST(56); o.th = lerp(345, 270, u); o.sh = 270; o.th2 = lerp(270, 345, u); o.sh2 = 270;
    o.ua = lerp(300, 240, u); o.fa = lerp(330, 300, u); return o;
  } };
  M.boxing = { sc: 'floor', f: function (u) {
    var o = { hip: [56, 39], tor: 92, th: 285, sh: 268, th2: 255, sh2: 272, ft: 0, ft2: 0 };
    o.ua = lerp(300, 355, u); o.fa = lerp(60, 357, u); return o;
  } };
  /* vistas frontales */
  M.lateral_raise = { sc: 'floor', front: 1, f: function (u) { return { ar: lerp(272, 358, u), fr: lerp(272, 360, u) }; } };
  M.shrug = { sc: 'floor', front: 1, f: function (u) { return { sy: lerp(15, 11, u), hy: 39, ar: 272, fr: 272 }; } };
  M.pull_apart = { sc: 'floor', front: 1, f: function (u) { return { wr: [lerp(62, 97, u), lerp(19, 15, u)] }; } };
  M.fly = { sc: 'floor', front: 1, lying: 1, f: function (u) { return { wr: [lerp(63, 99, u), lerp(34, 64, u)] }; } };
  M.floor_press = { sc: 'floor', f: function (u) {
    var o = { hip: [62, 69], tor: 180, an: [82, 71], kh: [0.3, -1] };
    o.ua = lerp(188, 90, u); o.fa = lerp(92, 90, u); return o;
  } };
  M.skull = { sc: 'floor', f: function (u) {
    var o = { hip: [62, 69], tor: 180, an: [82, 71], kh: [0.3, -1] };
    o.ua = 94; o.fa = lerp(92, 176, u); return o;
  } };
  M.catcow = { sc: 'floor', f: function (u) {
    return { hip: [52, 53], tor: lerp(2, 22, u), th: 270, sh: 186, ft: 180, ua: 270, fa: 270, hd: lerp(10, -30, u) };
  } };
  M.calfstretch = { sc: 'wall', f: function (u) {
    return { an: [50, 71], hip: lp([58, 40], [62, 41], u), tor: lerp(80, 72, u), kh: [1, 0], th2: 200, sh2: 198, ua: 15, fa: 15, ft: 0 };
  } };

  /* ---- Escenas estáticas ---- */
  var SC = {
    floor: function () { return '<line class="fl" x1="2" y1="73" x2="118" y2="73"/>'; },
    wall: function () { return SC.floor() + '<line class="wl" x1="44" y1="-6" x2="44" y2="73"/>'; },
    step: function () { return SC.floor() + '<rect class="bx" x="56" y="59" width="30" height="14" rx="2"/>'; },
    bridge: function (v) { return SC.floor() + (v === 'bench' ? '<rect class="bx" x="10" y="60" width="30" height="13" rx="2"/>' : ''); },
    bar: function () { return SC.floor() + '<line class="br" x1="40" y1="-6" x2="82" y2="-6"/>'; }
  };

  /* ---- Texto de ayuda por movimiento: inicio · movimiento · cierre ---- */
  TW.CUES = {
    curl: ['De pie, pies al ancho de cadera, codos pegados al tronco y palmas hacia delante.', 'Sube la pesa flexionando solo el codo; no balancees el cuerpo.', 'Aprieta arriba 1 s y baja en 2–3 s. Exhala al subir.'],
    ohp: ['Pesas a la altura de los hombros, abdomen firme, glúteos apretados.', 'Empuja hacia arriba sin arquear la espalda baja.', 'Brazos casi estirados arriba y baja controlado. Exhala al empujar.'],
    front_raise: ['De pie, pesas frente a los muslos, abdomen firme.', 'Eleva con brazos casi rectos hasta la altura de los hombros.', 'Pausa breve arriba; baja en 2–3 s sin impulso.'],
    overhead_ext: ['Pesa sostenida sobre la cabeza, codos apuntando al frente y cerca de las orejas.', 'Baja la pesa detrás de la cabeza flexionando solo el codo.', 'Estira el codo para volver arriba. Cuello neutro, sin arquear la espalda.'],
    squat: ['Pies al ancho de hombros o algo más, puntas ligeramente hacia fuera, pecho erguido.', 'Lleva la cadera atrás y abajo; las rodillas siguen la línea de los pies.', 'Baja hasta donde mantengas talones apoyados y espalda neutra; sube empujando el suelo.'],
    wall_sit: ['Espalda apoyada en la pared, pies a unos 60 cm de ella.', 'Desliza hasta que rodillas y cadera formen casi 90°.', 'Mantén respirando normal; rodillas sobre los tobillos. Sal despacio.'],
    split_squat: ['Un pie adelante y otro atrás, tronco erguido, peso repartido.', 'Baja la rodilla de atrás hacia el suelo; la de adelante no pasa mucho la punta del pie.', 'Empuja con el talón de adelante para subir. Haz todas las repeticiones y cambia de pierna.'],
    step_up: ['Frente a un escalón o cajón estable, pie completo sobre él.', 'Empuja con la pierna de arriba para subir, sin impulsarte con la de abajo.', 'Sube erguido, baja controlado y repite; luego cambia de pierna.'],
    hinge: ['De pie, rodillas ligeramente flexionadas, pesas frente a los muslos.', 'Lleva la cadera atrás, la espalda queda plana y las pesas rozan las piernas.', 'Baja hasta sentir el estiramiento atrás del muslo y sube apretando glúteos.'],
    deadlift: ['Pesa cerca de las espinillas, cadera atrás, espalda neutra, pecho arriba.', 'Empuja el suelo con los pies y extiende cadera y rodillas a la vez.', 'Termina erguido, glúteos apretados; baja con la misma trayectoria.'],
    kb_swing: ['Pies al ancho de hombros, kettlebell entre las piernas, espalda plana.', 'Extiende la cadera con fuerza; los brazos solo guían.', 'La pesa sube hasta el pecho y regresa con la cadera atrás. Exhala al subir.'],
    bridge: ['Tumbado boca arriba, rodillas dobladas y talones cerca de los glúteos.', 'Empuja con los talones y sube la cadera apretando glúteos.', 'Cuerpo en línea de hombros a rodillas; pausa 1 s arriba y baja lento.'],
    ham_slide: ['Tumbado, cadera elevada, talones sobre una toalla en suelo liso.', 'Desliza los talones alejándolos sin bajar la cadera.', 'Regresa los talones flexionando las rodillas y apretando atrás del muslo.'],
    row_bent: ['Inclina el tronco con espalda plana, rodillas flexionadas, brazos colgando.', 'Lleva los codos hacia atrás y arriba, juntando las escápulas.', 'Pausa 1 s y baja controlado. Exhala al jalar.'],
    kickback: ['Tronco inclinado con espalda plana, codo pegado al cuerpo y doblado a 90°.', 'Estira el antebrazo hacia atrás sin mover el brazo.', 'Aprieta el tríceps 1 s y regresa lento.'],
    row_seated: ['Sentado con piernas estiradas, banda en los pies, espalda erguida.', 'Jala los codos hacia atrás pegados al cuerpo y junta las escápulas.', 'Pausa 1 s y vuelve despacio sin encorvarte.'],
    pullup: ['Cuelga de la barra con agarre firme, hombros activos.', 'Tira de los codos hacia abajo y sube el pecho hacia la barra.', 'Mentón sobre la barra; baja controlado hasta brazos casi estirados.'],
    superman: ['Boca abajo, brazos al frente, frente apoyada, cuello neutro.', 'Eleva a la vez brazos, pecho y piernas unos centímetros.', 'Pausa 1–2 s apretando espalda baja y glúteos; baja lento.'],
    pushup: ['Manos bajo los hombros, cuerpo recto de cabeza a talones (o a rodillas).', 'Baja el pecho cerca del suelo con codos a unos 45° del tronco.', 'Empuja hasta estirar los brazos sin hundir la cadera.'],
    plank: ['Antebrazos apoyados, codos bajo los hombros, cuerpo en línea recta.', 'Aprieta abdomen y glúteos, mirada al suelo.', 'Mantén respirando; si la cadera cae, detente y descansa.'],
    side_plank: ['De lado, codo bajo el hombro, pies apilados.', 'Eleva la cadera hasta alinear cuerpo de cabeza a pies.', 'Mantén sin dejar caer la cadera; cambia de lado.'],
    crunch: ['Tumbado, rodillas dobladas, manos suaves detrás de la cabeza.', 'Eleva los hombros con el abdomen; no tires del cuello.', 'Exhala arriba, baja lento con la lumbar apoyada.'],
    bicycle: ['Tumbado, manos detrás de la cabeza, piernas en el aire.', 'Lleva codo y rodilla opuestos a encontrarse mientras estiras la otra pierna.', 'Alterna con control; la lumbar no se despega del suelo.'],
    dead_bug: ['Boca arriba, brazos al techo, rodillas a 90°, lumbar pegada al suelo.', 'Baja un brazo y la pierna contraria sin arquear la espalda.', 'Regresa y alterna lado a lado, respirando constante.'],
    leg_raise: ['Boca arriba, manos bajo la cadera, lumbar apoyada.', 'Sube las piernas casi rectas hasta la vertical.', 'Baja lento sin que la espalda baja se arquee; flexiona rodillas si cuesta.'],
    bird_dog: ['En cuatro apoyos, manos bajo hombros y rodillas bajo cadera, espalda neutra.', 'Estira un brazo y la pierna contraria sin rotar la cadera.', 'Pausa 2 s y alterna.'],
    quad_kick: ['En cuatro apoyos, espalda neutra, abdomen firme.', 'Estira una pierna hacia atrás y arriba apretando el glúteo.', 'No arquees la lumbar; regresa y repite, luego cambia.'],
    mountain: ['Posición de plancha alta, manos bajo hombros.', 'Lleva una rodilla hacia el pecho y alterna a ritmo controlado.', 'Cadera estable, sin rebotar.'],
    calf_raise: ['De pie con la punta de los pies firme, apoyo ligero si lo necesitas.', 'Sube sobre las puntas lo más alto que puedas.', 'Pausa 1 s arriba y baja lento hasta estirar.'],
    march: ['De pie, postura alta, abdomen firme.', 'Eleva rodillas alternando y balancea los brazos.', 'Ritmo constante sin saltar (bajo impacto).'],
    boxing: ['Postura ligera, puños en guardia junto a la cara.', 'Lanza golpes rectos alternando, rotando levemente el torso.', 'Mantén el ritmo; baja la intensidad si te falta el aire.'],
    lateral_raise: ['De pie, pesas a los lados, codos ligeramente flexionados.', 'Eleva los brazos hacia los lados hasta la altura de los hombros.', 'Baja en 2–3 s; sin encoger los hombros ni usar impulso.'],
    shrug: ['De pie, pesas a los lados, brazos relajados.', 'Sube los hombros hacia las orejas sin doblar los codos.', 'Pausa 1 s y baja lento; no rotes los hombros.'],
    pull_apart: ['Banda tensa frente al pecho con los brazos estirados.', 'Separa las manos llevando los brazos hacia los lados.', 'Junta las escápulas, vuelve despacio sin perder la tensión.'],
    fly: ['Tumbado con las pesas sobre el pecho, codos ligeramente doblados.', 'Abre los brazos en arco hasta que los codos toquen el suelo.', 'Cierra apretando el pecho como abrazando un árbol.'],
    floor_press: ['Tumbado, rodillas dobladas, pesas a los lados del pecho con codos apoyados.', 'Empuja las pesas hacia arriba hasta estirar los brazos.', 'Baja despacio hasta que el codo toque el suelo y repite.'],
    skull: ['Tumbado con las pesas sobre el pecho, brazos verticales.', 'Flexiona solo los codos y lleva las pesas hacia la frente.', 'Estira de nuevo los codos sin mover los brazos.'],
    catcow: ['En cuatro apoyos, espalda neutra.', 'Alterna redondear y arquear la columna suavemente.', 'Mueve despacio con la respiración.'],
    calfstretch: ['De pie frente a la pared, una pierna atrás con el talón apoyado.', 'Inclínate hacia la pared manteniendo la pierna de atrás estirada.', 'Mantén 30 s respirando; cambia de pierna.']
  };

  /* Qué segmentos se resaltan según el músculo principal. */
  var HL = {
    pecho: ['torsoU'], espalda: ['torsoU', 'uarm'], hombros: ['delt', 'uarm'], biceps: ['uarm', 'farm'], triceps: ['uarm', 'farm'],
    cuadriceps: ['thigh'], isquiotibiales: ['thigh'], gluteos: ['glute', 'thigh'], abdomen: ['torsoL'], pantorrillas: ['shin', 'foot'],
    cuerpo_completo: [], cardio: [], movilidad: []
  };
  /* Semianchos [inicio, centro (vientre muscular), fin] de cada segmento; en vista frontal el tronco es más ancho. */
  var WID = {
    thigh: [5.4, 6.6, 3.6], shin: [3.6, 4.2, 2.0], foot: [1.9, 1.9, 1.3], uarm: [3.5, 3.9, 2.6], farm: [2.7, 3.0, 1.7],
    torsoU: [6.3, 6.8, 5.6], torsoL: [5.6, 5.1, 5.9]
  };
  var WIDF = { thigh: [4.6, 5.0, 3.4], shin: [3.4, 3.8, 2.2], torsoU: [9.4, 8.6, 7.4], torsoL: [7.2, 6.6, 6.6] };
  /* Cuerpo del segmento como vientre muscular (curva) alrededor del hueso; k = bulto por contracción. */
  function belly(p, q, type, fr, k) {
    var w = (fr && WIDF[type]) || WID[type];
    if (!w) return null;
    var dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    var m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], w0 = w[0], w1 = w[2], wm = w[1] * k;
    var f = function (pt, n, ww) { return [pt[0] + nx * ww * n, pt[1] + ny * ww * n]; };
    var a0 = f(p, 1, w0), a1 = f(q, 1, w1), b1 = f(q, -1, w1), b0 = f(p, -1, w0), am = f(m, 1, wm * 1.9 - (w0 + w1) / 2), bm = f(m, -1, wm * 1.9 - (w0 + w1) / 2);
    var r = rnd;
    return 'M' + r(a0[0]) + ' ' + r(a0[1]) + 'Q' + r(am[0]) + ' ' + r(am[1]) + ' ' + r(a1[0]) + ' ' + r(a1[1]) + 'L' + r(b1[0]) + ' ' + r(b1[1]) + 'Q' + r(bm[0]) + ' ' + r(bm[1]) + ' ' + r(b0[0]) + ' ' + r(b0[1]) + 'Z';
  }
  /* Fibras: tres líneas que siguen la dirección del músculo, dentro del vientre. */
  function fibers(p, q, type, fr, k) {
    var w = (fr && WIDF[type]) || WID[type];
    if (!w) return null;
    var dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, d = '', r = rnd;
    [-0.5, 0, 0.5].forEach(function (o) {
      var s0 = [p[0] + dx * 0.12 + nx * w[0] * o * 0.8, p[1] + dy * 0.12 + ny * w[0] * o * 0.8], s1 = [q[0] - dx * 0.12 + nx * w[2] * o * 0.8, q[1] - dy * 0.12 + ny * w[2] * o * 0.8];
      var mm = [(s0[0] + s1[0]) / 2 + nx * w[1] * k * o * 1.3, (s0[1] + s1[1]) / 2 + ny * w[1] * k * o * 1.3];
      d += 'M' + r(s0[0]) + ' ' + r(s0[1]) + 'Q' + r(mm[0]) + ' ' + r(mm[1]) + ' ' + r(s1[0]) + ' ' + r(s1[1]);
    });
    return d;
  }
  function ell(c, rx, ry, k) { var r = rnd; return 'M' + r(c[0] - rx * k) + ' ' + r(c[1]) + 'a' + r(rx * k) + ' ' + r(ry * k) + ' 0 1 0 ' + r(2 * rx * k) + ' 0a' + r(rx * k) + ' ' + r(ry * k) + ' 0 1 0 ' + r(-2 * rx * k) + ' 0Z'; }
  var GID = 0;

  function rnd(n) { return Math.round(n * 10) / 10; }
  function frameOf(m, v, u) {
    var o = m.f(u, v), r;
    if (m.front) { r = front(o); if (m.lying) r = lyingFront(o); }
    else r = rig(o);
    return r;
  }
  function lyingFront(o) {
    var cx = 60, sy = 66, bones = [], hands = [], sw = 9;
    bones.push([[cx, 70], [cx, sy], 'torso'], [[cx - sw, sy], [cx + sw, sy], 'torso']);
    [1, -1].forEach(function (s) {
      var sh = [cx + s * sw, sy], w = [cx + s * (o.wr[0] - cx), o.wr[1]], r = ik(sh, w, LEN.ua, LEN.fa, [s * 0.6, -1]);
      bones.push([sh, r[0], 'uarm'], [r[0], r[1], 'farm']); hands.push(r[1]);
    });
    return { bones: bones, head: [cx, 58], hands: hands, an: [cx, 70], delts: [[cx - sw, sy], [cx + sw, sy]], glutes: [], fr: true };
  }
  /* Construye el SVG animado. e: ejercicio; opts.motion: [clave, variante]. */
  TW.animSVG = function (e, opts) {
    opts = opts || {};
    var mo = opts.motion || (TW.MOTION_OF && TW.MOTION_OF[e.id]);
    if (!mo) return '';
    var key = mo[0], v = mo[1], m = M[key]; if (!m) return '';
    var eq = e.equip || [], prop = eq.indexOf('barra') >= 0 ? 'bar' : eq.indexOf('kettlebell') >= 0 ? 'kb' : eq.indexOf('mancuernas') >= 0 ? 'db' :
      (eq.indexOf('banda_rosa') >= 0 || eq.indexOf('banda_turquesa') >= 0) ? 'band' : null;
    if (opts.noProp) prop = null;
    var prim = (e.muscles || [])[0], hl = HL[prim] || [];
    var N = 10, frames = [], i, u;
    for (i = 0; i <= N; i++) frames.push(frameOf(m, v, i / N));
    for (i = N - 1; i >= 1; i--) frames.push(frames[i]);
    var hold = [frames[0], frames[0], frames[0]], hold2 = [frames[N], frames[N], frames[N]];
    var seq = hold.concat(frames.slice(0, N + 1), hold2, frames.slice(N + 1)), n = seq.length;
    var f0 = seq[0], out = '', dur = (opts.dur || 3.6) + 's';
    var vals = function (fn) { return seq.map(function (f) { return rnd(fn(f)); }).join(';'); };
    var anim = function (attr, fn) { return '<animate attributeName="' + attr + '" values="' + vals(fn) + '" dur="' + dur + '" repeatCount="indefinite"/>'; };
    out += (SC[m.sc] || SC.floor)(v) + '';
    if (m.sc === 'bar') out = out;
    var gid = 'mg' + (++GID), sec = (e.muscles || []).slice(1, 3).reduce(function (acc, mm) { return acc.concat(HL[mm] || []); }, []);
    var us = [0, 0, 0].concat(frames.slice(0, N + 1).map(function (_, j) { return j / N; }), [1, 1, 1], frames.slice(N + 1).map(function (_, j) { return (N - 1 - j) / N; }));
    var kOf = function (j, on) { return on ? 1 + 0.26 * Math.sin(Math.PI * us[j]) : 1; };
    out = '<defs><linearGradient id="' + gid + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7b61"/><stop offset=".55" stop-color="#e0362b"/><stop offset="1" stop-color="#8f1712"/></linearGradient>' +
      '<linearGradient id="' + gid + 'o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb05a"/><stop offset="1" stop-color="#c76a1a"/></linearGradient>' +
      '<linearGradient id="' + gid + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6f80"/><stop offset="1" stop-color="#3a3d49"/></linearGradient></defs>' + out;
    f0.bones.forEach(function (b, k) {
      out += '<line class="bn ' + b[2] + (b[3] ? ' far' : '') + '" x1="' + rnd(b[0][0]) + '" y1="' + rnd(b[0][1]) + '" x2="' + rnd(b[1][0]) + '" y2="' + rnd(b[1][1]) + '">' +
        anim('x1', function (f) { return f.bones[k][0][0]; }) + anim('y1', function (f) { return f.bones[k][0][1]; }) +
        anim('x2', function (f) { return f.bones[k][1][0]; }) + anim('y2', function (f) { return f.bones[k][1][1]; }) + '</line>';
    });
    var shapes = [];
    f0.bones.forEach(function (b, k) {
      var tp = b[2];
      if (tp === 'torso') {
        var vert = Math.abs(b[1][0] - b[0][0]) < 0.6 * Math.abs(b[1][1] - b[0][1]) + 0.01 || !f0.fr;
        if (!vert) return;
        shapes.push({ k: k, type: 'torsoU', t0: 1, t1: 0.5 }, { k: k, type: 'torsoL', t0: 0.5, t1: 0 });
      } else shapes.push({ k: k, type: tp, t0: 0, t1: 1, far: b[3] });
    });
    var seg = function (f, s) { var b = f.bones[s.k], P = b[0], Q = b[1]; return [lp(P, Q, s.t0), lp(P, Q, s.t1)]; };
    shapes.forEach(function (s) {
      var on = !s.far && hl.indexOf(s.type) >= 0, on2 = !s.far && !on && sec.indexOf(s.type) >= 0, st = on ? 'r' : on2 ? 'o' : 'b';
      var dpath = function (j) { var q = seg(seq[j], s); return belly(q[0], q[1], s.type, f0.fr, kOf(j, on)); };
      if (!dpath(0)) return;
      out += '<path class="mus ' + (on ? 'hl' : on2 ? 'hl2' : s.far ? 'far' : '') + '" fill="url(#' + gid + st + ')" d="' + dpath(0) + '">' +
        '<animate attributeName="d" values="' + seq.map(function (_, j) { return dpath(j); }).join(';') + '" dur="' + dur + '" repeatCount="indefinite"/></path>';
      if (on || on2) {
        var fp = function (j) { var q = seg(seq[j], s); return fibers(q[0], q[1], s.type, f0.fr, kOf(j, on)); };
        out += '<path class="fib" d="' + fp(0) + '"><animate attributeName="d" values="' + seq.map(function (_, j) { return fp(j); }).join(';') + '" dur="' + dur + '" repeatCount="indefinite"/></path>';
      }
    });
    [['delts', 'delt', 5.0, 5.2], ['glutes', 'glute', 5.6, 5.0]].forEach(function (pp) {
      (f0[pp[0]] || []).forEach(function (c0, idx) {
        var on = hl.indexOf(pp[1]) >= 0, on2 = !on && sec.indexOf(pp[1]) >= 0;
        if (pp[1] === 'glute' && !on && !on2) return;
        var dp = function (j) { return ell(seq[j][pp[0]][idx], pp[2] * 0.62, pp[3] * 0.62, kOf(j, on)); };
        out += '<path class="mus ' + (on ? 'hl' : on2 ? 'hl2' : '') + '" fill="url(#' + gid + (on ? 'r' : on2 ? 'o' : 'b') + ')" d="' + dp(0) + '"><animate attributeName="d" values="' + seq.map(function (_, j) { return dp(j); }).join(';') + '" dur="' + dur + '" repeatCount="indefinite"/></path>';
      });
    });
    out += '<circle class="hd" r="5" cx="' + rnd(f0.head[0]) + '" cy="' + rnd(f0.head[1]) + '">' + anim('cx', function (f) { return f.head[0]; }) + anim('cy', function (f) { return f.head[1]; }) + '</circle>';
    var hands = f0.hands.length;
    if (prop === 'band') {
      if (m.front) {
        out += '<line class="bd" x1="' + rnd(f0.hands[0][0]) + '" y1="' + rnd(f0.hands[0][1]) + '" x2="' + rnd(f0.hands[1][0]) + '" y2="' + rnd(f0.hands[1][1]) + '">' +
          anim('x1', function (f) { return f.hands[0][0]; }) + anim('y1', function (f) { return f.hands[0][1]; }) + anim('x2', function (f) { return f.hands[1][0]; }) + anim('y2', function (f) { return f.hands[1][1]; }) + '</line>';
      } else {
        out += '<line class="bd" x1="' + rnd(f0.hands[0][0]) + '" y1="' + rnd(f0.hands[0][1]) + '" x2="' + rnd(f0.an[0]) + '" y2="' + rnd(f0.an[1]) + '">' +
          anim('x1', function (f) { return f.hands[0][0]; }) + anim('y1', function (f) { return f.hands[0][1]; }) + anim('x2', function (f) { return f.an[0]; }) + anim('y2', function (f) { return f.an[1]; }) + '</line>';
      }
    } else if (prop) {
      var rr = prop === 'bar' ? 5.2 : prop === 'kb' ? 4.4 : 3.2;
      f0.hands.forEach(function (h, k) {
        out += '<circle class="wt ' + prop + '" r="' + rr + '" cx="' + rnd(h[0]) + '" cy="' + rnd(h[1]) + '">' +
          anim('cx', function (f) { return f.hands[k][0]; }) + anim('cy', function (f) { return f.hands[k][1] + (prop === 'kb' ? 3 : 0); }) + '</circle>';
      });
    }
    out += '<g class="lgd"><circle cx="5" cy="-11" r="1.8" fill="#e0362b"/><text x="9" y="-9.6">principal</text><circle cx="35" cy="-11" r="1.8" fill="#e08a2b"/><text x="39" y="-9.6">apoyo</text></g>';
    return '<svg class="anim" viewBox="0 -16 120 94" role="img" aria-label="Animación de la técnica: ' + esc(e.name) + '">' + out + '</svg>';
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  TW.MOTIONS = M;
  TW.frameOf = frameOf;
})();
