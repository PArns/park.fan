---
title: 'El planificador: calculamos si tu día en el parque sale'
translationKey: trip-planner-launch
date: '2026-09-05'
author: patrick
mode: published
featured: true
excerpt: >-
  Un feed de tiempos de espera te dice cuánta cola hay ahora. No te dice si tu
  lista llega hasta la hora de cierre. Para eso está el planificador: tus
  atracciones en una línea de tiempo, cada bloque tan alto como la espera
  prevista, y el camino entre unas y otras.
tags:
  - park-fan
  - planificador
  - tiempos-de-espera
  - consejos
  - orlando
  - entre-bastidores
category: news
parkLinks:
  # Hansa-Park tiene un párrafo propio sobre por qué el planificador no ofrece
  # botones allí. Es justo lo que se pregunta quien está en esa página de parque.
  - magic-kingdom-park
  - hansa-park
rideLinks: false
coverImage:
  src: /media/disney-hollywood-studios/fantasmic-crowd-16x9.jpg
  alt: 'Un teatro al aire libre abarrotado visto desde atrás, con el público esperando a oscuras'
  caption: 'Fantasmic en los Hollywood Studios, justo antes de empezar. Diez mil personas que durante esa media hora no hacen cola en ningún sitio.'
  credit: 'Patrick Arns'
seo:
  title: 'Un planificador para parques: cuenta las colas antes de ir'
  description: >-
    El nuevo planificador de park.fan pone tus atracciones en una línea de
    tiempo, calcula con las esperas previstas y conoce la hora de apertura de
    cada atracción y las distancias entre ellas. Sin cuenta, todo en tu
    navegador.
  keywords:
    - planificar un día de parque
    - planificador parque de atracciones
    - planificar tiempos de espera
    - Magic Kingdom planificar el día
    - Orlando organizar el día
    - orden de las atracciones
    - rope drop
---

El plan que llevas en la cabeza aguanta hasta las dos de la tarde más o menos.
Para entonces has hecho tres atracciones de ocho, estás en la cola equivocada y
sabes que ya no sale. El número sobre la entrada ha sido correcto todo el rato.
Lo es casi siempre. Solo que no dice nada sobre si el resto de tu lista va a
ocurrir hoy.

En un parque compacto eso te cuesta una atracción, y la haces la próxima vez. En
un parque que abre a las ocho de la mañana y no cierra hasta las once de la
noche, que tiene una docena de atracciones donde una hora de cola no llama la
atención, y donde dos de ellas están a diez minutos andando, te cuesta la mitad
de la lista. Quien haya pasado un día en Orlando sin un orden conoce el final:
mucho andar, poco montar, y por la noche la mitad sin tachar. No porque hubiera
demasiada gente, sino porque el orden estaba mal.

Ese hueco es el que tenía park.fan. «Cuánta cola hay ahora» lo respondemos desde
el primer día. «¿Es mucho para un martes?» desde
[el verano pasado](/blog/son-70-minutos-mucho). La tercera pregunta no estaba en
ninguna parte: ¿mi día sale así?

Desde esta semana está. El [planificador](/planificador) pone tus atracciones en
una línea de tiempo y calcula el día antes de que salgas de casa.

## Un día es un orden, y ese orden lleva reloj

La idea se cuenta rápido. Un bloque es una atracción, y su altura es la espera
prevista para esa hora. Arrástralo a una hora más llena y crece. Arrástralo a
una más tranquila y encoge. El día en sí no se alarga ni se acorta, se desplaza,
y eso se ve.

Entre dos bloques está el traslado: cuánto hay y si el tiempo alcanza. El camino
para salir de la estación y la propia vuelta están en ese hueco y no en el
bloque, porque pertenecen al desplazamiento y no a la cola.

Suena a detalle, y cambia cómo se mira un día de parque. Una lista de ocho
atracciones no dice nada sobre si ese día caben ocho. Ocho bloques en una línea
de tiempo que termina a las once de la noche lo dicen enseguida.

