import React from 'react';
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
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CloudSun,
  Compass,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Moon,
  Ruler,
  Search,
  Sparkles,
  Star,
  Sunrise,
  Users,
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
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, ClosingBand, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterRail, type Chapter } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/**
 * Feeds both the chapter list at the top and the rail down the right edge, and
 * must match the `<SectionShell id=… index=…>` calls below exactly — the rail
 * looks its sections up by id, so an entry that drifts silently stops
 * highlighting.
 */
const CHAPTERS: Chapter[] = [
  { id: 'cifra', index: '01', label: 'Una cifra sola' },
  { id: 'escala', index: '02', label: 'Típico, lleno, récord' },
  { id: 'momento', index: '03', label: 'El mejor momento' },
  { id: 'dia', index: '04', label: 'El día adecuado' },
  { id: 'pagina-parque', index: '05', label: 'Una página de parque de arriba abajo' },
  { id: 'noche', index: '06', label: 'De dónde salen las cifras' },
  { id: 'limites', index: '07', label: 'Cuando no lo sabemos' },
  { id: 'visitas', index: '08', label: 'Cuatro visitas' },
  { id: 'donde', index: '09', label: 'Dónde está cada cosa' },
  { id: 'faq', index: '10', label: 'Preguntas frecuentes' },
];

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
    def: 'Mediana de los picos diarios. En la mitad de los días medidos, la cola más larga fue más corta que eso.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Lleno',
    def: 'Percentil 90 de la misma serie. Ese día de cada diez en que había especialmente gente.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'Lo que pone en la entrada. Se queda quieto mientras la escala de debajo se desplaza.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Récord',
    def: `${TARON_RECORD} minutos el 16 de julio de 2026. El peor día del periodo medido, y justo por eso no sirve de referencia.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them. Numbers come
 * from `TARON_TYPICAL_WAITS`, so from the API rather than from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Lunes', typical: 55, busy: 65, sampleDays: 19 },
  { id: 'saturday', label: 'Sábado', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Entre semana', typical: 60, busy: 80, sampleDays: 97 },
];

/**
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Reorder them here and you reorder them
 * there too, or this guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Cabecera',
    body: 'Nombre, ubicación, distancia desde donde estás, además del estado, el horario de hoy, la afluencia de este momento y el contador «x de y abiertas».',
    example: 'Phantasialand, Brühl. Hoy 09:00–19:00, 36 de 40 atracciones abiertas.',
  },
  {
    title: 'Vacaciones en el área de influencia',
    body: 'Qué vacaciones escolares afectan hoy a este parque, con su región. También las del otro lado de la frontera.',
    example:
      'Hoy para Phantasialand no cuenta Renania del Norte-Westfalia sino Güeldres: allí hay vacaciones escolares, y la frontera está a 90 kilómetros.',
    onlyWhen: 'hoy hay realmente una región de vacaciones que influye.',
  },
  {
    title: 'Aviso meteorológico',
    body: 'Avisos oficiales del DWD y de MeteoAlarm, recogidos sin cambios. Sin juicio propio sobre el tiempo.',
    example: 'El texto del DWD, sin tocar. Para parques fuera de Alemania, el de MeteoAlarm.',
    demo: <WeatherWarningBannerDemo />,
    onlyWhen: 'hay un aviso activo para la ubicación.',
  },
  {
    title: 'Radar de lluvia',
    body: 'Las próximas horas en pasos de cuarto de hora. Dice si el chubasco habrá pasado en veinte minutos o si se queda toda la tarde.',
    example:
      'Cuartos de hora en vez de horas: un chubasco de 14:15 a 14:30 desaparece dentro de un valor horario; aquí está.',
    demo: <NowcastBannerDemo single />,
    onlyWhen: 'hay precipitación al alcance.',
  },
  {
    title: 'Tarjeta del tiempo',
    body: 'Valor actual, curva del día y previsión. El eje horario está construido alrededor del horario de apertura: las horas en las que el parque abre reciben cuatro veces más espacio que las de antes y después.',
    example:
      'Para Phantasialand hoy: las horas de 09:00 a 19:00 ocupan tres cuartos del ancho, y la noche anterior y posterior el resto.',
    demo: <WeatherCardShowcase variant="single" />,
  },
  {
    title: 'Precios de acceso rápido',
    body: 'Precios diarios de las colas de pago, agotados incluidos.',
    example:
      'Lightning Lane en los parques Disney, un precio del día por atracción, agotado marcado como tal.',
    onlyWhen:
      'el parque los publica en su calendario. Por ahora solo los parques de Disney en EE. UU.',
  },
  {
    title: 'Atracciones',
    body: 'La primera pestaña, con el número de atracciones en el título. Tarjetas como las del capítulo 01, con buscador y agrupadas por zonas. Arriba, el resumen de rope drop del parque, ordenado por minutos ahorrados.',
    example:
      'Taron en Klugheim, desde 140 centímetros — la tarjeta del capítulo 01. Encima la lista de rope drop, encabezada por Chiapas con 75 minutos ahorrados.',
  },
  {
    title: 'Calendario y mapa',
    body: 'Dos pestañas fijas al lado: las previsiones diarias del capítulo 04 y un mapa con las atracciones como marcadores.',
    example: 'Los cuatro días del capítulo 04, en la retícula del mes junto a sus vecinos.',
  },
  {
    title: 'Espectáculos y restaurantes',
    body: 'Horarios de espectáculos para todo el día, restauración con horarios de apertura.',
    example: 'Phantasialand ofrece cuatro espectáculos y 46 restaurantes, ambos con horarios.',
    onlyWhen: 'el parque los facilita. Si no, la pestaña no aparece.',
  },
  {
    title: 'Mejores días',
    body: 'Las fechas más tranquilas de los próximos tres meses, además del día de la semana más tranquilo del parque.',
    example:
      'El día de la semana más tranquilo del parque y las próximas fechas tranquilas — el mismo cálculo que en el capítulo 04, a tres meses.',
    onlyWhen: 'el parque publica un calendario de apertura.',
  },
  {
    title: 'Parques cercanos',
    body: 'Qué más hay al alcance, con distancia y estado actual.',
    example:
      'Desde Phantasialand: Toverland y Movie Park Germany, ambos a unos buenos 90 kilómetros.',
    onlyWhen: 'hay vecinos. En aproximadamente la mitad de los 212 parques, no los hay.',
  },
  {
    title: 'Blog',
    body: 'Entradas del blog de park.fan en las que aparece este parque.',
    example:
      'La página de Phantasialand lleva, entre otras, la entrada que acompaña a esta página.',
    onlyWhen: 'las hay.',
  },
  {
    title: 'Estadísticas',
    body: 'Las colas más largas del parque con su valor típico y lleno, además del reparto por meses y días de la semana. La sección indica cuántos días registrados hay detrás, y ambos repartos lo llevan como columna propia.',
    example:
      'El ranking del capítulo 02, más los meses y días de la semana con su número de días medidos.',
  },
  {
    title: 'Temporada, información, preguntas',
    body: 'Periodos de apertura y eventos anunciados, dirección y zona horaria, y las preguntas frecuentes sobre este parque en concreto.',
    example: 'La pista de patinaje del capítulo 07 figura aquí con noviembre a enero.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Qué tiene de típico cada hora',
    body: 'Para cada atracción y cada hora, el valor típico y el lleno. Las horas con menos de tres mediciones se caen.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.22,
    title: 'El nivel normal de cada parque',
    body: 'La mediana contra la que se calcula la afluencia de ahora. Sin ella, 70 minutos es solo una cifra.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.42,
    title: 'Resumir el día anterior',
    body: 'Todo el día anterior se condensa en cuartos de hora. Nada que necesite el perfil de un día puede calcularse antes.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.56,
    title: '¿Compensa madrugar?',
    body: 'Por atracción: cuánto ahorra la apertura, cuánto dura la ventaja, cuándo cae el momento más tranquilo.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.67,
    title: 'Lo típico por día de la semana',
    body: 'La tabla del capítulo 02, recalculada para cada atracción, más el día récord con su fecha.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.8,
    title: 'El modelo de previsión aprende',
    body: 'Se entrena con los tiempos de espera de ayer. Una vez entero, cada mañana.',
  },
];

const FAQ = [
  {
    question: '¿Qué significan «típico» y «lleno» en un tiempo de espera?',
    answer:
      'Típico es la mediana de los picos diarios: en la mitad de los días medidos la cola más larga fue más corta, en la otra mitad más larga. Lleno es el percentil 90 de la misma serie, aproximadamente ese día de cada diez en que había especialmente gente. El récord absoluto va aparte, para que un único valor extremo no desplace ninguno de los dos.',
  },
  {
    question: '¿Son muchos 70 minutos de espera?',
    answer:
      'Depende de la atracción y del día de la semana. Taron, en Phantasialand, llega los lunes a 55 minutos de forma típica y se queda por debajo de 65 en nueve de cada diez lunes; ahí 70 minutos son un día inusualmente lleno. Los sábados la mediana de la misma atracción es exactamente 70 minutos, y entonces la misma cifra es completamente normal. Ambos valores de comparación están en park.fan, en la página de la atracción, para no tener que adivinarlos.',
  },
  {
    question: '¿De dónde salen los tiempos de espera?',
    answer:
      'De tres fuentes públicas a la vez: ThemeParks.wiki, Wartezeiten.app y Queue-Times.com. Cada parque se consulta cada cinco minutos. Si dos fuentes dan cifras distintas, decide la mayoría, después la mediana, después la media. El resultado se redondea a cinco minutos, porque los propios parques anuncian en pasos de cinco minutos.',
  },
  {
    question: '¿Por qué en algunos parques pone «Sin previsión»?',
    answer:
      'Porque falta la base. Un nivel de afluencia nace de la comparación con el propio pasado del parque, y para eso hacen falta unos 30 días de apertura. En parques nuevos o que abren pocas veces no aparece nada en lugar de un color inventado.',
  },
  {
    question: '¿Por qué Hansa-Park no muestra tiempos de espera?',
    answer:
      'El parque publica sus tiempos de espera solo en su propia aplicación y únicamente para dispositivos conectados a la wifi del parque. No existe ninguna interfaz pública desde la que pudiéramos leerlos. Como un parque sin fuente tiene en los datos exactamente el mismo aspecto que un parque cerrado de noche, esta es una entrada curada y no una deducción: el aviso en park.fan lo dice, en lugar de mostrar 82 atracciones supuestamente vacías.',
  },
  {
    question: '¿Qué es el rope drop?',
    answer:
      'Colocarse en una atracción concreta justo a la apertura del parque, antes de que se llenen los caminos. park.fan solo lo recomienda si se cumplen dos condiciones: el pico diario de la atracción llega al menos a 60 minutos y madrugar ahorra al menos 45 de ellos. Siempre indica cuánto dura aproximadamente la ventaja.',
  },
  {
    question: '¿park.fan cuesta algo y necesito una cuenta?',
    answer:
      'No y no. Todos los tiempos de espera, estadísticas, calendarios y previsiones son gratuitos y se pueden usar sin registro. Los favoritos se guardan como cookie en el navegador, no en un servidor.',
  },
  {
    question: '¿Con qué frecuencia se actualizan las cifras de la página?',
    answer:
      'Una página de parque abierta en park.fan pide valores nuevos cada cinco minutos, al mismo ritmo con el que se consultan las fuentes. Los valores estadísticos, como los tiempos de espera típicos o las recomendaciones de rope drop, se recalculan una vez por noche, porque de un día para otro apenas se mueven.',
  },
];

export function ContentES() {
  const glossary = `/${GLOSSARY_SEGMENTS.es}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.es}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Capítulos" />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan nació en una cola. Taron, media tarde, el panel marcaba algo de tres cifras y
          nadie sabía decir si aquello era mala suerte o simplemente un martes.
        </Lead>
        <P>
          Esa pregunta sigue siendo el centro de la web. Mostrar un tiempo de espera actual es la
          parte fácil: la mayoría de los parques lo publican ellos mismos, en la entrada y en su
          propia aplicación, que a menudo solo funciona con la wifi del parque. Solo se vuelve
          interesante cuando al lado pone cómo es un día normal en esa atracción, cuándo suele
          acortarse la cola y si hoy es siquiera un buen día.
        </P>
        <P>
          En esta página no hay ninguna captura de pantalla. Cada tarjeta, cada indicador y cada
          tabla de abajo son piezas reales de park.fan, aquí solo rellenadas con cifras de ejemplo
          fijas. Las mismas tarjetas estarán delante de ti una hora después en el parque.
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

      {/* ── 01 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="cifra"
        index="01"
        kicker="El punto de partida"
        title="Una cifra sola no dice nada"
        icon={Gauge}
      >
        <P>
          En la entrada de Taron lucen 70 minutos, nada más. La cola se agolpa ya desde la primera
          escalera. En el móvil aparece la misma cifra. Ninguna de las dos te dice si merece la pena
          ponerse en la cola ahora mismo o más tarde. En park.fan la acompañan cuatro datos más: un
          nivel de afluencia, una tendencia, la segunda cola y la altura mínima.
        </P>

        <BareNumberVsCard
          unit="minutos"
          signLabel="Lo que anuncia el parque"
          signCaption="Una cifra, sin referencia. Si hoy es buena o mala solo lo sabe quien ya ha venido aquí suficientes veces."
          cardLabel="Lo que park.fan hace con ella"
          cardCaption="Los mismos 70 minutos, más nivel de afluencia, tendencia, tiempo de single rider, altura mínima y el aviso de cuándo es previsible que se calme."
        />

        <div className="space-y-4 pt-2">
          <P>
            «Muy alta» no es aquí una cuestión de gustos. Taron está de media en {TARON_BASELINE}{' '}
            minutos, {TARON_WAIT_NOW} son alrededor del 156 por ciento de eso, y los niveles cambian
            al 60, 89, 110, 150 y 200 por ciento. A partir de 150 se llama «Muy Alta». La flechita
            de al lado sale de las últimas mediciones y dice si la cola está creciendo o bajando.
          </P>
          <PG>
            El segundo valor de la tarjeta es la cola de single rider. Muchas atracciones tienen
            varias colas en paralelo, y cuál de ellas existe casi nunca se indica en la entrada.
            Además, la altura mínima, para que nadie cruce medio parque con un niño de 130
            centímetros.
          </PG>
        </div>

        <DemoFrame
          label="Dos atracciones, el mismo minuto"
          note="Las dos tarjetas son del mismo instante en el mismo parque, Taron en Klugheim y Black Mamba en Deep in Africa. Una cola crece, la otra baja. Aquí, en park.fan, todas las atracciones del parque aparecen así, una al lado de otra y agrupadas por zonas."
          href={PARK}
          hrefLabel="Phantasialand en park.fan →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

      {/* ── 02 ──────────────────────────────────────────────────────────── */}
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
            note="El 16 de julio de 2026, en vacaciones de verano. Un solo día de 365, y por eso la escala trabaja con percentiles en lugar de con el máximo."
          >
            <P>
              Para situar una cifra hacen falta dos valores de comparación y saber en qué se apoyan.
              park.fan usa para ello la mediana de los picos diarios y el percentil 90 de la misma
              serie. En claro: cuánto mide habitualmente la cola más larga del día y cuánto medía en
              el diez por ciento de días más llenos.
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
                    {i === 1 && 'Para un sábado es exactamente lo normal'}
                    {i === 2 && 'Y una vez fueron 135'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {i === 0 && (
                      <>
                        Los lunes el pico del día está en {step.typical} minutos, y en nueve de cada
                        diez lunes se queda por debajo de {step.busy}. Los {TARON_WAIT_NOW}{' '}
                        anunciados están por encima. Quien esté aquí ha pillado el lunes más lleno
                        en semanas, y las atracciones de al lado suelen ser entonces la mejor idea.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Los sábados {step.typical} minutos son la mediana. La misma cifra, el mismo
                        sitio, la misma atracción: ese día es sencillamente normal. Enfadarse no
                        sirve, cambiar de plan tampoco, porque las atracciones de al lado tienen el
                        mismo sábado.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Sobre los {step.sampleDays} días laborables medidos, el pico está en{' '}
                        {step.typical} minutos. La línea discontinua de más a la derecha es el día
                        de {TARON_RECORD} minutos del 16 de julio. Precisamente por días así «lleno»
                        es un percentil y no un máximo: un único valor extremo desplazaría una media
                        y dejaría inservible todo lo que hay por debajo.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    running figure there for anything to change on. */}
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

          {/* Card left, prose right. The card is a park-page sidebar component and
              looks absurd stretched across a 1500 px column, so it keeps its own
              width and the text takes the rest instead of leaving a hole. */}
          <div className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <DemoFrame
              label="En la página de una atracción"
              note="Valores reales de Taron, consultados el 24 de agosto de 2026."
              href={TARON}
              hrefLabel="Valores reales de Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                La misma distribución en barras, día de la semana a día de la semana. La cifra sobre
                cada barra es la marca de «lleno» de ese día, la parte sólida de debajo el valor
                típico, y abajo a la derecha el récord con su fecha. Un día de la semana sin base no
                recibe una barra estimada, sino ninguna.
              </P>
              <P>
                El sábado es el único día en que los {TARON_WAIT_NOW} del principio caen justo en el
                medio. Un lunes, los mismos minutos serían la excepción.
              </P>
              <P>
                Lo sólido que sea todo esto depende del número de días medidos: aquí se han juntado{' '}
                {TARON_WEEKDAY_DAYS} entre semana y {TARON_WEEKEND_DAYS} en fin de semana. La propia
                tarjeta indica el periodo sobre el que calcula. Para el parque entero, el total de
                días registrados está en la sección de estadísticas de park.fan, y en las tablas por
                mes y por día de la semana aparece como columna propia.
              </P>
            </div>
          </div>

          <DemoFrame
            label="La misma tabla para todo el parque, en directo"
            note="Sin cifras de ejemplo: este es el estado actual de Phantasialand, el valor típico y el valor lleno de cada atracción. En la página del parque, la línea encima de esta sección dice sobre cuántos días registrados calcula. Todos los minutos van en pasos de cinco, porque los parques anuncian en pasos de cinco."
            href={PARK}
            hrefLabel="Phantasialand en park.fan →"
          >
            <LiveTopAttractions locale="es" />
          </DemoFrame>

          <Highlight>
            Esta tabla es la razón por la que archivamos los tiempos de espera. Una cifra en directo
            se puede pedir en el momento en que alguien pregunta. Una mediana sobre cada martes
            medido tiene que estar lista antes de que llegue la pregunta.
          </Highlight>
        </SectionShell>
      </Ambience>

      {/* ── 03 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="momento"
        index="03"
        kicker="La hora"
        title="El mejor momento del día"
        icon={Sunrise}
      >
        <P>
          «Ve temprano» es el consejo que da todo el mundo. Solo se cumple si la cola crece a lo
          largo del día, y eso no pasa ni mucho menos en todas partes. Seis atracciones del mismo
          parque, la misma tabla, el mismo año:
        </P>

        <DemoFrame
          label="El perfil horario real, ahora mismo"
          note="En directo desde el perfil horario del parque. En negrita, la hora más fuerte de cada atracción, y entre estas seis no coincide en absoluto. Una hora solo se convierte en columna cuando tiene al menos diez días medidos en esa atracción, alcanza al menos el 40 por ciento de la hora mejor medida y la reporta al menos la mitad de las atracciones. Eso descarta las horas de los extremos, donde si no una única cola de clientes del hotel hablaría por toda la mañana."
          href={PARK}
          hrefLabel="Phantasialand en park.fan →"
        >
          <LiveHourlyProfile locale="es" />
        </DemoFrame>

        <div className="space-y-4 pt-2">
          <P>
            Taron es el caso en que la hora casi no decide nada: la fila se mantiene todo el día en
            una banda estrecha, y lo que marca la diferencia es el día de la semana del capítulo 02.
            Con Chiapas ocurre lo contrario: los valores suben claramente hasta la tarde. Una única
            regla para todo el parque sería falsa para una de las dos, y por eso se calcula por
            atracción.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="La recomendación que sale de ahí"
            note="Solo se recomienda si el pico del día llega al menos a 60 minutos y madrugar ahorra al menos 45 de ellos. Colorado Adventure, en el mismo parque, ahorra 40 minutos sobre un pico de 50 y por eso no recibe ningún aviso."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <PG>
              La tarjeta da tres cifras y una hora: el tiempo de espera típico en la apertura, el
              pico del día, la diferencia y la ventana en la que aguanta la ventaja. Después
              desaparece, y así lo pone.
            </PG>
            <P>
              La tarjeta nombra además el momento más tranquilo del día, pero solo si cae fuera de
              la ventana temprana. En Taron no cae fuera: ambos están en la misma hora, así que aquí
              no hay una segunda hora. En otras atracciones es la tarde, y entonces la tarjeta
              indica esa hora. Para todo el parque, el resumen de atracciones lista aquellas en las
              que más compensa madrugar, ordenadas por minutos ahorrados.
            </P>
          </div>
        </div>
      </SectionShell>

      {/* ── 04 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="dia"
        index="04"
        kicker="La fecha"
        title="El día adecuado, meses antes"
        icon={CalendarDays}
      >
        <P>
          La fecha decide más que la hora. Entre dos días de la misma semana puede haber media hora
          de espera media de diferencia, y un calendario corriente no lo delata. La diferencia la
          marcan las vacaciones escolares, los festivos, los puentes y el tiempo.
        </P>

        <DemoFrame
          label="Cuatro días de las vacaciones de otoño"
          note="El 15 de octubre es el más tranquilo de los cuatro aunque cae en plenas vacaciones: llueve. El 19 está en gris porque ese día el parque cierra. En park.fan, el mismo calendario va mes a mes, hasta donde llega la previsión de ese parque."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page. As two
            prose columns this band put a third text edge under the paragraph above
            it: a run of copy, then a 604 px column ending short of it, then a
            second column starting where that paragraph still had words. */}
        <div className="space-y-4 pt-2">
          <P>
            Los calendarios de vacaciones vienen de dos fuentes públicas y cubren cuatro años cada
            uno. A menudo importan más las del vecino que las propias. Un ejemplo de hoy: para
            Phantasialand la entrada de vacaciones determinante en el calendario no es Renania del
            Norte-Westfalia, sino las vacaciones de verano de la provincia neerlandesa de Güeldres.
            El parque está a 90 kilómetros de la frontera, y los visitantes de un día no entienden
            de fronteras. Por eso también cuentan las regiones en un radio de unos 200 kilómetros, y
            reciben su propia marca en el calendario.
          </P>
          <PG>
            El color de un día es una previsión, no una medición. Sale de un modelo que se reentrena
            cada noche con los tiempos de espera del día anterior y que después se puede contrastar
            con la realidad.
          </PG>
          <P>
            Hasta dónde llega el calendario depende del parque. Un parque que abre todo el año
            recibe previsión unos once meses antes. En un parque de temporada se detiene donde acaba
            la temporada publicada: para un martes de marzo en el que Phantasialand está
            demostrablemente cerrado, el calendario pone cerrado y ningún color de afluencia.
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

      {/* ── 05 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="pagina-parque"
        index="05"
        kicker="El recorrido"
        title="Una página de parque de arriba abajo"
        icon={Layers}
      >
        <P>
          Todo lo anterior está en park.fan en una sola página por parque, construida en el orden en
          que la gente pregunta: ¿abre hoy el parque? ¿Va a llover? ¿Cuánto mide la cola? ¿Y cuándo
          habría sido mejor venir?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Solo si:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              La mitad de estos bloques depende de una condición, y es a propósito. Un parque sin
              espectáculos no recibe una pestaña de espectáculos vacía, y alrededor de la mitad de
              los 212 parques no muestra sección de vecinos, porque no hay nada al alcance.
            </Highlight>
            <PG>
              Las pestañas recuerdan su elección en la dirección. Quien tenga abierto el calendario
              y pase el enlace, envía el calendario y no la lista de atracciones.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Verlo sobre un parque real
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
      <Ambience tone="emerald">
        <SectionShell
          id="noche"
          index="06"
          kicker="Los cimientos"
          title="De dónde salen las cifras"
          icon={Database}
        >
          <P>
            Cada cinco minutos se consulta cada uno de los 212 parques, desde tres fuentes públicas
            a la vez. Si se contradicen, decide la mayoría, después la mediana, después la media.
            Solo se guarda lo que ha cambiado, redondeado a cinco minutos, porque los propios
            parques anuncian en pasos de cinco minutos.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Tiempos de espera" delay={0}>
              ThemeParks.wiki, Wartezeiten.app y Queue-Times.com, cada cinco minutos. La materia
              prima de todo lo demás en esta página.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vacaciones y festivos" delay={60}>
              Nager.Date para festivos oficiales y puentes, OpenHolidays para vacaciones escolares.
              Cuatro años, cada región por separado, actualizado cada mes.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Tiempo" delay={120}>
              Open-Meteo para la previsión, el histórico y el radar de lluvia de 15 minutos. Los
              avisos oficiales vienen del DWD y de MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Horarios" delay={0}>
              De los calendarios de los parques. Donde un parque no publica ninguno, reconstruimos
              el día a partir de la actividad de las atracciones y lo marcamos como estimado.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Historial" delay={60}>
              No se borra nada. Los periodos antiguos solo se comprimen, para que cada análisis siga
              corriendo sobre todas las mediciones.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Modelos de previsión" delay={120}>
              Separados por horizonte: uno para el día en curso, uno para las próximas semanas, uno
              para el resto del año. Cada uno se contrasta con los tiempos reales.
            </IngredientCard>
          </IngredientGrid>

          <div className="space-y-4 pt-4">
            <P>
              La segunda mitad ocurre de noche, mientras los parques están cerrados. «Cuánto dura la
              cola de Taron un martes normal» es una mediana sobre cada martes medido del último
              año. Eso no se lanza cuando alguien abre una página, tarda demasiado. Tiene que estar
              ahí antes de que llegue la pregunta.
            </P>
            <P>
              Seis pasos en un orden fijo, cada noche. Cada uno lee lo que escribió el anterior, así
              que ninguno puede adelantarse. Cuando abres la página por la mañana, todo eso ya está
              calculado.
            </P>
          </div>

          <NightShift
            locale="es"
            jobs={NIGHT_JOBS}
            caption="Horas en UTC, o sea de madrugada. El orden explica las horas: «¿compensa madrugar?» a las 05:15 necesita el día anterior en cuartos de hora, y eso no se escribe hasta las 04:30."
          />
        </SectionShell>
      </Ambience>

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="limites"
        index="07"
        kicker="Los límites"
        title="Cuando no lo sabemos"
        icon={HelpCircle}
      >
        <P>
          Algunas casillas se quedan vacías aquí, y es a propósito. Tres casos en los que park.fan
          prefiere no decir nada antes que adivinar.
        </P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Parque sin fuente legible"
            note="Hansa-Park publica los tiempos de espera solo en su propia aplicación, en la wifi del parque. En los datos eso se ve igual que un parque en plena noche, por eso figura como aviso curado en park.fan. Sin él aparecerían 82 atracciones en «muy baja»."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Atracción fuera de temporada"
            note="Sobre una pista de hielo en agosto no informa nadie, porque no hay nada que informar. Leer ese silencio como «abierta» convierte una falta de datos en una atracción abierta. Ese día la atracción tampoco cuenta en el contador «12 de 45 abiertas»."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Sin base para valorar"
            note="«Sin previsión» es para los parques que todavía no sabemos evaluar: por debajo de unos 30 días de funcionamiento falta el valor de referencia. Un parque nuevo se queda sin color antes que con uno adivinado."
          >
            <BadgeRowDemo
              crowdLabel="Afluencia: cuánto se llena ahora"
              comparisonLabel="Comparación: ¿más que de costumbre?"
              caption="Dos escalas, un ejemplo: con 70 minutos Taron marca «Muy alta» — eso es la afluencia. Frente a sus 45 minutos típicos es «Mucho mayor» — eso es la comparación consigo mismo. Un parque pequeño puede estar en «Muy alta» y aun así en «Típico»: allí 25 minutos son lo normal."
            />
          </DemoFrame>
        </div>

        <Highlight>
          La misma regla vale para la detección de temporada. Los meses de funcionamiento de una
          atracción no los nombramos hasta 330 días de observación. Antes de eso no aparece ningún
          mes, porque «funciona de diciembre a abril» describiría el periodo en el que casualmente
          ya hemos medido.
        </Highlight>
      </SectionShell>

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="visitas"
        index="08"
        kicker="En la práctica"
        title="Cuatro visitas"
        icon={Users}
      >
        <P>
          Los mismos datos responden a preguntas muy distintas. Cuatro ejemplos, cada uno con el
          camino que tomaríamos.
        </P>

        <div className="grid gap-5 lg:grid-cols-2">
          <PersonaBlock
            icon={CalendarDays}
            who="Familia, un día en las vacaciones de otoño"
            question="«¿Qué día de la semana de vacaciones es el más tranquilo y qué hacemos si llueve?»"
            steps={[
              <>
                Abrir la página del parque, pestaña <strong>Calendario</strong>. La semana de
                vacaciones aparece como bloque, coloreada según la previsión, con el tiempo y los
                horarios en cada casilla.
              </>,
              <>
                Tocar un día. El detalle indica la espera media esperada y qué regiones de
                vacaciones influyen ese día, también las del país vecino.
              </>,
              <>
                ¿Un día de lluvia en el plan? El calendario lo muestra como el más tranquilo de la
                semana. Ese mismo día, el radar de lluvia de 15 minutos, arriba en la página del
                parque, dice cuándo para.
              </>,
              <>
                Cada tarjeta de atracción lleva la altura mínima allí donde el parque la publica.
                Taron pide 140 centímetros, Colorado Adventure 120, y eso decide el día más que
                cualquier tiempo de espera.
              </>,
              <>
                Marcar las atracciones infantiles como favoritas en la pestaña{' '}
                <strong>Atracciones</strong>. Después aparecen en la página de inicio con su tiempo
                de espera actual.
              </>,
            ]}
          />

          <PersonaBlock
            icon={BarChart3}
            who="Aficionado, tres parques en una semana"
            question="«¿Dónde compensa el rope drop y esta cola es de verdad excepcional?»"
            steps={[
              <>
                En la página del parque, el resumen de atracciones de rope drop, ordenado por
                minutos ahorrados. Las atracciones sin ventaja real no aparecen ahí.
              </>,
              <>
                Para cada atracción, leer al lado la tabla del capítulo 02. Indica el periodo sobre
                el que calcula, y un día de la semana sin base no recibe allí ninguna barra.
              </>,
              <>
                Durante la visita, fijarse en el indicador de comparación: «mucho más alto»
                significa hoy realmente excepcional, no solo largo.
              </>,
              <>
                Cada página de atracción lleva una nota sobre su propia previsión, del contraste
                entre predicciones pasadas y tiempos reales de los últimos 30 días. En Taron son
                unos cuantos miles de previsiones comparadas.
              </>,
              <>
                Para planificar el viaje, comparar <A href={bestTime}>la mejor época</A>. Allí hay
                varios parques uno al lado de otro, con el día de la semana más tranquilo incluido.
              </>,
            ]}
          />

          <PersonaBlock
            icon={MapPin}
            who="Pase anual, a 20 minutos del parque"
            question="«¿Compensa acercarse esta tarde?»"
            steps={[
              <>
                Página de inicio con la ubicación activada. El parque más cercano está arriba, con
                estado, afluencia actual y horario hasta esta noche.
              </>,
              <>
                Afluencia «baja» en una atracción que normalmente marca «alta» es justo la tarde por
                la que compensa el viaje.
              </>,
              <>
                Dentro del parque, la página de inicio pasa a vista cercana: las atracciones más
                próximas con distancia y tiempo de espera actual.
              </>,
              <>
                Mirar la flecha de tendencia. Una cola que baja en la última hora antes del cierre
                suele ser el momento más corto de todo el día.
              </>,
            ]}
          />

          <PersonaBlock
            icon={Compass}
            who="Primera vez en un parque grande"
            question="«¿Qué es single rider y en qué orden hacemos esto?»"
            steps={[
              <>
                Los términos están en el <A href={glossary}>diccionario</A>, en seis idiomas. En las
                páginas de atracción están enlazados directamente en el texto.
              </>,
              <>
                Por la mañana, seguir la recomendación de rope drop del parque. Es el único orden
                que se apoya en datos medidos y no en intuición.
              </>,
              <>
                A partir del mediodía, decidir por afluencia y no por minutos. Una atracción «baja»
                con 25 minutos es mejor elección que una «alta» con 20.
              </>,
              <>
                Los espectáculos, en la pestaña del mismo nombre. Los horarios están ahí para todo
                el día, y los desfiles vacían los caminos durante media hora aproximadamente.
              </>,
            ]}
          />
        </div>
      </SectionShell>

      {/* ── 09 ──────────────────────────────────────────────────────────── */}
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
                  Ctrl + K o ⌘ + K, en cualquier parte de la web. Encuentra parques, atracciones,
                  espectáculos y restaurantes, también con una escritura aproximada.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Ubicación',
              body: (
                <>
                  Activada, la página de inicio muestra los parques cercanos. Dentro de un parque
                  pasa a la vista cercana con distancias.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favoritos',
              body: (
                <>
                  Estrella en cada tarjeta de parque y de atracción. Se guarda como cookie en el
                  navegador, sin cuenta y sin servidor.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Textos más largos sobre parques y atracciones concretas. Las tablas que contienen
                  tiran de las mismas cifras que las páginas de parque en lugar de copiarlas.
                </>
              ),
            },
            {
              icon: Moon,
              title: 'Página de atracción',
              body: (
                <>
                  Histórico, tiempos de espera típicos por día de la semana, rope drop, altura
                  mínima, acierto de la previsión, elementos del trazado y las entradas de blog
                  sobre la atracción.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Diccionario',
              body: (
                <>
                  <A href={glossary}>Todos los términos técnicos</A> con definición, atracciones de
                  ejemplo y, en parte, un modelo 3D del elemento de trazado.
                </>
              ),
            },
          ]}
        />
      </SectionShell>

      {/* ── 10 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="faq"
        index="10"
        kicker="Consultas"
        title="Preguntas frecuentes"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <ClosingBand
        kicker="¿Y ahora?"
        title="Seguir leyendo"
        body="Todo en park.fan es gratuito, sin cuenta y sin publicidad. La página de un parque enseña todo esto sobre un caso real, la página de Fancast calcula en público cuánto acertaron las previsiones de los últimos 30 días, y la mejor época compara varios parques uno al lado de otro."
      >
        <Link
          href={PARK}
          prefetch={false}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
        >
          <Activity className="h-4 w-4" />
          Ver una página de parque de ejemplo
        </Link>
        <Link
          href={bestTime}
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
          Mejor época para visitar
        </Link>
        <Link
          href="/fancast"
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Acierto de las previsiones
        </Link>
      </ClosingBand>
    </>
  );
}

/** One worked example: who, what they are asking, and the route through the site. */
function PersonaBlock({
  icon: Icon,
  who,
  question,
  steps,
}: {
  icon: React.ElementType;
  who: string;
  question: string;
  steps: React.ReactNode[];
}) {
  return (
    <Reveal>
      <div className="bg-card/70 h-full rounded-2xl border p-5 sm:p-6">
        <div className="mb-3 flex items-start gap-3">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{who}</h3>
            <p className="text-muted-foreground mt-0.5 text-sm italic">{question}</p>
          </div>
        </div>
        <ol className="mt-4 space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
              <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
