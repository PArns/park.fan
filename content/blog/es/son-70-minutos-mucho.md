---
title: '¿Son 70 minutos mucho? Depende de si es martes'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
updatedAt: '2026-09-25'
author: patrick
mode: published
excerpt: >-
  En la entrada de Taron hay una cifra, y sola dice tanto como una temperatura
  sin estación del año. Solo la comparación con cada martes medido la convierte
  en una respuesta. Por qué park.fan no tira nada, qué pasa de noche con los
  datos y por qué ya no recomendamos patinar sobre hielo en agosto.
tags:
  - tiempos-de-espera
  - park-fan
  - phantasialand
  - estadisticas
  - entre-bastidores
category: behind-the-scenes
parkLinks:
  # Hansa-Park gets a paragraph of its own on why its page shows no wait times at
  # all. That is exactly the question somebody on that page is asking.
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
    Un tiempo de espera sin comparación es como una temperatura sin estación.
    Qué significan «típico» y «lleno» y cómo park.fan lo convierte en una
    respuesta.
  keywords:
    - tiempos de espera parque temático
    - interpretar tiempos de espera
    - Taron tiempo de espera
    - Phantasialand tiempos de espera
    - percentil tiempo de espera
    - rope drop
    - calendario de afluencia
---

Estás delante de [Taron](ref:phantasialand/taron), el panel marca
**70 minutos**, y tu cabeza hace enseguida lo que no debe: comparar esa cifra con tu recuerdo. La última vez
fueron 40, así que hoy es peor. La anterior 90, así que hoy va genial. Dos
visitas no son una base, y además tu memoria redondea en tu contra
([aquí está el porqué](/blog/el-arte-de-esperar)).

La cifra en sí no es el problema. Los parques la anuncian, suele ser
aproximadamente correcta y nos cuesta una consulta cada cinco minutos. El
problema es que está sola, como una temperatura sin estación del año. Setenta minutos un martes de mayo son algo
completamente distinto de 70 minutos un sábado de las vacaciones de verano, y
sin la segunda mitad de esa frase no puedes hacer nada con ellos.

## Qué significan de verdad «típico» y «lleno»

park.fan pone junto a cada atracción grande de un parque dos valores de
comparación, calculados sobre los últimos 365 días. **Típico** es la mediana de
los picos diarios: en la mitad de todos los días medidos la cola más larga fue
más corta que ese valor, en la otra mitad más larga. **Lleno** es el percentil
90 de la misma serie, aproximadamente ese día de cada diez en que había de
verdad gente. En la página de la atracción aparecen los dos para el día de la
semana de hoy, con la semana entera día a día debajo.

Los dos son percentiles y no promedios. Una media se deja mover por un único día excepcional: una tarde con avería y 150 minutos de
atasco tira hacia arriba del promedio de un mes entero, aunque durante 29 días
no se notara nada. La mediana ni se inmuta ante un día así. Por eso el récord
aparece aparte, con su fecha, para que se vea sin tocar las otras dos cifras.

Para [Phantasialand](ref:phantasialand) la clasificación se ve así. La columna
de días medidos es la más importante: dice cuánto peso soporta cada fila.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

Lo que ves aquí va en directo. Si vuelves a leer este artículo dentro de tres
meses, la tabla tendrá otras cifras y el texto de alrededor seguirá siendo
válido. Para eso están estos widgets: en cuatro artículos más antiguos las
cifras estaban tecleadas a mano en tablas de Markdown, repartidas por seis
idiomas, y al cabo de unas semanas se habían separado en silencio, como los
relojes de un apartamento de vacaciones.

## El día tiene una forma

Una atracción no tiene la misma cola todo el día. El movimiento de fondo lo
conoce cualquiera: a la apertura es corta, luego el resto del mundo termina de
desayunar y al atardecer vuelve a ser llevadera. Dónde está exactamente el máximo cambia de una
atracción a otra, y esas diferencias son la parte útil.

```hourly-profile-widget slug=phantasialand top=6

```

De esa forma salen dos recomendaciones. La primera es el **rope drop**: ir
directo a una atracción concreta en la apertura, antes de que se llenen los
caminos. Solo lo proponemos si el pico de un día normal de los últimos 70 llega
al menos a 60 minutos y madrugar ahorra al menos 45 de ellos. Por debajo de eso sería un consejo válido
en cualquier sitio y por tanto inútil en todos.

La segunda es la alternativa más tranquila: la hora a la que la cola de esa
atracción suele ser más corta. Si cae por la tarde, para eso no hay que
levantarse a las siete. Ambos datos están en la página de cada atracción grande
con suficientes días medidos, con una hora concreta en hora del parque.

## Lo más importante se decide antes de salir