![El planificador con un día preparado en Magic Kingdom: diez bloques en una línea de tiempo desde las 8, con los traslados entre ellos y su distancia y tiempo a pie. | Diez atracciones un sábado de septiembre, puestas en este orden por el propio planificador.](/media/tagesplaner/planer-tag-es.webp)

Diez atracciones, de la apertura a las cuatro de la tarde, y bajo el plan está
la suma: cinco horas y cuarto solo de cola. Es la versión que el optimizador
consideró mejor. Sin orden esperas lo mismo y montas menos.

## Entre dos atracciones hay un camino

Un feed de tiempos de espera puede decir que una atracción marca cincuenta
minutos. Lo que no puede decir es que desde donde estás ya no llegas a tiempo.
Para eso está el traslado.

El cálculo parte de la distancia entre las coordenadas de las dos atracciones,
más tres minutos para salir de la estación y tres para embarcar y dar la vuelta
donde no hay duración registrada. La distancia es en línea recta, y el
planificador lo dice. Es una cota inferior y no un tiempo a pie: los caminos
rodean el agua, las colas y los sentidos únicos, algunos parques apilan sus
zonas, y en uno grande la línea recta suele cruzar un lago que hay que bordear.
Para la cota superior el planificador calcula con ritmo de parque en lugar de
ritmo de paseo y añade dos tercios de rodeo a la línea recta.

En un parque compacto un traslado torpe cuesta tres minutos y no lo nota nadie.
En uno grande cuesta un cuarto de hora. Hazlo ocho veces al día y habrás andado
dos horas que no aparecen en ninguna estadística de espera.

Cuando en el traslado pone «justo», no significa que se vea ajustado. Significa
que ese traslado deja de salir si la previsión se equivoca tanto como ella misma
admite. La API conoce ese margen para cada atracción, y aquí es donde la
dispersión se convierte en algo con lo que decidir.

## «Llegar pronto» no vale para todas las atracciones

El consejo que se lee en todas partes va así: la atracción grande primero, justo
después de abrir. A veces acierta. Muchas veces no, y cuál de las dos cosas pasa
solo se ve mirando las horas una a una.
[Magic Kingdom](ref:magic-kingdom-park) sirve bien para esto, porque su día es
lo bastante largo como para que las curvas se separen mucho.

```hourly-profile-widget slug=magic-kingdom-park top=8

```

Ahí hay tres patrones, y cada uno pide una respuesta distinta.
[TRON](ref:magic-kingdom-park/tron-lightcycle-run) es caro todo el día y se pone
más caro hacia la noche. Ir pronto aquí no está mal nunca, pero tampoco lo
abarata: sigue siendo la cola más larga del día.
[Jungle Cruise](ref:magic-kingdom-park/jingle-cruise) va al revés y se desploma
a última hora, así que ponerse por la tarde cuesta varias veces la misma vuelta.
Y [Big Thunder](ref:magic-kingdom-park/big-thunder-mountain-railroad) está
durante horas prácticamente al mismo precio, y por eso sirve de relleno para los
huecos que dejan las otras dos.

Una regla general no puede dar esas tres respuestas, porque trata igual a las
tres atracciones. Por eso en el planificador no hay ninguna regla de rope drop;
el código ni siquiera conoce el término.

```glossary-widget slug=rope-drop

```

Lo que sí conoce es la curva horaria de cada atracción. Donde esa curva está más
baja justo después de abrir, «la grande primero» sale sola. Donde es plana, sale
otra cosa, y ahí esa es la respuesta correcta.

Otra cosa que casi nadie calcula de cabeza: la primera hora muchas veces no es
tuya. Bastantes parques abren las puertas antes de que funcione una parte de las
atracciones, y las estrella suelen estar entre las que arrancan más tarde. Si
llenas esa primera hora con ellas, has planificado una hora que no existe. El
planificador conoce la hora de apertura de cada atracción y no deja que ningún
bloque se cuele antes. No hay equivalente en el otro sentido: ningún feed avisa
de forma fiable de cuándo cierra una atracción por la noche, así que tampoco se
dice nada al respecto.

