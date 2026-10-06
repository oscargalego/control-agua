/* Frizzlife PD600-TAM3 (y PD800-TAM4) — dibujos propios, de línea, sin logotipos.
   Datos de la ficha fichas/frizzlife-pd600.md:
   - frontal negro con dos tapas redondas en columna: ASR211 (CP) arriba, ASR212 (RO) abajo
     (esquema «Front/Back» del manual; la foto oficial muestra a una persona girando la de arriba);
   - pantalla «OUT · TDS PPM», tres barras CP · RO · encendido, botones Reset (izq.) y Flush (dcha.);
   - vaso exterior TAM3 al lado del equipo, con flechas SUPPLY / FILTERED en el cabezal.
   Reset del manual: mantener Reset 3 s (pitido) → pulsar para elegir filtro → mantener 3 s
   (pitido, el indicador vuelve a azul). Usa las piezas comunes de illus-base.js (ILL.H). */
'use strict';

const FRZ = (() => {
  const { wrap, arc, badge, faucet, cart, fingerAt, beep, check, clock, drop } = ILL.H;
  const NAME = { S1: 'CP', RO: 'RO', TAM: 'TAM' };   // lo que pone en el equipo
  const LED = { blue: '#4fb3ff', red: '#ff5a5a', off: '#5b6470' };

  // ---------- piezas ----------
  // Tapa redonda vista de frente: aro, tapa y asa recta en diagonal (giro sin herramientas)
  function cap(cx, cy, r, label, angle = 0, { hl = false } = {}) {
    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${r + 8}" class="${hl ? 's-acc' : 's-line'} f-none" stroke-width="${hl ? 2.5 : 1.5}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" class="f-pl s-line" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 10}" class="f-none s-line" stroke-width="1" stroke-dasharray="2 5"/>
      <g transform="rotate(${angle} ${cx} ${cy})">
        <rect x="${cx - r * 0.18}" y="${cy - r * 0.78}" width="${r * 0.36}" height="${r * 1.56}" rx="${r * 0.12}" class="f-bar"/>
        <text x="${cx}" y="${cy - r * 0.38}" class="t-lbl" style="font-size:${Math.round(r * 0.24)}px" text-anchor="middle">${label}</text>
      </g>
    </g>`;
  }
  // Panel superior ampliado: pantalla, barras CP · RO · ⚡ y botones Reset / Flush
  function panel({ state = {}, finger = null, hold = false, tap = false, tds = '06', tdsBlink = false } = {}) {
    const barEl = (x, k, t) => {
      const st = state[k] || 'blue', col = LED[st === 'blink' ? 'blue' : st];
      return `<rect x="${x - 5}" y="118" width="10" height="30" rx="5" style="fill:${col}" class="${st === 'blink' ? 'anim-blink' : ''}"/>
        <text x="${x}" y="164" class="t-sm" text-anchor="middle">${t}</text>`;
    };
    const btn = (x, t, side) => `<circle cx="${x}" cy="196" r="15" class="f-pl s-line" stroke-width="1.6"/>
      <text x="${x + side * 22}" y="200" class="t-sm" text-anchor="${side < 0 ? 'end' : 'start'}">${t}</text>`;
    const fx = { Reset: 110, Flush: 210 }[finger];
    return `<g>
      <path d="M40,240 L40,58 Q40,30 68,30 L252,30 Q280,30 280,58 L280,240" class="f-pl s-line" stroke-width="1.6"/>
      <rect x="112" y="44" width="96" height="58" rx="8" class="f-bar s-line" stroke-width="1"/>
      <text x="124" y="60" class="t-sm" style="font-size:9px">OUT</text>
      <text x="160" y="84" class="t-lbl ${tdsBlink ? 'anim-blink' : ''}" text-anchor="middle"
        style="font:600 28px ui-monospace,monospace;letter-spacing:2px">${tds}</text>
      <text x="200" y="97" class="t-sm" text-anchor="end" style="font-size:8px">TDS PPM</text>
      ${barEl(130, 'S1', 'CP')}${barEl(160, 'RO', 'RO')}${barEl(190, 'pwr', '⚡')}
      ${btn(110, 'Reset', -1)}${btn(210, 'Flush', 1)}
      ${fx ? fingerAt(fx, 196, { hold, tap }) : ''}
    </g>`;
  }
  // Vaso TAM3: cabezal con flechas de entrada/salida y vaso roscado. open: vaso bajado
  function tamHousing(x, y, { open = false, cart: withCart = true, hl = false } = {}) {
    const dy = open ? 36 : 0;
    return `<g>
      <rect x="${x - 34}" y="${y}" width="68" height="22" rx="5" class="f-bar s-line" stroke-width="1.2"/>
      <path d="M${x - 60},${y + 11} h22" class="s-line" stroke-width="5" stroke-linecap="round"/>
      <path d="M${x + 38},${y + 11} h22" class="s-line" stroke-width="5" stroke-linecap="round"/>
      <g transform="translate(0 ${dy})">
        <path d="M${x - 26},${y + 22} h52 v120 q0,12 -12,12 h-28 q-12,0 -12,-12 z" class="f-pl ${hl ? 's-acc' : 's-line'}" stroke-width="${hl ? 2.4 : 1.5}"/>
        ${withCart ? `<rect x="${x - 14}" y="${y + 30}" width="28" height="110" rx="6" class="f-cloth s-line" stroke-width="1"/>
          <text x="${x}" y="${y + 90}" class="t-sm" text-anchor="middle">FZ-4</text>` : ''}
      </g>
    </g>`;
  }
  function wrench(x, y) {
    return `<g><circle cx="${x}" cy="${y}" r="30" class="f-none s-ink" stroke-width="9"/>
      <rect x="${x + 26}" y="${y - 7}" width="64" height="14" rx="7" class="f-bar s-line" stroke-width="1.2"/></g>`;
  }
  function valve(x, y, open) {
    return `<g transform="translate(${x} ${y}) scale(2.2)">
      <circle r="9" class="f-pl s-line" stroke-width="1.4"/>
      <rect x="-3" y="-24" width="6" height="22" rx="3" class="${open ? 'f-ok' : 'f-bad'}" transform="rotate(${open ? 90 : 0})"/></g>`;
  }
  function plug(x, y, { out = true } = {}) {
    return `<g>
      <rect x="${x}" y="${y}" width="56" height="70" rx="10" class="f-pl s-line" stroke-width="1.5"/>
      <circle cx="${x + 20}" cy="${y + 35}" r="4" class="f-ink"/><circle cx="${x + 36}" cy="${y + 35}" r="4" class="f-ink"/>
      <g transform="translate(${out ? -46 : 0} 0)">
        <rect x="${x - 34}" y="${y + 20}" width="30" height="30" rx="6" class="f-bar s-line" stroke-width="1.2"/>
        <path d="M${x - 4},${y + 30} h10 M${x - 4},${y + 40} h10" class="s-ink" stroke-width="3"/>
        <path d="M${x - 34},${y + 35} q-24,0 -24,60" class="s-line f-none" stroke-width="4" stroke-linecap="round"/>
      </g>
    </g>`;
  }

  // ---------- escenas ----------
  const S = {
    prep(f) {
      const piece = f === 'TAM'
        ? `<rect x="138" y="44" width="44" height="96" rx="8" class="f-cloth s-line" stroke-width="1.2"/>
           <text x="160" y="98" class="t-sm" text-anchor="middle">FZ-4</text>${wrench(250, 92)}`
        : cart(100, 60, NAME[f], { w: 110 });
      return wrap(`
        <text x="160" y="26" class="t-head" text-anchor="middle">${f === 'TAM' ? 'Cartucho FZ-4 nuevo · llave del vaso' : `Cartucho ${NAME[f]} nuevo · sin herramientas`}</text>
        ${piece}
        <rect x="24" y="160" width="100" height="50" rx="8" class="f-cloth s-line" stroke-width="1.4"/>
        <path d="M34,174 h80 M34,188 h80" class="s-line" stroke-width="1" opacity=".5"/>
        <text x="74" y="228" class="t-sm" text-anchor="middle">trapo</text>
        <path d="M190,160 h64 l-7,50 h-50z" class="f-pl s-line" stroke-width="1.5"/>
        <text x="222" y="228" class="t-sm" text-anchor="middle">recipiente</text>`);
    },
    unplug() {
      return wrap(`
        ${plug(240, 70)}
        <g transform="translate(212 66)"><circle r="12" class="f-bad"/>
          <path d="M-5,-5 L5,5 M5,-5 L-5,5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></g>
        ${faucet(30, 96, { open: true })}
        ${badge(160, 26, 'desenchufa y abre el grifo')}`);
    },
    closeInlet() {
      return wrap(`
        <path d="M20,120 h110 M190,120 h110" class="s-line" stroke-width="8" stroke-linecap="round"/>
        ${valve(160, 120, false)}
        ${badge(160, 214, 'cierra la llave de entrada del equipo')}`);
    },
    openInlet() {
      return wrap(`
        <path d="M16,100 h60 M124,100 h44" class="s-water" stroke-width="8" stroke-linecap="round"/>
        ${valve(100, 100, true)}
        ${plug(230, 50, { out: false })}
        ${clock(64, 196, '30 s')}
        ${badge(196, 196, 'purga automática al encender')}`);
    },
    twistOut(f) {
      return wrap(`
        <g class="anim-unturn">${cap(160, 120, 74, NAME[f], -30, { hl: true })}</g>
        ${arc(160, 120, 100, 20, -50)}
        ${badge(160, 224, 'antihorario ↺ y sacar · cae algo de agua')}`);
    },
    unwrap(f) {
      return wrap(`
        ${cart(90, 92, NAME[f], { cap: false, wrap: true, w: 120 })}
        ${badge(160, 210, 'quita el film y los tapones')}`);
    },
    twistIn(f) {
      return wrap(`
        <g class="anim-turn">${cap(160, 120, 74, NAME[f], -30, { hl: true })}</g>
        ${arc(160, 120, 100, -50, 20)}
        ${badge(160, 224, 'horario ↻ hasta que quede firme')}`);
    },
    leak(f) {
      const left = f === 'TAM' ? tamHousing(110, 10) : cap(126, 116, 70, NAME[f], -30);
      return wrap(`
        ${left}
        <g transform="translate(244 130)"><circle r="34" class="f-none s-ink" stroke-width="4"/>
          <line x1="24" y1="24" x2="52" y2="52" class="s-ink" stroke-width="7" stroke-linecap="round"/>
          ${drop(0, 2, 1.6, 'f-water')}
          <path d="M-20,-20 L20,20" class="s-bad" stroke-width="4" stroke-linecap="round"/></g>
        ${badge(160, 222, f === 'TAM' ? 'sin goteo en el vaso ni el cabezal' : 'sin goteo en la tapa ni debajo')}`);
    },
    // Reset en tres pulsaciones (manual): 1) mantener 3 s → pitido
    resetHold() {
      return wrap(`${panel({ state: { S1: 'blue', RO: 'blue' }, finger: 'Reset', hold: true })}
        ${beep(138, 180)}
        ${badge(160, 20, 'mantén Reset 3 s → pitido')}`);
    },
    // 2) pulsar Reset hasta que parpadee el filtro cambiado
    resetSelect(f) {
      const state = { S1: 'blue', RO: 'blue' }; state[f] = 'blink';
      return wrap(`${panel({ state, finger: 'Reset', tap: true })}
        ${badge(160, 20, `pulsa Reset hasta que parpadee ${NAME[f]}`)}`);
    },
    // 3) mantener 3 s → pitido y el indicador vuelve a azul
    resetDone(f) {
      return wrap(`${panel({ state: { S1: 'blue', RO: 'blue' }, finger: 'Reset', hold: true })}
        ${beep(138, 180)}
        ${badge(160, 20, `mantén 3 s · ${NAME[f]} vuelve a azul`)}`);
    },
    flush(min) {
      return wrap(`
        ${faucet(70, 92, { open: true })}
        <path d="M110,186 h72 l-6,32 h-60z" class="f-pl s-line" stroke-width="1.4"/>
        ${clock(250, 90, min + ' min')}
        ${badge(240, 150, 'no se bebe')}`);
    },
    tamOpen() {
      return wrap(`
        ${tamHousing(80, 30, { open: true, hl: true })}
        <path d="M110,220 a30,12 0 1 1 -14,-10" class="s-acc f-none" stroke-width="3" marker-end="url(#ah)"/>
        ${wrench(220, 110)}
        ${badge(208, 200, 'antihorario, con la llave')}`);
    },
    tamSwap() {
      return wrap(`
        ${tamHousing(90, 30, { open: true, cart: false })}
        <rect x="186" y="70" width="28" height="110" rx="6" class="f-cloth s-acc" stroke-width="2"/>
        <text x="200" y="130" class="t-sm" text-anchor="middle">FZ-4</text>
        <path d="M240,120 h-18" class="s-acc" stroke-width="3" marker-end="url(#ah)"/>
        <path d="M150,96 h28" class="s-acc" stroke-width="3" stroke-dasharray="4 4"/>
        ${badge(160, 222, 'saca el usado y mete el nuevo')}`);
    },
    tamClose() {
      return wrap(`
        ${tamHousing(80, 30, { hl: true })}
        <path d="M50,212 a30,12 0 1 0 14,-10" class="s-acc f-none" stroke-width="3" marker-end="url(#ah)"/>
        ${badge(208, 200, 'horario · a mano + llave')}`);
    },
    done() { return wrap(`${cap(160, 112, 72, '', -30)}${check(160, 112, 1.6)}${badge(160, 222, 'registrar el cambio')}`); },
  };

  /* ---------- portada: frontal negro, dos tapas y vaso TAM3 al lado ---------- */
  function front(st, tds = '06') {
    // st: {S1,RO,TAM: {cls, frac, led}}  led: blue | red
    const CX = 134;
    const ring = (cy, R, s) => {
      const C = 2 * Math.PI * R, len = s.cls === 'bad' ? C : Math.max(0.001, Math.min(1, s.frac)) * C;
      return `<circle cx="${CX}" cy="${cy}" r="${R}" class="ring-bg"/>
        <circle cx="${CX}" cy="${cy}" r="${R}" class="ring ring-${s.cls}" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}"
          transform="rotate(-90 ${CX} ${cy})"/>`;
    };
    const tap = (cy, f) => `<g class="hot" data-f="${f}" tabindex="0" role="button" aria-label="Cambiar filtro ${NAME[f]}">
        ${ring(cy, 76, st[f])}
        <circle cx="${CX}" cy="${cy}" r="68" style="fill:#3a4048;stroke:#59616c;stroke-width:2"/>
        <circle cx="${CX}" cy="${cy}" r="56" style="fill:#2f343b"/>
        <rect x="${CX - 12}" y="${cy - 52}" width="24" height="104" rx="8" transform="rotate(-30 ${CX} ${cy})" style="fill:#4a515b"/>
        <text x="${CX}" y="${cy + 6}" text-anchor="middle" style="font:700 18px system-ui;fill:#e8edf2">${NAME[f]}</text>
      </g>`;
    const bar = (x, f, t) => {
      const col = f ? LED[st[f].led] || LED.blue : LED.blue;
      return `<rect x="${x - 3}" y="124" width="6" height="22" rx="3" style="fill:${col}"/>
        <text x="${x}" y="160" text-anchor="middle" style="font:600 9px system-ui;fill:#aab3bf">${t}</text>`;
    };
    const s = st.TAM, C = 2 * Math.PI;
    return `<svg class="front" viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frontal del Frizzlife PD600">
      <defs><filter id="shadow" x="-.3" y="-.2" width="1.6" height="1.5"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <ellipse cx="${CX}" cy="618" rx="100" ry="10" class="dev-shadow" filter="url(#shadow)"/>
      <rect x="30" y="24" width="208" height="590" rx="30" style="fill:#22262c;stroke:#3b424b;stroke-width:2"/>
      <rect x="84" y="50" width="100" height="58" rx="8" style="fill:#14171b;stroke:#3b424b"/>
      <text x="94" y="66" style="font:600 8px system-ui;fill:#7f8a97">OUT</text>
      <text x="${CX}" y="90" text-anchor="middle" style="font:600 28px ui-monospace,monospace;fill:#7fd0ff;letter-spacing:2px">${tds}</text>
      <text x="178" y="103" text-anchor="end" style="font:600 7px system-ui;fill:#7f8a97">TDS PPM</text>
      ${bar(110, 'S1', 'CP')}${bar(134, 'RO', 'RO')}${bar(158, null, '⚡')}
      <circle cx="96" cy="190" r="12" style="fill:#3a4048;stroke:#59616c"/><text x="96" y="216" text-anchor="middle" style="font:600 9px system-ui;fill:#aab3bf">Reset</text>
      <circle cx="172" cy="190" r="12" style="fill:#3a4048;stroke:#59616c"/><text x="172" y="216" text-anchor="middle" style="font:600 9px system-ui;fill:#aab3bf">Flush</text>
      ${tap(320, 'S1')}
      ${tap(510, 'RO')}
      <g class="hot" data-f="TAM" tabindex="0" role="button" aria-label="Cambiar filtro alcalino">
        <rect x="252" y="300" width="56" height="22" rx="5" class="dev-bar"/>
        <path d="M262,296 v-10 M298,286 v10" style="stroke:#9aa7b8;stroke-width:4;stroke-linecap:round"/>
        <path d="M258,322 h44 v168 q0,12 -12,12 h-20 q-12,0 -12,-12 z" class="dev-cap-rim"/>
        <text x="280" y="420" class="dev-lbl" text-anchor="middle" transform="rotate(-90 280 416)">TAM</text>
        <rect x="258" y="514" width="44" height="6" rx="3" class="ring-bg"/>
        <rect x="258" y="514" width="${Math.max(4, 44 * (s.cls === 'bad' ? 1 : Math.min(1, s.frac)))}" height="6" rx="3"
          style="fill:${({ ok: '#4fb3ff', warn: '#b07cff', bad: '#ff5a5a' })[s.cls] || '#4fb3ff'}"/>
      </g>
    </svg>`;
  }

  return { S, front, panel };
})();
if (typeof module !== 'undefined') module.exports = { FRZ };
