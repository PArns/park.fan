---
title: 'Single rider: en qué parques subes antes yendo solo'
translationKey: single-rider-guide
date: '2026-10-08'
author: patrick
mode: published
featured: false
excerpt: >-
  En 18 de los 203 parques cuyos tiempos de espera medimos, nuestra API recoge
  al menos una atracción con cola single rider, 66 en total. Quien va solo o
  acepta separarse del grupo ocupa asientos vacíos y suele esperar menos. Para
  familias con niños pequeños no compensa.
tags:
  - single-rider
  - tiempos-de-espera
  - colas
  - consejos
  - parque-atracciones
  - europa-park
  - efteling
  - disney
  - universal
category: guides
coverImage:
  src: /media/europa-park/voltron-nevera-powered-by-rimac.jpg
  alt: 'Un tren de Voltron Nevera pasa boca abajo por una inversión, iluminado en rosa y azul.'
  caption: 'Voltron Nevera, en el Europa-Park, tiene entrada single rider propia.'
  credit: 'Patrick Arns'
seo:
  title: 'Single rider en parques: qué atracciones y para quién'
  description: >-
    Qué atracciones de 18 parques tienen cola single rider, cómo funciona y
    cuándo no compensa.
  keywords:
    - single rider parque de atracciones
    - single rider Europa-Park
    - single rider Efteling
    - cola para una persona parque de atracciones
    - single rider Disney
    - single rider Universal Orlando
    - cola single rider
    - ahorrar tiempo de espera parque de atracciones
---

Single rider significa que te pones en una cola propia y ocupas un asiento que ha quedado libre en el
vehículo, junto a desconocidos. A cambio, sueles esperar menos que en la cola normal. El Efteling
explica en su web que los single riders rellenan los huecos que quedan en los vehículos.

Nuestra API registra esta cola como un tipo propio, `SINGLE_RIDER`, y conoce 66 atracciones de 18
parques que la tienen. Este artículo enumera cuáles son, qué escriben los propios parques sobre las
normas y a quién le compensa entrar por la vía single rider. Cuánto tiempo se ahorra, solo podemos
responderlo en parte; los motivos están más abajo.

## Cómo funciona una entrada single rider

Un tren tiene grupos de asientos fijos, y no todos los grupos de la cola normal los llenan. Cuando
queda un sitio libre, el parque sienta ahí a una persona de la cola single rider. La atracción va más
llena, y los grupos de la cola normal no pierden nada, porque nadie de su fila pasa por delante. El
Efteling escribe que esto acorta la espera tanto de los grupos como de los individuales.

De ahí se deduce qué puedes esperar. La cola single rider solo avanza tan rápido como aparecen
huecos. Sobre el papel es más corta; si lo es en tu hora depende de los huecos que dejen los grupos
que van delante. El Efteling lo dice así: los individuales suelen esperar menos, pero cuánto depende
del número de visitantes y de las plazas libres.

Tres normas se repiten en todos los parques cuya web pudimos leer:

1. **No eliges tu asiento.** El Efteling asigna un sitio, compartido con otros visitantes. Walt Disney
   World no garantiza ni el acceso inmediato ni la elección del asiento.
2. **Los requisitos de acceso valen como en cualquier sitio.** Walt Disney World y el Disneyland
   Resort escriben que los single riders deben cumplir todos los requisitos de la atracción. El
   Efteling deja entrar solos a los niños por la entrada single rider si cumplen la altura y los demás
   requisitos de la atracción.
3. **La cola puede estar cerrada.** El Efteling lo dice expresamente: en días tranquilos puede
   permanecer cerrada. Walt Disney World escribe que el servicio depende de la disponibilidad.

```glossary-widget slug=single-rider

```

## Para quién compensa y cuándo no

La entrada single rider compensa en tres casos: vas solo al parque, tu grupo puede separarse, o
quieres sí o sí una atracción concreta y la espera normal se te hace demasiado larga. En el segundo
caso os repartís, cada uno monta por su lado y os encontráis en la salida.

No compensa en estos casos:

- **Vas con un niño que necesita acompañante.** En Eurosat, en el Europa-Park, la web del parque
  indica de 120 a 195 centímetros, y por debajo de 130 solo con un adulto. Quien necesita al niño a su
  lado no puede subir por separado.
