/* Bluevua ROPOT / ROPOT UV — dibujos propios, sin logotipos.
   Datos de fichas/bluevua-ropot.md (manuales + fotos del fabricante):
   sobremesa blanco; pantalla redonda de TDS al frente y jarra a la derecha;
   en el lateral izquierdo, una tapa que se saca y deja a la vista 4 filtros verticales
   numerados arriba 1·2·3·4 (PP, CTO, RO, PCF), de izquierda a derecha.
   Sacar: inclinar el filtro unos 45° y girar horario. Poner: girar antihorario hasta el clic.
   Reset: interruptor detrás del panel 3 s → parpadea el 1 → botón de volumen hasta el filtro → interruptor. */
'use strict';

const ROPOT = (() => {
  const { wrap, arc, badge, fingerAt, check, clock, drop } = ILL.H;
  const IDX = { PP: 1, CTO: 2, RO: 3, PCF: 4 }, NAMES = ['PP', 'CTO', 'RO', 'PCF'];

  // los 4 filtros vistos con la tapa lateral quitada; tilt: índice del que se inclina
  function bay({ hl = null, tilt = null, missing = null } = {}) {
    return `<g>
      <rect x="30" y="40" width="200" height="180" rx="10" class="f-pl s-line" stroke-width="1.6"/>
      ${[1, 2, 3, 4].map(n => {
        const x = 40 + (n - 1) * 46;
        const label = `<rect x="${x + 6}" y="48" width="28" height="16" rx="8" class="f-bar"/>
          <text x="${x + 20}" y="60" class="t-sm" text-anchor="middle" style="font-weight:700">${n}</text>`;
        if (n === missing) return label;
        const rot = n === tilt ? -35 : 0;
        return `${label}<g transform="rotate(${rot} ${x + 20} 210)">
          <rect x="${x + 4}" y="72" width="32" height="140" rx="10" class="f-film ${n === hl || n === tilt ? 's-acc' : 's-line'}" stroke-width="${n === hl || n === tilt ? 2.4 : 1.2}"/>
          <text x="${x + 20}" y="150" class="t-sm" text-anchor="middle" transform="rotate(-90 ${x + 20} 146)">${NAMES[n - 1]}</text></g>`;
      }).join('')}
    </g>`;
  }
  // panel: indicadores 1–4, UV y botón de volumen alargado
  function panel({ blink = null, finger = null, tap = false, hold = false } = {}) {
    return `<g>
      <circle cx="110" cy="100" r="62" class="f-pl s-line" stroke-width="2"/>
      <circle cx="110" cy="100" r="50" class="f-bar s-line" stroke-width="1"/>
      <text x="110" y="92" class="t-sm" text-anchor="middle">IN 250</text>
      <text x="110" y="116" class="t-lbl" text-anchor="middle" style="font:600 20px ui-monospace,monospace">OUT 8</text>
      ${[1, 2, 3, 4].map(n => `<circle cx="${200 + (n - 1) * 26}" cy="70" r="8" style="fill:#4fb3ff" class="${n === blink ? 'anim-blink' : ''}"/>
        <text x="${200 + (n - 1) * 26}" y="94" class="t-sm" text-anchor="middle">${n}</text>`).join('')}
      <rect x="196" y="120" width="88" height="30" rx="15" class="f-pl s-line" stroke-width="1.6"/>
      <text x="196" y="166" class="t-sm">botón volumen</text>
      ${finger === 'vol' ? fingerAt(240, 135, { tap }) : ''}
      <rect x="40" y="180" width="60" height="24" rx="6" class="f-bar s-line" stroke-width="1"/>
      <rect x="${hold ? 70 : 46}" y="184" width="24" height="16" rx="4" class="f-acc-soft s-acc" stroke-width="1.4"/>
      <text x="70" y="172" class="t-sm" text-anchor="middle">interruptor reset</text>
      ${finger === 'sw' ? fingerAt(82, 192, { hold }) : ''}
    </g>`;
  }
  const plug = (x, y, out) => `<g>
      <rect x="${x}" y="${y}" width="50" height="62" rx="9" class="f-pl s-line" stroke-width="1.5"/>
      <circle cx="${x + 17}" cy="${y + 31}" r="4" class="f-ink"/><circle cx="${x + 33}" cy="${y + 31}" r="4" class="f-ink"/>
      <g transform="translate(${out ? -40 : 0} 0)"><rect x="${x - 28}" y="${y + 18}" width="26" height="26" rx="5" class="f-bar s-line" stroke-width="1.2"/>
        <path d="M${x - 2},${y + 27} h8 M${x - 2},${y + 35} h8" class="s-ink" stroke-width="3"/></g>
      ${out ? `<g transform="translate(${x - 20} ${y - 4})"><circle r="10" class="f-bad"/><path d="M-4,-4 L4,4 M4,-4 L-4,4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>` : ''}
    </g>`;
  const tank = (x, y, fill) => `<g><rect x="${x}" y="${y}" width="70" height="100" rx="10" class="f-film s-line" stroke-width="1.4"/>
      <rect x="${x + 4}" y="${y + 100 - 96 * fill}" width="62" height="${96 * fill}" rx="7" class="f-water" opacity=".35"/></g>`;

  const S = {
    unplug() {
      return wrap(`${tank(40, 70, .05)}
        <path d="M78,184 h40 l-6,30 h-28z" class="f-pl s-line" stroke-width="1.2"/>
        ${plug(230, 80, true)}
        ${badge(160, 26, 'apaga, desenchufa y vacía el depósito')}`);
    },
    sideCover() {
      return wrap(`${bay()}
        <rect x="6" y="50" width="16" height="160" rx="6" class="f-pl s-acc" stroke-width="2"/>
        <line x1="40" y1="30" x2="8" y2="30" class="s-acc" stroke-width="3" marker-end="url(#ah)" stroke-linecap="round"/>
        ${badge(272, 120, 'tapa lateral')}`);
    },
    tiltTwistOut(f = 'RO') {
      const n = IDX[f] || 3, x = 40 + (n - 1) * 46 + 20;
      return wrap(`${bay({ tilt: n })}
        ${arc(x - 50, 96, 26, -60, 60)}
        ${badge(276, 90, '≈ 45°')}${badge(276, 130, 'horario ↻')}${badge(276, 170, 'y sácalo')}`);
    },
    twistLock(f = 'RO') {
      const n = IDX[f] || 3, x = 40 + (n - 1) * 46 + 20;
      return wrap(`${bay({ hl: n })}
        ${arc(x, 230, 24, 60, -60)}
        ${badge(268, 100, 'antihorario')}${badge(268, 140, 'hasta el clic')}
        <text x="268" y="190" class="t-sm" text-anchor="middle">1 PP · 2 CTO</text><text x="268" y="206" class="t-sm" text-anchor="middle">3 RO · 4 PCF</text>`);
    },
    powerOn() {
      return wrap(`${bay()}
        <rect x="26" y="44" width="16" height="172" rx="6" class="f-pl s-acc" stroke-width="2"/>
        <line x1="4" y1="30" x2="36" y2="30" class="s-acc" stroke-width="3" marker-end="url(#ah)" stroke-linecap="round"/>
        ${plug(250, 90, false)}`);
    },
    resetToggle() {
      return wrap(`${panel({ blink: 1, finger: 'sw', hold: true })}${badge(160, 18, 'interruptor 3 s → parpadea el 1')}`);
    },
    resetSelect(f = 'RO') {
      return wrap(`${panel({ blink: IDX[f] || 3, finger: 'vol', tap: true })}${badge(160, 18, 'volumen: pasa de filtro en filtro')}`);
    },
    flushCycles() {
      return wrap(`${tank(30, 50, 1)}
        <path d="M108,100 h40" class="s-acc" stroke-width="3" marker-end="url(#ah)"/>
        <path d="M160,60 h56 v90 q0,14 -14,14 h-28 q-14,0 -14,-14z" class="f-film s-line" stroke-width="1.4"/>
        <path d="M226,110 q30,0 40,40" class="s-acc f-none" stroke-width="3" marker-end="url(#ah)"/>
        <path d="M240,170 h60 l-6,34 h-48z" class="f-pl s-line" stroke-width="1.2"/>
        ${badge(130, 214, '× 3 ciclos · no se bebe')}`);
    },
    done() { return wrap(`${bay()}${check(130, 130, 1.6)}`); },
  };

  /* ---------- portada: lateral con los 4 filtros (tocables) y frontal con la pantalla ---------- */
  function front(st) {
    const col = c => ({ ok: '#4fb3ff', warn: '#f5c542', bad: '#ff5a5a' }[c] || '#4fb3ff');
    const f = (n, id) => {
      const s = st[id], x = 52 + (n - 1) * 44, h = 190, fill = s.cls === 'bad' ? 1 : Math.min(1, s.frac);
      return `<g class="hot" data-f="${id}" tabindex="0" role="button" aria-label="Cambiar filtro ${n} ${id}">
        <rect x="${x}" y="300" width="34" height="${h}" rx="10" class="dev-cap-rim"/>
        <rect x="${x + 4}" y="${300 + h - (h - 8) * fill - 4}" width="26" height="${(h - 8) * fill}" rx="7" style="fill:${col(s.cls)};opacity:.35"/>
        <rect x="${x + 3}" y="276" width="28" height="18" rx="9" class="dev-bar"/>
        <text x="${x + 17}" y="289" class="dev-lbl" text-anchor="middle" style="font-size:12px">${n}</text>
        <text x="${x + 17}" y="410" class="dev-sm" text-anchor="middle" transform="rotate(-90 ${x + 17} 406)">${id}</text>
      </g>`;
    };
    return `<svg class="front" viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bluevua ROPOT: lateral con los filtros y pantalla">
      <defs><filter id="shadow" x="-.3" y="-.2" width="1.6" height="1.5"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <ellipse cx="160" cy="590" rx="140" ry="11" class="dev-shadow" filter="url(#shadow)"/>
      <rect x="30" y="120" width="260" height="460" rx="22" style="fill:#f3f5f7;stroke:#c9d0d8;stroke-width:2"/>
      <circle cx="160" cy="200" r="54" style="fill:#d9dee4;stroke:#9aa7b8;stroke-width:3"/>
      <circle cx="160" cy="200" r="44" style="fill:#16191d"/>
      <text x="160" y="196" text-anchor="middle" style="font:600 9px system-ui;fill:#7f8a97">IN 250</text>
      <text x="160" y="216" text-anchor="middle" style="font:600 18px ui-monospace,monospace;fill:#7fd0ff">OUT 8</text>
      <rect x="40" y="262" width="190" height="244" rx="12" style="fill:#e4e8ec;stroke:#c9d0d8"/>
      ${f(1, 'PP')}${f(2, 'CTO')}${f(3, 'RO')}${f(4, 'PCF')}
      <path d="M244,300 h34 v120 q0,16 -16,16 h-10 q-8,0 -8,-8z" style="fill:#d9dee4;stroke:#9aa7b8"/>
      <text x="262" y="456" text-anchor="middle" style="font:600 9px system-ui;fill:#6b7480">jarra</text>
      <text x="160" y="540" class="dev-sm" text-anchor="middle">Toca un filtro para ver su cambio</text>
    </svg>`;
  }
  return { S, front, panel };
})();
if (typeof module !== 'undefined') module.exports = { ROPOT };
