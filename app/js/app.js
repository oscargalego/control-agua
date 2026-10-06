'use strict';
/* Osmosis Control — app multimodelo.
   Datos de los equipos: window.OC_DATA (generado desde datos/ por tools/build.mjs).
   Dibujos: ill/*.js. Textos: datos/i18n/<idioma>.json (claves ui.* para la interfaz). */

const D = window.OC_DATA, CFG = window.OC_CONFIG;
const VERSION = CFG.version;
const KEY = 'osmosis-control.v2', V1KEY = 'control-agua.v1', LINKS_KEY = 'osmosis-control.links';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const PROF = Object.fromEntries(D.profiles.map(p => [p.id, p]));
const MARKETS = ['es', 'it', 'fr', 'de', 'uk', 'us', 'ca'];

/* ---------------- textos ---------------- */
let LANG = 'es';
function t(key, p = {}) {
  let s = (D.i18n[LANG] || {})[key] ?? D.i18n.en?.[key] ?? D.i18n.es[key];
  if (s == null) return key;
  s = s.replace(/\{(\w+)\?\s?([^}]*)\}/g, (_, k, txt) => (p[k] ? txt : ''));
  return s.replace(/\{(\w+)\}/g, (_, k) => (p[k] ?? ''));
}
const has = key => key in (D.i18n[LANG] || {}) || key in D.i18n.es;

/* ---------------- dibujos por tipo de equipo ---------------- */
const ILLUS = {
  'frontal-g2': { front: st => ILL.front(st), S: ILL.S, warnLed: 'purple' },
  'g3p600': { front: st => frontG3P600(st), S: G3.S },
  'clasico-5-etapas': { front: st => GEN5.front(st), S: GEN5.S },
  'frizzlife-pd': { front: st => FRZ.front(st), S: FRZ.S },
  'g5p500': { front: st => G5.front(st), S: G5.S },
  'jimmy-r9': { front: st => JIM.front(st), S: JIM.S },
  'k19': { front: st => K19.front(st), S: K19.S },
  'ropot': { front: st => ROPOT.front(st), S: ROPOT.S },
};
const illFor = p => ILLUS[p.illustration];
function scene(p, sc) {
  const [name, ...args] = sc; const fn = illFor(p)?.S[name];
  try { return fn ? fn(...args) : ''; } catch (e) { console.error('escena', p.id, name, e); return ''; }
}

/* ---------------- datos del usuario ---------------- */
const DEFAULT = () => ({
  v: 2, premium: { unlocked: false, since: null, test: false }, active: null,
  devices: [], history: [], measures: [],
  settings: { lang: 'es', store: guessStore(), warnDays: 30, minRejection: 80, maxRo: 50, theme: 'dark' },
});
function guessStore() {
  const l = (navigator.language || 'es-ES').toLowerCase();
  if (l.endsWith('-gb')) return 'uk'; if (l.endsWith('-ca')) return 'ca'; if (l.endsWith('-us')) return 'us';
  const m = { es: 'es', it: 'it', fr: 'fr', de: 'de', en: 'us', pt: 'es' }[l.slice(0, 2)];
  return m || 'es';
}
let DB;
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { }
  try { DB = raw ? JSON.parse(raw) : null; } catch { DB = null; }
  if (!DB) { DB = DEFAULT(); migrateV1(); }
  const d = DEFAULT();
  DB.settings = { ...d.settings, ...(DB.settings || {}) };
  DB.premium = { ...d.premium, ...(DB.premium || {}) };
  DB.devices ||= []; DB.history ||= []; DB.measures ||= [];
  DB.devices = DB.devices.filter(x => PROF[x.profileId]);
  if (!DB.devices.find(x => x.id === DB.active)) DB.active = DB.devices[0]?.id || null;
  LANG = D.i18n[DB.settings.lang] ? DB.settings.lang : 'es';
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch { toast(t('ui.toast.noSave')); }
}
/* La PWA anterior (Control Agua, solo G2) guardaba en control-agua.v1 en este mismo origen. */
function migrateV1(src) {
  let v1 = src;
  if (!v1) { try { v1 = JSON.parse(localStorage.getItem(V1KEY) || 'null'); } catch { v1 = null; } }
  if (!v1?.filters?.CF || !v1?.filters?.MRO) return false;
  const p = PROF['waterdrop-g2'], id = uid();
  DB.devices.push({ id, profileId: p.id, profileVersion: p.version, name: t('ui.device.defaultName'),
    cartridges: { CF: { ...v1.filters.CF }, MRO: { ...v1.filters.MRO } } });
  DB.history.push(...(v1.history || []).map(h => ({ id: h.id || uid(), deviceId: id, cartridge: h.f, date: h.date, approx: !!h.approx, note: h.note || '' })));
  DB.measures.push(...(v1.measures || []).map(m => ({ ...m, deviceId: id })));
  if (v1.settings) for (const k of ['warnDays', 'minRejection', 'maxRo', 'theme']) if (k in v1.settings) DB.settings[k] = v1.settings[k];
  DB.active = id;
  // Quien ya usaba la app anterior en este mismo dispositivo la conserva completa.
  if (!src) DB.premium = { unlocked: true, since: todayISO(), test: false, legacy: true };
  return true;
}
const dev = () => DB.devices.find(x => x.id === DB.active) || null;
const prof = (d = dev()) => d ? PROF[d.profileId] : null;
const isPremium = () => !!DB.premium.unlocked;

