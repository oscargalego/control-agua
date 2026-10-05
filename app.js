'use strict';
/* Control Agua — PWA de seguimiento del Waterdrop G2 */

const VERSION = '1.1.0';
const KEY = 'control-agua.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------------- datos ---------------- */
const DEFAULT = () => ({
  v: 1,
  filters: {
    CF: { installed: '2026-10-04', approx: false, lifeMonths: 12 },
    MRO: { installed: '2025-10-05', approx: true, lifeMonths: 24 },
  },
  history: [
    { id: uid(), f: 'CF', date: '2026-10-04', approx: false, note: 'Fecha inicial' },
    { id: uid(), f: 'MRO', date: '2025-10-05', approx: true, note: 'Fecha inicial aproximada (hace ≈ 1 año)' },
  ],
  measures: [],
  settings: { warnDays: 30, minRejection: 80, maxRo: 50, theme: 'dark', sysNotify: false },
});

let DB;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    DB = raw ? JSON.parse(raw) : DEFAULT();
  } catch { DB = DEFAULT(); }
  const d = DEFAULT();
  DB.settings = { ...d.settings, ...(DB.settings || {}) };
  DB.filters = { CF: { ...d.filters.CF, ...(DB.filters?.CF || {}) }, MRO: { ...d.filters.MRO, ...(DB.filters?.MRO || {}) } };
  DB.history ||= []; DB.measures ||= [];
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(DB)); }
  catch { toast('No se ha podido guardar en el móvil'); }
  syncSW();
}

/* ---------------- fechas ---------------- */
const pad = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const toISO = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
function addMonths(iso, n) {
  const d = parseISO(iso), day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return toISO(d);
}
const addDays = (iso, n) => { const d = parseISO(iso); d.setUTCDate(d.getUTCDate() + n); return toISO(d); };
const diffDays = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);
const fmt = (iso, o = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  parseISO(iso).toLocaleDateString('es-ES', { ...o, timeZone: 'UTC' });
const fmtTs = ts => new Date(ts).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const localDT = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function status(f) {
  const c = DB.filters[f];
  const due = addMonths(c.installed, c.lifeMonths);
  const total = diffDays(c.installed, due);
  const left = diffDays(todayISO(), due);
  const warnAt = addDays(due, -DB.settings.warnDays);
  let cls = 'ok', label = 'En buen estado', led = 'blue';
  if (left <= 0) { cls = 'bad'; label = left === 0 ? 'Vence hoy' : 'Caducado'; led = 'red'; }
  else if (left <= DB.settings.warnDays) { cls = 'warn'; label = 'Pedir recambio'; led = 'purple'; }
  return { ...c, f, due, left, total, warnAt, frac: Math.max(0, left) / total, cls, label, led };
}
const leftText = s => s.left > 0 ? `${s.left} ${s.left === 1 ? 'día' : 'días'}` : s.left === 0 ? 'hoy' : `hace ${-s.left} d`;

/* ---------------- mediciones ---------------- */
function rejection(m) { return m.tap > 0 && m.ro >= 0 ? (1 - m.ro / m.tap) * 100 : null; }
function measureAlerts(m) {
  const a = [], r = rejection(m), S = DB.settings;
  if (r != null && S.minRejection && r < S.minRejection) a.push(`rechazo < ${S.minRejection} %`);
  if (S.maxRo && m.ro > S.maxRo) a.push(`ósmosis > ${S.maxRo} ppm`);
  return a;
}

/* ---------------- tema ---------------- */
function applyTheme() {
  const t = DB.settings.theme;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name=theme-color]').content = dark ? '#07090d' : '#f3f5f8';
}

/* ---------------- router ---------------- */
const VIEWS = ['home', 'filtros', 'recambios', 'mediciones', 'luces', 'ajustes'];
function route() {
  const h = location.hash.slice(1);
  const proc = h.match(/^proc-(CF|MRO|BOTH)$/);
  if (proc) { openProc(proc[1]); return; }
  closeProc(false);
  const v = VIEWS.includes(h) ? h : 'home';
  $$('.view').forEach(e => e.hidden = e.id !== 'v-' + v);
  $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.go === v));
  render[v]?.();
  window.scrollTo(0, 0);
}
const go = v => { location.hash = v === 'home' ? '' : v; if (v === 'home') route(); };

/* ---------------- vistas ---------------- */
const render = {};

