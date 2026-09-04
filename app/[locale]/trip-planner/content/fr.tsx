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
        title="Ce que le planificateur fait d'une journée au parc"
      >
        <P>
          Un bloc est une attraction, et sa hauteur est le temps d&apos;attente prévu pour son
          heure. Déplacez le même bloc vers une heure chargée et il grandit ; posez-le dans une
          heure calme et il rétrécit. Entre deux blocs il n&apos;y a pas du vide mais la
          correspondance : la distance, et le temps qu&apos;il reste pour la parcourir. La sortie de
          la station et le tour lui-même y sont comptés, pas dans le bloc.
        </P>
        <P>
          Rien de ce qui suit n&apos;a été redessiné. Ce sont les composants du planificateur
          lui-même, alimentés par la réponse que l&apos;API a donnée le 4 septembre 2026 pour le
          samedi 12 septembre à <A href={PARK}>Phantasialand</A>. Faites glisser un bloc vers une
          autre heure : il se cale sur cinq minutes, recalcule sa hauteur, et les correspondances à
          côté suivent. Rien n&apos;est enregistré ici.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Le bloc sélectionné le dit en toutes lettres : l&apos;heure, l&apos;attente attendue, et
          de combien la prévision se trompe habituellement sur cette attraction.
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
          en soirée. C&apos;est la vraie raison de faire Taron tôt : non pas parce que les matinées
          sont toujours plus calmes, mais parce que cette journée-là n&apos;offre aucune heure
          creuse pour cette attraction. Black Mamba fait l&apos;inverse et descend de 35 minutes à
          midi à 20 à dix-huit heures, et Chiapas monte de 20 à 35.
        </P>
        <P>
          S&apos;y ajoute l&apos;écart habituel entre le chiffre et la réalité, qui suit le niveau :
          plus la file est longue, plus la dispersion est grande. Pour les attractions dont le pic
          du jour atteint 35 minutes ou plus, l&apos;API annonce ce samedi-là une erreur typique de
          15,4 minutes, et de 10,9 pour les plus plates. Typique veut dire que la moitié des
          journées s&apos;en écartent davantage. Le planificateur l&apos;écrit donc en plus ou moins
          sur le bloc sélectionné, et jamais comme une fourchette qui contiendrait déjà la bonne
          réponse.
        </P>
        <Note>
          La courbe de Taron repose sur 142 jours mesurés, celle de Black Mamba sur 161. Le nombre
          figure sur <A href={`${PARK}/taron`}>la page de l&apos;attraction</A>.
        </Note>
        <P>
          Le planificateur dit aussi de quelle sorte de prévision il dispose. Quand le modèle
          calcule la journée heure par heure, il l&apos;annonce. Quand la hauteur du jour vient de
          la prévision et la forme de journées passées, comme ce samedi, il l&apos;annonce aussi.
          Assez loin à l&apos;avance, cette hauteur devient elle-même mince et il ne reste
          qu&apos;une estimation grossière. Pour une journée jamais mesurée, il n&apos;y a pas de
          plan chiffré du tout.
        </P>
      </Chapter>

      <Chapter
        id="horaires-d-ouverture"
        index="03"
        icon={Sunrise}
        kicker="Ouverture"
        title="Le parc ouvre à neuf heures, l'attraction à dix"
      >
        <P>
          Ce samedi-là, Phantasialand ouvre à 9 h. Taron, F.L.Y., les deux Winja&apos;s et Raik ne
          tournent qu&apos;à partir de 10 h, Chiapas à partir de 10 h 15. Qui se présente au
          tourniquet à neuf heures peut faire Black Mamba ou Maus au Chocolat, et c&apos;est tout.
          Ce n&apos;est pas un détail : un plan qui remplit la première heure de têtes
          d&apos;affiche planifie une heure qui n&apos;existe pas.
        </P>
        <P>
          Le planificateur connaît l&apos;heure d&apos;ouverture de chaque attraction et ne laisse
          pas un bloc glisser avant elle. Il n&apos;existe pas d&apos;équivalent pour le soir :
          aucun flux ne signale de façon fiable quand une attraction ferme, donc rien n&apos;est
          affirmé là-dessus. La frise s&apos;arrête à l&apos;heure de fermeture du parc.
        </P>
      </Chapter>

      <Chapter
        id="correspondances"
        index="04"
        icon={Footprints}
        kicker="Le trajet entre deux"
        title="Entre deux attractions il y a un trajet, et il coûte du temps"
      >
        <P>
          Un flux de temps d&apos;attente peut dire que Taron est à 50 minutes. Ce qu&apos;il ne
          peut pas dire, c&apos;est que vous n&apos;y serez pas à temps depuis Rookburgh. La
          correspondance est là pour ça. Elle part de la distance entre les coordonnées des deux
          attractions, plus trois minutes pour sortir d&apos;une station et trois pour
          l&apos;embarquement et le tour là où aucune durée n&apos;est connue.
        </P>
        <P>
          Cette distance est à vol d&apos;oiseau, et elle est nommée comme telle. C&apos;est une
          borne inférieure et jamais un temps de marche : les allées contournent l&apos;eau, les
          files et les sens uniques, et Phantasialand empile Rookburgh et Klugheim. La borne
          supérieure se calcule donc à l&apos;allure d&apos;un parc plutôt qu&apos;au pas vif, avec
          deux tiers ajoutés à la ligne droite pour le détour.
        </P>
        <Note>
          «&nbsp;Juste&nbsp;» ne veut pas dire étroit. Cela veut dire que cette correspondance ne
          tient plus si la prévision se trompe autant qu&apos;elle l&apos;annonce elle-même. Là où
          l&apos;API ne fournit pas de dispersion, le verdict s&apos;arrête à «&nbsp;bon&nbsp;» et
          le dit dans son intitulé.
        </Note>
      </Chapter>

      <Chapter
        id="ordre-de-la-journee"
        index="05"
        icon={Wand2}
        kicker="Tri"
        title="La journée peut se ranger toute seule"
      >
        <P>
          Deux boutons s&apos;en chargent. «&nbsp;Planifier toutes les attractions phares&nbsp;»
          ajoute les grandes attractions du parc qui manquent encore à la journée, puis remet le
          tout dans l&apos;ordre. «&nbsp;Optimiser la journée&nbsp;» n&apos;ajoute rien et se
          contente de réordonner ce qui est déjà prévu. Le même calcul tourne derrière les deux ; ce
          sont deux boutons parce que ce sont deux questions : remplis ma journée, et l&apos;ordre
          peut-il être meilleur.
        </P>
        <P>
          Le tri porte sur trois choses, et leur hiérarchie est la vraie décision. D&apos;abord que
          tout passe encore avant la fermeture : un plan avec une attraction de moins qui a vraiment
          lieu vaut mieux qu&apos;un plan avec une de plus qui n&apos;aura pas lieu. Ensuite le
          total des temps d&apos;attente, ce qui était demandé. Et à coût égal, c&apos;est
          l&apos;ordre qui se termine le plus tôt qui l&apos;emporte. Aucun curseur ne met
          l&apos;attente en balance avec le temps passé à patienter : personne ne saurait justifier
          ce nombre.
        </P>
        <P>
          Aucune règle sur le matin ne s&apos;y cache. Le planificateur ne connaît que la courbe
          horaire de chaque attraction. Si elle est au plus bas juste après l&apos;ouverture,
          «&nbsp;la grosse attraction d&apos;abord&nbsp;» sort du calcul tout seul ; si elle est
          plate, il en sort autre chose. Sur une journée mesurée, Taron affiche heure après heure
          60, 60, 54, 53 puis 59 minutes, tandis que Chiapas monte de 22 minutes. Une règle fixe
          donnerait le même conseil pour les deux.
        </P>
        <P>
          Parfois la proposition est d&apos;attendre un moment plutôt que de se mettre tout de suite
          dans la file. Cela n&apos;arrive qu&apos;à une condition : la file doit descendre assez
          pour que, pause comprise, vous soyez libre plus tôt qu&apos;en vous mettant dans la file
          maintenant. Attendre moins longtemps ne suffit pas, et la journée ne s&apos;allonge jamais
          par ce calcul. Au-delà de deux heures, il ne fait patienter personne. Ce plafond ne joue
          presque jamais de lui-même : une pause ne vaut le coup que si elle est plus courte que la
          file qu&apos;elle évite, et deux heures de pause demanderaient donc une file de plus de
          deux heures.
        </P>
        <P>
          Une pause déjeuner à treize heures reste à treize heures, et une attraction cochée a été
          faite et n&apos;est pas replanifiée ; le reste se range autour. Ensuite, il est écrit ce
          qui s&apos;est passé. «&nbsp;18 min d&apos;attente en moins&nbsp;» est la différence entre
          deux calculs menés de la même façon, l&apos;un avant le clic et l&apos;autre après ;
          s&apos;il n&apos;y a rien à gagner, il est écrit que l&apos;ordre est déjà le bon et le
          plan reste tel quel. Le bouton des têtes d&apos;affiche n&apos;annonce pas de gain, la
          journée s&apos;allongeant avec les attractions ajoutées ; il compte plutôt combien
          d&apos;attractions sont venues s&apos;ajouter et combien ne conviennent pas au groupe. Ce
          qui ne tient plus dans la journée est signalé après les deux boutons. Un
          «&nbsp;Annuler&nbsp;» va avec et rétablit l&apos;état d&apos;avant le clic, tant que le
          planificateur reste ouvert.
        </P>
        <Note>
          Là où aucun temps d&apos;attente n&apos;arrive, les deux boutons ne sont pas affichés. Au
          Hansa-Park, chaque attraction coûte le même zéro supposé : un ordre en vaut un autre et il
          n&apos;y a rien à trier.
        </Note>
      </Chapter>

      <Chapter
        id="horaires-de-spectacle"
        index="06"
        icon={Theater}
        kicker="Spectacles"
        title="Un horaire vient du parc ou de notre calcul"
      >
        <P>
          Pour aujourd&apos;hui, l&apos;API dispose des horaires publiés par le parc. Pour toute
          autre date, aucune source ne les connaît à l&apos;avance : elle reporte donc le dernier
          jour de semaine identique, en indiquant de quelle date viennent les horaires et sur
          combien de jours ils reposent. Les deux ne doivent pas se ressembler : un report reçoit un
          tilde devant l&apos;heure et le mot «&nbsp;prévu&nbsp;», un horaire officiel ni l&apos;un
          ni l&apos;autre.
        </P>
        <P>
          Ce samedi-là, tous les horaires sont des reports : ceux de Dragon Drago et de Kroka&apos;s
          Lodge datent du 15 août, ceux de Miji African Dancers du 29. La dernière représentation de
          Kroka&apos;s Lodge à 19 h n&apos;apparaît pas sur la frise : le parc ferme à 18 h, et les
          horaires reportés au-delà sont écartés.
        </P>
      </Chapter>

      <Chapter
        id="limites"
        index="07"
        icon={HelpCircle}
        kicker="Limites"
        title="Ce que le planificateur ignore"
      >
        <P>
          Tous les parcs ne publient pas leurs temps d&apos;attente.{' '}
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> ne montre les siens
          que dans son application, sur le wifi du parc : aucun chiffre ne nous parviendra jamais
          pour lui, et le planificateur n&apos;en invente pas. Pour les dates lointaines, pas de
          météo non plus : la prévision porte à une quinzaine de jours, et au-delà le panneau le dit
          au lieu de laisser un vide qui se lirait «&nbsp;il fera sec&nbsp;».
        </P>
        <P>
          Et ce qu&apos;un plan coûte vraiment, c&apos;est la journée qui le décide. Une attraction
          tombe en panne, un spectacle est annulé, un orage retourne l&apos;après-midi. Le plan
          n&apos;est donc pas un horaire mais un calcul sur la question de savoir si la journée peut
          tenir. Sur place, vous cochez ce que vous avez fait, et le planificateur note le temps
          d&apos;attente qui était réellement affiché.
        </P>
        <P>
          Tout cela reste dans votre navigateur. Pas de compte, pas de serveur, pas de
          synchronisation : le plan est un fichier dans votre propre stockage, et qui ouvre le
          planificateur sans plan tombe sur l&apos;assistant et ses trois questions préalables. Quel
          parc, quel jour, qui vient. Le jour se choisit le plus facilement dans le{' '}
          <A href={`${PARK}/calendrier-temps-attente`}>calendrier des temps d&apos;attente</A> du
          parc.
        </P>
      </Chapter>
    </>
  );
}
