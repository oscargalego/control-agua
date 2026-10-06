"""Prueba de la app en un navegador (Playwright + Chromium).
- Recorre TODOS los pasos de TODAS las guías de los 14 equipos y comprueba que cada dibujo se pinta sin errores.
- Comprueba la vista previa gratis, el límite de equipos y de mediciones, la migración desde Control Agua (v1).
- Guarda capturas de las pantallas principales en test-output/.
Uso: python3 tools/probar_app.py   (sirve app/ en http://localhost:8765)
"""
import json, os, sys, threading, http.server, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'test-output'); os.makedirs(OUT, exist_ok=True)
PORT = 8765
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.path.join(ROOT, 'app'))
http.server.SimpleHTTPRequestHandler.log_message = lambda *a: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{PORT}/index.html'

fails = []
def check(cond, msg):
    if not cond: fails.append(msg); print('  ✗', msg)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 400, 'height': 860}, device_scale_factor=2, locale='es-ES')
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))

    def fresh(state=None, v1=None):
        pg.goto(URL); pg.evaluate('localStorage.clear()')
        if state: pg.evaluate('s => localStorage.setItem("osmosis-control.v2", JSON.stringify(s))', state)
        if v1: pg.evaluate('s => localStorage.setItem("control-agua.v1", JSON.stringify(s))', v1)
        pg.goto(URL + '#'); pg.reload(); pg.wait_for_timeout(250)
    def shot(name, full=False):
        pg.wait_for_timeout(250); pg.screenshot(path=f'{OUT}/{name}.png', full_page=full)

    raw = open(os.path.join(ROOT, 'app/data/datos.js'), encoding='utf8').read()
    data = json.loads(raw[raw.index('=') + 1:].strip().rstrip(';'))
    P = {x['id']: x for x in data['profiles']}

    # 1. primera vez: elegir equipo
    print('1. Elegir equipo'); fresh()
    check(pg.is_visible('#v-elegir'), 'sin equipos no aparece la pantalla de elegir')
    check(pg.locator('#picklist .pick').count() == len(P), 'la lista no muestra todos los equipos')
    shot('01-elegir', True)
    pg.fill('#q', 'g3'); pg.wait_for_timeout(100)
    check(pg.locator('#picklist .pick').count() == 2, 'la búsqueda «g3» no da 2 equipos')

    # 2. alta gratis y portada en vista previa
    print('2. Alta y vista previa gratis'); pg.fill('#q', '')
    pg.click('[data-p="waterdrop-g3p600"]'); pg.click('#sheet #ok'); pg.wait_for_timeout(400)
    check(pg.is_visible('#v-home .pv-badge'), 'falta el distintivo de vista previa'); shot('02-portada-gratis', True)
    # guía gratis: paso 3 bloqueado (G3 CF saca el cartucho en el paso 4 → vista previa de 2 pasos)
    pg.goto(URL + '#guia-CF'); pg.wait_for_timeout(300)
    pg.keyboard.press('ArrowRight'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(300)
    check(pg.is_visible('.lockstage'), 'el paso 3 de la guía gratis no está bloqueado'); shot('03-guia-bloqueada')
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(200)
    check(pg.inner_text('#proc-n').startswith('3 /'), 'la guía gratis deja pasar del paso bloqueado')
    pg.click('#proc-x'); pg.wait_for_timeout(300)
    # segundo equipo gratis → premium
    pg.goto(URL + '#ajustes'); pg.wait_for_timeout(200); pg.click('#adddev'); pg.wait_for_timeout(300)
    check(pg.is_visible('#sheet .okhead.prem'), 'en gratis se puede añadir un segundo equipo'); pg.click('#sheet button[data-close]'); pg.wait_for_timeout(300)
    # mediciones: una y solo lectura
    pg.goto(URL + '#mediciones'); pg.wait_for_timeout(200); pg.click('#newm'); pg.fill('#tap', '400'); pg.fill('#ro', '12'); pg.click('#sheet #ok'); pg.wait_for_timeout(400)
    pg.click('#newm'); pg.wait_for_timeout(300)
    check(pg.is_visible('#sheet .okhead.prem'), 'en gratis se puede añadir una segunda medición'); pg.click('#sheet button[data-close]'); pg.wait_for_timeout(300)
    shot('04-mediciones-gratis', True)

    # 3. todas las guías de todos los equipos, en premium
    print('3. Todas las guías, paso a paso')
    total = 0
    for pid, prof in P.items():
        st = {'v': 2, 'premium': {'unlocked': True, 'test': True}, 'active': 'd1',
              'devices': [{'id': 'd1', 'profileId': pid, 'profileVersion': prof['version'], 'name': 'Prueba', 'cartridges': {}}],
              'history': [], 'measures': [], 'settings': {'store': 'es', 'theme': 'dark'}}
        fresh(st)
        check(pg.locator('#front svg').count() == 1, f'{pid}: la portada no tiene dibujo')
        hot = pg.locator('#front .hot').count()
        check(hot == len(prof['cartridges']), f'{pid}: {hot} zonas tocables para {len(prof["cartridges"])} cartuchos')
        for k, pr in prof['procedures'].items():
            pg.goto(URL + '#guia-' + k); pg.wait_for_timeout(120)
            for i, s in enumerate(pr['steps']):
                n = pg.inner_text('#proc-n')
                check(n.startswith(f'{i + 1} /'), f'{pid}/{k}: esperaba paso {i + 1}, está en {n}')
                svg = pg.locator('#proc-ill svg').count()
                h2 = pg.inner_text('#proc-txt h2') if pg.locator('#proc-txt h2').count() else ''
                check(svg == 1, f'{pid}/{k} paso {i + 1} ({s["scene"][0]}): sin dibujo')
                check(h2 and not h2.startswith(s['key']), f'{pid}/{k} paso {i + 1}: título sin texto ({h2})')
                total += 1
                pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(40)
            pg.click('#proc-x'); pg.wait_for_timeout(120)
        for v in ['filtros', 'recambios', 'luces']:
            pg.goto(URL + '#' + v); pg.wait_for_timeout(120)
            check('ui.' not in pg.inner_text('#v-' + v), f'{pid}/{v}: hay una clave de texto sin traducir')
    print(f'   {total} pasos recorridos')

    # 4. capturas en premium (G3P600 y Frizzlife), claro y oscuro
    print('4. Capturas premium')
    st = {'v': 2, 'premium': {'unlocked': True, 'test': True}, 'active': 'd1',
          'devices': [{'id': 'd1', 'profileId': 'waterdrop-g3p600', 'profileVersion': 1, 'name': 'Casa',
                       'cartridges': {'CB': {'installed': '2026-01-10', 'approx': False, 'lifeMonths': 12},
                                      'CF': {'installed': '2026-04-20', 'approx': False, 'lifeMonths': 6},
                                      'RO': {'installed': '2025-02-01', 'approx': True, 'lifeMonths': 24}}},
                      {'id': 'd2', 'profileId': 'frizzlife-pd600', 'profileVersion': 1, 'name': 'Apartamento playa', 'cartridges': {}}],
          'history': [], 'measures': [{'id': 'm1', 'deviceId': 'd1', 'ts': 1759600000000, 'tap': 420, 'ro': 18, 'note': ''}],
          'settings': {'store': 'es', 'theme': 'dark'}}
    fresh(st); shot('10-portada-premium', True)
    for v in ['filtros', 'recambios', 'luces', 'ajustes']:
        pg.goto(URL + '#' + v); shot(f'11-{v}', True)
    pg.goto(URL + '#guia-RO'); pg.wait_for_timeout(200)
    for _ in range(10): pg.keyboard.press('ArrowRight')
    shot('12-guia-purga')
    pg.click('#proc-x'); pg.goto(URL + '#'); pg.click('#devbtn'); shot('13-selector-equipos')
    st['settings']['theme'] = 'light'; st['active'] = 'd2'; fresh(st); shot('14-frizzlife-claro', True)
    pg.goto(URL + '#recambios'); shot('15-recambios-frizzlife', True)

    # 5. migración desde la app anterior
    print('5. Migración desde Control Agua v1')
    v1 = {'v': 1, 'filters': {'CF': {'installed': '2026-10-04', 'approx': False, 'lifeMonths': 12},
                              'MRO': {'installed': '2025-10-05', 'approx': True, 'lifeMonths': 24}},
          'history': [{'id': 'h1', 'f': 'CF', 'date': '2026-10-04', 'approx': False, 'note': 'x'}],
          'measures': [{'id': 'm1', 'ts': 1759600000000, 'tap': 400, 'ro': 15, 'note': ''}],
          'settings': {'warnDays': 20, 'theme': 'dark'}}
    fresh(v1=v1)
    s = pg.evaluate('JSON.parse(localStorage.getItem("osmosis-control.v2"))')
    check(s and s['devices'][0]['profileId'] == 'waterdrop-g2', 'la migración no crea el equipo G2')
    check(s and s['premium']['unlocked'], 'la migración no conserva premium')
    check(s and len(s['history']) == 1 and len(s['measures']) == 1 and s['settings']['warnDays'] == 20, 'la migración pierde datos')
    shot('16-migrado-g2', True)

    check(not errs, 'errores de JavaScript: ' + ' | '.join(errs[:5]))
    b.close()
srv.shutdown()
print('\n' + (f'{len(fails)} fallo(s)' if fails else 'Todo correcto'))
sys.exit(1 if fails else 0)
