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
        title="Bloques y traslados"
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
          En el bloque seleccionado aparece lo mismo en palabras: la hora, la espera prevista y
          cuánto suele equivocarse la previsión en esa atracción.
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
          día solo hay diez minutos de diferencia. Como para Taron no hay ninguna franja buena ese
          día, acaba donde el resto del día deja hueco. Black Mamba baja de 35 minutos al mediodía a
          20 a las seis, y Chiapas va al revés, de 20 a 35.
        </P>
        <P>
          A eso se suma cuánto se suele desviar la cifra, y cuanto más larga la cola, mayor la
          dispersión. Para las atracciones cuyo pico del día llega a 35 minutos o más, la API indica
          ese sábado un error típico de 15,4 minutos, y de 10,9 para las más planas. En la mitad de
          los días, la espera real se aleja más que eso. Por eso aparece como un más-menos en el
          bloque seleccionado. Escrito como intervalo, parecería que la espera real cae con
          seguridad dentro de él.
        </P>
        <Note>
          Detrás de la curva de Taron hay 142 días medidos, detrás de Black Mamba 161. El número
          está en <A href={`${PARK}/taron`}>la página de la atracción</A>.
        </Note>
        <P>
          Junto a la cifra consta además qué clase de previsión es. Si el modelo calcula el día hora
          a hora, así se indica. Si la altura del día viene de la previsión y la forma de días
          anteriores, como ese sábado, también se indica. Con bastante antelación esa altura ya es
          incierta y queda una estimación aproximada. Para un día que nunca se ha medido no hay plan
          con números.
        </P>
      </Chapter>

      <Chapter
        id="horarios-de-apertura"
        index="03"
        icon={Sunrise}
        kicker="Apertura"
        title="Atracciones que abren más tarde que el parque"
      >
        <P>
          Ese sábado Phantasialand abre a las 9. Taron, F.L.Y., las dos Winja&apos;s y Raik
          funcionan a partir de las 10, y Chiapas desde las 10:15. Quien esté en el torno a las
          nueve puede elegir entre Black Mamba y Maus au Chocolat. Un plan que llena la primera hora
          con las atracciones principales no cuadra ese día.
        </P>
        <P>
          Cada atracción tiene su propia hora de apertura, y un bloque solo se puede colocar a
          partir de ella. Por la tarde falta ese límite, porque ningún feed informa de forma fiable
          de cuándo cierra una atracción; la línea de tiempo termina en la hora de cierre del
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
          Un feed de tiempos de espera da 50 minutos para Taron. Si desde Rookburgh llegas a tiempo,
          eso lo calcula el traslado. Toma la distancia entre las coordenadas de ambas atracciones,
          más tres minutos para salir de una estación y tres para embarcar y montar donde no consta
          ninguna duración.
        </P>
        <P>
          Esa distancia es en línea recta, y así se nombra. Andando es más largo, porque los caminos
          rodean el agua, las colas y los sentidos únicos y Phantasialand apila Rookburgh y Klugheim
          uno encima del otro. Por eso la cota superior se calcula a ritmo de parque en lugar de
          paso ligero, con dos tercios añadidos a la línea recta por el rodeo.
        </P>
        <Note>
          Un traslado es «justo» cuando deja de cuadrar en cuanto la previsión se equivoca tanto
          como ella misma advierte. Si la API no da dispersión, el veredicto se queda en «bien», y
          así consta en su título.
        </Note>
      </Chapter>

      <Chapter
        id="ordenar-el-dia"
        index="05"
        icon={Wand2}
        kicker="Ordenar"
        title="Los botones que ordenan el día"
      >
        <P>
          Detrás de los dos corre el mismo cálculo. «Planificar todas las atracciones estrella»
          añade las grandes del parque que aún faltan en el día y después ordena todo. «Optimizar el
          día» solo reordena lo que ya está planificado. El primero es para cuando aún faltan
          atracciones grandes; el segundo, para cuando solo quieres mejorar el orden.
        </P>
        <P>
          Se ordena según cuatro reglas, de mayor a menor prioridad. La primera es la tuya: lo que
          pones delante es lo último que se cae. Después, todo tiene que caber antes del cierre, y
          una atracción menos que seguro se hace vale más que una más que llegaría tarde. Luego
          cuenta la suma de las esperas, y a igual suma gana el orden que termina antes. No hay
          ningún control deslizante para sopesar la cola frente al rato muerto, porque para esa
          proporción no se puede justificar ningún valor.
        </P>
        <P>
          Para primera hora de la mañana no hay una regla propia, solo la curva horaria de cada
          atracción. Si está en su punto más bajo justo después de abrir, «la grande primero» sale
          del cálculo por sí solo; si es plana, sale otra cosa. En un día medido, Taron marca hora
          tras hora 60, 60, 54, 53 y 59 minutos, mientras que Chiapas sube 22.
        </P>
        <P>
          A veces la propuesta es esperar un rato en lugar de ponerse ya en la cola. Eso ocurre
          cuando la cola baja lo suficiente para que, contando la pausa, quedes libre antes que si
          te hubieras puesto de inmediato. Hacer menos cola no basta, porque el día no puede
          terminar más tarde por culpa de la pausa. Una pausa así dura como mucho dos horas, y casi
          nunca llega a ese límite, ya que una pausa solo compensa si es más corta que la cola que
          ahorra, y dos horas de pausa exigirían una cola de más de dos horas.
        </P>
        <P>
          Una pausa para comer a la una se queda a la una, y una atracción marcada se queda donde
          está; lo demás se ordena alrededor. Después del clic aparece lo que ha cambiado. «18 min
          menos de cola» es la diferencia entre dos cuentas hechas igual, una antes del clic y otra
          después. Si no hay nada que ganar, aparece que el orden ya es el bueno, y el plan se queda
          como estaba. Tras el botón de las atracciones estrella, en lugar de un ahorro aparece
          cuántas se han añadido y cuántas no encajan con el grupo, porque con las nuevas
          atracciones el día se alarga. Lo que al final ya no cabe en el día se indica después de
          cualquiera de los dos botones. «Deshacer» devuelve el estado anterior al clic mientras el
          planificador siga abierto.
        </P>
        <Note>
          Donde no llega ningún tiempo de espera, faltan los dos botones. En el Hansa-Park cada
          atracción cuesta el mismo cero supuesto, así que un orden vale tanto como otro.
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
          Para hoy la API tiene el horario del propio parque. Para cualquier otra fecha proyecta el
          último día de la semana equivalente, porque ninguna fuente publica los horarios por
          adelantado, e indica de qué fecha vienen y sobre cuántos días se apoyan. Una proyección
          lleva una tilde delante de la hora y la palabra «previsto»; un horario del parque, ninguna
          de las dos cosas.
        </P>
        <P>
          Ese sábado todos los horarios son proyecciones: los de Dragon Drago y Kroka&apos;s Lodge
          vienen del 15 de agosto, los de Miji African Dancers del 29. El último pase de
          Kroka&apos;s Lodge a las 19:00 no aparece en la línea de tiempo, porque el parque cierra a
          las 18:00 y los horarios proyectados más allá se descartan.
        </P>
      </Chapter>

      <Chapter
        id="limites"
        index="07"
        icon={HelpCircle}
        kicker="Límites"
        title="Datos que faltan y dónde se guarda el plan"
      >
        <P>
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> solo muestra sus
          tiempos de espera en su propia aplicación dentro de la wifi del parque, así que nunca nos
          llegará una cifra suya, y no nos la inventamos. La previsión del tiempo llega a unas dos
          semanas; más allá, el panel lo dice en vez de dejar un hueco que se leería como «no
          lloverá».
        </P>
        <P>
          El mismo día, una atracción puede pararse, un espectáculo cancelarse o una tormenta
          trastocar la tarde. El plan calcula si el día puede cuadrar con las esperas previstas. En
          el parque vas marcando lo que has montado, y junto a cada atracción queda anotada la
          espera que realmente había.
        </P>
        <P>
          El plan está en tu navegador y no necesitas cuenta. Solo cuando activas las notificaciones
          guardamos una copia en nuestro servidor, y se avisa en ese momento. Sin plan, empiezas por
          el asistente y sus cuatro preguntas previas: qué parque, qué día, quién viene y qué
          grandes atracciones entran en el día. El día adecuado se encuentra mejor en el{' '}
          <A href={`${PARK}/calendario-tiempos-espera`}>calendario de tiempos de espera</A> del
          parque.
        </P>
      </Chapter>
    </>
  );
}
