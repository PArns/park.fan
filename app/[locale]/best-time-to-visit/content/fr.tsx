import React from 'react';
import { Link } from '@/i18n/navigation';
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
import { FancastCta } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'Les jours de semaine les plus calmes',
  weekdaysBody:
    'Moyenne sur tous les parcs — chaque parc d’abord normalisé sur sa propre moyenne, pour que les grands parcs n’écrasent pas les petits. Voilà à quel point un jour de semaine typique est fréquenté par rapport à la moyenne. Du mardi au jeudi l’emportent presque à chaque fois.',
  monthsTitle: 'Les mois les plus calmes',
  monthsBody:
    'Le même calcul sur l’année : les mois hors saison sont nettement plus vides que les pics de l’été et des vacances.',
  quieter: 'plus calme',
  busier: 'plus chargé',
  typical: 'proche de la moyenne',
  footnote: 'D’après {days} jours-parc sur {parks} parcs, {months} derniers mois.',
  pending:
    'Le classement en direct rassemble encore les temps d’attente. Les jours les plus calmes apparaîtront ici dès qu’il y aura assez de données.',
};

const FAQ = [
  {
    question: 'Quel est le meilleur moment pour visiter un parc d’attractions ?',
    answer:
      'C’est le plus calme en semaine hors vacances scolaires — du mardi au jeudi en basse saison sont presque toujours les journées les plus détendues. Les tendances précises par jour de semaine et par mois sont affichées ci-dessus, en direct à partir de vraies données de temps d’attente sur tous les parcs.',
  },
  {
    question: 'Quel jour de la semaine est le moins fréquenté ?',
    answer:
      'En moyenne sur tous les parcs, le mardi, le mercredi et le jeudi sont les plus calmes, tandis que le samedi et le dimanche sont nettement les plus chargés. Les parcs peuvent différer — chaque page de parc propose un calendrier d’affluence qui le montre jour par jour.',
  },
  {
    question: 'Quels mois les parcs d’attractions sont-ils les moins fréquentés ?',
    answer:
      'Les mois de basse saison, loin des pics de l’été et des jours fériés, sont les plus vides. L’aperçu mensuel ci-dessus montre l’affluence relative sur l’année, en moyenne sur tous les parcs.',
  },
  {
    question: 'Est-ce que ça vaut le coup de venir sous la pluie ?',
    answer:
      'Souvent oui : le mauvais temps décourage beaucoup de visiteurs et les files raccourcissent — surtout pour les montagnes russes qui tournent quand même. Mais l’astuce d’initié ne marche que tant que tout le monde n’a pas la même idée ; c’est pourquoi notre modèle de prévision intègre directement la météo.',
  },
  {
    question: 'Comment trouver le meilleur jour pour un parc précis ?',
    answer:
      'Cette page montre les tendances globales comme point de départ. Pour un parc précis, ouvrez son calendrier d’affluence : il affiche pour chaque journée, jusqu’à un an à l’avance, une prévision verte, jaune ou rouge — vacances scolaires et jours fériés de la région compris.',
  },
  {
    question: 'D’où viennent ces données ?',
    answer:
      'Des temps d’attente réellement enregistrés de plus de 150 parcs au cours des deux dernières années. Chaque parc est normalisé sur sa propre moyenne puis moyenné sur l’ensemble des parcs, pour que le classement soit équitable et ne soit pas dominé par les plus grands parcs.',
  },
] as const;

