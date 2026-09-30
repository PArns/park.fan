import { CalendarDays, Clock, Footprints, Gauge, Users, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import { DEMO_PARTY_RIDES } from '../_fixtures';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/** The planner page's article, French. See `content/de.tsx` for the convention. */
export function ContentFR({ day, entries }: { day: PlanDay; entries: PlannerEntry[] }) {
  return (
    <>
      <Chapter
        id="une-journee-planifiee"
        index="01"
        icon={CalendarDays}
        kicker="La journée en frise"
        title="Blocs et transferts"
      >
        <P>
          Chaque attraction de votre plan est un bloc sur la frise de la journée, et sa hauteur
          correspond à l&apos;attente prévue à cette heure-là. Faites-le glisser vers une heure plus
          chargée et il grandit, vers une heure plus calme et il rétrécit. Entre deux blocs figure
          le transfert, avec la distance jusqu&apos;à l&apos;attraction suivante et le temps dont
          vous disposez. «&nbsp;Juste&nbsp;» signifie que le transfert ne passe plus dès que
          l&apos;attente précédente s&apos;écarte de la prévision autant que d&apos;habitude.
        </P>
        <P>
          Ci-dessous, un plan pour <A href={PARK}>Phantasialand</A> le samedi 12 septembre 2026,
          avec les attentes prévues pour ce jour-là le 4 septembre. Faites glisser un bloc vers une
          autre heure, et sa hauteur comme les transferts sont recalculés. Rien de tout cela
          n&apos;arrive dans votre propre plan.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Le bloc sélectionné indique l&apos;heure, l&apos;attente prévue et l&apos;écart habituel
          de la prévision pour cette attraction.
        </Note>
        <P>
          Sur un écran large, deux journées tiennent côte à côte, par exemple samedi et dimanche, ou
          deux parcs. Chacune affiche son temps d&apos;attente cumulé, et vous voyez quel jour vous
          fera le moins attendre.
        </P>
      </Chapter>

      <Chapter
        id="d-ou-vient-le-chiffre"
        index="02"
        icon={Gauge}
        kicker="Prévision"
        title="D'où viennent les temps d'attente"
      >
        <P>
          Chaque attraction a une prévision pour toute la journée, heure par heure. Ce samedi, Black
          Mamba passe de 35 minutes à midi à 20 en fin de journée, tandis que Chiapas est à 20
          minutes à dix heures et quart et à 35 l&apos;après-midi. Ce jour-là, Black Mamba se place
          donc le soir et Chiapas le matin.
        </P>
        <P>
          L&apos;écart habituel de la prévision pour une attraction figure sur son bloc, 15 minutes
          pour <A href={`${PARK}/taron`}>Taron</A> ce samedi. Plus la journée est lointaine, plus le
          chiffre est grossier, et son étiquette précise comment il a été obtenu, de
          «&nbsp;Prévision horaire&nbsp;» à «&nbsp;Estimation grossière&nbsp;» en passant par
          «&nbsp;D’après la prévision du jour&nbsp;».
        </P>
        <P>
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> ne montre ses temps
          d&apos;attente que dans sa propre application, sur le wifi du parc, donc il n&apos;y a
          aucun chiffre pour lui. Vous pouvez quand même y planifier une journée, simplement sans
          minutes et sans les boutons de tri.
        </P>
      </Chapter>

      <Chapter
        id="qui-vient"
        index="03"
        icon={Users}
        kicker="Groupe"
        title="Taille minimale et attractions aquatiques"
      >
        <P>
          Une nouvelle journée commence par quatre questions&nbsp;: quel parc, quel jour, qui vient
          et quelles grandes attractions entrent dans le plan. Dans le calendrier du mois, chaque
          jour est coloré selon l&apos;affluence attendue, et le{' '}
          <A href={`${PARK}/calendrier-temps-attente`}>calendrier des temps d&apos;attente</A> du
          parc donne plus de détails.
        </P>
        <P>
          Si des enfants viennent, vous indiquez la taille du plus petit et si vous préférez rester
          au sec. Les attractions dont la taille minimale est plus élevée et les attractions
          aquatiques reçoivent alors une marque et restent quand même dans la liste, car vous seuls
          savez si quelqu&apos;un attendra à la sortie avec les sacs. À Phantasialand, Taron exige{' '}
          {DEMO_PARTY_RIDES.taron.minimumHeight}&nbsp;cm, Chiapas{' '}
          {DEMO_PARTY_RIDES.chiapas.minimumHeight}&nbsp;cm, et Chiapas mouille (au 29 septembre
          2026). Avec un enfant de 120&nbsp;cm, les deux portent la marque.
        </P>
        <Note>
          Là où nous n&apos;avons pas de taille minimale, comme pour Moptis Monkey Depot,
          l&apos;attraction ne porte aucune marque. À l&apos;entrée de l&apos;attraction, c&apos;est
          la règle du parc qui s&apos;applique.
        </Note>
      </Chapter>

      <Chapter
        id="deroulement-de-la-journee"
        index="04"
        icon={Clock}
        kicker="Déroulé"
        title="Horaires d'ouverture, spectacles et pauses"
      >
        <P>
          Ce samedi, Phantasialand ouvre à 9&nbsp;h, mais Taron, F.L.Y. et la plupart des autres
          grandes attractions ne tournent qu&apos;à partir de 10&nbsp;h. Si vous êtes là à neuf
          heures, commencez par Black Mamba ou Maus au Chocolat. Un bloc ne peut pas être placé
          avant l&apos;ouverture de son attraction.
        </P>
        <P>
          Les horaires des spectacles figurent aussi sur la frise. Pour aujourd&apos;hui, ce sont
          ceux du parc. Aucune source ne les publie pour les jours suivants, alors nous reprenons
          ceux du dernier jour de semaine identique et ajoutons «&nbsp;Estimation&nbsp;».
        </P>
        <P>
          Pauses, repas ou point de rendez-vous se placent comme bloc personnel, de la durée
          qu&apos;il vous faut. Cochez «&nbsp;Prévoir le déjeuner&nbsp;» en créant la journée et il
          y en a déjà un à 12&nbsp;h&nbsp;30. Au-dessus de la journée figurent aussi les vacances
          scolaires et les jours fériés et, jusqu&apos;à environ deux semaines à l&apos;avance, la
          météo.
        </P>
      </Chapter>

      <Chapter
        id="ordre-de-la-journee"
        index="05"
        icon={Wand2}
        kicker="Tri"
        title="Faire trier la journée"
      >
        <P>
          Deux boutons mettent la journée en ordre sans que vous déplaciez chaque bloc.
          «&nbsp;Planifier toutes les attractions phares&nbsp;» ajoute les grandes attractions qui
          manquent encore, puis ordonne toute la journée. «&nbsp;Optimiser la journée&nbsp;»
          réarrange seulement ce qui est déjà prévu. Dans les deux cas, tout passe avant la
          fermeture du parc et vous faites la queue le moins longtemps possible.
        </P>
        <P>
          La pause déjeuner et les attractions cochées restent à leur place. Ensuite, vous voyez
          combien de minutes d&apos;attente vous gagnez, et «&nbsp;Annuler&nbsp;» rétablit
          l&apos;état précédent.
        </P>
        <P>
          Si tout ne rentre pas dans la journée, un assistant s&apos;ouvre. Il propose d&apos;abord
          des changements qui font de la place sans retirer d&apos;attraction, comme une pause
          déjeuner plus courte. Si cela ne suffit pas, vous classez les attractions par importance,
          et on coupe par le bas.
        </P>
      </Chapter>

      <Chapter
        id="dans-le-parc"
        index="06"
        icon={Footprints}
        kicker="Dans le parc"
        title="Le jour même"
      >
        <P>
          Dans le parc, vous cochez ce que vous avez fait. Le bloc indique alors l&apos;attente
          signalée au moment où vous l&apos;avez coché, et l&apos;écart avec l&apos;estimation. Si
          une attraction prévue est signalée fermée, c&apos;est aussi indiqué sur son bloc.
        </P>
        <P>
          Avec les notifications, nous vous prévenons quand il est temps de rejoindre la prochaine
          attraction, quand une attraction prévue ferme ou rouvre et quand une attente change
          nettement. Les horaires des spectacles peuvent aussi vous être envoyés. Vous choisissez ce
          que vous recevez.
        </P>
        <P>
          Le plan est enregistré dans votre navigateur, sans compte. C&apos;est seulement pour les
          notifications que nous gardons une copie sur notre serveur, supprimée dès que vous les
          désactivez. Tant qu&apos;elle existe, vous pouvez envoyer un lien vers le plan, et la
          personne qui l&apos;ouvre peut le reprendre comme sa propre copie.
        </P>
      </Chapter>
    </>
  );
}