- **Queréis montar juntos.** El Efteling permite a los grupos usar la entrada single rider, pero
  montan uno detrás de otro. Solo si por casualidad quedan varios sitios libres juntos se sientan
  una al lado de otra las personas de la cola single rider.
- **La atracción cuenta algo que queréis vivir juntos.** En Symbolica, en el Efteling, como single
  rider no puedes elegir cuál de las tres visitas guiadas al palacio te toca.
- **La cola normal ya es corta.** Entonces desaparece la ventaja y el grupo se separa sin motivo.

## Qué sabe nuestra información de la cola

Hay dos preguntas, y nuestros datos solo responden bien a una.

**¿Tiene la atracción cola single rider?** Está en el campo `hasSingleRider` de cada atracción, un
dato fijo. En la página de la atracción, park.fan muestra por eso un distintivo «Single Rider». El
valor `null` significa «desconocido» y nunca «no». La ausencia del distintivo no dice, por tanto,
nada sobre si existe la cola.

**¿Qué longitud tiene ahora mismo?** Aquí suele faltar la cifra. El 8 de octubre de 2026 consultamos
los datos en vivo de los 18 parques. Contenían 41 colas single rider en doce parques, 19 de ellas abiertas, en siete
parques. Ninguna de las 41 traía tiempo de espera. Los parques nos comunican que la cola está
abierta, pero no su longitud. En la página de la atracción, park.fan muestra entonces «Single Rider»
sin tiempo, y las tablas de este artículo muestran la cola normal.

Cuánto tiempo ahorra la entrada no se puede calcular por ahora con nuestros datos. Solo está
respaldada la afirmación del Efteling de que los individuales suelen esperar menos. El resultado de
una medición propia no lo damos mientras no exista.

## Parque por parque: cuántas atracciones conocemos

La tabla indica cuántas atracciones de cada parque tienen esta característica, cuántas atracciones
tiene el parque en nuestra base de datos y en cuántas falta el dato. Datos del 8 de octubre de 2026.

| Parque                         | Atracciones con single rider | Atracciones | Dato desconocido |
| ------------------------------ | ---------------------------- | ----------- | ---------------- |
| Efteling                       | 7                            | 37          | 30               |
| Disney Adventure World         | 7                            | 14          | 7                |
| Europa-Park                    | 6                            | 97          | 1                |
| Universal Epic Universe        | 6                            | 14          | 8                |
| Universal Islands of Adventure | 5                            | 25          | 20               |
| PortAventura Park              | 4                            | 51          | 45               |
| Alton Towers                   | 4                            | 55          | 48               |
| Disney California Adventure    | 4                            | 29          | 25               |
| Disney’s Hollywood Studios     | 3                            | 11          | 8                |
| Universal Studios Florida      | 3                            | 44          | 41               |
| Phantasialand                  | 3                            | 40          | 0                |
| Hong Kong Disneyland           | 3                            | 47          | 44               |
| Disneyland Park (Anaheim)      | 2                            | 56          | 54               |
| Disneyland Park (París)        | 2                            | 43          | 41               |
| Shanghai Disneyland            | 2                            | 37          | 35               |
| EPCOT                          | 2                            | 34          | 32               |
| Thorpe Park                    | 2                            | 45          | 38               |
| Disney’s Animal Kingdom        | 1                            | 17          | 16               |

Dos parques destacan. En el Europa-Park y en el Phantasialand el dato está registrado para casi todas
las atracciones: falta en una y en ninguna. Allí, «no aparece en la lista» significa de verdad «no
tiene cola single rider». En todos los demás, la lista es un mínimo: en el Disneyland Park de París
falta el dato en 41 de 43 atracciones, y en el Disneyland Park de Anaheim en 54 de 56.

Los otros 185 de los 203 parques no tienen ni una atracción con esta característica. Si eso es un
«no» o un hueco, allí no lo sabemos.

## Europa-Park

En el [Europa-Park](ref:europa-park) seis atracciones tienen la característica: ARTHUR, en la zona
temática Minimoys Kingdom; WODAN – Timburcoaster y blue fire Megacoaster, en Islandia; Eurosat –
CanCan Coaster, en Francia; el Voletarium, en Alemania; y Voltron Nevera powered by Rimac, en
Croacia.