En una atracción para la que proponemos rope drop, la hora te ahorra al menos
tres cuartos de hora. La fecha decide el día entero. En las vacaciones de verano
de 2026 de Renania del Norte-Westfalia, el martes 18 de agosto figuraba en el
calendario del Phantasialand como «Normal» y el jueves de la misma semana como
«Muy alta» (datos de septiembre de 2026), y en un calendario corriente no se ve.
Lo que marca la diferencia: qué regiones
están de vacaciones, si hay un puente pegado, si llueve y si al otro lado de la
frontera pasa algo.

Este último punto se subestima con facilidad. Un parque cerca de la frontera
nota enseguida cuándo empiezan las vacaciones al lado, casi siempre ya por las
matrículas del aparcamiento. Así que contamos también
las regiones en un radio de unos 200 kilómetros y las marcamos aparte en el
calendario. Tres parques comparados, cada uno con su día más tranquilo:

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

Un guion en la última columna quiere decir que en ese parque ningún día de la
semana destaca de forma fiable, o que sus días se midieron de forma demasiado
desigual para compararlos. Si salen dos días, los dos son igual de tranquilos.

## Para qué hace falta un turno de noche

Mostrar un tiempo de espera en directo es una consulta. Una mediana sobre cada
martes medido es otra cosa: tiene que estar lista antes de que alguien la pida.
Así que cada noche corre una cadena de tareas, y su orden está fijado, porque
cada paso se apoya en el anterior. A las 02:00 UTC los percentiles por hora, a
las 03:00 los valores base por parque, a las 04:30 el resumen de ayer, a las
05:15 las recomendaciones de rope drop, que leen justo ese resumen, a las 05:30
«típico» y «lleno» para las atracciones grandes. A las 06:00
el modelo de previsión se reentrena con los tiempos de espera del día anterior,
mientras los del rope drop ya están en la autopista.

A eso se suma la otra mitad: no tiramos ninguna medición. Los periodos antiguos
se comprimen, no se aclaran. Hasta dónde mira atrás un análisis es otra
decisión: «típico» y «lleno» cuentan los últimos 365 días, una vuelta completa
al año, y la recomendación de rope drop solo los últimos 70, para seguir la
temporada. Quien empieza a guardar en el tercer año tiene en el tercer año un
año de historial, y los dos anteriores se han perdido para siempre. Nuestra
serie de mediciones empieza el 26 de diciembre de 2025, y la columna de días
medidos de la tabla de arriba cuenta desde ahí.

## Donde preferimos no decir nada

[Hansa-Park](ref:hansa-park), por ejemplo, publica sus tiempos de espera solo en
su propia aplicación y únicamente para dispositivos conectados a la wifi del parque. No
hay ninguna interfaz pública. En los datos en bruto este parque se ve como
cualquier otro a las tres de la madrugada: ninguna atracción informa de nada. Si
sacáramos la conclusión evidente, ahí estarían todas las atracciones del parque en «muy baja», con
una media de 0 minutos y una previsión basada en cero observaciones. El día
soñado de cualquier visitante, y totalmente inventado. En su lugar,
la página del parque lleva un aviso de que aquí no hay nada que leer. Lo que sí
podemos contar del parque está en la
[guía del Hansa-Park](/blog/hansa-park-consejos).

La misma regla en un sitio más pequeño: la pista de hielo «Berliner Eislaufen»,
en la Kaiserplatz del Phantasialand, solo existe durante el Wintertraum, esta vez
del 14 de noviembre de 2026 al 24 de enero de 2027. En agosto nadie informa de
nada sobre ella,
porque no hay nada que informar. Leer ese silencio como «abierta» sería el error
cómodo, y así llegó a figurar realmente en la página del parque: patinaje en
pleno verano, con nuestra bendición. Y los meses de funcionamiento que leemos en nuestras
propias mediciones no los nombramos hasta 330 días de observación:
antes de eso no aparece ningún mes, porque «funciona de diciembre a abril»
describiría el periodo en el que casualmente ya hemos medido.

## Dónde está todo esto

La versión larga, con las tarjetas reales para ir leyendo, es ahora una página
propia: [Así funciona park.fan](/es/como-funciona-park-fan). Ahí está, capítulo
a capítulo, qué se ve en una tarjeta de atracción, cómo funciona la escala bajo
«típico» y «lleno», cómo el calendario cuenta las vacaciones, cómo el
planificador convierte todo eso en un día y en qué tres sitios no afirmamos nada
a propósito. También hay cuatro situaciones de visita concretas, desde la
familia en las vacaciones de otoño hasta la primera vez en un parque grande,
pasando por quien tiene pase anual y se pregunta si esa tarde aún merece la pena
ir.

Y la próxima vez que estés en la entrada mirando el panel: consulta qué es
normal en esa atracción un martes.

— Patrick
