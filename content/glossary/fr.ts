import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Temps d’attente',
    shortDefinition:
      'Le temps estimé qu’un visiteur passe dans la file avant de monter dans une attraction.',
    definition:
      'Le temps d’attente est la durée qu’un visiteur passe dans la file d’une attraction, entre son entrée dans la file standard et le moment où il embarque. Le chiffre affiché à l’entrée de l’attraction et dans l’application du parc est une estimation que le parc fixe lui-même, d’après la longueur de la file et la cadence à laquelle les véhicules se remplissent. Certains parcs le vérifient en remettant une carte horodatée à un visiteur en bout de file, puis en la relisant au quai d’embarquement.\n\npark.fan relève le temps d’attente affiché de chaque attraction toutes les cinq minutes auprès de trois sources publiques : ThemeParks.wiki, Wartezeiten.app et Queue-Times.com. Quand elles ne concordent pas, la majorité l’emporte, puis la médiane, puis la moyenne, et le résultat est arrondi à cinq minutes près, comme les parcs les affichent. Chaque relevé est enregistré, et c’est de ces relevés que viennent les attentes habituelles des pages d’attractions, le niveau d’affluence et les prévisions.\n\nUn parc qui ne publie pas de temps d’attente n’en a pas non plus sur park.fan.',
    alternateNames: ['File d’attente', 'Queue time'],

    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Une file séparée pour les visiteurs prêts à monter seuls dans les places restées vides.',
    definition:
      'La file Single Rider est faite pour celles et ceux qui acceptent de monter séparément de leur groupe : elle comble les places restées libres dans les trains. Comme ces passagers sont glissés dans les trous, la file avance nettement plus vite que la file standard, souvent 50 à 70 % de temps d’attente en moins. Toutes les attractions ne proposent pas de file Single Rider.',
    alternateNames: ['Single Rider Lane', 'File individuelle'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Single Riders'],
  },
  {
    id: 'virtual-queue',
    name: 'File d’attente virtuelle',
    shortDefinition:
      'Un système de file numérique où les visiteurs réservent un horaire plutôt que d’attendre physiquement.',
    definition:
      'Une file d’attente virtuelle (on parle aussi de boarding group ou d’heure de retour) permet de s’inscrire pour une attraction depuis l’application du parc ou une borne, puis de recevoir une notification quand son tour approche. Au lieu de patienter dans une file, on passe ce temps ailleurs dans le parc jusqu’à l’appel de son groupe. Les parcs y recourent pour leurs nouveautés les plus demandées, là où une file physique rassemblerait au même endroit plus de monde que les allées ne peuvent en contenir. Une file virtuelle ouvre en général à heure fixe, souvent au moment où les portes s’ouvrent, et peut être complète en quelques minutes.',
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ['Files d’attente virtuelles', 'File Virtuelle', 'File virtuelle'],
  },
  {
    id: 'express-pass',
    name: 'Pass Express',
    shortDefinition:
      'Une option de billet, payante ou incluse, qui donne accès à une file prioritaire plus courte.',
    definition:
      'Un Pass Express est une option de billet qui donne accès à une entrée prioritaire, où l’attente est nettement plus courte. Le nom change d’un parc à l’autre : Universal Express chez Universal, Lightning Lane chez Disney. Certains parcs l’incluent dans leurs forfaits hôteliers, d’autres le vendent séparément.',
    alternateNames: ['Flash Pass', 'Express Pass', 'Lightning Lane'],

    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['Pass Express', 'Universal Express', 'Flash Pass'],
  },
  {
    id: 'posted-wait-time',
    name: 'Temps d’attente affiché',
    shortDefinition: 'Le temps d’attente officiel affiché par le parc à l’entrée d’une attraction.',
    definition:
      'Le temps d’attente affiché est l’estimation officielle, celle qui est écrite à l’entrée d’une attraction et dans l’application du parc. Les parcs la calculent à partir de la longueur mesurée de la file, du débit passé de l’attraction et du rythme auquel on embarque à cet instant. park.fan réunit les temps d’attente affichés de plusieurs sources publiques toutes les cinq minutes.',
    relatedTermIds: ['crowd-level', 'wait-time'],
  },
  {
    id: 'crowd-level',
    name: 'Niveau d’affluence',
    shortDefinition:
      'Une échelle de l’affluence d’un parc à thème un jour donné, de « Très faible » à « Extrême ».',
    definition:
      'Le niveau d’affluence dit à quel point un parc est chargé un jour donné ou à une heure donnée. park.fan mesure chaque parc par rapport à lui-même : 100 % correspond à l’attente des grandes attractions un jour typique dans ce parc, et les attentes du moment sont exprimées en pourcentage de cette valeur. Jusqu’à 60 %, l’affluence est « Très faible », de 61 à 89 % « Faible », de 90 à 110 % « Normale », de 111 à 150 % « Élevée », de 151 à 200 % « Très élevée », et au-delà « Extrême ». Les jours de prévision du calendrier d’affluence suivent la même échelle.\n\nComme chaque parc sert de référence à lui-même, « Extrême » dans un petit parc familial et « Extrême » à Disneyland Paris ne représentent pas le même nombre de minutes, mais la même situation : des files au moins deux fois plus longues que d’habitude. Le niveau bouge avec les vacances scolaires, les jours fériés, les événements spéciaux comme les soirées d’Halloween ou les feux d’artifice, et la météo.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Niveaux d’affluence'],
  },
  {
    id: 'crowd-calendar',
    name: 'Calendrier d’affluence',
    shortDefinition:
      'La prévision, jour par jour, du niveau d’affluence d’un parc, pour repérer les jours les plus calmes.',
    definition:
      'Un calendrier d’affluence présente les mois à venir d’un parc sous forme de grille de jours, chacun coloré selon le niveau d’affluence prévu. Sur park.fan, la couleur vient de Fancast, le modèle de prévision que park.fan entraîne lui-même : il calcule une attente prévue pour chaque attraction et chaque heure de la journée, puis les condense en un niveau d’affluence pour le jour, sur la même échelle de « Très faible » à « Extrême » que le chiffre en direct.\n\nLe modèle apprend des temps d’attente que park.fan a mesurés dans le parc. Il tient compte aussi des prévisions météo, des vacances scolaires, des jours fériés et des ponts dans les pays où se trouvent les parcs, et de ce qui se passe dans le parc, comme une saison d’Halloween ou les premiers jours de l’année. Il est réentraîné chaque matin à 6 h UTC avec les attentes de la veille, si bien que la couleur d’une date peut changer à mesure qu’elle approche.\n\nLe calendrier va aussi loin que le planning du parc. Un parc ouvert toute l’année a un niveau pour des jours jusqu’à près d’un an à l’avance ; un parc saisonnier affiche « Fermé » après le dernier jour qu’il a publié.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
  },
  {
    id: 'peak-day',
    name: 'Jour de pointe',
    shortDefinition: 'Un jour où la fréquentation atteint ou frôle la capacité maximale d’un parc.',
    definition:
      'Un jour de pointe est un jour où la fréquentation atteint ou frôle la capacité maximale d’un parc. Les candidats habituels sont les grands jours fériés (Noël, Pâques), les journées d’événements comme les soirées d’Halloween ou le feu d’artifice du Nouvel An, et les semaines de vacances scolaires. Un jour de pointe à Disneyland Paris ou à Europa-Park, les attractions phares dépassent régulièrement 90 à 120 minutes, et les files se forment devant les restaurants bien avant midi. Dans le calendrier d’affluence de park.fan, ces jours apparaissent en « Très élevée » ou « Extrême ».',
    aliases: ['Jours de pointe'],
    alternateNames: ['Journée Chargée', 'Pic de fréquentation'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Rénovation',
    shortDefinition:
      'Une période de fermeture planifiée pendant laquelle une attraction subit une maintenance ou des améliorations.',
    definition:
      'Une rénovation (les fans parlent souvent de « réhab ») est une période de maintenance ou de travaux programmée pendant laquelle une attraction, un spectacle ou une zone du parc reste fermé. Elle peut durer de quelques jours à plusieurs mois et tombe en principe en période creuse. Les parcs publient leur calendrier de rénovations à l’avance, mais les dates bougent. Disney et Universal font tourner les fermetures, si bien que ce ne sont pas les mêmes attractions qui s’arrêtent chaque année. park.fan signale les attractions en cours de rénovation.',
    aliases: ['Rénovations'],
    alternateNames: ['Réhabilitation', 'Refurb', 'Fermeture technique'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Temps d’arrêt',
    shortDefinition:
      'Une fermeture temporaire non planifiée d’une attraction, souvent due à une panne technique.',
    definition:
      'Le temps d’arrêt désigne une fermeture temporaire et imprévue d’une attraction, à la différence d’une rénovation, qui est planifiée. Les causes sont des pannes mécaniques, des erreurs de capteurs, des contrôles de sécurité après un incident avec un visiteur, la météo (les orages avant tout) ou un animal dans la zone de l’attraction. La plupart des arrêts se règlent entre quelques minutes et deux heures, mais une panne mécanique complexe peut garder l’attraction fermée jusqu’au soir. park.fan affiche l’état actuel de chaque attraction suivie et distingue « Ouvert », « Panne », « Fermé » et « Rénovation ».',
    aliases: ['Pannes', 'Arrêts'],
    alternateNames: ['Incident Technique', 'Hors Service', 'Fermeture imprévue'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: 'Capacité d’attraction',
    shortDefinition: 'Le nombre de visiteurs qu’une attraction peut accueillir par heure.',
    definition:
      'La capacité d’une attraction, ou débit, est le nombre de visiteurs qu’elle peut transporter par heure quand l’exploitation se passe bien. Elle dépend de la taille des véhicules, du nombre de véhicules en service, de la vitesse d’embarquement et de débarquement en station et de la durée du cycle. Un carrousel, une rivière à bûches ou un grand dark ride font passer 1 500 à 2 000 visiteurs par heure ; un dark ride qui ne fait circuler qu’un véhicule à la fois ou des montagnes russes exploitées avec un seul train plafonnent entre 500 et 800. C’est la capacité qui fixe la vitesse d’avancement de la file : 30 minutes d’attente à 1 800 personnes par heure, c’est une file qui se vide trois fois plus vite que les mêmes 30 minutes à 600. C’est précisément pour cela que les parcs ajoutent des trains ou des véhicules les jours d’affluence.',
    relatedTermIds: ['downtime', 'refurbishment', 'wait-time'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Le moment où un parc ouvre ses portes, quand les files des attractions les plus demandées sont au plus court.',
    definition:
      'Le Rope Drop est le moment où un parc à thème ouvre pour la journée. Le nom vient de la corde (ou de la barrière) que le personnel abaisse pour laisser entrer les premiers visiteurs. Tôt le matin, avant l’arrivée de la foule, les files des attractions les plus demandées sont au plus court : arriver au Rope Drop permet d’en faire plusieurs avant qu’elles ne s’allongent. Les heures d’ouverture exactes figurent dans le planning de park.fan.',

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'early-entry', 're-ride', 'wait-time'],
  },
  {
    id: 'early-entry',
    name: 'Entrée anticipée',
    shortDefinition:
      'Un avantage réservé aux clients des hôtels du resort, qui entrent dans le parc avant l’ouverture générale.',
    definition:
      'L’entrée anticipée (Early Park Entry, Extra Magic Hours ou Magic Morning selon le resort) permet aux clients des hôtels du parc d’entrer avant le grand public. Le créneau dure en général 30 à 60 minutes, et seuls les clients des hôtels sont à l’intérieur. Tant que la foule de la journée attend encore devant les portes, les files des attractions concernées ne font qu’une fraction de ce qu’elles seront une heure plus tard : un jour de pointe, trois ou quatre attractions phares à moins de 20 minutes chacune, contre 60 à 90 minutes en milieu de matinée. Toutes les attractions ne participent pas, et le parc en publie la liste.',
    alternateNames: ['Extra Magic Hours', 'Magic Morning', 'Early Park Entry'],

    relatedTermIds: ['express-pass', 'peak-day', 'rope-drop'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Une option de billet qui permet de visiter plusieurs parcs d’un même resort dans la même journée.',
    definition:
      'Un billet Park Hopper donne accès le même jour à deux parcs ou plus d’un même resort. Chez Disney, il permet de passer de Magic Kingdom à EPCOT, Hollywood Studios ou Animal Kingdom à toute heure ; la règle qui bloquait le changement de parc jusqu’à 14 h a disparu en janvier 2024. Le billet park-to-park d’Universal Orlando donne accès à Universal Studios Florida et à Islands of Adventure, que relie aussi le Hogwarts Express, un train que seuls les détenteurs de ce billet peuvent prendre. PortAventura World propose un billet combiné PortAventura Park et Ferrari Land. Changer de parc vaut la peine quand l’attraction pour laquelle on est venu se trouve dans le second parc, quand une matinée dans un parc doit être suivie d’un spectacle du soir dans l’autre, ou pour un séjour court. Le supplément par rapport à un billet pour un seul parc varie selon le resort et grimpe les jours de pointe.',
    aliases: ['Park-Hopper', 'Park Hoppers'],
    alternateNames: ['Park Hopping', 'Billet multi-parcs'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'season-pass'],
  },
  {
    id: 'season-pass',
    name: 'Abonnement annuel',
    shortDefinition:
      'Un billet annuel qui donne droit à un nombre illimité de visites pendant 12 mois.',
    definition:
      'Un abonnement annuel (Annual Pass) donne un accès illimité à un ou plusieurs parcs pendant 12 mois. Les formules supérieures ajoutent souvent des réductions sur la restauration et les produits dérivés ou le parking gratuit. Certains abonnements ne sont pas valables les jours de forte affluence (les blockout dates). À partir de trois visites par an environ, l’abonnement revient presque toujours moins cher que des billets à l’unité.',
    aliases: ['Pass annuel', 'pass annuels'],
    alternateNames: ['Annual Pass', 'Season Pass', 'Carte Annuelle', 'Carte de saison'],

    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
  },
  {
    id: 'height-requirement',
    name: 'Taille minimale',
    shortDefinition: 'La taille qu’un visiteur doit atteindre pour monter dans une attraction.',
    definition:
      'La taille minimale est une règle de sécurité fixée par le parc pour que les systèmes de retenue (barres de maintien, harnais d’épaules, ceintures) tiennent correctement chaque passager. Elle va d’environ 90 cm sur les montagnes russes familiales les plus douces à 140 cm sur les attractions les plus intenses. Quelques attractions fixent aussi une taille ou un poids maximal, mais c’est plus rare. Les sites et les applications des parcs publient la taille requise pour chaque attraction : on peut donc la vérifier avant la journée en famille plutôt qu’à l’entrée de l’attraction. Quand un enfant est trop petit, la plupart des parcs proposent un Rider Switch : les adultes montent à tour de rôle sans refaire la file.',
    aliases: ['tailles minimales'],
    alternateNames: ['Restriction de Taille', 'Hauteur requise', 'Condition de taille'],

    relatedTermIds: ['refurbishment', 'ride-capacity'],
  },
  {
    id: 'themed-land',
    name: 'Univers thématique',
    shortDefinition: 'Une zone d’un parc à thème construite autour d’un seul thème.',
    definition:
      'Un univers thématique est une zone délimitée d’un parc avec un seul style visuel, une seule histoire de fond et des attractions, restaurants et boutiques assortis. Franchir son entrée doit donner l’impression d’arriver ailleurs. Le monde sorcier de Harry Potter chez Universal, Star Wars : Galaxy’s Edge chez Disney, Klugheim à Phantasialand et le quartier Scandinavie d’Europa-Park en sont quatre exemples. L’ouverture d’un nouvel univers est aussi un événement d’affluence à part entière : la première saison attire la presse et fait nettement monter la fréquentation. Et comme un univers associe souvent une attraction phare à faible capacité à plusieurs attractions à grand débit, les temps d’attente peuvent y varier d’une heure d’une attraction à l’autre.',
    aliases: ['Univers thématiques', 'zone thématique', 'zones thématiques'],
    alternateNames: ['Zone Thématique', 'Land', 'Monde thématique'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'L’ouverture non officielle d’une attraction avant sa date de lancement annoncée.',
    definition:
      'On parle de Soft Opening quand un parc ouvre une nouvelle attraction ou une nouvelle zone avant la date officielle, souvent sans l’annoncer. Le parc teste ainsi ses systèmes en conditions réelles, repère les problèmes d’exploitation et règle les procédures d’embarquement. Un Soft Opening peut commencer et s’arrêter sans préavis, et on ne peut donc pas prévoir une visite en comptant dessus. Ce sont en général les forums et les réseaux sociaux qui les signalent en premier.',
    alternateNames: ['Soft Launch', 'Ouverture anticipée'],

    relatedTermIds: ['downtime', 'refurbishment', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      'La file d’attente classique d’une attraction, sans réservation ni pass spécial.',
    definition:
      'La file Standby est la file d’attente physique ordinaire, ouverte à tous les visiteurs sans billet supplémentaire ni option. On y passe dans l’ordre d’arrivée, et le temps affiché dépend directement du nombre de personnes présentes à l’attraction à ce moment. Les jours chargés, l’attente en Standby peut dépasser 90 minutes sur les attractions phares. park.fan affiche le temps d’attente Standby de chaque attraction, à côté des autres types de file.',
    aliases: ['File standby'],
    alternateNames: ['File Standard', 'File Normale', 'File classique'],

    relatedTermIds: ['express-pass', 'single-rider', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'Le système d’accès prioritaire payant de Disney, successeur du programme FastPass+.',
    definition:
      'Lightning Lane est le nom du système de file prioritaire que Disney a lancé fin 2021 pour remplacer FastPass+. Depuis juillet 2024, Walt Disney World le vend sous deux formes : Lightning Lane Single Pass (appelé jusque-là Individual Lightning Lane, ou ILL), vendu par personne et par attraction pour les plus demandées, et Lightning Lane Multi Pass (LLMP), un achat à la journée qui réserve des créneaux de retour sur une sélection d’attractions. Les deux se réservent plusieurs jours avant la visite, à des prix dynamiques qui montent les jours chargés. Une troisième formule, plus chère, le Lightning Lane Premier Pass, donne un passage sur chaque attraction concernée. Comme il a remplacé un service gratuit, le système fait toujours débat. Ce qu’il apporte dépend du jour : quand le parc est calme, la file standard avance assez vite pour qu’il change peu de chose, alors qu’un jour de pointe, un Single Pass pour Tron ou Radiator Springs Racers peut décider si l’on fait l’attraction ou non. Le calendrier d’affluence de park.fan signale les jours où de longues files standard sont attendues.',
    alternateNames: [
      'Lightning Lane Multi Pass',
      'Lightning Lane Single Pass',
      'Lightning Lane Premier Pass',
      'LLMP',
    ],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: [
      'Lightning Lanes',
      'Lightning Lane Multi Pass',
      'Lightning Lane Single Pass',
      'Lightning Lane Premier Pass',
    ],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'L’ancien abonnement journalier de Disney donnant accès à la Lightning Lane Multi Pass sur la plupart des attractions.',
    definition:
      'Genie+ (aujourd’hui rebaptisé Lightning Lane Multi Pass) était l’option journalière payante de Disney qui a remplacé FastPass+. Pour un tarif par personne et par jour, on pouvait réserver un créneau Lightning Lane à la fois sur une large sélection d’attractions. Les attractions phares en étaient exclues et vendues à part en Individual Lightning Lane, devenu Lightning Lane Single Pass en juillet 2024. Le prix de Genie+ variait et montait les jours les plus fréquentés.',
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie', 'Lightning Lane Multi Pass'],

    relatedTermIds: ['express-pass', 'lightning-lane', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'Un numéro attribué dans une file virtuelle : on accède à l’attraction quand ce groupe est appelé.',
    definition:
      'Un Boarding Group est un groupe numéroté dans une file d’attente virtuelle. Il sert surtout pour les attractions les plus demandées, où une file physique serait ingérable. On s’inscrit dans l’application du parc, souvent dès l’ouverture, et on reçoit un numéro de groupe. Quand ce numéro est appelé, on a un temps limité pour se présenter à l’attraction. Les jours très fréquentés, tous les Boarding Groups peuvent partir en quelques minutes. Disney utilise ce système notamment pour Tron Lightcycle Run et Star Wars : Rise of the Resistance.',
    aliases: ['Boarding Groups'],

    relatedTermIds: ['lightning-lane', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'off-peak',
    name: 'Période creuse',
    shortDefinition:
      'Les périodes les moins fréquentées de l’année, avec des files plus courtes et souvent des billets moins chers.',
    definition:
      'Les périodes creuses, ce sont les moments calmes du calendrier, quand les écoles ont cours et qu’aucun grand jour férié ne tombe. En général, cela va de janvier à début février, de mi-septembre à octobre (hors événements d’Halloween) et sur les premières semaines de novembre. L’attente aux attractions les plus demandées peut alors être nettement plus courte, les billets sont souvent au plus bas et les parcs bien moins pleins. Le calendrier d’affluence de park.fan marque les périodes creuses de chaque parc.',
    alternateNames: ['Basse Saison', 'Hors Saison', 'Période Calme'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'offseason',
    name: 'Fermeture saisonnière',
    shortDefinition:
      'La période de fermeture saisonnière où le parc est entièrement fermé au public, pour l’entretien, la rénovation des attractions ou la pause d’hiver.',
    definition:
      'La fermeture saisonnière (OffSeason) est la partie de l’année pendant laquelle un parc est complètement fermé : aucune attraction, aucun restaurant et aucun spectacle ne fonctionne. Elle se distingue de la basse saison, où le parc est ouvert mais calme. Beaucoup de parcs en plein air ferment entre novembre et mars ou avril, certains avec une saison d’hiver ou quelques week-ends de Noël entre-temps ; les parcs des pays chauds ou ceux dont la plupart des attractions sont couvertes n’en ont pas toujours.\n\nLes mois de fermeture servent aux travaux impossibles à faire avec des visiteurs dans le parc : les inspections annuelles, l’entretien des voies et des trains, les grosses rénovations et la construction des nouvelles attractions.\n\nQuand park.fan affiche « Hors saison » pour un parc, il n’y a pas d’horaires d’ouverture pour la période en cours et le prochain jour d’ouverture confirmé est à plusieurs semaines. Le calendrier d’affluence marque les jours de fermeture « Fermé », et la date de réouverture apparaît dès que le parc la publie.',
    alternateNames: ['Off-Season', 'Fermeture Hivernale', 'Pause saisonnière'],

    relatedTermIds: ['crowd-calendar', 'refurbishment', 'soft-opening'],
  },
  {
    id: 'ride-photo',
    name: 'Photo de manège',
    shortDefinition:
      'Une photo ou une vidéo prise automatiquement pendant l’attraction, en vente à la sortie.',
    definition:
      'La photo de manège est prise automatiquement par une caméra fixe à un point précis du parcours, en général pendant la descente d’une attraction aquatique ou au sommet d’un grand huit. À la sortie, on retrouve sa photo sur une borne ou dans l’application du parc et on décide de l’acheter ou non. Beaucoup de parcs vendent des forfaits photo à la journée qui comprennent toutes les photos de manège du resort.',
    aliases: ['Photo On-Ride'],

    relatedTermIds: ['onride-offride', 'themed-land'],
  },
  {
    id: 'queue-line',
    name: 'File d’attente',
    shortDefinition:
      'L’espace d’attente physique qu’on traverse avant de monter dans une attraction, souvent thématisé.',
    definition:
      'La file d’attente est l’espace physique (couloirs, allées en serpentin à l’extérieur, salles intérieures) que les visiteurs parcourent avant d’embarquer. Dans beaucoup de parcs, la file est thématisée comme l’attraction : chez Disney, celle de la Haunted Mansion installe l’ambiance du manoir bien avant l’embarquement dans les Doom Buggies, et chez Universal les files des attractions Harry Potter passent déjà par les décors de la saga.',
    relatedTermIds: ['single-rider', 'standby-queue', 'wait-time'],
    aliases: ['Files d’attente'],
  },
  {
    id: 'opening-day',
    name: 'Jour d’ouverture',
    shortDefinition:
      'La date officielle de lancement d’un nouveau parc, d’un univers thématique ou d’une attraction.',
    definition:
      'Le jour d’ouverture est la date annoncée à laquelle un nouveau parc, une extension ou une attraction ouvre au public pour la première fois. Ce jour-là, il y a en général la presse et de longues files. Les parcs organisent souvent une inauguration avec des spectacles et des apparitions de personnages. Pour faire une nouvelle attraction sans trop attendre, mieux vaut éviter cette date. Des Soft Openings la précèdent parfois.',
    relatedTermIds: ['crowd-level', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'Un système qui permet aux adultes d’un groupe de monter à tour de rôle pendant que l’autre garde un enfant trop petit.',
    definition:
      'Le Rider Switch (ou Child Swap) existe dans la plupart des grands parcs à thème. Il permet à un groupe de se relayer sur une attraction quand l’un de ses membres, en général un jeune enfant qui n’a pas la taille minimale, ne peut pas monter. Un adulte fait l’attraction pendant que l’autre attend à l’entrée avec l’enfant. Quand le premier revient, le second embarque tout de suite, sans refaire la file. Disney l’appelle Rider Switch, Universal Child Swap. Un jour chargé, le second adulte évite ainsi toute l’attente en Standby. Il faut se signaler au personnel à l’entrée de l’attraction.',
    alternateNames: ['Child Swap', 'Rider Switch', 'Échange Parental', 'Baby Switch'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Date',
    shortDefinition:
      'Un jour où certains abonnements annuels ne donnent pas accès au parc, en général parmi les plus fréquentés de l’année.',
    definition:
      'Les Blockout Dates (ou blackout dates) sont des jours précis où certains abonnements annuels ne donnent pas droit à l’entrée. Les parcs limitent ainsi la fréquentation les jours les plus chargés : jours fériés, week-ends de pointe, grands événements. Les abonnements haut de gamme n’ont que peu de dates bloquées, voire aucune. Ceux d’entrée de gamme peuvent être bloqués 30 à 60 jours par an. Avec un abonnement limité, il faut consulter ce calendrier avant de venir.',
    aliases: ['Dates bloquées'],
    alternateNames: ['Blackout', 'Blackout Date', 'Date de restriction'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'season-pass'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Événement à billet séparé',
    shortDefinition:
      'Un événement spécial à billet séparé, le plus souvent en soirée, qui demande sa propre entrée en plus d’un billet de parc normal.',
    definition:
      'Un événement à billet séparé est une soirée organisée dans un parc à thème avec sa propre billetterie : il faut un billet spécifique, en plus ou à la place du billet journée. On y trouve des spectacles, des décors de saison et des parcours à pied que la journée d’exploitation normale n’offre pas. Mickey’s Not-So-Scary Halloween Party et Mickey’s Very Merry Christmas Party à Walt Disney World, Halloween Horror Nights à Universal Studios et Traumatica à Europa-Park, qui a son propre billet du soir, en sont des exemples. Les jours d’événement, les visiteurs venus pour la journée doivent partir en fin d’après-midi ou en début de soirée ; à Magic Kingdom, la soirée d’Halloween commence à 19 h, et les dernières heures avant le début sont particulièrement chargées, parce que tout le monde tente un dernier tour. Les billets sont mis en vente des mois à l’avance, et les soirées d’Halloween les plus demandées sont complètes des semaines avant la date.',
    aliases: ['Événements spéciaux'],
    alternateNames: ['Soirée Spéciale', 'After-Hours', 'Hard Ticket Event'],

    relatedTermIds: ['early-entry', 'peak-day', 'season-pass'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'L’ancien système de file prioritaire gratuit de Disney, remplacé par la Lightning Lane payante en 2021.',
    definition:
      'Le FastPass+ (FastPass à l’origine, lancé en 1999) était le système de file prioritaire gratuit de Disney : on y réservait sans supplément des créneaux de retour sur les attractions. Le FastPass+ n’a existé qu’à Walt Disney World, où l’on pouvait en réserver jusqu’à trois par jour dans l’application My Disney Experience, puis en ajouter d’autres un par un. Le système a été suspendu pendant la fermeture liée au COVID en 2020 et n’est jamais revenu. Fin 2021, la Lightning Lane payante l’a remplacé. Disneyland Paris avait un FastPass papier, remplacé depuis par Premier Access. Les anciens comptes rendus de visite en parlent encore.',
    aliases: ['FastPass+', 'FastPass Plus', 'Fast Pass'],

    relatedTermIds: ['express-pass', 'genie-plus', 'lightning-lane', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Heure de retour',
    shortDefinition:
      'Un créneau réservé pour revenir à une attraction, attribué par la Lightning Lane, une file virtuelle ou un autre système d’accès prioritaire.',
    definition:
      'Une heure de retour (ou fenêtre de retour) est un créneau précis, en général d’une heure, pendant lequel un visiteur qui a réservé un accès prioritaire (Lightning Lane, file virtuelle ou système comparable) peut se présenter à l’entrée dédiée de l’attraction. En attendant, il va où il veut dans le parc au lieu de faire la queue. Qui arrive trop tard, au-delà d’une tolérance de quelques minutes après la fin du créneau, perd en principe sa réservation.',
    relatedTermIds: ['boarding-group', 'fastpass', 'lightning-lane', 'virtual-queue'],
    alternateNames: ['Return Time', 'Créneau de retour'],
    aliases: ['Heure de retour', 'Heures de retour'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time : une session pendant laquelle un groupe (club de passionnés, clients d’hôtel) a une ou plusieurs attractions pour lui seul, sans file publique.',
    definition:
      'L’ERT (Exclusive Ride Time) est une période pendant laquelle un groupe restreint a une ou plusieurs attractions pour lui seul, sans le public. Ce sont en général les membres d’un club de passionnés de montagnes russes, les clients des hôtels du resort ou les détenteurs d’abonnements premium. Pendant un ERT, on remonte à volonté avec très peu d’attente, parfois plusieurs dizaines de fois dans la même session. Les parcs organisent des ERT pour des clubs comme l’European Coaster Club ou l’American Coaster Enthusiasts, dans des forfaits hôteliers premium ou lors d’événements après la fermeture.',
    alternateNames: ['Exclusive Ride Time', 'Temps de trajet exclusif'],

    relatedTermIds: ['credit', 'early-entry', 'hard-ticket-event', 're-ride', 'rope-drop'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Un itinéraire de visite qui ordonne les attractions pour réduire l’attente et faire le plus de manèges possible dans la journée.',
    definition:
      'Un Touring Plan est un ordre de visite établi à l’avance (attractions, repas, déplacements dans le parc) pour réduire le temps d’attente total de la journée. Qui prépare un bon Touring Plan tient compte de la façon dont le parc se remplit (quelles zones d’abord), de la capacité des attractions, de l’évolution des files, des horaires des spectacles et de la météo. Des sites comme TouringPlans.com publient des plans détaillés pour les grands parcs.',
    alternateNames: ['Plan de Visite', 'Itinéraire', 'Plan de visite optimisé'],

    relatedTermIds: ['crowd-calendar', 'early-entry', 'rope-drop', 'wait-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      'Une attraction intérieure où des véhicules guidés traversent dans le noir des décors thématiques, des effets spéciaux et des scènes animées.',
    definition:
      'Un dark ride est une attraction couverte où les visiteurs traversent des décors thématisés à bord de véhicules : voitures sur rail ou sans rail, bateaux dans un canal, nacelles suspendues à un rail aérien. Le nom vient de l’éclairage maîtrisé, qui laisse travailler les projections, les animatroniques et les décors construits. Le genre va des classiques familiaux tout en douceur (it’s a small world, Les Voyages de Pinocchio) aux longues attractions narratives comme Star Wars: Rise of the Resistance. Dans un dark ride sans rail, les véhicules sont guidés depuis le sol, si bien qu’une scène peut être abordée sous plusieurs angles et que deux véhicules ne suivent pas forcément le même trajet ; Symbolica à Efteling et Ratatouille à Disneyland Paris en sont les exemples européens. Un dark ride transporte en général plus de visiteurs par heure que des montagnes russes, et c’est pour cela que les parcs comptent sur eux les jours d’affluence.',
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
      'Bolliger & Mabillard, fabricant suisse de montagnes russes aux parcours fluides et fiables, avec des éléments comme l’Immelmann, le cobra roll et le zero-G roll.',
    definition:
      'B&M (Bolliger & Mabillard) est un fabricant suisse de montagnes russes fondé en 1988 par Walter Bolliger et Claude Mabillard. Ses montagnes russes roulent sans à-coups et tombent rarement en panne. Elles tiennent de longues G-forces positives, enchaînent des inversions comme l’Immelmann, le cobra roll et le zero-G roll, et transportent beaucoup de monde à l’heure. B&M construit surtout des coasters inversés, des sit-down loopers, des hyper coasters (plus de 61 m), des giga coasters (plus de 91 m), des wing coasters et des dive machines. Presque tous les grands parcs européens en ont au moins un : Shambhala et Dragon Khan à PortAventura, Silver Star à Europa-Park, Nemesis à Alton Towers.',
    aliases: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],

    relatedTermIds: [
      'cobra-roll',
      'dive-coaster',
      'hybrid-coaster',
      'immelmann',
      'smoothness',
      'stand-up-coaster',
      'zero-g-roll',
    ],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      'Fabricant suisse de montagnes russes : lancements hydrauliques, mega et giga coasters, et plusieurs records de vitesse et de hauteur.',
    definition:
      'Intamin AG est un fabricant d’attractions suisse fondé en 1967. Pendant des années, son lancement hydraulique a propulsé les coasters les plus rapides et les plus hauts du monde (Kingda Ka, 139 m, et Top Thrill Dragster). Kingda Ka a fermé en 2024 et a été démoli en 2025, Top Thrill Dragster a été reconstruit en 2024 sous le nom de Top Thrill 2. Intamin construit aussi des mega et giga coasters, comme Millennium Force à Cedar Point et Intimidator 305 à Kings Dominion, des coasters à lancements multiples, des attractions aquatiques et des dark rides. En Europe, on lui doit Taron à Phantasialand, Expedition GeForce au Holiday Park et Red Force au Ferrari Land.',
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
    aliases: ['Intamin AG'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Fabricant familial allemand installé à Waldkirch, près d’Europa-Park : attractions aquatiques, dark rides et montagnes russes en acier.',
    definition:
      'Mack Rides est un fabricant d’attractions allemand installé à Waldkirch, dans le Bade-Wurtemberg, à quelques kilomètres d’Europa-Park, qui lui sert de vitrine. Fondé en 1780 par Paul Mack comme fabricant de chariots, Mack produit des attractions aquatiques, des dark rides et de plus en plus de montagnes russes. Blue Fire Megacoaster, ouvert en 2009 à Europa-Park, a un Stengel Dive. Hyperia, ouvert en 2024 à Thorpe Park, est un hyper coaster Mack de 72 m, et The Ride to Happiness à Plopsaland un Xtreme Spinning Coaster à lancement. On trouve beaucoup d’attractions Mack dans les parcs européens, en particulier à Europa-Park, qui appartient à la famille Mack.',
    aliases: ['Mack'],

    relatedTermIds: [
      'b-and-m',
      'bobsled-coaster',
      'intamin',
      'launch-coaster',
      'mackprodukt',
      'powered-coaster',
      'splashdown',
      'stengel-dive',
      'water-coaster',
    ],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Rocky Mountain Construction, fabricant américain à l’origine du coaster hybride : une voie en acier posée sur d’anciennes montagnes russes en bois, avec airtime et inversions.',
    definition:
      'Rocky Mountain Construction (RMC) est un fabricant et une entreprise de maintenance américaine installée à Hayden, dans l’Idaho. Elle a inventé la voie I-box, un rail en acier qui se pose sur la structure d’une montagne russe en bois existante. Un parc peut ainsi transformer un vieux coaster en bois qui secoue en attraction hybride, avec de l’airtime intense, plusieurs inversions et des descentes au-delà de la verticale. Sur une voie en bois classique, c’est impossible. Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) et Untamed (Walibi Holland, 2019, l’ancien Robin Hood en bois) sont des conversions RMC. En Europe, RMC a aussi construit un coaster neuf, Wildfire à Kolmården (2016), son premier sur le continent.',
    aliases: ['Rocky Mountain Construction'],

    relatedTermIds: [
      'airtime',
      'barrel-roll-drop',
      'hybrid-coaster',
      'single-rail-coaster',
      'stall',
      'wooden-coaster',
    ],
  },
  {
    id: 'rcca',
    name: 'Roller Coaster Corporation of America (RCCA)',
    shortDefinition:
      'Constructeur américain de montagnes russes en bois basé à Atlanta, fondé en 1979 et dissous en 2005. En Europe, on lui doit notamment The Bandit au Movie Park Germany et Coaster Express au Parque Warner Madrid.',
    definition:
      'La Roller Coaster Corporation of America (RCCA), basée à Atlanta, construisait des montagnes russes en bois. Elle préfabriquait des sections de la structure en bois et de la voie dans ses ateliers et les assemblait dans le parc, ce qui raccourcissait le chantier. Sa première grande attraction fut Rattler à Six Flags Fiesta Texas en 1992, la plus connue Son of Beast à Kings Island (2000), alors la plus haute montagne russe en bois du monde et la première montagne russe en bois moderne avec une inversion. Son of Beast a été démolie, et Rocky Mountain Construction a transformé Rattler en Iron Rattler.\n\nEn Europe, la RCCA a construit trois attractions : The Bandit au Movie Park Germany (1999), Magnus Colossus à Terra Mítica (2000, fermée) et Coaster Express au Parque Warner Madrid (2002), la dernière de l’entreprise. La RCCA a cessé son activité en 2005.',
    aliases: ['Roller Coaster Corporation of America', 'RCCA'],
    relatedTermIds: ['wooden-coaster', 'gci', 'rmc'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Fabricant néerlandais de montagnes russes, l’un de ceux qui en ont le plus construit : le Boomerang, et beaucoup de coasters familiaux et à sensations dans les parcs européens.',
    definition:
      'Vekoma Rides Manufacturing est un fabricant néerlandais de montagnes russes installé à Vlodrop. En nombre d’installations, c’est l’un des plus gros producteurs du monde. Fondée en 1926 comme entreprise de mécanique, Vekoma se tourne vers les attractions en 1970. Son Boomerang, un shuttle coaster compact à trois inversions vendu à bas coût, a été installé dans des parcs du monde entier. Vekoma a aussi produit le Suspended Looping Coaster (SLC), le Giant Inverted Boomerang et le Mine Train. Dans les années 2010, l’entreprise a renouvelé sa gamme avec des trains plus doux, de nouveaux tracés et de nouvelles attractions familiales. Les Family Boomerang, Tilt Coaster et coasters familiaux suspendus de nouvelle génération sont de plus en plus nombreux dans les parcs européens. Disney a également commandé à Vekoma des modèles sur mesure pour ses resorts.',
    aliases: ['Vekoma Rides'],

    relatedTermIds: ['b-and-m', 'boomerang', 'gerstlauer', 'intamin', 'single-rail-coaster'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Fabricant allemand de l’Euro-Fighter, à première descente au-delà de la verticale, de spinning coasters et d’attractions familiales compactes.',
    definition:
      'Gerstlauer Amusement Rides GmbH est un fabricant allemand de montagnes russes installé à Münsterhausen, en Bavière. Hubert Gerstlauer l’a fondée en 1982. Son modèle le plus connu est l’Euro-Fighter, un coaster compact avec un lift à chaîne vertical et une descente qui peut atteindre 121 degrés, sur Takabisha (2011). Un Euro-Fighter tient sur un terrain réduit. On en trouve donc dans des parcs urbains et des petits sites, comme Rage à Adventure Island. Gerstlauer produit aussi l’Infinity Coaster, des spinning coasters et le SkyRoller, un coaster où les passagers commandent eux-mêmes leur retournement.',
    aliases: ['Gerstlauer Rides', 'Gerstlauer Amusement Rides'],

    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'intamin',
      'spinning-coaster',
    ],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Fabricant allemand des coasters à looping classiques des années 1970 et 1980, dont beaucoup roulent encore dans les parcs européens.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG était un fabricant allemand de montagnes russes installé à Münsterhausen, en Bavière, la ville où Gerstlauer s’installera plus tard. L’entreprise familiale construisait des attractions depuis 1954, et Anton Schwarzkopf l’a reprise en 1960. Revolution, à Six Flags Magic Mountain (1976), conçu par Schwarzkopf, a été le premier coaster à looping moderne du monde. Les principaux modèles sont le Looping Star, le Thriller/Wildcat et le Looping Coaster transportable, qui a fait le tour de l’Europe. Les tracés Schwarzkopf sont compacts et roulent sans à-coups. L’entreprise a fait faillite en 1983, puis définitivement en 1992, et Gerstlauer a repris ses ateliers de production. Beaucoup de ses coasters sont toujours en service, entretenus par des entreprises spécialisées ou par Gerstlauer.',
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
    aliases: ['Anton Schwarzkopf'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Un coaster qui fait passer le train de l’arrêt à pleine vitesse par un lancement magnétique, hydraulique ou pneumatique, sans remontée mécanique.',
    definition:
      'Un Launch Coaster remplace la remontée mécanique par un système de propulsion qui fait passer le train de l’arrêt à sa vitesse maximale en quelques secondes. Il existe plusieurs techniques. Le lancement LSM (moteur synchrone linéaire) utilise des bobines électromagnétiques qui accélèrent une ailette fixée au train. Le LIM (moteur à induction linéaire) fonctionne de la même façon, avec un rendement moindre. Le lancement hydraulique tire le train par un câble entraîné par un piston : Intamin l’a utilisé sur des coasters records comme Kingda Ka. Il y a enfin les lancements à air comprimé. Certains coasters enchaînent plusieurs lancements sur le même parcours.',
    alternateNames: ['LSM Coaster', 'LIM Coaster', 'Coaster à Lancement', 'Catapulte'],

    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
    aliases: ['Launch Coasters', 'Accelerator Coaster'],
  },
  {
    id: 'wooden-coaster',
    name: 'Montagnes russes en bois',
    shortDefinition:
      'Une montagne russe construite surtout en bois, qui gronde, secoue latéralement et donne un airtime imprévisible.',
    definition:
      'Une montagne russe en bois a une structure et une voie en bois. Le bois fléchit, contrairement à l’acier, et c’est de là que viennent le grondement, le ballottement latéral et l’airtime imprévisible de ces attractions. Balder à Liseberg, The Beast à Kings Island et Megafobia à Oakwood sont des coasters en bois. Ils demandent un entretien constant, car la voie doit être refaite régulièrement, et ils réagissent aux variations du climat. Avec la conversion de Rocky Mountain Construction (RMC), un vieux coaster en bois garde sa structure, reçoit une voie en acier et devient un coaster hybride.',
    relatedTermIds: ['airtime', 'cci', 'hybrid-coaster', 'ptc', 'quad-down', 'rattle', 'rmc'],
    aliases: ['Montagnes russes en bois'],
    alternateNames: ['Woodie', 'Woodies', 'Coaster en bois'],
  },
  {
    id: 'steel-coaster',
    name: 'Montagne russe en acier',
    shortDefinition:
      'Une montagne russe dont la voie et la structure sont en acier, à la conduite lisse et précise.',
    definition:
      'Une montagne russe en acier a une voie tubulaire ou plate en acier, portée par une structure en acier. L’acier ne fléchit pas comme le bois, et les ingénieurs peuvent régler précisément les forces G, les transitions et les inversions. Cette précision permet des tracés complexes avec plusieurs inversions, des virages serrés et des passages à grande vitesse.\n\nLa plupart des coasters construits aujourd’hui sont en acier. En Europe, Shambhala à PortAventura, Nemesis à Alton Towers et Silver Star à Europa-Park en sont des exemples. Il y en a de toutes les tailles, des petites attractions familiales aux mega coasters qui battent des records. Un coaster en acier doit être inspecté et entretenu régulièrement, et il laisse moins de marge d’erreur de conception que le bois, plus souple.',
    relatedTermIds: [
      'bobsled-coaster',
      'hyper-coaster',
      'inversion',
      'launch-coaster',
      'single-rail-coaster',
      'stand-up-coaster',
      'wooden-coaster',
    ],
    aliases: ['Montagnes russes en acier'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'Un coaster où le train pend sous la voie sur un pivot et se balance librement sur les côtés.',
    definition:
      'Sur un suspended coaster, le train est suspendu sous la voie par un pivot et peut se balancer librement d’un côté à l’autre. Dans les virages, il part en balancier comme un pendule : c’est l’effet de « whip », qu’on ne peut pas prévoir exactement. Un inverted coaster, lui, a un train fixé rigidement à la voie et ne se balance pas.\n\nLes suspended coasters sont plus rares que les inverted coasters. Avec le balancement, même un virage modéré envoie la nacelle vers l’extérieur, et les passagers ont les pieds dans le vide, loin au-dessus du sol. Le Suspended Looping Coaster (SLC) de Vekoma, apparu dans les années 1990, n’en est pas un malgré son nom : c’est un inverted coaster à voie fixe qui ne se balance pas, construit à une quarantaine d’exemplaires.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'vekoma'],
    aliases: ['Suspended Coasters'],
    alternateNames: ['Balançant', 'Oscillant'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster hybride',
    shortDefinition:
      'Un coaster qui associe une structure en bois à une voie I-box en acier, un procédé mis au point par Rocky Mountain Construction (RMC).',
    definition:
      'Un coaster hybride associe la structure en bois d’un coaster traditionnel à une voie I-box en acier fabriquée par Rocky Mountain Construction (RMC). La voie I-box est très précise et roule sans à-coups. Elle permet des inversions impossibles sur une voie en bois classique. RMC a surtout développé cette technique pour rénover des coasters en bois vieillissants, en ajoutant des inversions, des descentes plus raides et des airtime hills à des tracés qui secouaient trop. Steel Vengeance (Cedar Point), Twisted Colossus (Six Flags Magic Mountain) et Untamed (Walibi Holland, 2019, l’ancien Robin Hood en bois) sont des conversions RMC. Il existe aussi des hybrides RMC neufs, comme Zadra à Energylandia.',
    aliases: ['Hybrid Coasters', 'I-Box Track', 'IBox Track', 'Topper Track'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Coaster hybride'],

    relatedTermIds: ['airtime', 'rmc', 'wooden-coaster'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Un modèle compact de Vekoma : le train passe trois inversions deux fois, d’abord en marche avant, puis en marche arrière, sur un tracé aller-retour.',
    definition:
      'Le Boomerang de Vekoma est l’un des modèles de montagnes russes les plus répandus au monde. Le tracé compte trois inversions, un cobra roll (deux inversions) suivi d’un looping vertical. Le train les passe d’abord en marche avant. Il est ensuite hissé sur un second lift incliné, relâché, et les repasse en marche arrière. Cela fait six inversions en tout sur une très petite surface, et le modèle convient donc aux parcs qui ont peu de place. Plus de 50 Boomerangs ont été construits, sur tous les continents habités. Dans les parcs de taille moyenne, il sert encore souvent de premier coaster à inversions.',
    relatedTermIds: ['cobra-roll', 'inversion', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Un coaster compact de Gerstlauer : un lift vertical, puis une première descente verticale ou au-delà de la verticale, sur un terrain réduit.',
    definition:
      'L’Euro-Fighter est le coaster compact de Gerstlauer. Après un lift vertical à chaîne, le train plonge à la verticale (90°) ou au-delà (jusqu’à 121°). Le modèle est fait pour les parcs qui ont peu de place et regroupe sur une petite surface plusieurs inversions, des virages serrés et des G-forces élevées. Au sommet, le train marque une pause, les passagers penchés au-dessus du vide, avant la descente, plus raide que la verticale. Saw – The Ride à Thorpe Park, Rage à Adventure Island et Fluch von Novgorod à Hansa-Park sont des Euro-Fighters.',
    relatedTermIds: ['beyond-vertical-drop', 'first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'Un coaster à train très large qui s’arrête au bord d’une descente verticale ou au-delà de la verticale, puis plonge.',
    definition:
      'Un Dive Coaster a un train large (en général 8 à 10 passagers par rangée) et une descente verticale ou au-delà de la verticale (90° ou plus). Au sommet, le train retient les passagers quelques instants au bord, puis les lâche. Avec un train aussi large, chaque rangée a le vide droit devant elle. La gamme Dive Machine de B&M (Oblivion à Alton Towers, SheiKra à Busch Gardens) a répandu le concept. Gerstlauer en construit une version concurrente, le Dive Coaster.',
    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'first-drop',
      'launch-coaster',
    ],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'Une montagne russe où les passagers portent un casque de réalité virtuelle qui affiche une animation ou un jeu synchronisé avec les mouvements du train.',
    definition:
      'Sur un VR Coaster, les passagers portent un casque de réalité virtuelle (souvent un Samsung Gear VR ou un appareil dédié) qui affiche un monde virtuel synchronisé avec les mouvements du coaster. Quand le train passe un looping, l’image passe le looping aussi, et quand le train plonge, l’image plonge. Les VR Coasters se sont multipliés entre 2015 et 2019, beaucoup de parcs équipant des attractions existantes. Les casques posent des problèmes de confort et d’hygiène, et donnent le mal des transports à certains passagers. Beaucoup de parcs ont depuis retiré la VR. Quelques installations, comme les VR Coasters de Mack Rides, proposent des programmes dédiés plus aboutis.',
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'La sensation d’être soulevé de son siège sur une montagne russe, quand les G-forces deviennent négatives.',
    definition:
      'L’airtime est le moment où les G-forces deviennent négatives et où le passager se soulève de son siège. Il se produit quand le coaster passe une colline ou un creux plus vite que la chute libre. On en distingue deux types : le floater airtime (G légèrement négatives, on flotte) et l’ejector airtime (G fortement négatives, seule la barre ou la ceinture retient le passager sur son siège). Les airtime hills (ou camelbacks) sont dessinées pour en produire : leur profil suit la parabole d’une chute libre.',
    relatedTermIds: [
      'airtime-hill',
      'bunnyhop',
      'first-drop',
      'quad-down',
      'restraint-freedom',
      's-hill',
      'wooden-coaster',
    ],
  },
  {
    id: 'inversion',
    name: 'Inversion',
    shortDefinition: 'Un élément de montagne russe où la voie met les passagers la tête en bas.',
    definition:
      'Une inversion est un élément de montagne russe où la voie et le véhicule font tourner les passagers au-delà de la verticale, au moins en partie la tête en bas. Les plus courantes sont le looping vertical, le cobra roll, le tire-bouchon, l’Immelmann, le dive loop, l’inline twist, le heartline roll et le zero-G roll. Un coaster moderne en compte couramment de six à quatorze. Le nombre d’inversions fait partie des chiffres qu’on donne pour décrire l’intensité d’un coaster. Dans une inversion, les G-forces sont positives en bas des loopings et négatives en haut.',
    relatedTermIds: ['cobra-roll', 'corkscrew', 'immelmann', 'vertical-loop', 'zero-g-roll'],
    aliases: ['Inversions'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      'L’inversion classique : un cercle vertical complet, avec les passagers entièrement la tête en bas au sommet.',
    definition:
      'Le looping vertical est un cercle complet de 360° dans le plan vertical. Les loopings modernes n’ont pas la forme d’un cercle parfait mais celle d’une clothoïde (en larme) : l’entrée et la sortie sont larges, le haut est serré. Avec cette forme, les G-forces restent régulières, sans pics extrêmes. Le premier coaster moderne à looping, Revolution à Six Flags Magic Mountain, construit par Schwarzkopf, date de 1976. On trouve aujourd’hui des loopings verticaux sur des coasters du monde entier, des attractions pour débutants aux machines à records.',
    alternateNames: ['Boucle Verticale', 'Vertical Loop'],

    relatedTermIds: ['cobra-roll', 'immelmann', 'inclined-loop', 'interlocking-loops', 'inversion'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'Un demi-looping qui monte et passe par-dessus, suivi d’un demi-tonneau, après lequel le train repart dans l’autre sens. Le nom vient du pilote de la Première Guerre mondiale Max Immelmann.',
    definition:
      'Le virage Immelmann est une inversion en deux temps, courante chez B&M. La voie monte d’abord en demi-looping vertical, et les passagers passent brièvement la tête en bas au sommet. Un demi-tonneau remet ensuite le train à l’endroit, et il repart à 180 degrés de sa direction d’entrée. L’élément porte le nom de l’as de l’aviation de la Première Guerre mondiale Max Immelmann, qui faisait une manœuvre semblable en vol. Un Immelmann combine une inversion et un demi-tour dans un seul élément. On en trouve sur presque tous les coasters B&M assis et inversés.',
    relatedTermIds: ['b-and-m', 'dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      'Un tonneau de 360° sur un arc parabolique : au sommet, la tête en bas, les passagers sont presque en apesanteur.',
    definition:
      'Le zero-G roll (tonneau à gravité zéro) est une inversion dont la forme fait suivre au train un arc parabolique pendant la rotation. Le principe est proche du heartline roll, mais à plus grande vitesse et avec plus de dénivelé. Au sommet du tonneau, les passagers ont un bref moment de G-forces négatives (de l’airtime) alors qu’ils sont la tête en bas. On trouve surtout des zero-G rolls sur les wing coasters, les inverted coasters et les hyper coasters de B&M. Sur un wing coaster, les sièges placés de chaque côté du rail décrivent un grand cercle dans le vide.',
    relatedTermIds: ['airtime', 'b-and-m', 'heartline-roll', 'inversion', 'zero-g-winder'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'La montée mécanique qui hisse le train au point le plus haut du circuit : l’énergie électrique devient de l’énergie potentielle.',
    definition:
      'Le lifthill est la section où un mécanisme hisse le train du niveau du sol au point le plus haut du parcours. Le plus souvent, c’est une chaîne qui court au milieu de la voie, et le « clic-clic-clic » qu’on entend vient du cliquet anti-recul. Il existe aussi des lifts à câble (plus silencieux et plus doux), des lifts à roues motorisées (sur certains coasters B&M récents) et des lifts magnétiques. La hauteur du lifthill fixe la vitesse maximale que le coaster peut atteindre. Certains tracés récents ont plusieurs lifthills ou combinent une montée et des lancements. C’est en général le passage le plus lent de l’attraction.',
    aliases: ['Lift Hill'],
    alternateNames: ['Chain Lift', 'Chaîne de remontée'],

    relatedTermIds: ['block-brake', 'first-drop', 'launch-coaster'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'La première descente après le lifthill, en général la plus haute et la plus rapide du parcours.',
    definition:
      'Le First Drop est la grande descente qui suit le lifthill ou le lancement. Sur la plupart des coasters classiques, c’est la plus haute et celle où le train atteint sa vitesse maximale. Son angle, sa hauteur et son profil pèsent beaucoup sur le reste du parcours. Une descente très raide (80 à 90° et plus) donne une forte sensation d’accélération, alors qu’une descente parabolique peut produire beaucoup d’airtime avec un angle plus doux. Sur les Dive Coasters, la descente dépasse 90° (au-delà de la verticale), et les passagers sont penchés au-dessus du vide avant de plonger. C’est souvent le First Drop que les parcs filment pour la promotion d’un nouveau coaster.',
    relatedTermIds: ['airtime', 'airtime-hill', 'beyond-vertical-drop', 'dive-coaster', 'lifthill'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'Une bosse dessinée pour produire des G-forces négatives : les passagers flottent ou se soulèvent de leur siège.',
    definition:
      'Un Airtime Hill (ou camelback) est une bosse, une montée suivie d’une descente, dessinée pour produire des G-forces négatives. Le passager flotte ou se soulève de son siège. Le floater airtime correspond à des G légèrement négatives. Avec l’ejector airtime, plus fort, seule la barre de maintien retient le passager. Sur les coasters en acier, le profil parabolique des collines est calculé précisément, et l’airtime est régulier et prévisible. Sur les coasters en bois, la voie fléchit, et l’airtime est plus irrégulier et plus brutal. Les Airtime Hills font partie des éléments de base des hyper coasters, des giga coasters et des coasters en bois récents.',
    aliases: ['Collines d’airtime'],
    alternateNames: ['Camelback', 'Bunny Hill'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 's-hill', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Une section où la voie tourne en spirale continue autour d’un axe central, avec des G-forces latérales qui durent.',
    definition:
      'Un hélix est une section où la voie tourne en spirale, comme une vis, sans mettre les passagers la tête en bas. Les G-forces y sont latérales et durent : elles plaquent les passagers vers l’extérieur du virage. Un hélix descendant accélère le train dans le virage, un hélix montant le ralentit, avec les mêmes forces latérales. On en place souvent en fin de parcours pour dissiper l’énergie qui reste au train. Le final souterrain de Nemesis à Alton Towers et l’hélix final d’Expedition GeForce au Holiday Park en sont des exemples.',
    aliases: ['Helices'],
    alternateNames: ['Hélicoïde', 'Spirale', 'Virage hélicoïdal'],

    relatedTermIds: ['first-drop', 'horseshoe'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'Une section de freinage qui découpe le circuit en segments, pour que plusieurs trains puissent rouler en même temps sans risque de collision.',
    definition:
      'Un Block Brake découpe le circuit d’un coaster en sections indépendantes (les « blocs »), qui ne peuvent chacune contenir qu’un seul train. Si un train ralentit ou s’arrête plus loin, le système de contrôle retient automatiquement tous les trains qui le suivent à leur block brake. Le parc peut ainsi faire rouler plusieurs trains en même temps sans risque de collision, et la capacité horaire augmente nettement. Les block brakes sont placés là où un train arrêté ne reculera pas (en général à plat ou en légère montée) et utilisent des freins magnétiques (à courants de Foucault) ou des freins à friction. Le mid-course brake run (MCBR) est le block brake le plus visible.',
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'La section de fin de circuit où le train ralentit jusqu’à la vitesse de la gare, en général avec des freins magnétiques à ailettes.',
    definition:
      'Le Brake Run est la section de voie qui suit le parcours principal. Le train y passe de sa vitesse de trajet à une vitesse d’approche sûre pour la gare. Les brake runs récents utilisent des freins à courants de Foucault : des rangées d’aimants permanents agissent sur des ailettes métalliques fixées sous le train, et le freinage se fait sans frottement ni usure. Les coasters plus anciens avaient des freins à pinces pneumatiques. Un mid-course brake run (MCBR), placé au milieu du parcours, sert de bloc quand plusieurs trains circulent. Le brake run final est parfois volontairement léger, pour que le train arrive en gare avec encore un peu de vitesse.',
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      'Une double inversion courante chez B&M, dont la voie dessine la tête dressée d’un cobra : deux inversions reliées par un demi-tonneau au sommet.',
    definition:
      'Le cobra roll est un élément B&M fait de deux inversions rapprochées. La voie monte en demi-looping, tourne de 180° au sommet, où le train passe brièvement la tête en bas, puis refait la même séquence en miroir et ressort dans la direction opposée à celle de l’entrée. Vu de côté, le tracé rappelle la tête dressée d’un cobra, capuchon déployé. Dragon Khan à PortAventura a un cobra roll, comme beaucoup de coasters inversés B&M.',
    relatedTermIds: ['b-and-m', 'banana-roll', 'batwing', 'immelmann', 'inversion', 'sea-serpent'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      'Une inversion en tonneau où la voie tourne à 360° autour d’un axe central. C’est l’une des premières inversions construites et l’une des plus répandues.',
    definition:
      'Le tire-bouchon est l’une des premières inversions modernes, introduite par Arrow Dynamics dans les années 1970. La voie tourne en spirale autour d’un cylindre central, comme un tire-bouchon, et fait faire aux passagers un tonneau complet de 360° décalé par rapport à leur direction. Les tire-bouchons vont souvent par deux, l’un après l’autre, et sont l’élément type des coasters en acier de l’époque classique. Sur les plans et la signalétique des parcs germanophones, on lit souvent le terme allemand « Korkenzieher ». Les inversions plus récentes l’ont largement remplacé, mais on en trouve encore dans les parcs d’Europe et d’Amérique du Nord.',
    relatedTermIds: ['flat-spin', 'inline-twist', 'inversion'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'L’inverse de l’Immelmann : la voie plonge en demi-looping et ressort à l’horizontale, dans la direction opposée.',
    definition:
      'Un Dive Loop (ou dive turn, ou reverse Immelmann) fait le contraire de l’Immelmann. Au lieu de monter et de passer par-dessus, la voie plonge brusquement, décrit la moitié inférieure d’un looping et ressort dans la direction opposée à l’entrée. Le passager plonge, puis il est plaqué dans son siège au moment du redressement. On trouve des Dive Loops sur beaucoup de coasters inversés et assis de B&M, souvent sur le même tracé que des Immelmanns.',
    relatedTermIds: ['b-and-m', 'immelmann', 'inversion'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      'Un tonneau de 360° autour de l’axe de la voie : le train passe à l’envers sans vraiment changer de direction.',
    definition:
      'Un Inline Twist (ou inline roll, ou barrel roll) fait tourner le train à 360° autour de l’axe longitudinal de la voie. Le coaster fait un tonneau sans vraiment dévier de sa direction. Dans un tire-bouchon, la spirale est décalée par rapport à l’axe de la voie, alors que l’inline twist tourne autour de la voie elle-même. L’inversion est courte et fluide, avec très peu de forces latérales. On en trouve souvent sur les flying coasters et les coasters inversés de B&M, parfois par paires ou enchaînés rapidement avec d’autres éléments.',
    relatedTermIds: ['corkscrew', 'flat-spin', 'heartline-roll', 'inversion'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Un tonneau de 360° centré sur le centre de gravité du passager et non sur la voie, pour une apesanteur douce pendant toute la rotation.',
    definition:
      'Un Heartline Roll (ou heartline spin) est dessiné pour que le cœur du passager, à peu près le centre de gravité du corps, reste à la même hauteur pendant toute la rotation : le pivot n’est pas la voie, c’est le passager. Les G-forces restent faibles pendant le tonneau, et le passager flotte au lieu d’être secoué comme dans un tire-bouchon classique. On en trouve sur les coasters B&M et Intamin récents, en particulier sur les hyper coasters et les inverted coasters.',
    relatedTermIds: ['inline-twist', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Un demi-looping suivi d’un demi-tire-bouchon, qui fait tourner le train de 90°.',
    definition:
      'Un Sidewinder commence par un demi-looping vertical qui fait monter le train, suivi tout de suite d’un demi-tire-bouchon qui le remet à l’endroit en le faisant tourner de 90°. On obtient une inversion et un changement de direction sur une petite surface. Storm Runner à Hersheypark (Intamin, 2004) en a un, que le parc appelle cobra loop. Le nom vient du mouvement de torsion, comme celui d’un serpent, qu’on voit depuis le bord de la voie.',
    relatedTermIds: ['cobra-roll', 'inversion'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Une grande inversion propre aux flying coasters B&M : les passagers, déjà à plat ventre, passent par le bas d’un looping vertical entièrement à l’envers.',
    definition:
      'Le Pretzel Loop n’existe que sur les flying coasters B&M, où les passagers sont allongés à plat ventre, en position « Superman ». L’élément les envoie la tête en bas dans une plongée abrupte, par le bas d’un grand looping, avant une remontée brusque. Vu de côté, le tracé rappelle un bretzel. Au point bas, les passagers ont le visage tourné vers le sol et les G-forces sont très fortes. Manta à SeaWorld Orlando et Tatsu à Six Flags Magic Mountain ont un Pretzel Loop.',
    relatedTermIds: ['b-and-m', 'inline-twist', 'inversion'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Une double inversion qui fait repartir le train dans l’autre sens : deux demi-loopings reliés par un demi-tire-bouchon, en forme d’ailes de chauve-souris.',
    definition:
      'Un Batwing enchaîne deux inversions et fait repartir le train dans l’autre sens. La voie monte en demi-looping, passe au sommet par un demi-tire-bouchon qui met le train à l’envers en inversant sa direction, puis redescend en demi-looping. Vu du dessus, le tracé rappelle des ailes de chauve-souris déployées. On en trouve chez B&M, par exemple sur Afterburn à Carowinds et The Incredible Hulk Coaster à Universal’s Islands of Adventure. Contrairement au bowtie, qui garde sa direction, le Batwing fait faire au train un demi-tour de 180°.',
    relatedTermIds: ['b-and-m', 'bowtie', 'cobra-roll', 'inversion'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'Un looping pris dans l’autre sens : le train y entre par le haut, plonge dans le cercle et en ressort par le haut.',
    definition:
      'Le Norwegian loop est un élément à deux inversions qui a la forme d’un grand looping abordé par le haut : un dive loop suivi directement d’un Immelmann. Le train monte et bascule dans un demi-looping qui le fait plonger vers le sol, passe le bas de la courbe et remonte dans un second demi-looping qui le fait ressortir au sommet, dans la direction d’où il venait. Vu de côté, l’ensemble ressemble à un seul looping dont l’entrée et la sortie sont en haut, là où un looping ordinaire les a en bas.\n\nL’élément est apparu sur SpeedMonster à TusenFryd, près d’Oslo (Intamin, 2006), d’où son nom. Le looping y entoure l’escalier mécanique qui monte les visiteurs dans le parc, si bien qu’on le traverse avant d’avoir atteint la moindre attraction. Les Norwegian loops restent rares.',
    relatedTermIds: ['dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Un élément proche du tire-bouchon, sur les coasters inversés ou flying, où la rotation se fait presque à plat.',
    definition:
      'Un Flat Spin est une inversion proche du tire-bouchon, surtout présente sur les coasters inversés et flying de B&M. La spirale est disposée de façon à paraître presque horizontale depuis le sol. Sur un coaster inversé, où le train pend sous la voie, les passagers décrivent un grand cercle presque à plat. Dans le train, la rotation est douce et régulière, avec des G-forces modérées. Banshee à Kings Island et Afterburn à Carowinds, deux coasters inversés B&M, ont un Flat Spin.',
    relatedTermIds: ['b-and-m', 'corkscrew', 'inline-twist', 'inversion'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      'Un demi-tire-bouchon qui fait en même temps tourner le train d’environ 180° : une inversion et un demi-tour.',
    definition:
      'Un Cutback est un élément où la voie fait un demi-tire-bouchon tout en revenant sur elle-même d’environ 180°. On obtient une inversion avec un demi-tour, alors qu’un tire-bouchon classique garde à peu près la direction de départ. Les Cutbacks sont assez rares. On en trouve sur certains modèles Vekoma et sur des coasters sur mesure qui ont besoin d’un changement de direction compact combiné à une inversion. Le nom anglais « cutback » décrit l’aspect de l’élément : la voie repart vers là d’où elle vient tout en pivotant.',
    relatedTermIds: ['corkscrew', 'inversion', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Une variante du sea serpent avec un sommet de liaison plus bas : deux inversions l’une après l’autre, sans changement de direction, sur peu de place.',
    definition:
      'Le Butterfly est une double inversion proche du sea serpent (deux demi-loopings reliés au sommet), avec une géométrie différente et un sommet plus bas. Comme le sea serpent, il fait passer deux inversions sans changer la direction du train, mais la liaison entre les deux demi-loopings passe par une section à l’envers plus basse au lieu d’un sommet haut placé. Le Butterfly prend donc moins de hauteur. On en trouve sur certains modèles Vekoma et sur des coasters sur mesure. Il se distingue du bowtie (même absence de changement de direction, mais disposition différente) et du batwing (qui change de direction).',
    relatedTermIds: ['batwing', 'bowtie', 'inversion'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Une double inversion faite de deux demi-loopings en miroir, en forme de nœud papillon, sans changement de direction.',
    definition:
      'Un Bowtie est une double inversion faite de deux demi-loopings en miroir reliés au sommet. Contrairement au batwing, auquel il ressemble de loin, le bowtie ressort à peu près dans la direction d’entrée. Vu du dessus, le tracé rappelle un nœud papillon. Les Bowties sont assez rares et se trouvent surtout sur certaines installations Vekoma et sur mesure. Les deux inversions s’enchaînent rapidement et sans à-coups.',
    relatedTermIds: ['batwing', 'butterfly', 'inversion'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Une série de petites bosses rapides en fin de parcours, où le train, déjà ralenti, donne un léger floater airtime.',
    definition:
      'Un Bunnyhop (ou bunny hop) est une suite de petites bosses rapides placées vers la fin d’un parcours, quand le train a perdu la plus grande partie de son énergie. À cette vitesse, les bosses donnent un léger floater airtime, un flottement régulier, et non l’ejector airtime des collines prises plus vite en début de parcours. Le nom évoque les petits bonds d’un lapin. On trouve souvent des bunnyhops juste avant le brake run des hyper coasters, des giga coasters et des coasters en bois.',
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run', 's-hill'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'Un airtime hill incliné au-delà de 90° : les passagers sont couchés sur le côté et soulevés de leur siège en même temps. Le nom vient de l’ingénieur Werner Stengel, et l’élément est courant chez Mack Rides.',
    definition:
      'Le Stengel Dive est un élément d’airtime où la voie s’incline au-delà de 90°. Les passagers se retrouvent sur le côté, voire légèrement la tête en bas, et le profil de la colline produit en même temps des G-forces négatives. L’élément porte le nom de l’ingénieur allemand Werner Stengel. On en trouve sur beaucoup de coasters de Mack Rides : Blue Fire Megacoaster à Europa-Park (2009) en a un. Le tout premier se trouvait pourtant sur Goliath à Walibi Holland (Intamin, 2002).',
    relatedTermIds: ['airtime', 'airtime-hill', 'mack-rides'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Un virage en demi-cercle très incliné, en forme de fer à cheval, qui renvoie le train dans la direction opposée, souvent entre deux lancements.',
    definition:
      'Un Horseshoe est un virage en demi-cercle très incliné, en général entre 75 et 90°, qui fait faire au coaster un demi-tour de 180°. Avec une telle inclinaison, les G-forces latérales restent supportables malgré un rayon aussi serré. On en trouve souvent sur les launched coasters, entre deux lancements : le train fait demi-tour avant la phase d’accélération suivante. L’élément est typique des accélérateurs Intamin et des multi-launch coasters Mack. Il retourne le train sur peu de place sans lui faire perdre de vitesse.',
    relatedTermIds: ['intamin', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Une petite descente juste avant la première grande descente d’un coaster à lifthill, qui soulage la chaîne et donne un bref airtime.',
    definition:
      'Un Predrop est une petite colline ou un petit creux placé en haut du lifthill, juste avant le sommet de la première grande descente. Sa fonction première est de réduire la tension sur la chaîne au moment où le train passe le sommet, pour éviter un passage brutal du lift motorisé à la chute libre. Au passage, les passagers ont aussi un bref instant d’airtime avant la grande descente. On trouve des predrops sur des coasters en bois et en acier, par exemple sur Goliath à Six Flags Magic Mountain.',
    relatedTermIds: ['airtime', 'first-drop', 'lifthill'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Un élément haut et étroit, avec une montée et une descente presque verticales, en forme de chapeau haut de forme. On le trouve surtout sur les coasters Intamin à lancement hydraulique.',
    definition:
      'Dans un Top Hat, la voie monte presque à la verticale jusqu’à un sommet étroit, puis replonge presque à la verticale de l’autre côté. Vu de côté, le profil rappelle un chapeau haut de forme. Sur un Top Hat intérieur (le cas standard), la voie s’incline vers l’intérieur au sommet. Sur un Top Hat extérieur, elle s’incline vers l’extérieur, les passagers sont plus exposés et ont plus d’airtime. L’élément va de pair avec les launched coasters hydrauliques d’Intamin (les accélérateurs) : après un lancement à 200 km/h ou plus, le train monte directement dans le Top Hat. Kingda Ka (139 m, fermé en 2024) en avait un. Top Thrill Dragster (128 m), devenu Top Thrill 2 en 2024 avec un lancement LSM, en a un, comme Red Force au Ferrari Land, lancé lui aussi par LSM.',
    relatedTermIds: ['first-drop', 'intamin', 'launch-coaster'],
  },
  {
    id: 'credit',
    name: 'Crédit',
    shortDefinition:
      'Une montagne russe qu’un passionné a faite et ajoutée à son compteur personnel.',
    definition:
      'Un crédit (ou « cred ») est une montagne russe qu’un passionné a faite au moins une fois et ajoutée à son compteur personnel. « Collecter des crédits », c’est faire le plus grand nombre possible de coasters différents. Chacun fixe ses règles. Certains ne comptent que les sit-down coasters, d’autres toutes les attractions sur rails. Pour certains, chaque type de train d’un même coaster compte comme un crédit distinct, pour d’autres non. Des sites comme la Roller Coaster Database (RCDB) permettent de tenir son compteur. Pour ajouter des crédits, beaucoup de collectionneurs voyagent à l’étranger et visitent des parcs peu connus.',
    alternateNames: ['Cred', 'Creds', 'Compteur de coasters'],

    relatedTermIds: [
      'hybrid-coaster',
      'mackprodukt',
      'onride-offride',
      'pov',
      'powered-coaster',
      're-ride',
      'wooden-coaster',
    ],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Une vidéo filmée depuis le premier rang d’une montagne russe, qui montre tout le parcours.',
    definition:
      'Une POV (Point of View) est une vidéo filmée du point de vue d’un passager du premier rang, en général avec une caméra fixée au train. Beaucoup de visiteurs regardent la POV d’un coaster avant de se déplacer pour le faire. Les parcs en publient parfois pour leur promotion, mais la plupart sont filmées par des visiteurs ou des médias. Une bonne POV montre clairement chaque élément, chaque descente et chaque inversion, dans l’ordre. YouTube en compte des dizaines de milliers rien que pour les coasters. Le terme sert aussi, plus largement, pour toute vidéo d’attraction filmée à la première personne.',
    alternateNames: ['Point of View', 'On-Ride Video', 'Vidéo embarquée'],

    relatedTermIds: ['credit', 'dark-ride', 'onride-offride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Quand plusieurs trains attendent sur le brake run parce que la gare n’est pas encore libre. L’exploitation ralentit et l’attente s’allonge.',
    definition:
      'On parle de Stacking quand l’embarquement et le débarquement prennent plus de temps que le parcours lui-même. Les trains s’accumulent alors sur le brake run en attendant que la gare se libère. Au lieu de lancer un train dès que le précédent revient, l’opérateur doit en retenir plusieurs sur le brake run, et l’attraction s’arrête parfois brièvement entre deux trains. Le Stacking réduit directement la capacité et allonge l’attente. Il vient souvent d’un embarquement lent (des systèmes de retenue compliqués, par exemple), de contrôles de bagages poussés ou d’un manque de personnel. Depuis la file, on peut voir si les trains s’accumulent et en tenir compte.',
    alternateNames: ['Train Stacking', 'Accumulation de trains'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Un type de montagne russe où le train est fixé sous le rail et où les pieds des passagers pendent dans le vide.',
    definition:
      'Sur un Inverted Coaster, le train est fixé rigidement sous le rail et les passagers sont assis, les pieds dans le vide. Contrairement à un suspended coaster, qui se balance sur les côtés, le train d’un Inverted Coaster ne peut pas se balancer. B&M a lancé le concept avec Batman The Ride en 1992. Les tracés passent souvent tout près du décor ou de la structure (des near-misses) et comportent des zero-G rolls et des cobra rolls. En Europe, Nemesis (Alton Towers), Katun (Mirabilandia) et Oziris (Parc Astérix) sont des Inverted Coasters.',
    aliases: ['Inverted Coasters'],
    alternateNames: ['Inverted', 'Invert', 'Montagnes Russes Inversées'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Un type de coaster où les sièges sont placés de chaque côté du rail, sans rien au-dessus, en dessous ni à côté des passagers.',
    definition:
      'Un Wing Coaster (ou Wing Rider) a deux sièges de chaque côté du rail. Les passagers n’ont aucune structure au-dessus d’eux, en dessous ni sur le côté. Le tracé peut ainsi frôler de très près le décor et les structures (des near-misses). B&M est le principal fabricant de Wing Coasters. En Europe, on en trouve au Heide-Park (Flug der Dämonen), à Thorpe Park (The Swarm) et à Toverland (Fēnix).',
    aliases: ['Wing Coasters'],
    alternateNames: ['Wing Rider', 'Coaster à ailes'],

    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Un coaster dont les wagons tournent librement autour d’un axe vertical : aucun tour ne ressemble au précédent.',
    definition:
      'Sur un Spinning Coaster, chaque wagon est monté sur une plateforme qui tourne librement autour d’un axe vertical. Personne ne commande la rotation, et d’un tour à l’autre, on passe les éléments en avant, en arrière ou de côté dans un ordre différent. Mack Rides (Waldkirch, Allemagne) et Gerstlauer en sont les principaux fabricants. Beaucoup de Spinning Coasters sont conçus comme des attractions familiales, avec une taille minimale plus basse que celle des coasters les plus intenses.',
    aliases: ['Spinning Coasters'],
    alternateNames: ['Spinner', 'Coaster tournant'],

    relatedTermIds: ['credit', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Le spinning coaster de Mack Rides dans sa version la plus forte : plus rapide, plus haut, avec une rotation plus marquée que les modèles standard.',
    definition:
      'L’Xtreme Spinning Coaster (XSC) est le spinning coaster le plus intense de Mack Rides. Time Traveler à Silver Dollar City (2018) a été le premier, The Ride to Happiness à Plopsaland (2021) l’a suivi. Un spinning coaster standard vise les familles. Le XSC a une structure plus haute, des descentes plus raides, des vitesses de pointe plus élevées et une rotation réglée pour tourner davantage : les wagons tournent plus vite et plus souvent dans chaque élément du parcours.\n\nAvec ce rythme, l’orientation du wagon change plus vite, et deux tours ne se ressemblent pas. Le XSC se place entre les spinners familiaux et les coasters les plus intenses.',
    aliases: ['XSC'],
    relatedTermIds: ['credit', 'mack-rides', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Un coaster de plus de 61 m de haut, en général sans inversion, construit pour la vitesse et l’airtime.',
    definition:
      'Un Hyper Coaster est une montagne russe de 61 à 91 m de haut. B&M parle de « Hyper Coaster », Intamin de « Mega Coaster » pour le même type d’attraction. Dans les deux cas, le tracé enchaîne de grandes collines d’airtime prises à grande vitesse, avec peu ou pas d’inversions. Shambhala à PortAventura (76 m) et Hyperion à Energylandia (77 m) sont les Hyper Coasters les plus hauts d’Europe. Mako à SeaWorld Orlando en est un autre exemple.',
    aliases: ['Hyper Coasters', 'Mega Coaster', 'Mega-Coaster'],
    alternateNames: ['Mega Coaster', 'Méga Montagne Russe', 'Hypercoaster'],

    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Un coaster de plus de 91 m de haut, un cran au-dessus du Hyper Coaster.',
    definition:
      'Un Giga Coaster est une montagne russe de 91 à 121 m de haut. Cedar Fair et Intamin ont créé le terme pour Millennium Force, ouvert à Cedar Point en 2000. Les Giga Coasters ont une très grande hauteur, de longs parcours et de longues phases d’airtime. Fury 325 à Carowinds en est un exemple. L’Europe n’en compte qu’un : Red Force, à Ferrari Land (PortAventura World, Espagne), ouvert en 2017 et haut de 112 m. Hyperion à Energylandia (Pologne), avec 77 m, reste dans la catégorie Hyper.',
    aliases: ['Giga Coasters'],
    alternateNames: ['Giga Montagne Russe', 'Gigacoaster'],

    relatedTermIds: ['airtime', 'first-drop', 'hyper-coaster'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Un virage incliné à plus de 90°, où les passagers passent brièvement au-delà de la verticale.',
    definition:
      'Un Overbanked Turn (virage surbanqué) est un virage incliné à plus de 90 degrés : le rail extérieur passe au-delà de la verticale. Les passagers sont brièvement penchés au-delà de la verticale, sans que le train fasse une inversion complète. On y sent à la fois des G latérales et de légères G négatives au sommet du virage. On trouve des Overbanked Turns sur les Hyper Coasters de B&M et les Mega Coasters d’Intamin, et presque partout dans les tracés de RMC.',
    aliases: ['Overbanked'],
    alternateNames: ['Virage surincliné', 'Virage déversé'],

    relatedTermIds: ['airtime', 'b-and-m', 'intamin', 'inversion', 'rmc'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'Un frein magnétique en cours de parcours, qui ralentit le train sans l’arrêter.',
    definition:
      'Un Trim Brake est un frein placé en cours de parcours pour ralentir le train, sans l’arrêter comme le fait un block brake. Il sert à limiter les forces G, à réduire l’usure de la voie ou à respecter des exigences de sécurité. Quand le train est freiné avant une colline d’airtime, l’airtime y est plus faible. Selon la saison, la météo et le remplissage du train, les trim brakes ne freinent pas toujours autant.',
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Quand un launch coaster n’atteint pas le sommet du parcours et redescend en arrière sur la voie de lancement.',
    definition:
      'Il y a rollback quand un coaster lancé ne prend pas assez de vitesse pour passer le point le plus haut du parcours et redescend en arrière, par gravité, jusqu’à la zone de lancement. Sur les launch coasters hydrauliques (Top Thrill Dragster avant sa transformation en Top Thrill 2 en 2024, Stealth), cela arrive quand le lancement ne donne pas toute sa puissance. Des freins magnétiques arrêtent alors le train en douceur. Les rollbacks sont rares, mais connus sur les launch coasters hydrauliques. Les passagers ne courent aucun danger.',
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatronique',
    shortDefinition: 'Des personnages robotisés qui bougent dans les dark rides et les spectacles.',
    definition:
      'Un animatronique est une figure robotisée électromécanique qui représente un personnage ou une créature dans une attraction ou un spectacle de parc à thème. Les premiers « Audio-Animatronics » de Disney montrés au public sont ceux de l’Enchanted Tiki Room, ouverte à Disneyland en juin 1963. Les animatroniques vont de figures simples qui répètent le même mouvement à des robots complexes, avec expressions du visage et mouvements de tout le corps. Le chaman Na’vi de Pandora (Walt Disney World) et les dinosaures de l’attraction Jurassic World (Universal) en sont des exemples récents.',
    aliases: ['Animatroniques'],
    alternateNames: ['Audio-Animatronics', 'Personnage robotisé'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'Prévision IA',
    shortDefinition:
      'Des prévisions d’affluence et de temps d’attente calculées par machine learning, aussi loin que le parc a publié ses horaires.',
    definition:
      'Sur park.fan, une prévision IA est une prévision faite par Fancast, le modèle de machine learning que park.fan entraîne sur ses propres mesures. Pour chaque attraction et chaque heure d’un jour à venir, il calcule l’attente prévue, et en déduit le niveau d’affluence du jour.\n\nLes données d’entraînement sont les temps d’attente que park.fan a enregistrés dans plus de 200 parcs. À cet historique, le modèle ajoute les prévisions météo, les vacances scolaires, les jours fériés et les ponts, et les événements du parc, comme les soirées d’Halloween ou le jour d’ouverture de la saison. Il est réentraîné chaque jour à 6 h UTC avec les attentes de la veille.\n\nL’horizon, c’est le planning du parc. Un parc ouvert toute l’année a des prévisions jusqu’à près d’un an à l’avance ; un parc saisonnier en a jusqu’à la fin de la saison qu’il a publiée. Chaque prévision est ensuite comparée aux attentes réellement mesurées, et l’erreur qui en ressort est publiée sur park.fan et affichée pour chaque attraction sous forme de badge de précision.',

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['Prévision IA', 'Prévisions IA'],
  },
  {
    id: 'opening-hours',
    name: 'Horaires d’ouverture',
    shortDefinition:
      'Les heures officielles d’ouverture et de fermeture d’un parc à thème ou d’une attraction, jour par jour.',
    definition:
      'Les horaires d’ouverture sont les heures auxquelles un parc accueille les visiteurs et ferme pour la journée. Les parcs les publient dans leur calendrier, en général des semaines ou des mois à l’avance, et les modifient au dernier moment pour un événement, la météo ou un problème technique. Une attraction peut ouvrir plus tard ou fermer plus tôt que le parc, et les attractions aquatiques restent souvent fermées les jours de froid.\n\npark.fan affiche les horaires publiés de chaque parc et, quand le parc les fournit, ceux de chaque attraction. Pour un parc qui ne publie pas d’horaires, park.fan affiche des heures estimées d’après l’activité mesurée dans le parc, signalées comme « Horaires reconstitués ». Dans la plupart des parcs, l’heure de fermeture est celle où les files ferment ; les attractions tournent jusqu’à ce que tous ceux qui sont déjà dans la file soient passés.\n\nLe comportement des attentes pendant la première et la dernière heure varie d’une attraction à l’autre, et la page de chaque attraction montre sa journée type heure par heure.',
    aliases: ['Horaires du Parc', 'Heures d’Ouverture'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendance',
    shortDefinition:
      'Le sens dans lequel évolue une file, d’après ses quatre derniers relevés : en hausse, en baisse ou stable.',
    definition:
      'La tendance indique si la file d’une attraction s’allonge, raccourcit ou reste stable. park.fan compare la moyenne des deux derniers relevés à celle des deux précédents et affiche l’écart, arrondi à cinq minutes près, dans une petite pastille à côté du temps d’attente : une flèche vers le haut avec +10 min, une flèche vers le bas avec −5 min, ou « Stable » quand l’écart arrondi vaut zéro.\n\nUne attraction affichée à 45 minutes et en baisse peut très bien être plus courte qu’une autre à 40 minutes et en hausse, le temps de traverser le parc. La tendance réagit vite : un seul relevé inhabituel, comme le bond qui suit la réouverture après une panne, fait bouger la flèche pendant les quelques relevés suivants.',

    relatedTermIds: ['crowd-level', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Un dark ride sans rail : les véhicules se déplacent librement, guidés par un système intégré au sol.',
    definition:
      'Un Trackless Ride est un dark ride dont les véhicules ne sont pas liés à un rail. Ils trouvent seuls leur chemin dans le bâtiment, guidés par des boucles d’induction dans le sol, un positionnement Wi-Fi ou des systèmes optiques. Sans rail, les scènes peuvent être plus rapprochées, un véhicule peut pivoter pour faire face à la scène du bon côté, et plusieurs véhicules peuvent occuper le même espace en même temps. Star Wars: Rise of the Resistance, à Disneyland et aux Disney’s Hollywood Studios, promène ses véhicules sans rail à travers une enfilade de salles ; Ratatouille: L’Aventure Totalement Toquée de Rémy a été le précurseur européen à Disneyland Paris, en 2014, et Symbolica est l’attraction phare d’Efteling depuis 2017. Le trackless est devenu la norme pour les grands nouveaux projets de dark ride.',
    aliases: ['Attraction Sans Rail'],

    relatedTermIds: ['animatronics', 'dark-ride', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'IA',
    shortDefinition:
      'Intelligence artificielle : les modèles de machine learning qui calculent les prévisions de fréquentation et les temps d’attente.',
    definition:
      'L’IA (intelligence artificielle) désigne les algorithmes de machine learning qui reconnaissent des motifs dans de grands jeux de données et en tirent des prédictions. park.fan utilise des modèles entraînés sur les temps d’attente relevés, les calendriers scolaires, les données météo et les annonces d’événements. Ces modèles recalculent chaque jour les prévisions de fréquentation et de temps d’attente, pour chaque parc et chaque jour dont il a déjà publié les horaires.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-forecast'],
    aliases: ['Intelligence Artificielle'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Temps d’attente en direct',
    shortDefinition:
      'Des temps d’attente tirés des systèmes du parc et actualisés toutes les cinq minutes.',
    definition:
      'Un temps d’attente en direct est l’attente que le parc affiche pour une attraction en ce moment, et non une moyenne des jours passés. Il change au fil de la journée, et quand une attraction tombe en panne, le parc la passe en « Panne » jusqu’à sa réouverture.\n\npark.fan interroge les données de file des parcs toutes les cinq minutes auprès de ThemeParks.wiki, Wartezeiten.app et Queue-Times.com. Cela couvre la file standard, la file Single Rider, les files prioritaires payantes comme le Lightning Lane et les files virtuelles, partout où un parc les publie, ainsi que le statut de chaque attraction. À côté de l’attente, sur la carte d’une attraction, une petite pastille indique si les deux derniers relevés étaient plus hauts ou plus bas que les deux précédents.\n\nUne attente en direct reste l’estimation du parc, et le temps réellement passé dans la file peut être plus long ou plus court.',
    relatedTermIds: ['crowd-forecast', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'crowd-forecast',
    name: 'Prévision de fréquentation',
    shortDefinition:
      'Une prévision, calculée par IA, de l’affluence d’un parc à thème un jour donné.',
    definition:
      'Une prévision de fréquentation dit à quel point un parc sera chargé un jour donné, et à quelles heures. Sur park.fan, elle vient de Fancast, le modèle maison, qui prévoit l’attente de chaque attraction heure par heure et en tire le niveau d’affluence du jour, sur la même échelle que le niveau en direct.\n\nLe modèle apprend de l’historique des temps d’attente mesurés dans le parc et tient compte aussi des prévisions météo, des vacances scolaires, des jours fériés et de ce qui se passe dans le parc ce jour-là, comme un événement spécial ou le début de la saison. Il est réentraîné chaque jour à 6 h UTC.\n\nLe lendemain, chaque prévision est placée à côté des attentes réellement mesurées, et l’écart entre dans l’entraînement suivant. Les chiffres d’erreur qui en résultent, l’erreur moyenne en pourcentage et le R², sont publiés sur park.fan et recalculés après chaque entraînement, y compris quand ils se dégradent. Les pages d’attractions portent un badge avec la précision des prévisions pour l’attraction.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['Prévisions de fréquentation', 'Fancast'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      'L’unité d’accélération ressentie par les passagers, en multiples de l’accélération de la pesanteur terrestre (9,81 m/s²).',
    definition:
      'La force G compare l’accélération que ressent un passager à la pesanteur terrestre normale. Les forces G positives (plus de 1G) plaquent les passagers dans leur siège dans les creux et les virages serrés. Les forces G négatives (moins de 0G) les soulèvent de leur siège : c’est l’airtime. Les forces G latérales agissent à l’horizontale et poussent les passagers sur les côtés dans les virages et les transitions.\n\nUne montagne russe enchaîne ces forces à dessein. Un creux à 4 ou 5G marque un premier drop puissant. Un bref passage à −0,5G sur une bosse d’airtime donne la sensation de flotter. La plupart des attractions restent entre 0 et 5G de forces positives soutenues, avec des pics courts. Une exposition prolongée à des G élevées peut provoquer un malaise ou un « greyout », et les tracés alternent donc les pics et les phases de récupération.',
    relatedTermIds: ['airtime', 'greyout', 'hangtime', 'inversion', 'lateral-gs', 'smoothness'],
    aliases: ['Forces G', 'G-Forces'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'Obscurcissement temporaire de la vision causé par les forces G positives qui réduisent le flux sanguin vers le cerveau.',
    definition:
      'Le greyout (ou grey-out) est un phénomène physiologique : sous de fortes G positives qui durent, le champ de vision du passager se voile de gris pendant un moment. Les G positives poussent le sang vers le bas du corps, et les yeux et le cerveau sont moins irrigués. La vision se rétrécit depuis la périphérie et devient grise. Le passager reste conscient, mais voit nettement moins bien.\n\nAu-delà du greyout, des G plus fortes ou plus longues peuvent provoquer un blackout (vision entièrement noire) ou un G-LOC (perte de conscience due aux forces G). Les montagnes russes gardent donc les pics de G courts et alternent les sections intenses avec des sections de récupération.',
    aliases: ['Greyouts', 'grey-out', 'grisé'],
    alternateNames: ['voile gris', 'perte de vision par G'],
    relatedTermIds: ['airtime', 'g-force', 'hangtime', 'lateral-gs'],
  },
  {
    id: 'grey-zone',
    name: 'Zone grise',
    shortDefinition:
      'Un élément de montagne russe à la limite de l’inversion, compté ou non selon la méthode de comptage.',
    definition:
      'La zone grise regroupe les éléments de montagne russe à la frontière entre une inversion complète et un élément qui ne retourne pas le train. Les inversions classiques, comme les loopings verticaux et les tire-bouchons, ne laissent aucun doute : le train met le passager complètement la tête en bas. Les éléments en zone grise atteignent à peine, ou pas tout à fait, les 180°, et laissent les passagers dans une position presque inversée.\n\nOn y range les virages inclinés bien au-delà de 90° et certaines variantes de wave turns. Un stall, lui, est une inversion complète. Des fabricants comme RMC et Intamin utilisent ces éléments à la place d’inversions classiques. Selon la méthode de comptage, stricte (rotations complètes seulement) ou large (toute position tête en bas), le nombre officiel d’inversions d’une même attraction peut changer.',
    aliases: ['Zones grises', 'zone-grise'],
    alternateNames: ['inversion borderline', 'quasi-inversion'],
    relatedTermIds: ['inversion', 'overbank', 'roller-coaster-element', 'stall'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Les forces latérales qui poussent les passagers sur le côté de leur siège dans les virages, les transitions et les hélices.',
    definition:
      'Les G latérales sont les forces qui poussent le passager sur le côté quand une montagne russe change de direction plus vite que son dévers ne peut l’absorber. Dans un virage bien relevé, la voie s’incline pour que la force pointe vers le bas, dans le siège ; quand le dévers est plus faible que ce que demande la vitesse, le reste pousse le passager vers l’extérieur du wagon.\n\nLes concepteurs s’en servent volontairement : c’est pour leurs latérales qu’on monte dans les virages plats et rapides d’une montagne russe en bois classique et dans les changements de direction brusques d’un tracé GCI. Les latérales indésirables viennent d’une voie usée ou d’un tracé qui change de dévers trop brutalement, et elles projettent les passagers contre la paroi du wagon ou contre le harnais. Les montagnes russes en bois y sont les plus sujettes, parce que la voie en bois bouge avec la météo et l’usage, et que leurs virages sont souvent moins relevés que sur les montagnes russes en acier.\n\nBalder à Liseberg (Intamin, 2003) est une montagne russe en bois aux latérales douces dans ses virages.',
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    aliases: ['Forces G Latérales'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Des G négatives fortes qui soulèvent d’un coup les passagers de leur siège, retenus seulement par la barre ventrale.',
    definition:
      'L’ejector airtime est la forme forte des G négatives. Sur une bosse dont le sommet est plus pointu que la trajectoire que suivrait le train en chute libre, la voie se dérobe plus vite que le passager, qui est arraché de son siège contre le harnais pendant une fraction de seconde. Le nom décrit l’impression d’être éjecté du siège.\n\nLe floater airtime en est la version douce, un soulèvement lent au-dessus d’un sommet arrondi. L’ejector demande de la vitesse et une bosse courte et raide, et les hybrides RMC, beaucoup de coasters Intamin et les montagnes russes en bois récentes sont construits autour de lui. Untamed à Walibi Holland, Wildfire à Kolmården et Steel Vengeance à Cedar Point ont de longues séquences d’ejector. C’est au dernier rang qu’il est le plus fort, et une barre trop serrée en supprime l’essentiel.',
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    aliases: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Des G négatives faibles et prolongées : les passagers flottent un instant quand le train passe le sommet d’une bosse.',
    definition:
      'Le floater airtime est la forme douce des G négatives. Sur un sommet large et arrondi, le train suit presque exactement la trajectoire d’un objet lancé en l’air, et les passagers se soulèvent légèrement de leur siège et y restent une seconde ou deux, presque en apesanteur.\n\nC’est l’airtime des hyper et giga coasters B&M, dont les grandes bosses paraboliques sont dessinées pour lui. Shambhala à PortAventura et Silver Star à Europa-Park ont de longues séquences de floater. Comme la poussée est douce, le floater se supporte tour après tour, et les passagers qui trouvent l’ejector trop fort s’y font en général. La même bosse peut donner du floater à l’avant du train et de l’ejector à l’arrière, qui passe le sommet plus vite.',
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    aliases: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'La sensation de pendre dans son harnais pendant une inversion, quand les G deviennent négatives la tête en bas.',
    definition:
      'Le hangtime, ce sont des G négatives pendant une inversion. Le train reste assez longtemps au sommet d’un élément la tête en bas pour que les passagers pendent dans leurs harnais. Dans un looping rapide, le passage à l’envers est bref. Le hangtime se produit quand le train ralentit près du sommet d’une inversion et y reste un moment. Tout le poids du corps repose alors sur le harnais d’épaules ou la barre ventrale.\n\nLe hangtime est le plus marqué sur les éléments où le train ralentit beaucoup au sommet de l’inversion. Le zero-g stall en est l’exemple type : le train reste à l’envers sur toute une section de voie. Le heartline roll de certaines attractions récentes peut aussi en produire.',
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion'],
    aliases: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Élément de montagnes russes',
    shortDefinition:
      'Une section nommée du tracé d’une montagne russe, comme un looping, une bosse d’airtime ou une inversion.',
    definition:
      'Un élément de montagnes russes est une portion du tracé qui a son propre nom. Certains sont des inversions, comme le looping vertical, le tire-bouchon ou le zero-G roll ; d’autres gardent les passagers à l’endroit, comme la bosse d’airtime, l’hélice ou l’overbank. Chacun est dessiné pour imposer une force précise au passager : des G négatives au sommet d’une bosse, des G latérales dans un virage, des G positives en bas d’un looping, ou la rotation d’un passage la tête en bas.\n\nLes noms permettent de comparer les tracés. Une montagne russe décrite comme un lift hill, une première descente, un dive loop, un camelback et une hélice est à moitié expliquée avant même qu’on y monte. Certains éléments appartiennent à un seul constructeur, comme le stall et le wave turn de Rocky Mountain Construction, et de nouveaux s’ajoutent régulièrement ; le celestial spin de Mack Rides sur Stardust Racers (2025) est parmi les plus récents.',
    relatedTermIds: ['airtime', 'first-drop', 'helix', 'inversion', 'vertical-loop'],
    aliases: ['Éléments de montagnes russes'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Première rangée',
    shortDefinition:
      'La première rangée de sièges d’un véhicule, avec la vue la plus dégagée sur le parcours.',
    definition:
      'La première rangée est celle de tête d’un train de montagnes russes : personne devant, et la voie à découvert. On y voit venir chaque descente et chaque virage, et sur un lancement on prend le vent en pleine figure.\n\nEn haut d’une descente, le wagon de tête est encore retenu par le reste du train qui monte derrière lui ; il passe donc le sommet plus lentement que tous les autres rangs, et l’airtime fort au sommet revient à l’arrière. Ce que gagne la première rangée, c’est la vue sur la descente avant que le train ne bascule.\n\nBeaucoup de parcs permettent d’attendre la première rangée devant un portillon séparé sur le quai, ce qui ajoute quelques trains à l’attente.',
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
    aliases: ['Siège avant', 'Première place'],
  },
  {
    id: 'back-row',
    name: 'Dernière rangée',
    shortDefinition:
      'La dernière rangée de sièges d’un véhicule, où l’airtime est en général le plus fort sur les tracés à bosses.',
    definition:
      'La dernière rangée est le rang de queue d’un train de montagnes russes. Quand l’avant du train passe un sommet, l’arrière est encore en train de monter ; au moment où le dernier wagon arrive en haut, le reste du train descend déjà et le tire par-dessus à pleine vitesse. La dernière rangée passe donc chaque sommet plus vite que les autres et reçoit l’ejector airtime le plus fort ; dans la première descente, elle est arrachée par-dessus le sommet pendant que la première rangée bascule en douceur.\n\nSur les coasters à airtime comme Goliath à Walibi Holland ou Shambhala à PortAventura, c’est là que l’airtime est le plus fort. Sur les montagnes russes anciennes, le dernier wagon peut aussi être le plus secoué, et la vue vers l’avant se limite aux dossiers des sièges de devant.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'front-row', 'middle-row'],
    aliases: ['Siège arrière', 'Dernière place'],
  },
  {
    id: 'middle-row',
    name: 'Rangée centrale',
    shortDefinition:
      'Les rangées du milieu d’un train de montagnes russes, entre la première et la dernière.',
    definition:
      'Les rangées centrales sont les sièges au milieu d’un train de montagnes russes, entre la première rangée, qui voit la descente arriver, et la dernière, où l’ejector airtime est le plus fort. On y voit assez le tracé à venir, l’airtime est modéré, et on n’a ni la vue de l’avant ni les forces de l’arrière. Pour les familles ou les visiteurs qui craignent l’intensité, c’est la place la plus douce.\n\nSur les montagnes russes aux fortes forces latérales, les rangées centrales sont parfois les plus comprimées.',
    relatedTermIds: ['airtime', 'back-row', 'front-row', 'ride-cart'],
    aliases: ['Siège central', 'Rangée du milieu'],
  },
  {
    id: 'ride-cart',
    name: 'Wagon',
    shortDefinition:
      'L’un des véhicules d’un train de montagnes russes, avec une ou plusieurs rangées de passagers.',
    definition:
      'Un wagon (ou voiture) est l’un des véhicules d’un train de montagnes russes : un châssis avec ses roues en dessous, une ou plusieurs rangées de sièges au-dessus, et les harnais. Plusieurs wagons attelés forment un train ; une petite montagne russe familiale peut ne rouler qu’avec un seul wagon. Chaque wagon a trois jeux de roues de chaque côté, sur le rail, dessous et contre son flanc, qui le maintiennent sur la voie malgré les G négatives et latérales.\n\nLe wagon dépend du tracé. Un inverted coaster suspend ses wagons sous la voie, un wing coaster assoit les passagers de part et d’autre du rail sans rien en dessous, un flying coaster les bascule face vers le sol, et un spinning coaster monte ses sièges sur une plaque tournante. Les constructeurs fabriquent leurs propres wagons, si bien que les sièges et les harnais d’un B&M, d’un Intamin ou d’un Mack se reconnaissent d’un parc à l’autre.',
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
    aliases: ['Voiture'],
  },
  {
    id: 'lap-bar',
    name: 'Barre ventrale',
    shortDefinition:
      'Une barre de sécurité posée en travers des cuisses, qui laisse plus de liberté de mouvement qu’un harnais d’épaules.',
    definition:
      'Une barre ventrale est une barre qui descend sur les cuisses du passager et s’y verrouille, en laissant le haut du corps libre. Sur la plupart des montagnes russes modernes, c’est une barre individuelle ou une barre en T à cliquet ou à verrouillage hydraulique, souvent doublée d’une ceinture comme seconde sécurité indépendante.\n\nC’est le harnais habituel des hyper et giga coasters, de la plupart des montagnes russes en bois et de beaucoup d’attractions familiales, parce qu’il laisse le passager se soulever de son siège au sommet d’une bosse jusqu’à ce que la barre l’arrête. C’est à ce moment qu’on sent l’airtime, et la hauteur dont on peut se soulever dépend de la position de la barre au départ de la gare ; un opérateur qui l’enfonce trop supprime l’airtime, ce que les passagers appellent le stapling.\n\nL’ajustement dépend de la morphologie. Une barre posée sur les cuisses d’un passager repose sur le ventre d’un autre, et beaucoup de parcs installent un siège test à l’entrée des attractions aux harnais serrés.',
    relatedTermIds: ['airtime', 'restraint-freedom', 'ride-cart', 'shoulder-harness'],
    aliases: ['Harnais de lap'],
  },
  {
    id: 'shoulder-harness',
    name: 'Harnais d’épaules',
    shortDefinition:
      'Un harnais qui descend par-dessus les épaules, enferme tout le torse et limite les mouvements pendant le parcours.',
    definition:
      'Un harnais d’épaules descend sur les deux épaules et se verrouille au niveau des cuisses, si bien que le haut du corps est tenu dans un cadre rembourré. Il est devenu le harnais habituel des montagnes russes en acier à loopings dans les années 1980 et 1990, et il reste la norme sur la plupart des inverted coasters et sur beaucoup de suspended coasters familiaux.\n\nLe harnais tient les épaules en plus des hanches, ce qui compte quand un train reste lentement la tête en bas ou change brutalement de direction. Le prix se paie à la tête : sur une voie qui secoue, le rembourrage cogne contre les oreilles, et sur les bosses d’airtime les passagers ne peuvent pas beaucoup se soulever, parce que le harnais les arrête plus tôt qu’une barre ventrale. Les modèles récents remplacent les arceaux rigides par des gilets plus souples, et Rocky Mountain Construction fait passer les passagers la tête en bas avec une simple barre ventrale.',
    relatedTermIds: ['airtime', 'lap-bar', 'restraint-freedom', 'ride-cart'],
    aliases: ['Harnais OTS'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Souvenir',
    shortDefinition:
      'Un petit objet acheté dans un parc à thème pour garder la trace d’une visite.',
    definition:
      'Un souvenir est un objet acheté dans un parc pour se rappeler la visite : un t-shirt ou une casquette au logo du parc, un pin’s, une carte postale, une peluche de la mascotte, une maquette d’attraction. La plupart se vendent dans les boutiques à la sortie du parc et à la sortie des grandes attractions.\n\nLes prix sont nettement au-dessus de ceux d’articles comparables dans un magasin ordinaire, et les articles liés à un parc ou à une attraction ne sont vendus que là. La photo prise pendant le parcours est un souvenir à part : un appareil placé dans la descente la prend, et elle est vendue au comptoir de sortie, imprimée ou en téléchargement. Collectionner a aussi ses adeptes ; l’exemple le plus connu est l’échange de pin’s dans les parcs Disney.',
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
    aliases: ['Mémento'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Les produits officiels vendus par un parc à thème : vêtements, objets de collection, articles thématiques.',
    definition:
      'La merchandise, ou les produits dérivés, c’est tout ce qu’un parc vend en dehors de la nourriture, des boissons et des billets : vêtements au logo du parc ou d’une attraction, peluches, pin’s, mugs, jouets liés à un film ou à une mascotte, et articles thématiques propres à une zone ou à une attraction. Les grands parcs la vendent dans des dizaines de points de vente, des chariots dans les allées aux grandes boutiques de l’entrée principale, qui restent ouvertes après la fermeture des attractions.\n\nDans les parcs Disney et Universal, les films sous licence fournissent une grande partie de la gamme, et une zone construite autour d’un film en vend les accessoires : des baguettes chez Ollivanders dans The Wizarding World of Harry Potter, des sabres laser assemblés au Savi’s Workshop de Galaxy’s Edge. Les parcs qui ont leurs propres personnages vendent ceux-là, comme Europa-Park avec Ed Euromaus ou Efteling avec les personnages de ses contes. Une nouvelle attraction ouvre en général avec sa propre gamme.',
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
  },
  {
    id: 'gift-shop',
    name: 'Boutique de souvenirs',
    shortDefinition:
      'Un magasin dans un parc à thème qui vend des souvenirs, des produits dérivés et des articles thématiques.',
    definition:
      'Une boutique de souvenirs est un magasin installé dans un parc, dans un hôtel du resort ou à la sortie d’une attraction, qui vend des souvenirs et des produits dérivés. Les grands parcs en exploitent des dizaines, du petit kiosque au bâtiment de la taille d’un grand magasin à l’entrée principale : c’est le dernier endroit devant lequel passent les visiteurs en partant, et il reste ouvert après la fermeture des attractions.\n\nBeaucoup d’attractions se terminent dans leur propre boutique, et le chemin de sortie la traverse : en descendant de l’attraction, on longe les rayons de t-shirts, de peluches et de photos de cette attraction avant de retrouver l’air libre. Ces boutiques sont thématisées comme l’attraction et proposent une gamme plus restreinte que les grands magasins du parc.',
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
  },
  {
    id: 'park-exclusive',
    name: 'Exclusivité du parc',
    shortDefinition:
      'Un produit vendu uniquement dans un parc à thème donné ou dans son groupe de parcs.',
    definition:
      'Une exclusivité du parc est un article vendu dans un seul parc, ou dans un seul groupe de parcs, et pas dans les boutiques ordinaires de la marque. Ce sont typiquement des t-shirts et des pin’s au logo d’une attraction, des peluches de la mascotte du parc, des articles pour un anniversaire ou une nouvelle attraction, et des collections saisonnières pour Halloween ou Noël.\n\nLes exclusivités sont en général signalées comme telles sur l’étiquette. Les séries limitées s’épuisent, et les pièces les plus rares réapparaissent sur les plateformes de revente au-dessus du prix boutique. Les parcs Disney sortent des pin’s en édition limitée et numérotée, pour lesquels les collectionneurs font la queue le jour de la sortie.\n\nPlusieurs parcs vendent désormais une partie de leur gamme dans leur propre boutique en ligne, et le terme en devient plus flou : un article peut être exclusif au sens où aucun autre revendeur ne le propose, et se commander quand même depuis chez soi.',
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
    aliases: ['Exclusif', 'Article exclusif au parc'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Une montagne russe où les passagers sont allongés face vers le sol.',
    definition:
      'Un flying coaster place les passagers à l’horizontale sous la voie, face vers le sol, dans la position de quelqu’un qui vole. On embarque assis bien droit, dans des sièges suspendus sous le rail. Une fois les harnais verrouillés, les sièges basculent vers l’arrière jusqu’à ce que les passagers soient allongés sur le dos, le regard vers le ciel, et le train monte ainsi le lift hill. Au sommet, une vrille de la voie le retourne, et le reste du parcours se fait sur le ventre.\n\nLe Flyer de B&M est la version la plus connue. Galactica à Alton Towers a ouvert en 2002 sous le nom d’Air, premier Flyer de B&M ; Tatsu à Six Flags Magic Mountain (2006) et Manta à SeaWorld Orlando (2009) ont suivi. L’élément propre au Flyer de B&M est le pretzel loop : le train plonge par le haut dans un looping dont les passagers passent le bas allongés sur le dos, plaqués dans leur siège.\n\nL’embarquement prend plus de temps que sur une montagne russe assise, parce que les sièges doivent basculer avant chaque départ et revenir après chaque arrivée.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    aliases: ['coaster volant'],
  },
  {
    id: 'mine-train',
    name: 'Train de Mine',
    shortDefinition: 'Une montagne russe familiale en acier, sur le thème d’un train de mine.',
    definition:
      'Un train de mine est une montagne russe familiale en acier déguisée en train de minerai fou, dans une ville minière ou un canyon désertique. Une locomotive ouvre le train, et la voie reste basse et serpente entre les rochers, les tunnels et les bâtiments en ruine. L’attraction vit de virages vifs et de courtes descentes au ras des décors, et la hauteur y compte peu. Plusieurs lift hills la découpent souvent en sections, chacune avec sa propre scène.\n\nArrow Development a construit les premiers dans les années 1960. Run-A-Way Mine Train à Six Flags Over Texas (1966) est l’un des plus anciens, et Arrow en a construit seize jusqu’en 1997. Big Thunder Mountain Railroad a ouvert à Disneyland en 1979. La version de Disneyland Paris (1992) se dresse sur une île au milieu des Rivers of the Far West, reliée à la rive par un tunnel sous l’eau, et accepte les passagers à partir de 102 cm. Colorado Adventure à Phantasialand (Vekoma, 1996) loge un long tracé sur un petit terrain.',
    relatedTermIds: ['powered-coaster', 'steel-coaster', 'themed-land'],
    aliases: ['wagonnet de mine'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Une montagne russe construite pour suivre le relief naturel.',
    definition:
      'Un terrain coaster suit le sol sur lequel il est construit. Au lieu de poser tout le tracé sur une structure en acier ou en bois, le concepteur fait courir la voie le long d’une pente, dans des ravins et à travers les bois, si bien qu’une partie de la hauteur vient du relief et que la structure reste basse. Avec les arbres et les rochers à quelques mètres des rails, l’attraction paraît plus rapide que ce qu’indique le compteur.\n\nThe Beast à Kings Island (1979) est l’exemple classique en bois, un long parcours dans une forêt presque entièrement hors de vue du parc. Ravine Flyer II à Waldameer (2008) franchit une route sur un pont et plonge dans un ravin. En Europe, Lisebergbanan à Göteborg (1987) suit la colline escarpée sur laquelle le parc est construit. Anton Schwarzkopf et Werner Stengel l’ont conçue, et leur plan gardait la voie plus près du sol qu’un projet concurrent de Vekoma, si bien qu’il a fallu abattre moins d’arbres.',
    relatedTermIds: ['airtime', 'alpine-coaster', 'steel-coaster', 'wooden-coaster'],
    aliases: ['coaster de terrain', 'coaster rasant'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition:
      'Une montagne russe en acier dont le plancher s’escamote : les pieds pendent dans le vide.',
    definition:
      'Un floorless coaster est une montagne russe assise en acier dont les wagons n’ont pas de plancher. Les sièges reposent sur un châssis au-dessus de la voie, et la gare a son propre plancher, sur lequel les passagers se tiennent pour embarquer. Une fois tous les harnais verrouillés, ce plancher se replie ou s’abaisse, et le train part les jambes ballantes, à faible hauteur au-dessus des rails. La voie passe en dessous, comme sur toute montagne russe assise, si bien que la vue et les inversions sont celles d’un coaster à loopings, avec le vide sous les pieds.\n\nB&M a construit le premier, Medusa à Six Flags Great Adventure, ouvert en avril 1999, et quatre autres ont suivi l’année suivante, dont Kraken à SeaWorld Orlando. En Europe, Superman la Atracción de Acero au Parque Warner Madrid (2002) en est un. Cedar Point a transformé en 2015 son stand-up coaster Mantis (1996) en floorless, Rougarou, sur la même voie avec de nouveaux trains.',
    relatedTermIds: [
      'b-and-m',
      'dive-coaster',
      'inverted-coaster',
      'stand-up-coaster',
      'steel-coaster',
    ],
    aliases: ['coaster sans plancher'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: 'Fabricant américain à l’origine de la première inversion moderne.',
    definition:
      'Arrow Dynamics (fondé en 1946 sous le nom d’Arrow Development, renommé en 1986) est un fabricant américain qui a introduit la voie tubulaire en acier moderne et la première inversion moderne, sur Corkscrew (Knott’s Berry Farm, 1975). Arrow a construit beaucoup de corkscrews et de suspended looping coasters. L’entreprise a déposé le bilan en 2001, et S&S a racheté ses actifs.',
    relatedTermIds: ['corkscrew', 'rattle', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Fabricant américain de montagnes russes en bois qui construit des tracés rapides et sinueux.',
    definition:
      'Great Coasters International (GCI) est un constructeur de montagnes russes en bois basé à Sunbury, en Pennsylvanie, fondé en 1994 par Clair Hain Jr. et Mike Boodley, qui avaient travaillé ensemble chez Custom Coasters International. Les tracés GCI passent de nombreuses fois au-dessus et en dessous d’eux-mêmes sur un terrain compact, avec des changements de direction rapides et de l’airtime au sommet des bosses.\n\nL’entreprise construit ses propres trains, les Millennium Flyer, faits de wagons courts et articulés, pour que le train prenne les virages serrés plus en douceur que les longs trains rigides des anciennes montagnes russes en bois. Aux États-Unis, Thunderhead à Dollywood (2004) et Mystic Timbers à Kings Island (2017) sont des GCI. Troy à Toverland (2007) est le deuxième coaster européen de l’entreprise, après Thunderbird en Finlande ; Joris en de Draak à Efteling (2010) est un racing coaster à deux voies, et Wodan Timburcoaster a ouvert à Europa-Park en 2012.',
    relatedTermIds: ['airtime', 'cci', 'rmc', 'terrain-coaster', 'wooden-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster', 'Millennium Flyer'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Fabricant américain spécialisé dans les coasters à lancement LSM/LIM. En Europe, on le connaît surtout pour la gamme Sky Scream.',
    definition:
      'Premier Rides (fondé en 1995 à Baltimore, dans le Maryland) est un fabricant américain spécialisé dans les lancements par moteur synchrone linéaire (LSM) et par moteur à induction linéaire (LIM). Son Sky Rocket II, un launch coaster compact avec une inversion, a été installé dans des parcs de taille moyenne partout dans le monde.\n\nEn Europe, l’attraction Premier Rides la plus connue est Sky Scream au Holiday Park (Haßloch, Allemagne), un Sky Rocket II dont la seule inversion est un heartline roll.',
    relatedTermIds: ['gerstlauer', 'intamin', 'launch-coaster'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Fabricant munichois de spinning coasters à trick track, de la plateforme X-Car et du Sky Loop vertical.',
    definition:
      'Maurer Rides (Maurer AG, dans la construction métallique depuis 1876 et les attractions depuis 1993) est un fabricant installé à Munich. Ses spinning coasters de la série SC ont un trick track, une section où le wagon s’incline sur le côté. La plateforme X-Car permet des tracés compacts sur mesure, avec lancements et inversions.\n\nLe Sky Loop est un looping vertical isolé, installé dans de nombreux parcs européens. À Phantasialand (Allemagne), Winja’s Fear et Winja’s Force sont des spinning coasters couverts de Maurer avec trick track.',
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['gerstlauer', 'launch-coaster', 'spinning-coaster', 'xtreme-spinning-coaster'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Fabricant italien au très large catalogue de coasters familiaux et de manèges : plus de 350 coasters installés.',
    definition:
      'Zamperla (fondé en 1966 à Altavilla Vicentina, en Italie) est l’un des fabricants d’attractions qui ont produit le plus d’unités au monde. Là où Intamin, B&M et Mack visent les grandes installations, Zamperla mise sur le volume et l’accessibilité. Ses Family Coaster, Mini Coaster, Twister et Disk’O Coaster se retrouvent dans beaucoup de parcs de taille moyenne et de complexes touristiques.\n\nComme ses attractions prennent peu de place et demandent une taille minimale basse, on en trouve beaucoup dans les parcs urbains européens, les complexes hôteliers et les parcs couverts. Zamperla a aussi construit Thunderbolt à Coney Island (New York).',
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition:
      'Fabricant allemand d’attractions foraines, fondé en 1919 à Brême : Top Spin, Break Dance, Enterprise, Ranger et Condor.',
    definition:
      'Huss est un fabricant allemand d’attractions foraines, fondé en 1919 à Brême, qui construit des manèges depuis 1969. Après sa faillite de 2006, l’activité a continué sous le nom de HUSS Park Attractions GmbH. Ses flat rides tournent dans des parcs d’attractions et des fêtes foraines du monde entier.\n\nLes modèles Huss les plus connus sont le Top Spin, le Break Dance (des voitures qui tournent sur un plateau tournant), l’Enterprise (une roue centrifuge à nacelles), le Ranger (un pendule à looping avec nacelle en cage), le Condor (une tour de chaises tournante) et la Troïka. Beaucoup ont été copiés par d’autres fabricants. Les parcs européens en ont installé un grand nombre dans les années 1980 et 1990.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'pendulum-ride', 'top-spin'],
    aliases: ['Huss', 'Huss Park Attractions'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Fabricant américain des tours à propulsion pneumatique, du compact El Loco et des coasters Free Fly 4D.',
    definition:
      'S&S Worldwide (fondé en 1994 à Logan, dans l’Utah, racheté par Sansei Technologies en 2012) a d’abord construit des tours de chute pneumatiques, les Space Shot et Turbo Drop, avant d’élargir sa gamme. L’El Loco est un coaster compact avec une première descente au-delà de la verticale et une inversion, sur un terrain réduit. Le Free Fly est un coaster 4D dont les sièges pivotent librement.\n\nS&S a aussi racheté les actifs d’Arrow Dynamics après sa faillite en 2001. En Europe, il y a moins d’installations S&S qu’en Amérique du Nord.',
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei', 'S&S – Sansei Technologies'],
    relatedTermIds: ['arrow-dynamics', 'gerstlauer', 'launch-coaster'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Fabricant bavarois de coasters familiaux, avec plus de 190 installations dans le monde.',
    definition:
      'Zierer (fondé en 1930 à Deggendorf, en Bavière) est un fabricant allemand de montagnes russes familiales et d’attractions de parc classiques. Sa gamme Force Coaster va des modèles juniors compacts aux Force Custom, plus rapides. Les coasters Zierer ont une voie tubulaire en acier, roulent sans à-coups et demandent une taille minimale modérée.\n\nAvec plus de 190 montagnes russes livrées dans le monde, Zierer compte parmi les constructeurs européens les plus productifs. Feuerdrache au Legoland Deutschland en est un, et on trouve des coasters familiaux Zierer dans des parcs allemands, néerlandais et scandinaves.',
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'gerstlauer', 'mack-rides'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition:
      'Inversion où le train reste brièvement suspendu tête en bas à vitesse quasi nulle.',
    definition:
      'Un stall (ou zero-G stall) est un élément où le train entre dans une inversion par le haut et ralentit presque jusqu’à l’arrêt, les passagers la tête en bas. Rocky Mountain Construction (RMC) l’a mis au point, et il donne un long hangtime. Zadra (Energylandia) et Steel Vengeance (Cedar Point) en ont un.',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'zero-g-roll'],
    aliases: ['élément hangtime'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition:
      'Un changement de direction très incliné, avec un moment d’airtime fort au milieu du virage.',
    definition:
      'Un wave turn est une bosse d’airtime couchée sur le côté. La voie monte et descend comme un camelback tout en étant inclinée à environ 90 degrés, si bien que, vue d’en haut, c’est un virage. Dans le siège, la poussée vient à la fois vers le haut et sur le côté : les passagers sont projetés vers l’extérieur du virage et hors de leur siège au même instant, et la barre les retient dans les deux directions.\n\nC’est Rocky Mountain Construction qui a donné son nom à l’élément. Outlaw Run à Silver Dollar City (2013) et Lightning Rod à Dollywood (2016) ont des wave turns, et d’autres constructeurs l’ont repris depuis : B&M sur Orion à Kings Island (2020), Intamin sur Toutatis au Parc Astérix (2023) et Mack Rides sur Voltron Nevera à Europa-Park (2024).\n\nUn overbank s’incline au-delà de 90 degrés et se vit plaqué dans le siège ; le wave turn reste vers 90 degrés et est dessiné pour l’airtime.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'lateral-gs', 'overbank', 'rmc', 's-hill'],
    aliases: ['virage avec airtime'],
  },
  {
    id: 'shoulder-season',
    name: 'Intersaison',
    shortDefinition: 'Période entre haute et basse saison avec une fréquentation modérée.',
    definition:
      'L’intersaison, ce sont les périodes de transition entre la haute saison et les périodes les plus calmes d’un parc. Dans les parcs européens, c’est en général le printemps (mars à mai) et le début de l’automne (septembre et octobre). La fréquentation est modérée, les prix souvent plus bas, et la plupart des attractions sont ouvertes.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'school-holiday'],
    aliases: ['hors saison', 'basse saison', 'période calme'],
  },
  {
    id: 'school-holiday',
    name: 'Vacances Scolaires',
    shortDefinition:
      'Les périodes de congés scolaires, qui font nettement monter la fréquentation des parcs à thème.',
    definition:
      'Les vacances scolaires sont les semaines où les écoles sont fermées : l’été, Noël et le Nouvel An, Pâques, et dans beaucoup de pays des vacances d’automne (la Toussaint en France) et des vacances d’hiver ou de carnaval. Les familles avec des enfants scolarisés ne peuvent partir qu’à ces dates, et les parcs se remplissent en conséquence.\n\nL’effet dépend de qui est en vacances. L’Allemagne échelonne ses vacances d’été par Land, si bien qu’un parc à portée de plusieurs Länder connaît un long été chargé plutôt qu’un seul pic marqué ; les Pays-Bas découpent leur été en trois régions aux dates différentes. Un parc proche d’une frontière, comme Europa-Park près de la France et de la Suisse ou Phantasialand à portée des Pays-Bas et de la Belgique, puise dans les calendriers de plusieurs pays, et une semaine calme dans un pays peut être pleine dans le pays voisin.\n\nLa prévision de park.fan tient compte des vacances scolaires, et la page « Meilleure période » de chaque parc montre mois par mois de combien elles augmentent l’affluence.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'shoulder-season'],
    aliases: ['vacances', 'grandes vacances', 'vacances de Pâques', 'vacances d’été'],
  },
  {
    id: 'photo-pass',
    name: 'Pass Photo',
    shortDefinition:
      'Un forfait qui donne toutes les photos numériques prises dans les attractions et dans le parc.',
    definition:
      'Un pass photo (ou Memory Maker) est une option payante qui donne accès en numérique à toutes les photos et vidéos prises par les photographes du parc pendant une visite : photos de manège, rencontres avec les personnages, photographes dans les allées. Il est vendu à prix forfaitaire, et une famille qui aurait acheté beaucoup de photos à l’unité peut y gagner. Memory Maker (Disney) et Photo Pass (Universal) en sont des exemples.',
    relatedTermIds: ['character-meet-and-greet', 'ride-photo', 'season-pass'],
    aliases: ['forfait photo', 'photos du parc'],
  },
  {
    id: 'accessibility-pass',
    name: 'Pass Accessibilité',
    shortDefinition:
      'Un pass qui permet aux personnes handicapées d’accéder aux attractions avec moins d’attente.',
    definition:
      'Un pass accessibilité (DAS pour Disability Access Service, carte accessibilité ou pass d’accès aux attractions) est délivré aux visiteurs qui ne peuvent pas attendre dans une file ordinaire à cause d’un handicap. En général, le titulaire et quelques accompagnants reviennent à une heure fixée au lieu d’attendre dans la file. Les conditions et les démarches varient d’un parc et d’un pays à l’autre.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['DAS', 'carte accessibilité', 'pass handicap'],
  },
  {
    id: 'motion-simulator',
    name: 'Simulateur',
    shortDefinition:
      'Une attraction qui associe une plateforme mobile à un film projeté sur écran.',
    definition:
      'Un simulateur installe les passagers dans une cabine ou sur une plateforme qui bouge en même temps qu’un film. La plateforme repose sur des vérins hydrauliques ou électriques, le plus souvent six, qui l’inclinent, la soulèvent et la font pivoter sur une faible amplitude pendant que l’écran montre un mouvement bien plus ample. Le corps prend l’inclinaison de la cabine pour une accélération, et les yeux font le reste. Il n’y a pas de voie, et la cabine ne va nulle part.\n\nStar Tours a ouvert à Disneyland en janvier 1987 avec des cabines construites par Rediffusion Simulation, une entreprise britannique qui fabriquait des simulateurs de vol pour la formation des pilotes ; la version de Disneyland Paris a suivi en 1992. Depuis 2011, le film de Star Tours est assemblé à partir de séquences tirées au hasard, si bien que deux tours d’affilée sont rarement identiques. Les flying theatres comme Voletarium à Europa-Park (2017) sont une branche plus récente de la même idée, avec des rangées de sièges soulevées devant un écran en dôme.\n\nLes simulateurs font passer beaucoup de monde pour la place qu’ils occupent, et un nouveau film renouvelle l’attraction. Le mal des transports qu’on y ressent vient du décalage entre ce que voient les yeux et ce que perçoit l’oreille interne.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'trackless-ride'],
    aliases: ['simulateur de vol', 'attraction 4D', 'cinéma dynamique'],
  },
  {
    id: 'character-meet-and-greet',
    name: 'Rencontre avec les Personnages',
    shortDefinition:
      'Un moment programmé pour rencontrer en personne un personnage costumé du parc.',
    definition:
      'Une rencontre avec les personnages se tient à un endroit et à une heure fixés : un personnage costumé y accueille les visiteurs une famille après l’autre, pour une photo, un petit échange et un autographe. Certains personnages ont leur propre bâtiment, avec une file et un temps d’attente affiché ; d’autres apparaissent à un emplacement signalé, selon un horaire publié dans l’application ou le programme du parc. Un photographe est en général présent, et les photos sont vendues ensuite ou comprises dans un pass photo.\n\nDans les parcs Disney et Universal, les personnages viennent des films. Les parcs européens ont les leurs ou ceux dont ils ont la licence : Europa-Park a ses mascottes Ed Euromaus et Edda Euromausi, Efteling ses bouffons Pardoes et Pardijn, et Plopsaland De Panne les personnages de Studio 100 comme Maya l’abeille et Plop le lutin. Les familles avec de jeunes enfants organisent leur journée autour des horaires.',
    relatedTermIds: ['character-dining', 'photo-pass', 'themed-land'],
    aliases: ['rencontre personnage', 'apparition personnage'],
  },
  {
    id: 'pre-show',
    name: 'Avant-Spectacle',
    shortDefinition:
      'Une salle d’attente avant l’embarquement, où une mise en scène présente l’histoire de l’attraction.',
    definition:
      'Un avant-spectacle est une salle, dans une attraction thématisée, où les visiteurs sont réunis avant le parcours principal. On leur y présente l’histoire, les consignes de sécurité ou une scène qui installe l’ambiance. L’avant-spectacle sert à la fois le récit et l’exploitation. La salle extensible du Haunted Mansion et la vidéo de sécurité de Guardians of the Galaxy – Mission: BREAKOUT! en sont des exemples.',
    relatedTermIds: ['animatronics', 'dark-ride', 'motion-simulator', 'themed-land'],
    aliases: ['pré-show', 'salle de pré-attente', 'mise en scène introductive'],
  },
  {
    id: 'flat-ride',
    name: 'Attraction à plat',
    shortDefinition: 'Une attraction au sol qui tourne, oscille ou pivote, sans voie surélevée.',
    definition:
      'Un flat ride est une attraction foraine qui fonctionne à peu près dans un plan horizontal, sans voie surélevée. Le terme couvre les manèges tournants (carrousels, tasses), les Frisbees (attractions pendulaires), les Top Spins, les manèges à chaînes (chaises volantes), les tours de chute et les plateformes tournantes.\n\nUn flat ride prend en général moins de place qu’une montagne russe, et un parc peut donc en installer dans des espaces plus petits. Beaucoup ont un débit horaire élevé, peu ou pas de taille minimale, et conviennent à un large public. Ils forment souvent l’essentiel de l’offre pour les familles et les enfants.',
    relatedTermIds: ['drop-tower', 'height-requirement', 'ride-capacity', 'swing-ride'],
    aliases: ['manège', 'attraction foraine'],
  },
  {
    id: 'water-ride',
    name: 'Attraction aquatique',
    shortDefinition:
      'Une attraction où les visiteurs avancent sur l’eau dans une embarcation et se mouillent.',
    definition:
      'Une attraction aquatique est une attraction où l’eau joue le premier rôle : soit les véhicules avancent dans un canal, soit l’eau sert d’effet. Les trois types les plus courants sont les toboggans aquatiques (des bateaux qui suivent un canal et finissent par une descente), les rapides (des bouées circulaires qui dérivent dans des rapides artificiels) et les batailles d’eau (des canons à eau entre visiteurs). Les attractions aquatiques ont en général peu de restrictions de taille et s’adressent à un public très large. Par forte chaleur, leurs files peuvent devenir très longues.',
    relatedTermIds: ['height-requirement', 'log-flume', 'ride-capacity', 'river-rapids'],
    aliases: ['attraction d’eau', 'ride aquatique'],
  },
  {
    id: 'live-show',
    name: 'Spectacle vivant',
    shortDefinition:
      'Représentation programmée mettant en scène des artistes, de la musique, des cascades ou des personnages.',
    definition:
      'Un spectacle vivant est une représentation à heure fixe, jouée par des artistes sur scène, contrairement à une attraction mécanique ou à une exposition. Il se joue dans un amphithéâtre en plein air, dans une salle fermée ou dans la rue. Le genre couvre les productions de type Broadway, les shows de cascades, les spectacles de personnages, les attractions 4D avec des parties jouées en direct et les shows laser ou pyrotechniques. Les spectacles ont des horaires fixes et une capacité limitée par représentation. Au milieu de la journée, quand l’attente aux attractions est la plus longue, un spectacle permet de faire une pause.',
    relatedTermIds: ['pre-show', 'ride-capacity', 'themed-land'],
    aliases: ['spectacle', 'show de cascades', 'animation live'],
  },
  {
    id: 'quick-service',
    name: 'Restauration Rapide',
    shortDefinition: 'Un restaurant où l’on commande au comptoir, sans service à table.',
    definition:
      'La restauration rapide, dans un parc, c’est commander au comptoir ou à une borne, payer, puis porter soi-même son plateau jusqu’à une table. Burgers, pizzas, bowls et frites remplissent les cartes, le repas est prêt quelques minutes après la commande, et il n’y a rien à réserver. C’est le type de restaurant le plus courant dans un parc à thème, et celui devant lequel se forment les files du déjeuner.\n\nLe terme « quick service » vient de Disney. Son système de restauration classe les restaurants en quick service et table service, et le Disney Dining Plan comptait les deux en crédits séparés. Ailleurs, on parle de counter service ou de self-service.\n\nLes comptoirs sont les plus chargés à midi, puis de nouveau avant un spectacle du soir. Beaucoup de parcs prennent les commandes dans leur application, ce qui déplace l’attente de la caisse au comptoir de retrait. Un food court regroupe plusieurs comptoirs de restauration rapide autour d’une même salle.',
    relatedTermIds: ['character-dining', 'table-service'],
    aliases: ['restauration en libre-service'],
  },
  {
    id: 'table-service',
    name: 'Service à Table',
    shortDefinition: 'Un restaurant avec service en salle, où il faut souvent réserver.',
    definition:
      'Un restaurant avec service à table est un restaurant assis, dans un parc ou l’un de ses hôtels, où un serveur prend la commande à table. Un repas y dure une heure ou plus et coûte nettement plus cher qu’au comptoir, et la salle offre un endroit calme, à l’abri du soleil ou de la pluie, au milieu de la journée.\n\nDans les parcs Disney, les plus demandés affichent complet, et les réservations ouvrent 60 jours à l’avance. Le Disney Dining Plan les compte comme crédits service à table, et ses restaurants « signature » pour deux. Le repas avec personnages est un repas servi à table pendant lequel des personnages costumés passent aux tables.\n\nLes parcs européens ont les leurs, des restaurants thématisés dans les zones du parc à la gastronomie des hôtels du resort. À Europa-Park, l’Ammolite, dans le phare de l’hôtel Bell Rock, a deux étoiles Michelin.',
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
    aliases: ['restaurant assis', 'restauration avec service'],
  },
  {
    id: 'character-dining',
    name: 'Repas avec personnages',
    shortDefinition:
      'Un restaurant où des personnages costumés passent aux tables pendant le repas.',
    definition:
      'Le repas avec personnages est un repas, le plus souvent un buffet ou un menu servi à table, pendant lequel des personnages costumés passent de table en table. Chacun s’arrête le temps de discuter, de poser pour une photo et de signer le carnet d’autographes, si bien qu’une famille rencontre plusieurs personnages en un seul repas sans faire la queue à une rencontre séparée pour chacun.\n\nDans les parcs Disney, ces repas sont vite complets et coûtent plus cher qu’un restaurant ordinaire du même type. Chef Mickey’s au Disney’s Contemporary Resort et Cinderella’s Royal Table, dans le château de Magic Kingdom, sont les exemples les plus connus en Floride. À Disneyland Paris, les princesses reçoivent à l’Auberge de Cendrillon, dans Fantasyland, au petit-déjeuner, au déjeuner et au dîner.\n\nEn dehors de Disney, la formule existe à plus petite échelle. Un séjour dans un hôtel d’Europa-Park peut inclure, au petit-déjeuner, la visite des mascottes du parc, Ed Euromaus et Edda Euromausi.',
    relatedTermIds: ['character-meet-and-greet', 'quick-service', 'table-service'],
    aliases: ['dîner avec personnages', 'petit-déjeuner avec personnages', 'repas personnages'],
  },
  {
    id: 'drop-tower',
    name: 'Tour de chute',
    shortDefinition: 'Une tour qui monte les visiteurs en hauteur, puis les lâche en chute libre.',
    definition:
      'Une tour de chute (ou free-fall tower) hisse les visiteurs, dans une nacelle ou sur des sièges individuels disposés autour d’une tour centrale, puis les relâche vers le sol. La descente peut être une quasi-chute libre (proche de l’apesanteur) ou une descente freinée, et elle peut être combinée avec une éjection vers le haut. Une phase de freinage progressif amortit l’arrivée en bas. Il existe des tours rotatives, des modèles qui bougent dans plusieurs directions et des versions hybrides avec éjection. Une tour de chute prend peu de place au sol. Intamin, Mondial et S&S Worldwide en fabriquent.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'intamin', 's-and-s-worldwide'],
    aliases: ['chute libre', 'tour de chute libre', 'tours de chute'],
  },
  {
    id: 'log-flume',
    name: 'Toboggan aquatique',
    shortDefinition:
      'Une attraction sur canal où des bateaux en forme de tronc suivent une piste et finissent par une grande éclaboussure.',
    definition:
      'Un toboggan aquatique (log flume ou rivière en rondins) est une attraction aquatique où les visiteurs s’installent dans des bateaux en forme de tronc d’arbre qui glissent le long d’un canal. Après des sections à plat, une descente finale en piqué les éclabousse. Les toboggans aquatiques sont apparus dans les années 1960 et se trouvent aujourd’hui dans des parcs du monde entier : ils conviennent aux familles, ont un débit modéré et sont très fréquentés en été. En Europe, la Tiroler Wildwasserbahn à Europa-Park en est un exemple, comme les nombreuses installations de type Wildwasserbahn des parcs germanophones.',
    relatedTermIds: [
      'height-requirement',
      'river-rapids',
      'splashdown',
      'water-coaster',
      'water-ride',
    ],
    aliases: ['rivière de troncs', 'descente en bûche'],
  },
  {
    id: 'river-rapids',
    name: 'Rapides',
    shortDefinition:
      'Des bouées circulaires qui dérivent dans des rapides artificiels, avec le risque d’en sortir trempé.',
    definition:
      'Dans une attraction de rapides (white-water ride), les visiteurs prennent place dans des bouées circulaires en PVC ou en polyester qui dérivent et tournent sur un canal imitant des rapides. La bouée tourne librement, et le trajet est différent à chaque fois : selon la position de chacun à chaque effet d’eau, certains passagers finissent trempés, d’autres restent presque secs. Les rapides ont en général une forte capacité horaire, conviennent aux familles et ont peu de restrictions de taille. Ils sont surtout fréquentés par forte chaleur. En Europe, on en trouve à Phantasialand (les Wildwasser), à Efteling, à Europa-Park et à Thorpe Park.',
    relatedTermIds: ['height-requirement', 'log-flume', 'water-ride'],
    aliases: ['rapides de rivière'],
  },
  {
    id: 'pendulum-ride',
    name: 'Attraction pendulaire',
    shortDefinition:
      'Un flat ride dont la nacelle se balance comme un pendule, souvent en tournant sur elle-même.',
    definition:
      'Une attraction pendulaire est un flat ride dont la nacelle est suspendue à un long bras. Le bras se balance en arcs de plus en plus larges, souvent jusqu’à une position presque verticale, pendant que la nacelle tourne sur elle-même.\n\nLe modèle le plus connu est le Frisbee de Huss : une nacelle en forme de disque qui se balance en tournant. Le KMG Afterburner et le Giant Frisbee de Huss sont d’autres attractions pendulaires répandues. On en trouve beaucoup dans les parcs d’attractions et les fêtes foraines : elles se voient de loin et prennent relativement peu de place.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'height-requirement', 'swing-ride'],
    aliases: ['Frisbee', 'Frisbees', 'attractions pendulaires'],
    alternateNames: ['manège pendulaire', 'attraction à balancement'],
  },
  {
    id: 'top-spin',
    name: 'Top Spin',
    shortDefinition:
      'Une attraction Huss où la nacelle tourne librement dans tous les sens pendant que son bâti se balance.',
    definition:
      'Le Top Spin est un modèle d’attraction de Huss Rides. Une nacelle de 40 passagers au plus est montée sur un bâti pivotant. Pendant que le bâti se balance, la nacelle peut faire des tours complets dans un sens ou dans l’autre, et l’oscillation et la rotation se mélangent de façon imprévisible. Le programme va d’un simple balancement doux à des rotations continues.\n\nLes Top Spins étaient partout dans les parcs d’attractions et les fêtes foraines des années 1990 aux années 2010. Malgré l’oscillation, le Top Spin n’est pas une attraction pendulaire : la nacelle n’est pas suspendue à un long bras, elle est tenue entre deux bras latéraux qui tournent.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['Top Spins'],
    alternateNames: ['Huss Top Spin'],
  },
  {
    id: 'break-dance',
    name: 'Break Dance',
    shortDefinition:
      'Un manège Huss : plusieurs voitures sur un grand disque tournant, chacune tournant librement sur son propre axe.',
    definition:
      'Le Break Dance est un manège de Huss Rides. De petites voitures de deux à quatre places sont disposées autour d’un grand disque tournant. Pendant que le disque tourne, chaque voiture tourne librement sur son axe, et les forces de rotation et d’inclinaison changent à chaque tour sans qu’on puisse les prévoir.\n\nÀ partir des années 1980, le Break Dance est devenu l’un des manèges les plus répandus, dans les fêtes foraines comme dans les parcs fixes. On le reconnaît à son disque illuminé et à sa musique forte. D’autres fabricants en ont fait de nombreuses variantes et copies sous d’autres noms.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Breakdance', 'Break Dancer'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    shortDefinition:
      'Un manège centrifuge : des nacelles sur un grand anneau tournant, tenues par la force centrifuge pendant que l’anneau se redresse à la verticale.',
    definition:
      'Sur une Enterprise, les nacelles sont disposées tout autour d’un grand anneau. Quand l’anneau accélère, la force centrifuge plaque les passagers dans leurs sièges. À pleine vitesse, l’anneau se redresse peu à peu jusqu’à une position presque verticale, et les passagers passent la tête en bas à chaque tour.\n\nSchwarzkopf a créé l’Enterprise en 1972, Huss Rides en a ensuite construit une version améliorée, et le manège se trouve depuis les années 1970 dans beaucoup de parcs fixes et de fêtes foraines. Redressé à la verticale, son anneau se voit de loin.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition:
      'Un pendule à looping de Huss : une nacelle fermée par une cage, au bout d’un bras, qui se balance de plus en plus haut puis fait des tours complets.',
    definition:
      'Le Ranger est le pendule à looping de Huss Rides. Une longue nacelle fermée par une cage est fixée au bout d’un bras, avec un contrepoids de l’autre côté. Le bras se balance d’avant en arrière, monte un peu plus à chaque oscillation, puis passe le sommet et enchaîne des tours complets. Les passagers, tenus par des harnais d’épaules, passent alors la tête en bas et restent suspendus dans leurs harnais quand la nacelle ralentit au sommet.\n\nUn bateau à bascule (Viking, Pirate Ship) ne se retourne jamais, le Ranger si. C’est l’un des modèles Huss les plus installés, dans les parcs fixes et les fêtes foraines d’Europe et d’ailleurs.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    alternateNames: ['Huss Ranger'],
  },
  {
    id: 'condor',
    name: 'Condor',
    shortDefinition:
      'Un manège Huss : des bras à nacelles s’écartent d’une colonne centrale pendant que le manège tourne et monte.',
    definition:
      'Le Condor est un manège de Huss Rides fait d’une haute colonne centrale et de plusieurs bras à nacelles. Pendant le tour, les bras s’écartent, les nacelles montent et toute la structure tourne. Les passagers tournent, montent et sont penchés vers l’extérieur, avec une vue sur le parc depuis une hauteur modérée.\n\nLe Condor était courant dans les parcs européens des années 1970 aux années 1990, et on en trouve encore dans beaucoup de parcs fixes. On le confond parfois avec les chaises volantes (manèges à chaînes), mais ses nacelles sont fermées, alors que les chaises volantes ont des sièges ouverts suspendus.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'swing-ride'],
  },
  {
    id: 'troika',
    name: 'Troika',
    shortDefinition:
      'Un manège Huss à trois bras tournants, chacun portant une nacelle dont les voitures tournent en même temps que la plateforme.',
    definition:
      'La Troika est un manège de Huss Rides : trois bras partent d’un moyeu central, et chacun porte une nacelle avec plusieurs voitures qui tournent. La plateforme principale tourne, les nacelles tournent aussi et les voitures pivotent : il y a plusieurs axes de rotation en même temps, et le mouvement est très imprévisible.\n\nÀ partir des années 1970, beaucoup de Troikas ont été installées dans les parcs d’attractions européens et les fêtes foraines. Ses trois bras symétriques la rendent facile à reconnaître. Les variantes et copies d’autres fabricants s’appellent parfois Trabant ou Walzer.',
    relatedTermIds: ['break-dance', 'flat-ride', 'huss-rides'],
    aliases: ['Troikas', 'Trojka'],
    alternateNames: ['Huss Troika'],
  },
  {
    id: 'swing-ride',
    name: 'Chaises volantes',
    shortDefinition:
      'Un manège tournant où des sièges suspendus à des chaînes s’écartent vers l’extérieur à mesure que la plateforme tourne.',
    definition:
      'Les chaises volantes (wave swinger ou Kettenflieger) sont des manèges tournants : des sièges suspendus à des chaînes sont accrochés à une structure centrale qui tourne. Quand la structure accélère, la force centrifuge projette les sièges vers l’extérieur et vers le haut, et les passagers volent au-dessus du sol. C’est l’une des plus anciennes attractions foraines encore en service. Il y en a de toutes les tailles, du petit manège pour enfants aux immenses tours à chaînes (starflyers) qui montent les passagers très haut. On en trouve dans presque tous les parcs d’attractions et toutes les fêtes foraines du monde.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'ride-capacity'],
    aliases: ['manège à chaînes', 'chaises tournantes', 'vagues volantes'],
  },
  {
    id: 'racing-coaster',
    name: 'Montagnes russes en course',
    shortDefinition:
      'Deux voies de montagnes russes parallèles, où les trains partent en même temps pour faire la course.',
    definition:
      'Un racing coaster (montagne russe en course) a deux parcours séparés mais symétriques, côte à côte. Les trains partent en même temps, et les passagers font la course avec l’autre train. Les voies se croisent ou se frôlent à plusieurs endroits. Certains modèles sont en ruban de Möbius : les deux parcours forment une seule boucle continue, et les passagers changent de côté d’un tour à l’autre. Le concept existe en bois comme en acier. Il y en a peu en Europe. Le plus connu est Grand National, une montagne russe en bois en ruban de Möbius au Blackpool Pleasure Beach.',
    relatedTermIds: ['credit', 'steel-coaster', 'wooden-coaster'],
    aliases: ['coaster de course'],
  },
  {
    id: 'high-five',
    name: 'High Five',
    shortDefinition:
      'Un élément où deux trains, sur des voies parallèles, se croisent à portée de main.',
    definition:
      'Un High Five est un croisement entre deux trains de montagnes russes qui roulent sur des voies distinctes mais très proches, parfois à portée de bras, au point qu’on croit à une collision. Le nom vient de l’impression que les passagers pourraient tendre la main pour « taper dans la paume » de ceux de l’autre train. Il faut synchroniser précisément les départs pour que les deux trains arrivent au point de croisement au même moment. Les wing coasters et les inverted coasters s’y prêtent bien, car leurs sièges sont en porte-à-faux et passent tout près de l’autre train. Duelling Dragons / Dragon Challenge à Universal’s Islands of Adventure en avait un. On en trouve aujourd’hui sur plusieurs wing coasters B&M dans le monde.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'wing-coaster'],
    aliases: ['quasi-collision'],
  },
  {
    id: 'dining-reservation',
    name: 'Réservation restaurant',
    shortDefinition:
      'Une réservation faite à l’avance dans un restaurant avec service à table d’un parc ou d’un resort.',
    definition:
      'Une réservation de restaurant est une table réservée à l’avance dans un restaurant avec service à table ou pour un repas avec personnages, dans un parc ou l’un de ses hôtels. Dans les parcs Disney, les restaurants les plus demandés sont souvent complets pour la journée sans réservation, et aux périodes les plus chargées on ne trouve de table nulle part sans avoir réservé.\n\nÀ Walt Disney World, les réservations ouvrent 60 jours à l’avance, et les clients des hôtels Disney peuvent à partir de cette date réserver pour tout leur séjour, ce qui leur donne jusqu’à dix jours de plus. Une carte bancaire garantit la réservation, et une absence ou une annulation après la veille est facturée par personne. Les fans de Disney appellent ces réservations des ADR, pour Advance Dining Reservations.\n\nLes parcs européens font plus simple : Europa-Park et Efteling prennent les réservations de restaurant en ligne, avec un délai plus court et, dans la plupart des restaurants, sans frais en cas d’absence.',
    relatedTermIds: ['character-dining', 'peak-day', 'table-service'],
    aliases: ['ADR', 'réservation de table', 'résa restaurant'],
  },
  {
    id: 'mobile-ordering',
    name: 'Commande mobile',
    shortDefinition:
      'Une fonction de l’appli du parc pour commander et payer son repas à l’avance, sans faire la queue au comptoir.',
    definition:
      'La commande mobile permet de choisir dans la carte d’un restaurant depuis l’application du parc, d’y payer et de récupérer son repas à un comptoir séparé quand un message annonce qu’il est prêt, sans faire la queue à la caisse. Certains systèmes demandent de choisir un créneau de retrait à l’avance ; d’autres lancent la préparation quand le visiteur signale qu’il est arrivé.\n\nDisney l’a introduite dans les restaurants à service rapide de ses parcs américains, et Universal, Six Flags, les parcs Merlin et plusieurs parcs européens ont leur propre version. Les créneaux de retrait les plus demandés autour de midi peuvent être pris dès la fin de matinée, et la file passe de la caisse au comptoir de retrait.\n\nIl faut un téléphone chargé et une connexion mobile, et le signal peut être faible dans les grands bâtiments et en bordure du parc.',
    relatedTermIds: ['dining-reservation', 'quick-service'],
    aliases: ['commande sur appli', 'commande en ligne'],
  },
  {
    id: 'food-court',
    name: 'Food court',
    shortDefinition:
      'Un grand espace de restauration qui regroupe plusieurs comptoirs de restauration rapide sous un même toit.',
    definition:
      'Un food court est une salle de restauration où plusieurs comptoirs de restauration rapide entourent un même espace de tables, chaque comptoir avec sa propre carte : pizza à l’un, burgers ou nouilles à l’autre. Un groupe peut se séparer pour commander et manger quand même ensemble, et un grand food court accueille plusieurs centaines de visiteurs à la fois.\n\nCertains sont thématisés comme la zone où ils se trouvent ; d’autres sont de simples salles près de l’entrée ou entre deux zones très fréquentées. On y commande comme dans n’importe quel restaurant à comptoir, souvent aussi par commande mobile dans l’application du parc, et sans réservation. Les prix sont ceux des autres restaurants à comptoir du parc.',
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    aliases: ['espace restauration', 'halle alimentaire', 'zone de restauration'],
  },
  {
    id: 'capacity-closure',
    name: 'Fermeture pour capacité maximale',
    shortDefinition:
      'Quand un parc n’admet plus de nouveaux visiteurs parce que sa fréquentation maximale autorisée est atteinte.',
    definition:
      'Il y a fermeture pour capacité maximale quand un parc accueille autant de visiteurs qu’il en a le droit ou les moyens, et qu’il cesse de vendre des billets journée ou de faire entrer du monde aux portes jusqu’à ce que suffisamment de visiteurs soient partis. La limite vient de l’autorisation d’exploitation et des règles de sécurité, et en pratique du nombre de personnes que peuvent absorber les allées, les toilettes et les restaurants.\n\nLes parcs s’y prennent de deux façons. Certains vendent des billets datés ou exigent une réservation pour chaque visite, si bien que la limite est atteinte sur la page de réservation des semaines à l’avance plutôt qu’aux tourniquets ; ces jours-là, les détenteurs d’un pass annuel sans réservation sont refusés eux aussi. D’autres comptent les visiteurs aux entrées et ferment les portes une heure ou deux quand le compteur atteint la limite.\n\nLes fermetures tombent chaque année aux mêmes dates : jours fériés nationaux, week-ends les plus chargés des vacances scolaires, journées d’ouverture des nouvelles attractions et soirs de feux d’artifice. Les parcs les annoncent dans leur application et sur les réseaux sociaux, en général le matin même.',
    relatedTermIds: ['crowd-level', 'peak-day', 'school-holiday', 'season-pass'],
    aliases: ['parc complet', 'parc plein', 'fermeture capacité'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'Une variante du zero-G roll avec un changement de direction : le train n’entre pas et ne sort pas de l’inversion dans le même axe.',
    definition:
      'Le zero-G winder reprend le zero-G roll, une rotation de 360 degrés sur un arc parabolique avec une quasi-apesanteur au sommet, et y ajoute un changement de direction. Dans un zero-G roll classique, le train entre et sort à peu près dans le même axe. Dans le winder, la voie tourne pendant la rotation, et le train ressort dans une direction nettement différente. L’élément enchaîne ainsi l’inversion et la transition vers la section suivante du tracé.\n\nOn trouve des zero-G winders sur des montagnes russes récentes, notamment chez Intamin et B&M. VelociCoaster à Universal’s Islands of Adventure en a un.',
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Une double inversion étirée et asymétrique : les deux inversions sont reliées par un long arc, en forme de banane.',
    definition:
      'Le banana roll est une double inversion étirée. Les deux inversions sont espacées et reliées par une large courbe, alors que celles d’un cobra roll classique sont serrées et symétriques. Vue du dessus, la voie décrit un arc régulier à travers les deux inversions, comme une banane. Réparties sur une plus longue portion de voie, les deux inversions s’enchaînent plus doucement que dans un cobra roll.\n\nLe banana roll est apparu pour la première fois en 2011 sur Takabisha, à Fuji-Q Highland au Japon, construit par Gerstlauer. S&S Worldwide a ensuite développé sa propre double inversion de ce type pour Steel Curtain à Kennywood. L’élément demande beaucoup de place sur les côtés, et on le trouve donc surtout sur de grandes installations proches du sol, où la voie peut s’écarter largement entre les deux inversions.',
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
    aliases: ['banana roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Looping Incliné',
    shortDefinition:
      'Un looping vertical penché hors de son axe : le train y entre et en sort de biais.',
    definition:
      'Un looping incliné (inclined loop ou tilted loop) est un looping vertical pivoté sur son axe, en général de 45 à 80 degrés par rapport à la direction du train. Au lieu d’y entrer et d’en sortir en ligne droite comme dans un looping classique, le train l’aborde et le quitte de biais. Vu de l’extérieur, le looping est asymétrique, et le passager ne le sent pas de la même façon.\n\nL’entrée paraît plus latérale que dans un looping classique, et en bas du cercle, le train ressort dans une autre direction que celle par laquelle il est entré. Depuis le sol, un looping incliné se reconnaît tout de suite. On en trouve sur plusieurs montagnes russes B&M et Intamin, souvent au milieu ou à la fin du tracé.',
    relatedTermIds: ['b-and-m', 'intamin', 'inversion', 'vertical-loop'],
    aliases: ['tilted loop', 'looping penché', 'looping incliné', 'inclined loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'Une double inversion Vekoma après laquelle le train ressort dans la même direction qu’à l’entrée.',
    definition:
      'Le sea serpent est une double inversion qu’on associe surtout aux montagnes russes inversées de Vekoma. Comme le cobra roll, il enchaîne deux inversions reliées par une section centrale. Mais le cobra roll fait tourner le train de 180 degrés, alors que le sea serpent le fait ressortir à peu près dans sa direction d’entrée. Les deux inversions montent et redescendent l’une après l’autre sans changer le cap du train. Vu de côté, l’élément dessine un S allongé, comme un serpent de mer qui sort de deux vagues.\n\nLe sea serpent fait partie du Suspended Looping Coaster (SLC) de Vekoma et de certaines de ses installations sur mesure. Le SLC a été produit en grand nombre pour des parcs du monde entier, et le sea serpent est donc l’une des doubles inversions les plus répandues, même si son nom est moins connu que celui du cobra roll.',
    relatedTermIds: ['batwing', 'cobra-roll', 'inversion', 'vekoma'],
    aliases: ['sea serpent', 'roll over'],
  },
  {
    id: 'cobra-loop',
    name: 'Cobra Loop',
    shortDefinition:
      'Le nom donné par Hersheypark à la première inversion de Storm Runner : une boucle dont le train ressort sur le côté au lieu de la terminer.',
    definition:
      'Un cobra loop s’élève comme une boucle verticale puis, au sommet, se vrille sur le côté au lieu de redescendre comme le ferait une boucle, et le train quitte donc l’élément dans une direction différente de celle par laquelle il est entré. Il retourne les passagers une fois.\n\nLe nom appartient à une seule attraction. Intamin a construit l’élément pour Storm Runner à Hersheypark en 2004, et le parc l’a présenté comme le premier cobra loop au monde. Géométriquement, c’est ce que d’autres constructeurs appellent un sidewinder. Là où un cobra roll enchaîne deux de ces formes et fait faire demi-tour au train, le cobra loop n’en est que la moitié.',
    relatedTermIds: ['sidewinder', 'cobra-roll', 'vertical-loop', 'inversion', 'intamin'],
    alternateNames: ['Sidewinder'],
  },
  {
    id: 'jojo-roll',
    name: 'Jojo Roll',
    shortDefinition:
      'Un tonneau heartline lent, pris dès la sortie de la gare, avant que le train n’ait rien gravi.',
    definition:
      'Un jojo roll est un tonneau heartline à 360 degrés placé immédiatement après la gare : le train se retourne à peine plus vite qu’au pas. Comme il n’y a presque pas de vitesse, les passagers pendent dans leurs harnais au lieu d’être plaqués dans le siège, à l’inverse de ce qui se passe quand la même figure est prise à pleine vitesse plus loin dans le parcours.\n\nHydra: The Revenge à Dorney Park l’a introduit en 2005. L’élément a été suggéré par le directeur de la maintenance et de la construction du parc, Joe Greene, dont il porte le nom. Copperhead Strike à Carowinds en possède également un.',
    relatedTermIds: ['heartline-roll', 'inversion', 'hangtime', 'lifthill'],
    aliases: ['Jojo Rolls', 'JoJo Roll'],
  },
  {
    id: 'flying-snake-dive',
    name: 'Flying Snake Dive',
    shortDefinition:
      'Un tonneau heartline qui enchaîne directement sur un plongeon vrillé : deux inversions qui projettent le train sur le côté.',
    definition:
      'Dans un flying snake dive, le train traverse un tonneau heartline puis, sans jamais se remettre à plat, bascule dans un plongeon vrillé qui l’envoie dans la direction opposée. Cela compte pour deux inversions, si étroitement enchaînées que l’on distingue rarement où la première s’achève et où la seconde commence.\n\nIntamin a conçu l’élément en 2005 pour Maverick à Cedar Point, mais Maverick n’en a jamais eu. Les essais ont montré qu’il soumettrait les passagers à des forces excessives : il a été supprimé et remplacé par une courbe en S avant l’ouverture en 2007. Le nom a survécu à l’installation pour laquelle il avait été dessiné. C’est sur Storm Runner à Hersheypark, construit trois ans plus tôt, que l’on en parcourt réellement un : un tonneau heartline suivi d’un demi-Immelmann qui replonge vers le ruisseau.',
    relatedTermIds: ['heartline-roll', 'dive-drop', 'immelmann', 'inversion', 'intamin'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'Un élément RMC qui fond la première descente et un barrel roll complet : les passagers passent la tête en bas pendant qu’ils descendent encore.',
    definition:
      'Le barrel roll drop est un élément de Rocky Mountain Construction qui réunit la première descente et une inversion complète en une seule séquence. En quittant le lifthill, le train fait un tonneau complet tout en descendant : les passagers sont complètement la tête en bas près du point le plus raide de la descente, puis reviennent à l’endroit en arrivant en bas, et le tracé continue.\n\nLa voie en acier I-Box de RMC a rendu l’élément possible : elle permet les rayons serrés et la géométrie en trois dimensions qu’il faut pour tourner et descendre en même temps. Une voie en bois classique ne le permet pas. Medusa Steel Coaster à Six Flags Mexico a été l’une des premières installations à en avoir un. Steel Vengeance à Cedar Point et Zadra à Energylandia en ont un aussi.',
    relatedTermIds: ['first-drop', 'hybrid-coaster', 'inversion', 'rmc', 'stall'],
    aliases: ['barrel roll drop', 'RMC barrel roll', 'barrel roll downdrop'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mid-Course Brake Run : une zone de freinage au milieu du parcours, qui peut arrêter complètement le train pour que plusieurs trains circulent en même temps.',
    definition:
      'Un mid-course brake run (MCBR) est une section de freinage placée au milieu du tracé d’une montagne russe, après les premiers grands éléments et avant la dernière partie. Un trim brake se contente de ralentir le train, qui continue aussitôt. Un MCBR est un vrai frein de bloc : il peut arrêter le train et le retenir jusqu’à ce que le bloc suivant soit libre. Plusieurs trains peuvent ainsi rouler en même temps sur le même circuit sans risque de collision, et la capacité de l’attraction augmente nettement.\n\nUn jour chargé, avec un MCBR bien réglé, le train arrêté repart presque aussitôt et les passagers remarquent à peine le ralentissement. Les jours plus calmes, avec moins de trains en circulation, l’arrêt peut durer plus longtemps. La plupart des grandes montagnes russes ont un MCBR : les inverted et floorless coasters de B&M, beaucoup d’attractions Intamin et d’autres attractions à forte capacité.',
    relatedTermIds: ['block-brake', 'brake-run', 'ride-capacity', 'stacking', 'trim-brake'],
    aliases: ['mid-course brake run', 'frein de mi-parcours', 'frein intermédiaire', 'MCBR'],
  },
  {
    id: 'interlocking-loops',
    name: 'Loopings Entrelacés',
    shortDefinition:
      'Deux loopings verticaux dont les plans se croisent, comme deux maillons d’une chaîne ou un grand chiffre huit.',
    definition:
      'Les loopings entrelacés (interlocking loops) sont deux loopings verticaux placés de façon à ce que leurs plans se croisent, en général presque à angle droit. Sous certains angles, l’un semble traverser l’autre, comme deux maillons d’une chaîne ou un immense chiffre huit. Faire se croiser deux loopings sans que les voies se touchent demande une structure complexe, et l’ensemble se voit de loin dans le parc.\n\nOn trouve des loopings entrelacés sur des montagnes russes à nombreuses inversions. L’exemple classique est Loch Ness Monster à Busch Gardens Williamsburg (Arrow, 1978).',
    relatedTermIds: ['arrow-dynamics', 'inversion', 'vertical-loop'],
    aliases: ['loopings entrelacés', 'interlocking loops', 'loops croisés'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'Le cliquet du lifthill qui empêche le train de reculer, et qui fait le clic-clac qu’on entend pendant la montée.',
    definition:
      'Un anti-rollback (parfois appelé « chien anti-rollback ») est un dispositif de sécurité mécanique installé sous le lifthill. Pendant la montée, des cliquets métalliques à ressort passent sur une rangée de dents fixées à la structure du lifthill. Si la chaîne ou le moteur lâche, les cliquets se bloquent dans les dents et retiennent le train, qui ne peut pas reculer. C’est le passage des cliquets sur les dents qui fait le clic-clac des montagnes russes traditionnelles.\n\nSur les montagnes russes récentes à lift par câble ou à propulsion LSM, les anti-rollbacks sont souvent remplacés par des freins électromagnétiques silencieux, et la montée de certaines attractions neuves est donc beaucoup plus calme.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'rollback'],
    aliases: ['anti-rollback device', 'cliquet anti-retour', 'clic-clac'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      'Des structures placées juste au-dessus de la tête des passagers au passage du train à pleine vitesse, qui donnent l’impression d’une collision.',
    definition:
      'Les head choppers (littéralement « coupe-têtes ») sont des passages voulus où la charpente, les entretoises, un tunnel ou une autre section de voie passent juste au-dessus de la tête des passagers, au moment où le train est à pleine vitesse. Les passagers ont l’impression qu’ils vont heurter l’obstacle, alors que la distance est calculée précisément et qu’il n’y a aucun danger. L’effet est le plus fort quand on ne le voit pas venir.\n\nOn trouve surtout des head choppers sur les montagnes russes en bois très compactes et sur les inverted coasters, où les trains suspendus passent plus près des supports et des sections de voie voisines.',
    relatedTermIds: ['inverted-coaster', 'roller-coaster-element', 'twister-coaster'],
    aliases: ['head chopper', 'coupe-tête', 'near miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'Un opérateur qui serre trop fort la barre ou le harnais contre un passager : c’est inconfortable, et l’airtime prévu par le tracé disparaît.',
    definition:
      'On parle de stapling quand un opérateur enfonce une barre ventrale ou un harnais d’épaules bien plus loin que la sécurité ne l’exige, jusqu’à plaquer le passager dans son siège. Le mot vient de l’anglais staple, agrafer : on se sent agrafé sur place. Sur une montagne russe à airtime, le harnais doit laisser un espace pour que les passagers se soulèvent du siège au sommet des bosses ; un passager « staplé » reste plaqué sur chaque bosse.\n\nC’est sur les montagnes russes en bois et les hybrides, où l’airtime est la raison d’y monter, que cela coûte le plus. La force avec laquelle les barres sont enfoncées varie d’un parc à l’autre, et d’un opérateur à l’autre sur le même quai. Sur la plupart des montagnes russes modernes, les passagers ferment eux-mêmes la barre et l’opérateur vérifie seulement qu’elle est verrouillée ; certains parcs font systématiquement enfoncer chaque barre d’un cran de plus.\n\nLes harnais se verrouillent par crans, et un passager ne peut pas desserrer une barre enfoncée trop loin. Elle reste où elle est jusqu’à la fin du parcours.',
    relatedTermIds: [
      'airtime',
      'ejector-airtime',
      'lap-bar',
      'restraint-freedom',
      'shoulder-harness',
    ],
    aliases: ['stapled', 'harnais trop serré', 'lap bar serré'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Quand un train perd assez de vitesse en route pour rester bloqué dans un creux de la voie, sans pouvoir finir son parcours.',
    definition:
      'Il y a valleying quand un train de montagnes russes s’arrête dans un creux de la voie parce qu’il n’a plus assez d’énergie pour franchir la bosse ou l’élément suivant. Il cale dans la montée, recule et oscille jusqu’à s’immobiliser au point le plus bas entre deux sommets. À cet endroit, il n’y a ni freins ni entraînement, et les systèmes de l’attraction ne peuvent pas faire repartir le train.\n\nL’équipe de maintenance évacue alors les passagers par une échelle ou une passerelle, puis pousse ou treuille le train par-dessus le sommet suivant, ou le tire en arrière. L’attraction reste fermée pendant des heures.\n\nLes montagnes russes sont calculées avec une marge de vitesse, et le valleying est rare. Il devient plus probable par temps froid, quand la graisse des roulements des roues se fige et que le train roule moins vite, avec un train peu chargé sur une attraction réglée pour des trains pleins, après qu’un trim brake a retiré trop de vitesse, ou sur une vieille montagne russe en bois dont la voie s’est tassée.',
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    aliases: ['valleyed', 'train bloqué', 'train immobilisé'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'Une montagne russe à petits véhicules individuels, avec des virages serrés et plats au bord de plateformes surélevées, où le véhicule semble sortir de la voie.',
    definition:
      'Un wild mouse (souris sauvage) utilise de petits véhicules de deux à quatre places au lieu de longs trains. Son tracé enchaîne des virages en épingle serrés et peu inclinés, pris tout au bord de la structure. Comme ces virages sont presque plats, contrairement aux courbes très relevées des autres montagnes russes, les passagers sont projetés sur le côté contre la paroi du véhicule. Avec l’élan, le virage semble arriver trop tard, et on a l’impression que le véhicule va quitter la voie.\n\nLes wild mouse prennent très peu de place : en superposant les étages de virages, ils font tenir beaucoup de voie sur une petite surface. Mack Rides, Maurer et Gerstlauer, entre autres, en construisent en acier. Il existe des wild mouse en bois, mais ils sont rares.',
    relatedTermIds: [
      'bobsled-coaster',
      'gerstlauer',
      'mack-rides',
      'spinning-coaster',
      'steel-coaster',
    ],
    aliases: ['wild mouse coaster', 'souris sauvage', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: 'Coaster 4D',
    shortDefinition:
      'Une montagne russe dont les sièges sont montés sur des bras qui dépassent de chaque côté du train et pivotent indépendamment de sa direction.',
    definition:
      'Sur un coaster 4D (quatrième dimension), les sièges ne sont pas fixés rigidement au train : ils sont montés sur des bras pivotants, à gauche et à droite de chaque voiture. Ils peuvent tourner vers l’avant ou vers l’arrière indépendamment de la direction du train. Soit un rail de guidage le long de la voie principale commande leur position à chaque instant du parcours, soit ils tournent librement sous l’effet de la gravité et du poids des passagers. Les passagers peuvent ainsi se retrouver face au sol pendant une descente, renversés dans un virage ou tourner sur plusieurs axes à la fois pendant les inversions.\n\nArrow Dynamics a mis au point le concept, et S&S Worldwide l’a perfectionné. X2, à Six Flags Magic Mountain en Californie, a ouvert en 2002 comme premier coaster 4D au monde. Sur Eejanaika, à Fuji-Q Highland au Japon, la rotation des sièges ajoute des inversions au décompte.',
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
      'Un tracé qui part en ligne droite depuis la gare, fait demi-tour au bout du terrain et revient en parallèle.',
    definition:
      'L’out-and-back est l’un des deux grands types de tracé de montagnes russes. Le train quitte la gare, part à peu près en ligne droite, en général sur une série de bosses dessinées pour l’airtime, fait demi-tour au bout du terrain et revient par un chemin semblable, à peu près parallèle à l’aller. Les deux branches se croisent rarement, et l’emprise au sol est longue et étroite, contrairement au tracé plus compact du twister.\n\nLe tracé out-and-back est typique des montagnes russes en bois traditionnelles. La vitesse prise sur les grandes bosses de l’aller se dépense au retour sur des bosses plus petites qui donnent du floater airtime. Chaque bosse est dessinée pour la vitesse que le train aura en y arrivant : comme il perd de l’énergie en route, les bosses du retour sont plus basses et plus rapprochées, pour qu’il flotte encore au-dessus de chacune. The Voyage à Holiday World, Comet à The Great Escape et les différentes versions du type Racer sont des out-and-back en bois. Les montagnes russes en acier peuvent aussi suivre ce tracé, mais il y est moins courant que sur le bois.',
    relatedTermIds: ['airtime', 'airtime-hill', 'twister-coaster', 'wooden-coaster'],
    aliases: ['out and back', 'tracé out-and-back', 'aller-retour'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'Un tracé de montagne russe qui tourne, spirale et se croise lui-même, pour loger beaucoup d’éléments sur peu de place.',
    definition:
      'Un twister (ou cyclone) est un tracé où la voie tourne en spirale, revient sur elle-même et se croise plusieurs fois, au lieu de suivre les deux lignes simples d’un out-and-back. Le train passe souvent tout près d’autres sections de sa propre voie, à d’autres hauteurs et dans d’autres directions. Il y a donc beaucoup de head choppers, et la structure est très enchevêtrée.\n\nUn twister loge beaucoup de voie et de dénivelé sur une petite surface, et les parcs qui manquent de place en construisent souvent. Parmi les twisters en bois, il y a des classiques comme le Twister de Gröna Lund à Stockholm. B&M et Intamin ont construit de nombreux twisters en acier.',
    relatedTermIds: ['head-choppers', 'helix', 'out-and-back', 'wooden-coaster'],
    aliases: ['twister layout', 'cyclone', 'tracé twister'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error : l’écart moyen, en minutes, entre le temps d’attente prévu et le temps réel.',
    definition:
      'Le MAE (Mean Absolute Error, erreur absolue moyenne) est la mesure de précision de référence de park.fan. C’est l’écart moyen, en minutes, entre chaque temps d’attente prévu et le temps réellement relevé à l’attraction. Un MAE de 8 minutes veut dire que les prévisions tombent en moyenne à 8 minutes de la réalité.\n\nLe MAE compte toutes les erreurs de la même façon : une erreur de 5 minutes et une de 15 minutes entrent dans la moyenne sans pondération. Il se lit donc facilement : MAE = 10 veut dire « les prévisions tombent en général à 10 minutes près ». Plus le MAE est bas, plus les prévisions sont précises.',
    relatedTermIds: ['ai-forecast', 'mape', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error : proche du MAE, mais les grosses erreurs de prévision y pèsent plus.',
    definition:
      'Le RMSE (Root Mean Square Error, racine de l’erreur quadratique moyenne) mesure la précision en élevant chaque erreur au carré avant d’en faire la moyenne. Une grosse erreur, par exemple une file prévue avec 40 minutes d’écart, pèse donc beaucoup plus dans le RMSE qu’une erreur de 5 minutes. Le RMSE est toujours supérieur ou égal au MAE.\n\nUn grand écart entre RMSE et MAE veut dire que le modèle fait parfois de grosses erreurs isolées, même si la plupart des prévisions sont proches. Les deux mesures sont affichées en direct sur la page d’accueil de park.fan.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'r-squared'],
    aliases: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      'Mean Absolute Percentage Error : l’erreur de prédiction exprimée en pourcentage du temps d’attente réel.',
    definition:
      'Le MAPE (Mean Absolute Percentage Error, erreur absolue moyenne en pourcentage) exprime la précision en pourcentage et non en minutes : au lieu de « 8 minutes d’écart », on lit « 15 % d’écart par rapport au temps d’attente réel ». On compare ainsi plus facilement des attractions aux temps d’attente très différents : 10 minutes d’erreur pèsent beaucoup plus pour une attraction habituellement à 15 minutes que pour une attraction à 90 minutes.\n\nLe MAPE peut être trompeusement élevé quand les temps d’attente réels sont très courts. C’est pourquoi park.fan l’affiche toujours avec le MAE et le RMSE.',
    relatedTermIds: ['ai-forecast', 'mae', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'R-carré : la part des variations des temps d’attente réels que le modèle d’IA explique (de 0 à 1, plus c’est haut, mieux c’est).',
    definition:
      'Le R² (R-carré, ou coefficient de détermination) mesure la part des variations des temps d’attente réels que le modèle parvient à expliquer. Une valeur de 1,0 voudrait dire des prévisions parfaites. À 0,0, le modèle n’explique rien de plus qu’une simple moyenne. En pratique, au-dessus de 0,7, le modèle est bon, et au-dessus de 0,9, il est excellent.\n\nPour les temps d’attente, un R² élevé est difficile à atteindre, car les files dépendent de facteurs imprévisibles. Le R² affiché sur park.fan vient de la comparaison de toutes les prévisions recalculées, et il est recalculé chaque jour.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'rmse'],
    aliases: ['R-squared', 'coefficient de détermination'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Attraction saisonnière',
    shortDefinition:
      'Une attraction, un spectacle ou une animation qui ne fonctionne que certains mois de l’année, comme une patinoire en hiver ou un toboggan aquatique en été.',
    definition:
      'Une attraction saisonnière est un manège, un spectacle ou une animation que le parc ne propose qu’à une période précise de l’année. Les patinoires, les pistes de luge et les spectacles d’hiver fonctionnent en général de novembre à février, les toboggans aquatiques, les jeux d’eau et les spectacles en plein air de mai à septembre. Certaines attractions saisonnières sont liées à un événement comme Halloween ou Noël.\n\nSur park.fan, les attractions et les spectacles saisonniers sont repérés automatiquement à partir de l’historique d’exploitation. En dehors de leurs mois d’ouverture, ils sont masqués dans les onglets du parc et sur la carte, pour qu’on voie d’abord ce qui est ouvert aujourd’hui. Un badge saisonnier (Hiver, Été ou générique) apparaît sur chaque carte concernée. Hors saison, il est atténué. Un bouton de filtre dans les onglets permet d’afficher les entrées masquées.',
    relatedTermIds: ['crowd-calendar', 'offseason', 'refurbishment'],
    aliases: ['attraction temporaire', 'manège saisonnier', 'show saisonnier'],
  },
  {
    id: 'gravity-group',
    name: 'The Gravity Group',
    shortDefinition:
      'Une entreprise de conception américaine spécialisée dans les montagnes russes en bois modernes.',
    definition:
      'The Gravity Group est une société américaine d’ingénierie et de conception de montagnes russes en bois modernes. Fondée par d’anciens de Custom Coasters International (CCI), elle dessine des tracés compacts et intenses. Ses coasters roulent souvent avec des trains « Timberliner », qui passent des courbes serrées et sinueuses que les trains de montagnes russes en bois traditionnels ne peuvent pas prendre. Voyage à Holiday World, Cú Chulainn à Emerald Park et la nouvelle voie posée en 2022 sur Tonnerre 2 Zeus en sont des exemples.',
    relatedTermIds: ['cci', 'hybrid-coaster', 'rmc', 'wooden-coaster'],
    aliases: ['Gravity Group'],
  },
  {
    id: 'sally-dark-rides',
    name: 'Sally Dark Rides',
    shortDefinition: 'Un constructeur de dark rides et d’animatroniques.',
    definition:
      'Sally Dark Rides (anciennement Sally Corporation) conçoit des dark rides et des animatroniques. L’entreprise est installée en Floride et livre des attractions « clés en main » : histoire, décors, systèmes de transport et animation des personnages. Elle a construit notamment des dark rides interactifs où les visiteurs marquent des points avec des blasters, comme les différentes attractions Justice League: Battle for Metropolis et de nombreux parcours sur le thème de Scooby-Doo dans le monde.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride'],
    aliases: ['Sally Corporation'],
  },
  {
    id: 'mondial',
    name: 'Mondial',
    shortDefinition: 'Un constructeur néerlandais de grands flat rides à forte intensité.',
    definition:
      'Mondial est un constructeur néerlandais de grands flat rides à forte intensité. Ses attractions tournent souvent sur plusieurs axes à la fois. Ses modèles les plus connus sont le Top Scan, le Shake et le Turbine. On trouve des manèges Mondial dans beaucoup de grands parcs d’attractions et sur le circuit forain européen.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'top-spin'],
  },
  {
    id: 'kmg',
    name: 'KMG',
    shortDefinition: 'Un constructeur néerlandais de flat rides transportables.',
    definition:
      'KMG est une entreprise d’ingénierie néerlandaise, fondée en 1989 par Isje Kroon à Neede, qui construit des flat rides. D’abord tournée vers les fêtes foraines, elle voit aussi ses manèges installés dans des parcs à thème, parce qu’ils sont fiables et faciles à entretenir. On doit à KMG l’Afterburner (du type Frisbee) et le Freak Out. Ses manèges se montent vite et tournent sans à-coups.',
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition:
      'Une entreprise technologique qui développe des systèmes de transport et des bases de mouvement pour les attractions.',
    definition:
      'Oceaneering Entertainment Systems (OES) est une division d’Oceaneering International qui construit des systèmes techniques pour les attractions. À partir de son savoir-faire en robotique sous-marine, elle a mis au point le véhicule à base mobile de The Amazing Adventures of Spider-Man à Universal Islands of Adventure. Elle fabrique aussi des systèmes de transport sans rail (trackless) et des figures animatroniques complexes. Falcon’s Beyond a racheté cette division en mai 2025.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
    aliases: ['Oceaneering International'],
  },
  {
    id: 'etf-ride-systems',
    name: 'ETF Ride Systems',
    shortDefinition:
      'Un constructeur néerlandais spécialisé dans les systèmes de transport sans rail et multi-mouvements.',
    definition:
      'ETF Ride Systems est une entreprise néerlandaise qui construit des plateformes de transport, notamment des véhicules sans rail. Ses véhicules se guident par fil ou par positionnement local et se déplacent librement sur un sol plat. Ils peuvent ainsi suivre des trajets non linéaires et « danser » dans les scènes. Symbolica à Efteling et Ratatouille : L’Aventure Totalement Toquée de Rémy à Disneyland Paris et à Walt Disney World roulent avec des systèmes ETF.',
    relatedTermIds: ['dark-ride', 'oceaneering', 'trackless-ride'],
  },
  {
    id: 'chance-rides',
    name: 'Chance Rides',
    shortDefinition:
      'Un constructeur américain de montagnes russes, de flat rides et de systèmes de transport.',
    definition:
      'Chance Rides est un constructeur américain qui a produit des carrousels, des trains miniatures, des flat rides et des montagnes russes à grande vitesse. En rachetant les actifs de D.H. Morgan Manufacturing, il est entré sur le marché des hyper coasters. On lui doit le modèle « Hyper GT-X » et des flat rides classiques comme le Zipper et le Wipeout, et il fournit beaucoup de trams de parc et de carrousels.',
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'morgan', 'steel-coaster'],
  },
  {
    id: 'non-inverting-loop',
    name: 'Non-Inverting Loop',
    shortDefinition:
      'Un élément de montagnes russes en forme de boucle qui pivote pour que les passagers ne soient jamais totalement à l’envers.',
    definition:
      'Un non-inverting loop a la forme d’un looping vertical classique, mais la voie se tord au sommet et le train reste à l’endroit. Les passagers voient un looping et subissent de fortes G verticales sans passer la tête en bas. Maurer Rides a répandu l’élément sur ses montagnes russes X-Car (comme Hollywood Rip Ride Rockit), et d’autres constructeurs comme Mack Rides l’ont repris depuis.',
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop'],
    aliases: ['Non-Inverting Loops', 'Looping sans inversion'],
  },
  {
    id: 'pretzel-knot',
    name: 'Pretzel Knot',
    shortDefinition: 'Un grand élément en forme de bretzel où la voie se croise sur elle-même.',
    definition:
      'Un pretzel knot (nœud de bretzel) est un élément de montagnes russes dont l’entrée et la sortie se croisent et dessinent un bretzel. Il ne faut pas le confondre avec le « pretzel loop » des flying coasters. Le pretzel knot est plus rare, et on en trouve un par exemple sur Banshee à Kings Island. Il enchaîne deux inversions qui se chevauchent, un dive loop suivi d’un Immelmann, avec de fortes forces G.',
    relatedTermIds: ['corkscrew', 'inversion', 'pretzel-loop'],
    aliases: ['Pretzel Knots', 'Nœud de bretzel'],
  },
  {
    id: 'raven-turn',
    name: 'Raven Turn',
    shortDefinition:
      'Un élément des montagnes russes 4D : un demi-looping qui change l’orientation du siège.',
    definition:
      'Un raven turn est un élément typique des montagnes russes de quatrième dimension comme X2 ou Eejanaika. C’est un demi-looping, pris soit « par l’intérieur », soit « par l’extérieur ». Comme les sièges des coasters 4D tournent indépendamment de la voie, le raven turn est souvent combiné à un basculement du siège, et le passager a l’impression que le monde fait une culbute autour de lui.',
    relatedTermIds: ['fourth-dimension-coaster', 'inversion', 'wing-coaster'],
    aliases: ['Raven Turns'],
  },
  {
    id: 'dive-drop',
    name: 'Dive Drop',
    shortDefinition:
      'Une première descente de wing coaster qui commence par un tonneau au sommet du lift hill.',
    definition:
      'Un dive drop est un élément qu’on trouve presque uniquement sur les Wing Coasters B&M. Il sert de première descente : le train quitte le lift hill, pivote lentement de 180 degrés jusqu’à se retrouver à l’envers, puis plonge dans un demi-looping. Les passagers restent un bon moment la tête en bas (du « hangtime ») et voient la descente sous un autre angle, surtout depuis les sièges extérieurs.',
    relatedTermIds: ['first-drop', 'hangtime', 'inversion', 'wing-coaster'],
    aliases: ['Dive Drops'],
  },
  {
    id: 'outerbanked-turn',
    name: 'Outerbanked Turn',
    shortDefinition:
      'Un virage où la voie est inclinée vers l’extérieur par rapport à la direction du virage.',
    definition:
      'Dans un outerbanked turn, la voie est inclinée dans le sens inverse de celui qu’on attend. Au lieu de pencher « vers » l’intérieur de la courbe pour compenser les forces latérales, elle penche vers « l’extérieur », et le passager a l’impression d’être projeté hors du véhicule. On en trouve chez des constructeurs récents comme RMC et Intamin, qui l’utilisent pour mêler des forces G latérales et négatives (de l’airtime).',
    relatedTermIds: ['airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['Outerbanked Turns', 'Virage incliné vers l’extérieur'],
  },
  {
    id: 'camelback',
    name: 'Camelback',
    shortDefinition: 'Une série de bosses ou de collines dessinées pour donner de l’airtime.',
    definition:
      'Un camelback est une grande colline arrondie dans le tracé d’une montagne russe, en forme de bosse de chameau, d’où son nom. Le train la monte, passe le sommet et redescend de l’autre côté sans virage ni changement d’inclinaison. Quand le sommet est dessiné en parabole, sur la trajectoire de chute du train, les passagers se soulèvent légèrement de leur siège pendant une seconde ou deux : c’est le floater airtime. Un sommet plus pointu, pris à plus grande vitesse, fait de la même colline une bosse à ejector airtime.\n\nLes camelbacks sont la brique de base des hyper coasters out-and-back, qui en enchaînent plusieurs à l’aller et au retour. Chacun est un peu plus bas que le précédent, parce que le train perd de l’énergie en route. Silver Star à Europa-Park (B&M, 2002) enchaîne un grand camelback après sa première descente ; Magnum XL-200 à Cedar Point (Arrow, 1989) se termine par une série de petits.',
    relatedTermIds: ['airtime', 'airtime-hill', 'hyper-coaster', 'quad-down'],
    aliases: ['Camelbacks', 'Dos de chameau', 'Bosse à airtime'],
  },
  {
    id: 'zero-g-stall',
    name: 'Zero-G Stall',
    shortDefinition:
      'Une inversion où le train reste à l’envers pendant qu’il parcourt une section droite de la voie.',
    definition:
      'Dans un zero-g stall, la voie pivote de 180 degrés jusqu’à la position inversée, reste à l’envers sur une section droite ou légèrement courbe, puis pivote dans l’autre sens. Un zero-g roll tourne sans s’arrêter, alors que le stall marque une pause dans l’inversion : les passagers restent en apesanteur, suspendus dans leurs harnais. RMC l’a répandu sur ses montagnes russes hybrides et I-Box.',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'stall', 'zero-g-roll'],
    aliases: ['Zero-G Stalls'],
  },
  {
    id: 'gp',
    name: 'GP (General Public)',
    shortDefinition:
      'Le terme des passionnés pour désigner les visiteurs qui ne sont pas passionnés.',
    definition:
      'GP, pour « General Public », est un terme d’argot des passionnés de parcs d’attractions et de montagnes russes. Il désigne les visiteurs ordinaires, qui n’ont pas les mêmes connaissances techniques ni la même passion pour les manèges. On l’emploie souvent quand on parle de la façon dont les parcs vendent leurs attractions, ou de la réaction des visiteurs à l’exploitation et aux fermetures. Les parcs eux-mêmes ne l’utilisent en général pas.',
    relatedTermIds: ['credit', 'ert', 'fanboy', 'hype-train', 'mackprodukt', 'touring-plan'],
    aliases: ['General Public', 'Grand public'],
  },
  {
    id: 'strata-coaster',
    name: 'Strata Coaster',
    shortDefinition:
      'Une montagne russe dont la hauteur ou la descente dépasse 400 pieds (122 mètres).',
    definition:
      'Un strata coaster est une montagne russe haute de 400 pieds (122 mètres) ou plus. Cedar Point a créé cette catégorie pour l’ouverture de Top Thrill Dragster. Les strata coasters coûtent très cher et sont techniquement complexes, et il y en a très peu : seule une poignée a été construite, dont Kingda Ka à Six Flags Great Adventure, fermé en 2024 et démoli en 2025.',
    relatedTermIds: ['giga-coaster', 'hyper-coaster', 'launch-coaster'],
    aliases: ['Strata Coasters'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    shortDefinition: 'Le départ d’un véhicule ou d’un train depuis la gare.',
    definition:
      'Un dispatch (départ) a lieu quand les opérateurs autorisent un véhicule à partir et lancent son cycle. Des départs rapides sont indispensables pour garder une capacité élevée (en « visiteurs par heure »). Si les départs traînent, il y a du « stacking » : les trains suivants attendent hors de la gare que le précédent la libère. Les passionnés chronomètrent souvent les « temps de départ » pour juger de l’efficacité d’un parc.',
    relatedTermIds: ['queue-line', 'ride-capacity', 'stacking'],
    aliases: ['Dispatches', 'Départ', 'Envoi'],
  },
  {
    id: 'near-miss',
    name: 'Near-Miss',
    shortDefinition:
      'Un élément placé si près du parcours que le passager croit qu’il va le heurter.',
    definition:
      'Un near-miss (ou quasi-collision) est un élément de décor ou de structure placé très près du parcours de l’attraction. Les passagers restent toujours dans l’enveloppe de sécurité (clearance envelope), mais avec la vitesse et l’angle de vue, ils ont l’impression qu’ils vont heurter une poutre, un mur de tunnel ou une autre partie de la voie. Ces effets sont calculés pour que la vitesse paraisse plus grande et le danger plus proche.',
    relatedTermIds: ['clearance-envelope', 'foot-chopper', 'head-choppers'],
    aliases: ['Near-Misses', 'Collision proche'],
  },
  {
    id: 'clearance-envelope',
    name: 'Clearance Envelope',
    shortDefinition:
      'L’espace de sécurité autour d’un véhicule de manège qui doit rester libre de toute obstruction.',
    definition:
      'La clearance envelope (enveloppe de sécurité, ou de dégagement) est l’espace en trois dimensions, calculé autour d’un véhicule d’attraction, qui doit rester entièrement libre de toute structure, support ou végétation. Même les passagers les plus grands, bras ou jambes tendus, ne peuvent ainsi rien toucher à l’extérieur du véhicule. Pendant les essais, les parcs utilisent souvent des « reach envelopes », des cadres fixés au train, pour vérifier que rien n’empiète sur cette zone.',
    relatedTermIds: ['foot-chopper', 'head-choppers', 'near-miss', 'testing'],
    aliases: ['Clearance Envelopes', 'Enveloppe de sécurité'],
  },
  {
    id: 'testing',
    name: 'Essais',
    shortDefinition:
      'Les tours qu’une attraction fait à vide : avant l’ouverture, chaque matin et après chaque réparation.',
    definition:
      'Les essais couvrent tout ce qui sépare une attraction terminée d’un train chargé. Lors de la mise en service, des mannequins remplis d’eau ou des sacs de sable remplacent les passagers, le système est éprouvé sur des milliers de cycles, et les contrôles du gabarit vérifient que rien le long du parcours n’est assez proche pour qu’un bras tendu le touche.\n\nCela ne s’arrête jamais vraiment. Les parcs font tourner l’attraction à vide chaque matin avant les premiers visiteurs, et de nouveau après toute panne ou maintenance : c’est pourquoi une attraction peut être affichée ouverte sans embarquer personne. Les nouveautés s’essaient au grand jour, et les trains passent au-dessus des visiteurs des semaines avant l’ouverture. Un Soft Opening est lui-même un essai, avec de vrais passagers cette fois.',
    relatedTermIds: ['clearance-envelope', 'soft-opening', 'downtime', 'refurbishment'],
    aliases: ['Test runs', 'Test cycles'],
  },
  {
    id: 'kuka',
    name: 'KUKA',
    shortDefinition:
      'Un fabricant allemand de robots industriels dont les bras d’usine ont été adaptés au transport de passagers.',
    definition:
      'KUKA, acronyme de Keller und Knappich Augsburg, où l’entreprise a toujours son siège, fabrique les bras robotisés orange qu’on voit sur les chaînes de montage automobile. Le KR 500, un modèle lourd, a été adapté aux attractions sous le nom de RoboCoaster : une banquette de quatre places boulonnée au bout du bras, libre de tanguer, de rouler et d’emmener les passagers dans des mouvements qu’aucune voie fixe ne pourrait produire.\n\nL’installation la plus connue est Harry Potter and the Forbidden Journey, ouverte en 2010, où les banquettes RoboCoaster G2 sont montées sur des bases mobiles : les bras traversent donc les décors au lieu de jouer sur place. Sum of All Thrills à Epcot (2009-2016) inversait le principe : les visiteurs dessinaient leur propre profil de montagnes russes sur une borne, et un bras KUKA sur mesure le reproduisait ensuite.',
    relatedTermIds: ['dynamic-attractions', 'dark-ride', 'motion-simulator', 'flying-theater'],
    alternateNames: ['Keller und Knappich Augsburg'],
    aliases: ['Keller und Knappich Augsburg'],
  },
  {
    id: 'foot-chopper',
    name: 'Foot-Chopper',
    shortDefinition:
      'Un near-miss conçu pour les montagnes russes où les jambes des passagers pendent dans le vide.',
    definition:
      'Un foot-chopper est un near-miss qu’on trouve sur les montagnes russes inversées, suspendues ou sans plancher (floorless). Des supports de voie, de l’eau ou des éléments de décor sont placés près de l’endroit où passent les pieds des passagers, qui ont un instant peur de les heurter.',
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
      'Une technique qui projette de la vidéo sur des surfaces qui ne sont pas planes, comme des bâtiments ou des décors d’attraction.',
    definition:
      'Le projection mapping (ou vidéomapping) projette de la vidéo sur des objets de forme souvent irrégulière, comme des murs de château ou des décors de dark ride. Un logiciel relève la géométrie 3D de l’objet (la « cartographie »), et les projecteurs peuvent alors donner l’illusion que l’objet bouge, se transforme ou gagne en profondeur. On l’utilise beaucoup dans les spectacles nocturnes et les dark rides récents, pour animer des décors sans rien construire.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride', 'pre-show'],
    aliases: ['Video mapping', 'Vidéomapping', 'Cartographie numérique'],
  },
  {
    id: 'omnimover',
    name: 'Omnimover',
    shortDefinition:
      'Un système de transport avec une chaîne continue de véhicules qui se déplacent à une vitesse constante.',
    definition:
      'L’Omnimover est un système de transport mis au point par Disney : une chaîne continue de véhicules. Les véhicules ne s’arrêtent jamais, et la capacité est donc très élevée. Chaque véhicule peut pivoter, et les concepteurs tournent ainsi les visiteurs exactement vers la scène qu’ils doivent voir. The Haunted Mansion et Spaceship Earth en sont des exemples. D’autres constructeurs ont depuis développé des systèmes semblables.',
    relatedTermIds: ['dark-ride', 'ride-capacity', 'trackless-ride'],
    aliases: ['Omnimovers'],
  },
  {
    id: 'pepper-ghost',
    name: 'Pepper’s Ghost',
    shortDefinition:
      'Une illusion classique qui utilise une vitre et la lumière pour faire apparaître des fantômes transparents.',
    definition:
      'Le Pepper’s Ghost est une technique d’illusion théâtrale qui fait apparaître des fantômes transparents. On place une grande vitre en biais entre le public et la scène, puis on éclaire un objet dans une pièce cachée : son reflet apparaît dans la vitre, et une figure translucide semble se tenir sur la scène. La technique date du XIXe siècle. Disney l’utilise à grande échelle dans la salle de bal du Haunted Mansion.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'projection-mapping'],
    aliases: ['Pepper’s Ghost', 'Fantôme de Pepper'],
  },
  {
    id: 'dynamic-attractions',
    name: 'Dynamic Attractions',
    shortDefinition:
      'Fabricant canadien de systèmes de transport complexes, qui a intégré le « Robocoaster » à des attractions.',
    definition:
      'Dynamic Attractions construit des systèmes de transport techniquement complexes pour les attractions. Elle a intégré le RoboCoaster, un bras robotisé KUKA commercialisé par RoboCoaster Ltd, à Harry Potter and the Forbidden Journey. L’entreprise développe aussi des systèmes sur rail, des théâtres de mouvement et des éléments de structure pour de grands parcs à thème dans le monde entier.',
    relatedTermIds: ['dark-ride', 'flying-theater', 'kuka', 'motion-simulator'],
  },
  {
    id: 'flying-theater',
    name: 'Théâtre volant',
    shortDefinition:
      'Un simulateur où des sièges suspendus s’avancent devant un immense écran incurvé, comme en vol.',
    definition:
      "Dans un théâtre volant, les visiteurs sont assis sur des sièges suspendus qui bougent en même temps qu’un film projeté sur un immense écran sphérique. Les sièges « volent » souvent vers l’avant, dans l’écran. Soarin' de Disney et le Voletarium d’Europa-Park en sont des exemples.",
    relatedTermIds: ['dark-ride', 'dynamic-attractions', 'motion-simulator', 'pre-show'],
  },
  {
    id: 'shuttle-coaster',
    name: 'Shuttle coaster',
    shortDefinition:
      'Une montagne russe dont la voie ne forme pas de circuit fermé, parcourue en marche avant puis en marche arrière.',
    definition:
      'Un shuttle coaster parcourt son tracé, puis le reparcourt en marche arrière. La voie ne forme pas de circuit fermé : le train quitte la gare, monte une tour, un spike ou un looping à l’autre bout, s’arrête et repart sur les mêmes rails en traversant la gare, souvent jusqu’en haut d’une seconde tour à l’autre extrémité avant de s’immobiliser au quai. Chaque élément est parcouru deux fois, une fois face à lui et une fois sans le voir venir.\n\nLe Boomerang de Vekoma est le plus répandu. Un lift tire le train en arrière jusqu’en haut d’une tour et le lâche ; il passe un cobra roll et un looping vertical, monte la tour opposée et repasse les trois inversions à l’envers. Les quatre premiers ont ouvert en 1984 et plus de cinquante ont été construits depuis, dont Speed of Sound à Walibi Holland. Les shuttles lancés remplacent le lift par un lancement, comme Pulsar à Walibi Belgium (2016), un water coaster qui propulse son bateau en avant puis en arrière sur un spike de 45 mètres.\n\nLe tracé tient sur un terrain étroit. Avec un seul train sur une seule voie, le débit est faible et la file avance lentement.',
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
    aliases: ['Impulse Coaster'],
  },
  {
    id: 'carousel',
    name: 'Carrousel',
    shortDefinition: 'Un manège tournant classique, avec des sièges souvent en forme de chevaux.',
    definition:
      'Un carrousel, ou manège de chevaux de bois, est une plateforme ronde qui tourne autour d’un mât central, avec des sièges en forme de chevaux, d’autres animaux ou de carrosses. Sur la plupart, les chevaux sont fixés à des barres entraînées par un vilebrequin logé sous le toit, si bien qu’ils montent et descendent pendant que la plateforme tourne ; c’est ce que décrit le nom anglais gallopers. Un orgue ou un enregistrement joue pendant le tour.\n\nLe sens de rotation est une habitude nationale : les gallopers britanniques tournent en général dans le sens des aiguilles d’une montre, les carrousels nord-américains dans l’autre sens. Le plus ancien carrousel fixe encore conservé se trouve dans le Staatspark Hanau-Wilhelmsbad, près de Francfort. Construit en 1780, il a de nouveau tourné en 2016 après une restauration, pour la première fois depuis plus de soixante-dix ans.\n\nPresque chaque parc d’attractions en a un, souvent près de l’entrée. C’est l’une des rares attractions que grands-parents et tout-petits font ensemble.',
    relatedTermIds: ['flat-ride', 'themed-land'],
  },
  {
    id: 'walkthrough',
    name: 'Walkthrough',
    shortDefinition: 'Une attraction à explorer à pied à travers des environnements thématiques.',
    definition:
      'Un walkthrough est une attraction qu’on parcourt à pied, sans véhicule. Les visiteurs traversent des décors thématisés, parfois avec des éléments interactifs, des acteurs ou des effets spéciaux. Cela va du simple sentier thématique à la maison hantée élaborée ou au palais du rire.',
    relatedTermIds: ['dark-ride', 'funhouse', 'themed-land'],
  },
  {
    id: 'funhouse',
    name: 'Funhouse',
    shortDefinition:
      'Une attraction classique à parcourir à pied, pleine d’obstacles physiques et d’illusions d’optique.',
    definition:
      'Un funhouse, ou palais du rire, est un bâtiment à parcourir à pied rempli de pièges physiques : des planchers qui penchent ou qui tremblent, un tonneau tournant à traverser, des miroirs déformants, des jets d’air, des ponts branlants et des toboggans d’un étage à l’autre. Il n’y a pas de véhicule ; on avance à son rythme, et une bonne partie du plaisir consiste à perdre l’équilibre devant ceux qui suivent.\n\nLe format vient des fêtes foraines et des stations balnéaires. Le Fun House de Blackpool Pleasure Beach, un bâtiment Art déco de cinq étages dessiné par l’architecte Joseph Emberton dans les années 1930, a tenu jusqu’à l’incendie qui l’a détruit en 1991. Les palais du rire itinérants restent un classique des fêtes foraines allemandes, et beaucoup de parcs en exploitent des permanents comme attractions familiales.',
    relatedTermIds: ['flat-ride', 'walkthrough'],
  },
  {
    id: 'ferris-wheel',
    name: 'Grande roue',
    shortDefinition:
      'Une grande roue verticale qui tourne, avec des nacelles d’où l’on voit tout le parc.',
    definition:
      'Une grande roue est une immense roue verticale dont la jante porte des nacelles ou des cabines. Elle tourne assez lentement pour laisser aux passagers le temps de regarder le parc et la région alentour. Dans beaucoup de parcs et de fêtes foraines, elle sert de point de repère, en partie parce qu’on la voit depuis l’extérieur. Il y en a de toutes les tailles, de la petite roue familiale de quelques mètres de diamètre aux roues d’observation à l’échelle du London Eye.',
    relatedTermIds: ['flat-ride', 'opening-hours'],
  },
  {
    id: 'spike',
    name: 'Spike',
    shortDefinition:
      'Une section de voie verticale ou très inclinée, en cul-de-sac, au bout d’un shuttle coaster.',
    definition:
      'Un spike est une portion de voie au bout d’un shuttle coaster qui monte à la verticale ou presque et s’arrête dans le vide. Le train y monte jusqu’à ce que la gravité lui ait pris toute sa vitesse, reste un instant immobile, puis retombe en arrière sur les mêmes rails vers le reste du tracé. Certains spikes sont vrillés : le train tourne sur lui-même en montant et se déroule en redescendant, comme sur Wicked Twister à Cedar Point (Intamin, 2002).\n\nUn spike n’a besoin ni de frein ni de demi-tour, et c’est pour cela que les shuttle coasters lancés en utilisent : le lancement donne son énergie au train et le spike le renvoie. Top Thrill 2 à Cedar Point a reçu en 2024 un spike vertical de 128 mètres pour son lancement en arrière. En Europe, Pulsar à Walibi Belgium (2016) envoie son bateau en avant puis en arrière sur un spike de 45 mètres avant le splashdown.',
    relatedTermIds: ['rollback', 'shuttle-coaster', 'steel-coaster'],
  },
  {
    id: 'forced-perspective',
    name: 'Perspective forcée',
    shortDefinition:
      'Une technique de conception utilisée pour faire paraître les structures plus grandes ou plus petites qu’elles ne le sont réellement.',
    definition:
      'La perspective forcée est une illusion d’optique : les concepteurs jouent sur l’échelle et la distance apparentes des objets. En réduisant l’échelle d’un bâtiment à mesure qu’il monte, ils le font paraître beaucoup plus haut. Disney l’a utilisée pour le Château de la Belle au Bois Dormant à Disneyland, qui paraît ainsi plus grand qu’il ne l’est.',
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'show-building',
    name: 'Bâtiment d’attraction',
    shortDefinition:
      'La grande structure utilitaire qui abrite la voie et les décors d’une attraction intérieure.',
    definition:
      'Un bâtiment d’attraction (ou show building) est l’enveloppe, souvent un grand hangar, qui abrite la voie, les décors et les effets spéciaux d’une attraction intérieure ou d’un dark ride. À l’intérieur, tout est thématisé, alors qu’à l’extérieur c’est souvent un simple bâtiment fonctionnel, caché aux visiteurs par de la végétation ou des façades thématiques.',
    relatedTermIds: ['dark-ride', 'forced-perspective', 'themed-land'],
  },
  {
    id: 'practical-effects',
    name: 'Effets pratiques',
    shortDefinition:
      'Des effets spéciaux physiques produits en direct dans une attraction, et non numériquement.',
    definition:
      'Les effets pratiques sont des effets construits et déclenchés dans la salle que traverse le passager : figures animatroniques, eau, feu, brouillard, vent, objets qui tombent, décors mobiles et jeux de lumière. Les effets audiovisuels, eux, montrent l’action sur un écran ou en projection. Un effet pratique se voit en relief et à taille réelle, quel que soit l’endroit où se trouve le véhicule, ce qu’un écran ne peut imiter que depuis un seul point de vue.\n\nCertains des plus vieux trucs servent encore. Les fantômes qui dansent dans la salle de bal de la Haunted Mansion (Disneyland, 1969) sont un Pepper’s ghost, une illusion de théâtre du XIXe siècle : des figures cachées sous la ligne de regard des passagers se reflètent dans une grande vitre. Droomvlucht à Efteling (1993) fait passer les passagers devant des dizaines de fées, de trolls et d’animaux animatroniques dans des paysages sculptés.\n\nUn effet pratique en panne se voit tout de suite, une figure figée ou une fontaine à sec, et les parcs ferment l’attraction pour le réparer.',
    relatedTermIds: ['animatronics', 'dark-ride', 'projection-mapping'],
  },
  {
    id: 'chicken-exit',
    name: 'Chicken exit',
    shortDefinition:
      'Un chemin de sortie dédié pour les visiteurs qui décident de ne pas faire l’attraction juste avant l’embarquement.',
    definition:
      'Un chicken exit (littéralement « sortie de poule ») est un passage qui permet de quitter la file d’attente et de sortir de l’attraction juste avant l’embarquement. Il sert aux visiteurs qui changent d’avis sur une attraction à sensations et à ceux qui ne faisaient qu’accompagner d’autres personnes dans la file.',
    relatedTermIds: ['queue-line', 'rider-switch', 'single-rider', 'wait-time'],
  },
  {
    id: 'in-show-exit',
    name: 'Sortie en scène',
    shortDefinition:
      'Une sortie ou une évacuation d’un véhicule d’attraction à l’intérieur de la zone thématique.',
    definition:
      'Il y a sortie en scène, ou évacuation en scène, quand une attraction s’arrête et que les visiteurs doivent quitter leur véhicule à l’intérieur de l’attraction plutôt qu’au quai de débarquement. La cause est en général une panne ou un arrêt de sécurité : le système de commande stoppe tous les véhicules, une annonce enregistrée demande de rester assis, et l’éclairage de service s’allume.\n\nLe personnel fait alors sortir les passagers par les passerelles de maintenance et les couloirs techniques jusqu’à une sortie de secours, ce qui peut faire passer derrière ou au-dessus des scènes. Lumières allumées, le dark ride montre comment il est fait : les figures sont arrêtées en plein geste, et les câbles et les haut-parleurs derrière les toiles peintes sont bien visibles. Sur une montagne russe, l’équivalent est une descente à pied par l’escalier le long du lift hill.\n\nUne attraction évacuée reste fermée jusqu’à ce que le personnel l’ait vérifiée et ait fait tourner des cycles d’essai à vide, et le statut que le parc publie pour elle indique « Panne » entre-temps.',
    relatedTermIds: ['dark-ride', 'downtime', 'e-stop'],
  },
  {
    id: 'e-stop',
    name: 'Arrêt d’urgence',
    shortDefinition:
      'Un arrêt d’urgence qui stoppe immédiatement tout mouvement de l’attraction pour des raisons de sécurité.',
    definition:
      'Un E-Stop (arrêt d’urgence) est un mécanisme ou une procédure de sécurité qui coupe immédiatement l’alimentation ou applique les freins pour arrêter tout mouvement de l’attraction. Il peut être déclenché automatiquement par des capteurs ou manuellement par les opérateurs. Après un E-Stop, l’attraction doit généralement être inspectée et réinitialisée avant de reprendre le service.',
    relatedTermIds: ['block-brake', 'downtime', 'in-show-exit'],
  },
  {
    id: 'mackprodukt',
    name: 'Mackprodukt',
    shortDefinition:
      'Argot de la communauté germanophone désignant l’éloge réflexe et sans esprit critique que les fans de Mack Rides réservent à la moindre nouveauté du constructeur.',
    definition:
      'Un « Mackprodukt » (littéralement « produit Mack ») est une blague interne de la communauté germanophone des passionnés de montagnes russes, qui se moque gentiment de la loyauté fervente des fans de Mack Rides. Mack est un constructeur allemand, la famille Mack possède Europa-Park, et ses fans ont la réputation d’être fidèles : les critiques plaisantent en disant que chaque nouvelle attraction Mack est saluée comme un chef-d’œuvre avant même d’avoir été testée.\n\nLe mème repose sur une poignée de formules toutes faites censées remplacer toute véritable analyse : l’admiration pour la voie « si joliment cintrée » (« die Schiene ist so toll gebogen », « le rail est si magnifiquement courbé ») et pour les superbes trains (« wunderschöne Fahrfiguren », « de magnifiques wagons »), des compliments esthétiques qui éludent commodément la question de savoir ce que vaut réellement l’attraction. Qualifier quelque chose de « Mackprodukt », ou simplement citer ces formules, est devenu le raccourci de la communauté pour lever les yeux au ciel, avec tendresse, face à la fidélité à la marque qui l’emporte sur le fond.',
    relatedTermIds: ['credit', 'fanboy', 'gp', 'hype-train', 'mack-rides'],
    aliases: ['Mack-Produkt', 'Mackprodukte'],
  },
  {
    id: 'onride-offride',
    name: 'On-Ride / Off-Ride',
    shortDefinition:
      'Raccourci des passionnés pour des images filmées à bord d’une attraction (on-ride) par opposition à celles filmées depuis le sol (off-ride).',
    definition:
      'On-ride et off-ride désignent les deux façons dont les passionnés filment une montagne russe. Une vidéo on-ride est tournée depuis le siège d’un passager : on y voit le rythme du parcours, l’airtime et les forces. Une vidéo off-ride est filmée depuis le bord de la voie et montre le tracé, la thématisation et les trains en mouvement. Les deux mots reviennent sans cesse quand on parle de POV et de vidéos partagées en ligne. Beaucoup de parcs interdisent de filmer au téléphone pendant le parcours, et les images on-ride officielles sont donc très recherchées.',
    relatedTermIds: ['pov', 'ride-photo', 'credit'],
    aliases: ['On-Ride', 'Off-Ride', 'Onride', 'Offride'],
  },
  {
    id: 're-ride',
    name: 'Re-Ride',
    shortDefinition:
      'Rester à bord ou remonter immédiatement pour un tour supplémentaire sans quitter son siège ni refaire la file d’attente.',
    definition:
      'Il y a re-ride quand un visiteur peut rester sur une attraction, ou remonter directement en gare, pour un tour de plus sans refaire la file. C’est fréquent en fin de journée, en période creuse ou lors d’événements pour passionnés, quand la demande est faible et que les opérateurs font simplement signe de rester. Là où les re-rides sont faciles, on peut enchaîner les tours pour comparer les rangées ou refaire son coaster préféré.',
    relatedTermIds: ['credit', 'ert', 'rope-drop'],
    aliases: ['Re-Rides', 'Reride'],
  },
  {
    id: 'hype-train',
    name: 'Hype Train',
    shortDefinition:
      'La vague d’enthousiasme qui monte dans la communauté autour d’une attraction annoncée, et qui gonfle parfois les attentes au-delà du raisonnable.',
    definition:
      'Le « hype train » est la montée d’impatience qui se propage sur les forums et les réseaux sociaux dès qu’une nouvelle attraction est teasée ou annoncée. Il se nourrit des avancées du chantier, des tracés divulgués et des premières POV, et peut faire grimper les attentes très haut bien avant l’ouverture. Les passionnés plaisantent sur le fait de « monter dans le hype train », et sur l’inévitable déception quand une attraction n’est pas à la hauteur. Le concept est étroitement lié à la fidélité des fans et à des mèmes comme le Mackprodukt.',
    relatedTermIds: ['gp', 'mackprodukt', 'fanboy'],
    aliases: ['Hype', 'Hype-Train'],
  },
  {
    id: 'fanboy',
    name: 'Fanboy',
    shortDefinition:
      'Un fan dont la dévotion à un parc, un constructeur ou une attraction rend son avis positif et acritique par réflexe.',
    definition:
      'Chez les passionnés, un « fanboy » (le mot s’emploie quel que soit le genre) est quelqu’un dont l’attachement à un parc ou à un constructeur colore chacun de ses jugements : il défend et loue ses produits presque par réflexe. L’étiquette est en général collée à moitié pour rire, mais elle décrit un vrai travers du milieu, où la fidélité à une marque passe avant le jugement sur l’attraction. Le mème Mackprodukt de la communauté germanophone n’est rien d’autre que du fanboyisme devenu blague récurrente.',
    relatedTermIds: ['mackprodukt', 'hype-train', 'gp'],
    aliases: ['Fanboys', 'Fangirl'],
  },
  {
    id: 'smoothness',
    name: 'Douceur de roulement',
    shortDefinition:
      'La façon dont une montagne russe roule sans secousses, tremblements ni vibrations. Le contraire d’une attraction qui secoue.',
    definition:
      'La douceur de roulement (« smoothness » en anglais, « Laufruhe » chez les passionnés germanophones) décrit la façon dont les trains d’un coaster suivent le tracé sans coups à la tête, secousses ni vibrations. Elle dépend de la précision de fabrication de la voie, de la conception des trains et des roues, de l’âge de l’attraction et de son entretien. B&M et Mack ont la réputation de parcours « lisses comme du verre », et un coaster qui reste doux en vieillissant témoigne d’une construction soignée. Le contraire, une attraction qui secoue et vibre, s’appelle un rattle.',
    relatedTermIds: ['rattle', 'b-and-m', 'g-force'],
    aliases: ['Smoothness', 'Laufruhe'],
  },
  {
    id: 'rattle',
    name: 'Rattle',
    shortDefinition:
      'Une vibration ou un tremblement qui passe du train au passager et rend inconfortable une attraction par ailleurs bonne.',
    definition:
      'Un rattle est le bourdonnement, le tremblement ou le cognement qu’on sent quand les roues d’un coaster ne suivent plus parfaitement les rails, souvent à cause de l’usure de la voie ou des roues, ou d’une construction vieillissante. Les passionnés germanophones parlent de « Rattern » ou de « Geruckel ». Un rattle peut rendre inconfortable un excellent tracé. On le reproche surtout aux anciens coasters en acier d’Arrow et de Vekoma. Son absence, c’est la douceur de roulement.',
    relatedTermIds: ['smoothness', 'wooden-coaster', 'arrow-dynamics'],
    aliases: ['Rattling', 'Rattern'],
  },
  {
    id: 'restraint-freedom',
    name: 'Liberté de mouvement',
    shortDefinition:
      'L’espace dont dispose un passager sous la barre ou le harnais, qui décide de ce qu’il sent de l’airtime.',
    definition:
      'La liberté de mouvement (« Bügelfreiheit » chez les passionnés germanophones) est l’espace qui reste entre le passager et le système de retenue une fois celui-ci verrouillé. Avec beaucoup de jeu sous une barre ventrale, les passagers se soulèvent de leur siège pendant l’airtime, et le flottement ou l’éjection se sentent nettement plus. Une retenue serrée ou trop plaquée supprime cette sensation. Beaucoup de modèles Intamin et Mack laissent du jeu sous la barre. Quand le personnel serre trop les retenues, c’est du stapling.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'stapling'],
    aliases: ['Bügelfreiheit', 'Restraint Freedom'],
  },
  {
    id: 'single-rail-coaster',
    name: 'Single-Rail Coaster',
    shortDefinition:
      'Un type récent de coaster qui roule sur un seul rail central étroit, avec des passagers assis en file, très exposés, sur un tracé tortueux.',
    definition:
      'Un single-rail coaster roule sur un seul rail étroit à section en caisson, au lieu des deux rails parallèles habituels. Les passagers sont assis les uns derrière les autres, à cheval sur la voie. Le rail mince permet des tracés très serrés et contorsionnés, et les passagers n’ont presque rien autour d’eux. Rocky Mountain Construction a lancé la version moderne avec son modèle « Raptor » (par exemple RailBlazer à California’s Great America). Vekoma et Intamin ont depuis développé leurs propres monorails.',
    relatedTermIds: ['rmc', 'vekoma', 'steel-coaster'],
    aliases: ['Single Rail', 'Single-Rail', 'Raptor Track'],
  },
  {
    id: 'stand-up-coaster',
    name: 'Stand-Up Coaster',
    shortDefinition: 'Un coaster sur lequel les passagers sont maintenus debout plutôt qu’assis.',
    definition:
      'Un stand-up coaster maintient les passagers debout, avec un siège en forme de selle de vélo et un harnais d’épaules. Le format a eu du succès à la fin des années 1980 et dans les années 1990, surtout chez TOGO et B&M. Debout, le corps ne sent pas les forces de la même façon : dans les loopings et les virages, la pression porte sur les jambes. Peu de stand-ups ont été construits depuis, et plusieurs ont été transformés (le Mantis de B&M est devenu le floorless Rougarou). Les derniers exemplaires en service sont donc des crédits recherchés.',
    relatedTermIds: ['b-and-m', 'floorless-coaster', 'steel-coaster'],
    aliases: ['Stand Up Coaster', 'Standup Coaster'],
  },
  {
    id: 'bobsled-coaster',
    name: 'Bobsleigh',
    shortDefinition:
      'Un coaster dont les voitures circulent librement dans une gouttière ouverte et relevée au lieu d’être fixées à une voie rigide.',
    definition:
      'Un coaster bobsleigh (« bobsled coaster ») envoie ses voitures dans une gouttière en demi-tube au lieu d’une voie classique. Dans les virages relevés, elles trouvent leur propre trajectoire, comme sur une vraie piste de bobsleigh. Le parcours est sinueux, sans inversion, avec surtout des forces latérales, et ce sont la vitesse et la forme du canal qui le déterminent. Schwarzkopf en a construit des versions anciennes, et Mack Rides est le fabricant le plus connu de bobsleighs en acier récents, dont plusieurs tournent dans des parcs allemands et alpins.',
    relatedTermIds: ['mack-rides', 'wild-mouse', 'steel-coaster'],
    aliases: ['Bobsled Coaster', 'Bobbahn', 'Bob Coaster'],
  },
  {
    id: 'powered-coaster',
    name: 'Powered Coaster',
    shortDefinition:
      'Une attraction de type coaster entraînée en continu par un moteur embarqué ou intégré à la voie, au lieu de reposer sur la gravité.',
    definition:
      'Un powered coaster ressemble à une montagne russe, mais des moteurs électriques le propulsent sur tout le circuit, au lieu de le hisser une fois puis de le laisser à la gravité. Il peut garder sa vitesse et faire plusieurs tours d’affilée. C’est en général une attraction familiale douce, souvent thématisée en train de mine, en dragon ou en animal, avec une grande capacité et des sensations modérées. Les passionnés débattent depuis longtemps, à moitié sérieusement, de savoir si un powered coaster « compte » comme crédit.',
    relatedTermIds: ['alpine-coaster', 'credit', 'mack-rides', 'mine-train'],
    aliases: ['Powered Coasters', 'coaster motorisé'],
  },
  {
    id: 'water-coaster',
    name: 'Water Coaster',
    shortDefinition:
      'Un hybride entre montagne russe et attraction aquatique, mêlant voie et lifts de coaster à un ou plusieurs splashdowns.',
    definition:
      'Un water coaster combine la mécanique d’un coaster (lifts à chaîne ou motorisés, descentes, voie surélevée) avec le final mouillé d’une attraction aquatique. Des bateaux ou des voitures sont hissés en haut des lifts, lancés dans les descentes et freinés brusquement dans un bassin qui projette une vague. Mack Rides est le principal fabricant de water coasters récents, avec par exemple Poseidon à Europa-Park.',
    relatedTermIds: ['mack-rides', 'log-flume', 'splashdown'],
    aliases: ['Water Coasters', 'coaster aquatique'],
  },
  {
    id: 'alpine-coaster',
    name: 'Alpine Coaster',
    shortDefinition:
      'Un coaster de descente guidé par un rail, généralement à flanc de montagne, où les passagers contrôlent eux-mêmes leur vitesse avec un levier de frein.',
    definition:
      'Un alpine coaster (ou mountain coaster) est une luge ou un chariot fixé à un rail qui suit le relief d’une colline. Chaque passager règle lui-même sa vitesse avec un frein à main. Contrairement à un coaster classique, il n’y a pas de train ni, le plus souvent, de lancement motorisé : la descente se fait par gravité, en suivant le terrain, et un câble remonte les chariots. On en trouve dans beaucoup de stations alpines, et aujourd’hui dans le monde entier. La « Sommerrodelbahn » (luge d’été) à gouttière, plus ancienne, en est une proche parente.',
    relatedTermIds: ['terrain-coaster', 'powered-coaster'],
    aliases: ['Mountain Coaster', 'Sommerrodelbahn'],
  },
  {
    id: 'beyond-vertical-drop',
    name: 'Beyond-Vertical Drop',
    shortDefinition:
      'Une descente de plus de 90 degrés, où la voie bascule les passagers au-delà de la verticale et les oriente brièvement vers l’arrière.',
    definition:
      'Une beyond-vertical drop dépasse 90 degrés : la voie passe sous elle-même, et les passagers sont un instant penchés au-delà de la verticale, légèrement tournés vers l’arrière, vers la structure. Le modèle Euro-Fighter de Gerstlauer a répandu ce type de descente, jusqu’à 121°, et B&M comme d’autres ont construit des dive coasters dont la première descente est aussi en surplomb. Mumbo Jumbo et Takabisha (121°, 2011) ont détenu le record de la descente la plus raide de ce type, qui appartient depuis 2019 à TMNT Shellraiser (121,5°).',
    relatedTermIds: ['dive-coaster', 'euro-fighter', 'first-drop', 'gerstlauer'],
    aliases: ['Beyond Vertical Drop', 'descente au-delà de la verticale'],
  },
  {
    id: 'splashdown',
    name: 'Splashdown',
    shortDefinition:
      'Le final freiné par l’eau d’une attraction aquatique ou d’un water coaster, où le bateau frappe un bassin et projette une vague.',
    definition:
      'Un splashdown est le moment où un bateau ou un véhicule entre dans un bassin d’eau au bas d’une descente. C’est l’eau qui freine : elle ralentit le véhicule en quelques mètres et renvoie l’énergie vers le haut sous forme d’un mur d’éclaboussures, qui retombe sur les passagers, sur le bateau suivant et souvent sur les spectateurs postés sur un pont construit pour ça.\n\nLa quantité d’eau reçue dépend de la profondeur et de la forme du bassin, de la forme de la proue du bateau et de la vitesse en bas. Sur les bûches, ce sont surtout les places de devant qui sont trempées. Atlantica SuperSplash à Europa-Park (Mack Rides, 2005) frappe le lac au bout d’une descente raide, et Pulsar à Walibi Belgium tombe de 45 mètres dans un bassin qui lui sert de frein.\n\nLes jours de chaleur, les files des attractions aquatiques sont plus longues.',
    relatedTermIds: ['water-coaster', 'log-flume', 'mack-rides'],
    aliases: ['Splash-down', 'Splashdowns'],
  },
  {
    id: 'quad-down',
    name: 'Quad-Down',
    shortDefinition:
      'Une série de quatre bosses descendantes qui donnent de l’airtime à répétition vers la fin d’un parcours.',
    definition:
      'Un quad-down (et ses petits cousins, le triple-down et le double-down) est une suite de marches descendantes prises coup sur coup. À chacune, le train plonge, se remet un instant à l’horizontale et replonge, et les passagers reçoivent un coup d’airtime sec. On en trouve surtout sur les coasters en bois et hybrides, pour donner de l’airtime « en rafale » sur peu de place. Le principe est celui du camelback et du bunny hop, mais les bosses s’enchaînent en une seule séquence rapide.',
    relatedTermIds: ['airtime', 'camelback', 'wooden-coaster'],
    aliases: ['Quad Down', 'Triple-Down', 'Double-Down'],
  },
  {
    id: 's-hill',
    name: 'S-Hill',
    shortDefinition:
      'Une bosse d’airtime en forme de S : les passagers sont soulevés et poussés sur le côté en même temps.',
    definition:
      'Une S-hill est une bosse d’airtime construite sur une courbe en S. Au sommet, pendant que le train flotte, il est aussi poussé d’un côté puis de l’autre. Les passagers ont à la fois de l’airtime vertical et un coup latéral qui les surprend. On en trouve sur les coasters en bois et hybrides récents qui cherchent un rythme imprévisible, « hors de contrôle ». L’élément est proche du wave turn, où l’airtime part entièrement sur le côté.',
    relatedTermIds: ['airtime', 'airtime-hill', 'wave-turn', 'bunnyhop'],
    aliases: ['S Hill', 'Speed Bump'],
  },
  {
    id: 'celestial-spin',
    name: 'Celestial Spin',
    shortDefinition:
      'Une inversion à double voie de Mack Rides : deux trains en course passent une bosse commune pendant que leurs voies s’enroulent l’une autour de l’autre, un train tournant vers le haut, l’autre vers le bas.',
    definition:
      'Le celestial spin est une inversion à double voie brevetée par Mack Rides et construite pour [Stardust Racers](/fr/parks/north-america/united-states/orlando/universal-epic-universe/stardust-racers), les montagnes russes lancées en duel d’[Universal Epic Universe](/fr/parks/north-america/united-states/orlando/universal-epic-universe). Quand les deux trains passent une bosse commune, leurs voies s’enroulent l’une autour de l’autre : au même instant, un train monte dans un zero-G roll pendant que l’autre descend dans un tonneau, et les wagons semblent tourner l’un autour de l’autre en plein vol.\n\nLes deux rotations sont calées sur le sommet de la bosse, si bien que les passagers restent en apesanteur un long moment pendant que l’autre train tourne à quelques mètres. L’élément est apparenté au zero-G roll et à la bosse d’airtime, et il ne fonctionne comme prévu que si les deux trains l’atteignent ensemble.',
    relatedTermIds: ['zero-g-roll', 'airtime-hill', 'inversion', 'hangtime'],
    aliases: ['Celestial Roll', 'Celestial Rolls', 'Celestial Spins'],
    alternateNames: ['Celestial Roll'],
  },
  {
    id: 'launch',
    name: 'Lancement',
    shortDefinition:
      'Une section motorisée qui amène le train à pleine vitesse en quelques secondes, au lieu de le hisser sur un lift.',
    definition:
      'Un lancement est la portion de voie où des montagnes russes tirent leur énergie d’un moteur plutôt que de la gravité. Quatre technologies dominent. Les lancements LSM (moteur synchrone linéaire) bordent la voie d’électroaimants qui tirent sur une lame fixée sous le train. Ils sont souples, se pilotent précisément et peuvent se répéter en plein parcours : presque tous les nouveaux coasters lancés les utilisent. Les lancements LIM (moteur à induction linéaire) fonctionnent de façon comparable mais dissipent plus d’énergie en chaleur. Les lancements hydrauliques utilisent un treuil alimenté par des accumulateurs sous pression d’azote et donnent l’accélération la plus violente jamais construite. Les lancements à air comprimé, comme sur Maxx Force, sont encore plus rapides sur les premiers mètres.\n\nUn lancement se distingue aussi d’un lift par l’endroit où l’énergie peut être dépensée. Un lift doit être le point le plus haut du parcours : tout ce qui suit descend. Un lancement peut se placer n’importe où, et c’est pourquoi les tracés multi-lancements comme [Taron](/fr/parks/europe/germany/bruehl/phantasialand/taron) à [Phantasialand](/fr/parks/europe/germany/bruehl/phantasialand) ou [Voltron Nevera](/fr/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) à [Europa-Park](/fr/parks/europe/germany/rust/europa-park) restent rapides sur toute leur longueur au lieu d’échanger une seule fois de la hauteur contre de la vitesse. Un lancement qui ne suffit pas à boucler le tracé se solde par un rollback.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'swing-launch', 'rollback', 'top-hat'],
    aliases: ['Launch', 'Lancements', 'Lancement LSM', 'Lancement LIM'],
    alternateNames: ['Launch', 'Catapultage'],
  },
  {
    id: 'swing-launch',
    name: 'Lancement pendulaire',
    shortDefinition:
      'Un lancement qui fait aller et venir le train plusieurs fois, et qui lui donne plus de vitesse à chaque passage, jusqu’à ce qu’il puisse boucler le tracé.',
    definition:
      'Un lancement pendulaire (ou lancement navette, ou multi-passes) accélère le train, le laisse s’essouffler sur une section montante, le rattrape au retour, et répète l’opération deux ou trois fois jusqu’à disposer de l’énergie nécessaire pour tout le circuit. Chaque passage ajoute une vitesse que les moteurs ne pourraient pas fournir en une seule fois : un lancement pendulaire achète donc une vitesse de pointe bien supérieure sur une piste de lancement bien plus courte.\n\nC’est aussi un élément de spectacle à part entière : les passagers traversent une partie du tracé en marche arrière, généralement le long d’un spike vertical, avant d’être relancés vers l’avant. [Toutatis](/fr/parks/europe/france/plailly/parc-asterix/toutatis) au Parc Astérix et [The Ride to Happiness](/fr/parks/europe/belgium/de-panne/plopsaland-belgium/the-ride-to-happiness-by-tomorrowland) à Plopsaland en utilisent un. Premier Rides construit tout un coaster compact autour de cette idée avec son modèle Sky Rocket II.',
    relatedTermIds: ['launch', 'spike', 'shuttle-coaster', 'launch-coaster'],
    aliases: ['Swing Launch', 'Lancement navette'],
    alternateNames: ['Swing Launch'],
  },
  {
    id: 'vertical-lift',
    name: 'Ascension verticale',
    shortDefinition:
      'Un lift à 90 degrés : le train est hissé à la verticale le long de la structure.',
    definition:
      'Une ascension verticale remplace la traditionnelle rampe à 30-45 degrés par une section qui monte à angle droit. Comme une chaîne classique et son cliquet anti-retour ne peuvent pas retenir un train de façon fiable sur une face verticale, ces lifts utilisent un câble, un chariot d’accroche ou une chaîne à verrouillage positif. Les passagers passent toute la montée allongés sur le dos, les yeux vers le ciel.\n\nOn trouve l’ascension verticale sur les modèles Euro-Fighter et Infinity Coaster de Gerstlauer, où elle débouche directement sur une chute au-delà de la verticale : [Takabisha](/fr/parks/asia/japan/fujikawaguchiko/fuji-q-highland/takabisha-steepest-roller-coaster) à Fuji-Q Highland monte à la verticale puis plonge à 121 degrés, la chute la plus raide du monde à son ouverture en 2011, avant TMNT Shellraiser (121,5°) en 2019. [Oath of Kärnan](/fr/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) à Hansa-Park utilise une ascension verticale de 73 mètres dans une tour fermée, si bien que la montée se fait dans le noir. À ne pas confondre avec un lift-ascenseur, où c’est la portion de voie elle-même qui s’élève avec le train.',
    relatedTermIds: ['lifthill', 'beyond-vertical-drop', 'euro-fighter', 'anti-rollback'],
    aliases: ['Vertical Lift', 'Lift vertical'],
    alternateNames: ['Vertical Lift'],
  },
  {
    id: 'drop-track',
    name: 'Rail descendant',
    shortDefinition:
      'Une portion de voie qui descend brusquement avec le train arrêté dessus, comme si le sol se dérobait.',
    definition:
      'Un drop track est une courte portion de voie mobile montée sur une plateforme hydraulique ou électrique. Le train s’y engage, s’arrête, et l’ensemble du segment (rails, train et tout) est libéré vers le bas, en général de quelques mètres, avant que la voie ne se verrouille dans un nouvel alignement et que le parcours reprenne. Contrairement à une chute classique, la sensation arrive train à l’arrêt et à l’horizontale, d’où l’impression que le sol se dérobe plutôt que celle d’un piqué.\n\nC’est presque toujours un moment de l’histoire que raconte l’attraction : l’effet ne fonctionne que si on ne le voit pas venir, et les drop tracks se trouvent donc dans des bâtiments de spectacle et des tunnels. [Hagrid’s Magical Creatures Motorbike Adventure](/fr/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure) fait tomber les passagers dans le noir en plein tracé, [Verbolten](/fr/parks/north-america/united-states/williamsburg/busch-gardens-williamsburg/verbolten) à Busch Gardens Williamsburg les précipite hors de la Forêt-Noire, et Harry Potter and the Escape from Gringotts en utilise un dans sa séquence de coffre-fort.',
    relatedTermIds: ['switch-track', 'dark-ride', 'first-drop', 'indoor-coaster'],
    aliases: ['Drop Track', 'Drop Tracks'],
    alternateNames: ['Drop Track'],
  },
  {
    id: 'scorpion-tail',
    name: 'Queue de scorpion',
    shortDefinition:
      'Un élément Mack Rides : la voie se courbe au-delà de la verticale en surplomb, le train grimpe donc à reculons un mur à 105 degrés.',
    definition:
      'La queue de scorpion est un spike de lancement qui ne s’arrête pas à la verticale. Au lieu de monter à 90 degrés et d’y retenir le train, la voie traverse la verticale et se renverse sur elle-même jusqu’à environ 105 degrés, en surplomb. Un train lancé dedans grimpe tête en bas et légèrement en arrière, reste suspendu au sommet, puis retombe par où il est venu.\n\nMack Rides a construit la première en 2024 pour [Voltron Nevera](/fr/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) à [Europa-Park](/fr/parks/europe/germany/rust/europa-park), où elle constitue la section de lancement la plus raide de toutes les montagnes russes du monde. Le hangtime se produit ici sans aucun mouvement vers l’avant : au sommet, seule la forme de la voie et l’élan résiduel du train vous maintiennent à l’envers. Le nom vient de la silhouette : une queue qui se recourbe vers le haut et par-dessus elle-même.',
    relatedTermIds: ['spike', 'swing-launch', 'launch', 'hangtime', 'mack-rides'],
    aliases: ['Scorpion Tail', 'Queues de scorpion'],
    alternateNames: ['Scorpion Tail'],
  },
  {
    id: 'step-up-under-flip',
    name: 'Step-Up Under-Flip',
    shortDefinition:
      'Une inversion RMC : le train grimpe une colline fortement inclinée, bascule au sommet et ressort à l’envers de l’autre côté.',
    definition:
      'Le step-up under-flip est une inversion en deux temps inventée par Rocky Mountain Construction. Le train « monte » d’abord (le long d’une section ascendante très inclinée), puis bascule sous lui-même en redescendant, si bien que la rotation se produit dans la moitié descendante et non au sommet. Il en résulte une rotation plus longue et plus lente qu’un tonneau, et une décharge brutale d’ejector airtime à la sortie.\n\nOn la trouve sur plusieurs hybrides RMC : [Steel Vengeance](/fr/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance) à Cedar Point, [Zadra](/fr/parks/europe/poland/zator/energylandia/zadra-rc) à Energylandia et [Untamed](/fr/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed) à Walibi Holland, la première conversion RMC d’Europe. Comme la manœuvre exige un rail d’acier vrillé avec précision sur une structure bois ou acier, elle est de fait impossible sur une voie en bois traditionnelle.',
    relatedTermIds: [
      'rmc',
      'hybrid-coaster',
      'inversion',
      'ejector-airtime',
      'twisted-horseshoe-roll',
    ],
    aliases: ['Step Up Under Flip'],
  },
  {
    id: 'twisted-horseshoe-roll',
    name: 'Twisted Horseshoe Roll',
    shortDefinition:
      'Un élément RMC : un virage en fer à cheval à 180 degrés avec un tonneau dans chaque branche, soit deux inversions et un demi-tour complet.',
    definition:
      'Un twisted horseshoe roll reprend le fer à cheval (un demi-tour serré à 180 degrés qui renvoie le train d’où il vient) et glisse une inversion dans chacune de ses branches. Le train se retourne à l’entrée, traverse le fer à cheval, et se retourne à nouveau à la sortie. Deux inversions et un changement complet de direction se produisent dans une seule manœuvre continue et inhabituellement étirée.\n\nRocky Mountain Construction l’a introduit sur Outlaw Run à Silver Dollar City, premier coaster en bois de l’histoire à comporter un double tonneau, et l’a depuis intégré à [Steel Vengeance](/fr/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance), [Zadra](/fr/parks/europe/poland/zator/energylandia/zadra-rc), [Iron Gwazi](/fr/parks/north-america/united-states/tampa/busch-gardens-tampa/iron-gwazi) et [Untamed](/fr/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed). On passe l’essentiel de l’élément sur le flanc ou à l’envers avec très peu de force G, d’où l’immense hangtime.',
    relatedTermIds: ['horseshoe', 'rmc', 'inversion', 'hangtime', 'step-up-under-flip'],
    aliases: ['Twisted Horseshoe Rolls', 'Double tonneau'],
  },
  {
    id: 'double-down',
    name: 'Double Down',
    shortDefinition:
      'Une descente coupée à mi-hauteur par un court palier, qui donne donc deux décollages distincts au lieu d’un seul.',
    definition:
      'Un double down est une descente en deux temps : la voie plonge, s’aplanit brièvement ou remonte même d’un rien, puis replonge. Chaque transition arrache les passagers de leur siège, si bien qu’une seule colline produit deux décollages nets plutôt qu’un long flottement. L’élément miroir, le double up, fait la même chose en montant.\n\nLes coasters en bois en ont depuis longtemps : [Jack Rabbit](/fr/parks/north-america/united-states/west-mifflin/kennywood/jack-rabbit) à Kennywood éjecte ses passagers avec son double dip depuis 1920. Les tracés en bois et hybrides modernes s’appuient toujours dessus : [Colossos](/fr/parks/europe/germany/soltau/heide-park/colossos-kampf-der-giganten) à Heide-Park, [Balder](/fr/parks/europe/sweden/gothenburg/liseberg/balder) à Liseberg et [Troy](/fr/parks/europe/netherlands/sevenum/attractiepark-toverland/troy) à Toverland terminent leurs descentes ainsi. Poussez l’idée plus loin et vous obtenez un quad-down : quatre paliers dans une seule descente.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'quad-down', 'camelback', 'wooden-coaster'],
    aliases: ['Double Downs', 'Double dip'],
    alternateNames: ['Double Dip'],
  },
  {
    id: 'switch-track',
    name: 'Aiguillage',
    shortDefinition:
      'Une portion de voie mobile qui envoie le train sur un autre chemin : sections en marche arrière, tracés à embranchement, voies de garage.',
    definition:
      'Un aiguillage est l’équivalent ferroviaire appliqué aux montagnes russes : une longueur de voie qui coulisse, pivote ou tourne pour relier le circuit principal à un second chemin. Le mécanisme est simple, et il donne beaucoup de liberté au tracé. Un aiguillage permet d’envoyer un train en marche arrière dans une section déjà parcourue, d’offrir deux itinéraires depuis la même gare, ou simplement de sortir les trains du circuit vers l’atelier à la fermeture.\n\nComme élément de spectacle, il s’agit presque toujours de surprise. [Expedition Everest](/fr/parks/north-america/united-states/orlando/disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain) montre une voie arrachée devant soi, puis renvoie le train en arrière dans la montagne. [Big Grizzly Mountain](/fr/parks/asia/hong-kong/hong-kong/hong-kong-disneyland-park/big-grizzly-mountain-runaway-mine-cars) à Hong Kong Disneyland en utilise deux. [Fury](/fr/parks/europe/belgium/kasterlee/bobbejaanland/fury) à Bobbejaanland s’en sert pour proposer une version avant et une version arrière du même tracé.',
    relatedTermIds: ['drop-track', 'turntable', 'block-brake', 'dark-ride'],
    aliases: ['Switch Track', 'Aiguillages'],
    alternateNames: ['Switch Track'],
  },
  {
    id: 'turntable',
    name: 'Plaque tournante',
    shortDefinition:
      'Une plateforme rotative dans le circuit qui fait pivoter le train sur place, en général pour le renvoyer dans l’autre sens.',
    definition:
      'Une plaque tournante est une portion de voie montée sur un disque rotatif. Le train s’y engage, le disque tourne (le plus souvent de 180 degrés) et le train repart dans l’autre sens. Comme la rotation a lieu à l’arrêt, c’est un moment volontairement calme : il permet à un parcours d’inverser sa direction sans spike navette ni aiguillage, et donne au spectacle un temps pendant lequel on peut montrer quelque chose aux passagers.\n\nSur [Voltron Nevera](/fr/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) à Europa-Park, la plaque tournante prépare un lancement en marche arrière. Dans de nombreux parcours scéniques, elle oriente les passagers vers une scène au moment précis voulu. Les parcours sans rail obtiennent le même effet sans matériel spécifique, puisque leurs véhicules peuvent pivoter librement à tout instant.',
    relatedTermIds: ['switch-track', 'swing-launch', 'trackless-ride', 'dark-ride'],
    aliases: ['Turntable', 'Plaques tournantes'],
    alternateNames: ['Turntable'],
  },
  {
    id: 'treble-clef',
    name: 'Clé de sol',
    shortDefinition:
      'Un élément sans inversion en forme de clé de sol : la voie boucle sur elle-même et repasse par l’intérieur de sa propre courbe.',
    definition:
      'Une clé de sol est une courbe superposée qui se croise elle-même : le train grimpe dans une boucle, franchit sa propre voie et ressort par le milieu de la figure, dessinant à peu près le contour du symbole musical. Ce n’est pas une inversion : le train reste à l’endroit tout du long, retenu par une forte inclinaison plutôt que par un retournement. Ce que l’on ressent, c’est un long balayage désorientant avec la voie qui passe très près au-dessus et au-dessous.\n\nL’élément a été construit par Maurer Rides pour [Hollywood Rip Ride Rockit](/fr/parks/north-america/united-states/orlando/universal-studios-florida/hollywood-rip-ride-rockit) aux Universal Studios Florida, dont le tracé sur thème musical nomme ses figures d’après la musique, et la clé de sol suit la boucle sans inversion « double take » du parcours. C’est la seule clé de sol construite à ce jour.',
    relatedTermIds: ['non-inverting-loop', 'maurer-rides', 'overbank', 'inversion'],
    aliases: ['Treble Clef'],
    alternateNames: ['Treble Clef'],
  },
  {
    id: 'indoor-coaster',
    name: 'Montagnes russes couvertes',
    shortDefinition:
      'Des montagnes russes entièrement bâties dans un bâtiment, où lumière, son et décors remplacent la vue.',
    definition:
      'Des montagnes russes couvertes bouclent tout leur circuit dans un bâtiment de spectacle fermé. Supprimer la lumière du jour change fondamentalement le parcours : les passagers perdent les repères visuels qui leur permettent d’anticiper une chute ou un virage, si bien qu’un tracé modeste paraît bien plus intense que la même voie en extérieur. Cela donne aussi au concepteur un contrôle total sur la lumière, la projection, le son et les décors, et c’est pourquoi beaucoup de coasters couverts sont aussi des parcours scéniques.\n\nSpace Mountain en est le modèle : la première a ouvert au Magic Kingdom en 1975, celle de [Disneyland](/fr/parks/north-america/united-states/anaheim/disneyland-park/space-mountain) en 1977. En Europe, on trouve [Eurosat](/fr/parks/europe/germany/rust/europa-park/eurosat-cancan-coaster) à Europa-Park, [Vogel Rok](/fr/parks/europe/netherlands/kaatsheuvel/efteling/vogel-rok) à Efteling, et [Crazy Bats](/fr/parks/europe/germany/bruehl/phantasialand/crazy-bats) à Phantasialand.',
    relatedTermIds: ['dark-ride', 'show-building', 'projection-mapping', 'vr-coaster'],
    aliases: ['Indoor Coaster', 'Coaster couvert'],
    alternateNames: ['Indoor Coaster'],
  },
  {
    id: 'family-coaster',
    name: 'Montagnes russes familiales',
    shortDefinition:
      'Un coaster fait pour que les enfants et les adultes montent ensemble : forces modérées, taille minimale basse, aucune inversion.',
    definition:
      'Des montagnes russes familiales s’adressent au public le plus large possible. Les tailles minimales démarrent généralement autour de 100 à 110 cm (souvent accompagné en dessous), les vitesses restent sous les 60 km/h environ, et les tracés évitent inversions et forces G soutenues. Dans ces limites, le concepteur doit quand même donner de l’airtime et du rythme au tracé.\n\nUn groupe entier, enfants compris, peut y monter ensemble. Le Family Boomerang de Vekoma, le Youngstar de Mack et le Tivoli de Zierer sont les modèles les plus courants, et [Pegasus](/fr/parks/europe/germany/rust/europa-park/pegasus) à Europa-Park, [Raik](/fr/parks/europe/germany/bruehl/phantasialand/raik) à Phantasialand et [Slinky Dog Dash](/fr/parks/north-america/united-states/orlando/disneys-hollywood-studios/slinky-dog-dash) aux Disney’s Hollywood Studios répondent exactement à ce cahier des charges.',
    relatedTermIds: ['height-requirement', 'mine-train', 'wild-mouse', 'launch-coaster'],
    aliases: ['Family Coaster', 'Coaster familial'],
    alternateNames: ['Family Coaster'],
  },
  {
    id: 'motorbike-coaster',
    name: 'Montagnes russes moto',
    shortDefinition:
      'Un coaster que l’on chevauche comme une moto, penché en avant sur un guidon, en file indienne.',
    definition:
      'Sur des montagnes russes moto, on enfourche le véhicule au lieu de s’y asseoir, mains sur le guidon, penché en avant, pieds sur les cale-pieds. La position change tout : le centre de gravité est bas et directement au-dessus des rails, si bien que les virages inclinés et les forces latérales se lisent comme une prise d’angle. En contrepartie, les trains sont longs et étroits et la capacité par véhicule est faible.\n\nVekoma a construit le premier avec Booster Bike à [Toverland](/fr/parks/europe/netherlands/sevenum/attractiepark-toverland/booster-bike) en 2004. Intamin a poussé l’idée plus loin sur [Hagrid’s Magical Creatures Motorbike Adventure](/fr/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure), qui ajoute un side-car pour accueillir ceux qui ne peuvent pas monter à califourchon. [TRON Lightcycle / Run](/fr/parks/north-america/united-states/orlando/magic-kingdom-park/tron-lightcycle-run) chez Disney reprend la même posture avec une coque fermée sur chaque passager.',
    relatedTermIds: ['launch-coaster', 'vekoma', 'intamin', 'suspended-coaster'],
    aliases: ['Motorbike Coaster', 'Coaster moto'],
    alternateNames: ['Motorbike Coaster'],
  },
  {
    id: 'infinity-coaster',
    name: 'Infinity Coaster',
    shortDefinition:
      'Le successeur de l’Euro-Fighter chez Gerstlauer : mêmes chutes raides et même compacité, mais des trains ouverts en gradins.',
    definition:
      'L’Infinity Coaster est la plateforme actuelle de Gerstlauer pour les coasters sur mesure. Elle garde les chutes au-delà de la verticale, les ascensions verticales et les tracés sur très peu de terrain de l’Euro-Fighter, mais remplace les wagons carrés de quatre places par des trains plus longs et plus bas, aux flancs ouverts et à harnais de type gilet plutôt qu’à baudriers d’épaules. Le résultat roule nettement plus doux et autorise davantage de collines à airtime, que l’ancien modèle digérait mal.\n\nLa gamme va du petit coaster de remplissage au détenteur de record : [The Smiler](/fr/parks/europe/united-kingdom/farley/alton-towers/the-smiler) à Alton Towers détient le record du monde d’inversions avec quatorze, [Oath of Kärnan](/fr/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) à Hansa-Park associe une ascension verticale de 73 mètres à une chute libre en marche arrière, et [Star Trek: Operation Enterprise](/fr/parks/europe/germany/bottrop/movie-park-germany/star-trek-operation-enterprise) au Movie Park Germany exploite le modèle en navette multi-lancements.',
    relatedTermIds: ['gerstlauer', 'euro-fighter', 'beyond-vertical-drop', 'vertical-lift'],
    aliases: ['Infinity Coasters'],
  },
  {
    id: 'interactive-dark-ride',
    name: 'Parcours scénique interactif',
    shortDefinition:
      'Un parcours scénique où les visiteurs tirent, visent ou participent, et où le système compte les points.',
    definition:
      'Un parcours scénique interactif met un dispositif entre les mains des visiteurs (le plus souvent un pistolet infrarouge, parfois un écran tactile ou simplement leurs mains) et construit le spectacle autour de ce qu’ils en font. Des cibles dans chaque scène enregistrent les touches et alimentent un score individuel affiché à la fin. Le score donne une raison de refaire l’attraction pour faire mieux.\n\nLe genre se divise en deux écoles. Les parcours physiques tirent sur de vrais décors animés : [Maus au Chocolat](/fr/parks/europe/germany/bruehl/phantasialand/maus-au-chocolat) à Phantasialand et [Men in Black: Alien Attack](/fr/parks/north-america/united-states/orlando/universal-studios-florida/men-in-black-alien-attack) aux Universal Studios Florida. Les parcours sur écran tirent sur des cibles projetées, avec des effets bien plus élaborés : [Toy Story Mania](/fr/parks/north-america/united-states/orlando/disneys-hollywood-studios/toy-story-mania) et [WEB SLINGERS](/fr/parks/north-america/united-states/anaheim/disney-california-adventure-park/web-slingers-a-spider-man-adventure), qui suit les mouvements des mains sans aucun pistolet.',
    relatedTermIds: ['dark-ride', 'animatronics', 'projection-mapping', 'trackless-ride'],
    aliases: ['Interactive Dark Ride', 'Parcours interactif'],
    alternateNames: ['Interactive Dark Ride'],
  },
  {
    id: 'madhouse',
    name: 'Maison folle',
    shortDefinition:
      'Une attraction où la pièce tourne autour d’un banc qui oscille à peine : les visiteurs croient faire un tour complet.',
    definition:
      'Une maison folle repose sur une seule astuce : le banc n’oscille que de quelques degrés, tandis que toute la pièce autour effectue une rotation complète de 360 degrés. Sans repère visuel fixe (murs, plafond et accessoires bougent tous ensemble), le cerveau interprète le mouvement comme un retournement du banc. Les visiteurs sont certains d’avoir été à l’envers, alors qu’ils n’ont jamais quitté un arc très plat.\n\nVekoma a répandu le format après avoir construit [Villa Volta](/fr/parks/europe/netherlands/kaatsheuvel/efteling/villa-volta) pour Efteling en 1996, et le système est souvent appelé simplement « Vekoma Madhouse ». [Feng Ju Palace](/fr/parks/europe/germany/bruehl/phantasialand/feng-ju-palace) à Phantasialand, [Cassandra’s Curse](/fr/parks/europe/germany/rust/europa-park/cassandras-curse) à Europa-Park et [Villa Fiasko](/fr/parks/europe/netherlands/sevenum/attractiepark-toverland/villa-fiasko) à Toverland exploitent le même système sous d’autres histoires.',
    relatedTermIds: ['dark-ride', 'vekoma', 'pre-show', 'animatronics'],
    aliases: ['Madhouse', 'Vekoma Madhouse'],
    alternateNames: ['Madhouse'],
  },
  {
    id: 'boat-ride',
    name: 'Parcours en bateau',
    shortDefinition:
      'Un parcours scénique où les visiteurs avancent en bateau dans un canal plutôt que sur un rail.',
    definition:
      'Un parcours en bateau transporte les visiteurs à travers le spectacle dans une gouttière d’eau, guidés par un rail immergé ou par les parois du canal elles-mêmes. L’eau apporte deux choses qu’un rail ne peut pas offrir : la capacité, car les longs bateaux se chargent vite et circulent serrés, et le silence, car aucun mécanisme d’entraînement sous les passagers ne couvre le spectacle. C’est le format de beaucoup des plus grands parcours scéniques, et des plus anciens encore en service.\n\nPresque tous les classiques sont des parcours en bateau : [Pirates of the Caribbean](/fr/parks/north-america/united-states/anaheim/disneyland-park/pirates-of-the-caribbean), [« it’s a small world »](/fr/parks/north-america/united-states/anaheim/disneyland-park/its-a-small-world-holiday), [Fata Morgana](/fr/parks/europe/netherlands/kaatsheuvel/efteling/fata-morgana) à Efteling et [Pirates in Batavia](/fr/parks/europe/germany/rust/europa-park/pirates-in-batavia) à Europa-Park. Le Pirates of the Caribbean de Shanghai Disneyland place ses bateaux sur un entraînement magnétique sans rail : ils peuvent pivoter et se déplacer sur le côté.',
    relatedTermIds: ['dark-ride', 'animatronics', 'trackless-ride', 'log-flume', 'water-ride'],
    aliases: ['Boat Ride', 'Parcours en bateaux'],
    alternateNames: ['Boat Ride'],
  },
  {
    id: 'shoot-the-chute',
    name: 'Shoot-the-Chute',
    shortDefinition:
      'Une attraction aquatique à grand bateau, construite autour d’une seule grande chute dans un bassin, qui projette un mur d’eau sur la passerelle.',
    definition:
      'Un shoot-the-chute hisse un bateau large à fond plat, accueillant vingt personnes ou plus, sur un unique lift, puis le lâche dans une seule glissière raide vers un bassin peu profond. À l’impact, le bateau déplace une énorme quantité d’eau, et c’est le but : la gerbe vise autant une passerelle de spectateurs que les passagers. Contrairement à un toboggan aquatique, qui répartit plusieurs petites chutes sur un long parcours sinueux, un shoot-the-chute est construit autour d’une chute et d’une gerbe.\n\nLe format occupe en général une place centrale dans un land : [Jurassic Park River Adventure](/fr/parks/north-america/united-states/orlando/universal-islands-of-adventure/jurassic-park-river-adventure) à Islands of Adventure déroule un parcours scénique complet avant la chute de 26 mètres, et [Atlantica SuperSplash](/fr/parks/europe/germany/rust/europa-park/atlantica-supersplash) à Europa-Park le combine à un tracé de water coaster.',
    relatedTermIds: ['log-flume', 'water-ride', 'splashdown', 'water-coaster'],
    aliases: ['Shoot the Chutes'],
    alternateNames: ['Splash Boat'],
  },
  {
    id: 'people-mover',
    name: 'People Mover',
    shortDefinition:
      'Une attraction de transport à défilement continu qui promène lentement les visiteurs à travers ou au-dessus d’un land.',
    definition:
      'Un people mover est une attraction de transport lente et à forte capacité : une chaîne ininterrompue de véhicules avançant au pas, souvent sur une voie surélevée, avec une gare à quai mobile pour ne jamais avoir à s’arrêter. Dans un parc, il a deux fonctions : transporter les visiteurs d’une zone à l’autre, et leur faire voir tranquillement le land et, souvent, l’intérieur d’autres attractions.\n\nLe Tomorrowland Transit Authority PeopleMover du [Magic Kingdom](/fr/parks/north-america/united-states/orlando/magic-kingdom-park/tomorrowland-transit-authority-peoplemover) en est le survivant le plus connu, traversant le bâtiment de Space Mountain sur son circuit. L’entraînement à induction linéaire qu’il utilise a ensuite été concédé sous licence à de vrais réseaux de transport urbain. Villain-Con Minion Blast chez Universal applique la même idée à un trottoir roulant.',
    relatedTermIds: ['dark-ride', 'omnimover', 'observation-tower', 'walkthrough'],
    aliases: ['People Movers', 'Peoplemover'],
    alternateNames: ['Système de transit'],
  },
  {
    id: 'bumper-cars',
    name: 'Auto-tamponneuses',
    shortDefinition:
      'Une attraction où les visiteurs conduisent de petites voitures électriques sur un plancher métallique et se percutent volontairement.',
    definition:
      'Les auto-tamponneuses roulent sur un plancher d’acier surmonté d’une grille conductrice : une perche sur chaque voiture capte le courant en haut et le renvoie par le sol, si bien que les véhicules se conduisent librement sans batterie ni rail. De lourds pare-chocs en caoutchouc absorbent les collisions autour desquelles toute l’attraction est bâtie. Les installations modernes utilisent de plus en plus une captation par le sol ou des batteries. La grille disparaît, et le plafond peut être thématisé.\n\nC’est l’un des plus anciens types d’attractions encore produits sans interruption (l’Auto-Skooter de Lusse remonte aux années 1920), et l’un des rares où ce sont les visiteurs qui décident de ce qui se passe. Presque tous les grands parcs en ont : Phantasialand a son [Bumper Klumpen](/fr/parks/europe/germany/bruehl/phantasialand/bumper-klumpen), Europa-Park son Lada Autodrom.',
    relatedTermIds: ['flat-ride', 'funhouse', 'carousel'],
    aliases: ['Auto-tamponneuse', 'Bumper Cars', 'Autos tamponneuses'],
    alternateNames: ['Bumper Cars'],
  },
  {
    id: 'observation-tower',
    name: 'Tour panoramique',
    shortDefinition:
      'Une tour qui élève lentement une cabine rotative jusqu’au sommet pour la vue, sans aucune chute.',
    definition:
      'Une tour panoramique fait monter une nacelle vitrée ou ouverte le long d’une colonne centrale, généralement en tournant pour que chaque place profite du panorama complet, marque un arrêt en haut, puis redescend. Mécaniquement, c’est une proche cousine de la tour de chute, et on les confond souvent, mais la tour panoramique monte et redescend lentement, sans chute.\n\nDans un parc, elle sert aussi de point de repère, visible depuis le parking. L’[Euro-Tower](/fr/parks/europe/germany/rust/europa-park/euro-tower) d’Europa-Park joue ce rôle depuis 1983.',
    relatedTermIds: ['drop-tower', 'ferris-wheel', 'flat-ride', 'people-mover'],
    aliases: ['Tours panoramiques', 'Observation Tower', 'Gyro Tower'],
    alternateNames: ['Gyro Tower'],
  },
  {
    id: 'wdi',
    name: 'Walt Disney Imagineering',
    shortDefinition:
      'Le bureau d’études interne de Disney, qui invente, conçoit et construit les attractions des parcs Disney.',
    definition:
      'Walt Disney Imagineering (WDI) est la division qui conçoit et construit les parcs Disney, du plan directeur d’un land jusqu’au mécanisme d’une seule figure. Fondée en 1952 sous le nom de WED Enterprises pour bâtir Disneyland, elle a ceci d’inhabituel dans la profession qu’elle réunit sous un même toit la conception du spectacle, l’architecture, l’ingénierie des attractions et le logiciel : la même organisation écrit l’histoire et construit le véhicule qui la raconte.\n\nOn lui doit notamment les Audio-Animatronics, l’Omnimover (un véhicule à défilement continu qui pivote pour orienter les passagers vers chaque scène), le système sans rail utilisé pour la première fois sur [Pooh’s Hunny Hunt](/fr/parks/asia/japan/tokyo/tokyo-disneyland/poohs-hunny-hunt), et la voie tubulaire en acier qu’Arrow a construite pour les [Matterhorn Bobsleds](/fr/parks/north-america/united-states/anaheim/disneyland-park/matterhorn-bobsleds) en 1959, reprise depuis par toutes les montagnes russes en acier. Là où une attraction Disney porte la marque d’un constructeur extérieur, WDI en a le plus souvent quand même conçu le spectacle.',
    relatedTermIds: ['omnimover', 'trackless-ride', 'animatronics', 'dark-ride', 'arrow-dynamics'],
    aliases: ['WDI', 'Imagineering', 'Imagineers', 'WED Enterprises'],
    alternateNames: ['WDI', 'Imagineering'],
  },
  {
    id: 'brogent',
    name: 'Brogent Technologies',
    shortDefinition:
      'Constructeur taïwanais du système de flying theater i-Ride, utilisé par la plupart des flying theaters hors Disney.',
    definition:
      "Brogent Technologies, fondée à Kaohsiung en 2001, construit le flying theater i-Ride : une nacelle suspendue qui s’avance devant un grand écran sphérique, jambes dans le vide, synchronisée avec des effets de vent, de parfum et de brume. Là où le Soarin' de Disney a établi le format, Brogent l’a industrialisé : l’i-Ride est le système que les parcs achètent quand ils veulent un flying theater, et il tourne aujourd’hui sur tous les continents.\n\nL’installation européenne la plus connue est le [Voletarium](/fr/parks/europe/germany/rust/europa-park/voletarium) d’Europa-Park, qui survole les monuments du continent avec deux salles en parallèle pour la capacité. L’entreprise construit également des systèmes de parcours médiatiques plus modestes et des attractions immersives sous dôme.",
    relatedTermIds: ['flying-theater', 'motion-simulator', 'projection-mapping', 'pre-show'],
    aliases: ['Brogent', 'i-Ride'],
    alternateNames: ['Brogent'],
  },
  {
    id: 'quick-pass',
    name: 'QUICK Pass',
    shortDefinition: 'Le coupe-file payant de Phantasialand, acheté attraction par attraction.',
    definition:
      'Le QUICK Pass est l’accès payant qui contourne la file d’attente à Phantasialand. Contrairement à la plupart des parcs, il ne s’achète pas à la journée mais par attraction : pour Taron, Black Mamba, Chiapas, Talocan ou Maus au Chocolat.\n\nIl ne se vend qu’au parc, au service clients de la zone Berlin, et ne vaut qu’à la date imprimée dessus. Le prix par attraction est fixe et ne suit pas l’affluence. Il existe aussi le Quick Pass Ultimate : un passage sur chaque attraction Quick Pass, plus un sur F.L.Y.\n\nL’entrée QUICK Pass a aussi sa file, bien plus courte que la file normale.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time', 'fastpass'],
    aliases: ['Quick Pass', 'QuickPass'],
  },
  {
    id: 'virtual-line',
    name: 'VirtualLine',
    shortDefinition:
      'La file d’attente virtuelle gratuite d’Europa-Park, réservée dans l’application du parc.',
    definition:
      'VirtualLine est le service de réservation gratuit d’Europa-Park : dans l’application Europa-Park & Rulantica, vous réservez un créneau pour une attraction sélectionnée et vous y entrez pendant ce créneau par une file raccourcie. En attendant, vous profitez des autres attractions, des spectacles ou d’un repas.\n\nLe service couvre blue fire Megacoaster, Euro-Mir, Pirates in Batavia, Poseidon, Voletarium, Voltron Nevera powered by Rimac et WODAN – Timburcoaster. Le nombre de créneaux par jour est limité.\n\nContrairement à un coupe-file, VirtualLine ne coûte rien.',
    relatedTermIds: ['virtual-queue', 'return-time', 'boarding-group', 'wait-time'],
    aliases: ['Virtual Line'],
  },
  {
    id: 'fast-lane',
    name: 'Fast Lane',
    shortDefinition:
      'Le coupe-file payant, acheté le plus souvent pour toute la journée de visite.',
    definition:
      'Fast Lane est le nom du produit coupe-file dans de nombreux parcs des familles Six Flags et Walibi, de Cedar Point à Walibi Holland. Il s’achète pour la visite et non pour un tour : un bracelet ou un billet numérique ouvre toute la journée l’entrée Fast Lane des attractions concernées.\n\nIl existe généralement plusieurs niveaux. Chez Walibi Holland, on trouve, Gold (illimité, environ 90 % d’attente en moins), Silver, Bronze, ainsi que des shots pour un ou quatre tours. Le parc décide des attractions incluses, et les maisons d’Halloween en sont souvent exclues.\n\nComme le prix couvre la journée et non l’attraction, park.fan affiche un prix « à partir de » sur ces attractions.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time', 'single-rider'],
    aliases: ['Fastlane'],
  },
  {
    id: 'speedy-pass',
    name: 'Speedy Pass',
    shortDefinition: 'La file d’attente virtuelle payante de Movie Park Germany.',
    definition:
      'Le Speedy Pass est le produit coupe-file de Movie Park Germany. Il fonctionne comme une file virtuelle : vous réservez un tour depuis votre téléphone sur l’une des attractions concernées et vous entrez à l’heure réservée par une entrée dédiée.\n\nIl existe en plusieurs niveaux, du Speedy Pass One Ride pour une seule attraction jusqu’aux formules Gold et Platinum, qui couvrent presque tout. Il vaut pour plus de 25 attractions. Quelques maisons et attractions spéciales en sont exclues.',
    relatedTermIds: ['virtual-queue', 'express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Speedypass'],
  },
  {
    id: 'fastrack',
    name: 'Fastrack',
    shortDefinition: 'Le billet coupe-file payant des parcs Merlin, comme Alton Towers.',
    definition:
      'Fastrack est le nom sous lequel les parcs britanniques du groupe Merlin (Alton Towers, Thorpe Park, Chessington) vendent leur accès en dehors de la file. Il existe à l’unité pour une attraction ou en forfait : Bronze pour quelques attractions au choix, Silver pour un tour sur chaque attraction concernée, Gold pour un usage illimité.\n\nFastrack est toujours un billet supplémentaire : l’entrée du parc n’est pas comprise.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Fast Track', 'Fasttrack'],
  },
  {
    id: 'premier-access',
    name: 'Disney Premier Access',
    shortDefinition: 'Le coupe-file payant de Disney hors des États-Unis, réservé par attraction.',
    definition:
      'Disney Premier Access est l’équivalent du Lightning Lane américain : l’accès payant qui contourne la file, à Disneyland Paris et à Tokyo Disney Resort.\n\nPremier Access One s’achète par attraction, en général le jour même via l’application, et son prix dépend de la date et de l’attraction. Il est nettement plus élevé pour les nouveautés. Premier Access Ultimate couvre une fois chaque attraction participante.\n\nComme le prix est fixé chaque jour, park.fan n’affiche pas de prix fixe sur ces attractions.',
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Premier Access'],
  },
  {
    id: 'headliner',
    name: 'Headliner',
    shortDefinition:
      'L’attraction pour laquelle on choisit le parc, en général la plus récente ou la plus grande.',
    definition:
      'Un headliner est l’attraction qui fait entrer un parc dans une liste de voyage : le nouveau grand huit, le dark ride le plus coûteux, l’attraction de l’affiche. Les parcs en construisent un tous les cinq à dix ans environ, et lors de sa saison d’ouverture il attire une part considérable des visiteurs.\n\nPour organiser une journée, c’est le poste le plus important. Un headliner rassemble la plus longue file du parc et la garde souvent de l’ouverture jusqu’au soir, alors que le reste du site est encore vide le matin. D’où sa place en tête de presque toutes les recommandations : le headliner d’abord, le reste ensuite. L’exception est la file d’attente virtuelle, qui lui attribue de toute façon un créneau.\n\npark.fan signale les headliners dans la liste des attractions d’un parc et les remonte dans le classement par temps d’attente. Ce statut est renseigné manuellement et non déduit de la file : une attraction peut avoir une longue file un jour donné sans que personne ne fasse le voyage pour elle.',
    aliases: ['Attraction phare', 'E-Ticket'],
    relatedTermIds: ['wait-time', 'crowd-level', 'rope-drop', 'virtual-queue', 'peak-day'],
  },
];

export default translations;
