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
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Ruler,
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
  AnatomyHeaderDemo,
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomySeasonDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterRail } from '../_chapter-rail';
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
  typical: 'Habituel',
  busy: 'Chargé',
  unit: 'min',
  days: 'jours mesurés',
  record: 'Record',
  summary:
    'Taron le {label} : habituellement {typical} minutes, {busy} les jours chargés, sur {days} jours mesurés. À l’entrée, {wait} minutes.',
};

const SCALE_LEGEND = [
  {
    term: 'Habituel',
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
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Whoever reorders them there reorders
 * them here, or the guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'En-tête',
    body: 'Nom, lieu et distance, plus le statut, les horaires du jour, l’affluence et le nombre d’attractions ouvertes en ce moment.',
    example: 'Phantasialand, Brühl. Aujourd’hui 09:00–19:00, 36 attractions sur 40 ouvertes.',
    demo: <AnatomyHeaderDemo />,
  },
  {
    title: 'Vacances scolaires alentour',
    body: 'Les vacances scolaires et les jours fériés qui pèsent aujourd’hui sur le parc, ceux de sa propre région en premier.',
    demo: <AnatomyHolidayDemo />,
    onlyWhen: 'des vacances ou un jour férié entrent en jeu aujourd’hui.',
  },
  {
    title: 'Alerte météo',
    body: 'Alertes officielles du DWD et de MeteoAlarm, reprises telles quelles.',
    demo: <WeatherWarningBannerDemo />,
    onlyWhen: 'une alerte est active pour le lieu.',
  },
  {
    title: 'Radar de pluie',
    body: 'Les prochaines heures par quarts d’heure. Vous y voyez si une averse sera passée dans vingt minutes.',
    demo: <NowcastBannerDemo single />,
    onlyWhen: 'il pleut à proximité.',
  },
  {
    title: 'Carte météo',
    body: 'La météo du moment, la courbe de la journée et la prévision. Sur l’axe, les heures où le parc est ouvert prennent le plus de place.',
    demo: <WeatherCardShowcase variant="single" />,
  },
  {
    title: 'Prix coupe-file',
    body: 'Tarifs du jour des files payantes comme Lightning Lane, complet signalé comme tel.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'le parc les publie, pour l’instant seulement les parcs Disney aux États-Unis.',
  },
  {
    title: 'Attractions',
    body: 'Toutes les attractions en cartes comme au chapitre 01, avec recherche, groupées par zone. Au-dessus figurent celles pour lesquelles il vaut la peine d’arriver tôt.',
    example: 'À Phantasialand, Taron y figure, avec 60 minutes gagnées.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Calendrier et carte',
    body: 'Les prévisions journalières du chapitre 04 dans la grille du mois, et une carte avec toutes les attractions.',
    demo: <AnatomyCalendarDemo />,
  },
  {
    title: 'Spectacles et restaurants',
    body: 'Horaires des spectacles pour toute la journée, restaurants avec heures d’ouverture.',
    example: 'À Phantasialand, quatre spectacles et 46 restaurants.',
    demo: <AnatomyShowsDemo />,
    onlyWhen: 'le parc en fournit.',
  },
  {
    title: 'Meilleurs jours',
    body: 'Les dates les plus calmes des trois prochains mois et le jour de semaine le plus calme du parc.',
    demo: <AnatomyBestDaysDemo locale="fr" />,
    onlyWhen: 'le parc publie un calendrier d’exploitation.',
  },
  {
    title: 'Parcs à proximité',
    body: 'Ce qu’il y a d’autre à portée, avec la distance et le statut.',
    example:
      'Depuis Phantasialand, Toverland et Movie Park Germany, tous deux à 90 bons kilomètres.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'un autre parc se trouve à portée.',
  },
  {
    title: 'Blog',
    body: 'Les articles où ce parc apparaît.',
    demo: <AnatomyBlogDemo locale="fr" />,
    onlyWhen: 'il y en a.',
  },
  {
    title: 'Statistiques',
    body: 'Les files les plus longues du parc avec leur valeur habituelle et chargée, plus la répartition par mois et par jour de semaine.',
    demo: (
      <AnatomyStatsDemo
        title="Attractions aux files les plus longues"
        labelAttraction="Attractions"
        labelMinutes="min"
        labelNow="Maintenant"
        labelP50="Habituel"
        labelP90="Pointe"
      />
    ),
  },
  {
    title: 'Saison, infos, questions',
    body: 'Périodes d’ouverture et événements, adresse et fuseau horaire, questions fréquentes sur ce parc.',
    example: 'La patinoire du chapitre 08 y figure, avec sa saison de novembre à janvier.',
    demo: <AnatomySeasonDemo label="Patinoire" />,
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Ce qu’une heure a d’habituel',
    body: 'Valeur habituelle et valeur chargée pour chaque attraction et chaque heure.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.22,
    title: 'Le niveau normal de chaque parc',
    body: 'La valeur à laquelle l’affluence est comparée.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.42,
    title: 'Résumer la veille',
    body: 'Toute la journée précédente, par quarts d’heure.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.56,
    title: 'Se lever tôt, ça vaut le coup ?',
    body: 'Par attraction, ce que fait gagner un départ matinal et combien de temps l’avance tient.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.67,
    title: 'L’habituel par jour de semaine',
    body: 'Le tableau du chapitre 02 pour chaque attraction, avec le record.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.8,
    title: 'Le modèle de prévision réapprend',
    body: 'Il s’entraîne sur les temps d’attente de la veille.',
  },
];

