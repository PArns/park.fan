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
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Ruler,
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
  AnatomyHeaderDemo,
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomySeasonDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterRail } from '../_chapter-rail';
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
  typical: 'Típico',
  busy: 'Lleno',
  unit: 'min',
  days: 'días medidos',
  record: 'Récord',
  summary:
    'Taron el {label}: normalmente {typical} minutos, {busy} en días llenos, medido sobre {days} días. En la entrada pone {wait} minutos.',
};

const SCALE_LEGEND = [
  {
    term: 'Típico',
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
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Whoever reorders them there reorders
 * them here, or the guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Cabecera',
    body: 'Nombre, ubicación y distancia, además del estado, el horario de hoy, la afluencia y cuántas atracciones están abiertas ahora mismo.',
    example: 'Phantasialand, Brühl. Hoy 09:00–19:00, 36 de 40 atracciones abiertas.',
    demo: <AnatomyHeaderDemo />,
  },
  {
    title: 'Vacaciones en el área de influencia',
    body: 'Qué vacaciones escolares y festivos afectan hoy al parque, primero los de su propia región.',
    demo: <AnatomyHolidayDemo />,
    onlyWhen: 'hoy influyen unas vacaciones o un festivo.',
  },
  {
    title: 'Aviso meteorológico',
    body: 'Avisos oficiales del DWD y de MeteoAlarm, con su texto original.',
    demo: <WeatherWarningBannerDemo />,
    onlyWhen: 'hay un aviso vigente para la ubicación.',
  },
  {
    title: 'Radar de lluvia',
    body: 'Las próximas horas en cuartos de hora. Así ves si un chubasco habrá pasado en veinte minutos.',
    demo: <NowcastBannerDemo single />,
    onlyWhen: 'hay lluvia cerca.',
  },
  {
    title: 'Tarjeta del tiempo',
    body: 'El tiempo que hace ahora, la curva del día y la previsión. Las horas en las que el parque abre ocupan la mayor parte del eje.',
    demo: <WeatherCardShowcase variant="single" />,
  },
  {
    title: 'Precios de acceso rápido',
    body: 'Precios del día de las colas de pago como Lightning Lane, con los agotados marcados como tales.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'el parque los publica, por ahora solo los parques de Disney en EE. UU.',
  },
  {
    title: 'Atracciones',
    body: 'Todas las atracciones en tarjetas como las del capítulo 01, con buscador y agrupadas por zonas. Encima están aquellas en las que compensa llegar temprano.',
    example: 'En Phantasialand, Taron figura ahí arriba con 60 minutos ahorrados.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Calendario y mapa',
    body: 'Las previsiones diarias del capítulo 04 en la retícula del mes y un mapa con todas las atracciones.',
    demo: <AnatomyCalendarDemo />,
  },
  {
    title: 'Espectáculos y restaurantes',
    body: 'Horarios de espectáculos para todo el día, restaurantes con su horario de apertura.',
    example: 'En Phantasialand, cuatro espectáculos y 46 restaurantes.',
    demo: <AnatomyShowsDemo />,
    onlyWhen: 'el parque informa de ellos.',
  },
  {
    title: 'Mejores días',
    body: 'Las fechas más tranquilas de los próximos tres meses y el día de la semana más tranquilo del parque.',
    demo: <AnatomyBestDaysDemo locale="es" />,
    onlyWhen: 'el parque publica un calendario de apertura.',
  },
  {
    title: 'Parques cercanos',
    body: 'Qué más hay al alcance, con distancia y estado.',
    example:
      'Desde Phantasialand, Toverland y Movie Park Germany, ambos a unos buenos 90 kilómetros.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'hay otro parque al alcance.',
  },
  {
    title: 'Blog',
    body: 'Entradas en las que aparece este parque.',
    demo: <AnatomyBlogDemo locale="es" />,
    onlyWhen: 'las hay.',
  },
  {
    title: 'Estadísticas',
    body: 'Las colas más largas del parque con su valor típico y lleno, además del reparto por meses y días de la semana.',
    demo: (
      <AnatomyStatsDemo
        title="Atracciones con las colas más largas"
        labelAttraction="Atracciones"
        labelMinutes="min"
        labelNow="Ahora"
        labelP50="Típico"
        labelP90="Máximo"
      />
    ),
  },
  {
    title: 'Temporada, información, preguntas',
    body: 'Temporadas y eventos, dirección y zona horaria, preguntas frecuentes sobre este parque.',
    example:
      'La pista de patinaje del capítulo 08 aparece aquí, con su temporada de noviembre a enero.',
    demo: <AnatomySeasonDemo label="Pista de patinaje" />,
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Qué tiene de típico cada hora',
    body: 'El valor típico y el lleno para cada atracción y cada hora.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.22,
    title: 'El nivel normal de cada parque',
    body: 'El valor con el que se mide la afluencia.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.42,
    title: 'Resumir el día anterior',
    body: 'Todo el día anterior en cuartos de hora.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.56,
    title: '¿Compensa madrugar?',
    body: 'Por atracción, cuánto ahorra llegar temprano y cuánto dura la ventaja.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.67,
    title: 'Lo típico por día de la semana',
    body: 'La tabla del capítulo 02 para cada atracción, más el récord.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.8,
    title: 'El modelo de previsión aprende',
    body: 'Se entrena con los tiempos de espera de ayer.',
  },
];

