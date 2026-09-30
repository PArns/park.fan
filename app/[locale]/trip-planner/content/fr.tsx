import { CalendarDays, Footprints, Gauge, HelpCircle, Sunrise, Theater, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/** L'article de la page du planificateur, français. Voir `content/de.tsx` pour la convention. */
export function ContentFR({ day, entries }: { day: PlanDay; entries: PlannerEntry[] }) {
  return (
    <>
      <Chapter
        id="une-journee-planifiee"
        index="01"
        icon={CalendarDays}
        kicker="La journée en frise"
        title="Blocs et correspondances"
      >
        <P>
          Un bloc est une attraction, et sa hauteur est le temps d&apos;attente prévu pour son
          heure. Déplacez le même bloc vers une heure chargée et il grandit ; posez-le dans une
          heure calme et il rétrécit. Entre deux blocs se trouve la correspondance : la distance, et
          le temps qu&apos;il reste pour la parcourir. La sortie de la station et le tour lui-même
          sont comptés dans la correspondance.
        </P>
        <P>
          La frise ci-dessous est faite des mêmes composants que le planificateur et affiche la
          réponse que l&apos;API a donnée le 4 septembre 2026 pour le samedi 12 septembre à{' '}
          <A href={PARK}>Phantasialand</A>. Faites glisser un bloc vers une autre heure. Il se cale
          sur cinq minutes, et sa hauteur comme les correspondances voisines sont recalculées. Rien
          n&apos;est enregistré ici.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Sur le bloc sélectionné, la même chose figure en toutes lettres : l&apos;heure,
          l&apos;attente attendue, et de combien la prévision se trompe habituellement sur cette
          attraction.
        </Note>
      </Chapter>

      <Chapter
        id="d-ou-vient-le-chiffre"
        index="02"
        icon={Gauge}
        kicker="Le chiffre sur un bloc"
        title="D'où viennent les minutes, et ce qu'elles valent"
      >
        <P>
          Pour chaque attraction, l&apos;API renvoie une courbe sur la journée, heure par heure. Ce
          samedi-là, Taron affiche 45 minutes à dix heures, 50 à onze, 40 à treize et de nouveau 50
          en soirée, soit seulement dix minutes d&apos;écart sur toute la journée. Faute de bon
          créneau pour Taron ce jour-là, elle se retrouve là où il reste de la place dans la
          journée. Black Mamba descend de 35 minutes à midi à 20 à dix-huit heures, et Chiapas fait
          l&apos;inverse, de 20 à 35.
        </P>
        <P>
          S&apos;y ajoute l&apos;écart habituel entre le chiffre et la réalité, et plus la file est
          longue, plus la dispersion est grande. Pour les attractions dont le pic du jour atteint 35
          minutes ou plus, l&apos;API annonce ce samedi-là une erreur typique de 15,4 minutes, et de
          10,9 pour les plus plates. Une journée sur deux, l&apos;attente réelle s&apos;en écarte
          davantage. Sur le bloc sélectionné, cette erreur figure donc en plus ou moins. Sous forme
          de fourchette, le chiffre donnerait l&apos;impression que l&apos;attente réelle s&apos;y
          trouve à coup sûr.
        </P>
        <Note>
          La courbe de Taron repose sur 142 jours mesurés, celle de Black Mamba sur 161. Le nombre
          figure sur <A href={`${PARK}/taron`}>la page de l&apos;attraction</A>.
        </Note>
        <P>
          À côté du chiffre figure aussi la sorte de prévision. Quand le modèle calcule la journée
          heure par heure, c&apos;est indiqué. Quand la hauteur du jour vient de la prévision et la
          forme de journées passées, comme ce samedi, c&apos;est indiqué aussi. Assez loin à
          l&apos;avance, même cette hauteur devient incertaine et il ne reste qu&apos;une estimation
          grossière. Pour une journée jamais mesurée, il n&apos;y a pas de plan chiffré du tout.
        </P>
      </Chapter>

      <Chapter
        id="horaires-d-ouverture"
        index="03"
        icon={Sunrise}
        kicker="Ouverture"
        title="Les attractions qui ouvrent après le parc"
      >
        <P>
          Ce samedi-là, Phantasialand ouvre à 9 h. Taron, F.L.Y., les deux Winja&apos;s et Raik ne
          tournent qu&apos;à partir de 10 h, Chiapas à partir de 10 h 15. Qui se présente au
          tourniquet à neuf heures a le choix entre Black Mamba et Maus au Chocolat. Un plan qui
          remplit la première heure de têtes d&apos;affiche ne tient donc pas ce jour-là.
        </P>
        <P>
          Chaque attraction a sa propre heure d&apos;ouverture, et un bloc se place au plus tôt à
          cette heure-là. Le soir, cette limite manque, parce qu&apos;aucun flux ne signale de façon
          fiable quand une attraction ferme ; la frise s&apos;arrête à l&apos;heure de fermeture du
          parc.
        </P>
      </Chapter>

      <Chapter
        id="correspondances"
        index="04"
        icon={Footprints}
        kicker="Le trajet entre deux"
        title="Combien de temps il vous faut d'une attraction à l'autre"
      >
        <P>
          Un flux de temps d&apos;attente signale 50 minutes à Taron. Si vous y serez à temps en
          partant de Rookburgh, c&apos;est la correspondance qui le calcule. Elle part de la
          distance entre les coordonnées des deux attractions, plus trois minutes pour sortir
          d&apos;une station et trois pour l&apos;embarquement et le tour là où aucune durée
          n&apos;est connue.
        </P>
        <P>
          Cette distance est à vol d&apos;oiseau, et elle est nommée comme telle. À pied, c&apos;est
          plus long, parce que les allées contournent l&apos;eau, les files et les sens uniques et
          que Phantasialand empile Rookburgh et Klugheim. La borne supérieure se calcule donc à
          l&apos;allure d&apos;un parc plutôt qu&apos;au pas vif, avec deux tiers ajoutés à la ligne
          droite pour le détour.
        </P>
        <Note>
          Une correspondance est «&nbsp;juste&nbsp;» quand elle ne tient plus dès que la prévision
          se trompe autant qu&apos;elle l&apos;annonce elle-même. Si l&apos;API ne fournit pas de
          dispersion, le verdict s&apos;arrête à «&nbsp;bon&nbsp;», et c&apos;est précisé dans son
          intitulé.
        </Note>
      </Chapter>

      <Chapter
        id="ordre-de-la-journee"
        index="05"
        icon={Wand2}
        kicker="Tri"
        title="Faire trier la journée"
      >
        <P>
          Deux boutons s&apos;en chargent, avec le même calcul derrière. «&nbsp;Planifier toutes les
          attractions phares&nbsp;» ajoute les grandes attractions du parc qui manquent encore à la
          journée, puis remet le tout dans l&apos;ordre. «&nbsp;Optimiser la journée&nbsp;» se
          contente de réordonner ce qui est déjà prévu. Le premier sert quand il manque encore de
          grandes attractions, le second quand seul l&apos;ordre doit s&apos;améliorer.
        </P>
        <P>
          Le tri suit quatre règles, dans cet ordre. D&apos;abord la vôtre : ce que vous placez en
          tête sera la dernière chose à sauter. Ensuite, tout doit passer avant la fermeture, et
          mieux vaut une attraction de moins qui a lieu à coup sûr qu&apos;une de plus qui
          arriverait trop tard. Puis vient le total des temps d&apos;attente, et à total égal,
          l&apos;ordre qui se termine le plus tôt l&apos;emporte. Il n&apos;y a pas de curseur pour
          mettre l&apos;attente dans les files en balance avec le temps passé à ne rien faire, parce
          que rien ne permettrait de justifier une valeur pour ce rapport.
        </P>
        <P>
          Il n&apos;y a pas de règle propre au matin, seulement la courbe horaire de chaque
          attraction. Si elle est au plus bas juste après l&apos;ouverture, «&nbsp;la grosse
          attraction d&apos;abord&nbsp;» sort du calcul tout seul ; si elle est plate, il en sort
          autre chose. Sur une journée mesurée, Taron affiche heure après heure 60, 60, 54, 53 puis
          59 minutes, tandis que Chiapas monte de 22 minutes.
        </P>
        <P>
          Parfois la proposition est d&apos;attendre un moment plutôt que de se mettre tout de suite
          dans la file. Cela arrive quand la file descend assez pour que, pause comprise, vous soyez
          libre plus tôt qu&apos;en vous mettant dans la file maintenant. Faire moins la queue ne
          suffit pas, car la pause ne doit pas faire finir la journée plus tard. Une telle pause
          dure au plus deux heures. Elle approche rarement cette limite, car une pause ne vaut le
          coup que si elle est plus courte que la file qu&apos;elle évite, et deux heures de pause
          demanderaient une file de plus de deux heures.
        </P>
        <P>
          Une pause déjeuner à treize heures reste à treize heures, et une attraction cochée reste
          où elle est ; le reste se range autour. Après le clic, vous voyez ce qui a changé.
          «&nbsp;18 min d&apos;attente en moins&nbsp;» est la différence entre deux calculs menés de
          la même façon, l&apos;un avant le clic et l&apos;autre après. S&apos;il n&apos;y a rien à
          gagner, il est écrit que l&apos;ordre est déjà le bon, et le plan reste tel quel. Après le
          bouton des têtes d&apos;affiche, vous voyez à la place d&apos;un gain combien
          d&apos;attractions se sont ajoutées et combien ne conviennent pas au groupe, puisque la
          journée s&apos;allonge avec elles. Ce qui ne tient plus dans la journée est signalé après
          les deux boutons. «&nbsp;Annuler&nbsp;» rétablit l&apos;état d&apos;avant le clic, tant
          que le planificateur reste ouvert.
        </P>
        <Note>
          Là où aucun temps d&apos;attente n&apos;arrive, les deux boutons manquent. Au Hansa-Park,
          chaque attraction coûte le même zéro supposé, si bien qu&apos;un ordre en vaut un autre.
        </Note>
      </Chapter>

      <Chapter
        id="horaires-de-spectacle"
        index="06"
        icon={Theater}
        kicker="Spectacles"
        title="D'où viennent les horaires des spectacles"
      >
        <P>
          Pour aujourd&apos;hui, l&apos;API dispose des horaires publiés par le parc. Pour toute
          autre date, elle reporte le dernier jour de semaine identique, comme aucune source ne
          publie les horaires à l&apos;avance, et indique de quelle date ils viennent et sur combien
          de jours ils reposent. Un report reçoit un tilde devant l&apos;heure et le mot
          «&nbsp;prévu&nbsp;» ; un horaire officiel n&apos;a ni l&apos;un ni l&apos;autre.
        </P>
        <P>
          Ce samedi-là, tous les horaires sont des reports : ceux de Dragon Drago et de Kroka&apos;s
          Lodge datent du 15 août, ceux de Miji African Dancers du 29. La dernière représentation de
          Kroka&apos;s Lodge à 19 h n&apos;apparaît pas sur la frise, parce que le parc ferme à 18 h
          et que les horaires reportés au-delà sont écartés.
        </P>
      </Chapter>

      <Chapter
        id="limites"
        index="07"
        icon={HelpCircle}
        kicker="Limites"
        title="Ce qui manque et où le plan est enregistré"
      >
        <P>
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> ne montre ses temps
          d&apos;attente que dans son application, sur le wifi du parc. Aucun chiffre ne nous
          parviendra donc jamais pour lui, et nous n&apos;en inventons pas. La prévision météo porte
          à une quinzaine de jours ; au-delà, c&apos;est indiqué, au lieu de laisser un vide qui se
          lirait «&nbsp;il fera sec&nbsp;».
        </P>
        <P>
          Le jour même, une attraction peut tomber en panne, un spectacle être annulé ou un orage
          bousculer l&apos;après-midi. Le plan calcule si la journée tient avec les temps
          d&apos;attente prévus. Sur place, vous cochez ce que vous avez fait, et le temps
          d&apos;attente qui était réellement affiché s&apos;inscrit à côté.
        </P>
        <P>
          Le plan reste dans votre navigateur, et vous n&apos;avez pas besoin de compte. Ce
          n&apos;est qu&apos;en activant les notifications qu&apos;une copie part sur notre serveur,
          et c&apos;est signalé à ce moment-là. Sans plan, vous commencez par l&apos;assistant et
          ses quatre questions préalables : quel parc, quel jour, qui vient, et quelles grandes
          attractions doivent entrer dans la journée. Le bon jour se trouve le plus facilement dans
          le <A href={`${PARK}/calendrier-temps-attente`}>calendrier des temps d&apos;attente</A> du
          parc.
        </P>
      </Chapter>
    </>
  );
}
