---
title: 'Single Rider : dans quels parcs on monte plus vite seul'
translationKey: single-rider-guide
date: '2026-10-08'
author: patrick
mode: published
featured: false
excerpt: >-
  Dans 18 des 203 parcs dont nous mesurons les temps d’attente, notre API
  recense au moins une attraction avec une file Single Rider, 66 au total. Qui
  monte seul ou accepte d’être séparé du groupe remplit des sièges vides et
  attend le plus souvent moins longtemps. Pour les familles avec de jeunes
  enfants, cela ne vaut pas le coup.
tags:
  - single-rider
  - temps-d-attente
  - files-d-attente
  - conseils
  - parc-attractions
  - europa-park
  - efteling
  - disney
  - universal
category: guides
coverImage:
  src: /media/europa-park/voltron-nevera-powered-by-rimac.jpg
  alt: 'Un train de Voltron Nevera traverse une inversion la tête en bas, éclairé de rose et de bleu.'
  caption: 'Voltron Nevera, à l’Europa-Park, a sa propre entrée Single Rider.'
  credit: 'Patrick Arns'
seo:
  title: 'Single Rider en parc d’attractions : quelles attractions'
  description: >-
    Quelles attractions de 18 parcs ont une file Single Rider, comment elle
    fonctionne et quand elle ne vaut pas le coup.
  keywords:
    - Single Rider parc d’attractions
    - Single Rider Europa-Park
    - Single Rider Efteling
    - Voyager seul parc d’attractions
    - Single Rider Disney
    - Single Rider Universal Orlando
    - File Single Rider
    - Gagner du temps d’attente parc d’attractions
---

Single Rider, c’est une file à part où tu prends un siège resté libre dans le véhicule, à côté
d’inconnus. En échange, tu attends le plus souvent moins que dans la file normale. L’Efteling décrit
sur son site que les Single Riders remplissent les places vides qui restent dans les véhicules.

Notre API tient cette file pour un type à part, `SINGLE_RIDER`, et connaît 66 attractions réparties
dans 18 parcs où elle existe. Cet article recense lesquelles, ce que les parcs écrivent eux-mêmes sur
les règles et pour qui l’entrée Single Rider vaut le détour. Combien de temps elle fait gagner, nous
ne pouvons y répondre qu’en partie, les raisons sont plus bas.

## Comment fonctionne une entrée Single Rider

Un train a des rangées de sièges fixes, et tous les groupes de la file normale ne les remplissent pas.
Là où une place reste libre, le parc y installe une personne seule venue de la file Single Rider.
L’attraction part plus pleine, et les groupes de la file normale n’y perdent rien, puisque personne
de leur rang ne passe devant. L’Efteling écrit que cela raccourcit l’attente pour les groupes comme
pour les personnes seules.

On en tire ce qu’on peut attendre. La file Single Rider ne s’écoule qu’au rythme où des places se
libèrent. Sur le papier, elle est plus courte ; si elle l’est à ton heure, cela dépend des vides que
laissent les groupes devant toi. L’Efteling l’écrit ainsi : les personnes seules attendent le plus
souvent moins, mais combien dépend de l’affluence et des places libres.

Trois règles reviennent dans tous les parcs dont nous avons pu lire la page :

1. **Tu ne choisis pas ton siège.** L’Efteling attribue une place, avec d’autres visiteurs. Walt
   Disney World ne garantit ni l’embarquement immédiat ni le choix du siège.
2. **Les conditions d’accès s’appliquent comme partout.** Walt Disney World et le Disneyland Resort
   précisent que les Single Riders doivent remplir toutes les conditions de l’attraction. L’Efteling
   laisse entrer seuls les enfants dans l’entrée Single Rider s’ils respectent la taille et les
   autres conditions de l’attraction.
3. **La file peut être fermée.** L’Efteling le dit expressément : les jours calmes, elle reste
   parfois fermée. Walt Disney World écrit que le service dépend de la disponibilité.

```glossary-widget slug=single-rider

```

