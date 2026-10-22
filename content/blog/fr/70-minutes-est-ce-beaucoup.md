---
title: 'Ce que valent 70 minutes d’attente selon le jour'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
updatedAt: '2026-10-05'
author: patrick
mode: published
excerpt: >-
  À l’entrée de Taron il y a un chiffre. Seule la comparaison avec chaque mardi mesuré en fait une réponse.
tags:
  - temps-d-attente
  - park-fan
  - phantasialand
  - statistiques
  - coulisses
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
  alt: 'Un train de Taron entre les rochers de basalte de Klugheim'
  caption: 'Taron à Klugheim.'
  credit: 'Patrick Arns'
seo:
  title: 'Bien lire un temps d’attente : 70 minutes, c’est beaucoup ?'
  description: >-
    Un temps d’attente seul ne dit pas s’il est long. « Habituel » est la médiane des pics quotidiens, « chargé » le 90e centile.
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
([pourquoi c’est ainsi](/blog/l-art-d-attendre)).

Les parcs affichent ce chiffre, il est généralement à peu près juste, et il nous
coûte une requête toutes les cinq minutes. Seulement, il est seul, comme une
température sans saison. Soixante-dix minutes un mardi de mai
n’ont rien à voir avec 70 minutes un samedi des vacances d’été.

## Ce que « habituel » et « chargé » veulent dire

park.fan place deux valeurs de comparaison à côté de chaque grande attraction
d’un parc, calculées sur les 365 derniers jours. **Habituel** est la médiane des
pics quotidiens : sur la moitié des jours mesurés, la file la plus longue était
plus courte que cette valeur, sur l’autre moitié plus longue. **Chargé** est le
90e centile de la même série, soit à peu près le jour sur dix où il y avait
vraiment du monde. Sur la page de l’attraction, les deux sont donnés pour le
jour de la semaine en cours, avec toute la semaine jour par jour en dessous.

Ce sont des centiles, pas des moyennes. Une
moyenne se laisse déplacer par une seule journée exceptionnelle : un après-midi
avec une panne et 150 minutes d’engorgement tire vers le haut la moyenne d’un
mois entier, alors que pendant 29 jours on n’en a rien senti. La médiane ne
bronche même pas devant une journée pareille. Le record figure donc à part, avec sa
date, pour qu’on le voie sans qu’il touche aux deux autres chiffres.

Dans le classement de [Phantasialand](ref:phantasialand), plus une ligne
a de jours mesurés, plus elle pèse.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

Ces tableaux sont en direct. Dans quatre articles plus anciens,
les chiffres étaient tapés à la main dans des tableaux Markdown, répartis sur
six langues, et au bout de quelques semaines ils avaient discrètement divergé.

## Les mêmes 70 minutes un samedi et un mardi

Pour Taron, « habituel » et « chargé » figurent sur la page de l’attraction pour chaque jour de la
semaine séparément, et les week-ends se détachent clairement. Le samedi et le dimanche ont les valeurs les
plus hautes, le mardi la plus basse. Un samedi, les mêmes 70 minutes correspondent donc à une journée
ordinaire sur cette attraction. Un mardi, elles dépassent nettement ce qui y est normal.

Le mois déplace encore le repère. Sur l’ensemble du parc, et non pour Taron seul, juillet et août sont les mois chargés, et décembre se situait à peu près au même niveau sur les quelques jours que nous avons mesurés ce mois-là. Septembre est le mois le plus calme que nous ayons mesuré. Pour octobre, il n’y a encore que quelques jours.

```stats-widget slug=phantasialand show=months

```

## La journée a une forme

Tout le monde sait que c’est court à l’ouverture, que ça s’allonge une fois que
le reste du monde a fini son petit-déjeuner, et que ça redevient supportable
vers le soir. Où se situe exactement le point haut varie d’une
attraction à l’autre.

```hourly-profile-widget slug=phantasialand top=6

```

De cette forme naît le **rope drop** : filer dès l’ouverture vers une attraction précise, avant que les allées
ne se remplissent. Nous ne le proposons que si le pic d’une journée ordinaire
des 70 derniers jours atteint au moins 60 minutes et si le départ matinal en
fait gagner au moins 45.

L’autre recommandation, c’est l’alternative plus calme : l’heure à laquelle la file de
cette attraction est d’habitude la plus courte. Si elle tombe le soir, pas
besoin de se lever à sept heures. Les deux indications figurent sur la page de
chaque grande attraction assez mesurée, avec une heure concrète en heure du
parc.

## L’essentiel se joue avant le départ

Sur une attraction pour laquelle nous proposons le rope drop, l’heure te fait
gagner au moins trois quarts d’heure. La date décide de toute la journée.
Pendant les vacances d’été 2026 de Rhénanie-du-Nord-Westphalie, le mardi 18
août figurait au calendrier du Phantasialand en « Normal », le jeudi de la même
semaine en « Très élevée » (état en septembre 2026), et un calendrier ordinaire
n’en laisse rien voir. La différence vient des régions en vacances, d’un éventuel
pont accroché derrière, de la pluie et de ce qui se passe de l’autre côté de la
frontière.

Pour un parc près d’une frontière, les vacances d’à côté comptent aussi. Alors nous comptons les
régions dans un rayon d’environ 200 kilomètres et les marquons séparément dans
le calendrier.

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