/* ---------------- enlaces de compra (copia de la app + lista publicada) ---------------- */
let LINKS = D.links;
function loadLinks() {
  try { const r = JSON.parse(localStorage.getItem(LINKS_KEY) || 'null'); if (r?.data?.links && r.data.version > D.links.version) LINKS = r.data; } catch { }
}
async function refreshLinks() {
  if (!CFG.remoteLinks || !navigator.onLine) return;
  let st = null; try { st = JSON.parse(localStorage.getItem(LINKS_KEY) || 'null'); } catch { }
  if (st && Date.now() - st.checked < 864e5) return;
  try {
    const r = await fetch(CFG.remoteLinks, { cache: 'no-store' });
    const j = await r.json();
    const ok = j && typeof j.version === 'string' && j.links && typeof j.links === 'object' &&
      Object.values(j.links).every(s => Object.values(s).every(e => /^[A-Z0-9]{10}$/.test(e.asin)));
    const best = ok && j.version > (st?.data?.version || D.links.version) ? j : (st?.data || null);
    localStorage.setItem(LINKS_KEY, JSON.stringify({ checked: Date.now(), data: best }));
    if (best && best.version > LINKS.version) LINKS = best;
  } catch { }
}
function amazonURL(entry, search) {
  const store = DB.settings.store, host = CFG.amazon[store], tag = CFG.affiliate[store];
  const q = tag ? `tag=${encodeURIComponent(tag)}` : '';
  if (entry) return `https://${host}/dp/${entry.asin}${q ? '?' + q : ''}`;
  return `https://${host}/s?k=${encodeURIComponent(search)}${q ? '&' + q : ''}`;
}
function linkFor(ref) { return ref ? LINKS.links[ref]?.[DB.settings.store] || null : null; }
function kitsFor(ref) {
  return Object.entries(LINKS.kits || {}).filter(([, k]) => k.covers.includes(ref) && k.stores[DB.settings.store])
    .map(([id, k]) => ({ id, ...k, entry: k.stores[DB.settings.store] }));
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
const LOCALE = () => ({ es: 'es-ES', en: 'en-GB', pt: 'pt-PT', fr: 'fr-FR', de: 'de-DE', it: 'it-IT' }[LANG] || 'es-ES');
const fmt = (iso, o = { day: 'numeric', month: 'short', year: 'numeric' }) => parseISO(iso).toLocaleDateString(LOCALE(), { ...o, timeZone: 'UTC' });
const fmtTs = ts => new Date(ts).toLocaleString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const localDT = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/* ---------------- estado de cada cartucho ---------------- */
function cartOf(p, cid) { return p.cartridges.find(c => c.id === cid); }
function ensureCarts(d) {
  const p = PROF[d.profileId]; d.cartridges ||= {};
  for (const c of p.cartridges) d.cartridges[c.id] ||= { installed: todayISO(), approx: true, lifeMonths: c.life.months || 12 };
}
function status(d, cid) {
  const p = PROF[d.profileId], c = d.cartridges[cid];
  const due = addMonths(c.installed, c.lifeMonths), total = Math.max(1, diffDays(c.installed, due));
  const left = diffDays(todayISO(), due), warnAt = addDays(due, -DB.settings.warnDays);
  const warnLed = illFor(p)?.warnLed || 'yellow';
  let cls = 'ok', label = t('ui.st.ok'), led = 'blue';
  if (left <= 0) { cls = 'bad'; label = left === 0 ? t('ui.st.today') : t('ui.st.expired'); led = 'red'; }
  else if (left <= DB.settings.warnDays) { cls = 'warn'; label = t('ui.st.order'); led = warnLed; }
  return { ...c, f: cid, due, left, total, warnAt, frac: Math.max(0, left) / total, cls, label, led };
}
const leftText = s => s.left > 0 ? t(s.left === 1 ? 'ui.left.day' : 'ui.left.days', { n: s.left }) : s.left === 0 ? t('ui.left.today') : t('ui.left.ago', { n: -s.left });
function frontState(d) {
  const p = PROF[d.profileId], st = {};
  for (const c of p.cartridges) st[c.id] = isPremium() ? status(d, c.id) : { cls: 'ok', frac: 1, led: 'blue', f: c.id };
  return st;
}
const cartName = (p, c) => t(c.label);

/* ---------------- procedimientos ---------------- */
function procsFor(p, cid) {
  const all = Object.entries(p.procedures).filter(([, pr]) => pr.cartridges.includes(cid));
  return all.sort((a, b) => a[1].cartridges.length - b[1].cartridges.length);
}
function previewLimit(pr) {
  const r = pr.steps.findIndex(s => s.removes);
  return Math.max(1, Math.min(CFG.previewMaxSteps, r < 0 ? CFG.previewMaxSteps : r));
}
function stepText(st) {
  const pp = { ...(st.params || {}) };
  const g = suf => has(`${st.key}.${suf}`) ? t(`${st.key}.${suf}`, pp) : '';
  return { title: g('title'), text: g('text'), warn: g('warn'), tip: g('tip') };
}

/* ---------------- medidas ---------------- */
function rejection(m) { return m.tap > 0 && m.ro >= 0 ? (1 - m.ro / m.tap) * 100 : null; }
function measureAlerts(m) {
  const a = [], r = rejection(m), S = DB.settings;
  if (r != null && S.minRejection && r < S.minRejection) a.push(t('ui.meas.lowRej', { v: S.minRejection }));
  if (S.maxRo && m.ro > S.maxRo) a.push(t('ui.meas.highRo', { v: S.maxRo }));
  return a;
}
const devMeasures = () => DB.measures.filter(m => m.deviceId === DB.active).sort((a, b) => b.ts - a.ts);

/* ---------------- tema ---------------- */
function applyTheme() {
  const th = DB.settings.theme;
  const dark = th === 'dark' || (th === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name=theme-color]').content = dark ? '#07090d' : '#f3f5f8';
  document.documentElement.lang = LANG;
}

/* ---------------- router ---------------- */
const VIEWS = ['home', 'elegir', 'filtros', 'recambios', 'mediciones', 'luces', 'ajustes'];
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  const g = h.match(/^guia-(.+)$/);
  if (g && dev()) { openProc(g[1]); return; }
  closeProc(false);
  let v = VIEWS.includes(h) ? h : 'home';
  if (!dev() && v !== 'ajustes') v = 'elegir';
  $$('.view').forEach(e => e.hidden = e.id !== 'v-' + v);
  $$('.tab').forEach(x => x.setAttribute('aria-selected', x.dataset.go === v));
  $('#tabs').hidden = !dev() || v === 'elegir';
  header();
  render[v]?.();
  window.scrollTo(0, 0);
}
const go = v => { const h = v === 'home' ? '' : v; if (location.hash.slice(1) === h) route(); else location.hash = h; };
function header() {
  const d = dev(), p = prof();
  $('#hdr-name').textContent = d ? d.name : 'Osmosis Control';
  $('#hdr-model').textContent = p ? `${p.brand} ${p.model}` : t('ui.hdr.pick');
  $('#devbtn').classList.toggle('nodev', !d);
  $$('[data-t]').forEach(e => e.textContent = t(e.dataset.t));
}

/* ---------------- vistas ---------------- */
const render = {};
const premiumBadge = () => isPremium() ? '' : `<button class="pv-badge" data-buy>${ICON.lock} ${t('ui.preview.badge')}</button>`;

render.home = () => {
  const d = dev(), p = prof(); ensureCarts(d);
  const st = frontState(d);
  const el = $('#v-home');
  el.innerHTML = `${premiumBadge()}<div id="front"></div>
    <p class="hint">${t('ui.home.hint')}</p>
    <div class="minis n${p.cartridges.length > 3 ? 'many' : p.cartridges.length}" id="home-cards"></div>
    <div id="home-alerts"></div>`;
  $('#front').innerHTML = illFor(p).front(st);
  $$('#front .hot').forEach(g => {
    const open = () => openFor(g.dataset.f);
    g.addEventListener('click', open);
    g.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && open());
  });
  const cards = p.cartridges.map(c => {
    if (!isPremium()) return `<button class="mini s-ok" data-f="${c.id}">
        <span class="mini-k">${c.id}</span><span class="mini-l">${esc(cartName(p, c))}</span>
        <span class="mini-d">${t('ui.home.seeGuide')}</span></button>`;
    const s = st[c.id];
    return `<button class="mini s-${s.cls}" data-f="${c.id}">
      <span class="mini-k">${c.id}${s.approx ? ' <i title="≈">≈</i>' : ''}</span>
      <span class="mini-v">${leftText(s)}</span><span class="mini-l">${s.label}</span>
      <span class="bar"><i style="width:${(s.frac * 100).toFixed(1)}%"></i></span>
      <span class="mini-d">${t('ui.home.change', { d: fmt(s.due, { day: 'numeric', month: 'short', year: '2-digit' }) })}</span></button>`;
  }).join('');
  $('#home-cards').innerHTML = cards;
  $$('#home-cards .mini').forEach(b => b.onclick = () => isPremium() ? go('filtros') : openFor(b.dataset.f));
  const al = [];
  if (!isPremium()) {
    al.push(`<div class="card upsell"><b>${t('ui.home.freeTitle', { m: `${esc(p.brand)} ${esc(p.model)}` })}</b>
      <p>${t('ui.home.freeText')}</p><button class="btn primary block" data-buy>${t('ui.premium.cta', { price: CFG.priceLabel })}</button></div>`);
  } else {
    p.cartridges.map(c => st[c.id]).forEach(s => {
      const pk = procsFor(p, s.f)[0]?.[0];
      if (s.cls === 'bad') al.push(`<div class="alert bad"><b>${t('ui.home.alertBad', { f: s.f })}</b> ${t('ui.home.alertBadText')} <a href="#guia-${pk}">${t('ui.home.start')}</a></div>`);
      else if (s.cls === 'warn') al.push(`<div class="alert warn"><b>${t('ui.home.alertWarn', { f: s.f, left: leftText(s) })}</b> ${t('ui.home.alertWarnText')} <a href="#recambios">${t('ui.tab.recambios')}</a></div>`);
    });
    const last = devMeasures()[0];
    if (last && measureAlerts(last).length) al.push(`<div class="alert bad"><b>${t('ui.home.alertMeas')}</b> (${measureAlerts(last).join(', ')}). <a href="#mediciones">${t('ui.see')}</a></div>`);
    const upd = d.profileVersion && d.profileVersion < p.version;
    if (upd) { d.profileVersion = p.version; save(); al.push(`<div class="alert"><b>${t('ui.home.profileUpdated')}</b></div>`); }
  }
  $('#home-alerts').innerHTML = al.join('');
  bindBuy(el);
};
function openFor(cid) {
  const p = prof(), pk = procsFor(p, cid)[0]?.[0];
  if (pk) location.hash = 'guia-' + pk;
}

