import { Link } from '@/i18n/navigation';
import {
  A,
  SectionShell,
  Lead,
  P,
  PG,
  Highlight,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
  LandingNextSteps,
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { HOWTO_CHAPTERS } from '@/lib/howto/chapters';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  MessageCircle,
  Ruler,
  Scale,
  Search,
  Sparkles,
  Star,
  Sunrise,
} from 'lucide-react';
import {
  BadgeRowDemo,
  BareNumberVsCard,
  CalendarDaysDemo,
  DemoFrame,
  LiveHourlyProfile,
  LiveTopAttractions,
  NoWaitTimesDemo,
  OffSeasonDemo,
  ParkyShot,
  PlannerDayFigure,
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import {
  AnatomyAttractionDemo,
  AnatomyBestDaysDemo,
  AnatomyBlogDemo,
  AnatomyCalendarDemo,
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterList, ChapterRail } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/** See `HOWTO_CHAPTERS`: the ids there must match the `<SectionShell>` calls below. */
const CHAPTERS = HOWTO_CHAPTERS.fr;

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Normal',
  busy: 'Chargé',
  unit: 'min',
  days: 'jours mesurés',
  record: 'Record',
  summary:
    'Taron, {label} : normalement {typical} minutes, {busy} les jours chargés, sur {days} jours mesurés. À l’entrée, {wait} minutes.',
};

