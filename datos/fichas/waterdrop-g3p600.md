# Ficha de geometría · Waterdrop G3P600

Estado: frontal dibujado · 6 oct 2026. Cada dato lleva su fuente; lo dudoso no se dibuja como seguro.

## Cartuchos (3)

| Cartucho | Ref. | Contenido | Vida | Reset | Purga | Fuente |
| --- | --- | --- | --- | --- | --- | --- |
| CF | WD-G3-CF (también vendido como G3-N1CF) | Prefiltro compuesto | Hasta 6 meses | Mantener el indicador del CF 7 s, pitido y azul fijo | 5 min **sin abrir el grifo**, hasta que el panel frontal muestre el TDS | Hoja WD-G3-CF |
| RO | WD-G3P600-RO | Membrana de ósmosis | 24 meses o 2.200 gal | Mantener el indicador del RO 7 s, pitido y azul fijo | 30 min con el grifo abierto, hasta que panel y grifo muestren el TDS | Hoja WD-G3P600-RO |
| CB | WD-G3-N3CB | Bloque de carbón de coco (posfiltro) | 12 meses o 1.100 gal | 7 s hasta el pitido (manual) | 15 min con el grifo abierto (manual) | Web Waterdrop UK; hoja WD-G3P600-RO |

Compatibilidades: el CF y el CB sirven en G3-W, G3P600 y G3P800; el RO del G3P600 no se recomienda en el G3P800.

## Gesto de cambio (común a los tres)

1. Cerrar el grifo y esperar 30 s para liberar la presión interna.
2. En el CF, pulsar el botón central de la tapa del cartucho viejo para liberar presión antes de sacarlo.
3. Girar el viejo en sentido antihorario y sacarlo.
4. Quitar el plástico retráctil y el tapón protector del nuevo.
5. Meterlo con la flecha frente al círculo vacío.
6. Empujar un poco y girar ¼ de vuelta en sentido horario hasta que la flecha quede frente al círculo relleno; suena un clic.

Es el mismo gesto que en el G2 (flecha, círculo vacío y círculo relleno), así que las escenas del G2 se pueden reutilizar.

## Diferencias con el G2 que afectan al dibujo

- **3 cartuchos en lugar de 2**: hay que dibujar el CB.
- **Pantalla frontal con lectura de TDS**: el G2 solo tiene luces. El final de la purga se reconoce porque aparece el TDS.
- **Grifo con pantalla de TDS.**
- **La purga del CF no necesita abrir el grifo.**

## Frontal (resuelto con la foto oficial del producto)

- Tres tapas en columna, de arriba abajo: **CB** (la más pequeña), **CF** y **RO** (la más grande).
- Cada tapa tiene una pala gris, ancha arriba y estrecha abajo, con un triángulo y el nombre del cartucho.
- Marcas alrededor de cada tapa: **círculo vacío a la izquierda (OFF)**, **punto relleno arriba (ON)** y una flecha de giro horario entre ambos. Coincide con la hoja de los cartuchos.
- Arriba: tres indicadores redondos **CB · CF · RO** y una pantalla con el rótulo **TDS OUT**.
- El grifo también tiene pantalla de TDS.

Dibujos: `ilustraciones/frontal-g3p600.js` (portada) y `ilustraciones/escenas-g3p600.js` (pasos de cambio), esquemas propios sin logotipo. Perfil: `perfiles/waterdrop-g3p600.json` (borrador).

## Pendiente

- [x] Purga del CB: **15 min con el grifo abierto**, según el manual del G3P600 (resuelto 6 oct 2026; sustituye a la decisión provisional de purgar sin temporizador).
- [x] Reset del CB: **7 s hasta el pitido**, confirmado por el manual (6 oct 2026).
- [x] Botón de alivio del CF: se deja como está, con el aviso «si no lo ves, sigue» (decidido 6 oct 2026).
- [ ] Revisión del dibujo por alguien que tenga el equipo.

## Fuentes

- Foto oficial del producto (frontal): https://www.waterdropfilter.co.uk/collections/lead/products/waterdrop-reverse-osmosis-water-filtration-system (consultada el 6 oct 2026)

- Hoja WD-G3P600-RO: https://www.manualslib.com/manual/3434003/Waterdrop-Wd-G3p600-Ro.html
- Hoja WD-G3-CF: https://www.manualslib.com/manual/3762731/Waterdrop-Wd-G3-Cf.html
- Cartucho WD-G3-N3CB: https://www.waterdropfilter.co.uk/products/waterdrop-wd-g3-n3cb-filter-replacement
- Compatibilidades CF/CB del G3: https://www.walmart.com/ip/395871699

## Luces y avisos (manual G3P600)

- Azul: más de 15 días o 40 gal. Amarillo: menos de 15 días o 40 gal, pita 2 veces al servir. Rojo: caducado, pita sin parar al servir.
- Al estrenarlo o tras un corte de luz: azul, amarillo y rojo por turnos y después azul (purga de 5 min).
- Códigos: E02 fuga interna (pitido continuo); E03 bomba sobrecargada (pita 3 min); E04 la bomba arranca y para a menudo (5 pitidos). E03 y E04: desenchufar y volver a enchufar.
- Corrección: los dibujos usaban morado para «queda poco», heredado del G2. En el G3 es **amarillo**.
- Manual: https://manuals.plus/m/f54dbc3f862582ef4ba2bc24618f3a34672ea48a151c2c31c820a9399ac62f0d
