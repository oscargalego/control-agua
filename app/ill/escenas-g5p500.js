/* Waterdrop G5P500 / G5P500A — dibujos propios, de línea, sin logotipos.
   Datos de fichas/waterdrop-g5p500.md (foto oficial + manual):
   frontal blanco; arriba una franja con dos luces, CF y RO; debajo dos tapas redondas iguales,
   CF arriba y RO abajo, cada una con un asa vertical; en la carcasa, candado abierto a las 9
   y candado cerrado a las 12, unidos por un arco (¼ de vuelta).
   Reset: mantener la luz del filtro 7 s hasta el pitido. Purga: CF 15 min, RO 30 min;
   las luces parpadean mientras purga. Usa las piezas comunes de illus-base.js (ILL.H). */
'use strict';

const G5 = (() => {
  const { wrap, arc, badge, faucet, cart, fingerAt, beep, check, clock, drop } = ILL.H;
  const LED = { blue: '#4fb3ff', yellow: '#f5c542', red: '#ff5a5a', off: '#8a94a0' };

  // candado pequeño (abierto o cerrado) centrado en x,y
  function lock(x, y, open, cls = 's-ink') {
    return `<g class="f-none ${cls}" stroke-width="1.6" stroke-linecap="round">
      <rect x="${x - 5}" y="${y - 1}" width="10" height="8" rx="2"/>
      <path d="M${x - 3},${y - 1} v-3 a3,3 0 0 1 6,0 ${open ? 'v-1' : 'v3'}" ${open ? `transform="translate(4 -2)"` : ''}/>
    </g>`;
  }
  // tapa redonda vista de frente con asa vertical; angle 0 = cerrada (asa vertical)
  function cap(cx, cy, r, label, angle = 0, { hl = false } = {}) {
    const w = r * 0.42, h = r * 1.3;
    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${r + 8}" class="${hl ? 's-acc' : 's-line'} f-none" stroke-width="${hl ? 2.5 : 1.5}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" class="f-pl s-line" stroke-width="1.5"/>
      <g transform="rotate(${angle} ${cx} ${cy})">
        <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${w * 0.4}" class="f-bar s-line" stroke-width="1"/>
        <text x="${cx}" y="${cy + 5}" class="t-lbl" style="font-size:${Math.round(r * 0.2)}px" text-anchor="middle">${label}</text>
      </g>
    </g>`;
  }
  // candados de la carcasa: abierto a las 9, cerrado a las 12, arco entre ambos
  function locks(cx, cy, r) {
    const o = r + 20;
    return `${lock(cx - o, cy, true)}${lock(cx, cy - o, false)}
      <path d="M${cx - o * Math.cos(0.35)},${cy - o * Math.sin(0.35)} A${o},${o} 0 0 1 ${cx - o * Math.sin(0.3)},${cy - o * Math.cos(0.3)}"
        class="s-line f-none" stroke-width="1.2"/>`;
  }
  // franja de luces del frontal (ampliada)
  function strip({ state = {}, finger = null, hold = false } = {}) {
    const led = (x, f) => {
      const st = state[f] || 'blue';
      return `<circle cx="${x}" cy="132" r="9" style="fill:${LED[st === 'blink' ? 'blue' : st]}" class="${st === 'blink' ? 'anim-blink' : ''}"/>
        <text x="${x}" y="114" class="t-lbl" text-anchor="middle" style="font-size:18px">${f}</text>`;
    };
    return `<g>
      <path d="M40,240 L40,70 Q40,40 70,40 L250,40 Q280,40 280,70 L280,240" class="f-pl s-line" stroke-width="1.6"/>
      <rect x="72" y="88" width="176" height="72" rx="20" class="f-none s-line" stroke-width="1.4"/>
      ${led(116, 'CF')}${led(204, 'RO')}
      <circle cx="160" cy="250" r="70" class="f-none s-line" stroke-width="1.4"/>
      ${finger ? fingerAt({ CF: 116, RO: 204 }[finger], 132, { hold }) : ''}
    </g>`;
  }

  const S = {
    prep(f) {
      return wrap(`
        <text x="160" y="26" class="t-head" text-anchor="middle">Cartucho ${f} nuevo · sin herramientas</text>
        ${cart(100, 46, f, { w: 110 })}
        <rect x="18" y="150" width="90" height="58" rx="8" class="f-cloth s-line" stroke-width="1.4"/>
        <path d="M28,166 h70 M28,180 h70" class="s-line" stroke-width="1" opacity=".5"/>
        <text x="63" y="226" class="t-sm" text-anchor="middle">trapo</text>
        <path d="M128,140 h60 l-7,68 h-46z" class="f-pl s-line" stroke-width="1.5"/>
        <path d="M126,140 q32,-26 64,0" class="s-line f-none" stroke-width="1.6"/>
        <text x="158" y="226" class="t-sm" text-anchor="middle">cubo</text>
        <path d="M212,150 q4,-14 18,-12 q8,-12 22,0 q14,-2 18,12 l-6,58 h-46z" class="f-film s-line" stroke-width="1.4"/>
        <text x="241" y="226" class="t-sm" text-anchor="middle">bolsa</text>`);
    },
    closeTap() {
      return wrap(`
        ${faucet(110, 96, { closed: true })}
        <rect x="60" y="190" width="180" height="14" rx="5" class="f-pl s-line" stroke-width="1.4"/>
        ${clock(250, 76, '5 min')}
        <text x="160" y="228" class="t-sm" text-anchor="middle">grifo cerrado → baja la presión</text>`);
    },
    twistOut(f) {
      return wrap(`
        <g class="anim-unturn">${cap(160, 122, 72, f, 0, { hl: true })}</g>
        ${locks(160, 122, 72)}
        ${arc(160, 122, 100, -14, -66)}
        ${badge(160, 226, 'antihorario ↺ hasta el candado abierto')}`);
    },
    pullOut(f) {
      return wrap(`
        <rect x="14" y="46" width="70" height="150" rx="22" class="f-pl s-line" stroke-width="1.6"/>
        <rect x="74" y="100" width="12" height="40" rx="3" class="f-bar"/>
        ${cart(170, 92, f, { cap: false, rot: 180, w: 120 })}
        <line x1="104" y1="70" x2="170" y2="70" class="s-acc" stroke-width="3" marker-end="url(#ah)" stroke-linecap="round"/>
        <rect x="120" y="200" width="190" height="16" rx="5" class="f-cloth s-line" stroke-width="1.2"/>
        ${badge(160, 30, 'sácalo recto, sobre el trapo')}`);
    },
    // pulsar el botón central del cartucho usado sobre el cubo
    drainOld(f) {
      return wrap(`
        <g transform="rotate(90 160 70)">${cart(100, 42, f, { cap: false, w: 110 })}</g>
        <circle cx="160" cy="30" r="9" class="f-acc-soft s-acc" stroke-width="1.6"/>
        ${fingerAt(160, 30, { tap: true })}
        <g class="anim-drip">${drop(160, 150, 1.1)}${drop(152, 166, .8)}</g>
        <path d="M120,176 h80 l-8,44 h-64z" class="f-pl s-line" stroke-width="1.4"/>
        ${badge(250, 120, 'botón central')}`);
    },
    unwrap(f) {
      return wrap(`
        ${cart(90, 92, f, { cap: false, wrap: true, w: 120 })}
        ${badge(160, 210, 'quita el film y el tapón protector')}`);
    },
    twistIn(f) {
      return wrap(`
        <g class="anim-turn">${cap(160, 122, 72, f, -90, { hl: true })}</g>
        ${locks(160, 122, 72)}
        ${arc(160, 122, 100, -66, -14)}
        ${badge(160, 226, 'horario ↻ hasta el candado cerrado · clic')}`);
    },
    leak(f) {
      return wrap(`
        ${cap(126, 116, 70, f, 0)}
        <g transform="translate(244 130)"><circle r="34" class="f-none s-ink" stroke-width="4"/>
          <line x1="24" y1="24" x2="52" y2="52" class="s-ink" stroke-width="7" stroke-linecap="round"/>
          ${drop(0, 2, 1.6, 'f-water')}
          <path d="M-20,-20 L20,20" class="s-bad" stroke-width="4" stroke-linecap="round"/></g>
        ${badge(160, 222, 'sin goteo en la tapa ni debajo')}`);
    },
    reset(f, secs = 7) {
      const state = { CF: 'blue', RO: 'blue' }; state[f] = 'red';
      return wrap(`${strip({ state, finger: f, hold: true })}
        ${beep({ CF: 116, RO: 204 }[f] + 34, 128)}
        ${badge(160, 20, `mantén ${f} ${secs} s → pitido`)}`);
    },
    flush(min) {
      return wrap(`
        ${faucet(40, 96, { open: true })}
        <path d="M80,190 h72 l-6,30 h-60z" class="f-pl s-line" stroke-width="1.4"/>
        <g transform="translate(186 50) scale(.4)">${strip({ state: { CF: 'blink', RO: 'blink' } })}</g>
        ${clock(150, 40, min + ' min')}
        ${badge(236, 172, 'luces fijas = fin')}
        ${badge(236, 206, 'no se bebe')}`);
    },
    done() { return wrap(`${cap(160, 116, 74, '', 0)}${check(160, 116, 1.6)}${badge(160, 222, 'registrar el cambio')}`); },
  };

  /* ---------- portada ---------- */
  function front(st) {
    // st: {CF,RO: {cls, frac, led}}  led: blue | yellow | red
    const CX = 160;
    const tap = (cy, f) => {
      const s = st[f], R = 84, C = 2 * Math.PI * R, len = s.cls === 'bad' ? C : Math.max(0.001, Math.min(1, s.frac)) * C;
      return `<g class="hot" data-f="${f}" tabindex="0" role="button" aria-label="Cambiar filtro ${f}">
        <circle cx="${CX}" cy="${cy}" r="${R}" class="ring-bg"/>
        <circle cx="${CX}" cy="${cy}" r="${R}" class="ring ring-${s.cls}" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}"
          transform="rotate(-90 ${CX} ${cy})"/>
        <circle cx="${CX}" cy="${cy}" r="76" class="dev-cap-rim"/>
        <circle cx="${CX}" cy="${cy}" r="70" class="dev-cap"/>
        <rect x="${CX - 17}" y="${cy - 50}" width="34" height="100" rx="14" class="dev-bar"/>
        <text x="${CX}" y="${cy + 6}" class="dev-lbl" text-anchor="middle" style="font-size:16px">${f}</text>
      </g>`;
    };
    const led = (x, f) => `<circle cx="${x}" cy="90" r="5" style="fill:${LED[st[f].led] || LED.blue}"/>
      <text x="${x}" y="108" class="dev-sm" text-anchor="middle">${f}</text>`;
    return `<svg class="front" viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frontal del Waterdrop G5P500">
      <defs><filter id="shadow" x="-.3" y="-.2" width="1.6" height="1.5"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <ellipse cx="160" cy="620" rx="110" ry="11" class="dev-shadow" filter="url(#shadow)"/>
      <rect x="50" y="24" width="220" height="590" rx="60" class="dev-body"/>
      <rect x="50" y="24" width="220" height="590" rx="60" class="dev-edge"/>
      <rect x="102" y="76" width="116" height="40" rx="12" style="fill:none;stroke:#b9c2cc;stroke-width:1.2"/>
      ${led(126, 'CF')}${led(194, 'RO')}
      ${tap(250, 'CF')}
      ${tap(452, 'RO')}
      <text x="160" y="584" class="dev-sm" text-anchor="middle">Toca un filtro para ver su cambio</text>
    </svg>`;
  }

  return { S, front, strip };
})();
if (typeof module !== 'undefined') module.exports = { G5 };