## Pour qui c’est utile, et quand ça ne l’est pas

L’entrée Single Rider vaut le coup dans trois cas : tu es seul dans le parc, ton groupe peut se
séparer, ou tu veux absolument faire une attraction précise et l’attente normale est trop longue.
Dans le deuxième cas, vous vous répartissez, montez chacun de votre côté et vous retrouvez à la sortie.

Elle ne vaut pas le coup dans ces cas :

- **Tu voyages avec un enfant qui a besoin d’être accompagné.** Pour Eurosat, à l’Europa-Park, la
  page du parc indique de 120 à 195 centimètres, et sous 130 centimètres uniquement avec un adulte.
  Qui a besoin de son enfant à côté de lui ne peut pas embarquer séparément.
- **Vous voulez monter ensemble.** L’Efteling autorise les groupes à utiliser l’entrée Single
  Rider, mais ils montent l’un après l’autre. Ce n’est que si plusieurs places sont libres par
  hasard que des personnes de la file Single Rider s’assoient côte à côte.
- **L’attraction raconte quelque chose que vous voulez vivre ensemble.** À Symbolica, à l’Efteling,
  tu ne peux pas choisir en Single Rider laquelle des trois visites du palais tu auras.
- **Tu as un créneau.** Qui a réservé l’attraction à l’Europa-Park avec la Virtual Line peut faire
  la queue ailleurs jusqu’à son créneau. Pour cette attraction, il n’a pas besoin de l’entrée Single
  Rider.
- **La file normale est de toute façon courte.** L’avantage disparaît, et le groupe est séparé pour
  rien.

## Ce que nos données savent de la file

Il y a deux questions, et nos données ne répondent bien qu’à l’une d’elles.

**L’attraction a-t-elle une file Single Rider ?** C’est indiqué pour chaque attraction dans le champ
`hasSingleRider`, une donnée fixe. Sur la page de l’attraction, park.fan affiche pour cela un repère
« Single Rider ». La valeur `null` signifie « inconnu » et jamais « non ». L’absence de repère ne dit
donc rien sur l’existence de la file.

**Quelle est sa longueur en ce moment ?** Ici, le chiffre manque souvent. Le 8 octobre 2026, nous
avons interrogé les données en direct des 18 parcs. Elles contenaient 41 files Single Rider, dont 19
ouvertes, dans sept parcs. Pas une seule des 41 n’affichait de temps d’attente. Les parcs nous
signalent que la file est ouverte, mais pas sa longueur. Sur la page de l’attraction, park.fan montre
alors « Single Rider » sans durée, et les tableaux de cet article montrent la file normale.

Combien de temps l’entrée fait gagner ne peut donc pas se calculer à partir de nos données pour
l’instant. Seule la déclaration de l’Efteling, selon laquelle les personnes seules attendent le plus
souvent moins, est établie. Nous ne donnons pas le résultat d’une mesure à nous tant qu’il n’y en a
pas.

## Parc par parc : combien d’attractions nous connaissons

Le tableau indique combien d’attractions de chaque parc portent cette caractéristique, combien
d’attractions le parc compte dans notre base de données et pour combien l’information manque. La
date de référence est le 8 octobre 2026.

| Parc                           | Attractions avec Single Rider | Attractions | Information inconnue |
| ------------------------------ | ----------------------------- | ----------- | -------------------- |
| Efteling                       | 7                             | 37          | 30                   |
| Disney Adventure World         | 7                             | 14          | 7                    |
| Europa-Park                    | 6                             | 97          | 1                    |
| Universal Epic Universe        | 6                             | 14          | 8                    |
| Universal Islands of Adventure | 5                             | 25          | 20                   |
| PortAventura Park              | 4                             | 51          | 45                   |
| Alton Towers                   | 4                             | 55          | 48                   |
| Disney California Adventure    | 4                             | 29          | 25                   |
| Disney’s Hollywood Studios     | 3                             | 11          | 8                    |
| Universal Studios Florida      | 3                             | 44          | 41                   |
| Phantasialand                  | 3                             | 40          | 0                    |
| Hong Kong Disneyland           | 3                             | 47          | 44                   |
| Disneyland Park (Anaheim)      | 2                             | 56          | 54                   |
| Disneyland Park (Paris)        | 2                             | 43          | 41                   |
| Shanghai Disneyland            | 2                             | 37          | 35                   |
| EPCOT                          | 2                             | 34          | 32                   |
| Thorpe Park                    | 2                             | 45          | 38                   |
| Disney’s Animal Kingdom        | 1                             | 17          | 16                   |

