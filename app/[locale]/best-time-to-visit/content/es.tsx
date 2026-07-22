import React from 'react';
import { Link } from '@/i18n/navigation';
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

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'Los días laborables más tranquilos',
  weekdaysBody:
    'Promediado entre todos los parques — cada parque normalizado primero a su propia media, para que los parques grandes no eclipsen a los pequeños. Así de lleno está un día laborable típico frente a la media. De martes a jueves ganan casi siempre.',
  monthsTitle: 'Los meses más tranquilos',
  monthsBody:
    'El mismo cálculo a lo largo del año: los meses de temporada baja están notablemente más vacíos que los picos del verano y las vacaciones.',
  quieter: 'más tranquilo',
  busier: 'más lleno',
  typical: 'cerca de la media',
  footnote: 'Basado en {days} días-parque de {parks} parques, últimos {months} meses.',
  pending:
    'La clasificación en vivo aún está recopilando tiempos de espera. Los días más tranquilos aparecerán aquí en cuanto haya datos suficientes.',
};

const FAQ = [
  {
    question: '¿Cuál es la mejor época para visitar un parque de atracciones?',
    answer:
      'Lo más tranquilo son los días laborables fuera de las vacaciones escolares — de martes a jueves en temporada baja son casi siempre los días más relajados. Los patrones exactos por día de la semana y mes se muestran arriba, en directo a partir de datos reales de tiempos de espera de todos los parques.',
  },
  {
    question: '¿Qué día de la semana está menos concurrido?',
    answer:
      'Promediado entre todos los parques, el martes, el miércoles y el jueves son los más tranquilos, mientras que el sábado y el domingo son claramente los más concurridos. Cada parque puede variar — cada página de parque tiene un calendario de afluencia que lo muestra día a día.',
  },
  {
    question: '¿En qué meses están menos concurridos los parques de atracciones?',
    answer:
      'Los meses de temporada baja, lejos de los picos del verano y los festivos, son los más vacíos. El resumen mensual de arriba muestra la afluencia relativa a lo largo del año, promediada entre todos los parques.',
  },
  {
    question: '¿Merece la pena visitar con lluvia?',
    answer:
      'A menudo sí: el mal tiempo echa para atrás a muchos visitantes y las colas se acortan — sobre todo en las montañas rusas, que funcionan igualmente. Pero el truco de iniciado solo sirve mientras no todos tengan la misma idea; por eso nuestro modelo de predicción incorpora el tiempo directamente.',
  },
  {
    question: '¿Cómo encuentro el mejor día para un parque concreto?',
    answer:
      'Esta página muestra los patrones globales como punto de partida. Para un parque concreto, abre su calendario de afluencia: muestra para cada día, hasta un año por delante, una previsión verde, amarilla o roja — incluidas las vacaciones escolares y los festivos de esa región.',
  },
  {
    question: '¿De dónde salen estos datos?',
    answer:
      'De los tiempos de espera realmente registrados de más de 150 parques durante los dos últimos años. Cada parque se normaliza a su propia media y luego se promedia entre todos los parques, para que la clasificación sea justa y no la dominen los parques más grandes.',
  },
] as const;

