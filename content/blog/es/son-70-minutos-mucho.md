---
title: '¿Son 70 minutos mucho? Depende del día de la semana'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
author: patrick
mode: published
excerpt: >-
  En la entrada de Taron hay una cifra, y por sí sola no dice casi nada. Solo la
  comparación con cada martes medido la convierte en una respuesta. Por qué
  park.fan archiva los tiempos de espera, qué pasa con ellos de noche y dónde
  preferimos no decir nada.
tags:
  - tiempos-de-espera
  - park-fan
  - phantasialand
  - estadisticas
  - entre-bastidores
category: behind-the-scenes
parkLinks:
  # Hansa-Park gets a paragraph of its own — why its page shows no wait times at
  # all — which is exactly the question somebody on that page is asking.
  - phantasialand
  - hansa-park
rideLinks:
  - phantasialand/taron
coverImage:
  src: /media/phantasialand/taron.jpg
  alt: 'Un tren de Taron entre las rocas de basalto de Klugheim'
  caption: 'Taron en Klugheim. La cifra de la entrada marca 70. ¿Y ahora?'
  credit: 'Patrick Arns'
seo:
  title: 'Leer bien un tiempo de espera: ¿son 70 minutos mucho?'
  description: >-
    Por qué un tiempo de espera sin valor de comparación no dice nada, qué
    significan «típico» y «lleno» en una atracción y cómo park.fan convierte
    millones de mediciones en una respuesta.
  keywords:
    - tiempos de espera parque temático
    - interpretar tiempos de espera
    - Taron tiempo de espera
    - Phantasialand tiempos de espera
    - percentil tiempo de espera
    - rope drop
    - calendario de afluencia
---

Estás delante de [Taron](ref:phantasialand/taron), el panel marca **70 minutos**, y tu cabeza hace
enseguida lo que no debe: comparar esa cifra con tu recuerdo. La última vez
fueron 40, así que hoy es peor. La anterior 90, así que hoy va genial. Dos
visitas no son una base, y además tu memoria redondea en tu contra
([aquí está el porqué](/blog/el-arte-de-esperar)).

La cifra en sí no es el problema. Los parques la anuncian, suele ser
aproximadamente correcta y nos cuesta una consulta cada cinco minutos. El
problema es que está sola. Setenta minutos un martes de mayo son algo
completamente distinto de 70 minutos un sábado de las vacaciones de verano, y
sin la segunda mitad de esa frase no puedes hacer nada con ellos.

## Qué significan de verdad «típico» y «lleno»

park.fan pone junto a cada atracción dos valores de comparación. **Típico** es la
mediana de los picos diarios: en la mitad de todos los días medidos la cola más
larga fue más corta que ese valor, en la otra mitad más larga. **Lleno** es el
percentil 90 de la misma serie, aproximadamente ese día de cada diez en que
había de verdad gente.

Los dos son percentiles y no promedios, y eso no es un detalle. Una media se
deja mover por un único día excepcional: una tarde con avería y 150 minutos de
atasco tira hacia arriba del promedio de un mes entero, aunque durante 29 días
no se notara nada. La mediana no se inmuta ante un día así. Por eso el récord
aparece aparte, con su fecha, para que se vea sin tocar las otras dos cifras.

Para [Phantasialand](ref:phantasialand) la clasificación se ve así. La columna de días medidos es la
más importante: dice cuánto peso soporta cada fila.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

Lo que hay aquí es en directo. Si vuelves a leer este artículo dentro de tres
meses, la tabla tendrá otras cifras y el texto de alrededor seguirá siendo
válido. Para eso están estos widgets: en cuatro artículos más antiguos las
cifras estaban tecleadas a mano en tablas de Markdown, repartidas por seis
idiomas, y al cabo de unas semanas se habían separado en silencio.

## El día tiene una forma

Una atracción no tiene la misma cola todo el día. El movimiento de fondo lo
conoce cualquiera: a la apertura es corta, después tira hacia arriba y al
atardecer vuelve a ser llevadera. Dónde está exactamente el máximo cambia de una
atracción a otra, y esas diferencias son la parte útil.

```hourly-profile-widget slug=phantasialand top=6

```

