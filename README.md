# Osmosis Control

Guía de mantenimiento para equipos de ósmosis inversa: cambio de filtros paso a paso con dibujos, vida de cada cartucho, recambios en Amazon, luces del equipo y mediciones TDS.

> Rama `osmosis-control`: app multimodelo en desarrollo. La rama `main` sigue siendo **Control Agua** (solo Waterdrop G2), la versión estable publicada.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `datos/perfiles/` | Un JSON por equipo (14): cartuchos, vidas, guías, luces |
| `datos/i18n/` | Textos por idioma (`es.json`; claves `ui.*` para la interfaz) |
| `datos/recambios/enlaces.json` | Enlaces exactos de Amazon por referencia y tienda (se publican aparte) |
| `datos/schema/`, `datos/tools/validar.mjs` | Esquema y comprobación automática de los perfiles |
| `datos/fichas/`, `datos/ESPECIFICACION.md` | Fuentes y decisiones de cada equipo; especificación del modelo de datos |
| `app/` | La app web (lo que empaquetará Capacitor): `index.html`, `js/`, `css/`, `ill/` (dibujos), `data/datos.js` (generado) |
| `tools/build.mjs` | Valida `datos/` y genera `app/data/datos.js` |
| `tools/probar_app.py` | Prueba en navegador: recorre todas las guías y saca capturas a `test-output/` |

## Uso

```bash
npm install          # ajv para el validador
npm run build        # valida y genera app/data/datos.js
python3 tools/probar_app.py
python3 -m http.server -d app 8000   # y abrir http://localhost:8000
```

## Gratis y premium

Gratis: elegir equipo, portada, luces, recambios, una medición y los primeros pasos de cada guía (nunca llega al paso en que se saca un cartucho). Premium (pago único): guías completas, vida de los filtros y avisos, historial, mediciones sin límite y varios equipos. En la versión web de pruebas premium se activa sin pago desde Ajustes → Pruebas.
