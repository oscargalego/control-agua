# Modelo de datos de la app multimodelo

Versión 1 · 6 oct 2026 · Validado con tres perfiles de tipos distintos: Waterdrop G2, equipo clásico de 5 etapas (genérico) y Bluevua ROPOT (sobremesa).

## 1. Estructura de archivos

```
perfiles/<id>.json       un archivo por equipo (datos, pasos, recambios, luces)
i18n/<idioma>.json       textos: es, en, pt, fr, de, it
schema/perfil.schema.json   esquema que valida cada perfil
tools/validar.mjs        comprobación automática (esquema + coherencia + textos)
```

Regla de oro: **los perfiles no contienen texto visible**, solo claves. Así un perfil se escribe una vez y se traduce en `i18n/`.

## 2. El perfil de equipo

| Campo | Qué es | Ejemplo |
| --- | --- | --- |
| `id` | Identificador único, igual que el nombre del archivo | `waterdrop-g2` |
| `brand`, `model`, `aliases` | Para el buscador de modelo | `Waterdrop`, `G2`, `["WD-G2-W"]` |
| `category` | `bajo-fregadero-sin-deposito`, `clasico-con-deposito`, `sobremesa` | |
| `generic` | `true` si el perfil cubre muchas marcas | perfil de 5 etapas |
| `markets` | Tiendas donde se vende (ordena el buscador por país) | `["es","de","us"]` |
| `illustration` | Juego de dibujos que usa | `frontal-g2` |
| `indicator.type` | `ninguno`, `luces` o `pantalla` | |
| `indicator.leds` | Luces del equipo en orden, con su etiqueta; con `screen`, `intro` y `source` | `CB · CF · RO` |
| `lights` | Apartado «Luces»: qué ves, qué significa, qué hacer. Obligatorio en todo equipo con luces o pantalla | 10 estados del G2 |
| `cartridges` | Lista de cartuchos | ver 2.1 |
| `procedures` | Procedimientos de cambio | ver 2.2 |
| `sources` | Manuales y fuentes, con fecha de consulta | |
| `status` | `borrador` o `verificado` | |

### 2.1 Cartucho

- `id` corto en mayúsculas (`CF`, `MRO`, `S1`…), `ref` del fabricante o `null` en genéricos.
- `stages`: qué contiene (`sedimentos`, `carbon-bloque`, `membrana-ro`…).
- `life.months` y `life.liters`, con `basis`: `manual`, `web-fabricante`, `orientativo` o `por-verificar`. Si falta el dato, `months: null` y `por-verificar`; un perfil `verificado` no puede tener vidas por verificar.
- `fitting`: `bayoneta`, `vaso-roscado`, `inline-rapido`, `giro-sobremesa`. Decide dibujos y avisos (los vasos roscados llevan llave y juntas).
- `compatibleWith`: otros perfiles que usan el mismo cartucho (WD-G2CF sirve en G2 y G2P600).
- Enlaces de compra: **no van en el perfil**, sino en `recambios/enlaces.json`, por referencia del cartucho y por tienda (`"WD-G3-CF": {"es": {"asin": …, "title": …, "checked": …}}`). Ese archivo se publica aparte y la app lo descarga, así un enlace roto se corrige sin sacar versión nueva. Sin enlace en un país, la app usa `parts.search` (marca + referencia) como búsqueda en ese Amazon.
- Junto al botón de compra la app muestra siempre la referencia, para que el usuario compruebe que coincide con la ficha de Amazon.
- `parts.notThis`: recambios parecidos que no sirven (G2P6MRO no vale para el G2).

### 2.2 Procedimiento y pasos

Cada procedimiento indica qué cartuchos cambia y su lista de pasos. Un equipo puede tener varios (`CF`, `MRO`, `AMBOS`). Cuando el manual describe un cambio conjunto distinto, se escribe explícito, como la purga única de 30 min del G2.

Cada paso:

| Campo | Uso |
| --- | --- |
| `key` | Clave de texto: `<key>.title`, `.text`, `.warn`, `.tip` |
| `params` | Valores para el texto: `{ "min": 30 }` |
| `scene` | Dibujo que se muestra: `["twistOut", "CF"]` |
| `timer`, `timerKey` | Temporizador en segundos y su etiqueta |
| `removes` | Paso en que se saca un cartucho |
| `critical` | Paso que no se puede saltar (seguridad, reset, purgado): se resalta |
| `register` | Último paso: registra el cambio |

Reglas que comprueba el validador:

1. Todo cartucho tiene al menos un procedimiento.
2. El último paso siempre registra el cambio.
3. Cada procedimiento marca el paso `removes`.
4. Todo `{param}` del texto viene en `params`, y todas las claves existen en cada idioma.
5. Todo equipo con luces o pantalla tiene su apartado «Luces», con el orden de sus luces, y cada estado solo nombra luces que existen. Una luz que el manual no describe en un estado se dibuja punteada: nunca se inventa su color.