const FAQ = [
  {
    question: '¿Qué significan «típico» y «lleno» en un tiempo de espera?',
    answer:
      'Típico es la mediana de los picos diarios: en la mitad de los días medidos la cola más larga fue más corta. Lleno es el percentil 90 de la misma serie, más o menos el día más lleno de cada diez. El récord va aparte, para que un único valor extremo no desplace ninguno de los dos.',
  },
  {
    question: '¿Son muchos 70 minutos de espera?',
    answer:
      'Depende de la atracción y del día de la semana. En Taron, en Phantasialand, el pico de los lunes suele estar en 55 minutos, así que allí 70 son muchos. Los sábados, 70 minutos son la mediana y por tanto un día completamente normal. Ambos valores de comparación están en park.fan, en la página de la atracción.',
  },
  {
    question: '¿De dónde salen los tiempos de espera?',
    answer:
      'De tres fuentes públicas: ThemeParks.wiki, Wartezeiten.app y Queue-Times.com. Consultamos cada parque cada cinco minutos, y si las fuentes dan cifras distintas, decide la mayoría.',
  },
  {
    question: '¿Por qué en algunos parques pone «Sin previsión»?',
    answer:
      'Un nivel de afluencia compara el parque con su propio pasado, y para eso hacen falta unos 30 días de apertura. Por eso, en parques nuevos o que abren pocas veces no aparece nada en lugar de un color inventado.',
  },
  {
    question: '¿Por qué Hansa-Park no muestra tiempos de espera?',
    answer:
      'El parque muestra sus tiempos de espera solo en su propia aplicación y únicamente con la wifi del parque, y no existe ninguna interfaz pública. Por eso en park.fan aparece un aviso en lugar de 82 atracciones que parecen vacías.',
  },
  {
    question: '¿Qué es el rope drop?',
    answer:
      'Colocarse en una atracción concreta justo a la apertura del parque, antes de que se llenen los caminos. park.fan lo recomienda cuando la atracción llega en su pico al menos a 60 minutos y madrugar ahorra al menos 45 de ellos, e indica cuánto dura aproximadamente la ventaja.',
  },
  {
    question: '¿park.fan cuesta algo y necesito una cuenta?',
    answer:
      'No y no. Todo en park.fan es gratuito y se puede usar sin registro. Los favoritos y los planes del día se guardan en tu navegador.',
  },
  {
    question: '¿Con qué frecuencia se actualizan las cifras?',
    answer:
      'Una página de parque abierta pide valores nuevos cada cinco minutos. Los tiempos de espera típicos y las recomendaciones de rope drop los recalculamos una vez por noche, porque de un día para otro apenas se mueven.',
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
          Las tarjetas, los indicadores y las tablas de más abajo son piezas del propio park.fan,
          alimentadas con cifras de ejemplo fijas de Phantasialand. En el parque tendrás las mismas
          tarjetas en el móvil, ya con las cifras del día.
        </P>

        <Reveal>
          <nav
            aria-label="Capítulos"
            className="bg-muted/40 not-prose grid gap-x-6 gap-y-2 rounded-2xl border p-5 text-sm sm:grid-cols-2 lg:grid-cols-3"
          >
            {CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="text-muted-foreground hover:text-primary group flex items-baseline gap-2 transition-colors"
              >
                <span className="text-primary/40 group-hover:text-primary/70 text-xs font-bold tabular-nums transition-colors">
                  {c.index}
                </span>
                {c.label}
              </a>
            ))}
          </nav>
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
            El nivel de afluencia compara la cifra con lo que es normal en esa atracción. Taron está
            de media en {TARON_BASELINE} minutos, {TARON_WAIT_NOW} son algo más de una vez y media
            eso, y ese nivel se llama «Muy alta». La flechita de al lado indica si la cola está
            creciendo o bajando.
          </P>
          <PG>
            Si una atracción tiene cola de single rider, su tiempo de espera también está en la
            tarjeta. Lo mismo la altura mínima, para que con un niño de 130 centímetros no te
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
          title="Típico, lleno, récord"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} min`}
            label="La cola más larga medida en Taron"
            note="El 16 de julio de 2026, en vacaciones de verano. Es un solo día, y por eso figura aparte como récord y no entra en la escala."
          >
            <P>
              Para saber si 70 minutos son muchos hacen falta dos valores de comparación. Típico es
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
                    {i === 1 && 'Para un sábado, 70 minutos son lo normal'}
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
                        Los sábados {step.typical} minutos son la mediana. La misma cifra es ese día
                        completamente normal, y las atracciones de al lado están igual de llenas.
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
                La cifra sobre la barra es el valor lleno, la parte sólida de debajo el típico, y
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
            label="La misma tabla para todo el parque, en directo"
            note="El estado actual de Phantasialand, con el valor típico y el lleno de cada atracción."
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
          label="Cuatro días de las vacaciones de otoño"
          note="El 15 de octubre es el más tranquilo de los cuatro aunque cae en plenas vacaciones, porque llueve. El 19 el parque está cerrado. En park.fan, el mismo calendario va mes a mes."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page: two prose
            columns would put a third text edge under the paragraph above. */}
        <div className="space-y-4 pt-2">
          <P>
            A menudo las vacaciones de los vecinos cuentan tanto como las propias, porque los
            visitantes de un día no entienden de fronteras. Phantasialand está a unos 90 kilómetros
            de los Países Bajos, y en su calendario están las vacaciones de Renania del
            Norte-Westfalia y también las de la provincia de Güeldres. Las regiones de vacaciones en
            un radio de unos 200 kilómetros reciben su propia marca.
          </P>
          <PG>
            El color de un día es una previsión. En la página de Fancast calculamos en público
            cuánto aciertan nuestras previsiones.
          </PG>
          <P>
            En un parque que abre todo el año, el calendario llega a unos once meses vista. En un
            parque de temporada termina con la temporada publicada, y un día en que el parque cierra
            aparece como cerrado.
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
              espectáculos no recibe una pestaña de espectáculos vacía.
            </Highlight>
            <PG>
              La pestaña elegida queda en la dirección. Si envías el enlace del calendario, quien lo
              abre llega al calendario y no a la lista de atracciones.
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
            Cada cinco minutos consultamos cada uno de los 212 parques en tres fuentes públicas a la
            vez. Si dan cifras distintas, decide la mayoría.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Tiempos de espera" delay={0}>
              ThemeParks.wiki, Wartezeiten.app y Queue-Times.com, cada cinco minutos.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vacaciones y festivos" delay={60}>
              Nager.Date para festivos y puentes, OpenHolidays para vacaciones escolares, cada
              región por separado.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Tiempo" delay={120}>
              Open-Meteo para la previsión y el radar de lluvia, avisos meteorológicos del DWD y de
              MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Horarios" delay={0}>
              De los calendarios de los parques. Donde un parque no publica ninguno, estimamos el
              horario a partir del funcionamiento de las atracciones y lo indicamos.
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
              parques están cerrados. Cuando abres la página por la mañana, ya está listo.
            </P>
          </div>

          <NightShift
            locale="es"
            jobs={NIGHT_JOBS}
            caption="Horas en UTC. Cada paso se apoya en el anterior."
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
            note="Hansa-Park muestra sus tiempos de espera solo en su propia aplicación, con la wifi del parque. Sin este aviso, en park.fan aparecerían 82 atracciones que parecen vacías."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Atracción fuera de temporada"
            note="Sobre una pista de hielo en agosto no informa nadie. Por eso aparece como fuera de temporada y ese día no cuenta entre las atracciones abiertas."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Sin base para valorar"
            note="Por debajo de unos 30 días de funcionamiento falta el valor de referencia. Por eso un parque nuevo recibe «Sin previsión» en lugar de un color."
          >
            <BadgeRowDemo
              crowdLabel="Afluencia: cuánto se llena ahora"
              comparisonLabel="Comparación: ¿más que de costumbre?"
              caption="Con 70 minutos, Taron está en «Muy alta», y frente a sus 45 minutos típicos, en «Mucho más alto». En un parque pequeño donde 25 minutos son lo normal, «Muy alta» puede aparecer junto a «Típico»."
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
                  Ctrl + K o ⌘ + K en cualquier página. Encuentra parques, atracciones, espectáculos
                  y restaurantes, también con erratas.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Ubicación',
              body: (
                <>
                  Si la activas, en la página de inicio aparecen los parques cercanos, y dentro de
                  un parque, las atracciones más próximas con distancia y tiempo de espera.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favoritos',
              body: (
                <>
                  La estrella de cada tarjeta de parque y de atracción. Los favoritos aparecen en la
                  página de inicio con su tiempo de espera actual y se guardan en el navegador, sin
                  cuenta.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Estatura',
              body: (
                <>
                  En la pestaña Atracciones pones el control deslizante en la estatura del niño más
                  pequeño, y solo quedan las atracciones a las que puede subir.
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
                  Histórico, tiempos de espera típicos por día de la semana, rope drop, altura
                  mínima y cuánto acierta la previsión en esa atracción.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Textos más largos sobre parques y atracciones, entre ellos{' '}
                  <A href="/blog/category/guides">guías de parques</A> con entradas, orden de visita
                  y cómo llegar.
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
        id="faq"
        index="10"
        kicker="Consultas"
        title="Preguntas frecuentes"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="¿Y ahora?"
        title="Seguir leyendo"
        body="park.fan es gratuito, sin cuenta y sin publicidad. La página de un parque enseña todo esto con las cifras de hoy, Fancast calcula cuánto acertaron las previsiones de los últimos 30 días, y la mejor época compara varios parques."
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
