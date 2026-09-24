import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import {
  CalendarRange,
  Sunrise,
  Ban,
  Ticket,
  HelpCircle,
  Sparkles,
  Clock,
  CalendarDays,
  CloudRain,
  Users,
  Sun,
} from 'lucide-react';
import {
  Lead,
  P,
  PG,
  Highlight,
  SectionShell,
  SplitFigure,
  TouchpointGrid,
  FaqList,
} from '@/components/marketing/editorial-ui';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { FancastCta } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';
import { QuietestDaysByPark } from '../_quietest-days-by-park';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'Les jours de semaine les plus calmes',
  weekdaysBody:
    'Chaque parc compte ici pour autant, Disneyland comme un petit parc familial : nous le ramenons d’abord à sa propre moyenne, et nous moyennons ensuite. La barre montre à quel point un jour de semaine typique est fréquenté par rapport à la moyenne. Le samedi se détache ; les six autres jours sont plus resserrés que la plupart des gens ne l’imaginent.',
  monthsTitle: 'Les mois les plus calmes',
  monthsBody:
    'Le même calcul, cette fois réparti sur l’année. Décembre sort du lot, parce qu’il ne contient que les parcs qui ouvrent en hiver, et ceux-là tournent alors en programme de Noël.',
  quieter: 'plus calme',
  busier: 'plus chargé',
  typical: 'proche de la moyenne',
  footnote: 'D’après {days} jours-parc mesurés sur {parks} parcs.',
  pending:
    'Le classement en direct rassemble encore les temps d’attente. Les jours les plus calmes apparaîtront ici dès qu’il y aura assez de données.',
};

const FAQ = [
  {
    question: 'Quel est le meilleur moment pour visiter un parc d’attractions ?',
    answer:
      'C’est le plus calme en semaine hors vacances scolaires, le mardi, le mercredi et le jeudi en tête. Les tendances précises par jour de semaine et par mois sont affichées ci-dessus, directement à partir des temps d’attente mesurés sur tous les parcs.',
  },
  {
    question: 'Quel jour de la semaine est le moins fréquenté ?',
    answer:
      'En moyenne sur tous les parcs, le mardi, le mercredi et le jeudi sont les plus calmes. Un seul jour se détache vraiment : le samedi. Le dimanche, lui, est plus proche du mardi que du samedi. Les parcs peuvent différer ; la page de chaque parc porte un calendrier d’affluence qui le montre jour par jour.',
  },
  {
    question: 'Quels mois les parcs d’attractions sont-ils les moins fréquentés ?',
    answer:
      'Cela dépend du parc plus que la règle empirique ne le laisse croire : sur l’ensemble des parcs, les mois d’été ne sont pas les plus chargés, et décembre ressort vers le haut, parce qu’en hiver seuls les parcs à programme de Noël sont ouverts. L’aperçu mensuel ci-dessus le montre mois par mois. Pour un parc précis, c’est son propre calendrier qui compte.',
  },
  {
    question: 'Est-ce que ça vaut le coup de venir sous la pluie ?',
    answer:
      'Souvent oui : le mauvais temps décourage beaucoup de visiteurs et les files raccourcissent, surtout aux montagnes russes qui tournent sous la pluie. Mais l’astuce d’initié ne marche que tant que tout le monde n’a pas la même idée ; c’est pourquoi notre modèle de prévision intègre directement la météo.',
  },
  {
    question: 'Comment trouver le meilleur jour pour un parc précis ?',
    answer:
      'Cette page montre les tendances globales comme point de départ. Pour un parc précis, ouvrez son calendrier d’affluence : il affiche pour chaque journée publiée une prévision verte, jaune ou rouge, vacances scolaires et jours fériés de la région compris.',
  },
  {
    question: 'D’où viennent ces données ?',
    answer:
      'Des temps d’attente que nous avons relevés nous-mêmes dans plus de 200 parcs. Pour que le classement ne soit pas dicté par les plus grands parcs, chaque parc est d’abord ramené à sa propre moyenne, et la moyenne d’ensemble n’est calculée qu’ensuite.',
  },
] as const;