render.home = () => {
  const cf = status('CF'), mro = status('MRO');
  $('#front').innerHTML = ILL.front({ CF: cf, MRO: mro });
  $$('#front .hot').forEach(g => {
    const open = () => { location.hash = 'proc-' + g.dataset.f; };
    g.addEventListener('click', open);
    g.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && open());
  });
  const card = s => `<button class="mini s-${s.cls}" data-f="${s.f}">
      <span class="mini-k">${s.f}${s.approx ? ' <i title="fecha aproximada">≈</i>' : ''}</span>
      <span class="mini-v">${leftText(s)}</span>
      <span class="mini-l">${s.label}</span>
      <span class="bar"><i style="width:${(s.frac * 100).toFixed(1)}%"></i></span>
      <span class="mini-d">cambio ${fmt(s.due, { day: 'numeric', month: 'short', year: '2-digit' })}</span>
    </button>`;
  $('#home-cards').innerHTML = card(cf) + card(mro);
  $$('#home-cards .mini').forEach(b => b.onclick = () => go('filtros'));

  const al = [];
  [cf, mro].forEach(s => {
    if (s.cls === 'bad') al.push(`<div class="alert bad"><b>${s.f} ${s.left === 0 ? 'vence hoy' : 'caducado'}.</b> Cámbialo y haz el reset. <a href="#proc-${s.f}">Empezar</a></div>`);
    else if (s.cls === 'warn') al.push(`<div class="alert warn"><b>${s.f}: quedan ${leftText(s)}.</b> Buen momento para pedir el recambio. <a href="#recambios">Recambios</a></div>`);
  });
  const last = [...DB.measures].sort((a, b) => b.ts - a.ts)[0];
  if (last && measureAlerts(last).length) al.push(`<div class="alert bad"><b>Última medición fuera de umbral</b> (${measureAlerts(last).join(', ')}). <a href="#mediciones">Ver</a></div>`);
  $('#home-alerts').innerHTML = al.join('');
  $('#home-hint').textContent = 'Toca un cartucho para ver su cambio paso a paso';
};

render.filtros = () => {
  const block = f => {
    const s = status(f);
    return `<section class="card fcard s-${s.cls}">
      <header><div><span class="eyebrow">${f === 'CF' ? '1.º · prefiltro · arriba' : '2.º · membrana · abajo'}</span>
        <h2>${f} <small>WD-G2${f}</small></h2></div><span class="pill p-${s.cls}">${s.label}</span></header>
      <div class="kv">
        <div><span>Quedan</span><b>${leftText(s)}</b></div>
        <div><span>Cambio previsto</span><b>${fmt(s.due)}</b></div>
        <div><span>Instalado</span><b>${s.approx ? '≈ ' : ''}${fmt(s.installed)}</b></div>
        <div><span>Aviso</span><b>${fmt(s.warnAt)}</b></div>
      </div>
      <span class="bar big"><i style="width:${(s.frac * 100).toFixed(1)}%"></i></span>
      <p class="note">Vida: ${s.lifeMonths} meses o ${f === 'CF' ? '1.100 gal (≈ 4.160 L)' : '2.200 gal (≈ 8.330 L)'}, lo que llegue antes. La app solo cuenta el tiempo: manda la luz del equipo.</p>
      <div class="row">
        <a class="btn primary" href="#proc-${f}">Cambio paso a paso</a>
        <button class="btn" data-edit="${f}">Editar</button>
        <button class="btn icon" data-cal="${f}" aria-label="Añadir aviso al calendario" title="Aviso en Google Calendar">${ICON.cal}</button>
      </div>
    </section>`;
  };
  const hist = [...DB.history].sort((a, b) => b.date.localeCompare(a.date));
  $('#v-filtros').innerHTML = block('CF') + block('MRO') + `
    <a class="card linkcard" href="#proc-BOTH"><div><b>Cambiar los dos el mismo día</b>
      <span>CF primero, luego MRO y una única purga de 30 min</span></div>${ICON.chev}</a>
    <section class="card"><header><h3>Historial de cambios</h3></header>
      ${hist.length ? `<ul class="hist">${hist.map(h => `<li>
        <span class="tag t-${h.f}">${h.f}</span><div><b>${h.approx ? '≈ ' : ''}${fmt(h.date)}</b>${h.note ? `<small>${esc(h.note)}</small>` : ''}</div>
        <button class="x" data-delh="${h.id}" aria-label="Borrar">×</button></li>`).join('')}</ul>`
        : '<p class="empty">Sin cambios registrados.</p>'}
      <button class="btn ghost small" id="addh">+ Añadir cambio pasado</button>
    </section>`;
  $$('[data-edit]').forEach(b => b.onclick = () => editInstall(b.dataset.edit));
  $$('[data-cal]').forEach(b => b.onclick = () => calendarSheet([b.dataset.cal]));
  $$('[data-delh]').forEach(b => b.onclick = () => confirmSheet('¿Borrar este registro del historial?',
    'No cambia la fecha de instalación actual.', 'Borrar', () => {
      DB.history = DB.history.filter(h => h.id !== b.dataset.delh); save(); render.filtros();
    }));
  $('#addh').onclick = addPastChange;
};

