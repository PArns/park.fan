---
title: '70 minutes, c’est beaucoup ? Tout dépend si on est mardi'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
author: patrick
mode: published
excerpt: >-
  À l’entrée de Taron il y a un chiffre, et tout seul il en dit autant qu’une
  température sans saison. Seule la comparaison avec chaque mardi mesuré en fait
  une réponse. Pourquoi park.fan ne jette rien, ce qui se passe la nuit et
  pourquoi nous ne conseillons plus le patin à glace en août.
tags:
  - temps-d-attente
  - park-fan
  - phantasialand
  - statistiques
  - coulisses
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
  alt: 'Un train de Taron entre les rochers de basalte de Klugheim'
  caption: 'Taron à Klugheim. Le chiffre à l’entrée affiche 70. Et maintenant ?'
  credit: 'Patrick Arns'
seo:
  title: 'Bien lire un temps d’attente : 70 minutes, c’est beaucoup ?'
  description: >-
    Un temps d’attente sans comparaison, c’est une température sans saison. Ce
    que « habituel » et « chargé » veulent dire, et comment park.fan en fait une
    réponse.
  keywords:
    - temps d’attente parc d’attractions
    - situer un temps d’attente
    - Taron temps d’attente
    - Phantasialand temps d’attente
    - centile temps d’attente
    - rope drop
    - calendrier d’affluence
---

Tu es devant [Taron](ref:phantasialand/taron), l’affichage indique **70 minutes**, et ta tête fait
aussitôt la mauvaise chose : elle compare ce chiffre à ton souvenir. La dernière
fois c’était 40, donc aujourd’hui c’est pire. La fois d’avant 90, donc
aujourd’hui c’est parfait. Deux visites ne font pas une base, et de toute façon
ta mémoire arrondit à ton désavantage
([pourquoi, c’est ici](/blog/l-art-d-attendre)).

Le chiffre lui-même n’est pas le problème. Les parcs l’affichent, il est
généralement à peu près juste, et il nous coûte une requête toutes les cinq
minutes. Le problème, c’est qu’il est seul, comme une température sans saison. Soixante-dix minutes un mardi de mai
n’ont rien à voir avec 70 minutes un samedi des vacances d’été, et sans la
seconde moitié de cette phrase, tu ne peux rien en faire.

## Ce que « habituel » et « chargé » veulent vraiment dire

park.fan place deux valeurs de comparaison à côté de chaque attraction.
**Habituel** est la médiane des pics quotidiens : sur la moitié des jours
mesurés, la file la plus longue était plus courte que cette valeur, sur l’autre
moitié plus longue. **Chargé** est le 90e centile de la même série, soit à peu
près le jour sur dix où il y avait vraiment du monde.

Ce sont des centiles, pas des moyennes. Une
moyenne se laisse déplacer par une seule journée exceptionnelle : un après-midi
avec une panne et 150 minutes d’engorgement tire vers le haut la moyenne d’un
mois entier, alors que pendant 29 jours on n’en a rien senti. La médiane ne
bronche même pas devant une journée pareille. Le record figure donc à part, avec sa
date, pour qu’on le voie sans qu’il touche aux deux autres chiffres.

Pour [Phantasialand](ref:phantasialand), le classement ressemble à ceci. La colonne des jours
mesurés est la plus importante : elle dit le poids que porte une ligne.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

Ce qui s’affiche ici est en direct. Relis cet article dans trois mois : le
tableau contiendra d’autres chiffres, et le texte autour tiendra toujours. C’est
exactement à cela que servent ces widgets. Dans quatre articles plus anciens,
les chiffres étaient tapés à la main dans des tableaux Markdown, répartis sur
six langues, et au bout de quelques semaines ils avaient discrètement divergé,
comme les horloges d’une location de vacances.

## La journée a une forme

Une attraction n’a pas la même file toute la journée. Le mouvement de fond, tout
le monde le connaît : c’est court à l’ouverture, puis le reste du monde a fini
son petit-déjeuner, et vers le soir ça redevient supportable. Où se situe exactement le point haut varie d’une
attraction à l’autre, et ces écarts sont la partie utile.

```hourly-profile-widget slug=phantasialand top=6

```

De cette forme naissent deux recommandations. La première, c’est le **rope
drop** : filer dès l’ouverture vers une attraction précise, avant que les allées
ne se remplissent. Nous ne le proposons que si le pic de la journée atteint au
moins 60 minutes et si le départ matinal en fait gagner au moins 45. En dessous,
ce serait un conseil valable partout et donc utile nulle part.

