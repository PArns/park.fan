---
title: 'Le planificateur : on calcule si ta journée au parc tient debout'
translationKey: trip-planner-launch
date: '2026-09-05'
author: patrick
mode: published
featured: true
excerpt: >-
  Un flux de temps d’attente te dit la longueur de la file maintenant. Il ne te
  dit pas si ta liste tiendra jusqu’à la fermeture. C’est à ça que sert le
  planificateur : tes attractions sur une frise, chaque bloc aussi haut que
  l’attente prévue, et la marche entre les deux.
tags:
  - park-fan
  - planificateur
  - temps-d-attente
  - conseils
  - orlando
  - coulisses
category: news
parkLinks:
  # Hansa-Park a droit à son propre paragraphe sur l’absence de boutons dans le
  # planificateur. C’est exactement la question que se pose un lecteur sur cette
  # page de parc.
  - magic-kingdom-park
  - hansa-park
rideLinks: false
coverImage:
  src: /media/disney-hollywood-studios/fantasmic-crowd-16x9.jpg
  alt: 'Un théâtre en plein air bondé vu de l’arrière, le public attend dans le noir'
  caption: 'Fantasmic aux Hollywood Studios, juste avant le début. Dix mille personnes qui, pendant cette demi-heure, ne font la queue nulle part.'
  credit: 'Patrick Arns'
seo:
  title: 'Un planificateur pour les parcs : compter les files avant de partir'
  description: >-
    Le nouveau planificateur de park.fan pose tes attractions sur une frise,
    calcule avec les attentes prévues, connaît l’heure d’ouverture de chaque
    attraction et les distances entre elles. Sans compte, tout dans ton
    navigateur.
  keywords:
    - planifier une journée parc
    - planificateur parc attractions
    - planifier les temps d’attente
    - Magic Kingdom planifier une journée
    - Orlando organiser sa journée
    - ordre des attractions
    - rope drop
---

Le plan qu’on a en tête tient jusque vers deux heures de l’après-midi. À ce
moment-là tu as fait trois attractions sur huit, tu es dans la mauvaise file et
tu sais que ça ne passera pas. Le chiffre au-dessus de l’entrée est juste depuis
le début. Il l’est presque toujours. Il ne dit simplement rien sur le fait que
le reste de ta liste arrive encore aujourd’hui.

Dans un parc compact, ça te coûte une attraction, et tu la feras la prochaine
fois. Dans un parc qui ouvre à huit heures du matin et ne ferme qu’à onze heures
du soir, qui compte une douzaine d’attractions où une heure de file n’a rien
d’exceptionnel, et où deux d’entre elles sont à dix minutes de marche l’une de
l’autre, ça te coûte la moitié de la liste. Qui a passé une journée à Orlando
sans ordre connaît la fin : beaucoup marché, peu roulé, et le soir la moitié
n’est pas cochée. Pas parce qu’il y avait trop de monde, mais parce que l’ordre
était mauvais.

C’est précisément le trou qu’avait park.fan. « Combien de temps d’attente en ce
moment », on y répond depuis le premier jour. « Est-ce beaucoup pour un mardi »,
depuis [l’été dernier](/blog/70-minutes-est-ce-beaucoup). La troisième question
n’était nulle part : est-ce que ma journée tient debout ?

Depuis cette semaine, elle y est. Le [planificateur](/planificateur) pose tes
attractions sur une frise et calcule la journée avant que tu partes.

## Une journée est un ordre, et cet ordre a une horloge

L’idée se raconte vite. Un bloc est une attraction, et sa hauteur est l’attente
prévue pour son heure. Fais-le glisser vers une heure plus chargée, il grandit.
Vers une heure plus calme, il rétrécit. La journée, elle, ne s’allonge ni ne se
raccourcit, elle se déplace, et ça se voit.

Entre deux blocs se trouve le transfert : la distance et le fait que le temps
suffise ou non. Le chemin depuis la station et le tour lui-même sont dans cet
intervalle et pas dans le bloc, parce qu’ils relèvent du déplacement et pas de
la file.

Ça ressemble à un détail, et ça change la façon de regarder une journée. Une
liste de huit attractions ne dit rien sur la possibilité d’en faire huit ce
jour-là. Huit blocs sur une frise qui se termine à onze heures du soir le disent
tout de suite.