Deux parcs se détachent. À l’Europa-Park et au Phantasialand, l’information est renseignée pour
presque toutes les attractions, il en manque une dans l’un et aucune dans l’autre. Là, « pas dans la
liste » veut donc vraiment dire « pas de file Single Rider ». Partout ailleurs, la liste est un
minimum : au Disneyland Park de Paris, l’information manque pour 41 des 43 attractions, au
Disneyland Park d’Anaheim pour 54 sur 56.

Les 185 autres parcs sur 203 n’ont aucune attraction avec cette caractéristique. Y a-t-il là un
« non » ou une lacune, nous ne le savons pas.

## Europa-Park

À l’[Europa-Park](ref:europa-park), six attractions portent la caractéristique : ARTHUR, dans la zone
Minimoys Kingdom, WODAN – Timburcoaster et blue fire Megacoaster en Islande, Eurosat – CanCan Coaster
en France, le Voletarium en Allemagne et Voltron Nevera powered by Rimac en Croatie.

Le parc lui-même en confirme deux. Sur la page de
[Voltron Nevera](ref:europa-park/voltron-nevera-powered-by-rimac), Single Rider figure parmi les
caractéristiques comme file spéciale pour les personnes seules, de même sur la page
d’[Eurosat – CanCan Coaster](ref:europa-park/eurosat-cancan-coaster). Voltron Nevera accepte les
passagers à partir de 130 centimètres, un train compte 16 personnes. À Eurosat, la limite est de 120
à 195 centimètres et de six ans, et sous huit ans, il faut être avec un adulte.

Les six attractions ont une taille minimale de 120 ou 130 centimètres, d’après les indications de
notre base de données. L’entrée Single Rider aide donc surtout les adolescents et les adultes qui
voyagent seuls ou en groupe sans jeunes enfants. Pour bien organiser la journée dans le parc,
consulte le [guide de l’Europa-Park](/blog/europa-park-temps-d-attente-conseils).

```ride-waits-widget rides=europa-park/voltron-nevera-powered-by-rimac|Voltron Nevera;europa-park/blue-fire-megacoaster|blue fire;europa-park/wodan-timburcoaster|WODAN;europa-park/eurosat-cancan-coaster|Eurosat;europa-park/voletarium|Voletarium;europa-park/arthur|ARTHUR columns=land,peak

```

La file normale figure dans le tableau, dans le même ordre que les attractions ci-dessus. La répartition
sur la journée montre quand elle se remplit :

```hourly-profile-widget slug=europa-park top=6

```

## Efteling

L’[Efteling](ref:efteling) offre la description officielle la plus complète que nous ayons trouvée.
La page consacrée à l’entrée Single Rider cite six attractions : Danse Macabre, Joris en de Draak,
Symbolica, Baron 1898, Max & Moritz et Python. Chacune a deux files, une pour les groupes et les
familles, une pour les personnes seules. Nos données ajoutent De Vliegende Hollander, que la page du
parc ne mentionne pas.

La page explique aussi ce qui manque au Single Rider : choisir sa place, et à Symbolica le choix de
l’une des trois visites du palais. Les groupes peuvent utiliser l’entrée mais montent l’un après
l’autre, et les enfants peuvent y aller seuls s’ils remplissent les conditions de l’attraction. La
page ne précise pas ces conditions, elles varient selon l’attraction. D’après notre base de données,
la taille minimale est de 90 centimètres pour Max & Moritz, de 110 pour Joris en de Draak, de 120
pour Python, De Vliegende Hollander et Danse Macabre, et de 132 pour Baron 1898. Symbolica n’a pas
d’indication.

