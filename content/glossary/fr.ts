import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: "Temps d'attente",
    shortDefinition:
      "Le temps estimé qu'un visiteur doit passer en file avant d'accéder à une attraction.",
    definition:
      "Le temps d'attente est la durée estimée qu'un visiteur passe en file d'attente avant de pouvoir embarquer sur une attraction. Les parcs affichent les temps d'attente aux entrées des attractions et sur leurs applications. park.fan suit les temps d'attente en direct mis à jour chaque minute.",
    alternateNames: ["File d'attente", 'Queue time'],

    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Une file séparée pour les visiteurs acceptant de voyager seuls afin de remplir les places vides.',
    definition:
      "La file Single Rider permet aux visiteurs acceptant de voyager seuls de remplir les sièges vides dans les véhicules d'attractions. Comme les passagers en Single Rider comblent les espaces libres, la file avance beaucoup plus vite que la file standard — souvent 50 à 70 % de temps d'attente en moins. Toutes les attractions ne proposent pas cette option ; vérifiez avant de rejoindre la file.",
    alternateNames: ['Single Rider Lane', 'File individuelle'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'virtual-queue',
    name: "File d'attente virtuelle",
    shortDefinition:
      "Un système de file numérique où les visiteurs réservent un horaire plutôt que d'attendre physiquement.",
    definition:
      "Une file d'attente virtuelle permet aux visiteurs de s'inscrire pour une attraction via une application ou une borne et de recevoir une notification quand leur tour approche. Au lieu de faire la queue physiquement, les visiteurs peuvent profiter d'autres zones du parc et revenir lorsqu'ils sont appelés.",
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ["Files d'attente virtuelles", 'File Virtuelle', 'File virtuelle'],
  },
  {
    id: 'express-pass',
    name: 'Pass Express',
    shortDefinition:
      'Un upgrade de billet payant ou inclus donnant accès à une file prioritaire plus courte.',
    definition:
      "Un Pass Express (le nom varie selon les parcs — Universal Express, Disney Lightning Lane, etc.) est un upgrade qui permet aux détenteurs d'utiliser une entrée prioritaire dédiée avec des attentes nettement plus courtes. Utilisez le calendrier d'affluence de park.fan pour décider si un Pass Express vaut son coût.",
    alternateNames: ['Flash Pass', 'Express Pass', 'Lightning Lane'],

    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'posted-wait-time',
    name: "Temps d'attente affiché",
    shortDefinition: "Le temps d'attente officiel affiché par le parc à l'entrée d'une attraction.",
    definition:
      "Le temps d'attente affiché est l'estimation officielle visible sur les panneaux à l'entrée physique d'une attraction et/ou dans l'application officielle du parc. park.fan agrège les temps d'attente affichés depuis les sources officielles chaque minute.",
    relatedTermIds: ['crowd-level', 'wait-time'],
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
    aliases: ['Jours de pointe'],
    alternateNames: ['Haute Saison', 'Journée Chargée', 'Pic de fréquentation'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Rénovation',
    shortDefinition:
      'Une période de fermeture planifiée pendant laquelle une attraction subit une maintenance ou des améliorations.',
    definition:
      'Une rénovation est une période de maintenance ou de travaux programmée pendant laquelle une attraction, un spectacle ou une zone du parc est temporairement fermé. Les rénovations peuvent durer de quelques jours à plusieurs mois. park.fan indique les attractions en cours de rénovation pour que vous puissiez en tenir compte dans votre planification.',
    aliases: ['Rénovations'],
    alternateNames: ['Réhabilitation', 'Refurb', 'Fermeture technique'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: "Temps d'arrêt",
    shortDefinition:
      "Une fermeture temporaire non planifiée d'une attraction, souvent due à une panne technique.",
    definition:
      "Le temps d'arrêt désigne une fermeture temporaire non programmée d'une attraction — à distinguer d'une rénovation planifiée. Les temps d'arrêt sont causés par des pannes techniques, des vérifications de sécurité, des incidents ou des conditions météorologiques défavorables. park.fan affiche l'état opérationnel actuel de chaque attraction en temps réel.",
    aliases: ['Pannes'],
    alternateNames: ['Incident Technique', 'Hors Service', 'Fermeture imprévue'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: "Capacité d'attraction",
    shortDefinition: "Le nombre de visiteurs qu'une attraction peut accueillir par heure.",
    definition:
      "La capacité d'une attraction est le nombre maximum de visiteurs qu'elle peut transporter par heure dans des conditions optimales. La capacité dépend de la taille des véhicules, du nombre de véhicules en circulation, de la vitesse de chargement et de la durée du cycle. La capacité détermine directement la vitesse d'avancement de la file.",
    relatedTermIds: ['downtime', 'refurbishment', 'wait-time'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Le moment où un parc ouvre officiellement ses portes et où les files pour les attractions populaires sont les plus courtes.',
    definition:
      "Le Rope Drop désigne le moment où un parc à thème ouvre pour la journée — tirant son nom de la corde (ou barrière) que le personnel abaisse pour laisser entrer les premiers visiteurs. Arriver au Rope Drop est une stratégie populaire car les attractions populaires ont les files les plus courtes tôt le matin, avant que les foules n'affluent. Le planning de park.fan indique les heures d'ouverture exactes pour vous aider à préparer votre stratégie.",

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'early-entry', 'wait-time'],
  },
  {
    id: 'early-entry',
    name: 'Entrée anticipée',
    shortDefinition:
      "Un avantage exclusif permettant aux clients des hôtels du resort d'entrer dans le parc avant l'ouverture générale.",
    definition:
      "L'entrée anticipée (aussi appelée Extra Magic Hours ou Magic Morning) permet aux clients des hôtels partenaires d'accéder au parc 30 à 60 minutes avant le public général. Pendant cette fenêtre, les files d'attente aux attractions populaires sont nettement plus courtes. Les jours de forte affluence, combiner l'entrée anticipée avec un plan de visite intelligent permet de profiter de plusieurs attractions phares avec peu d'attente.",
    alternateNames: ['Extra Magic Hours', 'Magic Morning', 'Early Park Entry'],

    relatedTermIds: ['express-pass', 'peak-day', 'rope-drop'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Un supplément de billet permettant de visiter plusieurs parcs du même resort dans la même journée.',
    definition:
      "Un Park Hopper permet d'entrer dans deux parcs ou plus exploités par le même resort lors d'une même journée. L'option Park Hopper de Disney, par exemple, permet de passer entre Magic Kingdom, EPCOT, Hollywood Studios et Animal Kingdom après 14h. Universal propose un système similaire de billet multi-parcs. C'est particulièrement intéressant lorsque des attractions ou des expériences spécifiques sont réparties sur plusieurs parcs.",
    aliases: ['Park-Hopper'],
    alternateNames: ['Park Hopping', 'Billet multi-parcs'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'season-pass'],
  },
  {
    id: 'season-pass',
    name: 'Abonnement annuel',
    shortDefinition:
      'Un ticket annuel donnant droit à un nombre illimité de visites pendant 12 mois.',
    definition:
      "Un abonnement annuel (Annual Pass) donne accès illimité à un ou plusieurs parcs sur une période de 12 mois. Les niveaux supérieurs incluent souvent des avantages comme des réductions sur la restauration, le parking gratuit ou des remises sur les produits dérivés. Certains abonnements comportent des dates bloquées (blockout dates) les jours de forte affluence. Pour les visiteurs réguliers — généralement trois visites ou plus par an — l'abonnement est presque toujours plus avantageux que les billets individuels.",
    aliases: ['Pass annuel'],
    alternateNames: ['Annual Pass', 'Season Pass', 'Carte Annuelle', 'Carte de saison'],

    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
  },
  {
    id: 'height-requirement',
    name: 'Taille minimale',
    shortDefinition:
      'Une taille minimale que les visiteurs doivent atteindre pour accéder à une attraction.',
    definition:
      "La taille minimale est une règle de sécurité imposée par les parcs pour garantir que les systèmes de retenue — harnais, barres de maintien, ceintures — fonctionnent correctement pour chaque passager. Elle varie généralement entre 90 et 140 cm selon l'intensité de l'attraction. Certaines attractions ont également une taille ou un poids maximal. Vérifiez toujours les tailles minimales avant de visiter avec de jeunes enfants pour éviter les déceptions.",
    aliases: ['tailles minimales'],
    alternateNames: ['Restriction de Taille', 'Hauteur requise', 'Condition de taille'],

    relatedTermIds: ['refurbishment', 'ride-capacity'],
  },
  {
    id: 'themed-land',
    name: 'Univers thématique',
    shortDefinition:
      "Une zone autonome au sein d'un parc à thème construite autour d'un thème cohérent.",
    definition:
      "Un univers thématique est une zone distincte d'un parc à thème qui réunit un design visuel unifié, une histoire de fond et des attractions, restaurants et boutiques assortis. Parmi les exemples célèbres figurent Le monde sorcier de Harry Potter chez Universal, Star Wars : Galaxy's Edge chez Disney ou Adventureland à Disneyland Paris. Ces univers créent une expérience immersive et constituent souvent les zones les plus photographiées du parc.",
    aliases: ['Univers thématiques'],
    alternateNames: ['Zone Thématique', 'Land', 'Monde thématique'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      "L'ouverture non officielle d'une attraction avant sa date de lancement annoncée.",
    definition:
      "Un Soft Opening se produit lorsqu'un parc ouvre discrètement une nouvelle attraction ou zone avant la date officielle — souvent sans annonce. Les parcs utilisent les Soft Openings pour tester leurs systèmes en conditions réelles, détecter les problèmes opérationnels et affiner les procédures d'embarquement. Comme ils peuvent commencer et s'arrêter sans préavis, ils constituent un bonus pour les visiteurs présents ce jour-là, mais pas une base de planification fiable. Les forums et les réseaux sociaux sont généralement les premiers à les signaler.",
    alternateNames: ['Soft Launch', 'Ouverture anticipée'],

    relatedTermIds: ['downtime', 'refurbishment', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      "La file d'attente classique d'une attraction, sans réservation ni pass spécial.",
    definition:
      "La file Standby est la file d'attente physique standard accessible à tous les visiteurs sans ticket supplémentaire ni upgrade. Ceux qui font la Standby attendent dans l'ordre d'arrivée — le temps affiché reflète directement l'affluence actuelle à l'attraction. Les jours chargés, les temps de Standby pour les attractions phares peuvent dépasser 90 minutes. park.fan suit les temps de Standby en temps réel pour vous aider à trouver la file la plus courte à tout moment.",
    aliases: ['File standby'],
    alternateNames: ['File Standard', 'File Normale', 'File classique'],

    relatedTermIds: ['express-pass', 'single-rider', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      "Le système d'accès prioritaire payant de Disney, successeur du programme FastPass+.",
    definition:
      "Lightning Lane est le nom donné par Disney à son système de file prioritaire, introduit en 2021 pour remplacer le programme gratuit FastPass+. Il existe en deux formules : Individual Lightning Lane (ILL), vendu séparément pour les attractions les plus demandées, et Lightning Lane Multi Pass (LLMP), un abonnement journalier permettant de réserver des créneaux de retour sur une sélection d'attractions. La Lightning Lane a suscité de nombreux débats car elle transforme un avantage autrefois gratuit en service payant. Le calendrier d'affluence de park.fan vous aide à juger les jours où la Lightning Lane vaut son prix.",
    alternateNames: ['Lightning Lane Multi Pass', 'Individual Lightning Lane', 'LLMP', 'ILL'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      "L'ancien abonnement journalier de Disney donnant accès à la Lightning Lane Multi Pass sur la plupart des attractions.",
    definition:
      "Genie+ (désormais rebaptisé Lightning Lane Multi Pass) était l'add-on journalier payant de Disney qui a remplacé FastPass+. Moyennant un tarif par personne et par jour, les visiteurs pouvaient réserver un créneau Lightning Lane à la fois sur une large sélection d'attractions. Les attractions phares étaient exclues et vendues séparément en Individual Lightning Lane. Le prix de Genie+ était dynamique et augmentait les jours les plus fréquentés. park.fan suit les niveaux d'affluence en détail pour vous aider à décider si l'abonnement en vaut la peine.",
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie', 'Lightning Lane Multi Pass'],

    relatedTermIds: ['express-pass', 'lightning-lane', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      "Un numéro d'allocation dans le système de file virtuelle, permettant l'accès à une attraction lorsque le groupe est appelé.",
    definition:
      "Un Boarding Group est une allocation numérotée au sein d'un système de file d'attente virtuelle, utilisé principalement pour les attractions les plus demandées où une file physique serait impraticable. Les visiteurs s'inscrivent via l'application du parc — souvent dès l'ouverture — et reçoivent un numéro de groupe. Lorsque ce numéro est appelé, ils disposent d'une fenêtre limitée pour se présenter à l'attraction. Les jours très fréquentés, tous les Boarding Groups peuvent être attribués en quelques minutes. Le système de Disney sur des attractions comme Tron Lightcycle Run ou Star Wars : Rise of the Resistance a popularisé ce concept dans toute la communauté des parcs.",
    aliases: ['Boarding Groups'],

    relatedTermIds: ['lightning-lane', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'off-peak',
    name: 'Hors-saison',
    shortDefinition:
      'Périodes de moindre fréquentation offrant des files plus courtes, des prix plus bas et une expérience plus sereine.',
    definition:
      "La hors-saison correspond aux périodes plus calmes du calendrier, lorsque les écoles sont en session et qu'aucun grand jour férié ne tombe — typiquement janvier à début février, mi-septembre à octobre (hors événements Halloween) et les premières semaines de novembre. En hors-saison, les temps d'attente pour les attractions populaires peuvent être nettement plus courts, les prix des billets souvent au plus bas et les parcs bien moins bondés. Pour les visiteurs disposant d'un emploi du temps flexible, choisir la hors-saison est l'une des stratégies les plus efficaces. Le calendrier d'affluence de park.fan met en évidence ces fenêtres.",
    alternateNames: ['Basse Saison', 'Hors Saison', 'Période Calme'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'offseason',
    name: 'Fermeture saisonnière',
    shortDefinition:
      'Période de fermeture saisonnière pendant laquelle le parc est entièrement fermé au public pour maintenance, travaux ou congés hivernaux.',
    definition:
      "La fermeture saisonnière (ou OffSeason) désigne la période pendant laquelle un parc à thème ferme complètement ses portes — non pas une simple période creuse, mais un véritable arrêt d'exploitation. Les parcs profitent de cette fenêtre pour effectuer les maintenances essentielles sur les attractions et équipements, engager des rénovations majeures impossibles en exploitation, et permettre au personnel de se reposer avant la nouvelle saison. Les fermetures saisonnières ont lieu le plus souvent en hiver et durent de quelques semaines à plusieurs mois selon le parc et son climat. Durant cette période, aucune attraction, restaurant ou spectacle n'est accessible au public.\n\nLorsque park.fan affiche le statut OffSeason pour un parc, cela signifie qu'aucun calendrier d'ouverture n'est disponible pour la période en cours et que la prochaine date d'ouverture confirmée est encore à plusieurs semaines. Consultez le site officiel du parc pour connaître la date exacte de réouverture — les parcs populaires affichent souvent complet dès les premiers jours de réouverture.",
    alternateNames: ['Off-Season', 'Fermeture Hivernale', 'Pause saisonnière'],

    relatedTermIds: ['crowd-calendar', 'refurbishment', 'soft-opening'],
  },
  {
    id: 'ride-photo',
    name: 'Photo de manège',
    shortDefinition:
      "Une photo ou vidéo automatiquement prise des visiteurs pendant une attraction, disponible à l'achat à la sortie.",
    definition:
      "La photo de manège est une image capturée automatiquement par une caméra fixe à un moment clé de l'attraction — généralement la descente d'une attraction aquatique ou le sommet d'un grand huit. À la sortie, les visiteurs peuvent consulter leur photo à un kiosque ou dans l'application du parc et choisir de l'acheter. De nombreux parcs proposent des forfaits photos journaliers incluant toutes les photos de manège du resort. La photo de manège est un souvenir apprécié et un classique des partages sur les réseaux sociaux.",
    aliases: ['Photo On-Ride'],

    relatedTermIds: ['themed-land'],
  },
  {
    id: 'queue-line',
    name: "File d'attente",
    shortDefinition:
      "La zone d'attente physique que les visiteurs traversent avant de monter sur une attraction, souvent aménagée de façon thématique.",
    definition:
      "La file d'attente est l'espace physique — couloirs, serpentins extérieurs ou salles intérieures — que les visiteurs parcourent en attendant d'embarquer sur une attraction. Dans de nombreux parcs modernes, la file fait elle-même partie de l'expérience : la file de la Haunted Mansion chez Disney crée l'atmosphère bien avant de monter dans le Doom Buggy, tandis que les attractions Harry Potter d'Universal plongent les visiteurs dans leur univers dès la file. Une file bien conçue rend l'attente beaucoup plus agréable, même lorsqu'elle est longue.",
    relatedTermIds: ['single-rider', 'standby-queue', 'wait-time'],
    aliases: ["Files d'attente"],
  },
  {
    id: 'opening-day',
    name: "Jour d'ouverture",
    shortDefinition:
      "La date officielle de lancement d'un nouveau parc, d'un univers thématique ou d'une attraction.",
    definition:
      "Le jour d'ouverture est la date officiellement annoncée à laquelle un nouveau parc, une extension ou une attraction ouvre ses portes au grand public pour la première fois. Ces jours sont des événements majeurs dans la communauté des parcs à thème : ils attirent généralement une forte couverture médiatique, de longues files et une atmosphère festive. Les parcs organisent souvent des cérémonies d'inauguration avec des spectacles et des apparitions de personnages. Comme le jour d'ouverture attire un grand nombre de visiteurs, ce n'est généralement pas le meilleur moment pour découvrir une nouvelle attraction avec peu d'attente. Des Soft Openings précèdent parfois la date officielle.",
    relatedTermIds: ['crowd-level', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      "Un système permettant aux accompagnateurs de se relayer sur une attraction pendant que l'autre attend avec les enfants qui ne remplissent pas les conditions de taille.",
    definition:
      "Le Rider Switch (appelé aussi Child Swap) est un système disponible dans la plupart des grands parcs à thème qui permet à un groupe de se relayer sur une attraction lorsqu'un membre — généralement un jeune enfant ne remplissant pas la taille minimale — ne peut pas participer. Un adulte monte sur l'attraction tandis que l'autre attend à l'entrée avec l'enfant ; lorsque le premier adulte revient, le second peut embarquer immédiatement sans reprendre la file d'attente. Chez Disney le système s'appelle Rider Switch ; chez Universal c'est Child Swap. Un jour chargé, le second adulte évite ainsi toute l'attente en Standby — un avantage non négligeable. Signalez-vous aux agents de l'attraction à l'entrée pour l'activer.",
    alternateNames: ['Child Swap', 'Rider Switch', 'Échange Parental', 'Baby Switch'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Date',
    shortDefinition:
      "Une date à laquelle certains niveaux d'abonnement annuel ne sont pas valables pour l'entrée au parc, généralement les jours les plus fréquentés de l'année.",
    definition:
      "Les Blockout Dates (aussi appelées blackout dates) sont des jours précis du calendrier où certains niveaux d'abonnement annuel ne donnent pas droit à l'entrée. Les parcs appliquent ces restrictions pour gérer la capacité les jours les plus chargés — jours fériés, week-ends de pointe et dates d'événements majeurs. Les abonnements supérieurs ont peu ou pas de dates bloquées, tandis que les abonnements d'entrée de gamme peuvent être bloqués 30 à 60 jours par an. Vérifiez toujours le calendrier des restrictions avant de visiter si vous disposez d'un abonnement limité. Le calendrier d'affluence de park.fan met en évidence les périodes de pointe pour croiser avec les restrictions de votre abonnement.",
    aliases: ['Dates bloquées'],
    alternateNames: ['Blackout', 'Blackout Date', 'Date de restriction'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'season-pass'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Événement à billet séparé',
    shortDefinition:
      "Un événement spécial à billet distinct (généralement en soirée) requérant une admission séparée du billet parc ordinaire, comme les fêtes d'Halloween ou de Noël.",
    definition:
      "Un événement à billet séparé est un événement — généralement en soirée — organisé dans un parc à thème et nécessitant un billet dédié en plus de l'entrée journalière classique. Ces événements proposent des animations exclusives, des décors thématiques et des expériences avec les personnages non disponibles pendant les heures normales d'ouverture. Parmi les exemples célèbres figurent le Mickey's Not-So-Scary Halloween Party et le Mickey's Very Merry Christmas Party à Walt Disney World, Halloween Horror Nights chez Universal, et les événements saisonniers de Disneyland Paris. Ces jours-là, les visiteurs ordinaires sont généralement invités à quitter le parc à 18h–19h. Les billets s'épuisent souvent des semaines à l'avance.",
    aliases: ['Événements spéciaux'],
    alternateNames: ['Soirée Spéciale', 'After-Hours', 'Hard Ticket Event'],

    relatedTermIds: ['early-entry', 'peak-day', 'season-pass'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      "L'ancien système de file prioritaire gratuit de Disney, remplacé par la Lightning Lane payante en 2021.",
    definition:
      "Le FastPass+ (à l'origine FastPass, lancé en 1999) était le système de file prioritaire gratuit de Disney permettant aux visiteurs de réserver des créneaux de retour sur les attractions sans supplément. À Walt Disney World, les visiteurs pouvaient réserver jusqu'à trois FastPass+ par jour via l'application My Disney Experience avant d'en ajouter d'autres un par un. Le système a été suspendu lors de la fermeture COVID en 2020 et n'a jamais été rétabli — remplacé par la Lightning Lane payante fin 2021. Le FastPass+ reste l'un des changements les plus discutés de l'histoire Disney, car il a transformé un avantage gratuit en service payant. Comprendre l'ancien système est utile pour lire les anciens comptes rendus de visite.",
    aliases: ['FastPass+', 'FastPass Plus'],

    relatedTermIds: ['express-pass', 'genie-plus', 'lightning-lane', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Heure de retour',
    shortDefinition:
      "Une fenêtre horaire réservée pour revenir sur une attraction, délivrée par la Lightning Lane, la file virtuelle ou un système similaire d'accès prioritaire.",
    definition:
      "Une heure de retour (parfois appelée fenêtre de retour) est un créneau horaire précis — généralement d'une heure — pendant lequel un visiteur ayant réservé un accès prioritaire (via la Lightning Lane, une file virtuelle ou un système similaire) peut se présenter à l'entrée dédiée de l'attraction. Les heures de retour permettent aux visiteurs de profiter d'autres zones du parc pendant l'intervalle plutôt que de faire la queue physiquement. Manquer sa fenêtre de retour (généralement définie par un retard de quelques minutes au-delà du créneau) entraîne en principe la perte de la réservation. Les données de temps d'attente et de niveau d'affluence de park.fan vous aident à décider quelles attractions prioriser pour les réservations.",
    relatedTermIds: ['boarding-group', 'fastpass', 'lightning-lane', 'virtual-queue'],
    alternateNames: ['Return Time', 'Créneau de retour'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      "Exclusive Ride Time — une session pendant laquelle un groupe d'enthousiastes ou de clients d'hôtel bénéficie d'un accès exclusif à une ou plusieurs attractions sans file publique.",
    definition:
      "L'ERT (Exclusive Ride Time) est une période pendant laquelle un groupe sélectionné — généralement des membres d'un club d'enthousiastes de montagnes russes, des clients d'hôtels du resort ou des détenteurs d'abonnements premium — bénéficie d'un accès exclusif à une ou plusieurs attractions sans public général. Pendant un ERT, les participants peuvent se relancer à volonté avec une attente minimale, réalisant parfois des dizaines de tours en une seule session. Les sessions ERT sont organisées par les parcs pour des événements de clubs spécialisés (comme l'European Coaster Club ou l'American Coaster Enthusiasts), pour des packages hôteliers premium, ou dans le cadre d'événements après fermeture. Pour les enthousiastes, l'ERT est l'une des expériences les plus prisées — elle révèle le vrai caractère d'une attraction sans la pression de la file.",
    alternateNames: ['Exclusive Ride Time', 'Temps de trajet exclusif'],

    relatedTermIds: ['credit', 'early-entry', 'hard-ticket-event', 'rope-drop'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      "Un itinéraire détaillé et optimisé pour une visite de parc à thème, séquençant les attractions pour minimiser les temps d'attente et maximiser le nombre de manèges dans la journée.",
    definition:
      "Un Touring Plan est une séquence pré-planifiée d'attractions, de repas et de déplacements dans le parc conçue pour minimiser le temps total d'attente dans la journée. Les bons Touring Plans tiennent compte des schémas d'affluence (quelles zones se remplissent en premier), des capacités des attractions, de la dynamique des files, des horaires de spectacles et de la météo. Des sites comme TouringPlans.com (désormais Thrill-Data) publient des plans détaillés collaboratifs pour les grands parcs. Les temps d'attente en direct et le calendrier d'affluence de park.fan sont des outils complémentaires : consulter les données en temps réel permet d'ajuster son plan en cours de journée. Les jours chargés, un bon Touring Plan peut réduire le temps total en file de 30 à 50 % par rapport à une visite spontanée.",
    alternateNames: ['Plan de Visite', 'Itinéraire', 'Plan de visite optimisé'],

    relatedTermIds: ['crowd-calendar', 'early-entry', 'rope-drop', 'wait-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      "Une attraction intérieure dans laquelle les visiteurs se déplacent à bord de véhicules guidés à travers des décors thématiques, des effets spéciaux et des scènes animées dans l'obscurité.",
    definition:
      "Un dark ride est une attraction fermée où des véhicules guidés transportent les visiteurs à travers une succession de décors thématiques, d'effets lumineux et sonores, d'animatroniques et de projections dans un environnement obscur ou semi-obscur. Les dark rides vont des classiques comme les Fantômes d'Halloween de Disneyland aux aventures modernes à base de simulateurs et de tir, comme Men in Black à Universal. Le terme est utilisé en français dans la communauté des parcs, au même titre que dans les milieux professionnels. Les dark rides sont parmi les attractions les plus accessibles à tous les publics et figurent en bonne place parmi les incontournables des grands parcs référencés sur park.fan.",
    aliases: ['Dark Rides'],
    alternateNames: ['Attraction Couverte', 'Manège Intérieur', 'Attraction en intérieur'],

    relatedTermIds: [
      'height-requirement',
      'ride-capacity',
      'soft-opening',
      'themed-land',
      'vr-coaster',
      'wait-time',
    ],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      "Bolliger & Mabillard, fabricant suisse de montagnes russes réputé pour ses attractions lisses et fiables ainsi que ses éléments signature comme l'Immelmann, le cobra roll et le zero-G roll.",
    definition:
      "B&M (Bolliger & Mabillard) est un fabricant suisse de montagnes russes fondé en 1988 par Walter Bolliger et Claude Mabillard. La société est réputée pour produire des attractions d'une fluidité et d'une fiabilité exceptionnelles, caractérisées par des G-forces positives soutenues, des inversions signature (Immelmann, cobra roll, zero-G roll) et une excellente capacité d'accueil. B&M se spécialise dans les coasters inversés, les sit-down loopers, les hyper coasters (plus de 61 m), les giga coasters (plus de 91 m), les wing coasters et les dive machines. Presque tous les grands parcs européens possèdent au moins une installation B&M, dont Shambhala et Dragon Khan à PortAventura, Silver Star à Europa-Park, Nemesis à Alton Towers et Goliath au Walibi Holland.",
    aliases: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],

    relatedTermIds: ['cobra-roll', 'dive-coaster', 'hybrid-coaster', 'immelmann', 'zero-g-roll'],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      "Fabricant suisse de montagnes russes connu pour ses lancements hydrauliques records, ses mega/giga coasters et ses designs innovants — à l'origine de nombreuses attractions parmi les plus rapides et les plus hautes du monde.",
    definition:
      "Intamin AG est un fabricant d'attractions suisse fondé en 1967, responsable de certains des records les plus ambitieux de l'histoire des montagnes russes. Son système de lancement hydraulique a propulsé les coasters les plus rapides et les plus hauts du monde pendant des années (Kingda Ka, 139 m ; Top Thrill Dragster). Intamin est également connu pour ses mega et giga coasters (dont Millennium Force à Cedar Point et Intimidator 305 à Kings Dominion), ses multi-launch coasters, ses attractions aquatiques et ses dark rides. Ses designs sont souvent à la pointe de l'échelle et de l'innovation, même si la société a aussi la réputation d'une maintenance complexe. Les installations Intamin en Europe incluent Taron et Black Mamba à Phantasialand et Red Force au Ferrari Land.",
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      "Fabricant familial allemand basé à Waldkirch près d'Europa-Park, produisant des attractions aquatiques, des dark rides et des coasters en acier de plus en plus ambitieux.",
    definition:
      "Mack Rides est un fabricant d'attractions allemand basé à Waldkirch, en Bade-Wurtemberg — à quelques kilomètres d'Europa-Park, la vitrine phare de la société. Fondé en 1921, Mack produit des attractions aquatiques, des dark rides (dont Test Track et Radiator Springs Racers pour Disney) et un portefeuille croissant de coasters à sensations. Son Blue Fire Megacoaster à Europa-Park (2009) a été la première attraction à intégrer un Stengel Dive. Les hyper coasters plus récents de Mack (Ride to Happiness à Plopsaland, Kondaa au Walibi Belgium) ont reçu des éloges unanimes de la communauté enthousiaste. Mack Rides occupe une place prépondérante dans les parcs européens, en particulier à Europa-Park, propriété de la famille Mack.",
    aliases: ['Mack'],

    relatedTermIds: ['b-and-m', 'intamin', 'launch-coaster', 'stengel-dive'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Rocky Mountain Construction, fabricant américain pionnier du coaster hybride, transformant des montagnes russes en bois vieillissantes en pistes acier pour offrir airtime et inversions inédits.',
    definition:
      "Rocky Mountain Construction (RMC) est un fabricant et prestataire de maintenance américain basé à Hayden, Idaho, surtout connu pour avoir inventé le système de rails I-box en acier pouvant être posé sur des structures de coasters en bois existantes. Cette technologie de conversion permet aux parcs de transformer des montagnes russes en bois rugueuses et vieillissantes en attractions hybrides de classe mondiale intégrant airtime intense, inversions multiples et descentes au-delà de la verticale — des performances impossibles sur du bois traditionnel. Les conversions RMC comme Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) et Wildfire (Kolmården) sont rapidement devenues des coups de cœur des enthousiastes. En Europe, le nouveau-build hybride RMC Untamed au Walibi Holland est considéré comme l'un des meilleurs coasters du continent.",
    aliases: ['Rocky Mountain Construction'],

    relatedTermIds: ['airtime', 'barrel-roll-drop', 'hybrid-coaster', 'stall', 'wooden-coaster'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      "Fabricant néerlandais de montagnes russes et l'un des plus prolifiques au monde, connu pour le Boomerang omniprésent ainsi qu'une large gamme de coasters familiaux et frissonnants dans les parcs européens.",
    definition:
      "Vekoma Rides Manufacturing est un fabricant néerlandais de montagnes russes basé à Vlodrop, aux Pays-Bas, et l'un des producteurs les plus prolifiques du monde en termes d'installations totales. Fondée en 1926 comme entreprise de génie mécanique, Vekoma s'est tournée vers les attractions en 1970 et a acquis une renommée mondiale avec son coaster Boomerang — un shuttle coaster compact à trois inversions, licencié à bas coût et installé dans des parcs du monde entier. Parmi les autres modèles emblématiques figurent le Suspended Looping Coaster (SLC), le Giant Inverted Boomerang et le Mine Train. À partir des années 2010, Vekoma s'est réinventé avec une nouvelle gamme moderne offrant des systèmes de conduite plus doux, des layouts innovants et des attractions familiales améliorées. Les nouvelles générations de Family Boomerang, de Tilt Coaster et de coasters familiaux suspendus apparaissent de plus en plus dans les parcs européens. Disney a également commandé des designs Vekoma personnalisés pour ses resorts.",
    aliases: ['Vekoma Rides'],

    relatedTermIds: ['b-and-m', 'boomerang', 'gerstlauer', 'intamin'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Fabricant allemand surtout connu pour son modèle Euro-Fighter avec sa première descente au-delà de la verticale, ainsi que pour ses spinning coasters et ses attractions familiales compactes.',
    definition:
      "Gerstlauer Amusement Rides GmbH est un fabricant allemand de montagnes russes basé à Münsterhausen, en Bavière. Fondée en 1946 comme entreprise de métallurgie, elle s'est lancée dans les attractions foraines dans les années 1980 et a bâti sa réputation mondiale avec le modèle Euro-Fighter — un coaster compact à lancement électrique célèbre pour sa descente initiale au-delà de la verticale (97 degrés). Les Euro-Fighters peuvent être installés dans des espaces réduits, ce qui les rend attrayants pour les parcs urbains et les petits sites ; citons Rage à Adventure Island et Speed à Oakwood. Gerstlauer produit également le modèle Infinity Coaster, des spinning coasters et le SkyRoller, un coaster rotatif où les passagers contrôlent leur propre retournement. Les enthousiastes apprécient les montagnes russes Gerstlauer pour leur intensité malgré leur faible encombrement.",
    aliases: ['Gerstlauer Rides'],

    relatedTermIds: [
      'b-and-m',
      'euro-fighter',
      'intamin',
      'spinning-coaster',
      'xtreme-spinning-coaster',
    ],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Légendaire fabricant allemand dont les coasters looping classiques des années 70 et 80 sont encore adorés dans les parcs européens pour leur expérience de conduite intense et parfaitement fluide.',
    definition:
      "Anton Schwarzkopf GmbH & Co. KG était un fabricant allemand de montagnes russes basé à Münsterhausen, en Bavière — la ville où Gerstlauer s'installa plus tard. Fondée par Anton Schwarzkopf en 1954, l'entreprise a joué un rôle déterminant dans l'introduction des coasters looping en Europe. La Revolution au Six Flags Magic Mountain (1976) était le premier coaster looping moderne du monde, conçu par Schwarzkopf. Les modèles phares incluent le Looping Star, le Thriller/Wildcat et le transportable Looping Coaster, qui a tourné dans toute l'Europe. Les coasters Schwarzkopf sont réputés pour leurs trajets d'une fluidité incomparable et l'efficacité élégante de leurs layouts — fruit d'une ingénierie précise. L'entreprise a fait faillite en 1983, mais de nombreuses installations restent en service des décennies plus tard, chéries par les parcs et les enthousiastes comme des classiques irremplaçables. L'entretien est aujourd'hui assuré par des entreprises spécialisées ou Gerstlauer, qui a racheté une partie des outillages.",
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      "Un coaster qui accélère les visiteurs de 0 à haute vitesse via un système de lancement magnétique, hydraulique ou pneumatique plutôt qu'une remontée mécanique traditionnelle.",
    definition:
      "Un Launch Coaster remplace la remontée mécanique par un système de propulsion qui accélère le train d'un point fixe à sa vitesse maximale en quelques secondes. Les principales technologies sont : le lancement LSM (moteur synchrone linéaire) — des bobines électromagnétiques accélèrent une ailette sur le train ; le LIM (moteur à induction linéaire) — similaire mais moins efficace ; le lancement hydraulique — un câble piloté par piston utilisé par Intamin sur des coasters records comme Kingda Ka ; et les lancements à air comprimé. Certains coasters comportent plusieurs lancements successifs dans le circuit. L'accélération soudaine et puissante est une sensation définissante qu'une remontée mécanique ne peut pas reproduire.",
    alternateNames: ['LSM Coaster', 'LIM Coaster', 'Coaster à Lancement', 'Catapulte'],

    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
  },
  {
    id: 'wooden-coaster',
    name: 'Montagnes russes en bois',
    shortDefinition:
      'Une montagne russe construite principalement en bois, caractérisée par son grondement distinctif, ses mouvements latéraux et son airtime imprévisible.',
    definition:
      "Les montagnes russes en bois sont des attractions dont la structure et la voie sont construites en bois. Contrairement aux coasters en acier, le bois possède une flexibilité naturelle qui crée le grondement caractéristique, le ballottement latéral et l'airtime imprévisible que les enthousiastes apprécient. Parmi les coasters en bois célèbres : Balder à Liseberg, The Beast à Kings Island et Megafobia à Oakwood. Les coasters en bois nécessitent un entretien constant — la voie doit être relaminée régulièrement — et sont sensibles aux variations climatiques. Le procédé de conversion RMC (Rocky Mountain Construction) peut transformer des coasters en bois vieillissants en coasters hybrides à voie acier tout en conservant la structure bois.",
    relatedTermIds: ['airtime', 'hybrid-coaster', 'rmc'],
    aliases: ['Montagnes russes en bois'],
    alternateNames: ['Woodie', 'Woodies', 'Coaster en bois'],
  },
  {
    id: 'steel-coaster',
    name: 'Montagne russe en acier',
    shortDefinition:
      'Une montagne russe construite avec une voie et une structure en acier, connue pour sa conduite lisse et précise.',
    definition:
      "Une montagne russe en acier est construite avec une voie tubulaire ou plate en acier supportée par un cadre en acier. Contrairement aux montagnes russes en bois avec leur flexibilité naturelle, l'acier offre aux ingénieurs un contrôle précis des forces G, des transitions et des inversions. La conduite lisse et prévisible d'une montagne russe en acier permet de créer des layouts complexes avec plusieurs inversions, des courbes serrées et des sections à haut vitesse.\n\nLes montagnes russes en acier dominent le développement moderne des coasters. Les exemples les plus célèbres en Europe incluent Shambhala à PortAventura, Nemesis à Alton Towers et Silver Star à Europa-Park. Les montagnes russes en acier vont des petites attractions familiales aux mega coasters record-brisants. La précision de l'acier exige une inspection et un entretien réguliers, mais offre moins de marge d'erreur de conception que la flexibilité du bois.",
    relatedTermIds: ['hyper-coaster', 'inversion', 'launch-coaster', 'wooden-coaster'],
    aliases: ['Montagnes russes en acier'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'Un coaster où le train pend sous la voie sur un pivot, permettant au véhicule de se balancer librement de côté.',
    definition:
      "Un suspended coaster est un type de coaster spécialisé où le train est suspendu depuis le haut sur un point pivot, lui permettant de se balancer librement d'un côté à l'autre. Alors que le train navigue dans les courbes, il se balance comme un pendule — un mouvement qui crée la sensation caractéristique du 'whip' et ajoute un élément imprévisible à l'expérience. Ce mouvement de balancement est distinct d'un inverted coaster, où le train est rigidement attaché au-dessus de la voie.\n\nLes suspended coasters sont moins courants que les inverted coasters mais offrent une expérience unique. Le mouvement de balancement rend même les virages modérés dramatiques, et la sensation de 'voler' avec le sol loin dessous crée une exposition frissonnante. Vekoma a créé le modèle Suspended Looping Coaster (SLC) dans les années 1990, et des centaines ont été construits mondialement. Le mouvement de balancement peut sembler chaotique comparé à la précision des inversions modernes, rendant les suspended coasters soit aimés pour leur nature brute et imprévisible.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'vekoma'],
    aliases: ['Suspended Coasters'],
    alternateNames: ['Balançant', 'Oscillant'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster hybride',
    shortDefinition:
      'Un coaster combinant une structure en bois traditionnelle avec une voie I-box en acier, concept pioneered par Rocky Mountain Construction (RMC).',
    definition:
      "Un coaster hybride associe la structure en bois d'un coaster traditionnel à une voie I-box en acier fabriquée par Rocky Mountain Construction (RMC). La voie I-box est extrêmement précise et lisse, permettant des éléments d'inversion impossibles sur une voie en bois classique. RMC a développé cette technologie principalement pour rénover des coasters en bois vieillissants — en ajoutant des inversions, des descentes plus raides et des airtime hills à des layouts auparavant trop rugueux. Les hybrides RMC célèbres incluent Steel Vengeance (Cedar Point, souvent cité comme le meilleur coaster du monde), Twisted Colossus (Six Flags Magic Mountain) et Wildfire (Kolmården). Des new-builds hybrides RMC comme Untamed au Walibi Holland existent désormais aux côtés des conversions.",
    aliases: ['Hybrid Coasters'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Coaster hybride'],

    relatedTermIds: ['airtime', 'rmc', 'wooden-coaster'],
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
    relatedTermIds: ['b-and-m', 'euro-fighter', 'first-drop', 'launch-coaster'],
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
    relatedTermIds: ['cobra-roll', 'corkscrew', 'immelmann', 'vertical-loop', 'zero-g-roll'],
    aliases: ['Inversions'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      "L'inversion classique en forme de cercle vertical complet, emmenant les passagers entièrement à l'envers au sommet.",
    definition:
      "Le looping vertical est l'inversion la plus iconique de l'histoire des montagnes russes — un cercle complet à 360° dans le plan vertical. Les loops modernes utilisent une forme clothoïde (en larme) plutôt qu'un cercle parfait : l'entrée et la sortie sont larges, tandis que le haut du loop est serré. Cette forme garantit que les passagers ressentent des G-forces régulières et soutenues plutôt que des pics extrêmes. Le premier coaster à loop moderne (Corkscrew, Knott's Berry Farm, 1975) a transformé l'industrie. Aujourd'hui les loopings verticaux ancrent le compteur d'inversions des coasters du monde entier, des attractions pour novices aux machines records.",
    alternateNames: ['Boucle Verticale', 'Vertical Loop'],

    relatedTermIds: ['cobra-roll', 'immelmann', 'inclined-loop', 'interlocking-loops', 'inversion'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      "Un demi-looping qui propulse le train vers le haut et par-dessus, puis un demi-tonneau qui repart dans la direction opposée — nommé d'après le pilote de la Première Guerre mondiale Max Immelmann.",
    definition:
      "Le virage Immelmann est une inversion signature B&M en deux phases : la voie monte d'abord en demi-looping vertical, amenant les passagers par-dessus et brièvement à l'envers ; puis un demi-tonneau remet le train à l'endroit tout en inversant le cap de 180 degrés. L'élément porte le nom de l'as de l'aviation de la Première Guerre mondiale Max Immelmann, qui utilisait une manœuvre aérienne similaire. Les Immelmanns se distinguent car ils produisent à la fois une inversion impressionnante et un important changement de direction dans un seul élément fluide. On les retrouve sur presque tous les coasters B&M sit-down, inversés et hyper du monde entier.",
    relatedTermIds: ['b-and-m', 'dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      "Un tonneau à 360° suivant un arc parabolique où les passagers ressentent une quasi-apesanteur au sommet — l'un des éléments les plus appréciés du design moderne de coasters.",
    definition:
      "Le zero-G roll (tonneau à gravité zéro) est un élément d'inversion dont la forme fait suivre au train un arc parabolique à travers la rotation — similaire dans le concept au heartline roll mais à plus grande vitesse et avec un déplacement vertical plus marqué. Au sommet du tonneau, les passagers ressentent un bref instant de G-forces négatives (airtime) tout en étant à l'envers, créant une sensation unique, désorientante et très appréciée. Les zero-G rolls sont associés principalement aux wing coasters et aux hyper coasters B&M, où l'élément fait balayer les passagers des sièges d'aile de manière spectaculaire dans l'espace ouvert. Shambhala à PortAventura et Fury 325 à Carowinds disposent de zero-G rolls reconnus.",
    relatedTermIds: ['airtime', 'b-and-m', 'heartline-roll', 'inversion', 'zero-g-winder'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      "La montée mécanique qui propulse le train au point le plus haut du circuit, convertissant l'énergie électrique en énergie potentielle gravitationnelle.",
    definition:
      "Le lifthill est le segment où un mécanisme externe hisse le train depuis le niveau du sol jusqu'au point le plus haut du trajet. Le mécanisme le plus courant est une chaîne courant le long du centre de la voie — le familier 'clic-clic-clic' est le cliquet anti-recul. Les alternatives incluent les lifts à câble/corde (plus silencieux et plus doux), les lifts à galets motorisés (utilisés sur certains coasters B&M modernes) et la propulsion magnétique. La hauteur du lifthill détermine la vitesse maximale potentielle du coaster. Certains designs modernes utilisent plusieurs lifthills ou combinent une montée avec des segments de lancement. Le lifthill est généralement le moment le plus lent et le plus chargé en anticipation de l'attraction.",
    aliases: ['Lift Hill'],
    alternateNames: ['Chain Lift', 'Chaîne de remontée'],

    relatedTermIds: ['block-brake', 'first-drop', 'launch-coaster'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'La descente initiale suivant le lifthill — généralement le point le plus haut et le plus rapide du trajet, définissant le caractère du coaster.',
    definition:
      "Le First Drop est la descente principale immédiatement après le lifthill ou le segment de lancement. Sur la plupart des coasters traditionnels, c'est la colline la plus haute et celle qui produit la vitesse maximale. L'angle, la hauteur et le profil influencent fortement le caractère général : les descentes à angle prononcé (plus de 80–90°) créent une intense sensation d'accélération, tandis que les descentes paraboliques peuvent générer un fort airtime malgré un angle plus doux. Les Dive Coasters comportent des descentes dépassant 90° (au-delà de la verticale), invitant les passagers à se pencher au-dessus du vide. Le First Drop est souvent le moment le plus attendu sur tout nouveau coaster et est couramment filmé pour les supports promotionnels.",
    relatedTermIds: ['airtime', 'airtime-hill', 'dive-coaster', 'lifthill'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'Un élément en forme de colline conçu pour générer des G-forces négatives, faisant ressentir aux passagers une apesanteur ou les soulevant de leur siège.',
    definition:
      "Un Airtime Hill (aussi appelé camelback) est un élément de montée-descente courbé conçu pour produire des G-forces négatives — la sensation de flotter ou d'être éjecté de son siège. Le floater airtime est une légère G négative ; l'ejector airtime est intense, la barre de maintien devenant alors la seule chose entre le passager et le ciel. Les coasters en acier utilisent des collines paraboliques précisément profilées pour un airtime cohérent et prévisible ; les coasters en bois produisent un airtime plus imprévisible et rugueux en raison de la flexibilité de la voie. Les Airtime Hills figurent parmi les éléments les plus appréciés dans les classements des enthousiastes et sont une caractéristique déterminante des hyper coasters, giga coasters et coasters en bois modernes.",
    aliases: ["Collines d'airtime"],
    alternateNames: ['Camelback', 'Bunny Hill'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      "Une section en spirale continue où la voie s'enroule autour d'un axe central, générant des G-forces latérales soutenues.",
    definition:
      "Un hélix est une section de voie de coaster qui spirale en continu — comme une vis — sans inverser les passagers. Contrairement aux airtime hills ou aux inversions, les hélices génèrent des G-forces latérales (latérales) soutenues qui plaquent les passagers vers l'extérieur des virages. Un hélix descendant accélère le train tout en virant ; un hélix montant le décélère tout en maintenant les forces latérales. Les hélices sont couramment utilisées pour dissiper l'énergie cinétique résiduelle en fin de circuit tout en offrant une sensation de virage intense et soutenue. Les hélices célèbres incluent le final souterrain de Nemesis à Alton Towers et l'hélix de clôture d'Expedition GeForce à Holiday Park.",
    aliases: ['Helices'],
    alternateNames: ['Hélicoïde', 'Spirale', 'Virage hélicoïdal'],

    relatedTermIds: ['first-drop', 'horseshoe'],
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
    relatedTermIds: ['b-and-m', 'banana-roll', 'batwing', 'immelmann', 'inversion', 'sea-serpent'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      "Une inversion en tonneau où la voie spirale à 360° autour d'un axe central — l'un des premiers types d'inversions construits et les plus répandus.",
    definition:
      "Le tire-bouchon est l'une des premières inversions modernes, introduite par Arrow Dynamics dans les années 1970. La voie spirale autour d'un cylindre central comme un tire-bouchon à vin, faisant tourner les passagers dans un tonneau complet à 360° en décalage par rapport à la direction de déplacement. Les tire-bouchons sont souvent couplés en arrangements consécutifs et sont l'élément caractéristique du coaster en acier de l'ère classique. Le terme allemand 'Korkenzieher' est largement utilisé sur les plans et la signalétique des parcs germaniques. Bien que les conceptions d'inversions plus récentes l'aient largement supplanté, le tire-bouchon reste un élément apprécié dans les parcs d'Europe et d'Amérique du Nord.",
    relatedTermIds: ['flat-spin', 'inline-twist', 'inversion'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      "Le pendant inverse de l'Immelmann : la voie plonge brusquement vers le bas dans un demi-looping et ressort horizontalement — inversant la direction à l'opposé d'un Immelmann.",
    definition:
      "Un Dive Loop (aussi appelé dive turn ou reverse Immelmann) commence là où l'Immelmann s'arrête : au lieu de monter et de passer par-dessus, la voie plonge brusquement vers le bas, décrivant la moitié inférieure d'un loop avant de ressortir dans la direction opposée à l'entrée. La sensation est celle d'une plongée descendante suivie d'un brusque redressement en force. Les Dive Loops sont un élément signature B&M et apparaissent sur de nombreux coasters inversés et sit-down du fabricant. La combinaison d'Immelmanns et de Dive Loops dans un même circuit crée des changements de direction et des types d'inversion variés.",
    relatedTermIds: ['b-and-m', 'immelmann', 'inversion'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      "Un tonneau à 360° directement autour de l'axe de la voie, offrant une inversion fluide sans modifier sensiblement la direction de déplacement du train.",
    definition:
      "Un Inline Twist (aussi appelé inline roll ou barrel roll) fait tourner le train à 360° autour de l'axe longitudinal de la voie — le coaster effectue un tonneau sans dévier significativement de sa direction. Contrairement au tire-bouchon (dont la spirale est décalée par rapport à l'axe central de la voie), l'inline twist pivote précisément autour de la voie. Le résultat est une inversion brève et fluide avec un minimum de forces latérales. Les Inline Twists sont courants sur les flying coasters et les coasters inversés B&M, apparaissant souvent en paires ou combinés à d'autres éléments en succession rapide. L'élément produit un bref instant à l'envers qui paraît étonnamment doux.",
    relatedTermIds: ['corkscrew', 'flat-spin', 'heartline-roll', 'inversion'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Un tonneau à 360° centré sur le centre de gravité du passager plutôt que sur la voie elle-même, conçu pour offrir une apesanteur douce et soutenue tout au long de la rotation.',
    definition:
      "Un Heartline Roll (ou heartline spin) est conçu de façon que le cœur du passager — approximativement le centre de gravité du corps — reste à une altitude constante tout au long de la rotation, plutôt que la voie soit le point de pivot. Cette conception minimise les G-forces pendant le tonneau, produisant une douce sensation de flottement distincte du choc d'un tire-bouchon standard. Les Heartline Rolls sont une marque de fabrique du design de coasters B&M et Intamin modernes, associés aux hyper coasters et aux invert coasters. L'élément illustre la précision d'ingénierie nécessaire pour créer un trajet fluide — de minimes ajustements de voie se traduisent directement par le confort ou l'inconfort des passagers.",
    relatedTermIds: ['inline-twist', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Un demi-looping combiné à un demi-tire-bouchon qui pivote la voie de 90° et change de direction — un élément signature Vekoma présent sur les coasters Boomerang.',
    definition:
      "Un Sidewinder consiste en un demi-looping vertical qui propulse le train vers le haut, immédiatement suivi d'un demi-tire-bouchon qui remet le train à l'endroit tout en effectuant un virage à 90°. Le résultat net est une inversion combinée à un changement de direction significatif, dans un espace compact. Les Sidewinders sont les briques de base du célèbre modèle Boomerang de Vekoma : deux sidewinders (un en avant, un inversé) encadrant un looping central pour constituer le circuit complet. Le nom fait référence au mouvement de torsion serpentin que l'élément produit vu depuis le bord de la voie.",
    relatedTermIds: ['boomerang', 'cobra-roll', 'inversion'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      "Une inversion massive exclusive aux flying coasters B&M où les passagers, déjà en position Superman, passent par le bas d'un looping vertical en étant entièrement à l'envers.",
    definition:
      "Le Pretzel Loop est l'une des inversions les plus intenses du design de parcs à thème, présente exclusivement sur les flying coasters B&M (où les passagers sont allongés horizontalement en position Superman). L'élément envoie les passagers en plongée abrupte à l'envers, à travers le bas d'un grand loop, avant de remonter brusquement — la forme générale ressemblant à un bretzel vue de côté. Comme le point bas se trouve en bas et que les passagers sont face vers le sol, les G-forces ressenties à cet instant sont extrêmement intenses. Des Pretzel Loops célèbres figurent sur Manta à SeaWorld Orlando et Tatsu à Six Flags Magic Mountain.",
    relatedTermIds: ['b-and-m', 'inline-twist', 'inversion'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Un élément à double inversion avec inversion de direction à 180°, combinant deux demi-loopings reliés par un demi-tire-bouchon — la forme évoque des ailes de chauve-souris déployées.',
    definition:
      "Un Batwing est composé de deux inversions avec inversion de direction : la voie s'arc en demi-looping vers le haut, puis au sommet passe par un demi-tire-bouchon qui met le train à l'envers tout en inversant la direction avant de reproduire le demi-looping vers le bas. La forme vue du dessus ressemble à des ailes de chauve-souris déployées. Les Batwings sont un élément signature B&M, présents sur des coasters comme Afterburn à Carowinds et The Incredible Hulk Coaster à Universal's Islands of Adventure. Contrairement au bowtie (sans changement de direction), le Batwing inverse le cap du train de 180° pendant la séquence.",
    relatedTermIds: ['b-and-m', 'bowtie', 'cobra-roll', 'inversion'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      "Une variante de looping où la voie arrive par le haut, plonge dans le chemin circulaire et ressort au sommet — la géométrie inverse d'un looping standard.",
    definition:
      "Le Norwegian Loop (parfois appelé reverse loop) a la géométrie inverse d'un looping vertical standard : plutôt que d'entrer au niveau du sol et de ressortir à la même hauteur, le train arrive d'une position élevée, plonge dans le chemin circulaire du loop, puis ressort à nouveau par le haut. Cela signifie que les forces ressenties au bas du cercle — de fortes G positives — sont toujours présentes, mais les sensations d'entrée et de sortie sont nettement différentes. Les Norwegian Loops sont relativement rares dans l'inventaire mondial des coasters et sont associés principalement à certains designs Vekoma et installations sur mesure.",
    relatedTermIds: ['dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Un élément de type tire-bouchon sur les coasters inversés ou flying où la rotation se produit dans un plan approximativement horizontal, créant une rotation balayante presque à plat.',
    definition:
      "Un Flat Spin est une inversion de type tire-bouchon présente principalement sur les coasters inversés et flying B&M, où la géométrie de l'élément est arrangée de sorte que la spirale paraisse presque horizontale aux observateurs au sol. Sur un coaster inversé (où le train pend sous la voie), un Flat Spin crée un visuel particulièrement spectaculaire tandis que les passagers balayent un large cercle presque à plat. Pour les passagers, la sensation est une rotation douce et soutenue avec des G-forces modérées. Les Flat Spins sont un élément signature des coasters inversés B&M comme Banshee à Kings Island et Afterburn à Carowinds.",
    relatedTermIds: ['b-and-m', 'corkscrew', 'inline-twist', 'inversion'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      "Un demi-tire-bouchon qui inverse simultanément la direction du train d'environ 180° — combinant une inversion à un brusque changement de direction.",
    definition:
      "Un Cutback est un élément où la voie effectue un demi-tire-bouchon tout en se repliant sur elle-même d'environ 180°. Le résultat est une inversion avec un important renversement de direction — distincte d'un tire-bouchon standard qui maintient globalement la direction de déplacement. Les Cutbacks sont relativement rares et apparaissent sur certains modèles Vekoma et coasters sur mesure où un changement de direction compact combiné à une inversion est requis. Le nom 'cutback' reflète l'apparence visuelle de l'élément : la voie revient sur sa direction précédente tout en pivotant.",
    relatedTermIds: ['corkscrew', 'inversion', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Une variante de double inversion sea-serpent avec un apex de liaison plus bas, produisant deux inversions consécutives sans changement de direction dans un espace compact.',
    definition:
      "Le Butterfly est un élément à double inversion similaire au sea serpent (deux demi-loopings reliés au sommet) mais avec un apex plus bas et une géométrie distincte. Comme le sea serpent, il produit deux inversions sans modifier la direction du train, mais la pièce de liaison entre les deux demi-loopings passe par une section inversée plus basse plutôt qu'un sommet en hauteur. Cela rend le Butterfly plus compact verticalement. L'élément apparaît sur certains designs Vekoma et coasters sur mesure et se distingue du bowtie (sans changement de direction, même géométrie mais disposition différente) et du batwing (avec changement de direction).",
    relatedTermIds: ['batwing', 'bowtie', 'inversion'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Un élément à double inversion composé de deux demi-loopings en miroir formant un nœud papillon — deux inversions sans changement de direction.',
    definition:
      "Un Bowtie est un élément à double inversion composé de deux demi-loopings en miroir reliés à leur sommet. Contrairement au batwing (qui inverse la direction), le bowtie ressort dans le même cap général qu'à l'entrée. Vue du dessus, la silhouette de la voie ressemble à un nœud papillon. Les Bowties sont relativement rares et présents principalement sur certaines installations Vekoma et sur mesure. L'élément produit deux inversions fluides en succession rapide tout en maintenant la direction générale de déplacement, offrant une sensation différente du batwing à inversion de direction malgré une apparence superficiellement similaire.",
    relatedTermIds: ['batwing', 'butterfly', 'inversion'],
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
    relatedTermIds: ['airtime', 'airtime-hill', 'mack-rides'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Un virage semicirculaire très incliné en forme de fer à cheval, réorientant le train dans la direction opposée — couramment utilisé pour retourner le train entre des segments de lancement.',
    definition:
      "Un Horseshoe est un virage semi-circulaire fortement incliné — généralement entre 75 et 90° — qui réoriente le coaster de 180° (inversant son cap). L'inclinaison extrême évite des G-forces latérales excessives pour ce rayon de courbure serré. Les Horseshoes sont fréquemment utilisés dans les circuits de launched coasters comme éléments de retournement entre plusieurs segments de lancement, offrant au train un demi-tour avant la prochaine phase d'accélération. L'élément est visuellement spectaculaire et caractéristique des accélérateurs Intamin et des multi-launch coasters Mack. Il réoriente efficacement le train dans un espace compact tout en maintenant la vitesse.",
    relatedTermIds: ['intamin', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      "Une petite dénivellation juste avant la première grande descente sur un coaster à lifthill, utilisée pour réduire la tension de la chaîne et offrir un bref instant d'airtime anticipatoire.",
    definition:
      "Un Predrop est une petite colline ou vallée positionnée sur la dernière portion du lifthill, juste avant le sommet menant à la première grande descente. Sa principale fonction d'ingénierie est de réduire la tension sur la chaîne de traction au moment où le train franchit le sommet — évitant une transition brusque ou brutale du lifthill motorisé à la chute libre. Avantage secondaire pour l'expérience : le bref airtime au franchissement du predrop offre un avant-goût tentant de l'apesanteur avant la plongée principale. Les predrops sont devenus un élément de design populaire sur les coasters en bois et en acier, certains — comme le predrop de Goliath à Six Flags Magic Mountain — étant aussi attendus que la descente elle-même.",
    relatedTermIds: ['airtime', 'first-drop', 'lifthill'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Un élément haut et étroit avec montée et descente quasi-verticales ressemblant à un chapeau haut de forme — élément signature des coasters Intamin à lancement hydraulique.',
    definition:
      "Un Top Hat est un élément distinctif où la voie monte presque verticalement jusqu'à un sommet abrupt, puis plonge presque verticalement de l'autre côté — créant un profil ressemblant à un chapeau haut de forme vu de côté. Les Top Hats intérieurs (standard) s'inclinent vers l'intérieur au sommet ; les Top Hats extérieurs s'inclinent vers l'extérieur pour une sensation exposée et chargée en airtime. L'élément est fortement associé aux launched coasters hydrauliques d'Intamin (accélérateurs) : après le lancement initial à 200 km/h ou plus, le Top Hat est la pièce maîtresse spectaculaire du trajet. Kingda Ka (139 m), Top Thrill Dragster (128 m) et Red Force au Ferrari Land disposent de Top Hats iconiques.",
    relatedTermIds: ['first-drop', 'intamin', 'launch-coaster'],
  },
  {
    id: 'credit',
    name: 'Crédit',
    shortDefinition:
      "Une montagne russe qu'un enthousiaste a officiellement parcourue et ajoutée à son compteur personnel — collectionner des crédits est une activité centrale de la communauté des passionnés de coasters.",
    definition:
      "Un crédit de coaster (ou simplement 'crédit' ou 'cred') est une montagne russe qu'un enthousiaste a empruntée et officiellement ajoutée à son compteur personnel. La pratique de 'collecter des crédits' — parcourir le plus grand nombre possible de coasters différents — est l'une des activités définissant la communauté des passionnés de montagnes russes. Les règles définissant ce qui compte comme crédit varient : certains enthousiastes ne comptent que les sit-down coasters, d'autres incluent toutes les attractions à rails ; certains exigent chaque type de train sur un même coaster comme crédit unique, d'autres non. Des sites de suivi comme la Roller Coaster Database (RCDB) permettent aux enthousiastes d'enregistrer leur compteur. La quête de crédits pousse de nombreux enthousiastes à voyager à l'international et à visiter des parcs peu connus.",
    alternateNames: ['Cred', 'Creds', 'Compteur de coasters'],

    relatedTermIds: ['hybrid-coaster', 'pov', 'wooden-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      "Vidéo en point de vue filmée depuis le premier rang d'une montagne russe, offrant aux futurs visiteurs un aperçu virtuel de l'expérience.",
    definition:
      "POV (Point of View) désigne une vidéo filmée depuis la perspective d'un passager du premier rang, généralement montée sur une caméra fixée au train. Les vidéos POV sont l'un des formats de contenu les plus populaires dans la communauté des enthousiastes de parcs à thème et sont largement utilisées par les futurs visiteurs pour prévisualiser un coaster avant de se déplacer. Les parcs produisent parfois des POV officiels à des fins promotionnelles ; le plus souvent ils sont filmés par des visiteurs ou des médias. Un bon POV montre clairement chaque élément, descente et inversion dans l'ordre. YouTube héberge des dizaines de milliers de vidéos POV de coasters. Le terme est aussi utilisé plus largement pour désigner toute vidéo en première personne d'attractions de parcs.",
    alternateNames: ['Point of View', 'On-Ride Video', 'Vidéo embarquée'],

    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      "Une situation où plusieurs trains arrivent sur le brake run avant que la gare ne soit dégagée, formant une file de trains en attente — signe d'opérations inefficaces qui allongent les temps d'attente.",
    definition:
      "Le Stacking se produit lorsque le processus d'embarquement/débarquement d'une montagne russe est plus lent que le temps de cycle du trajet, entraînant l'accumulation de trains dans le brake run en attendant que la gare se dégage. Au lieu d'envoyer un train dès que le précédent revient, l'opérateur doit retenir plusieurs trains dans le brake run — interrompant potentiellement l'attraction brièvement entre chaque train. Le Stacking réduit directement la capacité et allonge les temps d'attente en file. Les causes fréquentes incluent le chargement lent des visiteurs (souvent dû à des systèmes de retenue complexes), les exigences importantes de vérification des bagages ou le sous-effectif du personnel. Les visiteurs expérimentés peuvent observer si un coaster staque pendant leur attente et en tenir compte dans leurs décisions.",
    alternateNames: ['Train Stacking', 'Accumulation de trains'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Type de montagnes russes où le train est suspendu sous le rail et les pieds des passagers pendent librement.',
    definition:
      "Un Inverted Coaster est des montagnes russes où le train est fixé rigidement sous le rail, les passagers étant assis avec les pieds qui pendent librement. Contrairement aux montagnes russes suspendues (qui oscillent latéralement), le train d'un Inverted Coaster ne peut pas se balancer. B&M a pionniérisé le concept avec Batman The Ride en 1992. Ces attractions sont réputées pour leurs near-misses intenses, leurs zero-g rolls et cobra rolls. Exemples européens célèbres : Nemesis (Alton Towers), Katun (Mirabilandia) et Oziris (Parc Astérix).",
    aliases: ['Inverted Coasters'],
    alternateNames: ['Inverted', 'Invert', 'Montagnes Russes Inversées'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Type de coaster où les sièges sont disposés de chaque côté du rail — rien au-dessus, en dessous ni à côté des passagers.',
    definition:
      "Un Wing Coaster (ou Wing Rider) dispose deux sièges de chaque côté du rail, laissant les passagers sans aucune structure au-dessus, en dessous ou à leurs côtés. Ce design maximise la sensation de vol et permet des near-misses spectaculaires avec le décor et les structures. B&M est le principal fabricant de Wing Coasters. Exemples notables en Europe : The Swarm (Thorpe Park), GateKeeper (Cedar Point) et Flug der Dämonen (Europa-Park), souvent cité parmi les meilleurs coasters d'Europe.",
    aliases: ['Wing Coasters'],
    alternateNames: ['Wing Rider', 'Coaster à ailes'],

    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Coaster dont les wagons tournent librement sur un axe vertical, offrant une expérience différente à chaque trajet.',
    definition:
      "Un Spinning Coaster est équipé de wagons montés sur une plateforme rotative qui tourne librement autour d'un axe vertical. La rotation n'étant pas contrôlée, chaque trajet produit une séquence différente d'avant, d'arrière et de latéral. Mack Rides (Waldkirch, Allemagne) et Gerstlauer sont les principaux fabricants. Les Spinning Coasters sont souvent considérés comme d'excellentes attractions familiales — suffisamment intenses pour être passionnantes sans les contraintes de taille des coasters les plus exigeants.",
    aliases: ['Spinning Coasters'],
    alternateNames: ['Spinner', 'Coaster tournant'],

    relatedTermIds: ['credit', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Le modèle spinning coaster haute intensité de Gerstlauer — plus rapide, plus haut et avec une rotation plus prononcée que les modèles standard.',
    definition:
      "L'Xtreme Spinning Coaster (XSC) est le modèle phare de Gerstlauer dans la catégorie spinning coaster, conçu pour pousser le format à ses limites. Là où un spinning coaster standard vise une intensité familiale, le XSC propose une structure plus haute, des chutes plus raides, des vitesses de pointe plus élevées et un mécanisme de rotation calibré pour des rotations plus marquées — les wagons tournent plus fort et plus fréquemment dans chaque élément du parcours.\n\nL'imprévisibilité de la rotation est amplifiée par le rythme plus soutenu : l'orientation du wagon change plus rapidement, rendant chaque run unique. Le modèle XSC positionne Gerstlauer entre les spinners familiaux et les coasters à sensations fortes, offrant une véritable intensité tout en conservant le caractère rejouable des spinning coasters.",
    aliases: ['XSC'],
    relatedTermIds: ['credit', 'gerstlauer', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      "Coaster dépassant 61 m de hauteur, généralement sans inversions, axé sur la vitesse et l'airtime.",
    definition:
      "Le Hyper Coaster est la classification pour les montagnes russes entre 61 et 91 m de hauteur. B&M utilise le terme « Hyper Coaster » ; Intamin préfère « Mega Coaster » pour leur type équivalent. Les deux se concentrent sur de grandes collines d'airtime à grande vitesse plutôt que sur des inversions. Shambhala à PortAventura (Espagne) est le Hyper Coaster le plus haut et le plus rapide d'Europe à 76 m. Parmi les autres exemples notables : Goliath à Walibi Holland et Mako à SeaWorld Orlando.",
    aliases: ['Hyper Coasters'],
    alternateNames: ['Mega Coaster', 'Méga Montagne Russe', 'Hypercoaster'],

    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Coaster dépassant 91 m de hauteur — un cran au-dessus du Hyper Coaster.',
    definition:
      "Le Giga Coaster est la classification pour les montagnes russes entre 91 et 121 m de hauteur. Le terme a été créé par Cedar Fair et Intamin pour Millennium Force à Cedar Point en 2000. Les Giga Coasters misent sur une hauteur extrême, de longs circuits et d'immenses moments d'airtime. Fury 325 à Carowinds est considéré par de nombreux passionnés comme le meilleur coaster en acier au monde. En Europe, aucun Giga Coaster n'existe encore en 2025.",
    aliases: ['Giga Coasters'],
    alternateNames: ['Giga Montagne Russe', 'Gigacoaster'],

    relatedTermIds: ['airtime', 'first-drop', 'hyper-coaster'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Virage dont le dévers dépasse 90°, inclinant brièvement les passagers au-delà de la verticale.',
    definition:
      "Un Overbanked Turn (virage surbanqué) est une courbe où le dévers dépasse 90 degrés — le rail extérieur est plus haut que la verticale, ce qui incline brièvement les passagers au-delà de la position tête en bas sans réaliser une inversion complète. L'élément génère un mélange caractéristique de G latérales et de légères G négatives au sommet du dévers. Les Overbanked Turns sont la signature des Hyper Coasters de B&M et des Mega Coasters d'Intamin, et sont omniprésents dans les layouts de RMC.",
    aliases: ['Overbanked'],
    alternateNames: ['Virage surincliné', 'Virage déversé'],

    relatedTermIds: ['airtime', 'b-and-m', 'intamin', 'inversion', 'rmc'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      "Frein magnétique en milieu de parcours qui réduit la vitesse du train sans l'arrêter complètement.",
    definition:
      "Un Trim Brake est un dispositif de freinage placé en cours de parcours pour réduire la vitesse du train — sans l'arrêter complètement comme un block brake. Ces freins sont utilisés pour gérer les forces G, réduire l'usure de la voie ou satisfaire des exigences de sécurité. Les passionnés leur reprochent souvent de diminuer les sensations du trajet : les collines d'airtime sont moins intenses lorsque le train est freiné avant. L'activation des trim brakes peut varier selon la saison, la météo et le chargement du train.",
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      "Quand un launch coaster n'atteint pas le sommet du circuit et revient en arrière sur la voie de lancement.",
    definition:
      "Un rollback se produit quand un coaster lancé ne génère pas assez de vitesse pour franchir le point le plus haut du circuit et revient en arrière sous l'effet de la gravité jusqu'à la position de lancement. Sur les launch coasters hydrauliques (Top Thrill Dragster, Stealth), cela arrive quand le mécanisme de lancement ne délivre pas toute sa puissance. Le train est arrêté en douceur par des freins magnétiques. Les rollbacks sont rares mais constituent une caractéristique connue des launch coasters hydrauliques. Les passagers ne courent aucun danger.",
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatronique',
    shortDefinition:
      'Personnages robotiques utilisés dans les dark rides et spectacles pour créer des scènes vivantes.',
    definition:
      "L'animatronique (animatronics en anglais) désigne des figurines robotiques électromécaniques utilisées dans les attractions et spectacles de parcs à thème pour représenter des personnages ou créatures de façon réaliste. Disney a introduit le terme « Audio-Animatronics » lors de l'Exposition universelle de 1964. Les animatroniques modernes vont de simples figures cycliques à des robots complexes avec expressions faciales et mouvements corporels complets. Le chaman Na'vi dans Pandora (Walt Disney World) et les dinosaures de l'attraction Jurassic World (Universal) sont des exemples de pointe.",
    aliases: ['Animatroniques'],
    alternateNames: ['Audio-Animatronics', 'Personnage robotisé'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'Prévision IA',
    shortDefinition:
      "Prédictions basées sur le machine learning pour les niveaux de fréquentation et les temps d'attente — jusqu'à 30+ jours à l'avance.",
    definition:
      "Une prévision IA utilise des modèles de machine learning entraînés sur des données historiques de fréquentation, des données météo, des calendriers scolaires et des données en temps réel pour prédire l'affluence dans un parc ou pour une attraction donnée. park.fan génère des prévisions IA pour la fréquentation et les temps d'attente prévus jusqu'à 30+ jours à l'avance.\n\nLes prévisions sont continuellement mises à jour à mesure que de nouvelles données arrivent. Les prévisions à court terme (1–7 jours) sont généralement très précises car elles intègrent les données météo actuelles, les annonces d'événements et les signaux de réservation. Les prévisions à long terme sont naturellement moins précises, mais restent utiles pour identifier les périodes calmes ou animées bien à l'avance.",

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'opening-hours',
    name: "Horaires d'ouverture",
    shortDefinition:
      'Le programme journalier officiel indiquant quand un parc à thème ou une attraction ouvre et ferme.',
    definition:
      "Les horaires d'ouverture sont le programme journalier publié pour un parc à thème ou une attraction individuelle — ils indiquent quand l'accès commence et quand l'exploitation prend fin. La plupart des grands parcs publient un calendrier glissant des semaines ou des mois à l'avance, bien que les horaires puissent changer à court terme en raison d'événements spéciaux, d'ajustements saisonniers ou de problèmes opérationnels.\n\npark.fan affiche les horaires d'ouverture de chaque parc. Les horaires marqués « Est. » (Estimé) ont été dérivés de schémas historiques et ne sont pas confirmés officiellement par le parc — ils doivent être vérifiés avant une visite planifiée.",
    aliases: ['Horaires du Parc', "Heures d'Ouverture"],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendance',
    shortDefinition:
      "La direction de l'évolution de la longueur de la file au cours des 30 dernières minutes — en hausse, en baisse ou stable.",
    definition:
      "La tendance indique si la file d'attente d'une attraction est plus longue, plus courte ou identique à il y a 30 minutes. park.fan la représente par une flèche : vers le haut (file qui s'allonge), vers le bas (file qui se réduit) ou horizontale (stable).\n\nLa tendance est souvent plus parlante que le temps d'attente brut. Une attraction avec 45 minutes et une tendance à la baisse est un meilleur choix qu'une avec 40 minutes et une tendance fortement à la hausse — le temps d'arriver, la première file peut être descendue à 30 minutes tandis que la seconde atteint déjà 55 minutes.",

    relatedTermIds: ['crowd-level', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride sans rail fixe — les véhicules naviguent librement guidés par une technologie intégrée au sol.',
    definition:
      "Un Trackless Ride est un type de dark ride où les véhicules ne sont pas contraints à un rail fixe mais naviguent de façon autonome dans l'espace de l'attraction, guidés par des boucles d'induction, le Wi-Fi ou des lasers intégrés au sol. Cette liberté de mouvement permet des décors bien plus complexes et des narrations non linéaires. Exemples emblématiques : Star Wars: Rise of the Resistance (Disney), Ratatouille: L'Aventure Totalement Toquée de Rémy (Disneyland Paris) et Symbolica (Efteling, Pays-Bas).",
    aliases: ['Attraction Sans Rail'],

    relatedTermIds: ['animatronics', 'dark-ride', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'IA',
    shortDefinition:
      "Intelligence Artificielle — les modèles de machine learning qui calculent les prévisions de fréquentation et les temps d'attente.",
    definition:
      "L'IA (Intelligence Artificielle) désigne les algorithmes de machine learning qui reconnaissent des patterns dans de grands jeux de données et génèrent des prédictions. park.fan utilise des modèles IA entraînés sur des années de données historiques de temps d'attente, de calendriers scolaires, de données météo et d'annonces d'événements pour produire des prévisions quotidiennes de fréquentation et de temps d'attente — jusqu'à 30+ jours à l'avance.",
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-forecast'],
    aliases: ['Intelligence Artificielle'],
  },
  {
    id: 'realtime-wait-time',
    name: "Temps d'attente en direct",
    shortDefinition:
      "Temps d'attente mis à jour en temps réel directement depuis les systèmes du parc.",
    definition:
      "Un temps d'attente en direct est la donnée actuelle en temps réel extraite des systèmes du parc — pas une moyenne historique, mais le chiffre réel à la minute près. park.fan récupère les temps d'attente en direct depuis les APIs officielles des parcs et des sources tierces, avec une mise à jour chaque minute.",
    relatedTermIds: ['crowd-forecast', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'crowd-forecast',
    name: 'Prévision de fréquentation',
    shortDefinition:
      "Prédiction basée sur l'IA de l'affluence dans un parc à thème pour un jour donné.",
    definition:
      "Une prévision de fréquentation est une prédiction basée sur les données de l'affluence attendue dans un parc à thème pour un jour ou une heure spécifique. park.fan recalcule les prévisions de fréquentation quotidiennement en utilisant les données historiques, les calendriers scolaires, la météo et les événements spéciaux. Les résultats alimentent directement le calendrier de fréquentation : les jours verts indiquent de courtes files d'attente, les jours rouges signalent une forte affluence.",
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['Prévisions de fréquentation'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      "L'unité d'accélération ressentie par les passagers, mesurée en multiples de l'accélération gravitationnelle terrestre (9,81 m/s²).",
    definition:
      "La force G (équivalent gravitationnel) mesure l'accélération ressentie par un passager par rapport à la gravité terrestre normale. Les forces G positives (au-dessus de 1G) plaquent les passagers dans leur siège lors de passages dans des creux ou des virages serrés. Les forces G négatives (sous 0G) soulèvent les passagers de leur siège et créent de l'airtime. Les forces G latérales agissent horizontalement, poussant les passagers sur les côtés dans les virages et transitions.\n\nLes montagnes russes sont conçues pour enchaîner ces forces délibérément. Un creux générant 4–5G est la marque d'un premier drop puissant. Un bref moment à −0,5G sur une bosse d'airtime produit la sensation de flottement caractéristique. La plupart des attractions ciblent 0–5G de forces positives soutenues, avec des pics courts pour l'effet dramatique. Une exposition prolongée à des forces G élevées peut provoquer un malaise ou un « greyout » ; les bonnes conceptions alternent pics d'intensité et phases de récupération.",
    relatedTermIds: ['airtime', 'greyout', 'hangtime', 'inversion', 'lateral-gs'],
    aliases: ['Forces G', 'G-Forces'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'Obscurcissement temporaire de la vision causé par les forces G positives qui réduisent le flux sanguin vers le cerveau.',
    definition:
      "Le greyout (ou grey-out) est un phénomène physiologique dans lequel un passagier soumis à de fortes forces G positives soutenues voit son champ visuel se teinter temporairement de gris. Le mécanisme : les forces G positives poussent le sang vers le bas, dans les extrémités, réduisant l'irrigation des yeux et du cerveau. Le champ visuel commence à se rétrécir depuis la périphérie et devient gris — le passager reste conscient, mais sa vision est significativement altérée.\n\nAu-delà du greyout, une exposition plus intense ou prolongée aux forces G peut mener au blackout (vision totalement noire) ou au G-LOC (perte de conscience induite par les forces G). Les montagnes russes bien conçues maintiennent les pics de G élevés courts et alternent les sections intenses avec des sections de récupération.",
    aliases: ['Greyouts', 'grey-out', 'grisé'],
    alternateNames: ['voile gris', 'perte de vision par G'],
    relatedTermIds: ['airtime', 'g-force', 'hangtime', 'lateral-gs'],
  },
  {
    id: 'grey-zone',
    name: 'Zone grise',
    shortDefinition:
      "Un élément de montagne russe à la limite de la définition d'inversion — compté ou non selon la méthode de comptage utilisée.",
    definition:
      "La zone grise désigne les éléments de montagne russe situés à la frontière entre une inversion complète et un élément non-inversant. Les inversions classiques — comme les loopings verticaux et les tire-bouchons — sont sans ambiguïté : le train tourne le passager complètement tête en bas. Les éléments en zone grise atteignent à peine ou pas tout à fait le seuil des 180° overhead, plaçant les passagers dans une position extrême, quasi-inversée.\n\nLes éléments typiques en zone grise comprennent les stalls (positions tête en bas maintenues sans rotation complète), les virages fortement surinclinés au-delà de 90° et certaines variations de wave turns. Des fabricants comme RMC et Intamin utilisent délibérément ces éléments comme alternative aux inversions classiques. Selon la méthode de comptage — stricte (rotations complètes seulement) ou large (toute position tête en bas) — le nombre officiel d'inversions d'une attraction peut varier.",
    aliases: ['Zones grises', 'zone-grise'],
    alternateNames: ['inversion borderline', 'quasi-inversion'],
    relatedTermIds: ['inversion', 'overbank', 'roller-coaster-element', 'stall'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Forces horizontales qui poussent les passagers sur les côtés lors de virages, transitions et sections en hélice.',
    definition:
      "Les forces G latérales (ou forces latérales) sont les accélérations horizontales ressenties lorsqu'une montagne russe change de direction dans le plan horizontal — dans les virages inclinés ou non, les hélices et les changements de cap. Des forces latérales bien conçues sont fluides et contrôlées, contribuant à une expérience dynamique. Des forces latérales mal maîtrisées se traduisent par un choc brutal contre le dossier ou le harnais, source d'inconfort ou de douleur.\n\nLes amateurs distinguent les forces latérales douces et intentionnelles — comme dans les grands virages bas d'une montagne russe en bois classique — des forces latérales brutales dues à l'usure du rail ou à une mauvaise conception. Les montagnes russes en bois sont particulièrement associées aux sensations latérales : le mouvement d'un côté à l'autre des virages non inclinés fait partie de l'expérience authentique. Les séquences latérales fluides en hélice — comme sur Balder à Liseberg — sont souvent citées comme des moments marquants par les passionnés.",
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    aliases: ['Forces G Latérales'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Forces G négatives intenses qui propulsent brutalement les passagers hors de leur siège, retenus uniquement par le harnais de genoux.',
    definition:
      "L'ejector airtime décrit la forme la plus intense des forces G négatives : la trajectoire de l'attraction s'écarte si brusquement de la chute libre que les passagers sont violemment propulsés hors de leur siège, retenus uniquement par le harnais de genoux. La sensation est celle d'une éjection active du siège — distincte du flottement doux et prolongé du floater airtime, elle est soudaine et peut frôler le brutal si la transition est trop abrupte.\n\nL'ejector airtime est particulièrement associé aux hybrid coasters RMC, à certains hyper coasters Intamin et aux montagnes russes en bois modernes avec des collines paraboliques raides. Les amateurs citent les meilleurs moments d'ejector comme le sommet d'un circuit — un bref instant saisissant d'apesanteur réelle. Untamed à Walibi Holland, Wildfire à Kolmården et Steel Vengeance à Cedar Point sont souvent cités pour leurs séquences d'ejector parmi les plus intenses au monde.",
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    aliases: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      "Forces G négatives douces et prolongées produisant une longue sensation de flottement au sommet d'une bosse.",
    definition:
      "Le floater airtime décrit l'extrémité douce du spectre des forces G négatives : une sensation lente et prolongée où les passagers s'élèvent légèrement de leur siège et flottent en apesanteur pendant un long moment lorsque le train passe au sommet d'une colline suivant une courbe parabolique progressive. La force est faible — généralement −0,1G à −0,3G — ce qui la rend accessible et agréable même pour les passagers que l'intensité de l'ejector rebute.\n\nLe floater airtime est caractéristique des hyper et giga coasters B&M, qui utilisent de grandes collines doucement arrondies conçues pour produire de longues phases de flottement. Shambhala à PortAventura, Silver Star à Europa-Park et Goliath à Walibi Holland sont des exemples européens célèbres pour leurs longues séquences floater. De nombreux amateurs trouvent la qualité détendue du floater plus confortable que l'intensité de l'ejector, bien que les avis soient partagés sur le style supérieur.",
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    aliases: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      "La sensation de rester suspendu dans les harnais lors d'une inversion, causée par des forces G négatives la tête en bas.",
    definition:
      "Le hangtime désigne l'expérience particulière des forces G négatives lors d'une inversion : le train s'attarde suffisamment au sommet d'une figure tête en bas pour que des forces G négatives se manifestent — les passagers se retrouvent littéralement suspendus dans leurs harnais. Contrairement au bref passage inversé d'un looping rapide, le hangtime se produit lorsque le train ralentit près du sommet d'une inversion et crée une suspension prolongée. Le poids du corps se déporte entièrement dans les harnais d'épaules ou le harnais de genoux, créant une désorientation mémorable.\n\nLe hangtime est le plus prononcé sur les éléments où le train ralentit fortement au sommet de l'inversion — le pretzel loop sur les flying coasters en est l'exemple classique, car la vitesse est suffisamment faible pour des forces G négatives soutenues en position totalement inversée. Le heartline roll de certaines attractions modernes peut aussi produire du hangtime. Les amateurs considèrent généralement le hangtime comme l'une des sensations d'inversion les plus marquantes.",
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion', 'pretzel-loop'],
    aliases: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Élément de montagnes russes',
    shortDefinition:
      "Une section ou caractéristique nommée d'une montagne russe, comme un looping, une bosse d'airtime ou une inversion.",
    definition:
      "Un élément de montagnes russes désigne toute caractéristique distincte et nommée intégrée dans le tracé d'une montagne russe — des inversions classiques comme les loopings et les tire-bouchons aux éléments non-inversants comme les bosses d'airtime, les hélices et les virages surélevés (overbanks). Les ingénieurs conçoivent chaque élément pour produire une sensation physique précise : apesanteur (airtime), forces G latérales ou la désorientation de la tête en bas.\n\nLe glossaire de park.fan répertorie des dizaines d'éléments individuels — du premier drop et du lifthill aux spécialités modernes comme le Stengel dive, le Norwegian loop et le heartline roll.",
    relatedTermIds: ['airtime', 'first-drop', 'helix', 'inversion', 'vertical-loop'],
    aliases: ['Éléments de montagnes russes'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Première rangée',
    shortDefinition:
      'La première rangée de sièges dans un train de montagnes russes, offrant généralement la meilleure vue et les sensations les plus intenses.',
    definition:
      "La première rangée est la première rangée de sièges dans un train de montagnes russes. Les places à l'avant offrent une vue dégagée vers l'avant, très prisées des passagers pour l'expérience visuelle. Sur les hypercoasters et gigas, la première rangée offre généralement l'airtime le plus intense au premier drop, car les passagers n'ont personne devant eux qui bloque l'expérience. L'effet psychologique de voir le drop s'approcher — puis plonger dans le vide — amplifie le frisson bien au-delà des rangées centrales ou arrière.\n\nSur de nombreuses montagnes russes, la première rangée est devenue tellement recherchée que les parcs offrent des contournements de files ou des réservations express spécifiquement pour cette position de siège.",
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
    aliases: ['Siège avant', 'Première place'],
  },
  {
    id: 'back-row',
    name: 'Dernière rangée',
    shortDefinition:
      "La dernière rangée de sièges d'un train, connue pour les sensations d'airtime intenses et prolongées sur les montagnes russes riches en bosses.",
    definition:
      "La dernière rangée est la dernière rangée de sièges dans un train de montagnes russes. Les places à l'arrière sur les montagnes russes riches en bosses — hypers, gigas, conceptions axées sur l'airtime — sont très prisées des passionnés pour l'airtime éjecteur le plus intense. À chaque bosse successive, la dernière rangée subit des forces G négatives prononcées tandis que le train franchit le sommet et les passagers sont éjectés des sièges (maintenus seulement par les harnais). Cet effet s'accumule sur plusieurs bosses : l'airtime en dernière rangée est généralement plus fort, plus prolongé et plus intense qu'aux rangées avant ou centre.\n\nSur des coasters comme Goliath ou Shambhala, la dernière rangée est considérée comme la position de siège idéale par les passionnés.",
    relatedTermIds: ['airtime', 'ejector-airtime', 'front-row', 'middle-row'],
    aliases: ['Siège arrière', 'Dernière place'],
  },
  {
    id: 'middle-row',
    name: 'Rangée centrale',
    shortDefinition:
      "Les rangées centrales d'un train de montagnes russes, offrant une expérience équilibrée entre la première et la dernière rangée.",
    definition:
      "Les rangées centrales occupent les sièges au centre d'un train de montagnes russes — positionnées entre l'impact psychologique intense de la première rangée et l'airtime éjecteur de la dernière rangée. Les rangées centrales offrent généralement une expérience équilibrée : une vue suffisante pour voir le tracé à venir, un airtime modéré, mais ni les extrêmes de l'avant ni les intensités maximales de l'arrière. Pour les familles ou visiteurs novices inquiets quant à l'intensité, les rangées centrales offrent une expérience de coaster plus abordable.\n\nLes rangées centrales suscitent moins de discussion chez les passionnés car elles n'offrent ni la spécialisation de la rangée avant ni les extrêmes de l'arrière. Cependant, sur les montagnes russes avec des forces latérales intenses, les rangées centrales peuvent parfois ressentir la plus grande compression.",
    relatedTermIds: ['airtime', 'back-row', 'front-row', 'ride-cart'],
    aliases: ['Siège central', 'Rangée du milieu'],
  },
  {
    id: 'ride-cart',
    name: 'Wagon',
    shortDefinition:
      "Le véhicule ou la voiture individuelle d'un train de montagnes russes qui accueille une rangée ou plusieurs rangées de passagers.",
    definition:
      "Un wagon (également appelé car, voiture ou simplement partie d'un train) est le segment de véhicule individuel qui accueille les passagers sur une montagne russe. Un train de coaster typique est composé de plusieurs wagons liés ensemble, chaque wagon accueillant une ou plusieurs rangées de passagers assis dos à dos. Les fabricants de montagnes russes conçoivent les dimensions des wagons, le positionnement des sièges et la géométrie des harnais pour optimiser le confort et la sensation.\n\nLa conception des wagons varie considérablement selon le type : les hypercoasters utilisent des wagons aérodynamiques et bas pour réduire la résistance au vent ; les inverted coasters suspendent les passagers sous la bande ; les wing coasters positionnent les passagers sur les côtés sans bande dessous ; les flying coasters montent les passagers face vers le bas. Les fabricants comme B&M, Intamin et Mack chacun ont des conceptions de wagon distinctives.",
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
    aliases: ['Voiture'],
  },
  {
    id: 'lap-bar',
    name: 'Harnais de genoux',
    shortDefinition:
      "Un harnais horizontal de sécurité sur les genoux, permettant plus de liberté de mouvement que les harnais d'épaules.",
    definition:
      "Un harnais de genoux est un dispositif de sécurité horizontal qui immobilise les passagers sur la région des cuisse. Contrairement aux harnais d'épaules qui enferment entièrement le torse, les harnais de genoux permettent au haut du corps de se déplacer plus librement, créant une sensation plus ouverte et moins restrictive. Les harnais de genoux sont standard sur la plupart des hypercoasters, gigas et de nombreuses montagnes russes traditionnelles. Pendant les moments d'airtime, les harnais de genoux permettent aux passagers de ressentir pleinement l'éjection du siège, créant la sensation que seul le harnais les empêche de voler hors du véhicule.\n\nLes harnais de genoux sont préférés par les passionnés pour les montagnes russes à fort airtime car ils fournissent la sensation d'airtime la plus sans entrave. Cependant, ils nécessitent un positionnement approprié et peuvent être inconfortables sur certaines morphologies. Les fabricants ont continuellement affiné la conception des harnais de genoux au fil des décennies, et les modèles modernes sont nettement plus confortables que les générations antérieures.",
    relatedTermIds: ['airtime', 'ride-cart', 'shoulder-harness'],
    aliases: ['Harnais de lap'],
  },
  {
    id: 'shoulder-harness',
    name: "Harnais d'épaules",
    shortDefinition:
      'Un harnais de sécurité par-dessus les épaules qui enferme entièrement le torse, limitant les mouvements pendant le trajet.',
    definition:
      "Un harnais d'épaules est un dispositif de sécurité qui descend sur les deux épaules et traverse les genoux, enfermant entièrement le torse. Les harnais d'épaules étaient standard sur les montagnes russes des années 1980 aux 2000 et restent courants sur les inverted coasters, certains suspended coasters et les attractions familiales où la sécurité maximale est prioritaire. Les harnais modernes incluent des mécanismes de cliquet permettant une tension variable pour accommoder différentes morphologies.\n\nLorsqu'on est assis dans un harnais d'épaules sur une montagne russe à fort airtime, la sensation est notablement différente d'un harnais de genoux : les passagers ne peuvent pas s'élever du siège de manière aussi dramatique car le harnais les tient vers le bas. Ce compromis — sécurité et confort accrus par rapport à une sensation d'airtime moins intense — est un choix de conception clé que les fabricants font.",
    relatedTermIds: ['airtime', 'lap-bar', 'ride-cart'],
    aliases: ['Harnais OTS'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Souvenir',
    shortDefinition:
      "Un objet commémoratif ou petit article acheté dans un parc à thème pour se souvenir d'une visite.",
    definition:
      "Un souvenir est un objet commémoratif physique — merchandise, vêtements ou article de collection — acheté par les visiteurs pour se souvenir de leur visite au parc. Les souvenirs courants incluent les t-shirts avec logo du parc, chapeaux, épingles, cartes postales et figurines à thème. Les souvenirs servent deux fonctions : pratique (vêtements portables) et émotionnelle (ancrer les souvenirs d'une visite spécifique).\n\nLes parcs à thème dépendent fortement des ventes de souvenirs comme source de revenus ; la merchandise porte généralement une marge de 2–3x par rapport aux prix de détail. Pour les visiteurs passionnés, collecter des souvenirs de plusieurs parcs fait partie de l'expérience — accumuler des épingles, les échanger avec d'autres, ou construire une étagère commémorative.",
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
    aliases: ['Mémento'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Produits et biens officiels vendus par un parc à thème, y compris les vêtements, les collectibles et les articles thématiques.',
    definition:
      "La merchandise désigne tous les biens vendus par un parc à thème — des vêtements de marque (t-shirts, sweats, casquettes) aux collectibles (épingles, figurines, peluches), merchandise alimentaire/boissons, et articles spécialisés à thème liés à des attractions spécifiques ou des franchises. Les parcs à thème opèrent des opérations de merchandise massives couvrant des dizaines de boutiques, chariots mobiles et boutiques situées. La merchandise est un pilier critique des revenus pour les parcs, générant souvent 15–25% des dépenses totales des visiteurs, deuxième après la nourriture et les boissons.\n\nLes parcs modernes utilisent des stratégies de merchandising sophistiquées : articles d'édition limitée saisonnière, merchandise de collaboration avec des franchises populaires, designs exclusifs au parc indisponibles ailleurs, et versions spéciales liées aux nouvelles ouvertures d'attractions ou aux anniversaires.",
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
  },
  {
    id: 'gift-shop',
    name: 'Boutique de souvenirs',
    shortDefinition:
      'Un magasin de vente au détail dans un parc à thème vendant des souvenirs, merchandise et produits à thème.',
    definition:
      "Une boutique de souvenirs est un espace de vente au détail au sein d'un parc à thème dédié à la vente de souvenirs, merchandise et produits thématiques — soit situé dans une zone centrale (comme une place principale) ou intégré dans des zones thématiques spécifiques et des attractions. Les grands parcs opèrent des dizaines de boutiques de souvenirs, des petits chariots aux grands magasins. Les boutiques sont soigneusement positionnées aux points de fort passage : files de sortie des attractions majeures, couloirs d'hôtel, entrées/sorties de parc où les visiteurs ont du temps libre et une inclinaison à acheter.\n\nLes boutiques de souvenirs modernes utilisent un design de vente au détail sophistiqué : positionnement d'entrée, environnement thématique et placement stratégique de produits. De nombreuses attractions font passer les visiteurs directement à travers des zones de merchandise — une stratégie éprouvée pour amplifier les achats impulsifs. Les parcs utilisent de plus en plus la merchandise IP (licences et franchises) pour justifier les prix premium.",
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
  },
  {
    id: 'park-exclusive',
    name: 'Exclusivité du parc',
    shortDefinition:
      "Un produit ou article disponible uniquement dans un parc à thème spécifique, indisponible à l'achat ailleurs.",
    definition:
      "La merchandise exclusive au parc est un produit conçu et vendu uniquement dans un parc à thème spécifique ou au sein d'un système de parcs — indisponible à l'achat chez aucun détaillant externe. Les articles exclusifs au parc créent une rareté perçue, encouragent les achats impulsifs du sentiment que l'article n'existe nulle part ailleurs, et justifient une majoration de prix premium (souvent 2–3x la majoration de vente au détail typique). Les exclusivités courantes incluent vêtements d'édition limitée, épingles de collection, articles à thème liés aux ouvertures de nouvelles attractions ou aux événements saisonniers.\n\nLa stratégie de l'exclusivité au parc est fondamentale à la psychologie marchande moderne : les visiteurs ayant voyagé loin et dépensé considérablement pour l'admission se sentent poussés à acheter des articles qu'ils ne peuvent pas obtenir à la maison. Les marchés secondaires (plateformes de revente en ligne) démontrent que les exclusivités rares et désirables au parc conservent et apprécient la valeur, promouvant davantage le comportement de collection.",
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
    aliases: ['Exclusif', 'Article exclusif au parc'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Montagnes russes où les passagers sont allongés face vers le bas.',
    definition:
      'Un flying coaster transporte les passagers en position horizontale, face vers le bas, simulant la sensation de vol. Le train passe de la position assise en station à la position horizontale avant le départ. Exemples notables : Manta (SeaWorld Orlando) et Tatsu (Six Flags Magic Mountain), tous deux fabriqués par B&M.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    aliases: ['coaster volant'],
  },
  {
    id: 'mine-train',
    name: 'Train de Mine',
    shortDefinition: "Montagnes russes familiales en acier sur le thème d'un wagon de mine.",
    definition:
      'Un train de mine est des montagnes russes en acier à vocation familiale, stylisées comme un wagonnet de mine débridé. Caractérisées par des vitesses modérées, de petits drops et des virages serrés à travers des tunnels et formations rocheuses thématisés. Exemples : Big Thunder Mountain Railroad (parcs Disney) et Gold Rush (Plopsaland).',
    relatedTermIds: ['steel-coaster', 'themed-land'],
    aliases: ['wagonnet de mine', 'coaster familial'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Montagnes russes conçues pour suivre et interagir avec le paysage naturel.',
    definition:
      "Un terrain coaster est construit pour exploiter la topographie naturelle — collines, vallées et ravins — plutôt que de reposer entièrement sur une structure artificielle. La voie interagit étroitement avec le sol, créant une sensation de vitesse et d'immersion. Exemples classiques : The Beast (Kings Island) et Ravine Flyer II (Waldameer).",
    relatedTermIds: ['airtime', 'steel-coaster', 'wooden-coaster'],
    aliases: ['coaster de terrain', 'coaster rasant'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Montagnes russes en acier sans plancher, les pieds dans le vide.',
    definition:
      "Sur un floorless coaster, le plancher du véhicule se rétracte une fois les passagers attachés, laissant les jambes pendantes au-dessus de la voie. Contrairement aux coasters invertis, la voie passe sous le véhicule plutôt qu'au-dessus. B&M a été pionnier avec Medusa (1999). Exemple européen : Goliath (Walibi Holland).",
    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster', 'steel-coaster'],
    aliases: ['coaster sans plancher'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: "Fabricant américain à l'origine du premier looping moderne.",
    definition:
      "Arrow Dynamics (fondé en 1945) est un fabricant américain pionnier qui a introduit la voie tubulaire en acier moderne et le premier looping vertical moderne sur Corkscrew (Knott's Berry Farm, 1975). Les attractions Arrow sont connues pour leurs corkscrews et suspended looping coasters. L'entreprise a déposé le bilan en 2001 et ses actifs ont été rachetés par S&S.",
    relatedTermIds: ['corkscrew', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Fabricant américain de montagnes russes en bois aux tracés rapides et sinueux.',
    definition:
      "Great Coasters International (GCI) est un fabricant américain spécialisé dans les montagnes russes en bois. Fondé en 1994, GCI est connu pour ses trains Millennium Flyer et des tracés aux changements de direction rapides et à l'airtime soutenu. Installations notables : Wodan (Europa-Park), Thunderhead (Dollywood) et Troy (Toverland).",
    relatedTermIds: ['airtime', 'rmc', 'terrain-coaster', 'wooden-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster', 'Millennium Flyer'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Fabricant américain spécialisé dans les coasters à lancement LSM/LIM — en Europe, connu pour la gamme Sky Scream.',
    definition:
      "Premier Rides (fondé en 1995, Baltimore, Maryland) est un fabricant américain spécialisé dans les systèmes de lancement à moteur synchrone (LSM) et à moteur à induction (LIM). Le Sky Rocket II — un compact launch coaster avec une inversion — s'est répandu dans les parcs de taille moyenne à travers le monde.\n\nEn Europe, Premier Rides est surtout connu grâce à Sky Scream au Holiday Park (Haßloch, Allemagne), un launch coaster inversé devenu une attraction régionale incontournable. La technologie LSM de Premier équipe également Hagrid's Magical Creatures Motorbike Adventure à Universal Orlando.",
    aliases: ['Premier'],
    relatedTermIds: ['gerstlauer', 'intamin', 'launch-coaster'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Fabricant allemand de Munich connu pour les spinning coasters avec trick track, la plateforme X-Car et le Sky Loop vertical.',
    definition:
      "Maurer Rides (Maurer AG, fabrication métallique depuis 1876, attractions depuis 1993) est un fabricant munichois. La série SC de spinning coasters se distingue par son trick track — une section où la rame s'incline latéralement — et la plateforme X-Car permet des layouts compacts hautement personnalisés avec lancements et inversions.\n\nLe Sky Loop est un loop vertical autonome présent dans de nombreux parcs européens. Installations notables : Winja's Fear et Winja's Force à Phantasialand (Allemagne), des spinning coasters indoor avec trick track.",
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['gerstlauer', 'launch-coaster', 'spinning-coaster', 'xtreme-spinning-coaster'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      "Fabricant italien avec l'un des plus grands portefeuilles de coasters familiaux et de manèges au monde — plus de 250 coasters installés.",
    definition:
      "Zamperla (fondé en 1966, Altavilla Vicentina, Italie) est l'un des fabricants d'attractions les plus prolifiques au monde. Là où Intamin, B&M et Mack visent les grandes installations, Zamperla mise sur le volume et l'accessibilité — leurs Family Coaster, Mini Coaster, Twister et Disk'O Coaster sont des incontournables des parcs de taille moyenne et des complexes touristiques.\n\nL'empreinte au sol compacte et les faibles exigences de taille rendent les attractions Zamperla particulièrement courantes dans les parcs urbains européens, les complexes hôteliers et les installations intérieures. L'entreprise a également construit Thunderbolt à Coney Island (New York).",
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition: `Fabricant allemand d'attractions foraines fondé en 1961, connu pour le Top Spin, le Break Dance, l'Enterprise, le Ranger et le Condor.`,
    definition: `Huss Rides GmbH est un fabricant allemand d'attractions foraines fondé en 1961 par Paul Huss, basé à Brême. La société a produit certains des modèles de flat rides les plus emblématiques de la fin du XXe siècle, présents dans les parcs d'attractions et les fêtes foraines du monde entier.\n\nLes modèles Huss les plus connus sont le Top Spin, le Break Dance (voitures rotatives sur un plateau tournant), l'Enterprise (roue centrifuge à nacelles), le Ranger (navire pendulaire oscillant), le Condor (tour de chaises rotative) et la Troïka. Beaucoup de ces modèles sont devenus des références dans l'industrie et ont été largement copiés. Les attractions Huss sont particulièrement associées à l'âge d'or des flat rides dans les parcs européens des années 1980 et 1990.`,
    relatedTermIds: ['drop-tower', 'flat-ride', 'pendulum-ride', 'top-spin'],
    aliases: ['Huss', 'Huss Park Attractions'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Fabricant américain connu pour les tours pneumatiques, le compact El Loco et les coasters Free Fly 4D.',
    definition:
      "S&S Worldwide (fondé en 1994, Logan, Utah ; racheté par Sansei Technologies en 2012) a d'abord développé des systèmes de chute pneumatiques — Space Shot et Turbo Drop — avant d'élargir sa gamme. L'El Loco est un coaster extrême compact avec une première descente au-delà de la verticale et une inversion, concentrant des sensations fortes dans un espace réduit. Le Free Fly est un coaster 4D dont le siège pivote librement.\n\nS&S a également acquis les actifs d'Arrow Dynamics après sa faillite en 2001. En Europe, les installations S&S sont moins courantes qu'en Amérique du Nord.",
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei'],
    relatedTermIds: ['arrow-dynamics', 'gerstlauer', 'launch-coaster'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Fabricant bavarois spécialisé dans les coasters familiaux — plus de 190 installations dans le monde.',
    definition:
      "Zierer (fondé en 1930, Deggendorf, Bavière) est un fabricant allemand spécialisé dans les montagnes russes familiales et les attractions de parc classiques. La gamme Force Coaster couvre plusieurs niveaux, des modèles juniors compacts aux installations Force Custom plus rapides. Les coasters Zierer se distinguent par leur voie tubulaire acier, leur qualité de roulement et des exigences de taille modérées.\n\nAvec plus de 190 montagnes russes livrées dans le monde, Zierer est l'un des constructeurs européens les plus prolifiques en nombre d'unités. Installations notables : Feuerdrache au Legoland Deutschland et des coasters familiaux dans des parcs allemands, néerlandais et scandinaves.",
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'gerstlauer', 'mack-rides'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition:
      'Inversion où le train reste brièvement suspendu tête en bas à vitesse quasi nulle.',
    definition:
      "Un stall (ou zero-G stall) est un élément où le train entre dans une inversion au sommet et ralentit presque jusqu'à l'arrêt, laissant les passagers suspendus tête en bas. Développé par Rocky Mountain Construction (RMC), l'élément procure un long hangtime. Exemples célèbres : Zadra (Energylandia) et Steel Vengeance (Cedar Point).",
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'zero-g-roll'],
    aliases: ['élément hangtime'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition:
      "Virage fortement incliné procurant de l'airtime en plein changement de direction.",
    definition:
      "Un wave turn est un virage banké à grande vitesse qui traverse brièvement des forces G négatives ou latérales, créant une sensation d'airtime au cœur du virage. Fréquent sur les attractions Rocky Mountain Construction, l'élément combine changement directionnel et airtime ejector ou floater. On le trouve sur Wildfire (Kolmården) et Untamed (Walibi Holland).",
    relatedTermIds: ['airtime', 'ejector-airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['virage avec airtime'],
  },
  {
    id: 'shoulder-season',
    name: 'Intersaison',
    shortDefinition: 'Période entre haute et basse saison avec une fréquentation modérée.',
    definition:
      "L'intersaison désigne les périodes de transition entre la haute saison (pic) et les périodes les plus calmes d'un parc. Généralement le printemps (mars–mai) et le début de l'automne (septembre–octobre) dans les parcs européens. La fréquentation est modérée, les prix souvent plus bas, et la plupart des attractions sont ouvertes — une période prisée des passionnés cherchant le meilleur rapport entre expérience et affluence.",
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'school-holiday'],
    aliases: ['hors saison', 'basse saison', 'période calme'],
  },
  {
    id: 'school-holiday',
    name: 'Vacances Scolaires',
    shortDefinition: 'Congés scolaires provoquant une forte hausse de la fréquentation des parcs.',
    definition:
      "Les vacances scolaires — grandes vacances, Noël, Pâques, Toussaint et vacances de février — sont le principal moteur des pics de fréquentation dans les parcs à thème. Les familles avec enfants constituent le segment le plus important et concentrent leurs visites sur ces périodes. Les parcs prolongent souvent leurs horaires, enrichissent leur programme et augmentent leurs tarifs. Éviter les vacances scolaires est la stratégie la plus efficace pour réduire les temps d'attente.",
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'shoulder-season'],
    aliases: ['vacances', 'grandes vacances', 'vacances de Pâques', "vacances d'été"],
  },
  {
    id: 'photo-pass',
    name: 'Pass Photo',
    shortDefinition: 'Service proposant des photos numériques illimitées de manèges et du parc.',
    definition:
      "Un pass photo (ou Memory Maker) est un supplément optionnel donnant accès numérique à toutes les photos et vidéos professionnelles d'une visite : photos de manèges, rencontres avec les personnages et photographes itinérants. Vendu à prix forfaitaire, il peut être rentable pour les familles qui achèteraient autrement de nombreuses photos individuelles. Exemples : Memory Maker (Disney) et Photo Pass (Universal).",
    relatedTermIds: ['character-meet-and-greet', 'ride-photo', 'season-pass'],
    aliases: ['forfait photo', 'photos du parc'],
  },
  {
    id: 'accessibility-pass',
    name: 'Pass Accessibilité',
    shortDefinition:
      "Pass permettant aux personnes handicapées d'accéder aux attractions avec une attente réduite.",
    definition:
      "Un pass accessibilité (DAS – Disability Access Service, carte accessibilité ou pass accès attraction) est délivré aux visiteurs ne pouvant attendre dans une file standard en raison d'un handicap. Il permet généralement au titulaire et à un groupe de proches de revenir à une heure déterminée plutôt que d'attendre physiquement. Les critères d'éligibilité et procédures varient selon les parcs et pays.",
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['DAS', 'carte accessibilité', 'pass handicap'],
  },
  {
    id: 'motion-simulator',
    name: 'Simulateur',
    shortDefinition: 'Attraction combinant plateforme mobile et projection cinématographique.',
    definition:
      "Un simulateur (ou attraction de simulation) combine une plateforme mobile hydraulique ou électrique avec une grande projection, synchronisant les mouvements physiques avec l'action à l'écran pour créer une expérience immersive sans voie traditionnelle. La capacité est généralement élevée, et l'expérience peut être renouvelée en changeant de film. Exemples : Star Tours (Disney), Mystic Manor (HKDL).",
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'trackless-ride'],
    aliases: ['simulateur de vol', 'attraction 4D', 'cinéma dynamique'],
  },
  {
    id: 'character-meet-and-greet',
    name: 'Rencontre avec les Personnages',
    shortDefinition: 'Moment programmé pour rencontrer un personnage costumé du parc.',
    definition:
      "Une rencontre avec les personnages est une zone dédiée ou un événement programmé où les visiteurs peuvent rencontrer des personnages costumés, se prendre en photo et obtenir des autographes. Très répandues dans les parcs Disney et Universal, les personnages populaires ont souvent des emplacements dédiés avec leur propre file d'attente. Particulièrement appréciées des familles avec enfants.",
    relatedTermIds: ['character-dining', 'photo-pass', 'themed-land'],
    aliases: ['rencontre personnage', 'apparition personnage'],
  },
  {
    id: 'pre-show',
    name: 'Avant-Spectacle',
    shortDefinition: "Zone d'attente avant l'embarquement proposant une mise en scène narrative.",
    definition:
      "Un avant-spectacle est une zone d'accueil dans une attraction thématisée où les visiteurs se rassemblent avant le manège principal pour recevoir un contexte narratif, des consignes de sécurité ou un divertissement posant l'ambiance. L'avant-spectacle remplit des fonctions narratives et opérationnelles. Exemples célèbres : la salle extensible du Haunted Mansion et la vidéo de sécurité de Guardians of the Galaxy – Mission: BREAKOUT!.",
    relatedTermIds: ['animatronics', 'dark-ride', 'motion-simulator', 'themed-land'],
    aliases: ['pré-show', 'salle de pré-attente', 'mise en scène introductive'],
  },
  {
    id: 'flat-ride',
    name: 'Attraction à plat',
    shortDefinition:
      'Attraction de plain-pied qui tourne, oscille ou pivote, sans circuit surélevé.',
    definition:
      "Un flat ride est une catégorie d'attractions foraines qui fonctionnent sur un plan sensiblement horizontal, sans voie surélevée. Le terme englobe les attractions tournantes (manèges, tasses à thé), les Frisbees (attractions pendulaires), les Top Spins et les manèges à chaînes (vagues volantes), les tours de chute et les plateformes rotatives.\n\nContrairement aux montagnes russes, les flat rides occupent en général un espace réduit, ce qui les rend idéaux pour remplir les espaces plus petits d'un parc. Beaucoup offrent un débit horaire élevé, peu ou pas de restrictions de taille, et conviennent à un large public – ils constituent souvent l'épine dorsale de l'offre familiale et enfantine d'un parc.",
    relatedTermIds: ['drop-tower', 'height-requirement', 'ride-capacity', 'swing-ride'],
    aliases: ['manège', 'attraction foraine'],
  },
  {
    id: 'water-ride',
    name: 'Attraction aquatique',
    shortDefinition:
      "Attraction où les visiteurs voyagent dans des embarcations à travers l'eau, en se mouillant.",
    definition:
      "Une attraction aquatique est toute attraction où l'eau est un élément central de l'expérience : soit les véhicules évoluent dans un canal, soit l'eau est utilisée comme effet délibéré. Les trois types les plus courants sont : les toboggans aquatiques (bateaux parcourant un canal avec une descente finale), les rapides (radeaux circulaires dérivant dans des rapides artificiels) et les batailles d'eau (canons à eau entre visiteurs). Les attractions aquatiques ont généralement peu de restrictions de taille et séduisent un public très large. Par forte chaleur estivale, elles peuvent générer des files d'attente extrêmement longues.",
    relatedTermIds: ['height-requirement', 'log-flume', 'ride-capacity', 'river-rapids'],
    aliases: ["attraction d'eau", 'ride aquatique'],
  },
  {
    id: 'live-show',
    name: 'Spectacle vivant',
    shortDefinition:
      'Représentation programmée mettant en scène des artistes, de la musique, des cascades ou des personnages.',
    definition:
      "Un spectacle vivant est une animation programmée à heure fixe, jouée par des artistes en chair et en os – à distinguer d'une attraction mécanique ou d'une exposition fixe. Les lieux de représentation vont de l'amphithéâtre en plein air à la salle fermée en passant par les espaces de rue. Le spectre va des productions scéniques façon Broadway et des shows de cascades aux spectacles de personnages, en passant par les expériences 4D avec éléments live et les shows laser ou pyrotechniques. Contrairement aux attractions, les spectacles vivants ont des horaires fixes et une capacité limitée par représentation. Ils constituent une bonne stratégie de pause pendant les pics d'attente de la mi-journée.",
    relatedTermIds: ['pre-show', 'ride-capacity', 'themed-land'],
    aliases: ['spectacle', 'show de cascades', 'animation live'],
  },
  {
    id: 'quick-service',
    name: 'Restauration Rapide',
    shortDefinition: 'Restaurant en libre-service sans personnel en salle.',
    definition:
      "La restauration rapide (ou counter service / fast casual) désigne les restaurants du parc où les visiteurs commandent au comptoir et transportent eux-mêmes leur plateau jusqu'à une table. C'est le type de restauration le plus courant dans les parcs. Disney a popularisé le terme « quick service » pour le distinguer du « table service » dans son système de réservation.",
    relatedTermIds: ['character-dining', 'table-service'],
    aliases: ['restauration en libre-service'],
  },
  {
    id: 'table-service',
    name: 'Service à Table',
    shortDefinition: 'Restaurant avec service en salle où les réservations sont souvent requises.',
    definition:
      "Les restaurants à service en table dans les parcs proposent une expérience assise complète avec personnel. Les réservations (souvent ouvertes 60 à 180 jours à l'avance dans les parcs Disney) sont vivement recommandées car les établissements populaires affichent souvent complet, en particulier pendant les vacances scolaires. Le service à table coûte nettement plus cher que la restauration rapide mais offre une qualité supérieure et un cadre de détente.",
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
    aliases: ['restaurant assis', 'restauration avec service'],
  },
  {
    id: 'character-dining',
    name: 'Repas avec Personnages',
    shortDefinition: 'Restaurant où des personnages costumés passent aux tables pendant le repas.',
    definition:
      "Le repas avec personnages est une formule de restauration à table (ou buffet) où des personnages costumés visitent chaque table pour interagir avec les convives, se prendre en photo et signer des autographes. Cela garantit une rencontre avec les personnages sans file d'attente séparée, le rendant populaire auprès des familles. Exemples : Chef Mickey's (Disney World) et le Storybook Dining de la Auberge de Cendrillon (Disneyland Paris).",
    relatedTermIds: ['character-meet-and-greet', 'quick-service', 'table-service'],
    aliases: ['dîner avec personnages', 'petit-déjeuner avec personnages', 'repas personnages'],
  },
  {
    id: 'drop-tower',
    name: 'Tour de chute',
    shortDefinition:
      'Attraction en forme de tour qui élève les visiteurs en hauteur avant de les lâcher en chute libre.',
    definition:
      "Une tour de chute (ou free-fall tower) est une attraction où les visiteurs sont hissés dans une nacelle ou sur des sièges individuels autour d'une tour centrale, puis relâchés pour plonger rapidement vers le sol. La descente peut être une quasi-chute libre (approchant l'apesanteur), freinée, ou même combinée avec un éjection vers le haut. Une phase de décélération progressive amortit l'arrivée au bas. Les variantes incluent les tours rotatives, les modèles multi-directionnels et les versions hybrides avec éjection. Les tours de chute offrent des sensations intenses sur une emprise réduite ; parmi les fabricants notables : Intamin, Mondial et S&S Worldwide.",
    relatedTermIds: ['flat-ride', 'height-requirement', 'intamin', 's-and-s-worldwide'],
    aliases: ['chute libre', 'tour de chute libre', 'tours de chute'],
  },
  {
    id: 'log-flume',
    name: 'Toboggan aquatique',
    shortDefinition:
      "Attraction sur canal d'eau où des bateaux-troncs descendent une piste et terminent dans une grande éclaboussure.",
    definition:
      "Un toboggan aquatique (aussi appelé log flume ou rivière en rondins) est une attraction aquatique où les visiteurs prennent place dans des embarcations en forme de tronc d'arbre qui glissent le long d'un canal, naviguant des sections plates avant une descente finale en piqué qui garantit une bonne éclaboussure. Apparus dans les années 1960, les toboggans aquatiques sont devenus un incontournable des parcs du monde entier, appréciés pour leur accessibilité familiale, leur débit modéré et leur attrait estival. Parmi les exemples européens notables : Poseidon à Europa-Park et de nombreuses installations de type Wildwasserbahn dans les parcs germanophones.",
    relatedTermIds: ['height-requirement', 'river-rapids', 'water-ride'],
    aliases: ['rivière de troncs', 'descente en bûche'],
  },
  {
    id: 'river-rapids',
    name: 'Rapides',
    shortDefinition:
      "Attraction en radeau circulaire dérivant dans des rapides artificiels où les visiteurs risquent d'être trempés.",
    definition:
      "Les rapides (ou white-water ride) font prendre place aux visiteurs dans des radeaux circulaires en PVC ou en polyester qui dérivent et tournent sur un canal artificiel imitant des rapides. Comme le radeau tourne librement, chaque trajet est imprévisible : selon la position à chaque élément d'eau, certains riders sont complètement trempés, d'autres restent relativement secs. Les rapides ont généralement une forte capacité horaire, une grande accessibilité familiale et peu de restrictions de taille. Ils sont particulièrement populaires lors des fortes chaleurs. Parmi les exemples européens : les Wildwasser de Phantasialand et diverses installations à Efteling, Europa-Park et Thorpe Park.",
    relatedTermIds: ['height-requirement', 'log-flume', 'water-ride'],
    aliases: ['rapides de rivière'],
  },
  {
    id: 'pendulum-ride',
    name: 'Attraction pendulaire',
    shortDefinition:
      'Attraction de type flat ride où une nacelle oscille en arc de pendule, souvent en tournant simultanément.',
    definition:
      "Une attraction pendulaire est un type de flat ride dans lequel une nacelle est suspendue à un long bras qui oscille dans un arc de plus en plus large, atteignant souvent une position presque verticale. La nacelle tourne également sur elle-même, combinant le mouvement de pendule avec une rotation axiale pour une expérience très intense.\n\nL'exemple le plus emblématique est le Frisbee (Mondial) : une nacelle en forme de disque qui décrit un arc de pendule en tournant. D'autres attractions pendulaires répandues sont le KMG Afterburner et l'Intamin Giant Frisbee. Ces attractions sont très prisées dans les parcs d'attractions et les fêtes foraines grâce à leur fort impact visuel et leur encombrement relativement réduit.",
    relatedTermIds: ['drop-tower', 'flat-ride', 'height-requirement', 'swing-ride'],
    aliases: ['Frisbee', 'Frisbees', 'attractions pendulaires'],
    alternateNames: ['manège pendulaire', 'attraction à balancement'],
  },
  {
    id: 'top-spin',
    name: 'Top Spin',
    shortDefinition:
      'Attraction de Huss dans laquelle une nacelle de passagers tourne librement dans toutes les directions pendant que le bâti oscillant se balance.',
    definition:
      "Le Top Spin est un modèle d'attraction fabriqué par Huss Rides. Une nacelle pouvant accueillir jusqu'à 40 passagers est montée sur un bâti pivotant ; la nacelle peut être tournée en continu dans n'importe quelle direction pendant que le bâti se balance, créant une combinaison imprévisible de forces d'oscillation et de rotation. L'attraction peut être programmée de la simple oscillation douce aux rotations continues les plus intenses.\n\nLes Top Spins ont été omniprésents dans les parcs d'attractions et les fêtes foraines des années 1990 aux années 2010. Malgré le mouvement d'oscillation, le Top Spin n'est pas une attraction pendulaire : la nacelle n'est pas suspendue à un long bras mais est enserrée entre deux cadres latéraux rotatifs.",
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['Top Spins'],
    alternateNames: ['Huss Top Spin'],
  },
  {
    id: 'break-dance',
    name: 'Break Dance',
    shortDefinition: `Un manège Huss avec plusieurs voitures montées sur un grand disque tournant, chaque voiture tournant librement sur son propre axe.`,
    definition: `Le Break Dance est un modèle de manège plat de Huss Rides dans lequel de petites voitures — chacune pouvant accueillir deux à quatre passagers — sont disposées autour d'un grand disque tournant. Les voitures sont libres de tourner sur leurs propres axes pendant que le disque tourne, produisant des forces de rotation et d'inclinaison chaotiques et imprévisibles qui varient à chaque cycle.\n\nLe Break Dance est devenu l'un des modèles de manèges plats itinérants et permanents les plus populaires à partir des années 1980, reconnaissable par son disque tournant illuminé et son programme musical énergique. De nombreuses variantes et imitations d'autres fabricants existent sous différents noms.`,
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Breakdance', 'Break Dancer'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    shortDefinition: `Un manège centrifuge dans lequel des gondoles sur un grand anneau rotatif sont maintenues en place par la force G tandis que l'anneau s'incline à la verticale.`,
    definition: `L'Enterprise est un manège dans lequel des gondoles sont disposées autour de la circonférence d'un grand anneau rotatif. Lorsque l'anneau accélère, la force centrifuge plaque les passagers fermement dans leurs sièges ; à pleine vitesse, l'ensemble de l'anneau s'incline progressivement vers une position presque verticale, laissant les passagers tourner à l'envers.\n\nOriginellement créée par Huss Rides et ensuite produite par plusieurs autres fabricants, l'Enterprise est devenue un élément incontournable des parcs permanents et des fêtes foraines itinérantes à partir des années 1970. Son inclinaison verticale spectaculaire en fait l'une des silhouettes de manèges les plus impressionnantes visuellement.`,
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition: `Un manège à bateau oscillant — une grande nacelle en forme de navire viking ou pirate qui oscille en un arc de pendule de plus en plus large.`,
    definition: `Le Ranger est le modèle de bateau oscillant de Huss Rides : une grande nacelle en forme de drakkar viking ou de navire pirate qui oscille d'avant en arrière en arc, montant progressivement à chaque oscillation. Les passagers s'assoient le long des côtés du navire, face vers l'intérieur. À pleine oscillation, la nacelle atteint des angles élevés, produisant de fortes forces G négatives au sommet.\n\nLes manèges à bateau oscillant sont produits par de nombreux fabricants dans le monde entier sous divers noms (Viking, Pirate Ship, Sea Monster). Le Ranger est l'un des modèles de manèges Huss les plus largement installés, présent dans les parcs permanents et les fêtes foraines itinérantes à travers l'Europe et au-delà.`,
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: [
      'swinging ship',
      'swinging ships',
      'pirate ship ride',
      'Viking ship ride',
      'bateau pirate',
      'bateau viking',
    ],
    alternateNames: ['Huss Ranger', 'bateau viking', 'bateau pirate'],
  },
  {
    id: 'condor',
    name: 'Condor',
    shortDefinition: `Un manège Huss avec des bras à gondoles qui s'étendent vers l'extérieur depuis une colonne centrale pendant que le manège tourne et monte.`,
    definition: `Le Condor est un modèle de manège de Huss Rides composé d'une haute colonne centrale avec plusieurs bras à gondoles. Pendant le fonctionnement, les bras s'étendent vers l'extérieur et les gondoles montent pendant que toute la structure tourne. Les passagers vivent une combinaison de rotation, d'élévation et d'inclinaison vers l'extérieur — offrant des vues sur le parc depuis une hauteur modérée.\n\nLe Condor était une attraction courante dans les parcs européens des années 1970 aux années 1990 et peut encore être trouvé dans de nombreux endroits permanents. Il est parfois confondu avec les attractions à chaises volantes (manèges à chaînes) mais dispose de gondoles fermées plutôt que de chaises ouvertes suspendues.`,
    relatedTermIds: ['flat-ride', 'huss-rides', 'swing-ride'],
  },
  {
    id: 'troika',
    name: 'Troika',
    shortDefinition: `Un manège Huss à trois bras rotatifs, chacun portant une nacelle dont les voitures tournent simultanément avec la plateforme principale.`,
    definition: `La Troika est un modèle de manège de Huss Rides dans lequel trois bras s'étendent depuis un moyeu central ; chaque bras porte une nacelle avec plusieurs voitures qui peuvent tourner. Pendant que la plateforme principale tourne, les nacelles tournent également et les voitures pivotent, créant plusieurs axes de rotation simultanés. Le mouvement résultant est très imprévisible et désorientant.\n\nLa Troika était un ajout populaire dans les parcs d'attractions européens et les fêtes foraines à partir des années 1970. Sa symétrie à trois voies lui confère une apparence visuelle distinctive. Les variantes et imitations d'autres fabricants sont parfois connues sous le nom de Trabant ou Walzer.`,
    relatedTermIds: ['break-dance', 'flat-ride', 'huss-rides'],
    aliases: ['Troikas', 'Trojka'],
    alternateNames: ['Huss Troika'],
  },
  {
    id: 'swing-ride',
    name: 'Chaises volantes',
    shortDefinition:
      "Attraction rotative où des sièges suspendus à des chaînes s'inclinent vers l'extérieur à mesure que la plate-forme tourne.",
    definition:
      "Les chaises volantes (aussi appelées wave swinger ou Kettenflieger) sont des attractions rotatives où des sièges suspendus à des chaînes sont accrochés à une structure centrale tournante. À mesure que la structure accélère, la force centrifuge projette les sièges vers l'extérieur et vers le haut, procurant une sensation de vol. Les chaises volantes comptent parmi les plus anciennes attractions foraines encore en service ; les versions modernes vont du petit manège pour enfants aux gigantesques tours à chaînes (starflyers) qui hissent les passagers à de grandes hauteurs. On les retrouve dans pratiquement tous les parcs d'attractions et fêtes foraines du monde.",
    relatedTermIds: ['flat-ride', 'height-requirement', 'ride-capacity'],
    aliases: ['manège à chaînes', 'chaises tournantes', 'vagues volantes'],
  },
  {
    id: 'racing-coaster',
    name: 'Montagnes russes en course',
    shortDefinition:
      "Deux voies parallèles de montagnes russes sur lesquelles les trains partent simultanément pour s'affronter.",
    definition:
      "Un racing coaster (montagne russe en course) dispose de deux circuits séparés mais symétriques se déroulant côte à côte, avec des trains lancés simultanément pour que les passagers vivent la sensation de rivaliser avec l'autre rame. Les voies se croisent ou se frôlent en plusieurs points pour intensifier le suspense. Certains modèles adoptent une configuration Möbius : les deux circuits forment une seule boucle continue et les passagers changent automatiquement de côté d'un tour à l'autre. Le concept fonctionne aussi bien en bois qu'en acier. En Europe, Piraten à Djurs Sommerland et Dwervelwind à Plopsaland en sont des exemples reconnus.",
    relatedTermIds: ['credit', 'steel-coaster', 'wooden-coaster'],
    aliases: ['coaster de course'],
  },
  {
    id: 'high-five',
    name: 'High Five',
    shortDefinition:
      'Élément de montagnes russes où deux trains sur des voies parallèles se frôlent à portée de main.',
    definition:
      "Un High Five est un élément de quasi-collision entre deux trains de montagnes russes circulant sur des voies distinctes mais très rapprochées – parfois à portée de bras – créant une illusion saisissante de collision imminente. Le nom vient de la sensation que les passagers pourraient tendre la main pour « taper dans la paume » des occupants de l'autre train. L'élément exige une synchronisation précise des départs pour amener les deux trains au point de croisement au même moment. Les wing coasters et les inverted coasters se prêtent particulièrement bien au High Five, car les sièges en porte-à-faux amplifient l'effet de frôlement. Duelling Dragons / Dragon Challenge à Universal's Islands of Adventure en était un exemple célèbre ; l'élément se retrouve aujourd'hui sur plusieurs B&M wing coasters à travers le monde.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'wing-coaster'],
    aliases: ['quasi-collision'],
  },
  {
    id: 'dining-reservation',
    name: 'Réservation restaurant',
    shortDefinition:
      'Réservation anticipée pour un restaurant à service complet dans un parc ou un resort.',
    definition:
      "Une réservation restaurant est une réservation anticipée dans un restaurant à service complet ou à personnages dans un parc d'attractions, un hôtel de resort ou un complexe de divertissement associé. Dans les parcs Disney, les réservations sont possibles jusqu'à 60 jours à l'avance (avec 10 jours supplémentaires pour les clients des hôtels du resort) et sont indispensables pour les établissements les plus prisés : ne pas réserver à temps peut signifier l'impossibilité de dîner dans ces restaurants lors des périodes de forte fréquentation. Les réservations sont généralement garanties par une carte bancaire ; Disney facture des frais de non-présentation ou d'annulation tardive. Dans la communauté des passionnés, les réservations en avance sont souvent désignées par le sigle ADR (Advance Dining Reservation).",
    relatedTermIds: ['character-dining', 'peak-day', 'table-service'],
    aliases: ['ADR', 'réservation de table', 'résa restaurant'],
  },
  {
    id: 'mobile-ordering',
    name: 'Commande mobile',
    shortDefinition:
      "Fonction de l'appli du parc permettant de commander et payer ses repas à l'avance sans faire la queue au comptoir.",
    definition:
      "La commande mobile permet aux visiteurs de parcourir le menu d'un restaurant, de passer et régler leur commande, puis de sélectionner un créneau de retrait via l'application officielle du parc – sans faire la queue au comptoir. Disney a popularisé le système dans ses restaurants à service rapide ; Universal, Six Flags, Merlin Parks et de nombreux autres opérateurs ont depuis déployé leurs propres versions. Lorsque le créneau sélectionné arrive, les visiteurs reçoivent une notification et récupèrent leur commande au comptoir dédié. La commande mobile permet de gagner un temps précieux, surtout lors du pic du déjeuner. Elle nécessite un smartphone chargé et une connexion suffisante dans le parc, ce qui n'est pas toujours garanti.",
    relatedTermIds: ['dining-reservation', 'quick-service'],
    aliases: ['commande sur appli', 'commande en ligne'],
  },
  {
    id: 'food-court',
    name: 'Food court',
    shortDefinition:
      'Grand espace de restauration partagé regroupant plusieurs comptoirs de restauration rapide sous un même toit.',
    definition:
      "Un food court est un espace de restauration commun regroupant plusieurs comptoirs ou kiosques de restauration rapide proposant des cuisines différentes, autour d'une salle commune. Dans les parcs d'attractions, les food courts sont généralement les espaces de restauration à plus forte capacité, conçus pour absorber le flux du déjeuner. Différents membres d'un groupe peuvent commander à différents comptoirs et se retrouver ensemble. Le niveau de thématisation varie : Disney et Universal intègrent souvent les food courts à l'univers de leurs terres, tandis que d'autres parcs les exploitent comme de simples espaces fonctionnels près des entrées. Les food courts sont en règle générale l'option de restauration la plus abordable au sein d'un resort.",
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    aliases: ['espace restauration', 'halle alimentaire', 'zone de restauration'],
  },
  {
    id: 'capacity-closure',
    name: 'Fermeture pour capacité maximale',
    shortDefinition:
      "Situation où un parc cesse d'admettre de nouveaux visiteurs car sa fréquentation maximale est atteinte.",
    definition:
      "Une fermeture pour capacité maximale (aussi appelée parc complet ou plafond de fréquentation) survient quand un parc d'attractions atteint son seuil d'affluence maximum autorisé ou opérationnellement sûr et cesse temporairement de vendre des billets journée ou d'admettre de nouveaux visiteurs. Les parcs gèrent la capacité par des réservations d'entrée horaires, une surveillance en temps réel de la fréquentation et des fermetures temporaires d'entrée. Les détenteurs de pass annuel peuvent être bloqués certains jours selon les conditions du pass ; d'autres parcs utilisent des systèmes de réservation anticipée pour éviter la surpopulation avant qu'elle ne survienne. Les fermetures pour capacité sont les plus fréquentes lors des pics de vacances scolaires, des soirées de feux d'artifice et des événements spéciaux. Consulter l'appli du parc ou ses réseaux sociaux le matin du jour prévu peut éviter de mauvaises surprises.",
    relatedTermIds: ['crowd-level', 'peak-day', 'school-holiday', 'season-pass'],
    aliases: ['parc complet', 'parc plein', 'fermeture capacité'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      "Une variante du zero-G roll intégrant un changement de direction — le train entre et sort de l'inversion sur des caps différents.",
    definition:
      "Le zero-G winder reprend le concept du zero-G roll — une rotation à 360 degrés sur un arc parabolique générant une quasi-impesanteur au sommet — en y ajoutant un changement de direction dans la géométrie de la voie. Contrairement au zero-G roll classique où le train entre et sort sur des caps à peu près parallèles, le winder courbe la voie pendant la rotation de sorte que le train ressort dans une direction sensiblement différente. L'élément combine ainsi la sensation flottante d'une inversion et la transition vers la section suivante du tracé en une seule séquence.\n\nLes zero-G winders sont associés aux conceptions de montagnes russes plus modernes et ambitieuses, notamment de fabricants comme Intamin et B&M. Kondaa à Walibi Belgium et VelociCoaster aux Universal's Islands of Adventure en sont deux exemples phares. La combinaison d'airtime, d'inversion et de changement de direction dans un seul élément confère au zero-G winder une sensation plus complexe que le zero-G roll standard.",
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      "Un élément à double inversion étiré et asymétrique dans lequel les deux inversions sont reliées par un long arc incurvé — évoquant la forme d'une banane.",
    definition:
      "Le banana roll est une variation étirée du concept de double inversion, dans laquelle les deux inversions sont espacées et reliées par une section en courbe ample plutôt que par la géométrie serrée et symétrique d'un cobra roll classique. Vu de dessus, la voie décrit un arc progressif à travers les deux inversions, rappelant la courbure d'une banane. La géométrie plus lâche répartit les deux inversions sur une plus longue portion de voie, offrant au rider une expérience plus fluide et étalée qu'un cobra roll intense et rapide.\n\nLe banana roll est apparu pour la première fois en 2011 sur Takabisha à Fuji-Q Highland au Japon, construit par Gerstlauer. S&S Worldwide a ensuite développé sa propre variante à double inversion pour Steel Curtain à Kennywood. En raison de l'espace latéral considérable requis, l'élément se retrouve généralement sur des installations plus grandes, proches du sol, où la voie peut s'écarter largement entre les deux inversions.",
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
    aliases: ['banana roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Looping Incliné',
    shortDefinition:
      "Un looping vertical incliné hors de son axe perpendiculaire — le train l'aborde et le quitte en biais plutôt que de face.",
    definition:
      "Un looping incliné (en anglais inclined loop ou tilted loop) est un looping vertical classique pivotant autour de son axe, généralement de 45 à 80 degrés par rapport à la direction de déplacement du train. Au lieu que le train entre et sorte du looping en ligne droite — comme dans un looping droit classique — il l'aborde et le quitte de biais, ce qui crée un profil visuel asymétrique et une sensation de conduite sensiblement différente.\n\nLa géométrie inclinée modifie la perception de l'inversion : l'approche semble plus latérale qu'un looping standard, et la sortie en bas du cercle provient d'une direction inattendue, ce qui peut être à la fois déstabilisant et grisant. Pour les spectateurs, un looping incliné paraît visuellement très différent d'un looping droit et se reconnaît immédiatement. On en trouve sur plusieurs montagnes russes B&M et Intamin, souvent en milieu ou en fin de tracé.",
    relatedTermIds: ['b-and-m', 'intamin', 'inversion', 'vertical-loop'],
    aliases: ['tilted loop', 'looping penché', 'looping incliné', 'inclined loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      "Élément Vekoma à double inversion dans lequel le train ressort dans la même direction qu'il est entré.",
    definition:
      "Le sea serpent est un élément à double inversion étroitement associé aux designs de montagnes russes inversées de Vekoma. Comme le cobra roll, il consiste en deux séquences d'inversion réunies par une section centrale, mais la géométrie de la voie diffère sur un point clé : tandis que le cobra roll fait pivoter le train de 180 degrés, le sea serpent est conçu pour que le train entre et sorte en se dirigeant dans la même direction générale. Les deux inversions s'élèvent et retombent en une séquence fluide sans inverser le cap du train, donnant à l'élément, vu de côté, un aspect allongé en forme de S — rappelant le corps d'un serpent de mer émergeant de deux vagues.\n\nLe sea serpent équipe le modèle Suspended Looping Coaster (SLC) de Vekoma et certaines de ses installations personnalisées. Le SLC ayant été produit en grand nombre pour des parcs du monde entier, le sea serpent est l'un des éléments à double inversion les plus répandus à l'échelle mondiale, même s'il est moins connu par son nom que le cobra roll.",
    relatedTermIds: ['batwing', 'cobra-roll', 'inversion', 'vekoma'],
    aliases: ['sea serpent', 'roll over'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      "Élément signature RMC qui fusionne la première chute et un barrel roll complet en une seule séquence — les riders se retrouvent à l'envers pendant qu'ils chutent encore.",
    definition:
      "Le barrel roll drop est l'un des éléments signatures les plus emblématiques de Rocky Mountain Construction, fusionnant deux expériences normalement distinctes — la première descente et une inversion complète — en une séquence unique et ininterrompue. Après avoir quitté le lifthill, la voie fait effectuer au train un barrel roll complet tout en descendant simultanément : les riders se retrouvent complètement à l'envers près du point le plus pentu de la descente, avant d'être remis à l'endroit à mesure que le train atteint le bas et enchaîne sur le reste du tracé.\n\nL'élément a été rendu possible par le système de rails en acier I-Box de RMC, qui permet les rayons de courbure serrés et la géométrie tridimensionnelle complexe nécessaires à un roll et une descente simultanés — une combinaison impossible sur une voie de montagnes russes en bois traditionnelle. Medusa Steel Coaster à Six Flags Mexico comptait parmi les premières installations à en être dotées ; Steel Vengeance à Cedar Point et Zadra à Energylandia en sont d'autres exemples célébrés.",
    relatedTermIds: ['first-drop', 'hybrid-coaster', 'inversion', 'rmc', 'stall'],
    aliases: ['barrel roll drop', 'RMC barrel roll', 'barrel roll downdrop'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      "Mid-Course Brake Run — une zone de freinage à mi-parcours pouvant stopper complètement le train pour permettre l'exploitation en multi-rames.",
    definition:
      "Un mid-course brake run (MCBR) est une section de freinage installée quelque part au milieu du tracé d'une montagne russe — après les premiers grands éléments mais avant la séquence finale. Contrairement aux trim brakes qui se contentent de réduire la vitesse en laissant le train continuer immédiatement, un MCBR est un frein de bloc complet : il peut arrêter le train et le maintenir jusqu'à ce que la section de bloc suivante soit confirmée comme libre. Cela permet de faire circuler plusieurs rames simultanément sur le même circuit sans risque de collision, augmentant considérablement la capacité de l'attraction.\n\nUn jour d'exploitation bien chargé, un MCBR bien synchronisé relâchera le train arrêté presque immédiatement et les riders remarqueront à peine la brève décélération. Les jours plus calmes avec moins de rames en circulation, l'arrêt peut durer plus longtemps. Les MCBRs sont standard sur la plupart des grandes montagnes russes : les B&M inverted et floorless, de nombreuses attractions Intamin et d'autres rides à haute capacité les utilisent en routine.",
    relatedTermIds: ['block-brake', 'brake-run', 'ride-capacity', 'stacking', 'trim-brake'],
    aliases: ['mid-course brake run', 'frein de mi-parcours', 'frein intermédiaire', 'MCBR'],
  },
  {
    id: 'interlocking-loops',
    name: 'Loopings Entrelacés',
    shortDefinition:
      'Deux loopings verticaux dont les plans se croisent — créant une structure visuelle spectaculaire en forme de maillon de chaîne ou de chiffre huit.',
    definition:
      "Les loopings entrelacés (en anglais interlocking loops) sont deux loopings verticaux positionnés de façon à ce que leurs plans structurels se croisent, généralement à des angles quasi perpendiculaires. Il en résulte une configuration visuelle saisissante où un looping semble traverser l'autre sous certains angles, évoquant un maillon de chaîne ou un immense chiffre huit jaillissant du sol. La complexité structurelle nécessaire pour faire se croiser deux loopings sans que les voies se touchent réellement est considérable, mais l'impact visuel en fait un point focal spectaculaire dans le paysage d'un parc.\n\nLes loopings entrelacés sont le plus souvent associés aux B&M inverted coasters et aux montagnes russes à grand nombre d'inversions. Dragon Khan à PortAventura, longtemps l'une des montagnes russes les plus célèbres d'Europe, comporte des loopings entrelacés dans son tracé à huit inversions, et cette section croisée est l'une des plus photographiées du parcours.",
    relatedTermIds: ['b-and-m', 'inversion', 'vertical-loop'],
    aliases: ['loopings entrelacés', 'interlocking loops', 'loops croisés'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      "Le dispositif de cliquet sur un lifthill qui empêche le train de reculer — à l'origine du célèbre son clic-clac.",
    definition:
      "Un anti-rollback (parfois appelé « chien anti-rollback ») est un mécanisme de sécurité mécanique installé le long du dessous d'un lifthill. À mesure que le train monte, des cliquets métalliques à ressort s'enclenchent sur une série de dents intégrées à la structure du lifthill. En cas de défaillance de la chaîne ou du moteur, les cliquets se bloquent dans les dents et immobilisent le train, l'empêchant de rouler en arrière. C'est ce mouvement de cliquet sur les dents qui produit le rythme clic-clac devenu l'une des signatures sonores les plus reconnaissables des montagnes russes traditionnelles.\n\nSur les montagnes russes modernes dotées de lifthill à câble silencieux ou à propulsion LSM, les anti-rollbacks sont souvent remplacés par des systèmes de freinage électromagnétiques silencieux — c'est pourquoi certaines nouvelles attractions sont beaucoup plus calmes lors de la montée. Certains passionnés regrettent cette évolution, car le clic-clac fait partie intégrante de l'atmosphère classique des montagnes russes.",
    relatedTermIds: ['launch-coaster', 'lifthill', 'rollback'],
    aliases: ['anti-rollback device', 'cliquet anti-retour', 'clic-clac'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      'Éléments structurels conçus pour passer juste au-dessus de la tête des riders à grande vitesse — créant une illusion saisissante de collision imminente.',
    definition:
      "Les head choppers (littéralement « coupe-têtes ») sont des éléments de conception intentionnels dans lesquels la charpente de support, les entretoises transversales, les tunnels ou des sections de voie passent immédiatement au-dessus de la tête des riders au moment où le train est à pleine vitesse. La proximité et le timing créent une illusion puissante qu'un obstacle est sur le point de frapper les riders — une montée d'adrénaline sans aucun danger réel, car le dégagement est précisément calculé. La sensation est la plus vive lorsque les riders n'ont pas le temps de l'anticiper.\n\nLes head choppers sont particulièrement associés aux montagnes russes en bois très compactes et aux inverted coasters, où le profil suspendu des trains rapproche les riders des supports et des sections de voie voisines. Pour beaucoup de passionnés, des head choppers bien conçus témoignent d'un travail créatif sur le tracé et contribuent considérablement à l'intensité perçue d'une attraction.",
    relatedTermIds: ['inverted-coaster', 'roller-coaster-element', 'twister-coaster'],
    aliases: ['head chopper', 'coupe-tête', 'near miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      "Quand un opérateur appuie les harnais ou les lap bars trop fermement contre les riders — supprimant le confort et l'airtime que la montagne russe était conçue pour offrir.",
    definition:
      "Le stapling désigne la pratique — intentionnelle ou par excès de prudence — d'un opérateur qui enfonce un lap bar ou un harnais d'épaules si fermement contre un rider qu'il est bien plus serré que le minimum de sécurité requis. Le terme vient de la sensation d'être « agrafé » dans son siège. Sur les montagnes russes axées sur l'airtime, les lap bars sont censés être suffisamment lâches pour que les riders puissent réellement se soulever légèrement de leur siège aux crêtes des collines — c'est ce qui crée l'airtime. Un rider stapled reste plaqué dans son siège pendant toute la durée de la course et ne peut pas ressentir la sensation de flottement voulue.\n\nLe stapling est une source fréquente de frustration dans la communauté des passionnés, notamment sur les montagnes russes en bois et les coasters hybrides où l'airtime est l'attraction principale. Certains parcs sont connus pour leur politique de bridage systématique ; d'autres sont appréciés pour leur liberté de lap bar.",
    relatedTermIds: ['airtime', 'ejector-airtime', 'lap-bar', 'shoulder-harness'],
    aliases: ['stapled', 'harnais trop serré', 'lap bar serré'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Quand un train perd suffisamment de vitesse en cours de route pour se retrouver bloqué dans un point bas de la voie, incapable de terminer son parcours.',
    definition:
      "Le valleying survient lorsqu'un train, ayant perdu trop d'énergie cinétique pendant la course, ne dispose plus d'une vitesse suffisante pour franchir le prochain élément et s'immobilise — voire recule — dans un creux entre deux points hauts du tracé. Le train se retrouvant dans un point bas et non sur une zone de freinage ou en gare, les systèmes d'exploitation normaux ne peuvent pas le déplacer. La récupération nécessite généralement du personnel de maintenance qui pousse ou treuille le train jusqu'au prochain point haut et procède à l'évacuation des riders.\n\nLe valleying est rare dans des conditions d'exploitation normales, car les attractions sont conçues avec de larges marges de vitesse. Il est plus susceptible de survenir par temps très froid (les roulements tournant mal à basse température), après un freinage excessif par des trim brakes, ou sur d'anciennes montagnes russes en bois dont la géométrie de voie a évolué.",
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    aliases: ['valleyed', 'train bloqué', 'train immobilisé'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      "Un type de montagne russe à petits véhicules individuels avec des virages serrés et plats au bord de plateformes surélevées — créant la sensation que le véhicule va s'envoler.",
    definition:
      "Un wild mouse (souris sauvage) utilise de petits véhicules de deux à quatre places plutôt que de longs trains. Sa marque de fabrique est une série de virages en épingle serrés, peu déversés, exécutés aux bords extrêmes de la voie. La faible déversure — à l'opposé des courbes fortement relevées des autres montagnes russes — projette les riders latéralement contre la paroi du véhicule, et l'inertie de l'approche donne l'impression que le virage arrive trop tard, ce qui crée la conviction convaincante que le véhicule va quitter la voie.\n\nLes wild mouse sont parmi les conceptions les plus économes en espace, faisant tenir une quantité surprenante de voie dans une emprise compacte en superposant les niveaux de virages. Des modèles en acier sont produits par Mack Rides, Maurer et Gerstlauer, entre autres ; les wild mouse en bois existent mais restent rares.",
    relatedTermIds: ['gerstlauer', 'mack-rides', 'spinning-coaster', 'steel-coaster'],
    aliases: ['wild mouse coaster', 'souris sauvage', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: 'Coaster 4D',
    shortDefinition:
      'Un type de montagne russe dont les sièges sont montés sur des bras rotatifs dépassant de chaque côté du train — et peuvent pivoter indépendamment de la direction de marche.',
    definition:
      "Un coaster 4D (quatrième dimension) est une conception dans laquelle les sièges passagers ne sont pas fixés rigidement au train, mais montés sur des bras pivotants s'étendant à gauche et à droite de chaque voiture. Les sièges peuvent tourner vers l'avant ou l'arrière indépendamment de la direction du train — soit contrôlés par un rail de guidage fixe longeant la voie principale (imposant une position de siège précise à chaque instant du parcours), soit en rotation libre sous l'effet de la gravité et de la répartition du poids des riders. Il en résulte que les passagers peuvent être tournés vers le bas pendant une descente, renversés dans un virage, ou tourner simultanément sur plusieurs axes pendant des inversions.\n\nLe concept a été développé par Arrow Dynamics et perfectionné par S&S Worldwide. X2 au Six Flags Magic Mountain en Californie est l'exemple le plus célèbre, ouvert en 2002 comme premier coaster 4D au monde. Eejanaika à Fuji-Q Highland au Japon détient le record du plus grand nombre d'inversions de toute montagne russe au monde, en partie grâce à la rotation des sièges qui multiplie le comptage des inversions.",
    relatedTermIds: [
      'arrow-dynamics',
      'inversion',
      'inverted-coaster',
      's-and-s-worldwide',
      'spinning-coaster',
    ],
    aliases: [
      '4D coaster',
      'quatrième dimension',
      'coaster quatrième dimension',
      'free spin coaster',
    ],
  },
  {
    id: 'out-and-back',
    name: 'Out-and-Back',
    shortDefinition:
      "Un type de tracé de montagne russe qui s'éloigne en ligne droite depuis la gare, fait demi-tour au bout du terrain et revient en parallèle.",
    definition:
      "Un out-and-back est l'un des deux types de tracés fondamentaux de montagne russe. Le train quitte la gare, part dans une direction globalement linéaire — généralement avec une série de collines optimisées pour l'airtime — effectue un demi-tour à l'extrémité du terrain, et revient sur un trajet parallèle à l'aller. Les deux tronçons se croisent rarement, donnant un plan allongé et étroit.\n\nLes tracés out-and-back sont fortement associés aux montagnes russes en bois traditionnelles, où la vitesse accumulée sur les longues collines aller est exploitée au retour par une succession de collines plus petites et plus rapprochées maximisant le floater airtime. Les exemples célèbres incluent The Voyage à Holiday World et diverses versions du type Racer.",
    relatedTermIds: ['airtime', 'airtime-hill', 'twister-coaster', 'wooden-coaster'],
    aliases: ['out and back', 'tracé out-and-back', 'aller-retour'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      "Un tracé de montagne russe qui boucle, spirale et se croise sur lui-même — emballant un maximum d'éléments dans une empreinte compacte.",
    definition:
      "Un twister (aussi appelé cyclone) est un tracé de montagne russe dans lequel la voie spirale, revient sur elle-même et se croise de façon répétée, tissant une structure complexe plutôt que de suivre la trajectoire simple en deux tronçons d'un out-and-back. La caractéristique définissante est que le train passe fréquemment très près d'autres sections de la même voie — souvent dans des directions et à des hauteurs différentes — créant des effets head-chopper et une complexité visuelle caractéristiques.\n\nLes tracés twister sont économes en superficie : une grande longueur de voie et un important dénivelé peuvent être logés dans une empreinte compacte, ce qui en fait un choix prisé dans les parcs à l'espace restreint. Les twisters en bois incluent des classiques comme le Twister du Gröna Lund à Stockholm ; les twisters en acier comprennent de nombreuses conceptions B&M et Intamin.",
    relatedTermIds: ['head-choppers', 'helix', 'out-and-back', 'wooden-coaster'],
    aliases: ['twister layout', 'cyclone', 'tracé twister'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      "Mean Absolute Error — l'écart moyen en minutes entre le temps d'attente prédit et le temps réel.",
    definition:
      'Le MAE (Mean Absolute Error, erreur absolue moyenne) est la mesure de précision standard utilisée par park.fan. Il calcule la différence moyenne — en minutes — entre chaque temps d\'attente prédit et le temps réel enregistré à l\'attraction. Un MAE de 8 minutes signifie que les prédictions sont en moyenne à 8 minutes de la réalité.\n\nLe MAE traite chaque erreur de manière égale : une erreur de 5 minutes et une de 15 minutes sont moyennées linéairement. Cela le rend intuitif — MAE = 10 signifie "les prédictions sont généralement à 10 minutes près." Un MAE plus faible signifie toujours des prédictions plus précises.',
    relatedTermIds: ['ai-forecast', 'mape', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error — similaire au MAE mais pénalise davantage les grandes erreurs de prédiction.',
    definition:
      "Le RMSE (Root Mean Square Error, racine de l'erreur quadratique moyenne) mesure la précision en mettant au carré chaque erreur avant de les moyenner. Les grandes erreurs — une file d'attente prédite avec 40 minutes de décalage — contribuent donc bien plus au RMSE qu'une erreur de 5 minutes. Le RMSE est toujours supérieur ou égal au MAE.\n\nUn grand écart entre RMSE et MAE indique que le modèle produit parfois de grosses erreurs ponctuelles, même si la plupart des prédictions sont proches. Les deux métriques sont affichées en direct sur la page d'accueil de park.fan.",
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'r-squared'],
    aliases: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      "Mean Absolute Percentage Error — l'erreur de prédiction exprimée en pourcentage du temps d'attente réel.",
    definition:
      "Le MAPE (Mean Absolute Percentage Error, erreur absolue moyenne en pourcentage) exprime la précision en pourcentage plutôt qu'en minutes. Au lieu de \"8 minutes d'écart\", il indique \"15 % du temps d'attente réel d'écart\". Cela facilite la comparaison entre attractions aux temps d'attente très différents — une erreur de 10 minutes est bien plus significative pour une attraction habituellement à 15 minutes que pour une à 90 minutes.\n\nLe MAPE peut être trompeusement élevé quand les temps d'attente réels sont très courts. C'est pourquoi park.fan l'affiche toujours avec le MAE et le RMSE.",
    relatedTermIds: ['ai-forecast', 'mae', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      "R-carré — mesure dans quelle proportion le modèle IA explique les variations des temps d'attente réels (0–1, plus haut = mieux).",
    definition:
      "Le R² (R-carré, ou coefficient de détermination) mesure quelle part de la variation des temps d'attente réels le modèle parvient à expliquer. Une valeur de 1,0 signifierait des prédictions parfaites ; 0,0 signifie que le modèle n'explique rien au-delà d'une simple moyenne. En pratique, des valeurs supérieures à 0,7 indiquent un bon modèle ; au-dessus de 0,9, excellent.\n\nPour les prédictions de temps d'attente, atteindre un R² élevé est difficile car les files sont influencées par des facteurs imprévisibles. Le score R² de park.fan reflète les performances réelles sur toutes les prédictions suivies, mis à jour quotidiennement.",
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'rmse'],
    aliases: ['R-squared', 'coefficient de détermination'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Attraction saisonnière',
    shortDefinition:
      "Une attraction, un show ou une expérience qui ne fonctionne que pendant certains mois de l'année — comme une patinoire en hiver ou un toboggan aquatique en été.",
    definition:
      "Une attraction saisonnière est un manège, un show ou une expérience que le parc ne propose que pendant une période définie de l'année. Les patinoires, les pistes de luge et les shows hivernaux fonctionnent généralement de novembre à février ; les toboggans aquatiques, les zones de jeux d'eau et les spectacles en plein air de mai à septembre. Certaines attractions saisonnières sont liées à des événements spécifiques comme Halloween ou Noël.\n\nSur park.fan, les attractions et shows saisonniers sont automatiquement identifiés à partir des données historiques d'exploitation et masqués dans les onglets du parc et sur la carte lorsqu'ils sont hors de leurs mois actifs — pour réduire l'encombrement visuel et t'aider à te concentrer sur ce qui est réellement ouvert aujourd'hui. Un badge saisonnier (❄️ Hiver, ☀️ Été ou 🍃 générique) apparaît sur chaque carte concernée. Lorsque l'attraction est hors saison, le badge est atténué. Un bouton de filtre dans les onglets permet d'afficher les entrées masquées si nécessaire.",
    relatedTermIds: ['crowd-calendar', 'offseason', 'refurbishment'],
    aliases: ['attraction temporaire', 'manège saisonnier', 'show saisonnier'],
  },
  {
    id: 'gravity-group',
    name: 'The Gravity Group',
    shortDefinition:
      'Une entreprise de conception américaine spécialisée dans les montagnes russes en bois modernes.',
    definition:
      'The Gravity Group est une société d\'ingénierie et de conception américaine renommée pour son travail sur les montagnes russes en bois modernes. Formé par des vétérans de Custom Coasters International (CCI), le groupe est connu pour créer des tracés compacts mais intenses qui repoussent les limites de ce que les structures en bois peuvent accomplir. Leurs conceptions comportent souvent des trains "Timberliner", capables de naviguer dans des manœuvres serrées et sinueuses que les trains de montagnes russes en bois traditionnels ne peuvent pas gérer. Des exemples notables de leur travail incluent Voyage à Holiday World et Wodan - Timburcoaster à Europa-Park.',
    relatedTermIds: ['hybrid-coaster', 'rmc', 'wooden-coaster'],
    aliases: ['Gravity Group'],
  },
  {
    id: 'sally-dark-rides',
    name: 'Sally Dark Rides',
    shortDefinition: "Un constructeur leader de dark rides et d'animatroniques.",
    definition:
      "Sally Dark Rides (anciennement Sally Corporation) est un développeur de premier plan de dark rides immersifs et d'animatroniques avancés. Basée en Floride, l'entreprise se spécialise dans les attractions \"clés en main\", gérant tout, de la narration et de la conception des décors aux systèmes de transport et à l'animation des personnages. Ils sont particulièrement célèbres pour leurs dark rides interactifs où les visiteurs utilisent des blasters pour marquer des points, comme les diverses attractions Justice League: Battle for Metropolis et de nombreux manèges sur le thème de Scooby-Doo dans le monde entier.",
    relatedTermIds: ['animatronics', 'dark-ride', 'interactivity'],
    aliases: ['Sally Corporation'],
  },
  {
    id: 'mondial',
    name: 'Mondial',
    shortDefinition: 'Un constructeur néerlandais de flat rides à sensations fortes.',
    definition:
      "Mondial est un constructeur basé aux Pays-Bas spécialisé dans les flat rides de grande envergure et de haute intensité. Ils sont connus pour créer des profils de mouvement uniques qui impliquent souvent plusieurs axes de rotation. Leurs produits les plus célèbres incluent le Top Scan, le Shake et le Turbine. Les manèges Mondial sont des incontournables des grands parcs d'attractions et du circuit forain européen, reconnus pour leur ingénierie robuste et leurs niveaux de sensations extrêmes.",
    relatedTermIds: ['flat-ride', 'huss-rides', 'top-spin'],
  },
  {
    id: 'kmg',
    name: 'KMG',
    shortDefinition:
      'Un constructeur néerlandais célèbre pour ses flat rides portables et de haute qualité.',
    definition:
      "KMG (Kermis Machinebouw Gaasbeek) est une entreprise d'ingénierie néerlandaise qui est devenue l'un des constructeurs de flat rides les plus prospères au monde. Initialement axés sur le marché forain, leurs manèges se retrouvent également dans des installations permanentes de parcs à thèmes en raison de leur fiabilité et de leur facilité d'entretien. KMG est crédité de l'invention de l'Afterburner (style Frisbee) et du Freak Out, et est loué pour l'efficacité de ses montages et la fluidité de ses expériences.",
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition:
      'Une entreprise technologique qui développe des systèmes de transport avancés et des bases de mouvement.',
    definition:
      "Oceaneering Entertainment Systems (OES), une division d'Oceaneering International, est un leader mondial de la technologie de pointe pour les attractions. S'appuyant sur leur expertise en robotique sous-marine, ils ont développé la technologie révolutionnaire de véhicule à base de mouvement utilisée dans The Amazing Adventures of Spider-Man à Universal Islands of Adventure. Ils fabriquent également des systèmes de transport sans rail (trackless) et des figures animatroniques complexes, fournissant le support technique pour bon nombre des expériences de parcs à thèmes les plus sophistiquées au monde.",
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
  },
  {
    id: 'etf-ride-systems',
    name: 'ETF Ride Systems',
    shortDefinition:
      'Un constructeur néerlandais spécialisé dans les systèmes de transport sans rail et multi-mouvements.',
    definition:
      'ETF Ride Systems est une entreprise néerlandaise spécialisée dans les plateformes de transport flexibles et de haute qualité, notamment les véhicules sans rail. Leurs systèmes utilisent la navigation par fil ou le positionnement local pour se déplacer librement sur un sol plat, permettant des parcours non linéaires et des véhicules "dansants". Les systèmes ETF propulsent de nombreux dark rides appréciés, tels que Symbolica à Efteling et Ratatouille : L\'Aventure Totalement Toquée de Rémy à Disneyland Paris et Walt Disney World.',
    relatedTermIds: ['dark-ride', 'oceaneering', 'trackless-ride'],
  },
  {
    id: 'chance-rides',
    name: 'Chance Rides',
    shortDefinition:
      'Un constructeur américain de montagnes russes, de flat rides et de systèmes de transport.',
    definition:
      'Chance Rides est un constructeur américain polyvalent qui a tout produit, des carrousels et trains miniatures aux montagnes russes à grande vitesse. Après avoir acquis les actifs de D.H. Morgan Manufacturing, ils sont entrés sur le marché des hypercoasters. Aujourd\'hui, ils sont connus pour leur modèle "Hyper GT-X" et leurs flat rides classiques comme le Zipper et le Wipeout, tout en étant un fournisseur leader de trams de parc et de carrousels.',
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'steel-coaster'],
  },
  {
    id: 'non-inverting-loop',
    name: 'Non-Inverting Loop',
    shortDefinition:
      "Un élément de montagnes russes en forme de boucle qui pivote pour que les passagers ne soient jamais totalement à l'envers.",
    definition:
      "Un non-inverting loop est un élément de montagnes russes qui imite la forme d'un looping vertical traditionnel mais incorpore une torsion au sommet pour que le train reste à l'endroit. Les visiteurs vivent la sensation visuelle d'un looping et des forces G verticales importantes sans être réellement inversés. Cet élément a été popularisé par Maurer Rides sur ses montagnes russes X-Car (comme Hollywood Rip Ride Rockit) et a depuis été utilisé par d'autres constructeurs comme Mack Rides.",
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop'],
    aliases: ['Non-Inverting Loops', 'Looping sans inversion'],
  },
  {
    id: 'pretzel-knot',
    name: 'Pretzel Knot',
    shortDefinition: 'Un grand élément en forme de bretzel où la voie se croise sur elle-même.',
    definition:
      "Un pretzel knot (nœud de bretzel) est un élément de montagnes russes consistant en une entrée et une sortie simultanées qui forment une forme de bretzel. À ne pas confondre avec le \"pretzel loop\" que l'on trouve sur les montagnes russes volantes ; le pretzel knot est un élément plus rare que l'on trouve sur des montagnes russes comme Banshee à Kings Island. Il implique deux inversions (un dive loop suivi d'un Immelmann) qui se chevauchent, créant une expérience visuellement frappante et à haute force.",
    relatedTermIds: ['corkscrew', 'inversion', 'pretzel-loop'],
    aliases: ['Pretzel Knots', 'Nœud de bretzel'],
  },
  {
    id: 'raven-turn',
    name: 'Raven Turn',
    shortDefinition:
      "Un élément sur les montagnes russes 4D consistant en un demi-looping qui change l'orientation du siège.",
    definition:
      'Un raven turn est un élément signature des montagnes russes de 4e dimension (comme X2 ou Eejanaika). Il s\'agit d\'un demi-looping qui peut être effectué soit "à l\'intérieur", soit "à l\'extérieur". Comme les montagnes russes 4D ont des sièges qui tournent indépendamment de la voie, le raven turn est souvent combiné avec un basculement du siège, créant une sensation désorientante où le monde semble faire une culbute autour du passager.',
    relatedTermIds: ['fourth-dimension-coaster', 'inversion', 'wing-coaster'],
    aliases: ['Raven Turns'],
  },
  {
    id: 'dive-drop',
    name: 'Dive Drop',
    shortDefinition:
      "Une inversion sur les wing coasters qui commence par un tonneau en ligne au sommet d'un lift hill.",
    definition:
      'Un dive drop est un élément de montagnes russes utilisé presque exclusivement sur les B&M Wing Coasters. Il sert de descente initiale, où le train quitte le lift hill, pivote lentement de 180 degrés vers une position inversée, puis plonge dans un demi-looping. Il offre un "hangtime" important et une perspective unique sur la descente, en particulier pour les passagers des sièges extérieurs.',
    relatedTermIds: ['first-drop', 'hangtime', 'inversion', 'wing-coaster'],
    aliases: ['Dive Drops'],
  },
  {
    id: 'outerbanked-turn',
    name: 'Outerbanked Turn',
    shortDefinition:
      "Un virage où la voie est inclinée vers l'extérieur par rapport à la direction du virage.",
    definition:
      "Un outerbanked turn est une manœuvre où la voie est inclinée dans la direction opposée à ce qui est traditionnellement attendu. Au lieu de s'incliner \"vers\" la courbe pour neutraliser les forces latérales, la voie s'incline vers \"l'extérieur\", créant une sensation d'être projeté vers l'extérieur du véhicule. Cet élément est une marque de fabrique des constructeurs modernes comme RMC et Intamin, conçu pour offrir un mélange de forces G latérales et négatives (airtime).",
    relatedTermIds: ['airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['Outerbanked Turns', "Virage incliné vers l'extérieur"],
  },
  {
    id: 'camelback',
    name: 'Camelback',
    shortDefinition: "Une série de bosses ou de collines conçues pour fournir de l'airtime.",
    definition:
      'Un camelback (ou bosse de chameau) est un élément classique de montagnes russes consistant en une grande coline en forme de bosse. Lorsque le train franchit le sommet de la coline, les passagers ressentent un airtime "floater", la sensation de se soulever de leur siège. Les camelbacks sont fondamentaux pour les hypercoasters et sont souvent utilisés en séquence pour offrir plusieurs moments d\'impesanteur.',
    relatedTermIds: ['airtime', 'airtime-hill', 'hyper-coaster'],
    aliases: ['Camelbacks', 'Dos de chameau', 'Bosse à airtime'],
  },
  {
    id: 'zero-g-stall',
    name: 'Zero-G Stall',
    shortDefinition:
      "Une inversion où le train reste à l'envers pendant qu'il parcourt une section droite de la voie.",
    definition:
      "Un zero-g stall est un élément où la voie pivote de 180 degrés vers une position inversée, reste à l'envers pendant une section droite ou légèrement courbe prolongée, puis pivote en arrière. Contrairement à un zero-g roll, qui est une rotation continue, le stall met l'inversion en pause, donnant aux passagers une sensation soutenue d'impesanteur tout en étant suspendus dans leurs harnais. Il a été popularisé par RMC sur ses montagnes russes hybrides et I-Box.",
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'stall', 'zero-g-roll'],
    aliases: ['Zero-G Stalls'],
  },
  {
    id: 'gp',
    name: 'GP (General Public)',
    shortDefinition:
      'Un terme utilisé par les passionnés pour désigner les visiteurs non passionnés des parcs.',
    definition:
      "GP, ou \"General Public\", est un terme d'argot utilisé au sein de la communauté des passionnés de parcs d'attractions et de montagnes russes pour décrire les visiteurs moyens qui ne partagent pas le même niveau de connaissances techniques ou de passion pour les manèges. Le terme est souvent utilisé lors de discussions sur la manière dont les parcs commercialisent leurs attractions ou sur la réaction des visiteurs aux opérations et aux fermetures. Il n'est généralement pas utilisé par les parcs eux-mêmes.",
    relatedTermIds: ['credit', 'ert', 'touring-plan'],
    aliases: ['General Public', 'Grand public'],
  },
  {
    id: 'strata-coaster',
    name: 'Strata Coaster',
    shortDefinition:
      'Une montagne russe avec une hauteur ou une descente dépassant les 400 pieds (122 mètres).',
    definition:
      "Un strata coaster est une montagne russe qui atteint une hauteur de 400 pieds (122 mètres) ou plus. Cette classification a été initialement inventée par Cedar Point pour l'ouverture de Top Thrill Dragster. Les strata coasters sont extrêmement rares en raison de leur coût immense et de leur complexité technique. À ce jour, seule une poignée d'entre eux a été construite, dont Kingda Ka à Six Flags Great Adventure.",
    relatedTermIds: ['giga-coaster', 'hyper-coaster', 'launch-coaster'],
    aliases: ['Strata Coasters'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    shortDefinition: "L'acte d'envoyer un véhicule ou un train depuis la gare.",
    definition:
      'Un dispatch (envoi ou départ) se produit lorsque les opérateurs de l\'attraction autorisent le départ d\'un véhicule et lancent son cycle. Des départs efficaces sont essentiels pour maintenir une capacité élevée ("visiteurs par heure"). Si les départs sont trop lents, cela peut entraîner un "stacking" (empilement), où les trains suivants doivent attendre à l\'extérieur de la gare que le précédent se libère. Les passionnés suivent souvent les "temps de départ" comme mesure de l\'efficacité opérationnelle d\'un parc.',
    relatedTermIds: ['queue-line', 'ride-capacity', 'stacking'],
    aliases: ['Dispatches', 'Départ', 'Envoi'],
  },
  {
    id: 'near-miss',
    name: 'Near-Miss',
    shortDefinition:
      "Un élément de conception qui crée l'illusion qu'un passager va entrer en collision avec une structure.",
    definition:
      "Un near-miss (ou effet de collision proche) est un élément thématique ou structurel placé très près du parcours de l'attraction pour créer des sensations. Bien que les passagers soient toujours en sécurité à l'intérieur de l'enveloppe de sécurité (clearance envelope), la vitesse et la perspective du manège donnent l'impression qu'ils pourraient heurter une poutre, un mur de tunnel ou une autre partie de la voie. Ces effets sont soigneusement conçus pour renforcer la sensation de vitesse et de danger.",
    relatedTermIds: ['clearance-envelope', 'foot-chopper', 'head-choppers'],
    aliases: ['Near-Misses', 'Collision proche'],
  },
  {
    id: 'clearance-envelope',
    name: 'Clearance Envelope',
    shortDefinition:
      "L'espace de sécurité autour d'un véhicule de manège qui doit rester libre de toute obstruction.",
    definition:
      "La clearance envelope (enveloppe de sécurité ou de dégagement) est l'espace tridimensionnel calculé autour d'un véhicule de manège qui doit être maintenu entièrement libre de toute structure, support ou végétation. Cela garantit que même les passagers les plus grands avec les bras ou les jambes tendus ne peuvent pas entrer en contact avec quoi que ce soit à l'extérieur du véhicule. Pendant les tests, les parcs utilisent souvent des \"reach envelopes\" (cadres physiques attachés au train) pour vérifier qu'aucune partie de l'environnement n'empiète sur cette zone de sécurité.",
    relatedTermIds: ['foot-chopper', 'head-choppers', 'near-miss', 'testing'],
    aliases: ['Clearance Envelopes', 'Enveloppe de sécurité'],
  },
  {
    id: 'foot-chopper',
    name: 'Foot-Chopper',
    shortDefinition:
      'Un effet de near-miss spécialement conçu pour les montagnes russes où les jambes des passagers sont exposées.',
    definition:
      "Un foot-chopper est un type spécifique d'effet near-miss que l'on trouve sur les montagnes russes inversées, suspendues ou sans sol (floorless). Il consiste à placer des supports de voie, de l'eau ou des éléments de thématisation près de l'endroit où passent les pieds des passagers. L'illusion crée une peur momentanée que les pieds du passager frappent l'objet, renforçant considérablement le frisson de la manœuvre.",
    relatedTermIds: [
      'clearance-envelope',
      'head-choppers',
      'inverted-coaster',
      'near-miss',
      'wing-coaster',
    ],
    aliases: ['Foot-Choppers'],
  },
  {
    id: 'projection-mapping',
    name: 'Projection Mapping',
    shortDefinition:
      'Une technologie utilisée pour projeter des vidéos sur des surfaces non plates comme des bâtiments ou des décors de manèges.',
    definition:
      "Le projection mapping (ou vidéomapping) est une technique d'affichage de haute technologie qui transforme des objets — souvent de forme irrégulière comme des murs de château ou des décors de dark ride — en une surface pour la projection vidéo. En utilisant un logiciel spécialisé pour \"cartographier\" la géométrie 3D de l'objet, les projecteurs peuvent créer d'étonnantes illusions de mouvement, de transformation et de profondeur. Il est largement utilisé dans les spectacles nocturnes et les dark rides modernes pour créer des environnements dynamiques sans décors physiques.",
    relatedTermIds: ['animatronics', 'dark-ride', 'interactivity', 'pre-show'],
    aliases: ['Video mapping', 'Vidéomapping', 'Cartographie numérique'],
  },
  {
    id: 'omnimover',
    name: 'Omnimover',
    shortDefinition:
      'Un système de transport avec une chaîne continue de véhicules qui se déplacent à une vitesse constante.',
    definition:
      "L'Omnimover est un système de transport développé par Disney qui présente une boucle continue de véhicules. Comme les véhicules ne s'arrêtent jamais, le système a une capacité très élevée. Une caractéristique clé est la capacité des véhicules à pivoter, orientant les visiteurs exactement vers la scène que les concepteurs veulent qu'ils voient. Des exemples célèbres incluent The Haunted Mansion et Spaceship Earth. D'autres constructeurs ont depuis développé des systèmes de chaîne continue similaires.",
    relatedTermIds: ['dark-ride', 'ride-capacity', 'trackless-ride'],
    aliases: ['Omnimovers'],
  },
  {
    id: 'pepper-ghost',
    name: "Pepper's Ghost",
    shortDefinition:
      'Une illusion classique utilisant du verre et de la lumière pour créer des fantômes "transparents".',
    definition:
      "Pepper's Ghost est une technique d'illusion théâtrale utilisée pour créer des fantômes transparents. Elle fonctionne en plaçant une grande feuille de verre à un angle entre le public et une scène ; en éclairant un objet dans une pièce cachée pour que son reflet apparaisse dans le verre, on a l'impression qu'une figure translucide se tient dans la scène principale. Cette technique du XIXe siècle est très célèbre pour son utilisation à grande échelle dans la scène de la salle de bal du Haunted Mansion de Disney.",
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'projection-mapping'],
    aliases: ["Pepper's Ghost", 'Fantôme de Pepper'],
  },
  {
    id: 'dynamic-attractions',
    name: 'Dynamic Attractions',
    shortDefinition:
      'Fabricant canadien de systèmes de transport complexes, connu pour le "Robocoaster".',
    definition:
      'Dynamic Attractions est un constructeur d\'attractions de premier plan, célèbre pour ses systèmes de transport innovants et techniquement complexes. Leur technologie la plus emblématique est le système de bras robotisé "Robocoaster" utilisé dans des attractions comme Harry Potter and the Forbidden Journey. Ils développent également des systèmes de rails de haute technologie, des théâtres de mouvement et des composants structurels pour les grands parcs à thème du monde entier.',
    relatedTermIds: ['dark-ride', 'flying-theater', 'kuka', 'motion-simulator'],
  },
  {
    id: 'flying-theater',
    name: 'Théâtre volant',
    shortDefinition:
      'Un simulateur où les sièges sont pivotés devant un écran incurvé géant pour créer une sensation de vol.',
    definition:
      "Un théâtre volant est un type d'attraction de simulation où les visiteurs sont assis dans des sièges suspendus qui se déplacent en synchronisation avec un film projeté sur un écran sphérique massif. Les sièges \"volent\" souvent vers l'avant dans la zone de l'écran, offrant une expérience immersive de vol. Des exemples notables incluent Soarin' de Disney et le Voletarium d'Europa-Park.",
    relatedTermIds: ['dark-ride', 'dynamic-attractions', 'motion-simulator', 'pre-show'],
  },
  {
    id: 'shuttle-coaster',
    name: 'Shuttle coaster',
    shortDefinition:
      'Une montagne russe qui ne forme pas un circuit complet et voyage à la fois en marche avant et en marche arrière.',
    definition:
      'Un shuttle coaster est un type de montagne russe qui voyage d\'une gare à un point final (souvent une flèche verticale ou "spike"), puis inverse sa direction et revient à la gare. Comme la voie ne forme pas une boucle fermée, les passagers parcourent l\'ensemble du trajet en marche avant et en marche arrière.',
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
  },
  {
    id: 'carousel',
    name: 'Carrousel',
    shortDefinition:
      'Une attraction rotative classique avec des sièges, souvent sous forme de chevaux.',
    definition:
      "Un carrousel (ou manège de chevaux de bois) est une attraction rotative traditionnelle comprenant une plate-forme circulaire avec des sièges décorés. Ces sièges ont généralement la forme de chevaux ou d'autres animaux et montent et descendent souvent pour simuler le galop. Les carrousels sont des éléments emblématiques et familiaux de presque tous les parcs d'attractions.",
    relatedTermIds: ['flat-ride', 'themed-land'],
  },
  {
    id: 'walkthrough',
    name: 'Walkthrough',
    shortDefinition: 'Une attraction à explorer à pied à travers des environnements thématiques.',
    definition:
      'Un walkthrough est une attraction conçue pour être vécue à pied plutôt que dans un véhicule. Les visiteurs se déplacent dans des environnements thématiques qui peuvent inclure des éléments interactifs, des acteurs en direct ou des effets spéciaux. Ils vont de simples sentiers thématiques à des maisons hantées élaborées ou des palais du rire.',
    relatedTermIds: ['dark-ride', 'funhouse', 'themed-land'],
  },
  {
    id: 'funhouse',
    name: 'Funhouse',
    shortDefinition:
      "Une attraction de type walkthrough classique remplie d'obstacles physiques et d'illusions d'optique.",
    definition:
      "Un funhouse (ou palais du rire) est une attraction classique à parcourir à pied qui met les visiteurs au défi avec des obstacles physiques tels que des planchers mobiles, des tonneaux rotatifs, des miroirs déformants et des toboggans. Bien qu'ils soient courants dans les fêtes foraines, de nombreux parcs permanents proposent des palais du rire sophistiqués comme expériences interactives.",
    relatedTermIds: ['flat-ride', 'walkthrough'],
  },
  {
    id: 'ferris-wheel',
    name: 'Grande roue',
    shortDefinition:
      'Une grande roue rotative verticale avec des nacelles pour passagers offrant des vues panoramiques.',
    definition:
      "Une grande roue est une structure rotative verticale massive avec des nacelles ou des cabines fixées sur la jante. Elle est conçue pour offrir aux visiteurs une vue panoramique sur le parc et le paysage environnant, ce qui en fait l'une des icônes plus reconnaissables de l'industrie.",
    relatedTermIds: ['flat-ride', 'opening-hours'],
  },
  {
    id: 'spike',
    name: 'Spike',
    shortDefinition:
      'Une section de voie en cul-de-sac verticale ou fortement inclinée sur un shuttle coaster.',
    definition:
      "Un spike est un terme désignant une section de voie verticale ou fortement inclinée à l'extrémité d'un shuttle coaster qui se termine brusquement. Le train monte le spike jusqu'à ce qu'il perde son élan, puis redescend dans la direction opposée. Les spikes sont des caractéristiques courantes sur les shuttle coasters lancés.",
    relatedTermIds: ['rollback', 'shuttle-coaster', 'steel-coaster'],
  },
  {
    id: 'forced-perspective',
    name: 'Perspective forcée',
    shortDefinition:
      "Une technique de conception utilisée pour faire paraître les structures plus grandes ou plus petites qu'elles ne le sont réellement.",
    definition:
      "La perspective forcée est une illusion d'optique utilisée par les concepteurs pour manipuler l'échelle et la distance perçues des objets. En réduisant l'échelle des bâtiments à mesure qu'ils s'élèvent, les concepteurs peuvent les faire paraître beaucoup plus hauts. Cette technique est célèbrement utilisée sur le Château de la Belle au Bois Dormant à Disneyland pour renforcer son aspect grandiose.",
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'show-building',
    name: "Bâtiment d'attraction",
    shortDefinition:
      "La grande structure utilitaire qui abrite la voie et les décors d'une attraction intérieure.",
    definition:
      "Un bâtiment d'attraction (ou show building) est l'enveloppe structurelle ou le hangar qui contient la voie, les décors et les effets spéciaux d'une attraction intérieure ou d'un dark ride. Alors que l'intérieur est hautement immersif, l'extérieur est souvent un simple bâtiment fonctionnel caché de la vue des visiteurs par de la végétation ou des façades thématiques.",
    relatedTermIds: ['dark-ride', 'forced-perspective', 'themed-land'],
  },
  {
    id: 'practical-effects',
    name: 'Effets pratiques',
    shortDefinition:
      'Effets spéciaux physiques produits en direct dans une attraction plutôt que numériquement.',
    definition:
      "Les effets pratiques sont des effets spéciaux physiques créés en direct sur place, tels que les animatroniques, l'eau, le vrai feu, le brouillard et les accessoires physiques. Ils diffèrent des effets numériques ou basés sur un écran et sont souvent loués pour leur impact tangible et réaliste sur l'expérience du visiteur.",
    relatedTermIds: ['animatronics', 'dark-ride', 'projection-mapping'],
  },
  {
    id: 'chicken-exit',
    name: 'Chicken exit',
    shortDefinition:
      "Un chemin de sortie dédié pour les visiteurs qui décident de ne pas faire l'attraction juste avant l'embarquement.",
    definition:
      "Un chicken exit (littéralement \"sortie de poule\") est un passage désigné qui permet aux visiteurs de quitter la file d'attente et de sortir de l'attraction juste avant de monter dans le véhicule. Il est utilisé par les visiteurs qui changent d'avis sur une attraction à sensations ou par ceux qui ne faisaient qu'accompagner d'autres personnes dans la file.",
    relatedTermIds: ['queue-line', 'rider-switch', 'single-rider', 'wait-time'],
  },
  {
    id: 'in-show-exit',
    name: 'Sortie en scène',
    shortDefinition:
      "Une sortie ou une évacuation d'un véhicule d'attraction à l'intérieur de la zone thématique.",
    definition:
      "Une sortie en scène (ou in-show exit) se produit lorsque les visiteurs quittent un véhicule d'attraction alors qu'il se trouve encore dans l'environnement thématique de l'attraction, généralement lors d'une panne technique ou d'une évacuation. Ce processus implique que le personnel guide en toute sécurité les visiteurs le long de passerelles à travers les zones \"coulisses\" de l'attraction.",
    relatedTermIds: ['dark-ride', 'downtime', 'e-stop'],
  },
  {
    id: 'e-stop',
    name: "Arrêt d'urgence",
    shortDefinition:
      "Un arrêt d'urgence qui stoppe immédiatement tout mouvement de l'attraction pour des raisons de sécurité.",
    definition:
      "Un E-Stop (arrêt d'urgence) est un mécanisme ou une procédure de sécurité qui coupe immédiatement l'alimentation ou applique les freins pour arrêter tout mouvement de l'attraction. Il peut être déclenché automatiquement par des capteurs ou manuellement par les opérateurs. Après un E-Stop, l'attraction doit généralement être inspectée et réinitialisée avant de reprendre le service.",
    relatedTermIds: ['block-brake', 'downtime', 'in-show-exit'],
  },
];

export default translations;
