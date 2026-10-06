/* Configuración que no son datos de los equipos. */
'use strict';
window.OC_CONFIG = {
  version: '2.0.0-dev',
  // Lista de enlaces de compra publicada aparte: se corrige sin sacar versión nueva de la app.
  // Vacío = usar solo la copia que trae la app.
  remoteLinks: '',
  // Etiqueta de afiliado de Amazon por tienda (la añade la app al construir el enlace). Vacío = sin etiqueta.
  affiliate: { es: '', it: '', fr: '', de: '', uk: '', us: '', ca: '' },
  amazon: { es: 'www.amazon.es', it: 'www.amazon.it', fr: 'www.amazon.fr', de: 'www.amazon.de', uk: 'www.amazon.co.uk', us: 'www.amazon.com', ca: 'www.amazon.ca' },
  // Vista previa gratis: pasos completos de la guía antes del primer paso en que se saca un cartucho
  previewMaxSteps: 2,
  priceLabel: '4,99 €',
};
