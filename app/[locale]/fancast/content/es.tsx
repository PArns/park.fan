import React from 'react';
import { Link } from '@/i18n/navigation';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
import {
  Activity,
  CalendarDays,
  CloudSun,
  PartyPopper,
  History,
  Gauge,
  Database,
  RefreshCw,
  MapPin,
  HelpCircle,
  Compass,
  Ticket,
  Palette,
  CalendarCheck,
  CalendarRange,
  LineChart,
  Sunrise,
} from 'lucide-react';
import {
  Lead,
  SectionShell,
  P,
  PG,
  Highlight,
  SplitFigure,
  CrowdSpectrum,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
} from '../_fancast-ui';
import { FancastLive, type FancastLiveLabels } from '../_fancast-live';

const LIVE_LABELS: FancastLiveLabels = {
  edition: 'Edición actual',
  trained: 'Entrenado',
  basis: 'Base de entrenamiento',
  datapoints: '{n} puntos de datos',
  days: 'durante {d} días',
  vsPrevious: 'Frente a {v}',
  moreAccurate: 'más preciso',
  topTitle: 'Dónde Fancast ha acertado más últimamente',
  topIntro:
    'Las atracciones cuyas previsiones recientes más se acercaron al tiempo de espera real: desviación media en minutos, en directo desde el modelo.',
  colAttraction: 'Atracción',
  colPark: 'Parque',
  colError: 'Error medio',
  minUnit: 'min',
};

const FAQ = [
  {
    question: '¿Qué precisión tiene Fancast?',
    answer:
      'La precisión actual aparece en directo en la tarjeta de puntuación de arriba: como MAE (desviación media en minutos), RMSE y MAPE. Esas cifras salen de comparar de verdad las predicciones pasadas con los tiempos de espera realmente medidos, no de un laboratorio de pruebas maquillado. Cambian en cuanto el modelo vuelve a entrenarse.',
  },
  {
    question: '¿Con cuánta antelación puede predecir Fancast?',
    answer:
      'Fancast ofrece niveles de afluencia diarios para un parque hasta 365 días por adelantado. Para atracciones concretas produce además previsiones horarias del tiempo de espera. Cuanto más se acerca el día, más pesan las señales a corto plazo, como la previsión meteorológica.',
  },
  {
    question: '¿Cómo sabe Fancast que un sábado de vacaciones estará lleno?',
    answer:
      'Por el juego de muchas señales: los calendarios escolares y de días festivos (también de las regiones vecinas), el día de la semana, la previsión meteorológica, los eventos especiales y todo el historial de tiempos de espera del parque. Un sábado de vacaciones en pleno verano reúne casi todos esos factores a la vez, y por eso la previsión se dispara ahí, mientras que un martes lluvioso de noviembre se queda en verde.',
  },
  {
    question: '¿Con qué frecuencia se actualiza el modelo?',
    answer:
      'Cada día. Fancast se reentrena automáticamente una vez al día, a las 06:00 UTC, con los datos más frescos, incluidos los tiempos de espera de ayer. Así que, literalmente, cada mañana es un poquito mejor.',
  },
  {
    question: '¿Puedo usar Fancast para un parque y un día concretos?',
    answer:
      'Sí. Cada página de parque en park.fan tiene un calendario de afluencia que te muestra, para cada día concreto hasta un año por delante, una previsión verde, amarilla o roja: desde Europa-Park hasta Phantasialand, Efteling o Walt Disney World. Además obtienes previsiones horarias del tiempo de espera para las atracciones concretas.',
  },
  {
    question: '¿Qué datos usa Fancast?',
    answer:
      'Tiempos de espera en directo e históricos de más de 150 parques, calendarios escolares y de días festivos (también de regiones vecinas), previsiones meteorológicas, horarios de apertura, eventos especiales y patrones estacionales. De esa mezcla salen los niveles de afluencia diarios y las previsiones horarias del tiempo de espera.',
  },
  {
    question: '¿Por qué un parque muestra «Sin previsión»?',
    answer:
      'Fancast solo valora un parque cuando hay suficientes datos de funcionamiento: al menos unos 30 días de operación. Los parques totalmente nuevos o que abren rara vez aún no tienen esa base. Entonces preferimos mostrar honestamente «Sin previsión» antes que una cifra inventada.',
  },
  {
    question: '¿Cuesta algo Fancast?',
    answer:
      'No. Como todo park.fan, cada previsión, calendario de afluencia y estadística es gratis, sin publicidad y utilizable sin cuenta.',
  },
] as const;

