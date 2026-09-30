import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Tiempo de espera',
    shortDefinition:
      'El tiempo estimado que un visitante debe estar en fila antes de acceder a una atracción.',
    definition:
      'El tiempo de espera es la duración estimada que un visitante pasa en la cola antes de poder subir a una atracción. Los parques muestran los tiempos de espera en la entrada de las atracciones y en sus aplicaciones. park.fan vuelve a leer los tiempos de espera cada cinco minutos, para cada atracción de un parque.',
    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
    aliases: ['Tiempos de espera', 'tiempo de espera'],
    alternateNames: ['Cola', 'Tiempo en cola'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Un carril separado para visitantes dispuestos a viajar solos para llenar asientos vacíos.',
    definition:
      'El carril single rider es para quien está dispuesto a montar separado de su grupo, y va rellenando los asientos sueltos que quedan libres en los trenes. Como esos pasajeros se encajan en los huecos, la cola avanza mucho más rápido que la normal: a menudo con esperas un 50–70 % más cortas. No todas las atracciones ofrecen acceso single rider.',
    alternateNames: ['Single Rider Lane', 'Fila individual'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Single Riders'],
  },
  {
    id: 'virtual-queue',
    name: 'Cola virtual',
    shortDefinition:
      'Un sistema de cola digital donde los visitantes reservan un horario en lugar de esperar físicamente.',
    definition:
      'Una cola virtual permite a los visitantes apuntarse a una atracción desde una app o un quiosco y recibir un aviso cuando se acerca su turno. En vez de estar en la cola, durante ese rato se puede andar por otra parte del parque y volver cuando llaman al grupo.',
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ['Colas virtuales'],
  },
  {
    id: 'express-pass',
    name: 'Pase Express',
    shortDefinition:
      'Una mejora de ticket de pago o incluida que da acceso a una cola prioritaria más corta.',
    definition:
      'Un Pase Express (el nombre varía según el parque: Universal Express, Disney Lightning Lane, etc.) es una mejora que permite a los titulares usar una entrada prioritaria propia, con esperas mucho más cortas. Algunos parques incluyen el acceso exprés en sus paquetes de hotel; otros lo venden aparte.',
    alternateNames: ['Flash Pass', 'Express Pass', 'Lightning Lane'],

    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['Pase Express', 'Pases Express'],
  },
  {
    id: 'posted-wait-time',
    name: 'Tiempo publicado',
    shortDefinition:
      'El tiempo de espera oficial mostrado por el parque en la entrada de una atracción.',
    definition:
      'El tiempo publicado es la estimación oficial que aparece en la entrada de una atracción y en la app del parque. Los parques la calculan a partir de la longitud medida de la cola, del rendimiento que la atracción ha tenido hasta ese momento y del ritmo al que se está embarcando en ese instante. park.fan reúne los tiempos publicados de varias fuentes públicas cada cinco minutos.',
    relatedTermIds: ['crowd-level', 'wait-time'],
    aliases: ['tiempo publicado', 'tiempos publicados'],
  },
  {
    id: 'crowd-level',
    name: 'Nivel de afluencia',
    shortDefinition:
      'Una medida de cuán concurrido está un parque temático en un día determinado, de muy bajo a extremo.',
    definition:
      'El nivel de afluencia expresa en una escala lo lleno que está un parque en un día o a una hora concretos. park.fan lo calcula a partir de los tiempos de espera medidos, la ocupación actual y la previsión, y la escala va de «muy bajo» a «extremo». Muy bajo significa colas cortas y caminos despejados; extremo significa esperas largas en casi todas las atracciones.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Niveles de afluencia', 'afluencia'],
  },
  {
    id: 'crowd-calendar',
    name: 'Calendario de afluencia',
    shortDefinition:
      'Una previsión día a día de los niveles de afluencia previstos para ayudar a planificar la visita.',
    definition:
      'Un calendario de afluencia es un calendario mensual o anual con el nivel de afluencia previsto para cada día. park.fan genera calendarios de afluencia con modelos de IA entrenados con los tiempos de espera registrados, los calendarios de vacaciones escolares combinados, los eventos próximos y las tendencias estacionales.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
    aliases: ['Calendarios de afluencia'],
  },
  {
    id: 'peak-day',
    name: 'Día pico',
    shortDefinition:
      'Un día con el máximo número de visitantes, típicamente durante días festivos o eventos especiales.',
    definition:
      'Un día pico es un día en que la afluencia llega o se acerca a la capacidad máxima del parque. Suelen serlo los grandes festivos (Navidad, Semana Santa, vacaciones de verano), los días de eventos especiales y las semanas de vacaciones escolares. park.fan marca los días pico en el calendario de afluencia.',
    aliases: ['Días pico'],
    alternateNames: ['Temporada Alta', 'Día Concurrido', 'Día de máxima afluencia'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Renovación',
    shortDefinition:
      'Un período de cierre planificado durante el cual una atracción se somete a mantenimiento o mejoras.',
    definition:
      'Una renovación es un período programado de mantenimiento u obras durante el cual una atracción, un espectáculo o una zona del parque permanece cerrada. Puede durar desde unos pocos días hasta varios meses. park.fan marca las atracciones que están en renovación.',
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
      'El tiempo de inactividad es un cierre temporal no programado de una atracción; una renovación, en cambio, se planifica. Lo provocan fallos técnicos, revisiones de seguridad, incidentes con visitantes o el mal tiempo. park.fan muestra en tiempo real el estado de cada atracción que sigue.',
    aliases: ['Averías'],
    alternateNames: ['Fuera de Servicio', 'Problema Técnico', 'Parada técnica'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: 'Capacidad de atracción',
    shortDefinition: 'El número de visitantes que una atracción puede llevar por hora.',
    definition:
      'La capacidad de una atracción es el número máximo de visitantes que puede transportar por hora en condiciones operativas óptimas. La capacidad depende del tamaño del vehículo, el número de vehículos en funcionamiento, la velocidad de carga y descarga y el tiempo del ciclo. La capacidad determina directamente la velocidad de avance de la cola.',
    relatedTermIds: ['downtime', 'refurbishment', 'wait-time'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'El momento en que un parque abre oficialmente sus puertas y las colas para las atracciones populares son más cortas.',
    definition:
      'El Rope Drop es el momento en que un parque temático abre por la mañana. El nombre viene de la cuerda (o barrera) que el personal del parque baja para dejar entrar a los primeros visitantes. Mucha gente llega para el Rope Drop porque a primera hora, antes de que el parque se llene, las atracciones más solicitadas tienen las colas más cortas. Las horas de apertura exactas están en el horario de park.fan.',
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'early-entry', 're-ride', 'wait-time'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      'Un beneficio exclusivo que permite a los huéspedes de los hoteles del resort entrar al parque antes de la apertura general.',
    definition:
      'El Early Entry (también llamado Extra Magic Hours o Early Park Entry) permite a los huéspedes de hoteles asociados acceder al parque 30–60 minutos antes que el público general. En ese rato las colas de las atracciones más solicitadas son bastante más cortas, y en un día de mucha afluencia se pueden hacer varias de ellas con poca espera.',
    aliases: ['Entrada anticipada'],
    alternateNames: ['Extra Magic Hours', 'Acceso Anticipado', 'Early Park Entry'],

    relatedTermIds: ['express-pass', 'peak-day', 'rope-drop'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Un complemento de ticket que permite visitar varios parques del mismo resort en el mismo día.',
    definition:
      'Un ticket Park Hopper permite acceder a dos o más parques del mismo resort en un solo día. La opción Park Hopper de Disney, por ejemplo, permite moverse entre Magic Kingdom, EPCOT, Hollywood Studios y Animal Kingdom a partir de las 14:00 horas. Sirve a quien quiere hacer el mismo día atracciones que están en parques distintos.',
    aliases: ['Park-Hopper', 'Park Hoppers'],
    alternateNames: ['Park Hopping', 'Ticket multiparque'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'season-pass'],
  },
  {
    id: 'season-pass',
    name: 'Pase anual',
    shortDefinition: 'Un ticket anual que permite visitas ilimitadas al parque durante 12 meses.',
    definition:
      'Un pase anual (Annual Pass) ofrece entradas ilimitadas a uno o más parques durante un período de 12 meses. Los niveles superiores suelen incluir ventajas como descuentos en restauración, aparcamiento gratuito y descuentos en merchandising. Algunos pases tienen fechas bloqueadas (blockout dates) en los días de mayor afluencia. A partir de unas tres visitas al año, un pase anual casi siempre sale más barato que las entradas sueltas.',
    aliases: ['Pases de temporada', 'Abono anual'],
    alternateNames: ['Annual Pass', 'Season Pass', 'Tarjeta Anual', 'Abono de temporada'],

    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
  },
  {
    id: 'height-requirement',
    name: 'Talla mínima',
    shortDefinition:
      'Una estatura mínima que los visitantes deben tener para acceder a una atracción específica.',
    definition:
      'La talla mínima es una norma de seguridad que fija cada parque para que los sistemas de retención (barras de seguridad, arneses, cinturones) funcionen correctamente con cada pasajero. Suele estar entre 90 y 140 cm, según la intensidad de la atracción. Algunas atracciones tienen además una altura o un peso máximo. Con niños pequeños conviene mirar las tallas antes de la visita.',
    aliases: ['Tallas mínimas', 'requisitos mínimos de talla'],
    alternateNames: ['Requisito de Estatura', 'Restricción de Altura', 'Altura mínima requerida'],

    relatedTermIds: ['refurbishment', 'ride-capacity'],
  },
  {
    id: 'themed-land',
    name: 'Zona temática',
    shortDefinition:
      'Una zona autónoma dentro de un parque temático construida en torno a un tema coherente.',
    definition:
      'Una zona temática es un área delimitada de un parque temático con un diseño visual común, una historia de fondo y atracciones, restaurantes y tiendas a juego. Lo son El Mundo Mágico de Harry Potter en Universal, Star Wars: Galaxy’s Edge en Disney y Polynesia en PortAventura. Las zonas también sirven para orientarse dentro del parque.',
    aliases: ['Zonas temáticas'],
    alternateNames: ['Área Temática', 'Land', 'Mundo temático'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'La apertura no oficial de una atracción antes de su fecha de lanzamiento anunciada.',
    definition:
      'Un Soft Opening es la apertura discreta de una atracción o zona nueva antes de su fecha oficial, a menudo sin ningún anuncio. El parque lo usa para probar los sistemas con público, detectar problemas de operación y ajustar el embarque. Puede empezar y pararse sin aviso: quien está en el parque ese día quizá pueda montar, pero no sirve para planificar una visita. Suelen darlo a conocer primero los foros de aficionados y las redes sociales.',
    alternateNames: ['Soft Launch', 'Apertura blanda'],

    relatedTermIds: ['downtime', 'refurbishment', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition: 'La cola normal de una atracción, sin reserva ni pase especial.',
    definition:
      'La cola Standby es la cola física normal, abierta a cualquier visitante sin entrada adicional ni pase de pago. Quien hace Standby espera por orden de llegada, así que el tiempo publicado depende directamente de cuánta gente hay en ese momento en la atracción. En los días más concurridos, los tiempos de Standby en las atracciones principales pueden superar los 90 minutos. park.fan muestra el tiempo de Standby de cada atracción junto a los demás tipos de cola.',
    aliases: ['Cola standby'],
    alternateNames: ['Cola Normal', 'Cola Estándar', 'Fila regular'],

    relatedTermIds: ['express-pass', 'single-rider', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'El sistema de acceso prioritario de pago de Disney, sucesor del programa FastPass+.',
    definition:
      'Lightning Lane es el nombre que Disney da a su sistema de cola prioritaria, introducido en 2021 como sucesor del gratuito FastPass+. Existe en dos modalidades: Individual Lightning Lane (ILL), vendida por separado para las atracciones más demandadas, y Lightning Lane Multi Pass (LLMP), una suscripción diaria que permite reservar franjas horarias de retorno en una selección de atracciones. Con ella, una ventaja que antes era gratuita pasó a ser de pago. En el calendario de afluencia de park.fan se ve en qué días hay que contar con colas largas de standby.',
    alternateNames: ['Lightning Lane Multi Pass', 'Individual Lightning Lane', 'LLMP', 'ILL'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Lightning Lanes'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'El anterior complemento diario de Disney que daba acceso a Lightning Lane Multi Pass en la mayoría de las atracciones.',
    definition:
      'Genie+ (ahora renombrado Lightning Lane Multi Pass) era el complemento diario de pago de Disney que sustituyó a FastPass+. Por una tarifa por persona al día, los visitantes podían reservar una franja de Lightning Lane a la vez en una amplia selección de atracciones. Las atracciones más destacadas estaban excluidas y se vendían por separado como Individual Lightning Lane. El precio de Genie+ era dinámico y aumentaba en los días más concurridos. park.fan muestra el nivel de afluencia actual de cada parque.',
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie', 'Lightning Lane Multi Pass'],

    relatedTermIds: ['express-pass', 'lightning-lane', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'Un número de asignación en el sistema de cola virtual que permite el acceso a una atracción cuando se llama al grupo.',
    definition:
      'Un Boarding Group es una asignación numerada dentro de un sistema de cola virtual, utilizado principalmente para las atracciones más demandadas donde una cola física sería impracticable. Los visitantes se apuntan en la app del parque, a menudo en el momento de la apertura, y reciben un número de grupo. Cuando llaman a ese número, tienen un tiempo limitado para presentarse en la atracción. En los días muy concurridos, todos los Boarding Groups pueden agotarse en cuestión de minutos. Disney usa este sistema en atracciones como Tron Lightcycle Run y Star Wars: Rise of the Resistance.',
    relatedTermIds: ['lightning-lane', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'off-peak',
    name: 'Temporada baja',
    shortDefinition: 'Períodos de menor afluencia, con colas más cortas y entradas más baratas.',
    definition:
      'La temporada baja son los períodos más tranquilos del calendario, cuando hay colegio y no cae ningún festivo grande. Normalmente van de enero a principios de febrero, de mediados de septiembre a octubre (fuera de los eventos de Halloween) y las primeras semanas de noviembre. En esas fechas las esperas en las atracciones más solicitadas suelen ser bastante más cortas y las entradas están a su precio más bajo. El calendario de afluencia de park.fan marca las ventanas de temporada baja de cada parque.',
    alternateNames: ['Temporada Baja', 'Temporada Tranquila', 'Fuera de Temporada'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'offseason',
    name: 'Cierre temporal',
    shortDefinition:
      'Período de cierre estacional en el que el parque permanece completamente cerrado al público para mantenimiento, obras o vacaciones invernales.',
    definition:
      'El cierre temporal (u OffSeason) es el período en que un parque temático está cerrado del todo. En temporada baja el parque abre con menos gente; durante el cierre temporal no hay atracciones, restaurantes ni espectáculos abiertos al público. Los parques lo aprovechan para el mantenimiento de atracciones e instalaciones, para reformas grandes que no se pueden hacer con el parque abierto y para que el personal descanse antes de la nueva temporada. Suele caer en invierno y dura desde unas semanas hasta varios meses, según el parque y su clima.\n\nCuando park.fan muestra el estado OffSeason para un parque, no hay calendario de apertura para el período actual y la próxima apertura confirmada está todavía a varias semanas. La fecha exacta de reapertura está en la web oficial del parque. En los parques más visitados, los primeros días tras la reapertura se agotan pronto.',
    aliases: ['Off-Season'],
    alternateNames: ['Cierre Invernal', 'Temporada cerrada', 'Pausa de temporada'],

    relatedTermIds: ['crowd-calendar', 'refurbishment', 'soft-opening'],
  },
  {
    id: 'ride-photo',
    name: 'Foto de atracción',
    shortDefinition:
      'Una foto o vídeo capturado automáticamente durante una atracción, disponible para comprar al finalizar el recorrido.',
    definition:
      'La foto de atracción la toma automáticamente una cámara fija en un punto concreto del recorrido, normalmente la caída de una atracción acuática o el punto más alto de una montaña rusa. Al terminar, los visitantes pueden ver su foto en un quiosco o en la app del parque y decidir si la compran. Muchos parques venden paquetes de un día con fotos ilimitadas de todas las atracciones del resort.',
    aliases: ['Foto On-Ride'],
    alternateNames: ['Fotos de atracción'],
    relatedTermIds: ['onride-offride', 'themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Cola',
    shortDefinition:
      'El área de espera física que los visitantes recorren antes de subir a una atracción, a menudo tematizada como la propia atracción.',
    definition:
      'La cola es el recorrido físico (pasillos, zigzags al aire libre o salas interiores) que hacen los visitantes mientras esperan para subir a una atracción. En muchos parques temáticos modernos la cola está tematizada: en la Haunted Mansion de Disney la ambientación empieza antes de subir al Doom Buggy, y las atracciones de Harry Potter en Universal están ambientadas en su mundo desde el principio de la fila.',
    relatedTermIds: ['single-rider', 'standby-queue', 'wait-time'],
    aliases: ['Colas', 'Fila', 'Filas'],
  },
  {
    id: 'opening-day',
    name: 'Día de apertura',
    shortDefinition:
      'La fecha oficial de inauguración de un nuevo parque, zona temática o atracción.',
    definition:
      'El día de apertura es la fecha anunciada en la que un parque, una ampliación o una atracción nueva abre al público por primera vez. Suele haber prensa, colas largas y una ceremonia de inauguración con espectáculos y personajes. Quien quiera probar una atracción nueva sin esperas largas hará mejor en no ir ese día. A veces hay un Soft Opening antes de la fecha oficial.',
    relatedTermIds: ['crowd-level', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'Un sistema que permite a los acompañantes turnarse para subir a una atracción mientras el otro espera con los niños que no cumplen el requisito de talla.',
    definition:
      'El Rider Switch (también llamado Child Swap) es un sistema de la mayoría de los grandes parques temáticos para que un grupo pueda turnarse en una atracción cuando uno de sus miembros no puede subir, normalmente un niño que no llega a la talla mínima. Un adulto sube mientras el otro espera con el niño en la entrada; cuando el primero vuelve, el segundo embarca de inmediato sin pasar otra vez por la cola de Standby. En los parques Disney se llama Rider Switch; en Universal, Child Swap. En un día concurrido, el segundo adulto se ahorra así toda la espera. Hay que pedirlo al personal de la atracción al llegar.',
    alternateNames: ['Child Swap', 'Rider Switch', 'Cambio de Adulto', 'Baby Switch'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Fecha de bloqueo',
    shortDefinition:
      'Un día en el que ciertos niveles de pase anual no son válidos para entrar al parque, normalmente en los días de mayor afluencia del año.',
    definition:
      'Las fechas de bloqueo (también llamadas blackout dates) son días concretos del calendario en los que determinados niveles de pase anual no son válidos para la entrada. Los parques aplican estas fechas para gestionar la capacidad en los días más concurridos: días pico, fines de semana festivos y fechas de eventos especiales. Los pases de nivel superior tienen menos o ninguna fecha de bloqueo, mientras que los pases básicos pueden tener entre 30 y 60 días bloqueados al año. Comprueba siempre el calendario de bloqueo antes de visitar si tienes un pase con restricciones. El calendario de afluencia de park.fan marca los días pico habituales.',
    aliases: ['Fechas bloqueadas'],
    alternateNames: ['Blackout', 'Blackout Date', 'Fecha de exclusión'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'season-pass'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Evento de entrada especial',
    shortDefinition:
      'Un evento nocturno o especial con entrada separada que requiere un ticket adicional al de acceso regular al parque, como las fiestas de Halloween o Navidad.',
    definition:
      'Un evento de entrada especial (hard ticket event) es un evento en un parque temático, normalmente de tarde o de noche, para el que hace falta una entrada propia además de la entrada normal. Tiene espectáculos, decoración y encuentros con personajes que no hay en el horario habitual. Son eventos de este tipo Mickey’s Not-So-Scary Halloween Party y Mickey’s Very Merry Christmas Party en Walt Disney World, Halloween Horror Nights en Universal o los eventos de temporada de Disneyland Paris. En los días de evento especial, los visitantes con entrada normal suelen tener que abandonar el parque entre las 18:00 y las 19:00. Las entradas suelen agotarse semanas antes.',
    aliases: ['Eventos especiales'],
    alternateNames: ['Noche Especial', 'After-Hours', 'Hard Ticket Event'],

    relatedTermIds: ['early-entry', 'peak-day', 'season-pass'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'El antiguo sistema gratuito de cola prioritaria de Disney, reemplazado por el Lightning Lane de pago en 2021.',
    definition:
      'FastPass+ (originalmente FastPass, introducido en 1999) fue el sistema gratuito de cola prioritaria de Disney: los visitantes reservaban sin coste una franja horaria para volver a una atracción. En Walt Disney World se podían reservar hasta tres FastPass+ al día en la app My Disney Experience y después pedir más, de uno en uno. El sistema se suspendió durante el cierre por la pandemia en 2020 y no volvió; a finales de 2021 lo sustituyó Lightning Lane, que es de pago. Los relatos de viajes anteriores a ese cambio hablan todavía de FastPass+.',
    aliases: ['FastPass+'],
    alternateNames: ['FastPass Plus'],
    relatedTermIds: ['express-pass', 'genie-plus', 'lightning-lane', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Hora de regreso',
    shortDefinition:
      'Una ventana horaria reservada para regresar a una atracción, emitida por Lightning Lane, cola virtual u otros sistemas de acceso prioritario.',
    definition:
      'Una hora de regreso (o return window) es una franja concreta, normalmente de una hora, en la que un visitante que ha reservado acceso prioritario (con Lightning Lane, una cola virtual o un sistema parecido) puede presentarse en la entrada reservada de la atracción. Mientras tanto puede ir a otras zonas del parque en lugar de esperar en una cola física. Quien llega más tarde de un número determinado de minutos suele perder la reserva. park.fan muestra los tiempos de espera en vivo y el nivel de afluencia junto a las horas de regreso de un parque.',
    relatedTermIds: ['boarding-group', 'fastpass', 'lightning-lane', 'virtual-queue'],
    aliases: ['Horas de regreso'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time: una sesión en la que un grupo de aficionados o de huéspedes de hotel tiene una o varias atracciones para él solo, sin la cola del público general.',
    definition:
      'ERT (Exclusive Ride Time) es un período en el que un grupo seleccionado tiene una atracción o varias para él solo, sin público general. Suelen ser miembros de un club de aficionados a las montañas rusas, huéspedes de los hoteles del resort o titulares de pase anual. Con esperas mínimas, los participantes repiten una y otra vez y a veces suman decenas de vueltas en una sola sesión. Los parques organizan ERT para clubs (como el European Coaster Club o American Coaster Enthusiasts), para paquetes premium de hotel o dentro de eventos fuera de horario.',
    alternateNames: ['Exclusive Ride Time', 'Tiempo exclusivo en atracción'],

    relatedTermIds: ['credit', 'early-entry', 'hard-ticket-event', 're-ride', 'rope-drop'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Un itinerario detallado y optimizado para una visita al parque que secuencia las atracciones para minimizar los tiempos de espera y maximizar el número de atracciones en un día.',
    definition:
      'Un Touring Plan es una secuencia planificada de atracciones, comidas y movimientos por el parque diseñada para minimizar el tiempo total de espera a lo largo del día. Los planes efectivos tienen en cuenta los patrones de afluencia, la capacidad de las atracciones, la dinámica de las colas, los horarios de espectáculos y el tiempo meteorológico. Sitios como TouringPlans.com publican planes detallados para los grandes parques. El calendario de afluencia de park.fan sirve para prepararlo, y con los tiempos de espera en vivo el plan se ajusta sobre la marcha durante la visita.',
    aliases: ['Touring Plans'],
    alternateNames: ['Plan de Visita', 'Itinerario', 'Plan de visita optimizado'],

    relatedTermIds: ['crowd-calendar', 'early-entry', 'rope-drop', 'wait-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      'Una atracción interior en la que un vehículo lleva a los visitantes por escenas iluminadas, con una historia y efectos especiales.',
    definition:
      'Un dark ride es una atracción en la que los visitantes van en un vehículo guiado por el interior de un edificio oscuro, entre decorados iluminados, proyecciones, animatronics y efectos especiales. En una montaña rusa manda el movimiento; en un dark ride pesan más la historia y la ambientación, aunque muchos combinan ambas cosas. Son dark rides la Haunted Mansion y Pirates of the Caribbean en Disney, Spider-Man y las atracciones de Harry Potter en Universal, o Taron en Phantasialand. Suelen estar entre las atracciones con más espera de un parque.',
    aliases: ['Dark rides'],
    alternateNames: ['Atracción Interior', 'Atracción Cubierta', 'Atracción de interior'],

    relatedTermIds: [
      'height-requirement',
      'ride-capacity',
      'soft-opening',
      'themed-land',
      'vr-coaster',
      'wait-time',
    ],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, fabricante suizo de montañas rusas conocido por sus atracciones suaves y fiables y sus elementos característicos como el Immelmann, el Cobra Roll y el Zero-g Roll.',
    definition:
      'B&M (Bolliger & Mabillard) es un fabricante suizo de montañas rusas fundado en 1988 por Walter Bolliger y Claude Mabillard. Sus montañas rusas tienen una marcha suave, fallan poco y mueven a mucha gente por hora; se reconocen por las fuertes G positivas y por inversiones propias como el Immelmann, el Cobra Roll y el Zero-g Roll. B&M construye sobre todo coasters invertidos, sit-down con inversiones, hyper coasters (más de 60 m), giga coasters (más de 90 m), wing coasters y dive machines. Casi todos los grandes parques europeos tienen al menos una B&M, entre ellas Shambhala y Dragon Khan en PortAventura, Silver Star en Europa-Park, Nemesis en Alton Towers y Goliath en Walibi Holland.',
    alternateNames: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],

    relatedTermIds: [
      'cobra-roll',
      'dive-coaster',
      'hybrid-coaster',
      'immelmann',
      'smoothness',
      'stand-up-coaster',
      'zero-g-roll',
    ],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      'Fabricante suizo de atracciones y montañas rusas, conocido por sus lanzamientos hidráulicos de récord y sus mega y giga coasters. Muchas de las atracciones más rápidas y altas del mundo son suyas.',
    definition:
      'Intamin AG es un fabricante suizo de atracciones fundado en 1967. Con su lanzamiento hidráulico construyó durante años las montañas rusas más rápidas y altas del mundo (Kingda Ka, 139 m; Top Thrill Dragster). Intamin fabrica además mega y giga coasters (entre ellos Millennium Force en Cedar Point e Intimidator 305 en Kings Dominion), multi-launch coasters, atracciones acuáticas y dark rides. Entre las instalaciones europeas de Intamin están Taron en Phantasialand, Expedition GeForce en Holiday Park y Red Force en Ferrari Land.',
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Fabricante familiar alemán de Waldkirch, cerca de Europa-Park, que hace atracciones acuáticas, dark rides y cada vez más montañas rusas de acero.',
    definition:
      'Mack Rides es un fabricante alemán de atracciones con sede en Waldkirch (Baden-Württemberg), a pocos kilómetros de Europa-Park, el parque de la misma familia. Fundada en 1921, Mack fabrica atracciones acuáticas, dark rides (entre ellos Test Track y Radiator Springs Racers de Disney) y cada vez más montañas rusas grandes. Su Blue Fire Megacoaster en Europa-Park (2009) fue la primera atracción con un Stengel Dive. Sus hyper coasters más recientes son Ride to Happiness en Plopsaland y Kondaa en Walibi Belgium.',
    alternateNames: ['Mack'],

    relatedTermIds: [
      'b-and-m',
      'bobsled-coaster',
      'intamin',
      'launch-coaster',
      'mackprodukt',
      'powered-coaster',
      'splashdown',
      'stengel-dive',
      'water-coaster',
    ],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Rocky Mountain Construction, fabricante de Idaho que creó el coaster híbrido: convierte viejas montañas rusas de madera en pistas de acero I-box con airtime e inversiones.',
    definition:
      'Rocky Mountain Construction (RMC) es una empresa estadounidense de construcción y mantenimiento de montañas rusas con sede en Hayden, Idaho. Inventó la pista de acero I-box, que se monta sobre la estructura de madera de un coaster existente. Con esa conversión, varios parques han rehecho viejas montañas rusas de madera como híbridas con mucho airtime, varias inversiones y caídas de más de 90 grados, algo imposible en una pista de madera tradicional. Son conversiones de RMC Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) y Wildfire (Kolmården). En Europa, RMC construyó desde cero el híbrido Untamed en Walibi Holland.',
    alternateNames: ['Rocky Mountain Construction'],

    relatedTermIds: [
      'airtime',
      'barrel-roll-drop',
      'hybrid-coaster',
      'single-rail-coaster',
      'stall',
      'wooden-coaster',
    ],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Fabricante neerlandés, uno de los que más montañas rusas ha instalado en el mundo. Suyos son el Boomerang y muchos de los coasters familiares y con inversiones de los parques europeos.',
    definition:
      'Vekoma Rides Manufacturing es un fabricante neerlandés de montañas rusas con sede en Vlodrop (Países Bajos) y uno de los que más instalaciones suman en el mundo. Fundada en 1926 como empresa de ingeniería mecánica, pasó a las atracciones en la década de 1970 y se dio a conocer en todo el mundo con el Boomerang, un shuttle coaster compacto con tres inversiones que se vendía con licencia a bajo precio y que se instaló en parques de todo el mundo. Otros modelos suyos son el Suspended Looping Coaster (SLC), el Giant Inverted Boomerang y el Mine Train. Desde la década de 2010 Vekoma vende una línea de «nueva generación», con trenes de marcha más suave, recorridos nuevos y atracciones familiares mejoradas. Modelos como el Family Boomerang, el Tilt Coaster y los coasters familiares suspendidos se ven cada vez más en parques europeos. Disney también ha encargado diseños Vekoma a medida para sus resorts.',
    alternateNames: ['Vekoma Rides'],

    relatedTermIds: ['b-and-m', 'boomerang', 'gerstlauer', 'intamin', 'single-rail-coaster'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Fabricante alemán conocido sobre todo por el modelo Euro-Fighter, con su primera caída de más de 90 grados, y también por spinning coasters y atracciones familiares compactas.',
    definition:
      'Gerstlauer Amusement Rides GmbH es un fabricante alemán de montañas rusas con sede en Münsterhausen, Baviera. Fundada en 1946 como empresa metalúrgica, se adentró en el mercado de las atracciones en la década de 1980 y construyó su reputación con el modelo Euro-Fighter: un coaster compacto con cadena de ascenso vertical y una caída de hasta 97 grados. Un Euro-Fighter cabe en poco espacio, así que encaja en parques urbanos y recintos pequeños; ejemplos son Rage en Adventure Island y Speed en Oakwood. Gerstlauer fabrica también el Infinity Coaster, spinning coasters y el SkyRoller, un coaster giratorio en el que cada pasajero controla sus propias volteretas.',
    alternateNames: ['Gerstlauer Rides'],

    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'intamin',
      'spinning-coaster',
      'xtreme-spinning-coaster',
    ],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Fabricante alemán, ya desaparecido, de los clásicos coasters looping de los años 70 y 80; muchos siguen funcionando en parques europeos.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG fue un fabricante alemán de montañas rusas con sede en Münsterhausen (Baviera), la misma localidad donde se instaló más tarde Gerstlauer. Anton Schwarzkopf la fundó en 1954, y con ella llegaron a Europa los coasters looping. Revolution en Six Flags Magic Mountain (1976), diseñada por Schwarzkopf, fue el primer coaster looping moderno del mundo. Sus modelos más conocidos son el Looping Star, el Thriller/Wildcat y el Looping Coaster transportable, que recorrió toda Europa. Los recorridos de Schwarzkopf son compactos y de marcha suave. La empresa quebró en 1983, pero muchas de sus montañas rusas siguen funcionando décadas después. Del mantenimiento se encargan ahora empresas especializadas o Gerstlauer, que compró parte del utillaje.',
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Una montaña rusa que acelera a los visitantes de 0 a alta velocidad mediante un sistema de lanzamiento magnético, hidráulico o neumático en lugar de una cadena de ascenso tradicional.',
    definition:
      'Un Launch Coaster sustituye la cadena de ascenso tradicional por un sistema de propulsión que acelera el tren desde parado hasta velocidad máxima en apenas unos segundos. En el lanzamiento LSM (motor síncrono lineal), unas bobinas electromagnéticas aceleran una aleta montada en el tren. El LIM (motor de inducción lineal) funciona de forma parecida, pero es menos eficiente. En el lanzamiento hidráulico, un pistón mueve el cable que tira del tren; es el sistema de Intamin en coasters de récord como Kingda Ka. También hay lanzamientos de aire comprimido. Algunos coasters tienen varios lanzamientos a lo largo del recorrido.',
    alternateNames: ['LSM Coaster', 'LIM Coaster', 'Montaña Rusa Lanzada', 'Catapulta'],

    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
    aliases: ['Launch Coasters', 'montañas rusas de lanzamiento'],
  },
  {
    id: 'wooden-coaster',
    name: 'Montaña rusa de madera',
    shortDefinition:
      'Una montaña rusa construida sobre todo en madera, con más vibración, más movimiento lateral y un airtime menos previsible que una de acero.',
    definition:
      'Una montaña rusa de madera tiene la pista y la estructura de soporte de madera. La madera cede y nunca es del todo exacta; de ahí vienen la vibración, el bamboleo lateral y un airtime menos previsible que en una de acero. Son montañas rusas de madera Balder en Liseberg, The Beast en Kings Island y Megafobia en Oakwood. Necesitan mantenimiento constante, porque hay que cambiar tramos de pista con regularidad, y les afectan los cambios de tiempo. Con la conversión de RMC, una montaña rusa de madera vieja puede pasar a ser un híbrido con pista de acero sobre la estructura de madera original.',
    relatedTermIds: ['airtime', 'hybrid-coaster', 'quad-down', 'rattle', 'rmc'],
    aliases: ['Montañas rusas de madera'],
    alternateNames: ['Woodie', 'Woodies', 'Coaster de madera'],
  },
  {
    id: 'steel-coaster',
    name: 'Montaña rusa de acero',
    shortDefinition:
      'Una montaña rusa con pista y estructura sobre todo de acero, de marcha suave y precisa.',
    definition:
      'Una montaña rusa de acero tiene una pista tubular o plana de acero sobre una estructura también de acero. El acero apenas cede, así que los ingenieros pueden controlar con precisión las fuerzas G, las transiciones y las inversiones. Como la marcha es suave y previsible, el recorrido puede ser complejo, con muchas inversiones, curvas cerradas y tramos a gran velocidad.\n\nCasi todas las montañas rusas nuevas son de acero. En Europa lo son, por ejemplo, Shambhala en PortAventura, Nemesis en Alton Towers y Silver Star en Europa-Park. Las hay desde pequeñas atracciones familiares hasta mega coasters de récord. El acero también necesita inspección y mantenimiento regulares, y perdona menos que la madera un error de diseño.',
    relatedTermIds: [
      'bobsled-coaster',
      'hyper-coaster',
      'inversion',
      'launch-coaster',
      'single-rail-coaster',
      'stand-up-coaster',
      'wooden-coaster',
    ],
    aliases: ['Montañas rusas de acero', 'Acero'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'Un coaster en el que el tren cuelga de la pista por un pivote y se balancea libremente de lado a lado.',
    definition:
      'Un suspended coaster es una montaña rusa en la que el tren cuelga de la pista por un punto de giro y puede balancearse de un lado a otro con independencia del trazado. En las curvas el tren oscila como un péndulo y da un latigazo hacia fuera, el «whip», que nunca es del todo previsible. En un coaster invertido, en cambio, el tren va fijado rígidamente a la pista y no oscila.\n\nHay menos suspended coasters que invertidos. Con el balanceo, hasta una curva moderada inclina mucho el tren, y los pasajeros van colgados con el suelo lejos bajo los pies. Vekoma creó el modelo Suspended Looping Coaster (SLC) en los años 90, y se construyeron cientos en todo el mundo.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'vekoma'],
    aliases: ['Suspended Coasters'],
    alternateNames: ['Oscilante', 'Colgante oscilante'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster híbrido',
    shortDefinition:
      'Una montaña rusa con una estructura de soporte de madera tradicional y una pista de acero I-box, un sistema creado por Rocky Mountain Construction (RMC).',
    definition:
      'Un coaster híbrido combina la estructura de madera de una montaña rusa tradicional con una pista de acero I-box de Rocky Mountain Construction (RMC). La pista I-box es muy precisa y suave, y admite inversiones imposibles en una pista de madera tradicional. RMC la desarrolló sobre todo para renovar viejas montañas rusas de madera: les añade inversiones, caídas más pronunciadas y airtime hills en recorridos que antes daban demasiados golpes. Son híbridos de RMC Steel Vengeance en Cedar Point, Twisted Colossus en Six Flags Magic Mountain y Wildfire en Kolmården. Además de las conversiones, RMC construye híbridos nuevos, como Untamed en Walibi Holland.',
    aliases: ['Hybrid Coasters'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Montaña rusa híbrida'],

    relatedTermIds: ['airtime', 'rmc', 'wooden-coaster'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Un modelo compacto de Vekoma que pasa tres inversiones dos veces, primero hacia delante y luego hacia atrás, en un recorrido de ida y vuelta.',
    definition:
      'El Boomerang, de Vekoma, es uno de los modelos de montaña rusa más construidos de la historia. El recorrido tiene tres inversiones, un looping vertical entre dos Sidewinders. El tren las pasa hacia delante, sube por una segunda rampa inclinada y desde allí lo sueltan hacia atrás por los mismos elementos. En total son seis inversiones (tres en cada sentido) en muy poco espacio, así que el modelo cabe en parques con poco terreno. Se construyeron más de 50 Boomerangs, y hay alguno en todos los continentes habitados. En parques de tamaño medio sigue siendo habitual como montaña rusa de iniciación.',
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Un modelo compacto de Gerstlauer: tras una subida vertical por cadena viene una primera caída vertical o de más de 90 grados, todo en muy poco espacio.',
    definition:
      'El Euro-Fighter es un modelo compacto de Gerstlauer con una subida vertical por cadena seguida de una primera caída vertical (90 grados) o de más de 90 grados (hasta 97). Está pensado para parques con poco espacio: en un área pequeña reúne varias inversiones, curvas cerradas y G positivas altas. Cuando la caída pasa de 90 grados, el tren se detiene arriba con los pasajeros inclinados sobre el vacío antes de caer. Son Euro-Fighters europeos Saw – The Ride en Thorpe Park, Rage en Adventure Island y Fluch von Novgorod en Hansa-Park.',
    relatedTermIds: ['beyond-vertical-drop', 'first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'Un tipo de montaña rusa con un tren muy ancho y una caída vertical o de más de 90 grados, con una pausa en la cresta antes de caer.',
    definition:
      'Un Dive Coaster tiene un tren ancho (normalmente 8–10 pasajeros por fila), una caída vertical o de más de 90 grados y una pausa en lo alto: el tren se queda parado unos instantes en la cresta antes de soltarse. La pausa está hecha a propósito, para que los pasajeros pasen esos instantes mirando la caída. Como el tren es tan ancho, todos ven directamente hacia abajo. La línea Dive Machine de B&M (Oblivion en Alton Towers, SheiKra en Busch Gardens) fue la primera; el Dive Coaster de Gerstlauer es otra versión del mismo concepto.',
    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'first-drop',
      'launch-coaster',
    ],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'Una montaña rusa en la que los pasajeros llevan cascos de realidad virtual con una animación o un juego sincronizados con el recorrido.',
    definition:
      'En un VR Coaster los pasajeros llevan cascos de realidad virtual (normalmente Samsung Gear VR o dispositivos propios) con un entorno virtual sincronizado con los movimientos de la montaña rusa. Cuando el tren entra en un looping, la imagen gira con él; cuando el tren cae, el mundo virtual también baja. Los VR Coasters se extendieron entre 2015 y 2019, y muchos parques los instalaron en coasters que ya tenían. Hay visitantes que encuentran los cascos incómodos o poco higiénicos, o que se marean con ellos, y muchos parques que introdujeron la VR la han retirado. Algunas instalaciones, como los VR Coasters de Mack Rides, tienen contenidos hechos para esa atracción y más elaborados.',
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'La sensación de ingravidez o elevación del asiento que se experimenta en las montañas rusas durante los momentos de G negativas.',
    definition:
      'El airtime es la sensación de ingravidez, con G negativas, que notan los pasajeros de una montaña rusa cuando el tren pasa por una colina o un valle más deprisa de lo que caería en caída libre. Hay dos tipos principales: floater airtime (G negativas suaves, una ligera sensación de flotar) y ejector airtime (G negativas fuertes, en las que la barra de seguridad o el cinturón es lo único que te mantiene en el asiento). Las airtime hills (también llamadas camelbacks) tienen una trayectoria parabólica de caída libre, trazada para que esa sensación sea lo más fuerte posible.',
    relatedTermIds: [
      'airtime-hill',
      'bunnyhop',
      'first-drop',
      'quad-down',
      'restraint-freedom',
      's-hill',
      'wooden-coaster',
    ],
  },
  {
    id: 'inversion',
    name: 'Inversión',
    shortDefinition:
      'Cualquier elemento en una montaña rusa donde la pista gira a los pasajeros boca abajo.',
    definition:
      'Una inversión es un elemento de montaña rusa en el que la pista y el vehículo giran a los pasajeros más allá de la vertical, de modo que quedan al menos en parte boca abajo. Las más comunes son el looping vertical, el cobra roll, el sacacorchos, el immelmann, el dive loop, el inline twist, el heartline roll y el zero-G roll. Los coasters modernos suelen tener entre seis y catorce inversiones en un solo recorrido, y el número de inversiones es uno de los datos con que más se describe la intensidad de un coaster. En una inversión hay G positivas (en la base de los loopings) y G negativas (en la cima).',
    relatedTermIds: ['cobra-roll', 'corkscrew', 'immelmann', 'vertical-loop', 'zero-g-roll'],
    aliases: ['Inversiones'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      'La inversión circular clásica: la pista forma un círculo vertical completo y los pasajeros quedan boca abajo en el punto más alto.',
    definition:
      'El looping vertical es una vuelta completa de 360 grados en el plano vertical. Los loopings modernos tienen forma de clotoide (de lágrima) en lugar de ser un círculo perfecto: la entrada y la salida son anchas y la parte superior es más cerrada. Con esa forma, las G son suaves y constantes en todo el looping, sin picos extremos. El primer coaster moderno con looping fue Corkscrew en Knott’s Berry Farm (1975). Hoy hay loopings verticales en coasters de todo el mundo, desde los de iniciación hasta los de récord.',
    aliases: ['Loopings'],
    alternateNames: ['Bucle Vertical', 'Vertical Loop'],

    relatedTermIds: ['cobra-roll', 'immelmann', 'inclined-loop', 'interlocking-loops', 'inversion'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'Un medio looping que sube el tren por encima de la cima, seguido de un medio giro con el que sale en dirección contraria. Lleva el nombre del piloto de la Primera Guerra Mundial Max Immelmann.',
    definition:
      'El Immelmann es una inversión típica de B&M en dos fases. Primero la pista sube como la mitad de un looping vertical y pasa a los pasajeros por encima de la cima, boca abajo durante un momento; luego un medio giro endereza el tren, que sale en dirección contraria a la de entrada, 180 grados después. El elemento lleva el nombre del as de la aviación de la Primera Guerra Mundial Max Immelmann, que usaba una maniobra aérea parecida. En un solo elemento hay así una inversión y un cambio de dirección completo. Hay Immelmanns en casi todos los coasters B&M sit-down, invertidos e hyper del mundo.',
    relatedTermIds: ['b-and-m', 'dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      'Un giro de 360 grados sobre un arco parabólico; en lo alto, los pasajeros notan casi ingravidez.',
    definition:
      'El Zero-g Roll (giro de gravedad cero) es una inversión en la que el tren gira sobre sí mismo mientras sigue un arco parabólico. Se parece al heartline roll, pero va más deprisa y sube y baja más. En lo alto del giro, los pasajeros están boca abajo con G negativas durante un momento (airtime). Es un elemento típico de los wing, hyper e inverted coasters de B&M; en un wing coaster, los asientos de los lados quedan colgando en el aire durante el giro.',
    relatedTermIds: ['airtime', 'b-and-m', 'heartline-roll', 'inversion', 'zero-g-winder'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'El ascenso motorizado que sube el tren de la montaña rusa hasta su punto más alto; ahí la energía eléctrica se convierte en energía potencial.',
    definition:
      'La lifthill es el tramo en el que un mecanismo externo sube el tren desde el nivel del suelo hasta el punto más alto del recorrido. Lo más habitual es una cadena que corre por el centro de la pista; el «clic-clic-clic» que se oye es el trinquete antirretroceso. Otras opciones son los ascensores de cable (más suaves y silenciosos), las lifthills de rodillos neumáticos (en algunos coasters B&M modernos) y la propulsión magnética. La altura de la lifthill fija la velocidad máxima que puede alcanzar el coaster. Algunos diseños modernos tienen varias lifthills o combinan subida y lanzamiento. Suele ser el tramo más lento del recorrido.',
    aliases: ['Lift Hill'],
    alternateNames: ['Chain Lift', 'Cadena de arrastre', 'Subida de cadena'],

    relatedTermIds: ['block-brake', 'first-drop', 'launch-coaster'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'El primer descenso tras la lifthill, normalmente el más alto y el más rápido del recorrido.',
    definition:
      'El First Drop es la bajada principal justo después de la lifthill o del lanzamiento. En la mayoría de los coasters tradicionales es la colina más alta, y en ella la atracción alcanza su velocidad máxima. El ángulo, la altura y el perfil marcan el carácter de toda la montaña rusa: una caída muy inclinada (más de 80–90 grados) acelera de golpe, y una caída parabólica puede dar mucho airtime aunque tenga un ángulo más suave. En los dive coasters la caída pasa de 90 grados, y los pasajeros quedan inclinados sobre el borde. Es el tramo de un coaster nuevo que más se ve en los vídeos promocionales.',
    relatedTermIds: ['airtime', 'airtime-hill', 'beyond-vertical-drop', 'dive-coaster', 'lifthill'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'Una colina diseñada para generar G negativas: en lo alto, los pasajeros flotan o se levantan del asiento.',
    definition:
      'Una Airtime Hill (también llamada camelback) es una subida y bajada diseñada para producir G negativas, la sensación de flotar o de salir despedido del asiento. El floater airtime es una G negativa suave; en el ejector airtime, más fuerte, la barra de seguridad es lo único entre el pasajero y el vacío. Los coasters de acero usan colinas parabólicas de forma precisa, con un airtime constante y previsible; en los de madera la pista cede, y el airtime es menos previsible y más irregular. Son típicas de los hyper coasters, los giga coasters y las montañas rusas de madera modernas.',
    aliases: ['Colina de airtime'],
    alternateNames: ['Camelback', 'Bunny Hill'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 's-hill', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Un tramo en espiral continua alrededor de un eje central, con G laterales sostenidas.',
    definition:
      'Una hélice es un tramo de pista que gira en espiral de forma continua, como un tornillo, sin poner boca abajo a los pasajeros. A diferencia de las airtime hills o las inversiones, genera G laterales sostenidas que empujan a los pasajeros hacia el exterior de la curva. Una hélice descendente acelera el tren mientras gira; una ascendente lo frena, y también genera fuerzas laterales. Se usan a menudo al final del recorrido para gastar la energía cinética que le queda al tren. Ejemplos son el final subterráneo de Nemesis en Alton Towers y la hélice final de Expedition GeForce en Holiday Park.',
    aliases: ['Helices'],
    alternateNames: ['Espiral', 'Hélice', 'Bucle helicoidal'],

    relatedTermIds: ['first-drop', 'horseshoe'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'Una sección de frenos que divide el circuito en tramos independientes; así pueden circular varios trenes a la vez sin riesgo de choque.',
    definition:
      'Un Block Brake divide el circuito de un coaster en secciones independientes («bloques»), y en cada una solo puede haber un tren. Si un tren que va por delante frena o se detiene, el sistema de control para automáticamente todos los trenes que vienen detrás en sus block brakes. Con este sistema de seguridad, un parque puede tener varios trenes en el circuito a la vez sin riesgo de choque, y la capacidad por hora sube mucho. Los block brakes se sitúan en puntos donde un tren detenido no puede rodar hacia atrás (normalmente una sección plana o ligeramente ascendente) y suelen usar frenos magnéticos (de corrientes de Foucault) o de aleta de fricción. El freno de mitad de recorrido (MCBR) es el tipo de block brake más visible.',
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'El tramo de frenado al final del recorrido, donde el tren baja a la velocidad de entrada en la estación, normalmente con frenos magnéticos de aleta.',
    definition:
      'El Brake Run es el tramo de pista, después del recorrido principal, en el que el tren frena desde la velocidad de marcha hasta una velocidad segura para entrar en la estación. Los frenos modernos son de corrientes de Foucault (magnéticos): filas de imanes permanentes actúan sobre aletas metálicas en la parte inferior del tren y lo frenan sin rozamiento ni desgaste. Los coasters más antiguos usaban frenos neumáticos de pinza. Un freno de mitad de recorrido (MCBR) hace de sección de bloque cuando circulan varios trenes. El último brake run antes de la estación a veces frena menos a propósito, para que el tren llegue con algo de velocidad.',
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      'Un elemento de B&M con dos inversiones unidas por un giro en la cima; la pista dibuja la silueta de una cobra erguida.',
    definition:
      'El Cobra Roll es un elemento típico de B&M con dos inversiones seguidas. La pista sube en curva hasta la mitad de un looping, gira 180 grados en la cima (pasando un momento boca abajo) y luego repite la secuencia en espejo para salir en la misma dirección de entrada. Visto de lado, el contorno de la pista recuerda a la cabeza erguida de una cobra. Tienen Cobra Roll Dragon Khan en PortAventura y muchos inverted coasters de B&M en todo el mundo.',
    relatedTermIds: ['b-and-m', 'banana-roll', 'batwing', 'immelmann', 'inversion', 'sea-serpent'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      'Una inversión en la que la pista gira 360 grados en espiral alrededor de un eje; es de las más antiguas y de las más construidas.',
    definition:
      'El sacacorchos (corkscrew) es una de las primeras inversiones modernas; Arrow Dynamics la introdujo en la década de 1970. La pista gira en espiral alrededor de un cilindro central, como un sacacorchos, y los pasajeros dan una vuelta completa de 360 grados desplazada respecto a la dirección de la marcha. Los sacacorchos van a menudo por parejas, y son el elemento típico del coaster de acero de la «era clásica». En los mapas y la señalización de los parques alemanes se llama «Korkenzieher». Los coasters nuevos usan sobre todo inversiones más modernas, pero sigue habiendo sacacorchos en parques de toda Europa y Norteamérica.',
    relatedTermIds: ['flat-spin', 'inline-twist', 'inversion'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'La imagen especular de un Immelmann: la pista cae en picado por medio looping y sale en horizontal, en dirección contraria a la de entrada.',
    definition:
      'Un Dive Loop (también llamado dive turn o Immelmann inverso) empieza donde termina el Immelmann: en lugar de subir y pasar por encima, la pista cae en picado, recorre la mitad inferior de un looping y sale en dirección contraria a la de entrada. El tren baja en picado y, a la salida, los pasajeros notan un fuerte empuje contra el asiento. B&M lo usa en muchos de sus coasters invertidos y sit-down.',
    relatedTermIds: ['b-and-m', 'immelmann', 'inversion'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      'Un giro de 360 grados alrededor del eje de la pista: una inversión suave en la que el tren casi no cambia de dirección.',
    definition:
      'Un Inline Twist (también llamado inline roll o barrel roll) gira el tren 360 grados alrededor del eje longitudinal de la pista: el coaster rueda sobre sí mismo casi sin cambiar de dirección. En el sacacorchos la espiral está desplazada respecto al eje de la pista; en el inline twist el giro es sobre la propia pista. El resultado es una inversión corta y suave, con muy poca fuerza lateral. Los flying coasters e inverted coasters de B&M los usan a menudo, por parejas o seguidos de otros elementos.',
    relatedTermIds: ['corkscrew', 'flat-spin', 'heartline-roll', 'inversion'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Un giro de 360 grados alrededor del centro de gravedad del pasajero y no de la pista; la ingravidez es suave y dura todo el giro.',
    definition:
      'En un Heartline Roll (o heartline spin), el eje de giro pasa por el corazón del pasajero, más o menos el centro de gravedad del cuerpo, y no por la pista: el corazón se mantiene a la misma altura durante toda la rotación. Así las G se reducen al mínimo, y el pasajero flota suavemente en lugar de notar el tirón de un sacacorchos normal. B&M e Intamin lo usan en sus diseños modernos, sobre todo en hyper coasters e inverted coasters. Un ajuste pequeño en la pista se nota enseguida en la comodidad del pasajero.',
    relatedTermIds: ['inline-twist', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Un medio looping seguido de un medio sacacorchos que gira la pista 90 grados y cambia de dirección. Es un elemento de Vekoma que llevan los coasters Boomerang.',
    definition:
      'Un Sidewinder es un medio looping vertical que sube el tren, seguido enseguida de un medio sacacorchos que lo endereza mientras gira 90 grados. Así, en poco espacio, el tren se invierte y cambia de dirección. El Boomerang de Vekoma está hecho con ellos: dos Sidewinders (uno hacia delante y otro invertido) a los lados de un looping central forman el recorrido completo. El nombre hace referencia al movimiento de giro en forma de serpiente que produce el elemento visto desde el borde de la pista.',
    relatedTermIds: ['boomerang', 'cobra-roll', 'inversion'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Una inversión grande que solo tienen los flying coasters de B&M: los pasajeros, ya en posición Superman, pasan boca abajo por la parte inferior de un looping vertical.',
    definition:
      'El Pretzel Loop solo existe en los flying coasters de B&M, en los que los pasajeros van tumbados en horizontal, en posición Superman. Boca abajo, bajan en picado, pasan por la base de un gran looping y vuelven a subir en pendiente; vista de lado, la forma recuerda a un pretzel. Como en el punto más bajo los pasajeros van mirando hacia abajo, las G en ese momento son muy altas. Hay Pretzel Loops en Manta, en SeaWorld Orlando, y en Tatsu, en Six Flags Magic Mountain.',
    relatedTermIds: ['b-and-m', 'inline-twist', 'inversion'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Un elemento con dos inversiones y un cambio de dirección de 180 grados: dos medios loopings unidos por un medio sacacorchos. La silueta recuerda a las alas abiertas de un murciélago.',
    definition:
      'Un Batwing tiene dos inversiones y un cambio de dirección. La pista sube en arco hasta un medio looping, en la cima pasa por un medio sacacorchos que pone boca abajo al tren y le cambia la dirección, y después baja por otro medio looping, en espejo, hasta el nivel del suelo. Vista desde arriba, la silueta recuerda a las alas abiertas de un murciélago. Es un elemento típico de B&M; lo tienen coasters como Afterburn en Carowinds y The Incredible Hulk Coaster en Universal’s Islands of Adventure. A diferencia del Bowtie, que no cambia de dirección, el Batwing gira el tren 180 grados.',
    relatedTermIds: ['b-and-m', 'bowtie', 'cobra-roll', 'inversion'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'Una variante del looping en la que la pista llega por arriba, baja por el círculo y sale otra vez por arriba: la geometría contraria a la de un looping normal.',
    definition:
      'El Norwegian Loop (a veces llamado reverse loop) tiene la geometría contraria a la de un looping vertical normal. En lugar de entrar a nivel del suelo y salir a la misma altura, el tren entra por arriba, baja por el círculo del looping y vuelve a salir por la parte superior. En la parte inferior del círculo siguen las G positivas fuertes, pero la entrada y la salida se notan distintas. Hay pocos en el mundo, y la mayoría son de Vekoma o de instalaciones hechas a medida.',
    relatedTermIds: ['dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Un elemento de tipo sacacorchos, en coasters invertidos o flying, en el que el giro es amplio y casi horizontal.',
    definition:
      'Un Flat Spin es una inversión de tipo sacacorchos, sobre todo de los coasters invertidos y flying de B&M, con una geometría que desde el suelo hace que la espiral parezca casi horizontal. En un coaster invertido (en el que el tren cuelga bajo la pista), los pasajeros recorren un círculo amplio y casi a nivel. Dentro del tren se nota un giro suave y continuo, con G moderadas. Lo tienen coasters invertidos de B&M como Banshee en Kings Island y Afterburn en Carowinds.',
    relatedTermIds: ['b-and-m', 'corkscrew', 'inline-twist', 'inversion'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      'Un medio sacacorchos en el que el tren cambia a la vez de dirección, unos 180 grados: una inversión y un giro cerrado en un solo elemento.',
    definition:
      'En un Cutback la pista hace un medio sacacorchos mientras se curva sobre sí misma unos 180 grados. El tren queda boca abajo y cambia de sentido; un sacacorchos normal, en cambio, mantiene casi la misma dirección. Hay pocos, sobre todo en algunos modelos de Vekoma y en coasters a medida que necesitan un cambio de dirección con inversión en poco espacio. El nombre inglés («cutback») describe su aspecto: la pista vuelve hacia atrás mientras gira.',
    relatedTermIds: ['corkscrew', 'inversion', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Una variante del sea serpent con el punto de unión más bajo: dos inversiones seguidas, sin cambio de dirección, en poco espacio.',
    definition:
      'El Butterfly es un elemento con dos inversiones parecido al sea serpent (dos medios loopings unidos por la cima), pero con el vértice más bajo y otra geometría. Como el sea serpent, tiene dos inversiones y no cambia la dirección del tren, pero el tramo que une los dos medios loopings pasa boca abajo por una parte más baja en lugar de por una cresta alta. Por eso el Butterfly ocupa menos altura. Aparece en algunos diseños de Vekoma y en coasters a medida. El Bowtie tampoco cambia de dirección, pero tiene otra geometría; el Batwing sí cambia de dirección.',
    relatedTermIds: ['batwing', 'bowtie', 'inversion'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Un elemento con dos medios loopings en espejo que forman la silueta de una pajarita: dos inversiones sin cambio de dirección.',
    definition:
      'Un Bowtie tiene dos inversiones: dos medios loopings en espejo unidos por la cima. A diferencia del Batwing, que cambia de dirección, el Bowtie sale en la misma dirección general en la que entró. Visto desde arriba, el contorno de la pista recuerda a una pajarita. Hay pocos, sobre todo en algunas instalaciones de Vekoma y en coasters a medida. Las dos inversiones son suaves y van seguidas.',
    relatedTermIds: ['batwing', 'butterfly', 'inversion'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Una serie de pequeñas colinas rápidas cerca del final del recorrido que producen un suave airtime flotante cuando el tren va perdiendo velocidad.',
    definition:
      'Un Bunnyhop (salto de conejo) es una serie de colinas pequeñas y rápidas hacia el final del recorrido, cuando el tren ya ha gastado casi toda su energía cinética. A esa velocidad, las colinas dan un floater airtime suave, una flotación ligera y rítmica, y no el ejector airtime fuerte de las colinas rápidas del principio. El nombre viene de ese movimiento a saltitos, como el de un conejo. Muchos hyper coasters, giga coasters y montañas rusas de madera terminan con Bunnyhops antes del brake run.',
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run', 's-hill'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'Una airtime hill con un peralte de más de 90 grados: los pasajeros quedan de lado con G negativas. Lleva el nombre del ingeniero Werner Stengel y es un elemento típico de Mack Rides.',
    definition:
      'El Stengel Dive es un elemento de airtime en el que la pista se inclina más de 90 grados, de modo que los pasajeros quedan colgando de lado o un poco por encima de la vertical mientras la colina les da G negativas. El elemento lleva el nombre del ingeniero alemán Werner Stengel, que diseñó muchas montañas rusas. Es típico de los hyper coasters de Mack Rides: Blue Fire Megacoaster en Europa-Park fue el primer coaster con uno, y hypers posteriores de Mack como Ride to Happiness en Plopsaland y Kondaa en Walibi Belgium tienen varios.',
    relatedTermIds: ['airtime', 'airtime-hill', 'mack-rides'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Una curva de 180 grados en forma de herradura, con mucho peralte, que devuelve el tren en dirección contraria; se usa a menudo entre dos lanzamientos.',
    definition:
      'Un Horseshoe es una curva semicircular con un peralte muy pronunciado, normalmente de entre 75 y 90 grados, que gira el coaster 180 grados. Con tanto peralte, las G laterales no se disparan aunque el radio sea corto. En los coasters lanzados se usa a menudo para dar la vuelta al tren entre dos lanzamientos, antes de la siguiente aceleración. Es típico de los coasters aceleradores de Intamin y de los multi-launch coasters de Mack, porque da la vuelta al tren en poco espacio sin que pierda velocidad.',
    relatedTermIds: ['intamin', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Una pequeña bajada justo antes de la primera caída en un coaster con cadena; reduce la tensión de la cadena y da un momento de airtime.',
    definition:
      'Un predrop (pre-caída) es una pequeña bajada en el tramo final de la lifthill, justo antes de la cresta de la primera caída. Su función principal es de ingeniería: reduce la tensión en la cadena cuando el tren llega arriba y evita un paso brusco entre la subida motorizada y la caída libre. Al pasarlo, los pasajeros notan un momento de airtime antes de la caída principal. Muchos coasters de madera y de acero tienen uno, como Goliath en Six Flags Magic Mountain.',
    relatedTermIds: ['airtime', 'first-drop', 'lifthill'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Un elemento alto y estrecho, con subida y bajada casi verticales, que recuerda a un sombrero de copa. Es típico de los coasters de lanzamiento hidráulico de Intamin.',
    definition:
      'En un Top Hat la pista sube casi en vertical hasta una cresta estrecha y baja casi en vertical por el otro lado; vista de lado, la silueta recuerda a un sombrero de copa. Los Top Hats interiores (los habituales) se inclinan hacia dentro en la cima; los exteriores, hacia fuera, y dejan a los pasajeros más expuestos, con un airtime más fuerte. El elemento se asocia sobre todo con los coasters de lanzamiento hidráulico de Intamin (aceleradores): tras el lanzamiento a 200 km/h o más, el Top Hat es el punto más alto del recorrido. Tienen Top Hat Kingda Ka (139 m), Top Thrill Dragster (128 m) y Red Force en Ferrari Land.',
    relatedTermIds: ['first-drop', 'intamin', 'launch-coaster'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition: 'Una montaña rusa que un aficionado ha montado y suma a su contador personal.',
    definition:
      'Un credit de coaster (o simplemente «credit» o «cred») es una montaña rusa que un aficionado ha montado y ha añadido a su contador personal. Hay aficionados que coleccionan credits: intentan montar en el mayor número posible de coasters distintos. Qué cuenta como credit lo decide cada uno. Unos solo cuentan los coasters sit-down y otros todas las atracciones sobre raíles; unos cuentan cada tipo de tren de un mismo coaster como un credit aparte y otros no. En sitios como la Roller Coaster Database (RCDB) se puede llevar el contador. Por los credits, muchos aficionados viajan a otros países y visitan parques poco conocidos.',
    aliases: ['Credits'],
    alternateNames: ['Cred', 'Creds', 'Contador de montañas rusas'],

    relatedTermIds: [
      'hybrid-coaster',
      'mackprodukt',
      'onride-offride',
      'pov',
      'powered-coaster',
      're-ride',
      'wooden-coaster',
    ],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Vídeo grabado desde la primera fila de una montaña rusa; sirve para ver el recorrido antes de ir al parque.',
    definition:
      'POV (Point of View, punto de vista) es un vídeo grabado desde el sitio de un pasajero de primera fila, normalmente con una cámara montada en el tren. Muchos visitantes ven el POV de un coaster antes de ir al parque. A veces los parques publican POVs oficiales como promoción; más a menudo los graban visitantes o medios de comunicación. En YouTube hay decenas de miles de vídeos POV de coasters. El término también se usa para cualquier grabación en primera persona de una atracción.',
    aliases: ['Point of View'],
    alternateNames: ['On-Ride Video', 'Video en cabina', 'Perspectiva de montaje'],

    relatedTermIds: ['credit', 'dark-ride', 'onride-offride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Cuando varios trenes esperan en el brake run a que quede libre la estación. Baja la capacidad y alarga la espera.',
    definition:
      'Hay stacking cuando la carga y descarga de una montaña rusa tarda más que el recorrido, y los trenes que vuelven se quedan en el brake run esperando a que la estación quede libre. En lugar de despachar un tren en cuanto vuelve el anterior, el operador retiene varios en el brake run, y entre un despacho y otro la atracción puede quedar parada un momento. El stacking reduce la capacidad de la atracción y alarga la espera en la cola. Las causas habituales son una carga lenta de pasajeros (a menudo por sistemas de retención complicados), las normas de consigna para bolsas y objetos grandes o la falta de personal. Desde la cola se puede ver si un coaster está haciendo stacking y tenerlo en cuenta antes de decidir si se espera.',
    alternateNames: ['Train Stacking', 'Acumulación de trenes'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Tipo de montaña rusa en la que el tren cuelga bajo el rail y los pies de los pasajeros cuelgan libremente.',
    definition:
      'Un Inverted Coaster es una montaña rusa en la que el tren está fijado rígidamente bajo el rail, con los pasajeros sentados con los pies colgando libremente. A diferencia de un suspended coaster (que oscila lateralmente), el tren de un Inverted Coaster no puede moverse hacia los lados. B&M desarrolló el diseño moderno en 1992 con Batman The Ride. Los Inverted Coasters suelen tener near-misses, zero-g rolls y cobra rolls. Ejemplos europeos: Nemesis (Alton Towers), Katun (Mirabilandia) y Oziris (Parc Astérix).',
    aliases: ['Inverted Coasters'],
    alternateNames: ['Inverted', 'Invert', 'Montaña Rusa Invertida', 'Colgante invertida'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Tipo de coaster con los asientos a los lados del rail, sin nada encima, debajo ni al lado de los pasajeros.',
    definition:
      'Un Wing Coaster (o Wing Rider) tiene dos asientos a cada lado del rail, y los pasajeros no llevan ninguna estructura encima, debajo ni a los lados. Van al aire libre, y el trazado pasa muy cerca de la decoración y de las estructuras (near-misses). B&M es el principal fabricante. Ejemplos europeos: Flug der Dämonen en Heide-Park y The Swarm en Thorpe Park.',
    aliases: ['Wing Coasters'],
    alternateNames: ['Wing Rider', 'Coaster ala', 'Montaña rusa de ala'],

    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Montaña rusa con vagones que giran libremente sobre un eje vertical; ninguna vuelta es igual a otra.',
    definition:
      'En un Spinning Coaster los vagones van montados sobre una plataforma que gira libremente alrededor de un eje vertical. Como nadie controla el giro, cada vehículo pasa el recorrido en un orden distinto de marcha hacia delante, hacia atrás y de lado. Mack Rides (Waldkirch, Alemania) y Gerstlauer son los principales fabricantes. Suelen ser atracciones familiares, con una talla mínima más baja que la de los coasters más intensos.',
    aliases: ['Spinning Coasters'],
    alternateNames: ['Spinner', 'Montaña rusa giratoria'],

    relatedTermIds: ['credit', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'El spinning coaster de alta intensidad de Gerstlauer: más rápido, más alto y con más giro que los modelos normales.',
    definition:
      'El Xtreme Spinning Coaster (XSC) es el spinning coaster más fuerte de Gerstlauer. Un spinning coaster normal está pensado para familias; el XSC tiene una estructura más alta, caídas más pronunciadas, más velocidad máxima y un mecanismo de giro ajustado para que los vagones giren con más fuerza y más a menudo en cada elemento del recorrido.\n\nComo todo va más deprisa, la orientación del vagón cambia más rápido y ninguna vuelta es igual a otra. Con el XSC, Gerstlauer tiene un modelo a medio camino entre los spinners familiares y las montañas rusas de alta intensidad.',
    aliases: ['XSC'],
    relatedTermIds: ['credit', 'gerstlauer', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Montaña rusa que supera los 61 m de altura, generalmente sin inversiones y enfocada en velocidad y airtime.',
    definition:
      'Hyper Coaster es la clasificación para montañas rusas entre 61 y 91 m de altura. B&M llama a sus modelos "Hyper Coaster"; Intamin usa el término "Mega Coaster" para su tipo equivalente. Ambos se centran en grandes colinas de airtime a alta velocidad en lugar de inversiones. Shambhala en PortAventura (76 m) e Hyperion en Energylandia (77 m) son los Hyper Coasters más altos de Europa. Otros ejemplos son Goliath en Walibi Holland y Mako en SeaWorld Orlando.',
    aliases: ['Hyper Coasters'],
    alternateNames: ['Mega Coaster', 'Mega Montaña Rusa', 'Hipercoaster'],

    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition:
      'Montaña rusa de más de 91 m de altura, el escalón siguiente al Hyper Coaster.',
    definition:
      'Giga Coaster es la clasificación para montañas rusas de entre 91 y 121 m de altura. Cedar Fair e Intamin acuñaron el término para Millennium Force en Cedar Point en el año 2000. Un Giga Coaster tiene mucha altura, un recorrido largo y colinas de airtime grandes. Otro Giga Coaster es Fury 325 en Carowinds. En Europa no existe ningún Giga Coaster en 2025.',
    aliases: ['Giga Coasters'],
    alternateNames: ['Gigacoaster'],

    relatedTermIds: ['airtime', 'first-drop', 'hyper-coaster'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Curva con peralte superior a 90°, que inclina brevemente a los pasajeros más allá de la vertical.',
    definition:
      'Un Overbanked Turn es una curva con un peralte de más de 90 grados: el carril exterior queda por encima de la vertical y los pasajeros se inclinan un momento más allá de ella, sin llegar a una inversión completa. En lo más alto del peralte se juntan G laterales y unas G negativas leves. Son habituales en los Hyper Coasters de B&M y los Mega Coasters de Intamin, y aparecen en casi todos los recorridos de RMC.',
    aliases: ['Overbanked'],
    alternateNames: ['Curva sobreinclinada', 'Curva invertida'],

    relatedTermIds: ['airtime', 'b-and-m', 'intamin', 'inversion', 'rmc'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'Freno magnético a mitad de recorrido que reduce la velocidad del tren sin detenerlo por completo.',
    definition:
      'Un Trim Brake es un freno situado a mitad del recorrido de una montaña rusa que reduce la velocidad del tren sin detenerlo del todo, que es lo que hace un block brake. Sirve para controlar las fuerzas G, reducir el desgaste de la vía o cumplir requisitos de seguridad. Cuando el tren llega frenado, las colinas de airtime que vienen después se notan menos. Que el trim brake actúe o no puede depender de la temporada, del tiempo y de la carga del tren.',
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Cuando un launch coaster no alcanza la cima del circuito y rueda hacia atrás por el carril de lanzamiento.',
    definition:
      'Un rollback ocurre cuando un coaster lanzado no genera suficiente velocidad para coronar el punto más alto del circuito y rueda hacia atrás por la gravedad hasta la posición de lanzamiento. En los launch coasters hidráulicos (Top Thrill Dragster, Stealth) sucede cuando el mecanismo de lanzamiento no entrega la potencia completa. El tren rueda suavemente hacia atrás y es detenido por frenos magnéticos. Los rollbacks son raros pero son una característica conocida de los launch coasters hidráulicos. Los pasajeros no corren ningún peligro.',
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatrónica',
    shortDefinition:
      'Figuras robóticas utilizadas en dark rides y espectáculos para crear personajes y escenas realistas.',
    definition:
      'La animatrónica (animatronics) engloba las figuras robóticas electromecánicas empleadas en las atracciones y espectáculos de los parques temáticos para representar personajes o criaturas de forma realista. Disney acuñó el término «Audio-Animatronics» en 1964 durante la Exposición Universal. Las animatrónicas modernas van desde simples figuras cíclicas hasta robots sofisticados con expresiones faciales complejas y movimientos corporales completos. Dos ejemplos: el chamán Na’vi en Pandora (Walt Disney World) y los dinosaurios de la atracción Jurassic World (Universal).',
    aliases: ['Animatrónicos'],
    alternateNames: ['Audio-Animatronics', 'Figura robótica'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'Predicción IA',
    shortDefinition:
      'Predicciones basadas en machine learning para los niveles de afluencia y los tiempos de espera, hasta donde un parque tenga publicado su horario.',
    definition:
      'Una predicción IA utiliza modelos de machine learning entrenados con datos históricos de afluencia, datos meteorológicos, calendarios escolares y datos en tiempo real para predecir cuán concurrido estará un parque o atracción en un día u hora concretos. park.fan genera predicciones IA para la afluencia y los tiempos de espera previstos para cada día que un parque ya ha publicado.\n\nLas predicciones se recalculan en cada entrenamiento, todos los días a las 06:00 UTC. Las predicciones a corto plazo (1–7 días) salen más precisas porque para entonces el tiempo y los eventos ya están fijados y entran en el cálculo los datos meteorológicos actuales, los anuncios de eventos y las señales de reserva. Las predicciones a más largo plazo son menos precisas, pero sirven para ver con bastante antelación qué períodos serán tranquilos o concurridos.',
    aliases: ['AI Forecast', 'AI Forecasts', 'Predicciones IA'],
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'opening-hours',
    name: 'Horario de apertura',
    shortDefinition:
      'El programa diario oficial que indica cuándo abre y cierra un parque temático o atracción.',
    definition:
      'El horario de apertura es el programa diario que publica un parque temático o una atracción, con la hora a la que empieza el acceso y la hora a la que termina la operación. La mayoría de los grandes parques publican un calendario rotativo con semanas o meses de antelación, aunque los horarios pueden cambiar a corto plazo por eventos especiales, ajustes estacionales o problemas operativos.\n\npark.fan muestra los horarios de apertura de cada parque. Los horarios marcados con «Est.» (Estimado) se han calculado a partir de patrones históricos y el parque no los ha confirmado; conviene comprobarlos antes de la visita.',
    aliases: ['Horarios de apertura', 'Horario del Parque', 'Horas de Apertura'],
    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendencia de espera',
    shortDefinition:
      'Hacia dónde ha cambiado la longitud de la cola en los últimos 30 minutos: sube, baja o se mantiene.',
    definition:
      'La tendencia de espera es la comparación de la cola de una atracción con la de hace 30 minutos: más larga, más corta o igual. park.fan la representa con una flecha: hacia arriba (la cola crece), hacia abajo (la cola baja) u horizontal (estable).\n\nA menudo la tendencia sirve más que el tiempo de espera solo. Una atracción con 45 minutos y tendencia a la baja es mejor opción que una con 40 minutos y tendencia claramente al alza. Para cuando llegues, la primera cola puede haber bajado a 30 minutos y la segunda haber subido a 55.',
    aliases: ['Tendencias de espera', 'Queue Trend', 'Wait Trend'],
    relatedTermIds: ['crowd-level', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride sin raíles fijos, en el que los vehículos se mueven libremente guiados por tecnología integrada en el suelo.',
    definition:
      'Un Trackless Ride es un tipo de dark ride en el que los vehículos se mueven solos por la atracción, sin carril fijo, guiados por bucles de inducción, Wi-Fi o láser integrados en el suelo. Así las escenas pueden ser mucho más complejas, y los vehículos no tienen por qué recorrerlas todos en el mismo orden. Son Trackless Rides Star Wars: Rise of the Resistance (Disney), Ratatouille: La Aventura Totalmente Loca de Remy (Disneyland Paris) y Symbolica (Efteling, Países Bajos).',
    aliases: ['Trackless', 'Trackless Dark Ride', 'Atracciones Sin Raíles'],
    alternateNames: ['Dark ride sin raíles'],
    relatedTermIds: ['animatronics', 'dark-ride', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'IA',
    shortDefinition:
      'Inteligencia Artificial: los modelos de machine learning que calculan las previsiones de afluencia y los tiempos de espera.',
    definition:
      'La IA (Inteligencia Artificial) se refiere a los algoritmos de machine learning que reconocen patrones en grandes conjuntos de datos y generan predicciones. park.fan utiliza modelos de IA entrenados con los tiempos de espera registrados, los calendarios escolares, los datos meteorológicos y los anuncios de eventos. Esos modelos calculan cada día nuevas previsiones de afluencia y de tiempos de espera: para cada parque y cada día que ya tenga publicado.',
    alternateNames: ['Inteligencia Artificial'],
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-forecast'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Tiempo de espera en vivo',
    shortDefinition:
      'Datos de tiempo de espera actualizados en tiempo real directamente desde los sistemas del parque.',
    definition:
      'Un tiempo de espera en vivo es el dato actual, sacado directamente de los sistemas de registro de un parque: cómo está la cola hoy, en este momento. park.fan toma los tiempos de espera de fuentes públicas y los actualiza cada cinco minutos, así que en todo momento se ve qué atracción está vacía y en cuál hay que esperar 60 minutos.',
    aliases: ['Espera en tiempo real'],
    alternateNames: ['Tiempos de espera en vivo'],
    relatedTermIds: ['crowd-forecast', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'crowd-forecast',
    name: 'Previsión de afluencia',
    shortDefinition:
      'Predicción basada en IA de la afluencia en un parque temático para un día específico.',
    definition:
      'Una previsión de afluencia es una predicción basada en datos de cuánto de lleno estará un parque temático en un día u hora específicos. park.fan recalcula las previsiones de afluencia diariamente usando datos históricos de asistencia, calendarios escolares, datos meteorológicos y eventos especiales. Con los resultados se hace el calendario de afluencia: en verde, los días de colas cortas; en rojo, los de afluencia máxima con esperas largas.',
    aliases: ['Previsiones de afluencia'],
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      'La unidad de aceleración que experimentan los pasajeros, medida como múltiplos de la aceleración gravitacional terrestre (9,81 m/s²).',
    definition:
      'La fuerza G (equivalente gravitacional) mide la aceleración que experimenta un pasajero en relación con la gravedad normal de la Tierra. Las fuerzas G positivas (por encima de 1G) presionan a los pasajeros contra sus asientos al pasar por valles o curvas cerradas. Las fuerzas G negativas (por debajo de 0G) levantan a los pasajeros de sus asientos y crean airtime. Las fuerzas G laterales actúan horizontalmente, empujando a los pasajeros hacia los lados en curvas y transiciones.\n\nUna montaña rusa se diseña para encadenar estas fuerzas en un orden pensado. Un valle con 4–5G es típico del final de un primer descenso fuerte. Un momento breve de −0,5G en una colina de airtime da la sensación de flotar. En la mayoría de las atracciones, las G positivas sostenidas quedan entre 0 y 5G, con picos breves. Una exposición larga a fuerzas G altas puede causar malestar o greyout, y por eso las montañas rusas alternan los picos con tramos más tranquilos.',
    aliases: ['Fuerzas G', 'G-Forces'],
    alternateNames: ['G-Force'],
    relatedTermIds: ['airtime', 'greyout', 'hangtime', 'inversion', 'lateral-gs', 'smoothness'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'Oscurecimiento temporal de la visión causado por las fuerzas G positivas que reducen el flujo sanguíneo al cerebro.',
    definition:
      'El greyout (también grey-out) es un fenómeno fisiológico en el que un pasajero sometido a fuerzas G positivas intensas experimenta temporalmente un campo visual grisáceo o velado. Las fuerzas G positivas empujan la sangre hacia abajo, a las extremidades, y llega menos sangre a los ojos y al cerebro. El campo visual empieza a cerrarse desde los bordes y se vuelve gris; el pasajero sigue consciente, pero ve mucho menos.\n\nMás allá del greyout, una exposición mayor o prolongada a las fuerzas G puede provocar un blackout (visión completamente oscura) o G-LOC (pérdida de conciencia inducida por fuerzas G). Las montañas rusas bien diseñadas mantienen los picos de G elevados breves y alternan secciones intensas con secciones de recuperación.',
    aliases: ['Greyouts', 'grey-out', 'visión gris'],
    alternateNames: ['velo gris', 'oscurecimiento por G'],
    relatedTermIds: ['airtime', 'g-force', 'hangtime', 'lateral-gs'],
  },
  {
    id: 'grey-zone',
    name: 'Zona gris',
    shortDefinition:
      'Un elemento de montaña rusa en el límite de lo que es una inversión; cuenta o no según el criterio de recuento.',
    definition:
      'La zona gris son los elementos de montaña rusa que quedan en la frontera entre una inversión completa y un elemento sin inversión. Las inversiones clásicas, como los loopings verticales y los tirabuzones, no dejan dudas: el tren pone al pasajero completamente boca abajo. Los elementos de zona gris llegan justo, o no llegan, a los 180° y dejan a los pasajeros casi boca abajo.\n\nSon típicos de la zona gris los stalls (posiciones boca abajo mantenidas sin rotación completa), las curvas con un peralte de más de 90° y algunas variantes del wave turn. Fabricantes como RMC e Intamin usan estos elementos a propósito en lugar de las inversiones clásicas. Según el criterio de recuento, estricto (solo rotaciones completas) o amplio (cualquier posición boca abajo), el número oficial de inversiones de una atracción puede cambiar.',
    aliases: ['Zonas grises', 'zona-gris'],
    alternateNames: ['inversión borderline', 'cuasi-inversión'],
    relatedTermIds: ['inversion', 'overbank', 'roller-coaster-element', 'stall'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Fuerzas horizontales que empujan a los pasajeros hacia los lados en curvas, transiciones y secciones en hélice.',
    definition:
      'Las fuerzas G laterales (o fuerzas laterales) son las aceleraciones horizontales que notan los pasajeros cuando una montaña rusa cambia de dirección en el plano horizontal: en curvas con o sin peralte, en hélices y en cambios de sentido. Bien diseñadas, son suaves y controladas. Mal diseñadas, o con la pista gastada, lanzan al pasajero de golpe contra el respaldo o el lateral del asiento, y eso puede ser incómodo o doloroso.\n\nHay fuerzas laterales buscadas a propósito, como en las curvas amplias y bajas de una montaña rusa de madera clásica, y otras bruscas que vienen del desgaste del carril o de una mala ingeniería. Las montañas rusas de madera se asocian especialmente al movimiento lateral, por la flexibilidad del carril y por las curvas sin peralte. Balder en Liseberg tiene secuencias laterales suaves en sus tramos de hélice.',
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    aliases: ['Laterales', 'Fuerzas G Laterales', 'Lateral G'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'G negativas fuertes que levantan de golpe a los pasajeros del asiento; solo los sujeta la barra de regazo.',
    definition:
      'El ejector airtime es la forma más fuerte de G negativas: la trayectoria se aparta tan de golpe de la caída libre que los pasajeros salen despedidos del asiento y solo los sujeta la barra de regazo. El floater airtime es una flotación suave y larga; el ejector es repentino, y si la transición es demasiado brusca llega a ser violento.\n\nSe asocia sobre todo con los hybrid coasters de RMC, algunos hyper coasters de Intamin y las montañas rusas de madera modernas con colinas parabólicas pronunciadas. Untamed en Walibi Holland, Wildfire en Kolmården y Steel Vengeance en Cedar Point tienen secuencias de ejector airtime.',
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    aliases: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'G negativas suaves y largas: al pasar una colina, los pasajeros flotan durante un rato.',
    definition:
      'El floater airtime es el extremo suave de las G negativas. Cuando el tren pasa una colina con un arco parabólico amplio, los pasajeros se levantan un poco del asiento y flotan durante un momento largo. La fuerza es leve, normalmente entre −0,1G y −0,3G, y la aguantan bien también quienes encuentran demasiado fuerte el ejector airtime.\n\nEs típico de los hyper y giga coasters de B&M, con grandes colinas redondeadas diseñadas para flotar mucho rato. Shambhala en PortAventura, Silver Star en Europa-Park y Goliath en Walibi Holland son ejemplos europeos con largas secuencias de floater.',
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    aliases: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'La sensación de quedar colgado de los arneses durante una inversión, por las G negativas boca abajo.',
    definition:
      'El hangtime son las G negativas durante una inversión: el tren pasa el tiempo suficiente cerca del punto más alto de un elemento invertido para que los pasajeros queden colgando de sus arneses. En un looping rápido el momento boca abajo es breve; hay hangtime cuando el tren va despacio cerca del punto más alto de la inversión y la suspensión dura más. Todo el peso del cuerpo pasa a los arneses de hombro o a la barra de regazo, y el pasajero se desorienta.\n\nEl hangtime es mayor en los elementos en los que el tren pierde mucha velocidad cerca del punto más alto de la inversión. El ejemplo clásico es el pretzel loop de los flying coasters, donde la velocidad es tan baja que las G negativas se mantienen con los pasajeros completamente boca abajo. El heartline roll de algunas atracciones modernas también puede dar hangtime.',
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion', 'pretzel-loop'],
    aliases: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Elemento de montaña rusa',
    shortDefinition:
      'Una sección o característica nombrada de una montaña rusa, como un loop, una colina de airtime o una inversión.',
    definition:
      'Un elemento de montaña rusa es cualquier parte con nombre propio del trazado de una montaña rusa. Unos son inversiones, como el loop y el sacacorchos; otros no, como las colinas de airtime, las hélices y los overbanks. Cada elemento está diseñado para una sensación física concreta: ingravidez (airtime), fuerzas G laterales o ir boca abajo.\n\nEl glosario de park.fan recoge docenas de elementos, entre ellos el first drop, la lifthill y otros más recientes como el Stengel dive, el Norwegian loop y el heartline roll.',
    relatedTermIds: ['airtime', 'first-drop', 'helix', 'inversion', 'vertical-loop'],
    aliases: ['Elementos de montaña rusa'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Primera fila',
    shortDefinition:
      'La primera fila de asientos de un tren de montaña rusa, con la vista despejada hacia delante.',
    definition:
      'La primera fila es la fila delantera de un tren de montaña rusa. Desde ahí la vista hacia delante está despejada. En hipercoasters y gigas, la primera fila suele tener el airtime más fuerte en la caída inicial, porque no hay nadie delante que tape la vista. Los pasajeros de delante ven llegar la caída y después se precipitan por ella, algo que desde las filas centrales o traseras no se ve.\n\nEn muchas montañas rusas hay tanta demanda de primera fila que los parques ofrecen colas aparte o reservas express solo para esos asientos.',
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
    aliases: ['Asiento delantero', 'Primera posición'],
  },
  {
    id: 'back-row',
    name: 'Última fila',
    shortDefinition:
      'La última fila de asientos de un tren; en recorridos con muchas colinas tiene el airtime más fuerte y más largo.',
    definition:
      'La última fila es la fila trasera de un tren de montaña rusa. En montañas rusas con muchas colinas (hypers, gigas, diseños centrados en el airtime), es donde el ejector airtime es más fuerte. En cada colina, la última fila pasa la cresta con G negativas sostenidas y los pasajeros salen despedidos del asiento, sujetos solo por la barra o el arnés. Colina tras colina, el airtime en la última fila suele ser más fuerte y más largo que en las filas delanteras o centrales.\n\nGoliath y Shambhala son montañas rusas de este tipo.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'front-row', 'middle-row'],
    aliases: ['Asiento trasero', 'Última posición'],
  },
  {
    id: 'middle-row',
    name: 'Fila central',
    shortDefinition:
      'Las filas del centro de un tren de montaña rusa, entre la primera y la última.',
    definition:
      'Las filas centrales son los asientos del centro de un tren de montaña rusa, entre la primera fila, desde la que se ve la caída de frente, y la última, con el ejector airtime más fuerte. Desde el centro se ve venir el trazado y hay airtime, pero no se llega a los extremos de delante o de atrás. Para familias o para quien monta por primera vez, las filas centrales son la opción más suave.\n\nEn montañas rusas con muchas fuerzas laterales, las filas centrales a veces notan la mayor compresión, por estar en el centro de masa del tren.',
    relatedTermIds: ['airtime', 'back-row', 'front-row', 'ride-cart'],
    aliases: ['Asiento central', 'Fila del medio'],
  },
  {
    id: 'ride-cart',
    name: 'Carro',
    shortDefinition:
      'Vehículo individual o auto en un tren de montaña rusa que contiene una o más filas de pasajeros.',
    definition:
      'Un carro (también llamado auto, coche o simplemente carro del tren) es cada uno de los vehículos de un tren de montaña rusa en los que van los pasajeros. Un tren típico tiene varios carros enganchados, y en cada uno van una o más filas de pasajeros sentados espalda con espalda. El fabricante diseña las medidas del carro, la posición de los asientos y la geometría de las sujeciones pensando en la comodidad y en lo que notará el pasajero.\n\nEl carro cambia mucho según el tipo de montaña rusa: los hipercoasters usan carros bajos y aerodinámicos para reducir la resistencia del aire; en los coasters invertidos los pasajeros cuelgan bajo la vía; en los wing coasters van a los lados, sin vía debajo; en los flying coasters van boca abajo. B&M, Intamin y Mack tienen cada uno sus propios diseños de carro.',
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
    aliases: ['Auto', 'Coche'],
  },
  {
    id: 'lap-bar',
    name: 'Barra de regazo',
    shortDefinition:
      'Un arnés horizontal de seguridad sobre el regazo que permite mayor libertad de movimiento que los arneses de hombro.',
    definition:
      'Una barra de regazo es una sujeción horizontal que retiene a los pasajeros por la parte alta de los muslos. A diferencia del arnés de hombro, que rodea todo el torso, deja que la parte superior del cuerpo se mueva con más libertad. Es la sujeción habitual en la mayoría de los hipercoasters y gigas y en muchas montañas rusas tradicionales de madera y de acero. En los momentos de airtime, el pasajero se levanta del todo del asiento y solo la barra lo mantiene dentro del vehículo.\n\nEn las montañas rusas con mucho airtime, la barra de regazo es la sujeción que menos limita esa sensación. Hay que colocarla bien, y a los pasajeros con el torso largo les puede resultar incómoda. Los fabricantes llevan décadas mejorando su diseño, y los modelos modernos son bastante más cómodos que los antiguos.',
    relatedTermIds: ['airtime', 'restraint-freedom', 'ride-cart', 'shoulder-harness'],
    aliases: ['Arnés de regazo'],
  },
  {
    id: 'shoulder-harness',
    name: 'Arnés de hombro',
    shortDefinition:
      'Un arnés de seguridad sobre los hombros que envuelve completamente el torso, limitando el movimiento durante el viaje.',
    definition:
      'Un arnés de hombro es una sujeción que baja por encima de los dos hombros hasta la cintura y rodea todo el torso. Fue la sujeción habitual en las montañas rusas desde los años 80 hasta 2000, y sigue siendo común en coasters invertidos, en algunos coasters suspendidos y en atracciones familiares donde lo primero es la máxima seguridad. Los arneses modernos tienen un trinquete que permite ajustarlos a distintos tipos de cuerpo.\n\nEn una montaña rusa con mucho airtime, un arnés de hombro se nota muy distinto de una barra de regazo: sujeta al pasajero hacia abajo y no deja que se levante tanto del asiento. El fabricante elige entre más seguridad y comodidad o un airtime más fuerte.',
    relatedTermIds: ['airtime', 'lap-bar', 'restraint-freedom', 'ride-cart'],
    aliases: ['Arnés OTS'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Recuerdo',
    shortDefinition:
      'Un artículo conmemorativo o pequeño producto comprado en un parque temático para recordar una visita.',
    definition:
      'Un recuerdo es un objeto (merchandise, ropa o un artículo de colección) que un visitante compra para acordarse de su visita al parque temático. Los más comunes son camisetas con el logo del parque, gorras, pines, postales y peluches temáticos. Unos se usan, como la ropa, y otros se guardan para recordar una visita concreta.\n\nLos parques temáticos dependen mucho de lo que ingresan con los recuerdos; el merchandise suele llevar un margen de 2–3x comparado con los precios al por menor. Hay visitantes que coleccionan recuerdos de muchos parques: reúnen pines, los intercambian con otros o llenan una estantería con ellos.',
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
    aliases: ['Souvenir', 'Recuerdo conmemorativo'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Productos y bienes oficiales vendidos por un parque temático, incluyendo ropa, coleccionables y artículos temáticos.',
    definition:
      'Merchandise son todos los productos que vende un parque temático: ropa de marca (camisetas, sudaderas, gorras), coleccionables (pines, figuritas, peluches), productos de comida y bebida y artículos temáticos ligados a una atracción o a una franquicia. Un parque grande los vende en docenas de tiendas, carritos y puestos. El merchandise es una fuente de ingresos importante: a menudo entre el 15 y el 25 % de lo que gastan los visitantes.\n\nLos parques modernos venden artículos de edición limitada por temporada, productos en colaboración con franquicias conocidas, diseños que no se encuentran fuera del parque y ediciones especiales por la apertura de una atracción o por un aniversario.',
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
    aliases: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Tienda de regalos',
    shortDefinition:
      'Una tienda minorista dentro de un parque temático que vende recuerdos, merchandise y productos temáticos.',
    definition:
      'Una tienda de regalos es un local dentro de un parque temático que vende recuerdos, merchandise y productos temáticos. Puede estar en una zona central (como la plaza principal) o dentro de una zona temática o de una atracción. Un parque grande tiene docenas, desde pequeños carritos hasta grandes almacenes. Suelen estar en puntos de mucho paso: la salida de las atracciones principales, los pasillos de los hoteles y las entradas y salidas del parque, donde los visitantes tienen tiempo y ganas de comprar.\n\nEn las tiendas modernas se cuida la entrada, la decoración temática y dónde va cada producto. Muchas atracciones terminan en una tienda por la que hay que pasar para salir, y así aumentan las compras por impulso. Los parques venden cada vez más productos con licencia de franquicias (merchandise IP), a precios más altos.',
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
    aliases: ['Tienda de souvenirs'],
  },
  {
    id: 'park-exclusive',
    name: 'Exclusiva del parque',
    shortDefinition: 'Un producto que solo se vende en un parque temático concreto.',
    definition:
      'El merchandise exclusivo del parque se diseña y se vende solo en un parque temático concreto o en un grupo de parques, y ninguna tienda de fuera lo tiene. Como no se puede conseguir en otro sitio, se compra más por impulso y el parque puede cobrarlo más caro (a menudo 2–3x el margen minorista habitual). Suelen ser exclusivos la ropa de edición limitada, los pines de colección y los artículos ligados a la apertura de una atracción o a un evento de temporada.\n\nQuien ha viajado lejos y ha pagado una entrada cara tiende a comprar lo que no encontrará en casa. En las plataformas de reventa en línea, los artículos exclusivos raros mantienen su valor o se revalorizan, y eso anima a coleccionarlos.',
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
    aliases: ['Exclusivo'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Montaña rusa en que los pasajeros viajan en posición prona.',
    definition:
      'Un flying coaster lleva a los pasajeros tumbados boca abajo en horizontal, como si volaran. En la estación van sentados, y los asientos se inclinan hasta la horizontal antes de empezar el recorrido. Ejemplos: Manta (SeaWorld Orlando) y Tatsu (Six Flags Magic Mountain), los dos de B&M.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    aliases: ['flyer', 'montaña rusa voladora', 'Superman ride', 'prone coaster', 'flying coaster'],
  },
  {
    id: 'mine-train',
    name: 'Tren Minero',
    shortDefinition: 'Montaña rusa familiar de acero ambientada como vagoneta de mina.',
    definition:
      'Un tren minero es una montaña rusa familiar de acero ambientada como una vagoneta de mina desbocada. Suele tener velocidades moderadas, caídas pequeñas y curvas cerradas entre túneles y rocas artificiales, y pueden subir niños y adultos de muchas edades. Ejemplos: Big Thunder Mountain Railroad (parques Disney) y Gold Rush (Plopsaland).',
    relatedTermIds: ['powered-coaster', 'steel-coaster', 'themed-land'],
    aliases: ['mine coaster', 'vagoneta de mina', 'coaster familiar', 'mine train'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Montaña rusa diseñada para seguir el paisaje natural.',
    definition:
      'Un terrain coaster aprovecha la topografía natural (colinas, valles y barrancos) en lugar de depender solo de estructuras artificiales. La pista va muy pegada al terreno, y por eso la velocidad se nota más. Ejemplos: The Beast (Kings Island) y Ravine Flyer II (Waldameer).',
    relatedTermIds: ['airtime', 'alpine-coaster', 'steel-coaster', 'wooden-coaster'],
    aliases: ['terrain coaster', 'coaster de terreno', 'montaña rusa paisajística'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Montaña rusa de acero sin suelo, con los pies colgando libremente.',
    definition:
      'En un floorless coaster, el suelo del vehículo se retira una vez que los pasajeros están sujetos, y las piernas quedan colgando sobre el raíl. A diferencia de los coasters invertidos, el raíl pasa por debajo del vehículo. B&M construyó el primero, Medusa (1999). Ejemplo europeo: Goliath (Walibi Holland).',
    relatedTermIds: [
      'b-and-m',
      'dive-coaster',
      'inverted-coaster',
      'stand-up-coaster',
      'steel-coaster',
    ],
    aliases: ['floorless', 'coaster sin suelo', 'floorless coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: 'Fabricante americano responsable del primer looping moderno.',
    definition:
      'Arrow Dynamics (fundada en 1945) fue un fabricante americano que introdujo el raíl tubular de acero moderno y el primer loop vertical moderno, en Corkscrew (Knott’s Berry Farm, 1975). Sus atracciones más conocidas son los corkscrews y los suspended looping coasters. La empresa quebró en 2001 y S&S compró sus activos.',
    relatedTermIds: ['corkscrew', 'rattle', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow', 'arrow dynamics'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Fabricante americano de montañas rusas de madera con trazados rápidos y sinuosos.',
    definition:
      'Great Coasters International (GCI) es un fabricante americano especializado en montañas rusas de madera. Fundado en 1994, GCI construye los trenes Millennium Flyer y recorridos con cambios de dirección rápidos y airtime sostenido. Suyos son Wodan (Europa-Park), Thunderhead (Dollywood) y Troy (Toverland).',
    relatedTermIds: ['airtime', 'rmc', 'terrain-coaster', 'wooden-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster', 'Millennium Flyer', 'gci'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Fabricante americano especializado en coasters de lanzamiento LSM/LIM; en Europa se le conoce sobre todo por Sky Scream.',
    definition:
      'Premier Rides (fundado en 1995 en Baltimore, Maryland) es un fabricante americano especializado en lanzamientos por motor síncrono lineal (LSM) y por motor de inducción lineal (LIM). Su Sky Rocket II, un launch coaster compacto con una inversión, está en parques de tamaño medio de todo el mundo.\n\nEn Europa, lo más conocido de Premier Rides es Sky Scream en Holiday Park (Haßloch, Alemania), un launch coaster invertido. La tecnología LSM de Premier también mueve Hagrid’s Magical Creatures Motorbike Adventure en Universal Orlando.',
    alternateNames: ['Premier'],
    relatedTermIds: ['gerstlauer', 'intamin', 'launch-coaster'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Fabricante alemán de Múnich conocido por spinning coasters con trick track, la plataforma X-Car y el modelo vertical Sky Loop.',
    definition:
      'Maurer Rides (Maurer AG, construcción metálica desde 1876, atracciones desde 1993) es un fabricante de Múnich. Sus spinning coasters de la serie SC tienen trick track, un tramo en el que el vagón se inclina de lado, y con la plataforma X-Car se hacen recorridos compactos muy a medida, con lanzamientos e inversiones.\n\nEl Sky Loop es un loop vertical independiente que está en muchos parques europeos. En Europa, Maurer construyó Winja’s Fear y Winja’s Force en Phantasialand (Alemania), spinning coasters en interiores con trick track.',
    aliases: ['Maurer AG'],
    alternateNames: ['Maurer', 'Maurer Söhne'],
    relatedTermIds: ['gerstlauer', 'launch-coaster', 'spinning-coaster', 'xtreme-spinning-coaster'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Fabricante italiano con uno de los catálogos de coasters familiares y atracciones más grandes del mundo: más de 250 coasters instalados.',
    definition:
      'Zamperla (fundado en 1966 en Altavilla Vicentina, Italia) es uno de los fabricantes que más atracciones han instalado en el mundo. Intamin, B&M y Mack construyen sobre todo atracciones grandes; Zamperla vende muchas unidades de modelos para un público amplio, y sus Family Coaster, Mini Coaster, Twister y Disk’O Coaster son habituales en parques medianos y complejos turísticos de todo el mundo.\n\nComo ocupan poco y la talla mínima es moderada, hay muchas atracciones Zamperla en parques urbanos europeos, complejos hoteleros e instalaciones interiores. La empresa construyó también Thunderbolt en Coney Island (Nueva York).',
    alternateNames: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition:
      'Fabricante alemán de atracciones fundado en 1961, conocido por el Top Spin, el Break Dance, el Enterprise, el Ranger y el Condor.',
    definition:
      'Huss Rides GmbH es un fabricante alemán de atracciones fundado en 1961 por Paul Huss, con sede en Bremen. Sus flat rides de finales del siglo XX están en parques temáticos y ferias de todo el mundo.\n\nSus modelos más conocidos son el Top Spin, el Break Dance (vehículos giratorios sobre una plataforma rotatoria), el Enterprise (rueda centrífuga de góndolas), el Ranger (barco péndulo oscilante), el Condor (torre de sillas rotativa) y la Troika. Muchos de estos diseños se convirtieron en modelos estándar y otros fabricantes los copiaron. Las atracciones Huss se asocian sobre todo con los flat rides de los parques europeos de los años ochenta y noventa.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'pendulum-ride', 'top-spin'],
    aliases: ['Huss', 'Huss Park Attractions'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Fabricante americano conocido por torres neumáticas, el compacto El Loco y los coasters Free Fly 4D.',
    definition:
      'S&S Worldwide (fundado en 1994 en Logan, Utah; comprado por Sansei Technologies en 2012) empezó con sistemas de caída neumática, Space Shot y Turbo Drop, y después amplió su catálogo. El Loco es un coaster compacto con una primera caída de más de 90 grados y una inversión, todo en muy poco espacio. El Free Fly es un coaster 4D con asientos que giran libremente.\n\nS&S compró también los activos de Arrow Dynamics tras su quiebra en 2001. En Europa hay menos instalaciones de S&S que en Norteamérica.',
    aliases: ['S&S Power'],
    alternateNames: ['S&S', 'S&S-Sansei', 'S&S Sansei'],
    relatedTermIds: ['arrow-dynamics', 'gerstlauer', 'launch-coaster'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Fabricante bávaro especializado en coasters familiares, con más de 190 instalaciones en todo el mundo.',
    definition:
      'Zierer (fundado en 1930 en Deggendorf, Baviera) es un fabricante alemán especializado en montañas rusas familiares y atracciones clásicas de parque. La gama Force Coaster tiene varios niveles, desde modelos júnior compactos hasta los Force Custom, más rápidos. Los coasters Zierer tienen raíl tubular de acero, marcha suave y tallas mínimas moderadas.\n\nCon más de 190 montañas rusas entregadas en todo el mundo, Zierer es uno de los fabricantes europeos que más unidades han vendido. Entre ellas están Feuerdrache en Legoland Deutschland y coasters familiares en parques alemanes, holandeses y escandinavos.',
    alternateNames: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'gerstlauer', 'mack-rides'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition: 'Inversión donde el tren queda brevemente boca abajo a velocidad casi cero.',
    definition:
      'Un stall (o zero-G stall) es un elemento en el que el tren entra en una inversión en el punto más alto y reduce la velocidad hasta casi detenerse, dejando a los pasajeros boca abajo. Lo desarrolló Rocky Mountain Construction (RMC), y da un hangtime largo. Ejemplos: Zadra (Energylandia) y Steel Vengeance (Cedar Point).',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'zero-g-roll'],
    aliases: ['zero-g stall', 'RMC stall', 'elemento hangtime', 'stall element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition: 'Curva peraltada que genera airtime en mitad del cambio de dirección.',
    definition:
      'Un wave turn es una curva con mucho peralte, a gran velocidad, en la que el tren pasa un momento por G negativas o laterales, de modo que a mitad de la curva hay airtime. Es frecuente en atracciones de Rocky Mountain Construction y combina el cambio de dirección con ejector o floater airtime. Lo tienen Wildfire (Kolmården) y Untamed (Walibi Holland).',
    relatedTermIds: ['airtime', 'ejector-airtime', 'lateral-gs', 'overbank', 'rmc', 's-hill'],
    aliases: ['wave turn', 'curva con airtime'],
  },
  {
    id: 'shoulder-season',
    name: 'Temporada Intermedia',
    shortDefinition: 'Periodo entre la temporada alta y la baja con afluencia moderada.',
    definition:
      'La temporada intermedia son los periodos de transición entre la temporada alta y los momentos más tranquilos de un parque. En los parques europeos suelen ser la primavera (marzo–mayo) y el principio del otoño (septiembre–octubre). La afluencia es moderada, los precios suelen ser más bajos y la mayoría de las atracciones están abiertas.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'school-holiday'],
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
      'Las vacaciones escolares (de verano, de Navidad, de Semana Santa y otras) son la causa principal de los picos de afluencia en los parques temáticos. Las familias con niños son el grupo de visitantes más grande y concentran sus visitas en esas fechas. En vacaciones, los parques suelen abrir más horas, programar más espectáculos y subir los precios.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'shoulder-season'],
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
      'Un fotopass (o Memory Maker) es un complemento opcional que da acceso digital a todas las fotos y vídeos profesionales de la visita: fotos en atracciones, encuentros con personajes y fotógrafos repartidos por el parque. Se vende a precio fijo, y a una familia le puede salir a cuenta. Ejemplos: Memory Maker (Disney) y Photo Pass (Universal).',
    relatedTermIds: ['character-meet-and-greet', 'ride-photo', 'season-pass'],
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
      'Un simulador combina una plataforma móvil hidráulica o eléctrica con una gran pantalla, y sincroniza los movimientos de la plataforma con la película proyectada, sin raíl. Suele tener mucha capacidad, y la atracción se puede renovar cambiando la película. Ejemplos: Star Tours (Disney), Mystic Manor (HKDL).',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'trackless-ride'],
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
      'Un encuentro con personajes es una zona o una cita programada en la que los visitantes pueden conocer a personajes disfrazados, hacerse fotos con ellos y pedirles autógrafos. Es muy habitual en los parques Disney y Universal; los personajes más buscados suelen tener un sitio propio con su propia cola. Van sobre todo familias con niños.',
    relatedTermIds: ['character-dining', 'photo-pass', 'themed-land'],
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
    shortDefinition: 'Sala previa a una atracción en la que se cuenta el principio de la historia.',
    definition:
      'Un pre-show es una sala de una atracción temática en la que los visitantes se reúnen antes del recorrido principal para ver la introducción de la historia, escuchar las instrucciones de seguridad o ver un pequeño espectáculo que prepara el ambiente. Sirve tanto para la historia como para la operación de la atracción. Ejemplos: la sala extensible del Haunted Mansion y el vídeo de seguridad de Guardians of the Galaxy – Mission: BREAKOUT!.',
    relatedTermIds: ['animatronics', 'dark-ride', 'motion-simulator', 'themed-land'],
    aliases: ['pre show', 'zona de espera temática', 'área de pre-embarque'],
  },
  {
    id: 'flat-ride',
    name: 'Atracción Plana',
    shortDefinition:
      'Atracción a nivel del suelo que gira, oscila o rota sin un circuito de vía elevado.',
    definition:
      'Una atracción plana (flat ride) es una categoría de atracciones que funcionan en un plano aproximadamente horizontal sin vía elevada. El término abarca atracciones giratorias (carruseles, tazas locas), Frisbees (atracciones pendulares), Top Spins y sillas voladoras, torres de caída y plataformas giratorias.\n\nA diferencia de las montañas rusas, las flat rides suelen ocupar poco espacio y caben en las zonas más pequeñas del parque. Muchas tienen una gran capacidad por hora, una talla mínima baja o ninguna y sirven para todas las edades; en muchos parques son la mayor parte de la oferta familiar e infantil.',
    relatedTermIds: ['drop-tower', 'height-requirement', 'ride-capacity', 'swing-ride'],
    aliases: ['flat rides', 'atracción de feria', 'ride plano'],
  },
  {
    id: 'water-ride',
    name: 'Atracción Acuática',
    shortDefinition:
      'Atracción en la que los visitantes viajan en barcas o vehículos por el agua y se mojan.',
    definition:
      'Una atracción acuática (water ride) es cualquier atracción en la que el agua es parte central, porque el vehículo recorre un canal o porque el agua se usa a propósito como efecto. Los tres tipos más frecuentes son los toboganes acuáticos (barcas por un canal con caída final), los rápidos (balsas circulares por aguas turbulentas artificiales) y las batallas de agua (los visitantes se mojan unos a otros con cañones de agua). Las atracciones acuáticas suelen pedir una talla mínima baja y sirven para un público muy amplio. En días de calor sus colas pueden ser muy largas.',
    relatedTermIds: ['height-requirement', 'log-flume', 'ride-capacity', 'river-rapids'],
    aliases: ['atracción de agua', 'ride acuático', 'water ride', 'atracción mojada'],
  },
  {
    id: 'live-show',
    name: 'Espectáculo en Vivo',
    shortDefinition:
      'Actuación programada con actores reales, música, acrobacias o personajes en un espacio escénico dedicado.',
    definition:
      'Un espectáculo en vivo es una función con actores en un anfiteatro al aire libre, un teatro cubierto o en la calle; no es una atracción ni una exposición fija. En los parques temáticos hay producciones teatrales de estilo Broadway, shows de acrobacias, desfiles de personajes, experiencias 4D con partes en vivo y espectáculos de láser y fuegos artificiales. A diferencia de las atracciones, los shows tienen horarios fijos y un aforo limitado por función, así que conviene meterlos en el plan de visita para que no coincidan con otra cosa. A mediodía, cuando más gente hay, sirven de pausa.',
    relatedTermIds: ['pre-show', 'ride-capacity', 'themed-land'],
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
      'El servicio rápido (también counter service o fast casual) designa los restaurantes del parque donde los visitantes piden en un mostrador y llevan su comida a una mesa. Es el tipo de restaurante más común en los parques temáticos, porque se come rápido. Disney popularizó el término "quick service" para diferenciarlo del "table service" en su sistema de reservas.',
    relatedTermIds: ['character-dining', 'table-service'],
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
      'En los restaurantes de servicio de mesa de los parques temáticos atienden camareros. Conviene reservar (en los parques Disney, a menudo con 60–180 días de antelación), porque los locales más solicitados se llenan pronto, sobre todo en temporada alta. Es bastante más caro que el servicio rápido; a cambio, la comida suele ser mejor y se come con más calma.',
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
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
      'La cena con personajes es una comida en un restaurante (servicio de mesa o bufé) en la que los personajes disfrazados visitan cada mesa para interactuar con los visitantes, hacer fotos y firmar autógrafos. Así el encuentro con personajes está garantizado sin hacer una cola aparte, y por eso lo eligen muchas familias. Ejemplos: Chef Mickey’s (Disney World) y el Storybook Dining en Auberge de Cendrillon (Disneyland Paris).',
    relatedTermIds: ['character-meet-and-greet', 'quick-service', 'table-service'],
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
      'Atracción tipo torre que sube a los visitantes a gran altura y los suelta en caída libre.',
    definition:
      'Una torre de caída (drop tower o free-fall tower) es una atracción en la que los visitantes son elevados en una góndola o asientos individuales alrededor de una estructura central de torre y después soltados para caer rápidamente hacia el suelo. La caída puede ser casi en caída libre (rozando la ingravidez), frenada, o combinada con un impulso hacia arriba. Una fase de deceleración progresiva frena la góndola suavemente al final. Hay torres rotativas, modelos multidireccionales y versiones híbridas. Ocupan poco espacio y las hay en todo el mundo. Entre los fabricantes están Intamin, Mondial y S&S Worldwide.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'intamin', 's-and-s-worldwide'],
    aliases: [
      'torre de caída libre',
      'drop ride',
      'caída libre',
      'free fall tower',
      'torres de caída',
    ],
  },
  {
    id: 'log-flume',
    name: 'Descenso de Troncos',
    shortDefinition:
      'Atracción de canal de agua en que barcas con forma de tronco recorren un circuito y terminan con un gran chapuzón.',
    definition:
      'Un descenso de troncos (log flume) es una atracción acuática en la que los visitantes van sentados en barcas con forma de tronco por un canal lleno de agua. Después de unos tramos tranquilos llega una rampa final empinada, y los pasajeros casi seguro se mojan. Los descensos de troncos aparecieron en los años 1960 y hoy hay uno en casi todos los parques de atracciones; sirven para familias, tienen una capacidad moderada y en verano se llenan. Ejemplos europeos: Poseidon en Europa-Park y muchas instalaciones de tipo Wildwasserbahn en parques de habla alemana.',
    relatedTermIds: [
      'height-requirement',
      'river-rapids',
      'splashdown',
      'water-coaster',
      'water-ride',
    ],
    aliases: ['log flume', 'troncos', 'río de troncos', 'Wildwasserbahn', 'barca de troncos'],
  },
  {
    id: 'river-rapids',
    name: 'Rápidos',
    shortDefinition:
      'Atracción en balsa circular que navega rápidos artificiales turbulentos donde los visitantes pueden acabar empapados.',
    definition:
      'Una atracción de rápidos (river rapids) lleva a los visitantes en balsas circulares, inflables o de plástico, que bajan girando por un canal artificial hecho para imitar aguas bravas. Como la balsa gira libremente con la corriente, nunca se sabe quién se mojará: según cómo quede la balsa, unos acaban empapados y otros casi secos. Tienen mucha capacidad por hora, sirven para familias y suelen pedir una talla mínima baja. Con el calor del verano tienen más cola. Ejemplos europeos: las atracciones Wildwasser de Phantasialand y diversas instalaciones en Efteling, Europa-Park y Thorpe Park.',
    relatedTermIds: ['height-requirement', 'log-flume', 'water-ride'],
    aliases: ['aguas bravas', 'rapids', 'river rapids', 'rafting', 'rápidos de río'],
  },
  {
    id: 'pendulum-ride',
    name: 'Atracción Pendular',
    shortDefinition:
      'Atracción plana en la que una góndola oscila en un amplio arco de péndulo, a menudo mientras gira simultáneamente.',
    definition:
      'Una atracción pendular es un tipo de atracción plana (flat ride) en la que una góndola cuelga de un brazo largo que oscila en un arco cada vez más amplio, a menudo hasta quedar casi vertical. La góndola gira además sobre su propio eje, así que el pasajero nota a la vez el péndulo y la rotación.\n\nEl ejemplo más conocido es el Frisbee (Mondial), una góndola en forma de disco que oscila como un péndulo mientras gira. Otras atracciones pendulares habituales son el KMG Afterburner y el Intamin Giant Frisbee. Se ven desde lejos y ocupan relativamente poco, y por eso hay muchas en parques temáticos y ferias de todo el mundo.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'height-requirement', 'swing-ride'],
    aliases: ['Frisbee', 'Frisbees', 'atracciones pendulares'],
    alternateNames: ['atracción de péndulo', 'columpio pendular'],
  },
  {
    id: 'top-spin',
    name: 'Top Spin',
    shortDefinition:
      'Atracción de Huss en la que una góndola con pasajeros gira libremente en cualquier dirección mientras el marco de soporte oscila arriba y abajo.',
    definition:
      'El Top Spin es un modelo de atracción fabricado por Huss Rides. Una góndola para unos 40 pasajeros va montada en un marco pivotante. Mientras el marco oscila, la góndola puede dar vueltas continuas en cualquier dirección, y la mezcla de oscilación y rotación no se puede prever. Se puede programar desde un balanceo suave hasta rotaciones continuas muy intensas.\n\nEn los años 1990 y 2000 había Top Spins en casi todos los parques temáticos y ferias. Aunque oscila, el Top Spin no es una atracción pendular: la góndola va sujeta entre dos brazos laterales rotativos, no colgada de un brazo largo.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['Top Spins'],
    alternateNames: ['Huss Top Spin'],
  },
  {
    id: 'break-dance',
    name: 'Break Dance',
    shortDefinition:
      'Una atracción plana de Huss con varios coches montados en un gran disco giratorio, donde cada coche gira libremente sobre su propio eje.',
    definition:
      'El Break Dance es un modelo de atracción plana de Huss Rides en el que coches pequeños, de dos a cuatro pasajeros cada uno, van colocados alrededor de un gran disco giratorio. Mientras el disco gira, cada coche gira libremente sobre su propio eje, y las fuerzas de giro e inclinación cambian en cada ciclo sin que se puedan prever.\n\nDesde la década de 1980 es uno de los modelos de atracción plana más extendidos, en ferias itinerantes y en parques permanentes, con su disco iluminado y la música a todo volumen. Otros fabricantes tienen variantes e imitaciones con otros nombres.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Breakdance', 'Break Dancer'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    shortDefinition:
      'Una atracción centrífuga donde las góndolas en un gran anillo giratorio son mantenidas en su lugar por la fuerza G mientras el anillo se inclina hacia la vertical.',
    definition:
      'La Enterprise es una atracción con las góndolas colocadas alrededor de un gran anillo giratorio. Cuando el anillo acelera, la fuerza centrífuga aprieta a los pasajeros contra el asiento; a plena velocidad, todo el anillo se inclina poco a poco hasta quedar casi vertical, con los pasajeros girando boca arriba.\n\nLa creó Huss Rides y después la fabricaron otros muchos fabricantes. Desde la década de 1970 es habitual en parques permanentes y en ferias itinerantes.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition:
      'Una atracción de barco oscilante: una gran góndola con forma de barco vikingo o pirata que oscila como un péndulo en un arco cada vez más amplio.',
    definition:
      'El Ranger es el modelo de barco oscilante de Huss Rides: una gran góndola con forma de drakkar vikingo o barco pirata que oscila hacia adelante y hacia atrás en arco, ganando altura con cada oscilación. Los pasajeros se sientan a lo largo de los lados del barco, mirando hacia el interior. En la oscilación máxima la góndola alcanza ángulos altos, y en el punto más alto hay G negativas fuertes.\n\nMuchos fabricantes de todo el mundo hacen barcos oscilantes con distintos nombres (Viking, Pirate Ship, Sea Monster). El Ranger es uno de los modelos de atracción plana de Huss más instalados, en parques permanentes y en ferias itinerantes de toda Europa y de fuera.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: [
      'swinging ship',
      'swinging ships',
      'pirate ship ride',
      'Viking ship ride',
      'barco pirata',
      'barco vikingo',
    ],
    alternateNames: ['Huss Ranger', 'barco vikingo', 'barco pirata'],
  },
  {
    id: 'condor',
    name: 'Condor',
    shortDefinition:
      'Una atracción plana de Huss con brazos de góndola que se extienden hacia afuera desde una columna central mientras la atracción gira y asciende.',
    definition:
      'El Condor es un modelo de atracción de Huss Rides que consiste en una alta columna central con varios brazos de góndola. Durante el funcionamiento, los brazos se extienden hacia afuera y las góndolas ascienden mientras toda la estructura gira. Los pasajeros giran, suben y se inclinan hacia fuera, y ven el parque desde una altura moderada.\n\nEl Condor fue un elemento habitual en los parques europeos desde la década de 1970 hasta los años 1990 y todavía se puede encontrar en muchas ubicaciones permanentes. A veces se confunde con las atracciones de sillas voladoras (columpios de cadenas) pero tiene góndolas cerradas en lugar de sillas abiertas suspendidas.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'swing-ride'],
  },
  {
    id: 'troika',
    name: 'Troika',
    shortDefinition:
      'Una atracción plana de Huss con tres brazos giratorios, cada uno con una góndola cuyos coches giran simultáneamente con la plataforma principal.',
    definition:
      'La Troika es un modelo de atracción de Huss Rides con tres brazos que salen de un eje central; cada brazo lleva una góndola con varios coches que pueden girar. Mientras gira la plataforma principal, giran también las góndolas y los coches, y el pasajero gira a la vez sobre varios ejes. El movimiento no se puede prever y desorienta mucho.\n\nDesde la década de 1970 hay Troikas en parques de atracciones y ferias de Europa. Las variantes e imitaciones de otros fabricantes a veces se conocen como Trabant o Walzer.',
    relatedTermIds: ['break-dance', 'flat-ride', 'huss-rides'],
    aliases: ['Troikas', 'Trojka'],
    alternateNames: ['Huss Troika'],
  },
  {
    id: 'swing-ride',
    name: 'Sillas Voladoras',
    shortDefinition:
      'Atracción rotatoria en que los asientos colgados de cadenas se inclinan hacia fuera al girar la estructura.',
    definition:
      'Las sillas voladoras (también llamadas wave swinger o Kettenkarussell) son una atracción rotatoria en la que los asientos suspendidos de cadenas cuelgan de una estructura central giratoria. Al acelerar el giro, la fuerza centrífuga lanza los asientos hacia fuera y hacia arriba, y los pasajeros van por el aire. Las sillas voladoras son uno de los tipos de atracción de feria más antiguos que siguen en uso. Hay versiones modernas pequeñas para niños y enormes torres de cadenas (starflyers) que suben a los pasajeros decenas de metros. Están presentes en casi todos los parques temáticos y ferias de atracciones del mundo.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'ride-capacity'],
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
      'Una montaña rusa de carreras (racing coaster) tiene dos circuitos separados pero simétricos que van en paralelo; los dos trenes salen a la vez y corren uno contra otro. Los circuitos se cruzan o se acercan en varios puntos. Algunos modelos tienen un recorrido de Möbius: los dos circuitos forman un solo recorrido continuo y los pasajeros cambian de lado sin bajarse. El formato existe tanto en madera como en acero. En Europa son raras; la más conocida es Grand National, en Blackpool Pleasure Beach, un woodie con recorrido de Möbius.',
    relatedTermIds: ['credit', 'steel-coaster', 'wooden-coaster'],
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
      'Un High Five es un elemento de casi choque: dos trenes de montaña rusa en vías separadas pero muy juntas se cruzan a muy poca distancia, a veces al alcance del brazo, y parece que van a chocar. El nombre viene de la idea de que los pasajeros podrían sacar la mano y chocar los cinco con los del otro tren. Para que los dos trenes lleguen a la vez al punto de cruce, las salidas tienen que estar sincronizadas con precisión. Los wing coasters y los inverted coasters se prestan especialmente, porque los asientos exteriores quedan aún más cerca del otro tren. Duelling Dragons / Dragon Challenge, en Universal’s Islands of Adventure, fue uno de los primeros; hoy el elemento está en varios wing coasters de B&M de todo el mundo.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'wing-coaster'],
    aliases: ['elemento cuasi-colisión', 'near miss', 'near-miss element', 'high 5'],
  },
  {
    id: 'dining-reservation',
    name: 'Reserva de Restaurante',
    shortDefinition:
      'Reserva anticipada para un restaurante de servicio de mesa en un parque temático o resort.',
    definition:
      'Una reserva de restaurante es una reserva anticipada para un restaurante de servicio de mesa o de cena con personajes en un parque temático, hotel del resort o complejo de entretenimiento asociado. En los parques Disney se puede reservar con hasta 60 días de antelación (10 días más para los huéspedes de los hoteles del resort), y en los restaurantes más solicitados quien no reserva a tiempo se queda sin mesa. La reserva suele garantizarse con una tarjeta de crédito; Disney cobra un cargo si no te presentas o cancelas con poca antelación. Entre los aficionados se abrevia como ADR (Advance Dining Reservation).',
    relatedTermIds: ['character-dining', 'peak-day', 'table-service'],
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
      'El pedido móvil permite a los visitantes consultar el menú de un restaurante, realizar y pagar su pedido, y seleccionar un horario de recogida a través de la app oficial del parque, sin hacer cola en el mostrador. Disney popularizó el sistema en sus restaurantes de servicio rápido; Universal, Six Flags, los parques Merlin y muchos otros operadores han lanzado sus propias versiones. Cuando llega la franja horaria elegida, los visitantes reciben una notificación y recogen su pedido en el punto designado. Así se evita la cola del mostrador, sobre todo a la hora punta del almuerzo. Hace falta un smartphone con batería y cobertura suficiente dentro del parque.',
    relatedTermIds: ['dining-reservation', 'quick-service'],
    aliases: ['pedido por móvil', 'mobile order', 'pedido en app', 'mobile ordering'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Gran zona de restauración compartida con varios mostradores de diferentes cocinas bajo un mismo techo.',
    definition:
      'Un food court es un espacio de restauración común con múltiples mostradores o puestos de comida rápida independientes que ofrecen distintas cocinas y comparten una zona de asientos. En los parques temáticos, los food courts son habitualmente las zonas de restauración con mayor capacidad, diseñadas para absorber el gran volumen de visitantes a la hora del almuerzo. Distintos miembros de un grupo pueden pedir en mostradores diferentes y sentarse juntos. El nivel de ambientación varía: Disney y Universal suelen integrar los food courts en la temática de sus áreas, mientras que otros parques los gestionan como espacios funcionales cerca de las entradas. Los food courts son en general la opción de restauración más asequible dentro de un resort.',
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    aliases: ['zona de restauración', 'patio de comidas', 'food court', 'zona de comida'],
  },
  {
    id: 'capacity-closure',
    name: 'Cierre por Capacidad',
    shortDefinition:
      'Cuando un parque deja de admitir nuevos visitantes porque ha alcanzado su aforo máximo.',
    definition:
      'Un cierre por capacidad (también llamado parque completo o agotado) ocurre cuando un parque temático alcanza su número máximo de visitantes permitido y deja temporalmente de vender entradas de día o de admitir nuevos visitantes. Los parques gestionan la capacidad mediante reservas de entrada programadas, seguimiento en tiempo real de la asistencia y cierres temporales de acceso. Los titulares de abono anual pueden ser bloqueados en días de capacidad según las normas del parque; otros parques usan sistemas de reserva anticipada que evitan el aforo excesivo antes de que se produzca. Los cierres por capacidad son más frecuentes en los picos de vacaciones escolares, noches de fuegos artificiales y eventos especiales. Conviene mirar la app del parque o sus redes sociales la mañana de la visita.',
    relatedTermIds: ['crowd-level', 'peak-day', 'school-holiday', 'season-pass'],
    aliases: ['parque completo', 'parque lleno', 'capacity closure', 'aforo máximo', 'agotado'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'Una variante del zero-G roll con cambio de dirección: el tren entra y sale de la inversión con rumbos distintos.',
    definition:
      'El zero-G winder parte del zero-G roll, una rotación de 360 grados sobre un arco parabólico con casi ingravidez en el vértice, y le añade un cambio de dirección. En un zero-G roll normal el tren entra y sale con rumbos más o menos paralelos; en el winder la vía se curva durante la rotación y el tren sale apuntando en otra dirección. Así el elemento es a la vez una inversión, con la flotación de un zero-G roll, y una curva que lleva la montaña rusa hacia el siguiente tramo.\n\nSe asocia a diseños recientes de fabricantes como Intamin y B&M. Kondaa en Walibi Belgium y VelociCoaster en Universal’s Islands of Adventure tienen uno.',
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
    aliases: ['zero g winder', 'Zero-G Winder', 'winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Un elemento alargado y asimétrico con dos inversiones unidas por un arco largo; visto desde arriba tiene forma de banana.',
    definition:
      'El banana roll es una versión estirada de la doble inversión: las dos inversiones están más separadas y las une un tramo de curva amplia, en lugar de la geometría estrecha y simétrica de un cobra roll normal. Visto desde arriba, la vía sigue un arco suave por las dos inversiones que recuerda la curva de una banana. Como las inversiones se reparten en un tramo de vía más largo, el paso por ellas es más fluido y menos brusco que en un cobra roll.\n\nEl banana roll apareció por primera vez en 2011 en Takabisha, en Fuji-Q Highland (Japón), construido por Gerstlauer. S&S Worldwide hizo después su propia versión con doble inversión para Steel Curtain en Kennywood. Como el elemento necesita mucho espacio lateral, suele estar en instalaciones grandes, a ras de suelo, donde la vía puede describir una trayectoria amplia entre las dos inversiones.',
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
    aliases: ['banana roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Looping Inclinado',
    shortDefinition:
      'Un looping vertical girado sobre su eje: el tren entra y sale en diagonal en lugar de de frente.',
    definition:
      'Un looping inclinado (en inglés inclined loop o tilted loop) es un looping vertical normal girado sobre su eje, normalmente entre 45 y 80 grados respecto a la dirección de marcha del tren. En un looping vertical clásico el tren entra y sale en línea recta; en uno inclinado entra y sale en diagonal, y el looping se ve asimétrico.\n\nLa inclinación cambia cómo se vive la inversión: la entrada se nota más lateral que en un looping normal, y la salida por la parte inferior del círculo llega desde una dirección que el pasajero no espera. Desde fuera, un looping inclinado se distingue enseguida de uno recto. Los hay en varias montañas rusas de B&M e Intamin, a menudo en la parte media o final del recorrido.',
    relatedTermIds: ['b-and-m', 'intamin', 'inversion', 'vertical-loop'],
    aliases: ['tilted loop', 'looping torcido', 'inclined loop', 'looping inclinado'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'Elemento Vekoma de doble inversión en el que el tren sale en la misma dirección en la que entró.',
    definition:
      'El sea serpent es un elemento de doble inversión asociado a las montañas rusas invertidas de Vekoma. Como el cobra roll, tiene dos inversiones unidas por un tramo central, pero con una diferencia: el cobra roll gira el tren 180 grados, y el sea serpent está diseñado para que el tren entre y salga en la misma dirección general. Las dos inversiones suben y bajan seguidas sin cambiar el rumbo del tren; visto de lado, el elemento tiene una forma larga de S, como el cuerpo de una serpiente marina que asoma entre dos olas.\n\nHay sea serpents en el Suspended Looping Coaster (SLC) de Vekoma y en algunas de sus instalaciones a medida. Como se han construido muchos SLC para parques de todo el mundo, el sea serpent es uno de los elementos de doble inversión más extendidos, aunque su nombre se conozca menos que el del cobra roll.',
    relatedTermIds: ['batwing', 'cobra-roll', 'inversion', 'vekoma'],
    aliases: ['sea serpent', 'roll over'],
  },
  {
    id: 'cobra-loop',
    name: 'Cobra Loop',
    shortDefinition:
      'El nombre que Hersheypark dio a la primera inversión de Storm Runner: un looping del que el tren sale de lado en vez de completarlo.',
    definition:
      'Un cobra loop asciende como un looping vertical y, en lo alto, se retuerce hacia un lado en lugar de bajar por el otro, así que el tren sale del elemento en una dirección distinta a la de entrada. Invierte a los pasajeros una vez.\n\nEl nombre pertenece a una sola atracción. Intamin construyó el elemento para Storm Runner en Hersheypark en 2004 y el parque lo promocionó como el primer cobra loop del mundo; geométricamente es lo que otros fabricantes llaman sidewinder. Donde un cobra roll encadena dos de estas formas e invierte la marcha del tren, el cobra loop es solo la mitad.',
    relatedTermIds: ['sidewinder', 'cobra-roll', 'vertical-loop', 'inversion', 'intamin'],
    alternateNames: ['Sidewinder'],
  },
  {
    id: 'jojo-roll',
    name: 'Jojo Roll',
    shortDefinition:
      'Un heartline roll lento, tomado nada más salir de la estación, antes de que el tren haya subido nada.',
    definition:
      'Un jojo roll es un heartline roll de 360 grados situado justo después de la estación: el tren se pone boca abajo a poco más que velocidad de paseo. Como apenas hay impulso, los pasajeros quedan colgando de los arneses en lugar de ser presionados contra el asiento, al revés que en la misma figura tomada a toda velocidad más adelante en el trazado.\n\nHydra: The Revenge, en Dorney Park, lo estrenó en 2005. El elemento fue propuesto por el responsable de mantenimiento y construcción del parque, Joe Greene, de quien toma el nombre. Copperhead Strike, en Carowinds, también cuenta con uno.',
    relatedTermIds: ['heartline-roll', 'inversion', 'hangtime', 'lifthill'],
    aliases: ['Jojo Rolls', 'JoJo Roll'],
  },
  {
    id: 'flying-snake-dive',
    name: 'Flying Snake Dive',
    shortDefinition:
      'Un heartline roll que desemboca directamente en un picado retorcido: dos inversiones que lanzan el tren hacia un lado.',
    definition:
      'En un flying snake dive el tren atraviesa un heartline roll y, sin llegar a nivelarse, cae en un picado retorcido que lo envía en la dirección contraria. Cuenta como dos inversiones, tan encadenadas que rara vez se distingue dónde termina una y empieza la otra.\n\nIntamin diseñó el elemento en 2005 para Maverick, en Cedar Point, pero Maverick nunca llegó a tenerlo. En las pruebas se vio que sometería a los pasajeros a fuerzas excesivas, así que se eliminó y se sustituyó por una curva en S antes de la apertura de 2007. El nombre sobrevivió a la instalación para la que fue dibujado. Donde sí se recorre uno es en Storm Runner, en Hersheypark, construido tres años antes: un heartline roll seguido de un medio Immelmann que se lanza hacia el arroyo.',
    relatedTermIds: ['heartline-roll', 'dive-drop', 'immelmann', 'inversion', 'intamin'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'Elemento de RMC que une la primera caída y un barrel roll completo en una sola secuencia: los pasajeros quedan boca abajo mientras todavía bajan.',
    definition:
      'El barrel roll drop es un elemento de Rocky Mountain Construction que junta en un solo movimiento dos cosas que suelen ir por separado, la primera caída y una inversión completa. Al salir de la lifthill, la vía hace girar el tren en un barrel roll completo mientras baja. Los pasajeros quedan boca abajo cerca del punto más empinado de la caída y vuelven a la posición normal cuando el tren llega abajo y pasa al resto del recorrido.\n\nEl elemento es posible gracias a la vía de acero I-Box de RMC, que permite los radios cerrados y la geometría tridimensional complicada que hacen falta para girar y caer a la vez, algo imposible en una vía de madera tradicional. Medusa Steel Coaster en Six Flags México fue de las primeras atracciones con uno; Steel Vengeance en Cedar Point y Zadra en Energylandia también lo tienen.',
    relatedTermIds: ['first-drop', 'hybrid-coaster', 'inversion', 'rmc', 'stall'],
    aliases: ['barrel roll drop', 'RMC barrel roll', 'barrel roll downdrop'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mid-Course Brake Run: una zona de frenado a mitad del recorrido que puede detener el tren del todo, para que circulen varios trenes con seguridad.',
    definition:
      'Un mid-course brake run (MCBR) es una sección de frenos en algún punto del centro del recorrido de una montaña rusa, después de los primeros elementos grandes y antes de la secuencia final. Un trim brake solo reduce la velocidad y deja que el tren siga enseguida; un MCBR es un freno de bloque completo, que puede detener el tren y retenerlo hasta que la siguiente sección de bloque esté libre. Así pueden circular varios trenes a la vez en el mismo circuito sin riesgo de choque, y la capacidad de la atracción sube bastante.\n\nEn un día concurrido, con todos los trenes en marcha, un MCBR bien sincronizado suelta el tren casi enseguida y los pasajeros apenas notan el frenazo. En días más tranquilos, con menos trenes en circulación, la parada puede durar más y ser más brusca. Casi todas las montañas rusas grandes tienen MCBR: los inverted y floorless de B&M, muchas atracciones de Intamin y otras de gran capacidad.',
    relatedTermIds: ['block-brake', 'brake-run', 'ride-capacity', 'stacking', 'trim-brake'],
    aliases: ['mid-course brake run', 'freno de mitad de recorrido', 'freno intermedio', 'MCBR'],
  },
  {
    id: 'interlocking-loops',
    name: 'Loopings Entrelazados',
    shortDefinition:
      'Dos loopings verticales cuyos planos se cruzan y forman una figura de eslabón o de ocho.',
    definition:
      'Los loopings entrelazados (en inglés interlocking loops) son dos loopings verticales colocados de modo que sus planos se cortan, normalmente casi en ángulo recto. Desde ciertos ángulos parece que un looping atraviesa al otro, como un eslabón de cadena o un ocho enorme que sale del suelo. Construir dos loopings que se cruzan sin que las vías se toquen es complicado, y el conjunto se ve desde lejos en el parque.\n\nSe asocian sobre todo a los inverted coasters de B&M y a las montañas rusas de sentado con muchas inversiones. Dragon Khan, en PortAventura, tiene loopings entrelazados dentro de su recorrido de ocho inversiones.',
    relatedTermIds: ['b-and-m', 'inversion', 'vertical-loop'],
    aliases: ['loopings entrelazados', 'interlocking loops', 'loops cruzados'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'El trinquete de la lifthill que impide que el tren ruede hacia atrás; de ahí viene el clic-clac.',
    definition:
      'Un anti-rollback (también llamado «perro anti-rollback») es un mecanismo de seguridad instalado a lo largo de la parte inferior de una lifthill. Mientras el tren sube, unos trinquetes metálicos con muelle van pasando sobre una hilera de dientes de la estructura. Si la cadena o el mecanismo de tracción fallaran, los trinquetes se engancharían en los dientes y el tren no podría retroceder. El paso de los trinquetes sobre los dientes produce el clic-clac rítmico de las montañas rusas tradicionales.\n\nEn las montañas rusas modernas con lifthill de cable o propulsión LSM, el anti-rollback se sustituye a menudo por frenos electromagnéticos silenciosos, y por eso algunas lifthills nuevas se oyen mucho menos.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'rollback'],
    aliases: ['anti-rollback device', 'trinquete anti-retroceso', 'clic-clac'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      'Partes de la estructura que pasan justo por encima de la cabeza de los pasajeros a gran velocidad; parece que van a darles.',
    definition:
      'Los head choppers son elementos de diseño hechos a propósito: la estructura de soporte, los travesaños, los túneles u otros tramos de vía pasan justo por encima de la cabeza de los pasajeros cuando el tren va a toda velocidad. Por lo cerca que pasan y por el momento en que lo hacen, parece que algo va a golpear a los pasajeros, aunque no hay peligro real, porque el margen está calculado con precisión. Se nota más cuando el pasajero no lo ve venir.\n\nSe asocian sobre todo a las montañas rusas de madera muy compactas y a los inverted coasters, en los que los trenes colgantes pasan muy cerca de soportes y de otros tramos de vía.',
    relatedTermIds: ['inverted-coaster', 'roller-coaster-element', 'twister-coaster'],
    aliases: ['head chopper', 'casi impacto', 'near miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'Cuando un operador aprieta demasiado la barra de regazo o el arnés contra el pasajero, que pierde comodidad y el airtime para el que está diseñada la atracción.',
    definition:
      'Hay stapling cuando un operador, a propósito o por exceso de precaución, empuja la barra de regazo o el arnés de hombro contra un pasajero mucho más de lo que exige la seguridad. El término viene de la sensación de estar «grapado» al asiento. En las montañas rusas centradas en el airtime, la barra tiene que quedar lo bastante suelta para que el pasajero se levante un poco del asiento en la cresta de las colinas, y eso es el airtime. Un pasajero «grapado» va pegado al asiento todo el recorrido y no flota, por bien diseñadas que estén las colinas.\n\nSe nota sobre todo en las montañas rusas de madera e híbridas, donde el airtime es lo principal. Hay parques que aprietan siempre la barra y otros que la dejan más suelta.',
    relatedTermIds: [
      'airtime',
      'ejector-airtime',
      'lap-bar',
      'restraint-freedom',
      'shoulder-harness',
    ],
    aliases: ['stapled', 'arnés demasiado ajustado', 'barra demasiado apretada'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Cuando un tren de montaña rusa pierde suficiente velocidad a mitad del recorrido como para quedar atrapado en un punto bajo de la vía y no poder completar el circuito.',
    definition:
      'El valleying ocurre cuando un tren, habiendo perdido demasiada energía cinética durante la vuelta, no tiene impulso suficiente para superar el siguiente elemento y se detiene, o rueda hacia atrás, en un valle entre dos puntos altos de la vía. Como el tren está en un punto bajo y no en una zona de frenos ni en la estación, los sistemas normales de operación no pueden moverlo. Normalmente el personal de mantenimiento tiene que empujarlo o remolcarlo con un cable hasta el siguiente punto alto y evacuar a los pasajeros.\n\nEl valleying es raro en condiciones normales de operación, ya que las atracciones están diseñadas con amplios márgenes de velocidad. Es más probable con clima muy frío (cuando los rodamientos funcionan rígidos), tras un frenado excesivo por trim brakes, o en montañas rusas de madera antiguas cuya geometría de vía ha variado con el tiempo.',
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    aliases: ['valleyed', 'tren atascado', 'tren varado'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'Un tipo de montaña rusa con pequeños vehículos individuales y un circuito compacto de curvas cerradas y planas en el borde de plataformas elevadas.',
    definition:
      'Una wild mouse (ratón salvaje) usa vehículos pequeños de dos a cuatro personas en lugar de trenes largos. Lo típico son las curvas cerradas en horquilla, con poco peralte, en el borde exterior de la vía. Otras montañas rusas peraltan mucho las curvas; aquí, con tan poco peralte, los pasajeros salen despedidos contra el lateral del vehículo, y por la inercia la curva parece llegar más tarde de lo esperado. Da la sensación de que el vehículo se va a salir de la vía.\n\nLas wild mouse aprovechan mucho el espacio: apilan niveles de curvas en horquilla y meten mucha vía en poca superficie. Las hay en parques de todo el mundo y de todos los tamaños. Entre los fabricantes están Mack Rides, Maurer y Gerstlauer.',
    relatedTermIds: [
      'bobsled-coaster',
      'gerstlauer',
      'mack-rides',
      'spinning-coaster',
      'steel-coaster',
    ],
    aliases: ['wild mouse coaster', 'ratón salvaje', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: 'Montaña Rusa 4D',
    shortDefinition:
      'Un tipo de montaña rusa con los asientos montados en brazos giratorios a los dos lados del tren; giran con independencia de la dirección de la marcha.',
    definition:
      'En una montaña rusa 4D (cuarta dimensión) los asientos van montados en brazos giratorios a la izquierda y a la derecha de cada coche, en lugar de ir fijos al tren. Giran hacia delante o hacia atrás con independencia de la dirección del tren, bien guiados por un raíl junto a la vía principal (que fija la posición del asiento en cada punto del recorrido), bien libremente, según la gravedad y el reparto del peso de los pasajeros. Así los pasajeros pueden ir mirando hacia abajo en una caída, quedar boca abajo en una curva o girar sobre varios ejes a la vez en las inversiones.\n\nArrow Dynamics desarrolló el concepto y S&S Worldwide lo perfeccionó después. X2, en Six Flags Magic Mountain (California), abrió en 2002 como la primera montaña rusa 4D del mundo. Eejanaika, en Fuji-Q Highland (Japón), tiene el récord mundial de inversiones, en parte porque los giros de los asientos se suman al recuento.',
    relatedTermIds: [
      'arrow-dynamics',
      'inversion',
      'inverted-coaster',
      's-and-s-worldwide',
      'spinning-coaster',
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
      'Un out-and-back es uno de los dos tipos básicos de recorrido de montaña rusa. El tren sale de la estación y avanza más o menos en línea recta, normalmente por una serie de colinas pensadas para el airtime; al final del terreno da la vuelta y regresa por un tramo paralelo al de ida. Los dos tramos casi nunca se cruzan, y el plano es largo y estrecho.\n\nSe asocia sobre todo a las montañas rusas de madera tradicionales: la velocidad ganada en las colinas largas de la ida se aprovecha a la vuelta con colinas cada vez más cortas y rápidas, con mucho floater airtime. Ejemplos: The Voyage en Holiday World y los distintos modelos del tipo Racer.',
    relatedTermIds: ['airtime', 'airtime-hill', 'twister-coaster', 'wooden-coaster'],
    aliases: ['out and back', 'trazado out-and-back', 'ida y vuelta'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'Un recorrido de montaña rusa que gira en espiral y se cruza sobre sí mismo para meter muchos elementos en poco espacio.',
    definition:
      'Un twister (también llamado recorrido de ciclón) es un diseño de montaña rusa en el que la vía gira en espiral, se pliega sobre sí misma y se cruza una y otra vez, en lugar de seguir los dos tramos del out-and-back. Lo que lo define es que el tren pasa a menudo muy cerca de otros tramos de la misma vía, en otras direcciones y a otras alturas, con efectos head-chopper y una estructura muy enrevesada.\n\nLos twisters aprovechan bien el espacio: caben mucha vía y mucho desnivel en poca superficie, y por eso los eligen muchos parques con poco sitio. Entre los twisters de madera hay clásicos como el Twister de Gröna Lund, en Estocolmo; entre los de acero, muchos diseños de B&M e Intamin.',
    relatedTermIds: ['head-choppers', 'helix', 'out-and-back', 'wooden-coaster'],
    aliases: ['twister layout', 'ciclón', 'trazado twister'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error: la desviación media, en minutos, entre el tiempo de espera previsto y el real.',
    definition:
      'El MAE (Mean Absolute Error, error absoluto medio) es la medida de precisión estándar de park.fan. Es la diferencia media, en minutos, entre cada tiempo de espera predicho y el tiempo real registrado en la atracción. Un MAE de 8 minutos significa que las predicciones se desvían 8 minutos de media.\n\nEl MAE trata cada error por igual: un error de 5 minutos y uno de 15 se promedian linealmente. Por eso se entiende fácil: MAE = 10 quiere decir que, de media, las predicciones fallan por 10 minutos. Un MAE más bajo siempre implica predicciones más precisas.',
    relatedTermIds: ['ai-forecast', 'mape', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error: parecido al MAE, pero castiga más los errores de predicción grandes.',
    definition:
      'El RMSE (Root Mean Square Error, raíz del error cuadrático medio) mide la precisión elevando al cuadrado cada error antes de promediarlos. Un error grande, como una cola predicha con 40 minutos de desviación, pesa mucho más en el RMSE que un error de 5 minutos. El RMSE siempre es igual o mayor que el MAE.\n\nSi el RMSE es mucho mayor que el MAE, el modelo comete de vez en cuando errores extremos, aunque la mayoría de las predicciones se acerquen a la realidad. Ambas métricas se muestran en directo en la página de inicio de park.fan.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'r-squared'],
    aliases: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      'Mean Absolute Percentage Error: el error de predicción expresado como porcentaje del tiempo de espera real.',
    definition:
      'El MAPE (Mean Absolute Percentage Error, error absoluto porcentual medio) expresa la precisión como porcentaje en lugar de en minutos. En vez de «8 minutos de desviación», da «una desviación del 15 % del tiempo de espera real». Así es más fácil comparar la precisión entre atracciones con esperas muy distintas, porque un error de 10 minutos pesa mucho más en una atracción que suele tener 15 minutos que en una de 90.\n\nEl MAPE puede ser engañosamente alto cuando los tiempos de espera reales son muy cortos. Por eso park.fan lo muestra siempre junto al MAE y el RMSE.',
    relatedTermIds: ['ai-forecast', 'mae', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'R cuadrado: mide hasta qué punto el modelo de IA explica los patrones de los tiempos de espera reales (de 0 a 1; cuanto más alto, mejor).',
    definition:
      'El R² (R cuadrado, o coeficiente de determinación) mide qué proporción de la variación en los tiempos de espera reales logra explicar el modelo. Un valor de 1,0 significaría predicciones perfectas; 0,0 significa que el modelo no explica nada más allá de un promedio simple. En la práctica, valores superiores a 0,7 indican un buen modelo; superiores a 0,9, excelente.\n\nPara las predicciones de tiempos de espera, lograr un R² alto es difícil porque en las colas influyen factores imprevisibles. El R² de park.fan sale de comparar todas las predicciones ya comprobadas y se recalcula cada día.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'rmse'],
    aliases: ['R-squared', 'coeficiente de determinación'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Atracción de temporada',
    shortDefinition:
      'Una atracción, un show o una experiencia que solo funciona en ciertos meses del año, como una pista de hielo en invierno o una atracción acuática en verano.',
    definition:
      'Una atracción de temporada es una atracción, show o experiencia que el parque solo ofrece durante un período definido del año. Las pistas de hielo, las pistas de trineo y los shows invernales suelen funcionar de noviembre a febrero; los toboganes acuáticos, las zonas de juegos con agua y los espectáculos al aire libre de mayo a septiembre. Algunas atracciones de temporada están vinculadas a eventos específicos como Halloween o Navidad.\n\nEn park.fan, las atracciones y shows de temporada se detectan automáticamente a partir de datos históricos de operación. Fuera de sus meses se ocultan en las pestañas del parque y en el mapa, para que en las listas quede lo que puede estar abierto hoy. Un badge de temporada (❄️ Invierno, ☀️ Verano o 🍃 genérico) aparece en cada tarjeta correspondiente. Cuando la atracción está fuera de temporada, el badge aparece atenuado. Un botón de filtro en las pestañas permite mostrar las entradas ocultas cuando sea necesario.',
    relatedTermIds: ['crowd-calendar', 'offseason', 'refurbishment'],
    aliases: ['atracción estacional', 'show de temporada', 'experiencia temporal'],
  },
  {
    id: 'gravity-group',
    name: 'The Gravity Group',
    shortDefinition:
      'Una empresa de diseño estadounidense especializada en montañas rusas de madera modernas.',
    definition:
      'The Gravity Group es una empresa estadounidense de ingeniería y diseño de montañas rusas de madera modernas. La formaron antiguos empleados de Custom Coasters International (CCI), y sus recorridos suelen ser compactos y retorcidos, al límite de lo que admite una estructura de madera. Muchos de sus diseños usan trenes «Timberliner», que pueden pasar por maniobras cerradas y retorcidas que los trenes de madera tradicionales no admiten. Son obra suya Voyage en Holiday World y Wodan - Timburcoaster en Europa-Park.',
    relatedTermIds: ['hybrid-coaster', 'rmc', 'wooden-coaster'],
    aliases: ['Gravity Group'],
  },
  {
    id: 'sally-dark-rides',
    name: 'Sally Dark Rides',
    shortDefinition: 'Un fabricante de atracciones oscuras (dark rides) y animatrónicos.',
    definition:
      'Sally Dark Rides (antes Sally Corporation) diseña y construye dark rides y animatrónicos. Tiene su sede en Florida y hace atracciones «llave en mano»: se encarga de la historia, los decorados, los sistemas de transporte y la animación de los personajes. Sus trabajos más conocidos son dark rides interactivos en los que los visitantes disparan con blasters para sumar puntos, como las distintas atracciones Justice League: Battle for Metropolis y muchas atracciones de Scooby-Doo en todo el mundo.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride'],
    aliases: ['Sally Corporation'],
  },
  {
    id: 'mondial',
    name: 'Mondial',
    shortDefinition:
      'Un fabricante holandés de atracciones planas (flat rides) de alta intensidad.',
    definition:
      'Mondial es un fabricante con sede en los Países Bajos especializado en atracciones planas grandes y de alta intensidad, muchas con varios ejes de rotación a la vez. Sus productos más conocidos son el Top Scan, el Shake y el Turbine. Hay atracciones de Mondial en grandes parques temáticos y en las ferias itinerantes europeas.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'top-spin'],
  },
  {
    id: 'kmg',
    name: 'KMG',
    shortDefinition: 'Un fabricante holandés de atracciones planas, sobre todo transportables.',
    definition:
      'KMG (Kermis Machinebouw Gaasbeek) es una empresa de ingeniería holandesa y uno de los grandes fabricantes de atracciones planas. Empezó con atracciones para ferias itinerantes; como son fiables y fáciles de mantener, hoy también las hay fijas en parques temáticos. Se le atribuye la invención del Afterburner (de tipo Frisbee) y del Freak Out.',
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition:
      'Una empresa de tecnología que desarrolla sistemas de transporte avanzados y bases de movimiento.',
    definition:
      'Oceaneering Entertainment Systems (OES), una división de Oceaneering International, fabrica tecnología para atracciones. A partir de su experiencia en robótica submarina desarrolló los vehículos con base de movimiento de The Amazing Adventures of Spider-Man, en Universal Islands of Adventure. También fabrica sistemas de transporte sin rieles (trackless) y figuras animatrónicas complejas, y aporta la técnica de muchas atracciones de parques temáticos.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
  },
  {
    id: 'etf-ride-systems',
    name: 'ETF Ride Systems',
    shortDefinition:
      'Un fabricante holandés especializado en sistemas de transporte sin rieles y multi-motores.',
    definition:
      'ETF Ride Systems es una empresa holandesa especializada en plataformas de transporte flexibles, sobre todo vehículos sin rieles. Sus vehículos se guían por cable o por posicionamiento local y se mueven libremente por un suelo plano, así que pueden seguir recorridos no lineales y «bailar». Usan sistemas de ETF dark rides como Symbolica en Efteling y Ratatouille: L’Aventure Totalement Toquée de Rémy en Disneyland Paris y Walt Disney World.',
    relatedTermIds: ['dark-ride', 'oceaneering', 'trackless-ride'],
  },
  {
    id: 'chance-rides',
    name: 'Chance Rides',
    shortDefinition:
      'Un fabricante estadounidense de montañas rusas, atracciones planas y sistemas de transporte.',
    definition:
      'Chance Rides es un fabricante estadounidense que ha hecho carruseles, trenes en miniatura y montañas rusas de alta velocidad. Tras comprar los activos de D.H. Morgan Manufacturing, entró en el mercado de los hypercoasters. Hoy se le conoce por su modelo «Hyper GT-X» y por atracciones planas clásicas como el Zipper y el Wipeout, y es uno de los principales proveedores de tranvías para parques y de carruseles.',
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'steel-coaster'],
  },
  {
    id: 'non-inverting-loop',
    name: 'Non-Inverting Loop',
    shortDefinition:
      'Un elemento de montaña rusa en forma de bucle que gira para que los pasajeros nunca queden totalmente boca abajo.',
    definition:
      'Un non-inverting loop es un elemento de montaña rusa que imita la forma de un bucle vertical tradicional pero incorpora un giro en el ápice para que el tren permanezca en posición vertical. Los visitantes pasan por algo que parece un bucle, con fuertes G verticales, sin llegar a ponerse boca abajo. Lo popularizó Maurer Rides en sus montañas rusas X-Car (como Hollywood Rip Ride Rockit) y desde entonces ha sido utilizado por otros fabricantes como Mack Rides.',
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop'],
    aliases: ['Non-Inverting Loops', 'Bucle no inversor'],
  },
  {
    id: 'pretzel-knot',
    name: 'Pretzel Knot',
    shortDefinition: 'Un elemento grande en forma de pretzel donde la vía se cruza sobre sí misma.',
    definition:
      'Un pretzel knot (nudo de pretzel) es un elemento de montaña rusa en el que la entrada y la salida se cruzan y dibujan una forma parecida a un pretzel. No hay que confundirlo con el «pretzel loop» de las montañas rusas voladoras; el pretzel knot es más raro y lo tienen montañas rusas como Banshee en Kings Island. Son dos inversiones que se superponen, un dive loop seguido de un Immelmann, con G fuertes.',
    relatedTermIds: ['corkscrew', 'inversion', 'pretzel-loop'],
    aliases: ['Pretzel Knots', 'Nudo de pretzel'],
  },
  {
    id: 'raven-turn',
    name: 'Raven Turn',
    shortDefinition:
      'Un elemento en montañas rusas 4D que consiste en medio bucle que cambia la orientación del asiento.',
    definition:
      'Un raven turn es un elemento típico de las montañas rusas de cuarta dimensión (como X2 o Eejanaika). Es medio bucle que se puede hacer «por dentro» o «por fuera». Como en las montañas rusas 4D los asientos giran con independencia de la vía, el raven turn se combina a menudo con un giro del asiento, y al pasajero le parece que el mundo da una voltereta a su alrededor.',
    relatedTermIds: ['fourth-dimension-coaster', 'inversion', 'wing-coaster'],
    aliases: ['Raven Turns'],
  },
  {
    id: 'dive-drop',
    name: 'Dive Drop',
    shortDefinition:
      'Una inversión en montañas rusas de ala (wing coasters) que comienza con un giro en línea en la cima de una colina de elevación.',
    definition:
      'Un dive drop es un elemento de montaña rusa utilizado casi exclusivamente en las B&M Wing Coasters. Sirve como la caída inicial, donde el tren deja la colina de elevación (lift hill), gira lentamente 180 grados hasta quedar boca abajo y luego cae en medio bucle. Da bastante hangtime, sobre todo en los asientos exteriores.',
    relatedTermIds: ['first-drop', 'hangtime', 'inversion', 'wing-coaster'],
    aliases: ['Dive Drops'],
  },
  {
    id: 'outerbanked-turn',
    name: 'Outerbanked Turn',
    shortDefinition:
      'Un giro donde la vía está inclinada hacia el lado opuesto a la dirección del giro.',
    definition:
      'Un outerbanked turn es una curva en la que la vía se peralta al revés de lo habitual. En lugar de inclinarse hacia dentro de la curva para anular las fuerzas laterales, se inclina hacia fuera, y el pasajero nota que lo lanzan hacia el exterior del vehículo. Es típico de fabricantes modernos como RMC e Intamin, y mezcla fuerzas G laterales y negativas (airtime).',
    relatedTermIds: ['airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['Outerbanked Turns', 'Curva peraltada exterior'],
  },
  {
    id: 'camelback',
    name: 'Camelback',
    shortDefinition:
      'Una serie de jorobas o colinas diseñadas para proporcionar tiempo en el aire (airtime).',
    definition:
      'Un camelback (o colina camelback) es un elemento clásico de montaña rusa que consiste en una gran colina en forma de joroba. A medida que el tren corona la colina, los pasajeros experimentan "floater airtime", la sensación de elevarse de sus asientos. Son la base de los hypercoasters y suelen ir varios seguidos, con un momento de ingravidez en cada uno.',
    relatedTermIds: ['airtime', 'airtime-hill', 'hyper-coaster', 'quad-down'],
    aliases: ['Camelbacks', 'Lomo de camello', 'Colina de aire'],
  },
  {
    id: 'zero-g-stall',
    name: 'Zero-G Stall',
    shortDefinition:
      'Una inversión donde el tren permanece boca abajo mientras viaja a lo largo de una sección recta de la vía.',
    definition:
      'Un zero-g stall es un elemento donde la vía gira 180 grados hasta una posición invertida, permanece boca abajo durante una sección recta o ligeramente curva prolongada, y luego vuelve a girar. A diferencia del zero-g roll, que gira sin parar, en el stall la inversión se mantiene, y los pasajeros flotan un rato colgados de sus arneses. Lo popularizó RMC en sus montañas rusas híbridas e I-Box.',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'stall', 'zero-g-roll'],
    aliases: ['Zero-G Stalls'],
  },
  {
    id: 'gp',
    name: 'GP (General Public)',
    shortDefinition: 'Un término de los aficionados para los visitantes que no lo son.',
    definition:
      'GP, o "General Public", es un término de jerga de la comunidad de aficionados a los parques temáticos y las montañas rusas para describir a los visitantes promedio de los parques que no comparten el mismo nivel de conocimiento técnico o pasión por las atracciones. El término se usa a menudo cuando se discute cómo los parques comercializan sus atracciones o cómo reaccionan los visitantes a las operaciones y cierres. Generalmente no es usado por los propios parques.',
    relatedTermIds: ['credit', 'ert', 'fanboy', 'hype-train', 'mackprodukt', 'touring-plan'],
    aliases: ['General Public', 'Público general'],
  },
  {
    id: 'strata-coaster',
    name: 'Strata Coaster',
    shortDefinition:
      'Una montaña rusa con una altura o caída que supera los 400 pies (122 metros).',
    definition:
      'Una strata coaster es una montaña rusa que alcanza una altura de 400 pies (122 metros) o más. Esta clasificación fue acuñada originalmente por Cedar Point para la apertura de Top Thrill Dragster. Hay muy pocas, porque cuestan mucho y son muy complicadas de construir. Hasta hoy solo se han construido unas pocas, entre ellas Kingda Ka en Six Flags Great Adventure.',
    relatedTermIds: ['giga-coaster', 'hyper-coaster', 'launch-coaster'],
    aliases: ['Strata Coasters'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    shortDefinition: 'El acto de enviar un vehículo o tren desde la estación.',
    definition:
      'Un dispatch (despacho o salida) ocurre cuando los operadores de la atracción autorizan la salida de un vehículo e inician su ciclo. De la rapidez de los despachos depende la capacidad («visitantes por hora»). Si los despachos son demasiado lentos, puede haber «stacking» (apilamiento): los trenes siguientes tienen que esperar fuera de la estación a que salga el anterior. Los aficionados cronometran a menudo los «tiempos de despacho» para medir lo bien que opera un parque.',
    relatedTermIds: ['queue-line', 'ride-capacity', 'stacking'],
    aliases: ['Dispatches', 'Despacho', 'Salida de estación'],
  },
  {
    id: 'near-miss',
    name: 'Near-Miss',
    shortDefinition:
      'Un elemento de diseño que crea la ilusión de que el pasajero va a colisionar con una estructura.',
    definition:
      'Un near-miss (o efecto de casi choque) es un elemento temático o estructural colocado muy cerca del recorrido de la atracción. Los pasajeros siempre van dentro de la «envolvente de seguridad» (clearance envelope), pero por la velocidad y la perspectiva parece que van a golpear una viga, la pared de un túnel u otra parte de la vía. Se diseñan con cuidado para que la velocidad y el peligro se noten más.',
    relatedTermIds: ['clearance-envelope', 'foot-chopper', 'head-choppers'],
    aliases: ['Near-Misses', 'Choque cercano'],
  },
  {
    id: 'clearance-envelope',
    name: 'Clearance Envelope',
    shortDefinition:
      'El espacio de seguridad alrededor de un vehículo que debe permanecer libre de cualquier obstrucción.',
    definition:
      'La clearance envelope (envolvente de seguridad o de despeje) es el espacio tridimensional calculado alrededor de un vehículo de atracción que debe mantenerse completamente libre de estructuras, soportes o vegetación. Esto asegura que incluso los pasajeros más altos con los brazos o las piernas extendidos no puedan hacer contacto con nada fuera del vehículo. Durante las pruebas, los parques a menudo usan "reach envelopes" (marcos físicos unidos al tren) para verificar que ninguna parte del entorno invade esta zona de seguridad.',
    relatedTermIds: ['foot-chopper', 'head-choppers', 'near-miss', 'testing'],
    aliases: ['Clearance Envelopes', 'Envolvente de seguridad'],
  },
  {
    id: 'testing',
    name: 'Pruebas',
    shortDefinition:
      'Las vueltas que una atracción da vacía: antes de abrir, cada mañana y tras cada reparación.',
    definition:
      'Las pruebas son todo lo que separa una atracción terminada de un tren cargado. En la puesta en marcha, muñecos llenos de agua o sacos de arena ocupan el lugar de los pasajeros, el sistema se somete a miles de ciclos y las comprobaciones del gálibo confirman que nada a lo largo del recorrido está lo bastante cerca como para que un brazo estirado lo toque.\n\nNunca terminan del todo. Los parques dan vueltas en vacío cada mañana antes de los primeros visitantes, y de nuevo tras cualquier avería o mantenimiento; por eso una atracción puede figurar como abierta y no embarcar a nadie. Las novedades se prueban a la vista de todos: los trenes pasan por encima de los visitantes durante semanas antes de la apertura. Una apertura suave es en sí misma una prueba, esta vez con pasajeros de verdad.',
    relatedTermIds: ['clearance-envelope', 'soft-opening', 'downtime', 'refurbishment'],
    aliases: ['Test runs', 'Test cycles'],
  },
  {
    id: 'kuka',
    name: 'KUKA',
    shortDefinition:
      'Un fabricante alemán de robots industriales cuyos brazos de fábrica se adaptaron para llevar pasajeros.',
    definition:
      'KUKA (siglas de Keller und Knappich Augsburg, donde sigue teniendo su sede) fabrica los brazos robóticos naranjas de las cadenas de montaje de automóviles. El KR 500, un modelo pesado, se adaptó al uso en atracciones con el nombre de RoboCoaster: un banco de cuatro plazas atornillado al extremo del brazo, libre de cabecear, balancearse y llevar a los pasajeros por movimientos que ninguna vía fija podría producir.\n\nLa instalación más conocida es Harry Potter and the Forbidden Journey, inaugurada en 2010, donde los bancos RoboCoaster G2 van montados sobre bases móviles: los brazos recorren así los decorados en lugar de actuar en un solo punto. Sum of All Thrills en Epcot (2009-2016) invertía el principio: los visitantes diseñaban el perfil de su propia montaña rusa en un terminal y un brazo KUKA a medida lo recorría después.',
    relatedTermIds: ['dynamic-attractions', 'dark-ride', 'motion-simulator', 'flying-theater'],
    alternateNames: ['Keller und Knappich Augsburg'],
  },
  {
    id: 'foot-chopper',
    name: 'Foot-Chopper',
    shortDefinition:
      'Un efecto de near-miss diseñado específicamente para montañas rusas donde las piernas de los pasajeros están expuestas.',
    definition:
      'Un foot-chopper es un tipo específico de efecto near-miss que se encuentra en montañas rusas invertidas, suspendidas o sin suelo (floorless). Consiste en colocar soportes de vía, agua o elementos de tematización cerca de donde pasan los pies de los pasajeros. Por un momento parece que los pies del pasajero van a golpear el objeto.',
    relatedTermIds: [
      'clearance-envelope',
      'head-choppers',
      'inverted-coaster',
      'near-miss',
      'wing-coaster',
    ],
    aliases: ['Foot-Choppers'],
  },
  {
    id: 'projection-mapping',
    name: 'Projection Mapping',
    shortDefinition:
      'Tecnología utilizada para proyectar vídeo sobre superficies no planas como edificios o decorados de atracciones.',
    definition:
      'El projection mapping (o videomapeo) es una técnica que usa como pantalla de vídeo objetos a menudo irregulares, como las paredes de un castillo o los decorados de un dark ride. Un software especializado «mapea» la geometría 3D del objeto, y los proyectores crean ilusiones de movimiento, transformación y profundidad. Se usa mucho en espectáculos nocturnos y en dark rides modernos para cambiar el entorno sin decorados físicos.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride', 'pre-show'],
    aliases: ['Video mapping', 'Videomapeo', 'Mapeo digital'],
  },
  {
    id: 'omnimover',
    name: 'Omnimover',
    shortDefinition:
      'Un sistema de transporte con una cadena continua de vehículos que se mueven a una velocidad constante.',
    definition:
      'El Omnimover es un sistema de transporte desarrollado por Disney que presenta un bucle continuo de vehículos. Debido a que los vehículos nunca dejan de moverse, el sistema tiene una capacidad muy alta. Los vehículos pueden girar para que los visitantes miren justo hacia la escena que los diseñadores quieren que vean. Ejemplos: The Haunted Mansion y Spaceship Earth. Otros fabricantes han desarrollado desde entonces sistemas de cadena continua similares.',
    relatedTermIds: ['dark-ride', 'ride-capacity', 'trackless-ride'],
    aliases: ['Omnimovers'],
  },
  {
    id: 'pepper-ghost',
    name: 'Pepper’s Ghost',
    shortDefinition:
      'Una ilusión clásica que utiliza cristal y luz para crear fantasmas "transparentes".',
    definition:
      'Pepper’s Ghost es una técnica de ilusión teatral utilizada para crear fantasmas transparentes. Funciona colocando una gran lámina de cristal en ángulo entre el público y una escena; al iluminar un objeto en una habitación oculta para que su reflejo aparezca en el cristal, parece que una figura translúcida está de pie en la escena principal. El uso más conocido de esta técnica del siglo XIX, a gran escala, es la escena del salón de baile de la Haunted Mansion de Disney.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'projection-mapping'],
    aliases: ['Pepper’s Ghost', 'Fantasma de Pepper'],
  },
  {
    id: 'dynamic-attractions',
    name: 'Dynamic Attractions',
    shortDefinition:
      'Fabricante canadiense de atracciones complejas, conocido por sus sistemas de brazo robótico.',
    definition:
      'Dynamic Attractions es una empresa canadiense que diseña y construye atracciones con mucha técnica. Su sistema de «Brazo Robótico» (el de Harry Potter and the Forbidden Journey) lleva un brazo KUKA sobre raíles. Su catálogo incluye teatros voladores, vehículos de dark ride modernos y montañas rusas complejas como el SFX Coaster.',
    relatedTermIds: ['dark-ride', 'flying-theater', 'kuka', 'motion-simulator'],
    aliases: ['Dynamic Structures'],
  },
  {
    id: 'flying-theater',
    name: 'Teatro Volador',
    shortDefinition:
      'Simulador donde los asientos se elevan frente a una pantalla esférica gigante para simular el vuelo.',
    definition:
      "Un Teatro Volador (Flying Theater) es una atracción que combina un simulador de vuelo con una película en una pantalla enorme. Los pasajeros van sentados en filas que una estructura mecánica mueve delante de una gran pantalla cóncava. Con los pies colgando y los asientos moviéndose al ritmo de la película, parece que se vuela. Ejemplos: Voletarium (Europa-Park) y Soarin' (Disney).",
    relatedTermIds: ['dark-ride', 'dynamic-attractions', 'motion-simulator', 'pre-show'],
    aliases: ['Flying Theater', 'simulador de vuelo'],
  },
  {
    id: 'shuttle-coaster',
    name: 'Shuttle Coaster',
    shortDefinition:
      'Montaña rusa que no forma un circuito cerrado y realiza el recorrido hacia adelante y hacia atrás.',
    definition:
      'Una Shuttle Coaster es un tipo de montaña rusa en la que el tren recorre la vía en los dos sentidos, en lugar de volver a la estación por un circuito cerrado. Estas atracciones suelen tener extremos abiertos (spikes) donde el tren cambia de sentido por gravedad o impulso. Requieren menos espacio que las de circuito cerrado. Un ejemplo clásico es el Boomerang de Vekoma.',
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
    aliases: ['montaña rusa de vaivén'],
  },
  {
    id: 'carousel',
    name: 'Tiovivo',
    shortDefinition: 'Atracción clásica con una plataforma giratoria y figuras que suben y bajan.',
    definition:
      'El tiovivo o carrusel es una de las atracciones más tradicionales. Consiste en una plataforma circular giratoria con asientos en forma de animales (normalmente caballos) o carruajes. En muchos modelos, las figuras también suben y bajan. Es una atracción familiar, a menudo decorada en estilo barroco o victoriano.',
    relatedTermIds: ['flat-ride', 'themed-land'],
    aliases: ['carrusel', 'tiovivo'],
  },
  {
    id: 'walkthrough',
    name: 'Recorrido a pie',
    shortDefinition:
      'Atracción que los visitantes exploran caminando en lugar de ir sentados en un vehículo.',
    definition:
      'Un Walkthrough es una atracción donde los visitantes caminan a su propio ritmo por espacios tematizados. Pueden ser senderos de aventura, casas del terror (mazes) o exhibiciones interactivas. A diferencia de un dark ride, no hay sistema de transporte, y el visitante puede interactuar más con el entorno. Ejemplos habituales son las casas encantadas de Halloween.',
    relatedTermIds: ['dark-ride', 'funhouse', 'themed-land'],
    aliases: ['Walkthrough', 'pasaje del terror'],
  },
  {
    id: 'funhouse',
    name: 'Casa de la risa',
    shortDefinition:
      'Atracción de recorrido con obstáculos, ilusiones ópticas y elementos móviles en el suelo.',
    definition:
      'Una Casa de la Risa (Funhouse) es un tipo de recorrido a pie diseñado para desafiar la agilidad y percepción de los visitantes de forma lúdica. Incluye elementos como cintas transportadoras, barriles giratorios, espejos deformantes y suelos vibratorios. Tienen su origen en las ferias pero son comunes en parques como atracciones familiares interactivas.',
    relatedTermIds: ['flat-ride', 'walkthrough'],
    aliases: ['Funhouse', 'casa de los espejos'],
  },
  {
    id: 'ferris-wheel',
    name: 'Noria',
    shortDefinition:
      'Gran rueda que gira verticalmente con góndolas colgantes para disfrutar de las vistas.',
    definition:
      'La noria es una atracción clásica de parques y ferias: una enorme rueda vertical con góndolas para pasajeros. Como gira despacio, desde arriba se ve todo el parque y sus alrededores. Las hay pequeñas, para familias, y gigantescas, como el London Eye.',
    relatedTermIds: ['flat-ride', 'opening-hours'],
    aliases: ['rueda de la fortuna'],
  },
  {
    id: 'spike',
    name: 'Spike',
    shortDefinition:
      'Extremo vertical o muy inclinado de la vía en una montaña rusa de circuito abierto.',
    definition:
      'El Spike es el tramo de vía al final de una Shuttle Coaster. El tren sube en vertical o con mucha pendiente hasta detenerse y, por gravedad, cambia de sentido y recorre la pista hacia atrás. Los modelos modernos pueden alcanzar alturas enormes o incluso superar la verticalidad.',
    relatedTermIds: ['rollback', 'shuttle-coaster', 'steel-coaster'],
    aliases: ['vía vertical'],
  },
  {
    id: 'forced-perspective',
    name: 'Perspectiva forzada',
    shortDefinition:
      'Ilusión óptica que hace que edificios u objetos parezcan más grandes o lejanos mediante el diseño de escalas.',
    definition:
      'La perspectiva forzada es una técnica muy usada en la tematización de parques. Al reducir el tamaño de las plantas superiores de los edificios, se engaña al ojo para que crea que la estructura es mucho más alta de lo que realmente es. Disney usa esta técnica en Main Street para que sus edificios parezcan más imponentes.',
    relatedTermIds: ['themed-land'],
    aliases: ['perspectiva forzada'],
  },
  {
    id: 'show-building',
    name: 'Edificio del espectáculo',
    shortDefinition:
      'Edificio industrial que alberga la tecnología y las escenas de una dark ride.',
    definition:
      'El Show Building es la estructura externa de una atracción de interior. Mientras la entrada suele estar muy tematizada, el resto del edificio suele ser un almacén funcional oculto por vegetación o rocas artificiales. En su interior se encuentran el sistema de transporte, los decorados, la iluminación y los efectos de la dark ride.',
    relatedTermIds: ['dark-ride', 'forced-perspective', 'themed-land'],
    aliases: ['pabellón de la atracción'],
  },
  {
    id: 'practical-effects',
    name: 'Efectos prácticos',
    shortDefinition:
      'Efectos especiales reales y tangibles en una atracción, a diferencia de las proyecciones digitales.',
    definition:
      'Los efectos prácticos son todos aquellos efectos físicos en una atracción que no ocurren en una pantalla. Incluyen animatrónicos, fuego real, efectos de agua, viento o decorados móviles.',
    relatedTermIds: ['animatronics', 'dark-ride', 'projection-mapping'],
    aliases: ['efectos físicos'],
  },
  {
    id: 'chicken-exit',
    name: 'Salida de emergencia (Chicken Exit)',
    shortDefinition:
      'Salida justo antes de subir a la atracción para quienes deciden no montar en el último momento.',
    definition:
      'El Chicken Exit es un pasillo al final de la cola que permite salir sin subir al vehículo. En las atracciones fuertes la usan quienes se echan atrás en el último momento y los padres que acompañan a sus hijos en la cola pero no quieren montar.',
    relatedTermIds: ['queue-line', 'rider-switch', 'single-rider', 'wait-time'],
    aliases: ['Chicken Exit'],
  },
  {
    id: 'in-show-exit',
    name: 'Salida durante el espectáculo',
    shortDefinition:
      'Evacuación de los pasajeros del vehículo dentro de la zona de escenas de la atracción.',
    definition:
      'Es cuando los pasajeros tienen que bajar del vehículo en un punto poco habitual del recorrido por un fallo técnico o una parada de seguridad (evacuación). Así ven de cerca los decorados y la técnica, a menudo con las luces de trabajo encendidas.',
    relatedTermIds: ['dark-ride', 'downtime', 'e-stop'],
    aliases: ['evacuación en escena'],
  },
  {
    id: 'e-stop',
    name: 'Parada de emergencia',
    shortDefinition:
      'Parada inmediata de todos los elementos móviles de una atracción por seguridad.',
    definition:
      'El E-Stop (Emergency Stop) es la desconexión inmediata de una atracción por seguridad. Se activa manual o automáticamente si los sensores detectan anomalías. Los trenes se detienen en zonas seguras (frenos) y la atracción suele requerir una inspección antes de volver a ponerse en marcha.',
    relatedTermIds: ['block-brake', 'downtime', 'in-show-exit'],
    aliases: ['E-Stop', 'parada de seguridad'],
  },
  {
    id: 'mackprodukt',
    name: 'Mackprodukt',
    shortDefinition:
      'Jerga de la comunidad germanoparlante para el elogio reflejo y acrítico que los fans de Mack Rides dedican a cualquier novedad del fabricante.',
    definition:
      'Un "Mackprodukt" (literalmente "producto Mack") es una broma interna de la comunidad germanoparlante de aficionados a las montañas rusas, con la que se burlan con cariño de la lealtad de los fans de Mack Rides. Mack es un fabricante alemán y la familia que está detrás de Europa-Park, y sus fans tienen fama de devotos: los críticos bromean con que cada nueva atracción de Mack se aclama como obra maestra antes de que nadie la haya probado.\n\nEl meme se construye en torno a un puñado de frases hechas que supuestamente sustituyen a cualquier análisis real: la admiración por lo bien curvada que está la vía ("die Schiene ist so toll gebogen", "la vía está curvada de maravilla") y por los preciosos trenes ("wunderschöne Fahrfiguren", "vagones bellísimos"), cumplidos estéticos que esquivan cómodamente la cuestión de cómo se monta realmente la atracción. Llamar a algo "Mackprodukt", o simplemente citar esas frases, se ha convertido en el atajo de la comunidad para poner los ojos en blanco, con afecto, ante la fidelidad a la marca que se impone a la sustancia.',
    relatedTermIds: ['credit', 'fanboy', 'gp', 'hype-train', 'mack-rides'],
    aliases: ['Mack-Produkt', 'Mackprodukte'],
  },
  {
    id: 'onride-offride',
    name: 'On-Ride / Off-Ride',
    shortDefinition:
      'Abreviatura de los aficionados para las imágenes grabadas a bordo de una atracción (on-ride) frente a las grabadas desde el suelo (off-ride).',
    definition:
      'On-ride y off-ride describen las dos formas principales en que los aficionados graban una montaña rusa. Un vídeo on-ride se graba desde el asiento de un pasajero, con el ritmo, el airtime y las fuerzas del recorrido; un vídeo off-ride se graba desde el borde de la vía, con el trazado, la tematización y los trenes en marcha. Los dos términos salen constantemente al hablar de POV y de vídeos compartidos en línea. Como muchos parques prohíben grabar con el móvil a bordo, hay pocas imágenes on-ride autorizadas y se buscan mucho.',
    relatedTermIds: ['pov', 'ride-photo', 'credit'],
    aliases: ['On-Ride', 'Off-Ride', 'Onride', 'Offride'],
  },
  {
    id: 're-ride',
    name: 'Re-Ride',
    shortDefinition:
      'Permanecer a bordo o volver a subir de inmediato para otra vuelta sin abandonar el asiento ni rehacer la cola.',
    definition:
      'Hay re-ride cuando se deja a un visitante quedarse en la atracción, o volver directamente a la estación, para otra vuelta sin hacer toda la cola de nuevo. Es habitual a última hora del día, en momentos tranquilos o en eventos para aficionados, cuando hay poca demanda y los operadores simplemente indican a los pasajeros que sigan sentados. Donde el parque lo permite, los aficionados encadenan vueltas para comparar filas o para repetir su atracción favorita.',
    relatedTermIds: ['credit', 'ert', 'rope-drop'],
    aliases: ['Re-Rides', 'Reride'],
  },
  {
    id: 'hype-train',
    name: 'Hype Train',
    shortDefinition:
      'La ola de entusiasmo que se forma en la comunidad en torno a una atracción anunciada, inflando a veces las expectativas más allá de la realidad.',
    definition:
      'El "hype train" es la oleada de expectación que se propaga por foros y redes sociales en cuanto se insinúa o anuncia una nueva atracción. Se alimenta de avances de la obra, trazados filtrados y primeras POV, y puede disparar las expectativas mucho antes del día de apertura. Los aficionados bromean con «subirse al hype train», y con la decepción que llega cuando una atracción no está a la altura. El concepto está estrechamente ligado a la lealtad de los fans y a memes como el Mackprodukt.',
    relatedTermIds: ['gp', 'mackprodukt', 'fanboy'],
    aliases: ['Hype', 'Hype-Train'],
  },
  {
    id: 'fanboy',
    name: 'Fanboy',
    shortDefinition:
      'Un fan cuya devoción por un parque, fabricante o atracción concretos vuelve su opinión positiva y acrítica por reflejo.',
    definition:
      'En los círculos de aficionados, un "fanboy" (el término se usa sin distinción de género) es alguien cuyo apego a un parque o fabricante concreto tiñe todos sus juicios: defiende y alaba sus productos casi por reflejo. La etiqueta suele ponerse medio en broma, a quien deja que la lealtad a la marca pese más que lo que la atracción ofrece. El meme Mackprodukt de la comunidad germanoparlante es el fanboyismo convertido en chiste recurrente.',
    relatedTermIds: ['mackprodukt', 'hype-train', 'gp'],
    aliases: ['Fanboys', 'Fangirl'],
  },
  {
    id: 'smoothness',
    name: 'Suavidad de marcha',
    shortDefinition: 'Lo libre que está una montaña rusa de tirones, traqueteos y vibraciones.',
    definition:
      'La suavidad de marcha (en inglés «smoothness»; los aficionados alemanes la llaman «Laufruhe») es lo limpio que recorren el trazado los trenes de una montaña rusa, sin golpes en la cabeza, traqueteos ni vibraciones. Depende de la precisión con que se fabricó la vía, del diseño del tren y de las ruedas, y de la edad y el mantenimiento de la atracción. Las montañas rusas de B&M y de Mack suelen tener marchas «lisas como el cristal», y si una montaña rusa sigue siendo suave con los años, es que está bien construida. Una marcha brusca y con vibraciones es una de las quejas más frecuentes de los aficionados.',
    relatedTermIds: ['rattle', 'b-and-m', 'g-force'],
    aliases: ['Smoothness', 'Laufruhe', 'suavidad'],
  },
  {
    id: 'rattle',
    name: 'Traqueteo',
    shortDefinition:
      'Vibración o sacudida no deseada transmitida por un tren de montaña rusa, que vuelve brusca una marcha por lo demás buena.',
    definition:
      'Un traqueteo (en inglés «rattle») es el zumbido, la sacudida o el temblor que aparece cuando las ruedas de una montaña rusa ya no siguen bien los raíles; suele venir del desgaste de la vía, del estado de las ruedas o de una estructura envejecida. Los aficionados alemanes lo llaman «Rattern» o «Geruckel». Con traqueteo, hasta un buen trazado se vuelve incómodo. Entre los aficionados se habla mucho de él, sobre todo en las viejas montañas rusas de acero de Arrow y Vekoma. Lo contrario es la suavidad de marcha.',
    relatedTermIds: ['smoothness', 'wooden-coaster', 'arrow-dynamics'],
    aliases: ['Rattle', 'Rattern'],
  },
  {
    id: 'restraint-freedom',
    name: 'Libertad de movimiento',
    shortDefinition:
      'Cuánto espacio tiene un pasajero para moverse bajo la barra o el arnés; de eso depende cómo se nota el airtime.',
    definition:
      'La libertad de movimiento («Bügelfreiheit» en la comunidad alemana) es el espacio que queda entre el pasajero y el sistema de retención una vez bloqueado. Con una barra de regazo holgada, el pasajero se levanta del asiento en los momentos de airtime y la flotación o el ejector se notan mucho más; con una sujeción ajustada o apretada con fuerza, apenas se notan. Muchos diseños de Intamin y Mack tienen barras de regazo holgadas. Cuando el personal aprieta las sujeciones de más, se habla de stapling.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'stapling'],
    aliases: ['Bügelfreiheit', 'Restraint Freedom'],
  },
  {
    id: 'single-rail-coaster',
    name: 'Single-Rail Coaster',
    shortDefinition:
      'Tipo moderno de montaña rusa que va sobre un único raíl central estrecho, con los pasajeros sentados en fila.',
    definition:
      'Una single-rail coaster usa un único raíl estrecho de sección de caja en lugar de los dos raíles paralelos habituales, y los pasajeros van sentados uno detrás de otro, a horcajadas sobre la vía. Con un raíl tan fino, el recorrido puede ser muy ceñido y retorcido, y los pasajeros van muy expuestos. Rocky Mountain Construction fue la primera con la versión moderna, su modelo «Raptor» (como RailBlazer en el Great America de California); Vekoma e Intamin han desarrollado después sus propios diseños single-rail.',
    relatedTermIds: ['rmc', 'vekoma', 'steel-coaster'],
    aliases: ['Single Rail', 'Single-Rail', 'Raptor Track'],
  },
  {
    id: 'stand-up-coaster',
    name: 'Stand-Up Coaster',
    shortDefinition:
      'Una montaña rusa en la que los pasajeros van asegurados de pie en lugar de sentados.',
    definition:
      'Una stand-up coaster sujeta a los pasajeros en posición erguida, de pie, mediante un asiento tipo sillín de bicicleta y un arnés de hombros. Se extendieron a finales de los años 80 y en los 90, sobre todo las de TOGO y B&M. De pie, las fuerzas se notan de otra manera: los loopings y las curvas cargan mucho las piernas. Desde entonces se han construido pocas, y varias se han reconvertido a otros formatos (la Mantis de B&M pasó a ser la floorless Rougarou), así que quedan pocas para sumar al contador de credits.',
    relatedTermIds: ['b-and-m', 'floorless-coaster', 'steel-coaster'],
    aliases: ['Stand Up Coaster', 'Standup Coaster'],
  },
  {
    id: 'bobsled-coaster',
    name: 'Montaña rusa bob',
    shortDefinition:
      'Una montaña rusa cuyos coches circulan libres por un canal abierto y peraltado en lugar de ir fijados a una vía rígida.',
    definition:
      'Una montaña rusa bob ("bobsled coaster") envía sus coches por un canal curvo en forma de medio tubo en lugar de por una vía clásica, de modo que buscan su propia trayectoria en las curvas peraltadas, igual que en una pista de bob. La marcha es sinuosa, con muchas fuerzas laterales y sin inversiones; lo que se nota depende de la velocidad y de la forma del canal. Schwarzkopf construyó versiones antiguas conocidas, y Mack Rides es el fabricante más conocido del bob de acero moderno, varios de los cuales funcionan en parques alemanes y alpinos.',
    relatedTermIds: ['mack-rides', 'wild-mouse', 'steel-coaster'],
    aliases: ['Bobsled Coaster', 'Bobbahn', 'Bob'],
  },
  {
    id: 'powered-coaster',
    name: 'Powered Coaster',
    shortDefinition:
      'Una atracción tipo montaña rusa impulsada de forma continua por un motor a bordo o en la vía, en lugar de depender de la gravedad.',
    definition:
      'Una powered coaster parece una montaña rusa pero se propulsa a lo largo de todo su circuito mediante motores eléctricos, en vez de subir una vez y entregarse a la gravedad. Como mantiene la velocidad y puede dar varias vueltas, suele ser una atracción familiar suave, a menudo tematizada como tren minero, dragón o animal, con mucha capacidad y emoción moderada. Si las powered coasters "cuentan" como credits es un debate antiguo y medio en serio dentro de la comunidad de aficionados.',
    relatedTermIds: ['alpine-coaster', 'credit', 'mack-rides', 'mine-train'],
    aliases: ['Powered Coasters', 'montaña rusa motorizada'],
  },
  {
    id: 'water-coaster',
    name: 'Montaña rusa acuática',
    shortDefinition:
      'Un híbrido entre montaña rusa y atracción acuática, que combina vía y elevadores de coaster con uno o varios splashdowns.',
    definition:
      'Una montaña rusa acuática («water coaster») combina la mecánica de un coaster (elevadores de cadena o motorizados, caídas y vía peraltada) con el final mojado de una atracción acuática. Los elevadores suben botes o coches tipo coaster, que después bajan por hondonadas y frenan de golpe en una pila de agua que levanta una ola. Mack Rides es el principal fabricante de montañas rusas acuáticas modernas, con instalaciones como Poseidon en Europa-Park. En días de calor tienen mucha cola.',
    relatedTermIds: ['mack-rides', 'log-flume', 'splashdown'],
    aliases: ['Water Coaster', 'coaster acuática'],
  },
  {
    id: 'alpine-coaster',
    name: 'Alpine Coaster',
    shortDefinition:
      'Una montaña rusa de descenso guiada por un raíl, normalmente en la ladera de una montaña, donde los pasajeros controlan su propia velocidad con una palanca de freno.',
    definition:
      'Un alpine coaster (también llamado mountain coaster) es una atracción de trineos o carritos fijados a un raíl que sigue los contornos naturales de una ladera; los pasajeros bajan a la velocidad que ellos mismos fijan con un freno de mano. A diferencia de una montaña rusa tradicional, no hay tren y, por lo general, tampoco lanzamiento motorizado: la gravedad y el terreno ponen la marcha, y un cable sube los carritos de vuelta arriba. Funcionan todo el año en las estaciones alpinas y se han extendido por todo el mundo. Su pariente cercano es la «Sommerrodelbahn» (tobogán de verano) de canal, más antigua.',
    relatedTermIds: ['terrain-coaster', 'powered-coaster'],
    aliases: ['Mountain Coaster', 'Sommerrodelbahn'],
  },
  {
    id: 'beyond-vertical-drop',
    name: 'Beyond-Vertical Drop',
    shortDefinition:
      'Una caída de más de 90 grados, de modo que la vía inclina a los pasajeros más allá de la vertical y los orienta un instante hacia atrás.',
    definition:
      'Una beyond-vertical drop supera los 90 grados de inclinación: la vía se curva por debajo de sí misma, de modo que los pasajeros quedan un instante inclinados más allá de la vertical y orientados ligeramente hacia atrás, hacia la estructura. El modelo Euro-Fighter de Gerstlauer popularizó el formato con caídas de unos 95–97°, y B&M y otros han construido dive coasters con primeras caídas en voladizo similares. Atracciones como Mumbo Jumbo y Takabisha han ostentado récords de la caída más empinada de este tipo.',
    relatedTermIds: ['dive-coaster', 'euro-fighter', 'first-drop', 'gerstlauer'],
    aliases: ['Beyond Vertical Drop', 'caída más allá de la vertical'],
  },
  {
    id: 'splashdown',
    name: 'Splashdown',
    shortDefinition:
      'El final frenado por agua de una atracción acuática o montaña rusa acuática, donde el bote golpea una pila y levanta una ola.',
    definition:
      'Un splashdown es el momento en que un bote o un coche entra en un canal de agua poco profundo al pie de una caída; el agua frena el vehículo y levanta una gran cortina de salpicaduras. En las montañas rusas acuáticas y en los troncos es el remojón final, y los diseñadores ajustan la profundidad y la forma de la pila para controlar cuánto se mojan los pasajeros y los espectadores de los puentes cercanos. Si está a la vista del público, sirve además de reclamo para la atracción.',
    relatedTermIds: ['water-coaster', 'log-flume', 'mack-rides'],
    aliases: ['Splash-down', 'Splashdowns'],
  },
  {
    id: 'quad-down',
    name: 'Quad-Down',
    shortDefinition:
      'Una serie de cuatro bajadas seguidas, con airtime en cada una, cerca del final de un recorrido.',
    definition:
      'Un quad-down (y sus primos menores el triple-down y el double-down) es una sucesión de escalones descendentes tomados en rápida secuencia, cada uno de los cuales da un golpe seco de airtime mientras el tren baja, se nivela un instante y vuelve a bajar. Es frecuente en las montañas rusas de madera e híbridas, porque da airtime «a ráfagas» en poco espacio; se basa en la misma idea que el camelback y el bunny hop, pero encadena los saltos en una sola secuencia rápida.',
    relatedTermIds: ['airtime', 'camelback', 'wooden-coaster'],
    aliases: ['Quad Down', 'Triple-Down', 'Double-Down'],
  },
  {
    id: 's-hill',
    name: 'S-Hill',
    shortDefinition:
      'Una colina de airtime en forma de S que lanza a los pasajeros hacia un lado al elevarlos, mezclando flotación con un golpe lateral.',
    definition:
      'Una S-hill es una colina de airtime construida con una curva en S, de modo que cuando el tren corona y flota también es empujado lateralmente primero hacia un lado y luego hacia el otro. Se mezclan el airtime vertical y un tirón lateral que pilla desprevenidos a los pasajeros. Es típica de las montañas rusas de madera e híbridas modernas con un ritmo imprevisible, «fuera de control». El elemento está estrechamente emparentado con el wave turn, que vuelca el airtime por completo de lado.',
    relatedTermIds: ['airtime', 'airtime-hill', 'wave-turn', 'bunnyhop'],
    aliases: ['S Hill', 'Speed Bump'],
  },
  {
    id: 'celestial-spin',
    name: 'Celestial Spin',
    shortDefinition:
      'Una inversión de doble vía de Mack Rides: dos trenes compiten sobre una cima compartida mientras sus vías giran una alrededor de la otra, una hacia arriba y la otra hacia abajo.',
    definition:
      'El celestial spin es una inversión de doble vía patentada por Mack Rides y el elemento principal de [Stardust Racers](/es/parks/north-america/united-states/orlando/universal-epic-universe/stardust-racers), la montaña rusa lanzada en duelo de [Universal Epic Universe](/es/parks/north-america/united-states/orlando/universal-epic-universe). Cuando los dos trenes compiten sobre una cima compartida, sus vías se invierten una alrededor de la otra: un tren rueda hacia arriba en un zero-G roll mientras que, en el mismo instante, el otro rueda hacia abajo en un barrel roll, de modo que los coches parecen girar en espiral uno alrededor del otro en el aire.\n\nComo ambos giros están sincronizados con la colina de airtime, los pasajeros flotan en un largo momento de ingravidez mientras el tren gemelo pasa a solo unos metros. Míralo de frente en la vista frontal para ver cómo las dos vías se enroscan, cambia al modo seguimiento para seguir el duelo o súbete a bordo para sentir cómo tu propio horizonte se invierte mientras el otro tren pasa por encima. Está muy relacionado con el zero-G roll, la inversión y la colina de airtime.',
    relatedTermIds: ['zero-g-roll', 'airtime-hill', 'inversion', 'hangtime'],
    aliases: ['Celestial Roll', 'Celestial Rolls', 'Celestial Spins'],
    alternateNames: ['Celestial Roll'],
  },
  {
    id: 'launch',
    name: 'Lanzamiento',
    shortDefinition:
      'Un tramo motorizado que pone el tren a velocidad en segundos, en lugar de subirlo por una rampa de elevación.',
    definition:
      'Un lanzamiento es el tramo de vía donde una montaña rusa obtiene su energía de un motor en lugar de la gravedad. Dominan cuatro tecnologías. Los lanzamientos LSM (motor síncrono lineal) alinean electroimanes junto a la vía que tiran de una aleta bajo el tren: suaves, controlables con precisión y repetibles a mitad del recorrido, por lo que casi toda montaña rusa lanzada nueva los usa. Los lanzamientos LIM (motor de inducción lineal) funcionan de forma similar pero disipan más energía en calor. Los lanzamientos hidráulicos emplean un cabrestante accionado por acumuladores presurizados con nitrógeno y dan las aceleraciones más bruscas; los de aire comprimido, como en Maxx Force, son aún más rápidos en los primeros metros.\n\nUn lanzamiento y una rampa se diferencian también en dónde se puede gastar la energía. Una rampa tiene que ser el punto más alto del recorrido, así que todo lo que sigue va cuesta abajo. Un lanzamiento puede situarse en cualquier parte, y por eso los trazados multilanzamiento como [Taron](/es/parks/europe/germany/bruehl/phantasialand/taron) en [Phantasialand](/es/parks/europe/germany/bruehl/phantasialand) o [Voltron Nevera](/es/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) en [Europa-Park](/es/parks/europe/germany/rust/europa-park) mantienen la velocidad en toda su longitud en vez de cambiar altura por velocidad una sola vez. Si un lanzamiento no basta para completar el trazado, se produce un rollback.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'swing-launch', 'rollback', 'top-hat'],
    aliases: ['Launch', 'Lanzamientos', 'Lanzamiento LSM', 'Lanzamiento LIM'],
    alternateNames: ['Launch', 'Catapulta'],
  },
  {
    id: 'swing-launch',
    name: 'Lanzamiento pendular',
    shortDefinition:
      'Un lanzamiento que impulsa el tren adelante y atrás varias veces, ganando velocidad en cada pasada hasta poder completar el trazado.',
    definition:
      'Un lanzamiento pendular (también lanzamiento lanzadera o multipasada) acelera el tren, lo deja perder impulso en un tramo ascendente, lo recoge de nuevo al volver, y repite el ciclo dos o tres veces hasta reunir energía suficiente para todo el circuito. Cada pasada aporta velocidad que los motores no podrían dar de una sola vez, así que con una pista de lanzamiento mucho más corta se llega a una velocidad punta mucho mayor.\n\nAdemás es un elemento de espectáculo en sí mismo: los pasajeros recorren marcha atrás parte del trazado, normalmente subiendo por una aguja vertical, antes de ser impulsados hacia delante otra vez. [Toutatis](/es/parks/europe/france/plailly/parc-asterix/toutatis) en Parc Astérix, [The Ride to Happiness](/es/parks/europe/belgium/de-panne/plopsaland-belgium/the-ride-to-happiness-by-tomorrowland) en Plopsaland y [Oath of Kärnan](/es/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) en Hansa-Park usan uno. Premier Rides construye toda una montaña rusa compacta en torno a esta idea con su modelo Sky Rocket II.',
    relatedTermIds: ['launch', 'spike', 'shuttle-coaster', 'launch-coaster'],
    aliases: ['Swing Launch', 'Lanzamiento lanzadera'],
    alternateNames: ['Swing Launch'],
  },
  {
    id: 'vertical-lift',
    name: 'Ascenso vertical',
    shortDefinition:
      'Una rampa de elevación a 90 grados: el tren sube en línea recta por la cara de la estructura.',
    definition:
      'Un ascenso vertical sustituye la habitual pendiente de 30 a 45 grados por un tramo que asciende en ángulo recto respecto al suelo. Como una cadena convencional con su trinquete antirretroceso no puede sujetar un tren de forma fiable en una cara vertical, estos ascensos emplean cable, carro de arrastre o una cadena con enganche positivo. Los pasajeros pasan toda la subida tumbados de espaldas, mirando directamente al cielo.\n\nEl ascenso vertical es una seña de identidad de los modelos Euro-Fighter e Infinity Coaster de Gerstlauer, donde desemboca directamente en una caída más allá de la vertical: [Takabisha](/es/parks/asia/japan/fujikawaguchiko/fuji-q-highland/takabisha-steepest-roller-coaster) en Fuji-Q Highland sube en vertical y luego cae a 121 grados, la caída más inclinada de cualquier montaña rusa de acero. [Oath of Kärnan](/es/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) en Hansa-Park usa un ascenso vertical de 73 metros dentro de una torre cerrada, de modo que se sube a oscuras. No confundir con un ascensor de vía, donde es el propio tramo de vía el que sube con el tren encima.',
    relatedTermIds: ['lifthill', 'beyond-vertical-drop', 'euro-fighter', 'anti-rollback'],
    aliases: ['Vertical Lift', 'Ascensos verticales'],
    alternateNames: ['Vertical Lift'],
  },
  {
    id: 'drop-track',
    name: 'Vía descendente',
    shortDefinition:
      'Un tramo de vía que baja de golpe con el tren parado encima, como si el suelo desapareciera.',
    definition:
      'Una drop track es un tramo corto y móvil de vía montado sobre una plataforma hidráulica o eléctrica. El tren entra y se detiene, y todo el segmento (raíles y tren) cae de golpe, normalmente unos metros, antes de que la vía se bloquee en una nueva alineación y el recorrido continúe. A diferencia de una caída normal, la sensación llega con el tren parado y nivelado, así que parece que el suelo cede, no que el tren caiga en picado.\n\nCasi siempre es un momento narrativo más que un elemento de emoción: el efecto solo funciona si no se ve venir, así que las drop tracks viven dentro de edificios de espectáculo y túneles. [Hagrid’s Magical Creatures Motorbike Adventure](/es/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure) deja caer a los pasajeros a la oscuridad a mitad del trazado, [Verbolten](/es/parks/north-america/united-states/williamsburg/busch-gardens-williamsburg/verbolten) en Busch Gardens Williamsburg los saca de la Selva Negra, y Harry Potter and the Escape from Gringotts usa una en su secuencia de la cámara acorazada.',
    relatedTermIds: ['switch-track', 'dark-ride', 'first-drop', 'indoor-coaster'],
    aliases: ['Drop Track', 'Drop Tracks'],
    alternateNames: ['Drop Track'],
  },
  {
    id: 'scorpion-tail',
    name: 'Cola de escorpión',
    shortDefinition:
      'Un elemento de Mack Rides: la vía se curva más allá de la vertical hasta formar un voladizo, y el tren sube de espaldas por una pared de 105 grados.',
    definition:
      'La cola de escorpión es una aguja de lanzamiento que no se detiene en la vertical. En lugar de subir a 90 grados y retener ahí el tren, la vía atraviesa la vertical y se recuesta sobre sí misma hasta unos 105 grados: un voladizo. Un tren lanzado hacia ella sube boca abajo y ligeramente hacia atrás, queda suspendido en el punto más alto y cae por donde vino.\n\nMack Rides construyó la primera en 2024 para [Voltron Nevera](/es/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) en [Europa-Park](/es/parks/europe/germany/rust/europa-park), donde es la sección de lanzamiento más inclinada de cualquier montaña rusa del mundo. El efecto es inusual porque el hangtime se produce sin ningún avance: arriba solo te sostienen la forma de la vía y el impulso restante del tren. El nombre viene de la silueta: una cola que se enrosca hacia arriba y por encima de sí misma.',
    relatedTermIds: ['spike', 'swing-launch', 'launch', 'hangtime', 'mack-rides'],
    aliases: ['Scorpion Tail', 'Colas de escorpión'],
    alternateNames: ['Scorpion Tail'],
  },
  {
    id: 'step-up-under-flip',
    name: 'Step-Up Under-Flip',
    shortDefinition:
      'Una inversión de RMC: el tren sube una colina muy peraltada, gira sobre sí mismo arriba y sale invertido por el otro lado.',
    definition:
      'Un step-up under-flip es una inversión en dos fases inventada por Rocky Mountain Construction. El tren primero «sube» por un tramo ascendente y muy peraltado, y después gira por debajo de sí mismo mientras baja, de modo que el giro ocurre en la mitad descendente y no en la cresta. La rotación es más larga y lenta que la de un tonel, y a la salida hay un golpe seco de ejector airtime.\n\nLo tienen varios híbridos de RMC: [Steel Vengeance](/es/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance) en Cedar Point, [Zadra](/es/parks/europe/poland/zator/energylandia/zadra-rc) en Energylandia y [Untamed](/es/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed) en Walibi Holland, la primera conversión de RMC en Europa. Como la maniobra exige vía de acero retorcida con precisión sobre una estructura de madera o acero, resulta prácticamente imposible en vía de madera tradicional.',
    relatedTermIds: [
      'rmc',
      'hybrid-coaster',
      'inversion',
      'ejector-airtime',
      'twisted-horseshoe-roll',
    ],
    aliases: ['Step Up Under Flip'],
  },
  {
    id: 'twisted-horseshoe-roll',
    name: 'Twisted Horseshoe Roll',
    shortDefinition:
      'Un elemento de RMC: una herradura de 180 grados con un tonel en cada rama, con dos inversiones y un cambio total de dirección.',
    definition:
      'Un twisted horseshoe roll toma la herradura (un giro cerrado de 180 grados que devuelve el tren por donde vino) y enhebra una inversión en cada rama. El tren gira al entrar, atraviesa la herradura y vuelve a girar al salir. Dos inversiones y un cambio completo de dirección suceden en una sola maniobra continua y desacostumbradamente alargada.\n\nRocky Mountain Construction lo introdujo en Outlaw Run, en Silver Dollar City, la primera montaña rusa de madera de la historia con un tonel doble, y desde entonces lo ha integrado en [Steel Vengeance](/es/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance), [Zadra](/es/parks/europe/poland/zator/energylandia/zadra-rc), [Iron Gwazi](/es/parks/north-america/united-states/tampa/busch-gardens-tampa/iron-gwazi) y [Untamed](/es/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed). Se pasa la mayor parte del elemento de lado o boca abajo con muy poca fuerza G, de ahí el enorme hangtime.',
    relatedTermIds: ['horseshoe', 'rmc', 'inversion', 'hangtime', 'step-up-under-flip'],
    aliases: ['Twisted Horseshoe Rolls', 'Tonel doble'],
  },
  {
    id: 'double-down',
    name: 'Double Down',
    shortDefinition:
      'Una caída interrumpida a media altura por un breve tramo llano, que entrega dos golpes de airtime en lugar de uno.',
    definition:
      'Un double down es un descenso partido en dos fases: la vía cae, se aplana brevemente o incluso sube una fracción, y vuelve a caer. Cada transición saca a los pasajeros de sus asientos, así que una sola colina produce dos golpes claros de airtime en vez de una flotación larga. El elemento espejo, el double up, hace lo mismo subiendo.\n\nEs un clásico del diseño de montañas rusas de madera y uno de los trucos más antiguos del oficio: [Jack Rabbit](/es/parks/north-america/united-states/west-mifflin/kennywood/jack-rabbit) en Kennywood lleva expulsando a sus pasajeros del asiento con su double dip desde 1920. Los trazados modernos de madera e híbridos siguen apoyándose en él: [Colossos](/es/parks/europe/germany/soltau/heide-park/colossos-kampf-der-giganten) en Heide-Park, [Balder](/es/parks/europe/sweden/gothenburg/liseberg/balder) en Liseberg y [Troy](/es/parks/europe/netherlands/sevenum/attractiepark-toverland/troy) en Toverland terminan así sus caídas. Si se estira la idea aparece el quad-down: cuatro fases en un solo descenso.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'quad-down', 'camelback', 'wooden-coaster'],
    aliases: ['Double Downs', 'Double dip'],
    alternateNames: ['Double Dip'],
  },
  {
    id: 'switch-track',
    name: 'Cambio de vía',
    shortDefinition:
      'Un tramo móvil de vía que redirige el tren a otra ruta: secciones marcha atrás, trazados ramificados y vías de apartadero.',
    definition:
      'Un cambio de vía es el equivalente ferroviario aplicado a las montañas rusas: un tramo que se desplaza, pivota o gira para conectar el circuito principal con una segunda ruta. Mecánicamente es sencillo, y da mucha libertad para diseñar el recorrido. Un cambio permite enviar un tren marcha atrás por un tramo ya recorrido, ofrecer dos rutas desde la misma estación, o simplemente sacar los trenes del circuito hacia el taller al cerrar.\n\nComo elemento de espectáculo suele tratarse de sorpresa. [Expedition Everest](/es/parks/north-america/united-states/orlando/disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain) muestra la vía arrancada por delante y luego envía el tren marcha atrás montaña abajo. [Big Grizzly Mountain](/es/parks/asia/hong-kong/hong-kong/hong-kong-disneyland-park/big-grizzly-mountain-runaway-mine-cars) en Hong Kong Disneyland usa dos. [Fury](/es/parks/europe/belgium/kasterlee/bobbejaanland/fury) en Bobbejaanland lo emplea para ofrecer una versión hacia delante y otra hacia atrás del mismo trazado.',
    relatedTermIds: ['drop-track', 'turntable', 'block-brake', 'dark-ride'],
    aliases: ['Switch Track', 'Cambios de vía'],
    alternateNames: ['Switch Track'],
  },
  {
    id: 'turntable',
    name: 'Plataforma giratoria',
    shortDefinition:
      'Una plataforma rotatoria dentro del circuito que gira el tren sobre sí mismo, normalmente para devolverlo en sentido contrario.',
    definition:
      'Una plataforma giratoria es un tramo de vía montado sobre un disco rotatorio. El tren entra, el disco gira (casi siempre 180 grados) y el tren sale mirando en dirección contraria. Como la rotación ocurre con el tren detenido, es un momento deliberadamente tranquilo: permite invertir el sentido sin aguja lanzadera ni cambio de vía, y da al espectáculo un compás en el que enseñar algo a los pasajeros.\n\nEn [Voltron Nevera](/es/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) de Europa-Park la plataforma prepara un lanzamiento marcha atrás, y en muchos dark rides orienta a los visitantes hacia una escena en el momento exacto. Los dark rides sin vía logran el mismo efecto sin hardware especial, ya que sus vehículos pueden girar libremente en cualquier punto.',
    relatedTermIds: ['switch-track', 'swing-launch', 'trackless-ride', 'dark-ride'],
    aliases: ['Turntable', 'Plataformas giratorias'],
    alternateNames: ['Turntable'],
  },
  {
    id: 'treble-clef',
    name: 'Clave de sol',
    shortDefinition:
      'Un elemento sin inversión con forma del símbolo musical: la vía se enlaza sobre sí misma y vuelve a pasar por su propia curva.',
    definition:
      'Una clave de sol es una curva apilada que se cruza consigo misma: el tren asciende hacia un bucle, cruza su propia vía y sale por el centro de la figura, dibujando aproximadamente el contorno del símbolo musical. No es una inversión: el tren permanece en posición normal todo el tiempo, sostenido por un peralte pronunciado en vez de por ir boca abajo. Lo que se siente es un barrido largo y desorientador con la vía pasando muy cerca por encima y por debajo.\n\nEl elemento lo construyó Maurer Rides para [Hollywood Rip Ride Rockit](/es/parks/north-america/united-states/orlando/universal-studios-florida/hollywood-rip-ride-rockit) en Universal Studios Florida, cuyo trazado está tematizado en torno a la música y nombra sus figuras en consecuencia: la clave de sol sigue al bucle sin inversión «double take» del recorrido. Sigue siendo la única que existe.',
    relatedTermIds: ['non-inverting-loop', 'maurer-rides', 'overbank', 'inversion'],
    aliases: ['Treble Clef'],
    alternateNames: ['Treble Clef'],
  },
  {
    id: 'indoor-coaster',
    name: 'Montaña rusa cubierta',
    shortDefinition:
      'Una montaña rusa construida por completo dentro de un edificio, donde la luz, el sonido y la ambientación sustituyen a las vistas.',
    definition:
      'Una montaña rusa cubierta recorre todo su circuito dentro de un edificio de espectáculo cerrado. Eliminar la luz del día cambia el recorrido de raíz: se pierden las pistas visuales que permiten anticipar una caída o una curva, así que un trazado modesto resulta mucho más intenso que la misma vía al aire libre. Además otorga al diseñador control total sobre luz, proyección, sonido y decorados, y por eso este formato es el hogar natural del híbrido entre montaña rusa y dark ride.\n\nEl modelo es Space Mountain: [Disneyland](/es/parks/north-america/united-states/anaheim/disneyland-park/space-mountain) abrió su versión en 1977, y muchas montañas rusas a oscuras la han imitado. En Europa hay, por ejemplo, [Eurosat](/es/parks/europe/germany/rust/europa-park/eurosat-cancan-coaster) y [Euro-Mir](/es/parks/europe/germany/rust/europa-park/euro-mir) en Europa-Park, [Vogel Rok](/es/parks/europe/netherlands/kaatsheuvel/efteling/vogel-rok) en Efteling y [Crazy Bats](/es/parks/europe/germany/bruehl/phantasialand/crazy-bats) en Phantasialand, todavía la montaña rusa cubierta más larga del mundo.',
    relatedTermIds: ['dark-ride', 'show-building', 'projection-mapping', 'vr-coaster'],
    aliases: ['Indoor Coaster', 'Montañas rusas cubiertas'],
    alternateNames: ['Indoor Coaster'],
  },
  {
    id: 'family-coaster',
    name: 'Montaña rusa familiar',
    shortDefinition:
      'Una montaña rusa pensada para que niños y adultos suban juntos: fuerzas moderadas, altura mínima baja y sin inversiones.',
    definition:
      'Una montaña rusa familiar está pensada para que pueda subir el público más amplio posible. La talla mínima suele empezar en torno a 100-110 cm (a menudo con acompañante por debajo de esa marca), la velocidad se queda por debajo de unos 60 km/h y el recorrido evita inversiones y fuerzas G sostenidas. Dentro de ese margen, mucho más estrecho, una buena montaña rusa familiar tiene que dar airtime y buen ritmo.\n\nPara un parque son de las atracciones más rentables, porque sube el grupo entero junto y la cola nunca se vacía. Los modelos más habituales son el Family Boomerang de Vekoma, el Youngstar de Mack y el Tivoli de Zierer; [Pegasus](/es/parks/europe/germany/rust/europa-park/pegasus) en Europa-Park, [Raik](/es/parks/europe/germany/bruehl/phantasialand/raik) en Phantasialand y [Slinky Dog Dash](/es/parks/north-america/united-states/orlando/disneys-hollywood-studios/slinky-dog-dash) en Disney’s Hollywood Studios son montañas rusas familiares.',
    relatedTermIds: ['height-requirement', 'mine-train', 'wild-mouse', 'launch-coaster'],
    aliases: ['Family Coaster', 'Montañas rusas familiares'],
    alternateNames: ['Family Coaster'],
  },
  {
    id: 'motorbike-coaster',
    name: 'Montaña rusa de moto',
    shortDefinition:
      'Una montaña rusa que se monta a horcajadas, estilo motocicleta, inclinado hacia delante sobre un manillar y en fila india.',
    definition:
      'En una montaña rusa de moto uno se sienta a horcajadas sobre el vehículo en lugar de dentro de él, agarrando un manillar, inclinado hacia delante y con los pies en las estriberas. Con esa postura cambia todo el recorrido: el centro de gravedad queda bajo y justo sobre los raíles, así que en las curvas peraltadas el pasajero se inclina con el vehículo, como en una moto. También implica trenes largos y estrechos y poca capacidad por vehículo.\n\nVekoma construyó la primera con Booster Bike en [Toverland](/es/parks/europe/netherlands/sevenum/attractiepark-toverland/booster-bike) en 2004; Intamin llevó la idea más lejos en [Hagrid’s Magical Creatures Motorbike Adventure](/es/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure), que añade un sidecar para quienes no pueden montar a horcajadas. [TRON Lightcycle / Run](/es/parks/north-america/united-states/orlando/magic-kingdom-park/tron-lightcycle-run) de Disney usa la misma postura con una cúpula cerrada sobre cada pasajero.',
    relatedTermIds: ['launch-coaster', 'vekoma', 'intamin', 'suspended-coaster'],
    aliases: ['Motorbike Coaster', 'Montañas rusas de moto'],
    alternateNames: ['Motorbike Coaster'],
  },
  {
    id: 'infinity-coaster',
    name: 'Infinity Coaster',
    shortDefinition:
      'El sucesor del Euro-Fighter en Gerstlauer: las mismas caídas verticales y la misma huella compacta, pero con trenes abiertos tipo grada.',
    definition:
      'El Infinity Coaster es la plataforma actual de Gerstlauer para montañas rusas a medida. Conserva lo principal del Euro-Fighter (caídas de más de 90 grados, ascensos verticales y recorridos que caben en muy poco terreno), pero cambia los coches cuadrados de cuatro plazas por trenes más largos y bajos, con laterales abiertos y arneses de chaleco en vez de barras de hombros. Va bastante más suave y admite más colinas de airtime, algo que el modelo antiguo llevaba mal.\n\nHay Infinity Coasters compactos y otros de récord: [The Smiler](/es/parks/europe/united-kingdom/farley/alton-towers/the-smiler) en Alton Towers ostenta el récord mundial de inversiones con catorce, [Oath of Kärnan](/es/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) en Hansa-Park combina un ascenso vertical de 73 metros con un lanzamiento pendular, y [Star Trek: Operation Enterprise](/es/parks/europe/germany/bottrop/movie-park-germany/star-trek-operation-enterprise) en Movie Park Germany usa el modelo como lanzadera con varios lanzamientos.',
    relatedTermIds: ['gerstlauer', 'euro-fighter', 'beyond-vertical-drop', 'vertical-lift'],
    aliases: ['Infinity Coasters'],
  },
  {
    id: 'interactive-dark-ride',
    name: 'Dark Ride interactivo',
    shortDefinition:
      'Un dark ride en el que se dispara, se apunta o se participa, y la atracción lleva la puntuación.',
    definition:
      'Un dark ride interactivo pone un dispositivo en manos de los visitantes (normalmente una pistola de infrarrojos, a veces una pantalla táctil o solo sus propias manos) y construye el espectáculo alrededor de lo que hagan con él. Los blancos de cada escena registran los impactos y suman una puntuación individual que aparece al final. Como la puntuación da un motivo para repetir, mucha gente vuelve a montar, y por eso los parques siguen construyéndolas.\n\nHay dos escuelas. En unas se dispara a decorados físicos y animados: [Maus au Chocolat](/es/parks/europe/germany/bruehl/phantasialand/maus-au-chocolat) en Phantasialand y [Men in Black: Alien Attack](/es/parks/north-america/united-states/orlando/universal-studios-florida/men-in-black-alien-attack) en Universal Studios Florida. En otras se dispara a blancos proyectados en pantalla, y los efectos pueden ser mucho más elaborados: [Toy Story Mania](/es/parks/north-america/united-states/orlando/disneys-hollywood-studios/toy-story-mania) y [WEB SLINGERS](/es/parks/north-america/united-states/anaheim/disney-california-adventure-park/web-slingers-a-spider-man-adventure), que sigue el movimiento de las manos sin pistola alguna.',
    relatedTermIds: ['dark-ride', 'animatronics', 'projection-mapping', 'trackless-ride'],
    aliases: ['Interactive Dark Ride', 'Dark rides interactivos'],
    alternateNames: ['Interactive Dark Ride'],
  },
  {
    id: 'madhouse',
    name: 'Casa loca',
    shortDefinition:
      'Una atracción en la que la sala gira alrededor de un banco que apenas se balancea, convenciendo a los visitantes de que dan la vuelta completa.',
    definition:
      'Una casa loca es una ilusión construida sobre un único truco: el banco se balancea solo unos grados, mientras toda la sala a su alrededor gira 360 grados completos. Sin una referencia visual fija (paredes, techo y atrezo se mueven a la vez), el cerebro interpreta el movimiento como si el banco estuviera dando la vuelta. Los visitantes creen haber quedado boca abajo; en realidad nunca salen de un arco muy suave.\n\nVekoma convirtió el formato en estándar de la industria tras construir [Villa Volta](/es/parks/europe/netherlands/kaatsheuvel/efteling/villa-volta) para Efteling en 1996, y por eso el sistema se llama a menudo simplemente «Vekoma Madhouse». [Feng Ju Palace](/es/parks/europe/germany/bruehl/phantasialand/feng-ju-palace) en Phantasialand, [Cassandra’s Curse](/es/parks/europe/germany/rust/europa-park/cassandras-curse) en Europa-Park y [Villa Fiasko](/es/parks/europe/netherlands/sevenum/attractiepark-toverland/villa-fiasko) en Toverland usan el mismo sistema tras historias distintas.',
    relatedTermIds: ['dark-ride', 'vekoma', 'pre-show', 'animatronics'],
    aliases: ['Madhouse', 'Vekoma Madhouse'],
    alternateNames: ['Madhouse'],
  },
  {
    id: 'boat-ride',
    name: 'Paseo en barca',
    shortDefinition:
      'Un dark ride en el que los visitantes avanzan en barca por un canal de agua en lugar de sobre una vía.',
    definition:
      'Un paseo en barca lleva a los visitantes a través del espectáculo por un canal de agua, guiados por una vía sumergida o por las propias paredes del canal. El agua aporta dos cosas que una vía no puede: capacidad, porque las barcas largas se cargan rápido y circulan muy juntas, y silencio, porque no hay mecanismo de tracción bajo el visitante que tape el espectáculo. Por eso este formato domina los dark rides más grandes y longevos del mundo.\n\nCasi todos los clásicos entran aquí: [Pirates of the Caribbean](/es/parks/north-america/united-states/anaheim/disneyland-park/pirates-of-the-caribbean), [«it’s a small world»](/es/parks/north-america/united-states/anaheim/disneyland-park/its-a-small-world-holiday), [Fata Morgana](/es/parks/europe/netherlands/kaatsheuvel/efteling/fata-morgana) en Efteling y [Pirates in Batavia](/es/parks/europe/germany/rust/europa-park/pirates-in-batavia) en Europa-Park. El Pirates of the Caribbean de Shanghai Disneyland va todavía más lejos y coloca las barcas sobre una tracción magnética sin vía, de modo que pueden girar y desplazarse lateralmente.',
    relatedTermIds: ['dark-ride', 'animatronics', 'trackless-ride', 'log-flume', 'water-ride'],
    aliases: ['Boat Ride', 'Paseos en barca'],
    alternateNames: ['Boat Ride'],
  },
  {
    id: 'shoot-the-chute',
    name: 'Shoot-the-Chute',
    shortDefinition:
      'Una atracción acuática de barca grande construida en torno a una gran caída a una cubeta, que lanza un muro de agua sobre el puente.',
    definition:
      'Un shoot-the-chute sube una barca ancha de fondo plano con veinte o más personas por un único ascenso y la deja caer por una sola rampa empinada hasta una cubeta poco profunda. Al caer, la barca desplaza una cantidad enorme de agua, y la salpicadura está pensada tanto para el puente de espectadores como para los pasajeros. A diferencia de un tronco, que reparte varias caídas pequeñas por un recorrido largo y sinuoso, un shoot-the-chute se construye en torno a una caída y una salpicadura.\n\nMuchas veces es la atracción central de un área temática: [Jurassic Park River Adventure](/es/parks/north-america/united-states/orlando/universal-islands-of-adventure/jurassic-park-river-adventure) en Islands of Adventure recorre un dark ride completo antes de la caída de 26 metros, y [Atlantica SuperSplash](/es/parks/europe/germany/rust/europa-park/atlantica-supersplash) en Europa-Park lo combina con un trazado de montaña rusa acuática.',
    relatedTermIds: ['log-flume', 'water-ride', 'splashdown', 'water-coaster'],
    aliases: ['Shoot the Chutes'],
    alternateNames: ['Splash Boat'],
  },
  {
    id: 'people-mover',
    name: 'People Mover',
    shortDefinition:
      'Una atracción de transporte en movimiento continuo que lleva a los visitantes despacio a través o por encima de un área temática.',
    definition:
      'Un people mover es una atracción de transporte lenta y de alta capacidad: una cadena ininterrumpida de vehículos a paso de peatón, a menudo sobre una viga elevada, con andén móvil para no tener que detenerse nunca. En un parque cumple dos funciones: transporte real entre zonas y un recorrido panorámico tranquilo desde el que se ve el área y, con frecuencia, el interior de otras atracciones.\n\nEl Tomorrowland Transit Authority PeopleMover del [Magic Kingdom](/es/parks/north-america/united-states/orlando/magic-kingdom-park/tomorrowland-transit-authority-peoplemover) es el superviviente más conocido y atraviesa el edificio de Space Mountain en su recorrido. La tracción por inducción lineal que emplea se licenció más tarde para sistemas reales de transporte urbano. Villain-Con Minion Blast de Universal aplica la misma idea a una cinta transportadora.',
    relatedTermIds: ['dark-ride', 'omnimover', 'observation-tower', 'walkthrough'],
    aliases: ['People Movers', 'Peoplemover'],
    alternateNames: ['Sistema de tránsito'],
  },
  {
    id: 'bumper-cars',
    name: 'Coches de choque',
    shortDefinition:
      'Una atracción en la que los visitantes conducen pequeños coches eléctricos sobre un suelo metálico y chocan entre sí a propósito.',
    definition:
      'Los coches de choque circulan sobre un suelo de acero con una rejilla conductora en el techo: una pértiga en cada coche capta corriente arriba y la devuelve por el suelo, de modo que los vehículos se conducen libremente sin baterías ni vía. Unos parachoques de goma gruesos absorben las colisiones sobre las que gira toda la atracción. Las instalaciones modernas usan cada vez más captación por el suelo o baterías; así sobra la rejilla y el techo queda libre para la tematización.\n\nEs uno de los tipos de atracción más antiguos que se siguen fabricando (el Auto-Skooter de Lusse es de los años veinte) y uno de los pocos en los que los visitantes deciden lo que ocurre. Casi todos los parques grandes tienen uno, como el [Bumper Klumpen](/es/parks/europe/germany/bruehl/phantasialand/bumper-klumpen) de Phantasialand o el Lada Autodrom de Europa-Park.',
    relatedTermIds: ['flat-ride', 'funhouse', 'carousel'],
    aliases: ['Coche de choque', 'Bumper Cars', 'Autos de choque'],
    alternateNames: ['Bumper Cars'],
  },
  {
    id: 'observation-tower',
    name: 'Torre mirador',
    shortDefinition:
      'Una atracción de torre que eleva despacio una cabina giratoria hasta arriba por las vistas, sin ninguna caída.',
    definition:
      'Una torre mirador sube una góndola acristalada o abierta por una columna central, normalmente girando para que desde todos los asientos se vea el panorama completo, se detiene arriba y vuelve a bajar. Mecánicamente es pariente cercana de la torre de caída, y a menudo se confunden: la diferencia está por completo en la intención, ya que una torre mirador se construye para mirar hacia fuera y una torre de caída para caer.\n\nEn un parque sirve primero de punto de referencia y después de atracción: se ve desde el aparcamiento. La [Euro-Tower](/es/parks/europe/germany/rust/europa-park/euro-tower) de Europa-Park cumple esa función desde 1979.',
    relatedTermIds: ['drop-tower', 'ferris-wheel', 'flat-ride', 'people-mover'],
    aliases: ['Torres mirador', 'Observation Tower', 'Gyro Tower'],
    alternateNames: ['Gyro Tower'],
  },
  {
    id: 'wdi',
    name: 'Walt Disney Imagineering',
    shortDefinition:
      'La división interna de diseño e ingeniería de Disney: el equipo que inventa, diseña y construye cada atracción de sus parques.',
    definition:
      'Walt Disney Imagineering (WDI) es la división que diseña y construye los parques de Disney, desde el plan maestro de un área temática hasta el mecanismo dentro de una sola figura. Fundada en 1952 como WED Enterprises para levantar Disneyland, resulta inusual en el sector porque reúne bajo un mismo techo diseño de espectáculo, arquitectura, ingeniería de atracciones y software: la misma organización que escribe la historia construye el vehículo que la cuenta.\n\nDe WDI salieron muchas cosas que hoy tienen también otros parques: los Audio-Animatronics, el Omnimover (un vehículo de marcha continua que gira para orientar a los visitantes hacia cada escena), el sistema sin vía estrenado en [Pooh’s Hunny Hunt](/es/parks/asia/japan/tokyo/tokyo-disneyland/poohs-hunny-hunt) y la vía tubular de acero que Arrow construyó para los [Matterhorn Bobsleds](/es/parks/north-america/united-states/anaheim/disneyland-park/matterhorn-bobsleds) en 1959 y de la que desciende toda montaña rusa de acero desde entonces. Cuando una atracción de Disney lleva la firma de un fabricante externo, WDI casi siempre ha diseñado igualmente el espectáculo a su alrededor.',
    relatedTermIds: ['omnimover', 'trackless-ride', 'animatronics', 'dark-ride', 'arrow-dynamics'],
    aliases: ['WDI', 'Imagineering', 'Imagineers', 'WED Enterprises'],
    alternateNames: ['WDI', 'Imagineering'],
  },
  {
    id: 'brogent',
    name: 'Brogent Technologies',
    shortDefinition:
      'Fabricante taiwanés del sistema de flying theater i-Ride, usado por la mayoría de flying theaters fuera de Disney.',
    definition:
      'Brogent Technologies, fundada en Kaohsiung en 2001, construye el flying theater i-Ride: una góndola de asientos suspendida que se adelanta frente a una gran pantalla esférica con los pies colgando, sincronizada con efectos de viento, aroma y niebla. Disney creó el formato con Soarin’, y Brogent lo fabrica en serie: el i-Ride es el sistema que compran los parques que quieren un flying theater, y hoy funciona en todos los continentes.\n\nLa instalación europea más conocida es el [Voletarium](/es/parks/europe/germany/rust/europa-park/voletarium) de Europa-Park, que sobrevuela los monumentos del continente con dos salas en paralelo para ganar capacidad. La empresa también construye sistemas de atracciones basadas en medios de menor tamaño y atracciones inmersivas en cúpula.',
    relatedTermIds: ['flying-theater', 'motion-simulator', 'projection-mapping', 'pre-show'],
    aliases: ['Brogent', 'i-Ride'],
    alternateNames: ['Brogent'],
  },
  {
    id: 'quick-pass',
    name: 'QUICK Pass',
    shortDefinition:
      'El producto de paso rápido de pago de Phantasialand, que se compra por atracción.',
    definition:
      'El QUICK Pass es el acceso de pago que evita la cola en Phantasialand. A diferencia de la mayoría de los parques, se vende por atracción y no por día: para Taron, Black Mamba, Chiapas, Talocan o Maus au Chocolat.\n\nSe compra en la app del parque o en el propio parque; el precio por atracción es fijo y no cambia con la afluencia.\n\nLa entrada QUICK Pass también tiene cola, aunque mucho más corta.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time', 'fastpass'],
    aliases: ['Quick Pass', 'QuickPass'],
  },
  {
    id: 'virtual-line',
    name: 'VirtualLine',
    shortDefinition:
      'La cola virtual gratuita de Europa-Park, que se reserva en la app del parque.',
    definition:
      'VirtualLine es el servicio de reserva gratuito de Europa-Park: en la app Europa-Park & Rulantica reservas una franja horaria para una atracción seleccionada y entras en ella durante esa franja por una cola reducida. Mientras tanto puedes ir a otras atracciones, ver un espectáculo o comer.\n\nFunciona en blue fire Megacoaster, Euro-Mir, Pirates in Batavia, Poseidon, Voletarium, Voltron Nevera powered by Rimac y WODAN – Timburcoaster. El número de plazas al día es limitado.\n\nA diferencia de un pase rápido de pago, no cuesta nada; la espera se pasa fuera de la cola.',
    relatedTermIds: ['virtual-queue', 'return-time', 'boarding-group', 'wait-time'],
    aliases: ['Virtual Line'],
  },
  {
    id: 'fast-lane',
    name: 'Fast Lane',
    shortDefinition:
      'El pase de pago para saltarse la cola, normalmente comprado para todo el día de visita.',
    definition:
      'Fast Lane es el nombre del producto para saltarse la cola en muchos parques de las familias Six Flags y Walibi, de Cedar Point a Walibi Holland. Se compra para la visita y no para una vuelta: una pulsera o una entrada digital abre todo el día la entrada Fast Lane de las atracciones incluidas.\n\nSuele haber varios niveles. En Walibi Holland son Gold (ilimitado, alrededor de un 90 % menos de espera), Silver, Bronze y shots sueltos para una o cuatro vueltas. Qué atracciones entran lo decide el parque; las casas de Halloween suelen quedar fuera.\n\nComo el precio cubre el día y no la atracción, park.fan muestra en esas atracciones un precio «desde».',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time', 'single-rider'],
    aliases: ['Fastlane'],
  },
  {
    id: 'speedy-pass',
    name: 'Speedy Pass',
    shortDefinition: 'La cola virtual de pago de Movie Park Germany.',
    definition:
      'El Speedy Pass es el producto para saltarse la cola de Movie Park Germany. Funciona como una cola virtual: reservas desde el móvil una vuelta en una de las atracciones incluidas y entras a la hora reservada por una entrada propia.\n\nHay varios niveles: el Speedy Pass One Ride sirve para una sola atracción, y Gold y Platinum cubren casi todo. Vale para más de 25 atracciones; algunas casas y atracciones especiales quedan excluidas.',
    relatedTermIds: ['virtual-queue', 'express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Speedypass'],
  },
  {
    id: 'fastrack',
    name: 'Fastrack',
    shortDefinition:
      'La entrada de pago para saltarse la cola en los parques Merlin, como Alton Towers.',
    definition:
      'Fastrack es el nombre con el que los parques británicos de Merlin (Alton Towers, Thorpe Park, Chessington) venden su acceso al margen de la cola. Se vende suelto para una atracción o como paquete: Bronze para unas cuantas atracciones a elegir, Silver para una vuelta en cada atracción incluida, Gold para uso ilimitado.\n\nFastrack es siempre una entrada adicional: no incluye el acceso al parque.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Fast Track', 'Fasttrack'],
  },
  {
    id: 'premier-access',
    name: 'Disney Premier Access',
    shortDefinition:
      'El acceso rápido de pago de Disney fuera de EE. UU., que se reserva por atracción.',
    definition:
      'Disney Premier Access es lo que en los parques estadounidenses se llama Lightning Lane: el acceso de pago que evita la cola, en Disneyland Paris y Tokyo Disney Resort.\n\nPremier Access One se compra por atracción, normalmente el mismo día a través de la app, y el precio depende de la fecha y de la atracción; en las novedades es bastante más alto. Premier Access Ultimate cubre una vez cada atracción participante.\n\nComo el precio se fija cada día, park.fan no muestra un precio fijo en esas atracciones.',
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Premier Access'],
  },
  {
    id: 'headliner',
    name: 'Headliner',
    shortDefinition:
      'La atracción por la que se elige el parque, normalmente la más nueva o la más grande.',
    definition:
      'Un headliner es la atracción por la que un parque entra en una lista de viaje: la montaña rusa recién abierta, el dark ride más caro o la atracción que sale en el póster. Los parques construyen uno cada cinco o diez años aproximadamente, y en su temporada de estreno atrae a una parte considerable de todos los visitantes.\n\nPara planificar un día es la partida más importante. Un headliner reúne la cola más larga del parque y a menudo la mantiene desde la apertura hasta la tarde, mientras el resto del recinto por la mañana todavía está vacío. Por eso encabeza casi cualquier recomendación: primero el headliner, después todo lo demás. La excepción es una cola virtual, que de todos modos lo fija a una hora.\n\npark.fan marca los headliners en la lista de atracciones de un parque y los sube en la clasificación por tiempo de espera. Que una atracción lo sea es un dato curado y no una deducción a partir de la cola: una atracción puede tener mucha cola un día concreto sin que nadie viaje por ella.',
    aliases: ['Atracción principal'],
    relatedTermIds: ['wait-time', 'crowd-level', 'rope-drop', 'virtual-queue', 'peak-day'],
  },
];

export default translations;
