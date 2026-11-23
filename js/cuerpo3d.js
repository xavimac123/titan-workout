/* Figura masculina 3D (sin librerías): elipsoides sombreados en canvas.
   Rojo = músculo (núcleo), amarillo translúcido = grasa que cubre cada zona. Es una ilustración estimada, no un escáner. */
(function () {
  var TW = window.TW, PI = Math.PI;
  var perim = function (a, b) { return PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))); };
  /* Semiejes (a mayor, b menor) de una elipse con la circunferencia dada y relación a:b */
  var ell = function (circ, ratio) { var u = perim(1, 1 / ratio), a = circ / u; return [a, a / ratio]; };
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };

  /* Zonas de grasa: factor de cuánto de la grasa total se acumula allí. */
  var ALPHA = { abd: 0.85, pel: 0.8, che: 0.42, arm: 0.22, thi: 0.3, cal: 0.2, nec: 0.3, del: 0.25 };
  var FAT = { abd: 1.35, pel: 1.0, che: 0.8, arm: 0.6, thi: 0.8, cal: 0.4, nec: 0.5, del: 0.5 };

  TW.bodyParts = function (m) {
    var H = m.h || 174, k = H / 174, bf = clamp((m.fat && m.fat.pct != null ? m.fat.pct : 25) / 100, 0.04, 0.6);
    var waist = m.waist || 100, neck = m.neck || 38, arm = m.arm || 32;
    var che = ell(waist * 0.96 + 8, 1.4), abd = ell(waist, 1.18), hip = ell(waist * 0.97, 1.3), nR = neck / (2 * PI);
    var aR = arm / (2 * PI), thR = waist * 0.97 * 0.58 / (2 * PI), clR = waist * 0.97 * 0.37 / (2 * PI);
    var P = [], add = function (id, c, r, region, o) { o = o || {}; P.push({ id: id, c: c, r: r, region: region, tilt: o.tilt || 0, skin: !!o.skin }); };
    add('head', [0, 0.935 * H, 0], [7.6 * k, 11.6 * k, 9.2 * k], null, { skin: true });
    add('neck', [0, 0.865 * H, 0], [nR, 5.5 * k, nR * 0.95], 'nec');
    add('chest', [0, 0.755 * H, 0], [che[0], 17 * k, che[1]], 'che');
    add('abd', [0, 0.625 * H, abd[1] * 0.08], [abd[0], 16 * k, abd[1]], 'abd');
    add('pelvis', [0, 0.535 * H, 0], [hip[0], 15 * k, hip[1]], 'pel');
    [-1, 1].forEach(function (s) {
      add('delt' + s, [s * (che[0] + 2 * k), 0.795 * H, 0], [6.8 * k, 6.8 * k, 6.8 * k], 'del');
      add('uarm' + s, [s * (che[0] + aR * 0.8 + 3 * k), 0.70 * H, 0], [aR, 16 * k, aR], 'arm', { tilt: -s * 7 });
      add('farm' + s, [s * (che[0] + aR * 0.8 + 8 * k), 0.565 * H, 0], [aR * 0.78, 15 * k, aR * 0.78], 'arm', { tilt: -s * 10 });
      add('hand' + s, [s * (che[0] + aR * 0.8 + 12 * k), 0.465 * H, 0], [3.4 * k, 6 * k, 2.6 * k], null, { skin: true, tilt: -s * 10 });
      add('thigh' + s, [s * hip[0] * 0.48, 0.385 * H, 0], [thR, 25 * k, thR * 0.95], 'thi');
      add('calf' + s, [s * hip[0] * 0.44, 0.19 * H, -1 * k], [clR, 20 * k, clR], 'cal');
      add('foot' + s, [s * hip[0] * 0.44, 0.022 * H, 4 * k], [4.4 * k, 3 * k, 10 * k], null, { skin: true });
    });
    P.forEach(function (p) {
      var f = p.region ? clamp(bf * FAT[p.region] * 0.6, 0, 0.5) : 0;
      p.f = f;
    });
    return { parts: P, H: H };
  };

  /* Malla de un elipsoide: vértices en coordenadas de mundo (antes de rotar la vista) y normales. */
  function mesh(p, scale, nu, nv) {
    var t = p.tilt * PI / 180, ct = Math.cos(t), st = Math.sin(t), V = [], N = [];
    for (var j = 0; j <= nv; j++) {
      var ph = -PI / 2 + PI * j / nv, cp = Math.cos(ph), sp = Math.sin(ph);
      for (var i = 0; i <= nu; i++) {
        var th = 2 * PI * i / nu, ctn = Math.cos(th), stn = Math.sin(th);
        var x = p.r[0] * scale * cp * ctn, y = p.r[1] * scale * sp, z = p.r[2] * scale * cp * stn;
        var nx = cp * ctn / (p.r[0] * scale), ny = sp / (p.r[1] * scale), nz = cp * stn / (p.r[2] * scale), nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= nl; ny /= nl; nz /= nl;
        V.push([p.c[0] + x * ct - y * st, p.c[1] + x * st + y * ct, p.c[2] + z]);
        N.push([nx * ct - ny * st, nx * st + ny * ct, nz]);
      }
    }
    return { V: V, N: N, nu: nu, nv: nv };
  }

  var LIGHT = (function () { var l = [-0.45, 0.55, 0.75], n = Math.sqrt(l[0] * l[0] + l[1] * l[1] + l[2] * l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();

  /* Prepara el cuerpo (mallas) una vez; dibuja(ángulo) lo vuelve a pintar. */
  TW.body3d = function (canvas, model, opts) {
    opts = opts || {};
    var B = TW.bodyParts(model), nu = 12, nv = 8, layers = [];
    B.parts.forEach(function (p) {
      if (p.skin) { layers.push({ kind: 's', m: mesh(p, 1, nu, nv) }); return; }
      layers.push({ kind: 'm', m: mesh(p, 1 - p.f, nu, nv) });
      if (p.f > 0.005) layers.push({ kind: 'f', al: ALPHA[p.region] || 0.4, m: mesh(p, 1, nu, nv) });
    });
    var ctx = canvas.getContext('2d'), dpr = window.devicePixelRatio || 1;
    var cw = canvas.clientWidth || 170, chh = canvas.clientHeight || 300;
    canvas.width = cw * dpr; canvas.height = chh * dpr;
    var scale = (chh * 0.94) / (B.H * 1.03), baseY = chh * 0.965, cx = cw / 2;
    var COL = { m: [198, 40, 40], s: [168, 168, 178] };
    function draw(angle) {
      var ca = Math.cos(angle), sa = Math.sin(angle), quads = [];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, chh);
      /* sombra en el suelo */
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(cx, baseY + 2, 46 * scale * 0.9, 6, 0, 0, 2 * PI); ctx.fill();
      layers.forEach(function (L) {
        var M = L.m, nuu = M.nu, P = new Array(M.V.length), NN = new Array(M.V.length);
        for (var q = 0; q < M.V.length; q++) {
          var v = M.V[q], n = M.N[q];
          P[q] = [cx + (v[0] * ca + v[2] * sa) * scale, baseY - v[1] * scale, -v[0] * sa + v[2] * ca];
          NN[q] = [n[0] * ca + n[2] * sa, n[1], -n[0] * sa + n[2] * ca];
        }
        for (var j = 0; j < M.nv; j++) for (var i = 0; i < nuu; i++) {
          var a = j * (nuu + 1) + i, b = a + 1, c = a + nuu + 2, d = a + nuu + 1;
          var z = (P[a][2] + P[b][2] + P[c][2] + P[d][2]) / 4;
          var nx = NN[a][0] + NN[b][0] + NN[c][0] + NN[d][0], ny = NN[a][1] + NN[b][1] + NN[c][1] + NN[d][1], nz = NN[a][2] + NN[b][2] + NN[c][2] + NN[d][2];
          var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          quads.push({ k: L.kind, al: L.al, z: z + (L.kind === 'f' ? 0.01 : 0), s: (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / nl, back: nz / nl < 0, p: [P[a], P[b], P[c], P[d]] });
        }
      });
      quads.sort(function (u, w) { return u.z - w.z; });
      for (var i2 = 0; i2 < quads.length; i2++) {
        var qd = quads[i2], sh = clamp(0.38 + 0.62 * Math.max(0, qd.s), 0.2, 1), col, st;
        if (qd.k === 'f') {
          sh = clamp(0.55 + 0.45 * Math.max(0, qd.s), 0.4, 1);
          col = 'rgba(' + Math.round(255 * sh) + ',' + Math.round(214 * sh) + ',' + Math.round(20 * sh) + ',' + (qd.back ? qd.al * 0.6 : qd.al) + ')';
        } else {
          var b0 = COL[qd.k], f2 = qd.back ? sh * 0.6 : sh;
          col = 'rgb(' + Math.round(b0[0] * f2) + ',' + Math.round(b0[1] * f2) + ',' + Math.round(b0[2] * f2) + ')';
        }
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(qd.p[0][0], qd.p[0][1]); ctx.lineTo(qd.p[1][0], qd.p[1][1]); ctx.lineTo(qd.p[2][0], qd.p[2][1]); ctx.lineTo(qd.p[3][0], qd.p[3][1]); ctx.closePath();
        ctx.fill(); if (qd.k !== 'f') ctx.stroke();
      }
    }
    return { draw: draw };
  };
})();