/* elegir modelo */
render.elegir = () => {
  const el = $('#v-elegir');
  const first = !DB.devices.length;
  el.innerHTML = `<h2 class="title">${first ? t('ui.pick.title') : t('ui.pick.titleAdd')}</h2>
    <p class="lead">${t('ui.pick.lead')}</p>
    <label class="search"><svg viewBox="0 0 24 24" class="i"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input type="search" id="q" placeholder="${t('ui.pick.search')}" autocomplete="off"></label>
    <div id="picklist"></div>
    <p class="note">${t('ui.pick.missing')}</p>
    ${first ? '' : `<button class="btn ghost block" id="pick-cancel">${t('ui.cancel')}</button>`}`;
  const draw = () => {
    const q = $('#q').value.trim().toLowerCase();
    const match = p => !q || [p.brand, p.model, ...(p.aliases || [])].join(' ').toLowerCase().includes(q);
    const store = DB.settings.store;
    const cats = ['bajo-fregadero-sin-deposito', 'clasico-con-deposito', 'sobremesa'];
    const list = cats.map(cat => {
      const ps = D.profiles.filter(p => p.category === cat && match(p))
        .sort((a, b) => (b.markets.includes(store) - a.markets.includes(store)) || (a.generic - b.generic) || (a.brand + a.model).localeCompare(b.brand + b.model));
      if (!ps.length) return '';
      return `<h3 class="sec">${t('ui.cat.' + cat)}</h3>` + ps.map(p => `<button class="card pick" data-p="${p.id}">
        <div class="pick-b"><b>${esc(p.brand)} ${esc(p.model)}</b>
        <small>${p.generic ? t('ui.pick.generic') : esc((p.aliases || []).slice(0, 3).join(' · '))}</small>
        <span class="pick-c">${p.cartridges.map(c => `<i>${c.id}</i>`).join('')}</span></div>${ICON.chev}</button>`).join('');
    }).join('');
    $('#picklist').innerHTML = list || `<p class="empty">${t('ui.pick.none')}</p>`;
    $$('#picklist [data-p]').forEach(b => b.onclick = () => setupDevice(b.dataset.p));
  };
  $('#q').oninput = draw; draw();
  const c = $('#pick-cancel'); if (c) c.onclick = () => go('home');
};
function setupDevice(pid) {
  const p = PROF[pid];
  if (DB.devices.length && !isPremium()) { buySheet('devices'); return; }
  const defName = DB.devices.length ? t('ui.device.nameN', { n: DB.devices.length + 1 }) : t('ui.device.defaultName');
  sheet(`<h3>${esc(p.brand)} ${esc(p.model)}</h3>
    <p class="lead">${t('ui.device.nameLead')}</p>
    <label class="field"><span>${t('ui.device.name')}</span><input type="text" id="dn" maxlength="30" value="${esc(defName)}"></label>
    <div class="row end"><button class="btn" data-close>${t('ui.cancel')}</button><button class="btn primary" id="ok">${t('ui.device.add')}</button></div>`,
    (el, close) => $('#ok', el).onclick = () => {
      const d = { id: uid(), profileId: p.id, profileVersion: p.version, name: $('#dn', el).value.trim() || defName, cartridges: {} };
      ensureCarts(d); DB.devices.push(d); DB.active = d.id; save(); close();
      toast(t('ui.device.added'));
      go('home');
      if (isPremium()) setTimeout(() => datesSheet(d), 400);
    });
}
/* fechas de instalación al dar de alta (premium) */
function datesSheet(d) {
  const p = PROF[d.profileId];
  sheet(`<h3>${t('ui.dates.title')}</h3><p class="lead">${t('ui.dates.lead')}</p>
    ${p.cartridges.map(c => `<div class="frow"><label>${c.id} <small>${esc(cartName(p, c))}</small></label>
      <input type="date" data-c="${c.id}" value="${d.cartridges[c.id].installed}" max="${todayISO()}"></div>`).join('')}
    <label class="check"><input type="checkbox" id="ap" checked> ${t('ui.dates.approx')}</label>
    <div class="row end"><button class="btn" data-close>${t('ui.later')}</button><button class="btn primary" id="ok">${t('ui.save')}</button></div>`,
    (el, close) => $('#ok', el).onclick = () => {
      const ap = $('#ap', el).checked;
      $$('[data-c]', el).forEach(i => { if (i.value) Object.assign(d.cartridges[i.dataset.c], { installed: i.value, approx: ap }); });
      save(); close(); route();
    });
}

