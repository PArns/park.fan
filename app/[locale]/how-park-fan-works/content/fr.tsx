import React from 'react';
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
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CloudSun,
  Compass,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Moon,
  Ruler,
  Search,
  Sparkles,
  Star,
  Sunrise,
  Users,
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
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, ClosingBand, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterRail, type Chapter } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/**
 * Feeds both the chapter list at the top and the rail down the right edge, and
 * must match the `<SectionShell id=… index=…>` calls below exactly — the rail
 * looks its sections up by id, so an entry that drifts silently stops
 * highlighting.
 */
const CHAPTERS: Chapter[] = [
  { id: 'chiffre', index: '01', label: 'Un chiffre tout seul' },
  { id: 'echelle', index: '02', label: 'Habituel, chargé, record' },
  { id: 'moment', index: '03', label: 'Le meilleur moment' },
  { id: 'jour', index: '04', label: 'Le bon jour' },
  { id: 'page-parc', index: '05', label: 'Une page de parc, de haut en bas' },
  { id: 'nuit', index: '06', label: 'D’où viennent les chiffres' },
  { id: 'limites', index: '07', label: 'Ce que nous n’affirmons pas' },
  { id: 'visites', index: '08', label: 'Quatre visites' },
  { id: 'reperes', index: '09', label: 'Où trouver quoi' },
  { id: 'faq', index: '10', label: 'Questions fréquentes' },
];

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Habituel',
  busy: 'Chargé',
  unit: 'min',
  days: 'jours mesurés',
  record: 'Record',
  summary:
    'Taron le {label} : habituellement {typical} minutes, {busy} les jours chargés, sur {days} jours mesurés. Le panneau affiche {wait} minutes.',
};

