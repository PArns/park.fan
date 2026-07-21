 
import React from 'react';
import { Link } from '@/i18n/navigation';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
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
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import {
  Lead,
  Section,
  P,
  Highlight,
  TocNav,
  IngredientGrid,
  IngredientCard,
  CrowdLegend,
  TouchpointList,
  FaqList,
} from '../_fancast-ui';

const FAQ = [
  {
    question: 'Quelle est la précision de Fancast ?',
    answer:
      'La précision actuelle est affichée en direct en haut de cette page — sous forme de MAE (erreur moyenne en minutes), RMSE et MAPE. Ces chiffres proviennent de la comparaison réelle entre les prévisions passées et les temps d’attente vraiment mesurés, et non d’un labo de test flatteur. Ils changent chaque fois que le modèle se réentraîne.',
  },
  {
    question: 'Jusqu’où Fancast peut-il prévoir ?',
    answer:
      'Fancast fournit des niveaux d’affluence quotidiens pour un parc jusqu’à 365 jours à l’avance. Pour les attractions individuelles, il produit aussi des prévisions de temps d’attente heure par heure. Plus le jour approche, plus les signaux à court terme comme la météo sont pris en compte.',
  },
  {
    question: 'À quelle fréquence le modèle est-il mis à jour ?',
    answer:
      'Chaque jour. Fancast se réentraîne automatiquement une fois par jour à 06:00 UTC sur les données les plus fraîches — y compris les temps d’attente de la veille. Il s’améliore donc littéralement un peu chaque matin.',
  },
  {
    question: 'Quelles données Fancast utilise-t-il ?',
    answer:
      'Des temps d’attente en direct et historiques de plus de 150 parcs, des calendriers de vacances scolaires et de jours fériés (y compris des régions voisines), des prévisions météo, des horaires d’ouverture, des événements spéciaux et des motifs saisonniers. Ce mélange produit les niveaux d’affluence quotidiens et les prévisions de temps d’attente horaires.',
  },
  {
    question: 'Pourquoi un parc affiche-t-il « Aucune prévision » ?',
    answer:
      'Fancast n’évalue un parc que lorsqu’il dispose de suffisamment de données d’exploitation — au moins une trentaine de jours d’ouverture. Les parcs tout neufs ou rarement ouverts n’ont pas encore cette base, alors nous préférons afficher honnêtement « Aucune prévision » plutôt qu’un chiffre deviné.',
  },
  {
    question: 'Fancast est-il payant ?',
    answer:
      'Non. Comme tout park.fan, chaque prévision, calendrier d’affluence et statistique est gratuit, sans publicité et utilisable sans compte.',
  },
] as const;

