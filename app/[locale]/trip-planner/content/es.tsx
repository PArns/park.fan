import { CalendarDays, Footprints, Gauge, HelpCircle, Sunrise, Theater, Wand2 } from 'lucide-react';
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
          Entre dos bloques está el traslado: cuánto hay que andar y si queda tiempo para hacerlo.
          Salir de la estación y el viaje en sí ya van incluidos en el traslado.
        </P>
        <P>
          La línea de tiempo de abajo está hecha con las mismas piezas que el planificador y muestra
          la respuesta que dio la API el 4 de septiembre de 2026 para el sábado 12 de septiembre en{' '}
          <A href={PARK}>Phantasialand</A>. Arrastra un bloque a otra hora. Encaja en pasos de cinco
          minutos, y su altura y los traslados de al lado se vuelven a calcular. Aquí no se guarda
          nada.
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
          45 minutos a las diez, 50 a las once, 40 a la una y otra vez 50 por la tarde; en todo el
          día solo hay diez minutos de diferencia. Para Taron no hay ninguna franja buena ese día,
          así que el planificador la pone donde el resto del día deja hueco. Black Mamba, en cambio,
          baja de 35 minutos al mediodía a 20 a las seis, y Chiapas va al revés, de 20 a 35.
        </P>
        <P>
          A eso se suma cuánto se suele desviar la cifra, y eso sigue al nivel: cuanto más larga la
          cola, mayor la dispersión. Para las atracciones cuyo pico del día llega a 35 minutos o
          más, la API indica ese sábado un error típico de 15,4 minutos, y de 10,9 para las más
          planas. Típico significa que la mitad de los días se aleja más. Por eso el planificador lo
          escribe como un más-menos en el bloque seleccionado. Escrito como intervalo, parecería que
          la espera real cae con seguridad dentro de él.
        </P>
        <Note>
          Detrás de la curva de Taron hay 142 días medidos, detrás de Black Mamba 161. El número
          está en <A href={`${PARK}/taron`}>la página de la atracción</A>.
        </Note>
        <P>
          El planificador dice además qué clase de previsión tiene entre manos. Si el modelo calcula
          el día hora a hora, lo indica. Si la altura del día viene de la previsión y la forma de
          días anteriores, como ese sábado, también lo indica. Con bastante antelación esa altura ya
          es incierta y queda una estimación aproximada. Para un día que nunca se ha medido no hay
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
          nueve puede montar en Black Mamba o en Maus au Chocolat, y en nada más. Un plan que llena
          la primera hora con las atracciones principales no cuadra ese día.
        </P>
        <P>
          El planificador conoce la hora de apertura de cada atracción y no deja que un bloque se
          coloque antes. Por la tarde no puede hacer lo mismo, porque ningún feed informa de forma
          fiable de cuándo cierra una atracción. La línea de tiempo termina en la hora de cierre del
          parque.
        </P>
      </Chapter>

      <Chapter
        id="traslados"
        index="04"
        icon={Footprints}
        kicker="El camino intermedio"
        title="Cuánto tardas de una atracción a otra"
      >
        <P>
          Un feed de tiempos de espera dice que Taron está en 50 minutos. No dice si desde Rookburgh
          llegas a tiempo, y eso es lo que calcula el traslado. Toma la distancia entre las
          coordenadas de ambas atracciones, más tres minutos para salir de una estación y tres para
          embarcar y montar donde no consta ninguna duración.
        </P>
        <P>
          Esa distancia es en línea recta, y así se nombra. Andando, el camino es más largo: los
          caminos rodean el agua, las colas y los sentidos únicos, y Phantasialand apila Rookburgh y
          Klugheim uno encima del otro. Por eso la cota superior se calcula a ritmo de parque en
          lugar de paso ligero, con dos tercios añadidos a la línea recta por el rodeo.
        </P>
        <Note>
          «Justo» significa que ese traslado deja de cuadrar si la previsión se equivoca tanto como
          ella misma advierte. Donde la API no da dispersión, el veredicto se queda en «bien» y lo
          indica en su título.
        </Note>
      </Chapter>

      <Chapter
        id="ordenar-el-dia"
        index="05"
        icon={Wand2}
        kicker="Ordenar"
        title="Dejar que el planificador ordene el día"
      >
        <P>
          De eso se encargan dos botones. «Planificar todas las atracciones estrella» añade las
          grandes del parque que aún no están en el día y después ordena todo. «Optimizar el día» no
          añade nada y solo reordena lo que ya está planificado. Detrás de los dos corre el mismo
          cálculo. El primero es para cuando aún faltan atracciones grandes; el segundo, para cuando
          solo quieres mejorar el orden.
        </P>
        <P>
          Se ordena según cuatro reglas, de mayor a menor prioridad. La primera es la tuya: lo que
          pones delante es lo último que se cae. Después, que todo llegue a tiempo antes del cierre.
          El planificador prefiere una atracción menos que seguro se hace a una más que ya no entra.
          Después, la suma de las esperas. Y cuando dos órdenes cuestan lo mismo, gana el que
          termina antes. No hay ningún control deslizante para sopesar la cola frente al rato
          muerto, porque para esa proporción no se puede justificar ningún valor.
        </P>
        <P>
          Ahí dentro no hay ninguna regla sobre la primera hora de la mañana. El planificador solo
          conoce la curva horaria de cada atracción. Si está en su punto más bajo justo después de
          abrir, «la grande primero» sale del cálculo por sí solo; si es plana, sale otra cosa. En
          un día medido, Taron marca hora tras hora 60, 60, 54, 53 y 59 minutos, mientras que
          Chiapas sube 22.
        </P>
        <P>
          A veces la propuesta es esperar un rato en lugar de ponerse ya en la cola. Eso ocurre con
          una única condición: la cola tiene que bajar lo suficiente para que, contando la pausa,
          quedes libre antes que si te hubieras puesto de inmediato. Hacer menos cola no basta, y el
          día no puede terminar más tarde por culpa de la pausa. Una pausa así nunca dura más de dos
          horas. Ese límite casi nunca entra en juego, porque una pausa solo compensa si es más
          corta que la cola que ahorra, y dos horas de pausa exigirían una cola de más de dos horas.
        </P>
        <P>
          Una pausa para comer a la una se queda a la una, y una atracción marcada ya está montada y
          no se vuelve a planificar; lo demás se ordena alrededor. Después pone lo que ha pasado.
          «18 min menos de cola» es la diferencia entre dos cuentas hechas igual, una antes del clic
          y otra después; si no hay nada que ganar, pone que el orden ya es el bueno y el plan se
          queda como estaba. El botón de las atracciones estrella no anuncia ahorro, porque con las
          nuevas atracciones el día se alarga; en su lugar cuenta cuántas se han añadido y cuántas
          no encajan con el grupo. Lo que al final ya no cabe en el día se indica después de
          cualquiera de los dos botones. Lo acompaña un «Deshacer» que devuelve el estado anterior
          al clic mientras el planificador siga abierto.
        </P>
        <Note>
          Donde no llega ningún tiempo de espera, los dos botones ni siquiera aparecen. En el
          Hansa-Park cada atracción cuesta el mismo cero supuesto, así que un orden vale tanto como
          otro y no hay nada que ordenar.
        </Note>
      </Chapter>

      <Chapter
        id="horarios-de-espectaculos"
        index="06"
        icon={Theater}
        kicker="Espectáculos"
        title="De dónde salen los horarios de los espectáculos"
      >
        <P>
          Para hoy la API tiene el horario del propio parque. Para cualquier otra fecha ninguna
          fuente lo conoce por adelantado, así que traslada el último día de la semana equivalente e
          indica de qué fecha vienen los horarios y sobre cuántos días se apoyan. Para distinguir
          los dos, un traslado lleva una tilde delante de la hora y la palabra «previsto». Un
          horario del parque no lleva ninguna de las dos cosas.
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
        index="07"
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
          El mismo día, una atracción puede pararse, un espectáculo cancelarse o una tormenta
          trastocar la tarde. El plan solo calcula si el día puede cuadrar con las esperas
          previstas. En el parque vas marcando lo que has montado, y el planificador anota la espera
          que realmente había.
        </P>
        <P>
          El plan está en tu navegador y no necesitas cuenta. Solo cuando activas las notificaciones
          se guarda una copia en el servidor, y el planificador lo avisa en ese momento. Quien abre
          el planificador sin plan se encuentra con el asistente y sus cuatro preguntas previas: qué
          parque, qué día, quién viene y qué grandes atracciones entran en el día. El día adecuado
          se encuentra mejor en el{' '}
          <A href={`${PARK}/calendario-tiempos-espera`}>calendario de tiempos de espera</A> del
          parque.
        </P>
      </Chapter>
    </>
  );
}