export function ContentES() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Fancast es nuestro modelo de previsión propio: la parte de park.fan que mira hacia el
          futuro. ¿El nombre? Descarado pero con método: <strong>fan</strong> como en park.
          <strong>fan</strong>, <strong>cast</strong> como en fore<strong>cast</strong>. Un parte
          meteorológico para las colas, vamos.
        </Lead>
        <P>
          Y como solo confiamos en las cifras que tienen que demostrar lo que valen, Fancast hace
          algo que la mayoría de los modelos evita en voz baja: se pone nota a sí mismo. Cada
          predicción se contrasta después con el tiempo de espera que de verdad ocurrió, a la vista
          de todos, en esta página. Hacer trampas, inútil.
        </P>
        <Highlight>
          En resumen: Fancast no es un adivino con bola de cristal. Es un estadístico tozudo que
          recibe clases de refuerzo cada noche y tiene que volver a examinarse cada mañana. Una rana
          del tiempo que verifica su propio tiempo.
        </Highlight>
      </div>

      {/* 01 — Scorecard (live) */}
      <SectionShell
        id="note"
        index="01"
        kicker="La nota del boletín"
        title="¿Es Fancast realmente bueno?"
        icon={Gauge}
      >
        <P>
          Basta de preámbulos: aquí está la nota, en directo y sin maquillar. Fancast saca estas
          cifras de su propio panel en este preciso momento; cambiarán en cuanto el modelo vuelva a
          entrenarse esta noche.
        </P>
        <div className="overflow-hidden rounded-2xl border">
          <MLStatsSection />
        </div>
        <FancastLive labels={LIVE_LABELS} />
      </SectionShell>

      {/* 02 — What it reads */}
      <SectionShell
        id="ingredients"
        index="02"
        kicker="Los ingredientes"
        title="Lo que lee Fancast"
        icon={Database}
      >
        <PG>
          Un día puente lluvioso de octubre es un animal completamente distinto de un sábado de
          vacaciones soleado de julio, y eso un modelo tiene que aprenderlo primero. Por eso Fancast
          se alimenta de varias fuentes a la vez:
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Tiempos de espera en directo" delay={0}>
            Millones de lecturas reales de más de 150 parques, actualizadas al minuto. La moneda en
            bruto de cada previsión.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendarios y vacaciones" delay={60}>
            Fines de semana, días festivos y vacaciones escolares, también los de las regiones
            vecinas, porque quien va de excursión no entiende de fronteras.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Meteorología" delay={120}>
            La probabilidad de lluvia y la temperatura tuercen las previsiones a corto plazo. El sol
            atrae, la lluvia de todo el día vacía los caminos.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Eventos y temporada" delay={0}>
            Halloween, vacaciones de verano, puentes, una novedad en su primer verano: los
            sospechosos habituales de un día abarrotado.
          </IngredientCard>
          <IngredientCard icon={History} title="Historial" delay={60}>
            Años de historial de tiempos de espera por parque. Patrones que solo se ven si los miras
            fijamente el tiempo suficiente.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Horarios y capacidad" delay={120}>
            Cuándo abre el parque, durante cuánto tiempo, con qué capacidad: el marco en el que
            encaja todo lo demás.
          </IngredientCard>
        </IngredientGrid>
        <P>
          De esta mezcla el modelo saca dos cosas: una{' '}
          <strong>previsión horaria del tiempo de espera</strong> para atracciones concretas y una{' '}
          <strong>nota de afluencia diaria</strong> para todo el parque.
        </P>
      </SectionShell>

      {/* 03 — Concrete park examples */}
      <SectionShell
        id="examples"
        index="03"
        kicker="En parques reales"
        title="Fancast en tres parques"
        icon={Compass}
      >
        <P>
          Toda teoría es gris: Fancast solo se vuelve tangible en un parque concreto. Tres ejemplos
          de cómo los mismos ingredientes se convierten en tres previsiones completamente distintas:
        </P>
        <SplitFigure
          src="/images/parks/europa-park/silver-star.jpg"
          alt="Silver Star en Europa-Park"
          kicker="Europa-Park · día puente de octubre"
          title="Tranquilo, verde, menos de 30 minutos"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast ve: vacaciones escolares en una sola región vecina, tiempo variable, ningún evento
          especial. Resultado: una previsión tranquila y verde; Voltron Nevera probablemente por
          debajo de 30 minutos, blue fire para subir sin más. ¿El mismo parque tres semanas después,
          un sábado de vacaciones? Rojo intenso. Seis millones de visitantes al año no se reparten
          solos.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/phantasialand/taron.jpg"
          alt="Taron surcando Klugheim en Phantasialand"
          kicker="Phantasialand · sábado de vacaciones"
          title="Compacto, lleno, de naranja a rojo"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Parque compacto, pocas atracciones estelares, todos quieren Taron: la saturación llega
          antes de que se sirva la primera cerveza. Fancast lo sabe y pinta el día de naranja a
          rojo. El calendario de al lado te sugiere enseguida el martes siguiente, cuando podrás
          montar en Taron una y otra vez en lugar de solo suspirar por él.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/efteling/baron-1898.jpg"
          alt="Baron 1898 en Efteling"
          kicker="Efteling · martes lluvioso de noviembre"
          title="El consejo secreto que el modelo ya tiene en cuenta"
          badge={<CrowdLevelBadge level="low" />}
        >
          Justo el día que los planificadores por intuición evitan, y que Fancast pinta de verde.
          Pocas vacaciones, tiempo penoso, colas cortas. Funciona exactamente hasta que todos han
          leído el mismo consejo secreto; por eso el modelo calcula la probabilidad de lluvia por su
          cuenta, en lugar de fiarse del folclore.
        </SplitFigure>
      </SectionShell>

      {/* 04 — How it learns */}
      <SectionShell
        id="training"
        index="04"
        kicker="El método"
        title="Cómo aprende Fancast (y no puede hacer trampas)"
        icon={RefreshCw}
      >
        <P>
          El truco más importante es de lo más discreto: Fancast se reentrena{' '}
          <strong>cada noche</strong>, todos los días a las 06:00 UTC. Lo que pasó ayer, el modelo
          lo sabe hoy. Un fan de las montañas rusas se hace mayor y se cansa con los años; Fancast
          se vuelve un poco más listo cada mañana.
        </P>
        <P>
          Y solo se le pone a prueba en días que <strong>nunca ha visto</strong>: en el futuro, no
          en días del pasado aprendidos de memoria. Cualquier otra cosa sería como colarse a uno
          mismo las preguntas del examen por adelantado y luego celebrar el boletín de
          sobresalientes.
        </P>
        <P>
          Además, Fancast vigila si está <strong>derivando</strong>, si la realidad se le escapa
          poco a poco. Y una nueva versión del modelo solo entra en producción si de verdad supera a
          la anterior en un duelo justo. Democracia entre algoritmos: quien no es mejor, se queda en
          el banquillo.
        </P>
      </SectionShell>

      {/* 05 — Crowd levels */}
      <SectionShell
        id="levels"
        index="05"
        kicker="La escala"
        title="Verde, amarillo, rojo: los niveles de afluencia"
        icon={Palette}
      >
        <PG>
          Al final de todo ese cálculo hay un único color. Seis niveles, desde «prácticamente tienes
          el parque para ti» hasta «bienvenido a un sábado de vacaciones»:
        </PG>
        <CrowdSpectrum
          items={[
            {
              level: 'very_low',
              text: 'Casi vacío. Sueños de rope-drop, vueltas seguidas, una foto con la mascota sin cola.',
            },
            {
              level: 'low',
              text: 'Relajado. Esperas cortas, subes a todo sin necesidad de un plan de batalla.',
            },
            {
              level: 'moderate',
              text: 'Funcionamiento normal. Las atracciones estelares se llenan, el resto sigue tranquilo. Un buen día de compromiso.',
            },
            {
              level: 'high',
              text: 'Claramente concurrido. En las atracciones top conviene madrugar, o armarse de paciencia.',
            },
            {
              level: 'very_high',
              text: 'De verdad lleno. Colas largas en lo más destacado; planificar gana con claridad a la improvisación.',
            },
            {
              level: 'extreme',
              text: 'Alerta máxima. Sábado de vacaciones en pleno verano. Solo con estrategia, aguante y sentido del humor.',
            },
          ]}
        />
      </SectionShell>

      {/* 06 — Try a real park */}
      <SectionShell
        id="parks"
        index="06"
        kicker="Pruébalo tú mismo"
        title="Elige un parque"
        icon={Ticket}
      >
        <P>
          Basta de teoría. Fancast funciona en cada página de parque; aquí tienes unos cuantos
          populares para probarlo directamente. Entra, abre el calendario de afluencia y mira qué
          color le toca al día que elijas:
        </P>
        <PopularParksGrid />
      </SectionShell>

      {/* 07 — Where you meet it */}
      <SectionShell
        id="where"
        index="07"
        kicker="Por todo el parque"
        title="Dónde te encuentras a Fancast"
        icon={MapPin}
      >
        <P>
          Fancast no vive en una página solitaria: está entretejido por todo park.fan, casi siempre
          sin presentarse:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: CalendarCheck,
              title: 'Previsión de hoy',
              body: 'la nota de afluencia en la cabecera del parque, antes incluso de tocar la primera atracción.',
            },
            {
              icon: CalendarRange,
              title: 'Calendario de afluencia',
              body: (
                <>
                  el <Link href="/parks">calendario de los mejores días para visitar</Link> en cada
                  página de parque: verde, amarillo, rojo, hasta un año por delante.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Mejor época para ir',
              body: (
                <>
                  los días de diario más tranquilos y los próximos días de consejo secreto,
                  destilados de los mismos datos. Consulta la{' '}
                  <Link href={`/${BEST_TIME_SEGMENTS.es}`}>mejor época para visitar</Link>.
                </>
              ),
            },
            {
              icon: LineChart,
              title: 'Previsión con IA en el gráfico de tiempos de espera',
              body: 'la línea discontinua que revela las franjas horarias más ventajosas de una atracción.',
            },
            {
              icon: Sunrise,
              title: 'Recomendación de rope-drop',
              body: 'la respuesta honesta a «¿merece la pena llegar temprano?», incluidos los mínimos esperados.',
            },
            {
              icon: HelpCircle,
              title: 'Sin previsión',
              body: (
                <>
                  honesto antes que adivinado: los parques con muy pocos datos reciben{' '}
                  <CrowdLevelBadge level="unknown" /> en lugar de una cifra inventada.
                </>
              ),
            },
          ]}
        />
        <P>
          Cómo se combina todo esto dentro de un parque lo recorre paso a paso la{' '}
          <Link href="/howto">guía completa</Link>: calendario de afluencia, distintivos y tiempos
          de espera en directo incluidos.
        </P>
      </SectionShell>

      {/* 08 — FAQ */}
      <SectionShell
        id="faq"
        index="08"
        kicker="En breve"
        title="Preguntas frecuentes sobre Fancast"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
