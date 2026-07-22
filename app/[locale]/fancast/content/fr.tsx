import React from 'react';
import { Link } from '@/i18n/navigation';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
import {
  Activity,
  CalendarDays,
  CloudSun,
  PartyPopper,
  History,
  Gauge,
  Database,
  RefreshCw,
  MapPin,
  HelpCircle,
  Compass,
  Ticket,
  Palette,
  CalendarCheck,
  CalendarRange,
  LineChart,
  Sunrise,
} from 'lucide-react';
import {
  Lead,
  SectionShell,
  P,
  PG,
  Highlight,
  SplitFigure,
  CrowdSpectrum,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
} from '../_fancast-ui';
import { FancastLive, type FancastLiveLabels } from '../_fancast-live';

const LIVE_LABELS: FancastLiveLabels = {
  edition: 'Édition actuelle',
  trained: 'Entraîné',
  basis: 'Base d’entraînement',
  datapoints: '{n} points de données',
  days: 'sur {d} jours',
  vsPrevious: 'Par rapport à {v}',
  moreAccurate: 'plus précis',
  topTitle: 'Là où Fancast a été le plus juste dernièrement',
  topIntro:
    'Les attractions dont les prévisions récentes ont été les plus proches du temps d’attente réel — écart moyen en minutes, en direct du modèle.',
  colAttraction: 'Attraction',
  colPark: 'Parc',
  colError: 'Écart moyen',
  minUnit: 'min',
};

const FAQ = [
  {
    question: 'Quelle est la précision de Fancast ?',
    answer:
      'La précision actuelle s’affiche en direct dans la fiche de score ci-dessus — sous forme de MAE (écart moyen en minutes), de RMSE et de MAPE. Ces chiffres proviennent d’une comparaison réelle entre les prévisions passées et les temps d’attente effectivement mesurés, pas d’un laboratoire de test enjolivé. Ils changent dès que le modèle se réentraîne.',
  },
  {
    question: 'Jusqu’à quand Fancast peut-il prévoir ?',
    answer:
      'Fancast fournit des niveaux d’affluence quotidiens pour un parc jusqu’à 365 jours à l’avance. Pour les attractions individuelles, il produit en plus des prévisions horaires de temps d’attente. Plus le jour approche, plus les signaux à court terme comme la prévision météo sont pris en compte.',
  },
  {
    question: 'Comment Fancast sait-il qu’un samedi de vacances sera chargé ?',
    answer:
      'Grâce au jeu de nombreux signaux : les calendriers scolaires et des jours fériés (y compris ceux des régions voisines), le jour de la semaine, la prévision météo, les événements spéciaux et tout l’historique des temps d’attente du parc. Un samedi de vacances en plein été réunit presque tous ces facteurs à la fois — c’est pourquoi la prévision grimpe là, tandis qu’un mardi pluvieux de novembre reste au vert.',
  },
  {
    question: 'À quelle fréquence le modèle est-il mis à jour ?',
    answer:
      'Chaque jour. Fancast se réentraîne automatiquement une fois par jour à 06h00 UTC sur les données les plus fraîches — y compris les temps d’attente d’hier. Il devient donc littéralement un peu meilleur chaque matin.',
  },
  {
    question: 'Puis-je utiliser Fancast pour un parc et un jour précis ?',
    answer:
      'Oui. Chaque page de parc sur park.fan dispose d’un calendrier d’affluence qui vous montre, pour chaque jour jusqu’à un an à l’avance, une prévision verte, jaune ou rouge — d’Europa-Park à Phantasialand, en passant par Efteling et Walt Disney World. Vous obtenez aussi des prévisions horaires de temps d’attente pour les différentes attractions.',
  },
  {
    question: 'Quelles données Fancast utilise-t-il ?',
    answer:
      'Des temps d’attente en direct et historiques de plus de 150 parcs, les calendriers scolaires et des jours fériés (y compris ceux des régions voisines), les prévisions météo, les horaires d’ouverture, les événements spéciaux et les tendances saisonnières. De ce mélange naissent les niveaux d’affluence quotidiens et les prévisions horaires de temps d’attente.',
  },
  {
    question: 'Pourquoi un parc affiche-t-il « Aucune prévision » ?',
    answer:
      'Fancast n’évalue un parc que lorsqu’il existe assez de données d’exploitation — au moins une trentaine de jours d’ouverture. Les parcs tout neufs ou rarement ouverts n’ont pas encore cette base. Nous préférons alors afficher honnêtement « Aucune prévision » plutôt qu’un chiffre inventé.',
  },
  {
    question: 'Fancast est-il payant ?',
    answer:
      'Non. Comme tout park.fan, chaque prévision, calendrier d’affluence et statistique est gratuit, sans publicité et utilisable sans compte.',
  },
] as const;

