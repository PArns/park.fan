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
    alternateNames: ['Cola', 'Tiempo en cola'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Un carril separado para visitantes dispuestos a viajar solos para llenar asientos vacíos.',
    definition:
      'La cola Single Rider permite a los visitantes dispuestos a viajar solos llenar los asientos vacíos en los vehículos de las atracciones. Como los Single Riders encajan en los espacios libres, la cola avanza mucho más rápido que la fila estándar — a menudo con tiempos de espera un 50–70% más cortos. No todas las atracciones ofrecen esta opción; compruébalo antes de unirte a la cola.',
    alternateNames: ['Single Rider Lane', 'Fila individual'],

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
    alternateNames: ['Flash Pass', 'Express Pass', 'Lightning Lane'],

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
    aliases: ['Días pico'],
    alternateNames: ['Temporada Alta', 'Día Concurrido', 'Día de máxima afluencia'],

    relatedTermIds: ['crowd-level', 'crowd-calendar', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Renovación',
    shortDefinition:
      'Un período de cierre planificado durante el cual una atracción se somete a mantenimiento o mejoras.',
    definition:
      'Una renovación es un período de mantenimiento o renovación programado durante el cual una atracción, espectáculo o área del parque está temporalmente cerrada. Las renovaciones pueden durar desde unos pocos días hasta varios meses. park.fan marca las atracciones que actualmente están en renovación.',
    aliases: ['Reformas'],
    alternateNames: ['Rehabilitación', 'Refurb', 'Mantenimiento prolongado'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Tiempo de inactividad',
    shortDefinition:
      'Un cierre temporal no planificado de una atracción, a menudo debido a un fallo técnico.',
    definition:
      'El tiempo de inactividad se refiere a un cierre temporal no programado de una atracción — distinto de una renovación planificada. Los tiempos de inactividad son causados por fallos técnicos, verificaciones de seguridad, incidentes con visitantes o condiciones meteorológicas adversas. park.fan muestra el estado operativo actual de cada atracción rastreada en tiempo real.',
    aliases: ['Averías'],
    alternateNames: ['Fuera de Servicio', 'Problema Técnico', 'Parada técnica'],

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
    aliases: ['Entrada anticipada'],
    alternateNames: ['Extra Magic Hours', 'Acceso Anticipado', 'Early Park Entry'],

    relatedTermIds: ['rope-drop', 'express-pass', 'peak-day'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Un complemento de ticket que permite visitar varios parques del mismo resort en el mismo día.',
    definition:
      'Un ticket Park Hopper permite acceder a dos o más parques del mismo resort en un solo día. La opción Park Hopper de Disney, por ejemplo, permite moverse entre Magic Kingdom, EPCOT, Hollywood Studios y Animal Kingdom a partir de las 14:00 horas. Es especialmente útil cuando atracciones o experiencias específicas están distribuidas entre varios parques.',
    aliases: ['Park-Hopper'],
    alternateNames: ['Park Hopping', 'Ticket multiparque'],

    relatedTermIds: ['season-pass', 'rope-drop', 'crowd-calendar'],
  },
  {
    id: 'season-pass',
    name: 'Pase anual',
    shortDefinition: 'Un ticket anual que permite visitas ilimitadas al parque durante 12 meses.',
    definition:
      'Un pase anual (Annual Pass) ofrece entradas ilimitadas a uno o más parques durante un período de 12 meses. Los niveles superiores suelen incluir ventajas como descuentos en restauración, aparcamiento gratuito y descuentos en merchandising. Algunos pases tienen fechas bloqueadas (blockout dates) en los días de mayor afluencia. Para los visitantes habituales — generalmente tres o más visitas al año — un pase anual casi siempre resulta más económico que los tickets individuales.',
    aliases: ['Pases de temporada', 'Abono anual'],
    alternateNames: ['Annual Pass', 'Season Pass', 'Tarjeta Anual', 'Abono de temporada'],

    relatedTermIds: ['park-hopper', 'peak-day', 'express-pass'],
  },
  {
    id: 'height-requirement',
    name: 'Talla mínima',
    shortDefinition:
      'Una estatura mínima que los visitantes deben tener para acceder a una atracción específica.',
    definition:
      'La talla mínima es una norma de seguridad establecida por los parques para garantizar que los sistemas de retención — barras de seguridad, arneses, cinturones — funcionen correctamente para cada pasajero. Suele oscilar entre 90 y 140 cm dependiendo de la intensidad de la atracción. Algunas atracciones también tienen una altura o peso máximo. Comprueba siempre los requisitos de talla antes de visitar con niños pequeños para evitar decepciones.',
    aliases: ['Tallas mínimas', 'requisitos mínimos de talla'],
    alternateNames: ['Requisito de Estatura', 'Restricción de Altura', 'Altura mínima requerida'],

    relatedTermIds: ['ride-capacity', 'refurbishment'],
  },
  {
    id: 'themed-land',
    name: 'Zona temática',
    shortDefinition:
      'Una zona autónoma dentro de un parque temático construida en torno a un tema coherente.',
    definition:
      "Una zona temática es un área delimitada dentro de un parque temático que combina un diseño visual unificado, una historia de fondo y atracciones, restaurantes y tiendas a juego. Ejemplos famosos incluyen El Mundo Mágico de Harry Potter en Universal, Star Wars: Galaxy's Edge en Disney y Polynesia en PortAventura. Las zonas temáticas crean una experiencia inmersiva y suelen ser las zonas más fotografiadas del parque.",
    aliases: ['Zonas temáticas'],
    alternateNames: ['Área Temática', 'Land', 'Mundo temático'],

    relatedTermIds: ['ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'La apertura no oficial de una atracción antes de su fecha de lanzamiento anunciada.',
    definition:
      'Un Soft Opening ocurre cuando un parque abre discretamente una nueva atracción o zona antes de la fecha oficial — a menudo sin ningún anuncio. Los parques utilizan los Soft Openings para probar sistemas en condiciones reales, detectar problemas operativos y ajustar los procedimientos de embarque. Como pueden comenzar y detenerse sin previo aviso, son un plus para los visitantes afortunados que estén en el parque ese día, pero no una base fiable para planificar la visita. Los foros de entusiastas y las redes sociales suelen ser los primeros en reportarlos.',
    alternateNames: ['Soft Launch', 'Apertura blanda'],

    relatedTermIds: ['refurbishment', 'downtime', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition: 'La cola normal de una atracción, sin reserva ni pase especial.',
    definition:
      'La cola Standby es la fila de espera física estándar accesible a todos los visitantes sin ticket adicional ni mejora. Quien hace Standby espera en orden de llegada — el tiempo mostrado refleja directamente la afluencia actual en la atracción. En los días más concurridos, los tiempos de Standby en las atracciones principales pueden superar los 90 minutos. park.fan sigue los tiempos de Standby en tiempo real para ayudarte a encontrar siempre la cola más corta.',
    aliases: ['Cola standby'],
    alternateNames: ['Cola Normal', 'Cola Estándar', 'Fila regular'],

    relatedTermIds: ['wait-time', 'single-rider', 'virtual-queue', 'express-pass'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'El sistema de acceso prioritario de pago de Disney, sucesor del programa FastPass+.',
    definition:
      'Lightning Lane es el nombre que Disney da a su sistema de cola prioritaria, introducido en 2021 como sucesor del gratuito FastPass+. Existe en dos modalidades: Individual Lightning Lane (ILL), vendida por separado para las atracciones más demandadas, y Lightning Lane Multi Pass (LLMP), una suscripción diaria que permite reservar franjas horarias de retorno en una selección de atracciones. La Lightning Lane ha generado mucho debate en la comunidad porque convirtió una ventaja antes gratuita en un servicio de pago. El calendario de afluencia de park.fan te ayuda a valorar en qué días vale la pena adquirirla.',
    alternateNames: ['Lightning Lane Multi Pass', 'Individual Lightning Lane', 'LLMP', 'ILL'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'El anterior complemento diario de Disney que daba acceso a Lightning Lane Multi Pass en la mayoría de las atracciones.',
    definition:
      'Genie+ (ahora renombrado Lightning Lane Multi Pass) era el complemento diario de pago de Disney que sustituyó a FastPass+. Por una tarifa por persona al día, los visitantes podían reservar un slot de Lightning Lane a la vez en una amplia selección de atracciones. Las atracciones más destacadas estaban excluidas y se vendían por separado como Individual Lightning Lane. El precio de Genie+ era dinámico y aumentaba en los días más concurridos. park.fan rastrea los niveles de afluencia en detalle para ayudarte a decidir si merece la pena el complemento.',
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie', 'Lightning Lane Multi Pass'],

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
    alternateNames: ['Temporada Baja', 'Temporada Tranquila', 'Fuera de Temporada'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'offseason',
    name: 'Cierre temporal',
    shortDefinition:
      'Período de cierre estacional en el que el parque permanece completamente cerrado al público para mantenimiento, obras o vacaciones invernales.',
    definition:
      'El cierre temporal (u OffSeason) es el período durante el cual un parque temático cierra completamente sus puertas — no se trata de una temporada baja con menor afluencia, sino de un auténtico cierre operativo. Los parques aprovechan esta ventana para realizar el mantenimiento esencial en atracciones e instalaciones, acometer reformas importantes que no son posibles con el parque en funcionamiento, y permitir al personal un período de descanso antes de la nueva temporada. Los cierres temporales se producen con más frecuencia en los meses de invierno y duran desde unas semanas hasta varios meses según el parque y su clima. En este período no hay atracciones, restaurantes ni espectáculos accesibles al público.\n\nCuando park.fan muestra el estado OffSeason para un parque, significa que no hay calendario de apertura disponible para el período actual y que la próxima fecha de apertura confirmada está aún a varias semanas. Consulta el sitio web oficial del parque para conocer la fecha exacta de reapertura — los parques más populares suelen agotar los primeros días tras la reapertura muy rápidamente.',
    aliases: ['Off-Season'],
    alternateNames: ['Cierre Invernal', 'Temporada cerrada', 'Pausa de temporada'],

    relatedTermIds: ['refurbishment', 'soft-opening', 'crowd-calendar'],
  },
  {
    id: 'ride-photo',
    name: 'Foto de atracción',
    shortDefinition:
      'Una foto o vídeo capturado automáticamente durante una atracción, disponible para comprar al finalizar el recorrido.',
    definition:
      'La foto de atracción es una imagen tomada automáticamente por una cámara fija en un momento clave del recorrido — normalmente la caída de una atracción acuática o el punto más alto de una montaña rusa. Al terminar, los visitantes pueden ver su foto en un quiosco o en la app del parque y decidir si la compran. Muchos parques ofrecen paquetes fotográficos de día que incluyen fotos ilimitadas de todas las atracciones del resort. La foto de atracción es un recuerdo muy apreciado y un clásico momento para compartir en redes sociales.',
    aliases: ['Foto On-Ride'],
    alternateNames: ['Fotos de atracción'],
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
    alternateNames: ['Child Swap', 'Rider Switch', 'Cambio de Adulto', 'Baby Switch'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Fecha de bloqueo',
    shortDefinition:
      'Un día en el que ciertos niveles de pase anual no son válidos para entrar al parque, normalmente en los días de mayor afluencia del año.',
    definition:
      'Las fechas de bloqueo (también llamadas blackout dates) son días concretos del calendario en los que determinados niveles de pase anual no son válidos para la entrada. Los parques aplican estas fechas para gestionar la capacidad en los días más concurridos: días pico, fines de semana festivos y fechas de eventos especiales. Los pases de nivel superior tienen menos o ninguna fecha de bloqueo, mientras que los pases básicos pueden tener entre 30 y 60 días bloqueados al año. Comprueba siempre el calendario de bloqueo antes de visitar si tienes un pase con restricciones. El calendario de afluencia de park.fan destaca los períodos pico para que puedas cruzarlos con las restricciones de tu pase.',
    aliases: ['Fechas bloqueadas'],
    alternateNames: ['Blackout', 'Blackout Date', 'Fecha de exclusión'],

    relatedTermIds: ['season-pass', 'peak-day', 'crowd-calendar'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Evento de entrada especial',
    shortDefinition:
      'Un evento nocturno o especial con entrada separada que requiere un ticket adicional al de acceso regular al parque, como las fiestas de Halloween o Navidad.',
    definition:
      "Un evento de entrada especial (hard ticket event) es un evento con ticket propio — generalmente vespertino — celebrado en un parque temático que requiere una entrada dedicada además de la admisión regular. Estos eventos ofrecen entretenimiento exclusivo, decoración temática y experiencias con personajes no disponibles en el horario habitual. Ejemplos conocidos son Mickey's Not-So-Scary Halloween Party y Mickey's Very Merry Christmas Party en Walt Disney World, Halloween Horror Nights en Universal o los eventos de temporada de Disneyland Paris. En los días de evento especial, los visitantes con entrada normal suelen tener que abandonar el parque entre las 18:00 y las 19:00. Las entradas frecuentemente se agotan semanas antes.",
    aliases: ['Eventos especiales'],
    alternateNames: ['Noche Especial', 'After-Hours', 'Hard Ticket Event'],

    relatedTermIds: ['season-pass', 'peak-day', 'early-entry'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'El antiguo sistema gratuito de cola prioritaria de Disney, reemplazado por el Lightning Lane de pago en 2021.',
    definition:
      'FastPass+ (originalmente FastPass, introducido en 1999) fue el sistema gratuito de cola prioritaria de Disney que permitía a los visitantes reservar ventanas horarias de regreso para atracciones sin coste adicional. En Walt Disney World se podían reservar hasta tres FastPass+ al día a través de la app My Disney Experience antes de solicitar pases adicionales uno a uno. El sistema quedó suspendido durante el cierre por la pandemia en 2020 y nunca se restableció — fue sustituido por el sistema de pago Lightning Lane a finales de 2021. FastPass+ sigue siendo uno de los cambios más comentados en la historia de Disney porque convirtió un beneficio gratuito en un servicio de pago. Conocer el sistema antiguo es útil para interpretar informes de viajes anteriores.',
    aliases: ['FastPass+'],
    alternateNames: ['FastPass Plus'],
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
    alternateNames: ['Exclusive Ride Time', 'Tiempo exclusivo en atracción'],

    relatedTermIds: ['hard-ticket-event', 'early-entry', 'rope-drop', 'credit'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Un itinerario detallado y optimizado para una visita al parque que secuencia las atracciones para minimizar los tiempos de espera y maximizar el número de atracciones en un día.',
    definition:
      'Un Touring Plan es una secuencia planificada de atracciones, comidas y movimientos por el parque diseñada para minimizar el tiempo total de espera a lo largo del día. Los planes efectivos tienen en cuenta los patrones de afluencia, la capacidad de las atracciones, la dinámica de las colas, los horarios de espectáculos y el tiempo meteorológico. Sitios como TouringPlans.com (ahora Thrill-Data) publican planes detallados basados en datos colectivos para los principales parques. Los tiempos de espera en vivo y el calendario de afluencia de park.fan son herramientas complementarias: consultar los datos en tiempo real durante la visita permite ajustar el plan sobre la marcha. En días concurridos, un buen Touring Plan puede reducir el tiempo total en cola entre un 30 y un 50% respecto a un enfoque espontáneo.',
    aliases: ['Touring Plans'],
    alternateNames: ['Plan de Visita', 'Itinerario', 'Plan de visita optimizado'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'wait-time', 'early-entry'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      'Una atracción interior que transporta a los visitantes a través de escenas iluminadas y ambientadas, combinando narrativa, efectos especiales y movimiento.',
    definition:
      'Un dark ride es una atracción en la que los visitantes viajan en un vehículo guiado por el interior de un edificio oscuro con decorados iluminados, proyecciones, animatronics y efectos especiales. A diferencia de las montañas rusas, los dark rides ponen el énfasis en la narración y la inmersión temática sobre las emociones físicas, aunque muchos combinan ambas. Ejemplos icónicos son la Haunted Mansion y Pirates of the Caribbean en Disney, Spider-Man y las atracciones de Harry Potter en Universal, o Taron en Phantasialand. Los dark rides son piezas centrales en la mayoría de los grandes parques temáticos y suelen tener algunos de los tiempos de espera más elevados.',
    aliases: ['Dark rides'],
    alternateNames: ['Atracción Interior', 'Atracción Cubierta', 'Atracción de interior'],

    relatedTermIds: ['themed-land', 'wait-time', 'vr-coaster'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, fabricante suizo de montañas rusas conocido por sus atracciones suaves y fiables y sus elementos característicos como el Immelmann, el Cobra Roll y el Zero-g Roll.',
    definition:
      'B&M (Bolliger & Mabillard) es un fabricante suizo de montañas rusas fundado en 1988 por Walter Bolliger y Claude Mabillard. La empresa es reconocida por producir atracciones excepcionalmente suaves y fiables con una experiencia de conducción distintiva: fuertes G positivas, inversiones características (Immelmann, Cobra Roll, Zero-g Roll) y excelente capacidad de despacho. B&M se especializa en coasters invertidos, sit-down con inversiones, hyper coasters (más de 60 m), giga coasters (más de 90 m), wing coasters y dive machines. Prácticamente todos los grandes parques europeos cuentan con al menos una instalación B&M, incluidos Shambhala y Dragon Khan en PortAventura, Silver Star en Europa-Park, Nemesis en Alton Towers y Goliath en Walibi Holland.',
    alternateNames: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],

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
    alternateNames: ['Mack'],

    relatedTermIds: ['stengel-dive', 'b-and-m', 'intamin', 'launch-coaster'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Rocky Mountain Construction, fabricante de Idaho que pioneró el concepto del coaster híbrido convirtiendo viejas montañas rusas de madera en pistas de acero I-box con airtime e inversiones sin precedentes.',
    definition:
      'Rocky Mountain Construction (RMC) es un fabricante y empresa de mantenimiento de montañas rusas americano con sede en Hayden, Idaho, conocido por inventar el sistema de pista de acero I-box que puede instalarse sobre la estructura de madera de un coaster existente. Esta tecnología de conversión permitió a los parques transformar viejas montañas rusas de madera en atracciones híbridas de primera clase con airtime intenso, múltiples inversiones y caídas más allá de la vertical — algo imposible en las pistas de madera tradicionales. Conversiones de RMC como Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) y Wildfire (Kolmården) se convirtieron rápidamente en favoritas de los entusiastas. En Europa, el híbrido de nueva construcción de RMC, Untamed en Walibi Holland, está considerado uno de los mejores coasters del continente.',
    alternateNames: ['Rocky Mountain Construction'],

    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Fabricante neerlandés de montañas rusas y uno de los más prolíficos del mundo, conocido por el omnipresente Boomerang y una amplia gama de coasters familiares y de emociones fuertes en parques europeos.',
    definition:
      "Vekoma Rides Manufacturing es un fabricante neerlandés de montañas rusas con sede en Vlodrop, Países Bajos, y uno de los productores más prolíficos del mundo en términos de instalaciones totales. Fundada en 1926 como empresa de ingeniería mecánica, Vekoma se reconvirtió en atracciones en la década de 1970 y alcanzó fama mundial con su Boomerang — un compacto shuttle coaster con tres inversiones que se licenció barato y se instaló en parques de todo el mundo. Otros modelos icónicos incluyen el Suspended Looping Coaster (SLC), el Giant Inverted Boomerang y el Mine Train. A partir de la década de 2010, Vekoma se reinventó con una moderna línea 'nueva generación' con sistemas de conducción más suaves, layouts innovadores y mejoradas atracciones familiares. Nuevos modelos como el Family Boomerang, el Tilt Coaster y los coasters familiares suspendidos aparecen cada vez más en parques europeos. Disney también ha encargado diseños Vekoma personalizados para sus resorts.",
    alternateNames: ['Vekoma Rides'],

    relatedTermIds: ['boomerang', 'b-and-m', 'intamin', 'gerstlauer'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Fabricante alemán conocido principalmente por el modelo Euro-Fighter con su primera caída más allá de la vertical, así como por spinning coasters y compactas atracciones familiares.',
    definition:
      'Gerstlauer Amusement Rides GmbH es un fabricante alemán de montañas rusas con sede en Münsterhausen, Baviera. Fundada en 1946 como empresa metalúrgica, se adentró en el mercado de las atracciones en la década de 1980 y construyó su reputación mundial con el modelo Euro-Fighter — un compacto coaster de lanzamiento eléctrico famoso por su caída inicial más allá de la vertical (97 grados). Los Euro-Fighters pueden instalarse en espacios reducidos, lo que los hace atractivos para parques urbanos y recintos más pequeños; ejemplos son Rage en Adventure Island y Speed en Oakwood. Gerstlauer también produce el modelo Infinity Coaster, spinning coasters y el SkyRoller, un coaster giratorio en el que los pasajeros controlan sus propias volteretas. En la comunidad de entusiastas, las montañas rusas de Gerstlauer son apreciadas por su intensidad en relación con su pequeña huella.',
    alternateNames: ['Gerstlauer Rides'],

    relatedTermIds: [
      'euro-fighter',
      'spinning-coaster',
      'xtreme-spinning-coaster',
      'b-and-m',
      'intamin',
    ],
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
    alternateNames: ['LSM Coaster', 'LIM Coaster', 'Montaña Rusa Lanzada', 'Catapulta'],

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
    aliases: ['Montañas rusas de madera'],
    alternateNames: ['Woodie', 'Woodies', 'Coaster de madera'],
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
    aliases: ['Suspended Coasters'],
    alternateNames: ['Oscilante', 'Colgante oscilante'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster híbrido',
    shortDefinition:
      'Una montaña rusa que combina una estructura de soporte de madera tradicional con una pista de acero I-box, pionera de Rocky Mountain Construction (RMC).',
    definition:
      'Un coaster híbrido combina la estructura de madera de una montaña rusa tradicional con una pista de acero I-box fabricada por Rocky Mountain Construction (RMC). La pista I-box es extremadamente precisa y suave, permitiendo elementos de inversión imposibles en pistas de madera tradicionales. RMC desarrolló esta tecnología principalmente para renovar viejas montañas rusas de madera — añadiendo inversiones, caídas más pronunciadas y airtime hills a recorridos que antes eran demasiado rugosos para disfrutarlos. Entre los híbridos de RMC más famosos están Steel Vengeance en Cedar Point (considerado a menudo el mejor coaster del mundo), Twisted Colossus en Six Flags Magic Mountain y Wildfire en Kolmården. Los híbridos RMC de nueva construcción (como Untamed en Walibi Holland) coexisten junto a las conversiones.',
    aliases: ['Hybrid Coasters'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Montaña rusa híbrida'],

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
    aliases: ['Inversiones'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      'La inversión circular clásica donde la pista forma un círculo vertical completo, llevando a los pasajeros completamente boca abajo en el punto más alto.',
    definition:
      "El looping vertical es la inversión más icónica en la historia de las montañas rusas — un círculo completo de 360 grados en el plano vertical. Los looopings modernos utilizan una forma de clotoide (lágrima) en lugar de un círculo perfecto: la entrada y la salida son anchas, mientras que la parte superior es más cerrada. Esta forma garantiza que los pasajeros experimenten G suaves y sostenidas a lo largo del recorrido en lugar de picos extremos. El primer coaster moderno con looping (Corkscrew, Knott's Berry Farm, 1975) transformó la industria. Hoy los looopings verticales anclan el contador de inversiones en coasters de todo el mundo, desde las atracciones para principiantes hasta las máquinas récord.",
    aliases: ['Loopings'],
    alternateNames: ['Bucle Vertical', 'Vertical Loop'],

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
    name: 'Zero-G Roll',
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
    aliases: ['Lift Hill'],
    alternateNames: ['Chain Lift', 'Cadena de arrastre', 'Subida de cadena'],

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
    aliases: ['Colina de airtime'],
    alternateNames: ['Camelback', 'Bunny Hill'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Una sección en espiral continua donde la pista gira alrededor de un eje central, generando G laterales sostenidas.',
    definition:
      'Una hélice es una sección de pista de montaña rusa que espira continuamente — con una forma similar a un tornillo — sin invertir a los pasajeros. A diferencia de las airtime hills o las inversiones, las hélices generan G laterales (laterales) sostenidas que empujan a los pasajeros hacia el exterior de las curvas. Una hélice descendente acelera el tren mientras gira; una hélice ascendente lo decelera generando igualmente fuerzas laterales. Las hélices se usan habitualmente para consumir la energía cinética restante al final de un recorrido ofreciendo al mismo tiempo una emocionante y sostenida sensación de giro. Entre las hélices más famosas están el final subterráneo de Nemesis en Alton Towers y la hélice de cierre de Expedition GeForce en Holiday Park.',
    aliases: ['Helices'],
    alternateNames: ['Espiral', 'Hélice', 'Bucle helicoidal'],

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
    name: 'Corkscrew',
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
    aliases: ['Credits'],
    alternateNames: ['Cred', 'Creds', 'Contador de montañas rusas'],

    relatedTermIds: ['pov', 'wooden-coaster', 'hybrid-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Grabación en punto de vista desde la primera fila de una montaña rusa, ofreciendo a los visitantes potenciales una vista previa virtual de la experiencia.',
    definition:
      'POV (Point of View, punto de vista) se refiere a vídeo grabado desde la perspectiva de un pasajero de primera fila, normalmente con una cámara montada en el tren. Los vídeos POV son uno de los formatos de contenido más populares en la comunidad de entusiastas de parques temáticos y son ampliamente usados por los visitantes potenciales para previsualizar un coaster antes de ir al parque. Los operadores de parques a veces producen POVs oficiales con fines promocionales; con mayor frecuencia los graban visitantes o medios de comunicación. Un POV bien producido muestra claramente cada elemento, caída e inversión en secuencia. YouTube alberga decenas de miles de vídeos POV de coasters. El término también se usa de forma más amplia para describir cualquier grabación en primera persona de atracciones del parque.',
    aliases: ['Point of View'],
    alternateNames: ['On-Ride Video', 'Video en cabina', 'Perspectiva de montaje'],

    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Una situación en la que varios trenes llegan al brake run antes de que la estación esté libre, provocando una acumulación de trenes — señal de operaciones ineficientes que aumenta los tiempos de espera.',
    definition:
      'El Stacking se produce cuando el proceso de carga y descarga de una montaña rusa es más lento que el tiempo de ciclo del recorrido, haciendo que los trenes se acumulen en el brake run esperando a que la estación quede libre. En lugar de despachar un tren cuando el anterior regresa, el operador tiene que retener varios trenes en el brake run — lo que puede detener brevemente la atracción entre despachos. El stacking reduce directamente la capacidad de la atracción y alarga los tiempos de espera en cola. Las causas habituales incluyen una carga lenta de pasajeros (frecuentemente por sistemas de retención complejos), requisitos de consigna de equipaje voluminosos o falta de personal. Los visitantes experimentados pueden observar si un coaster está haciendo stacking durante su espera y tenerlo en cuenta a la hora de decidir.',
    alternateNames: ['Train Stacking', 'Acumulación de trenes'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Tipo de montaña rusa en la que el tren cuelga bajo el rail y los pies de los pasajeros cuelgan libremente.',
    definition:
      'Un Inverted Coaster es una montaña rusa en la que el tren está fijado rígidamente bajo el rail, con los pasajeros sentados con los pies colgando libremente. A diferencia de una suspended coaster (que oscila lateralmente), el tren de un Inverted Coaster no puede moverse hacia los lados. B&M desarrolló el diseño moderno en 1992 con Batman The Ride. Los Inverted Coasters son famosos por sus intensos near-misses, zero-g rolls y cobra rolls. Ejemplos europeos destacados: Nemesis (Alton Towers), Katun (Mirabilandia) y Oziris (Parc Astérix).',
    aliases: ['Inverted Coasters'],
    alternateNames: ['Inverted', 'Invert', 'Montaña Rusa Invertida', 'Colgante invertida'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Tipo de coaster con asientos a ambos lados del rail — sin nada encima, debajo ni al lado de los pasajeros.',
    definition:
      'Un Wing Coaster (o Wing Rider) coloca dos asientos a cada lado del rail, dejando a los pasajeros sin ninguna estructura encima, debajo ni a los lados. Este diseño maximiza la sensación de vuelo y crea impresionantes near-misses con la decoración y las estructuras. B&M es el principal fabricante. Ejemplos notables en Europa: The Swarm (Thorpe Park), GateKeeper (Cedar Point) y Flug der Dämonen (Europa-Park), considerado uno de los mejores coasters de Europa.',
    aliases: ['Wing Coasters'],
    alternateNames: ['Wing Rider', 'Coaster ala', 'Montaña rusa de ala'],

    relatedTermIds: ['b-and-m', 'inverted-coaster', 'dive-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Montaña rusa con vagones que giran libremente sobre un eje vertical, ofreciendo una experiencia diferente en cada viaje.',
    definition:
      'Un Spinning Coaster cuenta con vagones montados en una plataforma giratoria que rota libremente alrededor de un eje vertical. Como la rotación no está controlada, cada vehículo experimenta una secuencia diferente de avance, retroceso y movimiento lateral. Mack Rides (Waldkirch, Alemania) y Gerstlauer son los principales fabricantes. Los Spinning Coasters son considerados excelentes atracciones familiares — lo suficientemente intensos para ser emocionantes, pero sin los requisitos de talla de los coasters más exigentes.',
    aliases: ['Spinning Coasters'],
    alternateNames: ['Spinner', 'Montaña rusa giratoria'],

    relatedTermIds: ['mack-rides', 'launch-coaster', 'credit'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'El modelo spinning coaster de alta intensidad de Gerstlauer — más rápido, más alto y con una rotación más pronunciada que los modelos estándar.',
    definition:
      'El Xtreme Spinning Coaster (XSC) es el modelo de referencia de Gerstlauer en la categoría spinning coaster, diseñado para llevar el formato al límite. Donde un spinning coaster estándar apunta a una intensidad familiar, el XSC ofrece una estructura más alta, caídas más pronunciadas, mayores velocidades máximas y un mecanismo de rotación calibrado para giros más marcados — los vagones giran con más fuerza y frecuencia en cada elemento del recorrido.\n\nLa impredecibilidad del giro se amplifica por el ritmo más elevado: la orientación del vagón cambia más rápido, haciendo que cada vuelta sea única. El modelo XSC posiciona a Gerstlauer entre los spinners familiares y las montañas rusas de alta intensidad, ofreciendo emoción real manteniendo el carácter rejugable que hace tan atractivos a los spinning coasters.',
    aliases: ['XSC'],
    relatedTermIds: ['spinning-coaster', 'gerstlauer', 'credit'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Montaña rusa que supera los 61 m de altura, generalmente sin inversiones y enfocada en velocidad y airtime.',
    definition:
      'Hyper Coaster es la clasificación para montañas rusas entre 61 y 91 m de altura. B&M llama a sus modelos "Hyper Coaster"; Intamin usa el término "Mega Coaster" para su tipo equivalente. Ambos se centran en grandes colinas de airtime a alta velocidad en lugar de inversiones. Shambhala en PortAventura (España) es el Hyper Coaster más alto y rápido de Europa con 76 m, y está considerado uno de los mejores coasters del continente.',
    aliases: ['Hyper Coasters'],
    alternateNames: ['Mega Coaster', 'Mega Montaña Rusa', 'Hipercoaster'],

    relatedTermIds: ['giga-coaster', 'airtime', 'b-and-m', 'intamin', 'airtime-hill'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition:
      'Montaña rusa que supera los 91 m de altura — un escalón por encima del Hyper Coaster.',
    definition:
      'Giga Coaster es la clasificación para montañas rusas entre 91 y 121 m de altura. El término fue acuñado por Cedar Fair e Intamin para Millennium Force en Cedar Point en el año 2000. Los Giga Coasters enfatizan la altura extrema, los circuitos largos y los enormes momentos de airtime. Fury 325 en Carowinds es considerado por muchos aficionados el mejor coaster de acero del mundo. En Europa no existe ningún Giga Coaster en 2025.',
    aliases: ['Giga Coasters'],
    alternateNames: ['Gigacoaster'],

    relatedTermIds: ['hyper-coaster', 'airtime', 'first-drop'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Curva con peralte superior a 90°, que inclina brevemente a los pasajeros más allá de la vertical.',
    definition:
      'Un Overbanked Turn es una curva donde el peralte supera los 90 grados — el carril exterior está más alto que la vertical, inclinando brevemente a los pasajeros más allá de la posición invertida sin completar una inversión completa. El elemento genera una característica combinación de G laterales y leves G negativas en el punto más alto del peralte. Las curvas overbanked son un elemento característico de los Hyper Coasters de B&M y los Mega Coasters de Intamin, y son omnipresentes en los layouts de RMC.',
    aliases: ['Overbanked'],
    alternateNames: ['Curva sobreinclinada', 'Curva invertida'],

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
    aliases: ['Animatrónicos'],
    alternateNames: ['Audio-Animatronics', 'Figura robótica'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'Predicción IA',
    shortDefinition:
      'Predicciones basadas en machine learning para niveles de afluencia y tiempos de espera — hasta 30+ días de antelación.',
    definition:
      'Una predicción IA utiliza modelos de machine learning entrenados con datos históricos de afluencia, datos meteorológicos, calendarios escolares y datos en tiempo real para predecir cuán concurrido estará un parque o atracción en un día u hora concretos. park.fan genera predicciones IA para afluencia y tiempos de espera previstos hasta 30+ días de antelación.\n\nLas predicciones se actualizan continuamente a medida que llegan nuevos datos. Las predicciones a corto plazo (1–7 días) suelen ser muy precisas al incorporar datos meteorológicos actuales, anuncios de eventos y señales de reserva. Las predicciones a largo plazo son naturalmente menos precisas, pero siguen siendo valiosas para identificar períodos tranquilos o concurridos con bastante antelación.',
    aliases: ['AI Forecast', 'AI Forecasts', 'Predicciones IA'],
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'opening-hours',
    name: 'Horario de apertura',
    shortDefinition:
      'El programa diario oficial que indica cuándo abre y cierra un parque temático o atracción.',
    definition:
      'El horario de apertura es el programa diario publicado para un parque temático o atracción individual — indica cuándo comienza el acceso y cuándo finaliza la operación. La mayoría de los grandes parques publican un calendario rotativo con semanas o meses de antelación, aunque los horarios pueden cambiar a corto plazo por eventos especiales, ajustes estacionales o problemas operativos.\n\npark.fan muestra los horarios de apertura de cada parque. Los horarios marcados con «Est.» (Estimado) se han derivado de patrones históricos y no están confirmados oficialmente por el parque — deben verificarse antes de una visita planificada.',
    aliases: ['Horarios de apertura', 'Horario del Parque', 'Horas de Apertura'],
    relatedTermIds: ['rope-drop', 'crowd-calendar', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendencia de espera',
    shortDefinition:
      'La dirección del cambio en la longitud de la cola durante los últimos 30 minutos — subiendo, bajando o estable.',
    definition:
      'La tendencia de espera indica si la cola de una atracción es más larga, más corta o igual que hace 30 minutos. park.fan la representa con una flecha: hacia arriba (cola creciendo), hacia abajo (cola reduciéndose) u horizontal (estable).\n\nLa tendencia suele ser más reveladora que el tiempo de espera bruto. Una atracción con 45 minutos y tendencia a la baja es mejor opción que una con 40 minutos y tendencia fuertemente al alza — para cuando llegues, la primera cola puede haber bajado a 30 minutos mientras la segunda ya alcanza los 55.',
    aliases: ['Tendencias de espera', 'Queue Trend', 'Wait Trend'],
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-level'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride sin raíles fijos — los vehículos navegan libremente guiados por tecnología integrada en el suelo.',
    definition:
      'Un Trackless Ride es un tipo de dark ride en el que los vehículos no están limitados a un carril fijo, sino que navegan de forma autónoma por el espacio de la atracción, guiados por bucles de inducción, Wi-Fi o láser integrados en el suelo. La libertad de movimiento permite escenografías mucho más complejas y narrativas no lineales. Ejemplos emblemáticos: Star Wars: Rise of the Resistance (Disney), Ratatouille: La Aventura Totalmente Loca de Remy (Disneyland Paris) y Symbolica (Efteling, Países Bajos).',
    aliases: ['Trackless', 'Trackless Dark Ride', 'Atracciones Sin Raíles'],
    alternateNames: ['Dark ride sin raíles'],
    relatedTermIds: ['dark-ride', 'animatronics', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'IA',
    shortDefinition:
      'Inteligencia Artificial — los modelos de machine learning que calculan las previsiones de afluencia y los tiempos de espera.',
    definition:
      'La IA (Inteligencia Artificial) se refiere a los algoritmos de machine learning que reconocen patrones en grandes conjuntos de datos y generan predicciones. park.fan utiliza modelos de IA entrenados con años de datos históricos de tiempos de espera, calendarios escolares, datos meteorológicos y anuncios de eventos para producir previsiones diarias de afluencia y tiempos de espera — hasta 30+ días de antelación.',
    alternateNames: ['Inteligencia Artificial'],
    relatedTermIds: ['ai-forecast', 'crowd-forecast', 'crowd-calendar'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Tiempo de espera en vivo',
    shortDefinition:
      'Datos de tiempo de espera actualizados en tiempo real directamente desde los sistemas del parque.',
    definition:
      'Un tiempo de espera en vivo es el dato actual en tiempo real extraído directamente de los sistemas del parque — no un promedio histórico, sino el dato real al minuto. park.fan obtiene tiempos de espera en vivo de las APIs oficiales de los parques y fuentes de terceros, actualizando cada minuto.',
    aliases: ['Espera en tiempo real'],
    alternateNames: ['Tiempos de espera en vivo'],
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-forecast'],
  },
  {
    id: 'crowd-forecast',
    name: 'Previsión de afluencia',
    shortDefinition:
      'Predicción basada en IA de la afluencia en un parque temático para un día específico.',
    definition:
      'Una previsión de afluencia es una predicción basada en datos de cuánto de lleno estará un parque temático en un día u hora específicos. park.fan recalcula las previsiones de afluencia diariamente usando datos históricos de asistencia, calendarios escolares, datos meteorológicos y eventos especiales. Los resultados alimentan directamente el calendario de afluencia: los días verdes indican colas cortas, los días rojos señalan afluencia máxima con largas esperas.',
    aliases: ['Previsiones de afluencia'],
    relatedTermIds: ['crowd-calendar', 'ai-forecast', 'peak-day', 'crowd-level'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      'La unidad de aceleración que experimentan los pasajeros, medida como múltiplos de la aceleración gravitacional terrestre (9,81 m/s²).',
    definition:
      'La fuerza G (equivalente gravitacional) mide la aceleración que experimenta un pasajero en relación con la gravedad normal de la Tierra. Las fuerzas G positivas (por encima de 1G) presionan a los pasajeros contra sus asientos al pasar por valles o curvas cerradas. Las fuerzas G negativas (por debajo de 0G) levantan a los pasajeros de sus asientos y crean airtime. Las fuerzas G laterales actúan horizontalmente, empujando a los pasajeros hacia los lados en curvas y transiciones.\n\nLas montañas rusas están diseñadas para secuenciar estas fuerzas de forma deliberada. Un valle que genera 4–5G es la marca de una transición del primer descenso potente. Un breve momento de −0,5G en una colina de airtime produce la característica sensación de flotación. La mayoría de las atracciones apuntan a 0–5G de fuerzas positivas sostenidas, con picos breves para efectos dramáticos. Una exposición prolongada a fuerzas G elevadas puede causar malestar o greyout; las montañas rusas bien diseñadas equilibran los picos de intensidad con secciones de recuperación.',
    aliases: ['Fuerzas G', 'G-Forces'],
    alternateNames: ['G-Force'],
    relatedTermIds: ['airtime', 'inversion', 'lateral-gs', 'hangtime', 'greyout'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'Oscurecimiento temporal de la visión causado por las fuerzas G positivas que reducen el flujo sanguíneo al cerebro.',
    definition:
      'El greyout (también grey-out) es un fenómeno fisiológico en el que un pasajero sometido a fuerzas G positivas intensas experimenta temporalmente un campo visual grisáceo o velado. El mecanismo: las fuerzas G positivas empujan la sangre hacia abajo, a las extremidades, reduciendo el riego sanguíneo de los ojos y el cerebro. El campo visual comienza a cerrarse desde los bordes y se vuelve gris — el pasajero permanece consciente, pero con la visión significativamente reducida.\n\nMás allá del greyout, una exposición mayor o prolongada a las fuerzas G puede provocar un blackout (visión completamente oscura) o G-LOC (pérdida de conciencia inducida por fuerzas G). Las montañas rusas bien diseñadas mantienen los picos de G elevados breves y alternan secciones intensas con secciones de recuperación.',
    aliases: ['Greyouts', 'grey-out', 'visión gris'],
    alternateNames: ['velo gris', 'oscurecimiento por G'],
    relatedTermIds: ['g-force', 'lateral-gs', 'hangtime', 'airtime'],
  },
  {
    id: 'grey-zone',
    name: 'Zona gris',
    shortDefinition:
      'Un elemento de montaña rusa en el límite de la definición de inversión — contado o no según el método de recuento utilizado.',
    definition:
      'La zona gris designa los elementos de montaña rusa situados en la frontera entre una inversión completa y un elemento no invertido. Las inversiones clásicas — como los loopings verticales y los tirabuzones — son inequívocas: el tren gira al pasajero completamente boca abajo. Los elementos de zona gris alcanzan apenas o no alcanzan el umbral de 180° overhead, colocando a los pasajeros en una posición extrema, casi invertida.\n\nLos elementos típicos de zona gris incluyen los stalls (posiciones boca abajo mantenidas sin rotación completa), los virages fuertemente sobreinclinados más allá de 90° y ciertas variaciones de wave turns. Fabricantes como RMC e Intamin utilizan deliberadamente estos elementos como alternativa a las inversiones clásicas. Según el método de recuento — estricto (solo rotaciones completas) o amplio (cualquier posición overhead) — el número oficial de inversiones de una atracción puede variar.',
    aliases: ['Zonas grises', 'zona-gris'],
    alternateNames: ['inversión borderline', 'cuasi-inversión'],
    relatedTermIds: ['inversion', 'stall', 'overbank', 'roller-coaster-element'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Fuerzas horizontales que empujan a los pasajeros hacia los lados en curvas, transiciones y secciones en hélice.',
    definition:
      'Las fuerzas G laterales (o fuerzas laterales) son las aceleraciones horizontales que experimentan los pasajeros cuando una montaña rusa cambia de dirección en el plano horizontal — en curvas inclinadas o no inclinadas, hélices y cambios de dirección. Las fuerzas laterales bien diseñadas son suaves y controladas, contribuyendo a una experiencia dinámica. Las fuerzas laterales mal diseñadas o rugosas se sienten como ser lanzado bruscamente contra el respaldo o el costado del asiento, lo que puede ser incómodo o doloroso.\n\nLos entusiastas distinguen entre fuerzas laterales suaves e intencionales — como en las amplias curvas bajas de una clásica montaña rusa de madera — y fuerzas laterales bruscas debidas al desgaste del carril o a una ingeniería deficiente. Las montañas rusas de madera están especialmente asociadas al movimiento lateral: la flexibilidad del carril y la energía lateral de las curvas no inclinadas se consideran parte de la experiencia auténtica. Las secuencias laterales suaves en secciones de hélice — como en Balder en Liseberg — son frecuentemente citadas como momentos destacados por los aficionados.',
    relatedTermIds: ['g-force', 'airtime', 'helix', 'wooden-coaster'],
    aliases: ['Laterales', 'Fuerzas G Laterales', 'Lateral G'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Intensas fuerzas G negativas que proyectan bruscamente a los pasajeros fuera de su asiento, retenidos solo por el arnés de rodillas.',
    definition:
      'El ejector airtime describe la forma más intensa de fuerzas G negativas: la trayectoria de la atracción se desvía tan bruscamente de la caída libre que los pasajeros son lanzados con fuerza fuera de sus asientos, retenidos únicamente por el arnés de rodillas. La sensación es la de ser activamente expulsado del asiento — distinta del suave y prolongado flotamiento del floater airtime, el ejector es repentino y puede rozar lo violento si la transición es demasiado abrupta.\n\nEl ejector airtime se asocia especialmente con los hybrid coasters RMC, ciertos hyper coasters Intamin y las modernas montañas rusas de madera con colinas parabólicas pronunciadas. Los entusiastas describen los mejores momentos de ejector como el punto culminante de un circuito — un breve e impactante instante de ingravidez real. Untamed en Walibi Holland, Wildfire en Kolmården y Steel Vengeance en Cedar Point son frecuentemente citados por sus secuencias ejector entre las más intensas del mundo.',
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
      'El hangtime describe la experiencia particular de las fuerzas G negativas durante una inversión: el tren permanece suficiente tiempo cerca del apogeo de un elemento invertido para que las fuerzas G negativas tengan efecto — los pasajeros quedan literalmente suspendidos en sus arneses. A diferencia del breve momento invertido de un looping rápido, el hangtime ocurre cuando el tren reduce la velocidad cerca del apex de la inversión y crea una suspensión prolongada. El peso del cuerpo se desplaza completamente hacia los arneses de hombros o el arnés de rodillas, creando una sensación de desorientación memorable.\n\nEl hangtime es más pronunciado en los elementos donde el tren reduce considerablemente la velocidad cerca del apex de la inversión — el pretzel loop en los flying coasters es el ejemplo clásico, ya que la velocidad es suficientemente baja para fuerzas G negativas sostenidas en posición completamente invertida. El heartline roll de algunas atracciones modernas también puede producir hangtime. Los entusiastas generalmente consideran el hangtime como una de las sensaciones de inversión más emocionantes.',
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
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Primera fila',
    shortDefinition:
      'La primera fila de asientos en un tren de montaña rusa, que generalmente ofrece la mejor vista y las sensaciones más intensas.',
    definition:
      'La primera fila es la primera fila de asientos en un tren de montaña rusa. Los asientos delanteros ofrecen una vista despejada hacia adelante, muy apreciados por los pasajeros para la experiencia visual. En hipercoasters y gigas, la primera fila a menudo experimenta el airtime más intenso durante la caída inicial, porque los pasajeros no tienen a nadie delante que bloquee su sensación de espacio. El efecto psicológico de ver la caída aproximarse — y luego precipitarse al vacío — amplifica la emoción mucho más allá de lo que las filas centrales o traseras proporcionan.\n\nEn muchas montañas rusas, la primera fila se ha vuelto tan deseable que los parques ofrecen desvíos de cola o reservas express específicamente para esta posición de asiento.',
    relatedTermIds: ['back-row', 'middle-row', 'airtime', 'first-drop'],
    aliases: ['Asiento delantero', 'Primera posición'],
  },
  {
    id: 'back-row',
    name: 'Última fila',
    shortDefinition:
      'La última fila de asientos en un tren, conocida por airtime intenso y sensaciones prolongadas en recorridos ricos en colinas.',
    definition:
      'La última fila es la última fila de asientos en un tren de montaña rusa. Los asientos traseros en montañas rusas ricas en colinas — hypers, gigas, diseños enfocados en airtime — son apreciados por los entusiastas por producir el airtime eyector más intenso. En cada colina sucesiva, la última fila experimenta fuerzas G negativas sostenidas mientras el tren supera la cresta y los pasajeros se sienten expulsados de los asientos (mantenidos solo por arneses). Este efecto se acumula en múltiples colinas: el airtime en última fila es típicamente más fuerte, más prolongado e intenso que en filas delanteras o centrales.\n\nEn montañas rusas como Goliath o Shambhala, la última fila se considera la posición de asiento ideal por los entusiastas.',
    relatedTermIds: ['front-row', 'middle-row', 'airtime', 'ejector-airtime'],
    aliases: ['Asiento trasero', 'Última posición'],
  },
  {
    id: 'middle-row',
    name: 'Fila central',
    shortDefinition:
      'Las filas centrales de un tren de montaña rusa, ofreciendo una experiencia equilibrada entre la primera y la última fila.',
    definition:
      'Las filas centrales son los asientos del centro de un tren de montaña rusa — posicionados entre el impacto psicológico intenso de la primera fila y el airtime eyector de la última fila. Las filas centrales tienden a ofrecer una experiencia equilibrada: vista suficiente para ver el trazado aproximándose, airtime significativo, pero sin los extremos de delante o atrás. Para familias o pasajeros novatos nerviosos por la intensidad, las filas centrales proporcionan una experiencia de montaña rusa más accesible.\n\nLas filas centrales reciben menos discusión entre los entusiastas porque no están especializadas para una sensación particular ni ofrecen los extremos de las filas delantera o trasera. Sin embargo, en montañas rusas con fuerzas laterales extensas, las filas centrales a veces pueden sentir la mayor compresión simplemente por su posición en el centro de masa del tren.',
    relatedTermIds: ['front-row', 'back-row', 'airtime', 'ride-cart'],
    aliases: ['Asiento central', 'Fila del medio'],
  },
  {
    id: 'ride-cart',
    name: 'Carro',
    shortDefinition:
      'Vehículo individual o auto en un tren de montaña rusa que contiene una o más filas de pasajeros.',
    definition:
      'Un carro (también llamado auto, coche o simplemente carro del tren) es el segmento de vehículo individual que sostiene a los pasajeros en una montaña rusa. Un tren típico de coaster consta de múltiples carros enlazados, con cada carro conteniendo una o más filas de pasajeros sentados espalda con espalda. Los fabricantes de montañas rusas diseñan las dimensiones del carro, el posicionamiento del asiento y la geometría del arnés para optimizar tanto la comodidad como la sensación.\n\nEl diseño del carro varía dramáticamente entre tipos de montañas rusas: los hipercoasters usan carros aerodinámicos y bajos para minimizar la resistencia del aire; los coasters invertidos cuelgan pasajeros debajo de la vía; los wing coasters posicionan pasajeros a los lados sin vía debajo; los flying coasters montan pasajeros boca abajo. Fabricantes como B&M, Intamin y Mack tienen cada uno diseños de carro distintivos.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'front-row', 'back-row'],
    aliases: ['Auto', 'Coche'],
  },
  {
    id: 'lap-bar',
    name: 'Barra de regazo',
    shortDefinition:
      'Un arnés horizontal de seguridad sobre el regazo que permite mayor libertad de movimiento que los arneses de hombro.',
    definition:
      'Una barra de regazo es un dispositivo de seguridad horizontal que asegura a los pasajeros sobre los muslos superiores. A diferencia de los arneses de hombro que envuelven completamente el torso, las barras de regazo permiten que la parte superior del cuerpo se mueva más libremente, creando una sensación más abierta y menos restrictiva. Las barras de regazo son estándar en la mayoría de los hipercoasters, gigas y muchas montañas rusas de madera y acero tradicionales. Durante los momentos de airtime, las barras de regazo permiten a los pasajeros experimentar la sensación completa de ser expulsados del asiento, creando la sensación de que solo la barra evita que salgan del vehículo.\n\nLas barras de regazo son preferidas por los entusiastas para montañas rusas de alto airtime porque proporcionan la sensación de airtime más sin trabas. Sin embargo, requieren un posicionamiento adecuado y pueden sentirse incómodas para pasajeros con torsos más largos. Los fabricantes han refinado continuamente el diseño de la barra de regazo durante décadas, y los modelos modernos son significativamente más cómodos que las generaciones anteriores.',
    relatedTermIds: ['shoulder-harness', 'airtime', 'ride-cart'],
    aliases: ['Arnés de regazo'],
  },
  {
    id: 'shoulder-harness',
    name: 'Arnés de hombro',
    shortDefinition:
      'Un arnés de seguridad sobre los hombros que envuelve completamente el torso, limitando el movimiento durante el viaje.',
    definition:
      "Un arnés de hombro es un dispositivo de seguridad que desciende sobre ambos hombros y a través de la cintura, envolviendo completamente el torso. Los arneses de hombro fueron estándar en montañas rusas desde los años '80 hasta 2000 y siguen siendo comunes en coasters invertidos, algunos coasters suspendidos y atracciones familiares donde la seguridad máxima es prioridad. Los arneses modernos incluyen mecanismos de trinquete que permiten una tensión variable para acomodar diferentes tipos de cuerpo.\n\nCuando estás sentado en un arnés de hombro en una montaña rusa de alto airtime, la sensación es notablemente diferente de una barra de regazo: los pasajeros no pueden elevarse del asiento tan dramáticamente porque el arnés los mantiene hacia abajo. Este compromiso — mayor seguridad y comodidad frente a una sensación de airtime menos intensa — es una opción de diseño clave que hacen los fabricantes.",
    relatedTermIds: ['lap-bar', 'airtime', 'ride-cart'],
    aliases: ['Arnés OTS'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Recuerdo',
    shortDefinition:
      'Un artículo conmemorativo o pequeño producto comprado en un parque temático para recordar una visita.',
    definition:
      'Un recuerdo es un objeto conmemorativo físico — merchandise, ropa o artículo de colección — comprado por visitantes para recordar su visita al parque temático. Los recuerdos comunes incluyen camisetas con logos del parque, gorras, pines, postales y peluches temáticos. Los recuerdos sirven tanto un propósito funcional (ropa wearable) como emocional — anclan los recuerdos de una visita específica y crean conexiones duraderas con parques queridos.\n\nLos parques temáticos dependen fuertemente de las ventas de recuerdos como flujo de ingresos; la merchandise típicamente lleva un margen de 2–3x comparado con los precios al por menor. Para muchos visitantes, coleccionar recuerdos de múltiples parques es parte de la experiencia — reunir pines, intercambiarlos con otros, o construir un estante conmemorativo.',
    relatedTermIds: ['merchandise', 'gift-shop', 'park-exclusive'],
    aliases: ['Souvenir', 'Recuerdo conmemorativo'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Productos y bienes oficiales vendidos por un parque temático, incluyendo ropa, coleccionables y artículos temáticos.',
    definition:
      'Merchandise se refiere a todos los bienes vendidos por un parque temático — desde ropa de marca (camisetas, sudaderas, gorras) hasta coleccionables (pines, figuritas, peluches), merchandise alimentario/bebidas, y artículos temáticos especializados vinculados a atracciones específicas o franquicias. Los parques temáticos operan vastas operaciones de merchandise abarcando docenas de tiendas, carritos móviles y boutiques localizadas. La merchandise es un pilar crítico de ingresos para los parques, generalmente generando 15–25% del gasto total de visitantes, segundo solo después de alimentos y bebidas.\n\nLos parques modernos utilizan estrategias de merchandising sofisticadas: artículos de edición limitada estacional, merchandise de colaboración con franquicias populares, diseños exclusivos del parque indisponibles en otros lugares, y versiones especiales vinculadas a nuevas aperturas de atracciones o aniversarios.',
    relatedTermIds: ['souvenir', 'gift-shop', 'park-exclusive'],
    aliases: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Tienda de regalos',
    shortDefinition:
      'Una tienda minorista dentro de un parque temático que vende recuerdos, merchandise y productos temáticos.',
    definition:
      'Una tienda de regalos es un espacio minorista dentro de un parque temático dedicado a la venta de recuerdos, merchandise y productos temáticos — ubicada en un área central (como una plaza principal) o integrada en áreas temáticas específicas y atracciones. Los parques grandes operan docenas de tiendas de regalos que van desde pequeños carritos hasta grandes almacenes. Las tiendas de regalos se posicionan estratégicamente en puntos de alto tráfico: filas de salida de atracciones principales, pasillos de hoteles, entradas/salidas de parque donde los visitantes tienen tiempo libre e inclinación a comprar.\n\nLas tiendas de regalos modernas utilizan diseño minorista sofisticado: posicionamiento de entrada, ambiente temático y colocación estratégica de productos. Muchas atracciones conducen a los visitantes directamente a través de áreas de merchandise — una estrategia probada para ampliar compras impulsivas. Los parques utilizan cada vez más merchandise IP (licencias y franquicias) para justificar precios premium.',
    relatedTermIds: ['merchandise', 'souvenir', 'park-exclusive'],
    aliases: ['Tienda de souvenirs'],
  },
  {
    id: 'park-exclusive',
    name: 'Exclusiva del parque',
    shortDefinition:
      'Un producto o artículo disponible solo en un parque temático específico, no disponible para compra en otro lugar.',
    definition:
      'La merchandise exclusiva del parque es un producto diseñado y vendido solo en un parque temático específico o dentro de un sistema de parques — no disponible para compra en ningún minorista externo. Los artículos exclusivos del parque crean escasez percibida, incentivan compras impulsivas por el sentimiento de que el artículo no puede obtenerse en otro lugar, y justifican un precio premium (a menudo 2–3x el margen minorista típico). Los artículos exclusivos comunes incluyen ropa de edición limitada, pines de colección, artículos temáticos vinculados a nuevas aperturas de atracciones o eventos estacionales.\n\nLa estrategia de exclusiva del parque es central para la psicología de merchandise moderna: los visitantes que han viajado lejos y gastado considerablemente en admisión sienten impulso elevado de comprar artículos que no pueden obtener en casa. Los mercados secundarios (plataformas de reventa en línea) demuestran que los artículos exclusivos raros y deseables del parque retienen y aprecian valor, promoviendo aún más comportamiento coleccionista.',
    relatedTermIds: ['merchandise', 'souvenir', 'gift-shop'],
    aliases: ['Exclusivo'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Montaña rusa en que los pasajeros viajan en posición prona.',
    definition:
      'Un flying coaster transporta a los pasajeros en posición horizontal boca abajo, simulando la sensación de volar. Los trenes se inclinan de la posición sentada en la estación a la horizontal antes de comenzar el recorrido. Ejemplos notables: Manta (SeaWorld Orlando) y Tatsu (Six Flags Magic Mountain), ambos de B&M.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    aliases: ['flyer', 'montaña rusa voladora', 'Superman ride', 'prone coaster', 'flying coaster'],
  },
  {
    id: 'mine-train',
    name: 'Tren Minero',
    shortDefinition: 'Montaña rusa familiar de acero ambientada como vagoneta de mina.',
    definition:
      'Un tren minero es una montaña rusa de acero para familias, estilizada como una vagoneta de mina desbocada. Típicamente con velocidades moderadas, pequeñas caídas y curvas cerradas a través de túneles y formaciones rocosas temáticas. Apta para un amplio rango de edades. Ejemplos: Big Thunder Mountain Railroad (parques Disney) y Gold Rush (Plopsaland).',
    relatedTermIds: ['steel-coaster', 'themed-land'],
    aliases: ['mine coaster', 'vagoneta de mina', 'coaster familiar', 'mine train'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Montaña rusa diseñada para seguir el paisaje natural.',
    definition:
      'Un terrain coaster está construido para aprovechar la topografía natural — colinas, valles y barrancos — en lugar de depender enteramente de estructuras artificiales. La pista interactúa estrechamente con el terreno, creando una sensación de velocidad e inmersión. Ejemplos clásicos: The Beast (Kings Island) y Ravine Flyer II (Waldameer).',
    relatedTermIds: ['wooden-coaster', 'steel-coaster', 'airtime'],
    aliases: ['terrain coaster', 'coaster de terreno', 'montaña rusa paisajística'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Montaña rusa de acero sin suelo, con los pies colgando libremente.',
    definition:
      'En un floorless coaster, el piso del vehículo se retrae una vez que los pasajeros están sujetos, dejando las piernas colgando sobre el raíl. A diferencia de los coasters invertidos, el raíl pasa por debajo del vehículo. B&M fue pionera con Medusa (1999). Ejemplo europeo: Goliath (Walibi Holland).',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster', 'dive-coaster'],
    aliases: ['floorless', 'coaster sin suelo', 'floorless coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: 'Fabricante americano responsable del primer looping moderno.',
    definition:
      "Arrow Dynamics (fundada en 1945) fue un fabricante americano pionero que introdujo el raíl tubular de acero moderno y el primer loop vertical moderno en Corkscrew (Knott's Berry Farm, 1975). Las atracciones Arrow son conocidas por sus corkscrews y suspended looping coasters. La empresa se declaró en quiebra en 2001 y sus activos fueron adquiridos por S&S.",
    relatedTermIds: ['steel-coaster', 'corkscrew', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow', 'arrow dynamics'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Fabricante americano de montañas rusas de madera con trazados rápidos y sinuosos.',
    definition:
      'Great Coasters International (GCI) es un fabricante americano especializado en montañas rusas de madera. Fundado en 1994, GCI es conocido por sus trenes Millennium Flyer y trazados con rápidos cambios de dirección y airtime sostenido. Instalaciones notables: Wodan (Europa-Park), Thunderhead (Dollywood) y Troy (Toverland).',
    relatedTermIds: ['wooden-coaster', 'airtime', 'rmc', 'terrain-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster', 'Millennium Flyer', 'gci'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Fabricante americano especializado en coasters de lanzamiento LSM/LIM — en Europa conocido por la familia Sky Scream.',
    definition:
      "Premier Rides (fundado en 1995, Baltimore, Maryland) es un fabricante americano especializado en sistemas de lanzamiento por motor síncrono lineal (LSM) y motor de inducción lineal (LIM). El Sky Rocket II — un launch coaster compacto con una inversión — se ha extendido a parques de tamaño medio en todo el mundo.\n\nEn Europa, Premier Rides es más conocido por Sky Scream en Holiday Park (Haßloch, Alemania), un launch coaster invertido que se convirtió en una atracción de referencia regional. La tecnología LSM de Premier también equipa Hagrid's Magical Creatures Motorbike Adventure en Universal Orlando.",
    alternateNames: ['Premier'],
    relatedTermIds: ['launch-coaster', 'gerstlauer', 'intamin'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Fabricante alemán de Múnich conocido por spinning coasters con trick track, la plataforma X-Car y el modelo vertical Sky Loop.',
    definition:
      "Maurer Rides (Maurer AG, fabricación metálica desde 1876, atracciones desde 1993) es un fabricante muniqués. La serie SC de spinning coasters destaca por su trick track — una sección donde el vagón se inclina lateralmente — y la plataforma X-Car permite layouts compactos altamente personalizados con lanzamientos e inversiones.\n\nEl Sky Loop es un loop vertical autónomo presente en muchos parques europeos. Instalaciones europeas destacadas: Winja's Fear y Winja's Force en Phantasialand (Alemania), spinning coasters en interiores con trick track.",
    aliases: ['Maurer AG'],
    alternateNames: ['Maurer', 'Maurer Söhne'],
    relatedTermIds: ['spinning-coaster', 'xtreme-spinning-coaster', 'launch-coaster', 'gerstlauer'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Fabricante italiano con uno de los mayores portfolios de coasters familiares y atracciones del mundo — más de 250 coasters instalados.',
    definition:
      "Zamperla (fundado en 1966, Altavilla Vicentina, Italia) es uno de los fabricantes de atracciones más prolíficos del mundo. Mientras que Intamin, B&M y Mack apuntan a grandes instalaciones de emoción, Zamperla se centra en el volumen y la accesibilidad — sus Family Coaster, Mini Coaster, Twister y Disk'O Coaster son habituales en parques medianos y complejos turísticos de todo el mundo.\n\nLas dimensiones compactas y los requisitos de altura moderados hacen que las atracciones Zamperla sean especialmente frecuentes en parques urbanos europeos, complejos hoteleros e instalaciones interiores. La empresa también construyó Thunderbolt en Coney Island (Nueva York).",
    alternateNames: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'mine-train', 'gerstlauer'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Fabricante americano conocido por torres neumáticas, el compacto El Loco y los coasters Free Fly 4D.',
    definition:
      'S&S Worldwide (fundado en 1994, Logan, Utah; adquirido por Sansei Technologies en 2012) desarrolló inicialmente sistemas de caída neumática — Space Shot y Turbo Drop — antes de ampliar su catálogo. El El Loco es un coaster extremo compacto con una primera caída más allá de la vertical y una inversión que concentra grandes emociones en un espacio muy reducido. El Free Fly es un coaster 4D con asiento de giro libre.\n\nS&S también adquirió los activos del histórico Arrow Dynamics tras su quiebra en 2001. En Europa, las instalaciones S&S son menos frecuentes que en Norteamérica.',
    aliases: ['S&S Power'],
    alternateNames: ['S&S', 'S&S-Sansei', 'S&S Sansei'],
    relatedTermIds: ['launch-coaster', 'arrow-dynamics', 'gerstlauer'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Fabricante bávaro especializado en coasters familiares — más de 190 instalaciones en todo el mundo.',
    definition:
      'Zierer (fundado en 1930, Deggendorf, Baviera) es un fabricante alemán especializado en montañas rusas familiares y atracciones clásicas de parque. La gama Force Coaster abarca varios niveles, desde modelos júnior compactos hasta instalaciones Force Custom más rápidas. Los coasters Zierer se caracterizan por su raíl tubular de acero, suave calidad de marcha y requisitos de altura moderados.\n\nCon más de 190 montañas rusas entregadas en todo el mundo, Zierer es uno de los constructores europeos más prolíficos por número de unidades. Instalaciones destacadas: Feuerdrache en Legoland Deutschland y coasters familiares en parques alemanes, holandeses y escandinavos.',
    alternateNames: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'mack-rides', 'gerstlauer'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition: 'Inversión donde el tren queda brevemente boca abajo a velocidad casi cero.',
    definition:
      'Un stall (o zero-G stall) es un elemento en el que el tren entra en una inversión en el punto más alto y reduce la velocidad hasta casi detenerse, dejando a los pasajeros boca abajo. Desarrollado por Rocky Mountain Construction (RMC), el elemento produce un prolongado hangtime. Ejemplos famosos: Zadra (Energylandia) y Steel Vengeance (Cedar Point).',
    relatedTermIds: ['inversion', 'hangtime', 'rmc', 'zero-g-roll'],
    aliases: ['zero-g stall', 'RMC stall', 'elemento hangtime', 'stall element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition: 'Curva peraltada que genera airtime en mitad del cambio de dirección.',
    definition:
      'Un wave turn es una curva muy peraltada a alta velocidad que atraviesa brevemente fuerzas G negativas o laterales, creando una sensación de airtime en mitad de la curva. Frecuente en atracciones de Rocky Mountain Construction, el elemento combina cambio direccional con ejector o floater airtime. Se puede encontrar en Wildfire (Kolmården) y Untamed (Walibi Holland).',
    relatedTermIds: ['airtime', 'overbank', 'ejector-airtime', 'rmc', 'lateral-gs'],
    aliases: ['wave turn', 'curva con airtime'],
  },
  {
    id: 'shoulder-season',
    name: 'Temporada Intermedia',
    shortDefinition: 'Periodo entre la temporada alta y la baja con afluencia moderada.',
    definition:
      'La temporada intermedia designa los periodos de transición entre la temporada alta y los momentos más tranquilos de un parque. Típicamente primavera (marzo–mayo) y principios de otoño (septiembre–octubre) en los parques europeos. La afluencia es moderada, los precios suelen ser más bajos y la mayoría de las atracciones están abiertas — un periodo favorito de los entusiastas.',
    relatedTermIds: ['crowd-forecast', 'school-holiday', 'crowd-level'],
    aliases: [
      'temporada baja',
      'shoulder season',
      'media temporada',
      'fuera de temporada',
      'off-peak',
    ],
  },
  {
    id: 'school-holiday',
    name: 'Vacaciones Escolares',
    shortDefinition:
      'Periodos de vacaciones escolares que causan picos de afluencia en los parques.',
    definition:
      'Las vacaciones escolares — de verano, Navidad, Semana Santa y otras — son el principal motor de los picos de afluencia en los parques temáticos. Las familias con niños son el segmento de visitantes más grande y concentran sus visitas en estas ventanas. Los parques suelen ampliar horarios, enriquecer el programa y subir precios. Evitar las vacaciones escolares es la estrategia más efectiva para reducir tiempos de espera.',
    relatedTermIds: ['crowd-forecast', 'shoulder-season', 'crowd-level'],
    aliases: [
      'vacaciones',
      'vacaciones de verano',
      'vacaciones de Navidad',
      'Semana Santa',
      'school holiday',
      'school holidays',
    ],
  },
  {
    id: 'photo-pass',
    name: 'Fotopass',
    shortDefinition: 'Servicio de fotos y vídeos digitales ilimitados en el parque.',
    definition:
      'Un fotopass (o Memory Maker) es un complemento opcional que da acceso digital a todas las fotos y vídeos profesionales de la visita — incluyendo fotos de atracciones, encuentros con personajes y fotógrafos itinerantes. Vendido a precio fijo, puede ser rentable para familias. Ejemplos: Memory Maker (Disney) y Photo Pass (Universal).',
    relatedTermIds: ['ride-photo', 'character-meet-and-greet', 'season-pass'],
    aliases: ['Memory Maker', 'paquete de fotos', 'fotos del parque', 'photo pass'],
  },
  {
    id: 'accessibility-pass',
    name: 'Pase de Accesibilidad',
    shortDefinition:
      'Pase para huéspedes con discapacidad para acceder a atracciones con espera reducida.',
    definition:
      'Un pase de accesibilidad (también DAS – Disability Access Service, tarjeta de accesibilidad o pase de acceso a atracciones) se emite a los huéspedes que no pueden esperar en una fila estándar debido a una discapacidad. Permite al titular y a un grupo de acompañantes regresar en un horario establecido en lugar de esperar físicamente. Los criterios y procedimientos varían según el parque y país.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: [
      'DAS',
      'Disability Access Service',
      'tarjeta discapacidad',
      'accessibility pass',
      'pase discapacidad',
    ],
  },
  {
    id: 'motion-simulator',
    name: 'Simulador',
    shortDefinition: 'Atracción que combina una plataforma móvil con proyección cinematográfica.',
    definition:
      'Un simulador combina una plataforma móvil hidráulica o eléctrica con una gran pantalla, sincronizando los movimientos físicos con la acción proyectada para crear experiencias inmersivas sin raíl tradicional. La capacidad suele ser alta y la experiencia puede renovarse cambiando la película. Ejemplos: Star Tours (Disney), Mystic Manor (HKDL).',
    relatedTermIds: ['dark-ride', 'trackless-ride', 'pre-show', 'animatronics'],
    aliases: [
      'simulador de vuelo',
      'atracción 4D',
      'cine dinámico',
      'motion simulator',
      'sim ride',
    ],
  },
  {
    id: 'character-meet-and-greet',
    name: 'Encuentro con Personajes',
    shortDefinition: 'Oportunidad programada para conocer a un personaje disfrazado del parque.',
    definition:
      'Un encuentro con personajes es una zona designada o evento programado donde los visitantes pueden conocer personajes disfrazados, hacerse fotos y conseguir autógrafos. Muy común en parques Disney y Universal; los personajes más populares suelen tener ubicaciones propias con su propia cola. Especialmente popular entre familias con niños.',
    relatedTermIds: ['photo-pass', 'character-dining', 'themed-land'],
    aliases: [
      'meet and greet',
      'encuentro personaje',
      'character meet and greet',
      'aparición personaje',
    ],
  },
  {
    id: 'pre-show',
    name: 'Pre-Show',
    shortDefinition:
      'Zona de espera que prepara a los visitantes para una atracción con narración introductoria.',
    definition:
      'Un pre-show es un elemento de ambientación en una atracción temática donde los visitantes se reúnen antes del recorrido principal para recibir contexto narrativo, instrucciones de seguridad o entretenimiento que establece el ambiente. Los pre-shows cumplen funciones narrativas y operativas. Ejemplos famosos: la sala extensible del Haunted Mansion y el vídeo de seguridad de Guardians of the Galaxy – Mission: BREAKOUT!.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'animatronics', 'themed-land'],
    aliases: ['pre show', 'zona de espera temática', 'área de pre-embarque'],
  },
  {
    id: 'flat-ride',
    name: 'Atracción Plana',
    shortDefinition:
      'Atracción a nivel del suelo que gira, oscila o rota sin un circuito de vía elevado.',
    definition:
      'Una atracción plana (flat ride) es una categoría de atracciones que funcionan en un plano aproximadamente horizontal sin vía elevada. El término abarca atracciones giratorias (carruseles, tazas locas), atracciones pendulares (Top Spin, sillas voladoras), torres de caída y plataformas giratorias.\n\nA diferencia de las montañas rusas, las flat rides suelen ocupar un espacio reducido, lo que las hace ideales para las zonas más pequeñas del parque. Muchas ofrecen una gran capacidad horaria, requisitos mínimos de talla bajos o nulos y amplio atractivo para todas las edades – son con frecuencia la columna vertebral de la oferta familiar e infantil de un parque.',
    relatedTermIds: ['swing-ride', 'drop-tower', 'ride-capacity', 'height-requirement'],
    aliases: ['flat rides', 'atracción de feria', 'ride plano'],
  },
  {
    id: 'water-ride',
    name: 'Atracción Acuática',
    shortDefinition:
      'Atracción en la que los visitantes viajan en barcas o vehículos por el agua y se mojan.',
    definition:
      'Una atracción acuática (water ride) es cualquier atracción donde el agua es un elemento central de la experiencia – el vehículo recorre un canal de agua o el agua se emplea como efecto deliberado. Los tres tipos más frecuentes son: los toboganes acuáticos (barcas por un canal con caída final), los rápidos (balsas circulares por aguas turbulentas artificiales) y las batallas de agua (los visitantes se mojan mutuamente con cañones de agua). Las atracciones acuáticas suelen tener requisitos mínimos de talla bajos y un público muy amplio. En días de calor pueden generar colas extremadamente largas.',
    relatedTermIds: ['log-flume', 'river-rapids', 'ride-capacity', 'height-requirement'],
    aliases: ['atracción de agua', 'ride acuático', 'water ride', 'atracción mojada'],
  },
  {
    id: 'live-show',
    name: 'Espectáculo en Vivo',
    shortDefinition:
      'Actuación programada con actores reales, música, acrobacias o personajes en un espacio escénico dedicado.',
    definition:
      'Un espectáculo en vivo es un programa de entretenimiento realizado por miembros del elenco humano – distinto de las atracciones o las exposiciones fijas – en un anfiteatro al aire libre, teatro cubierto o espacio de actuación callejero. Los espectáculos de los parques temáticos van desde producciones teatrales de estilo Broadway y shows de acrobacias hasta desfiles de personajes, experiencias 4D con elementos en vivo y espectáculos de láser y fuegos artificiales. A diferencia de las atracciones, los shows tienen horarios fijos y capacidad limitada por función; incluirlos en el plan de visita es importante para evitar conflictos. Los espectáculos son útiles como pausa durante el pico de aglomeración del mediodía.',
    relatedTermIds: ['themed-land', 'pre-show', 'ride-capacity'],
    aliases: [
      'show',
      'show en vivo',
      'show de acrobacias',
      'entretenimiento en vivo',
      'espectaculo',
    ],
  },
  {
    id: 'quick-service',
    name: 'Servicio Rápido',
    shortDefinition: 'Restaurante de mostrador sin personal de sala.',
    definition:
      'El servicio rápido (también counter service o fast casual) designa los restaurantes del parque donde los visitantes piden en un mostrador y llevan su comida a una mesa. Es el tipo de restauración más común en los parques temáticos, apreciado por su rapidez. Disney popularizó el término "quick service" para diferenciarlo del "table service" en su sistema de reservas.',
    relatedTermIds: ['table-service', 'character-dining'],
    aliases: [
      'counter service',
      'comida rápida',
      'self-service',
      'quick service',
      'restaurante rápido',
    ],
  },
  {
    id: 'table-service',
    name: 'Servicio de Mesa',
    shortDefinition: 'Restaurante con camareros donde a menudo se requieren reservas.',
    definition:
      'Los restaurantes de servicio de mesa en parques temáticos ofrecen una experiencia completa con camareros. Las reservas (a menudo abiertas 60–180 días de antelación en los parques Disney) son muy recomendables ya que los locales más populares se llenan rápidamente, especialmente en temporada alta. El servicio de mesa es considerablemente más caro que el servicio rápido, pero ofrece mayor calidad y un ambiente relajado.',
    relatedTermIds: ['quick-service', 'character-dining'],
    aliases: [
      'table service',
      'restaurante con servicio',
      'cena con reserva',
      'restaurante sentado',
    ],
  },
  {
    id: 'character-dining',
    name: 'Cena con Personajes',
    shortDefinition:
      'Restaurante en que los personajes disfrazados visitan las mesas durante la comida.',
    definition:
      "La cena con personajes es una experiencia de restaurante (servicio de mesa o bufé) en la que los personajes disfrazados visitan cada mesa para interactuar con los visitantes, hacer fotos y firmar autógrafos. Garantiza el encuentro con personajes sin cola separada, lo que lo hace muy popular entre familias. Ejemplos: Chef Mickey's (Disney World) y el Storybook Dining en Auberge de Cendrillon (Disneyland Paris).",
    relatedTermIds: ['table-service', 'character-meet-and-greet', 'quick-service'],
    aliases: [
      'desayuno con personajes',
      'almuerzo con personajes',
      'character dining',
      'comida con personajes',
    ],
  },
  {
    id: 'drop-tower',
    name: 'Drop Tower',
    shortDefinition:
      'Atracción tipo torre que sube a los visitantes a gran altura y los suelta en una caída libre vertiginosa.',
    definition:
      'Una torre de caída (drop tower o free-fall tower) es una atracción en la que los visitantes son elevados en una góndola o asientos individuales alrededor de una estructura central de torre y después soltados para caer rápidamente hacia el suelo. La caída puede ser casi en caída libre (rozando la ingravidez), frenada, o combinada con un impulso hacia arriba. Una fase de deceleración progresiva frena la góndola suavemente al final. Las variantes incluyen torres rotativas, modelos multidireccionales y versiones híbridas. Las torres de caída ofrecen experiencias intensas en un espacio reducido y se encuentran en todo el mundo. Fabricantes destacados: Intamin, Mondial y S&S Worldwide.',
    relatedTermIds: ['flat-ride', 'height-requirement', 's-and-s-worldwide', 'intamin'],
    aliases: ['torre de caída libre', 'drop ride', 'caída libre', 'free fall tower', 'torres de caída'],
  },
  {
    id: 'log-flume',
    name: 'Descenso de Troncos',
    shortDefinition:
      'Atracción de canal de agua en que barcas con forma de tronco recorren un circuito y terminan con un gran chapuzón.',
    definition:
      'Un descenso de troncos (log flume) es una atracción acuática en la que los visitantes se sientan en embarcaciones con forma de tronco y recorren un canal lleno de agua. Tras secciones tranquilas llega una rampa empinada final que provoca un gran chapuzón casi seguro para los pasajeros. Los descensos de troncos se introdujeron en los años 1960 y se han convertido en un elemento casi universal de los parques de atracciones, apreciados por su atractivo familiar, su capacidad moderada y su popularidad veraniega. Ejemplos europeos destacados: Poseidon en Europa-Park y numerosas instalaciones de tipo Wildwasserbahn en parques de habla alemana.',
    relatedTermIds: ['water-ride', 'river-rapids', 'height-requirement'],
    aliases: ['log flume', 'troncos', 'río de troncos', 'Wildwasserbahn', 'barca de troncos'],
  },
  {
    id: 'river-rapids',
    name: 'Rápidos',
    shortDefinition:
      'Atracción en balsa circular que navega rápidos artificiales turbulentos donde los visitantes pueden acabar empapados.',
    definition:
      'Una atracción de rápidos (river rapids) coloca a los visitantes en balsas circulares inflables o de plástico que derivan y giran por un canal artificial diseñado para simular aguas bravas. Como la balsa circular rota libremente sobre la corriente, cada viaje es impredecible: según la posición de la balsa, algunos visitantes se empapan por completo mientras otros quedan relativamente secos. Las atracciones de rápidos tienen una alta capacidad horaria, gran atractivo familiar y requisitos de talla generalmente bajos. Son especialmente populares con el calor del verano. Ejemplos europeos: las atracciones Wildwasser de Phantasialand y diversas instalaciones en Efteling, Europa-Park y Thorpe Park.',
    relatedTermIds: ['water-ride', 'log-flume', 'height-requirement'],
    aliases: ['aguas bravas', 'rapids', 'river rapids', 'rafting', 'rápidos de río'],
  },
  {
    id: 'pendulum-ride',
    name: 'Atracción Pendular',
    shortDefinition:
      'Atracción plana en la que una góndola oscila en un amplio arco de péndulo, a menudo mientras gira simultáneamente.',
    definition:
      'Una atracción pendular es un tipo de atracción plana (flat ride) en la que una góndola o fila de asientos está montada en un largo brazo que oscila en un arco cada vez más amplio, alcanzando a menudo posiciones casi verticales. Muchas atracciones pendulares también hacen girar la góndola sobre su propio eje, combinando el movimiento de péndulo con la rotación axial para una mayor intensidad.\n\nLos ejemplos más conocidos son el Top Spin (Huss), donde una barra horizontal de asientos oscila y gira simultáneamente, y el Frisbee (Mondial), donde una góndola en forma de disco oscila como un péndulo mientras gira. Las atracciones pendulares son habituales en parques temáticos y ferias de todo el mundo gracias a su gran impacto visual y su huella relativamente compacta.',
    relatedTermIds: ['flat-ride', 'swing-ride', 'drop-tower', 'height-requirement'],
    aliases: ['Top Spin', 'Top Spins', 'Frisbee', 'Frisbees', 'atracciones pendulares'],
    alternateNames: ['atracción de péndulo', 'columpio pendular'],
  },
  {
    id: 'swing-ride',
    name: 'Sillas Voladoras',
    shortDefinition:
      'Atracción rotatoria en que los asientos colgados de cadenas se inclinan hacia fuera al girar la estructura.',
    definition:
      'Las sillas voladoras (también llamadas wave swinger o Kettenkarussell) son una atracción rotatoria en la que los asientos suspendidos de cadenas cuelgan de una estructura central giratoria. Al acelerar el giro, la fuerza centrífuga proyecta los asientos hacia afuera y hacia arriba, dando a los pasajeros una sensación de vuelo. Las sillas voladoras son uno de los tipos de atracciones de feria más antiguos aún en uso. Las versiones modernas van desde suaves carruseles infantiles hasta enormes torres de cadenas (starflyers) que elevan a los pasajeros decenas de metros. Están presentes en casi todos los parques temáticos y ferias de atracciones del mundo.',
    relatedTermIds: ['flat-ride', 'ride-capacity', 'height-requirement'],
    aliases: [
      'sillas giratorias',
      'wave swinger',
      'Kettenkarussell',
      'swing ride',
      'chairoplane',
      'caballitos voladores',
    ],
  },
  {
    id: 'racing-coaster',
    name: 'Montaña Rusa de Carreras',
    shortDefinition:
      'Dos vías paralelas de montaña rusa en las que los trenes parten simultáneamente y corren codo a codo.',
    definition:
      'Una montaña rusa de carreras (racing coaster) tiene dos circuitos separados pero simétricos que discurren en paralelo, con los trenes despachados simultáneamente para que los pasajeros vivan la emoción de competir contra el otro convoy. Los circuitos se cruzan o se aproximan en múltiples puntos para maximizar la tensión. Algunos modelos adoptan un diseño en bucle de Möbius: ambos circuitos forman un único recorrido continuo y los pasajeros cambian de lado automáticamente. El formato funciona igual con montañas rusas de madera y de acero. En Europa, Piraten en Djurs Sommerland y Dwervelwind en Plopsaland son ejemplos reconocidos.',
    relatedTermIds: ['wooden-coaster', 'steel-coaster', 'credit'],
    aliases: [
      'montaña rusa doble',
      'twin coaster',
      'dueling coaster',
      'racing coaster',
      'Paarachterbahn',
    ],
  },
  {
    id: 'high-five',
    name: 'High Five',
    shortDefinition:
      'Elemento de montaña rusa en que dos trenes en vías paralelas se pasan a distancia de un brazo.',
    definition:
      "Un High Five es un elemento de cuasi-colisión en el que dos trenes de montaña rusa en vías separadas pero muy próximas se pasan a una distancia extremadamente corta – a veces al alcance del brazo – creando una emocionante ilusión de colisión inminente. El nombre proviene de la sensación de que los pasajeros podrían extender la mano y chocar los cinco con los del otro tren. El elemento requiere una sincronización precisa de salidas para llevar ambos trenes al punto de cruce al mismo tiempo. Los wing coasters y los inverted coasters son especialmente aptos para el High Five porque los asientos exteriores amplían el efecto de cuasi-choque. Duelling Dragons / Dragon Challenge en Universal's Islands of Adventure fue un célebre ejemplo temprano; el elemento aparece hoy en varios B&M wing coasters de todo el mundo.",
    relatedTermIds: ['wing-coaster', 'inverted-coaster', 'b-and-m'],
    aliases: ['elemento cuasi-colisión', 'near miss', 'near-miss element', 'high 5'],
  },
  {
    id: 'dining-reservation',
    name: 'Reserva de Restaurante',
    shortDefinition:
      'Reserva anticipada para un restaurante de servicio de mesa en un parque temático o resort.',
    definition:
      'Una reserva de restaurante es una reserva anticipada para un restaurante de servicio de mesa o de cena con personajes en un parque temático, hotel del resort o complejo de entretenimiento asociado. En los parques Disney, las reservas se pueden hacer hasta 60 días de antelación (con 10 días más para los huéspedes del hotel del resort) y son indispensables para los restaurantes más populares: no reservar a tiempo puede significar quedarse sin mesa. Las reservas suelen garantizarse con una tarjeta de crédito; Disney cobra un cargo en caso de no presentarse o cancelar con poca antelación. En la comunidad de entusiastas se abrevia habitualmente como ADR (Advance Dining Reservation).',
    relatedTermIds: ['table-service', 'character-dining', 'peak-season'],
    aliases: [
      'ADR',
      'advance dining reservation',
      'reserva restaurante',
      'dining reservation',
      'reserva de mesa',
    ],
  },
  {
    id: 'mobile-ordering',
    name: 'Pedido Móvil',
    shortDefinition:
      'Función de la app del parque que permite pedir y pagar la comida con antelación sin hacer cola en el mostrador.',
    definition:
      'El pedido móvil permite a los visitantes consultar el menú de un restaurante, realizar y pagar su pedido, y seleccionar un horario de recogida a través de la app oficial del parque, sin hacer cola en el mostrador. Disney popularizó el sistema en sus restaurantes de servicio rápido; Universal, Six Flags, los parques Merlin y muchos otros operadores han lanzado sus propias versiones. Cuando llega la franja horaria elegida, los visitantes reciben una notificación y recogen su pedido en el punto designado. El pedido móvil ahorra tiempo valioso, sobre todo durante el pico del almuerzo. Requiere un smartphone con batería y cobertura suficiente dentro del parque.',
    relatedTermIds: ['quick-service', 'dining-reservation'],
    aliases: ['pedido por móvil', 'mobile order', 'pedido en app', 'mobile ordering'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Gran zona de restauración compartida con varios mostradores de diferentes cocinas bajo un mismo techo.',
    definition:
      'Un food court es un espacio de restauración común con múltiples mostradores o puestos de comida rápida independientes que ofrecen distintas cocinas y comparten una zona de asientos. En los parques temáticos, los food courts son habitualmente las zonas de restauración con mayor capacidad, diseñadas para absorber el gran volumen de visitantes a la hora del almuerzo. Distintos miembros de un grupo pueden pedir en mostradores diferentes y sentarse juntos. El nivel de ambientación varía: Disney y Universal suelen integrar los food courts en la temática de sus áreas, mientras que otros parques los gestionan como espacios funcionales cerca de las entradas. Los food courts son en general la opción de restauración más asequible dentro de un resort.',
    relatedTermIds: ['quick-service', 'table-service', 'mobile-ordering'],
    aliases: ['zona de restauración', 'patio de comidas', 'food court', 'zona de comida'],
  },
  {
    id: 'capacity-closure',
    name: 'Cierre por Capacidad',
    shortDefinition:
      'Cuando un parque deja de admitir nuevos visitantes porque ha alcanzado su aforo máximo.',
    definition:
      'Un cierre por capacidad (también llamado parque completo o agotado) ocurre cuando un parque temático alcanza su número máximo de visitantes permitido y deja temporalmente de vender entradas de día o de admitir nuevos visitantes. Los parques gestionan la capacidad mediante reservas de entrada programadas, seguimiento en tiempo real de la asistencia y cierres temporales de acceso. Los titulares de abono anual pueden ser bloqueados en días de capacidad según las normas del parque; otros parques usan sistemas de reserva anticipada que evitan el aforo excesivo antes de que se produzca. Los cierres por capacidad son más frecuentes en los picos de vacaciones escolares, noches de fuegos artificiales y eventos especiales. Consultar la app del parque o sus redes sociales la mañana de la visita puede evitar sorpresas desagradables.',
    relatedTermIds: ['peak-season', 'annual-pass', 'school-holiday', 'crowd-level'],
    aliases: ['parque completo', 'parque lleno', 'capacity closure', 'aforo máximo', 'agotado'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'Una variante del zero-G roll con un cambio de dirección integrado — el tren entra y sale de la inversión con rumbos diferentes.',
    definition:
      "El zero-G winder toma el concepto central del zero-G roll — una rotación de 360 grados en un arco parabólico que genera casi ingravidez en el vértice — y añade un cambio de dirección en la geometría de la vía. Mientras que en un zero-G roll estándar el tren entra y sale en rumbos aproximadamente paralelos, el winder curva la vía durante la rotación de modo que el tren sale apuntando en una dirección diferente de la que tenía al entrar. Esto convierte el elemento en una herramienta de diseño de trazado y también en una inversión: al mismo tiempo ofrece la sensación flotante de un zero-G roll y redirige la montaña rusa hacia la siguiente sección.\n\nLos zero-G winders están fuertemente asociados a diseños más modernos y técnicamente ambiciosos de fabricantes como Intamin y B&M. Kondaa en Walibi Belgium y VelociCoaster en Universal's Islands of Adventure son dos ejemplos destacados. La combinación de airtime, inversión y transición de dirección en un único elemento dota al zero-G winder de una sensación más compleja que un zero-G roll convencional.",
    relatedTermIds: ['zero-g-roll', 'inversion', 'airtime', 'intamin'],
    aliases: ['zero g winder', 'Zero-G Winder', 'winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Un elemento de doble inversión alargado y asimétrico en el que dos inversiones están conectadas por un arco curvo largo — con forma de banana visto desde arriba.',
    definition:
      'El banana roll es una variante estirada del concepto de doble inversión en la que las dos inversiones están más separadas y conectadas por una sección en curva amplia, en lugar de la geometría estrecha y simétrica de un cobra roll estándar. Visto desde arriba, la vía sigue un arco gradual a través de ambas inversiones que recuerda la curvatura de una banana. La geometría más abierta distribuye las dos inversiones a lo largo de una sección de vía más larga, ofreciendo al rider una experiencia más fluida y distendida a través de ambas inversiones en comparación con la intensidad rápida de un cobra roll convencional.\n\nEl banana roll apareció por primera vez en 2011 en Takabisha en Fuji-Q Highland, Japón, construido por Gerstlauer. S&S Worldwide desarrolló después su propia variante con doble inversión para Steel Curtain en Kennywood. Dado que el elemento requiere considerable espacio lateral, tiende a aparecer en instalaciones más grandes, a ras de suelo, donde la vía puede describir una trayectoria amplia entre las dos inversiones.',
    relatedTermIds: ['cobra-roll', 'inversion', 'gerstlauer', 's-and-s-worldwide'],
    aliases: ['banana roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Looping Inclinado',
    shortDefinition:
      'Un looping vertical girado respecto a su eje perpendicular — el tren lo afronta y lo abandona en ángulo en lugar de de frente.',
    definition:
      'Un looping inclinado (en inglés inclined loop o tilted loop) es un looping vertical estándar rotado sobre su eje, normalmente entre 45 y 80 grados respecto a la dirección de marcha del tren. En lugar de que el tren entre y salga del looping en línea recta — como en un looping vertical clásico — lo afronta y lo abandona en diagonal, creando un perfil visual asimétrico y una sensación de conducción notablemente diferente.\n\nLa geometría inclinada cambia cómo los riders viven la inversión: la aproximación se siente más lateral que en un looping estándar, y la salida en la parte inferior del círculo proviene de una dirección inesperada, lo que puede ser tanto desorientador como emocionante. Para los espectadores, un looping inclinado luce dramáticamente distinto a uno recto y se reconoce al instante como inusual. Los loopings inclinados aparecen en varias montañas rusas de B&M e Intamin, a menudo en la parte media o final del trazado.',
    relatedTermIds: ['vertical-loop', 'inversion', 'b-and-m', 'intamin'],
    aliases: ['tilted loop', 'looping torcido', 'inclined loop', 'looping inclinado'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'Elemento Vekoma de doble inversión en el que el tren sale en la misma dirección en la que entró.',
    definition:
      'El sea serpent es un elemento de doble inversión estrechamente asociado a los diseños de montañas rusas invertidas de Vekoma. Al igual que el cobra roll, consta de dos secuencias de inversión unidas por una sección central de conexión, pero la geometría de la vía difiere en un punto clave: mientras que el cobra roll hace girar el tren 180 grados, el sea serpent está diseñado para que el tren entre y salga en la misma dirección general. Las dos inversiones se elevan y descienden en una secuencia fluida sin invertir el rumbo del tren, dando al elemento, visto de lado, una apariencia larga en forma de S — como el cuerpo de una serpiente marina emergiendo entre dos olas.\n\nLos sea serpents aparecen en el modelo Suspended Looping Coaster (SLC) de Vekoma y en algunas de sus instalaciones personalizadas. Dado que el SLC ha sido producido en gran número para parques de todo el mundo, el sea serpent es uno de los elementos de doble inversión más extendidos a nivel global, aunque sea menos conocido por su nombre que el cobra roll.',
    relatedTermIds: ['inversion', 'cobra-roll', 'batwing', 'vekoma'],
    aliases: ['sea serpent', 'roll over'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'Elemento firma de RMC que fusiona la primera caída y un barrel roll completo en una única secuencia continua — los riders quedan invertidos mientras todavía descienden.',
    definition:
      'El barrel roll drop es uno de los elementos firma más celebrados de Rocky Mountain Construction, fusionando dos experiencias normalmente separadas — la primera caída y una inversión completa — en una secuencia única e ininterrumpida. Tras abandonar el lifthill, la vía hace rotar el tren en un barrel roll completo mientras desciende simultáneamente: los riders quedan completamente invertidos cerca del punto más empinado de la caída, para luego ser devueltos a la posición vertical a medida que el tren alcanza la parte inferior y transiciona al resto del trazado.\n\nEl elemento fue posible gracias al sistema de vías de acero I-Box de RMC, que permite los radios ajustados y la compleja geometría tridimensional necesarios para un roll y una caída simultáneos — una combinación imposible en las vías de madera tradicionales. Medusa Steel Coaster en Six Flags México estuvo entre las primeras atracciones en incorporarlo; Steel Vengeance en Cedar Point y Zadra en Energylandia son otros ejemplos ampliamente reconocidos.',
    relatedTermIds: ['inversion', 'rmc', 'first-drop', 'hybrid-coaster', 'stall'],
    aliases: ['barrel roll drop', 'RMC barrel roll', 'barrel roll downdrop'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mid-Course Brake Run — una zona de frenado a mitad del recorrido que puede detener el tren completamente para permitir la operación con múltiples trenes de forma segura.',
    definition:
      'Un mid-course brake run (MCBR) es una sección de frenos instalada en algún punto del centro del recorrido de una montaña rusa — después de los primeros elementos principales pero antes de la secuencia final. A diferencia de los trim brakes, que solo reducen la velocidad y dejan al tren continuar inmediatamente, un MCBR es un freno de bloque completo: puede detener el tren por completo y mantenerlo hasta que se confirme que la siguiente sección de bloque por delante está despejada. Esto permite operar múltiples trenes en el mismo circuito de forma simultánea sin riesgo de colisión, incrementando considerablemente la capacidad de la atracción.\n\nEn un día de operación concurrida con trenes a plena capacidad, un MCBR bien sincronizado liberará el tren detenido casi de inmediato y los riders apenas notarán la breve deceleración. En días más tranquilos con menos trenes en circulación, la parada puede durar más y resultar más brusca. Los MCBRs son estándar en la mayoría de las grandes montañas rusas: los B&M inverted y floorless, muchas atracciones Intamin y otras atracciones de alta capacidad los utilizan de forma rutinaria.',
    relatedTermIds: ['block-brake', 'brake-run', 'trim-brake', 'stacking', 'ride-capacity'],
    aliases: ['mid-course brake run', 'freno de mitad de recorrido', 'freno intermedio', 'MCBR'],
  },
  {
    id: 'interlocking-loops',
    name: 'Loopings Entrelazados',
    shortDefinition:
      'Dos loopings verticales cuyos planos se cruzan — creando una vistosa estructura en forma de eslabón o figura ocho.',
    definition:
      'Los loopings entrelazados (en inglés interlocking loops) son dos loopings verticales posicionados de modo que sus planos estructurales se intersectan, generalmente en ángulos casi perpendiculares. El resultado es una configuración visual llamativa en la que un looping parece atravesar el otro desde ciertos ángulos, como un eslabón de cadena o un enorme ocho que surge del suelo. La complejidad estructural necesaria para hacer que dos loopings se crucen sin que las vías se toquen en realidad es considerable, pero el impacto visual convierte el elemento en un punto focal destacado en el horizonte del parque.\n\nLos loopings entrelazados se asocian más frecuentemente con los B&M inverted coasters y las montañas rusas de sentado diseñadas para un gran número de inversiones. Dragon Khan en PortAventura, durante mucho tiempo una de las montañas rusas más famosas de Europa, cuenta con loopings entrelazados como parte de su trazado de ocho inversiones, y la sección de loops cruzados es una de las más fotografiadas de la atracción.',
    relatedTermIds: ['vertical-loop', 'inversion', 'b-and-m'],
    aliases: ['loopings entrelazados', 'interlocking loops', 'loops cruzados'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'El mecanismo de trinquete en el lifthill que impide que el tren ruede hacia atrás — la fuente del icónico sonido clic-clac.',
    definition:
      'Un anti-rollback (también llamado "perro anti-rollback") es un mecanismo de seguridad mecánico instalado a lo largo de la parte inferior de un lifthill. A medida que el tren sube, unos trinquetes metálicos con resorte van encajando sobre una serie de dientes integrados en la estructura del lifthill. Si la cadena o el mecanismo de tracción fallara, los trinquetes se bloquearían en los dientes e inmovilizarían el tren, impidiendo que retroceda. El movimiento de trinquete sobre los dientes es el origen del rítmico sonido clic-clac que se ha convertido en una de las firmas acústicas más reconocibles de las montañas rusas tradicionales.\n\nEn las montañas rusas modernas con lifthill de cable silencioso o propulsión LSM, los anti-rollbacks se reemplazan a menudo por sistemas de frenado electromagnético silenciosos, motivo por el que algunos nuevos lifthill son notablemente más silenciosos. Algunos entusiastas lamentan la pérdida de este ritual sonoro clásico.',
    relatedTermIds: ['lifthill', 'rollback', 'launch-coaster'],
    aliases: ['anti-rollback device', 'trinquete anti-retroceso', 'clic-clac'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      'Elementos estructurales diseñados para pasar justo por encima de las cabezas de los riders a gran velocidad — creando una ilusión de casi impacto.',
    definition:
      'Los head choppers son elementos de diseño intencionales en los que la estructura de soporte, los travesaños, los túneles u otras secciones de vía pasan inmediatamente sobre las cabezas de los riders en el momento en que el tren viaja a plena velocidad. La proximidad y el momento crean una poderosa ilusión de que algo está a punto de golpear a los riders — un disparo de adrenalina sin peligro real, ya que el margen está precisamente calculado. La sensación es más intensa cuando los riders no lo anticipan.\n\nLos head choppers se asocian especialmente a las montañas rusas de madera muy compactas y a los inverted coasters, donde el perfil colgante de los trenes acerca a los riders a soportes y secciones de vía adyacentes. Para muchos entusiastas, unos head choppers bien diseñados son señal de creatividad en el trazado y contribuyen significativamente a la intensidad percibida de la atracción.',
    relatedTermIds: ['roller-coaster-element', 'inverted-coaster', 'twister-coaster'],
    aliases: ['head chopper', 'casi impacto', 'near miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'Cuando un operador aprieta los barcos de regazo o los arneses demasiado contra los riders — eliminando el confort y el airtime que la atracción fue diseñada para ofrecer.',
    definition:
      'El stapling se refiere a la práctica — intencional o por exceso de precaución — de un operador que empuja un lap bar o arnés de hombros tan firmemente contra un rider que queda mucho más ajustado de lo mínimo necesario para la seguridad. El término proviene de la sensación de estar "grapado" al asiento. En las montañas rusas centradas en el airtime, los lap bars deben quedar suficientemente sueltos para que los riders puedan elevarse ligeramente del asiento en las crestas de las colinas — eso es airtime. Un rider stapled permanece pegado al asiento durante toda la vuelta y no puede experimentar la sensación de flotación prevista, por bien diseñadas que estén las colinas.\n\nEl stapling es una fuente habitual de frustración en la comunidad de entusiastas, especialmente en montañas rusas de madera e híbridas donde el airtime es la atracción principal. Algunos parques son conocidos por su política sistemáticamente ajustada; otros se valoran por su libertad de lap bar.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'ejector-airtime'],
    aliases: ['stapled', 'arnés demasiado ajustado', 'barra demasiado apretada'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Cuando un tren de montaña rusa pierde suficiente velocidad a mitad del recorrido como para quedar atrapado en un punto bajo de la vía y no poder completar el circuito.',
    definition:
      'El valleying ocurre cuando un tren, habiendo perdido demasiada energía cinética durante la vuelta, no tiene suficiente impulso para superar el siguiente elemento y se detiene — o rueda hacia atrás — en un valle entre dos puntos altos de la vía. Al estar el tren en un punto bajo y no en una zona de frenos o en la estación, los sistemas de operación normales no pueden moverlo. La recuperación requiere normalmente que personal de mantenimiento empuje o cable el tren hasta el siguiente punto alto y evacúe a los riders.\n\nEl valleying es raro en condiciones normales de operación, ya que las atracciones están diseñadas con amplios márgenes de velocidad. Es más probable con clima muy frío (cuando los rodamientos funcionan rígidos), tras un frenado excesivo por trim brakes, o en montañas rusas de madera antiguas cuya geometría de vía ha variado con el tiempo.',
    relatedTermIds: ['rollback', 'trim-brake', 'brake-run', 'downtime'],
    aliases: ['valleyed', 'tren atascado', 'tren varado'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'Un tipo de montaña rusa con pequeños vehículos individuales y un circuito compacto de curvas cerradas y planas en el borde de plataformas elevadas.',
    definition:
      'Una wild mouse (ratón salvaje) utiliza pequeños vehículos de dos a cuatro personas en lugar de trenes largos. Su sello distintivo es una serie de curvas en horquilla cerradas y poco peraltadas ejecutadas en los bordes más exteriores de la vía. La escasa inclinación — a diferencia de las curvas muy peraltadas de otras montañas rusas — lanza a los riders lateralmente contra la pared del vehículo, y la inercia del movimiento hace que la curva parezca llegar más tarde de lo esperado, creando la convincente sensación de que el vehículo está a punto de salirse de la vía.\n\nLas wild mouse son de las diseños más eficientes en cuanto a espacio, encajando una sorprendente cantidad de vía en una huella compacta al apilar los niveles de curvas en horquilla. Son comunes en parques de todo el mundo y de muy distintos tamaños. Fabricantes destacados: Mack Rides, Maurer y Gerstlauer.',
    relatedTermIds: ['spinning-coaster', 'steel-coaster', 'mack-rides', 'gerstlauer'],
    aliases: ['wild mouse coaster', 'ratón salvaje', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: 'Montaña Rusa 4D',
    shortDefinition:
      'Un tipo de montaña rusa cuyos asientos están montados en brazos giratorios que sobresalen a ambos lados del tren — y pueden girar independientemente de la dirección de marcha.',
    definition:
      'Una montaña rusa 4D (cuarta dimensión) es un diseño en el que los asientos de pasajeros no están fijados rígidamente al tren, sino montados en brazos giratorios que se extienden a izquierda y derecha de cada coche. Los asientos pueden girar hacia delante o hacia atrás independientemente de la dirección del tren — controlados bien por un raíl guía fijo junto a la vía principal (que impone una posición de asiento precisa en cada momento del recorrido), bien mediante rotación libre impulsada por la gravedad y la distribución del peso de los riders. El resultado: los pasajeros pueden mirar hacia abajo durante una caída, quedar invertidos en una curva, o rotar en varios ejes simultáneamente durante las inversiones.\n\nEl concepto fue desarrollado por Arrow Dynamics y refinado posteriormente por S&S Worldwide. X2 en Six Flags Magic Mountain (California) es el ejemplo más famoso, inaugurado en 2002 como primera montaña rusa 4D del mundo. Eejanaika en Fuji-Q Highland, Japón, ostenta el récord mundial de inversiones de cualquier montaña rusa, en parte gracias a la rotación de los asientos, que multiplica el recuento de inversiones.',
    relatedTermIds: [
      'inverted-coaster',
      'spinning-coaster',
      'arrow-dynamics',
      's-and-s-worldwide',
      'inversion',
    ],
    aliases: [
      '4D coaster',
      'cuarta dimensión',
      'montaña rusa cuarta dimensión',
      'free spin coaster',
    ],
  },
  {
    id: 'out-and-back',
    name: 'Out-and-Back',
    shortDefinition:
      'Un trazado de montaña rusa que se aleja de la estación en línea relativamente recta, da la vuelta al final del terreno y regresa en paralelo.',
    definition:
      'Un out-and-back es uno de los dos tipos de trazado fundamentales de montaña rusa. El tren sale de la estación, avanza en una dirección globalmente lineal — habitualmente con una serie de colinas optimizadas para airtime — ejecuta un giro en el extremo del terreno y regresa por una trayectoria paralela al tramo de ida. Los dos tramos rara vez se cruzan, dando un plano largo y estrecho.\n\nLos diseños out-and-back están fuertemente asociados a las montañas rusas de madera tradicionales, donde la velocidad acumulada en las largas colinas de ida se aprovecha en la vuelta mediante una sucesión de colinas progresivamente más cortas y rápidas que maximizan el floater airtime. Ejemplos famosos incluyen The Voyage en Holiday World y los distintos modelos del tipo Racer.',
    relatedTermIds: ['twister-coaster', 'airtime', 'wooden-coaster', 'airtime-hill'],
    aliases: ['out and back', 'trazado out-and-back', 'ida y vuelta'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'Un trazado de montaña rusa que en espiral, da vueltas y se cruza sobre sí mismo — empaquetando el máximo de elementos en una huella compacta.',
    definition:
      'Un twister (también llamado layout de ciclón) es un diseño de montaña rusa en el que la vía espirala, se pliega sobre sí misma y se cruza repetidamente, tejiendo una estructura intrincada en lugar de seguir el camino de dos tramos del out-and-back. El rasgo definitorio es que el tren pasa frecuentemente muy cerca de otras secciones de la misma vía — a menudo en distintas direcciones y alturas — creando efectos head-chopper y una complejidad visual característica.\n\nLos trazados twister son eficientes en cuanto a espacio: mucha longitud de vía y desnivel caben en una huella compacta, lo que los convierte en una opción popular en parques con espacio limitado. Los twisters de madera incluyen clásicos como el Twister de Gröna Lund en Estocolmo; los twisters de acero abarcan muchos diseños de B&M e Intamin.',
    relatedTermIds: ['out-and-back', 'wooden-coaster', 'head-choppers', 'helix'],
    aliases: ['twister layout', 'ciclón', 'trazado twister'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error — la desviación media en minutos entre el tiempo de espera previsto y el real.',
    definition:
      'El MAE (Mean Absolute Error, error absoluto medio) es la medida de precisión estándar de park.fan. Calcula la diferencia media — en minutos — entre cada tiempo de espera predicho y el tiempo real registrado en la atracción. Un MAE de 8 minutos significa que las predicciones se desvían 8 minutos de media.\n\nEl MAE trata cada error por igual: un error de 5 minutos y uno de 15 se promedian linealmente. Eso lo hace intuitivo — MAE = 10 significa "las predicciones están típicamente a 10 minutos de la realidad." Un MAE más bajo siempre implica predicciones más precisas.',
    relatedTermIds: ['rmse', 'mape', 'r-squared', 'ai-forecast'],
    aliases: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error — similar al MAE pero penaliza más los errores grandes de predicción.',
    definition:
      'El RMSE (Root Mean Square Error, raíz del error cuadrático medio) mide la precisión elevando al cuadrado cada error antes de promediarlos. Los errores grandes — una cola predicha con 40 minutos de desviación — contribuyen mucho más al RMSE que un error de 5 minutos. El RMSE siempre es igual o mayor que el MAE.\n\nUna gran diferencia entre RMSE y MAE indica que el modelo produce ocasionalmente errores extremos, aunque la mayoría de las predicciones sean cercanas a la realidad. Ambas métricas se muestran en directo en la página de inicio de park.fan.',
    relatedTermIds: ['mae', 'mape', 'r-squared', 'ai-forecast'],
    aliases: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      'Mean Absolute Percentage Error — el error de predicción expresado como porcentaje del tiempo de espera real.',
    definition:
      'El MAPE (Mean Absolute Percentage Error, error absoluto porcentual medio) expresa la precisión como porcentaje en lugar de minutos. En vez de "8 minutos de desviación", indica "15 % del tiempo de espera real de desviación". Esto facilita comparar la precisión entre atracciones con tiempos de espera muy distintos — un error de 10 minutos es mucho más grave en una atracción con 15 minutos habituales que en una con 90.\n\nEl MAPE puede ser engañosamente alto cuando los tiempos de espera reales son muy cortos. Por eso park.fan lo muestra siempre junto al MAE y el RMSE.',
    relatedTermIds: ['mae', 'rmse', 'r-squared', 'ai-forecast'],
    aliases: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'R cuadrado — mide qué tan bien el modelo IA explica los patrones en los tiempos de espera reales (0–1, mayor es mejor).',
    definition:
      'El R² (R cuadrado, o coeficiente de determinación) mide qué proporción de la variación en los tiempos de espera reales logra explicar el modelo. Un valor de 1,0 significaría predicciones perfectas; 0,0 significa que el modelo no explica nada más allá de un promedio simple. En la práctica, valores superiores a 0,7 indican un buen modelo; superiores a 0,9, excelente.\n\nPara las predicciones de tiempos de espera, lograr un R² alto es difícil porque las colas están influenciadas por factores impredecibles. El valor R² de park.fan refleja el rendimiento real sobre todas las predicciones seguidas y se actualiza diariamente.',
    relatedTermIds: ['mae', 'rmse', 'mape', 'ai-forecast'],
    aliases: ['R-squared', 'coeficiente de determinación'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Atracción de temporada',
    shortDefinition:
      'Una atracción, show o experiencia que solo funciona durante ciertos meses del año — como una pista de hielo en invierno o una atracción acuática en verano.',
    definition:
      'Una atracción de temporada es una atracción, show o experiencia que el parque solo ofrece durante un período definido del año. Las pistas de hielo, las pistas de trineo y los shows invernales suelen funcionar de noviembre a febrero; los toboganes acuáticos, las zonas de juegos con agua y los espectáculos al aire libre de mayo a septiembre. Algunas atracciones de temporada están vinculadas a eventos específicos como Halloween o Navidad.\n\nEn park.fan, las atracciones y shows de temporada se identifican automáticamente a partir de datos históricos de operación y se ocultan en las pestañas del parque y en el mapa cuando están fuera de sus meses activos — para reducir el desorden visual y ayudarte a centrarte en lo que realmente está abierto hoy. Un badge de temporada (❄️ Invierno, ☀️ Verano o 🍃 genérico) aparece en cada tarjeta correspondiente. Cuando la atracción está fuera de temporada, el badge aparece atenuado. Un botón de filtro en las pestañas permite mostrar las entradas ocultas cuando sea necesario.',
    relatedTermIds: ['offseason', 'refurbishment', 'crowd-calendar'],
    aliases: ['atracción estacional', 'show de temporada', 'experiencia temporal'],
  },
];

export default translations;
