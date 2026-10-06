/* Frontal esquemático del Waterdrop G3P600 — dibujo propio, de línea, sin logotipos.
   Datos de la ficha fichas/waterdrop-g3p600.md (foto oficial del producto + hojas de los cartuchos):
   tres tapas en columna (CB arriba, la más pequeña; CF en medio; RO abajo, la más grande),
   tres indicadores CB·CF·RO y pantalla «TDS OUT» en la parte superior,
   marcas por tapa: círculo vacío a la izquierda (OFF), punto relleno arriba (ON), flecha de giro horario.
   Usa las mismas clases CSS que el frontal del G2 (illus.js). */
'use strict';

function frontG3P600(st, tds = '006') {
  // st: {CB:{cls,frac,led}, CF:{…}, RO:{…}}
  const CX = 160;
  const cap = (cy, r, f) => {
    const s = st[f], R = r + 7, C = 2 * Math.PI * R;
    // caducado: anillo rojo completo (un punto rojo junto a la marca ON se confundía con ella)
    const len = s.cls === 'bad' ? C : Math.max(0.001, Math.min(1, s.frac)) * C;
    // pala: ancha y redondeada arriba, se estrecha hacia abajo (como en la foto)
    const wt = r * 0.66, wb = r * 0.32, top = cy - r * 0.78, bot = cy + r * 0.80;
    const paddle = `M${CX - wt / 2},${top + wt * 0.35} Q${CX - wt / 2},${top} ${CX},${top} Q${CX + wt / 2},${top} ${CX + wt / 2},${top + wt * 0.35}
      L${CX + wb / 2},${bot - wb / 2} Q${CX + wb / 2},${bot} ${CX},${bot} Q${CX - wb / 2},${bot} ${CX - wb / 2},${bot - wb / 2} Z`;
    // marcas por fuera del anillo: OFF (círculo vacío) a las 9, ON (punto) a las 12, flecha horaria entre ambas
    const m = R + 9, ang = a => [CX + m * Math.cos(a), cy + m * Math.sin(a)];
    const [ox, oy] = ang(Math.PI), [nx, ny] = ang(Math.PI * 1.5);
    const a0 = ang(Math.PI * 1.1), a1 = ang(Math.PI * 1.38);
    const fs = Math.round(r * 0.30);
    return `<g class="hot" data-f="${f}" tabindex="0" role="button" aria-label="Cambiar filtro ${f}">
      <circle cx="${CX}" cy="${cy}" r="${R}" class="ring-bg"/>
      <circle cx="${CX}" cy="${cy}" r="${R}" class="ring ring-${s.cls}" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}"
        transform="rotate(-90 ${CX} ${cy})"/>
      <circle cx="${CX}" cy="${cy}" r="${r}" class="dev-cap-rim"/>
      <circle cx="${CX}" cy="${cy}" r="${r - 6}" class="dev-cap"/>
      <path d="${paddle}" class="dev-bar"/>
      <path d="M${CX},${top + r * 0.12} l${r * 0.07},${r * 0.12} h${-r * 0.14} z" class="dev-ink"/>
      <text x="${CX}" y="${top + r * 0.30 + fs}" class="dev-lbl" text-anchor="middle" style="font-size:${fs}px">${f}</text>
      <circle cx="${ox}" cy="${oy}" r="3.4" class="dev-mark-off"/>
      <circle cx="${nx}" cy="${ny}" r="3.4" class="dev-mark-on"/>
      <path d="M${a0[0]},${a0[1]} A${m},${m} 0 0 1 ${a1[0]},${a1[1]}" class="dev-mark-arc" marker-end="url(#g3ah)"/>
    </g>`;
  };
  const led = (x, f) => `
    <circle cx="${x}" cy="66" r="11" class="dev-chip led-ring-${st[f].led}"/>
    <text x="${x}" y="69.5" class="dev-sm" text-anchor="middle">${f}</text>`;

  return `<svg class="front" viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label="Frontal del Waterdrop G3P600">
    <defs>
      <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="st-b1"/><stop offset=".55" class="st-b2"/><stop offset="1" class="st-b3"/></linearGradient>
      <radialGradient id="cap" cx=".35" cy=".3" r=".9"><stop offset="0" class="st-c1"/><stop offset="1" class="st-c2"/></radialGradient>
      <filter id="shadow" x="-.3" y="-.2" width="1.6" height="1.5"><feGaussianBlur stdDeviation="14"/></filter>
      <marker id="g3ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" class="dev-mark-head"/></marker>
    </defs>
    <ellipse cx="160" cy="622" rx="110" ry="11" class="dev-shadow" filter="url(#shadow)"/>
    <rect x="44" y="20" width="232" height="600" rx="56" class="dev-body"/>
    <rect x="44" y="20" width="232" height="600" rx="56" class="dev-edge"/>
    ${led(124, 'CB')}${led(160, 'CF')}${led(196, 'RO')}
    <text x="100" y="117" class="dev-sm" text-anchor="middle">TDS OUT</text>
    <text x="186" y="125" class="dev-tds" text-anchor="middle">${tds}</text>
    ${cap(226, 44, 'CB')}
    ${cap(358, 56, 'CF')}
    ${cap(520, 74, 'RO')}
  </svg>`;
}

/* Clases nuevas que necesita (se añaden al CSS de la app; el equipo es claro en ambos temas):
   .dev-mark-off{fill:none;stroke:#4b535e;stroke-width:1.8}
   .dev-mark-on{fill:#4b535e}
   .dev-mark-arc{fill:none;stroke:#4b535e;stroke-width:1.8}
   .dev-mark-head{fill:#4b535e}
   .dev-chip{fill:none;stroke-width:1.6}
   .led-ring-blue{stroke:#4fb3ff}
   .led-ring-yellow{stroke:#f5c542}
   .led-ring-red{stroke:#ff5a5a}
   .dev-tds{font:600 34px/1 ui-monospace,monospace;fill:#4b535e;letter-spacing:2px} */
if (typeof module !== 'undefined') module.exports = { frontG3P600 };