![Le planificateur avec une journée préparée à Magic Kingdom : dix blocs sur une frise à partir de 8 h, séparés par des transferts indiquant distance et temps de marche. | Dix attractions un samedi de septembre, mises dans cet ordre par le planificateur lui-même.](/media/tagesplaner/planer-tag-fr.webp)

Dix attractions, de l’ouverture à seize heures, et sous le plan la somme : cinq
heures et quart rien qu’à faire la queue. C’est la version que l’optimiseur a
jugée la meilleure. Sans ordre, tu attends tout autant et tu montes moins.

## Entre deux attractions, il y a un chemin

Un flux de temps d’attente peut dire qu’une attraction affiche cinquante
minutes. Ce qu’il ne peut pas dire, c’est que depuis l’endroit où tu es, tu n’y
seras plus à temps. C’est à ça que sert le transfert.

Le calcul part de la distance entre les coordonnées des deux attractions, plus
trois minutes pour sortir de la station et trois pour l’embarquement et le tour
là où aucune durée n’est renseignée. La distance est à vol d’oiseau, et le
planificateur le dit. C’est une borne basse et pas un temps de marche : les
allées contournent l’eau, les files et les sens uniques, certains parcs empilent
leurs zones, et dans un grand parc la ligne droite traverse volontiers un lac
qu’il faut longer. Pour la borne haute, le planificateur compte donc en rythme
de parc plutôt qu’en rythme de marche et ajoute deux tiers de détour à la ligne
droite.

Dans un parc compact, un transfert mal placé coûte trois minutes et personne ne
le remarque. Dans un grand, il coûte un quart d’heure. Fais-le huit fois dans la
journée et tu as marché deux heures qui n’apparaissent dans aucune statistique
d’attente.

Quand un transfert indique « juste », ça ne veut pas dire que ça a l’air serré.
Ça veut dire que ce transfert ne passe plus si la prévision se trompe autant
qu’elle l’annonce elle-même. L’API connaît cet écart pour chaque attraction, et
c’est ici que la dispersion devient une information utilisable.

## « Venir tôt » ne vaut pas pour toutes les attractions

Le conseil qu’on lit partout tient en une phrase : la grosse attraction
d’abord, juste après l’ouverture. Parfois c’est vrai. Souvent non, et lequel des
deux s’applique n’apparaît qu’en regardant les heures une par une.
[Magic Kingdom](ref:magic-kingdom-park) s’y prête bien, parce que sa journée est
assez longue pour que les courbes s’écartent nettement.

```hourly-profile-widget slug=magic-kingdom-park top=8

```

Il y a là trois profils, et chacun appelle une réponse différente.
[TRON](ref:magic-kingdom-park/tron-lightcycle-run) est cher toute la journée et
le devient davantage vers le soir. Y aller tôt n’est jamais une erreur ici, mais
ça ne le rend pas bon marché pour autant : ça reste la plus longue file de ta
journée. [Jungle Cruise](ref:magic-kingdom-park/jingle-cruise) fait l’inverse et
s’effondre en fin de soirée, donc s’y mettre l’après-midi coûte plusieurs fois
le même tour. Et
[Big Thunder](ref:magic-kingdom-park/big-thunder-mountain-railroad) reste au
même prix pendant des heures, ce qui en fait le remplissage des trous que les
deux autres laissent.

Une règle générale ne peut pas donner ces trois réponses, puisqu’elle traite les
trois attractions pareil. Il n’y a donc aucune règle de rope drop dans le
planificateur ; le code ne connaît même pas le terme.

```glossary-widget slug=rope-drop

```

Ce qu’il connaît, c’est la courbe horaire de chaque attraction. Là où elle est
au plus bas juste après l’ouverture, « la grosse d’abord » sort toute seule. Là
où elle est plate, autre chose sort, et c’est la bonne réponse à cet endroit.

Autre chose qu’on intègre rarement de tête : la première heure n’est souvent pas
la tienne. Beaucoup de parcs ouvrent leurs portes avant qu’une partie des
attractions tourne, et les grosses sont volontiers parmi les dernières à
démarrer. Remplis cette première heure avec elles et tu as planifié une heure
qui n’existe pas. Le planificateur connaît l’heure d’ouverture de chaque
attraction et ne laisse aucun bloc glisser avant. Il n’y a pas d’équivalent en
sens inverse : aucun flux n’annonce de façon fiable quand une attraction ferme
le soir, donc rien n’est écrit là-dessus.

## Deux boutons trient la journée