/* filtros */
render.filtros = () => {
  const d = dev(), p = prof(); ensureCarts(d);
  const el = $('#v-filtros');
  if (!isPremium()) {
    el.innerHTML = `${premiumBadge()}<h2 class="title">${t('ui.tab.filtros')}</h2>
      ${p.cartridges.map(c => cartInfo(p, c, null)).join('')}${procLinks(p)}
      <div class="card upsell"><b>${t('ui.filters.lockTitle')}</b><p>${t('ui.filters.lockText')}</p>
        <button class="btn primary block" data-buy>${t('ui.premium.cta', { price: CFG.priceLabel })}</button></div>`;
    bindCartButtons(el); bindBuy(el); return;
  }
  const hist = DB.history.filter(h => h.deviceId === d.id).sort((a, b) => b.date.localeCompare(a.date));
  el.innerHTML = p.cartridges.map(c => cartInfo(p, c, status(d, c.id))).join('') + procLinks(p) + `
    <section class="card"><header><h3>${t('ui.filters.history')}</h3></header>
      ${hist.length ? `<ul class="hist">${hist.map(h => `<li>
        <span class="tag">${esc(h.cartridge)}</span><div><b>${h.approx ? '≈ ' : ''}${fmt(h.date)}</b>${h.note ? `<small>${esc(h.note)}</small>` : ''}</div>
        <button class="x" data-delh="${h.id}" aria-label="${t('ui.delete')}">×</button></li>`).join('')}</ul>`
        : `<p class="empty">${t('ui.filters.noHistory')}</p>`}
      <button class="btn ghost small" id="addh">+ ${t('ui.filters.addPast')}</button>
    </section>`;
  bindCartButtons(el);
  $$('[data-delh]', el).forEach(b => b.onclick = () => confirmSheet(t('ui.filters.delHistQ'), t('ui.filters.delHistT'), t('ui.delete'), () => {
    DB.history = DB.history.filter(h => h.id !== b.dataset.delh); save(); render.filtros();
  }));
  $('#addh').onclick = addPastChange;
};
function lifeLine(c) {
  const L = c.life, parts = [];
  if (L.months) parts.push(t('ui.filters.months', { n: L.months }));
  if (L.liters) parts.push(t('ui.filters.liters', { n: L.liters.toLocaleString(LOCALE()) }));
  let s = parts.length ? t('ui.filters.life', { v: parts.join(t('ui.or')) }) : t('ui.filters.lifeUnknown');
  if (L.rangeMonths) s += ' ' + t('ui.filters.range', { a: L.rangeMonths[0], b: L.rangeMonths[1] });
  if (L.basis === 'orientativo') s += ' ' + t('ui.filters.indicative');
  return s;
}
function cartInfo(p, c, s) {
  const pk = procsFor(p, c.id)[0]?.[0];
  return `<section class="card fcard ${s ? 's-' + s.cls : ''}">
    <header><div><span class="eyebrow">${esc(c.position || '')}</span>
      <h2>${c.id} <small>${esc(c.ref || '')}</small></h2><p class="sub">${esc(cartName(p, c))}</p></div>
      ${s ? `<span class="pill p-${s.cls}">${s.label}</span>` : ''}</header>
    ${s ? `<div class="kv">
      <div><span>${t('ui.filters.left')}</span><b>${leftText(s)}</b></div>
      <div><span>${t('ui.filters.due')}</span><b>${fmt(s.due)}</b></div>
      <div><span>${t('ui.filters.installed')}</span><b>${s.approx ? '≈ ' : ''}${fmt(s.installed)}</b></div>
      <div><span>${t('ui.filters.warn')}</span><b>${fmt(s.warnAt)}</b></div></div>
      <span class="bar big"><i style="width:${(s.frac * 100).toFixed(1)}%"></i></span>` : ''}
    <p class="note">${lifeLine(c)}${s && s.lifeMonths !== c.life.months ? ' ' + t('ui.filters.custom', { n: s.lifeMonths }) : ''}</p>
    <div class="row">
      ${pk ? `<a class="btn primary" href="#guia-${pk}">${t('ui.filters.guide')}</a>` : ''}
      ${s ? `<button class="btn" data-edit="${c.id}">${t('ui.edit')}</button>
      <button class="btn icon" data-cal="${c.id}" aria-label="${t('ui.cal.title')}" title="${t('ui.cal.title')}">${ICON.cal}</button>` : ''}
    </div></section>`;
}
function procLinks(p) {
  const multi = Object.entries(p.procedures).filter(([, pr]) => pr.cartridges.length > 1);
  return multi.map(([k, pr]) => `<a class="card linkcard" href="#guia-${k}"><div><b>${t(pr.title)}</b>
    <span>${pr.cartridges.join(' + ')} · ${t('ui.filters.steps', { n: pr.steps.length })}</span></div>${ICON.chev}</a>`).join('');
}
function bindCartButtons(el) {
  $$('[data-edit]', el).forEach(b => b.onclick = () => editInstall(b.dataset.edit));
  $$('[data-cal]', el).forEach(b => b.onclick = () => calendarSheet([b.dataset.cal]));
}

/* recambios */
render.recambios = () => {
  const d = dev(), p = prof(); ensureCarts(d);
  const store = DB.settings.store;
  const need = isPremium() ? p.cartridges.map(c => status(d, c.id)).filter(s => s.cls !== 'ok') : [];
  const item = c => {
    const e = linkFor(c.ref), kits = e ? [] : kitsFor(c.ref);
    const url = amazonURL(e, c.parts?.search || `${p.brand} ${c.ref || c.id}`);
    const s = isPremium() ? status(d, c.id) : null;
    return `<div class="card prod">
      <div class="prod-ic">${c.id}</div>
      <div class="prod-b"><b>${esc(cartName(p, c))}</b>
        <small>${t('ui.parts.ref')}: <b class="ref">${esc(c.ref || '—')}</b></small>
        ${s ? `<span class="prod-meta">${t('ui.parts.next', { d: fmt(s.due, { month: 'short', year: 'numeric' }) })}</span>` : ''}
        <div class="row">
          <a class="btn small ${e ? 'primary' : ''}" href="${url}" target="_blank" rel="noopener sponsored">${e ? t('ui.parts.buy') : t('ui.parts.search')} ${ICON.ext}</a>
          ${kits.map(k => `<a class="btn small primary" href="${amazonURL(k.entry)}" target="_blank" rel="noopener sponsored">${t('ui.parts.kit.' + k.id)} ${ICON.ext}</a>`).join('')}
        </div>
        ${e ? '' : `<p class="note">${kits.length ? t('ui.parts.onlyKit') : t('ui.parts.noLink')}</p>`}
        ${(c.parts?.notThis || []).map(n => `<p class="pwarn">${ICON.warn}<span><b>${esc(n.ref)}</b>: ${t(n.reason)}</span></p>`).join('')}
        ${(c.compatibleWith || []).length ? `<p class="note">${t('ui.parts.compat', { m: c.compatibleWith.map(x => PROF[x] ? `${PROF[x].brand} ${PROF[x].model}` : x).join(', ') })}</p>` : ''}
      </div></div>`;
  };
  $('#v-recambios').innerHTML = `
    ${need.length ? `<div class="alert warn"><b>${t('ui.parts.due')}</b> ${need.map(s => `${s.f} (${leftText(s)})`).join(' · ')}</div>` : ''}
    <div class="storebar"><span>${t('ui.parts.store')}</span><b>${CFG.amazon[store].replace('www.', '')}</b><a href="#ajustes">${t('ui.change')}</a></div>
    ${p.cartridges.map(item).join('')}
    <p class="note center">${t('ui.parts.footer')}</p>
    <p class="note center">${t('ui.parts.affiliate')}</p>`;
};

/* mediciones */
render.mediciones = () => {
  const S = DB.settings, list = devMeasures();
  const lock = !isPremium() && list.length >= 1;
  $('#v-mediciones').innerHTML = `
    <button class="btn primary block" id="newm">${lock ? ICON.lock : ICON.plus} ${t('ui.meas.new')}</button>
    ${!isPremium() ? `<p class="note center">${t('ui.meas.freeNote')}</p>` : ''}
    <div class="card tipcard">${ICON.info}<p>${t('ui.meas.tip')}</p></div>
    <div class="thr">${t('ui.meas.thr', { r: S.minRejection, ro: S.maxRo ? t('ui.meas.thrRo', { v: S.maxRo }) : '' })} <a href="#ajustes">${t('ui.change')}</a></div>
    ${list.length ? list.map(m => {
      const r = rejection(m), a = measureAlerts(m);
      return `<button class="card meas ${a.length ? 's-bad' : ''}" data-m="${m.id}">
        <div class="meas-top"><span>${fmtTs(m.ts)}</span>${a.length ? `<span class="pill p-bad">${a.join(' · ')}</span>` : '<span class="pill p-ok">OK</span>'}</div>
        <div class="meas-n">
          <div><span>${t('ui.meas.tap')}</span><b>${m.tap ?? '—'}</b><small>ppm</small></div>
          <div><span>${t('ui.meas.ro')}</span><b>${m.ro}</b><small>ppm</small></div>
          <div class="rej"><span>${t('ui.meas.rej')}</span><b>${r == null ? '—' : r.toFixed(1)}</b><small>%</small></div>
        </div>${m.note ? `<p class="meas-note">${esc(m.note)}</p>` : ''}</button>`;
    }).join('') : `<p class="empty big">${t('ui.meas.empty')}</p>`}`;
  $('#newm').onclick = () => lock ? buySheet('measures') : measureSheet();
  $$('[data-m]').forEach(b => b.onclick = () => {
    const m = DB.measures.find(x => x.id === b.dataset.m);
    isPremium() ? measureSheet(m) : toast(t('ui.meas.readOnly'));
  });
};