![Python de nuit, éclairé en violet|Python, à l’Efteling, l’une des attractions avec entrée Single Rider.|wide](/media/efteling/python.jpg)

```ride-waits-widget rides=efteling/baron-1898|Baron 1898;efteling/python|Python;efteling/joris-en-de-draak|Joris en de Draak;efteling/symbolica|Symbolica;efteling/danse-macabre|Danse Macabre;efteling/max-and-moritz|Max & Moritz;efteling/de-vliegende-hollander|De Vliegende Hollander columns=land,peak

```

## Phantasialand

Au [Phantasialand](ref:phantasialand), trois attractions portent la caractéristique :
[Taron](ref:phantasialand/taron) et [Raik](ref:phantasialand/raik) dans la zone Mystery, et
[Chiapas – DIE Wasserbahn](ref:phantasialand/chiapas-die-wasserbahn) à Mexico. Nous n’avons pas pu
consulter de page du parc qui le confirme.

Avec l’Europa-Park, le Phantasialand est le parc où l’information est renseignée pour chaque
attraction : sur 40 attractions, elle ne manque pour aucune. Les trois attractions forment donc la
liste complète. La taille minimale est de 140 centimètres pour Taron, de 130 pour Chiapas et de 120
pour Raik.

```ride-waits-widget rides=phantasialand/taron|Taron;phantasialand/raik|Raik;phantasialand/chiapas-die-wasserbahn|Chiapas columns=land,peak

```

## Disneyland Paris

Le resort compte deux parcs, et les attractions avec entrée Single Rider se répartissent
inégalement. À [Disney Adventure World](ref:disney-adventure-world), il y en a sept : Spider-Man
W.E.B. Adventure et Avengers Assemble: Flight Force dans le Marvel Avengers Campus, Frozen Ever After
dans la World of Frozen, Ratatouille: L’Aventure Totalement Toquée de Rémy dans le Toon Studio, et
toujours dans le Toon Studio Crush’s Coaster, RC Racer et Toy Soldiers Parachute Drop. Cela fait sept
attractions sur 14, la part la plus élevée de tous les parcs du tableau.

Au [Disneyland Park](ref:/parks/europe/france/paris/disneyland-park), il y en a deux : Star Wars
Hyperspace Mountain à Discoveryland et Indiana Jones and the Temple of Peril à Adventureland. Nous
n’avons pas pu consulter de page de Disneyland Paris sur le service Single Rider.

```ride-waits-widget rides=disney-adventure-world/frozen-ever-after|Frozen Ever After;disney-adventure-world/spider-man-web-adventure|Spider-Man W.E.B. Adventure;disney-adventure-world/crushs-coaster|Crush’s Coaster;disney-adventure-world/rc-racer|RC Racer;/parks/europe/france/paris/disneyland-park/star-wars-hyperspace-mountain|Star Wars Hyperspace Mountain;/parks/europe/france/paris/disneyland-park/indiana-jones-and-the-temple-of-peril|Indiana Jones and the Temple of Peril columns=park,peak

```

## Alton Towers et Thorpe Park

À [Alton Towers](ref:alton-towers), quatre attractions de la zone Thrills : TH13TEEN, Spinball
Whizzer, The Smiler et Galactica. À [Thorpe Park](ref:thorpe-park), deux, toutes deux dans la zone
Coasters : SAW – The Ride et Hyperia. Dans les deux parcs, l’information manque pour la plupart des
attractions : à Alton Towers pour 48 sur 55, à Thorpe Park pour 38 sur 45. La taille minimale est de
120 centimètres pour TH13TEEN et Spinball Whizzer, de 130 pour Hyperia et de 140 pour The Smiler,
Galactica et SAW. Nous n’avons pas lu de page de ces parcs qui confirme la liste.

