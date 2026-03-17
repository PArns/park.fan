import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: "Temps d'attente",
    shortDefinition:
      "Le temps estimé qu'un visiteur doit passer en file avant d'accéder à une attraction.",
    definition:
      "Le temps d'attente est la durée estimée qu'un visiteur passe en file d'attente avant de pouvoir embarquer sur une attraction. Les parcs affichent les temps d'attente aux entrées des attractions et sur leurs applications. park.fan suit les temps d'attente en direct mis à jour chaque minute.",
    relatedTermIds: ['posted-wait-time', 'virtual-queue', 'single-rider', 'express-pass'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Une file séparée pour les visiteurs acceptant de voyager seuls afin de remplir les places vides.',
    definition:
      "La file Single Rider permet aux visiteurs acceptant de voyager seuls de remplir les sièges vides dans les véhicules d'attractions. Comme les passagers en Single Rider comblent les espaces libres, la file avance beaucoup plus vite que la file standard — souvent 50 à 70 % de temps d'attente en moins. Toutes les attractions ne proposent pas cette option ; vérifiez avant de rejoindre la file.",
    relatedTermIds: ['wait-time', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'virtual-queue',
    name: "File d'attente virtuelle",
    shortDefinition:
      "Un système de file numérique où les visiteurs réservent un horaire plutôt que d'attendre physiquement.",
    definition:
      "Une file d'attente virtuelle permet aux visiteurs de s'inscrire pour une attraction via une application ou une borne et de recevoir une notification quand leur tour approche. Au lieu de faire la queue physiquement, les visiteurs peuvent profiter d'autres zones du parc et revenir lorsqu'ils sont appelés.",
    relatedTermIds: ['express-pass', 'wait-time', 'single-rider'],
    aliases: ["Files d'attente virtuelles"],
  },
  {
    id: 'express-pass',
    name: 'Pass Express',
    shortDefinition:
      'Un upgrade de billet payant ou inclus donnant accès à une file prioritaire plus courte.',
    definition:
      "Un Pass Express (le nom varie selon les parcs — Universal Express, Disney Lightning Lane, etc.) est un upgrade qui permet aux détenteurs d'utiliser une entrée prioritaire dédiée avec des attentes nettement plus courtes. Utilisez le calendrier d'affluence de park.fan pour décider si un Pass Express vaut son coût.",
    relatedTermIds: ['virtual-queue', 'single-rider', 'wait-time'],
  },
  {
    id: 'posted-wait-time',
    name: "Temps d'attente affiché",
    shortDefinition: "Le temps d'attente officiel affiché par le parc à l'entrée d'une attraction.",
    definition:
      "Le temps d'attente affiché est l'estimation officielle visible sur les panneaux à l'entrée physique d'une attraction et/ou dans l'application officielle du parc. park.fan agrège les temps d'attente affichés depuis les sources officielles chaque minute.",
    relatedTermIds: ['wait-time', 'crowd-level'],
  },
  {
    id: 'crowd-level',
    name: "Niveau d'affluence",
    shortDefinition:
      "Une mesure de l'affluence dans un parc à thème un jour donné, de Très Faible à Extrême.",
    definition:
      "Le niveau d'affluence décrit la densité globale de visiteurs dans un parc un jour ou une heure donnés. park.fan utilise une échelle de Très Faible à Extrême basée sur les données historiques de temps d'attente, l'occupation actuelle et les prévisions IA.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ["Niveaux d'affluence"],
  },
  {
    id: 'crowd-calendar',
    name: "Calendrier d'affluence",
    shortDefinition:
      "Une prévision jour par jour montrant les niveaux d'affluence prédits pour aider à planifier sa visite.",
    definition:
      "Un calendrier d'affluence est un calendrier mensuel ou annuel montrant les niveaux d'affluence prévus pour chaque jour. park.fan génère des calendriers d'affluence à l'aide de modèles IA entraînés sur des années de données historiques de temps d'attente, combinées avec les calendriers scolaires, les événements à venir et les tendances saisonnières.",
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
  },
  {
    id: 'peak-day',
    name: 'Jour de pointe',
    shortDefinition:
      "Un jour avec une fréquentation maximale, généralement lors de jours fériés ou d'événements spéciaux.",
    definition:
      "Un jour de pointe est tout jour où la fréquentation est à ou proche de la capacité maximale du parc. Les jours de pointe courants incluent les grands jours fériés (Noël, Pâques, grandes vacances), les journées d'événements spéciaux et les semaines de vacances scolaires. park.fan met en évidence les jours de pointe dans le calendrier d'affluence.",
    relatedTermIds: ['crowd-level', 'crowd-calendar', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Rénovation',
    shortDefinition:
      'Une période de fermeture planifiée pendant laquelle une attraction subit une maintenance ou des améliorations.',
    definition:
      'Une rénovation est une période de maintenance ou de travaux programmée pendant laquelle une attraction, un spectacle ou une zone du parc est temporairement fermé. Les rénovations peuvent durer de quelques jours à plusieurs mois. park.fan indique les attractions en cours de rénovation pour que vous puissiez en tenir compte dans votre planification.',
    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: "Temps d'arrêt",
    shortDefinition:
      "Une fermeture temporaire non planifiée d'une attraction, souvent due à une panne technique.",
    definition:
      "Le temps d'arrêt désigne une fermeture temporaire non programmée d'une attraction — à distinguer d'une rénovation planifiée. Les temps d'arrêt sont causés par des pannes techniques, des vérifications de sécurité, des incidents ou des conditions météorologiques défavorables. park.fan affiche l'état opérationnel actuel de chaque attraction en temps réel.",
    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: "Capacité d'attraction",
    shortDefinition: "Le nombre de visiteurs qu'une attraction peut accueillir par heure.",
    definition:
      "La capacité d'une attraction est le nombre maximum de visiteurs qu'elle peut transporter par heure dans des conditions optimales. La capacité dépend de la taille des véhicules, du nombre de véhicules en circulation, de la vitesse de chargement et de la durée du cycle. La capacité détermine directement la vitesse d'avancement de la file.",
    relatedTermIds: ['wait-time', 'downtime', 'refurbishment'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Le moment où un parc ouvre officiellement ses portes et où les files pour les attractions populaires sont les plus courtes.',
    definition:
      "Le Rope Drop désigne le moment où un parc à thème ouvre pour la journée — tirant son nom de la corde (ou barrière) que le personnel abaisse pour laisser entrer les premiers visiteurs. Arriver au Rope Drop est une stratégie populaire car les attractions populaires ont les files les plus courtes tôt le matin, avant que les foules n'affluent. Le planning de park.fan indique les heures d'ouverture exactes pour vous aider à préparer votre stratégie.",
    relatedTermIds: ['crowd-calendar', 'wait-time', 'crowd-level'],
  },
  {
    id: 'early-entry',
    name: 'Entrée anticipée',
    shortDefinition:
      "Un avantage exclusif permettant aux clients des hôtels du resort d'entrer dans le parc avant l'ouverture générale.",
    definition:
      "L'entrée anticipée (aussi appelée Extra Magic Hours ou Magic Morning) permet aux clients des hôtels partenaires d'accéder au parc 30 à 60 minutes avant le public général. Pendant cette fenêtre, les files d'attente aux attractions populaires sont nettement plus courtes. Les jours de forte affluence, combiner l'entrée anticipée avec un plan de visite intelligent permet de profiter de plusieurs attractions phares avec peu d'attente.",
    relatedTermIds: ['rope-drop', 'express-pass', 'peak-day'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Un supplément de billet permettant de visiter plusieurs parcs du même resort dans la même journée.',
    definition:
      "Un Park Hopper permet d'entrer dans deux parcs ou plus exploités par le même resort lors d'une même journée. L'option Park Hopper de Disney, par exemple, permet de passer entre Magic Kingdom, EPCOT, Hollywood Studios et Animal Kingdom après 14h. Universal propose un système similaire de billet multi-parcs. C'est particulièrement intéressant lorsque des attractions ou des expériences spécifiques sont réparties sur plusieurs parcs.",
    relatedTermIds: ['season-pass', 'rope-drop', 'crowd-calendar'],
  },
  {
    id: 'season-pass',
    name: 'Abonnement annuel',
    shortDefinition:
      'Un ticket annuel donnant droit à un nombre illimité de visites pendant 12 mois.',
    definition:
      "Un abonnement annuel (Annual Pass) donne accès illimité à un ou plusieurs parcs sur une période de 12 mois. Les niveaux supérieurs incluent souvent des avantages comme des réductions sur la restauration, le parking gratuit ou des remises sur les produits dérivés. Certains abonnements comportent des dates bloquées (blockout dates) les jours de forte affluence. Pour les visiteurs réguliers — généralement trois visites ou plus par an — l'abonnement est presque toujours plus avantageux que les billets individuels.",
    relatedTermIds: ['park-hopper', 'peak-day', 'express-pass'],
  },
  {
    id: 'height-requirement',
    name: 'Taille minimale',
    shortDefinition:
      'Une taille minimale que les visiteurs doivent atteindre pour accéder à une attraction.',
    definition:
      "La taille minimale est une règle de sécurité imposée par les parcs pour garantir que les systèmes de retenue — harnais, barres de maintien, ceintures — fonctionnent correctement pour chaque passager. Elle varie généralement entre 90 et 140 cm selon l'intensité de l'attraction. Certaines attractions ont également une taille ou un poids maximal. Vérifiez toujours les tailles minimales avant de visiter avec de jeunes enfants pour éviter les déceptions.",
    relatedTermIds: ['ride-capacity', 'refurbishment'],
  },
  {
    id: 'themed-land',
    name: 'Univers thématique',
    shortDefinition:
      "Une zone autonome au sein d'un parc à thème construite autour d'un thème cohérent.",
    definition:
      "Un univers thématique est une zone distincte d'un parc à thème qui réunit un design visuel unifié, une histoire de fond et des attractions, restaurants et boutiques assortis. Parmi les exemples célèbres figurent Le monde sorcier de Harry Potter chez Universal, Star Wars : Galaxy's Edge chez Disney ou Adventureland à Disneyland Paris. Ces univers créent une expérience immersive et constituent souvent les zones les plus photographiées du parc.",
    relatedTermIds: ['ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      "L'ouverture non officielle d'une attraction avant sa date de lancement annoncée.",
    definition:
      "Un Soft Opening se produit lorsqu'un parc ouvre discrètement une nouvelle attraction ou zone avant la date officielle — souvent sans annonce. Les parcs utilisent les Soft Openings pour tester leurs systèmes en conditions réelles, détecter les problèmes opérationnels et affiner les procédures d'embarquement. Comme ils peuvent commencer et s'arrêter sans préavis, ils constituent un bonus pour les visiteurs présents ce jour-là, mais pas une base de planification fiable. Les forums et les réseaux sociaux sont généralement les premiers à les signaler.",
    relatedTermIds: ['refurbishment', 'downtime', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      "La file d'attente classique d'une attraction, sans réservation ni pass spécial.",
    definition:
      "La file Standby est la file d'attente physique standard accessible à tous les visiteurs sans ticket supplémentaire ni upgrade. Ceux qui font la Standby attendent dans l'ordre d'arrivée — le temps affiché reflète directement l'affluence actuelle à l'attraction. Les jours chargés, les temps de Standby pour les attractions phares peuvent dépasser 90 minutes. park.fan suit les temps de Standby en temps réel pour vous aider à trouver la file la plus courte à tout moment.",
    relatedTermIds: ['wait-time', 'single-rider', 'virtual-queue', 'express-pass'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      "Le système d'accès prioritaire payant de Disney, successeur du programme FastPass+.",
    definition:
      "Lightning Lane est le nom donné par Disney à son système de file prioritaire, introduit en 2021 pour remplacer le programme gratuit FastPass+. Il existe en deux formules : Individual Lightning Lane (ILL), vendu séparément pour les attractions les plus demandées, et Lightning Lane Multi Pass (LLMP), un abonnement journalier permettant de réserver des créneaux de retour sur une sélection d'attractions. La Lightning Lane a suscité de nombreux débats car elle transforme un avantage autrefois gratuit en service payant. Le calendrier d'affluence de park.fan vous aide à juger les jours où la Lightning Lane vaut son prix.",
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      "L'ancien abonnement journalier de Disney donnant accès à la Lightning Lane Multi Pass sur la plupart des attractions.",
    definition:
      "Genie+ (désormais rebaptisé Lightning Lane Multi Pass) était l'add-on journalier payant de Disney qui a remplacé FastPass+. Moyennant un tarif par personne et par jour, les visiteurs pouvaient réserver un créneau Lightning Lane à la fois sur une large sélection d'attractions. Les attractions phares étaient exclues et vendues séparément en Individual Lightning Lane. Le prix de Genie+ était dynamique et augmentait les jours les plus fréquentés. park.fan suit les niveaux d'affluence en détail pour vous aider à décider si l'abonnement en vaut la peine.",
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      "Un numéro d'allocation dans le système de file virtuelle, permettant l'accès à une attraction lorsque le groupe est appelé.",
    definition:
      "Un Boarding Group est une allocation numérotée au sein d'un système de file d'attente virtuelle, utilisé principalement pour les attractions les plus demandées où une file physique serait impraticable. Les visiteurs s'inscrivent via l'application du parc — souvent dès l'ouverture — et reçoivent un numéro de groupe. Lorsque ce numéro est appelé, ils disposent d'une fenêtre limitée pour se présenter à l'attraction. Les jours très fréquentés, tous les Boarding Groups peuvent être attribués en quelques minutes. Le système de Disney sur des attractions comme Tron Lightcycle Run ou Star Wars : Rise of the Resistance a popularisé ce concept dans toute la communauté des parcs.",
    relatedTermIds: ['virtual-queue', 'wait-time', 'lightning-lane'],
  },
  {
    id: 'off-peak',
    name: 'Hors-saison',
    shortDefinition:
      'Périodes de moindre fréquentation offrant des files plus courtes, des prix plus bas et une expérience plus sereine.',
    definition:
      "La hors-saison correspond aux périodes plus calmes du calendrier, lorsque les écoles sont en session et qu'aucun grand jour férié ne tombe — typiquement janvier à début février, mi-septembre à octobre (hors événements Halloween) et les premières semaines de novembre. En hors-saison, les temps d'attente pour les attractions populaires peuvent être nettement plus courts, les prix des billets souvent au plus bas et les parcs bien moins bondés. Pour les visiteurs disposant d'un emploi du temps flexible, choisir la hors-saison est l'une des stratégies les plus efficaces. Le calendrier d'affluence de park.fan met en évidence ces fenêtres.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'offseason',
    name: 'Fermeture saisonnière',
    shortDefinition:
      'Période de fermeture saisonnière pendant laquelle le parc est entièrement fermé au public pour maintenance, travaux ou congés hivernaux.',
    definition:
      "La fermeture saisonnière (ou OffSeason) désigne la période pendant laquelle un parc à thème ferme complètement ses portes — non pas une simple période creuse, mais un véritable arrêt d'exploitation. Les parcs profitent de cette fenêtre pour effectuer les maintenances essentielles sur les attractions et équipements, engager des rénovations majeures impossibles en exploitation, et permettre au personnel de se reposer avant la nouvelle saison. Les fermetures saisonnières ont lieu le plus souvent en hiver et durent de quelques semaines à plusieurs mois selon le parc et son climat. Durant cette période, aucune attraction, restaurant ou spectacle n'est accessible au public.\n\nLorsque park.fan affiche le statut OffSeason pour un parc, cela signifie qu'aucun calendrier d'ouverture n'est disponible pour la période en cours et que la prochaine date d'ouverture confirmée est encore à plusieurs semaines. Consultez le site officiel du parc pour connaître la date exacte de réouverture — les parcs populaires affichent souvent complet dès les premiers jours de réouverture.",
    relatedTermIds: ['refurbishment', 'soft-opening', 'crowd-calendar'],
  },
  {
    id: 'ride-photo',
    name: 'Photo de manège',
    shortDefinition:
      "Une photo ou vidéo automatiquement prise des visiteurs pendant une attraction, disponible à l'achat à la sortie.",
    definition:
      "La photo de manège est une image capturée automatiquement par une caméra fixe à un moment clé de l'attraction — généralement la descente d'une attraction aquatique ou le sommet d'un grand huit. À la sortie, les visiteurs peuvent consulter leur photo à un kiosque ou dans l'application du parc et choisir de l'acheter. De nombreux parcs proposent des forfaits photos journaliers incluant toutes les photos de manège du resort. La photo de manège est un souvenir apprécié et un classique des partages sur les réseaux sociaux.",
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'queue-line',
    name: "File d'attente",
    shortDefinition:
      "La zone d'attente physique que les visiteurs traversent avant de monter sur une attraction, souvent aménagée de façon thématique.",
    definition:
      "La file d'attente est l'espace physique — couloirs, serpentins extérieurs ou salles intérieures — que les visiteurs parcourent en attendant d'embarquer sur une attraction. Dans de nombreux parcs modernes, la file fait elle-même partie de l'expérience : la file de la Haunted Mansion chez Disney crée l'atmosphère bien avant de monter dans le Doom Buggy, tandis que les attractions Harry Potter d'Universal plongent les visiteurs dans leur univers dès la file. Une file bien conçue rend l'attente beaucoup plus agréable, même lorsqu'elle est longue.",
    relatedTermIds: ['wait-time', 'standby-queue', 'single-rider'],
    aliases: ["Files d'attente", 'file', 'files'],
  },
  {
    id: 'opening-day',
    name: "Jour d'ouverture",
    shortDefinition:
      "La date officielle de lancement d'un nouveau parc, d'un univers thématique ou d'une attraction.",
    definition:
      "Le jour d'ouverture est la date officiellement annoncée à laquelle un nouveau parc, une extension ou une attraction ouvre ses portes au grand public pour la première fois. Ces jours sont des événements majeurs dans la communauté des parcs à thème : ils attirent généralement une forte couverture médiatique, de longues files et une atmosphère festive. Les parcs organisent souvent des cérémonies d'inauguration avec des spectacles et des apparitions de personnages. Comme le jour d'ouverture attire un grand nombre de visiteurs, ce n'est généralement pas le meilleur moment pour découvrir une nouvelle attraction avec peu d'attente. Des Soft Openings précèdent parfois la date officielle.",
    relatedTermIds: ['soft-opening', 'rope-drop', 'crowd-level'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      "Un système permettant aux accompagnateurs de se relayer sur une attraction pendant que l'autre attend avec les enfants qui ne remplissent pas les conditions de taille.",
    definition:
      "Le Rider Switch (appelé aussi Child Swap) est un système disponible dans la plupart des grands parcs à thème qui permet à un groupe de se relayer sur une attraction lorsqu'un membre — généralement un jeune enfant ne remplissant pas la taille minimale — ne peut pas participer. Un adulte monte sur l'attraction tandis que l'autre attend à l'entrée avec l'enfant ; lorsque le premier adulte revient, le second peut embarquer immédiatement sans reprendre la file d'attente. Chez Disney le système s'appelle Rider Switch ; chez Universal c'est Child Swap. Un jour chargé, le second adulte évite ainsi toute l'attente en Standby — un avantage non négligeable. Signalez-vous aux agents de l'attraction à l'entrée pour l'activer.",
    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Date',
    shortDefinition:
      "Une date à laquelle certains niveaux d'abonnement annuel ne sont pas valables pour l'entrée au parc, généralement les jours les plus fréquentés de l'année.",
    definition:
      "Les Blockout Dates (aussi appelées blackout dates) sont des jours précis du calendrier où certains niveaux d'abonnement annuel ne donnent pas droit à l'entrée. Les parcs appliquent ces restrictions pour gérer la capacité les jours les plus chargés — jours fériés, week-ends de pointe et dates d'événements majeurs. Les abonnements supérieurs ont peu ou pas de dates bloquées, tandis que les abonnements d'entrée de gamme peuvent être bloqués 30 à 60 jours par an. Vérifiez toujours le calendrier des restrictions avant de visiter si vous disposez d'un abonnement limité. Le calendrier d'affluence de park.fan met en évidence les périodes de pointe pour croiser avec les restrictions de votre abonnement.",
    relatedTermIds: ['season-pass', 'peak-day', 'crowd-calendar'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Événement à billet séparé',
    shortDefinition:
      "Un événement spécial à billet distinct (généralement en soirée) requérant une admission séparée du billet parc ordinaire, comme les fêtes d'Halloween ou de Noël.",
    definition:
      "Un événement à billet séparé est un événement — généralement en soirée — organisé dans un parc à thème et nécessitant un billet dédié en plus de l'entrée journalière classique. Ces événements proposent des animations exclusives, des décors thématiques et des expériences avec les personnages non disponibles pendant les heures normales d'ouverture. Parmi les exemples célèbres figurent le Mickey's Not-So-Scary Halloween Party et le Mickey's Very Merry Christmas Party à Walt Disney World, Halloween Horror Nights chez Universal, et les événements saisonniers de Disneyland Paris. Ces jours-là, les visiteurs ordinaires sont généralement invités à quitter le parc à 18h–19h. Les billets s'épuisent souvent des semaines à l'avance.",
    relatedTermIds: ['season-pass', 'peak-day', 'early-entry'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      "L'ancien système de file prioritaire gratuit de Disney, remplacé par la Lightning Lane payante en 2021.",
    definition:
      "Le FastPass+ (à l'origine FastPass, lancé en 1999) était le système de file prioritaire gratuit de Disney permettant aux visiteurs de réserver des créneaux de retour sur les attractions sans supplément. À Walt Disney World, les visiteurs pouvaient réserver jusqu'à trois FastPass+ par jour via l'application My Disney Experience avant d'en ajouter d'autres un par un. Le système a été suspendu lors de la fermeture COVID en 2020 et n'a jamais été rétabli — remplacé par la Lightning Lane payante fin 2021. Le FastPass+ reste l'un des changements les plus discutés de l'histoire Disney, car il a transformé un avantage gratuit en service payant. Comprendre l'ancien système est utile pour lire les anciens comptes rendus de visite.",
    relatedTermIds: ['lightning-lane', 'genie-plus', 'express-pass', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Heure de retour',
    shortDefinition:
      "Une fenêtre horaire réservée pour revenir sur une attraction, délivrée par la Lightning Lane, la file virtuelle ou un système similaire d'accès prioritaire.",
    definition:
      "Une heure de retour (parfois appelée fenêtre de retour) est un créneau horaire précis — généralement d'une heure — pendant lequel un visiteur ayant réservé un accès prioritaire (via la Lightning Lane, une file virtuelle ou un système similaire) peut se présenter à l'entrée dédiée de l'attraction. Les heures de retour permettent aux visiteurs de profiter d'autres zones du parc pendant l'intervalle plutôt que de faire la queue physiquement. Manquer sa fenêtre de retour (généralement définie par un retard de quelques minutes au-delà du créneau) entraîne en principe la perte de la réservation. Les données de temps d'attente et de niveau d'affluence de park.fan vous aident à décider quelles attractions prioriser pour les réservations.",
    relatedTermIds: ['lightning-lane', 'virtual-queue', 'fastpass', 'boarding-group'],
    aliases: ['Heures de retour'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      "Exclusive Ride Time — une session pendant laquelle un groupe d'enthousiastes ou de clients d'hôtel bénéficie d'un accès exclusif à une ou plusieurs attractions sans file publique.",
    definition:
      "L'ERT (Exclusive Ride Time) est une période pendant laquelle un groupe sélectionné — généralement des membres d'un club d'enthousiastes de montagnes russes, des clients d'hôtels du resort ou des détenteurs d'abonnements premium — bénéficie d'un accès exclusif à une ou plusieurs attractions sans public général. Pendant un ERT, les participants peuvent se relancer à volonté avec une attente minimale, réalisant parfois des dizaines de tours en une seule session. Les sessions ERT sont organisées par les parcs pour des événements de clubs spécialisés (comme l'European Coaster Club ou l'American Coaster Enthusiasts), pour des packages hôteliers premium, ou dans le cadre d'événements après fermeture. Pour les enthousiastes, l'ERT est l'une des expériences les plus prisées — elle révèle le vrai caractère d'une attraction sans la pression de la file.",
    relatedTermIds: ['hard-ticket-event', 'early-entry', 'rope-drop', 'credit'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      "Un itinéraire détaillé et optimisé pour une visite de parc à thème, séquençant les attractions pour minimiser les temps d'attente et maximiser le nombre de manèges dans la journée.",
    definition:
      "Un Touring Plan est une séquence pré-planifiée d'attractions, de repas et de déplacements dans le parc conçue pour minimiser le temps total d'attente dans la journée. Les bons Touring Plans tiennent compte des schémas d'affluence (quelles zones se remplissent en premier), des capacités des attractions, de la dynamique des files, des horaires de spectacles et de la météo. Des sites comme TouringPlans.com (désormais Thrill-Data) publient des plans détaillés collaboratifs pour les grands parcs. Les temps d'attente en direct et le calendrier d'affluence de park.fan sont des outils complémentaires : consulter les données en temps réel permet d'ajuster son plan en cours de journée. Les jours chargés, un bon Touring Plan peut réduire le temps total en file de 30 à 50 % par rapport à une visite spontanée.",
    relatedTermIds: ['crowd-calendar', 'rope-drop', 'wait-time', 'early-entry'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      "Une attraction intérieure dans laquelle les visiteurs se déplacent à bord de véhicules guidés à travers des décors thématiques, des effets spéciaux et des scènes animées dans l'obscurité.",
    definition:
      "Un dark ride est une attraction fermée où des véhicules guidés transportent les visiteurs à travers une succession de décors thématiques, d'effets lumineux et sonores, d'animatroniques et de projections dans un environnement obscur ou semi-obscur. Les dark rides vont des classiques comme les Fantômes d'Halloween de Disneyland aux aventures modernes à base de simulateurs et de tir, comme Men in Black à Universal. Le terme est utilisé en français dans la communauté des parcs, au même titre que dans les milieux professionnels. Les dark rides sont parmi les attractions les plus accessibles à tous les publics et figurent en bonne place parmi les incontournables des grands parcs référencés sur park.fan.",
    relatedTermIds: ['themed-land', 'soft-opening', 'vr-coaster'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      "Bolliger & Mabillard, fabricant suisse de montagnes russes réputé pour ses attractions lisses et fiables ainsi que ses éléments signature comme l'Immelmann, le cobra roll et le zero-G roll.",
    definition:
      "B&M (Bolliger & Mabillard) est un fabricant suisse de montagnes russes fondé en 1988 par Walter Bolliger et Claude Mabillard. La société est réputée pour produire des attractions d'une fluidité et d'une fiabilité exceptionnelles, caractérisées par des G-forces positives soutenues, des inversions signature (Immelmann, cobra roll, zero-G roll) et une excellente capacité d'accueil. B&M se spécialise dans les coasters inversés, les sit-down loopers, les hyper coasters (plus de 61 m), les giga coasters (plus de 91 m), les wing coasters et les dive machines. Presque tous les grands parcs européens possèdent au moins une installation B&M, dont Shambhala et Dragon Khan à PortAventura, Silver Star à Europa-Park, Nemesis à Alton Towers et Goliath au Walibi Holland.",
    relatedTermIds: ['immelmann', 'cobra-roll', 'zero-g-roll', 'dive-coaster', 'hybrid-coaster'],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      "Fabricant suisse de montagnes russes connu pour ses lancements hydrauliques records, ses mega/giga coasters et ses designs innovants — à l'origine de nombreuses attractions parmi les plus rapides et les plus hautes du monde.",
    definition:
      "Intamin AG est un fabricant d'attractions suisse fondé en 1967, responsable de certains des records les plus ambitieux de l'histoire des montagnes russes. Son système de lancement hydraulique a propulsé les coasters les plus rapides et les plus hauts du monde pendant des années (Kingda Ka, 139 m ; Top Thrill Dragster). Intamin est également connu pour ses mega et giga coasters (dont Millennium Force à Cedar Point et Intimidator 305 à Kings Dominion), ses multi-launch coasters, ses attractions aquatiques et ses dark rides. Ses designs sont souvent à la pointe de l'échelle et de l'innovation, même si la société a aussi la réputation d'une maintenance complexe. Les installations Intamin en Europe incluent Taron et Black Mamba à Phantasialand et Red Force au Ferrari Land.",
    relatedTermIds: ['launch-coaster', 'top-hat', 'b-and-m', 'mack-rides'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      "Fabricant familial allemand basé à Waldkirch près d'Europa-Park, produisant des attractions aquatiques, des dark rides et des coasters en acier de plus en plus ambitieux.",
    definition:
      "Mack Rides est un fabricant d'attractions allemand basé à Waldkirch, en Bade-Wurtemberg — à quelques kilomètres d'Europa-Park, la vitrine phare de la société. Fondé en 1921, Mack produit des attractions aquatiques, des dark rides (dont Test Track et Radiator Springs Racers pour Disney) et un portefeuille croissant de coasters à sensations. Son Blue Fire Megacoaster à Europa-Park (2009) a été la première attraction à intégrer un Stengel Dive. Les hyper coasters plus récents de Mack (Ride to Happiness à Plopsaland, Kondaa au Walibi Belgium) ont reçu des éloges unanimes de la communauté enthousiaste. Mack Rides occupe une place prépondérante dans les parcs européens, en particulier à Europa-Park, propriété de la famille Mack.",
    relatedTermIds: ['stengel-dive', 'b-and-m', 'intamin', 'launch-coaster'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Rocky Mountain Construction, fabricant américain pionnier du coaster hybride, transformant des montagnes russes en bois vieillissantes en pistes acier pour offrir airtime et inversions inédits.',
    definition:
      "Rocky Mountain Construction (RMC) est un fabricant et prestataire de maintenance américain basé à Hayden, Idaho, surtout connu pour avoir inventé le système de rails I-box en acier pouvant être posé sur des structures de coasters en bois existantes. Cette technologie de conversion permet aux parcs de transformer des montagnes russes en bois rugueuses et vieillissantes en attractions hybrides de classe mondiale intégrant airtime intense, inversions multiples et descentes au-delà de la verticale — des performances impossibles sur du bois traditionnel. Les conversions RMC comme Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) et Wildfire (Kolmården) sont rapidement devenues des coups de cœur des enthousiastes. En Europe, le nouveau-build hybride RMC Untamed au Walibi Holland est considéré comme l'un des meilleurs coasters du continent.",
    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      "Fabricant néerlandais de montagnes russes et l'un des plus prolifiques au monde, connu pour le Boomerang omniprésent ainsi qu'une large gamme de coasters familiaux et frissonnants dans les parcs européens.",
    definition:
      "Vekoma Rides Manufacturing est un fabricant néerlandais de montagnes russes basé à Vlodrop, aux Pays-Bas, et l'un des producteurs les plus prolifiques du monde en termes d'installations totales. Fondée en 1926 comme entreprise de génie mécanique, Vekoma s'est tournée vers les attractions en 1970 et a acquis une renommée mondiale avec son coaster Boomerang — un shuttle coaster compact à trois inversions, licencié à bas coût et installé dans des parcs du monde entier. Parmi les autres modèles emblématiques figurent le Suspended Looping Coaster (SLC), le Giant Inverted Boomerang et le Mine Train. À partir des années 2010, Vekoma s'est réinventé avec une nouvelle gamme moderne offrant des systèmes de conduite plus doux, des layouts innovants et des attractions familiales améliorées. Les nouvelles générations de Family Boomerang, de Tilt Coaster et de coasters familiaux suspendus apparaissent de plus en plus dans les parcs européens. Disney a également commandé des designs Vekoma personnalisés pour ses resorts.",
    relatedTermIds: ['boomerang', 'b-and-m', 'intamin', 'gerstlauer'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Fabricant allemand surtout connu pour son modèle Euro-Fighter avec sa première descente au-delà de la verticale, ainsi que pour ses spinning coasters et ses attractions familiales compactes.',
    definition:
      "Gerstlauer Amusement Rides GmbH est un fabricant allemand de montagnes russes basé à Münsterhausen, en Bavière. Fondée en 1946 comme entreprise de métallurgie, elle s'est lancée dans les attractions foraines dans les années 1980 et a bâti sa réputation mondiale avec le modèle Euro-Fighter — un coaster compact à lancement électrique célèbre pour sa descente initiale au-delà de la verticale (97 degrés). Les Euro-Fighters peuvent être installés dans des espaces réduits, ce qui les rend attrayants pour les parcs urbains et les petits sites ; citons Rage à Adventure Island et Speed à Oakwood. Gerstlauer produit également le modèle Infinity Coaster, des spinning coasters et le SkyRoller, un coaster rotatif où les passagers contrôlent leur propre retournement. Les enthousiastes apprécient les montagnes russes Gerstlauer pour leur intensité malgré leur faible encombrement.",
    relatedTermIds: ['euro-fighter', 'spinning-coaster', 'b-and-m', 'intamin'],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Légendaire fabricant allemand dont les coasters looping classiques des années 70 et 80 sont encore adorés dans les parcs européens pour leur expérience de conduite intense et parfaitement fluide.',
    definition:
      "Anton Schwarzkopf GmbH & Co. KG était un fabricant allemand de montagnes russes basé à Münsterhausen, en Bavière — la ville où Gerstlauer s'installa plus tard. Fondée par Anton Schwarzkopf en 1954, l'entreprise a joué un rôle déterminant dans l'introduction des coasters looping en Europe. La Revolution au Six Flags Magic Mountain (1976) était le premier coaster looping moderne du monde, conçu par Schwarzkopf. Les modèles phares incluent le Looping Star, le Thriller/Wildcat et le transportable Looping Coaster, qui a tourné dans toute l'Europe. Les coasters Schwarzkopf sont réputés pour leurs trajets d'une fluidité incomparable et l'efficacité élégante de leurs layouts — fruit d'une ingénierie précise. L'entreprise a fait faillite en 1983, mais de nombreuses installations restent en service des décennies plus tard, chéries par les parcs et les enthousiastes comme des classiques irremplaçables. L'entretien est aujourd'hui assuré par des entreprises spécialisées ou Gerstlauer, qui a racheté une partie des outillages.",
    relatedTermIds: ['b-and-m', 'intamin', 'gerstlauer', 'vekoma'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      "Un coaster qui accélère les visiteurs de 0 à haute vitesse via un système de lancement magnétique, hydraulique ou pneumatique plutôt qu'une remontée mécanique traditionnelle.",
    definition:
      "Un Launch Coaster remplace la remontée mécanique par un système de propulsion qui accélère le train d'un point fixe à sa vitesse maximale en quelques secondes. Les principales technologies sont : le lancement LSM (moteur synchrone linéaire) — des bobines électromagnétiques accélèrent une ailette sur le train ; le LIM (moteur à induction linéaire) — similaire mais moins efficace ; le lancement hydraulique — un câble piloté par piston utilisé par Intamin sur des coasters records comme Kingda Ka ; et les lancements à air comprimé. Certains coasters comportent plusieurs lancements successifs dans le circuit. L'accélération soudaine et puissante est une sensation définissante qu'une remontée mécanique ne peut pas reproduire.",
    relatedTermIds: ['lifthill', 'top-hat', 'intamin', 'horseshoe'],
  },
  {
    id: 'wooden-coaster',
    name: 'Montagnes russes en bois',
    shortDefinition:
      'Une montagne russe construite principalement en bois, caractérisée par son grondement distinctif, ses mouvements latéraux et son airtime imprévisible.',
    definition:
      "Les montagnes russes en bois sont des attractions dont la structure et la voie sont construites en bois. Contrairement aux coasters en acier, le bois possède une flexibilité naturelle qui crée le grondement caractéristique, le ballottement latéral et l'airtime imprévisible que les enthousiastes apprécient. Parmi les coasters en bois célèbres : Balder à Liseberg, The Beast à Kings Island et Megafobia à Oakwood. Les coasters en bois nécessitent un entretien constant — la voie doit être relaminée régulièrement — et sont sensibles aux variations climatiques. Le procédé de conversion RMC (Rocky Mountain Construction) peut transformer des coasters en bois vieillissants en coasters hybrides à voie acier tout en conservant la structure bois.",
    relatedTermIds: ['airtime', 'hybrid-coaster', 'rmc'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster hybride',
    shortDefinition:
      'Un coaster combinant une structure en bois traditionnelle avec une voie I-box en acier, concept pioneered par Rocky Mountain Construction (RMC).',
    definition:
      "Un coaster hybride associe la structure en bois d'un coaster traditionnel à une voie I-box en acier fabriquée par Rocky Mountain Construction (RMC). La voie I-box est extrêmement précise et lisse, permettant des éléments d'inversion impossibles sur une voie en bois classique. RMC a développé cette technologie principalement pour rénover des coasters en bois vieillissants — en ajoutant des inversions, des descentes plus raides et des airtime hills à des layouts auparavant trop rugueux. Les hybrides RMC célèbres incluent Steel Vengeance (Cedar Point, souvent cité comme le meilleur coaster du monde), Twisted Colossus (Six Flags Magic Mountain) et Wildfire (Kolmården). Des new-builds hybrides RMC comme Untamed au Walibi Holland existent désormais aux côtés des conversions.",
    relatedTermIds: ['wooden-coaster', 'rmc', 'airtime'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      "Un modèle de coaster Vekoma compact qui fait traverser aux visiteurs trois inversions deux fois — d'abord en marche avant, puis en marche arrière — dans un layout aller-retour.",
    definition:
      "Le Boomerang est l'un des modèles de montagnes russes les plus répandus dans le monde, fabriqué par Vekoma. Le layout comprend trois inversions — un looping vertical flanqué de deux sidewinders — parcourus d'abord en avant, puis en arrière après que le train a été remonté sur un second lift incliné et relâché en marche arrière à travers les mêmes éléments. Le trajet complet offre six inversions (trois dans chaque sens) dans un espace très réduit, ce qui le rend idéal pour les parcs disposant de peu de place. Plus de 50 Boomerangs ont été construits dans le monde ; le modèle est présent sur tous les continents habités. Malgré leur ancienneté, les Boomerangs restent populaires comme coasters d'initiation dans les parcs de taille moyenne.",
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Un modèle de coaster compact Gerstlauer avec une première descente quasi-verticale ou au-delà de la verticale lancée depuis un lifthill vertical, conçu pour offrir des sensations intenses dans un espace réduit.',
    definition:
      "L'Euro-Fighter est le modèle signature de coaster compact de Gerstlauer, reconnaissable à sa première descente verticale (90°) ou au-delà de la verticale (jusqu'à 97°) faisant suite à un lifthill vertical à chaîne. Conçus pour les parcs avec peu d'espace disponible, les Euro-Fighters concentrent des sensations intenses — inversions multiples, virages serrés, G-forces élevées — dans une empreinte réduite. La descente au-delà de la verticale (plus raide que la chute libre) est particulièrement remarquable : le train marque une pause au sommet, les passagers penchés au-dessus du vide avant la plongée. Les Euro-Fighters européens incluent Saw – The Ride à Thorpe Park, Rage à Adventure Island et Fluch von Novgorod à Hansa-Park.",
    relatedTermIds: ['first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      "Un type de coaster à train très large avec une descente quasi-verticale ou au-delà de la verticale, accompagnée d'une pause délibérée au sommet avant la plongée.",
    definition:
      "Un Dive Coaster se caractérise par un train large (généralement 8 à 10 passagers par rangée), une descente quasi-verticale ou au-delà de la verticale (90° ou plus) et une pause théâtrale au sommet — le train retient les passagers quelques instants au bord avant de les lâcher, maximisant l'anticipation psychologique. Le train large offre à tous les passagers une vue imprenable sur le vide. La gamme Dive Machine de B&M (Oblivion à Alton Towers, SheiKra à Busch Gardens) a popularisé le concept ; le modèle Dive Coaster de Gerstlauer en est une version concurrente. La pause délibérée avant la chute est une décision de conception consciente pour intensifier la tension et figure parmi les expériences les plus commentées dans les discussions sur les parcs à thème.",
    relatedTermIds: ['first-drop', 'b-and-m', 'euro-fighter', 'launch-coaster'],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'Une montagne russe équipée de casques de réalité virtuelle superposant une expérience animée ou de jeu synchronisée à la sensation physique du manège.',
    definition:
      "Un VR Coaster équipe les passagers de casques VR (généralement des Samsung Gear VR ou des dispositifs dédiés) qui affichent un environnement virtuel synchronisé avec les mouvements physiques du coaster. Lorsque le train tire des G-forces dans un looping, le monde virtuel reflète la sensation ; lorsque le train plonge, l'univers virtuel plonge également. Les VR Coasters ont connu un essor entre 2015 et 2019, de nombreux parcs équipant des attractions existantes. Le concept a eu un accueil mitigé : certains visiteurs apprécient l'overlay immersif, d'autres trouvent les casques inconfortables, peu hygiéniques ou inducteurs de mal des transports. De nombreux parcs ayant adopté le VR l'ont depuis retiré. Quelques installations (comme les VR Coasters de Mack Rides) proposent des expériences dédiées plus abouties.",
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      "La sensation d'apesanteur ou d'être soulevé de son siège ressentie sur les montagnes russes lors de moments de G-forces négatives.",
    definition:
      "L'Airtime décrit la sensation d'apesanteur — G-forces négatives — que les passagers d'une montagne russe ressentent lorsque le coaster franchit une colline ou une vallée plus rapidement que la chute libre. Il existe deux types principaux : le floater airtime (légères G négatives, douce sensation de flottement) et l'ejector airtime (G négatives intenses, où la barre de maintien ou la ceinture est la seule chose retenant le passager dans son siège). L'airtime est considérée comme la caractéristique déterminante des grands coasters en acier et en bois. Les airtime hills (aussi appelées camelbacks) sont spécifiquement conçues pour maximiser cette sensation en formant une trajectoire parabolique de chute libre.",
    relatedTermIds: ['airtime-hill', 'bunnyhop', 'first-drop', 'wooden-coaster'],
  },
  {
    id: 'inversion',
    name: 'Inversion',
    shortDefinition:
      "Tout élément sur une montagne russe où la voie fait pivoter les passagers à l'envers.",
    definition:
      "Une inversion est tout élément sur une montagne russe où la voie et le véhicule font pivoter les passagers au-delà du plan vertical — les plaçant au moins partiellement à l'envers. Les inversions courantes comprennent le looping vertical, le cobra roll, le tire-bouchon, l'immelmann, le dive loop, l'inline twist, le heartline roll et le zero-G roll. Les coasters modernes comportent couramment six à quatorze inversions dans un seul circuit. Le nombre d'inversions est l'une des statistiques clés décrivant l'intensité d'un coaster. Les inversions génèrent à la fois des G-forces positives (en bas des loops) et négatives (en haut), créant des sensations variées tout au long du trajet.",
    relatedTermIds: ['vertical-loop', 'cobra-roll', 'immelmann', 'zero-g-roll', 'corkscrew'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      "L'inversion classique en forme de cercle vertical complet, emmenant les passagers entièrement à l'envers au sommet.",
    definition:
      "Le looping vertical est l'inversion la plus iconique de l'histoire des montagnes russes — un cercle complet à 360° dans le plan vertical. Les loops modernes utilisent une forme clothoïde (en larme) plutôt qu'un cercle parfait : l'entrée et la sortie sont larges, tandis que le haut du loop est serré. Cette forme garantit que les passagers ressentent des G-forces régulières et soutenues plutôt que des pics extrêmes. Le premier coaster à loop moderne (Corkscrew, Knott's Berry Farm, 1975) a transformé l'industrie. Aujourd'hui les loopings verticaux ancrent le compteur d'inversions des coasters du monde entier, des attractions pour novices aux machines records.",
    relatedTermIds: ['inversion', 'immelmann', 'cobra-roll'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      "Un demi-looping qui propulse le train vers le haut et par-dessus, puis un demi-tonneau qui repart dans la direction opposée — nommé d'après le pilote de la Première Guerre mondiale Max Immelmann.",
    definition:
      "Le virage Immelmann est une inversion signature B&M en deux phases : la voie monte d'abord en demi-looping vertical, amenant les passagers par-dessus et brièvement à l'envers ; puis un demi-tonneau remet le train à l'endroit tout en inversant le cap de 180 degrés. L'élément porte le nom de l'as de l'aviation de la Première Guerre mondiale Max Immelmann, qui utilisait une manœuvre aérienne similaire. Les Immelmanns se distinguent car ils produisent à la fois une inversion impressionnante et un important changement de direction dans un seul élément fluide. On les retrouve sur presque tous les coasters B&M sit-down, inversés et hyper du monde entier.",
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop', 'b-and-m'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-g Roll',
    shortDefinition:
      "Un tonneau à 360° suivant un arc parabolique où les passagers ressentent une quasi-apesanteur au sommet — l'un des éléments les plus appréciés du design moderne de coasters.",
    definition:
      "Le zero-G roll (tonneau à gravité zéro) est un élément d'inversion dont la forme fait suivre au train un arc parabolique à travers la rotation — similaire dans le concept au heartline roll mais à plus grande vitesse et avec un déplacement vertical plus marqué. Au sommet du tonneau, les passagers ressentent un bref instant de G-forces négatives (airtime) tout en étant à l'envers, créant une sensation unique, désorientante et très appréciée. Les zero-G rolls sont associés principalement aux wing coasters et aux hyper coasters B&M, où l'élément fait balayer les passagers des sièges d'aile de manière spectaculaire dans l'espace ouvert. Shambhala à PortAventura et Fury 325 à Carowinds disposent de zero-G rolls reconnus.",
    relatedTermIds: ['inversion', 'heartline-roll', 'airtime', 'b-and-m'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      "La montée mécanique qui propulse le train au point le plus haut du circuit, convertissant l'énergie électrique en énergie potentielle gravitationnelle.",
    definition:
      "Le lifthill est le segment où un mécanisme externe hisse le train depuis le niveau du sol jusqu'au point le plus haut du trajet. Le mécanisme le plus courant est une chaîne courant le long du centre de la voie — le familier 'clic-clic-clic' est le cliquet anti-recul. Les alternatives incluent les lifts à câble/corde (plus silencieux et plus doux), les lifts à galets motorisés (utilisés sur certains coasters B&M modernes) et la propulsion magnétique. La hauteur du lifthill détermine la vitesse maximale potentielle du coaster. Certains designs modernes utilisent plusieurs lifthills ou combinent une montée avec des segments de lancement. Le lifthill est généralement le moment le plus lent et le plus chargé en anticipation de l'attraction.",
    relatedTermIds: ['first-drop', 'launch-coaster', 'block-brake'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'La descente initiale suivant le lifthill — généralement le point le plus haut et le plus rapide du trajet, définissant le caractère du coaster.',
    definition:
      "Le First Drop est la descente principale immédiatement après le lifthill ou le segment de lancement. Sur la plupart des coasters traditionnels, c'est la colline la plus haute et celle qui produit la vitesse maximale. L'angle, la hauteur et le profil influencent fortement le caractère général : les descentes à angle prononcé (plus de 80–90°) créent une intense sensation d'accélération, tandis que les descentes paraboliques peuvent générer un fort airtime malgré un angle plus doux. Les Dive Coasters comportent des descentes dépassant 90° (au-delà de la verticale), invitant les passagers à se pencher au-dessus du vide. Le First Drop est souvent le moment le plus attendu sur tout nouveau coaster et est couramment filmé pour les supports promotionnels.",
    relatedTermIds: ['lifthill', 'airtime', 'airtime-hill', 'dive-coaster'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'Un élément en forme de colline conçu pour générer des G-forces négatives, faisant ressentir aux passagers une apesanteur ou les soulevant de leur siège.',
    definition:
      "Un Airtime Hill (aussi appelé camelback) est un élément de montée-descente courbé conçu pour produire des G-forces négatives — la sensation de flotter ou d'être éjecté de son siège. Le floater airtime est une légère G négative ; l'ejector airtime est intense, la barre de maintien devenant alors la seule chose entre le passager et le ciel. Les coasters en acier utilisent des collines paraboliques précisément profilées pour un airtime cohérent et prévisible ; les coasters en bois produisent un airtime plus imprévisible et rugueux en raison de la flexibilité de la voie. Les Airtime Hills figurent parmi les éléments les plus appréciés dans les classements des enthousiastes et sont une caractéristique déterminante des hyper coasters, giga coasters et coasters en bois modernes.",
    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Hélix',
    shortDefinition:
      "Une section en spirale continue où la voie s'enroule autour d'un axe central, générant des G-forces latérales soutenues.",
    definition:
      "Un hélix est une section de voie de coaster qui spirale en continu — comme une vis — sans inverser les passagers. Contrairement aux airtime hills ou aux inversions, les hélices génèrent des G-forces latérales (latérales) soutenues qui plaquent les passagers vers l'extérieur des virages. Un hélix descendant accélère le train tout en virant ; un hélix montant le décélère tout en maintenant les forces latérales. Les hélices sont couramment utilisées pour dissiper l'énergie cinétique résiduelle en fin de circuit tout en offrant une sensation de virage intense et soutenue. Les hélices célèbres incluent le final souterrain de Nemesis à Alton Towers et l'hélix de clôture d'Expedition GeForce à Holiday Park.",
    relatedTermIds: ['horseshoe', 'first-drop'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'Une section de freinage qui divise le circuit en segments indépendants, permettant à plusieurs trains de circuler simultanément sans risque de collision.',
    definition:
      "Un Block Brake divise le circuit d'un coaster en sections indépendantes distinctes ('blocs'), chacune capable de contenir exactement un train. Si un train en amont ralentit ou s'arrête, le système de contrôle retient automatiquement tous les trains suivants à leur position de block brake. Ce système de sécurité permet aux parcs de faire circuler plusieurs trains simultanément — augmentant considérablement la capacité horaire — sans aucun risque de collision. Les block brakes sont positionnés aux endroits où un train arrêté ne reculera pas (généralement à plat ou légèrement en montée) et utilisent généralement des freins magnétiques (à courants de Foucault) ou à ailettes de friction. Le mid-course brake run (MCBR) est le type de block brake le plus visible.",
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      "La section de décélération en fin de circuit où le train est ralenti à la vitesse de la gare, généralement à l'aide de freins magnétiques à ailettes.",
    definition:
      "Le Brake Run est la section de voie suivant le circuit principal où le train décélère de la vitesse de trajet à une vitesse d'approche sécurisée pour la gare. Les brake runs modernes utilisent des freins à courants de Foucault (magnétiques) — des rangées d'ailettes magnétiques permanentes qui interagissent avec des ailettes métalliques sous le train, créant une résistance sans friction ni usure. Les coasters plus anciens utilisaient des freins pneumatiques à pinces. Un mid-course brake run (MCBR) placé en milieu de circuit sert de section de bloc pour l'opération multi-train. Le brake run final avant la gare peut être intentionnellement léger pour préserver une certaine vitesse et une approche de gare plus dynamique.",
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      "Une double inversion signature B&M où la voie forme la tête dressée d'un cobra — deux inversions connectées par un demi-tonneau au sommet.",
    definition:
      "Le cobra roll est l'un des éléments signature les plus distinctifs de B&M, composé de deux inversions rapprochées : la voie s'incurve vers le haut en demi-looping, effectue une rotation de 180° au sommet (passant par une brève section inversée), puis reproduit la séquence en miroir pour ressortir dans la même direction qu'à l'entrée. Vue de côté, la silhouette de la voie ressemble à la tête dressée et déployée d'un cobra. Des cobra rolls célèbres figurent sur Shambhala à PortAventura, Pyrenees au Parque de Atracciones de Madrid et de nombreux coasters B&M inversés dans le monde.",
    relatedTermIds: ['inversion', 'immelmann', 'batwing', 'b-and-m'],
  },
  {
    id: 'corkscrew',
    name: 'Tire-bouchon',
    shortDefinition:
      "Une inversion en tonneau où la voie spirale à 360° autour d'un axe central — l'un des premiers types d'inversions construits et les plus répandus.",
    definition:
      "Le tire-bouchon est l'une des premières inversions modernes, introduite par Arrow Dynamics dans les années 1970. La voie spirale autour d'un cylindre central comme un tire-bouchon à vin, faisant tourner les passagers dans un tonneau complet à 360° en décalage par rapport à la direction de déplacement. Les tire-bouchons sont souvent couplés en arrangements consécutifs et sont l'élément caractéristique du coaster en acier de l'ère classique. Le terme allemand 'Korkenzieher' est largement utilisé sur les plans et la signalétique des parcs germaniques. Bien que les conceptions d'inversions plus récentes l'aient largement supplanté, le tire-bouchon reste un élément apprécié dans les parcs d'Europe et d'Amérique du Nord.",
    relatedTermIds: ['inversion', 'inline-twist', 'flat-spin'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      "Le pendant inverse de l'Immelmann : la voie plonge brusquement vers le bas dans un demi-looping et ressort horizontalement — inversant la direction à l'opposé d'un Immelmann.",
    definition:
      "Un Dive Loop (aussi appelé dive turn ou reverse Immelmann) commence là où l'Immelmann s'arrête : au lieu de monter et de passer par-dessus, la voie plonge brusquement vers le bas, décrivant la moitié inférieure d'un loop avant de ressortir dans la direction opposée à l'entrée. La sensation est celle d'une plongée descendante suivie d'un brusque redressement en force. Les Dive Loops sont un élément signature B&M et apparaissent sur de nombreux coasters inversés et sit-down du fabricant. La combinaison d'Immelmanns et de Dive Loops dans un même circuit crée des changements de direction et des types d'inversion variés.",
    relatedTermIds: ['inversion', 'immelmann', 'b-and-m'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      "Un tonneau à 360° directement autour de l'axe de la voie, offrant une inversion fluide sans modifier sensiblement la direction de déplacement du train.",
    definition:
      "Un Inline Twist (aussi appelé inline roll ou barrel roll) fait tourner le train à 360° autour de l'axe longitudinal de la voie — le coaster effectue un tonneau sans dévier significativement de sa direction. Contrairement au tire-bouchon (dont la spirale est décalée par rapport à l'axe central de la voie), l'inline twist pivote précisément autour de la voie. Le résultat est une inversion brève et fluide avec un minimum de forces latérales. Les Inline Twists sont courants sur les flying coasters et les coasters inversés B&M, apparaissant souvent en paires ou combinés à d'autres éléments en succession rapide. L'élément produit un bref instant à l'envers qui paraît étonnamment doux.",
    relatedTermIds: ['inversion', 'corkscrew', 'heartline-roll', 'flat-spin'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Un tonneau à 360° centré sur le centre de gravité du passager plutôt que sur la voie elle-même, conçu pour offrir une apesanteur douce et soutenue tout au long de la rotation.',
    definition:
      "Un Heartline Roll (ou heartline spin) est conçu de façon que le cœur du passager — approximativement le centre de gravité du corps — reste à une altitude constante tout au long de la rotation, plutôt que la voie soit le point de pivot. Cette conception minimise les G-forces pendant le tonneau, produisant une douce sensation de flottement distincte du choc d'un tire-bouchon standard. Les Heartline Rolls sont une marque de fabrique du design de coasters B&M et Intamin modernes, associés aux hyper coasters et aux invert coasters. L'élément illustre la précision d'ingénierie nécessaire pour créer un trajet fluide — de minimes ajustements de voie se traduisent directement par le confort ou l'inconfort des passagers.",
    relatedTermIds: ['inversion', 'zero-g-roll', 'inline-twist'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Un demi-looping combiné à un demi-tire-bouchon qui pivote la voie de 90° et change de direction — un élément signature Vekoma présent sur les coasters Boomerang.',
    definition:
      "Un Sidewinder consiste en un demi-looping vertical qui propulse le train vers le haut, immédiatement suivi d'un demi-tire-bouchon qui remet le train à l'endroit tout en effectuant un virage à 90°. Le résultat net est une inversion combinée à un changement de direction significatif, dans un espace compact. Les Sidewinders sont les briques de base du célèbre modèle Boomerang de Vekoma : deux sidewinders (un en avant, un inversé) encadrant un looping central pour constituer le circuit complet. Le nom fait référence au mouvement de torsion serpentin que l'élément produit vu depuis le bord de la voie.",
    relatedTermIds: ['inversion', 'boomerang', 'cobra-roll'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      "Une inversion massive exclusive aux flying coasters B&M où les passagers, déjà en position Superman, passent par le bas d'un looping vertical en étant entièrement à l'envers.",
    definition:
      "Le Pretzel Loop est l'une des inversions les plus intenses du design de parcs à thème, présente exclusivement sur les flying coasters B&M (où les passagers sont allongés horizontalement en position Superman). L'élément envoie les passagers en plongée abrupte à l'envers, à travers le bas d'un grand loop, avant de remonter brusquement — la forme générale ressemblant à un bretzel vue de côté. Comme le point bas se trouve en bas et que les passagers sont face vers le sol, les G-forces ressenties à cet instant sont extrêmement intenses. Des Pretzel Loops célèbres figurent sur Manta à SeaWorld Orlando et Tatsu à Six Flags Magic Mountain.",
    relatedTermIds: ['inversion', 'b-and-m', 'inline-twist'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Un élément à double inversion avec inversion de direction à 180°, combinant deux demi-loopings reliés par un demi-tire-bouchon — la forme évoque des ailes de chauve-souris déployées.',
    definition:
      "Un Batwing est composé de deux inversions avec inversion de direction : la voie s'arc en demi-looping vers le haut, puis au sommet passe par un demi-tire-bouchon qui met le train à l'envers tout en inversant la direction avant de reproduire le demi-looping vers le bas. La forme vue du dessus ressemble à des ailes de chauve-souris déployées. Les Batwings sont un élément signature B&M, présents sur des coasters comme Afterburn à Carowinds et The Incredible Hulk Coaster à Universal's Islands of Adventure. Contrairement au bowtie (sans changement de direction), le Batwing inverse le cap du train de 180° pendant la séquence.",
    relatedTermIds: ['inversion', 'bowtie', 'cobra-roll', 'b-and-m'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      "Une variante de looping où la voie arrive par le haut, plonge dans le chemin circulaire et ressort au sommet — la géométrie inverse d'un looping standard.",
    definition:
      "Le Norwegian Loop (parfois appelé reverse loop) a la géométrie inverse d'un looping vertical standard : plutôt que d'entrer au niveau du sol et de ressortir à la même hauteur, le train arrive d'une position élevée, plonge dans le chemin circulaire du loop, puis ressort à nouveau par le haut. Cela signifie que les forces ressenties au bas du cercle — de fortes G positives — sont toujours présentes, mais les sensations d'entrée et de sortie sont nettement différentes. Les Norwegian Loops sont relativement rares dans l'inventaire mondial des coasters et sont associés principalement à certains designs Vekoma et installations sur mesure.",
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Un élément de type tire-bouchon sur les coasters inversés ou flying où la rotation se produit dans un plan approximativement horizontal, créant une rotation balayante presque à plat.',
    definition:
      "Un Flat Spin est une inversion de type tire-bouchon présente principalement sur les coasters inversés et flying B&M, où la géométrie de l'élément est arrangée de sorte que la spirale paraisse presque horizontale aux observateurs au sol. Sur un coaster inversé (où le train pend sous la voie), un Flat Spin crée un visuel particulièrement spectaculaire tandis que les passagers balayent un large cercle presque à plat. Pour les passagers, la sensation est une rotation douce et soutenue avec des G-forces modérées. Les Flat Spins sont un élément signature des coasters inversés B&M comme Banshee à Kings Island et Afterburn à Carowinds.",
    relatedTermIds: ['inversion', 'corkscrew', 'inline-twist', 'b-and-m'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      "Un demi-tire-bouchon qui inverse simultanément la direction du train d'environ 180° — combinant une inversion à un brusque changement de direction.",
    definition:
      "Un Cutback est un élément où la voie effectue un demi-tire-bouchon tout en se repliant sur elle-même d'environ 180°. Le résultat est une inversion avec un important renversement de direction — distincte d'un tire-bouchon standard qui maintient globalement la direction de déplacement. Les Cutbacks sont relativement rares et apparaissent sur certains modèles Vekoma et coasters sur mesure où un changement de direction compact combiné à une inversion est requis. Le nom 'cutback' reflète l'apparence visuelle de l'élément : la voie revient sur sa direction précédente tout en pivotant.",
    relatedTermIds: ['inversion', 'corkscrew', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Une variante de double inversion sea-serpent avec un apex de liaison plus bas, produisant deux inversions consécutives sans changement de direction dans un espace compact.',
    definition:
      "Le Butterfly est un élément à double inversion similaire au sea serpent (deux demi-loopings reliés au sommet) mais avec un apex plus bas et une géométrie distincte. Comme le sea serpent, il produit deux inversions sans modifier la direction du train, mais la pièce de liaison entre les deux demi-loopings passe par une section inversée plus basse plutôt qu'un sommet en hauteur. Cela rend le Butterfly plus compact verticalement. L'élément apparaît sur certains designs Vekoma et coasters sur mesure et se distingue du bowtie (sans changement de direction, même géométrie mais disposition différente) et du batwing (avec changement de direction).",
    relatedTermIds: ['inversion', 'bowtie', 'batwing'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Un élément à double inversion composé de deux demi-loopings en miroir formant un nœud papillon — deux inversions sans changement de direction.',
    definition:
      "Un Bowtie est un élément à double inversion composé de deux demi-loopings en miroir reliés à leur sommet. Contrairement au batwing (qui inverse la direction), le bowtie ressort dans le même cap général qu'à l'entrée. Vue du dessus, la silhouette de la voie ressemble à un nœud papillon. Les Bowties sont relativement rares et présents principalement sur certaines installations Vekoma et sur mesure. L'élément produit deux inversions fluides en succession rapide tout en maintenant la direction générale de déplacement, offrant une sensation différente du batwing à inversion de direction malgré une apparence superficiellement similaire.",
    relatedTermIds: ['inversion', 'batwing', 'butterfly'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Une série de petites collines rapides en fin de trajet produisant un doux airtime floater au fur et à mesure que le train perd de la vitesse.',
    definition:
      "Un Bunnyhop (ou bunny hop) est une série de petites collines rapides placées vers la fin d'un circuit de coaster lorsque le train a dissipé la majeure partie de son énergie cinétique. À cette vitesse réduite, les collines génèrent un doux airtime floater — une légère sensation de flottement rythmique plutôt que l'airtime éjecteur intense des collines plus rapides en début de circuit. Le terme évoque le mouvement léger et bondissant d'un lapin. Les bunnyhops sont des finales courantes sur les hyper coasters, giga coasters et coasters en bois, offrant une légère touche finale avant le brake run. Les enthousiastes considèrent souvent des bunnyhops bien exécutés comme le signe d'un design de circuit soigné.",
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      "Un airtime hill incliné au-delà de 90°, propulsant les passagers latéralement tout en générant des G-forces négatives — nommé d'après l'ingénieur légendaire Werner Stengel et élément signature de Mack Rides.",
    definition:
      "Le Stengel Dive est un élément d'airtime où la voie s'incline au-delà de 90° (au-delà de la verticale) de sorte que les passagers se retrouvent latéralement ou légèrement la tête en bas tout en ressentant simultanément des G-forces négatives dues au profil de la colline. Cette combinaison unique de désorientation latérale et d'airtime produit une sensation sans équivalent dans un looping ou une colline standard. L'élément porte le nom de Werner Stengel, l'ingénieur allemand à l'origine de certains des coasters les plus importants de l'histoire. Les Stengel Dives sont un élément signature des hyper coasters Mack Rides : le Blue Fire Megacoaster à Europa-Park a été le premier coaster à en intégrer un, avec les hyper coasters Mack suivants comme Ride to Happiness à Plopsaland et Kondaa au Walibi Belgium en comptant plusieurs.",
    relatedTermIds: ['airtime-hill', 'mack-rides', 'airtime'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Un virage semicirculaire très incliné en forme de fer à cheval, réorientant le train dans la direction opposée — couramment utilisé pour retourner le train entre des segments de lancement.',
    definition:
      "Un Horseshoe est un virage semi-circulaire fortement incliné — généralement entre 75 et 90° — qui réoriente le coaster de 180° (inversant son cap). L'inclinaison extrême évite des G-forces latérales excessives pour ce rayon de courbure serré. Les Horseshoes sont fréquemment utilisés dans les circuits de launched coasters comme éléments de retournement entre plusieurs segments de lancement, offrant au train un demi-tour avant la prochaine phase d'accélération. L'élément est visuellement spectaculaire et caractéristique des accélérateurs Intamin et des multi-launch coasters Mack. Il réoriente efficacement le train dans un espace compact tout en maintenant la vitesse.",
    relatedTermIds: ['launch-coaster', 'intamin', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      "Une petite dénivellation juste avant la première grande descente sur un coaster à lifthill, utilisée pour réduire la tension de la chaîne et offrir un bref instant d'airtime anticipatoire.",
    definition:
      "Un Predrop est une petite colline ou vallée positionnée sur la dernière portion du lifthill, juste avant le sommet menant à la première grande descente. Sa principale fonction d'ingénierie est de réduire la tension sur la chaîne de traction au moment où le train franchit le sommet — évitant une transition brusque ou brutale du lifthill motorisé à la chute libre. Avantage secondaire pour l'expérience : le bref airtime au franchissement du predrop offre un avant-goût tentant de l'apesanteur avant la plongée principale. Les predrops sont devenus un élément de design populaire sur les coasters en bois et en acier, certains — comme le predrop de Goliath à Six Flags Magic Mountain — étant aussi attendus que la descente elle-même.",
    relatedTermIds: ['lifthill', 'first-drop', 'airtime'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Un élément haut et étroit avec montée et descente quasi-verticales ressemblant à un chapeau haut de forme — élément signature des coasters Intamin à lancement hydraulique.',
    definition:
      "Un Top Hat est un élément distinctif où la voie monte presque verticalement jusqu'à un sommet abrupt, puis plonge presque verticalement de l'autre côté — créant un profil ressemblant à un chapeau haut de forme vu de côté. Les Top Hats intérieurs (standard) s'inclinent vers l'intérieur au sommet ; les Top Hats extérieurs s'inclinent vers l'extérieur pour une sensation exposée et chargée en airtime. L'élément est fortement associé aux launched coasters hydrauliques d'Intamin (accélérateurs) : après le lancement initial à 200 km/h ou plus, le Top Hat est la pièce maîtresse spectaculaire du trajet. Kingda Ka (139 m), Top Thrill Dragster (128 m) et Red Force au Ferrari Land disposent de Top Hats iconiques.",
    relatedTermIds: ['launch-coaster', 'intamin', 'first-drop'],
  },
  {
    id: 'credit',
    name: 'Crédit',
    shortDefinition:
      "Une montagne russe qu'un enthousiaste a officiellement parcourue et ajoutée à son compteur personnel — collectionner des crédits est une activité centrale de la communauté des passionnés de coasters.",
    definition:
      "Un crédit de coaster (ou simplement 'crédit' ou 'cred') est une montagne russe qu'un enthousiaste a empruntée et officiellement ajoutée à son compteur personnel. La pratique de 'collecter des crédits' — parcourir le plus grand nombre possible de coasters différents — est l'une des activités définissant la communauté des passionnés de montagnes russes. Les règles définissant ce qui compte comme crédit varient : certains enthousiastes ne comptent que les sit-down coasters, d'autres incluent toutes les attractions à rails ; certains exigent chaque type de train sur un même coaster comme crédit unique, d'autres non. Des sites de suivi comme la Roller Coaster Database (RCDB) permettent aux enthousiastes d'enregistrer leur compteur. La quête de crédits pousse de nombreux enthousiastes à voyager à l'international et à visiter des parcs peu connus.",
    relatedTermIds: ['pov', 'wooden-coaster', 'hybrid-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      "Vidéo en point de vue filmée depuis le premier rang d'une montagne russe, offrant aux futurs visiteurs un aperçu virtuel de l'expérience.",
    definition:
      "POV (Point of View) désigne une vidéo filmée depuis la perspective d'un passager du premier rang, généralement montée sur une caméra fixée au train. Les vidéos POV sont l'un des formats de contenu les plus populaires dans la communauté des enthousiastes de parcs à thème et sont largement utilisées par les futurs visiteurs pour prévisualiser un coaster avant de se déplacer. Les parcs produisent parfois des POV officiels à des fins promotionnelles ; le plus souvent ils sont filmés par des visiteurs ou des médias. Un bon POV montre clairement chaque élément, descente et inversion dans l'ordre. YouTube héberge des dizaines de milliers de vidéos POV de coasters. Le terme est aussi utilisé plus largement pour désigner toute vidéo en première personne d'attractions de parcs.",
    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      "Une situation où plusieurs trains arrivent sur le brake run avant que la gare ne soit dégagée, formant une file de trains en attente — signe d'opérations inefficaces qui allongent les temps d'attente.",
    definition:
      "Le Stacking se produit lorsque le processus d'embarquement/débarquement d'une montagne russe est plus lent que le temps de cycle du trajet, entraînant l'accumulation de trains dans le brake run en attendant que la gare se dégage. Au lieu d'envoyer un train dès que le précédent revient, l'opérateur doit retenir plusieurs trains dans le brake run — interrompant potentiellement l'attraction brièvement entre chaque train. Le Stacking réduit directement la capacité et allonge les temps d'attente en file. Les causes fréquentes incluent le chargement lent des visiteurs (souvent dû à des systèmes de retenue complexes), les exigences importantes de vérification des bagages ou le sous-effectif du personnel. Les visiteurs expérimentés peuvent observer si un coaster staque pendant leur attente et en tenir compte dans leurs décisions.",
    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Type de montagnes russes où le train est suspendu sous le rail et les pieds des passagers pendent librement.',
    definition:
      "Un Inverted Coaster est des montagnes russes où le train est fixé rigidement sous le rail, les passagers étant assis avec les pieds qui pendent librement. Contrairement aux montagnes russes suspendues (qui oscillent latéralement), le train d'un Inverted Coaster ne peut pas se balancer. B&M a pionniérisé le concept avec Batman The Ride en 1992. Ces attractions sont réputées pour leurs near-misses intenses, leurs zero-g rolls et cobra rolls. Exemples européens célèbres : Nemesis (Alton Towers), Katun (Mirabilandia) et Oziris (Parc Astérix).",
    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Type de coaster où les sièges sont disposés de chaque côté du rail — rien au-dessus, en dessous ni à côté des passagers.',
    definition:
      "Un Wing Coaster (ou Wing Rider) dispose deux sièges de chaque côté du rail, laissant les passagers sans aucune structure au-dessus, en dessous ou à leurs côtés. Ce design maximise la sensation de vol et permet des near-misses spectaculaires avec le décor et les structures. B&M est le principal fabricant de Wing Coasters. Exemples notables en Europe : The Swarm (Thorpe Park), GateKeeper (Cedar Point) et Flug der Dämonen (Europa-Park), souvent cité parmi les meilleurs coasters d'Europe.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'dive-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Coaster dont les wagons tournent librement sur un axe vertical, offrant une expérience différente à chaque trajet.',
    definition:
      "Un Spinning Coaster est équipé de wagons montés sur une plateforme rotative qui tourne librement autour d'un axe vertical. La rotation n'étant pas contrôlée, chaque trajet produit une séquence différente d'avant, d'arrière et de latéral. Mack Rides (Waldkirch, Allemagne) et Gerstlauer sont les principaux fabricants. Les Spinning Coasters sont souvent considérés comme d'excellentes attractions familiales — suffisamment intenses pour être passionnantes sans les contraintes de taille des coasters les plus exigeants.",
    relatedTermIds: ['mack-rides', 'launch-coaster', 'credit'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      "Coaster dépassant 61 m de hauteur, généralement sans inversions, axé sur la vitesse et l'airtime.",
    definition:
      "Le Hyper Coaster est la classification pour les montagnes russes entre 61 et 91 m de hauteur. B&M utilise le terme « Hyper Coaster » ; Intamin préfère « Mega Coaster » pour leur type équivalent. Les deux se concentrent sur de grandes collines d'airtime à grande vitesse plutôt que sur des inversions. Shambhala à PortAventura (Espagne) est le Hyper Coaster le plus haut et le plus rapide d'Europe à 76 m. Parmi les autres exemples notables : Goliath à Walibi Holland et Mako à SeaWorld Orlando.",
    relatedTermIds: ['giga-coaster', 'airtime', 'b-and-m', 'intamin', 'airtime-hill'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Coaster dépassant 91 m de hauteur — un cran au-dessus du Hyper Coaster.',
    definition:
      "Le Giga Coaster est la classification pour les montagnes russes entre 91 et 121 m de hauteur. Le terme a été créé par Cedar Fair et Intamin pour Millennium Force à Cedar Point en 2000. Les Giga Coasters misent sur une hauteur extrême, de longs circuits et d'immenses moments d'airtime. Fury 325 à Carowinds est considéré par de nombreux passionnés comme le meilleur coaster en acier au monde. En Europe, aucun Giga Coaster n'existe encore en 2025.",
    relatedTermIds: ['hyper-coaster', 'airtime', 'first-drop'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Virage dont le dévers dépasse 90°, inclinant brièvement les passagers au-delà de la verticale.',
    definition:
      "Un Overbanked Turn (virage surbanqué) est une courbe où le dévers dépasse 90 degrés — le rail extérieur est plus haut que la verticale, ce qui incline brièvement les passagers au-delà de la position tête en bas sans réaliser une inversion complète. L'élément génère un mélange caractéristique de G latérales et de légères G négatives au sommet du dévers. Les Overbanked Turns sont la signature des Hyper Coasters de B&M et des Mega Coasters d'Intamin, et sont omniprésents dans les layouts de RMC.",
    relatedTermIds: ['inversion', 'airtime', 'b-and-m', 'rmc', 'intamin'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      "Frein magnétique en milieu de parcours qui réduit la vitesse du train sans l'arrêter complètement.",
    definition:
      "Un Trim Brake est un dispositif de freinage placé en cours de parcours pour réduire la vitesse du train — sans l'arrêter complètement comme un block brake. Ces freins sont utilisés pour gérer les forces G, réduire l'usure de la voie ou satisfaire des exigences de sécurité. Les passionnés leur reprochent souvent de diminuer les sensations du trajet : les collines d'airtime sont moins intenses lorsque le train est freiné avant. L'activation des trim brakes peut varier selon la saison, la météo et le chargement du train.",
    relatedTermIds: ['block-brake', 'brake-run', 'airtime'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      "Quand un launch coaster n'atteint pas le sommet du circuit et revient en arrière sur la voie de lancement.",
    definition:
      "Un rollback se produit quand un coaster lancé ne génère pas assez de vitesse pour franchir le point le plus haut du circuit et revient en arrière sous l'effet de la gravité jusqu'à la position de lancement. Sur les launch coasters hydrauliques (Top Thrill Dragster, Stealth), cela arrive quand le mécanisme de lancement ne délivre pas toute sa puissance. Le train est arrêté en douceur par des freins magnétiques. Les rollbacks sont rares mais constituent une caractéristique connue des launch coasters hydrauliques. Les passagers ne courent aucun danger.",
    relatedTermIds: ['launch-coaster', 'block-brake', 'downtime'],
  },
  {
    id: 'animatronics',
    name: 'Animatronique',
    shortDefinition:
      'Personnages robotiques utilisés dans les dark rides et spectacles pour créer des scènes vivantes.',
    definition:
      "L'animatronique (animatronics en anglais) désigne des figurines robotiques électromécaniques utilisées dans les attractions et spectacles de parcs à thème pour représenter des personnages ou créatures de façon réaliste. Disney a introduit le terme « Audio-Animatronics » lors de l'Exposition universelle de 1964. Les animatroniques modernes vont de simples figures cycliques à des robots complexes avec expressions faciales et mouvements corporels complets. Le chaman Na'vi dans Pandora (Walt Disney World) et les dinosaures de l'attraction Jurassic World (Universal) sont des exemples de pointe.",
    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'Prévision IA',
    shortDefinition:
      "Prédictions basées sur le machine learning pour les niveaux de fréquentation et les temps d'attente — jusqu'à 30+ jours à l'avance.",
    definition:
      "Une prévision IA utilise des modèles de machine learning entraînés sur des données historiques de fréquentation, des données météo, des calendriers scolaires et des données en temps réel pour prédire l'affluence dans un parc ou pour une attraction donnée. park.fan génère des prévisions IA pour la fréquentation et les temps d'attente prévus jusqu'à 30+ jours à l'avance.\n\nLes prévisions sont continuellement mises à jour à mesure que de nouvelles données arrivent. Les prévisions à court terme (1–7 jours) sont généralement très précises car elles intègrent les données météo actuelles, les annonces d'événements et les signaux de réservation. Les prévisions à long terme sont naturellement moins précises, mais restent utiles pour identifier les périodes calmes ou animées bien à l'avance.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'opening-hours',
    name: "Horaires d'ouverture",
    shortDefinition:
      'Le programme journalier officiel indiquant quand un parc à thème ou une attraction ouvre et ferme.',
    definition:
      "Les horaires d'ouverture sont le programme journalier publié pour un parc à thème ou une attraction individuelle — ils indiquent quand l'accès commence et quand l'exploitation prend fin. La plupart des grands parcs publient un calendrier glissant des semaines ou des mois à l'avance, bien que les horaires puissent changer à court terme en raison d'événements spéciaux, d'ajustements saisonniers ou de problèmes opérationnels.\n\npark.fan affiche les horaires d'ouverture de chaque parc. Les horaires marqués « Est. » (Estimé) ont été dérivés de schémas historiques et ne sont pas confirmés officiellement par le parc — ils doivent être vérifiés avant une visite planifiée.",
    relatedTermIds: ['rope-drop', 'crowd-calendar', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendance',
    shortDefinition:
      "La direction de l'évolution de la longueur de la file au cours des 30 dernières minutes — en hausse, en baisse ou stable.",
    definition:
      "La tendance indique si la file d'attente d'une attraction est plus longue, plus courte ou identique à il y a 30 minutes. park.fan la représente par une flèche : vers le haut (file qui s'allonge), vers le bas (file qui se réduit) ou horizontale (stable).\n\nLa tendance est souvent plus parlante que le temps d'attente brut. Une attraction avec 45 minutes et une tendance à la baisse est un meilleur choix qu'une avec 40 minutes et une tendance fortement à la hausse — le temps d'arriver, la première file peut être descendue à 30 minutes tandis que la seconde atteint déjà 55 minutes.",
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-level'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride sans rail fixe — les véhicules naviguent librement guidés par une technologie intégrée au sol.',
    definition:
      "Un Trackless Ride est un type de dark ride où les véhicules ne sont pas contraints à un rail fixe mais naviguent de façon autonome dans l'espace de l'attraction, guidés par des boucles d'induction, le Wi-Fi ou des lasers intégrés au sol. Cette liberté de mouvement permet des décors bien plus complexes et des narrations non linéaires. Exemples emblématiques : Star Wars: Rise of the Resistance (Disney), Ratatouille: L'Aventure Totalement Toquée de Rémy (Disneyland Paris) et Symbolica (Efteling, Pays-Bas).",
    relatedTermIds: ['dark-ride', 'animatronics', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'IA',
    shortDefinition:
      "Intelligence Artificielle — les modèles de machine learning qui calculent les prévisions de fréquentation et les temps d'attente.",
    definition:
      "L'IA (Intelligence Artificielle) désigne les algorithmes de machine learning qui reconnaissent des patterns dans de grands jeux de données et génèrent des prédictions. park.fan utilise des modèles IA entraînés sur des années de données historiques de temps d'attente, de calendriers scolaires, de données météo et d'annonces d'événements pour produire des prévisions quotidiennes de fréquentation et de temps d'attente — jusqu'à 30+ jours à l'avance.",
    relatedTermIds: ['ai-forecast', 'crowd-forecast', 'crowd-calendar'],
    aliases: ['Intelligence Artificielle'],
  },
  {
    id: 'realtime-wait-time',
    name: "Temps d'attente en direct",
    shortDefinition:
      "Temps d'attente mis à jour en temps réel directement depuis les systèmes du parc.",
    definition:
      "Un temps d'attente en direct est la donnée actuelle en temps réel extraite des systèmes du parc — pas une moyenne historique, mais le chiffre réel à la minute près. park.fan récupère les temps d'attente en direct depuis les APIs officielles des parcs et des sources tierces, avec une mise à jour chaque minute.",
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-forecast'],
    aliases: ["Temps d'attente en temps réel"],
  },
  {
    id: 'crowd-forecast',
    name: 'Prévision de fréquentation',
    shortDefinition:
      "Prédiction basée sur l'IA de l'affluence dans un parc à thème pour un jour donné.",
    definition:
      "Une prévision de fréquentation est une prédiction basée sur les données de l'affluence attendue dans un parc à thème pour un jour ou une heure spécifique. park.fan recalcule les prévisions de fréquentation quotidiennement en utilisant les données historiques, les calendriers scolaires, la météo et les événements spéciaux. Les résultats alimentent directement le calendrier de fréquentation : les jours verts indiquent de courtes files d'attente, les jours rouges signalent une forte affluence.",
    relatedTermIds: ['crowd-calendar', 'ai-forecast', 'peak-day', 'crowd-level'],
    aliases: ['Prévisions de fréquentation'],
  },
  {
    id: 'g-force',
    name: 'Force G',
    shortDefinition:
      "L'unité d'accélération ressentie par les passagers, mesurée en multiples de l'accélération gravitationnelle terrestre (9,81 m/s²).",
    definition:
      "La force G (équivalent gravitationnel) mesure l'accélération ressentie par un passager par rapport à la gravité terrestre normale. Les forces G positives (au-dessus de 1G) plaquent les passagers dans leur siège lors de passages dans des creux ou des virages serrés. Les forces G négatives (sous 0G) soulèvent les passagers de leur siège et créent de l'airtime. Les forces G latérales agissent horizontalement, poussant les passagers sur les côtés dans les virages et transitions.\n\nLes montagnes russes sont conçues pour enchaîner ces forces délibérément. Un creux générant 4–5G est la marque d'un premier drop puissant. Un bref moment à −0,5G sur une bosse d'airtime produit la sensation de flottement caractéristique. La plupart des attractions ciblent 0–5G de forces positives soutenues, avec des pics courts pour l'effet dramatique. Une exposition prolongée à des forces G élevées peut provoquer un malaise ou un « greyout » ; les bonnes conceptions alternent pics d'intensité et phases de récupération.",
    relatedTermIds: ['airtime', 'inversion', 'lateral-gs', 'hangtime'],
    aliases: ['Forces G', 'G-Force', 'G-Forces'],
  },
  {
    id: 'lateral-gs',
    name: 'Forces Latérales',
    shortDefinition:
      'Forces horizontales qui poussent les passagers sur les côtés lors de virages, transitions et sections en hélice.',
    definition:
      "Les forces G latérales (ou forces latérales) sont les accélérations horizontales ressenties lorsqu'une montagne russe change de direction dans le plan horizontal — dans les virages inclinés ou non, les hélices et les changements de cap. Des forces latérales bien conçues sont fluides et contrôlées, contribuant à une expérience dynamique. Des forces latérales mal maîtrisées se traduisent par un choc brutal contre le dossier ou le harnais, source d'inconfort ou de douleur.\n\nLes amateurs distinguent les forces latérales douces et intentionnelles — comme dans les grands virages bas d'une montagne russe en bois classique — des forces latérales brutales dues à l'usure du rail ou à une mauvaise conception. Les montagnes russes en bois sont particulièrement associées aux sensations latérales : le mouvement d'un côté à l'autre des virages non inclinés fait partie de l'expérience authentique. Les séquences latérales fluides en hélice — comme sur Balder à Liseberg — sont souvent citées comme des moments marquants par les passionnés.",
    relatedTermIds: ['g-force', 'airtime', 'helix', 'wooden-coaster'],
    aliases: ['Latéraux', 'Forces G Latérales', 'Lateral G', 'Laterals'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Forces G négatives intenses qui propulsent brutalement les passagers hors de leur siège, retenus uniquement par le harnais de genoux.',
    definition:
      "L'ejector airtime décrit la forme la plus intense des forces G négatives : la trajectoire de l'attraction s'écarte si brusquement de la chute libre que les passagers sont violemment propulsés hors de leur siège, retenus uniquement par le harnais de genoux. La sensation est celle d'une éjection active du siège — distincte du flottement doux et prolongé du floater airtime, elle est soudaine et peut frôler le brutal si la transition est trop abrupte.\n\nL'ejector airtime est particulièrement associé aux hybrid coasters RMC, à certains hyper coasters Intamin et aux montagnes russes en bois modernes avec des collines paraboliques raides. Les amateurs citent les meilleurs moments d'ejector comme le sommet d'un circuit — un bref instant saisissant d'apesanteur réelle. Untamed à Walibi Holland, Wildfire à Kolmården et Steel Vengeance à Cedar Point sont souvent cités pour leurs séquences d'ejector parmi les plus intenses au monde.",
    relatedTermIds: ['airtime', 'floater-airtime', 'airtime-hill', 'rmc', 'g-force'],
    aliases: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      "Forces G négatives douces et prolongées produisant une longue sensation de flottement au sommet d'une bosse.",
    definition:
      "Le floater airtime décrit l'extrémité douce du spectre des forces G négatives : une sensation lente et prolongée où les passagers s'élèvent légèrement de leur siège et flottent en apesanteur pendant un long moment lorsque le train passe au sommet d'une colline suivant une courbe parabolique progressive. La force est faible — généralement −0,1G à −0,3G — ce qui la rend accessible et agréable même pour les passagers que l'intensité de l'ejector rebute.\n\nLe floater airtime est caractéristique des hyper et giga coasters B&M, qui utilisent de grandes collines doucement arrondies conçues pour produire de longues phases de flottement. Shambhala à PortAventura, Silver Star à Europa-Park et Goliath à Walibi Holland sont des exemples européens célèbres pour leurs longues séquences floater. De nombreux amateurs trouvent la qualité détendue du floater plus confortable que l'intensité de l'ejector, bien que les avis soient partagés sur le style supérieur.",
    relatedTermIds: ['airtime', 'ejector-airtime', 'airtime-hill', 'b-and-m', 'g-force'],
    aliases: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'La sensation de rester suspendu dans les harnais lors d\'une inversion, causée par des forces G négatives la tête en bas.',
    definition:
      "Le hangtime désigne l'expérience particulière des forces G négatives lors d'une inversion : le train s'attarde suffisamment au sommet d'une figure tête en bas pour que des forces G négatives se manifestent — les passagers se retrouvent littéralement suspendus dans leurs harnais. Contrairement au bref passage inversé d'un looping rapide, le hangtime se produit lorsque le train ralentit près du sommet d'une inversion et crée une suspension prolongée. Le poids du corps se déporte entièrement dans les harnais d'épaules ou le harnais de genoux, créant une désorientation mémorable.\n\nLe hangtime est le plus prononcé sur les éléments où le train ralentit fortement au sommet de l'inversion — le pretzel loop sur les flying coasters en est l'exemple classique, car la vitesse est suffisamment faible pour des forces G négatives soutenues en position totalement inversée. Le heartline roll de certaines attractions modernes peut aussi produire du hangtime. Les amateurs considèrent généralement le hangtime comme l'une des sensations d'inversion les plus marquantes.",
    relatedTermIds: ['inversion', 'pretzel-loop', 'heartline-roll', 'g-force', 'airtime'],
    aliases: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Élément de montagnes russes',
    shortDefinition:
      "Une section ou caractéristique nommée d'une montagne russe, comme un looping, une bosse d'airtime ou une inversion.",
    definition:
      "Un élément de montagnes russes désigne toute caractéristique distincte et nommée intégrée dans le tracé d'une montagne russe — des inversions classiques comme les loopings et les tire-bouchons aux éléments non-inversants comme les bosses d'airtime, les hélices et les virages surélevés (overbanks). Les ingénieurs conçoivent chaque élément pour produire une sensation physique précise : apesanteur (airtime), forces G latérales ou la désorientation de la tête en bas.\n\nLe glossaire de park.fan répertorie des dizaines d'éléments individuels — du premier drop et du lifthill aux spécialités modernes comme le Stengel dive, le Norwegian loop et le heartline roll.",
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop', 'helix', 'first-drop'],
    aliases: ['Éléments de montagnes russes'],
  },
];

export default translations;
