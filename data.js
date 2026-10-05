/* Contenido: procedimientos, luces y recambios.
   Fuente: manual del usuario Waterdrop G2 (WD-G2-W) y hojas de instrucciones WD-G2CF / WD-G2MRO. */
'use strict';

const DATA = (() => {
  const swap = (f) => {
    const mro = f === 'MRO';
    return [
      { scene: ['closeTap'], title: 'Cierra el grifo de ósmosis',
        text: 'Cierra el grifo y espera 30 segundos para que se libere la presión interna. Así el cartucho sale y entra con menos esfuerzo.',
        timer: 30, timerLabel: 'Espera de presión' },
      { scene: ['grip', f], title: mro ? 'Sujeta el MRO con las dos manos' : 'Sujeta el CF con una mano',
        text: mro
          ? 'El MRO es el cartucho largo (abajo) y pesa unos 2 kg. Sujétalo con las dos manos o apóyalo desde abajo.'
          : 'El CF es el cartucho corto (arriba). Sujétalo con una mano por debajo: al soltarse puede caerse.' },
      { scene: ['twistOut', f], title: 'Gira en sentido antihorario',
        text: `Con la otra mano gira el ${f} en sentido antihorario hasta que se suelte.` },
      { scene: ['pullOut', f], title: 'Sácalo en vertical',
        text: mro
          ? 'Sácalo manteniéndolo vertical sobre el trapo: retiene más agua que el CF. Mételo en la bolsa.'
          : 'Sácalo sobre el trapo. Caerá algo de agua: mantenlo vertical y mételo en la bolsa.' },
      { scene: ['unwrap', f], title: 'Prepara el cartucho nuevo',
        text: `Quita el envoltorio retráctil del ${f} nuevo y el tapón protector de la boca justo antes de colocarlo.`,
        warn: 'Si el tapón se queda puesto, el cartucho goteará o no encajará.' },
      { scene: ['insert', f], title: 'Introdúcelo en posición OFF',
        text: 'Mete el cartucho en su hueco con la flecha (punto) del cartucho alineada con el círculo vacío de la carcasa.',
        tip: 'La posición de las marcas del dibujo es orientativa: guíate por los símbolos de tu equipo.' },
      { scene: ['twistIn', f], title: 'Gira ¼ de vuelta horario',
        text: 'Empuja ligeramente y gira 90° en sentido horario hasta que la flecha quede frente al círculo relleno (ON). Puede oírse un clic.' },
      { scene: ['leak', f], title: 'Comprueba que no gotea',
        text: 'Revisa la boca del cartucho y debajo del equipo. Si gotea: sácalo, comprueba que no queda el tapón y vuelve a girar hasta el círculo relleno.' },
    ];
  };

  const reset = (f, single = true) => [
    { scene: ['resetHold'], title: 'Reset: mantén pulsado 5 s',
      text: 'Con las manos secas, mantén pulsado el botón de reset (el círculo con la flecha, arriba del todo) 5 segundos y suéltalo al oír el pitido.',
      warn: 'No dejes pasar más de 3 s entre este paso y los dos siguientes, o el equipo sale del modo reset.' },
    { scene: ['resetSelect', f], title: `Elige el ${f}`,
      text: `Pulsa el botón para seleccionar el ${f}: su indicador parpadea.` +
        (single ? ' Si solo había caducado este filtro, este paso no hace falta.' : '') },
    { scene: ['resetDone', f], title: 'Confirma: mantén 5 s',
      text: `Vuelve a mantenerlo pulsado 5 segundos. Un pitido confirma el reset y el indicador del ${f} queda azul fijo.`,
      tip: 'Si sigue morado o rojo, repite el reset completo desde el primer paso.' },
  ];

  const flush = (min) => ({
    scene: ['flush', min], title: `Purga ${min} minutos`,
    text: `Abre el grifo de ósmosis y deja correr el agua ${min} minutos, hasta que el indicador de la gota pase de parpadear a azul fijo. Esa agua no se bebe: sirve para regar o fregar.`,
    tip: min === 5 ? 'Es normal que al principio salga blanquecina o con aire.' : 'Si cortas antes, al reabrir el grifo el equipo completa la purga.',
    timer: min * 60, timerLabel: 'Purgado'
  });

  const prep = (txt) => ({
    scene: ['prep'], title: 'Antes de empezar',
    text: txt + ' No hace falta cortar el agua ni desenchufar: el G2 cierra el paso solo al sacar el cartucho.'
  });

  const done = { scene: ['done'], title: 'Registra el cambio', text: '', register: true };

  const PROCS = {
    CF: {
      title: 'Cambio del filtro CF', filters: ['CF'],
      steps: [prep('Ten a mano el cartucho WD-G2CF nuevo, un trapo bajo el equipo, un cubo pequeño y una bolsa para el usado.'),
        ...swap('CF'), ...reset('CF'), flush(5),
        { scene: ['leak', 'CF'], title: 'Última revisión', text: 'Comprueba que no hay gotas bajo el equipo tras el purgado.' }, done]
    },
    MRO: {
      title: 'Cambio del filtro MRO', filters: ['MRO'],
      steps: [prep('Ten a mano el cartucho WD-G2MRO nuevo, un trapo bajo el equipo, un cubo pequeño y una bolsa grande para el usado.'),
        ...swap('MRO'), ...reset('MRO'), flush(30),
        { scene: ['leak', 'MRO'], title: 'Última revisión', text: 'Comprueba que no hay gotas bajo el equipo tras el purgado.' }, done]
    },
    BOTH: {
      title: 'Cambio de CF y MRO', filters: ['CF', 'MRO'],
      steps: [prep('Ten a mano los dos cartuchos nuevos (WD-G2CF y WD-G2MRO), trapo, cubo y bolsas. Primero el CF, luego el MRO, de uno en uno.'),
        ...swap('CF').map(s => ({ ...s, title: 'CF · ' + s.title })),
        ...reset('CF', false).map(s => ({ ...s, title: 'CF · ' + s.title })),
        ...swap('MRO').map(s => ({ ...s, title: 'MRO · ' + s.title })),
        ...reset('MRO', false).map(s => ({ ...s, title: 'MRO · ' + s.title })),
        { ...flush(30), title: 'Purga única de 30 minutos',
          text: 'Con los dos cambiados, abre el grifo de ósmosis y deja correr el agua 30 minutos, hasta que el indicador de la gota quede azul fijo. Esa agua no se bebe.' },
        { scene: ['leak', 'MRO'], title: 'Última revisión', text: 'Comprueba que no hay gotas bajo el equipo tras el purgado.' }, done]
    }
  };

  /* Luces: [leds del dibujo, título, significado, acción] */
  const LIGHTS = [
    { group: 'Funcionamiento normal', items: [
      { leds: { drop: 'blue', CF: 'blue', MRO: 'blue', pwr: 'blue' }, title: 'Gota y ⚡ azul fijo',
        mean: 'El equipo está produciendo agua.', act: 'Nada.' },
      { leds: { drop: 'off', CF: 'blue', MRO: 'blue', pwr: 'blue' }, title: 'Gota apagada, el resto encendido',
        mean: 'En reposo: el equipo no está produciendo agua.', act: 'Nada.' },
      { leds: { drop: 'blink', CF: 'blue', MRO: 'blue', pwr: 'blue' }, title: 'Gota parpadeando',
        mean: 'Purgando (tras la puesta en marcha o un cambio de filtro).', act: 'Deja correr el agua hasta que quede azul fijo. No la bebas.' },
      { leds: { drop: 'cycle', CF: 'cycle', MRO: 'cycle', pwr: 'cycle' }, title: 'Azul → morado → rojo y azul 3 s',
        mean: 'Secuencia de arranque al enchufar el equipo, con pitido.', act: 'Nada.' },
    ]},
    { group: 'Vida de los filtros (CF / MRO)', items: [
      { leds: { drop: 'off', CF: 'blue', MRO: 'blue', pwr: 'blue' }, title: 'Azul fijo',
        mean: 'Bien: quedan más de 15 días y más de 40 galones (≈150 L).', act: 'Nada.' },
      { leds: { drop: 'off', CF: 'purple', MRO: 'blue', pwr: 'blue' }, title: 'Morado fijo · 2 pitidos al servir',
        mean: 'Cambiar pronto: quedan 15 días o menos, o 40 galones o menos.', act: 'Ten el recambio a mano.' },
      { leds: { drop: 'off', CF: 'red', MRO: 'blue', pwr: 'blue' }, title: 'Rojo fijo · pitido continuo al servir',
        mean: 'Caducado: vida agotada por tiempo o por litros.', act: 'Cambia el filtro y haz el reset.' },
      { leds: { drop: 'off', CF: 'blink', MRO: 'blue', pwr: 'blue' }, title: 'Parpadeando durante el reset',
        mean: 'Es el filtro seleccionado para resetear.', act: 'Mantén 5 s el botón para confirmar.' },
    ]},
    { group: 'Avisos de avería', items: [
      { leds: { drop: 'off', CF: 'blinkred', MRO: 'blinkred', pwr: 'off' }, title: 'CF y MRO rojo parpadeando · zumbador 3 min',
        mean: 'Bomba sobretrabajada: más de 30 min seguidos produciendo agua. A los 33 min se para.',
        act: 'Desenchufa y vuelve a enchufar. Si se repite sin tener el grifo abierto, revisa una posible fuga en el tubo entre el equipo y el grifo.' },
      { leds: { drop: 'off', CF: 'blinkpurple', MRO: 'blinkpurple', pwr: 'off' }, title: 'CF y MRO morado parpadeando · 5 pitidos',
        mean: 'Arranques y paradas frecuentes de la bomba (desequilibrio de presión interna).',
        act: 'Desenchufa. Abre o cierra el grifo del todo, quita dobleces de los tubos, comprueba que el grifo no está obstruido y vuelve a enchufar.' },
    ]},
  ];

  const AMZ = 'https://www.amazon.es';
  const PRODUCTS = {
    originals: [
      { f: 'CF', name: 'Waterdrop G2CF', ref: 'WD-G2CF', asin: 'B082D1VZ4P', price: '34,99 €',
        desc: 'Prefiltro: sedimentos PP + bloque de carbón de coco. 12 meses o 1.100 gal.', url: AMZ + '/dp/B082D1VZ4P' },
      { f: 'MRO', name: 'Waterdrop G2MRO', ref: 'WD-G2MRO', asin: 'B0DGT4Y82P', price: '89,99 €',
        desc: 'Membrana RO 0,0001 µm + PP + carbón. 24 meses o 2.200 gal. Para el G2 de 400 GPD.', url: AMZ + '/dp/B0DGT4Y82P' },
    ],
    priceDate: '5 oct 2026',
    notThis: { name: 'Waterdrop G2P6MRO', note: 'Es la membrana del G2P600 (600 GPD). No sirve para el G2.' },
    compatSearch: AMZ + '/s?k=filtro+compatible+Waterdrop+G2+WD-G2CF+WD-G2MRO',
  };

  return { PROCS, LIGHTS, PRODUCTS };
})();