```ride-waits-widget rides=alton-towers/the-smiler|The Smiler;alton-towers/galactica|Galactica;alton-towers/th13teen|TH13TEEN;alton-towers/spinball-whizzer|Spinball Whizzer;thorpe-park/hyperia|Hyperia;thorpe-park/saw-the-ride|SAW – The Ride columns=park,peak

```

## PortAventura

Au [PortAventura Park](ref:portaventura-park), nous connaissons quatre attractions : Hurakan Condor,
Furius Baco, Shambhala et Dragon Khan. L’information manque pour 45 des 51 attractions, la liste est
donc ici particulièrement courte au regard de ce que nous ignorons.

```ride-waits-widget rides=portaventura-park/shambhala|Shambhala;portaventura-park/dragon-khan|Dragon Khan;portaventura-park/furius-baco|Furius Baco;portaventura-park/hurakan-condor|Hurakan Condor columns=peak

```

## Walt Disney World

Sur sa page du service Single Rider, Walt Disney World cite cinq attractions : Millennium Falcon:
Smugglers Run, Star Wars: Rise of the Resistance et Rock ’n’ Roller Coaster Starring The Muppets à
Disney’s Hollywood Studios, ainsi que Remy’s Ratatouille Adventure et Test Track à l’EPCOT. S’y
ajoute Expedition Everest à Disney’s Animal Kingdom, qui ne figure pas sur la liste du parc.

Les règles sont sur la même page. Le service permet aux groupes de se séparer et de monter
individuellement. L’embarquement immédiat et le choix du siège ne sont pas garantis, les souhaits
particuliers de placement ne seront peut-être pas satisfaits, et les attractions participantes comme
les temps d’attente peuvent changer.

Les trois files Single Rider de Disney’s Hollywood Studios étaient sur « ouvert », sans temps
d’attente, le 8 octobre 2026. C’est le cas des 19 files Single Rider ouvertes dans nos données en
direct, chez Universal aussi.

```ride-waits-widget rides=disneys-hollywood-studios/star-wars-rise-of-the-resistance|Rise of the Resistance;disneys-hollywood-studios/millennium-falcon-smugglers-run|Smugglers Run;disneys-hollywood-studios/rock-n-roller-coaster-starring-aerosmith|Rock ’n’ Roller Coaster;epcot/test-track|Test Track;epcot/remys-ratatouille-adventure|Remy’s Ratatouille Adventure;disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain|Expedition Everest columns=park,peak

```

## Disneyland Resort en Californie

Sur sa page, le resort d’Anaheim cite onze attractions. Au Disneyland Park, ce sont Millennium Falcon:
Smugglers Run, Matterhorn Bobsleds, Space Mountain, Tiana’s Bayou Adventure et Indiana Jones
Adventure. Au Disney California Adventure Park, ce sont Goofy’s Sky School, Incredicoaster, Radiator
Springs Racers, Grizzly River Run, WEB SLINGERS et Soarin’ Over California.

Chez nous, il y en a six en tout : Millennium Falcon et Tiana’s Bayou Adventure au
[Disneyland Park](ref:/parks/north-america/united-states/anaheim/disneyland-park), ainsi
qu’Incredicoaster, Radiator Springs Racers, WEB SLINGERS et Silly Symphony Swings au
[Disney California Adventure Park](ref:disney-california-adventure-park). Cinq attractions de la liste
du resort manquent chez nous, et les Silly Symphony Swings ne figurent pas sur la liste.

Le parc écrit que des Cast Members t’orientent vers la file prévue et que ton groupe y est séparé
afin de remplir les places que les visiteurs de la file normale n’occupent pas.

```ride-waits-widget rides=/parks/north-america/united-states/anaheim/disneyland-park/millennium-falcon-smugglers-run|Millennium Falcon;/parks/north-america/united-states/anaheim/disneyland-park/tianas-bayou-adventure|Tiana’s Bayou Adventure;disney-california-adventure-park/radiator-springs-racers|Radiator Springs Racers;disney-california-adventure-park/incredicoaster|Incredicoaster;disney-california-adventure-park/web-slingers-a-spider-man-adventure|WEB SLINGERS columns=park,peak

```