La seconde, c’est l’alternative plus calme du soir. Sur les grands coasters, la
dernière heure avant la fermeture vaut souvent la première après l’ouverture,
sauf qu’il n’y a pas besoin de se lever à sept heures. Les deux indications
figurent sur la page de chaque attraction, avec une heure concrète en heure du
parc.

## L’essentiel se joue avant le départ

L’heure te fait gagner une demi-heure, la date jusqu’à une heure entière. Entre
deux jours de la même semaine de vacances, il peut y avoir une demi-heure
d’attente moyenne d’écart, et un calendrier ordinaire n’en laisse rien voir. Ce
qui fait la différence : quelles régions sont en vacances, s’il y a un pont
accroché derrière, s’il pleut et s’il se passe quelque chose de l’autre côté de
la frontière.

Ce dernier point est volontiers sous-estimé. Un parc proche d’une frontière
sent tout de suite le début des vacances d’à côté, souvent dès les plaques
d’immatriculation sur le parking. Alors nous comptons les
régions dans un rayon d’environ 200 kilomètres et les marquons séparément dans
le calendrier. Trois parcs côte à côte, chacun avec son jour le plus calme :

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

Si une cellule de la dernière colonne reste vide, ce parc n’a aucun jour de
semaine qui se détache vraiment des autres.

## À quoi sert une équipe de nuit

Afficher un temps d’attente en direct, c’est une requête. Une médiane sur chaque
mardi mesuré, c’est autre chose : elle doit être prête avant que quelqu’un la
demande. Chaque nuit, une chaîne de tâches se déroule donc, dans un ordre fixe,
parce que chaque étape s’appuie sur la précédente. À 02:00 UTC les centiles par
heure, à 03:00 les valeurs de référence par parc, à 04:30 l’agrégation de la
veille, à 05:15 les recommandations rope drop, qui lisent précisément cette
agrégation. À 06:00, le modèle de prévision se réentraîne avec les temps
d’attente de la veille, pendant que les adeptes du rope drop sont déjà sur
l’autoroute.

À cela s’ajoute l’autre moitié : nous ne jetons rien. Les périodes anciennes
sont compressées, mais chaque analyse continue de porter sur tous les relevés
jamais arrivés. Commencer à enregistrer la troisième année, c’est avoir un an d’historique la
troisième année, et les deux précédentes sont perdues pour de bon.

## Là où nous préférons ne rien dire

[Hansa-Park](ref:hansa-park), par exemple, ne donne ses temps d’attente que dans sa propre
application, et seulement pour les appareils connectés au wifi du parc. Il
n’existe aucune interface publique. Dans les données brutes, ce parc ressemble à
n’importe quel autre à trois heures du matin : aucune attraction ne remonte quoi
que ce soit. Si nous en tirions la conclusion évidente, toutes les attractions du parc y
seraient en « très faible », avec une moyenne de 0 minute et une prévision
fondée sur zéro observation. Une journée de rêve pour n’importe quel visiteur,
et entièrement inventée. À la place, la page du parc porte une mention
disant qu’il n’y a rien à lire ici.

La même règle à plus petite échelle : la patinoire du Phantasialand fonctionne
de novembre à janvier. En août, personne ne remonte rien à son sujet, parce
qu’il n’y a rien à remonter. Lire ce silence comme « ouvert » serait l’erreur
commode, et c’est bel et bien ce qui a figuré une fois sur la page du parc :
du patin à glace en plein été, avec notre bénédiction.
Quant aux mois d’exploitation d’une attraction, nous ne les nommons qu’après 330
jours d’observation : avant cela, aucun mois n’y figure, parce que « fonctionne
de décembre à avril » décrirait la période où nous avons mesuré par hasard.

## Où tout cela se trouve

La version longue, avec les vraies fiches à lire en parallèle, est désormais une
page à part : [Comment fonctionne park.fan](/fr/comment-fonctionne-park-fan).
Chapitre par chapitre, on y voit ce qu’affiche une fiche d’attraction, comment
fonctionne l’échelle sous « habituel » et « chargé », comment le calendrier tient
compte des vacances et les trois endroits où nous n’affirmons délibérément rien.
Quatre situations de visite concrètes s’y trouvent aussi, de la famille pendant
les vacances d’automne à l’abonné annuel à sept heures du soir.

Et la prochaine fois que tu seras devant l’entrée à fixer l’affichage : regarde
ce qui est normal sur cette attraction un mardi.

— Patrick