Un tiret dans la dernière colonne signifie qu’aucun jour de semaine ne se
détache vraiment dans ce parc, ou que ses jours ont été mesurés trop
inégalement pour être comparés. Plusieurs jours indiqués veulent dire qu’ils sont aussi calmes les uns que les autres. Le même tableau, avec bien plus de parcs, est sur
la [page des meilleures périodes](/meilleure-periode-pour-visiter).

## À quoi sert une équipe de nuit

Afficher un temps d’attente en direct, c’est une requête. Une médiane sur chaque
mardi mesuré, elle, doit être prête avant que quelqu’un la demande. Chaque nuit, une chaîne de tâches se déroule donc, dans un ordre fixe,
parce que chaque étape s’appuie sur la précédente. À 02:00 UTC les centiles par
heure, à 03:00 les valeurs de référence par parc, à 04:30 l’agrégation de la
veille, à 05:15 les recommandations rope drop, qui lisent précisément cette
agrégation, à 05:30 « habituel » et « chargé » pour les grandes attractions. À
06:00, le modèle de prévision se réentraîne avec les temps
d’attente de la veille.

Par ailleurs, nous ne jetons aucun relevé. Les périodes
anciennes sont compressées, pas éclaircies. Jusqu’où remonte chaque analyse,
nous le fixons au cas par cas : pour « habituel » et « chargé », nous prenons
les 365 derniers jours, soit un tour d’année complet, et pour la recommandation
rope drop seulement les 70 derniers, pour suivre la saison. Notre série de mesures
commence le 26 décembre 2025, et la colonne des jours mesurés du tableau plus
haut compte à partir de là.

## Là où nous préférons ne rien dire

[Hansa-Park](ref:hansa-park), par exemple, ne donne ses temps d’attente que dans sa propre
application, et seulement pour les appareils connectés au wifi du parc. Il
n’existe aucune interface publique. Dans les données brutes, ce parc ressemble à
n’importe quel autre à trois heures du matin : aucune attraction ne remonte quoi
que ce soit. Si nous en tirions la conclusion évidente, toutes les attractions du parc y
seraient en « très faible », avec une moyenne de 0 minute et une prévision
fondée sur zéro observation. À la place, la page du parc porte une mention
disant qu’il n’y a rien à lire ici. Le parc lui-même est décrit dans le [guide du Hansa-Park](/blog/hansa-park-conseils).

La patinoire « Berliner Eislaufen » sur la Kaiserplatz du Phantasialand n’existe que pendant le Wintertraum, cette fois
du 14 novembre 2026 au 24 janvier 2027. En août, personne ne remonte rien à son sujet, parce
qu’il n’y a rien à remonter. Lire ce silence comme « ouvert » serait l’erreur
commode, et la page du parc l’a bel et bien commise une fois.
Quant aux mois d’exploitation que nous lisons dans nos propres mesures, nous ne
les nommons qu’après 330 jours d’observation : avant cela, aucun mois n’y figure, parce que « fonctionne
de décembre à avril » décrirait la période où nous avons mesuré par hasard.

## Ce que tu peux faire de 70 minutes

Si le chiffre à l’entrée est égal ou inférieur à la valeur habituelle de ce jour de la semaine, je fais la queue. S’il est nettement au-dessus, un coup d’œil à la courbe horaire plus haut vaut la peine.
Si on y trouve une valeur plus basse pour la fin d’après-midi ou le soir, tu fais d’abord une autre
attraction et tu reviens. Sur la page de Taron figure, en plus de la recommandation pour l’ouverture,
une seconde pour la fin de journée, parce que d’après nos mesures la file y redevient nettement plus
courte juste avant la fermeture.

Si tu préfères acheter du temps, tu paies 12 € pour un tour sur Taron avec le Quick Pass, d’après la
page d’information du Phantasialand (au 5 octobre 2026). Le pass ne s’achète que sur place, au service
client du Kaiserplatz, et le contingent est limité. Quand le chiffre est de toute façon normal pour ce
jour de la semaine, c’est rarement rentable. Je reviens sur le Quick Pass Ultimate dans le [guide du Phantasialand](/blog/phantasialand-temps-d-attente-conseils).

Pour une journée entière, il y a le [planificateur](/blog/planificateur). Tu y choisis tes attractions et tu reçois un ordre de passage établi d’après les temps d’attente prévus pour ce jour-là. Tu sais ainsi avant même de partir si tu les fais toutes avant la fermeture du parc.

## Où tout cela se trouve

La version longue, avec les fiches du site à lire en parallèle, est désormais une
page à part : [Comment fonctionne park.fan](/fr/comment-fonctionne-park-fan).
Chapitre par chapitre, on y voit ce qu’affiche une fiche d’attraction, comment
fonctionne l’échelle sous « habituel » et « chargé », comment les vacances
entrent dans le calendrier, comment on en tire une journée dans le planificateur
et les trois endroits où nous n’affirmons délibérément rien. Quatre situations
de visite concrètes s’y trouvent aussi, de la famille pendant les vacances
d’automne à la première fois dans un grand parc, en passant par l’abonné annuel
qui se demande s’il y va encore ce soir.

— Patrick
