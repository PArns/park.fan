/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Link } from '@/i18n/navigation';
import { PopularParksGridClient } from '@/components/home/featured-parks-section-client';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { cn } from '@/lib/utils';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import { NearbyParksCard } from '@/components/parks/nearby-parks-card';
import {
  Search,
  Star,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  XCircle,
  Wrench,
  User,
  Zap,
  Ticket,
  TrendingDown,
  Minus,
  PartyPopper,
  Backpack,
  Calendar,
  ChevronRight,
  Snowflake,
  Sun,
  Leaf,
  EyeOff,
} from 'lucide-react';
import { Section, SubSection, DemoBadge, InfoBox, TipBox, PersonaCard, Li } from '../_howto-ui';
import {
  MockParkHeader,
  MockAttractionCards,
  MockShowCards,
  MockNearbyCards,
  MockHourlyChart,
} from '../_mock-components';
import { LiveCalendarExample } from '../_live-calendar';

function IntroFR() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          Ça te parle ? 80 minutes de queue pour Taron — et à dix mètres de là, une autre attraction
          sans attente. Ou encore : tu réserves tes vacances et tu découvres que c&apos;est
          exactement la semaine des congés scolaires dans toute la région.
        </p>
        <p className="text-muted-foreground">
          park.fan est né de cette frustration. Ce qui a commencé comme un petit projet personnel –
          &quot;je vais juste suivre quelques temps d&apos;attente&quot; – est devenu une plateforme
          avec des données en direct de plus de 150 parcs, plus de 5 000 attractions et des millions
          de points de données traités chaque jour.
        </p>
        <p className="text-muted-foreground">
          L&apos;objectif est simple :{' '}
          <strong>éliminer les approximations lors de ta visite en parc d&apos;attractions.</strong>{' '}
          Utilise le calendrier d&apos;affluence pour choisir le bon jour, navigue avec des temps
          d&apos;attente en direct et compte sur les prédictions IA pour savoir quand chaque
          attraction sera la moins fréquentée. Cette page explique chaque fonctionnalité en détail.
        </p>
      </div>
      <nav aria-label="Table des matières" className="bg-muted/40 not-prose rounded-xl border p-5">
        <p className="mb-3 font-semibold">Table des matières</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Recherche'],
            ['#standort', '2. Localisation'],
            ['#favoriten', '3. Favoris'],
            ['#parkseite', '4. La page du parc'],
            ['#badges', '5. Badges et statuts'],
            ['#kalender', "6. Calendrier d'affluence"],
            ['#prognosen', '7. Prédictions IA'],
            ['#personas', '8. Pour qui ?'],
            ['#parks', '9. Parcs populaires'],
            ['#glossar', '10. Glossaire'],
            ['#faq', '11. FAQ'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="hover:text-primary transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

function ContentFRSections() {
  return (
    <>
      {/* ── 1. Recherche ─────────────────────────────────────────────────────── */}
      <Section id="suche" title="Recherche">
        <p className="text-muted-foreground mb-4">
          La recherche globale est le moyen le plus rapide de trouver un parc, une attraction, un
          spectacle ou un restaurant – sur ordinateur comme sur mobile.
        </p>

        <SubSection title="Ouvrir la recherche">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Ordinateur :</strong> Appuie sur{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              ou <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) pour ouvrir la recherche à tout moment.
            </p>
            <p>
              <strong>Mobile et Ordinateur :</strong> Tape sur l&apos;icône{' '}
              <Search className="inline h-4 w-4" /> dans l&apos;en-tête ou dans le champ de
              recherche de la page d&apos;accueil.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Ce que tu peux rechercher">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parcs', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attractions', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Villes et Pays', desc: 'Orlando, Paris, Allemagne...' },
              { icon: '🎭', label: 'Spectacles', desc: 'Horaires et programmes des shows' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Options de restauration dans les parcs' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <InfoBox label="Note">
          La recherche utilise une recherche plein texte intelligente qui fonctionne même avec des
          fautes de frappe. Cherche &quot;fantasia&quot; et tu trouveras &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>

      {/* ── 2. Localisation ──────────────────────────────────────────────────── */}
      <Section id="standort" title="Localisation et Parcs à Proximité">
        <p className="text-muted-foreground mb-4">
          Avec ta localisation activée, park.fan devient plus intelligent : vois les parcs et
          attractions à proximité triés par distance. park.fan ne stocke pas ta position.
        </p>
        <SubSection title="Navigation dans le parc">
          <p className="text-muted-foreground text-sm">
            Lorsque tu es dans un parc, park.fan détecte automatiquement dans quel parc tu te
            trouves et affiche &quot;Tu es dans [Nom du Parc]&quot; sur la page d&apos;accueil. La
            carte du parc affiche ta position en temps réel – parfait pour te déplacer entre les
            attractions.
          </p>
        </SubSection>
        <NearbyParksCard />
      </Section>

      {/* ── 3. Favoris ───────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favoris">
        <p className="text-muted-foreground mb-4">
          Sauvegarde des parcs, attractions, spectacles et restaurants en favoris pour y accéder
          rapidement depuis la page d&apos;accueil.
        </p>

        <SubSection title="Ajouter un favori">
          <p className="text-sm">
            Clique sur l&apos;étoile <Star className="inline h-4 w-4 text-yellow-500" /> de
            n&apos;importe quelle carte de parc ou d&apos;attraction. Les favoris sont sauvegardés
            localement dans ton navigateur – aucune inscription requise.
          </p>
        </SubSection>

        <SubSection title="Favoris sur la page d'accueil">
          <p className="text-muted-foreground text-sm">
            Dès que tu as au moins un favori, une section dédiée apparaît sur la page d&apos;accueil
            avec tous tes parcs, attractions, spectacles et restaurants sauvegardés. Avec la
            localisation activée, ils sont triés par distance – le plus proche en premier.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="Qu'est-ce qui est sauvegardé ?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parcs',
                desc: "Statut, horaires d'ouverture et niveau d'affluence en un coup d'œil",
              },
              {
                icon: '🎢',
                label: 'Attractions',
                desc: "Temps d'attente en direct et tendance directement dans la vue d'ensemble",
              },
              {
                icon: '🎭',
                label: 'Spectacles',
                desc: 'La prochaine représentation toujours visible',
              },
              { icon: '🍽️', label: 'Restaurants', desc: 'Statut de la cuisine et emplacement' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox label="Astuce">
          Sauvegarde 5 à 10 attractions favorites du parc que tu prévois de visiter. Le jour J, tu
          verras instantanément lesquelles ont de courtes files d&apos;attente – idéal pour décider
          à la volée.
        </TipBox>
      </Section>

      {/* ── 4. Page du Parc ──────────────────────────────────────────────────── */}
      <Section id="parkseite" title="La Page du Parc">
        <p className="text-muted-foreground mb-4">
          Chaque parc possède sa propre page avec des données en temps réel, les horaires
          d&apos;ouverture, un calendrier interactif et une carte.
        </p>
        <InfoBox label="Note">
          Tous les horaires sont affichés dans le <strong>fuseau horaire local du parc</strong> –
          indépendamment d&apos;où tu te trouves. Un parc en Floride affiche l&apos;heure de
          l&apos;Est, Europa-Park affiche l&apos;heure d&apos;Europe Centrale.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Onglets – Attractions, Spectacles, Calendrier, Carte">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attractions',
                desc: "Toutes les attractions avec temps d'attente en direct, statut, tendance et comparaison à la moyenne.",
              },
              {
                icon: '🎭',
                label: 'Spectacles',
                desc: 'Tous les spectacles avec statut actuel et prochains horaires.',
              },
              {
                icon: '📅',
                label: 'Calendrier',
                desc: "Prévision sur 30+ jours avec prédictions d'affluence, météo, jours fériés et vacances scolaires.",
              },
              {
                icon: '🗺️',
                label: 'Carte',
                desc: 'Carte interactive avec toutes les attractions, spectacles et restaurants.',
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">
                  {icon} {label}
                </p>
                <p className="text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <MockAttractionCards locale="en" />
        </SubSection>

        <SubSection title="Onglet Spectacles : Horaires en un coup d'œil">
          <p className="text-muted-foreground text-sm">
            L&apos;onglet Spectacles liste tous les shows avec leurs horaires pour aujourd&apos;hui.
            Les horaires passés sont barrés, le <strong>prochain horaire</strong> est mis en
            évidence en vert – pour que tu saches toujours quand et où être.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Attractions et spectacles saisonniers">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Certaines attractions saisonnières et shows ne fonctionnent qu&apos;à certaines
              saisons — comme les patinoires en hiver ou les attractions aquatiques en été. park.fan
              le détecte automatiquement et masque ces entrées en dehors de leur saison par défaut.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Hiver',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: "L'attraction est actuellement en saison (ex. événement hivernal). Le badge s'affiche sur la carte.",
                },
                {
                  icon: Sun,
                  label: 'Été',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Attraction estivale – ex. toboggan aquatique. Active de mai à septembre.',
                },
                {
                  icon: Leaf,
                  label: 'Saisonnier',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Hors saison : badge atténué. Attraction masquée dans les onglets et sur la carte par défaut.',
                },
              ].map(({ icon: Icon, label, color, opacity, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md',
                      color,
                      opacity
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 hors saison
              </button>
              <p className="text-muted-foreground text-sm">
                Quand des entrées hors saison sont masquées, ce bouton apparaît à côté du titre de
                la section. Clique dessus pour les afficher.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badges ────────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badges et Indicateurs d'État">
        <p className="text-muted-foreground mb-4">
          park.fan utilise un système de couleurs cohérent pour rendre l&apos;information
          immédiatement compréhensible.
        </p>

        <SubSection title="Statut des Parcs et Attractions">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color: 'badge-status-operating',
                label: 'En service',
                desc: "L'attraction / le parc est en fonctionnement. Les temps d'attente sont mis à jour en direct.",
              },
              {
                icon: AlertTriangle,
                color: 'badge-status-down',
                label: 'En panne',
                desc: 'Fermé temporairement – p. ex. problème technique ou arrêt de sécurité. Généralement bref.',
              },
              {
                icon: XCircle,
                color: 'badge-status-closed',
                label: 'Fermé',
                desc: "Pas d'opération aujourd'hui – fermeture saisonnière ou jour de repos prévu.",
              },
              {
                icon: Wrench,
                color: 'badge-status-refurbishment',
                label: 'Rénovation',
                desc: 'Maintenance prolongée. Fermé pendant des jours ou des semaines.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Niveaux d'Affluence">
          <p className="text-muted-foreground mb-3 text-sm">
            Le niveau d&apos;affluence indique à quel point un parc ou une attraction est fréquenté
            par rapport à la médiane historique des temps d&apos;attente (P50). 100% signifie
            exactement aussi fréquenté qu&apos;un jour moyen.
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'badge-crowd-very-low',
                label: 'Très Faible',
                icon: User,
                threshold: '≤ 60% de P50',
                desc: "Nettement plus calme que d'habitude. Presque pas de files – jour idéal pour visiter.",
              },
              {
                color: 'badge-crowd-low',
                label: 'Faible',
                icon: User,
                threshold: '61–89% de P50',
                desc: "En dessous de la moyenne – courtes files d'attente pour la plupart des attractions.",
              },
              {
                color: 'badge-crowd-moderate',
                label: 'Modéré',
                icon: Users,
                threshold: '90–110% de P50',
                desc: "Jour typique – temps d'attente dans la plage attendue (±10% de la médiane).",
              },
              {
                color: 'badge-crowd-high',
                label: 'Élevé',
                icon: Users,
                threshold: '111–150% de P50',
                desc: "Plus fréquenté que la moyenne – temps d'attente nettement plus longs.",
              },
              {
                color: 'badge-crowd-very-high',
                label: 'Très Élevé',
                icon: Users,
                threshold: '151–200% de P50',
                desc: "Très fréquenté – attentes presque deux fois plus longues que d'habitude. Arrive tôt.",
              },
              {
                color: 'badge-crowd-extreme',
                label: 'Extrême',
                icon: AlertTriangle,
                threshold: '> 200% de P50',
                desc: "Affluence record – plus du double d'un jour typique. Vacances scolaires, événements spéciaux.",
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[100px] flex-col gap-1 sm:min-w-[120px]">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
          <InfoBox label="Note">
            <strong>Comment le niveau d&apos;affluence est-il calculé ?</strong> park.fan compare le
            temps d&apos;attente moyen actuel à la médiane historique (P50). 100% signifie aussi
            fréquenté qu&apos;un jour moyen ; 60% est nettement plus calme, 200% signifie deux fois
            plus fréquenté que d&apos;habitude.
          </InfoBox>
        </SubSection>

        <SubSection title="Indicateurs de Tendance">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'En hausse',
                desc: "La file s'allonge. Rejoins-la bientôt.",
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stable',
                desc: "Le temps d'attente reste constant.",
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'En baisse',
                desc: 'La file raccourcit – bon moment pour la rejoindre.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-28 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Types de File">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'File Individuelle',
                termId: 'single-rider',
                desc: 'Souvent bien plus courte que la file normale – mais tu ne peux pas y aller avec ton groupe.',
              },
              {
                color: 'badge-status-down',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: "Pass express payant (p. ex. chez Disney). Affiche le prix actuel et l'heure de retour.",
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Heure de Retour',
                termId: 'virtual-queue',
                desc: 'File virtuelle gratuite – réserve un créneau et reviens plus tard.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: "Groupe d'Embarquement",
                termId: 'boarding-group',
                desc: 'File virtuelle avec numéro de groupe – populaire pour les nouvelles attractions très demandées.',
              },
            ].map(({ color, icon, label, termId, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} termId={termId} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Calendrier ────────────────────────────────────────────────────── */}
      <Section id="kalender" title="Le Calendrier d'Affluence">
        <p className="text-muted-foreground mb-4">
          Le calendrier est l&apos;outil de planification le plus puissant de park.fan. Il affiche
          une prévision basée sur l&apos;IA pour chacun des 30+ prochains jours – niveau
          d&apos;affluence, horaires d&apos;ouverture, météo et événements spéciaux, tout d&apos;un
          coup d&apos;œil.
        </p>

        <SubSection title="Que contient chaque carte du calendrier ?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Une carte typique du calendrier affiche :</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Date et jour de la semaine</strong>
              </li>
              <li>
                🎯 <strong>Badge d&apos;Affluence</strong> (p. ex. &quot;Très Élevé&quot;) – la
                prévision IA de l&apos;affluence globale
              </li>
              <li>
                🕐 <strong>Horaires d&apos;ouverture</strong> – ou &quot;Est.&quot; si pas encore
                confirmés officiellement
              </li>
              <li>
                🌤️ <strong>Prévision météo</strong> avec températures min./max.
              </li>
              <li>
                ⌚ <strong>Temps d&apos;attente moyen</strong> – attente moyenne prévue sur toutes
                les attractions
              </li>
              <li>
                🎟️ <strong>Prix du billet</strong>, quand publié par le parc
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>Que signifie &quot;Est.&quot; ?</strong> Les horaires marqués &quot;Est.&quot;
            (Estimé) n&apos;ont pas encore été confirmés officiellement par le parc. park.fan les
            dérive de schémas historiques – ils peuvent encore changer.
          </p>
        </SubSection>

        <SubSection title="Icônes des cartes du calendrier">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Jour Férié',
                desc: 'Les parcs ouvrent souvent plus longtemps, mais sont aussi plus fréquentés. Consulte la prévision !',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Vacances Scolaires',
                desc: "Généralement les jours les plus fréquentés de l'année – temps d'attente extrêmes possibles.",
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Pont',
                desc: 'Probablement plus fréquenté car beaucoup de gens prolongent les week-ends.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Parc Fermé',
                desc: "Pas d'opération ce jour-là – aucune prévision disponible.",
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Exemple pratique : trouver le meilleur jour de visite">
          <p className="text-muted-foreground mb-3 text-sm">
            Tu planifies une visite à Europa-Park en octobre. Voici comment utiliser le calendrier :
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Ouvre la page du parc et bascule sur l&apos;onglet <strong>Calendrier</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Tu repères immédiatement les semaines de vacances scolaires – beaucoup de cartes
                avec l&apos;icône <Backpack className="inline h-4 w-4 text-yellow-500" /> et des
                badges &quot;<strong>Très Élevé</strong>&quot; ou &quot;<strong>Extrême</strong>
                &quot;.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Cherche un mardi ou mercredi <em>sans</em> icône de jour férié – ils affichent
                souvent <strong>&quot;Faible&quot;</strong> ou <strong>&quot;Modéré&quot;</strong>.
                Les horaires d&apos;ouverture et la météo t&apos;aident à trancher.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Achète les billets à l&apos;avance – les jours verts du calendrier peuvent avoir des
                contingents limités.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="fr" />
          </div>
        </SubSection>

        <SubSection title="Calendrier des attractions">
          <p className="text-muted-foreground text-sm">
            La page de détail de chaque attraction possède également un calendrier historique
            montrant l&apos;affluence de chaque jour passé – et si l&apos;attraction était en
            service ou non. Parfait pour repérer les schémas récurrents : Taron avait-il constamment
            de courtes files le jeudi après-midi le mois dernier ? C&apos;est peut-être encore le
            cas la semaine prochaine.
          </p>
        </SubSection>

        <TipBox label="Astuce">
          Les meilleurs jours de visite sont généralement les jours de semaine en dehors des
          vacances scolaires – mardi, mercredi et jeudi affichent les niveaux d&apos;affluence les
          plus bas. Évite les semaines de vacances scolaires dans les régions très peuplées.
        </TipBox>
      </Section>

      {/* ── 7. Prédictions IA ────────────────────────────────────────────────── */}
      <Section id="prognosen" title="Prédictions par IA">
        <p className="text-muted-foreground mb-4">
          park.fan utilise l&apos;apprentissage automatique pour prédire les niveaux
          d&apos;affluence et les temps d&apos;attente plusieurs jours à l&apos;avance. Le modèle
          est continuellement entraîné sur de nouvelles données et tient compte de quatre facteurs
          clés :
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Données historiques',
              desc: 'Des millions de points de données par attraction, jour de la semaine et heure de la journée.',
            },
            {
              icon: '📅',
              title: 'Calendriers de vacances',
              desc: 'Vacances scolaires et jours fériés en Europe et dans le monde.',
            },
            {
              icon: '🌤️',
              title: 'Prévisions météo',
              desc: 'Température, pluie et soleil – le mauvais temps pousse les foules vers les attractions en intérieur.',
            },
            {
              icon: '🎉',
              title: 'Événements spéciaux',
              desc: "Nuits d'Halloween, événements de Noël et autres dates propres aux parcs génèrent une fréquentation nettement plus élevée.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Où trouver les prédictions">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 Dans le calendrier d&apos;affluence</p>
              <p className="text-muted-foreground mt-0.5">
                Chaque carte du calendrier contient une prévision journalière : niveau
                d&apos;affluence, temps d&apos;attente moyen et horaires d&apos;ouverture –
                jusqu&apos;à 30+ jours à l&apos;avance.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Badge heure de pointe sur la page du parc</p>
              <p className="text-muted-foreground mt-0.5">
                L&apos;en-tête du parc indique quand le pic d&apos;affluence est prévu
                aujourd&apos;hui – p. ex. &quot;Pic dans 1h 30min&quot;. Planifie une pause déjeuner
                ou visite une attraction moins populaire pendant cette fenêtre.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">
                📈 Graphique de prédiction horaire sur la page de l&apos;attraction
              </p>
              <p className="text-muted-foreground mt-0.5">
                Chaque attraction a sa propre page avec un graphique montrant comment les temps
                d&apos;attente sont prévus d&apos;évoluer au cours de la journée – pour
                aujourd&apos;hui et demain.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Exemple pratique : utiliser les prédictions le jour de la visite">
          <p className="text-muted-foreground mb-3 text-sm">
            Tu visites Phantasialand un samedi pendant les vacances scolaires. Le calendrier affiche
            &quot;Très Élevé&quot;. Voici comment les prédictions t&apos;aident :
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>À l&apos;entrée :</strong> Le badge heure de pointe affiche &quot;Pic dans
                ~2h&quot; – tu as jusqu&apos;à environ 11h30 pour tes premiers highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Ouvre la page Taron :</strong> Le graphique de prédiction montre 9h30 ≈ 15
                min, 12h ≈ 65 min, 15h ≈ 40 min → monte juste à l&apos;ouverture ou en milieu
                d&apos;après-midi.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Déjeuner pendant le pic :</strong> Plutôt que de faire la queue à midi, tu
                en profites pour manger. Les tendances en direct confirment qu&apos;à 15h
                l&apos;attente baisse – moment parfait pour y aller.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="Quelle est la précision des prédictions ?">
          <p className="text-muted-foreground text-sm">
            La précision varie selon le parc et la fenêtre de prévision. La page de détail de chaque
            attraction affiche sa qualité de prédiction – de <strong>Faible</strong> à{' '}
            <strong>Excellente</strong>. Plus de données historiques signifie des prévisions plus
            précises. Les prédictions à court terme (1–3 jours) sont intrinsèquement plus fiables
            que celles à long terme (7–14 jours).
          </p>
        </SubSection>

        <SubSection title="Graphiques sparkline des temps d'attente">
          <p className="text-muted-foreground text-sm">
            Chaque carte d&apos;attraction affiche un petit graphique sparkline avec la tendance des
            temps d&apos;attente sur les dernières heures. Tu peux voir instantanément si les files
            augmentent, se stabilisent ou diminuent.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Astuce">
          Combine calendrier et prédictions : choisis un jour vert dans le calendrier, puis consulte
          la prévision horaire sur la page de l&apos;attraction pour trouver le créneau le plus
          calme. Tu arriveras toujours à la file la plus courte.
        </TipBox>
      </Section>

      {/* ── 8. Pour qui ──────────────────────────────────────────────────────── */}
      <Section id="personas" title="Pour qui est park.fan ?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Familles"
            subtitle="Planifier une journée parfaite pour tout le monde"
          >
            <Li>Calendrier d&apos;affluence : quel jour a les files les plus courtes ?</Li>
            <Li>
              Météo dans le calendrier : journée pluvieuse ? Consulte les attractions intérieures !
            </Li>
            <Li>Favoris : sauvegarde les 10 attractions incontournables pour les enfants.</Li>
            <Li>
              Temps d&apos;attente en direct : décide à la volée quelle attraction faire ensuite.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Passionnés de Parcs"
            subtitle="Chaque minute doit être optimisée"
          >
            <Li>
              Niveau d&apos;affluence (base P50) : comprends si une attraction est vraiment
              au-dessus de la moyenne.
            </Li>
            <Li>Tendances historiques : quand Taron a-t-il habituellement de courtes files ?</Li>
            <Li>
              Indicateurs de tendance : file en hausse ? Attends 20 minutes, elle pourrait
              raccourcir.
            </Li>
            <Li>
              File Individuelle / Lightning Lane : tous les types de file avec horaires et prix.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Primo-Visiteurs"
            subtitle="Première visite dans un grand parc à thème"
          >
            <Li>Recherche : trouve ton parc rapidement, même si tu ne connais pas le nom exact.</Li>
            <Li>Carte du parc : repère-toi avant et pendant ta visite.</Li>
            <Li>
              Badges de statut : vert = en marche, orange = bref incident, gris = fermé
              aujourd&apos;hui.
            </Li>
            <Li>
              Calendrier d&apos;affluence : les couleurs disent tout – vert c&apos;est bien, rouge
              c&apos;est stressant.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Visiteurs Spontanés"
            subtitle="Décision de dernière minute, efficacité maximale"
          >
            <Li>Localisation : park.fan trouve automatiquement ton parc le plus proche.</Li>
            <Li>
              Temps d&apos;attente en direct : vois instantanément ce qui est ouvert et combien de
              temps il faut attendre.
            </Li>
            <Li>Indicateurs de tendance : file en baisse ? Moment idéal pour la rejoindre.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Parcs populaires ─────────────────────────────────────────────── */}
      <Section id="parks" title="Parcs populaires">
        <p className="text-muted-foreground mb-6">
          park.fan couvre plus de 150 parcs d&apos;attractions dans le monde. Voici les plus visités
          de votre région avec des données en direct :
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glossaire ────────────────────────────────────────────────── */}
      <Section id="glossar" title="Le Glossaire et la Mise en Évidence des Termes">
        <p className="text-muted-foreground mb-4">
          park.fan maintient un{' '}
          <Link href="/glossaire" className="text-primary underline">
            glossaire complet des termes des parcs à thème
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {`des temps d'attente et niveaux d'affluence aux éléments de montagnes russes et files d'attente virtuelles. Chaque entrée inclut une définition courte et une explication détaillée.`}
          </GlossaryInject>
        </p>

        <SubSection title="Mise en évidence automatique des termes sur les pages d'attractions">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {`Sur les pages d'attractions, les termes du glossaire sont automatiquement détectés dans le texte et soulignés en pointillés. En passant la souris, une définition courte apparaît ; un clic mène directement à l'entrée complète du glossaire.`}
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Texte d'exemple (passez la souris sur les termes soulignés)
            </p>
            <p>
              <GlossaryInject>
                {`La meilleure façon de planifier votre visite est de consulter le calendrier d'affluence avant de réserver. Un jour de pointe, les temps d'attente pour les attractions populaires peuvent dépasser 90 minutes. Une file d'attente virtuelle vous permet de réserver votre créneau sans faire la queue, tandis qu'un pass express vous donne accès à une file prioritaire. Vérifiez le niveau d'affluence avant d'acheter.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Conseil">
          Le glossaire complet est disponible sur{' '}
          <Link href="/glossaire" className="text-primary font-medium underline">
            park.fan/glossaire
          </Link>{' '}
          avec des termes organisés en 7 catégories.
        </TipBox>
      </Section>

      {/* ── 11. FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Questions Fréquentes">
        <div className="space-y-4">
          {[
            {
              q: "À quelle fréquence les temps d'attente sont-ils mis à jour ?",
              a: "Les temps d'attente sont mis à jour chaque minute. Pour certains parcs, les mises à jour ont lieu toutes les 2 à 5 minutes selon la disponibilité des données.",
            },
            {
              q: "D'où proviennent les données ?",
              a: 'park.fan obtient des données en direct de ThemeParks.wiki, Queue-Times.com et Wartezeiten.app.',
            },
            {
              q: 'park.fan est-il gratuit ?',
              a: 'Oui, park.fan est entièrement gratuit et ne nécessite aucune inscription.',
            },
            {
              q: 'Les favoris sont-ils synchronisés entre les appareils ?',
              a: "Non, les favoris sont stockés localement dans ton navigateur (localStorage). Ils ne sont disponibles que sur l'appareil où tu les as sauvegardés.",
            },
            {
              q: "Jusqu'à quand le calendrier d'affluence fait-il des prévisions ?",
              a: 'Le calendrier affiche des prévisions pour plus de 30 jours. Les prévisions pour des dates plus éloignées sont naturellement un peu moins précises que celles à court terme.',
            },
            {
              q: 'Combien de parcs sont couverts ?',
              a: 'park.fan couvre actuellement plus de 150 parcs avec plus de 5 000 attractions dans le monde entier – de Walt Disney World et Universal à Europa-Park, Phantasialand et des parcs en Asie et en Australie.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  {q}
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

export function ContentFR() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroFR />
      <ContentFRSections />
    </div>
  );
}
