import { Link } from '@/i18n/navigation';
import {
  A,
  SectionShell,
  Lead,
  P,
  PG,
  Highlight,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
  LandingNextSteps,
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { HOWTO_CHAPTERS } from '@/lib/howto/chapters';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  MessageCircle,
  Ruler,
  Scale,
  Search,
  Sparkles,
  Star,
  Sunrise,
} from 'lucide-react';
import {
  BadgeRowDemo,
  BareNumberVsCard,
  CalendarDaysDemo,
  DemoFrame,
  LiveHourlyProfile,
  LiveTopAttractions,
  NoWaitTimesDemo,
  OffSeasonDemo,
  ParkyShot,
  PlannerDayFigure,
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import {
  AnatomyAttractionDemo,
  AnatomyBestDaysDemo,
  AnatomyBlogDemo,
  AnatomyCalendarDemo,
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterList, ChapterRail } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/** See `HOWTO_CHAPTERS`: the ids there must match the `<SectionShell>` calls below. */
const CHAPTERS = HOWTO_CHAPTERS.es;

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Normal',
  busy: 'Lleno',
  unit: 'min',
  days: 'días medidos',
  record: 'Récord',
  summary:
    'Taron, {label}: normalmente {typical} minutos, {busy} en días llenos, medido sobre {days} días. En la entrada pone {wait} minutos.',
};