## Universal Orlando

Universal Orlando compte 14 attractions dans trois parcs, Walt Disney World six dans trois parcs. À
[Universal Studios Florida](ref:universal-studios-florida), ce sont Revenge of the Mummy, MEN IN
BLACK Alien Attack et Harry Potter and the Escape from Gringotts. À
[Islands of Adventure](ref:universal-islands-of-adventure), il y en a cinq : Harry Potter and the
Forbidden Journey, Hagrid’s Magical Creatures Motorbike Adventure, The Incredible Hulk Coaster,
Doctor Doom’s Fearfall et The Amazing Adventures of Spider-Man. À
[Epic Universe](ref:universal-epic-universe), il y en a six sur 14 attractions, dont Stardust Racers,
Mine-Cart Madness et Mario Kart: Bowser’s Challenge.

Nous n’avons pas pu consulter de page d’Universal qui le confirme. Les indications viennent de nos
données et sont un repère, pas une promesse. À Epic Universe, l’information manque pour 8 attractions
sur 14, à Islands of Adventure pour 20 sur 25.

```ride-waits-widget rides=universal-islands-of-adventure/harry-potter-and-the-forbidden-journey|Forbidden Journey;universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure|Hagrid’s Motorbike Adventure;universal-islands-of-adventure/the-incredible-hulk-coaster|Incredible Hulk Coaster;universal-studios-florida/harry-potter-and-the-escape-from-gringotts|Escape from Gringotts;universal-studios-florida/revenge-of-the-mummy|Revenge of the Mummy;universal-epic-universe/stardust-racers|Stardust Racers;universal-epic-universe/mario-kart-bowsers-challenge|Mario Kart columns=park,peak

```

## Shanghai Disneyland et Hong Kong Disneyland

Les deux parcs Disney d’Asie ont deux et trois attractions. À
[Shanghai Disneyland](ref:shanghai-disneyland), ce sont Zootopia: Hot Pursuit et Seven Dwarfs Mine
Train, à [Hong Kong Disneyland](ref:hong-kong-disneyland-park) Hyperspace Mountain, Big Grizzly
Mountain Runaway Mine Cars et Toy Soldier Parachute Drop. Ici aussi, l’information manque presque
partout : pour 35 attractions sur 37 à Shanghai et pour 44 sur 47 à Hong Kong.

## Comment organiser une journée avec Single Rider

**Choisis deux ou trois attractions à l’avance.** Sur la page du parc de park.fan, tu vois quelles
attractions portent le repère. L’entrée vaut le plus là où la file normale est la plus longue.

**Vérifie que la file est ouverte avant de vous séparer.** Sur la page de l’attraction, le repère
« Single Rider » s’affiche avec l’état de la file. Elle peut être fermée sans que l’attraction le
soit.

**Répartissez-vous quand cela vaut le coup.** Pour deux adultes, la solution la plus rapide est que
l’un prenne la file normale et l’autre l’entrée Single Rider. Celui qui monte en premier attend à la
sortie.

Pour savoir ce que l’attente fait ressentir et pourquoi avancer dans la file ne sert à rien, lis
l’article [L’art d’attendre](/blog/l-art-d-attendre).

## Questions fréquentes sur Single Rider

### Que signifie Single Rider dans un parc d’attractions ?

Single Rider est une file à part pour les personnes seules. Qui l’utilise prend les sièges qui restent
libres dans un véhicule et s’assoit à côté d’inconnus. L’Efteling le décrit ainsi : les Single Riders
remplissent les places vides qui restent dans les véhicules.

### La file Single Rider est-elle toujours plus courte ?

Non. L’Efteling écrit que les personnes seules attendent le plus souvent moins, mais que cela dépend
de l’affluence et des places libres. Les jours calmes, la file peut être entièrement fermée.

