/* Escenas de cambio de filtros del Waterdrop G3P600 — dibujos propios.
   Reutiliza las piezas del G2 (illus-base.js → ILL.H) y añade lo propio del G3:
   tapa con pala y triángulo, tres cartuchos de tamaños distintos, reset pulsando el
   indicador de cada filtro y pantalla de TDS para saber cuándo termina la purga.
   Datos: fichas/waterdrop-g3p600.md */
'use strict';

const G3 = (() => {
  const { wrap, dial, marks, arc, badge, faucet, cart, fingerAt, beep, check, clock, drop } = ILL.H;
  const P = { paddle: true };
  // longitud relativa del cartucho visto de lado (orientativa: la foto muestra RO > CF > CB)
  const LEN = { CB: 74, CF: 96, RO: 150 };

  // Parte superior del frontal: indicadores CB · CF · RO y pantalla TDS OUT
  function panel({ active = null, state = {}, finger = false, hold = false, tds = '006', tdsBlink = false } = {}) {
    const chip = (x, f) => {
      const st = state[f] || 'blue', col = { blue: '#4fb3ff', red: '#ff5a5a', yellow: '#f5c542', blink: '#4fb3ff' }[st];
      return `<circle cx="${x}" cy="118" r="17" class="f-pl" stroke-width="2.4" style="stroke:${col}"/>
        ${st === 'blink' ? `<circle cx="${x}" cy="118" r="17" class="f-none anim-blink" stroke-width="2.4" style="stroke:#4fb3ff"/>` : ''}
        <text x="${x}" y="122" class="t-sm" text-anchor="middle" style="font-size:11px">${f}</text>`;
    };
    return `<g>
      <path d="M44,236 L44,96 Q44,56 84,56 L236,56 Q276,56 276,96 L276,236" class="f-pl s-line" stroke-width="1.6"/>
      ${chip(110, 'CB')}${chip(160, 'CF')}${chip(210, 'RO')}
      <text x="98" y="168" class="t-sm" text-anchor="middle">TDS OUT</text>
      <text x="98" y="204" class="t-lbl ${tdsBlink ? 'anim-blink' : ''}" text-anchor="middle"
        style="font:600 30px ui-monospace,monospace;letter-spacing:2px">${tds}</text>
      ${finger ? fingerAt({ CB: 110, CF: 160, RO: 210 }[active], 118, { hold }) : ''}
    </g>`;
  }

  const S = {
    prep(f) {
      return wrap(`
        <rect x="18" y="150" width="90" height="58" rx="8" class="f-cloth s-line" stroke-width="1.4"/>
        <path d="M28,166 h70 M28,180 h70 M28,194 h70" class="s-line" stroke-width="1" opacity=".5"/>
        <text x="63" y="226" class="t-sm" text-anchor="middle">trapo</text>
        <path d="M128,140 h60 l-7,68 h-46z" class="f-pl s-line" stroke-width="1.5"/>
        <path d="M126,140 q32,-26 64,0" class="s-line f-none" stroke-width="1.6"/>
        <text x="158" y="226" class="t-sm" text-anchor="middle">cubo</text>
        <path d="M212,150 q4,-14 18,-12 q8,-12 22,0 q14,-2 18,12 l-6,58 h-46z" class="f-film s-line" stroke-width="1.4"/>
        <text x="241" y="226" class="t-sm" text-anchor="middle">bolsa</text>
        ${cart(160 - LEN[f] / 2 - 10, 46, f, { w: LEN[f] })}
        <text x="160" y="28" class="t-head" text-anchor="middle">Sin herramientas · cartucho ${f} nuevo</text>
      `);
    },
    closeTap() { return ILL.S.closeTap(); },
    relief() {
      // botón central de alivio de presión del CF (hoja WD-G3-CF); su posición exacta está por confirmar
      return wrap(`
        ${dial(160, 118, 74, 'CF', 0, P)}
        ${fingerAt(160, 118, { hold: true })}
        ${badge(160, 222, 'pulsar el botón central: alivia la presión')}
      `);
    },
    twistOut(f) {
      return wrap(`
        <g class="anim-unturn">${dial(160, 120, 74, f, 0, { ...P, hl: true })}</g>
        ${marks(160, 120, 74)}
        ${arc(160, 120, 102, -14, -66)}
        ${badge(160, 224, '¼ de vuelta antihorario ↺ y sacar')}
      `);
    },
    pullOut(f) {
      const w = LEN[f], x = 300 - w - 20;
      return wrap(`
        <rect x="14" y="46" width="70" height="150" rx="22" class="f-pl s-line" stroke-width="1.6"/>
        <rect x="74" y="100" width="12" height="40" rx="3" class="f-bar"/>
        ${cart(x, 92, f, { cap: false, rot: 180, w })}
        <line x1="104" y1="70" x2="${x}" y2="70" class="s-acc" stroke-width="3" marker-end="url(#ah)" stroke-linecap="round"/>
        <g class="anim-drip">${drop(x + 8, 168, 1.1)}${drop(x + 20, 186, .8)}</g>
        <rect x="120" y="200" width="190" height="16" rx="5" class="f-cloth s-line" stroke-width="1.2"/>
        ${badge(160, 30, 'sácalo recto, sobre el trapo')}
      `);
    },
    unwrap(f) {
      const w = LEN[f], x = 150 - w / 2;
      return wrap(`
        ${cart(x, 92, f, { cap: false, wrap: true, w })}
        <g transform="translate(${x + w + 26} 106)">
          <rect width="10" height="30" rx="3" class="f-acc-soft s-acc" stroke-width="1.2"/>
          <line x1="-12" y1="15" x2="26" y2="15" class="s-acc" stroke-width="2.5" marker-end="url(#ah)" stroke-linecap="round"/>
        </g>
        ${badge(160, 210, 'quitar film y tapón protector')}
      `);
    },
    insert(f) {
      return wrap(`
        ${dial(160, 122, 72, f, -90, { ...P, hl: true })}
        ${marks(160, 122, 72)}
        <line x1="40" y1="122" x2="70" y2="122" class="s-acc" stroke-width="2.5" stroke-dasharray="4 4"/>
        ${badge(160, 224, 'flecha del cartucho → círculo vacío')}
      `);
    },
    twistIn(f) {
      return wrap(`
        <g class="anim-turn">${dial(160, 122, 72, f, -90, P)}</g>
        ${marks(160, 122, 72)}
        ${arc(160, 122, 100, -66, -14)}
        ${badge(160, 224, '¼ de vuelta horario ↻ · clic')}
      `);
    },
    leak(f) {
      return wrap(`
        ${dial(130, 116, 70, f, 0, P)}
        <g transform="translate(232 128)"><circle r="34" class="f-none s-ink" stroke-width="4"/>
          <line x1="24" y1="24" x2="52" y2="52" class="s-ink" stroke-width="7" stroke-linecap="round"/>
          ${drop(0, 2, 1.6, 'f-water')}
          <path d="M-20,-20 L20,20" class="s-bad" stroke-width="4" stroke-linecap="round"/></g>
        ${badge(160, 222, 'sin goteo en la tapa ni debajo')}
      `);
    },
    // reset: se mantiene pulsado el indicador del propio cartucho (sin botón aparte ni selección)
    reset(f, secs) {
      const state = { CB: 'blue', CF: 'blue', RO: 'blue' }; state[f] = 'red';
      return wrap(`${panel({ active: f, state, finger: true, hold: true })}
        ${beep({ CB: 110, CF: 160, RO: 210 }[f] + 30, 92)}
        ${badge(160, 30, secs ? `mantener ${f} ${secs} s → pitido · azul fijo` : `mantener ${f} ≈ 7 s, hasta el pitido`)}`);
    },
    // purga: el CF se purga solo (sin abrir el grifo); el RO con el grifo abierto. Termina cuando aparece el TDS.
    flush(min, f) {
      if (f === 'CB') return wrap(`
        ${panel({ tds: '– – –', tdsBlink: true })}
        ${badge(160, 222, 'hasta que vuelva a salir el TDS')}`);
      if (f === 'CF') return wrap(`
        ${panel({ tds: '– – –', tdsBlink: true })}
        ${clock(60, 40, min + ' min')}
        ${badge(160, 222, 'sin abrir el grifo · hasta que salga el TDS')}`);
      return wrap(`
        ${faucet(64, 96, { open: true })}
        <path d="M104,190 h72 l-6,30 h-60z" class="f-pl s-line" stroke-width="1.4"/>
        <g transform="translate(170 40) scale(.5)">${panel({ tds: '– – –', tdsBlink: true })}</g>
        ${badge(246, 214, min + ' min · no se bebe')}`);
    },
    done() { return wrap(`${dial(160, 116, 74, '', 0, P)}${check(160, 116, 1.6)}${badge(160, 222, 'registrar el cambio')}`); },
  };
  return { S, panel };
})();
if (typeof module !== 'undefined') module.exports = { G3 };