const SCALE_LEGEND = [
  {
    term: 'Habituel',
    def: 'Médiane des pics quotidiens. La moitié des jours mesurés, la file la plus longue était plus courte que cela.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Chargé',
    def: '90e centile de la même série. Le jour sur dix où il y avait vraiment foule.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'Ce qui est affiché à l’entrée. Ce chiffre ne bouge pas pendant que l’échelle en dessous se déplace.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Record',
    def: `${TARON_RECORD} minutes le 16 juillet 2026. Le pire jour de la période mesurée, et c’est précisément pour cela qu’il ne sert pas de repère.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them. Numbers come
 * from `TARON_TYPICAL_WAITS`, so from the API rather than from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Lundi', typical: 55, busy: 65, sampleDays: 19 },
  { id: 'saturday', label: 'Samedi', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'En semaine', typical: 60, busy: 80, sampleDays: 97 },
];

/**
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Reorder them here and you reorder them
 * there too, or this guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'En-tête',
    body: 'Nom, lieu, distance depuis chez vous, plus le statut, les horaires du jour, l’affluence du moment et le compteur « x sur y ouvertes ». La ligne qui répond à la plupart des visites.',
  },
  {
    title: 'Vacances scolaires alentour',
    body: 'Quelles vacances scolaires pèsent aujourd’hui sur ce parc, avec la région correspondante. Y compris celles de l’autre côté de la frontière.',
    onlyWhen: 'une région de vacances atteint réellement ce parc aujourd’hui.',
  },
  {
    title: 'Alerte météo',
    body: 'Alertes officielles du DWD et de MeteoAlarm, reprises telles quelles. Aucun jugement de notre part sur la météo.',
    onlyWhen: 'une alerte est active pour le lieu.',
  },
  {
    title: 'Radar de pluie',
    body: 'Les prochaines heures par quarts d’heure. Indique si l’averse sera passée dans vingt minutes ou si elle tiendra l’après-midi.',
    onlyWhen: 'des précipitations sont à portée.',
  },
  {
    title: 'Carte météo',
    body: 'Valeur actuelle, courbe de la journée et prévision. L’axe horaire est construit autour des horaires d’ouverture : les heures où le parc est ouvert reçoivent quatre fois plus de place que celles d’avant et d’après.',
  },
  {
    title: 'Prix coupe-file',
    body: 'Tarifs quotidiens des files payantes, ruptures de stock comprises.',
    onlyWhen:
      'le parc les publie dans son calendrier. Pour l’instant, seulement les parcs Disney aux États-Unis.',
  },
  {
    title: 'Attractions',
    body: 'Le premier onglet, avec le nombre d’attractions dans son titre. Des cartes comme au chapitre 01, triables et cherchables, groupées par zone. En haut, l’aperçu rope drop du parc, trié par minutes gagnées.',
  },
  {
    title: 'Calendrier et carte',
    body: 'Deux onglets fixes à côté : les prévisions journalières du chapitre 04 et une carte avec les attractions en marqueurs.',
  },
  {
    title: 'Spectacles et restaurants',
    body: 'Horaires des spectacles pour toute la journée, restauration avec heures d’ouverture.',
    onlyWhen: 'le parc les fournit. Sinon l’onglet n’existe pas du tout.',
  },
  {
    title: 'Meilleurs jours',
    body: 'Les dates les plus calmes des trois prochains mois, plus le jour de semaine le plus calme du parc.',
    onlyWhen: 'le parc publie un calendrier d’exploitation.',
  },
  {
    title: 'Parcs à proximité',
    body: 'Ce qu’il y a d’autre à portée, avec la distance et le statut actuel.',
    onlyWhen: 'il y a des voisins. Pour environ la moitié des 212 parcs, il n’y en a pas.',
  },
  {
    title: 'Statistiques',
    body: 'Les files les plus longues du parc avec leur valeur habituelle et chargée, plus la répartition par mois et par jour de semaine. La section indique le nombre de jours enregistrés, et les deux répartitions en font une colonne à part.',
  },
  {
    title: 'Saison, infos, questions',
    body: 'Périodes d’ouverture et événements annoncés, adresse et fuseau horaire, et les questions fréquentes sur ce parc précis.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    time: '02:00',
    at: 0.04,
    title: 'Centiles par heure',
    body: 'Chaque heure mesurée de chaque attraction reçoit sa distribution. Les heures avec moins de trois relevés sont écartées.',
  },
  {
    time: '03:00',
    at: 0.22,
    title: 'Valeurs de référence par parc',
    body: 'La médiane contre laquelle l’affluence en direct sera ensuite calculée. Le premier entraînement du modèle démarre après.',
  },
  {
    time: '04:30',
    at: 0.42,
    title: 'Historique au quart d’heure',
    body: 'La journée d’hier est agrégée. Rien de ce qui dépend de la forme d’une journée ne peut tourner avant.',
  },
  {
    time: '05:15',
    at: 0.56,
    title: 'Recommandations rope drop',
    body: 'Par attraction : le départ matinal vaut-il le coup, combien de temps l’avance tient-elle, quand se situe le moment le plus calme de la journée.',
  },
  {
    time: '05:30',
    at: 0.67,
    title: 'Temps d’attente habituels',
    body: 'Le tableau du chapitre 02. Par jour de semaine, avec le jour record et sa date.',
  },
  {
    time: '06:00',
    at: 0.8,
    title: 'Modèle de prévision',
    body: 'Réentraîné avec les temps d’attente de la veille. Une fois en entier, chaque matin.',
  },
];

const FAQ = [
  {
    question: 'Que veulent dire « habituel » et « chargé » pour un temps d’attente ?',
    answer:
      'Habituel est la médiane des pics quotidiens : sur la moitié des jours mesurés, la file la plus longue était plus courte, sur l’autre moitié plus longue. Chargé est le 90e centile de la même série, soit à peu près le jour sur dix où il y avait vraiment foule. Le record absolu est affiché à part, pour qu’une seule valeur extrême ne déplace ni l’une ni l’autre.',
  },
  {
    question: 'Est-ce que 70 minutes d’attente, c’est beaucoup ?',
    answer:
      'Cela dépend de l’attraction et du jour de la semaine. Taron, à Phantasialand, plafonne habituellement à 55 minutes le lundi et reste sous 65 neuf lundis sur dix ; 70 minutes y correspondent donc à une journée exceptionnellement chargée. Le samedi, la médiane de la même attraction est exactement de 70 minutes, et le même affichage est alors parfaitement moyen. Les deux valeurs de comparaison figurent sur la page de l’attraction, pour ne pas avoir à les deviner.',
  },
  {
    question: 'D’où viennent les temps d’attente ?',
    answer:
      'De trois sources publiques à la fois : ThemeParks.wiki, Wartezeiten.app et Queue-Times.com. Chaque parc est interrogé toutes les cinq minutes. Quand deux sources annoncent des chiffres différents, la majorité tranche, puis la médiane, puis la moyenne. Le résultat est arrondi à cinq minutes, parce que les parcs eux-mêmes affichent par pas de cinq minutes.',
  },
  {
    question: 'Pourquoi certains parcs affichent-ils « Pas de prévision » ?',
    answer:
      'Parce que la base manque. Un niveau d’affluence naît de la comparaison avec le passé du parc lui-même, ce qui demande une trentaine de jours d’exploitation. Pour les parcs neufs ou rarement ouverts, la case reste donc vide au lieu d’afficher une couleur devinée.',
  },
  {
    question: 'Pourquoi Hansa-Park n’affiche-t-il aucun temps d’attente ?',
    answer:
      'Le parc ne publie ses temps d’attente que dans sa propre application, et uniquement pour les appareils connectés au wifi du parc. Il n’existe aucune interface publique où nous pourrions les lire. Comme un parc sans source ressemble exactement, dans les données, à un parc fermé pour la nuit, il s’agit d’une entrée entretenue à la main et non d’une déduction : le message sur la page du parc le dit, plutôt que d’afficher 82 attractions prétendument vides.',
  },
  {
    question: 'Qu’est-ce que le rope drop ?',
    answer:
      'Se placer à une attraction précise dès l’ouverture du parc, avant que les allées ne se remplissent. park.fan ne le recommande que si deux conditions sont réunies : le pic quotidien de l’attraction atteint au moins 60 minutes et le départ matinal en fait gagner au moins 45. La durée approximative pendant laquelle l’avance tient est toujours indiquée.',
  },
  {
    question: 'park.fan est-il payant, et faut-il un compte ?',
    answer:
      'Non et non. Tous les temps d’attente, statistiques, calendriers et prévisions sont gratuits et utilisables sans inscription. Les favoris sont stockés dans un cookie du navigateur, pas sur un serveur.',
  },
  {
    question: 'À quelle fréquence les chiffres de la page sont-ils actualisés ?',
    answer:
      'Une page de parc ouverte récupère de nouvelles valeurs toutes les cinq minutes, au même rythme que l’interrogation des sources. Les valeurs statistiques comme les temps d’attente habituels ou les recommandations rope drop sont recalculées une fois par nuit, parce qu’elles bougent de toute façon à peine d’un jour à l’autre.',
  },
];

export function ContentFR() {
  const glossary = `/${GLOSSARY_SEGMENTS.fr}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.fr}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Chapitres" />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan est né dans une file d’attente. Taron, milieu d’après-midi, l’affichage indiquait
          quelque chose à trois chiffres, et personne ne savait dire si c’était de la malchance ou
          simplement un mardi.
        </Lead>
        <P>
          C’est encore cette question que le site place au centre. Afficher un temps d’attente
          actuel, c’est la partie facile : les parcs l’affichent eux-mêmes. Il ne devient
          intéressant que lorsqu’à côté figure ce à quoi ressemble une journée normale à cette
          attraction, quand la file raccourcit d’ordinaire, et si aujourd’hui est un bon jour tout
          court.
        </P>
        <P>
          Il n’y a aucune capture d’écran sur cette page. Chaque carte, chaque badge et chaque
          tableau ci-dessous sont les véritables composants d’une page de parc, remplis ici de
          chiffres d’exemple figés. Ce que vous apprenez à lire ici a exactement la même allure une
          heure plus tard dans le parc.
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
        kicker="Le point de départ"
        title="Un chiffre tout seul ne dit rien"
        icon={Gauge}
      >
        <P>
          À l’entrée de l’attraction, il y a un chiffre, et rien d’autre. La page du parc porte le
          même chiffre avec quatre informations de plus : un niveau d’affluence, une tendance, la
          seconde file et la taille minimale. Aucune d’elles ne se déduit de la seule journée en
          cours.
        </P>

        <BareNumberVsCard
          unit="minutes"
          signLabel="Ce que le parc affiche"
          signCaption="Un chiffre, aucun repère. Savoir si c’est bon ou mauvais aujourd’hui n’est évident que pour qui est déjà venu assez souvent."
          cardLabel="Ce que park.fan en fait"
          cardCaption="Les mêmes 70 minutes, plus le niveau d’affluence, la tendance, le temps single rider, la taille minimale et l’indication du moment où cela devrait se calmer."
        />

        <div className="max-w-3xl space-y-4 pt-2">
          <P>
            « Très élevée » n’est pas ici une affaire de goût. Taron tourne en moyenne à{' '}
            {TARON_BASELINE} minutes, {TARON_WAIT_NOW} en représentent environ 156 pour cent, et les
            niveaux changent à 60, 89, 110, 150 et 200 pour cent. À partir de 150, cela s’appelle «
            Très Élevée ». La petite flèche à côté vient des derniers relevés et indique si la file
            grossit ou se résorbe.
          </P>
          <PG>
            La seconde valeur de la carte est la file single rider. Beaucoup d’attractions font
            tourner plusieurs files en parallèle, et laquelle existe figure rarement sur le même
            panneau. À côté, la taille minimale, pour que personne ne traverse la moitié du parc
            avec un enfant d’un mètre trente.
          </PG>
        </div>

        <DemoFrame
          label="Deux attractions, la même minute"
          note="Les deux cartes viennent du même instant dans le même parc, Taron à Klugheim et Black Mamba à Deep in Africa. Une file grossit, l’autre se résorbe. Sur la page du parc, toutes les attractions sont ainsi côte à côte, triables par temps d’attente."
          href={PARK}
          hrefLabel="Vers la page du parc →"
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
            note="Le 16 juillet 2026, pendant les vacances d’été. Un seul jour sur 365, et c’est pourquoi l’échelle raisonne en centiles plutôt qu’en maximum."
          >
            <P>
              Pour situer un chiffre, il faut deux valeurs de comparaison et l’indication de ce sur
              quoi elles reposent. park.fan utilise pour cela la médiane des pics quotidiens et le
              90e centile de la même série. En clair : quelle est d’ordinaire la longueur de la plus
              longue file de la journée, et quelle était-elle les dix pour cent de jours les plus
              chargés.
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
                    {i === 1 && 'Pour un samedi, c’est exactement la norme'}
                    {i === 2 && 'Et une fois, il y en a eu 135'}
                  </h3>
                  <p className="text-muted-foreground max-w-xl leading-relaxed">
                    {i === 0 && (
                      <>
                        Le lundi, le pic de la journée est de {step.typical} minutes, et neuf lundis
                        sur dix il reste sous {step.busy}. Les {TARON_WAIT_NOW} affichées sont
                        au-dessus. Qui se trouve ici est tombé sur le lundi le plus chargé depuis
                        des semaines, et les attractions voisines sont alors le plus souvent la
                        meilleure idée.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Le samedi, {step.typical} minutes, c’est la médiane. Même affichage, même
                        endroit, même attraction : ce jour-là, elle est simplement dans la moyenne.
                        S’agacer ne sert à rien, changer de plan non plus, car les attractions
                        voisines vivent le même samedi.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Sur l’ensemble des {step.sampleDays} jours de semaine mesurés, le pic est de{' '}
                        {step.typical} minutes. La ligne pointillée plus à droite, c’est la journée
                        à {TARON_RECORD} minutes du 16 juillet. C’est précisément à cause de
                        journées pareilles que « chargé » est un centile et non un maximum : une
                        seule valeur extrême déplacerait une moyenne et rendrait inutilisable tout
                        ce qui est en dessous.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    running figure there for anything to change on. */}
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
              note="Valeurs réelles de Taron, relevées le 24 août 2026."
              href={TARON}
              hrefLabel="Valeurs réelles pour Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                La même distribution en barres, jour de semaine par jour de semaine. Le chiffre
                au-dessus de chaque barre est le repère « chargé » du jour, la partie pleine en
                dessous la valeur habituelle, et le record avec sa date en bas à droite. Un jour
                sans base ne reçoit pas une barre estimée, il n’en reçoit aucune.
              </P>
              <P>
                Le samedi est le seul jour où les {TARON_WAIT_NOW} du début tombent pile au milieu.
                Un lundi, les mêmes minutes seraient l’exception.
              </P>
              <P>
                La solidité de tout cela tient au nombre de jours mesurés : {TARON_WEEKDAY_DAYS} en
                semaine et {TARON_WEEKEND_DAYS} le week-end se sont accumulés ici. La fiche indique
                elle-même la période sur laquelle elle calcule. Pour le parc entier, le total des
                jours enregistrés figure dans la section statistiques de la page du parc, et les
                tableaux par mois et par jour de semaine en font une colonne à part.
              </P>
            </div>
          </div>

          <DemoFrame
            label="Le même tableau pour tout le parc, en direct"
            note="Pas de chiffres d’exemple : voici l’état actuel de Phantasialand, la valeur habituelle et la valeur chargée par attraction. Sur la page du parc, la ligne au-dessus dit sur combien de jours enregistrés toute la section calcule. Toutes les minutes vont par pas de cinq, parce que les parcs affichent par pas de cinq."
            href={PARK}
            hrefLabel="Vers la page du parc →"
          >
            <LiveTopAttractions locale="fr" />
          </DemoFrame>

          <Highlight>
            Ce tableau est la raison pour laquelle nous archivons les temps d’attente. Un chiffre en
            direct peut être demandé au moment où quelqu’un le réclame. Une médiane sur chaque mardi
            mesuré doit être prête avant que la question n’arrive.
          </Highlight>
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
          « Venez tôt » est le conseil que tout le monde donne. Il n’est vrai que si la file grossit
          au fil de la journée, et c’est loin d’être le cas partout. Six attractions du même parc,
          le même tableau, la même année :
        </P>

        <DemoFrame
          label="Le vrai profil horaire, à l’instant"
          note="En direct du profil horaire du parc. En gras, l’heure la plus forte de chaque attraction, et elle est loin d’être la même pour les six. Une heure ne devient une colonne qu’à partir de dix jours mesurés sur cette attraction, si elle atteint au moins 40 pour cent de l’heure la mieux mesurée et si au moins la moitié des attractions la remontent. Cela écarte les heures de bord de journée, où une seule file de clients d’hôtel parlerait sinon pour toute la matinée."
          href={PARK}
          hrefLabel="Vers la page du parc →"
        >
          <LiveHourlyProfile locale="fr" />
        </DemoFrame>

        <div className="max-w-3xl space-y-4 pt-2">
          <P>
            Taron est le cas où l’heure ne décide presque rien : la ligne reste toute la journée
            dans une bande étroite, et ce qui fait la différence, c’est le jour de la semaine du
            chapitre 02. Une ligne plus bas, Chiapas fait l’inverse : les valeurs montent nettement
            jusqu’à l’après-midi. Une règle unique pour tout le parc serait fausse pour l’une des
            deux, et c’est pourquoi elle est calculée par attraction.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="La recommandation qui en découle"
            note="Elle n’est émise que si le pic quotidien atteint au moins 60 minutes et si le départ matinal en fait gagner au moins 45. Colorado Adventure, dans le même parc, fait gagner 40 minutes sur un pic de 50 et ne reçoit donc aucun conseil."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="max-w-prose space-y-4">
            <PG>
              La carte donne trois chiffres et une heure : le temps d’attente habituel à
              l’ouverture, le pic de la journée, l’écart entre les deux, et la fenêtre pendant
              laquelle l’avance tient. Après, elle a disparu, et c’est écrit ainsi.
            </PG>
            <P>
              La seconde partie, c’est le moment le plus calme de la journée, où qu’il tombe. Pour
              ces attractions, il coïncide avec le départ matinal. Pour d’autres, il tombe le soir,
              et la carte nomme alors ce moment plutôt que le réveil. Pour tout le parc, l’aperçu
              des attractions liste celles où se lever tôt rapporte le plus, triées par minutes
              gagnées.
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
          La plus grosse économie n’est pas dans l’heure, elle est dans la date. Entre deux jours de
          la même semaine, il peut y avoir une demi-heure d’attente moyenne d’écart, et un
          calendrier ordinaire n’en laisse rien paraître. Ce qui fait la différence : vacances
          scolaires, jours fériés, ponts et météo.
        </P>

        <DemoFrame
          label="Quatre jours d’une semaine de vacances d’automne"
          note="Le 15 octobre est le plus calme des quatre, bien qu’il tombe en pleine période de vacances : il pleut. Le 19 est gris parce que le parc est fermé ce jour-là. Sur la page du parc, le même calendrier se déroule mois par mois, aussi loin que va la prévision pour ce parc."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* Two columns rather than one narrow one: the calendar above runs the
            full width, and three paragraphs stacked at the body measure under it
            left the right half of the band empty. */}
        <div className="grid gap-x-10 gap-y-4 pt-2 lg:grid-cols-2 lg:items-start">
          <P>
            Les calendriers de vacances viennent de deux sources publiques et couvrent quatre ans
            chacun. Celles des voisins comptent souvent plus que les siennes. Un exemple
            d’aujourd’hui : pour Phantasialand, ce n’est pas la Rhénanie-du-Nord-Westphalie qui
            figure au calendrier comme période déterminante, mais les vacances d’été de la province
            néerlandaise de Gueldre. Le parc est à 90 kilomètres de la frontière, et les visiteurs à
            la journée n’en connaissent pas. Les régions situées dans un rayon d’environ 200
            kilomètres comptent donc aussi et reçoivent leur propre marque dans le calendrier.
          </P>
          <div className="space-y-4">
            <PG>
              La couleur d’un jour est une prévision, pas une mesure. Elle vient d’un modèle
              réentraîné chaque nuit avec les temps d’attente de la veille, et que l’on peut ensuite
              confronter à la réalité.
            </PG>
            <P>
              Jusqu’où va le calendrier dépend du parc. Un parc ouvert toute l’année reçoit une
              prévision jusqu’à douze mois à l’avance. Pour un parc saisonnier, elle s’arrête là où
              finit la saison publiée : pour un mardi de mars où Phantasialand est démontrablement
              fermé, une couleur d’affluence ne serait pas une prévision mais une affirmation.
            </P>
          </div>
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
        id="page-parc"
        index="05"
        kicker="La visite guidée"
        title="Une page de parc, de haut en bas"
        icon={Layers}
      >
        <P>
          Tout ce qui précède tient sur une seule page, construite dans l’ordre où les questions
          viennent : le parc est-il ouvert aujourd’hui ? Va-t-il pleuvoir ? Quelle est la longueur
          de la file ? Et quand aurais-je mieux fait de venir ? Une fois, de haut en bas.
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Seulement si :" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              La moitié de ces blocs dépend d’une condition, et c’est voulu. Un parc sans spectacles
              n’a pas d’onglet spectacles vide, et environ la moitié des 212 parcs n’affiche aucune
              section voisins, parce qu’il n’y a rien à portée.
            </Highlight>
            <PG>
              Les onglets gardent leur choix dans l’adresse. Ouvrez le calendrier, transmettez le
              lien, et ce que vous envoyez, c’est le calendrier et non la liste des attractions.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Voir sur un parc réel
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
      <Ambience tone="emerald">
        <SectionShell
          id="nuit"
          index="06"
          kicker="Les fondations"
          title="D’où viennent les chiffres"
          icon={Database}
        >
          <P>
            Toutes les cinq minutes, chacun des 212 parcs est interrogé, à partir de trois sources
            publiques à la fois. Si elles se contredisent, la majorité tranche, puis la médiane,
            puis la moyenne. Seul ce qui a changé est enregistré, arrondi à cinq minutes, parce que
            les parcs eux-mêmes affichent par pas de cinq minutes.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Temps d’attente" delay={0}>
              ThemeParks.wiki, Wartezeiten.app et Queue-Times.com, toutes les cinq minutes. La
              matière première de tout le reste sur cette page.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vacances & jours fériés" delay={60}>
              Nager.Date pour les jours fériés et les ponts, OpenHolidays pour les vacances
              scolaires. Quatre ans, chaque région séparément, actualisé chaque mois.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Météo" delay={120}>
              Open-Meteo pour la prévision, le rétrospectif et le radar de pluie au quart d’heure.
              Les alertes officielles viennent du DWD et de MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Horaires d’ouverture" delay={0}>
              Depuis les calendriers des parcs. Là où un parc n’en publie pas, nous reconstituons la
              journée à partir de l’activité des attractions et la marquons comme estimée.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Historique" delay={60}>
              Rien n’est supprimé. Les périodes anciennes sont seulement compressées, pour que
              chaque analyse continue de tourner sur tous les relevés.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Modèles de prévision" delay={120}>
              Séparés par horizon : un pour la journée en cours, un pour les semaines à venir, un
              pour le reste de l’année. Chacun est confronté aux temps réellement observés.
            </IngredientCard>
          </IngredientGrid>

          <div className="max-w-3xl space-y-4 pt-4">
            <P>
              La seconde moitié se passe la nuit, et c’est la vraie raison pour laquelle un site ne
              peut pas simplement afficher des temps d’attente habituels. Une médiane sur chaque
              mardi mesuré n’est pas une requête que l’on lance à l’ouverture d’une page. Elle doit
              avoir été calculée avant, dans un ordre fixe, parce que chaque étape s’appuie sur la
              précédente.
            </P>
          </div>

          <NightShift
            jobs={NIGHT_JOBS}
            caption="Toutes les heures en UTC. L’ordre n’est pas dû au hasard : la recommandation rope drop de 05:15 lit l’historique au quart d’heure écrit à 04:30."
          />
        </SectionShell>
      </Ambience>

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="limites"
        index="07"
        kicker="Les limites"
        title="Ce que nous n’affirmons pas"
        icon={HelpCircle}
      >
        <P>
          Un site de données ne devient pas bon parce que chaque champ est rempli. Il devient bon
          quand on peut se fier aux champs remplis. Trois cas où park.fan préfère ne rien dire.
        </P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Parc sans source lisible"
            note="Hansa-Park ne publie ses temps d’attente que dans sa propre application, sur le wifi du parc. Dans les données, cela ressemble à un parc en pleine nuit ; c’est donc une mention entretenue à la main sur la page. Sans elle, 82 attractions y figureraient en « très faible »."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Attraction hors saison"
            note="Personne ne remonte quoi que ce soit sur une patinoire en août, parce qu’il n’y a rien à remonter. Lire ce silence comme « ouvert » serait l’erreur commode. Ce jour-là, l’attraction ne compte pas non plus dans le compteur « 12 sur 45 ouvertes »."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Aucune base d’évaluation"
            note="Le dernier niveau n’est pas du tout une affluence. Il dit que nous n’en avons pas encore pour ce parc : sous une trentaine de jours d’exploitation, la valeur de référence manque."
          >
            <BadgeRowDemo caption="En haut les niveaux d’affluence, en bas la comparaison avec l’habituel. Les deux utilisent la même échelle de couleurs, pour qu’ils ne puissent pas se contredire." />
          </DemoFrame>
        </div>

        <Highlight>
          La même règle vaut pour la détection de saison. Nous ne nommons les mois d’exploitation
          d’une attraction qu’après 330 jours d’observation. Avant cela, « fonctionne de décembre à
          avril » ne serait pas une saison mais la description de la période où nous avons mesuré
          par hasard.
        </Highlight>
      </SectionShell>

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="visites"
        index="08"
        kicker="En pratique"
        title="Quatre visites, quatre parcours sur le site"
        icon={Users}
      >
        <P>
          Les mêmes données répondent à des questions très différentes. Quatre exemples, chacun avec
          le chemin que nous prendrions.
        </P>

        <div className="grid gap-5 lg:grid-cols-2">
          <PersonaBlock
            icon={CalendarDays}
            who="Une famille, une journée pendant les vacances d’automne"
            question="« Quel jour de la semaine de vacances est le plus calme, et on fait quoi s’il pleut ? »"
            steps={[
              <>
                Ouvrir la page du parc, onglet <strong>Calendrier</strong>. La semaine de vacances y
                apparaît en bloc, colorée selon la prévision, avec météo et horaires dans chaque
                tuile.
              </>,
              <>
                Toucher un jour. Le détail donne l’attente moyenne attendue et les régions de
                vacances qui pèsent ce jour-là, y compris celles du pays voisin.
              </>,
              <>
                Une journée de pluie au programme ? Le calendrier la montre comme la plus calme de
                la semaine. Le jour même, le radar de pluie au quart d’heure, en haut de la page du
                parc, dit quand cela s’arrête.
              </>,
              <>
                Chaque carte d’attraction porte la taille minimale là où le parc la publie. Taron
                demande 140 centimètres, Colorado Adventure 120, et cela décide de la journée plus
                que n’importe quel temps d’attente.
              </>,
              <>
                Mettre les attractions pour enfants en favoris dans l’onglet{' '}
                <strong>Attractions</strong>. Elles apparaissent ensuite sur la page d’accueil avec
                leur temps d’attente actuel.
              </>,
            ]}
          />

          <PersonaBlock
            icon={BarChart3}
            who="Un passionné, trois parcs en une semaine"
            question="« Où le rope drop vaut-il le coup, et cette file est-elle vraiment exceptionnelle ? »"
            steps={[
              <>
                Sur la page du parc, l’aperçu des attractions rope drop, trié par minutes gagnées.
                Les attractions sans avantage réel n’y figurent pas.
              </>,
              <>
                Pour chaque attraction, lire en parallèle le tableau du chapitre 02. Il indique la
                période sur laquelle il calcule, et un jour sans base n’y reçoit aucune barre.
              </>,
              <>
                Pendant la visite, surveiller le badge de comparaison : « beaucoup plus élevé »
                signifie réellement exceptionnel aujourd’hui, pas simplement long.
              </>,
              <>
                Chaque page d’attraction porte une note sur sa propre prévision, issue de la
                comparaison entre prévisions passées et temps réels des 30 derniers jours. Pour
                Taron, cela représente quelques milliers de prévisions comparées.
              </>,
              <>
                Pour organiser le voyage, comparer <A href={bestTime}>la meilleure période</A>.
                Plusieurs parcs y sont côte à côte, jour de semaine le plus calme compris.
              </>,
            ]}
          />

          <PersonaBlock
            icon={MapPin}
            who="Abonné annuel, à 20 minutes du parc"
            question="« Est-ce que ça vaut encore le déplacement ce soir ? »"
            steps={[
              <>
                Page d’accueil avec la localisation autorisée. Le parc le plus proche est en haut,
                avec statut, affluence actuelle et horaire jusqu’à ce soir.
              </>,
              <>
                Une affluence « faible » sur une attraction habituellement « élevée », c’est
                exactement la soirée pour laquelle le trajet vaut le coup.
              </>,
              <>
                Dans le parc, la page d’accueil bascule en vue rapprochée : les attractions les plus
                proches avec distance et temps d’attente actuel.
              </>,
              <>
                Regarder la flèche de tendance. Une file qui baisse dans la dernière heure avant la
                fermeture est souvent le moment le plus court de toute la journée.
              </>,
            ]}
          />

          <PersonaBlock
            icon={Compass}
            who="Première fois dans un grand parc"
            question="« C’est quoi le single rider, et dans quel ordre on fait tout ça ? »"
            steps={[
              <>
                Les termes sont dans le <A href={glossary}>dictionnaire</A>, en six langues. Sur les
                pages d’attraction, ils sont liés directement dans le texte.
              </>,
              <>
                Le matin, dérouler la recommandation rope drop du parc. C’est le seul ordre qui
                repose sur des données mesurées plutôt que sur l’intuition.
              </>,
              <>
                À partir de midi, décider selon l’affluence plutôt que selon les minutes. Une
                attraction « faible » à 25 minutes est un meilleur choix qu’une « élevée » à 20.
              </>,
              <>
                Les spectacles sont dans l’onglet du même nom. Les horaires y figurent pour toute la
                journée, et les parades vident les allées pendant une demi-heure environ.
              </>,
            ]}
          />
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
                  Ctrl + K ou ⌘ + K, partout sur le site. Trouve parcs, attractions, spectacles et
                  restaurants, même avec une orthographe approximative.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Localisation',
              body: (
                <>
                  Autorisée, la page d’accueil montre les parcs près de vous. Dans un parc, elle
                  bascule en vue rapprochée avec les distances.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favoris',
              body: (
                <>
                  Une étoile sur chaque carte de parc et d’attraction. Stockés dans un cookie du
                  navigateur, sans compte et sans serveur.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Des textes plus longs sur des parcs et des attractions. Les tableaux qu’ils
                  contiennent tirent les mêmes chiffres que les pages de parc au lieu de les
                  recopier.
                </>
              ),
            },
            {
              icon: Moon,
              title: 'Page d’attraction',
              body: (
                <>
                  Historique, temps d’attente habituels par jour de semaine, rope drop, taille
                  minimale, précision de la prévision, éléments de tracé et les articles de blog sur
                  l’attraction.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Dictionnaire',
              body: (
                <>
                  <A href={glossary}>Tous les termes techniques</A> avec définition, attractions
                  d’exemple et, en partie, un modèle 3D de l’élément de tracé.
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

      <ClosingBand
        kicker="Et maintenant ?"
        title="Pour aller plus loin"
        body="Tout sur park.fan est gratuit, sans compte et sans publicité. La page d’un parc montre tout cela en conditions réelles, la page Fancast détaille publiquement la précision des prévisions des 30 derniers jours, et la meilleure période compare plusieurs parcs côte à côte."
      >
        <Link
          href={PARK}
          prefetch={false}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
        >
          <Activity className="h-4 w-4" />
          Voir un exemple de page de parc
        </Link>
        <Link
          href={bestTime}
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
          Meilleure période
        </Link>
        <Link
          href="/fancast"
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Précision des prévisions
        </Link>
      </ClosingBand>
    </>
  );
}

/** One worked example: who, what they are asking, and the route through the site. */
function PersonaBlock({
  icon: Icon,
  who,
  question,
  steps,
}: {
  icon: React.ElementType;
  who: string;
  question: string;
  steps: React.ReactNode[];
}) {
  return (
    <Reveal>
      <div className="bg-card/70 h-full rounded-2xl border p-5 sm:p-6">
        <div className="mb-3 flex items-start gap-3">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{who}</h3>
            <p className="text-muted-foreground mt-0.5 text-sm italic">{question}</p>
          </div>
        </div>
        <ol className="mt-4 space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
              <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