export function ContentFR() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Le meilleur moment pour visiter un parc d’attractions n’est pas un secret — c’est une
          tendance. Le moment où un parc se remplit suit le jour de la semaine, le calendrier des
          vacances scolaires, la météo et la saison ; les quatre laissent des empreintes dans les
          temps d’attente.
        </Lead>
        <P>
          Ces empreintes, nous les avons mesurées sur plus de 150 parcs au cours des deux dernières
          années. Ci-dessous : les jours de semaine et les mois les plus calmes, les heures les plus
          tranquilles de la journée, les dates à esquiver — et le calendrier d’affluence qui
          transforme tout cela en le meilleur jour possible pour votre parc.
        </P>
        <Highlight>
          Version courte : du mardi au jeudi hors vacances scolaires, arriver à l’ouverture et
          laisser une météo incertaine faire le tri de la foule à votre place. Tout ce qui suit,
          c’est les petits caractères.
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
          L’affluence n’a rien d’un hasard : le moment où ça se remplit suit des tendances claires
          de jour de semaine, de vacances, de météo et de saison. Voici les deux plus marquantes —
          en moyenne sur tous les parcs, à partir de vraies données de temps d’attente :
        </PG>
        <BestTimesData locale="fr" labels={DATA_LABELS} />
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
          Ce n’est pas que le jour qui compte, mais aussi l’heure. Trois créneaux sont presque
          partout les plus calmes :
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: 'À l’ouverture (rope drop)',
              body: 'La première heure est en or : en arrivant à l’ouverture, on enchaîne souvent les têtes d’affiche pour une fraction du temps d’attente ultérieur.',
            },
            {
              icon: Users,
              title: 'Autour du déjeuner',
              body: 'Quand la foule mange, les files se vident — un bon moment pour les attractions populaires (et pour manger plus tard).',
            },
            {
              icon: Sun,
              title: 'Les 90 dernières minutes',
              body: 'Beaucoup de visiteurs à la journée partent tôt. Juste avant la fermeture, les temps d’attente baissent souvent encore nettement.',
            },
            {
              icon: Ticket,
              title: 'Pendant le grand spectacle du soir',
              body: 'Une parade ou un feu d’artifice mobilise des milliers de visiteurs d’un coup — les temps d’attente des montagnes russes chutent de façon mesurable.',
            },
          ]}
        />
        <SplitFigure
          src="/images/parks/phantasialand/black-mamba.jpg"
          alt="Black Mamba fonçant à travers la jungle à Phantasialand"
          kicker="Rope drop"
          title="La première heure est en or"
        >
          En arrivant à l’ouverture, on enchaîne souvent les têtes d’affiche pour une fraction du
          temps d’attente ultérieur. La première heure remplace régulièrement deux heures de
          l’après-midi — pas besoin de fast-pass, juste d’un réveil matinal.
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
          Aussi importantes que les jours calmes sont les jours chargés. À ces dates, attendez-vous
          à de l’affluence — prévoyez-les, ou contournez-les :
        </PG>
        <SplitFigure
          src="/images/parks/walibi-holland/goliath.jpg"
          alt="Les montagnes russes Goliath à Walibi Holland un jour d’affluence"
          kicker="Jour de pointe"
          title="Beau temps, tout le monde en congé, tout le monde là"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          La combinaison de pointe classique — un samedi de vacances en plein été — cumule presque
          tous les facteurs d’affluence d’un coup. Si vous le pouvez, prenez plutôt le mardi suivant
          : même parc, moitié moins de file.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Week-ends & jours fériés',
              body: 'Le samedi et le dimanche sont les plus chargés sur tous les parcs ; les jours fériés et les longs week-ends en rajoutent encore.',
            },
            {
              icon: CalendarRange,
              title: 'Vacances scolaires',
              body: 'Pendant les vacances de votre région et des régions voisines, l’affluence grimpe fortement — les grandes vacances d’été surtout.',
            },
            {
              icon: Sun,
              title: 'Ponts & samedis de vacances en plein été',
              body: 'La combinaison de pointe classique : beau temps, tout le monde en congé, tout le monde sur place. Si possible, préférez le mardi suivant.',
            },
            {
              icon: Sparkles,
              title: 'Les nouveautés lors de leur premier été',
              body: 'Une montagne russe toute neuve attire les foules lors de sa saison d’ouverture — attendez-vous à de longues files pour les premières.',
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
              body: 'Le plus grand levier de tous : un mardi au lieu d’un samedi peut réduire de moitié les temps d’attente.',
            },
            {
              icon: CloudRain,
              title: 'Jouer la météo avec malice',
              body: 'Une prévision incertaine en décourage beaucoup. Qui est équipé contre la pluie fait moins la queue — un imperméable vaut mieux qu’un parapluie.',
            },
            {
              icon: Sunrise,
              title: 'Arriver tôt',
              body: 'Le rope drop bat presque toutes les autres tactiques. La première heure remplace souvent deux heures de l’après-midi.',
            },
            {
              icon: Ticket,
              title: 'Single rider & files virtuelles',
              body: 'Montez seul ou faites la queue en version numérique pendant que vous mangez ou faites les boutiques — du temps gagné les jours chargés.',
            },
          ]}
        />
        <P>
          La façon dont tout cela s’articule dans un parc est détaillée pas à pas dans le{' '}
          <Link href="/howto">guide complet</Link>.
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
          Les tendances ci-dessus sont le point de départ. Le jour idéal exact, c’est le calendrier
          d’affluence de chaque page de parc qui vous le donne — vert, jaune, rouge, jusqu’à un an à
          l’avance, avec les vacances et jours fériés de la région concernée.
        </P>
        <SplitFigure
          src="/images/parks/efteling/symbolica.jpg"
          alt="L’attraction du palais Symbolica à Efteling"
          kicker="Vert, jaune, rouge"
          title="Une couleur par jour, un an à l’avance"
          badge={<CrowdLevelBadge level="low" />}
        >
          Chaque page de parc porte une prévision jour par jour qui intègre les vacances scolaires
          et les jours fériés de cette région précise. Choisissez un jour vert et vous avez fait
          quatre-vingt-dix pour cent de la planification avant même d’avoir réservé.
        </SplitFigure>
        <P>Quelques parcs populaires pour se lancer directement :</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Propulsé par Fancast"
        body="Notre modèle de prévision — il anticipe l’affluence jusqu’à 365 jours à l’avance et se note lui-même en toute transparence."
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