export function ContentFR() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Fancast est notre modèle de prévision maison — la partie de park.fan qui regarde vers
          l’avenir. Le nom ? Éhonté mais méthodique : <strong>fan</strong> comme dans park.<strong>fan</strong>,{' '}
          <strong>cast</strong> comme dans fore<strong>cast</strong>. Un bulletin météo pour les files
          d’attente, en somme.
        </Lead>
        <P>
          Et parce que nous ne faisons confiance qu’aux chiffres obligés de faire leurs preuves, Fancast
          fait ce que la plupart des modèles évitent discrètement : il se note lui-même. Chaque
          prévision est ensuite confrontée au temps d’attente réellement survenu — au grand jour, sur
          cette page. Tricher, inutile.
        </P>
        <Highlight>
          En bref : Fancast n’est pas une voyante avec une boule de cristal. C’est un statisticien têtu
          qui prend des cours de soutien chaque soir et doit repasser l’examen chaque matin. Une
          grenouille météo qui vérifie sa propre météo.
        </Highlight>
      </div>

      {/* 01 — Scorecard (live) */}
      <SectionShell
        id="note"
        index="01"
        kicker="La note du bulletin"
        title="Fancast est-il vraiment bon ?"
        icon={Gauge}
      >
        <P>
          Assez de préambule — voici la note, en direct et sans fard. Fancast tire ces chiffres de son
          propre tableau de bord à l’instant même ; ils changeront dès que le modèle se réentraînera
          cette nuit.
        </P>
        <div className="overflow-hidden rounded-2xl border">
          <MLStatsSection />
        </div>
        <FancastLive labels={LIVE_LABELS} />
      </SectionShell>

      {/* 02 — What it reads */}
      <SectionShell
        id="ingredients"
        index="02"
        kicker="Les ingrédients"
        title="Ce que lit Fancast"
        icon={Database}
      >
        <PG>
          Un jour de pont pluvieux en octobre est une tout autre bête qu’un samedi de vacances
          ensoleillé en juillet — et un modèle doit d’abord apprendre cela. Fancast se nourrit donc de
          plusieurs sources à la fois :
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Temps d’attente en direct" delay={0}>
            Des millions de relevés réels issus de plus de 150 parcs, actualisés à la minute. La monnaie
            brute de chaque prévision.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendriers & vacances" delay={60}>
            Week-ends, jours fériés et vacances scolaires — y compris ceux des régions voisines, car les
            visiteurs d’un jour se moquent des frontières.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Météo" delay={120}>
            La probabilité de pluie et la température infléchissent les prévisions à court terme. Le
            soleil attire, la pluie toute la journée vide les allées.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Événements & saison" delay={0}>
            Halloween, vacances d’été, ponts, une nouveauté dans son premier été — les suspects
            habituels d’une journée bondée.
          </IngredientCard>
          <IngredientCard icon={History} title="Historique" delay={60}>
            Des années d’historique de temps d’attente par parc. Des motifs que l’on ne voit qu’en les
            fixant assez longtemps.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Horaires & capacité" delay={120}>
            Quand le parc ouvre, pour combien de temps, à quelle capacité — le cadre dans lequel tout le
            reste s’insère.
          </IngredientCard>
        </IngredientGrid>
        <P>
          De ce mélange, le modèle tire deux choses : une <strong>prévision horaire des temps
          d’attente</strong> pour les attractions individuelles et une <strong>note d’affluence
          quotidienne</strong> pour tout le parc.
        </P>
      </SectionShell>

      {/* 03 — Concrete park examples */}
      <SectionShell
        id="examples"
        index="03"
        kicker="Dans de vrais parcs"
        title="Fancast dans trois parcs"
        icon={Compass}
      >
        <P>
          Toute théorie est grise — Fancast ne devient concret qu’au parc réel. Trois exemples de la
          façon dont les mêmes ingrédients donnent trois prévisions complètement différentes :
        </P>
        <SplitFigure
          src="/images/parks/europa-park/silver-star.jpg"
          alt="Silver Star à Europa-Park"
          kicker="Europa-Park · jour de pont en octobre"
          title="Calme, vert, moins de 30 minutes"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast voit : des vacances scolaires dans une seule région voisine, une météo mitigée, aucun
          événement spécial. Résultat : une prévision calme et verte — Voltron Nevera sans doute sous
          les 30 minutes, blue fire à prendre à la volée. Le même parc trois semaines plus tard, un
          samedi de vacances ? Rouge foncé. Six millions de visiteurs annuels ne se répartissent pas
          tout seuls.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/phantasialand/taron.jpg"
          alt="Taron fonçant à travers Klugheim à Phantasialand"
          kicker="Phantasialand · samedi de vacances"
          title="Compact, bondé, de l’orange au rouge"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Parc compact, peu de têtes d’affiche, tout le monde veut Taron — la saturation arrive plus
          vite que la première bière n’est tirée. Fancast le sait et peint la journée de l’orange au
          rouge. Le calendrier à côté vous suggère aussitôt le mardi suivant, où vous pourrez enchaîner
          Taron au lieu de seulement le convoiter.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/efteling/baron-1898.jpg"
          alt="Baron 1898 à Efteling"
          kicker="Efteling · mardi pluvieux en novembre"
          title="Le bon plan que le modèle intègre déjà"
          badge={<CrowdLevelBadge level="low" />}
        >
          Exactement le jour que les planificateurs à l’instinct évitent — et que Fancast colore en
          vert. Peu de vacances, une météo exécrable, des files courtes. Cela marche précisément
          jusqu’à ce que tout le monde ait lu le même bon plan ; c’est pourquoi le modèle intègre
          lui-même la probabilité de pluie, au lieu de se fier au folklore.
        </SplitFigure>
      </SectionShell>

      {/* 04 — How it learns */}
      <SectionShell
        id="training"
        index="04"
        kicker="La méthode"
        title="Comment Fancast apprend (et ne peut pas tricher)"
        icon={RefreshCw}
      >
        <P>
          Le plus important des tours est des plus ordinaires : Fancast se réentraîne <strong>chaque
          nuit</strong>, tous les jours à 06h00 UTC. Ce qui s’est passé hier, le modèle le sait
          aujourd’hui. Un fan de montagnes russes vieillit et se fatigue au fil des ans — Fancast
          devient un peu plus malin chaque matin.
        </P>
        <P>
          Et il n’est jamais testé que sur des jours qu’il n’a <strong>jamais vus</strong> — sur
          l’avenir, pas sur des jours du passé appris par cœur. Tout le reste reviendrait à se glisser
          soi-même les questions de l’examen à l’avance, puis à célébrer son bulletin tout en A.
        </P>
        <P>
          En plus de cela, Fancast surveille s’il <strong>dérive</strong> — si la réalité lui échappe
          peu à peu. Et une nouvelle version du modèle ne passe en production que si elle bat vraiment
          l’ancienne dans un duel équitable. Démocratie entre algorithmes : qui n’est pas meilleur reste
          sur le banc.
        </P>
      </SectionShell>

      {/* 05 — Crowd levels */}
      <SectionShell
        id="levels"
        index="05"
        kicker="L’échelle"
        title="Vert, jaune, rouge : les niveaux d’affluence"
        icon={Palette}
      >
        <PG>
          Au bout de tout ce calcul se tient une seule couleur. Six niveaux, de « vous avez pratiquement
          le parc pour vous » à « bienvenue un samedi de vacances » :
        </PG>
        <CrowdSpectrum
          items={[
            {
              level: 'very_low',
              text: 'Presque vide. Rêves de rope-drop, tours à la chaîne, une photo avec la mascotte sans file.',
            },
            {
              level: 'low',
              text: 'Détendu. Attentes courtes, vous montez sur tout sans avoir besoin d’un plan de bataille.',
            },
            {
              level: 'moderate',
              text: 'Fonctionnement normal. Les têtes d’affiche se remplissent, le reste reste tranquille. Une bonne journée de compromis.',
            },
            {
              level: 'high',
              text: 'Nettement fréquenté. Pour les attractions phares, mieux vaut se lever tôt — ou apporter de la patience.',
            },
            {
              level: 'very_high',
              text: 'Vraiment chargé. De longues files aux temps forts ; planifier l’emporte nettement sur l’improvisation.',
            },
            {
              level: 'extreme',
              text: 'Alerte maximale. Samedi de vacances en plein été. Uniquement avec une stratégie, de l’endurance et de l’humour.',
            },
          ]}
        />
      </SectionShell>

      {/* 06 — Try a real park */}
      <SectionShell
        id="parks"
        index="06"
        kicker="À vous d’essayer"
        title="Attrapez un parc"
        icon={Ticket}
      >
        <P>
          Assez de théorie. Fancast tourne sur chaque page de parc — en voici quelques-uns populaires
          pour l’essayer directement. Cliquez, ouvrez le calendrier d’affluence et voyez la couleur
          qu’obtient le jour de votre choix :
        </P>
        <PopularParksGrid />
      </SectionShell>

      {/* 07 — Where you meet it */}
      <SectionShell
        id="where"
        index="07"
        kicker="Partout dans le parc"
        title="Où vous croisez Fancast"
        icon={MapPin}
      >
        <P>
          Fancast ne vit pas sur une page isolée — il est tissé dans tout park.fan, le plus souvent sans
          se présenter :
        </P>
        <TouchpointGrid
          items={[
            {
              icon: CalendarCheck,
              title: 'Prévision du jour',
              body: 'la note d’affluence dans l’en-tête du parc, avant même de toucher à la première attraction.',
            },
            {
              icon: CalendarRange,
              title: 'Calendrier d’affluence',
              body: (
                <>
                  le <Link href="/parks">calendrier des meilleurs jours de visite</Link> sur chaque page
                  de parc — vert, jaune, rouge, jusqu’à un an à l’avance.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Meilleure période',
              body: (
                <>
                  les jours de semaine les plus calmes et les prochains jours à bon plan, distillés à
                  partir des mêmes données. Découvrez la{' '}
                  <Link href={`/${BEST_TIME_SEGMENTS.fr}`}>meilleure période pour visiter</Link>.
                </>
              ),
            },
            {
              icon: LineChart,
              title: 'Prévision IA dans le graphique des temps d’attente',
              body: 'la ligne en pointillés qui révèle les créneaux les plus avantageux d’une attraction.',
            },
            {
              icon: Sunrise,
              title: 'Recommandation rope-drop',
              body: 'la réponse honnête à « vaut-il la peine d’arriver tôt ? » — creux attendus compris.',
            },
            {
              icon: HelpCircle,
              title: 'Aucune prévision',
              body: (
                <>
                  honnête plutôt que deviné : les parcs avec trop peu de données reçoivent{' '}
                  <CrowdLevelBadge level="unknown" /> au lieu d’un chiffre inventé.
                </>
              ),
            },
          ]}
        />
        <P>
          Comment tout cela s’articule dans un parc, le{' '}
          <Link href="/howto">guide complet</Link> le détaille pas à pas — calendrier d’affluence,
          badges et temps d’attente en direct compris.
        </P>
      </SectionShell>

      {/* 08 — FAQ */}
      <SectionShell
        id="faq"
        index="08"
        kicker="En bref"
        title="Questions fréquentes sur Fancast"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