Sous la frise, deux boutons. « Planifier toutes les attractions phares » ajoute
les grosses attractions du parc qui ne sont pas encore dans la journée, puis
trie l’ensemble. « Optimiser la journée » n’ajoute rien et réorganise seulement
ce qui est déjà là. Derrière les deux tourne le même calcul. Ce sont deux
boutons parce que ce sont deux questions : remplis-moi la journée, et l’ordre
peut-il être meilleur.

Le tri pèse trois choses, et leur hiérarchie est la vraie décision.

1. **Tout doit passer avant la fermeture.** Un plan avec une attraction de moins
   qui a vraiment lieu bat un plan avec une de plus qui n’arrivera pas. Et si
   quelque chose saute, ça saute par la fin : d’abord ce que le bouton vient
   d’ajouter, jamais ce que tu avais prévu toi-même.
2. **La somme des attentes.** C’est ce qui était demandé.
3. **L’heure à laquelle tu fais la queue pour la dernière fois.** À coût égal,
   c’est l’ordre qui finit le plus tôt qui gagne.

Dans un parc avec plus d’attractions phares qu’il n’en tient dans une journée,
le point un est tout le jeu. C’est pour ça que le bouton ne disparaît pas
toujours après une pression : s’il reste une attraction sans place, le compte
s’affiche en dessous et l’offre reste là au cas où tu supprimerais autre chose.

Il n’y a volontairement aucun curseur qui arbitre entre faire la queue et
traîner. Personne ne pourrait justifier ce chiffre, et la première personne à le
contester aurait raison.

Une conséquence me plaît beaucoup, parce que personne ne l’a programmée : le
planificateur t’envoie parfois boire un café. Si tu devais attendre cinquante
minutes maintenant mais seulement quinze une demi-heure plus tard, alors flâner
et attendre coûtent ensemble moins qu’attendre seul. Même attraction, moins de
file, et tu es quand même libre plus tôt.

Ce que l’optimiseur ne touche pas : ta pause déjeuner, toute attraction que tu as
déjà cochée, et tout bloc dont l’heure a déjà commencé. Ce dernier point nous a
occupés un moment, parce que c’est la différence entre « je te réorganise
l’après-midi » et « remets-toi au bout de la file, s’il te plaît ». Qui appuie à
quatorze heures est à quatorze heures dans une file, et celle-là, plus personne
ne la déplace.

Et comme une pression peut transformer trois blocs en onze, il y a une annulation
à côté du résultat. Une fois, pas à volonté, mais la fois dont on a besoin.

## Ce que le planificateur ignore, il le dit

Le plus long travail sur un objet pareil, ce sont les quatre endroits où il
affirme volontairement moins qu’il ne pourrait.

**La prévision se trompe, et de façon mesurable.** Chaque bloc sélectionné
indique de combien les prévisions pour cette attraction se sont écartées en
moyenne de ce que la journée a réellement apporté. « Typique » veut dire
littéralement ce que ça dit : la moitié des jours tombe plus loin. Le chiffre
est donc présenté comme une erreur typique et jamais comme une fourchette qui
contiendrait déjà la bonne réponse.

**Les horaires de spectacle sont deux choses différentes.** Ce que le parc a
publié pour aujourd’hui est une annonce. Ce que nous avons reporté depuis le
dernier jour de semaine comparable est une supposition, et le planificateur la
dessine plus doucement : un tilde devant l’heure, un trait pointillé et la date
d’où viennent les horaires. Personne au monde ne connaît les horaires de
spectacle du samedi en huit.

**Certains parcs, nous ne pouvons pas les mesurer du tout.**
[Hansa-Park](ref:hansa-park) ne diffuse ses temps d’attente que dans sa propre
application, sur le wifi du parc. Chez nous, aucun chiffre n’arrive de là. Dans
les données, un parc sans source ressemble exactement à un parc fermé pour la
nuit ; le planificateur tire donc cette information directement de l’API et
masque là-bas les deux boutons de tri. Si chaque attraction coûte le même
chiffre inventé, tous les ordres se valent, et un bouton qui ne change rien
serait une promesse.

**Une journée passée reste.** Le calendrier te laisse rouvrir un jour où tu
avais planifié quelque chose, et les boutons automatiques n’y sont plus. Tout ce
qui se fait à la main continue : déplacer, cocher, supprimer. Une journée vécue
est un enregistrement, et le fait que tu étais vraiment dans cette file à une
heure est la raison pour laquelle elle est conservée.

