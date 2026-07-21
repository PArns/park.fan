 
import React from 'react';
import { Link } from '@/i18n/navigation';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
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
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import {
  Lead,
  Section,
  P,
  Highlight,
  TocNav,
  IngredientGrid,
  IngredientCard,
  CrowdLegend,
  TouchpointList,
  FaqList,
} from '../_fancast-ui';

const FAQ = [
  {
    question: '¿Qué precisión tiene Fancast?',
    answer:
      'La precisión actual se muestra en directo en la parte superior de esta página — como MAE (error medio en minutos), RMSE y MAPE. Esas cifras salen de comparar de verdad las predicciones pasadas con los tiempos de espera que realmente se midieron, no de un laboratorio de pruebas complaciente. Cambian cada vez que el modelo se reentrena.',
  },
  {
    question: '¿Con cuánta antelación puede predecir Fancast?',
    answer:
      'Fancast ofrece niveles de afluencia diarios para un parque hasta 365 días por adelantado. Para las atracciones individuales también genera previsiones de tiempo de espera por horas. Cuanto más se acerca el día, más pesan las señales a corto plazo como la previsión del tiempo.',
  },
  {
    question: '¿Con qué frecuencia se actualiza el modelo?',
    answer:
      'Cada día. Fancast se reentrena automáticamente una vez al día a las 06:00 UTC con los datos más frescos — incluidos los tiempos de espera de ayer. Así que, literalmente, mejora un poco cada mañana.',
  },
  {
    question: '¿Qué datos usa Fancast?',
    answer:
      'Tiempos de espera en directo e históricos de más de 150 parques, calendarios de vacaciones escolares y festivos (también de regiones vecinas), previsiones meteorológicas, horarios de apertura, eventos especiales y patrones estacionales. De esa mezcla nacen los niveles de afluencia diarios y las previsiones de tiempo de espera por horas.',
  },
  {
    question: '¿Por qué un parque muestra «Sin previsión»?',
    answer:
      'Fancast solo evalúa un parque cuando hay suficientes datos de operación — al menos unos 30 días de apertura. Los parques nuevos o que abren rara vez todavía no tienen esa base, así que preferimos mostrar honestamente «Sin previsión» antes que una cifra adivinada.',
  },
  {
    question: '¿Cuesta algo Fancast?',
    answer:
      'No. Como todo park.fan, cada previsión, calendario de afluencia y estadística es gratuita, sin publicidad y utilizable sin cuenta.',
  },
] as const;

