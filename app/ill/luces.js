/* Fila de luces de cualquier equipo para el apartado «Luces» (generaliza la del G2).
   Lee indicator.leds del perfil (orden y etiquetas) y el estado de cada luz del item.
   Una luz que el item no nombra se dibuja en gris punteado: el manual no dice su estado.
   Si el item trae «screen», se dibuja la pantalla con ese texto. */
'use strict';

function lucesMini(indicator, item) {
  const leds = indicator.leds || [];
  const cells = leds.map(({ id, label }) => {
    const st = item.leds[id];
    return `<span><i class="led2 ${st ? 'l-' + st : 'l-na'}"></i><small>${label}</small></span>`;
  }).join('');
  const scr = item.screen ? `<b class="leds-scr">${item.screen}</b>` : '';
  const snd = item.sound && item.sound !== 'ninguno' ? `<em class="leds-snd" title="${item.sound}">🔔</em>` : '';
  return `<div class="leds" style="grid-template-columns:repeat(${Math.max(1, leds.length)},22px)">${scr}${cells}${snd}</div>`;
}
/* CSS nuevo para la app:
.l-yellow{background:#f5c542;box-shadow:0 0 8px #f5c542}
.l-na{background:none;border:1.5px dashed #9aa3ad;width:6px;height:6px}
.l-cycleyellow{animation:cycy 2.4s steps(1) infinite}
@keyframes cycy{0%{background:#3b9bff;box-shadow:0 0 8px #3b9bff}33%{background:#f5c542;box-shadow:0 0 8px #f5c542}66%{background:#ff3d55;box-shadow:0 0 8px #ff3d55}}
.leds{position:relative}
.leds-scr{grid-column:1/-1;justify-self:center;font:600 12px ui-monospace,monospace;color:#4b535e;background:#e9edf1;border-radius:6px;padding:2px 6px;margin-bottom:4px;white-space:nowrap}
.leds-snd{position:absolute;right:-6px;top:-8px;font-style:normal;font-size:12px}
*/
if (typeof module !== 'undefined') module.exports = { lucesMini };
