/* JIMMY R9 (y R9 Pro / M9 Pro, mismos filtros) — dibujos propios, sin logotipos.
   Datos de fichas/jimmy-r9.md (manual + fotos del fabricante):
   equipo de sobremesa gris oscuro con dispensador; depósito de agua del grifo detrás/derecha;
   tres filtros verticales que se sacan por arriba, tras quitar depósito y tapa superior;
   panel superior: pantalla TDS, botones normal·45·55·65·75·85·98 °C, vida de filtros 1·2·3 (3 rayas cada uno).
   Reset: 98 °C 5 s (parpadean 1·2·3) → 45 / 55 / 65 °C 5 s para el filtro 1 / 2 / 3.
   El sentido de giro no lo da el manual: se dibujan los candados del equipo, sin flecha de sentido. */
'use strict';

const JIM = (() => {
  const { wrap, badge, fingerAt, check, clock, drop } = ILL.H;
  const N = { F1: 1, F2: 2, F3: 3 };
  const BTN = ['N', '45', '55', '65', '75', '85', '98'];
  const RESET_BTN = { F1: '45', F2: '55', F3: '65' };

  function lock(x, y, open) {
    return `<g class="f-none s-ink" stroke-width="1.8" stroke-linecap="round">
      <rect x="${x - 6}" y="${y - 1}" width="12" height="10" rx="2"/>
      <path d="M${x - 4},${y - 1} v-4 a4,4 0 0 1 8,0 ${open ? 'v-2' : 'v4'}" ${open ? 'transform="translate(5 -2)"' : ''}/></g>`;
  }
  // cartucho vertical (blanco, con boca arriba)
  function cartV(x, y, label, { h = 120, hl = false, arrow = false } = {}) {
    return `<g>
      <rect x="${x - 9}" y="${y - 12}" width="18" height="14" rx="3" class="f-bar s-line" stroke-width="1"/>
      <rect x="${x - 20}" y="${y}" width="40" height="${h}" rx="10" class="f-pl ${hl ? 's-acc' : 's-line'}" stroke-width="${hl ? 2.4 : 1.5}"/>
      <text x="${x}" y="${y + h / 2 + 4}" class="t-lbl" text-anchor="middle" style="font-size:13px">${label}</text>
      ${arrow ? `<path d="M${x},${y + h - 30} v16 m-6,-7 l6,7 l6,-7" class="s-ink f-none" stroke-width="2"/>` : ''}
    </g>`;
  }
  // vista desde arriba de los tres huecos
  function topView(active, { open = false } = {}) {
    return [1, 2, 3].map(n => {
      const x = 70 + (n - 1) * 90, hl = N[active] === n;
      const ang = hl && open ? -60 : 0;
      return `<g>
        <circle cx="${x}" cy="118" r="34" class="f-pl ${hl ? 's-acc' : 's-line'}" stroke-width="${hl ? 2.6 : 1.4}"/>
        <rect x="${x - 6}" y="94" width="12" height="48" rx="5" class="f-bar" transform="rotate(${ang} ${x} 118)"/>
        <text x="${x}" y="178" class="t-lbl" text-anchor="middle" style="font-size:15px">${n}</text>
      </g>`;
    }).join('');
  }
  // panel superior ampliado
  function panel({ finger = null, hold = false, cells = { 1: 3, 2: 3, 3: 3 }, blink = false, tds = '008' } = {}) {
    const bx = i => 44 + i * 39;
    const btns = BTN.map((b, i) => `<circle cx="${bx(i)}" cy="170" r="14" class="f-pl s-line" stroke-width="1.4"/>
      <text x="${bx(i)}" y="174" class="t-sm" text-anchor="middle" style="font-size:${b === 'N' ? 10 : 11}px">${b}</text>`).join('');
    const life = [1, 2, 3].map(n => {
      const x = 196 + (n - 1) * 36;
      return `<g class="${blink ? 'anim-blink' : ''}">${[0, 1, 2].map(c => `<rect x="${x + c * 9}" y="66" width="7" height="20" rx="2"
        style="fill:${c < cells[n] ? '#4fb3ff' : 'none'};stroke:#8a94a0;stroke-width:1"/>`).join('')}
        <text x="${x + 12}" y="102" class="t-sm" text-anchor="middle">${n}</text></g>`;
    }).join('');
    const fx = finger ? bx(BTN.indexOf(finger)) : 0;
    return `<g>
      <rect x="20" y="40" width="280" height="160" rx="18" class="f-pl s-line" stroke-width="1.6"/>
      <rect x="38" y="56" width="120" height="50" rx="8" class="f-bar s-line" stroke-width="1"/>
      <text x="98" y="92" class="t-lbl" text-anchor="middle" style="font:600 26px ui-monospace,monospace">${tds}</text>
      <text x="238" y="122" class="t-sm" text-anchor="middle">vida de los filtros</text>
      ${life}${btns}
      <text x="290" y="150" class="t-sm" text-anchor="end" style="font-size:10px">°C</text>
      ${finger ? fingerAt(fx, 170, { hold }) : ''}
    </g>`;
  }
  // equipo de lado: cuerpo, depósito detrás, tapa
  function side({ tankUp = false, lidOff = false, plugged = true } = {}) {
    return `<g>
      <rect x="40" y="90" width="150" height="130" rx="12" class="f-pl s-line" stroke-width="1.6"/>
      <rect x="40" y="${lidOff ? 50 : 80}" width="150" height="14" rx="6" class="f-bar s-line" stroke-width="1.2"
        transform="${lidOff ? 'rotate(-12 115 57)' : ''}"/>
      <rect x="196" y="${tankUp ? 40 : 96}" width="84" height="124" rx="10" class="f-film s-line" stroke-width="1.4"/>
      <rect x="200" y="${tankUp ? 90 : 146}" width="76" height="${tankUp ? 70 : 70}" rx="6" class="f-water" opacity=".3"/>
      <path d="M220,${tankUp ? 30 : 86} h36" class="s-line" stroke-width="4" stroke-linecap="round"/>
      ${tankUp ? '' : '<text x="238" y="234" class="t-sm" text-anchor="middle">depósito</text>'}
      <rect x="86" y="150" width="56" height="62" rx="8" class="f-none s-line" stroke-width="1.2" stroke-dasharray="4 3"/>
      <text x="114" y="186" class="t-sm" text-anchor="middle">jarra</text>
      ${plugged ? '' : `<g transform="translate(20 210)"><circle r="10" class="f-bad"/><path d="M-4,-4 L4,4 M4,-4 L-4,4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`}
    </g>`;
  }
  const up = (x, y1, y2) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="s-acc" stroke-width="3" marker-end="url(#ah)" stroke-linecap="round"/>`;

  const S = {
    prep(f) {
      return wrap(`
        <text x="160" y="24" class="t-head" text-anchor="middle">Filtro ${N[f]} nuevo · sin herramientas</text>
        ${cartV(110, 50, `${N[f]}`, { h: 130 })}
        <rect x="170" y="150" width="110" height="54" rx="8" class="f-cloth s-line" stroke-width="1.4"/>
        <text x="225" y="222" class="t-sm" text-anchor="middle">trapo</text>`);
    },
    unplug() { return wrap(`${side({ plugged: false })}${badge(160, 26, 'apaga y desenchufa')}`); },
    openTop() {
      return wrap(`${side({ tankUp: true, lidOff: true })}
        ${up(238, 52, 20)}${up(115, 46, 16)}
        ${badge(160, 228, 'quita el depósito y la tapa')}`);
    },
    twistUnlock(f) {
      const x = 70 + (N[f] - 1) * 90;
      return wrap(`${topView(f, { open: true })}
        ${lock(x - 30, 70, true)}${lock(x + 4, 70, false)}
        ${badge(160, 216, `gira el ${N[f]} hasta el candado abierto`)}`);
    },
    liftOut(f) {
      return wrap(`
        <rect x="40" y="150" width="240" height="58" rx="10" class="f-pl s-line" stroke-width="1.5"/>
        ${[1, 2, 3].map(n => `<ellipse cx="${100 + (n - 1) * 60}" cy="152" rx="20" ry="6" class="f-bar s-line" stroke-width="1"/>`).join('')}
        ${cartV(100 + (N[f] - 1) * 60, 30, `${N[f]}`, { h: 104, hl: true })}
        ${up(100 + (N[f] - 1) * 60 + 40, 120, 50)}
        <g class="anim-drip">${drop(100 + (N[f] - 1) * 60, 142, .8)}</g>
        ${badge(160, 226, 'hacia arriba')}`);
    },
    insertLock(f) {
      const x = 100 + (N[f] - 1) * 60;
      return wrap(`
        <rect x="40" y="150" width="240" height="58" rx="10" class="f-pl s-line" stroke-width="1.5"/>
        ${[1, 2, 3].map(n => `<ellipse cx="${100 + (n - 1) * 60}" cy="152" rx="20" ry="6" class="f-bar s-line" stroke-width="1"/>`).join('')}
        ${cartV(x, 30, `${N[f]}`, { h: 104, hl: true, arrow: true })}
        <line x1="${x + 40}" y1="50" x2="${x + 40}" y2="120" class="s-acc" stroke-width="3" marker-end="url(#ah)" stroke-linecap="round"/>
        ${lock(30, 120, true)}<path d="M44,120 h18" class="s-acc" stroke-width="2.4" marker-end="url(#ah)"/>${lock(76, 120, false)}
        ${badge(160, 226, 'flecha abajo · gira a cerrado')}`);
    },
    closeTop() { return wrap(`${side()}${badge(160, 26, 'tapa, depósito lleno y enchufa')}`); },
    resetEnter() {
      return wrap(`${panel({ finger: '98', hold: true, blink: true, cells: { 1: 3, 2: 3, 3: 0 } })}
        ${badge(160, 20, 'mantén 98 °C 5 s → parpadean 1·2·3')}`);
    },
    resetFilter(f) {
      const cells = { 1: 3, 2: 3, 3: 3 };
      return wrap(`${panel({ finger: RESET_BTN[f], hold: true, cells })}
        ${badge(160, 20, `mantén ${RESET_BTN[f]} °C 5 s → filtro ${N[f]} lleno`)}`);
    },
    flushCups() {
      return wrap(`
        <rect x="70" y="70" width="80" height="110" rx="10" class="f-film s-line" stroke-width="1.5"/>
        <rect x="74" y="100" width="72" height="76" rx="7" class="f-water" opacity=".35"/>
        <path d="M150,96 q40,-10 60,30" class="s-acc f-none" stroke-width="3" marker-end="url(#ah)"/>
        <path d="M196,150 h80 l-8,40 h-64z" class="f-pl s-line" stroke-width="1.4"/>
        <text x="236" y="216" class="t-sm" text-anchor="middle">fregadero</text>
        ${badge(110, 210, '× 3 · no se bebe')}`);
    },
    done() { return wrap(`${topView(null)}${check(160, 118, 1.6)}${badge(160, 216, 'registrar el cambio')}`); },
  };

  /* ---------- portada: frontal con panel; indicadores 1·2·3 tocables ---------- */
  function front(st, tds = '008') {
    // st: {F1,F2,F3: {cls, frac}}
    const col = c => ({ ok: '#4fb3ff', warn: '#f5c542', bad: '#ff5a5a' }[c] || '#4fb3ff');
    const ind = (n, f) => {
      const s = st[f], x = 70 + (n - 1) * 70, cells = s.cls === 'bad' ? 0 : Math.max(1, Math.ceil(Math.min(1, s.frac) * 3));
      return `<g class="hot" data-f="${f}" tabindex="0" role="button" aria-label="Cambiar filtro ${n}">
        <rect x="${x - 4}" y="380" width="58" height="96" rx="12" class="dev-cap-rim"/>
        ${[0, 1, 2].map(c => `<rect x="${x + 6 + c * 13}" y="394" width="10" height="34" rx="3"
          style="fill:${c < cells ? col(s.cls) : 'none'};stroke:#8a94a0;stroke-width:1.2"/>`).join('')}
        <text x="${x + 25}" y="452" class="dev-lbl" text-anchor="middle" style="font-size:18px">${n}</text>
        <text x="${x + 25}" y="468" class="dev-sm" text-anchor="middle">${{ F1: 'M2S', F2: 'RO', F3: 'Q2S' }[f]}</text>
      </g>`;
    };
    return `<svg class="front" viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frontal del JIMMY R9">
      <defs><filter id="shadow" x="-.3" y="-.2" width="1.6" height="1.5"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <ellipse cx="160" cy="600" rx="130" ry="11" class="dev-shadow" filter="url(#shadow)"/>
      <rect x="30" y="120" width="260" height="470" rx="26" style="fill:#3a3f46;stroke:#555c66;stroke-width:2"/>
      <rect x="44" y="134" width="232" height="80" rx="14" style="fill:#16191d"/>
      <text x="100" y="186" text-anchor="middle" style="font:600 30px ui-monospace,monospace;fill:#7fd0ff">${tds}</text>
      <text x="100" y="204" text-anchor="middle" style="font:600 9px system-ui;fill:#7f8a97">TDS</text>
      ${BTN.map((b, i) => `<circle cx="${160 + (i % 4) * 30}" cy="${160 + Math.floor(i / 4) * 30}" r="10" style="fill:#2a2f35;stroke:#59616c"/>
        <text x="${160 + (i % 4) * 30}" y="${164 + Math.floor(i / 4) * 30}" text-anchor="middle" style="font:600 8px system-ui;fill:#aab3bf">${b}</text>`).join('')}
      <rect x="110" y="240" width="100" height="110" rx="10" style="fill:#2a2f35"/>
      <rect x="140" y="250" width="40" height="18" rx="5" style="fill:#59616c"/>
      <rect x="128" y="290" width="64" height="52" rx="6" style="fill:none;stroke:#7f8a97;stroke-dasharray:4 3"/>
      ${ind(1, 'F1')}${ind(2, 'F2')}${ind(3, 'F3')}
      <text x="160" y="520" text-anchor="middle" style="font:600 12px system-ui;fill:#aab3bf">Toca un filtro para ver su cambio</text>
    </svg>`;
  }
  return { S, front, panel };
})();
if (typeof module !== 'undefined') module.exports = { JIM };
