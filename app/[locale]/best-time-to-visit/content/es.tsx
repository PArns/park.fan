import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import {
  CalendarRange,
  Sunrise,
  Ban,
  Ticket,
  HelpCircle,
  Sparkles,
  Clock,
  CalendarDays,
  CloudRain,
  Users,
  Sun,
} from 'lucide-react';
import {
  Lead,
  P,
  PG,
  Highlight,
  SectionShell,
  SplitFigure,
  TouchpointGrid,
  FaqList,
} from '@/components/marketing/editorial-ui';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { FancastCta } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';
import { QuietestDaysByPark } from '../_quietest-days-by-park';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'Los días laborables más tranquilos',
  weekdaysBody:
    'Aquí cada parque cuenta lo mismo, sea Disneyland o un parque familiar pequeño: primero lo convertimos a su propia media y solo después promediamos. La barra indica lo lleno que está un día laborable típico frente a esa media. El sábado destaca; los otros seis días están más juntos de lo que casi nadie espera.',
  monthsTitle: 'Los meses más tranquilos',
  monthsBody:
    'El mismo cálculo, esta vez repartido por el año. Diciembre se sale del cuadro, porque ahí solo entran los parques que abren en invierno, y esos van con programa navideño.',
  quieter: 'más tranquilo',
  busier: 'más lleno',
  typical: 'cerca de la media',
  footnote: 'Basado en {days} días-parque medidos de {parks} parques.',
  pending:
    'La clasificación en vivo aún está recopilando tiempos de espera. Los días más tranquilos aparecerán aquí en cuanto haya datos suficientes.',
};

const FAQ = [
  {
    question: '¿Cuál es la mejor época para visitar un parque de atracciones?',
    answer:
      'Lo más tranquilo son los días laborables fuera de las vacaciones escolares, y de ellos el martes, el miércoles y el jueves. Los patrones exactos por día de la semana y por mes están arriba, sacados de los tiempos de espera medidos en todos los parques.',
  },
  {
    question: '¿Qué día de la semana está menos concurrido?',
    answer:
      'Promediado entre todos los parques, el martes, el miércoles y el jueves son los más tranquilos. Sobresale un solo día lleno, el sábado; el domingo queda más cerca del martes que del sábado. En un parque concreto puede ser otro: el calendario de afluencia de su página lo muestra día a día.',
  },
  {
    question: '¿En qué meses están menos concurridos los parques de atracciones?',
    answer:
      'Depende del parque más de lo que sugiere la regla general: promediados todos los parques, los meses de verano no son los más llenos, y diciembre sobresale por arriba, porque en invierno solo abren los parques con programa navideño. El resumen mensual de arriba lo muestra mes a mes. Para un parque concreto cuenta su propio calendario.',
  },
  {
    question: '¿Merece la pena visitar con lluvia?',
    answer:
      'A menudo sí: el mal tiempo echa para atrás a muchos visitantes y las colas se acortan, sobre todo en las montañas rusas, que funcionan igualmente. El truco de iniciado solo sirve mientras no todos tengan la misma idea; por eso nuestro modelo de predicción incorpora el tiempo directamente.',
  },
  {
    question: '¿Cómo encuentro el mejor día para un parque concreto?',
    answer:
      'Esta página muestra los patrones generales como punto de partida. Para un parque concreto, abre su calendario de afluencia: da para cada día publicado una previsión verde, amarilla o roja, con las vacaciones escolares y los festivos de esa región incluidos.',
  },
  {
    question: '¿De dónde salen estos datos?',
    answer:
      'De los tiempos de espera que hemos ido registrando nosotros mismos en más de 200 parques. Para que la clasificación no la marquen los parques más grandes, primero convertimos cada parque a su propia media y solo después promediamos.',
  },
] as const;