const SCALE_LEGEND = [
  {
    term: 'Normal',
    def: 'Sur la moitié des jours mesurés, la file la plus longue était plus courte que cela.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Chargé',
    def: 'Le jour le plus chargé sur dix.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'Ce qui est affiché à l’entrée.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Record',
    def: `${TARON_RECORD} minutes le 16 juillet 2026, le pire jour de la période mesurée.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them.
 * Figures from `TARON_TYPICAL_WAITS`, i.e. from the API and not from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Lundi', typical: 55, busy: 70, sampleDays: 21 },
  { id: 'saturday', label: 'Samedi', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'En semaine', typical: 60, busy: 75, sampleDays: 107 },
];

/**
 * The sections of a park page in the order they render (`app/[locale]/parks/.../page.tsx`,
 * `ParkPageShell`, `LiveParkData`). Whoever reorders them there reorders them here, or the guide
 * describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Carte de titre',
    body: 'Nom et lieu, la distance qui vous en sépare, l’étoile pour vos favoris, un court texte sur le parc, ses liens et le bouton vers le planificateur. Là où les mesures suffisent, elle indique aussi quels jours de la semaine sont d’ordinaire calmes et lesquels sont chargés.',
  },
  {
    title: 'Prix coupe-file',
    body: 'Tarifs du jour des files payantes comme Lightning Lane, complet signalé comme tel.',
    example:
      'À Magic Kingdom le 4 novembre 2026 : le Multi Pass à 37 dollars, la réservation à l’unité pour Seven Dwarfs Mine Train complète.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'le parc les publie, pour l’instant seulement les parcs Disney aux États-Unis.',
  },
  {
    title: 'Quand vous êtes dans le parc',
    body: 'Une boussole montre dans quelle direction se trouvent les grandes attractions. En dessous figurent les attractions où la file est plus courte maintenant que plus tard, et les plus proches avec leur distance et leur temps d’attente.',
    onlyWhen: 'vous êtes dans le parc et avez partagé votre position.',
  },
  {
    title: 'Aujourd’hui dans le parc',
    body: 'Le statut et les horaires, le nombre d’attractions ouvertes, l’affluence du moment, la prévision du jour, le taux d’occupation, les temps d’attente des grandes attractions et les prochains spectacles. Quand une alerte météo officielle du DWD ou de MeteoAlarm est en vigueur, elle figure tout en haut, telle quelle. La ligne de titre affiche la température et un avertissement quand de la pluie ou un orage approche ; en appuyant dessus, vous voyez les prochaines heures par quarts d’heure. Tout en bas viennent les vacances qui pèsent aujourd’hui sur le parc, celles de sa propre région en premier.',
    example:
      'Le 24 août 2026, Phantasialand était ouvert de 9 h à 19 h, et la Gueldre était en vacances d’été comme la Rhénanie-du-Nord-Westphalie.',
    demo: (
      <div className="space-y-3">
        <WeatherWarningBannerDemo />
        <NowcastBannerDemo single />
        <AnatomyHolidayDemo />
      </div>
    ),
  },
  {
    title: 'Les tuiles',
    body: 'Sous « Aujourd’hui dans le parc » s’aligne une rangée de tuiles, la plupart avec un chiffre du jour, comme le nombre d’attractions ouvertes ou l’heure du prochain spectacle. Attractions, Météo, Carte, Spectacles et Restaurants ouvrent leur onglet sur la même page ; le calendrier des temps d’attente et les statistiques sont des pages à part.',
  },
  {
    title: 'Attractions',
    body: 'L’onglet sélectionné à l’ouverture : toutes les attractions en cartes comme au chapitre 01, groupées par zone ou triées par temps d’attente, avec recherche et filtres, par exemple selon la taille ou les attractions ouvertes. Au-dessus figurent celles pour lesquelles il vaut la peine d’arriver tôt. Quand une attraction a une saison, elle figure sur sa carte. En dessous viennent, s’il y en a, les attractions fermées définitivement et le lien vers la page « Avec des enfants ».',
    example: 'À Phantasialand, Taron y figure en tête.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Calendrier des temps d’attente',
    body: 'Une page à part pour chaque mois : les jours du chapitre 04 dans la grille du mois, une fenêtre avec le détail de chaque jour, et la comparaison de deux jours. En haut figurent les dates les plus calmes des trois prochains mois et le jour de semaine le plus calme.',
    demo: (
      <div className="space-y-3">
        <AnatomyBestDaysDemo locale="fr" />
        <AnatomyCalendarDemo />
      </div>
    ),
  },
  {
    title: 'Météo, carte, spectacles, restaurants',
    body: 'Quatre autres onglets. La météo du moment, la courbe de la journée et la prévision, les heures d’ouverture du parc prenant le plus de place sur l’axe. Une carte avec toutes les attractions. Les spectacles avec leurs horaires pour toute la journée et les restaurants avec leur statut, les deux seulement si le parc en fournit.',
    example:
      'Le 4 novembre 2026, Europa-Park recensait 16 spectacles et 64 restaurants. Phantasialand n’avait aucun spectacle au programme ce jour-là, donc pas d’onglet spectacles non plus.',
    demo: (
      <div className="space-y-3">
        <WeatherCardShowcase variant="single" />
        <AnatomyShowsDemo />
      </div>
    ),
  },
  {
    title: 'Parcs à proximité',
    body: 'Jusqu’à trois autres parcs dans un rayon de 100 kilomètres, avec la distance et le statut.',
    example:
      'Depuis Phantasialand, Toverland et Movie Park Germany, tous deux à 90 bons kilomètres.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'au moins deux autres parcs se trouvent dans ce rayon.',
  },
  {
    title: 'Blog',
    body: 'Les articles où ce parc apparaît.',
    demo: <AnatomyBlogDemo locale="fr" />,
    onlyWhen: 'il y en a.',
  },
  {
    title: 'Statistiques',
    body: 'Les files les plus longues du parc, en moyenne sur les heures d’ouverture, plus les mois, les jours de semaine et les jours mesurés les plus chargés et les plus calmes. La tuile « Statistiques » mène à une page à part, qui montre en plus une journée normale heure par heure.',
    demo: <AnatomyStatsDemo />,
  },
  {
    title: 'Les douze prochains mois',
    body: 'La prévision jour par jour, regroupée par mois, avec le nombre de jours recommandés. Un mois mène au calendrier des temps d’attente.',
    onlyWhen: 'il existe une prévision pour le parc.',
  },
  {
    title: 'Saisons et événements',
    body: 'Halloween, Noël et d’autres événements avec leurs dates, l’indication s’ils sont confirmés, annoncés ou seulement attendus, et le prix d’un billet séparé.',
    onlyWhen: 'nous avons recherché des événements pour ce parc.',
  },
  {
    title: 'Infos et questions',
    body: 'Adresse, téléphone, année d’ouverture et superficie, dans la mesure où nous les avons, puis les questions fréquentes sur ce parc.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'La veille, heure par heure',
    body: 'Pour chaque attraction et chaque heure de la veille, l’attente habituelle et celle des moments les plus chargés.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'Le niveau normal de chaque parc',
    body: 'La valeur à laquelle l’affluence d’un parc est comparée.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'Le modèle des semaines à venir réapprend',
    body: 'Il intègre les temps d’attente de la veille.',
  },
  {
    hour: 4,
    minute: 0,
    at: 0.34,
    title: 'Le niveau normal de chaque attraction',
    body: 'La valeur à laquelle se mesure le niveau d’affluence de la carte du chapitre 01.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.46,
    title: 'Résumer la veille',
    body: 'Toute la journée précédente, par quarts d’heure.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.6,
    title: 'Se lever tôt, ça vaut le coup ?',
    body: 'Par attraction, ce que fait gagner un départ matinal et combien de temps l’avance tient.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.72,
    title: 'Normal et chargé par jour de semaine',
    body: 'Les valeurs du chapitre 02 pour chaque attraction, avec le record.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.86,
    title: 'Le modèle du reste de l’année réapprend',
    body: 'Lui aussi intègre les temps d’attente de la veille.',
  },
];

const FAQ = [
  {
    question: 'Que veulent dire « normal » et « chargé » pour un temps d’attente ?',
    answer:
      'Normal est la médiane des pics quotidiens : sur la moitié des jours mesurés, la file la plus longue était plus courte. Chargé est le 90e centile de la même série, à peu près le jour le plus chargé sur dix. Le record est affiché à côté. Comme ces deux valeurs sont des centiles, une seule valeur extrême les déplace à peine.',
  },
  {
    question: 'Est-ce que 70 minutes d’attente, c’est beaucoup ?',
    answer:
      'Cela dépend de l’attraction et du jour de la semaine. Le lundi, Taron, à Phantasialand, plafonne normalement à 55 minutes, et 70, c’est donc beaucoup. Le samedi, 70 minutes correspondent à la médiane, soit une journée tout à fait normale. Les deux valeurs de comparaison figurent sur park.fan, sur la page de l’attraction.',
  },
  {
    question: 'D’où viennent les temps d’attente ?',
    answer:
      'De trois sources publiques au plus. ThemeParks.wiki est la source de base ; Queue-Times.com et Wartezeiten.app ajoutent les attractions qui y manquent et corrigent un « fermé » périmé. Nous récupérons de nouvelles valeurs toutes les cinq minutes.',
  },
  {
    question: 'Pourquoi certains parcs affichent-ils « Pas de prévision » ?',
    answer:
      'Un niveau d’affluence compare le parc à son propre passé, et il faut pour cela une trentaine de jours d’exploitation. Pour les parcs neufs ou rarement ouverts, la case reste donc vide au lieu d’afficher une couleur devinée.',
  },
  {
    question: 'Pourquoi Hansa-Park n’affiche-t-il aucun temps d’attente ?',
    answer:
      'Le parc n’affiche ses temps d’attente que dans sa propre application, et uniquement sur le wifi du parc. Il n’existe aucune interface publique. Sur park.fan, une mention placée au-dessus de la liste des attractions explique donc pourquoi aucun temps n’y figure.',
  },
  {
    question: 'Qu’est-ce que le rope drop ?',
    answer:
      'Se placer à une attraction précise dès l’ouverture du parc, avant que les allées ne se remplissent. park.fan le recommande quand le pic de l’attraction atteint au moins 60 minutes et que le départ matinal en fait gagner au moins 45, et indique combien de temps l’avance tient à peu près.',
  },
  {
    question: 'park.fan est-il payant, et faut-il un compte ?',
    answer:
      'Non et non. Tout sur park.fan est gratuit et utilisable sans inscription. Les favoris et les plans de journée restent dans votre navigateur. C’est seulement si vous partagez un plan ou demandez des notifications à son sujet que nous le conservons aussi chez nous.',
  },
  {
    question: 'À quelle fréquence les chiffres sont-ils actualisés ?',
    answer:
      'Une page de parc ouverte récupère de nouvelles valeurs toutes les cinq minutes. Nous recalculons les valeurs par jour de semaine et les recommandations rope drop une fois par nuit, parce qu’elles bougent à peine d’un jour à l’autre.',
  },
];

/** The guide page's article, French. */
export function ContentFR() {
  const glossary = `/${GLOSSARY_SEGMENTS.fr}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.fr}`;
  const planner = `/${PLANNER_SEGMENTS.fr}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Chapitres" />

      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan est né dans une file d’attente. Taron, milieu d’après-midi, l’affichage indiquait
          quelque chose à trois chiffres, et personne dans la file ne savait si c’était de la
          malchance ou juste un mardi.
        </Lead>
        <P>
          Le temps d’attente actuel s’affiche à l’entrée et dans l’application du parc. park.fan
          montre en plus à quoi ressemble une journée normale à cette attraction, quand sa file
          raccourcit et quel jour la visite vaut vraiment le coup.
        </P>
        <P>
          Les cartes, badges et tableaux qui suivent sont les composants mêmes de park.fan. La
          plupart affichent des chiffres d’exemple figés, tels que l’API les a fournis à l’été et à
          l’automne 2026, presque tous relevés à Phantasialand ; deux tableaux sont en direct. Au
          parc, vous avez les mêmes cartes sur votre téléphone, avec les chiffres du jour.
        </P>

        <Reveal>
          <ChapterList chapters={CHAPTERS} ariaLabel="Chapitres" />
        </Reveal>
      </div>

      <SectionShell
        id="chiffre"
        index="01"
        kicker="La carte"
        title="Ce qui accompagne le temps d’attente"
        icon={Gauge}
      >
        <P>
          À l’entrée de Taron s’affichent 70 minutes. Il n’y est pas écrit s’il vaut mieux faire la
          queue maintenant ou après le déjeuner. Sur park.fan, le même chiffre est accompagné d’un
          niveau d’affluence, d’une tendance, de la file single rider et de la taille minimale.
        </P>

        <BareNumberVsCard
          unit="minutes"
          signLabel="Ce que le parc affiche"
          signCaption="Un chiffre sans point de comparaison."
          cardLabel="Ce que park.fan en fait"
          cardCaption="Les mêmes 70 minutes, avec l’affluence, la tendance, le temps single rider, la taille minimale et l’indication du moment où cela se calme."
        />

        <div className="space-y-4 pt-2">
          <P>
            Le niveau d’affluence compare le chiffre au niveau normal de cette attraction, la
            médiane de ses temps d’attente mesurés. Pour Taron, il était de {TARON_BASELINE} minutes
            en septembre, {TARON_WAIT_NOW} en représentent un peu plus d’une fois et demie, et ce
            niveau s’appelle « Très élevée ». La petite flèche à côté indique si la file grossit ou
            se résorbe.
          </P>
          <PG>
            Quand une attraction a une file single rider, son temps d’attente figure lui aussi sur
            la carte. La taille minimale également, pour ne pas découvrir à la toise qu’un enfant de
            120 centimètres est trop petit.
          </PG>
        </div>

        <DemoFrame
          label="Deux attractions, la même minute"
          note="Taron et Black Mamba au même instant : une file grossit, l’autre se résorbe. Sur la page du parc, toutes les attractions sont réunies ainsi, groupées par zone."
          href={PARK}
          hrefLabel="Phantasialand sur park.fan →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

      <Ambience>
        <SectionShell
          id="echelle"
          index="02"
          kicker="L’échelle"
          title="Normal, chargé, record"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} min`}
            label="La plus longue file mesurée de Taron"
            note="Le 16 juillet 2026. En Rhénanie-du-Nord-Westphalie, l’école n’était pas finie, mais les régions voisines étaient déjà en vacances d’été. Un seul jour : il figure à côté comme record et ne déplace guère l’échelle."
          >
            <P>
              Pour savoir si 70 minutes, c’est beaucoup, il faut deux valeurs de comparaison.
              « Normal » donne la longueur ordinaire de la plus longue file de la journée à cette
              attraction, « chargé » la longueur qu’elle atteignait les dix pour cent de jours les
              plus chargés.
            </P>
          </IntroWithAside>

          <div className="pt-2">
            <WaitScaleStage
              steps={SCALE_STEPS}
              wait={TARON_WAIT_NOW}
              max={WAIT_SCALE_MAX}
              record={TARON_RECORD}
              labels={SCALE_LABELS}
              legend={SCALE_LEGEND}
            >
              {SCALE_STEPS.map((step, i) => (
                <div key={step.id} data-wait-step={step.id} className="scroll-mt-28">
                  <div className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
                    {step.label}
                  </div>
                  <h3 className="mb-3 text-xl font-bold sm:text-2xl">
                    {i === 0 && 'Pour un lundi, 70 minutes, c’est beaucoup'}
                    {i === 1 && 'Le samedi, 70 minutes, c’est normal'}
                    {i === 2 && 'Et une fois, ce fut 135'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {i === 0 && (
                      <>
                        Le lundi, le pic de la journée est d’ordinaire de {step.typical} minutes, et
                        neuf lundis sur dix il reste à {step.busy} ou en dessous. Si vous voyez{' '}
                        {TARON_WAIT_NOW} aujourd’hui, vous êtes tombé sur un des lundis chargés.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Le samedi, {step.typical} minutes, c’est la médiane : la moitié des samedis,
                        la plus longue file est restée en dessous. Ce jour-là, le même affichage est
                        tout à fait normal.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        En semaine, le pic est d’ordinaire de {step.typical} minutes. La ligne
                        pointillée tout au bout de l’échelle est le record de {TARON_RECORD} minutes
                        du 16 juillet. Un jour comme celui-là fausserait une moyenne, c’est pourquoi
                        « chargé » se calcule sur les dix pour cent de jours les plus chargés et non
                        sur le maximum.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    pinned figure there that could change. */}
                  <WaitScaleBar
                    step={step}
                    wait={TARON_WAIT_NOW}
                    max={WAIT_SCALE_MAX}
                    record={TARON_RECORD}
                    labels={SCALE_LABELS}
                    className="bg-card/60 mt-5 rounded-2xl border p-5 lg:hidden"
                  />
                </div>
              ))}
            </WaitScaleStage>
          </div>

          {/* Card left, prose right: the card is a park-page sidebar component, so it keeps
              its own width and the text takes the rest. */}
          <div className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <DemoFrame
              label="Sur la page d’une attraction"
              note="Valeurs de Taron relevées le 10 septembre 2026."
              href={TARON}
              hrefLabel="Valeurs actuelles de Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                Sur la page de chaque attraction, cette échelle figure jour de semaine par jour de
                semaine. Le chiffre au-dessus de la barre est la valeur chargée, la partie pleine en
                dessous la valeur normale, et tout en bas se trouve le record avec sa date.
              </P>
              <P>
                Le samedi est le seul jour où les {TARON_WAIT_NOW} minutes de Taron tombent pile au
                milieu. Le calcul repose sur {TARON_WEEKDAY_DAYS} jours mesurés en semaine et{' '}
                {TARON_WEEKEND_DAYS} le week-end.
              </P>
            </div>
          </div>

          <DemoFrame
            label="Tout le parc, en direct"
            note="Les files les plus longues de Phantasialand, telles qu’elles figurent en ce moment sur la page du parc. Ce tableau est calculé autrement que la page d’une attraction : il fait la moyenne sur toutes les heures d’ouverture des deux dernières années. « Typique », c’est l’attente habituelle au sein d’une heure, « Pic », celle des minutes les plus chargées de cette heure. C’est pourquoi ses chiffres restent sous les pics quotidiens de l’échelle ci-dessus."
            href={PARK}
            hrefLabel="Phantasialand sur park.fan →"
          >
            <LiveTopAttractions locale="fr" />
          </DemoFrame>
        </SectionShell>
      </Ambience>

      <SectionShell
        id="moment"
        index="03"
        kicker="L’heure"
        title="Le meilleur moment de la journée"
        icon={Sunrise}
      >
        <P>
          « Venir tôt » n’aide que si la file grossit au fil de la journée, et ce n’est pas le cas à
          toutes les attractions. Six attractions du même parc, heure par heure :
        </P>

        <DemoFrame
          label="Le profil horaire, en direct"
          note="En direct du profil horaire du parc. En gras, l’heure la plus chargée de chaque attraction."
          href={PARK}
          hrefLabel="Phantasialand sur park.fan →"
        >
          <LiveHourlyProfile locale="fr" />
        </DemoFrame>

        <div className="space-y-4 pt-2">
          <P>
            Pour Taron, l’heure compte à peine. Les valeurs restent toute la journée dans une bande
            étroite, et c’est le jour de la semaine du chapitre 02 qui fait la différence. Chiapas,
            au contraire, se remplit nettement jusque dans l’après-midi. C’est pourquoi park.fan
            calcule le meilleur moment attraction par attraction.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="La recommandation qui en découle"
            note="Elle n’est émise que si le pic de l’attraction atteint au moins 60 minutes et si le départ matinal en fait gagner au moins 45."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <PG>
              La carte donne le temps d’attente habituel à l’ouverture, le pic de la journée, ce que
              vous gagnez et jusqu’à quelle heure l’avance tient.
            </PG>
            <P>
              Si le moment le plus calme d’une attraction tombe ailleurs, le soir par exemple, il
              figure aussi sur la carte. Sur la page du parc, les attractions où le réveil matinal
              rapporte le plus sont triées par minutes gagnées.
            </P>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        id="jour"
        index="04"
        kicker="La date"
        title="Le bon jour, des mois à l’avance"
        icon={CalendarDays}
      >
        <P>
          La date décide plus que l’heure. Entre deux jours de la même semaine, l’attente moyenne
          peut varier d’une demi-heure, selon les vacances scolaires, les jours fériés, les ponts et
          la météo.
        </P>

        <DemoFrame
          label="Une semaine de vacances d’automne"
          note="Quatre jours mesurés à Phantasialand, tous pendant les vacances d’automne 2026 de Rhénanie-du-Nord-Westphalie : le mardi 20 octobre, 45 minutes en moyenne aux grandes attractions, le dimanche suivant 20. Les mêmes vacances, quatre niveaux différents. Sur park.fan, le même calendrier se déroule mois par mois."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page: two prose
            columns would put a third text edge under the paragraph above. */}
        <div className="space-y-4 pt-2">
          <P>
            Les vacances des régions voisines comptent souvent autant que celles de la région du
            parc, parce que les visiteurs à la journée ne s’arrêtent pas aux frontières.
            Phantasialand est à environ 60 kilomètres des Pays-Bas, et son calendrier affiche, en
            plus des vacances de Rhénanie-du-Nord-Westphalie, celles des provinces du Limbourg et de
            Gueldre. Les vacances des régions voisines que nous avons retenues pour un parc
            reçoivent leur propre marque.
          </P>
          <PG>
            La couleur d’un jour à venir est une prévision, celle d’un jour passé est mesurée. La
            page Fancast calcule publiquement à quel point nos prévisions tombent juste.
          </PG>
          <P>
            Quand un parc publie ses horaires, le calendrier va aussi loin qu’eux, un an au plus, et
            un jour où le parc est fermé apparaît comme fermé. Pour une vue d’ensemble, la page du
            parc résume la prévision mois par mois sous « Les douze prochains mois ».
          </P>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/fancast"
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            La précision du modèle
          </Link>
          <Link
            href={bestTime}
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Meilleure période par parc
          </Link>
        </div>
      </SectionShell>

      <SectionShell
        id="plan-journee"
        index="05"
        kicker="Le planificateur"
        title="Dérouler la journée à l’avance"
        icon={CalendarClock}
      >
        <P>
          Dans le planificateur, vous placez les attractions que vous voulez faire sur une frise
          horaire. Chaque bloc a la hauteur du temps d’attente prévu à son heure, et entre deux
          blocs, vous voyez si le temps suffit pour le trajet.
        </P>
        <P>
          Ci-dessous, un plan pour Phantasialand le samedi 12 septembre 2026, avec la prévision du 4
          septembre. Faites glisser un bloc sur une autre heure, et sa hauteur change, les
          correspondances aussi. Votre propre plan n’est pas modifié.
        </P>

        <DemoFrame
          label="Un samedi planifié"
          href={planner}
          hrefLabel="Vers le planificateur →"
          className="mx-auto max-w-[560px]"
        >
          <PlannerDayFigure />
        </DemoFrame>

        <P>
          Ce que le planificateur propose d’autre, comme marquer les attractions selon la taille
          minimale ou trier la journée d’un clic, est décrit sur la{' '}
          <A href={planner}>page du planificateur</A>.
        </P>
      </SectionShell>

      <SectionShell
        id="page-parc"
        index="06"
        kicker="La visite guidée"
        title="Une page de parc, de haut en bas"
        icon={Layers}
      >
        <P>
          Tout ce que contiennent les premiers chapitres tient sur une seule page par parc, dans
          l’ordre où les questions se posent : le parc est-il ouvert aujourd’hui ? Va-t-il
          pleuvoir ? Quelle est la longueur de la file ? Et quand aurais-je mieux fait de venir ?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Seulement si :" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              La moitié de ces sections n’apparaît que s’il y a quelque chose à montrer. Un parc
              sans spectacles n’a ni tuile spectacles ni onglet spectacles vide.
            </Highlight>
            <PG>
              L’onglet choisi est enregistré dans l’adresse. Un lien envoyé depuis la carte ouvre la
              carte, pas la liste des attractions. Le calendrier et les statistiques sont des pages
              qui ont leur propre adresse.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Voir Phantasialand
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      <Ambience tone="emerald">
        <SectionShell
          id="nuit"
          index="07"
          kicker="Les fondations"
          title="D’où viennent les chiffres"
          icon={Database}
        >
          <P>
            Toutes les cinq minutes, nous récupérons de nouveaux temps d’attente pour chacun des
            plus de 200 parcs, auprès de trois sources publiques au plus. ThemeParks.wiki est la
            source de base. Queue-Times.com et Wartezeiten.app ajoutent les attractions qui y
            manquent et corrigent un « fermé » périmé. Pour quelques parcs, l’une des deux est la
            seule source.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Temps d’attente" delay={0}>
              ThemeParks.wiki comme base, Queue-Times.com et Wartezeiten.app pour ce qui y manque.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vacances & jours fériés" delay={60}>
              Région par région : en Europe par Nager.Date et OpenHolidays, ailleurs d’après les
              calendriers des autorités et des districts scolaires.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Météo" delay={120}>
              Open-Meteo pour la prévision et une prévision de pluie à court terme par quarts
              d’heure, les alertes météo du DWD et de MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Horaires d’ouverture" delay={0}>
              Depuis les calendriers des parcs. Là où un parc n’en publie pas, nous déduisons les
              horaires du jour et des jours précédents de l’activité des attractions, et nous
              indiquons qu’ils sont estimés.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Historique" delay={60}>
              Chaque temps d’attente mesuré reste enregistré, même celui d’un mardi matin
              tranquille.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Modèles de prévision" delay={120}>
              Un pour aujourd’hui, un pour les semaines à venir, un pour le reste de l’année. Chacun
              est confronté aux temps d’attente réellement observés.
            </IngredientCard>
          </IngredientGrid>

          <div className="space-y-4 pt-4">
            <P>
              La longueur de la file de Taron un mardi ordinaire, nous la calculons la nuit, pendant
              que les parcs d’Europe sont fermés. Quand vous ouvrez la page le matin, le calcul est
              déjà fait.
            </P>
          </div>

          <NightShift
            locale="fr"
            jobs={NIGHT_JOBS}
            caption="Heures en UTC. L’ordre garantit que chaque étape trouve déjà les chiffres dont elle a besoin. Le modèle du jour ne réapprend qu’à 08:30."
          />
        </SectionShell>
      </Ambience>

      <SectionShell
        id="limites"
        index="08"
        kicker="Les limites"
        title="Quand nous ne savons pas"
        icon={HelpCircle}
      >
        <P>
          Dans trois cas, nous préférons laisser une case vide plutôt que de deviner un chiffre.
        </P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Parc sans source lisible"
            note="Hansa-Park n’affiche ses temps d’attente que dans sa propre application, sur le wifi du parc. Cette mention figure donc au-dessus de ses quelque 80 attractions et explique pourquoi aucun temps n’y est indiqué."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Attraction hors saison"
            note="Personne ne remonte quoi que ce soit sur une patinoire en août. Comme nous connaissons sa saison, de novembre à janvier, elle apparaît alors hors saison et ne compte pas parmi les attractions ouvertes."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Aucune base d’évaluation"
            note="Sous une trentaine de jours d’exploitation, la valeur de référence manque. Un parc récent reçoit donc « Pas de prévision » au lieu d’une couleur."
          >
            <BadgeRowDemo
              crowdLabel="Les niveaux"
              caption={`Chaque niveau se mesure au passé de l’attraction ou du parc lui-même, jamais aux autres parcs. À 70 minutes, Taron est en affluence « Très élevée » parce que son niveau normal était de ${TARON_BASELINE} minutes en septembre.`}
            />
          </DemoFrame>
        </div>
      </SectionShell>

      <SectionShell id="reperes" index="09" kicker="Repères" title="Où trouver quoi" icon={Search}>
        <TouchpointGrid
          items={[
            {
              icon: Search,
              title: 'Recherche',
              body: (
                <>
                  La touche / sur chaque page, ou le champ de recherche en haut. Trouve parcs,
                  attractions, spectacles, restaurants et lieux, même avec des fautes de frappe.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Localisation',
              body: (
                <>
                  Si vous l’autorisez, la page d’accueil affiche les parcs près de chez vous. Dans
                  le parc, une boussole indique où se trouvent les grandes attractions, avec les
                  plus proches, leur distance et leur temps d’attente.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favoris',
              body: (
                <>
                  L’étoile sur les parcs, attractions, spectacles et restaurants. Les favoris
                  apparaissent avec leur temps d’attente actuel sur la page d’accueil et dans{' '}
                  <A href="/favorites">Mes favoris</A>, enregistrés dans le navigateur, sans compte.
                </>
              ),
            },
            {
              icon: Bell,
              title: 'Alertes',
              body: (
                <>
                  La cloche d’une attraction ou d’un spectacle vous envoie une notification quand
                  l’attente passe sous votre seuil, que l’attraction rouvre ou que le spectacle va
                  commencer. Toutes figurent dans <A href="/alerts">Mes alertes</A>.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Taille',
              body: (
                <>
                  Dans l’onglet Attractions, réglez le curseur sur le plus petit enfant, et il ne
                  reste que les attractions qu’il a le droit de faire. La page « Avec des enfants »
                  d’un parc a le même curseur.
                </>
              ),
            },
            {
              icon: CalendarClock,
              title: 'Planificateur',
              body: (
                <>
                  S’ouvre depuis n’importe quelle page. Le plan reste dans le navigateur, plus de
                  détails au chapitre 05.
                </>
              ),
            },
            {
              icon: BarChart3,
              title: 'Page d’attraction',
              body: (
                <>
                  Historique, attente normale et chargée par jour de semaine, rope drop, taille
                  minimale et précision de la prévision pour cette attraction.
                </>
              ),
            },
            {
              icon: Scale,
              title: 'Comparer des parcs',
              body: (
                <>
                  <A href="/compare">Comparer des parcs</A> place deux à quatre parcs côte à côte,
                  avec leur attente moyenne, leur file la plus longue et leur jour de semaine le
                  plus calme.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog et actualités',
              body: (
                <>
                  Des textes plus longs sur des parcs et des attractions, dont des{' '}
                  <A href="/blog/category/guides">guides de parc</A> avec billets, ordre de visite
                  et accès. Les <A href="/news">Actualités</A> donnent de brèves nouvelles des
                  parcs.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Dictionnaire',
              body: (
                <>
                  <A href={glossary}>Tous les termes techniques</A> avec explication et attractions
                  d’exemple, certains avec un modèle 3D.
                </>
              ),
            },
          ]}
        />
      </SectionShell>

      <SectionShell
        id="parky"
        index="10"
        kicker="L’assistant"
        title="Demandez à Parky"
        icon={MessageCircle}
      >
        <ParkyShot locale="fr">
          <P>
            Parky est l’assistant de chat de park.fan et habite le bouton rond en bas à droite. Sur
            la page d’accueil, sur un grand écran, il se tient juste sous le titre et ne saute dans
            son coin qu’une fois que vous faites défiler la page.
          </P>
          <P>
            Demandez-lui combien de temps on attend en ce moment, ce qui est prévu pour aujourd’hui
            ou les semaines à venir, quels jours les files d’un parc sont courtes, quelle est la
            hauteur et la vitesse d’un grand huit, ou ce que racontent nos articles. Pour chaque
            réponse, il consulte les mêmes données que celles des pages.
          </P>
          <P>
            Il montre les parcs et les attractions sous forme de cartes avec leurs chiffres. Si vous
            le lui demandez, il vous emmène sur la bonne page et prépare une journée dans le
            planificateur, y ajoute des attractions ou les trie. Il ne voit votre position que si
            vous appuyez sur « Partager ma position » dans le chat, et il ne la garde pas.
          </P>
          <P>
            Les réponses sont rédigées par un modèle de langage, qui se trompe parfois. Les chiffres
            des cartes du chat viennent directement de park.fan ; en cas de doute sur ce que Parky
            en dit, vérifiez sur la page de l’attraction. Il s’en tient aux parcs et aux
            attractions, ne cherche pas sur Internet, et après trois questions en 30 secondes, il a
            besoin d’une courte pause.
          </P>
          <P>
            Nous enregistrons vos questions sans adresse IP et les supprimons au bout de 7 jours.
            Vous trouverez plus d’informations sur Parky, avec des exemples de questions, sur{' '}
            <A href="/parky">sa propre page</A>.
          </P>
        </ParkyShot>
      </SectionShell>

      <SectionShell
        id="faq"
        index="11"
        kicker="Vos questions"
        title="Questions fréquentes"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="Et maintenant ?"
        title="Pour aller plus loin"
        body="park.fan est gratuit, sans compte et sans publicité. La page d’un parc montre tout cela avec les chiffres du jour, la page Fancast détaille la précision des prévisions des sept derniers jours, et la meilleure période compare plusieurs parcs."
        destinations={[
          { href: PARK, label: 'Voir un exemple de page de parc', icon: Activity, prefetch: false },
          { href: bestTime, label: 'Meilleure période', icon: CalendarDays, prefetch: false },
          { href: '/fancast', label: 'Précision des prévisions', icon: Sparkles, prefetch: false },
        ]}
      />
    </>
  );
}