const FAQ = [
  {
    question: 'Que veulent dire « habituel » et « chargé » pour un temps d’attente ?',
    answer:
      'Habituel est la médiane des pics quotidiens : sur la moitié des jours mesurés, la file la plus longue était plus courte. Chargé est le 90e centile de la même série, à peu près le jour le plus chargé sur dix. Le record est affiché à part, pour qu’une seule valeur extrême ne déplace ni l’une ni l’autre.',
  },
  {
    question: 'Est-ce que 70 minutes d’attente, c’est beaucoup ?',
    answer:
      'Cela dépend de l’attraction et du jour de la semaine. Le lundi, Taron, à Phantasialand, plafonne habituellement à 55 minutes, et 70, c’est donc beaucoup. Le samedi, 70 minutes correspondent à la médiane, soit une journée tout à fait normale. Les deux valeurs de comparaison figurent sur park.fan, sur la page de l’attraction.',
  },
  {
    question: 'D’où viennent les temps d’attente ?',
    answer:
      'De trois sources publiques : ThemeParks.wiki, Wartezeiten.app et Queue-Times.com. Nous interrogeons chaque parc toutes les cinq minutes, et quand les sources annoncent des chiffres différents, la majorité l’emporte.',
  },
  {
    question: 'Pourquoi certains parcs affichent-ils « Pas de prévision » ?',
    answer:
      'Un niveau d’affluence compare le parc à son propre passé, et il faut pour cela une trentaine de jours d’exploitation. Pour les parcs neufs ou rarement ouverts, la case reste donc vide au lieu d’afficher une couleur devinée.',
  },
  {
    question: 'Pourquoi Hansa-Park n’affiche-t-il aucun temps d’attente ?',
    answer:
      'Le parc n’affiche ses temps d’attente que dans sa propre application, et uniquement sur le wifi du parc. Il n’existe aucune interface publique. Sur park.fan, une mention remplace donc 82 attractions qui auraient l’air vides.',
  },
  {
    question: 'Qu’est-ce que le rope drop ?',
    answer:
      'Se placer à une attraction précise dès l’ouverture du parc, avant que les allées ne se remplissent. park.fan le recommande quand le pic de l’attraction atteint au moins 60 minutes et que le départ matinal en fait gagner au moins 45, et indique combien de temps l’avance tient à peu près.',
  },
  {
    question: 'park.fan est-il payant, et faut-il un compte ?',
    answer:
      'Non et non. Tout sur park.fan est gratuit et utilisable sans inscription. Les favoris et les plans de journée restent dans votre navigateur.',
  },
  {
    question: 'À quelle fréquence les chiffres sont-ils actualisés ?',
    answer:
      'Une page de parc ouverte récupère de nouvelles valeurs toutes les cinq minutes. Nous recalculons les temps d’attente habituels et les recommandations rope drop une fois par nuit, parce qu’ils bougent à peine d’un jour à l’autre.',
  },
];