export function ContentES() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Cuándo se llena un parque de atracciones es sorprendentemente previsible, desde luego más
          que el humor de un niño de seis años a las tres de la tarde. El día de la semana, las
          vacaciones escolares, el tiempo y la temporada deciden en buena parte si en la montaña
          rusa esperas diez minutos o hora y media. Y como cada día de parque deja tiempos de espera
          detrás, eso se puede recalcular con bastante precisión.
        </Lead>
        <P>
          Así que hicimos las cuentas, con los tiempos de espera registrados en más de 200 parques.
          Más abajo están los días laborables y los meses más tranquilos, las horas más tranquilas
          del día y las fechas en las que es mejor quedarse en el sofá. El calendario de afluencia
          te busca después el día que le va a tu parque.
        </P>
        <Highlight>
          Versión corta para los que tienen prisa: de martes a jueves fuera de las vacaciones
          escolares, en la puerta a la hora de apertura, y una previsión de tiempo variable tomada
          como un regalo, siempre que haya un chubasquero en la mochila.
        </Highlight>
      </div>

      {/* 01 — Data: quietest weekdays + months (live) */}
      <SectionShell
        id="patterns"
        index="01"
        kicker="Los datos"
        title="Los días laborables y los meses más tranquilos"
        icon={CalendarRange}
      >
        <PG>
          Lo que más mueve la afluencia es el día de la semana y el mes. Hemos promediado los dos
          entre todos los parques, a partir de los tiempos de espera que se midieron de verdad:
        </PG>
        <BestTimesData locale="es" labels={DATA_LABELS} />
        <QuietestDaysByPark locale="es" />
      </SectionShell>

      {/* 02 — Times of day */}
      <SectionShell
        id="times"
        index="02"
        kicker="Por horas"
        title="Las horas más tranquilas del día"
        icon={Clock}
      >
        <P>
          Después del día de la semana, la hora es lo que más pesa. Estas cuatro franjas son las más
          tranquilas casi en todas partes:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: (
                <>
                  A la apertura (<GlossaryTermLink termId="rope-drop">rope drop</GlossaryTermLink>)
                </>
              ),
              body: 'La primera hora después de abrir es la mejor del día. Quien está puntual en la puerta suele subir a las grandes atracciones antes de que se forme ninguna cola.',
            },
            {
              icon: Users,
              title: 'A la hora de comer',
              body: 'Cuando todos están sentados comiendo, las colas se acortan. Aprovecha ese rato para las atracciones populares y come más tarde. Las patatas fritas saben igual a las tres menos cuarto.',
            },
            {
              icon: Sun,
              title: 'La última hora',
              body: 'Muchas familias se van a casa antes del final. En la última hora antes del cierre, las esperas suelen bajar otra vez de forma notable.',
            },
            {
              icon: Ticket,
              title: 'Durante el gran espectáculo nocturno',
              body: 'Un desfile o unos fuegos artificiales retienen a miles de visitantes a la vez, y justo entonces quedan sitios libres en las montañas rusas.',
            },
          ]}
        />
        <SplitFigure
          src="/media/phantasialand/black-mamba.jpg"
          alt="Black Mamba surcando la jungla en Phantasialand"
          kicker="Rope drop"
          title="Llegar pronto ayuda, pero no en todas las atracciones"
        >
          En las atracciones estrella, la primera hora tras la apertura suele dar más vueltas que
          dos de la tarde. Pero no vale en todas partes: algunas van igual de llenas todo el día y
          otras no se despiertan hasta después de comer. La página de cada atracción trae su propia
          curva del día, y ahí se ve si a esa le compensa el despertador más temprano.
        </SplitFigure>
      </SectionShell>

      {/* 03 — Dates to avoid */}
      <SectionShell
        id="avoid"
        index="03"
        kicker="Días rojos"
        title="Fechas que conviene evitar"
        icon={Ban}
      >
        <PG>
          Igual de útil es saber cuándo mejor no ir. En estas fechas los parques están a reventar.
          Puedes prepararte con bocadillos y mucha paciencia, o planificar esquivándolas:
        </PG>
        <SplitFigure
          src="/media/walibi-holland/goliath.jpg"
          alt="La montaña rusa Goliath en Walibi Holland en un día concurrido"
          kicker="Día punta"
          title="Sol, todos libres, todos aquí"
          reverse
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="very_high" />
            </GlossaryTermLink>
          }
        >
          Un sábado de vacaciones de verano con un tiempo espléndido es el peor caso: todos están
          libres, todos quieren salir, todos están aquí. Si eres flexible, coge mejor el martes
          siguiente. El mismo parque parece entonces reformado durante la noche por alguien que se
          olvidó de las colas.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Fines de semana y festivos',
              body: 'El sábado es el día más lleno en todos los parques, con distancia clara sobre el resto de la semana. Los festivos y los puentes largos aprietan aún más.',
            },
            {
              icon: CalendarRange,
              title: (
                <GlossaryTermLink termId="school-holiday">Vacaciones escolares</GlossaryTermLink>
              ),
              body: 'En cuanto hay vacaciones en tu región o en las vecinas, se llena. Las de verano son la temporada alta absoluta.',
            },
            {
              icon: Sun,
              title: 'Puentes y sábados de vacaciones en pleno verano',
              body: 'Sol, día libre y temporada alta coinciden aquí. De todas las combinaciones del calendario, es la más llena.',
            },
            {
              icon: Sparkles,
              title: 'Novedades en su primer verano',
              body: 'Una montaña rusa recién estrenada, todo el mundo quiere haberla probado en su primera temporada, a ser posible antes que los compañeros de trabajo. En un estreno, cuenta con colas largas.',
            },
          ]}
        />
      </SectionShell>

      {/* 04 — Tactics */}
      <SectionShell
        id="tactics"
        index="04"
        kicker="Juega con astucia"
        title="Tácticas para colas cortas"
        icon={Sparkles}
      >
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Entre semana antes que fin de semana',
              body: 'La mayor palanca del calendario. Promediados todos los parques, el sábado es el día que más se aleja de la media por arriba y el martes el que más por abajo.',
            },
            {
              icon: CloudRain,
              title: 'Aprovecha el tiempo con astucia',
              body: 'Una previsión dudosa echa para atrás a mucha gente. Si no te importa un poco de llovizna, harás bastante menos cola. El chubasquero gana al paraguas.',
            },
            {
              icon: Ticket,
              title: (
                <>
                  <GlossaryTermLink termId="single-rider">Single rider</GlossaryTermLink> y{' '}
                  <GlossaryTermLink termId="virtual-queue">colas virtuales</GlossaryTermLink>
                </>
              ),
              body: 'Rellena como single rider los asientos sueltos o haz cola desde la app mientras comes o das una vuelta. No iréis sentados juntos, pero os sentaréis antes.',
            },
          ]}
        />
        <P>
          Cómo encaja todo esto dentro de un parque se explica paso a paso en la{' '}
          <Link href={`/${HOWTO_SEGMENTS.es}`}>guía completa</Link>.
        </P>
      </SectionShell>

      {/* 05 — Crowd calendar for your park */}
      <SectionShell
        id="parks"
        index="05"
        kicker="Para tu parque"
        title="El calendario de afluencia"
        icon={Ticket}
      >
        <P>
          Los patrones de arriba son el marco general. El mejor día para tu parque está en el{' '}
          <GlossaryTermLink termId="crowd-calendar">calendario de afluencia</GlossaryTermLink> de
          cada página de parque: verde, amarillo o rojo para cada día publicado, con las vacaciones
          y los festivos de la región que toca.
        </P>
        <SplitFigure
          src="/media/efteling/symbolica.jpg"
          alt="La atracción del palacio Symbolica en Efteling"
          kicker="Verde, amarillo, rojo"
          title="Un color por día, hasta donde llega el horario"
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="low" />
            </GlossaryTermLink>
          }
        >
          Cada página de parque lleva una previsión día a día que conoce las vacaciones escolares y
          los festivos de la región correcta, también los que nunca has oído nombrar. Elige un día
          verde y lo más importante de la planificación estará hecho antes de comprar la entrada.
        </SplitFigure>
        <P>Unos cuantos parques populares para empezar directamente:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Impulsado por Fancast"
        body="Nuestro propio modelo de predicción estima la afluencia para cada día publicado y se pone nota a sí mismo."
      />

      {/* 06 — FAQ */}
      <SectionShell
        id="faq"
        index="06"
        kicker="En breve"
        title="Preguntas frecuentes sobre la mejor época para visitar"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
