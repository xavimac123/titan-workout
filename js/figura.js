/* Figuras anatómicas (dibujo propio) y gráficos de equipo. Sobrescribe TW.bodySVG. */
(function () {
  'use strict';
  var TW = window.TW;
  var HI = 'url(#tw-hi)', LO = 'url(#tw-lo)';

  /* Medidas por sexo: sw = semiancho de hombros, ww = cintura, hw = cadera. us/ls = escala de músculos arriba/abajo. */
  var BODY = {
    m: { sw: 33, ww: 21, hw: 19, us: 1, ls: 1, bust: 0 },
    f: { sw: 27, ww: 16, hw: 23, us: 0.84, ls: 1.2, bust: 1 }
  };

  function silhouette(b) {
    var c = 50, sw = b.sw, ww = b.ww, hw = b.hw;
    var f = function (n) { return Math.round(n * 10) / 10; };
    var torso = 'M' + c + ' 30 C' + f(c + sw * 0.45) + ' 30 ' + f(c + sw * 0.85) + ' 33 ' + f(c + sw) + ' 39 L' + f(c + sw - 3) + ' 58 ' +
      'C' + f(c + ww + 5) + ' 68 ' + f(c + ww) + ' 78 ' + f(c + ww) + ' 92 C' + f(c + ww + 1) + ' 102 ' + f(c + hw) + ' 106 ' + f(c + hw) + ' 118 ' +
      'L' + f(c - hw) + ' 118 C' + f(c - hw) + ' 106 ' + f(c - ww - 1) + ' 102 ' + f(c - ww) + ' 92 C' + f(c - ww) + ' 78 ' + f(c - ww - 5) + ' 68 ' + f(c - sw + 3) + ' 58 ' +
      'L' + f(c - sw) + ' 39 C' + f(c - sw * 0.85) + ' 33 ' + f(c - sw * 0.45) + ' 30 ' + c + ' 30Z';
    var arm = function (s) {
      var x = c + s * sw;
      return 'M' + f(x - s * 4) + ' 38 C' + f(x + s * 4) + ' 40 ' + f(x + s * 6) + ' 52 ' + f(x + s * 5) + ' 64 L' + f(x + s * 3) + ' 86 ' +
        'C' + f(x + s * 3) + ' 96 ' + f(x + s * 1) + ' 104 ' + f(x + s * 0) + ' 112 L' + f(x - s * 6) + ' 110 C' + f(x - s * 5) + ' 100 ' + f(x - s * 6) + ' 92 ' + f(x - s * 7) + ' 84 ' +
        'L' + f(x - s * 8) + ' 62 C' + f(x - s * 9) + ' 52 ' + f(x - s * 8) + ' 44 ' + f(x - s * 4) + ' 38Z';
    };
    var leg = function (s) {
      var x = c + s * hw;
      return 'M' + c + ' 112 L' + f(x) + ' 112 C' + f(x + s * 1) + ' 138 ' + f(x - s * 5) + ' 156 ' + f(x - s * 7) + ' 166 ' +
        'C' + f(x - s * 8) + ' 178 ' + f(x - s * 8) + ' 188 ' + f(x - s * 9) + ' 196 L' + f(c + s * 5) + ' 196 ' +
        'C' + f(c + s * 4) + ' 186 ' + f(c + s * 4) + ' 176 ' + f(c + s * 5) + ' 166 C' + f(c + s * 3) + ' 150 ' + f(c + s * 2) + ' 132 ' + c + ' 120Z';
    };
    var hand = function (s) { var x = c + s * sw; return '<path d="M' + f(x - s * 7) + ' 108 C' + f(x - s * 9) + ' 116 ' + f(x - s * 8) + ' 124 ' + f(x - s * 5) + ' 126 C' + f(x - s * 2) + ' 126 ' + f(x + s * 0) + ' 118 ' + f(x + s * 0) + ' 110Z"/>'; };
    var foot = function (s) { return '<path d="M' + f(c + s * 5) + ' 194 L' + f(c + s * 9) + ' 194 C' + f(c + s * 13) + ' 197 ' + f(c + s * 13) + ' 201 ' + f(c + s * 9) + ' 201 L' + f(c + s * 4) + ' 201Z"/>'; };
    return '<g class="sil"><ellipse cx="50" cy="15" rx="9" ry="11"/><ellipse cx="41" cy="16" rx="1.6" ry="3"/><ellipse cx="59" cy="16" rx="1.6" ry="3"/><path d="M45 24 L55 24 L57 33 L43 33Z"/>' +
      hand(1) + hand(-1) + foot(1) + foot(-1) +
      '<path d="' + torso + '"/><path d="' + arm(1) + '"/><path d="' + arm(-1) + '"/><path d="' + leg(1) + '"/><path d="' + leg(-1) + '"/></g>';
  }

  /* Músculos como trazos de medio cuerpo (lado derecho); se duplican en espejo. */
  var FRONT = {
    hombros: ['M63 36 C71 34 79 38 81 46 C82 52 80 57 76 59 C74 53 70 47 63 44Z'],
    pecho: ['M51 40 C57 38 64 41 67 46 C68 51 66 56 61 58 C56 60 52 58 51 56Z'],
    biceps: ['M77 60 C80 58 83 60 83 66 C83 73 81 79 78 81 C75 79 74 72 75 65Z'],
    abdomen: ['M51 61 C55 61 59 63 59 67 L58 90 C56 95 53 96 51 96Z', 'M60 62 C65 64 67 71 66 82 C65 90 62 93 59.5 92 L60 66Z'],
    cuadriceps: ['M51 120 C58 118 66 120 67.5 128 C68 142 66 153 62 160 C58 162 55 160 53 155 C51 145 50 132 51 120Z']
  };
  var BACK = {
    espalda: ['M51 52 C58 49 66 47 70 51 C72 61 68 72 62 80 C58 84 54 86 51 86Z', 'M51 86 C56 86 60 88 61 92 L59 100 L51 100Z'],
    hombros: ['M63 36 C71 34 79 38 81 46 C82 52 80 57 76 59 C74 53 70 47 63 44Z'],
    triceps: ['M77 60 C80 58 83 60 83 66 C83 73 81 79 78 81 C75 79 74 72 75 65Z'],
    gluteos: ['M51 101 C58 97 66 99 68 107 C68 115 63 119 56 119 C53 119 51 117 51 113Z'],
    isquiotibiales: ['M51 122 C58 121 66 123 67.5 130 C68 142 65 152 61 158 C57 160 54 156 52 149Z'],
    pantorrillas: ['M53 166 C58 164 62 167 62 174 C62 181 60 188 57 192 C54 188 53 181 52 174Z']
  };
  var NEUTRAL_FRONT = ['M77 84 C80 84 82 88 81 96 C80 102 79 106 77 108 C75 104 74 98 74 92Z', 'M53 164 C58 163 62 166 62.5 173 C62 182 60 188 57 192 C54 188 53 180 52 172Z'];
  var NEUTRAL_BACK = ['M51 40 C56 41 61 44 65 47 C61 51 55 55 51 59Z', 'M77 84 C80 84 82 88 81 96 C80 102 79 106 77 108 C75 104 74 98 74 92Z'];

  /* Líneas de detalle (separaciones musculares) para dar volumen. */
  var DET_FRONT = ['M51 40 C57 38.6 63 38.8 67 40', 'M52 58 C58 61.5 64 59 67.5 53', 'M51.5 69 L58.5 68.4', 'M51.5 77 L59 76.4', 'M51.5 85 L58.5 84.6',
    'M66.5 63 L63 64.8', 'M67 68 L63.5 70', 'M57.5 124 C58.6 138 58.4 150 57.2 158', 'M53.5 160 C56 163.5 60 163.5 62 160', 'M63 36 C66 41 71 45 75 55'];
  var DET_BACK = ['M52 46 C58 49 64 52 68 58', 'M52 64 C58 66 62 70 64 76', 'M51.5 100 C56 103 60 103 65 100', 'M56.5 124 C57.6 138 57.2 150 56 157', 'M57 168 C58 176 58 184 56.5 190',
    'M63 36 C66 41 71 45 75 55', 'M52 80 C57 82 61 85 63 90'];
  function details(list, b, centerLine) {
    var d = list.map(function (q) { return '<path class="dl" d="' + q + '"/>'; }).join('');
    var m = '<g>' + d + '</g><g transform="translate(100 0) scale(-1 1)">' + d + '</g>';
    return '<g transform="translate(50 0) scale(' + b.us + ' 1) translate(-50 0)">' + m + (centerLine ? '<path class="dl" d="' + centerLine + '"/>' : '') + '</g>';
  }
  function mirror(paths, cls, op) {
    var st = (op != null && op < 1) ? ' style="opacity:' + op + '"' : '';
    var d = paths.map(function (p) { return '<path class="' + cls + '"' + st + ' d="' + p + '"/>'; }).join('');
    return '<g>' + d + '</g><g transform="translate(100 0) scale(-1 1)">' + d + '</g>';
  }
  /* Los músculos de arriba y abajo escalan según el sexo para ajustar a la silueta. */
  var UPPER = { hombros: 1, pecho: 1, biceps: 1, triceps: 1, abdomen: 1, espalda: 1 };
  function layer(set, lit, b, neutral, pick) {
    var up = '', lo = '';
    Object.keys(set).forEach(function (k) {
      var v = lit(k), g = mirror(set[k], v ? 'hi' : 'lo', typeof v === 'number' ? 0.3 + 0.7 * v : 1);
      if (pick) g = '<g class="mz' + (pick === k ? ' sel' : '') + '" data-a="pickG" data-g="' + k + '" role="button" aria-label="' + TW.MUSCLES[k] + '">' + g + '</g>';
      if (UPPER[k]) up += g; else lo += g;
    });
    var nu = '', nl = '';
    neutral.forEach(function (p, i) {
      var g = mirror([p], 'ne');
      if (p.indexOf('M77') === 0) nu += g; else nl += g;
    });
    var tU = 'translate(50 0) scale(' + b.us + ' 1) translate(-50 0)';
    var tL = 'translate(50 0) scale(' + b.ls + ' 1) translate(-50 0)';
    return '<g transform="' + tL + '">' + lo + nl + '</g><g transform="' + tU + '">' + nu + up + '</g>';
  }

  TW.bodySVG = function (muscles, size, sex, heat, pick) {
    var b = BODY[sex === 'f' ? 'f' : 'm'], all = muscles.indexOf('cuerpo_completo') >= 0;
    var lit = heat ? function (k) { return heat[k] > 0 ? heat[k] : false; } : function (k) { return all || muscles.indexOf(k) >= 0; };
    muscles = muscles || [];
    var label = muscles.length ? muscles.map(function (m) { return TW.MUSCLES[m]; }).join(', ') : 'Sin grupo';
    var big = size === 'big';
    var fig = function (set, neutral, det, cl) { return '<g>' + silhouette(b) + layer(set, lit, b, neutral, pick) + details(det, b, cl) + '</g>'; };
    var hb = b.bust ? '<ellipse class="bust" cx="41" cy="52" rx="7" ry="6"/><ellipse class="bust" cx="59" cy="52" rx="7" ry="6"/>' : '';
    var defs = '<defs><linearGradient id="tw-hi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB04D"/><stop offset="1" stop-color="#F0600C"/></linearGradient>' +
      '<linearGradient id="tw-lo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4A55"/><stop offset="1" stop-color="#2E2E36"/></linearGradient>' +
      '<linearGradient id="tw-skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#17171C"/><stop offset=".3" stop-color="#34343D"/><stop offset=".5" stop-color="#3E3E48"/><stop offset=".7" stop-color="#34343D"/><stop offset="1" stop-color="#17171C"/></linearGradient>' +
      '<filter id="tw-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    var labels = big ? '<text x="50" y="212" text-anchor="middle" class="cap">Frente</text><text x="160" y="212" text-anchor="middle" class="cap">Espalda</text>' : '';
    return '<svg class="body ' + (size || 'mini') + '" viewBox="0 0 220 ' + (big ? 218 : 204) + '" role="img" aria-label="Grupos musculares (' + (sex === 'f' ? 'mujer' : 'hombre') + '): ' + label + '">' + defs +
      '<g>' + fig(FRONT, NEUTRAL_FRONT, DET_FRONT, 'M50 42 L50 96').replace('</g></g>', hb + '</g></g>') + '</g>' +
      '<g transform="translate(110 0)">' + fig(BACK, NEUTRAL_BACK, DET_BACK, 'M50 36 L50 100') + '</g>' + labels + '</svg>';
  };

  /* Íconos de equipo: 48 × 48, trazo claro y acento dorado. */
  var S = 'fill="none" stroke="#F2F2F2" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
  var G = 'fill="#E8B84A" stroke="#E8B84A" stroke-width="1"';
  TW.EQUIP_ICON = {
    mancuernas: '<rect ' + G + ' x="5" y="16" width="6" height="16" rx="2"/><rect ' + G + ' x="11" y="12" width="6" height="24" rx="2"/><rect ' + G + ' x="31" y="12" width="6" height="24" rx="2"/><rect ' + G + ' x="37" y="16" width="6" height="16" rx="2"/><path ' + S + ' d="M17 24h14"/>',
    barra: '<path ' + S + ' d="M3 24h42"/><rect ' + G + ' x="7" y="8" width="5" height="32" rx="2"/><rect ' + G + ' x="13" y="13" width="4" height="22" rx="1.5"/><rect ' + G + ' x="31" y="13" width="4" height="22" rx="1.5"/><rect ' + G + ' x="36" y="8" width="5" height="32" rx="2"/>',
    discos: '<circle ' + S + ' cx="24" cy="24" r="18"/><circle ' + G + ' cx="24" cy="24" r="12" fill-opacity=".25"/><circle ' + S + ' cx="24" cy="24" r="4"/>',
    kettlebell: '<path ' + S + ' d="M16 16c0-10 16-10 16 0"/><path ' + G + ' fill-opacity=".3" d="M24 14c-10 0-15 7-15 16 0 8 6 13 15 13s15-5 15-13c0-9-5-16-15-16z"/><circle ' + S + ' cx="24" cy="30" r="4"/>',
    banda_rosa: '<path stroke="#FF8FB8" stroke-width="5" fill="none" stroke-linecap="round" d="M8 30c0-14 10-20 16-20s16 6 16 20c0 6-6 8-16 8S8 36 8 30z"/>',
    banda_turquesa: '<path stroke="#3FD8C8" stroke-width="5" fill="none" stroke-linecap="round" d="M8 30c0-14 10-20 16-20s16 6 16 20c0 6-6 8-16 8S8 36 8 30z"/>',
    cuerda_saltar: '<path ' + S + ' d="M14 8c-8 12-8 22 0 32m20-32c8 12 8 22 0 32"/><rect ' + G + ' x="9" y="4" width="8" height="12" rx="3"/><rect ' + G + ' x="31" y="32" width="8" height="12" rx="3"/><path ' + S + ' d="M17 10c10 0 10 28 14 28"/>',
    barra_dominadas: '<path ' + S + ' d="M6 8h36M10 8v32M38 8v32"/><path stroke="#E8B84A" stroke-width="4" stroke-linecap="round" d="M14 12h20"/>',
    bicicleta: '<circle ' + S + ' cx="14" cy="32" r="8"/><circle ' + G + ' fill-opacity=".3" cx="36" cy="32" r="8"/><path ' + S + ' d="M14 32l8-16h10l4 16M22 16l-3-5h-4"/>',
    banco: '<rect ' + G + ' fill-opacity=".35" x="6" y="18" width="36" height="9" rx="3"/><path ' + S + ' d="M12 27v13M36 27v13"/>',
    gimnasio: '<path ' + S + ' d="M6 40V18l18-10 18 10v22z"/><path ' + S + ' d="M16 40V28h16v12"/><path stroke="#E8B84A" stroke-width="3" stroke-linecap="round" d="M16 22h16"/>'
  };
  TW.equipIcon = function (k, size) {
    var body = TW.EQUIP_ICON[k] || '<circle ' + S + ' cx="24" cy="24" r="14"/><path stroke="#E8B84A" stroke-width="3" stroke-linecap="round" d="M24 18v12M18 24h12"/>';
    return '<svg class="eqicon" width="' + (size || 40) + '" height="' + (size || 40) + '" viewBox="0 0 48 48" aria-hidden="true">' + body + '</svg>';
  };
})();
