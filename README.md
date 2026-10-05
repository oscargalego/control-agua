# Control Agua

PWA personal para el mantenimiento del sistema de ósmosis **Waterdrop G2 (WD-G2-W)**.

- **Portada:** frontal del equipo (ilustración propia). Tocar un cartucho abre su cambio paso a paso. Las luces y los anillos muestran el estado estimado de cada filtro.
- **Cambio de filtros:** CF, MRO o ambos a pantalla completa, con dibujos, deslizar o botones, temporizadores (30 s de presión, purgas de 5 y 30 min) y registro del cambio con fecha editable. Historial y aviso en Google Calendar.
- **Recambios:** originales en Amazon.es y estado de los compatibles.
- **Mediciones ppm:** grifo y ósmosis con fecha automática editable, nota, % de rechazo y alertas por umbral.
- **Luces:** significado de cada indicador según el manual del G2.
- **Ajustes:** fechas de instalación, vida de cada filtro, antelación del aviso, umbrales, tema oscuro/claro y copia de seguridad.

Los datos se guardan solo en el móvil (`localStorage`). La vida útil se calcula por tiempo; la luz del equipo, que también cuenta litros, es la referencia.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la rama `main` del repositorio `control-agua`.
2. *Settings → Pages → Deploy from a branch → main / (root)*.
3. Abre `https://oscargalego.github.io/control-agua/` en Chrome del móvil → menú ⋮ → *Instalar aplicación*.

Al publicar una versión nueva, sube el número de `CACHE` en `sw.js` y `VERSION` en `app.js`.

## Fuentes

- Manual del usuario Waterdrop G2 (WD-G2-W): indicadores, reset, purgado y avisos de avería.
- Hojas de instrucciones de los cartuchos WD-G2CF y WD-G2MRO.
