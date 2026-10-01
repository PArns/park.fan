import { CalendarDays, Clock, Footprints, Gauge, Users, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import { DEMO_PARTY_RIDES } from '../_fixtures';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/** The planner page's article, Spanish. See `content/de.tsx` for the convention. */
export function ContentES({ day, entries }: { day: PlanDay; entries: PlannerEntry[] }) {
  return (
    <>
      <Chapter
        id="un-dia-planificado"
        index="01"
        icon={CalendarDays}
        kicker="El día como línea de tiempo"
        title="Bloques y enlaces"
      >
        <P>
          Cada atracción de tu plan es un bloque en la línea de tiempo del día, y mide tanto como la
          cola que te espera a esa hora. Si lo arrastras a una hora más llena, crece; en una más
          tranquila, encoge. Entre dos bloques está el enlace, con la distancia hasta la siguiente
          atracción y si te da tiempo. «Justo» quiere decir que deja de salir en cuanto la espera
          anterior se desvía tanto como suele hacerlo.
        </P>
        <P>
          Abajo hay un plan para <A href={PARK}>Phantasialand</A> el sábado 12 de septiembre de
          2026, con las esperas que se preveían para ese día el 4 de septiembre. Arrastra un bloque
          a otra hora y se recalculan su altura y los enlaces. Nada de esto llega a tu propio plan.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          En el bloque seleccionado aparecen la hora, la espera prevista y cuánto suele fallar la
          previsión en esa atracción.
        </Note>
        <P>
          En una pantalla ancha caben dos días uno al lado del otro, por ejemplo sábado y domingo, o
          dos parques. Cada uno lleva su tiempo de cola en total, así ves qué día haces menos cola.
        </P>
      </Chapter>

      <Chapter
        id="de-donde-sale-el-numero"
        index="02"
        icon={Gauge}
        kicker="Previsión"
        title="De dónde salen los tiempos de espera"
      >
        <P>
          Cada atracción tiene una previsión para todo el día, hora a hora. Este sábado, Black Mamba
          baja de 35 minutos a mediodía a 20 a última hora, mientras que Chiapas está en 20 minutos
          a las diez y cuarto y en 35 por la tarde. Ese día, Black Mamba va mejor al final y Chiapas
          por la mañana.
        </P>
        <P>
          Cuánto suele fallar la previsión en una atracción aparece en su bloque, 15 minutos para{' '}
          <A href={`${PARK}/taron`}>Taron</A> este sábado. Cuanto más lejos está el día, más
          aproximada es la cifra, y al lado figura de dónde sale, de «Previsión por horas» a
          «Estimación aproximada», pasando por «De la previsión del día».
        </P>
        <P>
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> solo muestra sus
          tiempos de espera en su propia app, con el wifi del parque, así que para él no hay cifras.
          Puedes planificar un día allí igualmente, pero sin minutos y sin los botones de ordenar.
        </P>
      </Chapter>

      <Chapter
        id="quien-viene"
        index="03"
        icon={Users}
        kicker="Grupo"
        title="Altura mínima y atracciones de agua"
      >
        <P>
          Un día nuevo empieza con cuatro preguntas: qué parque, qué día, quién viene y qué
          atracciones grandes entran en el plan. En el calendario del mes, cada día tiene el color
          de la afluencia esperada, y el{' '}
          <A href={`${PARK}/calendario-tiempos-espera`}>calendario de tiempos de espera</A> del
          parque da más detalle.
        </P>
        <P>
          Si vienen niños, indicas cuánto mide el más bajo y si preferís no mojaros. Las atracciones
          con una altura mínima mayor y las de agua reciben entonces una marca y siguen en la lista,
          porque solo vosotros sabéis si alguien esperará a la salida con las bolsas. En
          Phantasialand, Taron pide {DEMO_PARTY_RIDES.taron.minimumHeight} cm y Chiapas{' '}
          {DEMO_PARTY_RIDES.chiapas.minimumHeight} cm, y en Chiapas te mojas (a 29 de septiembre de
          2026). Con un niño de 120 cm, las dos llevan la marca.
        </P>
        <Note>
          Donde no tenemos una altura mínima registrada, como en Moptis Monkey Depot, la atracción
          no lleva marca. En la entrada de la atracción vale lo que diga el parque.
        </Note>
      </Chapter>

      <Chapter
        id="el-dia"
        index="04"
        icon={Clock}
        kicker="El día"
        title="Horarios, espectáculos y pausas"
      >
        <P>
          Este sábado, Phantasialand abre a las 9, pero Taron, F.L.Y. y la mayoría de las demás
          atracciones grandes no funcionan hasta las 10. Si llegas a las nueve, empieza por Black
          Mamba o Maus au Chocolat. Un bloque no se puede arrastrar a antes de que abra su
          atracción.
        </P>
        <P>
          Los horarios de los espectáculos también aparecen en la línea de tiempo. Para hoy son los
          del parque. Para días posteriores ninguna fuente los publica, así que tomamos los del
          último día de la semana equivalente y añadimos «Previsto».
        </P>
        <P>
          Las pausas, la comida o un punto de encuentro van como bloque propio, tan largo como lo
          necesites. Si al crear el día marcas «Reservar un rato para comer», ya tienes uno a las
          12:30. Encima del día aparecen además las vacaciones escolares y los festivos y, hasta
          unas dos semanas antes, el tiempo.
        </P>
      </Chapter>

      <Chapter
        id="ordenar-el-dia"
        index="05"
        icon={Wand2}
        kicker="Ordenar"
        title="Dejar que se ordene el día"
      >
        <P>
          Con dos botones ordenas el día sin mover cada bloque a mano. «Planificar todas las
          atracciones estrella» añade las atracciones grandes que aún faltan y luego ordena todo el
          día. «Optimizar el día» solo reordena lo que ya está en el plan. En los dos casos todo
          cabe antes del cierre del parque y haces la menor cola posible.
        </P>
        <P>
          La pausa para comer y las atracciones marcadas como hechas se quedan donde están. Después
          ves cuántos minutos de cola te ahorras, y «Deshacer» recupera lo que tenías.
        </P>
        <P>
          Si no cabe todo en el día, se abre un asistente. Primero propone cambios que hacen sitio
          sin quitar ninguna atracción, como una pausa para comer más corta. Si no basta, ordenas
          las atracciones por importancia y se recorta por abajo.
        </P>
      </Chapter>

      <Chapter
        id="en-el-parque"
        index="06"
        icon={Footprints}
        kicker="En el parque"
        title="El mismo día"
      >
        <P>
          En el parque marcas lo que ya has montado. El bloque lleva entonces la espera que figuraba
          al marcarlo y cuánto se desvió la estimación. Si una atracción del plan figura como
          cerrada en ese momento, también aparece en su bloque.
        </P>
        <P>
          Con las notificaciones te avisamos cuando toca ir a la siguiente atracción, cuando una
          atracción del plan cierra o vuelve a abrir y cuando una espera cambia mucho. También
          puedes recibir los horarios de los espectáculos. Tú eliges qué te llega.
        </P>
        <P>
          El plan se guarda en tu navegador y no necesitas cuenta. Solo para las notificaciones
          guardamos una copia en nuestro servidor, que se borra en cuanto las desactivas. Mientras
          esté ahí, puedes mandar un enlace al plan, y quien lo abra puede quedárselo como copia
          propia.
        </P>
      </Chapter>
    </>
  );
}