## Dos botones ordenan el día

Bajo la línea de tiempo hay dos botones. «Planificar todas las atracciones
estrella» añade las grandes del parque que aún no están en el día y luego ordena
todo. «Optimizar el día» no añade nada y solo reordena lo que ya hay. Detrás de
los dos corre el mismo cálculo. Son dos botones porque son dos preguntas:
lléname el día, y si el orden puede ser mejor.

Se ordena según tres cosas, y su jerarquía es la decisión de verdad.

1. **Todo tiene que caber antes del cierre.** Un plan con una atracción menos
   que ocurre de verdad gana a uno con una más que ya no llega. Y si algo se
   cae, se cae por detrás: primero lo que el botón acaba de añadir, nunca lo que
   habías pensado tú.
2. **La suma de las esperas.** Que era lo que se preguntaba.
3. **La hora a la que te pones en la última cola.** A igual coste, gana el orden
   que termina antes.

En un parque con más atracciones estrella de las que caben en un día, el punto
uno es todo el juego. Por eso el botón no siempre desaparece tras pulsarlo: si
queda una atracción sin sitio, debajo pone cuántas son, y la oferta sigue ahí
por si quitas otra cosa.

No hay, a propósito, ningún control deslizante que compense hacer cola contra
estar parado. Ese número no lo podría justificar nadie, y la primera persona que
lo discutiera tendría razón.

Una consecuencia me gusta especialmente, porque no la programó nadie: el
planificador te manda a veces a tomar un café. Si ahora tuvieras que esperar
cincuenta minutos pero media hora después solo quince, entonces pasear y esperar
juntos cuestan menos que esperar solo. La misma atracción, menos cola, y aun así
quedas libre antes.

Lo que el optimizador no toca: tu rato para comer, cualquier atracción que ya
hayas marcado, y cualquier bloque cuya hora ya haya empezado. Ese último punto
nos ocupó un tiempo, porque es la diferencia entre «te reordeno la tarde» y
«vuelve al final de la cola, por favor». Quien pulsa a las dos está a las dos en
alguna cola, y esa ya no la mueve nadie.

Y como una pulsación puede convertir tres bloques en once, junto al resultado
hay un deshacer. Una vez, no ilimitadas, pero esa vez que hace falta.

## Lo que el planificador no sabe, lo dice

El trabajo más largo en una cosa así son los cuatro sitios donde afirma a
propósito menos de lo que podría.

**La previsión se equivoca, y de forma medible.** En cada bloque seleccionado
pone cuánto se apartaron de media las previsiones de esa atracción de lo que el
día trajo realmente. «Típico» significa literalmente lo que dice: la mitad de
los días caen más lejos. Por eso el número está ahí como error típico y nunca
como un margen que ya contuviera la respuesta correcta.

**Los horarios de espectáculo son dos cosas.** Lo que el parque ha publicado
para hoy es un anuncio. Lo que hemos proyectado desde el último día de la semana
equivalente es una suposición, y el planificador la dibuja más suave: con una
tilde delante de la hora, línea de puntos y la fecha de la que salen los
horarios. Nadie en el mundo conoce los horarios del sábado de dentro de dos
semanas.

**Hay parques que no podemos medir.** [Hansa-Park](ref:hansa-park) publica sus
tiempos de espera solo en su propia aplicación, en el wifi del parque. Hasta
nosotros no llega nunca ninguna cifra. En los datos, un parque sin fuente se ve
exactamente igual que un parque cerrado por la noche, así que el planificador
saca ese dato directamente de la API y allí oculta los dos botones de ordenar.
Si cada atracción cuesta la misma cifra inventada, todos los órdenes valen igual,
y un botón que no cambia nada sería una promesa.

**Un día pasado se queda.** El calendario te deja volver a abrir un día en el
que habías planificado algo, y allí los botones automáticos ya no están. Todo lo
manual sigue: mover, marcar, borrar. Un día vivido es un registro, y que a la
una estuvieras de verdad en esa cola es la razón por la que se guarda.

