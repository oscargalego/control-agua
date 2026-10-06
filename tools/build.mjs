// Empaqueta los datos para la app: valida perfiles y textos, y genera app/data/datos.js
// (un único script, sin fetch, para que funcione igual en GitHub Pages, en local y dentro de Capacitor).
// Uso: npm run build
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = p => join(root, 'datos', p);

// 1. Validación: si falla, no se genera nada
try { execFileSync('node', [D('tools/validar.mjs')], { stdio: 'pipe' }); }
catch (e) { process.stdout.write(e.stdout?.toString() || ''); console.error('\nValidación con errores: no se genera el paquete.'); process.exit(1); }

// 2. Datos
const profiles = readdirSync(D('perfiles')).filter(f => f.endsWith('.json')).sort()
  .map(f => JSON.parse(readFileSync(D('perfiles/' + f), 'utf8')));
const i18n = Object.fromEntries(readdirSync(D('i18n')).filter(f => f.endsWith('.json'))
  .map(f => [f.replace('.json', ''), JSON.parse(readFileSync(D('i18n/' + f), 'utf8'))]));
const links = JSON.parse(readFileSync(D('recambios/enlaces.json'), 'utf8'));

const out = { built: new Date().toISOString(), profiles, i18n, links };
mkdirSync(join(root, 'app/data'), { recursive: true });
writeFileSync(join(root, 'app/data/datos.js'),
  '/* Generado por tools/build.mjs a partir de datos/. No editar a mano. */\nwindow.OC_DATA = ' + JSON.stringify(out) + ';\n');
console.log(`Paquete generado: ${profiles.length} perfiles, idiomas ${Object.keys(i18n).join(', ')}, enlaces ${links.version}.`);
