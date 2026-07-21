import React from 'react';
import { Link } from '@/i18n/navigation';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
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
import { Section, P, PG, TipList, FancastCta, FaqList } from '../_best-time-ui';
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
    <div className="space-y-14 text-base leading-7">
      {/* Data: quietest weekdays + months (live) */}
      <div className="space-y-4">
        <PG>
          L’affluence dans les parcs d’attractions n’a rien d’un hasard : le moment où ça se remplit
          suit des tendances claires de jour de semaine, de vacances, de météo et de saison. Voici les
          plus marquantes — en moyenne sur tous les parcs, à partir de vraies données de temps
          d’attente :
        </PG>
        <BestTimesData locale="fr" labels={DATA_LABELS} />
      </div>

      {/* Times of day */}
      <Section id="times" title="Les heures les plus calmes de la journée" icon={Clock}>
        <P>
          Ce n’est pas que le jour qui compte, mais aussi l’heure. Trois créneaux sont presque partout
          les plus calmes :
        </P>
        <TipList
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
      </Section>

      {/* Dates to avoid */}
      <Section id="avoid" title="Les dates à éviter" icon={Ban}>
        <PG>
          Aussi importantes que les jours calmes sont les jours chargés. À ces dates, attendez-vous à
          de l’affluence — prévoyez-les, ou contournez-les :
        </PG>
        <TipList
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
      </Section>

      {/* Tactics */}
      <Section id="tactics" title="Tactiques pour des files courtes" icon={Sparkles}>
        <TipList
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
      </Section>

      {/* Grab a park */}
      <Section id="parks" title="Pour votre parc : le calendrier d’affluence" icon={Ticket}>
        <P>
          Les tendances ci-dessus sont le point de départ. Le jour idéal exact, c’est le calendrier
          d’affluence de chaque page de parc qui vous le donne — vert, jaune, rouge, jusqu’à un an à
          l’avance, avec les vacances et jours fériés de la région concernée. Quelques parcs
          populaires pour se lancer directement :
        </P>
        <PopularParksGrid />
      </Section>

      {/* Powered by Fancast */}
      <FancastCta
        title="Propulsé par Fancast"
        body="Notre modèle de prévision — il anticipe l’affluence jusqu’à 365 jours à l’avance et se note lui-même en toute transparence."
      />

      {/* FAQ */}
      <Section id="faq" title="Questions fréquentes sur le meilleur moment pour visiter" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
