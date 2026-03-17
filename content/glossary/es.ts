import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Tiempo de espera',
    shortDefinition:
      'El tiempo estimado que un visitante debe estar en fila antes de acceder a una atracción.',
    definition:
      'El tiempo de espera es la duración estimada que un visitante pasa en la cola antes de poder subir a una atracción. Los parques muestran los tiempos de espera en las entradas de las atracciones y en sus aplicaciones. park.fan realiza un seguimiento de los tiempos de espera en vivo que se actualizan cada minuto.',
    relatedTermIds: ['posted-wait-time', 'virtual-queue', 'single-rider', 'express-pass'],
    aliases: ['Tiempos de espera'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Un carril separado para visitantes dispuestos a viajar solos para llenar asientos vacíos.',
    definition:
      'La cola Single Rider permite a los visitantes dispuestos a viajar solos llenar los asientos vacíos en los vehículos de las atracciones. Como los Single Riders encajan en los espacios libres, la cola avanza mucho más rápido que la fila estándar — a menudo con tiempos de espera un 50–70% más cortos. No todas las atracciones ofrecen esta opción; compruébalo antes de unirte a la cola.',
    relatedTermIds: ['wait-time', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'virtual-queue',
    name: 'Cola virtual',
    shortDefinition:
      'Un sistema de cola digital donde los visitantes reservan un horario en lugar de esperar físicamente.',
    definition:
      'Una cola virtual permite a los visitantes registrarse para una atracción a través de una app o quiosco y recibir una notificación cuando se acerca su turno. En lugar de hacer cola físicamente, los visitantes pueden disfrutar de otras áreas del parque y regresar cuando sean llamados.',
    relatedTermIds: ['express-pass', 'wait-time', 'single-rider'],
    aliases: ['Colas virtuales'],
  },
  {
    id: 'express-pass',
    name: 'Pase Express',
    shortDefinition:
      'Una mejora de ticket de pago o incluida que da acceso a una cola prioritaria más corta.',
    definition:
      'Un Pase Express (el nombre varía según el parque — Universal Express, Disney Lightning Lane, etc.) es una mejora que permite a los titulares usar una entrada prioritaria dedicada con esperas significativamente más cortas. Usa el calendario de afluencia de park.fan para decidir si un Pase Express vale su costo.',
    relatedTermIds: ['virtual-queue', 'single-rider', 'wait-time'],
  },
  {
    id: 'posted-wait-time',
    name: 'Tiempo publicado',
    shortDefinition:
      'El tiempo de espera oficial mostrado por el parque en la entrada de una atracción.',
    definition:
      'El tiempo publicado es la estimación oficial mostrada en los letreros en la entrada física de una atracción y/o en la aplicación oficial del parque. park.fan agrega los tiempos de espera publicados de fuentes oficiales cada minuto.',
    relatedTermIds: ['wait-time', 'crowd-level'],
  },
  {
    id: 'crowd-level',
    name: 'Nivel de afluencia',
    shortDefinition:
      'Una medida de cuán concurrido está un parque temático en un día determinado, de Muy Bajo a Extremo.',
    definition:
      'El nivel de afluencia describe la densidad general de visitantes en un parque en un día u hora determinados. park.fan utiliza una escala de Muy Bajo a Extremo basada en datos históricos de tiempos de espera, ocupación actual y predicciones de IA.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Niveles de afluencia'],
  },
  {
    id: 'crowd-calendar',
    name: 'Calendario de afluencia',
    shortDefinition:
      'Una previsión día a día de los niveles de afluencia previstos para ayudar a planificar la visita.',
    definition:
      'Un calendario de afluencia es un calendario mensual o anual que muestra los niveles de afluencia previstos para cada día. park.fan genera calendarios de afluencia usando modelos de IA entrenados en años de datos históricos de tiempos de espera, combinados con calendarios de vacaciones escolares, eventos próximos y tendencias estacionales.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
  },
  {
    id: 'peak-day',
    name: 'Día pico',
    shortDefinition:
      'Un día con el máximo número de visitantes, típicamente durante días festivos o eventos especiales.',
    definition:
      'Un día pico es cualquier día en que la afluencia está en o cerca de la capacidad máxima del parque. Los días pico comunes incluyen los grandes días festivos (Navidad, Semana Santa, vacaciones de verano), días de eventos especiales y semanas de vacaciones escolares. park.fan destaca los días pico en el calendario de afluencia.',
    relatedTermIds: ['crowd-level', 'crowd-calendar', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Renovación',
    shortDefinition:
      'Un período de cierre planificado durante el cual una atracción se somete a mantenimiento o mejoras.',
    definition:
      'Una renovación es un período de mantenimiento o renovación programado durante el cual una atracción, espectáculo o área del parque está temporalmente cerrada. Las renovaciones pueden durar desde unos pocos días hasta varios meses. park.fan marca las atracciones que actualmente están en renovación.',
    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Tiempo de inactividad',
    shortDefinition:
      'Un cierre temporal no planificado de una atracción, a menudo debido a un fallo técnico.',
    definition:
      'El tiempo de inactividad se refiere a un cierre temporal no programado de una atracción — distinto de una renovación planificada. Los tiempos de inactividad son causados por fallos técnicos, verificaciones de seguridad, incidentes con visitantes o condiciones meteorológicas adversas. park.fan muestra el estado operativo actual de cada atracción rastreada en tiempo real.',
    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: 'Capacidad de atracción',
    shortDefinition: 'El número de visitantes que una atracción puede acomodar por hora.',
    definition:
      'La capacidad de una atracción es el número máximo de visitantes que puede transportar por hora en condiciones operativas óptimas. La capacidad depende del tamaño del vehículo, el número de vehículos en funcionamiento, la velocidad de carga y descarga y el tiempo del ciclo. La capacidad determina directamente la velocidad de avance de la cola.',
    relatedTermIds: ['wait-time', 'downtime', 'refurbishment'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'El momento en que un parque abre oficialmente sus puertas y las colas para las atracciones populares son más cortas.',
    definition:
      'El Rope Drop se refiere al momento en que un parque temático abre para el día — llamado así por la cuerda (o barrera) literal que el personal del parque baja para dejar entrar a los primeros visitantes. Llegar al Rope Drop es una estrategia popular porque las atracciones populares tienen las colas más cortas por la mañana, antes de que las multitudes se acumulen. El horario de park.fan muestra las horas de apertura exactas para que puedas planificar tu estrategia.',
    relatedTermIds: ['crowd-calendar', 'wait-time', 'crowd-level'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      'Un beneficio exclusivo que permite a los huéspedes de los hoteles del resort entrar al parque antes de la apertura general.',
    definition:
      'El Early Entry (también llamado Extra Magic Hours o Early Park Entry) permite a los huéspedes de hoteles asociados acceder al parque 30–60 minutos antes que el público general. Durante esta ventana, las colas en las atracciones más populares son notablemente más cortas. En días de alta afluencia, combinar el Early Entry con un plan de visita inteligente puede permitir disfrutar de varias atracciones destacadas con esperas mínimas.',
    relatedTermIds: ['rope-drop', 'express-pass', 'peak-day'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Un complemento de ticket que permite visitar varios parques del mismo resort en el mismo día.',
    definition:
      'Un ticket Park Hopper permite acceder a dos o más parques del mismo resort en un solo día. La opción Park Hopper de Disney, por ejemplo, permite moverse entre Magic Kingdom, EPCOT, Hollywood Studios y Animal Kingdom a partir de las 14:00 horas. Es especialmente útil cuando atracciones o experiencias específicas están distribuidas entre varios parques.',
    relatedTermIds: ['season-pass', 'rope-drop', 'crowd-calendar'],
  },
  {
    id: 'season-pass',
    name: 'Pase anual',
    shortDefinition: 'Un ticket anual que permite visitas ilimitadas al parque durante 12 meses.',
    definition:
      'Un pase anual (Annual Pass) ofrece entradas ilimitadas a uno o más parques durante un período de 12 meses. Los niveles superiores suelen incluir ventajas como descuentos en restauración, aparcamiento gratuito y descuentos en merchandising. Algunos pases tienen fechas bloqueadas (blockout dates) en los días de mayor afluencia. Para los visitantes habituales — generalmente tres o más visitas al año — un pase anual casi siempre resulta más económico que los tickets individuales.',
    relatedTermIds: ['park-hopper', 'peak-day', 'express-pass'],
  },
  {
    id: 'height-requirement',
    name: 'Talla mínima',
    shortDefinition:
      'Una estatura mínima que los visitantes deben tener para acceder a una atracción específica.',
    definition:
      'La talla mínima es una norma de seguridad establecida por los parques para garantizar que los sistemas de retención — barras de seguridad, arneses, cinturones — funcionen correctamente para cada pasajero. Suele oscilar entre 90 y 140 cm dependiendo de la intensidad de la atracción. Algunas atracciones también tienen una altura o peso máximo. Comprueba siempre los requisitos de talla antes de visitar con niños pequeños para evitar decepciones.',
    relatedTermIds: ['ride-capacity', 'refurbishment'],
  },
  {
    id: 'themed-land',
    name: 'Zona temática',
    shortDefinition:
      'Una zona autónoma dentro de un parque temático construida en torno a un tema coherente.',
    definition:
      "Una zona temática es un área delimitada dentro de un parque temático que combina un diseño visual unificado, una historia de fondo y atracciones, restaurantes y tiendas a juego. Ejemplos famosos incluyen El Mundo Mágico de Harry Potter en Universal, Star Wars: Galaxy's Edge en Disney y Polynesia en PortAventura. Las zonas temáticas crean una experiencia inmersiva y suelen ser las zonas más fotografiadas del parque.",
    relatedTermIds: ['ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'La apertura no oficial de una atracción antes de su fecha de lanzamiento anunciada.',
    definition:
      'Un Soft Opening ocurre cuando un parque abre discretamente una nueva atracción o zona antes de la fecha oficial — a menudo sin ningún anuncio. Los parques utilizan los Soft Openings para probar sistemas en condiciones reales, detectar problemas operativos y ajustar los procedimientos de embarque. Como pueden comenzar y detenerse sin previo aviso, son un plus para los visitantes afortunados que estén en el parque ese día, pero no una base fiable para planificar la visita. Los foros de entusiastas y las redes sociales suelen ser los primeros en reportarlos.',
    relatedTermIds: ['refurbishment', 'downtime', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition: 'La cola normal de una atracción, sin reserva ni pase especial.',
    definition:
      'La cola Standby es la fila de espera física estándar accesible a todos los visitantes sin ticket adicional ni mejora. Quien hace Standby espera en orden de llegada — el tiempo mostrado refleja directamente la afluencia actual en la atracción. En los días más concurridos, los tiempos de Standby en las atracciones principales pueden superar los 90 minutos. park.fan sigue los tiempos de Standby en tiempo real para ayudarte a encontrar siempre la cola más corta.',
    relatedTermIds: ['wait-time', 'single-rider', 'virtual-queue', 'express-pass'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'El sistema de acceso prioritario de pago de Disney, sucesor del programa FastPass+.',
    definition:
      'Lightning Lane es el nombre que Disney da a su sistema de cola prioritaria, introducido en 2021 como sucesor del gratuito FastPass+. Existe en dos modalidades: Individual Lightning Lane (ILL), vendida por separado para las atracciones más demandadas, y Lightning Lane Multi Pass (LLMP), una suscripción diaria que permite reservar franjas horarias de retorno en una selección de atracciones. La Lightning Lane ha generado mucho debate en la comunidad porque convirtió una ventaja antes gratuita en un servicio de pago. El calendario de afluencia de park.fan te ayuda a valorar en qué días vale la pena adquirirla.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'El anterior complemento diario de Disney que daba acceso a Lightning Lane Multi Pass en la mayoría de las atracciones.',
    definition:
      'Genie+ (ahora renombrado Lightning Lane Multi Pass) era el complemento diario de pago de Disney que sustituyó a FastPass+. Por una tarifa por persona al día, los visitantes podían reservar un slot de Lightning Lane a la vez en una amplia selección de atracciones. Las atracciones más destacadas estaban excluidas y se vendían por separado como Individual Lightning Lane. El precio de Genie+ era dinámico y aumentaba en los días más concurridos. park.fan rastrea los niveles de afluencia en detalle para ayudarte a decidir si merece la pena el complemento.',
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'Un número de asignación en el sistema de cola virtual que permite el acceso a una atracción cuando se llama al grupo.',
    definition:
      'Un Boarding Group es una asignación numerada dentro de un sistema de cola virtual, utilizado principalmente para las atracciones más demandadas donde una cola física sería impracticable. Los visitantes se apuntan a través de la app del parque — a menudo en el momento de la apertura — y reciben un número de grupo. Cuando ese número es llamado, tienen una ventana limitada para presentarse en la atracción. En los días muy concurridos, todos los Boarding Groups pueden agotarse en cuestión de minutos. El sistema de Disney en atracciones como Tron Lightcycle Run y Star Wars: Rise of the Resistance ha popularizado este concepto en toda la comunidad de parques.',
    relatedTermIds: ['virtual-queue', 'wait-time', 'lightning-lane'],
  },
  {
    id: 'off-peak',
    name: 'Temporada baja',
    shortDefinition:
      'Períodos de menor afluencia que ofrecen colas más cortas, precios más bajos y una experiencia más tranquila.',
    definition:
      'La temporada baja corresponde a los períodos más tranquilos del calendario, cuando los colegios están en clase y no caen grandes festivos — típicamente de enero a principios de febrero, de mediados de septiembre a octubre (fuera de los eventos de Halloween) y las primeras semanas de noviembre. En temporada baja, los tiempos de espera en las atracciones populares pueden ser notablemente más cortos, los precios de las entradas suelen estar en sus mínimos y los parques se sienten mucho menos saturados. Para los visitantes con horarios flexibles, elegir la temporada baja es una de las estrategias más efectivas. El calendario de afluencia de park.fan resalta estas ventanas para que puedas planificar al máximo.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'offseason',
    name: 'Cierre temporal',
    shortDefinition:
      'Período de cierre estacional en el que el parque permanece completamente cerrado al público para mantenimiento, obras o vacaciones invernales.',
    definition:
      'El cierre temporal (u OffSeason) es el período durante el cual un parque temático cierra completamente sus puertas — no se trata de una temporada baja con menor afluencia, sino de un auténtico cierre operativo. Los parques aprovechan esta ventana para realizar el mantenimiento esencial en atracciones e instalaciones, acometer reformas importantes que no son posibles con el parque en funcionamiento, y permitir al personal un período de descanso antes de la nueva temporada. Los cierres temporales se producen con más frecuencia en los meses de invierno y duran desde unas semanas hasta varios meses según el parque y su clima. En este período no hay atracciones, restaurantes ni espectáculos accesibles al público.\n\nCuando park.fan muestra el estado OffSeason para un parque, significa que no hay calendario de apertura disponible para el período actual y que la próxima fecha de apertura confirmada está aún a varias semanas. Consulta el sitio web oficial del parque para conocer la fecha exacta de reapertura — los parques más populares suelen agotar los primeros días tras la reapertura muy rápidamente.',
    relatedTermIds: ['refurbishment', 'soft-opening', 'crowd-calendar'],
  },
  {
    id: 'ride-photo',
    name: 'Foto de atracción',
    shortDefinition:
      'Una foto o vídeo capturado automáticamente durante una atracción, disponible para comprar al finalizar el recorrido.',
    definition:
      'La foto de atracción es una imagen tomada automáticamente por una cámara fija en un momento clave del recorrido — normalmente la caída de una atracción acuática o el punto más alto de una montaña rusa. Al terminar, los visitantes pueden ver su foto en un quiosco o en la app del parque y decidir si la compran. Muchos parques ofrecen paquetes fotográficos de día que incluyen fotos ilimitadas de todas las atracciones del resort. La foto de atracción es un recuerdo muy apreciado y un clásico momento para compartir en redes sociales.',
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Cola',
    shortDefinition:
      'El área de espera física que los visitantes recorren antes de subir a una atracción, a menudo ambientada como parte de la experiencia.',
    definition:
      'La cola es el espacio físico — pasillos, serpentines exteriores o salas interiores — que los visitantes recorren mientras esperan para embarcar en una atracción. En muchos parques temáticos modernos, la cola forma parte de la propia experiencia: la cola de la Haunted Mansion de Disney ambienta antes incluso de subir al Doom Buggy, mientras que las atracciones de Harry Potter en Universal sumergen a los visitantes en su mundo desde que se unen a la fila. Una cola bien diseñada hace la espera mucho más llevadera, incluso cuando es larga.',
    relatedTermIds: ['wait-time', 'standby-queue', 'single-rider'],
    aliases: ['Colas', 'Fila', 'Filas'],
  },
  {
    id: 'opening-day',
    name: 'Día de apertura',
    shortDefinition:
      'La fecha oficial de inauguración de un nuevo parque, zona temática o atracción.',
    definition:
      'El día de apertura es la fecha anunciada oficialmente en la que un nuevo parque, expansión o atracción abre sus puertas al público general por primera vez. Estos días son eventos importantes en la comunidad de los parques temáticos: suelen atraer gran cobertura mediática, largas colas y un ambiente festivo. Los parques organizan habitualmente ceremonias de inauguración con entretenimiento especial y apariciones de personajes. Como el día de apertura atrae a muchos visitantes, rara vez es el mejor momento para descubrir una nueva atracción si el objetivo es evitar largas esperas. Los Soft Openings a veces preceden a la fecha oficial.',
    relatedTermIds: ['soft-opening', 'rope-drop', 'crowd-level'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'Un sistema que permite a los acompañantes turnarse para subir a una atracción mientras el otro espera con los niños que no cumplen el requisito de talla.',
    definition:
      'El Rider Switch (también llamado Child Swap) es un sistema disponible en la mayoría de los grandes parques temáticos que permite a un grupo turnarse en una atracción cuando uno de sus miembros — normalmente un niño que no cumple el requisito de talla — no puede participar. Un adulto sube mientras el otro espera en la entrada con el niño; cuando el primero regresa, el segundo puede embarcar de inmediato sin volver a la cola de Standby. En los parques Disney el sistema se llama Rider Switch; en Universal es Child Swap. En un día concurrido, el segundo adulto se ahorra efectivamente toda la espera — una ventaja muy significativa. Pide al personal de la atracción que lo active al llegar.',
    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Fecha de bloqueo',
    shortDefinition:
      'Un día en el que ciertos niveles de pase anual no son válidos para entrar al parque, normalmente en los días de mayor afluencia del año.',
    definition:
      'Las fechas de bloqueo (también llamadas blackout dates) son días concretos del calendario en los que determinados niveles de pase anual no son válidos para la entrada. Los parques aplican estas fechas para gestionar la capacidad en los días más concurridos: días pico, fines de semana festivos y fechas de eventos especiales. Los pases de nivel superior tienen menos o ninguna fecha de bloqueo, mientras que los pases básicos pueden tener entre 30 y 60 días bloqueados al año. Comprueba siempre el calendario de bloqueo antes de visitar si tienes un pase con restricciones. El calendario de afluencia de park.fan destaca los períodos pico para que puedas cruzarlos con las restricciones de tu pase.',
    relatedTermIds: ['season-pass', 'peak-day', 'crowd-calendar'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Evento de entrada especial',
    shortDefinition:
      'Un evento nocturno o especial con entrada separada que requiere un ticket adicional al de acceso regular al parque, como las fiestas de Halloween o Navidad.',
    definition:
      "Un evento de entrada especial (hard ticket event) es un evento con ticket propio — generalmente vespertino — celebrado en un parque temático que requiere una entrada dedicada además de la admisión regular. Estos eventos ofrecen entretenimiento exclusivo, decoración temática y experiencias con personajes no disponibles en el horario habitual. Ejemplos conocidos son Mickey's Not-So-Scary Halloween Party y Mickey's Very Merry Christmas Party en Walt Disney World, Halloween Horror Nights en Universal o los eventos de temporada de Disneyland Paris. En los días de evento especial, los visitantes con entrada normal suelen tener que abandonar el parque entre las 18:00 y las 19:00. Las entradas frecuentemente se agotan semanas antes.",
    relatedTermIds: ['season-pass', 'peak-day', 'early-entry'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'El antiguo sistema gratuito de cola prioritaria de Disney, reemplazado por el Lightning Lane de pago en 2021.',
    definition:
      'FastPass+ (originalmente FastPass, introducido en 1999) fue el sistema gratuito de cola prioritaria de Disney que permitía a los visitantes reservar ventanas horarias de regreso para atracciones sin coste adicional. En Walt Disney World se podían reservar hasta tres FastPass+ al día a través de la app My Disney Experience antes de solicitar pases adicionales uno a uno. El sistema quedó suspendido durante el cierre por la pandemia en 2020 y nunca se restableció — fue sustituido por el sistema de pago Lightning Lane a finales de 2021. FastPass+ sigue siendo uno de los cambios más comentados en la historia de Disney porque convirtió un beneficio gratuito en un servicio de pago. Conocer el sistema antiguo es útil para interpretar informes de viajes anteriores.',
    relatedTermIds: ['lightning-lane', 'genie-plus', 'express-pass', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Hora de regreso',
    shortDefinition:
      'Una ventana horaria reservada para regresar a una atracción, emitida por Lightning Lane, cola virtual u otros sistemas de acceso prioritario.',
    definition:
      'Una hora de regreso (o return window) es un período de tiempo específico — habitualmente un bloque de una hora — durante el cual un visitante que ha reservado acceso prioritario (mediante Lightning Lane, una cola virtual o sistema similar) puede presentarse en la entrada dedicada de la atracción. Las horas de regreso permiten a los visitantes explorar otras zonas del parque durante el intervalo en lugar de esperar en una cola física. Si se pierde la ventana horaria — normalmente definida como llegar más tarde de un número determinado de minutos — se suele perder la reserva. Los datos de tiempos de espera y niveles de afluencia de park.fan te ayudan a decidir qué atracciones priorizar para la reserva.',
    relatedTermIds: ['lightning-lane', 'virtual-queue', 'fastpass', 'boarding-group'],
    aliases: ['Horas de regreso'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time — una sesión en la que un grupo de entusiastas o huéspedes de hotel tiene acceso exclusivo a una o varias atracciones sin cola del público general.',
    definition:
      'ERT (Exclusive Ride Time) es un período durante el cual un grupo seleccionado — normalmente miembros de un club de entusiastas de montañas rusas, huéspedes de hoteles del resort o titulares de pases anuales — tiene acceso exclusivo a una atracción o conjunto de atracciones sin público general. Durante el ERT los participantes pueden repetir las atracciones con esperas mínimas, logrando a veces decenas de pasadas en una sola sesión. Los eventos ERT los organizan los parques para clubs de entusiastas (como el European Coaster Club o el American Coaster Enthusiasts), para paquetes premium de hotel o como parte de eventos fuera de horario. Para los entusiastas, el ERT es una de las experiencias más preciadas del parque: revela el verdadero carácter de una atracción sin la presión de la cola.',
    relatedTermIds: ['hard-ticket-event', 'early-entry', 'rope-drop', 'credit'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Un itinerario detallado y optimizado para una visita al parque que secuencia las atracciones para minimizar los tiempos de espera y maximizar el número de atracciones en un día.',
    definition:
      'Un Touring Plan es una secuencia planificada de atracciones, comidas y movimientos por el parque diseñada para minimizar el tiempo total de espera a lo largo del día. Los planes efectivos tienen en cuenta los patrones de afluencia, la capacidad de las atracciones, la dinámica de las colas, los horarios de espectáculos y el tiempo meteorológico. Sitios como TouringPlans.com (ahora Thrill-Data) publican planes detallados basados en datos colectivos para los principales parques. Los tiempos de espera en vivo y el calendario de afluencia de park.fan son herramientas complementarias: consultar los datos en tiempo real durante la visita permite ajustar el plan sobre la marcha. En días concurridos, un buen Touring Plan puede reducir el tiempo total en cola entre un 30 y un 50% respecto a un enfoque espontáneo.',
    relatedTermIds: ['crowd-calendar', 'rope-drop', 'wait-time', 'early-entry'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      'Una atracción interior que transporta a los visitantes a través de escenas iluminadas y ambientadas, combinando narrativa, efectos especiales y movimiento.',
    definition:
      'Un dark ride es una atracción en la que los visitantes viajan en un vehículo guiado por el interior de un edificio oscuro con decorados iluminados, proyecciones, animatronics y efectos especiales. A diferencia de las montañas rusas, los dark rides ponen el énfasis en la narración y la inmersión temática sobre las emociones físicas, aunque muchos combinan ambas. Ejemplos icónicos son la Haunted Mansion y Pirates of the Caribbean en Disney, Spider-Man y las atracciones de Harry Potter en Universal, o Taron en Phantasialand. Los dark rides son piezas centrales en la mayoría de los grandes parques temáticos y suelen tener algunos de los tiempos de espera más elevados.',
    relatedTermIds: ['themed-land', 'wait-time', 'vr-coaster'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, fabricante suizo de montañas rusas conocido por sus atracciones suaves y fiables y sus elementos característicos como el Immelmann, el Cobra Roll y el Zero-g Roll.',
    definition:
      'B&M (Bolliger & Mabillard) es un fabricante suizo de montañas rusas fundado en 1988 por Walter Bolliger y Claude Mabillard. La empresa es reconocida por producir atracciones excepcionalmente suaves y fiables con una experiencia de conducción distintiva: fuertes G positivas, inversiones características (Immelmann, Cobra Roll, Zero-g Roll) y excelente capacidad de despacho. B&M se especializa en coasters invertidos, sit-down con inversiones, hyper coasters (más de 60 m), giga coasters (más de 90 m), wing coasters y dive machines. Prácticamente todos los grandes parques europeos cuentan con al menos una instalación B&M, incluidos Shambhala y Dragon Khan en PortAventura, Silver Star en Europa-Park, Nemesis en Alton Towers y Goliath en Walibi Holland.',
    relatedTermIds: ['immelmann', 'cobra-roll', 'zero-g-roll', 'dive-coaster', 'hybrid-coaster'],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      'Fabricante suizo de atracciones y montañas rusas conocido por sus lanzamientos hidráulicos récord, mega/giga coasters y diseños innovadores — la empresa detrás de muchas de las atracciones más rápidas y altas del mundo.',
    definition:
      'Intamin AG es un fabricante suizo de atracciones fundado en 1967, responsable de algunos de los récords de montañas rusas más ambiciosos de la historia. Su sistema de lanzamiento hidráulico impulsó durante años las montañas rusas más rápidas y altas del mundo (Kingda Ka, 139 m; Top Thrill Dragster). Intamin también es conocido por sus mega y giga coasters (incluyendo Millennium Force en Cedar Point e Intimidator 305 en Kings Dominion), multi-launch coasters, atracciones acuáticas y dark rides. Sus diseños están frecuentemente en la vanguardia de la escala y la innovación, aunque la empresa también tiene fama de requerir un mantenimiento complejo. Las instalaciones europeas de Intamin incluyen Taron y Black Mamba en Phantasialand y Red Force en Ferrari Land.',
    relatedTermIds: ['launch-coaster', 'top-hat', 'b-and-m', 'mack-rides'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Fabricante familiar alemán de Waldkirch, cerca de Europa-Park, que produce atracciones acuáticas, dark rides y montañas rusas de acero cada vez más ambiciosas.',
    definition:
      'Mack Rides es un fabricante alemán de atracciones con sede en Waldkirch, Baden-Württemberg — a pocos kilómetros de Europa-Park, el parque insignia de la familia. Fundada en 1921, Mack produce atracciones acuáticas, dark rides (incluyendo Test Track y Radiator Springs Racers de Disney) y una cartera creciente de montañas rusas de alta emoción. Su Blue Fire Megacoaster en Europa-Park (2009) fue la primera atracción en incorporar el elemento Stengel Dive. Los hyper coasters más recientes de Mack (Ride to Happiness en Plopsaland, Kondaa en Walibi Belgium) han recibido una amplia aclamación crítica de la comunidad entusiasta. Las atracciones de Mack Rides son una presencia definitoria en los parques europeos, especialmente en el propio Europa-Park de la familia Mack.',
    relatedTermIds: ['stengel-dive', 'b-and-m', 'intamin', 'launch-coaster'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Rocky Mountain Construction, fabricante de Idaho que pioneró el concepto del coaster híbrido convirtiendo viejas montañas rusas de madera en pistas de acero I-box con airtime e inversiones sin precedentes.',
    definition:
      'Rocky Mountain Construction (RMC) es un fabricante y empresa de mantenimiento de montañas rusas americano con sede en Hayden, Idaho, conocido por inventar el sistema de pista de acero I-box que puede instalarse sobre la estructura de madera de un coaster existente. Esta tecnología de conversión permitió a los parques transformar viejas montañas rusas de madera en atracciones híbridas de primera clase con airtime intenso, múltiples inversiones y caídas más allá de la vertical — algo imposible en las pistas de madera tradicionales. Conversiones de RMC como Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) y Wildfire (Kolmården) se convirtieron rápidamente en favoritas de los entusiastas. En Europa, el híbrido de nueva construcción de RMC, Untamed en Walibi Holland, está considerado uno de los mejores coasters del continente.',
    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Fabricante neerlandés de montañas rusas y uno de los más prolíficos del mundo, conocido por el omnipresente Boomerang y una amplia gama de coasters familiares y de emociones fuertes en parques europeos.',
    definition:
      "Vekoma Rides Manufacturing es un fabricante neerlandés de montañas rusas con sede en Vlodrop, Países Bajos, y uno de los productores más prolíficos del mundo en términos de instalaciones totales. Fundada en 1926 como empresa de ingeniería mecánica, Vekoma se reconvirtió en atracciones en la década de 1970 y alcanzó fama mundial con su Boomerang — un compacto shuttle coaster con tres inversiones que se licenció barato y se instaló en parques de todo el mundo. Otros modelos icónicos incluyen el Suspended Looping Coaster (SLC), el Giant Inverted Boomerang y el Mine Train. A partir de la década de 2010, Vekoma se reinventó con una moderna línea 'nueva generación' con sistemas de conducción más suaves, layouts innovadores y mejoradas atracciones familiares. Nuevos modelos como el Family Boomerang, el Tilt Coaster y los coasters familiares suspendidos aparecen cada vez más en parques europeos. Disney también ha encargado diseños Vekoma personalizados para sus resorts.",
    relatedTermIds: ['boomerang', 'b-and-m', 'intamin', 'gerstlauer'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Fabricante alemán conocido principalmente por el modelo Euro-Fighter con su primera caída más allá de la vertical, así como por spinning coasters y compactas atracciones familiares.',
    definition:
      'Gerstlauer Amusement Rides GmbH es un fabricante alemán de montañas rusas con sede en Münsterhausen, Baviera. Fundada en 1946 como empresa metalúrgica, se adentró en el mercado de las atracciones en la década de 1980 y construyó su reputación mundial con el modelo Euro-Fighter — un compacto coaster de lanzamiento eléctrico famoso por su caída inicial más allá de la vertical (97 grados). Los Euro-Fighters pueden instalarse en espacios reducidos, lo que los hace atractivos para parques urbanos y recintos más pequeños; ejemplos son Rage en Adventure Island y Speed en Oakwood. Gerstlauer también produce el modelo Infinity Coaster, spinning coasters y el SkyRoller, un coaster giratorio en el que los pasajeros controlan sus propias volteretas. En la comunidad de entusiastas, las montañas rusas de Gerstlauer son apreciadas por su intensidad en relación con su pequeña huella.',
    relatedTermIds: ['euro-fighter', 'spinning-coaster', 'b-and-m', 'intamin'],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Legendario fabricante alemán cuyos clásicos coasters looping de los años 70 y 80 siguen siendo adorados en los parques europeos por su experiencia de conducción intensa y excepcionalmente suave.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG fue un fabricante alemán de montañas rusas con sede en Münsterhausen, Baviera — la misma ciudad donde se instaló más tarde Gerstlauer. Fundada por Anton Schwarzkopf en 1954, la empresa fue clave para introducir los coasters looping en Europa. La Revolution en Six Flags Magic Mountain (1976) fue el primer coaster looping moderno del mundo — diseñado por Schwarzkopf. Los modelos emblemáticos incluyen el Looping Star, el Thriller/Wildcat y el transportable Looping Coaster, que recorrió toda Europa. Los coasters Schwarzkopf son reconocidos por sus suaves paseos y la elegante eficiencia de sus layouts — fruto de la precisa ingeniería de Schwarzkopf. La empresa quebró en 1983, pero muchas instalaciones siguen operativas décadas después, atesoradas por parques y entusiastas como clásicos insustituibles. El mantenimiento ahora lo realizan empresas especializadas o Gerstlauer, que adquirió parte del utillaje.',
    relatedTermIds: ['b-and-m', 'intamin', 'gerstlauer', 'vekoma'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Una montaña rusa que acelera a los visitantes de 0 a alta velocidad mediante un sistema de lanzamiento magnético, hidráulico o neumático en lugar de una cadena de ascenso tradicional.',
    definition:
      'Un Launch Coaster sustituye la cadena de ascenso tradicional por un sistema de propulsión que acelera el tren desde parado hasta velocidad máxima en apenas unos segundos. Las principales tecnologías son: lanzamiento LSM (motor síncrono lineal) — bobinas electromagnéticas aceleran una aleta del tren; LIM (motor de inducción lineal) — similar pero menos eficiente; lanzamiento hidráulico — sistema de cable impulsado por un pistón, usado por Intamin en coasters récord como Kingda Ka; y lanzamientos de aire comprimido. Algunos coasters incorporan múltiples lanzamientos a lo largo del recorrido. La aceleración repentina y potente es una sensación definitoria que una cadena de ascenso no puede replicar.',
    relatedTermIds: ['lifthill', 'top-hat', 'intamin', 'horseshoe'],
  },
  {
    id: 'wooden-coaster',
    name: 'Montaña rusa de madera',
    shortDefinition:
      'Una montaña rusa construida principalmente en madera, caracterizada por su vibración distintiva, el movimiento lateral y el airtime impredecible.',
    definition:
      'Una montaña rusa de madera es una atracción construida con pista y estructura de soporte de madera. A diferencia de las de acero, la madera tiene una flexión y una imprecisión naturales que crean la característica vibración, el bamboleo lateral y el airtime impredecible que tanto gustan a los entusiastas. Entre las montañas rusas de madera más famosas están Balder en Liseberg, The Beast en Kings Island y Megafobia en Oakwood. Requieren un mantenimiento constante — la pista debe relamiparse regularmente — y son sensibles a los cambios meteorológicos. El proceso de conversión de RMC puede transformar viejas montañas rusas de madera en coasters híbridos de pista de acero manteniendo la estructura de madera.',
    relatedTermIds: ['airtime', 'hybrid-coaster', 'rmc'],
    aliases: ['Woodies', 'Montañas rusas de madera'],
  },
  {
    id: 'steel-coaster',
    name: 'Montaña rusa de acero',
    shortDefinition:
      'Una montaña rusa construida principalmente con pista y estructura de acero, conocida por su viaje suave y preciso.',
    definition:
      'Una montaña rusa de acero se construye con pista tubular o plana de acero soportada por una estructura de acero. A diferencia de las montañas rusas de madera con su flexibilidad natural, el acero ofrece a los ingenieros un control preciso de las fuerzas G, transiciones e inversiones. El viaje suave y predecible de una montaña rusa de acero permite crear layouts complejos con múltiples inversiones, curvas cerradas y secciones de alta velocidad.\n\nLas montañas rusas de acero dominan el desarrollo moderno de coasters. Los ejemplos más celebrados en Europa incluyen Shambhala en PortAventura, Nemesis en Alton Towers y Silver Star en Europa-Park. Las montañas rusas de acero van desde pequeñas atracciones familiares hasta mega coasters récord-rompedores. La precisión del acero requiere inspección y mantenimiento regular, pero permite menos margen de error de diseño que la flexibilidad de la madera.',
    relatedTermIds: ['wooden-coaster', 'inversion', 'launch-coaster', 'hyper-coaster'],
    aliases: ['Montañas rusas de acero', 'Acero'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'Un coaster donde el tren cuelga debajo de la pista en un pivote, permitiendo que el vehículo se balancee libremente de lado a lado.',
    definition:
      'Un suspended coaster es un tipo de coaster especializado donde el tren cuelga desde arriba en un punto pivote, permitiéndole balancearse libremente de un lado a otro independientemente de la trayectoria de la pista. Mientras el tren navega por las curvas, se balancea como un péndulo — un movimiento que crea la sensación característica del \"whip\" y añade un elemento impredecible a la experiencia. Este movimiento de balanceo es distinto de un coaster invertido, donde el tren está rígidamente unido encima de la pista.\n\nLos suspended coasters son menos comunes que los coasters invertidos pero ofrecen una experiencia única. El movimiento de balanceo hace que incluso las curvas moderadas se sientan dramáticas, y la sensación de \"volar\" con el terreno lejano crea una exposición emocionante. Vekoma creó el modelo Suspended Looping Coaster (SLC) en los años 90, y cientos fueron construidos mundialmente. El movimiento de balanceo puede parecer caótico en comparación con la precisión de las inversiones modernas, haciendo que los suspended coasters sean amados por su naturaleza cruda e impredecible.',
    relatedTermIds: ['inverted-coaster', 'b-and-m', 'vekoma'],
    aliases: ['Suspended', 'Oscilante'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster híbrido',
    shortDefinition:
      'Una montaña rusa que combina una estructura de soporte de madera tradicional con una pista de acero I-box, pionera de Rocky Mountain Construction (RMC).',
    definition:
      'Un coaster híbrido combina la estructura de madera de una montaña rusa tradicional con una pista de acero I-box fabricada por Rocky Mountain Construction (RMC). La pista I-box es extremadamente precisa y suave, permitiendo elementos de inversión imposibles en pistas de madera tradicionales. RMC desarrolló esta tecnología principalmente para renovar viejas montañas rusas de madera — añadiendo inversiones, caídas más pronunciadas y airtime hills a recorridos que antes eran demasiado rugosos para disfrutarlos. Entre los híbridos de RMC más famosos están Steel Vengeance en Cedar Point (considerado a menudo el mejor coaster del mundo), Twisted Colossus en Six Flags Magic Mountain y Wildfire en Kolmården. Los híbridos RMC de nueva construcción (como Untamed en Walibi Holland) coexisten junto a las conversiones.',
    relatedTermIds: ['wooden-coaster', 'rmc', 'airtime'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Un modelo compacto de Vekoma que lleva a los visitantes a través de tres inversiones dos veces — primero hacia adelante y luego hacia atrás — en un recorrido de ida y vuelta.',
    definition:
      'El Boomerang es uno de los modelos de montaña rusa más construidos de la historia, fabricado por Vekoma. El recorrido incluye tres inversiones — un looping vertical flanqueado por dos elementos Sidewinder — que se recorren primero hacia adelante y luego en sentido inverso después de que el tren sea subido por una segunda rampa inclinada y liberado hacia atrás por los mismos elementos. El paseo completo ofrece seis inversiones (tres en cada dirección) en un espacio muy reducido, lo que lo hace ideal para parques con poco terreno. Se construyeron más de 50 Boomerangs en todo el mundo; el modelo está presente en parques de todos los continentes habitados. A pesar de su antigüedad, los Boomerangs siguen siendo populares como coasters de iniciación en parques de tamaño medio.',
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Un modelo compacto de Gerstlauer con una primera caída vertical o más allá de la vertical lanzada desde una cadena de ascenso vertical, diseñado para ofrecer emociones intensas en un espacio reducido.',
    definition:
      'El Euro-Fighter es el modelo compacto más característico de Gerstlauer, reconocible por su primera caída vertical (90 grados) o más allá de la vertical (hasta 97 grados) tras una cadena de ascenso vertical. Diseñado para parques con espacio limitado, los Euro-Fighters concentran emociones intensas — múltiples inversiones, curvas cerradas y altas G positivas — en un área pequeña. La caída más allá de la vertical es especialmente notable: el tren se detiene en lo alto con los pasajeros inclinados sobre el vacío antes de la caída. Euro-Fighters europeos incluyen Saw – The Ride en Thorpe Park, Rage en Adventure Island y Fluch von Novgorod en Hansa-Park.',
    relatedTermIds: ['first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'Un tipo de montaña rusa con un tren excepcionalmente ancho y una caída vertical o más allá de la vertical, con una pausa deliberada en la cresta antes del plunge.',
    definition:
      'Un Dive Coaster se caracteriza por un tren ancho (normalmente 8–10 pasajeros por fila), una caída vertical o más allá de la vertical (90+ grados) y una pausa teatral en lo alto de la caída — el tren se detiene unos instantes en la cresta antes de soltarse, maximizando la anticipación psicológica. El tren ancho ofrece a todos los pasajeros una vista despejada directamente hacia abajo. La línea Dive Machine de B&M (Oblivion en Alton Towers, SheiKra en Busch Gardens) fue pionera del concepto; el modelo Dive Coaster de Gerstlauer es una versión alternativa. La pausa deliberada antes de la caída es una decisión de diseño consciente para aumentar la tensión y es uno de los momentos más comentados en las conversaciones sobre parques temáticos.',
    relatedTermIds: ['first-drop', 'b-and-m', 'euro-fighter', 'launch-coaster'],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'Una montaña rusa mejorada con cascos de realidad virtual que superponen una experiencia animada o de juego sincronizada sobre el recorrido físico.',
    definition:
      'Un VR Coaster equipa a los pasajeros con cascos de realidad virtual (normalmente Samsung Gear VR o dispositivos específicos) que muestran un entorno virtual sincronizado con los movimientos físicos de la montaña rusa. Cuando la atracción tira G positivas en un looping, el mundo virtual refleja la sensación; cuando el tren cae, el mundo virtual también desciende. Los VR Coasters se popularizaron entre 2015 y 2019, y muchos parques los instalaron en coasters existentes. El concepto ha tenido una recepción mixta: a algunos visitantes les encanta la superposición inmersiva, mientras que a otros los cascos les resultan incómodos, poco higiénicos o causantes de mareos. Muchos parques que introdujeron la VR la han retirado desde entonces. Algunas instalaciones (como los VR Coasters de Mack Rides) ofrecen experiencias dedicadas y más elaboradas.',
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'La sensación de ingravidez o elevación del asiento que se experimenta en las montañas rusas durante los momentos de G negativas.',
    definition:
      'El Airtime describe la sensación de ingravidez — G negativas — que los pasajeros de montañas rusas experimentan cuando el coaster corona una colina o un valle más rápido que la caída libre. Existen dos tipos principales: floater airtime (G negativas suaves, una sensación de flotación ligera) y ejector airtime (G negativas intensas, donde la barra de seguridad o el cinturón son lo único que te mantiene en el asiento). El airtime está ampliamente considerado como la característica definitoria de los grandes coasters de acero y de madera. Las airtime hills (también llamadas camelbacks) están diseñadas específicamente para maximizar esta sensación dando a la pista una trayectoria parabólica de caída libre.',
    relatedTermIds: ['airtime-hill', 'bunnyhop', 'first-drop', 'wooden-coaster'],
  },
  {
    id: 'inversion',
    name: 'Inversión',
    shortDefinition:
      'Cualquier elemento en una montaña rusa donde la pista gira a los pasajeros boca abajo.',
    definition:
      'Una inversión es cualquier elemento en una montaña rusa donde la pista y el vehículo giran a los pasajeros más allá del plano vertical — colocándolos al menos parcialmente boca abajo. Las inversiones más comunes son el looping vertical, el cobra roll, el sacacorchos, el immelmann, el dive loop, el inline twist, el heartline roll y el zero-G roll. Los coasters modernos incluyen habitualmente entre seis y catorce inversiones en un solo recorrido. El número de inversiones es uno de los datos clave para describir la intensidad de un coaster. Las inversiones generan tanto G positivas (en la base de los looopings) como G negativas (en la cima), creando sensaciones variadas a lo largo del paseo.',
    relatedTermIds: ['vertical-loop', 'cobra-roll', 'immelmann', 'zero-g-roll', 'corkscrew'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      'La inversión circular clásica donde la pista forma un círculo vertical completo, llevando a los pasajeros completamente boca abajo en el punto más alto.',
    definition:
      "El looping vertical es la inversión más icónica en la historia de las montañas rusas — un círculo completo de 360 grados en el plano vertical. Los looopings modernos utilizan una forma de clotoide (lágrima) en lugar de un círculo perfecto: la entrada y la salida son anchas, mientras que la parte superior es más cerrada. Esta forma garantiza que los pasajeros experimenten G suaves y sostenidas a lo largo del recorrido en lugar de picos extremos. El primer coaster moderno con looping (Corkscrew, Knott's Berry Farm, 1975) transformó la industria. Hoy los looopings verticales anclan el contador de inversiones en coasters de todo el mundo, desde las atracciones para principiantes hasta las máquinas récord.",
    relatedTermIds: ['inversion', 'immelmann', 'cobra-roll'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'Un medio looping que eleva el tren hacia arriba y por encima de la cima, seguido de un medio giro que sale en dirección opuesta — bautizado en honor al piloto de la Primera Guerra Mundial Max Immelmann.',
    definition:
      'El giro Immelmann es una inversión característica de B&M que consta de dos fases: primero la pista asciende hasta la mitad de un looping vertical, llevando a los pasajeros por encima de la cima e invirtiéndolos brevemente; luego un medio giro devuelve el tren a la posición correcta mientras simultáneamente invierte la dirección de marcha 180 grados. El elemento lleva el nombre del as de la aviación de la Primera Guerra Mundial Max Immelmann, que utilizaba una maniobra aérea similar. Los Immelmanns son distintivos porque producen tanto la sensación de caída libre de la inversión como un cambio de dirección significativo en un único elemento fluido. Están presentes en casi todos los coasters B&M sit-down, invertidos e hyper de todo el mundo.',
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop', 'b-and-m'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-g Roll',
    shortDefinition:
      'Un giro de 360 grados sobre un arco parabólico donde los pasajeros experimentan casi ingravidez en la cima — uno de los elementos más celebrados del diseño moderno de coasters.',
    definition:
      'El Zero-g Roll (giro de gravedad cero) es un elemento de inversión cuya forma hace que el tren siga un arco parabólico a lo largo de la rotación — similar conceptualmente al heartline roll pero a mayor velocidad y con más desplazamiento vertical. En la cresta del giro, los pasajeros experimentan G negativas momentáneas (airtime) mientras están boca abajo, creando una sensación única: desorientadora y muy querida a la vez. Los Zero-g Rolls están asociados principalmente con los wing coasters y hyper coasters de B&M, donde el elemento hace que los pasajeros de los asientos laterales se balanceen dramáticamente por el aire abierto. Shambhala en PortAventura y Fury 325 en Carowinds cuentan con celebrados Zero-g Rolls.',
    relatedTermIds: ['inversion', 'heartline-roll', 'airtime', 'b-and-m'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'El ascenso motorizado que arrastra el tren de la montaña rusa hasta su punto más alto, convirtiendo energía eléctrica en energía potencial gravitatoria.',
    definition:
      'La Lifthill es el segmento donde un mecanismo externo arrastra el tren desde el nivel del suelo hasta el punto más alto del recorrido. El mecanismo más común es una cadena que corre a lo largo del centro de la pista — el familiar sonido "clic-clic-clic" es el trinquete antirretroceso. Las alternativas incluyen ascensores de cable/cuerda (más suaves y silenciosos), lifthills de rodillos neumáticos (utilizados en algunos coasters B&M modernos) y propulsión magnética. La altura de la lifthill determina la velocidad máxima potencial del coaster. Algunos diseños modernos usan múltiples lifthills o combinan ascenso con segmentos de lanzamiento. La lifthill es normalmente el momento más lento y lleno de anticipación de todo el recorrido.',
    relatedTermIds: ['first-drop', 'launch-coaster', 'block-brake'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'El descenso inicial tras la lifthill — normalmente el punto más alto y rápido del recorrido, que define el carácter de la montaña rusa.',
    definition:
      'El First Drop es el descenso principal inmediatamente después de la lifthill o del segmento de lanzamiento. En la mayoría de los coasters tradicionales es la colina más alta y produce la velocidad máxima de la atracción. El ángulo, la altura y el perfil influyen fuertemente en el carácter general: las caídas con ángulos pronunciados (más de 80–90 grados) crean intensas sensaciones de aceleración, mientras que las caídas parabólicas pueden generar un airtime potente a pesar de un ángulo más suave. Los dive coasters presentan caídas que superan los 90 grados (más allá de la vertical), obligando a los pasajeros a inclinarse sobre el borde. El First Drop es a menudo el momento más esperado en cualquier coaster nuevo y es ampliamente filmado como material promocional.',
    relatedTermIds: ['lifthill', 'airtime', 'airtime-hill', 'dive-coaster'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'Un elemento en forma de colina diseñado para generar G negativas, haciendo que los pasajeros experimenten ingravidez o sean elevados del asiento.',
    definition:
      'Una Airtime Hill (también llamada camelback) es un elemento de subida y bajada diseñado para producir G negativas — la sensación de flotar o ser eyectado del asiento. El floater airtime es una G negativa suave; el ejector airtime es intenso, donde la barra de seguridad se convierte en lo único entre el pasajero y el vacío. Los coasters de acero usan colinas parabólicas con formas precisas para un airtime consistente y predecible; los coasters de madera producen un airtime más impredecible y con más textura por la flexión de la pista. Las Airtime Hills están entre los elementos más celebrados en los rankings de entusiastas y son una característica definitoria de los hyper coasters, giga coasters y montañas rusas de madera modernas.',
    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Una sección en espiral continua donde la pista gira alrededor de un eje central, generando G laterales sostenidas.',
    definition:
      'Una hélice es una sección de pista de montaña rusa que espira continuamente — con una forma similar a un tornillo — sin invertir a los pasajeros. A diferencia de las airtime hills o las inversiones, las hélices generan G laterales (laterales) sostenidas que empujan a los pasajeros hacia el exterior de las curvas. Una hélice descendente acelera el tren mientras gira; una hélice ascendente lo decelera generando igualmente fuerzas laterales. Las hélices se usan habitualmente para consumir la energía cinética restante al final de un recorrido ofreciendo al mismo tiempo una emocionante y sostenida sensación de giro. Entre las hélices más famosas están el final subterráneo de Nemesis en Alton Towers y la hélice de cierre de Expedition GeForce en Holiday Park.',
    relatedTermIds: ['horseshoe', 'first-drop'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'Una sección de frenos que divide el circuito en segmentos independientes, permitiendo circular varios trenes simultáneamente sin riesgo de colisión.',
    definition:
      'Un Block Brake divide el circuito de un coaster en secciones independientes separadas ("bloques"), cada una capaz de albergar exactamente un tren. Si un tren que va por delante se ralentiza o se detiene, el sistema de control detiene automáticamente todos los trenes siguientes en sus posiciones de block brake. Este sistema de seguridad permite a los parques operar varios trenes simultáneamente — aumentando drásticamente la capacidad horaria — sin ningún riesgo de colisión. Los block brakes se sitúan en puntos donde un tren detenido no puede rodar hacia atrás (normalmente una sección plana o ligeramente ascendente) y suelen usar frenos magnéticos (de corrientes de Foucault) o de aleta de fricción. El freno de mitad de recorrido (MCBR) es el tipo de block brake más visible.',
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'La sección de deceleración al final del recorrido donde el tren se reduce a la velocidad de estación, normalmente mediante frenos magnéticos de aleta.',
    definition:
      'El Brake Run es la sección de pista tras el recorrido principal donde el tren de la montaña rusa decelera desde la velocidad de circulación hasta una velocidad de aproximación a la estación segura. Los frenos modernos utilizan frenos de corriente de Foucault (magnéticos) — filas de aletas magnéticas permanentes que interactúan con aletas de metal en la parte inferior del tren, creando resistencia sin fricción ni desgaste. Los coasters más antiguos usaban frenos neumáticos de pinza. Un freno de mitad de recorrido (MCBR) situado a mitad del recorrido actúa como sección de bloque para la operación con múltiples trenes. El último brake run antes de la estación puede estar deliberadamente aliviado para conservar algo de velocidad y ofrecer una llegada más dinámica.',
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      'Un elemento de doble inversión característico de B&M donde la pista forma la silueta de la cabeza erguida de una cobra — dos inversiones conectadas por un giro en la cima.',
    definition:
      'El Cobra Roll es uno de los elementos más distintivos de B&M, compuesto por dos inversiones en rápida sucesión: la pista sube en curva hasta la mitad de un looping, gira 180 grados en la cima (pasando por una breve sección invertida) y luego espeja la secuencia para salir en la misma dirección de entrada. Visto de lado, el contorno de la pista recuerda a la cabeza erguida y extendida de una cobra. Famosos Cobra Rolls aparecen en Shambhala en PortAventura, Pyrenees en Parque de Atracciones de Madrid y muchos coasters B&M invertidos de todo el mundo.',
    relatedTermIds: ['inversion', 'immelmann', 'batwing', 'b-and-m'],
  },
  {
    id: 'corkscrew',
    name: 'Sacacorchos',
    shortDefinition:
      'Una inversión en barril donde la pista espira 360 grados alrededor de un eje central — uno de los tipos de inversión más antiguos y ampliamente construidos.',
    definition:
      'El sacacorchos (corkscrew) es una de las primeras inversiones modernas, introducida por Arrow Dynamics en la década de 1970. La pista espira alrededor de un cilindro central como el sacacorchos de una botella de vino, girando a los pasajeros en un giro completo de 360 grados desplazado respecto a la dirección de viaje. Los sacacorchos se combinan a menudo en pares consecutivos y son el elemento definitorio del coaster de acero de la "era clásica". La denominación alemana "Korkenzieher" es ampliamente usada en los mapas de parques alemanes y en la señalización. Aunque los diseños de inversión más modernos lo han superado en gran medida, el sacacorchos sigue siendo un elemento muy apreciado en parques de toda Europa y Norteamérica.',
    relatedTermIds: ['inversion', 'inline-twist', 'flat-spin'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'La imagen especular de un Immelmann: la pista se sumerge pronunciadamente hacia abajo en un medio looping y sale en horizontal — invirtiendo la dirección en sentido opuesto al Immelmann.',
    definition:
      'Un Dive Loop (también llamado dive turn o Immelmann inverso) comienza donde el Immelmann termina: en lugar de subir y pasar por encima, la pista se sumerge pronunciadamente hacia abajo, trazando un arco a través de la mitad inferior de un looping antes de salir en dirección opuesta a la de entrada. La sensación es la de una zambullida descendente seguida de una fuerte tracción de salida. Los Dive Loops son un elemento característico de B&M y aparecen en muchos de los coasters invertidos y sit-down del fabricante. La combinación de Immelmanns y Dive Loops en un mismo recorrido crea cambios de dirección e inversiones variadas.',
    relatedTermIds: ['inversion', 'immelmann', 'b-and-m'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      'Un giro de 360 grados directamente alrededor del eje de la pista, proporcionando una inversión suave sin cambiar significativamente la dirección de marcha del tren.',
    definition:
      'Un Inline Twist (también llamado inline roll o barrel roll) gira el tren 360 grados alrededor del eje longitudinal de la pista — el coaster básicamente rueda sin desviarse significativamente en su dirección. A diferencia del sacacorchos (que tiene una espiral desplazada del eje de la pista), el inline twist pivota con precisión alrededor de la pista. El resultado es una inversión breve y suave con fuerzas laterales mínimas. Los Inline Twists son comunes en los flying coasters e inverted coasters de B&M, apareciendo frecuentemente en pares o combinados con otros elementos en rápida sucesión. El elemento produce una experiencia de boca abajo momentánea que resulta sorprendentemente suave.',
    relatedTermIds: ['inversion', 'corkscrew', 'heartline-roll', 'flat-spin'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Un giro de 360 grados centrado en el centro de gravedad del pasajero en lugar de en la pista misma, diseñado para ofrecer una ingravidez suave y sostenida a lo largo de la rotación.',
    definition:
      'Un Heartline Roll (o heartline spin) está diseñado de forma que el corazón del pasajero — aproximadamente el centro de gravedad del cuerpo — permanece a una altura constante durante toda la rotación, en lugar de ser la pista el punto de pivote. Este diseño minimiza las G a lo largo del giro, produciendo una suave sensación de flotación distinta al tirón de un sacacorchos estándar. Los Heartline Rolls son una característica de los diseños modernos de B&M e Intamin, asociados con hyper coasters e inverted coasters. El elemento ilustra la precisión de ingeniería necesaria para crear una experiencia de conducción suave — pequeños ajustes en la pista se traducen directamente en comodidad o incomodidad del pasajero.',
    relatedTermIds: ['inversion', 'zero-g-roll', 'inline-twist'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Un medio looping combinado con un medio sacacorchos que gira la pista 90 grados y cambia de dirección — un elemento característico de Vekoma presente en los coasters Boomerang.',
    definition:
      'Un Sidewinder consiste en un medio looping vertical que eleva el tren hacia arriba, seguido inmediatamente por un medio sacacorchos que devuelve el tren a la posición correcta mientras gira 90 grados. El resultado neto es una inversión combinada con un cambio de dirección significativo, logrado en un espacio compacto. Los Sidewinders son los componentes del icónico modelo Boomerang de Vekoma: dos Sidewinders (uno hacia adelante, otro invertido) flanquean un looping central para crear el recorrido completo. El nombre hace referencia al movimiento de giro en forma de serpiente que produce el elemento visto desde el borde de la pista.',
    relatedTermIds: ['inversion', 'boomerang', 'cobra-roll'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Una inversión masiva exclusiva de los flying coasters de B&M donde los pasajeros, ya en posición Superman, pasan por la parte inferior de un looping vertical completamente invertidos.',
    definition:
      'El Pretzel Loop es una de las inversiones más intensas del diseño de parques temáticos, presente exclusivamente en los flying coasters de B&M (donde los pasajeros yacen en horizontal en posición Superman). El elemento lleva a los pasajeros en un pronunciado descenso mientras están invertidos, pasando por la base de un gran looping y luego subiendo pronunciadamente de nuevo — la forma general recuerda a un pretzel vista de lado. Dado que el punto más bajo está en la base y los pasajeros miran hacia abajo, las G experimentadas en ese momento son extremadamente intensas. Famosos Pretzel Loops aparecen en Manta en SeaWorld Orlando y Tatsu en Six Flags Magic Mountain.',
    relatedTermIds: ['inversion', 'b-and-m', 'inline-twist'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Un elemento de doble inversión con inversión de dirección de 180 grados, que combina dos medios looopings conectados por un medio sacacorchos — la silueta recuerda a las alas extendidas de un murciélago.',
    definition:
      "Un Batwing consta de dos inversiones con inversión de dirección: la pista sube en arco hasta un medio looping, luego en la cima pasa por un medio sacacorchos que invierte el tren y revierte la dirección antes de espejear el medio looping de vuelta al nivel del suelo. La silueta vista desde arriba recuerda a las alas extendidas de un murciélago. Los Batwings son un elemento característico de B&M, presentes en coasters como Afterburn en Carowinds y The Incredible Hulk Coaster en Universal's Islands of Adventure. A diferencia del Bowtie (que no tiene cambio de dirección), el Batwing invierte la dirección del tren 180 grados durante la secuencia.",
    relatedTermIds: ['inversion', 'bowtie', 'cobra-roll', 'b-and-m'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'Una variante del looping donde la pista se aproxima desde arriba, se sumerge por el camino circular y sale de nuevo por arriba — la geometría inversa de un looping estándar.',
    definition:
      'El Norwegian Loop (a veces llamado reverse loop) tiene la geometría opuesta a un looping vertical estándar: en lugar de entrar a nivel del suelo y salir a la misma altura, el tren entra desde una posición elevada, se sumerge hacia abajo en el camino circular del looping y vuelve a salir por la parte superior. Esto significa que las fuerzas en la parte inferior del círculo — G positivas fuertes — siguen estando presentes, pero las sensaciones de entrada y salida son notablemente diferentes. Los Norwegian Loops son relativamente raros en el inventario global de coasters y están asociados principalmente con ciertos diseños de Vekoma e instalaciones personalizadas.',
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Un elemento de tipo sacacorchos en coasters invertidos o flying donde la rotación ocurre en un plano aproximadamente horizontal, creando una rotación amplia y casi nivelada.',
    definition:
      'Un Flat Spin es una inversión de tipo sacacorchos que se encuentra principalmente en los coasters invertidos y flying de B&M, donde la geometría del elemento está dispuesta de forma que la espiral parece casi horizontal para los observadores desde el suelo. En un coaster invertido (donde el tren cuelga por debajo de la pista) un Flat Spin crea una imagen especialmente dramática cuando los pasajeros barren por un círculo amplio y casi nivelado. La sensación para los pasajeros es una rotación suave y sostenida con G moderadas. Los Flat Spins son un elemento característico en los coasters invertidos de B&M como Banshee en Kings Island y Afterburn en Carowinds.',
    relatedTermIds: ['inversion', 'corkscrew', 'inline-twist', 'b-and-m'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      'Una inversión de medio sacacorchos que simultáneamente invierte la dirección del tren aproximadamente 180 grados — combinando una inversión con un cambio de dirección pronunciado.',
    definition:
      'Un Cutback es un elemento donde la pista realiza un medio sacacorchos mientras se curva sobre sí misma en torno a 180 grados. El resultado es una inversión con una inversión de dirección significativa — distinta del sacacorchos estándar, que en su mayor parte mantiene la dirección de marcha. Los Cutbacks son relativamente poco frecuentes y tienden a aparecer en ciertos modelos de Vekoma y coasters personalizados donde se requiere un cambio de dirección compacto combinado con una inversión. El nombre "cutback" refleja el aspecto visual del elemento: la pista retrocede en su dirección anterior mientras gira.',
    relatedTermIds: ['inversion', 'corkscrew', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Una variante de sea serpent de doble inversión con un punto de conexión más bajo, produciendo dos inversiones consecutivas sin cambio de dirección en un espacio compacto.',
    definition:
      'El Butterfly es un elemento de doble inversión similar al sea serpent (dos medios looopings conectados por la cima) pero con un ápice más bajo y una geometría distinta. Al igual que el sea serpent, produce dos inversiones sin cambiar la dirección del tren, pero la pieza de conexión entre los dos medios looopings pasa por una sección invertida más baja en lugar de una cresta alta. Esto hace que el Butterfly sea más compacto en altura. El elemento aparece en ciertos diseños de Vekoma y coasters personalizados, y se distingue del Bowtie (sin cambio de dirección, misma idea pero diferente geometría) y del Batwing (que sí tiene cambio de dirección).',
    relatedTermIds: ['inversion', 'bowtie', 'batwing'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Un elemento de doble inversión donde dos medios looopings en espejo forman la silueta de una pajarita — dos inversiones sin cambio de dirección.',
    definition:
      'Un Bowtie es un elemento de doble inversión compuesto por dos medios looopings en espejo conectados en su cima. A diferencia del Batwing (que revierte la dirección), el Bowtie sale con la misma dirección general de entrada. Visto desde arriba, el contorno de la pista recuerda a una pajarita. Los Bowties son relativamente raros y se encuentran principalmente en ciertas instalaciones de Vekoma y personalizadas. El elemento produce dos inversiones suaves en rápida sucesión manteniendo la dirección general de marcha, ofreciendo una sensación diferente al Batwing con cambio de dirección a pesar de una apariencia superficialmente similar.',
    relatedTermIds: ['inversion', 'batwing', 'butterfly'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Una serie de pequeñas colinas rápidas cerca del final del recorrido que producen un suave airtime flotante cuando el tren va perdiendo velocidad.',
    definition:
      'Un Bunnyhop (salto de conejo) es una serie de colinas pequeñas y rápidas situadas hacia el final del recorrido cuando el tren ha perdido la mayor parte de su energía cinética. A esa velocidad reducida, las colinas generan un suave floater airtime — una flotación rítmica y ligera en lugar del intenso ejector airtime de las colinas más rápidas al inicio del recorrido. El nombre refleja el movimiento ligero y saltarín que recuerda al salto de un conejo. Los Bunnyhops son finales habituales en hyper coasters, giga coasters y montañas rusas de madera, proporcionando un remate alegre antes del brake run. Los entusiastas suelen considerar los Bunnyhops bien ejecutados como señal de un diseño de recorrido cuidadoso.',
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'Una airtime hill inclinada más allá de los 90 grados que lanza a los pasajeros de lado mientras simultáneamente produce G negativas — bautizada en honor al legendario ingeniero Werner Stengel y elemento característico de Mack Rides.',
    definition:
      'El Stengel Dive es un elemento de airtime donde la pista se inclina más allá de los 90 grados (más allá de la vertical) de forma que los pasajeros quedan colgando de lado o ligeramente por encima mientras experimentan simultáneamente G negativas del perfil de la colina. Esta combinación única de desorientación lateral y airtime produce una sensación que no tiene equivalente en ninguna colina o inversión estándar. El elemento lleva el nombre del ingeniero alemán Werner Stengel, el diseñador detrás de algunos de los coasters más importantes de la historia. Los Stengel Dives son un elemento característico de los hyper coasters de Mack Rides: Blue Fire Megacoaster en Europa-Park fue el primer coaster en incorporar uno, y los hypers posteriores de Mack como Ride to Happiness en Plopsaland y Kondaa en Walibi Belgium incluyen múltiples ejemplos.',
    relatedTermIds: ['airtime-hill', 'mack-rides', 'airtime'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Una curva muy peraltada de 180 grados con forma de herradura que redirige el tren en dirección opuesta — habitualmente usada para girar el tren entre segmentos de lanzamiento.',
    definition:
      'Un Horseshoe es una curva semicircular con un peralte muy pronunciado — normalmente entre 75 y 90 grados — que redirige el coaster 180 grados (invirtiendo su dirección). El peralte extremo evita G laterales excesivas en el radio ajustado. Los Horseshoes se usan frecuentemente en recorridos de coasters lanzados como elementos de cambio de sentido entre múltiples segmentos de lanzamiento, proporcionando al tren un giro en U antes de la siguiente fase de aceleración. El elemento es visualmente impresionante y un sello distintivo de los coasters aceleradores de Intamin y los multi-launch coasters de Mack. Redirige el tren de forma eficiente en un espacio compacto manteniendo la velocidad.',
    relatedTermIds: ['launch-coaster', 'intamin', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Una pequeña bajada justo antes de la primera caída principal en un coaster con cadena, usada para reducir la tensión de la cadena y proporcionar un breve momento de airtime anticipatorio.',
    definition:
      'Un predrop (pre-caída) es una pequeña colina o depresión situada en el tramo final de la lifthill, justo antes de la cresta que lleva a la primera caída principal. Su función de ingeniería principal es reducir la tensión en la cadena de ascenso cuando el tren corona — evitando una transición brusca o brusca entre el ascenso motorizado y la caída libre. Un beneficio secundario es la experiencia del pasajero: el breve pop de airtime al coronar el predrop ofrece un adelanto tentador de la ingravidez antes de la zambullida principal. Los predrops se han convertido en un elemento de diseño popular en coasters de madera y de acero, siendo algunos — como el predrop del Goliath en Six Flags Magic Mountain — tan esperados como la propia caída.',
    relatedTermIds: ['lifthill', 'first-drop', 'airtime'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Un elemento alto y estrecho con un ascenso y descenso casi verticales que recuerda a un sombrero de copa — un elemento característico de los coasters Intamin de lanzamiento hidráulico.',
    definition:
      'Un Top Hat es un elemento distintivo donde la pista asciende casi verticalmente hasta una cresta afilada y luego cae casi verticalmente por el otro lado — creando un perfil que recuerda a un sombrero de copa visto de lado. Los Top Hats interiores (estándar) se inclinan hacia dentro en la cima; los exteriores se inclinan hacia fuera para una sensación de exposición e airtime intenso. El elemento está fuertemente asociado con los coasters de lanzamiento hidráulico de Intamin (aceleradores): tras el lanzamiento inicial a 200 km/h o más, el Top Hat es el punto central dramático del recorrido. Kingda Ka (139 m), Top Thrill Dragster (128 m) y Red Force en Ferrari Land cuentan con icónicos Top Hats.',
    relatedTermIds: ['launch-coaster', 'intamin', 'first-drop'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      'Una montaña rusa que un entusiasta ha montado oficialmente y añadido a su contador personal — coleccionar credits es una actividad central dentro de la comunidad de entusiastas de coasters.',
    definition:
      'Un credit de coaster (o simplemente "credit" o "cred") es una montaña rusa que un entusiasta ha montado y añadido oficialmente a su contador personal. La práctica de "coleccionar credits" — montar en el mayor número posible de coasters diferentes — es una de las actividades definitorias de la comunidad de entusiastas de montañas rusas. Las reglas sobre lo que cuenta como credit varían: algunos entusiastas cuentan únicamente los coasters sit-down, otros incluyen todas las atracciones con rails; algunos exigen que cada tipo de tren en un mismo coaster cuente como un credit, otros no. Sitios de seguimiento como la Roller Coaster Database (RCDB) permiten a los entusiastas registrar sus contadores. La búsqueda de credits motiva a muchos entusiastas a viajar internacionalmente y visitar parques poco conocidos.',
    relatedTermIds: ['pov', 'wooden-coaster', 'hybrid-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Grabación en punto de vista desde la primera fila de una montaña rusa, ofreciendo a los visitantes potenciales una vista previa virtual de la experiencia.',
    definition:
      'POV (Point of View, punto de vista) se refiere a vídeo grabado desde la perspectiva de un pasajero de primera fila, normalmente con una cámara montada en el tren. Los vídeos POV son uno de los formatos de contenido más populares en la comunidad de entusiastas de parques temáticos y son ampliamente usados por los visitantes potenciales para previsualizar un coaster antes de ir al parque. Los operadores de parques a veces producen POVs oficiales con fines promocionales; con mayor frecuencia los graban visitantes o medios de comunicación. Un POV bien producido muestra claramente cada elemento, caída e inversión en secuencia. YouTube alberga decenas de miles de vídeos POV de coasters. El término también se usa de forma más amplia para describir cualquier grabación en primera persona de atracciones del parque.',
    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Una situación en la que varios trenes llegan al brake run antes de que la estación esté libre, provocando una acumulación de trenes — señal de operaciones ineficientes que aumenta los tiempos de espera.',
    definition:
      'El Stacking se produce cuando el proceso de carga y descarga de una montaña rusa es más lento que el tiempo de ciclo del recorrido, haciendo que los trenes se acumulen en el brake run esperando a que la estación quede libre. En lugar de despachar un tren cuando el anterior regresa, el operador tiene que retener varios trenes en el brake run — lo que puede detener brevemente la atracción entre despachos. El stacking reduce directamente la capacidad de la atracción y alarga los tiempos de espera en cola. Las causas habituales incluyen una carga lenta de pasajeros (frecuentemente por sistemas de retención complejos), requisitos de consigna de equipaje voluminosos o falta de personal. Los visitantes experimentados pueden observar si un coaster está haciendo stacking durante su espera y tenerlo en cuenta a la hora de decidir.',
    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Tipo de montaña rusa en la que el tren cuelga bajo el rail y los pies de los pasajeros cuelgan libremente.',
    definition:
      'Un Inverted Coaster es una montaña rusa en la que el tren está fijado rígidamente bajo el rail, con los pasajeros sentados con los pies colgando libremente. A diferencia de una suspended coaster (que oscila lateralmente), el tren de un Inverted Coaster no puede moverse hacia los lados. B&M desarrolló el diseño moderno en 1992 con Batman The Ride. Los Inverted Coasters son famosos por sus intensos near-misses, zero-g rolls y cobra rolls. Ejemplos europeos destacados: Nemesis (Alton Towers), Katun (Mirabilandia) y Oziris (Parc Astérix).',
    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Tipo de coaster con asientos a ambos lados del rail — sin nada encima, debajo ni al lado de los pasajeros.',
    definition:
      'Un Wing Coaster (o Wing Rider) coloca dos asientos a cada lado del rail, dejando a los pasajeros sin ninguna estructura encima, debajo ni a los lados. Este diseño maximiza la sensación de vuelo y crea impresionantes near-misses con la decoración y las estructuras. B&M es el principal fabricante. Ejemplos notables en Europa: The Swarm (Thorpe Park), GateKeeper (Cedar Point) y Flug der Dämonen (Europa-Park), considerado uno de los mejores coasters de Europa.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'dive-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Montaña rusa con vagones que giran libremente sobre un eje vertical, ofreciendo una experiencia diferente en cada viaje.',
    definition:
      'Un Spinning Coaster cuenta con vagones montados en una plataforma giratoria que rota libremente alrededor de un eje vertical. Como la rotación no está controlada, cada vehículo experimenta una secuencia diferente de avance, retroceso y movimiento lateral. Mack Rides (Waldkirch, Alemania) y Gerstlauer son los principales fabricantes. Los Spinning Coasters son considerados excelentes atracciones familiares — lo suficientemente intensos para ser emocionantes, pero sin los requisitos de talla de los coasters más exigentes.',
    relatedTermIds: ['mack-rides', 'launch-coaster', 'credit'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Montaña rusa que supera los 61 m de altura, generalmente sin inversiones y enfocada en velocidad y airtime.',
    definition:
      'Hyper Coaster es la clasificación para montañas rusas entre 61 y 91 m de altura. B&M llama a sus modelos "Hyper Coaster"; Intamin usa el término "Mega Coaster" para su tipo equivalente. Ambos se centran en grandes colinas de airtime a alta velocidad en lugar de inversiones. Shambhala en PortAventura (España) es el Hyper Coaster más alto y rápido de Europa con 76 m, y está considerado uno de los mejores coasters del continente.',
    relatedTermIds: ['giga-coaster', 'airtime', 'b-and-m', 'intamin', 'airtime-hill'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition:
      'Montaña rusa que supera los 91 m de altura — un escalón por encima del Hyper Coaster.',
    definition:
      'Giga Coaster es la clasificación para montañas rusas entre 91 y 121 m de altura. El término fue acuñado por Cedar Fair e Intamin para Millennium Force en Cedar Point en el año 2000. Los Giga Coasters enfatizan la altura extrema, los circuitos largos y los enormes momentos de airtime. Fury 325 en Carowinds es considerado por muchos aficionados el mejor coaster de acero del mundo. En Europa no existe ningún Giga Coaster en 2025.',
    relatedTermIds: ['hyper-coaster', 'airtime', 'first-drop'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Curva con peralte superior a 90°, que inclina brevemente a los pasajeros más allá de la vertical.',
    definition:
      'Un Overbanked Turn es una curva donde el peralte supera los 90 grados — el carril exterior está más alto que la vertical, inclinando brevemente a los pasajeros más allá de la posición invertida sin completar una inversión completa. El elemento genera una característica combinación de G laterales y leves G negativas en el punto más alto del peralte. Las curvas overbanked son un elemento característico de los Hyper Coasters de B&M y los Mega Coasters de Intamin, y son omnipresentes en los layouts de RMC.',
    relatedTermIds: ['inversion', 'airtime', 'b-and-m', 'rmc', 'intamin'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'Freno magnético a mitad de recorrido que reduce la velocidad del tren sin detenerlo por completo.',
    definition:
      'Un Trim Brake es un sistema de frenado colocado a mitad del recorrido de una montaña rusa para reducir la velocidad del tren — sin detenerlo completamente como un block brake. Se utilizan para gestionar las G-fuerzas, reducir el desgaste de la vía o cumplir requisitos de seguridad. Los aficionados suelen criticarlos porque pueden atenuar notablemente las sensaciones del recorrido — las colinas de airtime resultan menos intensas cuando el tren ha sido frenado antes. La activación de los trim brakes puede variar según la temporada, las condiciones meteorológicas y la carga del tren.',
    relatedTermIds: ['block-brake', 'brake-run', 'airtime'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Cuando un launch coaster no alcanza la cima del circuito y rueda hacia atrás por el carril de lanzamiento.',
    definition:
      'Un rollback ocurre cuando un coaster lanzado no genera suficiente velocidad para coronar el punto más alto del circuito y rueda hacia atrás por la gravedad hasta la posición de lanzamiento. En los launch coasters hidráulicos (Top Thrill Dragster, Stealth) sucede cuando el mecanismo de lanzamiento no entrega la potencia completa. El tren rueda suavemente hacia atrás y es detenido por frenos magnéticos. Los rollbacks son raros pero son una característica conocida de los launch coasters hidráulicos. Los pasajeros no corren ningún peligro.',
    relatedTermIds: ['launch-coaster', 'block-brake', 'downtime'],
  },
  {
    id: 'animatronics',
    name: 'Animatrónica',
    shortDefinition:
      'Figuras robóticas utilizadas en dark rides y espectáculos para crear personajes y escenas realistas.',
    definition:
      "La animatrónica (animatronics) engloba las figuras robóticas electromecánicas empleadas en las atracciones y espectáculos de los parques temáticos para representar personajes o criaturas de forma realista. Disney acuñó el término «Audio-Animatronics» en 1964 durante la Exposición Universal. Las animatrónicas modernas van desde simples figuras cíclicas hasta robots sofisticados con expresiones faciales complejas y movimientos corporales completos. Ejemplos de referencia: el chamán Na'vi en Pandora (Walt Disney World) y los dinosaurios de la atracción Jurassic World (Universal).",
    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'Predicción IA',
    shortDefinition:
      'Predicciones basadas en machine learning para niveles de afluencia y tiempos de espera — hasta 30+ días de antelación.',
    definition:
      'Una predicción IA utiliza modelos de machine learning entrenados con datos históricos de afluencia, datos meteorológicos, calendarios escolares y datos en tiempo real para predecir cuán concurrido estará un parque o atracción en un día u hora concretos. park.fan genera predicciones IA para afluencia y tiempos de espera previstos hasta 30+ días de antelación.\n\nLas predicciones se actualizan continuamente a medida que llegan nuevos datos. Las predicciones a corto plazo (1–7 días) suelen ser muy precisas al incorporar datos meteorológicos actuales, anuncios de eventos y señales de reserva. Las predicciones a largo plazo son naturalmente menos precisas, pero siguen siendo valiosas para identificar períodos tranquilos o concurridos con bastante antelación.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'opening-hours',
    name: 'Horario de apertura',
    shortDefinition:
      'El programa diario oficial que indica cuándo abre y cierra un parque temático o atracción.',
    definition:
      'El horario de apertura es el programa diario publicado para un parque temático o atracción individual — indica cuándo comienza el acceso y cuándo finaliza la operación. La mayoría de los grandes parques publican un calendario rotativo con semanas o meses de antelación, aunque los horarios pueden cambiar a corto plazo por eventos especiales, ajustes estacionales o problemas operativos.\n\npark.fan muestra los horarios de apertura de cada parque. Los horarios marcados con «Est.» (Estimado) se han derivado de patrones históricos y no están confirmados oficialmente por el parque — deben verificarse antes de una visita planificada.',
    relatedTermIds: ['rope-drop', 'crowd-calendar', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendencia de espera',
    shortDefinition:
      'La dirección del cambio en la longitud de la cola durante los últimos 30 minutos — subiendo, bajando o estable.',
    definition:
      'La tendencia de espera indica si la cola de una atracción es más larga, más corta o igual que hace 30 minutos. park.fan la representa con una flecha: hacia arriba (cola creciendo), hacia abajo (cola reduciéndose) u horizontal (estable).\n\nLa tendencia suele ser más reveladora que el tiempo de espera bruto. Una atracción con 45 minutos y tendencia a la baja es mejor opción que una con 40 minutos y tendencia fuertemente al alza — para cuando llegues, la primera cola puede haber bajado a 30 minutos mientras la segunda ya alcanza los 55.',
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-level'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride sin raíles fijos — los vehículos navegan libremente guiados por tecnología integrada en el suelo.',
    definition:
      'Un Trackless Ride es un tipo de dark ride en el que los vehículos no están limitados a un carril fijo, sino que navegan de forma autónoma por el espacio de la atracción, guiados por bucles de inducción, Wi-Fi o láser integrados en el suelo. La libertad de movimiento permite escenografías mucho más complejas y narrativas no lineales. Ejemplos emblemáticos: Star Wars: Rise of the Resistance (Disney), Ratatouille: La Aventura Totalmente Loca de Remy (Disneyland Paris) y Symbolica (Efteling, Países Bajos).',
    relatedTermIds: ['dark-ride', 'animatronics', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'IA',
    shortDefinition:
      'Inteligencia Artificial — los modelos de machine learning que calculan las previsiones de afluencia y los tiempos de espera.',
    definition:
      'La IA (Inteligencia Artificial) se refiere a los algoritmos de machine learning que reconocen patrones en grandes conjuntos de datos y generan predicciones. park.fan utiliza modelos de IA entrenados con años de datos históricos de tiempos de espera, calendarios escolares, datos meteorológicos y anuncios de eventos para producir previsiones diarias de afluencia y tiempos de espera — hasta 30+ días de antelación.',
    relatedTermIds: ['ai-forecast', 'crowd-forecast', 'crowd-calendar'],
    aliases: ['Inteligencia Artificial'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Tiempo de espera en vivo',
    shortDefinition:
      'Datos de tiempo de espera actualizados en tiempo real directamente desde los sistemas del parque.',
    definition:
      'Un tiempo de espera en vivo es el dato actual en tiempo real extraído directamente de los sistemas del parque — no un promedio histórico, sino el dato real al minuto. park.fan obtiene tiempos de espera en vivo de las APIs oficiales de los parques y fuentes de terceros, actualizando cada minuto.',
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-forecast'],
    aliases: ['Tiempos de espera en vivo', 'Espera en tiempo real'],
  },
  {
    id: 'crowd-forecast',
    name: 'Previsión de afluencia',
    shortDefinition:
      'Predicción basada en IA de la afluencia en un parque temático para un día específico.',
    definition:
      'Una previsión de afluencia es una predicción basada en datos de cuánto de lleno estará un parque temático en un día u hora específicos. park.fan recalcula las previsiones de afluencia diariamente usando datos históricos de asistencia, calendarios escolares, datos meteorológicos y eventos especiales. Los resultados alimentan directamente el calendario de afluencia: los días verdes indican colas cortas, los días rojos señalan afluencia máxima con largas esperas.',
    relatedTermIds: ['crowd-calendar', 'ai-forecast', 'peak-day', 'crowd-level'],
    aliases: ['Previsiones de afluencia'],
  },
  {
    id: 'g-force',
    name: 'Fuerza G',
    shortDefinition:
      "La unidad de aceleración que experimentan los pasajeros, medida como múltiplos de la aceleración gravitacional terrestre (9,81 m/s²).",
    definition:
      'La fuerza G (equivalente gravitacional) mide la aceleración que experimenta un pasajero en relación con la gravedad normal de la Tierra. Las fuerzas G positivas (por encima de 1G) presionan a los pasajeros contra sus asientos al pasar por valles o curvas cerradas. Las fuerzas G negativas (por debajo de 0G) levantan a los pasajeros de sus asientos y crean airtime. Las fuerzas G laterales actúan horizontalmente, empujando a los pasajeros hacia los lados en curvas y transiciones.\n\nLas montañas rusas están diseñadas para secuenciar estas fuerzas de forma deliberada. Un valle que genera 4–5G es la marca de una transición del primer descenso potente. Un breve momento de −0,5G en una colina de airtime produce la característica sensación de flotación. La mayoría de las atracciones apuntan a 0–5G de fuerzas positivas sostenidas, con picos breves para efectos dramáticos. Una exposición prolongada a fuerzas G elevadas puede causar malestar o greyout; las montañas rusas bien diseñadas equilibran los picos de intensidad con secciones de recuperación.',
    relatedTermIds: ['airtime', 'inversion', 'lateral-gs', 'hangtime'],
    aliases: ['Fuerzas G', 'G-Force', 'G-Forces'],
  },
  {
    id: 'lateral-gs',
    name: 'Fuerzas Laterales',
    shortDefinition:
      'Fuerzas horizontales que empujan a los pasajeros hacia los lados en curvas, transiciones y secciones en hélice.',
    definition:
      "Las fuerzas G laterales (o fuerzas laterales) son las aceleraciones horizontales que experimentan los pasajeros cuando una montaña rusa cambia de dirección en el plano horizontal — en curvas inclinadas o no inclinadas, hélices y cambios de dirección. Las fuerzas laterales bien diseñadas son suaves y controladas, contribuyendo a una experiencia dinámica. Las fuerzas laterales mal diseñadas o rugosas se sienten como ser lanzado bruscamente contra el respaldo o el costado del asiento, lo que puede ser incómodo o doloroso.\n\nLos entusiastas distinguen entre fuerzas laterales suaves e intencionales — como en las amplias curvas bajas de una clásica montaña rusa de madera — y fuerzas laterales bruscas debidas al desgaste del carril o a una ingeniería deficiente. Las montañas rusas de madera están especialmente asociadas al movimiento lateral: la flexibilidad del carril y la energía lateral de las curvas no inclinadas se consideran parte de la experiencia auténtica. Las secuencias laterales suaves en secciones de hélice — como en Balder en Liseberg — son frecuentemente citadas como momentos destacados por los aficionados.",
    relatedTermIds: ['g-force', 'airtime', 'helix', 'wooden-coaster'],
    aliases: ['Laterales', 'Fuerzas G Laterales', 'Lateral G'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Intensas fuerzas G negativas que proyectan bruscamente a los pasajeros fuera de su asiento, retenidos solo por el arnés de rodillas.',
    definition:
      "El ejector airtime describe la forma más intensa de fuerzas G negativas: la trayectoria de la atracción se desvía tan bruscamente de la caída libre que los pasajeros son lanzados con fuerza fuera de sus asientos, retenidos únicamente por el arnés de rodillas. La sensación es la de ser activamente expulsado del asiento — distinta del suave y prolongado flotamiento del floater airtime, el ejector es repentino y puede rozar lo violento si la transición es demasiado abrupta.\n\nEl ejector airtime se asocia especialmente con los hybrid coasters RMC, ciertos hyper coasters Intamin y las modernas montañas rusas de madera con colinas parabólicas pronunciadas. Los entusiastas describen los mejores momentos de ejector como el punto culminante de un circuito — un breve e impactante instante de ingravidez real. Untamed en Walibi Holland, Wildfire en Kolmården y Steel Vengeance en Cedar Point son frecuentemente citados por sus secuencias ejector entre las más intensas del mundo.",
    relatedTermIds: ['airtime', 'floater-airtime', 'airtime-hill', 'rmc', 'g-force'],
    aliases: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Suaves y prolongadas fuerzas G negativas que producen una larga sensación de flotación al coronar una colina.',
    definition:
      'El floater airtime describe el extremo suave del espectro de fuerzas G negativas: una sensación lenta y prolongada en la que los pasajeros se elevan ligeramente de su asiento y flotan en ingravidez durante un largo momento mientras el tren corona una colina siguiendo un arco parabólico gradual. La fuerza es leve — típicamente entre −0,1G y −0,3G — lo que la hace accesible y placentera incluso para los pasajeros que encuentran demasiado intenso el ejector airtime.\n\nEl floater airtime es característico de los hyper y giga coasters de B&M, que utilizan grandes colinas suavemente redondeadas diseñadas para producir largas fases de flotación. Shambhala en PortAventura, Silver Star en Europa-Park y Goliath en Walibi Holland son ejemplos europeos celebrados por sus largas secuencias floater. Muchos entusiastas encuentran la calidad relajada del floater más cómoda y repetible que la aguda intensidad del ejector, aunque las opiniones están divididas sobre cuál estilo es superior.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'airtime-hill', 'b-and-m', 'g-force'],
    aliases: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'La sensación de colgar suspendido en los arneses durante una inversión, causada por fuerzas G negativas boca abajo.',
    definition:
      "El hangtime describe la experiencia particular de las fuerzas G negativas durante una inversión: el tren permanece suficiente tiempo cerca del apogeo de un elemento invertido para que las fuerzas G negativas tengan efecto — los pasajeros quedan literalmente suspendidos en sus arneses. A diferencia del breve momento invertido de un looping rápido, el hangtime ocurre cuando el tren reduce la velocidad cerca del apex de la inversión y crea una suspensión prolongada. El peso del cuerpo se desplaza completamente hacia los arneses de hombros o el arnés de rodillas, creando una sensación de desorientación memorable.\n\nEl hangtime es más pronunciado en los elementos donde el tren reduce considerablemente la velocidad cerca del apex de la inversión — el pretzel loop en los flying coasters es el ejemplo clásico, ya que la velocidad es suficientemente baja para fuerzas G negativas sostenidas en posición completamente invertida. El heartline roll de algunas atracciones modernas también puede producir hangtime. Los entusiastas generalmente consideran el hangtime como una de las sensaciones de inversión más emocionantes.",
    relatedTermIds: ['inversion', 'pretzel-loop', 'heartline-roll', 'g-force', 'airtime'],
    aliases: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Elemento de montaña rusa',
    shortDefinition:
      'Una sección o característica nombrada de una montaña rusa, como un loop, una colina de airtime o una inversión.',
    definition:
      'Un elemento de montaña rusa es cualquier característica distinta y denominada incorporada en el trazado de una montaña rusa — desde inversiones clásicas como loops y sacacorchos hasta elementos no inversores como colinas de airtime, hélices y overbanks. Los ingenieros diseñan cada elemento para producir una sensación física específica: ingravidez (airtime), fuerzas G laterales o la desorientación de ir boca abajo.\n\nEl glosario de park.fan cubre docenas de elementos individuales — desde el primer drop y el lifthill hasta especialidades modernas como el Stengel dive, el Norwegian loop y el heartline roll.',
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop', 'helix', 'first-drop'],
    aliases: ['Elementos de montaña rusa'],
  },
];

export default translations;
