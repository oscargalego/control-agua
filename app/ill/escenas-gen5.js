/* Escenas del equipo clásico de 5 etapas con depósito (perfil genérico) — dibujos propios.
   Cubre ATH Genius, Bbagua EUR, Nature Water, Hidrowater, APEC… Sin marca ni logotipo.
   Disposición según los manuales de Bbagua y ATH: tres vasos de 10" en fila (sedimentos,
   carbón granular, carbón en bloque, de izquierda a derecha), portamembranas horizontal,
   postfiltro en línea, depósito presurizado con llave y grifo propio.
   Usa las piezas comunes de illus-base.js (ILL.H). */
'use strict';

const GEN5 = (() => {
  const { wrap, badge, faucet, fingerAt, check, clock, drop } = ILL.H;

  // ---------- piezas ----------
  // Vaso de 10" colgado de su cabezal. open: vaso bajado y separado del cabezal
  function housing(x, y, { label = '', open = false, cart = true, hl = false, cls = '' } = {}) {
    const dy = open ? 34 : 0;
    return `<g class="${cls}">
      <rect x="${x - 26}" y="${y}" width="52" height="16" rx="4" class="f-bar s-line" stroke-width="1.2"/>
      <g transform="translate(0 ${dy})">
        <path d="M${x - 22},${y + 16} h44 v108 q0,10 -10,10 h-24 q-10,0 -10,-10 z" class="f-pl ${hl ? 's-acc' : 's-line'}" stroke-width="${hl ? 2.4 : 1.5}"/>
        ${cart ? `<rect x="${x - 13}" y="${y + 22}" width="26" height="100" rx="5" class="f-cloth s-line" stroke-width="1"/>` : ''}
        ${label ? `<text x="${x}" y="${y + 78}" class="t-sm" text-anchor="middle">${label}</text>` : ''}
      </g>
    </g>`;
  }
  // Portamembranas horizontal
  function membraneHousing(x, y, w = 190, { open = false, hl = false } = {}) {
    return `<g>
      <rect x="${x}" y="${y}" width="${w}" height="34" rx="12" class="f-pl ${hl ? 's-acc' : 's-line'}" stroke-width="${hl ? 2.4 : 1.5}"/>
      <rect x="${open ? x - 34 : x - 8}" y="${y + 4}" width="14" height="26" rx="4" class="f-bar s-line" stroke-width="1.2"/>
      <text x="${x + w / 2}" y="${y + 21}" class="t-sm" text-anchor="middle">membrana</text>
    </g>`;
  }
  // Llave de bola: open = maneta en línea con el tubo
  // horiz: tubo horizontal (la maneta abierta va en línea con el tubo)
  function valve(x, y, open, label, horiz = false) {
    return `<g>
      <circle cx="${x}" cy="${y}" r="9" class="f-pl s-line" stroke-width="1.4"/>
      <rect x="${x - 3}" y="${y - 24}" width="6" height="22" rx="3" class="${open ? 'f-ok' : 'f-bad'}"
        transform="rotate(${open === horiz ? 90 : 0} ${x} ${y})"/>
      ${label ? `<text x="${x}" y="${y + 24}" class="t-sm" text-anchor="middle">${label}</text>` : ''}
    </g>`;
  }
  function tank(x, y, { valveOpen = true, fill = 1 } = {}) {
    const h = 110, wl = h * (1 - fill);
    return `<g>
      <rect x="${x}" y="${y}" width="84" height="${h}" rx="30" class="f-pl s-line" stroke-width="1.5"/>
      <clipPath id="tk${x}"><rect x="${x}" y="${y}" width="84" height="${h}" rx="30"/></clipPath>
      <rect x="${x}" y="${y + wl}" width="84" height="${h - wl}" clip-path="url(#tk${x})" class="f-water" opacity=".35"/>
      ${valve(x + 42, y - 14, valveOpen)}
      <text x="${x + 42}" y="${y + h + 18}" class="t-sm" text-anchor="middle">depósito</text>
    </g>`;
  }
  // Llave de vasos: anillo que abraza el vaso + mango
  function wrench(x, y, rot = 0) {
    return `<g transform="rotate(${rot} ${x} ${y})">
      <circle cx="${x}" cy="${y}" r="30" class="f-none s-ink" stroke-width="9"/>
      <circle cx="${x}" cy="${y}" r="30" class="f-none s-line" stroke-width="1" stroke-dasharray="3 6"/>
      <rect x="${x + 26}" y="${y - 7}" width="64" height="14" rx="7" class="f-bar s-line" stroke-width="1.2"/>
    </g>`;
  }
  const arrowCCW = (x, y) => `<path d="M${x + 30},${y} a30,12 0 1 1 -14,-10" class="s-acc f-none" stroke-width="3" marker-end="url(#ah)"/>`;
  const arrowCW = (x, y) => `<path d="M${x - 30},${y} a30,12 0 1 0 14,-10" class="s-acc f-none" stroke-width="3" marker-end="url(#ah)"/>`;
  const L = ['1', '2', '3'];

  // ---------- escenas ----------
  const S = {
    prep() {
      return wrap(`
        <text x="160" y="28" class="t-head" text-anchor="middle">Cartuchos nuevos · llave de vasos · barreño</text>
        ${[60, 110, 160].map((x, i) => `<rect x="${x - 15}" y="52" width="30" height="96" rx="6" class="f-cloth s-line" stroke-width="1.2"/>
          <text x="${x}" y="104" class="t-sm" text-anchor="middle">${L[i]}</text>`).join('')}
        ${wrench(250, 120, 0)}
        <path d="M200,176 h96 l-8,40 h-80z" class="f-pl s-line" stroke-width="1.4"/>
        <text x="248" y="232" class="t-sm" text-anchor="middle">barreño</text>
        <path d="M24,176 h80 v36 h-80z" class="f-cloth s-line" stroke-width="1.2"/>
        <text x="64" y="232" class="t-sm" text-anchor="middle">trapo · guantes</text>`);
    },
    closeInlet() {
      return wrap(`
        <path d="M20,120 h110" class="s-line" stroke-width="8" stroke-linecap="round"/>
        <path d="M190,120 h110" class="s-line" stroke-width="8" stroke-linecap="round"/>
        <g transform="translate(160 120) scale(2.2) translate(-160 -120)">${valve(160, 120, false, "", true)}</g>
        ${badge(160, 214, 'cierra la llave de entrada del equipo')}`);
    },
    openTap() {
      return wrap(`
        ${faucet(84, 92, { open: true })}
        <path d="M128,186 h72 l-6,32 h-60z" class="f-pl s-line" stroke-width="1.4"/>
        ${tank(214, 76, { fill: .15 })}
        ${badge(160, 30, 'abre el grifo hasta que deje de salir agua')}`);
    },
    closeTankValve() {
      return wrap(`
        ${tank(118, 92, { valveOpen: false, fill: .1 })}
        ${badge(160, 30, 'cierra la llave del depósito')}`);
    },
    unscrewHousing() {
      return wrap(`
        ${housing(100, 46, { open: true, hl: true, label: '1' })}
        ${arrowCCW(100, 210)}
        ${wrench(216, 150, 0)}
        <path d="M60,214 h80 l-6,16 h-68z" class="f-pl s-line" stroke-width="1.2"/>
        ${badge(220, 40, 'antihorario, con la llave')}`);
    },
    cleanHousing() {
      return wrap(`
        ${housing(110, 50, { open: true, cart: false })}
        <g class="anim-drip">${drop(110, 120, 1.2)}${drop(124, 140, .9)}</g>
        ${faucet(196, 70, { open: true })}
        ${badge(160, 222, 'agua caliente · sin lejía')}`);
    },
    oring() {
      return wrap(`
        <ellipse cx="160" cy="120" rx="92" ry="34" class="f-none s-ink" stroke-width="2"/>
        <ellipse cx="160" cy="120" rx="78" ry="26" class="f-none s-acc" stroke-width="7"/>
        <ellipse cx="160" cy="120" rx="64" ry="18" class="f-none s-ink" stroke-width="2"/>
        ${check(270, 60, .7)}
        ${badge(160, 214, 'junta entera y bien asentada')}`);
    },
    rinseCarbon() {
      return wrap(`
        ${faucet(70, 64, { open: true })}
        <rect x="128" y="150" width="96" height="28" rx="6" class="f-cloth s-line" stroke-width="1.2"/>
        <text x="176" y="168" class="t-sm" text-anchor="middle">carbón</text>
        <g class="anim-drip">${drop(150, 196, .9, 'f-bar')}${drop(170, 210, .7, 'f-bar')}</g>
        ${badge(160, 30, 'enjuágalo hasta que el agua salga limpia')}`);
    },
    insertCartridge() {
      return wrap(`
        ${[80, 160, 240].map((x, i) => housing(x, 40, { open: true, label: L[i] })).join('')}
        <text x="160" y="226" class="t-sm" text-anchor="middle">1 sedimentos · 2 carbón granular · 3 carbón en bloque</text>`);
    },
    screwHousing() {
      return wrap(`
        ${housing(100, 50, { hl: true, label: '1' })}
        ${arrowCW(100, 206)}
        ${wrench(216, 150, 0)}
        ${badge(220, 40, 'a mano + ajuste con la llave')}`);
    },
    openInlet() {
      return wrap(`
        <path d="M20,120 h110" class="s-line" stroke-width="8" stroke-linecap="round"/>
        <path d="M190,120 h110" class="s-water" stroke-width="8" stroke-linecap="round"/>
        <g transform="translate(160 120) scale(2.2) translate(-160 -120)">${valve(160, 120, true, "", true)}</g>
        ${badge(160, 214, 'abre la entrada (y la llave del depósito)')}`);
    },
    leak() {
      return wrap(`
        ${[80, 160, 240].map(x => housing(x, 30)).join('')}
        <g transform="translate(160 190)"><circle r="26" class="f-pl s-ink" stroke-width="3"/>
          ${drop(0, 2, 1.3, 'f-water')}<path d="M-15,-15 L15,15" class="s-bad" stroke-width="3.5" stroke-linecap="round"/></g>`);
    },
    drainTank() {
      return wrap(`
        ${tank(40, 70, { fill: 1 })}
        <path d="M134,128 h40" class="s-acc" stroke-width="3" marker-end="url(#ah)"/>
        ${tank(190, 70, { fill: .05 })}
        ${badge(160, 30, 'llena y vacía el depósito · 2 veces')}
        ${clock(270, 210, '3–4 h')}`);
    },
    openMembraneHousing() {
      return wrap(`
        ${membraneHousing(90, 100, 180, { open: true, hl: true })}
        <path d="M30,117 h26" class="s-line" stroke-width="5" stroke-linecap="round" stroke-dasharray="5 5"/>
        ${badge(160, 40, 'suelta el tubo y desenrosca la tapa')}`);
    },
    pullMembrane() {
      return wrap(`
        ${membraneHousing(150, 100, 150, { open: true })}
        <rect x="24" y="104" width="110" height="26" rx="10" class="f-cloth s-line" stroke-width="1.2"/>
        <path d="M150,96 h-30" class="s-acc" stroke-width="3" marker-end="url(#ah)"/>
        ${badge(160, 40, 'sácala tirando del tubo central')}`);
    },
    insertMembrane() {
      return wrap(`
        ${membraneHousing(150, 100, 150, { open: true, hl: true })}
        <rect x="40" y="104" width="110" height="26" rx="10" class="f-cloth s-line" stroke-width="1.2"/>
        <circle cx="140" cy="117" r="5" class="f-none s-acc" stroke-width="2.5"/><circle cx="130" cy="117" r="5" class="f-none s-acc" stroke-width="2.5"/>
        <path d="M60,90 h70" class="s-acc" stroke-width="3" marker-end="url(#ah)"/>
        ${badge(160, 210, 'las dos juntas por delante, hasta el fondo')}`);
    },
    closeMembraneHousing() {
      return wrap(`
        ${membraneHousing(90, 100, 180, { hl: true })}
        ${badge(160, 40, 'enrosca la tapa y conecta el tubo')}`);
    },
    releaseFittings() {
      return wrap(`
        <rect x="100" y="104" width="120" height="30" rx="12" class="f-pl s-line" stroke-width="1.5"/>
        <text x="160" y="124" class="t-sm" text-anchor="middle">postfiltro</text>
        <path d="M40,119 h44 M236,119 h44" class="s-line" stroke-width="5" stroke-linecap="round"/>
        ${fingerAt(92, 119, { tap: true })}
        ${badge(160, 40, 'presiona el anillo y saca el tubo')}`);
    },
    threadTape() {
      return wrap(`
        <rect x="110" y="104" width="80" height="30" rx="8" class="f-bar s-line" stroke-width="1.2"/>
        ${[0, 1, 2, 3, 4].map(i => `<line x1="${118 + i * 14}" y1="104" x2="${126 + i * 14}" y2="134" class="s-ink" stroke-width="1.2"/>`).join('')}
        <path d="M110,104 h80" class="s-acc" stroke-width="5" opacity=".6"/>
        ${badge(160, 210, 'cinta de teflón en la rosca')}`);
    },
    flowArrow() {
      return wrap(`
        ${tank(20, 70, { fill: .6 })}
        <rect x="130" y="104" width="100" height="30" rx="12" class="f-pl s-acc" stroke-width="2.4"/>
        <path d="M150,119 h56" class="s-acc" stroke-width="3" marker-end="url(#ah)"/>
        <text x="270" y="124" class="t-sm" text-anchor="middle">al grifo</text>
        <path d="M110,119 h18 M232,119 h14" class="s-line" stroke-width="5" stroke-linecap="round"/>
        ${badge(160, 40, 'la flecha apunta hacia el grifo')}`);
    },
    done() {
      return wrap(`${[80, 160, 240].map(x => housing(x, 30)).join('')}${check(160, 196, 1.2)}`);
    },
  };

  /* ---------- portada: vista de frente del equipo bajo el fregadero ---------- */
  function front(st) {
    // st: {S1,S2,S3,MEM,POST: {cls, frac}}
    const col = c => ({ ok: '#4fb3ff', warn: '#b07cff', bad: '#ff5a5a' }[c] || '#4fb3ff');
    const bar = (x, y, w, s) => `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" class="ring-bg"/>
      <rect x="${x}" y="${y}" width="${Math.max(4, w * (s.cls === 'bad' ? 1 : Math.min(1, s.frac)))}" height="6" rx="3" style="fill:${col(s.cls)}"/>`;
    const sump = (x, f, n) => `<g class="hot" data-f="${f}" tabindex="0" role="button" aria-label="Cambiar etapa ${n}">
        <rect x="${x - 34}" y="186" width="68" height="20" rx="5" class="dev-bar"/>
        <path d="M${x - 29},206 h58 v200 q0,14 -14,14 h-30 q-14,0 -14,-14 z" class="dev-cap-rim"/>
        <rect x="${x - 15}" y="218" width="30" height="180" rx="8" style="fill:#e2e7ec"/>
        <text x="${x}" y="314" class="dev-lbl" text-anchor="middle">${n}</text>
        ${bar(x - 29, 432, 58, st[f])}
      </g>`;
    return `<svg class="front" viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Equipo de ósmosis de 5 etapas">
      <defs><filter id="shadow" x="-.3" y="-.2" width="1.6" height="1.5"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <rect x="22" y="160" width="276" height="16" rx="4" style="fill:#c9d0d8"/>
      <g class="hot" data-f="MEM" tabindex="0" role="button" aria-label="Cambiar membrana">
        <rect x="46" y="96" width="228" height="48" rx="18" class="dev-cap-rim"/>
        <rect x="34" y="104" width="16" height="32" rx="5" class="dev-bar"/>
        <text x="160" y="125" class="dev-lbl" text-anchor="middle">4 · membrana</text>
        ${bar(70, 80, 180, st.MEM)}
      </g>
      ${sump(76, 'S1', 1)}${sump(160, 'S2', 2)}${sump(244, 'S3', 3)}
      <g class="hot" data-f="POST" tabindex="0" role="button" aria-label="Cambiar postfiltro">
        <rect x="96" y="512" width="128" height="34" rx="14" class="dev-cap-rim"/>
        <text x="160" y="534" class="dev-lbl" text-anchor="middle">5 · postfiltro</text>
        <path d="M40,529 h54 M226,529 h54" style="stroke:#9aa7b8" stroke-width="5" stroke-linecap="round"/>
        ${bar(110, 556, 100, st.POST)}
      </g>
      ${st.ALK ? `<g class="hot" data-f="ALK" tabindex="0" role="button" aria-label="Cambiar alcalino">
        <rect x="96" y="574" width="128" height="30" rx="12" class="dev-cap-rim"/>
        <text x="160" y="594" class="dev-lbl" text-anchor="middle">6 · alcalino</text>
        ${bar(110, 610, 100, st.ALK)}
      </g>` : `<text x="160" y="606" class="dev-sm" text-anchor="middle">Toca una etapa para ver su cambio</text>`}
    </svg>`;
  }

  return { S, front };
})();
if (typeof module !== 'undefined') module.exports = { GEN5 };