### Puis-je utiliser Single Rider en famille ?

Seulement si tout le monde accepte de monter séparément. L’Efteling autorise les groupes à utiliser
l’entrée Single Rider, mais ils montent l’un après l’autre. Un enfant qui a besoin d’un
accompagnateur doit être assis à côté de l’adulte, l’entrée Single Rider est alors exclue.

### Quelles attractions de l’Europa-Park ont Single Rider ?

Six : ARTHUR, WODAN, blue fire, Eurosat, le Voletarium et Voltron Nevera. Le parc l’indique
expressément sur les pages de Voltron Nevera et d’Eurosat.

### Quelles attractions de l’Efteling ont Single Rider ?

La page du parc cite Danse Macabre, Joris en de Draak, Symbolica, Baron 1898, Max & Moritz et
Python. Chez nous, De Vliegende Hollander s’y ajoute.

### Où voir si une attraction a Single Rider ?

Sur la page de l’attraction, chez park.fan, au repère « Single Rider ». Si le repère manque,
l’information peut être inconnue.

### Dois-je respecter la taille minimale avec Single Rider ?

Oui. Walt Disney World et le Disneyland Resort précisent que les Single Riders doivent remplir toutes
les conditions de l’attraction. L’Efteling écrit la même chose pour les enfants qui y entrent seuls.

### Puis-je choisir mon siège ?

Non. L’Efteling attribue une place, Walt Disney World ne garantit pas le choix du siège.

## Où les données ont des lacunes

Trois limites valent pour tout cet article :

- `hasSingleRider` est une donnée fixe par attraction. Elle ne dit pas si la file est ouverte
  aujourd’hui.
- « Inconnu » ne veut pas dire « non ». Là où rien n’est renseigné, l’attraction ne figure pas dans
  les listes.
- Pour le Phantasialand, Disneyland Paris, PortAventura, Alton Towers, Thorpe Park, Universal et les
  parcs Disney d’Asie, l’information vient de nos données, pas d’une page du parc que nous avons pu
  lire. À l’Efteling, nos données comptent une attraction de plus que le parc.

## Pour aller plus loin

- [Europa-Park : temps d’attente et conseils](/blog/europa-park-temps-d-attente-conseils)
- [Phantasialand : temps d’attente et conseils](/blog/phantasialand-temps-d-attente-conseils)
- [Disneyland Paris : temps d’attente et conseils](/blog/disneyland-paris-temps-d-attente-conseils)
- [L’art d’attendre](/blog/l-art-d-attendre)

### Sources et pour aller plus loin

- Single Rider à l’Efteling, liste des six attractions, règles pour les groupes et les enfants,
  Symbolica :
  [Entrée Single Rider (officiel)](https://www.efteling.com/de/park/informationen/single-rider-eingang)
- Single Rider à Walt Disney World, cinq attractions et les règles :
  [Single Rider Services (officiel)](https://disneyworld.disney.go.com/guest-services/single-rider-line/)
- Single Rider au Disneyland Resort, onze attractions et les règles :
  [Single Rider Services (officiel)](https://disneyland.disney.go.com/guest-services/single-rider-line/)
- Voltron Nevera, taille minimale, capacité et mention Single Rider :
  [Voltron Nevera powered by Rimac (officiel)](https://www.europapark.de/en/theme-park/attractions/voltron-nevera-powered-rimac)
- Eurosat, limites de taille et d’âge et mention Single Rider :
  [Eurosat – CanCan Coaster (officiel)](https://www.europapark.de/en/theme-park/attractions/eurosat-cancan-coaster)
- Quelles attractions de quel parc portent la caractéristique, les chiffres du tableau et les files en
  direct : requête à l’API park.fan (`/v1/parks/<continent>/<pays>/<ville>/<parc>`, champs
  `hasSingleRider` et `queues`), consultée le 8 octobre 2026 pour 203 parcs avec temps d’attente en
  direct