Dos de ellas las confirma el propio parque. En la página de
[Voltron Nevera](ref:europa-park/voltron-nevera-powered-by-rimac) figura entre las características
el single rider como cola especial para personas individuales, y lo mismo en la de
[Eurosat – CanCan Coaster](ref:europa-park/eurosat-cancan-coaster). Voltron Nevera admite pasajeros
desde 130 centímetros y un tren tiene capacidad para 16 personas. En Eurosat el límite va de 120 a
195 centímetros y desde los seis años; por debajo de los ocho solo sube quien lleva un adulto.

Las seis atracciones tienen una altura mínima de 120 o 130 centímetros, según los datos de nuestra
base de datos. La entrada single rider ayuda por eso sobre todo a adolescentes y adultos que van
solos o en un grupo sin niños pequeños. Cómo organizar con sentido el día en el parque lo cuenta la
[guía del Europa-Park](/blog/europa-park-tiempos-de-espera-consejos).

```ride-waits-widget rides=europa-park/voltron-nevera-powered-by-rimac|Voltron Nevera;europa-park/blue-fire-megacoaster|blue fire;europa-park/wodan-timburcoaster|WODAN;europa-park/eurosat-cancan-coaster|Eurosat;europa-park/voletarium|Voletarium;europa-park/arthur|ARTHUR columns=land,peak

```

En la tabla aparece la cola normal, ordenada como las atracciones de arriba. Cuándo se llena lo muestra
la distribución a lo largo del día:

```hourly-profile-widget slug=europa-park top=6

```

## Efteling

El [Efteling](ref:efteling) tiene la descripción oficial más completa que hemos encontrado. La página
sobre la entrada single rider enumera seis atracciones: Danse Macabre, Joris en de Draak, Symbolica,
Baron 1898, Max & Moritz y Python. Cada una tiene dos colas, una para grupos y familias y otra para
individuales. Nuestros datos añaden De Vliegende Hollander, que la página del parque no enumera.

La página explica también qué le falta al single rider: elegir el asiento y, en Symbolica, escoger una
de las tres visitas guiadas al palacio. Los grupos pueden usar la entrada, pero montan uno detrás de
otro, y los niños pueden entrar solos si cumplen los requisitos de la atracción. La página no
indica esos requisitos, que varían según la atracción. Según los datos de nuestra base de datos, la
altura mínima es de 90 centímetros en Max & Moritz, de 110 en Joris en de Draak, de 120 en Python,
De Vliegende Hollander y Danse Macabre, y de 132 en Baron 1898. Symbolica no tiene dato.

![Python de noche, iluminada en violeta|Python, en el Efteling, una de las atracciones con entrada single rider.|wide](/media/efteling/python.jpg)

```ride-waits-widget rides=efteling/baron-1898|Baron 1898;efteling/python|Python;efteling/joris-en-de-draak|Joris en de Draak;efteling/symbolica|Symbolica;efteling/danse-macabre|Danse Macabre;efteling/max-and-moritz|Max & Moritz;efteling/de-vliegende-hollander|De Vliegende Hollander columns=land,peak

```

## Phantasialand

En el [Phantasialand](ref:phantasialand) tres atracciones tienen la característica:
[Taron](ref:phantasialand/taron) y [Raik](ref:phantasialand/raik), en la zona temática Mystery, y
[Chiapas – DIE Wasserbahn](ref:phantasialand/chiapas-die-wasserbahn), en Mexico. No pudimos
consultar ninguna página del parque que lo confirme.

Junto al Europa-Park, el Phantasialand es el parque donde el dato está registrado para todas las
atracciones: de 40 atracciones, no falta en ninguna. Las tres atracciones son, pues, la lista
completa. La altura mínima es de 140 centímetros en Taron, de 130 en Chiapas y de 120 en Raik.

```ride-waits-widget rides=phantasialand/taron|Taron;phantasialand/raik|Raik;phantasialand/chiapas-die-wasserbahn|Chiapas columns=land,peak

```

## Disneyland Paris

El resort tiene dos parques, y las atracciones con entrada single rider se reparten de forma desigual.
En [Disney Adventure World](ref:disney-adventure-world) son siete: Spider-Man W.E.B. Adventure y
Avengers Assemble: Flight Force, en el Marvel Avengers Campus; Frozen Ever After, en la World of
Frozen; Ratatouille: L’Aventure Totalement Toquée de Rémy, en el Toon Studio; y, también en el Toon
Studio, Crush’s Coaster, RC Racer y Toy Soldiers Parachute Drop. Son siete de 14 atracciones, la
proporción más alta de todos los parques de la tabla.