render.recambios = () => {
  const P = DATA.PRODUCTS;
  const need = ['CF', 'MRO'].map(status).filter(s => s.cls !== 'ok');
  $('#v-recambios').innerHTML = `
    ${need.length ? `<div class="alert warn"><b>Te toca:</b> ${need.map(s => `${s.f} (${leftText(s)})`).join(' · ')}</div>` : ''}
    <h3 class="sec">Originales Waterdrop <span class="pill p-ok">recomendado</span></h3>
    ${P.originals.map(p => {
      const s = status(p.f);
      return `<a class="card prod" href="${p.url}" target="_blank" rel="noopener">
        <div class="prod-ic">${p.f}</div>
        <div class="prod-b"><b>${p.name}</b><small>${p.ref} · ASIN ${p.asin}</small><p>${p.desc}</p>
          <span class="prod-meta">${p.price} <em>a ${P.priceDate}</em> · próximo cambio ${fmt(s.due, { month: 'short', year: 'numeric' })}</span></div>
        <span class="amz">Amazon ${ICON.ext}</span></a>`;
    }).join('')}
    <div class="card info"><b>Kit de 2 años (2 × CF + 1 × MRO)</b>
      <p>Amazon.es no vende el kit del G2. Equivale a comprar dos CF y un MRO por separado (≈ 159,97 € a precios de hoy).</p></div>
    <div class="card info bad"><b>Cuidado: ${P.notThis.name}</b><p>${P.notThis.note}</p></div>

    <h3 class="sec">Compatibles de otras marcas <span class="pill p-neutral">sin opciones</span></h3>
    <div class="card info"><p>A ${P.priceDate} no hay en Amazon.es ningún cartucho compatible de otra marca para el G2 (CF o MRO). Lo que aparece al buscar son filtros de otros modelos.</p>
      <a class="btn small" href="${P.compatSearch}" target="_blank" rel="noopener">Volver a buscar en Amazon ${ICON.ext}</a>
      <p class="note">Si en el futuro aparece alguno, comprueba que indique expresamente «WD-G2» o «G2 400 GPD», no G2P600 ni G3.</p></div>
    <p class="note center">Los precios cambian: el enlace abre la ficha actual en la app de Amazon.</p>`;
};

render.mediciones = () => {
  const S = DB.settings;
  const list = [...DB.measures].sort((a, b) => b.ts - a.ts);
  $('#v-mediciones').innerHTML = `
    <button class="btn primary block" id="newm">${ICON.plus} Nueva medición</button>
    <div class="card tipcard">${ICON.info}<p>Deja correr el agua de ósmosis 1–2 min antes de medir: la primera agua tras horas parada da más ppm. Mide siempre igual.</p></div>
    <div class="thr">Alertas: rechazo &lt; <b>${S.minRejection} %</b>${S.maxRo ? ` · ósmosis &gt; <b>${S.maxRo} ppm</b>` : ''} <a href="#ajustes">cambiar</a></div>
    ${list.length ? list.map(m => {
      const r = rejection(m), a = measureAlerts(m);
      return `<button class="card meas ${a.length ? 's-bad' : ''}" data-m="${m.id}">
        <div class="meas-top"><span>${fmtTs(m.ts)}</span>${a.length ? `<span class="pill p-bad">${a.join(' · ')}</span>` : '<span class="pill p-ok">OK</span>'}</div>
        <div class="meas-n">
          <div><span>Grifo</span><b>${m.tap ?? '—'}</b><small>ppm</small></div>
          <div><span>Ósmosis</span><b>${m.ro}</b><small>ppm</small></div>
          <div class="rej"><span>Rechazo</span><b>${r == null ? '—' : r.toFixed(1)}</b><small>%</small></div>
        </div>${m.note ? `<p class="meas-note">${esc(m.note)}</p>` : ''}</button>`;
    }).join('') : '<p class="empty big">Aún no hay mediciones. Apunta la primera con el medidor TDS.</p>'}`;
  $('#newm').onclick = () => measureSheet();
  $$('[data-m]').forEach(b => b.onclick = () => measureSheet(DB.measures.find(m => m.id === b.dataset.m)));
};

render.luces = () => {
  const mini = leds => {
    const k = [['drop', '💧'], ['CF', 'CF'], ['MRO', 'MRO'], ['pwr', '⚡']];
    return `<div class="leds">${k.map(([id, t]) => `<span><i class="led2 l-${leds[id] || 'off'}"></i><small>${t}</small></span>`).join('')}</div>`;
  };
  $('#v-luces').innerHTML = `
    <h2 class="title">Luces del equipo</h2>
    <p class="lead">Fila de indicadores bajo el botón de reset: gota (producción), CF, MRO y ⚡ (alimentación).</p>
    ${DATA.LIGHTS.map(g => `<h3 class="sec">${g.group}</h3>${g.items.map(i => `
      <div class="card light">${mini(i.leds)}<div><b>${i.title}</b><p>${i.mean}</p><p class="act">${i.act}</p></div></div>`).join('')}`).join('')}
    <p class="note">Fuente: manual del usuario Waterdrop G2 (WD-G2-W), secciones «Display and Operation» y «Malfunction Display».</p>`;
};