De esa forma salen dos recomendaciones. La primera es el **rope drop**: ir
directo a una atracción concreta en la apertura, antes de que se llenen los
caminos. Solo lo proponemos si el pico del día llega al menos a 60 minutos y
madrugar ahorra al menos 45 de ellos. Por debajo de eso sería un consejo válido
en cualquier sitio y por tanto inútil en todos.

La segunda es la alternativa más tranquila de la tarde. En las grandes montañas
rusas, la última hora antes del cierre suele ser tan buena como la primera
después de abrir, y para eso no hay que levantarse a las siete. Ambos datos
están en la página de cada atracción, con una hora concreta en hora del parque.

## Lo más importante se decide antes de salir

La hora te salva media hora. La fecha te salva el día. Entre dos días de la
misma semana de vacaciones puede haber media hora de espera media de diferencia,
y en un calendario corriente no se ve. Lo que marca la diferencia: qué regiones
están de vacaciones, si hay un puente pegado, si llueve y si al otro lado de la
frontera pasa algo.

Este último punto se subestima con facilidad. Un parque cerca de la frontera
nota enseguida cuándo empiezan las vacaciones al lado, así que contamos también
las regiones en un radio de unos 200 kilómetros y las marcamos aparte en el
calendario. Tres parques comparados, cada uno con su día más tranquilo:

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

Si una celda de la última columna sale vacía, ese parque no tiene ningún día de
la semana que destaque de forma fiable sobre los demás.

## Para qué hace falta un turno de noche

Mostrar un tiempo de espera en directo es una consulta. Una mediana sobre cada
martes medido es otra cosa: tiene que estar lista antes de que alguien la pida.
Así que cada noche corre una cadena de tareas, y su orden está fijado, porque
cada paso se apoya en el anterior. A las 02:00 UTC los percentiles por hora, a
las 03:00 los valores base por parque, a las 04:30 el resumen de ayer, a las
05:15 las recomendaciones de rope drop, que leen justo ese resumen. A las 06:00
el modelo de previsión se reentrena con los tiempos de espera del día anterior.

A eso se suma la otra mitad: no tiramos nada. Los periodos antiguos se
comprimen, pero cada análisis sigue corriendo sobre todas las mediciones que han
llegado alguna vez. Un archivo que quieres crear a posteriori es justo lo único
que no se puede crear a posteriori.

## Y los sitios donde no decimos nada

Una página con todos los campos rellenos es fácil de construir. Solo se vuelve
interesante cuando se puede confiar en los campos rellenos, y para eso unos
cuantos campos tienen que poder quedarse vacíos.

[Hansa-Park](ref:hansa-park), por ejemplo, publica sus tiempos de espera solo en su propia
aplicación y únicamente para dispositivos conectados a la wifi del parque. No
hay ninguna interfaz pública. En los datos en bruto este parque se ve como
cualquier otro a las tres de la madrugada: ninguna atracción informa de nada. Si
sacáramos la conclusión evidente, ahí habría 82 atracciones en «muy baja», con
una media de 0 minutos y una previsión basada en cero observaciones. En su lugar,
la página del parque lleva un aviso de que aquí no hay nada que leer.

La misma regla en un sitio más pequeño: la pista de hielo de Phantasialand
funciona de noviembre a enero. En agosto nadie informa de nada sobre ella,
porque no hay nada que informar. Leer ese silencio como «abierta» sería el error
cómodo, y así llegó a figurar realmente en la página del parque. Y los meses de
funcionamiento de una atracción no los nombramos hasta 330 días de observación:
antes de eso no aparece ningún mes, porque «funciona de diciembre a abril»
describiría el periodo en el que casualmente ya hemos medido.

## Dónde está todo esto

La versión larga, con las tarjetas reales para ir leyendo, es ahora una página
propia: [Así funciona park.fan](/es/como-funciona-park-fan). Ahí está, capítulo
a capítulo, qué se ve en una tarjeta de atracción, cómo funciona la escala bajo
«típico» y «lleno», cómo el calendario cuenta las vacaciones y en qué tres
sitios no afirmamos nada a propósito. También hay cuatro situaciones de visita
concretas, desde la familia en las vacaciones de otoño hasta el del pase anual a
las siete de la tarde.

Y la próxima vez que estés en la entrada mirando el panel: consulta qué es
normal en esa atracción un martes. En diez segundos sabrás si toca enfadarse o
si hoy simplemente es martes.

— Patrick
