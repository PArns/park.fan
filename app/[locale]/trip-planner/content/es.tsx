import { CalendarDays, Footprints, Gauge, HelpCircle, Sunrise, Theater } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/** El artículo de la página del planificador, español. Ver `content/de.tsx` para la convención. */
export function ContentES({ day, entries }: { day: PlanDay; entries: PlannerEntry[] }) {
  return (
    <>
      <Chapter
        id="un-dia-planificado"
        index="01"
        icon={CalendarDays}
        kicker="El día como línea de tiempo"
        title="Qué hace el planificador con un día de parque"
      >
        <P>
          Un bloque es una atracción, y su altura es la espera prevista para su hora. Arrastra el
          mismo bloque a una hora con más gente y crece; colócalo en una más tranquila y encoge.
          Entre dos bloques no hay hueco vacío, sino el traslado: cuánto hay que andar y si queda
          tiempo para hacerlo. Salir de la estación y el viaje en sí se cuentan ahí, no en el
          bloque.
        </P>
        <P>
          Nada de lo que sigue está redibujado. Son las mismas piezas que mueve el planificador,
          alimentadas con la respuesta que dio la API el 4 de septiembre de 2026 para el sábado 12
          de septiembre en <A href={PARK}>Phantasialand</A>. Arrastra un bloque a otra hora: encaja
          en pasos de cinco minutos, recalcula su altura y los traslados de al lado también. Aquí no
          se guarda nada.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          El bloque seleccionado lo dice con todas las letras: la hora, la espera prevista y cuánto
          suele equivocarse la previsión en esa atracción.
        </Note>
      </Chapter>

      <Chapter
        id="de-donde-sale-el-numero"
        index="02"
        icon={Gauge}
        kicker="El número del bloque"
        title="De dónde salen los minutos y cuánto valen"
      >
        <P>
          Para cada atracción la API devuelve una curva del día, hora a hora. Ese sábado Taron marca
          45 minutos a las diez, 50 a las once, 40 a la una y otra vez 50 por la tarde. Esa es la
          verdadera razón para montar en Taron pronto: no porque la mañana sea siempre más
          tranquila, sino porque ese día no tiene ninguna hora floja para esa atracción. Black Mamba
          hace lo contrario y baja de 35 minutos al mediodía a 20 a las seis, y Chiapas sube de 20 a
          35.
        </P>
        <P>
          A eso se suma cuánto se suele desviar la cifra, y eso sigue al nivel: cuanto más larga la
          cola, mayor la dispersión. Para las atracciones cuyo pico del día llega a 35 minutos o
          más, la API indica ese sábado un error típico de 15,4 minutos, y de 10,9 para las más
          planas. Típico significa que la mitad de los días se aleja más. Por eso el planificador lo
          escribe como un más-menos en el bloque seleccionado y nunca como un intervalo que ya
          contuviera la respuesta correcta.
        </P>
        <Note>
          Detrás de la curva de Taron hay 142 días medidos, detrás de Black Mamba 161. El número
          está en <A href={`${PARK}/taron`}>la página de la atracción</A>.
        </Note>
        <P>
          El planificador dice además qué clase de previsión tiene entre manos. Si el modelo calcula
          el día hora a hora, lo indica. Si la altura del día viene de la previsión y la forma de
          días anteriores, como ese sábado, también lo indica. Con bastante antelación esa altura se
          vuelve fina y queda una estimación aproximada. Para un día que nunca se ha medido no hay
          plan con números.
        </P>
      </Chapter>

      <Chapter
        id="horarios-de-apertura"
        index="03"
        icon={Sunrise}
        kicker="Apertura"
        title="El parque abre a las nueve, la atracción a las diez"
      >
        <P>
          Ese sábado Phantasialand abre a las 9. Taron, F.L.Y., las dos Winja&apos;s y Raik
          funcionan a partir de las 10, y Chiapas desde las 10:15. Quien esté en el torno a las
          nueve puede montar en Black Mamba o en Maus au Chocolat, y ahí acaba la lista. No es un
          detalle: un plan que llena la primera hora con las atracciones principales está
          planificando una hora que no existe.
        </P>
        <P>
          El planificador conoce la hora de apertura de cada atracción y no deja que un bloque se
          coloque antes. Para la tarde no hay equivalente: ningún feed informa de forma fiable de
          cuándo cierra una atracción, así que no se afirma nada al respecto. La línea de tiempo
          termina en la hora de cierre del parque.
        </P>
      </Chapter>

      <Chapter
        id="traslados"
        index="04"
        icon={Footprints}
        kicker="El camino intermedio"
        title="Entre dos atracciones hay un camino, y cuesta tiempo"
      >
        <P>
          Un feed de tiempos de espera puede decir que Taron está en 50 minutos. Lo que no puede
          decir es que desde Rookburgh no vas a llegar a tiempo. Para eso está el traslado. Parte de
          la distancia entre las coordenadas de ambas atracciones, más tres minutos para salir de
          una estación y tres para embarcar y montar donde no consta ninguna duración.
        </P>
        <P>
          Esa distancia es en línea recta, y así se nombra. Es una cota inferior y nunca un tiempo
          de caminata: los caminos rodean el agua, las colas y los sentidos únicos, y Phantasialand
          apila Rookburgh y Klugheim uno encima del otro. Por eso la cota superior se calcula a
          ritmo de parque en lugar de paso ligero, con dos tercios añadidos a la línea recta por el
          rodeo.
        </P>
        <Note>
          «Justo» no significa estrecho. Significa que ese traslado deja de cuadrar si la previsión
          se equivoca tanto como ella misma advierte. Donde la API no da dispersión, el veredicto se
          queda en «bien» y lo indica en su título.
        </Note>
      </Chapter>

      <Chapter
        id="horarios-de-espectaculos"
        index="05"
        icon={Theater}
        kicker="Espectáculos"
        title="Un horario viene del parque o de nuestro cálculo"
      >
        <P>
          Para hoy la API tiene el horario del propio parque. Para cualquier otra fecha ninguna
          fuente lo conoce por adelantado, así que traslada el último día de la semana equivalente e
          indica de qué fecha vienen los horarios y sobre cuántos días se apoyan. Los dos no pueden
          parecer lo mismo: un traslado lleva una tilde delante de la hora y la palabra «previsto»;
          un horario del parque, ninguna de las dos cosas.
        </P>
        <P>
          Ese sábado todos los horarios son trasladados: los de Dragon Drago y Kroka&apos;s Lodge
          vienen del 15 de agosto, los de Miji African Dancers del 29. El último pase de
          Kroka&apos;s Lodge a las 19:00 no aparece en la línea de tiempo: el parque cierra a las
          18:00, así que los horarios trasladados más allá se descartan.
        </P>
      </Chapter>

      <Chapter
        id="limites"
        index="06"
        icon={HelpCircle}
        kicker="Límites"
        title="Lo que el planificador no sabe"
      >
        <P>
          No todos los parques publican tiempos de espera.{' '}
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> solo los muestra en
          su propia aplicación dentro de la wifi del parque, así que nunca nos llegará una cifra
          suya y el planificador no se la inventa. Para fechas lejanas tampoco hay tiempo
          meteorológico: la previsión llega a unas dos semanas y, más allá, el panel lo dice en vez
          de dejar un hueco que se leería como «no lloverá».
        </P>
        <P>
          Y lo que un plan cuesta de verdad lo decide el día. Una atracción se para, un espectáculo
          se cancela, una tormenta le da la vuelta a la tarde. El plan no es un horario, sino un
          cálculo sobre si el día puede cuadrar así. En el parque vas marcando lo que has montado, y
          el planificador anota la espera que realmente había.
        </P>
        <P>
          Todo eso vive en tu navegador. Sin cuenta, sin servidor, sin sincronización: el plan es un
          archivo en tu propio almacenamiento, y quien abre el planificador sin ninguno se encuentra
          con el asistente y sus tres preguntas previas. Qué parque, qué día, quién viene. El día se
          elige mejor en el{' '}
          <A href={`${PARK}/calendario-tiempos-espera`}>calendario de tiempos de espera</A> del
          parque.
        </P>
      </Chapter>
    </>
  );
}
