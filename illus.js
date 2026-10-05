/* Ilustraciones esquemáticas (SVG) del Waterdrop G2.
   Dibujos propios, de línea, orientativos: no reproducen fotos del fabricante. */
'use strict';

const ILL = (() => {
  const VB = '0 0 320 240';
  const wrap = (body, extra = '') =>
    `<svg class="ill" viewBox="${VB}" xmlns="http://www.w3.org/2000/svg" role="img" ${extra}>${defs()}${body}</svg>`;

  function defs() {
    return `<defs>
      <marker id="ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" class="f-acc"/></marker>
      <linearGradient id="plastic" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" class="st-pl1"/><stop offset="1" class="st-pl2"/></linearGradient>
    </defs>`;
  }

  /* ---------- piezas ---------- */
  // Tapa del cartucho vista de frente; angle 0 = barra vertical (posición ON)
  function dial(cx, cy, r, label, angle = 0, opts = {}) {
    const bw = r * 0.3, bh = r * 1.15;
    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${r + 8}" class="${opts.hl ? 's-acc' : 's-line'} f-none" stroke-width="${opts.hl ? 2.5 : 1.5}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" class="f-pl s-line" stroke-width="1.5"/>
      <g transform="rotate(${angle} ${cx} ${cy})">
        <rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${bw * 0.3}" class="f-bar"/>
        <circle cx="${cx}" cy="${cy - bh / 2 + 9}" r="2.6" class="f-ink"/>
        <text x="${cx}" y="${cy - bh / 2 + 24}" class="t-lbl" style="font-size:${label.length > 2 ? 9.5 : 12}px" text-anchor="middle">${label}</text>
      </g>
    </g>`;
  }

  // Marcas de la carcasa: círculo vacío (OFF, a las 9) y relleno (ON, a las 12)
  function marks(cx, cy, r) {
    const o = r + 18;
    return `<circle cx="${cx - o}" cy="${cy}" r="5" class="f-none s-ink" stroke-width="1.6"/>
      <text x="${cx - o}" y="${cy + 18}" class="t-sm" text-anchor="middle">OFF</text>
      <circle cx="${cx}" cy="${cy - o}" r="5" class="f-ink"/>
      <text x="${cx + 16}" y="${cy - o + 4}" class="t-sm">ON</text>`;
  }

  function arc(cx, cy, r, a0, a1, cls = '') {
    const p = a => [cx + r * Math.cos((a - 90) * Math.PI / 180), cy + r * Math.sin((a - 90) * Math.PI / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    const sweep = a1 > a0 ? 1 : 0;
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${x1.toFixed(1)},${y1.toFixed(1)}"
      class="s-acc f-none ${cls}" stroke-width="3.5" stroke-linecap="round" marker-end="url(#ah)"/>`;
  }

  function badge(x, y, text, cls = '') {
    const w = Math.max(34, text.length * 7.4 + 18);
    return `<g class="${cls}"><rect x="${x - w / 2}" y="${y - 13}" width="${w}" height="26" rx="13" class="f-badge"/>
      <text x="${x}" y="${y + 4.5}" class="t-badge" text-anchor="middle">${text}</text></g>`;
  }

  function drop(x, y, s = 1, cls = 'f-water') {
    return `<path transform="translate(${x} ${y}) scale(${s})" d="M0,-9 C4,-3 7,1 7,4 A7,7 0 0 1 -7,4 C-7,1 -4,-3 0,-9z" class="${cls}"/>`;
  }

  function faucet(x, y, { open = false, closed = false } = {}) {
    return `<g>
      <rect x="${x - 6}" y="${y}" width="12" height="70" rx="4" class="f-pl s-line" stroke-width="1.5"/>
      <path d="M${x},${y + 4} C${x},${y - 30} ${x + 70},${y - 30} ${x + 70},${y + 10}" class="s-line f-none" stroke-width="10" stroke-linecap="round"/>
      <path d="M${x},${y + 4} C${x},${y - 30} ${x + 70},${y - 30} ${x + 70},${y + 10}" class="s-pl f-none" stroke-width="6.5" stroke-linecap="round"/>
      <rect x="${x - 26}" y="${y + 6}" width="26" height="8" rx="4" class="f-pl s-line" stroke-width="1.5"
        transform="rotate(${open ? -35 : 0} ${x} ${y + 10})"/>
      ${open ? `<g class="anim-flow">
        <line x1="${x + 70}" y1="${y + 16}" x2="${x + 70}" y2="${y + 92}" class="s-water" stroke-width="5" stroke-linecap="round" stroke-dasharray="7 7"/></g>` : ''}
      ${closed ? `<g transform="translate(${x - 30} ${y - 22})"><circle r="11" class="f-bad"/>
        <path d="M-4.5,-4.5 L4.5,4.5 M4.5,-4.5 L-4.5,4.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>` : ''}
    </g>`;
  }

  // Cartucho de lado (cilindro). long=true para el MRO
  function cart(x, y, label, { long = false, cap = true, wrap = false, rot = 0 } = {}) {
    const w = long ? 150 : 86, h = 56;
    return `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="f-pl s-line" stroke-width="1.5"/>
      <rect x="${x + w}" y="${y + 16}" width="12" height="24" rx="3" class="f-bar s-line" stroke-width="1.2"/>
      ${cap ? `<rect x="${x + w + 10}" y="${y + 13}" width="10" height="30" rx="3" class="f-acc-soft s-acc" stroke-width="1.2"/>` : ''}
      <text x="${x + w / 2}" y="${y + 33}" class="t-lbl" text-anchor="middle">${label}</text>
      ${wrap ? `<path d="M${x - 6},${y - 6} L${x + w + 8},${y - 8} L${x + w + 4},${y + h + 6} L${x - 4},${y + h + 8}z"
         class="f-none s-film" stroke-width="1.4" stroke-dasharray="4 5"/>` : ''}
    </g>`;
  }

  // Parte superior del equipo: botón de reset y 4 indicadores
  function panel(leds = {}, { finger = false, hold = false, tap = false } = {}) {
    const L = [['drop', 104, 'gota'], ['CF', 136, 'CF'], ['MRO', 184, 'MRO'], ['pwr', 216, '⚡']];
    const ledEls = L.map(([k, x, t]) => {
      const st = leds[k] || 'off';
      return `<circle cx="${x}" cy="150" r="5.5" class="led led-${st}"/>
        <text x="${x}" y="172" class="t-sm" text-anchor="middle">${t === 'gota' ? '💧' : t}</text>`;
    }).join('');
    return `<g>
      <path d="M40,240 L40,150 A120,120 0 0 1 280,150 L280,240" class="f-pl s-line" stroke-width="1.6"/>
      <circle cx="160" cy="92" r="17" class="f-pl s-line" stroke-width="1.6"/>
      <path d="M152,90 a8,8 0 1 1 3,7" class="s-ink f-none" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M150,86 l2,5 l4,-3" class="s-ink f-none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      ${ledEls}
      ${finger ? fingerAt(160, 92, { hold, tap }) : ''}
      <path d="M90,214 A80,80 0 0 1 230,214" class="s-line f-none" stroke-width="1.4"/>
    </g>`;
  }

  function fingerAt(x, y, { hold, tap } = {}) {
    return `<g class="${tap ? 'anim-tap' : ''}">
      <g transform="rotate(-40 ${x} ${y})">
        <rect x="${x - 11}" y="${y - 6}" width="22" height="92" rx="11" class="f-skin s-line" stroke-width="1.4"/>
        <path d="M${x - 6},${y + 6} q6,-5 12,0" class="s-line f-none" stroke-width="1.2"/>
      </g>
      ${hold ? `<circle cx="${x}" cy="${y}" r="27" class="s-acc f-none anim-hold" stroke-width="3" stroke-dasharray="170" stroke-dashoffset="170"/>` : ''}
    </g>`;
  }

  function beep(x, y) {
    return `<g class="anim-blink s-acc f-none" stroke-width="2" stroke-linecap="round">
      <path d="M${x},${y - 10} a12,12 0 0 1 0,20"/><path d="M${x + 7},${y - 17} a20,20 0 0 1 0,34"/></g>`;
  }

  function check(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><circle r="22" class="f-ok"/>
      <path d="M-9,1 L-2,8 L10,-7" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }

  function clock(x, y, text) {
    return `<g><circle cx="${x}" cy="${y}" r="24" class="f-badge"/>
      <circle cx="${x}" cy="${y}" r="24" class="s-acc f-none anim-hold" stroke-width="3" stroke-dasharray="151" stroke-dashoffset="151"/>
      <text x="${x}" y="${y + 5}" class="t-badge" text-anchor="middle">${text}</text></g>`;
  }

  /* ---------- escenas ---------- */
  const S = {
    prep() {
      return wrap(`
        <rect x="18" y="150" width="90" height="58" rx="8" class="f-cloth s-line" stroke-width="1.4"/>
        <path d="M28,166 h70 M28,180 h70 M28,194 h70" class="s-line" stroke-width="1" opacity=".5"/>
        <text x="63" y="226" class="t-sm" text-anchor="middle">trapo</text>
        <path d="M128,140 h60 l-7,68 h-46z" class="f-pl s-line" stroke-width="1.5"/>
        <path d="M126,140 q32,-26 64,0" class="s-line f-none" stroke-width="1.6"/>
        <text x="158" y="226" class="t-sm" text-anchor="middle">cubo</text>
        <path d="M212,150 q4,-14 18,-12 q8,-12 22,0 q14,-2 18,12 l-6,58 h-46z" class="f-film s-line" stroke-width="1.4"/>
        <text x="241" y="226" class="t-sm" text-anchor="middle">bolsa</text>
        ${cart(78, 46, 'NUEVO')}
        ${check(268, 50, .8)}
        <text x="160" y="28" class="t-head" text-anchor="middle">Sin herramientas · sin cortar agua ni luz</text>
      `);
    },
    closeTap() {
      return wrap(`
        ${faucet(120, 96, { closed: true })}
        <rect x="70" y="190" width="180" height="14" rx="5" class="f-pl s-line" stroke-width="1.4"/>
        ${clock(248, 76, '30 s')}
        <text x="160" y="228" class="t-sm" text-anchor="middle">grifo de ósmosis cerrado → se libera presión</text>
      `);
    },
    grip(f) {
      const mro = f === 'MRO';
      return wrap(`
        ${dial(160, 118, 76, f, 0)}
        <path d="M70,52 h-14 v132 h14 M250,52 h14 v132 h-14" class="s-acc f-none" stroke-width="3" stroke-linecap="round"/>
        ${badge(160, 218, mro ? 'dos manos · ≈ 2 kg' : 'una mano debajo: puede caer')}
      `);
    },
    twistOut(f) {
      return wrap(`
        ${dial(160, 120, 74, f, -90, { hl: true })}
        ${marks(160, 120, 74)}
        ${arc(160, 120, 102, 30, -60)}
        ${badge(160, 224, 'antihorario ↺ y sacar')}
      `);
    },
    pullOut(f) {
      const mro = f === 'MRO';
      return wrap(`
        <rect x="14" y="46" width="70" height="150" rx="22" class="f-pl s-line" stroke-width="1.6"/>
        <rect x="74" y="100" width="12" height="40" rx="3" class="f-bar"/>
        ${cart(mro ? 150 : 190, 92, f, { cap: false, rot: 180 })}
        <line x1="104" y1="70" x2="${mro ? 150 : 184}" y2="70" class="s-acc" stroke-width="3" marker-end="url(#ah)" stroke-linecap="round"/>
        <g class="anim-drip">${drop(mro ? 158 : 196, 168, 1.1)}${drop(mro ? 170 : 208, 186, .8)}</g>
        <rect x="120" y="200" width="190" height="16" rx="5" class="f-cloth s-line" stroke-width="1.2"/>
        ${badge(160, 30, 'vertical, sobre el trapo')}
      `);
    },
    unwrap(f) {
      const mro = f === 'MRO';
      return wrap(`
        ${cart(mro ? 46 : 80, 92, f, { long: mro, cap: false, wrap: true })}
        <g transform="translate(${mro ? 262 : 232} 106)">
          <rect width="10" height="30" rx="3" class="f-acc-soft s-acc" stroke-width="1.2"/>
          <line x1="-12" y1="15" x2="26" y2="15" class="s-acc" stroke-width="2.5" marker-end="url(#ah)" stroke-linecap="round"/>
        </g>
        ${badge(160, 210, 'quitar film y tapón protector')}
      `);
    },
    insert(f) {
      return wrap(`
        ${dial(160, 122, 72, f, -90, { hl: true })}
        ${marks(160, 122, 72)}
        <line x1="40" y1="122" x2="70" y2="122" class="s-acc" stroke-width="2.5" stroke-dasharray="4 4"/>
        ${badge(160, 224, 'punto del cartucho → círculo vacío')}
      `);
    },
    twistIn(f) {
      return wrap(`
        <g class="anim-turn">${dial(160, 122, 72, f, -90)}</g>
        ${marks(160, 122, 72)}
        ${arc(160, 122, 100, -66, -14)}
        ${badge(160, 224, '¼ de vuelta horario ↻ · clic')}
      `);
    },
    leak(f) {
      return wrap(`
        ${dial(130, 116, 70, f, 0)}
        <g transform="translate(232 128)"><circle r="34" class="f-none s-ink" stroke-width="4"/>
          <line x1="24" y1="24" x2="52" y2="52" class="s-ink" stroke-width="7" stroke-linecap="round"/>
          ${drop(0, 2, 1.6, 'f-water')}
          <path d="M-20,-20 L20,20" class="s-bad" stroke-width="4" stroke-linecap="round"/></g>
        ${badge(160, 222, 'sin goteo por la boca ni debajo')}
      `);
    },
    resetHold() {
      return wrap(`${panel({ drop: 'blue', CF: 'blue', MRO: 'blue', pwr: 'blue' }, { finger: true, hold: true })}
        ${beep(196, 70)}${badge(70, 40, '5 s → pitido')}`);
    },
    resetSelect(f) {
      const leds = { drop: 'blue', pwr: 'blue', CF: 'blue', MRO: 'blue' };
      leds[f] = 'blink';
      return wrap(`${panel(leds, { finger: true, tap: true })}
        ${badge(70, 40, 'pulsar · ' + f + ' parpadea')}${badge(258, 40, '< 3 s')}`);
    },
    resetDone(f) {
      const leds = { drop: 'blue', pwr: 'blue', CF: 'blue', MRO: 'blue' };
      return wrap(`${panel(leds, { finger: true, hold: true })}${beep(196, 70)}
        ${badge(80, 40, '5 s → ' + f + ' azul fijo')}`);
    },
    flush(min) {
      return wrap(`
        ${faucet(70, 92, { open: true })}
        <path d="M110,186 h72 l-6,32 h-60z" class="f-pl s-line" stroke-width="1.4"/>
        <g transform="translate(-30 20)">${panel({ drop: 'blink', CF: 'blue', MRO: 'blue', pwr: 'blue' }).replace('<g>', '<g transform="translate(150 -40) scale(.55)">')}</g>
        ${badge(244, 214, min + ' min · no se bebe')}
      `);
    },
    done() {
      return wrap(`${dial(160, 116, 74, '', 0)}${check(160, 116, 1.6)}
        ${badge(160, 222, 'registrar el cambio')}`);
    }
  };

  /* ---------- frontal de la portada ---------- */
  function front(st) {
    // st: {CF:{cls, frac}, MRO:{cls, frac}}
    const dialH = (cy, f) => {
      const s = st[f], C = 2 * Math.PI * 102, len = Math.max(0.001, Math.min(1, s.frac)) * C;
      return `<g class="hot" data-f="${f}" tabindex="0" role="button" aria-label="Cambiar filtro ${f}">
        <circle cx="160" cy="${cy}" r="102" class="ring-bg"/>
        <circle cx="160" cy="${cy}" r="102" class="ring ring-${s.cls}" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}"
          transform="rotate(-90 160 ${cy})"/>
        <circle cx="160" cy="${cy}" r="94" class="dev-cap-rim"/>
        <circle cx="160" cy="${cy}" r="86" class="dev-cap"/>
        <rect x="143" y="${cy - 56}" width="34" height="112" rx="10" class="dev-bar"/>
        <circle cx="160" cy="${cy - 45}" r="2.6" class="dev-ink"/>
        <text x="160" y="${cy - 28}" class="dev-lbl" text-anchor="middle">${f}</text>
      </g>`;
    };
    const led = (x, f, label) => `<circle cx="${x}" cy="128" r="4" class="led ${f ? 'led-' + st[f].led : 'led-blue'}"/>
      <text x="${x}" y="146" class="dev-sm" text-anchor="middle">${label}</text>`;
    return `<svg class="front" viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg" role="img"
        aria-label="Frontal del Waterdrop G2">
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="st-b1"/><stop offset=".55" class="st-b2"/><stop offset="1" class="st-b3"/></linearGradient>
        <radialGradient id="cap" cx=".35" cy=".3" r=".9"><stop offset="0" class="st-c1"/><stop offset="1" class="st-c2"/></radialGradient>
        <filter id="glow" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="2.4"/></filter>
        <filter id="shadow" x="-.3" y="-.2" width="1.6" height="1.5"><feGaussianBlur stdDeviation="14"/></filter>
      </defs>
      <ellipse cx="160" cy="622" rx="118" ry="12" class="dev-shadow" filter="url(#shadow)"/>
      <rect x="38" y="20" width="244" height="600" rx="122" class="dev-body"/>
      <rect x="38" y="20" width="244" height="600" rx="122" class="dev-edge"/>
      <circle cx="160" cy="80" r="15" class="dev-btn"/>
      <path d="M153,79 a7,7 0 1 1 3,6" class="dev-ink-s" /><path d="M151,75 l2,4.5 l3.6,-2.6" class="dev-ink-s"/>
      <g filter="url(#glow)" opacity=".9">
        <circle cx="106" cy="128" r="5" class="led-g led-blue"/><circle cx="134" cy="128" r="5" class="led-g led-${st.CF.led}"/>
        <circle cx="186" cy="128" r="5" class="led-g led-${st.MRO.led}"/><circle cx="214" cy="128" r="5" class="led-g led-blue"/>
      </g>
      ${led(106, null, '💧')}${led(134, 'CF', 'CF')}${led(186, 'MRO', 'MRO')}${led(214, null, '⚡')}
      ${dialH(288, 'CF')}
      ${dialH(504, 'MRO')}
    </svg>`;
  }

  return { S, front };
})();
