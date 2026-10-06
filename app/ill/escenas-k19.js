/* Waterdrop K19-H / K19-HG — dibujos propios, sin logotipos.
   Datos de fichas/waterdrop-k19.md (manual WD-K19-H + fotos de la web europea):
   sobremesa blanco con grifo de agua caliente al frente; pantalla con volumen/temperatura y luces
   UV · Filter · Pump · gota TDS · Flush; teclas táctiles en el borde de arriba; depósito de agua detrás.
   Un único filtro que se saca por arriba: antihorario para sacar, horario y hacia abajo para bloquear.
   Reset: tecla del filtro 5 s → purga automática 5 min → tirar 3 L. */
'use strict';

const K19 = (() => {
  const { wrap, arc, badge, cart, fingerAt, check, clock } = ILL.H;
  const COL = { blue: '#4fb3ff', yellow: '#f5c542', red: '#ff5a5a', off: '#8a94a0' };

  // tapón del filtro visto desde arriba
  function capTop(cx, cy, r, { hl = false, angle = 0 } = {}) {
    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${r + 8}" class="${hl ? 's-acc' : 's-line'} f-none" stroke-width="${hl ? 2.5 : 1.5}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" class="f-pl s-line" stroke-width="1.5"/>
      <g transform="rotate(${angle} ${cx} ${cy})">
        ${[0, 60, 120, 180, 240, 300].map(a => `<rect x="${cx - 3}" y="${cy - r + 4}" width="6" height="12" rx="3" class="f-bar" transform="rotate(${a} ${cx} ${cy})"/>`).join('')}
        <text x="${cx}" y="${cy + 5}" class="t-lbl" text-anchor="middle" style="font-size:14px">K19RF</text>
      </g>
    </g>`;
  }
  // pantalla ampliada con sus luces y la tecla de reset
  function screen({ st = {}, finger = false, hold = false, text = '350' } = {}) {
    const led = (x, y, id, label) => {
      const s = st[id] || 'off';
      return `<circle cx="${x}" cy="${y}" r="7" style="fill:${COL[s] || COL.off}" class="${s === 'blink' ? 'anim-blink' : ''}"/>
        <text x="${x}" y="${y + 20}" class="t-sm" text-anchor="middle">${label}</text>`;
    };
    return `<g>
      <rect x="60" y="34" width="200" height="150" rx="16" class="f-pl s-line" stroke-width="1.6"/>
      <text x="160" y="112" class="t-lbl" text-anchor="middle" style="font:600 38px ui-monospace,monospace">${text}</text>
      ${led(86, 56, 'uv', 'UV')}${led(86, 132, 'filter', 'Filter')}${led(130, 150, 'pump', 'Pump')}
      ${led(190, 150, 'tds', '💧')}${led(234, 132, 'flush', 'Flush')}
      <rect x="60" y="196" width="200" height="26" rx="13" class="f-none s-line" stroke-width="1.2"/>
      ${[90, 125, 160, 195, 230].map((x, i) => `<circle cx="${x}" cy="209" r="6" class="${i === 4 ? 'f-acc-soft s-acc' : 'f-none s-line'}" stroke-width="1.2"/>`).join('')}
      <text x="276" y="214" class="t-sm">reset</text>
      ${finger ? fingerAt(230, 209, { hold }) : ''}
    </g>`;
  }

  const S = {
    prep() {
      return wrap(`
        <text x="160" y="26" class="t-head" text-anchor="middle">Filtro nuevo · sin herramientas</text>
        <g transform="rotate(-90 100 110)">${cart(40, 82, 'K19RF', { w: 120 })}</g>
        <rect x="170" y="150" width="110" height="54" rx="8" class="f-cloth s-line" stroke-width="1.4"/>
        <text x="225" y="222" class="t-sm" text-anchor="middle">trapo</text>`);
    },
    twistOut() {
      return wrap(`
        <g class="anim-unturn">${capTop(130, 120, 66, { hl: true })}</g>
        ${arc(130, 120, 92, 30, -40)}
        <line x1="260" y1="170" x2="260" y2="60" class="s-acc" stroke-width="3" marker-end="url(#ah)" stroke-linecap="round"/>
        <text x="260" y="190" class="t-sm" text-anchor="middle">arriba</text>
        ${badge(160, 224, 'antihorario ↺ y hacia arriba')}`);
    },
    unwrap() {
      return wrap(`${cart(90, 92, 'K19RF', { cap: false, wrap: true, w: 120 })}${badge(160, 210, 'quita el film y los tapones')}`);
    },
    twistIn() {
      return wrap(`
        <g class="anim-turn">${capTop(130, 120, 66, { hl: true })}</g>
        ${arc(130, 120, 92, -40, 30)}
        <line x1="260" y1="60" x2="260" y2="170" class="s-acc" stroke-width="3" marker-end="url(#ah)" stroke-linecap="round"/>
        <text x="260" y="50" class="t-sm" text-anchor="middle">abajo</text>
        ${badge(160, 224, 'horario ↻ empujando · bloqueado')}`);
    },
    resetHold() {
      return wrap(`${screen({ st: { filter: 'red' }, finger: true, hold: true })}${badge(160, 18, 'mantén la tecla de reset 5 s')}`);
    },
    flushAuto() {
      return wrap(`${screen({ st: { flush: 'blue', pump: 'blue' }, text: '– – –' })}${clock(286, 60, '5 min')}${badge(160, 18, '«Flush» encendida: no se bebe')}`);
    },
    discard() {
      return wrap(`
        <rect x="40" y="40" width="120" height="70" rx="12" class="f-pl s-line" stroke-width="1.5"/>
        <rect x="88" y="110" width="24" height="18" rx="5" class="f-bar s-line" stroke-width="1"/>
        <g class="anim-flow"><line x1="100" y1="132" x2="100" y2="176" class="s-water" stroke-width="5" stroke-linecap="round" stroke-dasharray="7 7"/></g>
        <path d="M70,170 h60 l-6,46 h-48z" class="f-film s-line" stroke-width="1.4"/>
        <path d="M150,196 q30,-30 50,-6" class="s-acc f-none" stroke-width="3" marker-end="url(#ah)"/>
        ${badge(236, 120, 'tira 3 L')}
        ${badge(236, 156, 'no se bebe')}`);
    },
    done() { return wrap(`${capTop(160, 112, 66)}${check(160, 112, 1.6)}${badge(160, 222, 'registrar el cambio')}`); },
  };

  /* ---------- portada ---------- */
  function front(st, text = '350') {
    const s = st.RF, led = s.cls === 'bad' ? COL.red : s.cls === 'warn' ? COL.yellow : null;
    const R = 46, C = 2 * Math.PI * R, len = s.cls === 'bad' ? C : Math.max(0.001, Math.min(1, s.frac)) * C;
    return `<svg class="front" viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frontal del Waterdrop K19">
      <defs><filter id="shadow" x="-.3" y="-.2" width="1.6" height="1.5"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <ellipse cx="160" cy="600" rx="120" ry="11" class="dev-shadow" filter="url(#shadow)"/>
      <rect x="236" y="140" width="40" height="440" rx="14" style="fill:#3d434b"/>
      <rect x="44" y="130" width="210" height="460" rx="24" class="dev-body"/>
      <rect x="44" y="130" width="210" height="460" rx="24" class="dev-edge"/>
      <g class="hot" data-f="RF" tabindex="0" role="button" aria-label="Cambiar el filtro">
        <rect x="174" y="110" width="32" height="22" rx="4" class="dev-bar"/>
        <circle cx="190" cy="80" r="${R}" class="ring-bg"/>
        <circle cx="190" cy="80" r="${R}" class="ring ring-${s.cls}" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 190 80)"/>
        <circle cx="190" cy="80" r="38" class="dev-cap-rim"/><circle cx="190" cy="80" r="30" class="dev-cap"/>
        <text x="190" y="85" class="dev-lbl" text-anchor="middle" style="font-size:12px">filtro</text>
      </g>
      <rect x="84" y="186" width="96" height="104" rx="14" style="fill:#16191d"/>
      <text x="132" y="248" text-anchor="middle" style="font:600 28px ui-monospace,monospace;fill:#7fd0ff">${text}</text>
      <circle cx="100" cy="274" r="4" style="fill:${led || '#3b424b'}"/><text x="112" y="277" style="font:600 7px system-ui;fill:#7f8a97">Filter</text>
      <rect x="120" y="296" width="24" height="26" rx="6" style="fill:#c9d0d8"/>
      <rect x="72" y="500" width="120" height="16" rx="8" style="fill:#c9d0d8"/>
      <text x="150" y="560" class="dev-sm" text-anchor="middle">Toca el filtro para ver su cambio</text>
    </svg>`;
  }
  return { S, front, screen };
})();
if (typeof module !== 'undefined') module.exports = { K19 };
