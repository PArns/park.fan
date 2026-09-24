import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
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
    'Les attractions dont les prévisions récentes ont été les plus proches du temps d’attente réel. Écart moyen en minutes, en direct du modèle.',
  colAttraction: 'Attraction',
  colPark: 'Parc',
  colError: 'Écart moyen',
  minUnit: 'min',
};

const FAQ = [
  {
    question: 'Quelle est la précision de Fancast ?',
    answer:
      'La précision actuelle s’affiche en direct plus haut sur cette page, sous forme de MAE (écart moyen en minutes), de RMSE et de MAPE. Ces chiffres viennent de la comparaison entre les prévisions passées et les temps d’attente mesurés ensuite. Ils changent après chaque entraînement.',
  },
  {
    question: 'Jusqu’à quand Fancast peut-il prévoir ?',
    answer:
      'Fancast fournit des niveaux d’affluence quotidiens pour chaque jour qu’un parc a déjà publié. Pour les attractions individuelles, il produit en plus des prévisions horaires de temps d’attente. Plus le jour approche, plus les signaux à court terme comme la prévision météo sont pris en compte.',
  },
  {
    question: 'Comment Fancast sait-il qu’un samedi de vacances sera chargé ?',
    answer:
      'Grâce à plusieurs signaux lus ensemble : les calendriers scolaires et des jours fériés (y compris ceux des régions voisines), le jour de la semaine, la prévision météo, les événements spéciaux et tout l’historique des temps d’attente du parc. Un samedi de vacances en plein été réunit presque tous ces facteurs à la fois, c’est pourquoi la prévision grimpe là, tandis qu’un mardi pluvieux de novembre reste au vert.',
  },
  {
    question: 'À quelle fréquence le modèle est-il mis à jour ?',
    answer:
      'Chaque jour. Fancast se réentraîne automatiquement une fois par jour à 06h00 UTC, avec les temps d’attente de la veille.',
  },
  {
    question: 'Puis-je utiliser Fancast pour un parc et un jour précis ?',
    answer:
      'Oui. Chaque page de parc sur park.fan dispose d’un calendrier d’affluence qui vous montre, pour chaque jour publié, une prévision verte, jaune ou rouge, d’Europa-Park à Phantasialand en passant par Efteling et Walt Disney World. Vous obtenez aussi des prévisions horaires de temps d’attente pour les différentes attractions.',
  },
  {
    question: 'Quelles données Fancast utilise-t-il ?',
    answer:
      'Des temps d’attente en direct et passés de plus de 200 parcs, les calendriers scolaires et des jours fériés (y compris ceux des régions voisines), les prévisions météo, les horaires d’ouverture, les événements spéciaux et les tendances saisonnières. De ce mélange naissent les niveaux d’affluence quotidiens et les prévisions horaires de temps d’attente.',
  },
  {
    question: 'Pourquoi un parc affiche-t-il « Aucune prévision » ?',
    answer:
      'Fancast n’évalue un parc que lorsqu’il existe assez de données d’exploitation, au moins une trentaine de jours d’ouverture. Les parcs tout neufs ou rarement ouverts n’ont pas encore cette base. Il est alors écrit « Aucune prévision » à la place d’un chiffre deviné.',
  },
  {
    question: 'Fancast est-il payant ?',
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
          Fancast est notre modèle de prévision maison, la partie de park.fan qui veut savoir dès
          aujourd’hui quelle sera la longueur de la file samedi. Le nom, nous l’avons trouvé sans
          agence de pub, et ça se voit : <strong>fan</strong> comme dans park.<strong>fan</strong>,{' '}
          <strong>cast</strong> comme dans fore<strong>cast</strong>. Un bulletin météo pour les
          files d’attente, sans le présentateur qui agite les bras devant la carte.
        </Lead>
        <P>
          Des prédictions que personne ne vérifie, n’importe quel horoscope sait en faire. Fancast,
          lui, passe un examen tous les jours, et son bulletin est affiché sur cette page, à la vue
          de tous.
        </P>
        <Highlight>
          Chaque prévision est confrontée le lendemain au temps d’attente mesuré. Le résultat figure
          dans la section suivante, en MAE, RMSE et MAPE, les mauvais jours compris.
        </Highlight>
      </div>

      {/* 01 – Scorecard (live) */}
      <SectionShell
        id="note"
        index="01"
        kicker="La note du bulletin"
        title="Fancast est-il vraiment bon ?"
        icon={Gauge}
      >
        <P>
          Ces notes sortent en direct du modèle, pas d’un dossier de presse. Elles changeront avec
          le prochain entraînement demain matin : inutile de les encadrer.
        </P>
        <div className="overflow-hidden rounded-2xl border">
          <MLStatsSection />
        </div>
        <FancastLive labels={LIVE_LABELS} />
      </SectionShell>

      {/* 02 – What it reads */}
      <SectionShell
        id="ingredients"
        index="02"
        kicker="Les ingrédients"
        title="Ce que lit Fancast"
        icon={Database}
      >
        <PG>
          Quiconque fréquente les parcs le sait : un jour de pont pluvieux en octobre et un samedi
          de vacances ensoleillé en juillet, ce sont deux sports différents. Un modèle doit
          l’apprendre, et pour cela Fancast lit six sources à la fois :
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Temps d’attente en direct" delay={0}>
            Une mesure toutes les cinq minutes par file d’attente, dans plus de 200 parcs. Tout le
            reste est bâti là-dessus.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendriers & vacances" delay={60}>
            Week-ends, jours fériés et vacances scolaires, y compris ceux des régions voisines. Les
            excursionnistes néerlandais ne consultent pas le calendrier scolaire allemand.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Météo" delay={120}>
            La probabilité de pluie et la température infléchissent les prévisions à court terme. Le
            soleil fait sortir tout le monde, la pluie continue renvoie chacun sur son canapé.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Événements & saison" delay={0}>
            Halloween, vacances d’été, ponts, une nouveauté dans son premier été : les suspects
            habituels d’une journée bondée.
          </IngredientCard>
          <IngredientCard icon={History} title="Historique" delay={60}>
            Chaque jour d’ouverture qu’un parc a passé sous nos relevés, sans trou depuis avril
            2026. De là viennent le rythme de la semaine et celui des saisons.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Horaires & capacité" delay={120}>
            Quand le parc ouvre, pour combien de temps, à quelle capacité. C’est le cadre dans
            lequel tout le reste doit tenir.
          </IngredientCard>
        </IngredientGrid>
        <P>
          De ce pot-au-feu, le modèle tire deux plats : une{' '}
          <strong>prévision horaire des temps d’attente</strong> pour les attractions individuelles
          et une <strong>note d’affluence quotidienne</strong> pour tout le parc.
        </P>
      </SectionShell>

      {/* 03 – Concrete park examples */}
      <SectionShell
        id="examples"
        index="03"
        kicker="Dans de vrais parcs"
        title="Fancast dans trois parcs"
        icon={Compass}
      >
        <P>
          Selon le parc et la date, les mêmes ingrédients donnent des journées très différentes.
          Trois exemples :
        </P>
        <SplitFigure
          src="/media/europa-park/silver-star.jpg"
          alt="Silver Star à Europa-Park"
          kicker="Europa-Park · jour de pont en octobre"
          title="Calme, vert, moins de 30 minutes"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast voit des vacances scolaires dans une seule région voisine, une météo mitigée et
          aucun événement spécial. Il en sort une prévision calme et verte : Voltron Nevera sans
          doute sous les 30 minutes, blue fire presque en passant. Le même parc trois semaines plus
          tard, un samedi de vacances, vire au rouge foncé, car six millions de visiteurs par an ne
          se répartissent pas sagement sur le calendrier.
        </SplitFigure>
        <SplitFigure
          src="/media/phantasialand/taron.jpg"
          alt="Taron fonçant à travers Klugheim à Phantasialand"
          kicker="Phantasialand · samedi de vacances"
          title="Compact, bondé, de l’orange au rouge"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Parc compact, peu de têtes d’affiche, et tout le monde veut Taron. Ça se remplit plus vite
          que le kiosque ne tire sa première bière. Fancast le sait et peint la journée de l’orange
          au rouge. Le calendrier d’affluence de la page du parc vous propose alors un mardi, où
          vous pourrez enchaîner plusieurs tours de Taron au lieu de le contempler depuis l’allée.
        </SplitFigure>
        <SplitFigure
          src="/media/efteling/baron-1898.jpg"
          alt="Baron 1898 à Efteling"
          kicker="Efteling · mardi pluvieux en novembre"
          title="Le bon plan que le modèle intègre déjà"
          badge={<CrowdLevelBadge level="low" />}
        >
          Le jour que les planificateurs à l’instinct évitent, c’est justement celui que Fancast
          colore en vert : peu de vacances, une météo exécrable, des files courtes. Les chaussettes
          mouillées sont offertes. Le problème d’un bon plan, c’est qu’il ne tient que jusqu’à ce
          que tout le monde l’ait lu. Le modèle intègre donc lui-même la probabilité de pluie pour
          ce jour précis, au lieu de se fier au folklore.
        </SplitFigure>
      </SectionShell>

      {/* 04 – How it learns */}
      <SectionShell
        id="training"
        index="04"
        kicker="La méthode"
        title="Comment Fancast apprend (et ne peut pas tricher)"
        icon={RefreshCw}
      >
        <P>
          Le tour le plus important est à peu près aussi palpitant qu’un brossage de dents. Fancast
          se réentraîne <strong>une fois par jour</strong>, à 06h00 UTC. Ce qui s’est passé hier
          dans le parc se retrouve dans la prévision dès le lendemain matin.
        </P>
        <P>
          Il n’est testé que sur des jours qu’il n’a <strong>jamais vus</strong>. Tout le reste
          reviendrait à se glisser soi-même les questions de l’examen à l’avance, puis à fêter son
          20 sur 20.
        </P>
        <P>
          Fancast surveille aussi s’il <strong>dérive</strong>, autrement dit si la réalité lui
          échappe peu à peu. Une nouvelle version du modèle ne passe en production que si elle bat
          l’ancienne en face à face. Ici, la promotion va à celui qui fait mieux, ce que toutes les
          entreprises ne peuvent pas dire.
        </P>
      </SectionShell>

      {/* 05 – Crowd levels */}
      <SectionShell
        id="levels"
        index="05"
        kicker="L’échelle"
        title="Vert, jaune, rouge : les niveaux d’affluence"
        icon={Palette}
      >
        <PG>
          Au bout de tout ce calcul se tient une seule couleur. Six niveaux, de « vous avez
          pratiquement le parc pour vous » à « bienvenue un samedi de vacances » :
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
              text: 'Fonctionnement normal. Les têtes d’affiche se remplissent, le reste demeure tranquille. Un plan sommaire suffit.',
            },
            {
              level: 'high',
              text: 'Nettement fréquenté. Pour les grandes attractions, le réveil vaut le coup ; sinon, prévoyez de la patience et un livre audio.',
            },
            {
              level: 'very_high',
              text: 'Vraiment chargé. De longues files aux grandes attractions, et qui improvise passe sa journée dans les zigzags des barrières.',
            },
            {
              level: 'extreme',
              text: 'Alerte maximale. Samedi de vacances en plein été. Uniquement avec une stratégie, de l’endurance et de l’humour.',
            },
          ]}
        />
      </SectionShell>

      {/* 06 – Try a real park */}
      <SectionShell
        id="parks"
        index="06"
        kicker="À vous d’essayer"
        title="Attrapez un parc"
        icon={Ticket}
      >
        <P>
          Fancast tourne sur chaque page de parc. En voici quelques-unes parmi les plus consultées :
          cliquez sur un parc, ouvrez le calendrier d’affluence et regardez la couleur de votre
          jour. S’il est rouge, jetez un œil aux jours voisins.
        </P>
        <PopularParksGrid />
      </SectionShell>

      {/* 07 – Where you meet it */}
      <SectionShell
        id="where"
        index="07"
        kicker="Partout dans le parc"
        title="Où vous croisez Fancast"
        icon={MapPin}
      >
        <P>
          Cette page n’est que le bureau. Le vrai travail, Fancast le fait partout ailleurs sur
          park.fan, et il se présente rarement :
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
                  le <Link href="/parks">calendrier des meilleurs jours de visite</Link> sur chaque
                  page de parc : vert, jaune, rouge, aussi loin que le parc a publié ses horaires.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Meilleure période',
              body: (
                <>
                  les jours de semaine les plus calmes et les prochains jours à bon plan, tirés à
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
              body: 'la réponse à « vaut-il la peine d’arriver tôt ? », avec les creux attendus.',
            },
            {
              icon: HelpCircle,
              title: 'Aucune prévision',
              body: (
                <>
                  plutôt que de deviner : les parcs avec trop peu de données reçoivent{' '}
                  <CrowdLevelBadge level="unknown" /> au lieu d’un chiffre inventé.
                </>
              ),
            },
          ]}
        />
        <P>
          Comment tout cela s’articule dans un parc, le{' '}
          <Link href={`/${HOWTO_SEGMENTS.fr}`}>guide complet</Link> le détaille pas à pas,
          calendrier d’affluence, badges et temps d’attente en direct compris.
        </P>
      </SectionShell>

      {/* 08 – FAQ */}
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