/* luces */
render.luces = () => {
  const p = prof(), el = $('#v-luces');
  if (!p) return;
  if (p.indicator.type === 'ninguno' || !p.lights?.length) {
    el.innerHTML = `<h2 class="title">${t('ui.lights.title')}</h2><div class="card info"><p>${t('ui.lights.none')}</p></div>`; return;
  }
  el.innerHTML = `<h2 class="title">${t('ui.lights.title')}</h2>
    <p class="lead">${t(p.indicator.intro)}</p>
    ${p.lights.map(g => `<h3 class="sec">${t(g.group)}</h3>${g.items.map(i => `
      <div class="card light">${lucesMini(p.indicator, i)}<div><b>${t(i.key + '.title')}</b><p>${t(i.key + '.mean')}</p><p class="act">${t(i.key + '.act')}</p></div></div>`).join('')}`).join('')}
    <p class="note">${t('ui.lights.dashed')}</p>
    <p class="note">${t(p.indicator.source)}</p>`;
};

/* ajustes */
render.ajustes = () => {
  const S = DB.settings;
  const devs = DB.devices.map(x => `<div class="frow dev ${x.id === DB.active ? 'on' : ''}">
      <label><b>${esc(x.name)}</b><br><small>${esc(PROF[x.profileId].brand)} ${esc(PROF[x.profileId].model)}</small></label>
      <div class="row"><button class="btn small" data-ren="${x.id}">${t('ui.rename')}</button><button class="btn small ghost danger" data-deld="${x.id}">${t('ui.delete')}</button></div></div>`).join('');
  $('#v-ajustes').innerHTML = `<h2 class="title">${t('ui.settings.title')}</h2>
    <section class="card form">
      <h3>${t('ui.settings.premium')}</h3>
      ${isPremium() ? `<p class="lead"><b>${t('ui.settings.premiumOn')}</b>${DB.premium.test ? ' · ' + t('ui.settings.testMode') : ''}${DB.premium.legacy ? ' · ' + t('ui.settings.legacy') : ''}</p>`
        : `<p class="lead">${t('ui.settings.premiumOff')}</p><button class="btn primary block" data-buy>${t('ui.premium.cta', { price: CFG.priceLabel })}</button>`}
    </section>
    <section class="card form">
      <h3>${t('ui.settings.devices')}</h3>${devs || `<p class="empty">${t('ui.settings.noDevices')}</p>`}
      <button class="btn ghost small" id="adddev">+ ${t('ui.device.addOther')}</button>
    </section>
    <section class="card form">
      <h3>${t('ui.settings.store')}</h3>
      <div class="frow"><label for="store">${t('ui.settings.storeLabel')}</label>
        <select id="store">${MARKETS.map(m => `<option value="${m}" ${S.store === m ? 'selected' : ''}>${CFG.amazon[m].replace('www.', '')}</option>`).join('')}</select></div>
      <p class="note">${t('ui.settings.storeNote', { v: LINKS.version })}</p>
    </section>
    ${isPremium() ? `<section class="card form">
      <h3>${t('ui.settings.filters')}</h3>
      <div class="frow"><label for="warn">${t('ui.settings.warnDays')}</label><input id="warn" type="number" inputmode="numeric" min="1" max="120" value="${S.warnDays}"></div>
      ${dev() ? prof().cartridges.map(c => `<div class="frow"><label for="life-${c.id}">${t('ui.settings.life', { f: c.id })}</label>
        <input id="life-${c.id}" data-life="${c.id}" type="number" inputmode="numeric" min="1" max="72" value="${dev().cartridges[c.id].lifeMonths}"></div>`).join('') : ''}
    </section>` : ''}
    <section class="card form">
      <h3>${t('ui.settings.meas')}</h3>
      <div class="frow"><label for="minr">${t('ui.settings.minRej')}</label><input id="minr" type="number" inputmode="decimal" min="0" max="100" value="${S.minRejection ?? ''}"></div>
      <div class="frow"><label for="maxro">${t('ui.settings.maxRo')}</label><input id="maxro" type="number" inputmode="numeric" min="0" placeholder="—" value="${S.maxRo ?? ''}"></div>
      <p class="note">${t('ui.settings.measNote')}</p>
    </section>
    <section class="card form">
      <h3>${t('ui.settings.look')}</h3>
      <div class="seg" role="radiogroup">${[['dark', 'ui.theme.dark'], ['light', 'ui.theme.light'], ['auto', 'ui.theme.auto']].map(([v, k]) =>
        `<button role="radio" aria-checked="${S.theme === v}" data-theme="${v}">${t(k)}</button>`).join('')}</div>
    </section>
    <section class="card form">
      <h3>${t('ui.settings.backup')}</h3>
      <p class="note">${t('ui.settings.backupNote')}</p>
      <div class="row"><button class="btn" id="exp">${t('ui.settings.export')}</button><label class="btn">${t('ui.settings.import')}<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
      <button class="btn ghost danger small" id="wipe">${t('ui.settings.wipe')}</button>
    </section>
    ${location.protocol.startsWith('http') || location.protocol === 'file:' ? `<section class="card form dev-tools">
      <h3>${t('ui.settings.devTools')}</h3><p class="note">${t('ui.settings.devNote')}</p>
      <button class="btn small" id="toggleprem">${isPremium() ? t('ui.settings.devFree') : t('ui.settings.devPrem')}</button></section>` : ''}
    <p class="note center">Osmosis Control ${VERSION} · ${D.profiles.length} ${t('ui.settings.profiles')} · ${t('ui.settings.data', { d: D.built.slice(0, 10) })}</p>`;
  const num = (id, fn) => { const i = $('#' + id); if (i) i.addEventListener('change', e => { const v = e.target.value === '' ? null : Number(e.target.value); fn(v); save(); toast(t('ui.saved')); }); };
  num('warn', v => v > 0 && (DB.settings.warnDays = Math.round(v)));
  num('minr', v => DB.settings.minRejection = v);
  num('maxro', v => DB.settings.maxRo = v);
  $$('[data-life]').forEach(i => i.addEventListener('change', e => { const v = +e.target.value; if (v > 0) { dev().cartridges[i.dataset.life].lifeMonths = Math.round(v); save(); toast(t('ui.saved')); } }));
  $('#store').onchange = e => { DB.settings.store = e.target.value; save(); toast(t('ui.saved')); };
  $$('[data-theme]').forEach(b => b.onclick = () => { DB.settings.theme = b.dataset.theme; save(); applyTheme(); render.ajustes(); });
  $$('[data-ren]').forEach(b => b.onclick = () => renameDevice(b.dataset.ren));
  $$('[data-deld]').forEach(b => b.onclick = () => deleteDevice(b.dataset.deld));
  $('#adddev').onclick = addDevice;
  $('#exp').onclick = exportData;
  $('#imp').onchange = importData;
  $('#wipe').onclick = () => confirmSheet(t('ui.settings.wipeQ'), t('ui.settings.wipeT'), t('ui.settings.wipeOk'), () => {
    try { localStorage.removeItem(KEY); localStorage.removeItem(V1KEY); } catch { }
    DB = DEFAULT(); save(); toast(t('ui.settings.wiped')); go('elegir');
  });
  const tp = $('#toggleprem');
  if (tp) tp.onclick = () => { DB.premium = isPremium() ? { unlocked: false, since: null, test: false } : { unlocked: true, since: todayISO(), test: true }; save(); render.ajustes(); };
  bindBuy($('#v-ajustes'));
};
function addDevice() { if (DB.devices.length && !isPremium()) { buySheet('devices'); return; } go('elegir'); }
function renameDevice(id) {
  const d = DB.devices.find(x => x.id === id);
  sheet(`<h3>${t('ui.rename')}</h3><label class="field"><span>${t('ui.device.name')}</span><input type="text" id="dn" maxlength="30" value="${esc(d.name)}"></label>
    <div class="row end"><button class="btn" data-close>${t('ui.cancel')}</button><button class="btn primary" id="ok">${t('ui.save')}</button></div>`,
    (el, close) => $('#ok', el).onclick = () => { d.name = $('#dn', el).value.trim() || d.name; save(); close(); route(); });
}
function deleteDevice(id) {
  const d = DB.devices.find(x => x.id === id);
  confirmSheet(t('ui.device.delQ', { n: d.name }), t('ui.device.delT'), t('ui.delete'), () => {
    DB.devices = DB.devices.filter(x => x.id !== id);
    DB.history = DB.history.filter(h => h.deviceId !== id); DB.measures = DB.measures.filter(m => m.deviceId !== id);
    if (DB.active === id) DB.active = DB.devices[0]?.id || null;
    save(); route();
  });
}
function deviceSheet() {
  if (!DB.devices.length) { go('elegir'); return; }
  sheet(`<h3>${t('ui.settings.devices')}</h3>
    ${DB.devices.map(x => `<button class="card pick ${x.id === DB.active ? 'on' : ''}" data-d="${x.id}"><div class="pick-b"><b>${esc(x.name)}</b>
      <small>${esc(PROF[x.profileId].brand)} ${esc(PROF[x.profileId].model)}</small></div>${x.id === DB.active ? ICON.check : ''}</button>`).join('')}
    <button class="btn block" id="adddev2">${isPremium() ? '' : ICON.lock + ' '}+ ${t('ui.device.addOther')}</button>
    <button class="btn block ghost" data-close>${t('ui.close')}</button>`,
    (el, close) => {
      $$('[data-d]', el).forEach(b => b.onclick = () => { DB.active = b.dataset.d; save(); close(); go('home'); });
      $('#adddev2', el).onclick = () => { close(); setTimeout(addDevice, 250); };
    });
}