En el [Disneyland Park](ref:/parks/europe/france/paris/disneyland-park) son dos: Star Wars Hyperspace
Mountain, en Discoveryland, e Indiana Jones and the Temple of Peril, en Adventureland. No pudimos
consultar ninguna página de Disneyland Paris sobre el servicio single rider.

```ride-waits-widget rides=disney-adventure-world/frozen-ever-after|Frozen Ever After;disney-adventure-world/spider-man-web-adventure|Spider-Man W.E.B. Adventure;disney-adventure-world/crushs-coaster|Crush’s Coaster;disney-adventure-world/rc-racer|RC Racer;/parks/europe/france/paris/disneyland-park/star-wars-hyperspace-mountain|Star Wars Hyperspace Mountain;/parks/europe/france/paris/disneyland-park/indiana-jones-and-the-temple-of-peril|Indiana Jones and the Temple of Peril columns=park,peak

```

## Alton Towers y Thorpe Park

En [Alton Towers](ref:alton-towers) son cuatro atracciones de la zona Thrills: TH13TEEN, Spinball
Whizzer, The Smiler y Galactica. En [Thorpe Park](ref:thorpe-park) son dos, ambas de la zona
Coasters: SAW – The Ride e Hyperia. En los dos parques falta el dato de la mayoría de las
atracciones: en Alton Towers, de 48 de 55 atracciones, y en Thorpe Park, de 38 de 45. La altura
mínima es de 120 centímetros en TH13TEEN y Spinball Whizzer, de 130 en Hyperia y de 140 en The Smiler,
Galactica y SAW. No hemos leído ninguna página de los parques que confirme la lista.

```ride-waits-widget rides=alton-towers/the-smiler|The Smiler;alton-towers/galactica|Galactica;alton-towers/th13teen|TH13TEEN;alton-towers/spinball-whizzer|Spinball Whizzer;thorpe-park/hyperia|Hyperia;thorpe-park/saw-the-ride|SAW – The Ride columns=park,peak

```

## PortAventura

En el [PortAventura Park](ref:portaventura-park) conocemos cuatro atracciones: Hurakan Condor, Furius
Baco, Shambhala y Dragon Khan. En 45 de las 51 atracciones falta el dato, así que la lista es aquí
especialmente corta frente a lo que no sabemos.

```ride-waits-widget rides=portaventura-park/shambhala|Shambhala;portaventura-park/dragon-khan|Dragon Khan;portaventura-park/furius-baco|Furius Baco;portaventura-park/hurakan-condor|Hurakan Condor columns=peak

```

## Walt Disney World

Walt Disney World enumera en la página del servicio single rider cinco atracciones: Millennium Falcon:
Smugglers Run, Star Wars: Rise of the Resistance y Rock ’n’ Roller Coaster Starring The Muppets, en
Disney’s Hollywood Studios, y Remy’s Ratatouille Adventure y Test Track, en EPCOT. A ellas se suma
Expedition Everest, en Disney’s Animal Kingdom, que no figura en la lista del parque.

Las normas están en la misma página. El servicio permite a los grupos separarse y subir por
separado. El acceso inmediato y la elección del asiento no están garantizados, puede que no se
atiendan peticiones especiales de asiento, y las atracciones participantes y los tiempos de espera
pueden cambiar.

Las tres colas single rider de Disney’s Hollywood Studios figuraban el 8 de octubre de 2026 como
«abiertas», sin tiempo de espera. Es así en las 19 colas single rider abiertas de nuestros datos en
vivo, también en Universal.

```ride-waits-widget rides=disneys-hollywood-studios/star-wars-rise-of-the-resistance|Rise of the Resistance;disneys-hollywood-studios/millennium-falcon-smugglers-run|Smugglers Run;disneys-hollywood-studios/rock-n-roller-coaster-starring-aerosmith|Rock ’n’ Roller Coaster;epcot/test-track|Test Track;epcot/remys-ratatouille-adventure|Remy’s Ratatouille Adventure;disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain|Expedition Everest columns=park,peak

```

## Disneyland Resort en California

El resort de Anaheim enumera en su página once atracciones. En el Disneyland Park son Millennium
Falcon: Smugglers Run, Matterhorn Bobsleds, Space Mountain, Tiana’s Bayou Adventure e Indiana Jones
Adventure. En el Disney California Adventure Park son Goofy’s Sky School, Incredicoaster, Radiator
Springs Racers, Grizzly River Run, WEB SLINGERS y Soarin’ Over California.