render.ajustes = () => {
  const S = DB.settings;
  const swOK = 'serviceWorker' in navigator, ps = swOK && 'PeriodicSyncManager' in window;
  $('#v-ajustes').innerHTML = `
    <h2 class="title">Ajustes</h2>
    <section class="card form">
      <h3>Filtros</h3>
      ${['CF', 'MRO'].map(f => `<div class="frow"><label>${f} instalado</label>
        <button class="btn small" data-edit="${f}">${DB.filters[f].approx ? '≈ ' : ''}${fmt(DB.filters[f].installed)}</button></div>
        <div class="frow"><label for="life-${f}">Vida ${f} (meses)</label><input id="life-${f}" type="number" inputmode="numeric" min="1" max="60" value="${DB.filters[f].lifeMonths}"></div>`).join('')}
      <div class="frow"><label for="warn">Avisar con antelación (días)</label><input id="warn" type="number" inputmode="numeric" min="1" max="120" value="${S.warnDays}"></div>
    </section>
    <section class="card form">
      <h3>Mediciones</h3>
      <div class="frow"><label for="minr">Rechazo mínimo (%)</label><input id="minr" type="number" inputmode="decimal" min="0" max="100" value="${S.minRejection ?? ''}"></div>
      <div class="frow"><label for="maxro">Ósmosis máxima (ppm)</label><input id="maxro" type="number" inputmode="numeric" min="0" placeholder="sin límite" value="${S.maxRo ?? ''}"></div>
      <p class="note">Los valores por defecto (80 % y 50 ppm) son orientativos: ajústalos a tu agua cuando tengas unas cuantas mediciones.</p>
    </section>
    <section class="card form">
      <h3>Apariencia</h3>
      <div class="seg" role="radiogroup">${[['dark', 'Oscuro'], ['light', 'Claro'], ['auto', 'Sistema']].map(([v, t]) =>
        `<button role="radio" aria-checked="${S.theme === v}" data-theme="${v}">${t}</button>`).join('')}</div>
    </section>
    <section class="card form">
      <h3>Avisos</h3>
      <p class="note">El aviso fiable es el evento de Google Calendar (botón 📅 en cada filtro). Además, al abrir la app verás el estado en la portada.</p>
      <div class="frow"><label>Notificaciones del sistema<br><small>experimental · sin garantía de hora</small></label>
        <button class="btn small" id="sysn" ${ps ? '' : 'disabled'}>${!ps ? 'No disponible' : S.sysNotify ? 'Activadas' : 'Activar'}</button></div>
      ${ps ? '' : '<p class="note">Requiere la app instalada en Chrome para Android.</p>'}
    </section>
    <section class="card form">
      <h3>Copia de seguridad</h3>
      <p class="note">Los datos solo viven en este móvil. Si borras los datos de Chrome o cambias de móvil, se pierden: exporta de vez en cuando.</p>
      <div class="row"><button class="btn" id="exp">Exportar</button><label class="btn">Importar<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
      <button class="btn ghost danger small" id="wipe">Borrar todos los datos</button>
    </section>
    <p class="note center">Control Agua ${VERSION} · Waterdrop G2 (WD-G2-W)</p>`;

  const num = (id, fn) => $('#' + id).addEventListener('change', e => {
    const v = e.target.value === '' ? null : Number(e.target.value); fn(v); save(); toast('Guardado');
  });
  num('life-CF', v => v > 0 && (DB.filters.CF.lifeMonths = Math.round(v)));
  num('life-MRO', v => v > 0 && (DB.filters.MRO.lifeMonths = Math.round(v)));
  num('warn', v => v > 0 && (DB.settings.warnDays = Math.round(v)));
  num('minr', v => DB.settings.minRejection = v);
  num('maxro', v => DB.settings.maxRo = v);
  $$('[data-edit]').forEach(b => b.onclick = () => editInstall(b.dataset.edit, render.ajustes));
  $$('[data-theme]').forEach(b => b.onclick = () => { DB.settings.theme = b.dataset.theme; save(); applyTheme(); render.ajustes(); });
  $('#exp').onclick = exportData;
  $('#imp').onchange = importData;
  $('#wipe').onclick = () => confirmSheet('¿Borrar todos los datos?', 'Se pierden el historial y las mediciones. Exporta antes si quieres conservarlos.', 'Borrar todo', () => {
    localStorage.removeItem(KEY); load(); save(); toast('Datos borrados'); go('home');
  });
  const sn = $('#sysn');
  if (sn && ps) sn.onclick = enableSysNotify;
};

/* ---------------- hojas (modales) ---------------- */
function sheet(html, mount) {
  const el = $('#sheet');
  el.innerHTML = `<div class="sheet-bg" data-close></div><div class="sheet-p" role="dialog" aria-modal="true"><span class="grab"></span>${html}</div>`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('in'));
  const close = () => { el.classList.remove('in'); setTimeout(() => { el.hidden = true; el.innerHTML = ''; }, 220); };
  $$('[data-close]', el).forEach(b => b.onclick = close);
  mount?.(el, close);
  return close;
}
function confirmSheet(title, text, okLabel, onOk) {
  sheet(`<h3>${title}</h3><p class="lead">${text}</p>
    <div class="row end"><button class="btn" data-close>Cancelar</button><button class="btn danger" id="ok">${okLabel}</button></div>`,
    (el, close) => { $('#ok', el).onclick = () => { close(); onOk(); }; });
}

