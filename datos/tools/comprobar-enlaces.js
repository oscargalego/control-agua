/* Comprobación mensual de enlaces de compra.
   Uso: abrir la portada de cada Amazon (amazon.es, .it, .fr, .de, .co.uk, .com, .ca) con una
   dirección de entrega local, abrir la consola y pegar este archivo seguido de:
     comprobar(<contenido de recambios/enlaces.json>)
   Devuelve los enlaces de esa tienda que ya no se pueden comprar o han cambiado de producto. */
async function comprobar(L) {
  const m = { 'www.amazon.es': 'es', 'www.amazon.it': 'it', 'www.amazon.fr': 'fr', 'www.amazon.de': 'de',
    'www.amazon.co.uk': 'uk', 'www.amazon.com': 'us', 'www.amazon.ca': 'ca' }[location.hostname];
  const items = [...Object.entries(L.links).map(([ref, s]) => [ref, s[m]]),
    ...Object.entries(L.kits || {}).map(([k, v]) => [k, v.stores[m]])].filter(([, e]) => e);
  const fallos = [];
  for (const [ref, e] of items) {
    const r = await fetch('/dp/' + e.asin, { credentials: 'include' });
    let estado = 'OK', titulo = '';
    if (r.status === 404) estado = 'NO EXISTE';
    else {
      const d = new DOMParser().parseFromString(await r.text(), 'text/html');
      titulo = ((d.querySelector('#productTitle') || {}).textContent || '').trim();
      if (!titulo) estado = 'SIN FICHA';
      else if (!d.querySelector('#add-to-cart-button, #buy-now-button')) estado = 'NO SE PUEDE COMPRAR';
      else if (!titulo.toUpperCase().includes(ref.replace(/^(WD-|ROPOT-)/, '').split('-')[0])) estado = 'REVISAR TÍTULO';
    }
    if (estado !== 'OK') fallos.push({ ref, asin: e.asin, estado, titulo: titulo.slice(0, 80) });
    await new Promise(z => setTimeout(z, 1500 + Math.random() * 1000));
  }
  console.table(fallos);
  return fallos;
}