Nosotros tenemos seis en total: Millennium Falcon y Tiana’s Bayou Adventure en el
[Disneyland Park](ref:/parks/north-america/united-states/anaheim/disneyland-park), e Incredicoaster,
Radiator Springs Racers, WEB SLINGERS y Silly Symphony Swings en el
[Disney California Adventure Park](ref:disney-california-adventure-park). Seis atracciones de la
lista del resort faltan en nuestros datos, y las Silly Symphony Swings no figuran en la lista.

El parque escribe que los Cast Members te dirigen a la cola prevista y que allí tu grupo se separa
para llenar las plazas que los visitantes de la cola normal no ocupan.

```ride-waits-widget rides=/parks/north-america/united-states/anaheim/disneyland-park/millennium-falcon-smugglers-run|Millennium Falcon;/parks/north-america/united-states/anaheim/disneyland-park/tianas-bayou-adventure|Tiana’s Bayou Adventure;disney-california-adventure-park/radiator-springs-racers|Radiator Springs Racers;disney-california-adventure-park/incredicoaster|Incredicoaster;disney-california-adventure-park/web-slingers-a-spider-man-adventure|WEB SLINGERS columns=park,peak

```

## Universal Orlando

Universal Orlando tiene 14 atracciones en tres parques, y Walt Disney World, seis en tres parques. En
[Universal Studios Florida](ref:universal-studios-florida) son Revenge of the Mummy, MEN IN BLACK
Alien Attack y Harry Potter and the Escape from Gringotts. En
[Islands of Adventure](ref:universal-islands-of-adventure) son cinco: Harry Potter and the Forbidden
Journey, Hagrid’s Magical Creatures Motorbike Adventure, The Incredible Hulk Coaster, Doctor Doom’s
Fearfall y The Amazing Adventures of Spider-Man. En [Epic Universe](ref:universal-epic-universe) son
seis de 14 atracciones, entre ellas Stardust Racers, Mine-Cart Madness y Mario Kart: Bowser’s
Challenge.

No pudimos consultar ninguna página de Universal que lo confirme. Los datos proceden de los nuestros
y son una pista, no una promesa. En Epic Universe falta el dato en 8 de 14 atracciones, y en Islands
of Adventure en 20 de 25.

```ride-waits-widget rides=universal-islands-of-adventure/harry-potter-and-the-forbidden-journey|Forbidden Journey;universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure|Hagrid’s Motorbike Adventure;universal-islands-of-adventure/the-incredible-hulk-coaster|Incredible Hulk Coaster;universal-studios-florida/harry-potter-and-the-escape-from-gringotts|Escape from Gringotts;universal-studios-florida/revenge-of-the-mummy|Revenge of the Mummy;universal-epic-universe/stardust-racers|Stardust Racers;universal-epic-universe/mario-kart-bowsers-challenge|Mario Kart columns=park,peak

```

## Shanghai Disneyland y Hong Kong Disneyland

Los dos parques Disney asiáticos tienen dos y tres atracciones. En
[Shanghai Disneyland](ref:shanghai-disneyland) son Zootopia: Hot Pursuit y Seven Dwarfs Mine Train;
en [Hong Kong Disneyland](ref:hong-kong-disneyland-park), Hyperspace Mountain, Big Grizzly Mountain
Runaway Mine Cars y Toy Soldier Parachute Drop. También aquí falta el dato casi en todas partes: en
35 de 37 atracciones en Shanghái y en 44 de 47 en Hong Kong.

## Cómo planear un día con single rider

**Elige antes dos o tres atracciones.** En la página del parque de park.fan ves qué atracciones llevan
el distintivo. La entrada vale más en la atracción cuya cola normal es la más larga.

**Comprueba si la cola está abierta antes de separaros.** En la página de la atracción aparece el
distintivo «Single Rider» con el estado de la cola. Puede estar cerrada sin que la atracción lo esté.

**Repartíos si compensa.** Para dos adultos, lo más rápido es que uno haga la cola normal y el otro
entre por la single rider. Quien monta primero espera en la salida.

Cómo se siente la espera y por qué avanzar puestos en la cola no sirve de nada lo cuenta el artículo
[El arte de esperar](/blog/el-arte-de-esperar).