function editInstall(f, after = render.filtros) {
  const c = DB.filters[f];
  sheet(`<h3>Fecha de instalación del ${f}</h3>
    <p class="lead">Sirve para calcular la vida restante. No añade nada al historial.</p>
    <label class="field"><span>Fecha</span><input type="date" id="d" value="${c.installed}" max="${todayISO()}"></label>
    <label class="check"><input type="checkbox" id="ap" ${c.approx ? 'checked' : ''}> Fecha aproximada</label>
    <div class="row end"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ok">Guardar</button></div>`,
    (el, close) => $('#ok', el).onclick = () => {
      const v = $('#d', el).value; if (!v) return;
      c.installed = v; c.approx = $('#ap', el).checked; save(); close(); after(); toast('Fecha actualizada');
    });
}

function addPastChange() {
  sheet(`<h3>Añadir cambio pasado</h3>
    <div class="seg" id="ff"><button aria-checked="true" data-v="CF">CF</button><button aria-checked="false" data-v="MRO">MRO</button></div>
    <label class="field"><span>Fecha</span><input type="date" id="d" value="${todayISO()}" max="${todayISO()}"></label>
    <label class="check"><input type="checkbox" id="ap"> Fecha aproximada</label>
    <label class="field"><span>Nota</span><input type="text" id="n" maxlength="120" placeholder="opcional"></label>
    <label class="check"><input type="checkbox" id="setinst" checked> Usar como fecha de instalación actual si es la más reciente</label>
    <div class="row end"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ok">Añadir</button></div>`,
    (el, close) => {
      let f = 'CF';
      $$('#ff button', el).forEach(b => b.onclick = () => { f = b.dataset.v; $$('#ff button', el).forEach(x => x.setAttribute('aria-checked', x === b)); });
      $('#ok', el).onclick = () => {
        const date = $('#d', el).value; if (!date) return;
        const approx = $('#ap', el).checked;
        DB.history.push({ id: uid(), f, date, approx, note: $('#n', el).value.trim() });
        if ($('#setinst', el).checked && date >= DB.filters[f].installed) Object.assign(DB.filters[f], { installed: date, approx });
        save(); close(); render.filtros(); toast('Añadido');
      };
    });
}

function measureSheet(m) {
  const isNew = !m;
  const ts = m ? localDT(new Date(m.ts)) : localDT();
  sheet(`<h3>${isNew ? 'Nueva medición' : 'Editar medición'}</h3>
    <label class="field"><span>Fecha y hora</span><input type="datetime-local" id="ts" value="${ts}"></label>
    <div class="two">
      <label class="field"><span>Grifo (ppm)</span><input type="number" inputmode="numeric" min="0" id="tap" value="${m?.tap ?? ''}" placeholder="p. ej. 420"></label>
      <label class="field"><span>Ósmosis (ppm)</span><input type="number" inputmode="numeric" min="0" id="ro" value="${m?.ro ?? ''}" placeholder="p. ej. 18"></label>
    </div>
    <div class="live" id="live">Rechazo: —</div>
    <label class="field"><span>Nota</span><input type="text" id="note" maxlength="160" value="${esc(m?.note ?? '')}" placeholder="opcional"></label>
    <div class="row end">${isNew ? '' : '<button class="btn ghost danger" id="del">Borrar</button>'}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="ok">Guardar</button></div>`,
    (el, close) => {
      const upd = () => {
        const t = +$('#tap', el).value, r = $('#ro', el).value;
        const x = t > 0 && r !== '' ? (1 - +r / t) * 100 : null;
        $('#live', el).innerHTML = `Rechazo: <b>${x == null ? '—' : x.toFixed(1) + ' %'}</b>`;
      };
      $('#tap', el).oninput = $('#ro', el).oninput = upd; upd();
      if (isNew) setTimeout(() => $('#tap', el).focus(), 250);
      $('#ok', el).onclick = () => {
        const ro = $('#ro', el).value, tap = $('#tap', el).value, t = $('#ts', el).value;
        if (ro === '') { toast('Falta el valor de ósmosis'); return; }
        const rec = { id: m?.id || uid(), ts: t ? new Date(t).getTime() : Date.now(),
          tap: tap === '' ? null : +tap, ro: +ro, note: $('#note', el).value.trim() };
        if (isNew) DB.measures.push(rec); else Object.assign(m, rec);
        save(); close(); render.mediciones();
        const a = measureAlerts(rec); toast(a.length ? 'Guardada · ' + a.join(', ') : 'Medición guardada');
      };
      if (!isNew) $('#del', el).onclick = () => { close(); setTimeout(() => confirmSheet('¿Borrar esta medición?', fmtTs(m.ts), 'Borrar', () => {
        DB.measures = DB.measures.filter(x => x.id !== m.id); save(); render.mediciones(); }), 240); };
    });
}

