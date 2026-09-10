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
          Cuándo se llena un parque de atracciones es sorprendentemente previsible. El día de la
          semana, las vacaciones escolares, el tiempo y la temporada deciden en buena parte si en la
          montaña rusa esperas diez minutos o hora y media. Y como cada visita deja tiempos de
          espera detrás, eso se puede recalcular con bastante precisión.
        </Lead>
        <P>
          Eso es justo lo que hemos hecho: analizar los tiempos de espera registrados en más de 200
          parques. Aquí están los días laborables y los meses más tranquilos, las horas más
          tranquilas del día y las fechas que conviene esquivar. El calendario de afluencia te busca
          después el día que le va a tu parque.
        </P>
        <Highlight>
          Versión corta: de martes a jueves fuera de las vacaciones escolares, llegar a la apertura
          y dejar que una previsión de tiempo variable haga por ti la criba de la multitud. Todo lo
          de abajo es la letra pequeña.
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
          Empecemos por las dos palancas más grandes: el día de la semana y el mes. Las dos están
          promediadas entre todos los parques, a partir de los tiempos de espera medidos:
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
              title: 'A la apertura (rope drop)',
              body: 'La primera hora es de oro: quien está dentro a la apertura sube a las atracciones estrella a menudo por una fracción de la espera posterior.',
            },
            {
              icon: Users,
              title: 'A la hora de comer',
              body: 'Cuando la multitud come, las colas se vacían. Aprovecha ese rato para las atracciones populares y come más tarde.',
            },
            {
              icon: Sun,
              title: 'Los últimos 90 minutos',
              body: 'Muchos visitantes de un día se marchan pronto. Justo antes del cierre, las esperas suelen bajar de nuevo de forma notable.',
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
          otras solo se animan después de comer. La página de cada atracción trae su propia curva
          del día, y ahí se ve si a esa le compensa el despertador más temprano.
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
          Tan importantes como los días tranquilos son los concurridos. En estas fechas cuenta con
          aglomeraciones: o te preparas para ellas, o planificas esquivándolas.
        </PG>
        <SplitFigure
          src="/media/walibi-holland/goliath.jpg"
          alt="La montaña rusa Goliath en Walibi Holland en un día concurrido"
          kicker="Día punta"
          title="Sol, todos libres, todos aquí"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          La combinación punta clásica, un sábado de vacaciones en pleno verano, reúne casi todos
          los factores de afluencia a la vez. Si puedes, coge mejor el martes siguiente. El mismo
          parque se siente completamente distinto.
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
              title: 'Vacaciones escolares',
              body: 'En cuanto hay vacaciones en tu región o en las vecinas, se llena. Las de verano son la temporada alta absoluta.',
            },
            {
              icon: Sun,
              title: 'Puentes y sábados de vacaciones en pleno verano',
              body: 'La combinación punta clásica: buen tiempo, todos libres, todos allí. Si puedes, mejor el martes siguiente.',
            },
            {
              icon: Sparkles,
              title: 'Novedades en su primer verano',
              body: 'Una montaña rusa recién estrenada atrae a todo el mundo en su primera temporada. En un estreno, cuenta con colas largas.',
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
              title: 'Single rider y colas virtuales',
              body: 'Sube solo en los asientos sueltos o haz cola desde la app mientras comes o das una vuelta. En los días llenos, es tiempo regalado.',
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
          Los patrones de arriba son el punto de partida. El mejor día exacto está en el calendario
          de afluencia de cada página de parque: verde, amarillo o rojo para cada día publicado, con
          las vacaciones y los festivos de la región que toca.
        </P>
        <SplitFigure
          src="/media/efteling/symbolica.jpg"
          alt="La atracción del palacio Symbolica en Efteling"
          kicker="Verde, amarillo, rojo"
          title="Un color por día, hasta donde llega el horario"
          badge={<CrowdLevelBadge level="low" />}
        >
          Cada página de parque lleva una previsión día a día que incorpora las vacaciones escolares
          y los festivos de esa región exacta. Elige un día verde y habrás hecho el noventa por
          ciento de la planificación antes incluso de reservar.
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