## Preguntas frecuentes sobre single rider

### ¿Qué significa single rider en un parque de atracciones?

Single rider es una cola propia para personas individuales. Quien la usa ocupa los asientos que quedan
libres en un vehículo y se sienta junto a desconocidos. El Efteling lo describe así: los single
riders rellenan los huecos que quedan en los vehículos.

### ¿La cola single rider es siempre más corta?

No. El Efteling escribe que los individuales suelen esperar menos, pero que eso depende del número de
visitantes y de las plazas libres. En días tranquilos la cola puede estar cerrada del todo.

### ¿Puedo usar single rider con la familia?

Solo si todos están dispuestos a montar por separado. El Efteling permite a los grupos usar la entrada
single rider, pero montan uno detrás de otro. Un niño que necesita acompañante tiene que sentarse
junto al adulto, así que la entrada single rider queda descartada.

### ¿Qué atracciones del Europa-Park tienen single rider?

Seis: ARTHUR, WODAN, blue fire, Eurosat, el Voletarium y Voltron Nevera. El parque lo indica
expresamente en las páginas de Voltron Nevera y de Eurosat.

### ¿Qué atracciones del Efteling tienen single rider?

La página del parque cita Danse Macabre, Joris en de Draak, Symbolica, Baron 1898, Max & Moritz y
Python. En nuestros datos figura además De Vliegende Hollander.

### ¿Dónde veo si una atracción tiene single rider?

En la página de la atracción en park.fan, por el distintivo «Single Rider». Si falta el distintivo,
el dato puede ser desconocido.

### ¿Tengo que cumplir la altura mínima con single rider?

Sí. Walt Disney World y el Disneyland Resort escriben que los single riders deben cumplir todos los
requisitos de la atracción. El Efteling escribe lo mismo para los niños que entran solos.

### ¿Puedo elegir mi asiento?

No. El Efteling asigna un sitio, y Walt Disney World no garantiza la elección del asiento.

## Dónde tienen huecos los datos

Tres limitaciones valen para todo lo que dice este artículo:

- `hasSingleRider` es un dato fijo de cada atracción. No dice si la cola está abierta hoy.
- «Desconocido» no es «no». Donde no hay nada registrado, la atracción no figura en las listas.
- Para el Phantasialand, Disneyland Paris, PortAventura, Alton Towers, Thorpe Park, Universal y los
  parques Disney asiáticos, el dato procede de nuestros datos, no de una página del parque que
  hayamos podido leer. En el Efteling, nuestros datos recogen una atracción más que el parque.

## Para seguir leyendo

- [Europa-Park: tiempos de espera y consejos](/blog/europa-park-tiempos-de-espera-consejos)
- [Phantasialand: tiempos de espera y consejos](/blog/phantasialand-tiempos-de-espera-consejos)
- [Disneyland Paris: tiempos de espera y consejos](/blog/disneyland-paris-tiempos-de-espera-consejos)
- [El arte de esperar](/blog/el-arte-de-esperar)

### Fuentes y lecturas

- Single rider en el Efteling, lista de las seis atracciones, normas para grupos y niños, Symbolica:
  [Entrada single rider (oficial)](https://www.efteling.com/de/park/informationen/single-rider-eingang)
- Single rider en Walt Disney World, cinco atracciones y las normas:
  [Single Rider Services (oficial)](https://disneyworld.disney.go.com/guest-services/single-rider-line/)
- Single rider en el Disneyland Resort, once atracciones y las normas:
  [Single Rider Services (oficial)](https://disneyland.disney.go.com/guest-services/single-rider-line/)
- Voltron Nevera, altura mínima, capacidad y nota sobre single rider:
  [Voltron Nevera powered by Rimac (oficial)](https://www.europapark.de/en/theme-park/attractions/voltron-nevera-powered-rimac)
- Eurosat, límites de altura y edad y nota sobre single rider:
  [Eurosat – CanCan Coaster (oficial)](https://www.europapark.de/en/theme-park/attractions/eurosat-cancan-coaster)
- Qué atracciones de qué parque tienen la característica, las cifras de la tabla y las colas en vivo:
  consulta a la API de park.fan (`/v1/parks/<continente>/<país>/<ciudad>/<parque>`, campos
  `hasSingleRider` y `queues`), realizada el 8 de octubre de 2026 para 203 parques con tiempos de espera
  en vivo