## Vive en tu navegador

No hay cuenta, ni registro, ni inicio de sesión. Tu plan está en tu navegador, y
eso es lo predeterminado, no la versión recortada. Si limpias los datos del
navegador, desaparece. Si abres park.fan en el móvil, es otro plan.

La única excepción son las notificaciones push. Para poder avisarte de que toca
salir, el plan tiene que estar en nuestro servidor, y el planificador escribe qué
significa eso: quien tenga el enlace puede leerlo y cambiarlo. No hay ninguna
contraseña delante. Quien no lo quiera, deja las notificaciones apagadas y no
pierde nada más.

Dos cosas más que se pasan por alto fácilmente. En el borde de la
pantalla cuelga en cada página una pestaña que abre el planificador, incluso sin
nada planificado. Y en el ordenador puedes abrir una segunda columna, y entonces
hay dos días a la vez. Lo construí por una sola frase: «y el sábado, ¿cómo
quedaría?».

## Cómo empezar

La entrada pasa por tres preguntas. A qué parque, qué día y quién viene.

La primera es un buscador, y detrás hay una pequeñez que se tuerce enseguida.
Escribe «Disneyland» y salen cinco parques en tres continentes que se llaman
todos así.

![Primer paso del asistente: «Disneyland» escrito en el buscador y, debajo, cinco parques de cinco países. | Un nombre, cinco parques. Por eso el planificador se queda con la ruta de la API y no con el nombre.](/media/tagesplaner/planer-wizard-park-es.webp)

Un plan se guarda bajo la ruta que devuelve la propia API, nunca bajo una que
montemos con el nombre visible. «Países Bajos» no se escribe igual en todos los
idiomas, y una ruta adivinada es un plan que apunta a un 404.

La segunda pregunta es la interesante: en lugar de una lista desplegable de
sesenta filas tienes un mes entero, y cada día lleva la afluencia prevista de ese
parque. «El sábado de dentro de dos semanas» pasa a ser cosa de un vistazo, y lo
demás que sabemos de él está bajo la rejilla.

![Segundo paso del asistente: una foto del Disneyland Park de Anaheim sobre una rejilla mensual donde cada día lleva la afluencia prevista, con el sábado 19 seleccionado. | Un septiembre que en Anaheim se prevé tranquilo de principio a fin. Sesenta filas de una lista desplegable no enseñan eso.](/media/tagesplaner/planer-wizard-tag-es.webp)

La tercera pregunta suena a formulario y pesa más de lo que parece: reservar un
rato para comer, si vienen niños, si queréis no mojaros. Las tres son marcas en
la lista de atracciones y no filtros, y el planificador lo pone en la tarjeta:
las atracciones con estatura mínima más alta se marcan, no se ocultan. Un filtro
recortaría el parque a escondidas, y si la abuela sujeta las mochilas solo lo
sabes tú.

![Tercer paso del asistente: tres tarjetas para la comida, los niños y las atracciones de agua, con el botón para abrir el plan debajo. | Tres respuestas que no recortan el parque. El rato para comer entra como bloque a las 12:30 y se puede mover.](/media/tagesplaner/planer-wizard-wer-es.webp)

Después aterrizas en la página del parque con el planificador abierto, y desde
ahí arrastras atracciones a la línea de tiempo. Cada página de atracción tiene
también un botón para eso, cuando arrastrar resulta incómodo.

Cómo llega un bloque a su altura, qué significa «De la previsión del día» y cómo
se calcula un traslado está en la propia
[página del planificador](/planificador), con una respuesta real y congelada de
la API con la que puedes trastear. Allí no se toca nada de tu propio plan.

Y si algo te chirría por el camino, un tiempo a pie que no cuadra o un traslado
que en la vida real no habría salido nunca: escríbeme, la dirección está en el
[aviso legal](/impressum). Los caminos son la parte que peor medimos, y quien
está allí en ese momento lo sabe mejor que cualquier cálculo.

— Patrick