/* Google Calendar: evento de día completo en la fecha de aviso */
function gcalURL(f) {
  const s = status(f);
  let day = s.warnAt < todayISO() ? todayISO() : s.warnAt;
  const d = day.replaceAll('-', ''), d2 = addDays(day, 1).replaceAll('-', '');
  const ref = f === 'CF' ? 'WD-G2CF' : 'WD-G2MRO';
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: `💧 Pedir filtro ${f} (${ref}) — ósmosis G2`, dates: `${d}/${d2}`,
    details: `El filtro ${f} vence el ${fmt(s.due)}. Pedir el recambio ${ref} en Amazon.\n${DATA.PRODUCTS.originals.find(p => p.f === f).url}`
  });
  return 'https://calendar.google.com/calendar/render?' + p;
}
function calendarSheet(fs) {
  sheet(`<h3>Aviso en tu calendario</h3>
    <p class="lead">Crea un evento de día completo ${DB.settings.warnDays} días antes del cambio. Saltará con las notificaciones que tengas configuradas en Google Calendar.</p>
    ${fs.map(f => { const s = status(f); return `<a class="btn block primary" href="${gcalURL(f)}" target="_blank" rel="noopener">
      ${ICON.cal} ${f}: aviso el ${fmt(s.warnAt < todayISO() ? todayISO() : s.warnAt)}</a>`; }).join('')}
    <button class="btn block ghost" data-close>Ahora no</button>`);
}

/* ---------------- procedimiento a pantalla completa ---------------- */
const P = { key: null, i: 0, timer: null, lock: null };
function openProc(key) {
  const proc = DATA.PROCS[key];
  if (!proc) return;
  if (P.key !== key) { P.key = key; P.i = 0; stopTimer(); }
  const el = $('#proc');
  el.hidden = false; document.body.classList.add('locked');
  $('#proc-t').textContent = proc.title;
  drawStep();
}
function closeProc(nav = true) {
  if ($('#proc').hidden) return;
  stopTimer(); releaseLock(); stopAlarm();
  $('#proc').hidden = true; document.body.classList.remove('locked'); P.key = null;
  if (nav) { history.length > 1 ? history.back() : go('home'); }
}
function drawStep(dir = 0) {
  const proc = DATA.PROCS[P.key], st = proc.steps[P.i], n = proc.steps.length;
  $('#proc-n').textContent = `${P.i + 1} / ${n}`;
  $('#proc-bar').style.width = ((P.i + 1) / n * 100) + '%';
  const [scene, arg] = st.scene;
  const stage = $('#proc-ill');
  stage.innerHTML = ILL.S[scene](arg);
  stage.className = 'proc-ill' + (dir ? (dir > 0 ? ' from-r' : ' from-l') : '');
  let body = `<h2>${st.title}</h2>${st.text ? `<p>${st.text}</p>` : ''}
    ${st.warn ? `<p class="pwarn">${ICON.warn}${st.warn}</p>` : ''}${st.tip ? `<p class="ptip">${st.tip}</p>` : ''}`;
  if (st.timer) body += timerHTML(st);
  if (st.register) body += registerHTML(proc);
  $('#proc-txt').innerHTML = body;
  $('#proc-txt').scrollTop = 0;
  $('#proc-dots').innerHTML = proc.steps.map((_, k) => `<i class="${k === P.i ? 'on' : k < P.i ? 'past' : ''}"></i>`).join('');
  $('#proc-hint').innerHTML = P.i === 0 ? 'Desliza hacia la izquierda para empezar <b>←</b>'
    : st.register ? '<b>→</b> Desliza a la derecha para volver'
    : '<b>→</b> anterior · siguiente <b>←</b>';
  $('#proc-x').setAttribute('aria-label', 'Cerrar');
  if (st.timer) bindTimer(st);
  if (st.register) bindRegister(proc);
}
function stepGo(d) {
  const n = DATA.PROCS[P.key].steps.length, j = P.i + d;
  if (j < 0 || j >= n) return;
  const cur = DATA.PROCS[P.key].steps[P.i];
  if (cur.timer && P.timer?.running) { toast('El temporizador sigue en marcha'); }
  if (!(cur.timer && P.timer?.running)) stopTimer();
  P.i = j; drawStep(d);
}

