# Enlaces de compra

`enlaces.json` guarda el enlace exacto de Amazon (ASIN) de cada cartucho original, por tienda. Comprobado el 6 oct 2026 abriendo la ficha de cada producto en las 7 tiendas: solo se guarda si la ficha existe y tiene botón de compra.

- **Se publica aparte de la app**: la app lo descarga, así un enlace roto se corrige sin sacar versión nueva.
- **Sin enlace en una tienda**, la app usa la búsqueda del perfil (marca + referencia).
- **Kits**: Bluevua vende la membrana RO solo dentro de kits. `ROPOT-SET4` trae los 4 filtros; `ROPOT-SET1Y` trae PP, CTO y PCF (el cambio anual).
- **Revisión mensual**: `tools/comprobar-enlaces.js` lista los enlaces que han dejado de funcionar.
- `comprobaciones/<tienda>.tsv`: resultado bruto de la comprobación (referencia, ASIN, estado, precio visto).

## Huecos (la app usa la búsqueda)

| Referencia | Sin enlace en | Motivo |
| --- | --- | --- |
| WD-G3P800-N2RO, WD-G5P500-CF, WD-G5P500A-CF | uk | Ficha sin oferta de compra |
| WD-K19RFG | us, ca | No se vende o sin oferta |
| FP15 | uk | Sin oferta de compra |
| FT15, FA15 | us | El FT15/FA15 original sin oferta; existen FT15-N y FA15-N, variantes nuevas no comprobadas como equivalentes |
| FA15 | uk | Sin oferta de compra |
| M2S (JIMMY) | es, it, fr, de | Ficha sin oferta de compra (agotado) |
| ROPOT-RO | todas | Solo se vende en el kit de 4 |
| ROPOT-PCF | fr | Sin oferta; queda el kit de 4 |

## Avisos

- En Europa los filtros sueltos del Bluevua cuestan unos 75–85 € (vendedor de importación) frente a unos 30 $ en EE. UU. El kit suele salir más barato.
- En EE. UU. y Canadá, Waterdrop usa fichas distintas a las europeas para G2MRO, G2P6MRO, G3P800, G5P500 y K19RF.
- El ASIN `B0DM1Y3QV3` («G3-N2RO») es la membrana del **G3-W**, no del G3P600: no se usa.