export function ContentFR() {
  const glossary = `/${GLOSSARY_SEGMENTS.fr}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.fr}`;
  const planner = `/${PLANNER_SEGMENTS.fr}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Chapitres" />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
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
          Les cartes, badges et tableaux qui suivent sont les composants mêmes de park.fan,
          alimentés par des chiffres d’exemple figés, relevés à Phantasialand. Au parc, vous avez
          les mêmes cartes sur votre téléphone, avec les chiffres du jour.
        </P>

        <Reveal>
          <nav
            aria-label="Chapitres"
            className="bg-muted/40 not-prose grid gap-x-6 gap-y-2 rounded-2xl border p-5 text-sm sm:grid-cols-2 lg:grid-cols-3"
          >
            {CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="text-muted-foreground hover:text-primary group flex items-baseline gap-2 transition-colors"
              >
                <span className="text-primary/40 group-hover:text-primary/70 text-xs font-bold tabular-nums transition-colors">
                  {c.index}
                </span>
                {c.label}
              </a>
            ))}
          </nav>
        </Reveal>
      </div>

      {/* ── 01 ──────────────────────────────────────────────────────────── */}
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
            Le niveau d’affluence compare le chiffre à ce qui est normal pour cette attraction.
            Taron tourne en moyenne à {TARON_BASELINE} minutes, {TARON_WAIT_NOW} en représentent un
            peu plus d’une fois et demie, et ce niveau s’appelle « Très élevée ». La petite flèche à
            côté indique si la file grossit ou se résorbe.
          </P>
          <PG>
            Quand une attraction a une file single rider, son temps d’attente figure lui aussi sur
            la carte. La taille minimale également, pour ne pas découvrir à la toise qu’un enfant de
            130 centimètres est trop petit.
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

      {/* ── 02 ──────────────────────────────────────────────────────────── */}
      <Ambience>
        <SectionShell
          id="echelle"
          index="02"
          kicker="L’échelle"
          title="Habituel, chargé, record"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} min`}
            label="La plus longue file mesurée de Taron"
            note="Le 16 juillet 2026, pendant les vacances d’été. Un seul jour, qui figure donc à part comme record et reste en dehors de l’échelle."
          >
            <P>
              Pour savoir si 70 minutes, c’est beaucoup, il faut deux valeurs de comparaison.
              « Habituel » donne la longueur ordinaire de la plus longue file de la journée à cette
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
                    {i === 1 && 'Pour un samedi, 70 minutes, c’est la normale'}
                    {i === 2 && 'Et une fois, il y en a eu 135'}
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
                        Le samedi, {step.typical} minutes, c’est la médiane. Ce jour-là, le même
                        affichage est tout à fait normal, et les attractions voisines sont tout
                        aussi chargées.
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

          {/* Card left, prose right. The card is a park-page sidebar component and
              looks absurd stretched across a 1500 px column, so it keeps its own
              width and the text takes the rest instead of leaving a hole. */}
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
                dessous la valeur habituelle, et tout en bas se trouve le record avec sa date.
              </P>
              <P>
                Le samedi est le seul jour où les {TARON_WAIT_NOW} minutes de Taron tombent pile au
                milieu. Le calcul repose sur {TARON_WEEKDAY_DAYS} jours mesurés en semaine et{' '}
                {TARON_WEEKEND_DAYS} le week-end.
              </P>
            </div>
          </div>

          <DemoFrame
            label="Le même tableau pour tout le parc, en direct"
            note="L’état actuel de Phantasialand, avec pour chaque attraction la valeur habituelle et la valeur chargée."
            href={PARK}
            hrefLabel="Phantasialand sur park.fan →"
          >
            <LiveTopAttractions locale="fr" />
          </DemoFrame>
        </SectionShell>
      </Ambience>

      {/* ── 03 ──────────────────────────────────────────────────────────── */}
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

      {/* ── 04 ──────────────────────────────────────────────────────────── */}
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
          label="Quatre jours des vacances d’automne"
          note="Le 15 octobre est le plus calme des quatre parce qu’il pleut, bien qu’il tombe en pleine période de vacances. Le 19, le parc est fermé. Sur park.fan, le même calendrier se déroule mois par mois."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page. As two
            prose columns this band put a third text edge under the paragraph above
            it: a run of copy, then a 604 px column ending short of it, then a
            second column starting where that paragraph still had words. */}
        <div className="space-y-4 pt-2">
          <P>
            Les vacances des régions voisines comptent souvent autant que celles de la région du
            parc, parce que les visiteurs à la journée ne s’arrêtent pas aux frontières.
            Phantasialand est à environ 90 kilomètres des Pays-Bas, et son calendrier affiche, en
            plus des vacances de Rhénanie-du-Nord-Westphalie, celles de la province de Gueldre. Les
            régions de vacances situées dans un rayon d’environ 200 kilomètres reçoivent leur propre
            marque.
          </P>
          <PG>
            La couleur d’un jour est une prévision. La page Fancast calcule publiquement à quel
            point nos prévisions tombent juste.
          </PG>
          <P>
            Pour un parc ouvert toute l’année, le calendrier va environ onze mois à l’avance. Pour
            un parc saisonnier, il s’arrête avec la saison publiée, et un jour où le parc est fermé
            apparaît comme fermé.
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

      {/* ── 05 ──────────────────────────────────────────────────────────── */}
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

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
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
              sans spectacles n’a pas d’onglet spectacles vide.
            </Highlight>
            <PG>
              L’onglet choisi est enregistré dans l’adresse. Un lien envoyé depuis le calendrier
              ouvre le calendrier, pas la liste des attractions.
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

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <Ambience tone="emerald">
        <SectionShell
          id="nuit"
          index="07"
          kicker="Les fondations"
          title="D’où viennent les chiffres"
          icon={Database}
        >
          <P>
            Toutes les cinq minutes, nous interrogeons chacun des 212 parcs auprès de trois sources
            publiques à la fois. Quand elles annoncent des chiffres différents, la majorité
            l’emporte.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Temps d’attente" delay={0}>
              ThemeParks.wiki, Wartezeiten.app et Queue-Times.com, toutes les cinq minutes.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vacances & jours fériés" delay={60}>
              Nager.Date pour les jours fériés et les ponts, OpenHolidays pour les vacances
              scolaires, chaque région séparément.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Météo" delay={120}>
              Open-Meteo pour la prévision et le radar de pluie, les alertes météo du DWD et de
              MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Horaires d’ouverture" delay={0}>
              Depuis les calendriers des parcs. Là où un parc n’en publie pas, nous estimons les
              horaires à partir de l’activité des attractions, et nous l’indiquons.
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
              que les parcs sont fermés. Quand vous ouvrez la page le matin, le calcul est déjà
              fait.
            </P>
          </div>

          <NightShift
            locale="fr"
            jobs={NIGHT_JOBS}
            caption="Heures en UTC. Chaque étape s’appuie sur la précédente."
          />
        </SectionShell>
      </Ambience>

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
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
            note="Hansa-Park n’affiche ses temps d’attente que dans sa propre application, sur le wifi du parc. Sans cette mention, park.fan montrerait 82 attractions qui ont l’air vides."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Attraction hors saison"
            note="Personne ne remonte quoi que ce soit sur une patinoire en août. Elle apparaît donc hors saison et, ce jour-là, ne compte pas parmi les attractions ouvertes."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Aucune base d’évaluation"
            note="Sous une trentaine de jours d’exploitation, la valeur de référence manque. Un parc récent reçoit donc « Pas de prévision » au lieu d’une couleur."
          >
            <BadgeRowDemo
              crowdLabel="Affluence : à quel point c’est plein maintenant"
              comparisonLabel="Comparaison : plus que d’habitude ?"
              caption="À 70 minutes, Taron est en affluence « Très élevée », et face à ses 45 minutes habituelles, en « Beaucoup plus élevé ». Dans un petit parc où 25 minutes sont normales, « Très élevée » peut aller avec « Habituel »."
            />
          </DemoFrame>
        </div>
      </SectionShell>

      {/* ── 09 ──────────────────────────────────────────────────────────── */}
      <SectionShell id="reperes" index="09" kicker="Repères" title="Où trouver quoi" icon={Search}>
        <TouchpointGrid
          items={[
            {
              icon: Search,
              title: 'Recherche',
              body: (
                <>
                  Ctrl + K ou ⌘ + K sur chaque page. Trouve parcs, attractions, spectacles et
                  restaurants, même avec des fautes de frappe.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Localisation',
              body: (
                <>
                  Si vous l’autorisez, la page d’accueil affiche les parcs près de chez vous, et
                  dans le parc, les attractions les plus proches avec distance et temps d’attente.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favoris',
              body: (
                <>
                  L’étoile sur chaque carte de parc et d’attraction. Les favoris apparaissent sur la
                  page d’accueil avec leur temps d’attente actuel et restent dans le navigateur,
                  sans compte.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Taille',
              body: (
                <>
                  Dans l’onglet Attractions, réglez le curseur sur le plus petit enfant, et il ne
                  reste que les attractions qu’il a le droit de faire.
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
                  Historique, temps d’attente habituels par jour de semaine, rope drop, taille
                  minimale et précision de la prévision pour cette attraction.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Des textes plus longs sur des parcs et des attractions, dont des{' '}
                  <A href="/blog/category/guides">guides de parc</A> avec billets, ordre de visite
                  et accès.
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

      {/* ── 10 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="faq"
        index="10"
        kicker="Vos questions"
        title="Questions fréquentes"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="Et maintenant ?"
        title="Pour aller plus loin"
        body="park.fan est gratuit, sans compte et sans publicité. La page d’un parc montre tout cela avec les chiffres du jour, la page Fancast détaille la précision des prévisions des 30 derniers jours, et la meilleure période compare plusieurs parcs."
        destinations={[
          { href: PARK, label: 'Voir un exemple de page de parc', icon: Activity, prefetch: false },
          { href: bestTime, label: 'Meilleure période', icon: CalendarDays, prefetch: false },
          { href: '/fancast', label: 'Précision des prévisions', icon: Sparkles, prefetch: false },
        ]}
      />
    </>
  );
}
