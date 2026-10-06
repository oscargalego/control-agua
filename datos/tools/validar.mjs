// Valida los perfiles contra el esquema y comprueba la coherencia con los textos.
// Uso: node tools/validar.mjs [lang ...]   (por defecto: es)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(join(root, 'schema/perfil.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['es'];
const texts = Object.fromEntries(langs.map(l => [l, JSON.parse(readFileSync(join(root, `i18n/${l}.json`), 'utf8'))]));

const files = readdirSync(join(root, 'perfiles')).filter(f => f.endsWith('.json'));
const ids = new Set();
const profiles = files.map(f => JSON.parse(readFileSync(join(root, 'perfiles', f), 'utf8')));
profiles.forEach(p => ids.add(p.id));

let errors = 0;
const err = (p, msg) => { errors++; console.log(`  ✗ ${p}: ${msg}`); };

for (const [i, p] of profiles.entries()) {
  const name = files[i];
  console.log(`${name}  [${p.status}]`);
  if (!validate(p)) { validate.errors.forEach(e => err(name, `${e.instancePath || '/'} ${e.message}`)); continue; }
  if (`${p.id}.json` !== name) err(name, `el id «${p.id}» no coincide con el nombre del archivo`);

  const previews = [];
  const cartIds = new Set(p.cartridges.map(c => c.id));
  if (cartIds.size !== p.cartridges.length) err(name, 'ids de cartucho repetidos');

  // cada cartucho debe tener al menos un procedimiento que lo cambie
  const covered = new Set(Object.values(p.procedures).flatMap(pr => pr.cartridges));
  for (const c of p.cartridges) {
    if (!covered.has(c.id)) err(name, `el cartucho ${c.id} no tiene procedimiento de cambio`);
    for (const other of c.compatibleWith || []) if (!ids.has(other)) console.log(`  · ${c.id} compatible con «${other}», perfil aún no creado`);
    if (c.life.months == null && c.life.basis !== 'por-verificar') err(name, `${c.id}: vida sin meses debe marcarse por-verificar`);
  }

  for (const [key, pr] of Object.entries(p.procedures)) {
    for (const c of pr.cartridges) if (!cartIds.has(c)) err(name, `${key}: cartucho ${c} no existe`);
    const last = pr.steps.at(-1);
    if (!last.register) err(name, `${key}: el último paso debe registrar el cambio`);
    // vista previa gratis = hasta 2 pasos, y siempre antes del primer paso que saca un cartucho
    const firstRemove = pr.steps.findIndex(s => s.removes);
    if (firstRemove < 0) err(name, `${key}: ningún paso marcado removes`);
    const preview = Math.min(2, firstRemove);
    if (preview < 1) err(name, `${key}: la vista previa quedaría vacía`);
    previews.push(`${key}=${preview}/${pr.steps.length}`);
    for (const s of pr.steps) {
      if (s.timer && !s.timerKey) err(name, `${key}/${s.key}: temporizador sin etiqueta`);
      for (const l of langs) {
        const T = texts[l];
        if (!s.register && !(`${s.key}.title` in T)) err(name, `[${l}] falta ${s.key}.title`);
        if (s.register && !(`${s.key}.title` in T)) err(name, `[${l}] falta ${s.key}.title`);
        if (s.timerKey && !(s.timerKey in T)) err(name, `[${l}] falta ${s.timerKey}`);
        // los {param} del texto deben venir en params
        for (const suf of ['title', 'text', 'warn', 'tip']) {
          const str = T[`${s.key}.${suf}`]; if (!str) continue;
          for (const [, v] of str.matchAll(/\{(\w+)\??/g)) if (!(v in (s.params || {}))) err(name, `[${l}] ${s.key}.${suf} usa {${v}} sin params`);
        }
      }
    }
    for (const l of langs) if (!(pr.title in texts[l])) err(name, `[${l}] falta ${pr.title}`);
  }
  for (const c of p.cartridges) for (const l of langs) if (!(c.label in texts[l])) err(name, `[${l}] falta ${c.label}`);
  for (const g of p.lights || []) for (const l of langs) {
    if (!(g.group in texts[l])) err(name, `[${l}] falta ${g.group}`);
    for (const it of g.items) for (const suf of ['title', 'mean', 'act']) if (!(`${it.key}.${suf}` in texts[l])) err(name, `[${l}] falta ${it.key}.${suf}`);
  }
  if (p.indicator.type !== 'ninguno') {
    // todo equipo con luces o pantalla lleva su apartado de estados, con el orden de sus luces
    if (!p.lights?.length) err(name, `indicador «${p.indicator.type}» sin tabla de luces`);
    if (!p.indicator.leds?.length) err(name, 'falta indicator.leds (luces del equipo y su orden)');
    for (const k of ['intro', 'source']) for (const l of langs)
      if (!p.indicator[k]) err(name, `falta indicator.${k}`); else if (!(p.indicator[k] in texts[l])) err(name, `[${l}] falta ${p.indicator[k]}`);
    const ids = new Set((p.indicator.leds || []).map(x => x.id));
    for (const g of p.lights || []) for (const it of g.items) for (const id of Object.keys(it.leds))
      if (!ids.has(id)) err(name, `${it.key}: luz «${id}» no está en indicator.leds`);
    if (!p.indicator.screen && (p.lights || []).some(g => g.items.some(i => i.screen))) err(name, 'estado con pantalla en un equipo sin pantalla');
  }
  if (p.status === 'verificado' && p.cartridges.some(c => c.life.basis === 'por-verificar')) err(name, 'marcado verificado con vidas por verificar');
  console.log(`  vista previa gratis / pasos: ${previews.join(', ')}`);
}

// Enlaces de compra: recambios/enlaces.json, por referencia del cartucho y tienda.
// Se publica aparte de la app, así se corrige un enlace sin sacar versión nueva.
try {
  const L = JSON.parse(readFileSync(join(root, 'recambios/enlaces.json'), 'utf8'));
  const refs = new Map();
  for (const p of profiles) for (const c of p.cartridges) if (c.ref) refs.set(c.ref, [...(refs.get(c.ref) || []), `${p.id}/${c.id}`]);
  const markets = ['es', 'it', 'fr', 'de', 'uk', 'us', 'ca'];
  console.log('\nEnlaces de compra (recambios/enlaces.json):');
  for (const [ref, byStore] of Object.entries(L.links)) {
    if (!refs.has(ref)) err('enlaces', `«${ref}» no es la referencia de ningún cartucho`);
    for (const [m, e] of Object.entries(byStore)) {
      if (!markets.includes(m)) err('enlaces', `${ref}: tienda «${m}» desconocida`);
      if (e.asin !== null && !/^[A-Z0-9]{10}$/.test(e.asin)) err('enlaces', `${ref}/${m}: ASIN «${e.asin}» mal formado`);
      if (!e.checked) err('enlaces', `${ref}/${m}: falta la fecha de comprobación`);
    }
  }
  for (const [k, kit] of Object.entries(L.kits || {})) for (const r of kit.covers) if (!refs.has(r)) err('enlaces', `kit ${k}: «${r}» no es la referencia de ningún cartucho`);
  const viaKit = (ref, m) => Object.values(L.kits || {}).some(k => k.covers.includes(ref) && k.stores[m]);
  for (const [ref, where] of refs) {
    const have = markets.filter(m => L.links[ref]?.[m]?.asin);
    const kit = markets.filter(m => !have.includes(m) && viaKit(ref, m));
    console.log(`  ${ref.padEnd(16)} ${String(have.length).padStart(1)}/7 ${have.join(' ')}${kit.length ? '  · en kit: ' + kit.join(' ') : ''}`);
  }
} catch (e) { if (e.code !== 'ENOENT') throw e; }

console.log(errors ? `\n${errors} error(es)` : '\nTodo correcto');
process.exit(errors ? 1 : 0);