/* temporizador: basado en hora de fin, resiste pantalla apagada */
function timerHTML(st) {
  const live = P.timer && P.timer.step === P.i ? P.timer : null;
  const rem = live ? remaining() : st.timer;
  return `<div class="timer" id="tm"><div class="tm-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="tm-bg"/>
      <circle cx="60" cy="60" r="54" class="tm-fg" id="tm-fg" stroke-dasharray="339.3" stroke-dashoffset="${339.3 * (1 - rem / st.timer)}" transform="rotate(-90 60 60)"/></svg>
      <div class="tm-v"><b id="tm-v">${mmss(rem)}</b><small>${st.timerLabel}</small></div></div>
    <div class="row center"><button class="btn primary" id="tm-go">${live?.running ? 'Pausa' : rem < st.timer ? 'Seguir' : 'Iniciar'}</button>
      <button class="btn" id="tm-r">Reiniciar</button></div></div>`;
}
const mmss = s => { s = Math.ceil(s); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
function remaining() {
  const t = P.timer; if (!t) return 0;
  return Math.max(0, t.running ? (t.end - Date.now()) / 1000 : t.left);
}
function bindTimer(st) {
  if (!P.timer || P.timer.step !== P.i) P.timer = { step: P.i, total: st.timer, left: st.timer, running: false, end: 0, iv: null };
  $('#tm-go').onclick = () => {
    const t = P.timer;
    if (t.running) { t.left = remaining(); t.running = false; clearInterval(t.iv); releaseLock(); }
    else { if (t.left <= 0) t.left = t.total; t.end = Date.now() + t.left * 1000; t.running = true; tick(); t.iv = setInterval(tick, 250); keepAwake(); unlockAudio(); askNotify(); }
    $('#tm-go').textContent = t.running ? 'Pausa' : 'Seguir';
  };
  $('#tm-r').onclick = () => { const t = P.timer; clearInterval(t.iv); t.running = false; t.left = t.total; releaseLock(); drawTimer(); $('#tm-go').textContent = 'Iniciar'; };
  if (P.timer.running) { clearInterval(P.timer.iv); P.timer.iv = setInterval(tick, 250); }
}
function drawTimer() {
  const t = P.timer, v = $('#tm-v'); if (!v || !t) return;
  const r = remaining(); v.textContent = mmss(r);
  $('#tm-fg').style.strokeDashoffset = 339.3 * (1 - r / t.total);
}
function tick() {
  const t = P.timer; if (!t) return;
  drawTimer();
  if (t.running && remaining() <= 0) {
    clearInterval(t.iv); t.running = false; t.left = 0; releaseLock();
    const b = $('#tm-go'); if (b) b.textContent = 'Iniciar';
    $('#tm')?.classList.add('done');
    alarm(DATA.PROCS[P.key]?.steps[t.step]?.timerLabel || 'Temporizador');
  }
}
function stopTimer() { if (P.timer) clearInterval(P.timer.iv); P.timer = null; releaseLock(); }
async function keepAwake() { try { P.lock = await navigator.wakeLock?.request('screen'); } catch { } }
function releaseLock() { try { P.lock?.release(); } catch { } P.lock = null; }
let AC;
function unlockAudio() { try { AC ||= new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch { } }
/* alarma: suena y vibra en bucle hasta que se pare (máx. 2 min) */
const AL = { iv: null, to: null };
function beepPattern() {
  try {
    unlockAudio(); const t0 = AC.currentTime + .02;
    [[988, 0], [784, .18], [988, .36], [784, .54]].forEach(([f, d]) => {
      const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(.5, t0 + d + .01);
      g.gain.setValueAtTime(.5, t0 + d + .13); g.gain.exponentialRampToValueAtTime(.0001, t0 + d + .16);
      o.connect(g).connect(AC.destination); o.start(t0 + d); o.stop(t0 + d + .17);
    });
  } catch { }
  navigator.vibrate?.([450, 150, 450]);
}
function alarm(label) {
  stopAlarm();
  const el = $('#alarm');
  $('#alarm-t').textContent = label + ': tiempo cumplido';
  el.hidden = false;
  beepPattern(); AL.iv = setInterval(beepPattern, 1300);
  AL.to = setTimeout(stopAlarm, 120000);
  if (document.hidden) sysNotify(label + ': tiempo cumplido', 'Vuelve a la app para seguir con el cambio de filtro.');
}
function stopAlarm() {
  clearInterval(AL.iv); clearTimeout(AL.to); AL.iv = AL.to = null;
  navigator.vibrate?.(0);
  const el = $('#alarm'); if (el) el.hidden = true;
}
function askNotify() {
  try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { }
}
async function sysNotify(title, body) {
  try {
    if (Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.ready;
    reg?.showNotification(title, { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: 'alarma',
      renotify: true, requireInteraction: true, vibrate: [500, 200, 500, 200, 800] });
  } catch { }
}

function registerHTML(proc) {
  return `<div class="reg">
    <label class="field"><span>Fecha del cambio</span><input type="date" id="rd" value="${todayISO()}" max="${todayISO()}"></label>
    <label class="field"><span>Nota</span><input type="text" id="rn" maxlength="120" placeholder="opcional (p. ej. agua turbia al principio)"></label>
    <button class="btn primary block" id="rok">${ICON.check} Registrar ${proc.filters.join(' + ')}</button>
    <button class="btn ghost block" id="rskip">Salir sin registrar</button></div>`;
}
function bindRegister(proc) {
  $('#rok').onclick = () => {
    const date = $('#rd').value || todayISO(), note = $('#rn').value.trim();
    proc.filters.forEach(f => {
      DB.history.push({ id: uid(), f, date, approx: false, note });
      Object.assign(DB.filters[f], { installed: date, approx: false });
    });
    save();
    const fs = proc.filters; closeProc();
    setTimeout(() => sheet(`<div class="okhead">${ICON.check}</div><h3>Cambio registrado</h3>
      ${fs.map(f => { const s = status(f); return `<p class="lead"><b>${f}</b>: próximo cambio el ${fmt(s.due)}.</p>`; }).join('')}
      <p class="lead">¿Añades el aviso al calendario para no depender de abrir la app?</p>
      ${fs.map(f => `<a class="btn block primary" href="${gcalURL(f)}" target="_blank" rel="noopener">${ICON.cal} Aviso ${f} en Google Calendar</a>`).join('')}
      <button class="btn block ghost" data-close>Ahora no</button>`), 300);
  };
  $('#rskip').onclick = () => closeProc();
}

/* gestos */
function swipe(el) {
  let x0 = null, y0 = 0, t0 = 0;
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('input,button,a,label,#alarm') || !e.isPrimary) { x0 = null; return; }
    x0 = e.clientX; y0 = e.clientY; t0 = Date.now();
  });
  el.addEventListener('pointerup', e => {
    if (x0 == null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - t0 < 900) stepGo(dx < 0 ? 1 : -1);
    x0 = null;
  });
  el.addEventListener('pointercancel', () => { x0 = null; });
}