## Il vit dans ton navigateur

Il n’y a ni compte, ni inscription, ni connexion. Ton plan est dans ton
navigateur, et c’est le réglage par défaut, pas la version au rabais. Si tu
nettoies les données du navigateur, il disparaît. Si tu ouvres park.fan sur ton
téléphone, c’est un autre plan.

La seule exception, ce sont les notifications push. Pour pouvoir te dire qu’il
est temps d’y aller, le plan doit se trouver sur notre serveur, et le
planificateur écrit ce que ça implique : qui a le lien peut le lire et le
modifier. Aucun mot de passe ne protège ça. Qui n’en veut pas laisse les
notifications désactivées et ne perd rien d’autre.

Deux choses encore, faciles à manquer. Un onglet est accroché au bord de
l’écran sur chaque page et ouvre le planificateur, même quand rien n’est encore
prévu. Et sur ordinateur, tu peux ouvrir une deuxième colonne, ce qui met deux
journées côte à côte. Je l’ai construit pour exactement une phrase : « et ça
donnerait quoi samedi ».

## Par où commencer

L’entrée passe par trois questions. Quel parc, quel jour, et qui vient.

La première est un champ de recherche, et derrière se cache un détail qui part
vite de travers. Tape « Disneyland » et tu obtiens cinq parcs sur trois
continents qui portent tous ce nom.

![Première étape de l’assistant : « Disneyland » saisi dans le champ de recherche, cinq parcs de cinq pays en dessous. | Un nom, cinq parcs. C’est pour ça que le planificateur retient le chemin de l’API et pas le nom.](/media/tagesplaner/planer-wizard-park-fr.webp)

Un plan est rangé sous le chemin que l’API renvoie elle-même, jamais sous un
chemin fabriqué à partir du nom affiché. « Pays-Bas » ne s’écrit pas pareil dans
toutes les langues, et un chemin deviné est un plan qui pointe vers une 404.

La deuxième question est la plus intéressante : au lieu d’une liste déroulante de
soixante lignes, tu obtiens un mois entier, et chaque jour porte la fréquentation
prévue de ce parc. « Le samedi en huit » devient affaire d’un coup d’œil, et ce
que nous savons d’autre à son sujet est sous la grille.

![Deuxième étape de l’assistant : une photo du Disneyland Park d’Anaheim au-dessus d’une grille mensuelle où chaque jour porte la fréquentation prévue, samedi 19 sélectionné. | Un septembre annoncé calme d’un bout à l’autre à Anaheim. Soixante lignes d’une liste déroulante ne montrent jamais ça.](/media/tagesplaner/planer-wizard-tag-fr.webp)

La troisième question a l’air d’un formulaire et compte plus qu’il n’y paraît :
prévoir le déjeuner, des enfants viennent-ils, voulez-vous rester secs. Les trois
sont des marques sur la liste des attractions et pas des filtres, et le
planificateur l’écrit sur la carte : les attractions à taille minimale plus
élevée sont signalées, pas masquées. Un filtre raccourcirait le parc en douce, et
savoir si mamie tient les sacs, ça, il n’y a que toi.

![Troisième étape de l’assistant : trois cartes pour le déjeuner, les enfants et les attractions aquatiques, avec le bouton d’ouverture du planning en dessous. | Trois réponses qui ne raccourcissent pas le parc. La pause déjeuner arrive comme bloc à 12h30 et se déplace.](/media/tagesplaner/planer-wizard-wer-fr.webp)

Ensuite tu atterris sur la page du parc avec le planificateur ouvert, et de là tu
fais glisser des attractions sur la frise. Chaque page d’attraction a aussi un
bouton pour ça, quand glisser n’est pas pratique.

Comment un bloc arrive à sa hauteur, ce que veut dire « D’après la prévision du
jour » et comment se calcule un transfert : tout est sur la
[page du planificateur](/planificateur), avec une vraie réponse d’API figée que
tu peux manipuler. Rien là-bas ne touche à ton propre plan.

Et si quelque chose te semble bancal au passage, un temps de marche qui ne colle
pas ou un transfert qui n’aurait jamais tenu dans la vraie vie : écris-moi,
l’adresse est dans les [mentions légales](/impressum). Les chemins sont la partie
que nous mesurons le plus mal, et quelqu’un qui est sur place à cet instant le
sait mieux que n’importe quel calcul.

— Patrick