export function ContentES() {
  return (
    <div className="space-y-14 text-base leading-7">
      {/* Intro */}
      <div className="space-y-5">
        <Lead>
          Fancast es nuestro modelo de previsión propio — la parte de park.fan que mira al futuro. ¿El
          nombre? Descarado pero con método: <strong>fan</strong> como en park.<strong>fan</strong>,{' '}
          <strong>cast</strong> como en fore<strong>cast</strong>. Un parte meteorológico para colas,
          vamos.
        </Lead>
        <P>
          La idea es tan sencilla como ambiciosa: Fancast lee millones de tiempos de espera reales en
          directo y predice lo lleno que estará un parque cualquier día — hasta 365 días por adelantado.
          Si el sábado merece la pena, o si te harías un favor con el martes. Verde, amarillo o rojo,
          mucho antes de estar en el coche.
        </P>
        <P>
          Y como solo confiamos en las cifras que tienen que demostrarse, Fancast hace algo que la
          mayoría de los modelos evitan discretamente: se pone nota a sí mismo. Cada predicción se
          contrasta después con el tiempo de espera que de verdad ocurrió — a la vista de todos, aquí
          mismo en esta página. Hacer trampa no sirve de nada.
        </P>
        <Highlight>
          En resumen: Fancast no es un adivino con bola de cristal. Es un estadístico terco que recibe
          clases de refuerzo cada noche y tiene que volver a examinarse cada mañana. Una rana del tiempo
          que verifica su propia meteorología.
        </Highlight>

        <TocNav
          label="Índice"
          items={[
            ['#note', 'La nota en directo'],
            ['#ingredients', 'Qué lee Fancast'],
            ['#training', 'Cómo aprende Fancast'],
            ['#levels', 'Verde, amarillo, rojo'],
            ['#where', 'Dónde te encuentras a Fancast'],
            ['#limits', 'Dónde están los límites'],
            ['#faq', 'Preguntas frecuentes'],
          ]}
        />
      </div>

      {/* Live scorecard — reuses the homepage ML section (live from the dashboard) */}
      <div id="note" className="scroll-mt-20 space-y-4">
        <P>
          Basta de preámbulos — aquí está la nota, en directo y sin maquillar. Fancast saca estas cifras
          de su propio panel en este mismo momento; cambian en cuanto el modelo se reentrena esta noche:
        </P>
      </div>
      <div className="-mx-4">
        <MLStatsSection />
      </div>

      {/* What it reads */}
      <Section id="ingredients" title="Qué lee Fancast" icon={Database}>
        <P>
          Un puente lluvioso de octubre es una bestia completamente distinta a un sábado soleado de
          vacaciones en julio — y eso un modelo tiene que aprenderlo primero. Por eso Fancast se
          alimenta de varias fuentes a la vez:
        </P>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Tiempos de espera en directo">
            Millones de mediciones reales de más de 150 parques, actualizadas al minuto. La materia
            prima de cada previsión.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendarios y vacaciones">
            Fines de semana, festivos y vacaciones escolares — también los de las regiones vecinas,
            porque a los visitantes de un día las fronteras les dan igual.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Tiempo">
            La probabilidad de lluvia y la temperatura moldean las previsiones a corto plazo. El sol
            atrae a las multitudes, la lluvia todo el día vacía los caminos.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Eventos y temporada">
            Halloween, vacaciones de verano, puentes, una atracción estrella en su primer verano — los
            sospechosos habituales de un día abarrotado.
          </IngredientCard>
          <IngredientCard icon={History} title="Historial">
            Años de historial de tiempos de espera por parque. Patrones que solo se ven si los miras
            fijamente el tiempo suficiente.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Horarios y capacidad">
            Cuándo abre el parque, durante cuánto tiempo, con qué capacidad — el marco en el que encaja
            todo lo demás.
          </IngredientCard>
        </IngredientGrid>
        <P>
          De esa mezcla el modelo saca dos cosas: una{' '}
          <strong>previsión horaria de tiempos de espera</strong> para las atracciones individuales y
          una <strong>nota de afluencia diaria</strong> para todo el parque.
        </P>
      </Section>

      {/* How it learns */}
      <Section id="training" title="Cómo aprende Fancast (y no puede hacer trampa)" icon={RefreshCw}>
        <P>
          El truco más importante es de lo más discreto: Fancast se reentrena <strong>cada noche</strong>,
          todos los días a las 06:00 UTC. Lo que pasó ayer, el modelo lo sabe hoy. Un aficionado a las
          montañas rusas se hace mayor y se cansa con los años — Fancast se vuelve un poco más listo cada
          mañana.
        </P>
        <P>
          Y solo se le pone a prueba con días que <strong>nunca ha visto</strong> — con el futuro, no con
          días del pasado memorizados. Cualquier otra cosa sería como colarte tú mismo las preguntas del
          examen por adelantado y luego celebrar tu boletín de sobresalientes.
        </P>
        <P>
          Además, Fancast vigila si empieza a <strong>desviarse</strong> — si la realidad se le escapa
          poco a poco. Y una nueva versión del modelo solo se pone en marcha si de verdad supera a la
          antigua en una comparación justa. Democracia entre algoritmos: si no eres mejor, te quedas en
          el banquillo.
        </P>
      </Section>

      {/* Crowd levels */}
      <Section id="levels" title="Verde, amarillo, rojo: los niveles de afluencia" icon={Gauge}>
        <P>
          Al final de todo ese cálculo queda un único color. Seis niveles, desde «tienes el parque
          prácticamente para ti» hasta «bienvenido a un sábado de vacaciones»:
        </P>
        <CrowdLegend
          items={[
            {
              level: 'very_low',
              text: 'Casi vacío. Sueños de rope-drop, vueltas seguidas, una foto con la mascota sin cola.',
            },
            {
              level: 'low',
              text: 'Tranquilo. Esperas cortas, te subes a todo sin necesitar un plan de batalla.',
            },
            {
              level: 'moderate',
              text: 'Funcionamiento normal. Las atracciones estrella se llenan, el resto se mantiene relajado. Un buen día de compromiso.',
            },
            {
              level: 'high',
              text: 'Notablemente concurrido. Para las mejores atracciones vale la pena madrugar — o armarse de paciencia.',
            },
            {
              level: 'very_high',
              text: 'De verdad lleno. Colas largas en lo más destacado; planificar gana claramente a la improvisación.',
            },
            {
              level: 'extreme',
              text: 'Alerta máxima. Sábado de vacaciones en pleno verano. Recomendable solo con estrategia, aguante y sentido del humor.',
            },
          ]}
        />
      </Section>

      {/* Where you meet it */}
      <Section id="where" title="Dónde te encuentras a Fancast" icon={MapPin}>
        <P>
          Fancast no vive en una página solitaria — está entretejido por todo park.fan, casi siempre sin
          presentarse:
        </P>
        <TouchpointList
          items={[
            {
              title: 'Previsión de hoy',
              body: 'la nota de afluencia en la cabecera del parque, antes incluso de tocar la primera atracción.',
            },
            {
              title: 'Calendario de afluencia',
              body: (
                <>
                  el <Link href="/parks">calendario de los mejores días para visitar</Link> en cada
                  página de parque — verde, amarillo, rojo, hasta un año por adelantado.
                </>
              ),
            },
            {
              title: 'Mejor época para visitar',
              body: 'los días entre semana más tranquilos y los próximos días secretos, destilados de los mismos datos.',
            },
            {
              title: 'Previsión de IA en el gráfico de tiempos de espera',
              body: 'la línea discontinua que revela las franjas horarias más convenientes de una atracción.',
            },
            {
              title: 'Recomendación de rope-drop',
              body: 'la respuesta honesta a «¿merece la pena llegar temprano?» — con los mínimos esperados incluidos.',
            },
          ]}
        />
        <P>
          Cómo se desarrolla todo esto dentro de un parque se recorre paso a paso en la{' '}
          <Link href="/howto">guía completa</Link>.
        </P>
      </Section>

      {/* Limits */}
      <Section id="limits" title="Dónde Fancast se queda callado (por ahora)" icon={ShieldAlert}>
        <P>
          Fancast es bueno, pero no delirante — y te avisa cuando prefiere callarse. Para los parques con
          <strong> menos de unos 30 días de operación</strong> de datos sencillamente no hay nota; en su
          lugar dice honestamente «Sin previsión» en vez de una cifra adivinada:
        </P>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <CrowdLevelBadge level="unknown" />
          <span className="text-muted-foreground text-sm leading-relaxed">
            Todavía no evaluable — demasiados pocos días de operación para asignar un color con la
            conciencia tranquila.
          </span>
        </div>
        <P>
          E incluso donde Fancast tiene una opinión, la entrega con <strong>confidence</strong> — un
          honesto «bastante seguro» o «más bien una corazonada». Parques nuevos, eventos especiales
          exóticos, un primer festival de invierno: ahí el modelo todavía está aprendiendo. Mejora con
          cada temporada — lo único que prometemos es que no lo endulzaremos.
        </P>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="Preguntas frecuentes sobre Fancast" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