export function ContentFR() {
  return (
    <div className="space-y-14 text-base leading-7">
      {/* Intro */}
      <div className="space-y-5">
        <Lead>
          Fancast est notre modèle de prévision maison — la partie de park.fan qui regarde vers
          l’avenir. Le nom ? Sans complexe mais méthodique : <strong>fan</strong> comme dans park.
          <strong>fan</strong>, <strong>cast</strong> comme dans fore<strong>cast</strong>. Un bulletin
          météo pour les files d’attente, en somme.
        </Lead>
        <P>
          L’idée est aussi simple qu’ambitieuse : Fancast lit des millions de temps d’attente réels en
          direct et prédit à quel point un parc sera fréquenté un jour donné — jusqu’à 365 jours à
          l’avance. Si le samedi en vaut la peine, ou si vous vous rendriez service avec un mardi. Vert,
          jaune ou rouge, bien avant d’être dans la voiture.
        </P>
        <P>
          Et comme nous ne faisons confiance qu’aux chiffres qui doivent faire leurs preuves, Fancast
          fait ce que la plupart des modèles évitent discrètement : il se note lui-même. Chaque
          prévision est ensuite confrontée au temps d’attente réellement survenu — au grand jour, ici
          même sur cette page. Tricher est inutile.
        </P>
        <Highlight>
          En bref : Fancast n’est pas un devin avec une boule de cristal. C’est un statisticien têtu qui
          reçoit du soutien scolaire chaque soir et doit repasser l’examen chaque matin. Une grenouille
          météo qui vérifie sa propre météo.
        </Highlight>

        <TocNav
          label="Sommaire"
          items={[
            ['#note', 'Le bulletin en direct'],
            ['#ingredients', 'Ce que lit Fancast'],
            ['#training', 'Comment Fancast apprend'],
            ['#levels', 'Vert, jaune, rouge'],
            ['#where', 'Où vous croisez Fancast'],
            ['#limits', 'Où sont les limites'],
            ['#faq', 'Questions fréquentes'],
          ]}
        />
      </div>

      {/* Live scorecard — reuses the homepage ML section (live from the dashboard) */}
      <div id="note" className="scroll-mt-20 space-y-4">
        <P>
          Assez de préambule — voici le bulletin, en direct et sans fard. Fancast tire ces chiffres de
          son propre tableau de bord à l’instant même ; ils changent dès que le modèle se réentraîne
          cette nuit :
        </P>
      </div>
      <div className="-mx-4">
        <MLStatsSection />
      </div>

      {/* What it reads */}
      <Section id="ingredients" title="Ce que lit Fancast" icon={Database}>
        <P>
          Un pont pluvieux en octobre est une tout autre bête qu’un samedi ensoleillé de vacances en
          juillet — et un modèle doit d’abord l’apprendre. Fancast se nourrit donc de plusieurs sources
          à la fois :
        </P>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Temps d’attente en direct">
            Des millions de relevés réels issus de plus de 150 parcs, mis à jour à la minute. La matière
            première de chaque prévision.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendriers & vacances">
            Week-ends, jours fériés et vacances scolaires — y compris ceux des régions voisines, car les
            visiteurs d’un jour se moquent des frontières.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Météo">
            Probabilité de pluie et température infléchissent les prévisions à court terme. Le soleil
            attire les foules, la pluie toute la journée vide les allées.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Événements & saison">
            Halloween, vacances d’été, longs week-ends, une tête d’affiche lors de son premier été — les
            suspects habituels d’une journée bondée.
          </IngredientCard>
          <IngredientCard icon={History} title="Historique">
            Des années d’historique de temps d’attente par parc. Des motifs qu’on ne voit qu’à force de
            les fixer assez longtemps.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Horaires & capacité">
            Quand le parc ouvre, pour combien de temps, à quelle capacité — le cadre dans lequel tout le
            reste s’insère.
          </IngredientCard>
        </IngredientGrid>
        <P>
          De ce mélange, le modèle tire deux choses : une{' '}
          <strong>prévision horaire des temps d’attente</strong> pour les attractions individuelles et
          une <strong>note d’affluence quotidienne</strong> pour le parc entier.
        </P>
      </Section>

      {/* How it learns */}
      <Section id="training" title="Comment Fancast apprend (et ne peut pas tricher)" icon={RefreshCw}>
        <P>
          L’astuce la plus importante n’a rien de spectaculaire : Fancast se réentraîne{' '}
          <strong>chaque nuit</strong>, tous les jours à 06:00 UTC. Ce qui s’est passé hier, le modèle
          le sait aujourd’hui. Un passionné de montagnes russes vieillit et se fatigue au fil des années
          — Fancast devient un peu plus malin chaque matin.
        </P>
        <P>
          Et il n’est jamais testé que sur des jours qu’il n’a <strong>jamais vus</strong> — sur
          l’avenir, pas sur des jours passés appris par cœur. Faire autrement reviendrait à se glisser
          soi-même les questions de l’examen à l’avance, puis à célébrer son bulletin sans faute.
        </P>
        <P>
          En plus, Fancast surveille s’il se met à <strong>dériver</strong> — si la réalité lui échappe
          peu à peu. Et une nouvelle version du modèle ne passe en ligne que si elle bat vraiment
          l’ancienne dans un duel équitable. Démocratie entre algorithmes : si tu n’es pas meilleur, tu
          restes sur le banc.
        </P>
      </Section>

      {/* Crowd levels */}
      <Section id="levels" title="Vert, jaune, rouge : les niveaux d’affluence" icon={Gauge}>
        <P>
          Au bout de tout ce calcul, il ne reste qu’une seule couleur. Six niveaux, de « le parc est
          quasiment à toi tout seul » à « bienvenue un samedi de vacances » :
        </P>
        <CrowdLegend
          items={[
            {
              level: 'very_low',
              text: 'Presque vide. Rêves de rope-drop, tours à la chaîne, une photo avec la mascotte sans la moindre file.',
            },
            {
              level: 'low',
              text: 'Détendu. Attentes courtes, tu montes sur tout sans avoir besoin d’un plan de bataille.',
            },
            {
              level: 'moderate',
              text: 'Fonctionnement normal. Les têtes d’affiche se remplissent, le reste reste tranquille. Une bonne journée de compromis.',
            },
            {
              level: 'high',
              text: 'Nettement fréquenté. Pour les meilleures attractions, mieux vaut se lever tôt — ou prendre son mal en patience.',
            },
            {
              level: 'very_high',
              text: 'Vraiment chargé. Longues files aux temps forts ; la planification l’emporte nettement sur la spontanéité.',
            },
            {
              level: 'extreme',
              text: 'Alerte maximale. Samedi de vacances en plein été. À conseiller uniquement avec stratégie, endurance et sens de l’humour.',
            },
          ]}
        />
      </Section>

      {/* Where you meet it */}
      <Section id="where" title="Où vous croisez Fancast" icon={MapPin}>
        <P>
          Fancast ne vit pas sur une page solitaire — il est tissé dans tout park.fan, le plus souvent
          sans se présenter :
        </P>
        <TouchpointList
          items={[
            {
              title: 'Prévision du jour',
              body: 'la note d’affluence dans l’en-tête du parc, avant même de toucher la première attraction.',
            },
            {
              title: 'Calendrier d’affluence',
              body: (
                <>
                  le <Link href="/parks">calendrier des meilleurs jours de visite</Link> sur chaque page
                  de parc — vert, jaune, rouge, jusqu’à un an à l’avance.
                </>
              ),
            },
            {
              title: 'Meilleure période de visite',
              body: 'les jours de semaine les plus calmes et les prochains jours à ne pas manquer, distillés à partir des mêmes données.',
            },
            {
              title: 'Prévision IA dans le graphique des temps d’attente',
              body: 'la ligne en pointillés qui révèle les créneaux les plus avantageux d’une attraction.',
            },
            {
              title: 'Recommandation rope-drop',
              body: 'la réponse honnête à « est-ce que ça vaut le coup d’arriver tôt ? » — creux attendus compris.',
            },
          ]}
        />
        <P>
          Comment tout cela se joue à l’intérieur d’un parc est détaillé pas à pas dans le{' '}
          <Link href="/howto">guide complet</Link>.
        </P>
      </Section>

      {/* Limits */}
      <Section id="limits" title="Là où Fancast reste silencieux (pour l’instant)" icon={ShieldAlert}>
        <P>
          Fancast est bon, mais pas mégalomane — et il te dit quand il préfère se taire. Pour les parcs
          disposant de <strong>moins d’une trentaine de jours d’exploitation</strong> de données, il n’y
          a tout simplement pas de note ; à la place, il indique honnêtement « Aucune prévision » plutôt
          qu’un chiffre deviné :
        </P>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <CrowdLevelBadge level="unknown" />
          <span className="text-muted-foreground text-sm leading-relaxed">
            Pas encore évaluable — trop peu de jours d’exploitation pour attribuer une couleur en toute
            conscience.
          </span>
        </div>
        <P>
          Et même là où Fancast a un avis, il l’accompagne d’une <strong>confiance</strong> — un honnête
          « plutôt sûr » ou « surtout une intuition ». Nouveaux parcs, événements spéciaux exotiques, un
          tout premier festival d’hiver : là, le modèle apprend encore. Il s’améliore à chaque saison —
          la seule promesse, c’est que nous n’enjoliverons rien.
        </P>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="Questions fréquentes sur Fancast" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