const SCALE_LEGEND = [
  {
    term: 'Normal',
    def: 'En la mitad de los días medidos, la cola más larga fue más corta que eso.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Lleno',
    def: 'El día más lleno de cada diez.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'Lo que pone en la entrada.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Récord',
    def: `${TARON_RECORD} minutos el 16 de julio de 2026, la cola más larga medida.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them.
 * Figures from `TARON_TYPICAL_WAITS`, i.e. from the API and not from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Lunes', typical: 55, busy: 70, sampleDays: 21 },
  { id: 'saturday', label: 'Sábado', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Entre semana', typical: 60, busy: 75, sampleDays: 107 },
];

/**
 * The sections of a park page in the order they render (`app/[locale]/parks/.../page.tsx`,
 * `ParkPageShell`, `LiveParkData`). Whoever reorders them there reorders them here, or the guide
 * describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Tarjeta de título',
    body: 'Nombre y ubicación, a qué distancia estás, la estrella para tus favoritos, un texto breve sobre el parque, sus enlaces y el botón del planificador. Donde hay suficientes mediciones, indica además qué días de la semana suelen ser tranquilos y cuáles llenos.',
  },
  {
    title: 'Precios de acceso rápido',
    body: 'Precios del día de las colas de pago como Lightning Lane, con los agotados marcados como tales.',
    example:
      'En Magic Kingdom el 4 de noviembre de 2026: el Multi Pass por 37 dólares y la reserva suelta para Seven Dwarfs Mine Train, agotada.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'el parque los publica, por ahora solo los parques de Disney en EE. UU.',
  },
  {
    title: 'Cuando estás en el parque',
    body: 'Una brújula muestra en qué dirección quedan las grandes atracciones. Debajo están las atracciones cuya cola es ahora más corta que luego, y las más cercanas con su distancia y su tiempo de espera.',
    onlyWhen: 'estás dentro del parque y has compartido tu ubicación.',
  },
  {
    title: 'Hoy en el parque',
    body: 'Estado y horario, cuántas atracciones están abiertas, la afluencia ahora, la previsión de hoy, la ocupación, los tiempos de espera de las grandes atracciones y los próximos espectáculos. Si hay un aviso meteorológico oficial del DWD o de MeteoAlarm, aparece arriba del todo con su texto original. En la línea del título están la temperatura y un aviso cuando se acerca lluvia o tormenta; al pulsarlo ves las próximas horas en cuartos de hora. Abajo del todo están las vacaciones que afectan hoy al parque, primero las de su propia región.',
    example:
      'El 24 de agosto de 2026 Phantasialand abrió de 9 a 19 h, y además de Renania del Norte-Westfalia, también Güeldres estaba de vacaciones de verano.',
    demo: (
      <div className="space-y-3">
        <WeatherWarningBannerDemo />
        <NowcastBannerDemo single />
        <AnatomyHolidayDemo />
      </div>
    ),
  },
  {
    title: 'Las fichas',
    body: 'Bajo «Hoy en el parque» hay una fila de fichas, casi todas con una cifra del día, como cuántas atracciones están abiertas o cuándo empieza el próximo espectáculo. Atracciones, Clima, Mapa, Espectáculos y Restaurantes abren su pestaña en la misma página; el Calendario de tiempos de espera y las Estadísticas son páginas propias.',
  },
  {
    title: 'Atracciones',
    body: 'La pestaña que está elegida al abrir la página: todas las atracciones en tarjetas como las del capítulo 01, agrupadas por zonas u ordenadas por tiempo de espera, con buscador y filtros, por ejemplo por estatura o solo las abiertas. Encima están aquellas en las que compensa llegar temprano. Si una atracción tiene temporada, aparece en su tarjeta. Debajo vienen, si las hay, las atracciones cerradas definitivamente y el enlace a la página «Con niños».',
    example: 'En Phantasialand, Taron figura ahí arriba.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Calendario de tiempos de espera',
    body: 'Una página propia para cada mes: los días del capítulo 04 en la retícula del mes, una ventana con los detalles de cada día y la comparación de dos días. Arriba están las fechas más tranquilas de los próximos tres meses y el día de la semana más tranquilo.',
    demo: (
      <div className="space-y-3">
        <AnatomyBestDaysDemo locale="es" />
        <AnatomyCalendarDemo />
      </div>
    ),
  },
  {
    title: 'Clima, mapa, espectáculos, restaurantes',
    body: 'Cuatro pestañas más. El tiempo que hace ahora, la curva del día y la previsión, con las horas en las que el parque abre ocupando la mayor parte del eje. Un mapa con todas las atracciones. Los espectáculos con sus horarios de todo el día y los restaurantes con su estado, ambos solo si el parque informa de ellos.',
    example:
      'El 4 de noviembre de 2026 Europa-Park tenía 16 espectáculos y 64 restaurantes. Phantasialand no tenía ningún espectáculo en el programa ese día, y por tanto tampoco pestaña de espectáculos.',
    demo: (
      <div className="space-y-3">
        <WeatherCardShowcase variant="single" />
        <AnatomyShowsDemo />
      </div>
    ),
  },
  {
    title: 'Parques cercanos',
    body: 'Hasta tres parques más en un radio de 100 kilómetros, con distancia y estado.',
    example:
      'Desde Phantasialand, Toverland y Movie Park Germany, ambos a unos buenos 90 kilómetros.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'hay al menos otros dos parques en ese radio.',
  },
  {
    title: 'Blog',
    body: 'Entradas en las que aparece este parque.',
    demo: <AnatomyBlogDemo locale="es" />,
    onlyWhen: 'las hay.',
  },
  {
    title: 'Estadísticas',
    body: 'Las colas más largas del parque, como media de sus horas de apertura, además de los meses, los días de la semana y los días medidos más llenos y más tranquilos. La ficha «Estadísticas» lleva a una página propia que además muestra un día normal hora a hora.',
    demo: <AnatomyStatsDemo />,
  },
  {
    title: 'Los próximos doce meses',
    body: 'La previsión día a día, agrupada por meses, con el número de días recomendados. Cada mes lleva al calendario de tiempos de espera.',
    onlyWhen: 'hay una previsión para el parque.',
  },
  {
    title: 'Temporadas y eventos',
    body: 'Halloween, Navidad y otros eventos con sus fechas, si están confirmados, anunciados o solo previstos, y lo que cuesta una entrada aparte.',
    onlyWhen: 'hemos investigado eventos para el parque.',
  },
  {
    title: 'Información y preguntas',
    body: 'Dirección, teléfono, año de apertura y superficie, en la medida en que los tenemos, y luego las preguntas frecuentes sobre este parque.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Ayer, hora a hora',
    body: 'Para cada atracción y cada hora del día anterior, lo que solía haber de cola y lo que hubo en los momentos más llenos.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'El nivel normal de cada parque',
    body: 'El valor con el que se mide la afluencia de un parque.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'El modelo de las próximas semanas aprende',
    body: 'Incorpora los tiempos de espera de ayer.',
  },
  {
    hour: 4,
    minute: 0,
    at: 0.34,
    title: 'El nivel normal de cada atracción',
    body: 'El valor con el que se mide el nivel de afluencia de la tarjeta del capítulo 01.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.46,
    title: 'Resumir el día anterior',
    body: 'Todo el día anterior en cuartos de hora.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.6,
    title: '¿Compensa madrugar?',
    body: 'Por atracción, cuánto ahorra llegar temprano y cuánto dura la ventaja.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.72,
    title: 'Normal y lleno por día de la semana',
    body: 'Los valores del capítulo 02 para cada atracción, más el récord.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.86,
    title: 'El modelo del resto del año aprende',
    body: 'También incorpora los tiempos de espera de ayer.',
  },
];

const FAQ = [
  {
    question: '¿Qué significan «normal» y «lleno» en un tiempo de espera?',
    answer:
      'Normal es la mediana de los picos diarios: en la mitad de los días medidos la cola más larga fue más corta. Lleno es el percentil 90 de la misma serie, más o menos el día más lleno de cada diez. El récord va al lado. Como los dos valores son percentiles, un único valor extremo apenas los mueve.',
  },
  {
    question: '¿Son muchos 70 minutos de espera?',
    answer:
      'Depende de la atracción y del día de la semana. En Taron, en Phantasialand, el pico de los lunes suele estar en 55 minutos, así que allí 70 son muchos. Los sábados, 70 minutos son la mediana y por tanto un día completamente normal. Ambos valores de comparación están en park.fan, en la página de la atracción.',
  },
  {
    question: '¿De dónde salen los tiempos de espera?',
    answer:
      'De hasta tres fuentes públicas. ThemeParks.wiki es la fuente base; Queue-Times.com y Wartezeiten.app añaden las atracciones que allí faltan y corrigen un «cerrado» desfasado. Pedimos valores nuevos cada cinco minutos.',
  },
  {
    question: '¿Por qué en algunos parques pone «Sin previsión»?',
    answer:
      'Un nivel de afluencia compara el parque con su propio pasado, y para eso hacen falta unos 30 días de apertura. Por eso, en parques nuevos o que abren pocas veces no aparece nada en lugar de un color inventado.',
  },
  {
    question: '¿Por qué Hansa-Park no muestra tiempos de espera?',
    answer:
      'El parque muestra sus tiempos de espera solo en su propia aplicación y únicamente con la wifi del parque, y no existe ninguna interfaz pública. Por eso en park.fan aparece encima de la lista de atracciones un aviso que explica por qué no hay tiempos.',
  },
  {
    question: '¿Qué es el rope drop?',
    answer:
      'Colocarse en una atracción concreta justo a la apertura del parque, antes de que se llenen los caminos. park.fan lo recomienda cuando la atracción llega en su pico al menos a 60 minutos y madrugar ahorra al menos 45 de ellos, e indica cuánto dura aproximadamente la ventaja.',
  },
  {
    question: '¿park.fan cuesta algo y necesito una cuenta?',
    answer:
      'No y no. Todo en park.fan es gratuito y se puede usar sin registro. Los favoritos y los planes del día se guardan en tu navegador. Solo si compartes un plan o pides avisos sobre él lo guardamos también en nuestro servidor.',
  },
  {
    question: '¿Con qué frecuencia se actualizan las cifras?',
    answer:
      'Una página de parque abierta pide valores nuevos cada cinco minutos. Los valores por día de la semana y las recomendaciones de rope drop los recalculamos una vez por noche, porque de un día para otro apenas se mueven.',
  },
];

/** The guide page's article, Spanish. */
export function ContentES() {
  const glossary = `/${GLOSSARY_SEGMENTS.es}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.es}`;
  const planner = `/${PLANNER_SEGMENTS.es}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Capítulos" />

      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan nació en una cola. Taron, media tarde, el panel marcaba algo de tres cifras y
          nadie en la cola sabía si aquello era mala suerte o simplemente un martes cualquiera.
        </Lead>
        <P>
          El tiempo de espera actual está en la entrada y en la aplicación del parque. park.fan
          añade cómo es un día normal en esa atracción, cuándo se acorta su cola y qué día compensa
          la visita.
        </P>
        <P>
          Las tarjetas, los indicadores y las tablas de más abajo son piezas del propio park.fan. La
          mayoría muestra cifras de ejemplo fijas tal como las devolvió la API en el verano y el
          otoño de 2026, casi todas de Phantasialand; dos tablas van en directo. En el parque
          tendrás las mismas tarjetas en el móvil, ya con las cifras del día.
        </P>

        <Reveal>
          <ChapterList chapters={CHAPTERS} ariaLabel="Capítulos" />
        </Reveal>
      </div>

      <SectionShell
        id="cifra"
        index="01"
        kicker="La tarjeta"
        title="Cuatro datos junto al tiempo de espera"
        icon={Gauge}
      >
        <P>
          En la entrada de Taron pone 70 minutos. Si te conviene hacer cola ahora o mejor después de
          comer, allí no lo pone. En park.fan, junto a la misma cifra, aparecen un nivel de
          afluencia, una tendencia, la cola de single rider y la altura mínima.
        </P>

        <BareNumberVsCard
          unit="minutos"
          signLabel="Lo que anuncia el parque"
          signCaption="Una cifra sin comparación."
          cardLabel="Lo que park.fan hace con ella"
          cardCaption="Los mismos 70 minutos con afluencia, tendencia, tiempo de single rider, altura mínima y el aviso de cuándo habrá menos gente."
        />

        <div className="space-y-4 pt-2">
          <P>
            El nivel de afluencia compara la cifra con el nivel normal de esa atracción, la mediana
            de sus tiempos de espera medidos. En Taron era de {TARON_BASELINE} minutos en
            septiembre, {TARON_WAIT_NOW} son algo más de una vez y media eso, y ese nivel se llama
            «Muy alta». La flechita de al lado indica si la cola está creciendo o bajando.
          </P>
          <PG>
            Si una atracción tiene cola de single rider, su tiempo de espera también está en la
            tarjeta. Lo mismo la altura mínima, para que con un niño de 120 centímetros no te
            enteres en el medidor de que no llega.
          </PG>
        </div>

        <DemoFrame
          label="Dos atracciones, el mismo minuto"
          note="Taron y Black Mamba en el mismo momento: una cola crece y la otra baja. En la página del parque todas las atracciones aparecen así, juntas y agrupadas por zonas."
          href={PARK}
          hrefLabel="Phantasialand en park.fan →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

      <Ambience>
        <SectionShell
          id="escala"
          index="02"
          kicker="La escala"
          title="Normal, lleno, récord"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} min`}
            label="La cola más larga medida en Taron"
            note="El 16 de julio de 2026. En Renania del Norte-Westfalia todavía había colegio, en las regiones vecinas ya eran vacaciones de verano. Es un solo día: figura al lado como récord y apenas mueve la escala."
          >
            <P>
              Para saber si 70 minutos son muchos hacen falta dos valores de comparación. Normal es
              lo que suele medir la cola más larga del día en esa atracción, y lleno, lo que medía
              en el diez por ciento de días más llenos.
            </P>
          </IntroWithAside>

          <div className="pt-2">
            <WaitScaleStage
              steps={SCALE_STEPS}
              wait={TARON_WAIT_NOW}
              max={WAIT_SCALE_MAX}
              record={TARON_RECORD}
              labels={SCALE_LABELS}
              legend={SCALE_LEGEND}
            >
              {SCALE_STEPS.map((step, i) => (
                <div key={step.id} data-wait-step={step.id} className="scroll-mt-28">
                  <div className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
                    {step.label}
                  </div>
                  <h3 className="mb-3 text-xl font-bold sm:text-2xl">
                    {i === 0 && 'Para un lunes, 70 minutos son muchos'}
                    {i === 1 && 'Un sábado, 70 minutos son normales'}
                    {i === 2 && 'Y una vez fueron 135'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {i === 0 && (
                      <>
                        Los lunes el pico del día suele estar en {step.typical} minutos, y en nueve
                        de cada diez lunes se queda en {step.busy} o menos. Si hoy ves{' '}
                        {TARON_WAIT_NOW}, te ha tocado uno de los lunes llenos.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Los sábados {step.typical} minutos son la mediana: en la mitad de los
                        sábados la cola más larga se quedó por debajo. La misma cifra es ese día
                        completamente normal.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Entre semana el pico suele estar en {step.typical} minutos. La línea
                        discontinua del final es el récord de {TARON_RECORD} minutos del 16 de
                        julio. Un día así distorsionaría una media, y por eso «lleno» se calcula con
                        el diez por ciento de días más llenos en lugar del máximo.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    pinned figure there that could change. */}
                  <WaitScaleBar
                    step={step}
                    wait={TARON_WAIT_NOW}
                    max={WAIT_SCALE_MAX}
                    record={TARON_RECORD}
                    labels={SCALE_LABELS}
                    className="bg-card/60 mt-5 rounded-2xl border p-5 lg:hidden"
                  />
                </div>
              ))}
            </WaitScaleStage>
          </div>

          {/* Card left, prose right: the card is a park-page sidebar component, so it keeps
              its own width and the text takes the rest. */}
          <div className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <DemoFrame
              label="En la página de una atracción"
              note="Valores de Taron consultados el 10 de septiembre de 2026."
              href={TARON}
              hrefLabel="Valores actuales de Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                La página de cada atracción lleva esta escala día de la semana a día de la semana.
                La cifra sobre la barra es el valor lleno, la parte sólida de debajo el normal, y
                abajo figura el récord con su fecha.
              </P>
              <P>
                El sábado es el único día en que los {TARON_WAIT_NOW} minutos de Taron caen justo en
                el medio. El cálculo sale de {TARON_WEEKDAY_DAYS} días medidos entre semana y{' '}
                {TARON_WEEKEND_DAYS} en fin de semana.
              </P>
            </div>
          </div>

          <DemoFrame
            label="Todo el parque, en directo"
            note="Las colas más largas de Phantasialand, tal como aparecen ahora en la página del parque. Esta tabla está calculada de otra manera que la página de una atracción: hace la media de todas las horas de apertura de los dos últimos años. «Típico» es lo que suele haber de cola dentro de una hora, «Pico», lo que hay en los minutos más llenos de esa hora. Por eso sus cifras quedan por debajo de los picos diarios de la escala de arriba."
            href={PARK}
            hrefLabel="Phantasialand en park.fan →"
          >
            <LiveTopAttractions locale="es" />
          </DemoFrame>
        </SectionShell>
      </Ambience>

      <SectionShell
        id="momento"
        index="03"
        kicker="La hora"
        title="El mejor momento del día"
        icon={Sunrise}
      >
        <P>
          «Llegar temprano» solo sirve si la cola crece a lo largo del día, y eso no ocurre en todas
          las atracciones. Seis atracciones del mismo parque, hora a hora:
        </P>

        <DemoFrame
          label="El perfil horario, en directo"
          note="En directo desde el perfil horario del parque. En negrita, la hora más llena de cada atracción."
          href={PARK}
          hrefLabel="Phantasialand en park.fan →"
        >
          <LiveHourlyProfile locale="es" />
        </DemoFrame>

        <div className="space-y-4 pt-2">
          <P>
            En Taron la hora casi da igual, porque los valores se mantienen todo el día en una banda
            estrecha y la diferencia la marca el día de la semana del capítulo 02. Chiapas, en
            cambio, se llena bastante más hasta la tarde. Por eso park.fan calcula el mejor momento
            para cada atracción por separado.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="La recomendación que sale de ahí"
            note="Solo se recomienda si la atracción llega en su pico al menos a 60 minutos y madrugar ahorra al menos 45 de ellos."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <PG>
              En la tarjeta están el tiempo de espera típico en la apertura, el pico del día, cuánto
              ahorras y hasta cuándo aguanta la ventaja.
            </PG>
            <P>
              Si el momento más tranquilo de una atracción cae en otra hora, por ejemplo a última
              hora de la tarde, también aparece en la tarjeta. En la página del parque están las
              atracciones en las que más compensa madrugar, ordenadas por minutos ahorrados.
            </P>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        id="dia"
        index="04"
        kicker="La fecha"
        title="El día adecuado, meses antes"
        icon={CalendarDays}
      >
        <P>
          La fecha decide más que la hora. Entre dos días de la misma semana puede haber media hora
          de diferencia en la espera media, según las vacaciones escolares, los festivos, los
          puentes y el tiempo.
        </P>

        <DemoFrame
          label="Una semana de vacaciones de otoño"
          note="Cuatro días medidos en Phantasialand, todos en las vacaciones de otoño de 2026 de Renania del Norte-Westfalia: el martes 20 de octubre, 45 minutos de media en las grandes atracciones, el domingo siguiente, 20. Las mismas vacaciones, cuatro niveles distintos. En park.fan, el mismo calendario va mes a mes."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page: two prose
            columns would put a third text edge under the paragraph above. */}
        <div className="space-y-4 pt-2">
          <P>
            A menudo las vacaciones de los vecinos cuentan tanto como las propias, porque los
            visitantes de un día no entienden de fronteras. Phantasialand está a unos 60 kilómetros
            de los Países Bajos, y en su calendario están las vacaciones de Renania del
            Norte-Westfalia y también las de las provincias de Limburgo y Güeldres. Las vacaciones
            de las regiones vecinas que tenemos registradas para un parque reciben su propia marca.
          </P>
          <PG>
            El color de un día futuro es una previsión, el de un día pasado está medido. En la
            página de Fancast calculamos en público cuánto aciertan nuestras previsiones.
          </PG>
          <P>
            Si un parque publica sus horarios, el calendario llega tan lejos como ellos, como mucho
            un año, y un día en que el parque cierra aparece como cerrado. Para tener una visión de
            conjunto, la página del parque resume la previsión mes a mes en «Los próximos doce
            meses».
          </P>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/fancast"
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Cuánto acierta el modelo
          </Link>
          <Link
            href={bestTime}
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Mejor época por parque
          </Link>
        </div>
      </SectionShell>

      <SectionShell
        id="plan-del-dia"
        index="05"
        kicker="El planificador"
        title="Recorrer el día por adelantado"
        icon={CalendarClock}
      >
        <P>
          En el planificador colocas en una línea de tiempo las atracciones a las que quieres subir.
          Cada bloque es tan alto como el tiempo de espera previsto para su hora, y entre dos
          bloques aparece si da tiempo a hacer el trayecto.
        </P>
        <P>
          Abajo hay un plan para Phantasialand el sábado 12 de septiembre de 2026, con la previsión
          del 4 de septiembre. Arrastra un bloque a otra hora y cambian su altura y los trayectos.
          Tu propio plan se queda como está.
        </P>

        <DemoFrame
          label="Un sábado planificado"
          href={planner}
          hrefLabel="Al planificador →"
          className="mx-auto max-w-[560px]"
        >
          <PlannerDayFigure />
        </DemoFrame>

        <P>
          En la <A href={planner}>página del planificador</A> está lo demás que puedes hacer con él,
          como marcar atracciones según la altura mínima u ordenar el día con un botón.
        </P>
      </SectionShell>

      <SectionShell
        id="pagina-parque"
        index="06"
        kicker="El recorrido"
        title="Una página de parque de arriba abajo"
        icon={Layers}
      >
        <P>
          Todo lo de los primeros capítulos está en una página por parque, en el orden en que uno se
          lo pregunta: ¿abre hoy el parque? ¿Va a llover? ¿Cuánto mide la cola? ¿Y cuándo habría
          sido mejor venir?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Solo si:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              La mitad de estas secciones solo aparece si hay algo que enseñar. Un parque sin
              espectáculos no recibe ni ficha de espectáculos ni una pestaña vacía.
            </Highlight>
            <PG>
              La pestaña elegida queda en la dirección. Si envías el enlace del mapa, quien lo abre
              llega al mapa y no a la lista de atracciones. El calendario y las estadísticas son
              páginas con su propia dirección.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Ver Phantasialand
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      <Ambience tone="emerald">
        <SectionShell
          id="noche"
          index="07"
          kicker="Los cimientos"
          title="De dónde salen las cifras"
          icon={Database}
        >
          <P>
            Cada cinco minutos pedimos tiempos de espera nuevos para cada uno de los más de 200
            parques, de hasta tres fuentes públicas. ThemeParks.wiki es la fuente base.
            Queue-Times.com y Wartezeiten.app añaden las atracciones que allí faltan y corrigen un
            «cerrado» desfasado. Para unos pocos parques, una de las dos es la única fuente.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Tiempos de espera" delay={0}>
              ThemeParks.wiki como base, Queue-Times.com y Wartezeiten.app para lo que allí falta.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vacaciones y festivos" delay={60}>
              Región por región: en Europa de Nager.Date y OpenHolidays, en otros lugares de los
              calendarios de las autoridades y los distritos escolares.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Tiempo" delay={120}>
              Open-Meteo para la previsión y una previsión de lluvia a corto plazo en cuartos de
              hora, avisos meteorológicos del DWD y de MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Horarios" delay={0}>
              De los calendarios de los parques. Donde un parque no publica ninguno, deducimos el
              horario de hoy y de los días anteriores a partir del funcionamiento de las atracciones
              e indicamos que es una estimación.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Historial" delay={60}>
              Cada tiempo de espera medido se queda guardado, también el de una mañana tranquila de
              martes.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Modelos de previsión" delay={120}>
              Uno para hoy, uno para las próximas semanas, uno para el resto del año. Cada uno se
              contrasta con los tiempos de espera reales.
            </IngredientCard>
          </IngredientGrid>

          <div className="space-y-4 pt-4">
            <P>
              Cuánto dura la cola de Taron un martes normal lo calculamos de noche, mientras los
              parques de Europa están cerrados. Cuando abres la página por la mañana, ya está listo.
            </P>
          </div>

          <NightShift
            locale="es"
            jobs={NIGHT_JOBS}
            caption="Horas en UTC. El orden hace que cada paso encuentre ya las cifras que necesita. El modelo de hoy no aprende hasta las 08:30."
          />
        </SectionShell>
      </Ambience>

      <SectionShell
        id="limites"
        index="08"
        kicker="Los límites"
        title="Cuando no lo sabemos"
        icon={HelpCircle}
      >
        <P>En tres casos preferimos dejar una casilla vacía antes que adivinar una cifra.</P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Parque sin fuente legible"
            note="Hansa-Park muestra sus tiempos de espera solo en su propia aplicación, con la wifi del parque. Por eso este aviso aparece encima de sus unas 80 atracciones y explica por qué no tienen tiempos."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Atracción fuera de temporada"
            note="Sobre una pista de hielo en agosto no informa nadie. Como conocemos su temporada, de noviembre a enero, entonces aparece como fuera de temporada y no cuenta entre las atracciones abiertas."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Sin base para valorar"
            note="Por debajo de unos 30 días de funcionamiento falta el valor de referencia. Por eso un parque nuevo recibe «Sin previsión» en lugar de un color."
          >
            <BadgeRowDemo
              crowdLabel="Los niveles"
              caption={`Cada nivel se mide contra el propio pasado de la atracción o del parque, nunca contra otros parques. Con 70 minutos, Taron está en «Muy alta» porque su nivel normal en septiembre era de ${TARON_BASELINE}.`}
            />
          </DemoFrame>
        </div>
      </SectionShell>

      <SectionShell
        id="donde"
        index="09"
        kicker="Orientación"
        title="Dónde está cada cosa"
        icon={Search}
      >
        <TouchpointGrid
          items={[
            {
              icon: Search,
              title: 'Búsqueda',
              body: (
                <>
                  La tecla / en cualquier página o el campo de búsqueda de arriba. Encuentra
                  parques, atracciones, espectáculos, restaurantes y lugares, también con erratas.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Ubicación',
              body: (
                <>
                  Si la activas, en la página de inicio aparecen los parques cercanos. Dentro de un
                  parque, una brújula señala dónde están las grandes atracciones, junto con las más
                  próximas, su distancia y su tiempo de espera.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favoritos',
              body: (
                <>
                  La estrella en parques, atracciones, espectáculos y restaurantes. Los favoritos
                  aparecen con su tiempo de espera actual en la página de inicio y en{' '}
                  <A href="/favorites">Mis favoritos</A>, guardados en el navegador, sin cuenta.
                </>
              ),
            },
            {
              icon: Bell,
              title: 'Avisos',
              body: (
                <>
                  La campana de una atracción o un espectáculo te manda un aviso cuando la espera
                  baja de tu límite, la atracción vuelve a abrir o el espectáculo está a punto de
                  empezar. Todos están en <A href="/alerts">Mis avisos</A>.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Estatura',
              body: (
                <>
                  En la pestaña Atracciones pones el control deslizante en la estatura del niño más
                  pequeño, y solo quedan las atracciones a las que puede subir. La página «Con
                  niños» de cada parque tiene el mismo control.
                </>
              ),
            },
            {
              icon: CalendarClock,
              title: 'Planificador',
              body: (
                <>
                  Se abre desde cualquier página y el plan queda en el navegador. Más sobre él en el
                  capítulo 05.
                </>
              ),
            },
            {
              icon: BarChart3,
              title: 'Página de atracción',
              body: (
                <>
                  Histórico, espera normal y llena por día de la semana, rope drop, altura mínima y
                  cuánto acierta la previsión en esa atracción.
                </>
              ),
            },
            {
              icon: Scale,
              title: 'Comparar parques',
              body: (
                <>
                  <A href="/compare">Comparar parques</A> pone de dos a cuatro parques uno junto al
                  otro, con su espera media, su cola más larga y su día de la semana más tranquilo.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog y noticias',
              body: (
                <>
                  Textos más largos sobre parques y atracciones, entre ellos{' '}
                  <A href="/blog/category/guides">guías de parques</A> con entradas, orden de visita
                  y cómo llegar. En <A href="/news">Noticias</A> hay notas breves de los parques.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Diccionario',
              body: (
                <>
                  <A href={glossary}>Todos los términos técnicos</A> con explicación y atracciones
                  de ejemplo, algunos con un modelo 3D.
                </>
              ),
            },
          ]}
        />
      </SectionShell>

      <SectionShell
        id="parky"
        index="10"
        kicker="El asistente"
        title="Pregúntale a Parky"
        icon={MessageCircle}
      >
        <ParkyShot locale="es">
          <P>
            Parky es el asistente de chat de park.fan y vive en el botón redondo de abajo a la
            derecha. En la página de inicio, en una pantalla ancha, aparece justo debajo del titular
            y no salta a su esquina hasta que haces scroll.
          </P>
          <P>
            Pregúntale cuánto duran ahora las colas, qué se prevé para hoy o para las próximas
            semanas, qué días son cortas las colas de un parque, qué altura y velocidad tiene una
            montaña rusa o qué cuentan nuestros artículos. Para cada respuesta mira en los mismos
            datos que ves en las páginas.
          </P>
          <P>
            Los parques y las atracciones te los enseña como tarjetas con sus cifras. Si se lo
            pides, te lleva a la página adecuada y prepara un día en el planificador, añade
            atracciones o las ordena. Solo ve tu ubicación si pulsas «Compartir ubicación» en el
            chat, y no la guarda.
          </P>
          <P>
            Las respuestas las redacta un modelo de lenguaje, y a veces se equivoca. Las cifras de
            las tarjetas del chat vienen directamente de park.fan; si dudas de lo que Parky dice
            sobre ellas, compruébalo en la página de la atracción. Se ciñe a parques y atracciones,
            no busca en internet y, tras tres preguntas en 30 segundos, necesita una pausa corta.
          </P>
          <P>
            Guardamos tus preguntas sin dirección IP y las borramos a los 7 días. Hay más sobre
            Parky, con preguntas de ejemplo, en <A href="/parky">su propia página</A>.
          </P>
        </ParkyShot>
      </SectionShell>

      <SectionShell
        id="faq"
        index="11"
        kicker="Consultas"
        title="Preguntas frecuentes"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="¿Y ahora?"
        title="Seguir leyendo"
        body="park.fan es gratuito, sin cuenta y sin publicidad. La página de un parque enseña todo esto con las cifras de hoy, Fancast calcula cuánto acertaron las previsiones de los últimos siete días, y la mejor época compara varios parques."
        destinations={[
          {
            href: PARK,
            label: 'Ver una página de parque de ejemplo',
            icon: Activity,
            prefetch: false,
          },
          {
            href: bestTime,
            label: 'Mejor época para visitar',
            icon: CalendarDays,
            prefetch: false,
          },
          {
            href: '/fancast',
            label: 'Acierto de las previsiones',
            icon: Sparkles,
            prefetch: false,
          },
        ]}
      />
    </>
  );
}