/* ---------------- premium ---------------- */
function bindBuy(el) { $$('[data-buy]', el).forEach(b => b.onclick = () => buySheet()); }
function buySheet(reason) {
  const p = prof();
  sheet(`<div class="okhead prem">${ICON.star}</div>
    <h3>${t('ui.premium.title')}</h3>
    ${reason ? `<p class="lead"><b>${t('ui.premium.reason.' + reason)}</b></p>` : ''}
    <ul class="checks">${['guide', 'life', 'alerts', 'meas', 'devices', 'history'].map(k => `<li>${ICON.check}${t('ui.premium.f.' + k)}</li>`).join('')}</ul>
    <p class="note">${t('ui.premium.once')}</p>
    <button class="btn primary block" id="buy">${t('ui.premium.cta', { price: CFG.priceLabel })}</button>
    <button class="btn block ghost" data-close>${t('ui.later')}</button>`,
    (el, close) => $('#buy', el).onclick = () => { close(); setTimeout(purchase, 250); });
}
/* La compra real (Google Play Billing) llega con la app nativa. En la versión web de pruebas se activa sin pago. */
function purchase() {
  confirmSheet(t('ui.premium.testQ'), t('ui.premium.testT'), t('ui.premium.testOk'), () => {
    DB.premium = { unlocked: true, since: todayISO(), test: true }; save(); toast(t('ui.premium.thanks')); route();
  });
}

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
    <div class="row end"><button class="btn" data-close>${t('ui.cancel')}</button><button class="btn danger" id="ok">${okLabel}</button></div>`,
    (el, close) => { $('#ok', el).onclick = () => { close(); onOk(); }; });
}
function editInstall(cid) {
  const d = dev(), c = d.cartridges[cid];
  sheet(`<h3>${t('ui.edit.title', { f: cid })}</h3>
    <p class="lead">${t('ui.edit.lead')}</p>
    <label class="field"><span>${t('ui.date')}</span><input type="date" id="d" value="${c.installed}" max="${todayISO()}"></label>
    <label class="check"><input type="checkbox" id="ap" ${c.approx ? 'checked' : ''}> ${t('ui.dates.approx')}</label>
    <label class="field"><span>${t('ui.settings.life', { f: cid })}</span><input type="number" id="lm" min="1" max="72" value="${c.lifeMonths}"></label>
    <div class="row end"><button class="btn" data-close>${t('ui.cancel')}</button><button class="btn primary" id="ok">${t('ui.save')}</button></div>`,
    (el, close) => $('#ok', el).onclick = () => {
      const v = $('#d', el).value; if (!v) return;
      c.installed = v; c.approx = $('#ap', el).checked; const lm = +$('#lm', el).value; if (lm > 0) c.lifeMonths = Math.round(lm);
      save(); close(); render.filtros(); toast(t('ui.saved'));
    });
}
function addPastChange() {
  const p = prof(), ids = p.cartridges.map(c => c.id);
  sheet(`<h3>${t('ui.filters.addPast')}</h3>
    <div class="seg" id="ff">${ids.map((id, i) => `<button aria-checked="${i === 0}" data-v="${id}">${id}</button>`).join('')}</div>
    <label class="field"><span>${t('ui.date')}</span><input type="date" id="d" value="${todayISO()}" max="${todayISO()}"></label>
    <label class="check"><input type="checkbox" id="ap"> ${t('ui.dates.approx')}</label>
    <label class="field"><span>${t('ui.note')}</span><input type="text" id="n" maxlength="120" placeholder="${t('ui.optional')}"></label>
    <label class="check"><input type="checkbox" id="setinst" checked> ${t('ui.filters.useAsInstall')}</label>
    <div class="row end"><button class="btn" data-close>${t('ui.cancel')}</button><button class="btn primary" id="ok">${t('ui.add')}</button></div>`,
    (el, close) => {
      let f = ids[0];
      $$('#ff button', el).forEach(b => b.onclick = () => { f = b.dataset.v; $$('#ff button', el).forEach(x => x.setAttribute('aria-checked', x === b)); });
      $('#ok', el).onclick = () => {
        const date = $('#d', el).value; if (!date) return;
        const approx = $('#ap', el).checked, d = dev();
        DB.history.push({ id: uid(), deviceId: d.id, cartridge: f, date, approx, note: $('#n', el).value.trim() });
        if ($('#setinst', el).checked && date >= d.cartridges[f].installed) Object.assign(d.cartridges[f], { installed: date, approx });
        save(); close(); render.filtros(); toast(t('ui.added'));
      };
    });
}
function measureSheet(m) {
  const isNew = !m, ts = m ? localDT(new Date(m.ts)) : localDT();
  sheet(`<h3>${isNew ? t('ui.meas.new') : t('ui.meas.edit')}</h3>
    <label class="field"><span>${t('ui.meas.when')}</span><input type="datetime-local" id="ts" value="${ts}"></label>
    <div class="two">
      <label class="field"><span>${t('ui.meas.tap')} (ppm)</span><input type="number" inputmode="numeric" min="0" id="tap" value="${m?.tap ?? ''}" placeholder="420"></label>
      <label class="field"><span>${t('ui.meas.ro')} (ppm)</span><input type="number" inputmode="numeric" min="0" id="ro" value="${m?.ro ?? ''}" placeholder="18"></label>
    </div>
    <div class="live" id="live"></div>
    <label class="field"><span>${t('ui.note')}</span><input type="text" id="note" maxlength="160" value="${esc(m?.note ?? '')}" placeholder="${t('ui.optional')}"></label>
    ${isNew && !isPremium() ? `<p class="note">${t('ui.meas.freeNote')}</p>` : ''}
    <div class="row end">${isNew ? '' : `<button class="btn ghost danger" id="del">${t('ui.delete')}</button>`}<button class="btn" data-close>${t('ui.cancel')}</button><button class="btn primary" id="ok">${t('ui.save')}</button></div>`,
    (el, close) => {
      const upd = () => {
        const tp = +$('#tap', el).value, r = $('#ro', el).value;
        const x = tp > 0 && r !== '' ? (1 - +r / tp) * 100 : null;
        $('#live', el).innerHTML = `${t('ui.meas.rej')}: <b>${x == null ? '—' : x.toFixed(1) + ' %'}</b>`;
      };
      $('#tap', el).oninput = $('#ro', el).oninput = upd; upd();
      $('#ok', el).onclick = () => {
        const ro = $('#ro', el).value, tap = $('#tap', el).value, tv = $('#ts', el).value;
        if (ro === '') { toast(t('ui.meas.missingRo')); return; }
        const rec = { id: m?.id || uid(), deviceId: m?.deviceId || DB.active, ts: tv ? new Date(tv).getTime() : Date.now(),
          tap: tap === '' ? null : +tap, ro: +ro, note: $('#note', el).value.trim() };
        if (isNew) DB.measures.push(rec); else Object.assign(m, rec);
        save(); close(); render.mediciones();
        const a = measureAlerts(rec); toast(a.length ? t('ui.meas.savedAlert', { a: a.join(', ') }) : t('ui.meas.saved'));
      };
      if (!isNew) $('#del', el).onclick = () => { close(); setTimeout(() => confirmSheet(t('ui.meas.delQ'), fmtTs(m.ts), t('ui.delete'), () => {
        DB.measures = DB.measures.filter(x => x.id !== m.id); save(); render.mediciones(); }), 240); };
    });
}

/* Google Calendar: evento de día completo en la fecha de aviso */
function gcalURL(cid) {
  const d = dev(), p = prof(), s = status(d, cid), c = cartOf(p, cid);
  const day = s.warnAt < todayISO() ? todayISO() : s.warnAt;
  const a = day.replaceAll('-', ''), b = addDays(day, 1).replaceAll('-', '');
  const e = linkFor(c.ref);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: t('ui.cal.event', { f: cid, ref: c.ref || '', name: d.name }), dates: `${a}/${b}`,
    details: t('ui.cal.details', { f: cid, d: fmt(s.due), ref: c.ref || cid }) + '\n' + amazonURL(e, c.parts?.search || `${p.brand} ${c.ref || cid}`) });
  return 'https://calendar.google.com/calendar/render?' + q;
}
function calendarSheet(ids) {
  sheet(`<h3>${t('ui.cal.title')}</h3><p class="lead">${t('ui.cal.lead', { n: DB.settings.warnDays })}</p>
    ${ids.map(cid => { const s = status(dev(), cid); return `<a class="btn block primary" href="${gcalURL(cid)}" target="_blank" rel="noopener">
      ${ICON.cal} ${t('ui.cal.btn', { f: cid, d: fmt(s.warnAt < todayISO() ? todayISO() : s.warnAt) })}</a>`; }).join('')}
    <button class="btn block ghost" data-close>${t('ui.later')}</button>`);
}

/* ---------------- guía paso a paso a pantalla completa ---------------- */
const P = { key: null, i: 0, timer: null, lock: null };
function openProc(key) {
  const p = prof(), pr = p.procedures[key];
  if (!pr) { go('home'); return; }
  if (P.key !== key) { P.key = key; P.i = 0; stopTimer(); }
  $('#proc').hidden = false; document.body.classList.add('locked');
  $('#proc-t').textContent = t(pr.title);
  drawStep();
}
function closeProc(nav = true) {
  if ($('#proc').hidden) return;
  stopTimer(); releaseLock(); stopAlarm();
  $('#proc').hidden = true; document.body.classList.remove('locked'); P.key = null;
  if (nav) { history.length > 1 ? history.back() : go('home'); }
}
function drawStep(dir = 0) {
  const p = prof(), pr = p.procedures[P.key], st = pr.steps[P.i], n = pr.steps.length;
  const limit = isPremium() ? n : previewLimit(pr), locked = P.i >= limit;
  $('#proc-n').textContent = `${P.i + 1} / ${n}`;
  $('#proc-bar').style.width = ((P.i + 1) / n * 100) + '%';
  const stage = $('#proc-ill');
  stage.innerHTML = locked ? `<div class="lockstage">${ICON.lock}</div>` : scene(p, st.scene);
  stage.className = 'proc-ill' + (dir ? (dir > 0 ? ' from-r' : ' from-l') : '') + (locked ? ' is-locked' : '');
  let body;
  if (locked) {
    body = `<h2>${t('ui.lock.title')}</h2><p>${t('ui.lock.text', { n, k: limit })}</p>
      <ol class="locklist">${pr.steps.slice(limit).map(s => `<li>${esc(stepText(s).title)}</li>`).join('')}</ol>
      <button class="btn primary block" data-buy>${t('ui.premium.cta', { price: CFG.priceLabel })}</button>`;
  } else {
    const x = stepText(st);
    body = `${st.critical ? `<span class="crit">${t('ui.step.critical')}</span>` : ''}<h2>${esc(x.title)}</h2>${x.text ? `<p>${esc(x.text)}</p>` : ''}
      ${x.warn ? `<p class="pwarn">${ICON.warn}${esc(x.warn)}</p>` : ''}${x.tip ? `<p class="ptip">${esc(x.tip)}</p>` : ''}`;
    if (st.timer) body += timerHTML(st);
    if (st.register) body += registerHTML(pr);
  }
  $('#proc-txt').innerHTML = body;
  $('#proc-txt').scrollTop = 0;
  $('#proc-dots').innerHTML = pr.steps.map((_, k) => `<i class="${k === P.i ? 'on' : k < P.i ? 'past' : ''} ${k >= limit ? 'lk' : ''}"></i>`).join('');
  $('#proc-hint').innerHTML = P.i === 0 ? t('ui.step.hintFirst') : (st.register && !locked) ? t('ui.step.hintLast') : t('ui.step.hint');
  if (!locked && st.timer) bindTimer(st);
  if (!locked && st.register) bindRegister(pr);
  bindBuy($('#proc-txt'));
}
function stepGo(dd) {
  const pr = prof().procedures[P.key], n = pr.steps.length, j = P.i + dd;
  if (j < 0 || j >= n) return;
  const limit = isPremium() ? n : previewLimit(pr);
  if (j > limit) return;
  const cur = pr.steps[P.i];
  if (cur.timer && P.timer?.running) toast(t('ui.timer.running'));
  else stopTimer();
  P.i = j; drawStep(dd);
}
function timerHTML(st) {
  const live = P.timer && P.timer.step === P.i ? P.timer : null;
  const rem = live ? remaining() : st.timer;
  return `<div class="timer" id="tm"><div class="tm-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="tm-bg"/>
      <circle cx="60" cy="60" r="54" class="tm-fg" id="tm-fg" stroke-dasharray="339.3" stroke-dashoffset="${339.3 * (1 - rem / st.timer)}" transform="rotate(-90 60 60)"/></svg>
      <div class="tm-v"><b id="tm-v">${mmss(rem)}</b><small>${t(st.timerKey || 'comun.timer.purga')}</small></div></div>
    <div class="row center"><button class="btn primary" id="tm-go">${live?.running ? t('ui.timer.pause') : rem < st.timer ? t('ui.timer.resume') : t('ui.timer.start')}</button>
      <button class="btn" id="tm-r">${t('ui.timer.reset')}</button></div></div>`;
}
const mmss = s => { s = Math.ceil(s); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
function remaining() { const x = P.timer; if (!x) return 0; return Math.max(0, x.running ? (x.end - Date.now()) / 1000 : x.left); }
function bindTimer(st) {
  if (!P.timer || P.timer.step !== P.i) P.timer = { step: P.i, total: st.timer, left: st.timer, running: false, end: 0, iv: null, label: t(st.timerKey || 'comun.timer.purga') };
  $('#tm-go').onclick = () => {
    const x = P.timer;
    if (x.running) { x.left = remaining(); x.running = false; clearInterval(x.iv); releaseLock(); }
    else { if (x.left <= 0) x.left = x.total; x.end = Date.now() + x.left * 1000; x.running = true; tick(); x.iv = setInterval(tick, 250); keepAwake(); unlockAudio(); askNotify(); }
    $('#tm-go').textContent = x.running ? t('ui.timer.pause') : t('ui.timer.resume');
  };
  $('#tm-r').onclick = () => { const x = P.timer; clearInterval(x.iv); x.running = false; x.left = x.total; releaseLock(); drawTimer(); $('#tm-go').textContent = t('ui.timer.start'); };
  if (P.timer.running) { clearInterval(P.timer.iv); P.timer.iv = setInterval(tick, 250); }
}
function drawTimer() { const x = P.timer, v = $('#tm-v'); if (!v || !x) return; const r = remaining(); v.textContent = mmss(r); $('#tm-fg').style.strokeDashoffset = 339.3 * (1 - r / x.total); }
function tick() {
  const x = P.timer; if (!x) return;
  drawTimer();
  if (x.running && remaining() <= 0) {
    clearInterval(x.iv); x.running = false; x.left = 0; releaseLock();
    const b = $('#tm-go'); if (b) b.textContent = t('ui.timer.start');
    $('#tm')?.classList.add('done');
    alarm(x.label);
  }
}
function stopTimer() { if (P.timer) clearInterval(P.timer.iv); P.timer = null; releaseLock(); }
async function keepAwake() { try { P.lock = await navigator.wakeLock?.request('screen'); } catch { } }
function releaseLock() { try { P.lock?.release(); } catch { } P.lock = null; }
let AC;
function unlockAudio() { try { AC ||= new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch { } }
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
  $('#alarm-t').textContent = t('ui.alarm.done', { l: label });
  $('#alarm').hidden = false;
  beepPattern(); AL.iv = setInterval(beepPattern, 1300); AL.to = setTimeout(stopAlarm, 120000);
  if (document.hidden) sysNotify(t('ui.alarm.done', { l: label }), t('ui.alarm.back'));
}
function stopAlarm() { clearInterval(AL.iv); clearTimeout(AL.to); AL.iv = AL.to = null; navigator.vibrate?.(0); const el = $('#alarm'); if (el) el.hidden = true; }
function askNotify() { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { } }
async function sysNotify(title, body) {
  try {
    if (Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.ready;
    reg?.showNotification(title, { body, icon: './icons/icon-192.png', tag: 'alarma', renotify: true, requireInteraction: true });
  } catch { }
}
function registerHTML(pr) {
  return `<div class="reg">
    <label class="field"><span>${t('ui.reg.date')}</span><input type="date" id="rd" value="${todayISO()}" max="${todayISO()}"></label>
    <label class="field"><span>${t('ui.note')}</span><input type="text" id="rn" maxlength="120" placeholder="${t('ui.optional')}"></label>
    <button class="btn primary block" id="rok">${ICON.check} ${t('ui.reg.btn', { f: pr.cartridges.join(' + ') })}</button>
    <button class="btn ghost block" id="rskip">${t('ui.reg.skip')}</button></div>`;
}
function bindRegister(pr) {
  $('#rok').onclick = () => {
    const date = $('#rd').value || todayISO(), note = $('#rn').value.trim(), d = dev();
    pr.cartridges.forEach(f => {
      DB.history.push({ id: uid(), deviceId: d.id, cartridge: f, date, approx: false, note });
      Object.assign(d.cartridges[f], { installed: date, approx: false });
    });
    save();
    const fs = pr.cartridges; closeProc();
    setTimeout(() => sheet(`<div class="okhead">${ICON.check}</div><h3>${t('ui.reg.done')}</h3>
      ${fs.map(f => `<p class="lead"><b>${f}</b>: ${t('ui.reg.next', { d: fmt(status(d, f).due) })}</p>`).join('')}
      <p class="lead">${t('ui.reg.calQ')}</p>
      ${fs.map(f => `<a class="btn block primary" href="${gcalURL(f)}" target="_blank" rel="noopener">${ICON.cal} ${t('ui.reg.calBtn', { f })}</a>`).join('')}
      <button class="btn block ghost" data-close>${t('ui.later')}</button>`), 300);
  };
  $('#rskip').onclick = () => closeProc();
}
function swipe(el) {
  let x0 = null, y0 = 0, t0 = 0;
  el.addEventListener('pointerdown', e => { if (e.target.closest('input,button,a,label,#alarm') || !e.isPrimary) { x0 = null; return; } x0 = e.clientX; y0 = e.clientY; t0 = Date.now(); });
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
  const blob = new Blob([JSON.stringify({ app: 'osmosis-control', version: VERSION, exported: new Date().toISOString(), data: DB }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `osmosis-control-${todayISO()}.json`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importData(e) {
  const file = e.target.files[0]; if (!file) return;
  file.text().then(txt => {
    let j; try { j = JSON.parse(txt); } catch { toast(t('ui.import.bad')); return; }
    const d = j.data || j;
    if (d.v === 2 && Array.isArray(d.devices)) {
      confirmSheet(t('ui.import.q'), t('ui.import.t2', { n: d.devices.length, m: d.measures?.length || 0 }), t('ui.import.ok'), () => {
        const keepPrem = DB.premium; DB = d; DB.premium = keepPrem; save(); load(); applyTheme(); toast(t('ui.import.done')); go('home');
      });
    } else if (d.filters?.CF && d.filters?.MRO) {
      confirmSheet(t('ui.import.q'), t('ui.import.t1'), t('ui.import.ok'), () => {
        migrateV1(d); save(); load(); toast(t('ui.import.done')); go('home');
      });
    } else toast(t('ui.import.bad'));
  });
  e.target.value = '';
}

/* ---------------- utilidades UI ---------------- */
let toastT;
function toast(msg) { const x = $('#toast'); x.textContent = msg; x.classList.add('in'); clearTimeout(toastT); toastT = setTimeout(() => x.classList.remove('in'), 2600); }
const ICON = {
  cal: '<svg viewBox="0 0 24 24" class="i"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  chev: '<svg viewBox="0 0 24 24" class="i"><path d="M9 5l7 7-7 7"/></svg>',
  ext: '<svg viewBox="0 0 24 24" class="i s"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" class="i"><path d="M12 5v14M5 12h14"/></svg>',
  info: '<svg viewBox="0 0 24 24" class="i"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  warn: '<svg viewBox="0 0 24 24" class="i"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" class="i"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" class="i s"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  star: '<svg viewBox="0 0 24 24" class="i"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
};

/* ---------------- arranque ---------------- */
function init() {
  load(); loadLinks(); applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  $('#devbtn').onclick = () => dev() ? deviceSheet() : go('elegir');
  $('#proc-x').onclick = () => closeProc();
  $('#alarm').onclick = stopAlarm;
  $('#alarm-p').textContent = t('ui.alarm.tap'); $('#alarm-b').textContent = t('ui.alarm.stop');
  swipe($('#proc'));
  document.addEventListener('keydown', e => { if ($('#proc').hidden) return; if (e.key === 'ArrowRight') stepGo(1); if (e.key === 'ArrowLeft') stepGo(-1); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { drawTimer(); if (P.timer?.running) keepAwake(); tick(); } });
  addEventListener('hashchange', route);
  save(); route();
  refreshLinks();
  navigator.storage?.persist?.().catch(() => { });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => { });
  setInterval(() => { if (!document.hidden && $('#proc').hidden) route(); }, 6 * 3600e3);
}
document.addEventListener('DOMContentLoaded', init);