export function ContentES() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          La mejor época para visitar un parque de atracciones no es un secreto — es un patrón.
          Cuándo se llena un parque sigue el día de la semana, el calendario de vacaciones escolares,
          el tiempo y la temporada; los cuatro dejan huellas en los tiempos de espera.
        </Lead>
        <P>
          Esas huellas las hemos medido en más de 150 parques durante los dos últimos años. Más
          abajo: los días laborables y los meses más tranquilos, las horas más tranquilas del día,
          las fechas que conviene esquivar — y el calendario de afluencia que convierte todo eso en
          el único mejor día para tu parque.
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
          La afluencia no es cosa del azar: cuándo se llena sigue patrones claros de día de la
          semana, vacaciones, tiempo y temporada. Aquí tienes los dos mayores — promediados entre
          todos los parques, a partir de datos reales de tiempos de espera:
        </PG>
        <BestTimesData locale="es" labels={DATA_LABELS} />
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
          No solo cuenta el día, sino también la hora. Tres franjas son las más tranquilas casi en
          todas partes:
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
              body: 'Cuando la multitud come, las colas se vacían — un buen momento para las atracciones populares (y para comer más tarde).',
            },
            {
              icon: Sun,
              title: 'Los últimos 90 minutos',
              body: 'Muchos visitantes de un día se marchan pronto. Justo antes del cierre, las esperas suelen bajar de nuevo de forma notable.',
            },
            {
              icon: Ticket,
              title: 'Durante el gran espectáculo nocturno',
              body: 'Un desfile o unos fuegos artificiales retienen a miles de visitantes a la vez — los tiempos de espera de las montañas rusas caen de forma medible.',
            },
          ]}
        />
        <SplitFigure
          src="/images/parks/phantasialand/black-mamba.jpg"
          alt="Black Mamba surcando la jungla en Phantasialand"
          kicker="Rope drop"
          title="La primera hora es de oro"
        >
          Quien está dentro a la apertura sube a las atracciones estrella a menudo por una fracción
          de la espera posterior. La primera hora sustituye habitualmente a dos de la tarde — sin
          fast-pass, solo un despertador temprano.
        </SplitFigure>
      </SectionShell>

      {/* 03 — Dates to avoid */}
      <SectionShell id="avoid" index="03" kicker="Días rojos" title="Fechas que conviene evitar" icon={Ban}>
        <PG>
          Tan importantes como los días tranquilos son los concurridos. En estas fechas cuenta con
          aglomeraciones — prevélas, o planifica esquivándolas:
        </PG>
        <SplitFigure
          src="/images/parks/walibi-holland/goliath.jpg"
          alt="La montaña rusa Goliath en Walibi Holland en un día concurrido"
          kicker="Día punta"
          title="Sol, todos libres, todos aquí"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          La combinación punta clásica — un sábado de vacaciones en pleno verano — reúne casi todos
          los factores de afluencia a la vez. Si puedes, coge mejor el martes siguiente: el mismo
          parque, la mitad de cola.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Fines de semana y festivos',
              body: 'El sábado y el domingo son los más concurridos en todos los parques; los festivos y los puentes largos aprietan aún más.',
            },
            {
              icon: CalendarRange,
              title: 'Vacaciones escolares',
              body: 'Durante las vacaciones de tu región y de las vecinas la afluencia sube con fuerza — las de verano por encima de todo.',
            },
            {
              icon: Sun,
              title: 'Puentes y sábados de vacaciones en pleno verano',
              body: 'La combinación punta clásica: buen tiempo, todos libres, todos allí. Si puedes, mejor el martes siguiente.',
            },
            {
              icon: Sparkles,
              title: 'Novedades en su primer verano',
              body: 'Una montaña rusa recién estrenada atrae multitudes en su temporada de apertura — cuenta con largas colas en los estrenos.',
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
              body: 'La mayor palanca de todas: un martes en lugar de un sábado puede reducir a la mitad los tiempos de espera.',
            },
            {
              icon: CloudRain,
              title: 'Aprovecha el tiempo con astucia',
              body: 'Una previsión dudosa echa para atrás a mucha gente. Quien va preparado para la lluvia hace menos cola — un chubasquero gana al paraguas.',
            },
            {
              icon: Sunrise,
              title: 'Llega temprano',
              body: 'El rope drop supera casi cualquier otra táctica. La primera hora sustituye a menudo a dos de la tarde.',
            },
            {
              icon: Ticket,
              title: 'Single rider y colas virtuales',
              body: 'Sube solo o haz cola en digital mientras comes o compras — tiempo regalado en los días concurridos.',
            },
          ]}
        />
        <P>
          Cómo encaja todo esto dentro de un parque se explica paso a paso en la{' '}
          <Link href="/howto">guía completa</Link>.
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
          Los patrones de arriba son el punto de partida. El mejor día exacto te lo revela el
          calendario de afluencia de cada página de parque — verde, amarillo, rojo, hasta un año por
          delante, con las vacaciones y festivos de la región correspondiente.
        </P>
        <SplitFigure
          src="/images/parks/efteling/symbolica.jpg"
          alt="La atracción del palacio Symbolica en Efteling"
          kicker="Verde, amarillo, rojo"
          title="Un color por día, un año por delante"
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
        body="Nuestro modelo de predicción — anticipa la afluencia hasta 365 días por delante y se califica a sí mismo de forma abierta."
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