## 3. Textos e idiomas

- Un archivo plano por idioma: `"wd-g2.purga.title": "Purga {min} minutos"`.
- `{param}` se sustituye por el valor del paso.
- `{param? texto}` muestra el texto solo si el parámetro es verdadero (lo usa el reset del G2 para la frase «si solo había caducado este filtro…»).
- Prefijos: `comun.*` para pasos que comparten varios equipos; `<prefijo-perfil>.*` para lo específico.
- Sin traducción en un idioma, la app usa el inglés y, si falta, el castellano. El validador avisa de cada clave ausente.
- Unidades: litros en Europa y LATAM, galones en EE. UU. La vida en litros se guarda siempre en litros.

## 4. Vista previa gratis y premium

| Función | Gratis | Premium |
| --- | --- | --- |
| Buscar y elegir modelo | Sí | Sí |
| Portada con su equipo e interfaz | Sí, con distintivo «Vista previa» | Sí |
| Guía de cambio | Lista de pasos + pasos completos hasta `min(2, primer paso removes)` | Completa |
| Avisos de cambio y vida de filtros | No | Sí |
| Registro de TDS | 1 registro, solo lectura | Ilimitado |
| Historial, varios equipos | No | Sí |
| Enlaces a recambios | Sí | Sí |

**La vista previa nunca llega al paso en que se saca un cartucho.** En el Bluevua el segundo paso ya es sacar el filtro, así que su vista previa es de 1 paso. Así nadie empieza a desmontar el equipo con la guía incompleta.

## 5. Datos del usuario (versión 2)

```json
{
  "v": 2,
  "premium": { "unlocked": false, "since": null },
  "devices": [
    {
      "id": "d1",
      "profileId": "waterdrop-g2",
      "profileVersion": 1,
      "name": "Cocina",
      "cartridges": {
        "CF":  { "installed": "2026-10-04", "approx": false, "lifeMonths": 12 },
        "MRO": { "installed": "2025-10-05", "approx": true,  "lifeMonths": 24 }
      }
    }
  ],
  "history":  [{ "id": "…", "deviceId": "d1", "cartridge": "CF", "date": "2026-10-04", "approx": false, "note": "" }],
  "measures": [{ "id": "…", "deviceId": "d1", "ts": 1759600000000, "tap": 420, "ro": 18, "note": "" }],
  "settings": { "lang": "es", "store": "es", "units": "l", "warnDays": 30, "minRejection": 80, "maxRo": 50, "theme": "dark" }
}
```

- `lifeMonths` se copia del perfil al crear el equipo y el usuario puede cambiarlo.
- `profileVersion` permite avisar si un perfil se corrige después.
- `settings.store` decide la tienda Amazon de los enlaces y se propone según el país del móvil.
- Gratis: como máximo 1 equipo y 1 medición; la app lo comprueba al guardar.

### Varios equipos (premium)

Pensado, por ejemplo, para una segunda residencia:

- Cada equipo tiene un **nombre** que pone el usuario («Casa», «Apartamento playa») y puede ser de un modelo distinto.
- **Avisos, historial y mediciones van por equipo.** Cada aviso dice de qué equipo y qué cartucho es: «Apartamento playa · CF: cámbialo en 30 días».
- La portada muestra el equipo activo y un selector arriba para cambiar de uno a otro.
- Los recambios se agrupan por equipo; si dos equipos usan el mismo cartucho, la app lo indica.
- En gratis, al intentar añadir un segundo equipo aparece el aviso de premium.
- Si un usuario premium deja de serlo (reembolso), conserva todos sus datos, pero solo puede usar su primer equipo.

### Migración desde la app actual (v1 → v2)

Los datos de la PWA (`control-agua.v1`) se convierten así: `filters.CF/MRO` pasa a `devices[0].cartridges`, con `profileId: "waterdrop-g2"`; `history[].f` pasa a `cartridge`, y a cada registro se le añade `deviceId`. Como la app nativa tendrá otro origen, el traspaso se hará con **exportar desde la PWA e importar en la app**.

## 6. Pendiente de decidir

- Dibujos: el G2 tiene ilustraciones propias. Para el resto, propongo un juego por tipo de montaje (`bayoneta`, `vaso-roscado`, `giro-sobremesa`) en vez de uno por modelo, y una portada por categoría.
- Perfil genérico: confirmar pasos y vidas con los manuales de ATH, Bbagua e iSpring antes de marcarlo verificado.
- Bluevua: completar vidas útiles y el último paso del reset con el manual oficial.