export function ContentFR() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Le moment où un parc d’attractions se remplit est étonnamment prévisible, en tout cas plus
          prévisible que l’humeur d’un enfant de six ans à trois heures de l’après-midi. Le jour de
          la semaine, les vacances, la météo et la saison décident en grande partie si vous attendez
          dix minutes ou une heure et demie devant les montagnes russes. Et comme chaque journée au
          parc laisse des temps d’attente derrière elle, cela se recalcule assez précisément.
        </Lead>
        <P>
          Nous avons donc fait le calcul, avec les temps d’attente relevés dans plus de 200 parcs.
          Plus bas se trouvent les jours de semaine et les mois les plus calmes, les heures les plus
          tranquilles de la journée et les dates où le canapé reste la meilleure option. Le
          calendrier d’affluence vous sort ensuite le bon jour pour le parc de votre choix.
        </P>
        <Highlight>
          Version courte pour les pressés : du mardi au jeudi hors vacances scolaires, devant le
          portail à l’ouverture, et une météo incertaine prise comme un cadeau, tant qu’il y a un
          imperméable dans le sac.
        </Highlight>
      </div>

      {/* 01 — Data: quietest weekdays + months (live) */}
      <SectionShell
        id="patterns"
        index="01"
        kicker="Les données"
        title="Les jours de semaine et les mois les plus calmes"
        icon={CalendarRange}
      >
        <PG>
          Le jour de la semaine et le mois pèsent le plus. Nous avons fait la moyenne des deux sur
          tous les parcs, à partir des temps d’attente réellement mesurés :
        </PG>
        <BestTimesData locale="fr" labels={DATA_LABELS} />
        <QuietestDaysByPark locale="fr" />
      </SectionShell>

      {/* 02 — Times of day */}
      <SectionShell
        id="times"
        index="02"
        kicker="Heure par heure"
        title="Les heures les plus calmes de la journée"
        icon={Clock}
      >
        <P>
          Après le jour de la semaine, c’est l’heure qui pèse le plus. Ces quatre créneaux sont
          presque partout les plus calmes :
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: (
                <>
                  À l’ouverture (<GlossaryTermLink termId="rope-drop">rope drop</GlossaryTermLink>)
                </>
              ),
              body: 'La première heure après l’ouverture est la meilleure de la journée. En étant au portail à l’heure, on fait souvent les grosses attractions avant même que les files se forment.',
            },
            {
              icon: Users,
              title: 'Autour du déjeuner',
              body: 'Quand tout le monde est à table, les files raccourcissent. Profitez-en pour les attractions populaires et mangez plus tard. Les frites ont le même goût à quatorze heures trente.',
            },
            {
              icon: Sun,
              title: 'La dernière heure',
              body: 'Beaucoup de familles rentrent avant la fin. Dans la dernière heure avant la fermeture, les temps d’attente baissent souvent encore nettement.',
            },
            {
              icon: Ticket,
              title: 'Pendant le grand spectacle du soir',
              body: 'Une parade ou un feu d’artifice attire des milliers de visiteurs d’un coup. C’est justement là que des places se libèrent dans les montagnes russes.',
            },
          ]}
        />
        <SplitFigure
          src="/media/phantasialand/black-mamba.jpg"
          alt="Black Mamba fonçant à travers la jungle à Phantasialand"
          kicker="À l’ouverture"
          title="Arriver tôt aide, mais pas sur toutes les attractions"
        >
          Sur les grosses têtes d’affiche, la première heure après l’ouverture donne souvent plus de
          tours que deux heures l’après-midi. Ce n’est pas vrai partout : certaines attractions
          restent aussi chargées toute la journée, d’autres ne se réveillent qu’après le déjeuner.
          La page de chaque attraction porte sa propre courbe de la journée, et elle dit aussi si le
          réveil matinal en vaut la peine pour elle.
        </SplitFigure>
      </SectionShell>

      {/* 03 — Dates to avoid */}
      <SectionShell
        id="avoid"
        index="03"
        kicker="Jours rouges"
        title="Les dates à éviter"
        icon={Ban}
      >
        <PG>
          Il est tout aussi utile de savoir quand ne pas y aller. À ces dates, les parcs sont
          bondés. Vous pouvez vous y préparer avec un pique-nique et beaucoup de patience, ou
          planifier autour :
        </PG>
        <SplitFigure
          src="/media/walibi-holland/goliath.jpg"
          alt="Les montagnes russes Goliath à Walibi Holland un jour d’affluence"
          kicker="Jour de pointe"
          title="Beau temps, tout le monde en congé, tout le monde là"
          reverse
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="very_high" />
            </GlossaryTermLink>
          }
        >
          Un samedi des vacances d’été par beau temps, c’est le pire des cas : tout le monde est en
          congé, tout le monde veut sortir, tout le monde est là. Si vous êtes flexible, prenez
          plutôt le mardi suivant. Le même parc a alors l’air d’avoir été réaménagé pendant la nuit
          par quelqu’un qui aurait oublié les files.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Week-ends & jours fériés',
              body: 'Le samedi est le jour le plus chargé sur tous les parcs, nettement détaché du reste de la semaine. Les jours fériés et les longs week-ends en rajoutent encore.',
            },
            {
              icon: CalendarRange,
              title: (
                <GlossaryTermLink termId="school-holiday">Vacances scolaires</GlossaryTermLink>
              ),
              body: 'Dès que votre région ou la région voisine est en vacances, l’affluence grimpe. Les vacances d’été sont la haute saison par excellence.',
            },
            {
              icon: Sun,
              title: 'Ponts & samedis de vacances en plein été',
              body: 'Soleil, jour de congé et haute saison tombent ici en même temps. De toutes les combinaisons du calendrier, c’est la plus chargée.',
            },
            {
              icon: Sparkles,
              title: 'Les nouveautés lors de leur premier été',
              body: 'Une montagne russe toute neuve, tout le monde veut l’avoir faite dès sa première saison, de préférence avant les collègues. Attendez-vous à de longues files pour les premières.',
            },
          ]}
        />
      </SectionShell>

      {/* 04 — Tactics */}
      <SectionShell
        id="tactics"
        index="04"
        kicker="Jouez futé"
        title="Tactiques pour des files courtes"
        icon={Sparkles}
      >
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Jour de semaine plutôt que week-end',
              body: 'Le plus grand levier du calendrier. Sur l’ensemble des parcs, le samedi est le jour le plus au-dessus de la moyenne, et le mardi le plus en dessous.',
            },
            {
              icon: CloudRain,
              title: 'Jouer la météo avec malice',
              body: 'Une prévision incertaine garde beaucoup de gens chez eux. Si un peu de bruine ne vous gêne pas, vous faites nettement moins la queue. Un imperméable vaut mieux qu’un parapluie.',
            },
            {
              icon: Ticket,
              title: (
                <>
                  <GlossaryTermLink termId="single-rider">Single rider</GlossaryTermLink> &{' '}
                  <GlossaryTermLink termId="virtual-queue">files virtuelles</GlossaryTermLink>
                </>
              ),
              body: 'Comblez les places libres en single rider, ou faites la queue via l’appli pendant que vous mangez ou flânez. Vous ne serez pas assis côte à côte, mais vous serez assis plus tôt.',
            },
          ]}
        />
        <P>
          La façon dont tout cela s’articule dans un parc est détaillée pas à pas dans le{' '}
          <Link href={`/${HOWTO_SEGMENTS.fr}`}>guide complet</Link>.
        </P>
      </SectionShell>

      {/* 05 — Crowd calendar for your park */}
      <SectionShell
        id="parks"
        index="05"
        kicker="Pour votre parc"
        title="Le calendrier d’affluence"
        icon={Ticket}
      >
        <P>
          Les tendances ci-dessus donnent le cadre. Le meilleur jour pour votre parc, c’est le{' '}
          <GlossaryTermLink termId="crowd-calendar">calendrier d’affluence</GlossaryTermLink> de
          chaque page de parc qui vous le donne : vert, jaune, rouge, aussi loin que le parc a
          publié ses horaires, avec les vacances et jours fériés de la région concernée.
        </P>
        <SplitFigure
          src="/media/efteling/symbolica.jpg"
          alt="L’attraction du palais Symbolica à Efteling"
          kicker="Vert, jaune, rouge"
          title="Une couleur par jour, aussi loin que vont les horaires"
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="low" />
            </GlossaryTermLink>
          }
        >
          Chaque page de parc porte une prévision jour par jour qui connaît les vacances scolaires
          et les jours fériés de la bonne région, y compris ceux dont vous n’avez jamais entendu
          parler. Choisissez un jour vert, et le plus important de la planification est fait avant
          d’acheter un billet.
        </SplitFigure>
        <P>Quelques parcs populaires pour se lancer directement :</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Propulsé par Fancast"
        body="Notre modèle de prévision maison estime l’affluence pour chaque jour publié et se note lui-même au passage."
      />

      {/* 06 — FAQ */}
      <SectionShell
        id="faq"
        index="06"
        kicker="En bref"
        title="Questions fréquentes sur le meilleur moment pour visiter"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
