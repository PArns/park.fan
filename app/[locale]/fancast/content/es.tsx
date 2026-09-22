import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
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
      'La precisión actual aparece en directo más arriba en esta página, como MAE (desviación media en minutos), RMSE y MAPE. Esas cifras salen de comparar las predicciones pasadas con los tiempos de espera que se midieron después. Cambian cada vez que el modelo vuelve a entrenarse.',
  },
  {
    question: '¿Con cuánta antelación puede predecir Fancast?',
    answer:
      'Fancast ofrece niveles de afluencia diarios para cada día que un parque ya ha publicado. Para atracciones concretas produce además previsiones horarias del tiempo de espera. Cuanto más se acerca el día, más pesan las señales a corto plazo, como la previsión meteorológica.',
  },
  {
    question: '¿Cómo sabe Fancast que un sábado de vacaciones estará lleno?',
    answer:
      'Por varias señales que lee a la vez: los calendarios escolares y de días festivos (también de las regiones vecinas), el día de la semana, la previsión meteorológica, los eventos especiales y todo el historial de tiempos de espera del parque. Un sábado de vacaciones en pleno verano reúne casi todos esos factores a la vez, y por eso la previsión se dispara ahí, mientras que un martes lluvioso de noviembre se queda en verde.',
  },
  {
    question: '¿Con qué frecuencia se actualiza el modelo?',
    answer:
      'Cada día. Fancast se reentrena automáticamente una vez al día, a las 06:00 UTC, con los tiempos de espera de ayer.',
  },
  {
    question: '¿Puedo usar Fancast para un parque y un día concretos?',
    answer:
      'Sí. Cada página de parque en park.fan tiene un calendario de afluencia que te muestra, para cada día publicado, una previsión verde, amarilla o roja: desde Europa-Park hasta Phantasialand, Efteling o Walt Disney World. Además obtienes previsiones horarias del tiempo de espera para las atracciones concretas.',
  },
  {
    question: '¿Qué datos usa Fancast?',
    answer:
      'Tiempos de espera en directo e históricos de más de 200 parques, calendarios escolares y de días festivos (también de regiones vecinas), previsiones meteorológicas, horarios de apertura, eventos especiales y patrones estacionales. De esa mezcla salen los niveles de afluencia diarios y las previsiones horarias del tiempo de espera.',
  },
  {
    question: '¿Por qué un parque muestra «Sin previsión»?',
    answer:
      'Fancast solo valora un parque cuando hay suficientes datos de funcionamiento: al menos unos 30 días de operación. Los parques totalmente nuevos o que abren rara vez aún no tienen esa base. Entonces ahí pone «Sin previsión» en lugar de una cifra a ojo.',
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
          Fancast es nuestro modelo de previsión propio, la parte de park.fan que ya hoy quiere
          saber cuánto medirá la cola el sábado. El nombre lo pusimos sin agencia de publicidad, y
          se nota: <strong>fan</strong> como en park.
          <strong>fan</strong>, <strong>cast</strong> como en fore<strong>cast</strong>. Un parte
          meteorológico para las colas, solo que sin el presentador señalando el mapa.
        </Lead>
        <P>
          Predicciones que nadie comprueba las hace cualquier horóscopo. Fancast, en cambio, se
          examina todos los días, y las notas quedan colgadas en esta página para quien quiera
          verlas.
        </P>
        <Highlight>
          Cada predicción se compara al día siguiente con el tiempo de espera medido. El resultado
          aparece en la siguiente sección, como MAE, RMSE y MAPE, también en los días malos.
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
          Estas notas salen en directo del modelo, no de un dosier de prensa. Cambiarán con el
          próximo reentrenamiento, mañana por la mañana, así que mejor no enmarcarlas.
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
          Quien va mucho a parques lo sabe: un día puente lluvioso de octubre y un sábado de
          vacaciones soleado de julio son dos deportes distintos. Un modelo tiene que aprenderlo, y
          para eso Fancast lee seis fuentes a la vez:
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Tiempos de espera en directo" delay={0}>
            Una medición por cola cada cinco minutos, en más de 200 parques. Sobre eso se apoya todo
            lo demás.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendarios y vacaciones" delay={60}>
            Fines de semana, días festivos y vacaciones escolares, también los de las regiones
            vecinas. Los excursionistas neerlandeses no miran el calendario escolar alemán.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Meteorología" delay={120}>
            La probabilidad de lluvia y la temperatura tuercen las previsiones a corto plazo. El sol
            saca a todo el mundo de casa, la lluvia de todo el día lo devuelve al sofá.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Eventos y temporada" delay={0}>
            Halloween, vacaciones de verano, puentes, una novedad en su primer verano: los
            sospechosos habituales de un día abarrotado.
          </IngredientCard>
          <IngredientCard icon={History} title="Historial" delay={60}>
            Cada día de apertura registrado de un parque, sin huecos desde abril de 2026. De ahí
            salen el ritmo de la semana y el de la temporada.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Horarios y capacidad" delay={120}>
            Cuándo abre el parque, durante cuánto tiempo, con qué capacidad. Es el marco en el que
            tiene que caber todo lo demás.
          </IngredientCard>
        </IngredientGrid>
        <P>
          De este cocido el modelo saca dos platos: una{' '}
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
          Según el parque y la fecha, los mismos ingredientes dan días muy distintos. Tres ejemplos:
        </P>
        <SplitFigure
          src="/media/europa-park/silver-star.jpg"
          alt="Silver Star en Europa-Park"
          kicker="Europa-Park · día puente de octubre"
          title="Tranquilo, verde, menos de 30 minutos"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast ve vacaciones escolares en una sola región vecina, tiempo variable y ningún evento
          especial. Sale una previsión tranquila y verde: Voltron Nevera probablemente por debajo de
          30 minutos, blue fire casi de pasada. El mismo parque tres semanas después, un sábado de
          vacaciones, se pone rojo intenso, porque seis millones de visitantes al año no se reparten
          por el calendario con buenos modales.
        </SplitFigure>
        <SplitFigure
          src="/media/phantasialand/taron.jpg"
          alt="Taron surcando Klugheim en Phantasialand"
          kicker="Phantasialand · sábado de vacaciones"
          title="Compacto, lleno, de naranja a rojo"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Parque compacto, pocas atracciones estelares, y todos quieren Taron. Se llena antes de que
          el quiosco sirva la primera caña. Fancast lo sabe y pinta el día de naranja a rojo. El
          calendario de afluencia de la página del parque te propone entonces un martes, cuando
          podrás montar en Taron varias veces seguidas en lugar de suspirar por él desde el camino.
        </SplitFigure>
        <SplitFigure
          src="/media/efteling/baron-1898.jpg"
          alt="Baron 1898 en Efteling"
          kicker="Efteling · martes lluvioso de noviembre"
          title="El consejo secreto que el modelo ya tiene en cuenta"
          badge={<CrowdLevelBadge level="low" />}
        >
          El día que evitan los que planifican por intuición es justo el que Fancast pinta de verde:
          pocas vacaciones, tiempo penoso, colas cortas. Los calcetines mojados van de regalo. El
          problema de cualquier consejo secreto es que solo funciona hasta que lo ha leído todo el
          mundo. Por eso el modelo calcula la probabilidad de lluvia de ese día concreto por su
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
          El truco más importante es más o menos igual de emocionante que lavarse los dientes.
          Fancast se reentrena <strong>cada día</strong>, a las 06:00 UTC. Lo que pasó ayer en el
          parque está en la previsión de la mañana siguiente.
        </P>
        <P>
          Solo se le pone a prueba en días que <strong>nunca ha visto</strong>. Cualquier otra cosa
          sería como colarse uno mismo las preguntas del examen y luego celebrar el sobresaliente.
        </P>
        <P>
          Fancast también vigila si está <strong>derivando</strong>, es decir, si la realidad se le
          escapa poco a poco. Una versión nueva del modelo solo entra en producción si supera a la
          anterior en un cara a cara. Aquí solo asciende quien lo hace mejor, cosa que no todas las
          empresas pueden decir.
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
              text: 'Funcionamiento normal. Las atracciones estelares se llenan más, el resto sigue tranquilo. Basta con un plan a grandes rasgos.',
            },
            {
              level: 'high',
              text: 'Claramente concurrido. Para las grandes atracciones compensa el despertador; si no, paciencia y un audiolibro.',
            },
            {
              level: 'very_high',
              text: 'De verdad lleno. Colas largas en las grandes atracciones, y quien improvisa pasa el día en el zigzag de las vallas.',
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
          Fancast funciona en cada página de parque. Aquí tienes unos cuantos populares para
          probarlo: entra en uno, abre el calendario de afluencia y mira qué color le toca a tu día.
          Si sale rojo, echa un vistazo a los días de alrededor.
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
          Esta página es solo la oficina. El trabajo de verdad Fancast lo hace por todo park.fan, y
          casi nunca se presenta:
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
                  página de parque: verde, amarillo, rojo, hasta donde llega el horario.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Mejor época para ir',
              body: (
                <>
                  los días de diario más tranquilos y los próximos días de consejo secreto, sacados
                  de los mismos datos. Consulta la{' '}
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
              body: 'la respuesta a «¿merece la pena llegar temprano?», con los mínimos esperados.',
            },
            {
              icon: HelpCircle,
              title: 'Sin previsión',
              body: (
                <>
                  Antes que adivinar: los parques con muy pocos datos reciben{' '}
                  <CrowdLevelBadge level="unknown" /> en lugar de una cifra inventada.
                </>
              ),
            },
          ]}
        />
        <P>
          Cómo se combina todo esto dentro de un parque lo recorre paso a paso la{' '}
          <Link href={`/${HOWTO_SEGMENTS.es}`}>guía completa</Link>: calendario de afluencia,
          distintivos y tiempos de espera en directo incluidos.
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