/* ---------------- copia de seguridad ---------------- */
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'control-agua', exported: new Date().toISOString(), data: DB }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `control-agua-${todayISO()}.json`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importData(e) {
  const file = e.target.files[0]; if (!file) return;
  file.text().then(txt => {
    let j; try { j = JSON.parse(txt); } catch { toast('Archivo no válido'); return; }
    const d = j.data || j;
    if (!d.filters?.CF || !d.filters?.MRO || !Array.isArray(d.measures)) { toast('No es una copia de Control Agua'); return; }
    confirmSheet('¿Restaurar esta copia?', `Sustituye los datos actuales (${d.measures.length} mediciones, ${d.history?.length || 0} cambios).`, 'Restaurar', () => {
      localStorage.setItem(KEY, JSON.stringify(d)); load(); save(); applyTheme(); toast('Copia restaurada'); go('home');
    });
  });
  e.target.value = '';
}

/* ---------------- service worker y avisos del sistema ---------------- */
function syncSW() {
  if (!('caches' in window)) return;
  const s = ['CF', 'MRO'].map(status).map(x => ({ f: x.f, due: x.due, warnAt: x.warnAt }));
  caches.open('ca-state').then(c => c.put('./__state.json', new Response(JSON.stringify({ filters: s, on: DB.settings.sysNotify }),
    { headers: { 'content-type': 'application/json' } }))).catch(() => { });
}
async function enableSysNotify() {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Permiso de notificaciones denegado'); return; }
    const reg = await navigator.serviceWorker.ready;
    const st = await navigator.permissions.query({ name: 'periodic-background-sync' }).catch(() => ({ state: 'denied' }));
    if (st.state !== 'granted') { toast('Chrome no permite la comprobación periódica (instala la app primero)'); return; }
    await reg.periodicSync.register('check-filters', { minInterval: 24 * 60 * 60 * 1000 });
    DB.settings.sysNotify = true; save(); render.ajustes(); toast('Notificaciones activadas');
  } catch (err) { toast('No se han podido activar'); }
}

/* ---------------- utilidades UI ---------------- */
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('in');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('in'), 2600);
}
const ICON = {
  cal: '<svg viewBox="0 0 24 24" class="i"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  chev: '<svg viewBox="0 0 24 24" class="i"><path d="M9 5l7 7-7 7"/></svg>',
  ext: '<svg viewBox="0 0 24 24" class="i s"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" class="i"><path d="M12 5v14M5 12h14"/></svg>',
  info: '<svg viewBox="0 0 24 24" class="i"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  warn: '<svg viewBox="0 0 24 24" class="i"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" class="i"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};

/* ---------------- arranque ---------------- */
function init() {
  load(); applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  $('#proc-x').onclick = () => closeProc();
  $('#alarm').onclick = stopAlarm;
  swipe($('#proc'));
  document.addEventListener('keydown', e => {
    if ($('#proc').hidden) return;
    if (e.key === 'ArrowRight') stepGo(1); if (e.key === 'ArrowLeft') stepGo(-1);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { drawTimer(); if (P.timer?.running) keepAwake(); tick(); } });
  addEventListener('hashchange', route);
  route(); syncSW();
  navigator.storage?.persist?.().catch(() => { });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => { });
  // refresco al cambiar de día
  setInterval(() => { if (!document.hidden && $('#proc').hidden) render[(location.hash.slice(1) || 'home')]?.(); }, 6 * 3600e3);
}
document.addEventListener('DOMContentLoaded', init);
