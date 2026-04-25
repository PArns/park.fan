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

function IntroES() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          ¿Te resulta familiar? 80 minutos de cola para Taron y, a diez metros de distancia, otra
          atracción sin espera. O reservas tus vacaciones y descubres que esa semana hay vacaciones
          escolares en toda la región.
        </p>
        <p className="text-muted-foreground">
          park.fan nació de esa misma frustración. Lo que empezó como un pequeño proyecto personal –
          &quot;solo voy a rastrear algunos tiempos de espera&quot; – se ha convertido en una
          plataforma con datos en directo de más de 150 parques, más de 5.000 atracciones y millones
          de registros de colas procesados cada día.
        </p>
        <p className="text-muted-foreground">
          El objetivo es simple:{' '}
          <strong>elimina las conjeturas de tu visita al parque temático.</strong> Usa el calendario
          de afluencia para elegir el mejor día, navega con tiempos de espera en directo y aprovecha
          las predicciones de IA para saber cuándo cada atracción tendrá menos cola. Esta página
          explica cada función en detalle.
        </p>
      </div>
      <nav
        aria-label="Índice de contenidos"
        className="bg-muted/40 not-prose rounded-xl border p-5"
      >
        <p className="mb-3 font-semibold">Índice de contenidos</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Búsqueda'],
            ['#standort', '2. Ubicación'],
            ['#favoriten', '3. Favoritos'],
            ['#parkseite', '4. La página del parque'],
            ['#badges', '5. Insignias y estados'],
            ['#kalender', '6. Calendario de afluencia'],
            ['#prognosen', '7. Predicciones IA'],
            ['#personas', '8. ¿Para quién?'],
            ['#parks', '9. Parques populares'],
            ['#glossar', '10. Glosario'],
            ['#faq', '11. Preguntas frecuentes'],
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

function ContentESSections() {
  return (
    <>
      {/* ── 1. Búsqueda ───────────────────────────────────────────────────────── */}
      <Section id="suche" title="Búsqueda">
        <p className="text-muted-foreground mb-4">
          La búsqueda global es la forma más rápida de encontrar un parque, atracción, espectáculo o
          restaurante – ya sea en escritorio o móvil.
        </p>

        <SubSection title="Abrir la búsqueda">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Escritorio:</strong> Pulsa{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              o <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) para abrir la búsqueda en cualquier momento.
            </p>
            <p>
              <strong>Móvil y Escritorio:</strong> Toca el icono{' '}
              <Search className="inline h-4 w-4" /> en el encabezado o el campo de búsqueda en la
              página de inicio.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Qué puedes buscar">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parques', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Atracciones', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Ciudades y Países', desc: 'Orlando, París, Alemania...' },
              { icon: '🎭', label: 'Espectáculos', desc: 'Horarios y programas de shows' },
              {
                icon: '🍽️',
                label: 'Restaurantes',
                desc: 'Opciones gastronómicas dentro del parque',
              },
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

        <InfoBox label="Nota">
          La búsqueda utiliza texto completo inteligente que funciona incluso con erratas. Busca
          &quot;fantasia&quot; y encontrarás &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>

      {/* ── 2. Ubicación ─────────────────────────────────────────────────────── */}
      <Section id="standort" title="Ubicación y Parques Cercanos">
        <p className="text-muted-foreground mb-4">
          Con tu ubicación activada, park.fan se vuelve más inteligente: ve los parques y
          atracciones cercanas ordenados por distancia. park.fan no almacena tu ubicación.
        </p>
        <SubSection title="Navegación en el parque">
          <p className="text-muted-foreground text-sm">
            Cuando estás en un parque, park.fan detecta automáticamente en qué parque te encuentras
            y muestra &quot;Estás en [Nombre del Parque]&quot; en la página de inicio. El mapa del
            parque muestra tu ubicación en tiempo real – perfecto para moverte entre atracciones.
          </p>
        </SubSection>
        <NearbyParksCard />
      </Section>

      {/* ── 3. Favoritos ────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favoritos">
        <p className="text-muted-foreground mb-4">
          Guarda parques, atracciones, espectáculos y restaurantes como favoritos para acceder
          rápidamente desde la página de inicio.
        </p>

        <SubSection title="Añadir un favorito">
          <p className="text-sm">
            Haz clic en la estrella <Star className="inline h-4 w-4 text-yellow-500" /> de cualquier
            tarjeta de parque o atracción. Los favoritos se guardan localmente en tu navegador – sin
            necesidad de registro.
          </p>
        </SubSection>

        <SubSection title="Favoritos en la página de inicio">
          <p className="text-muted-foreground text-sm">
            Con al menos un favorito guardado, aparece una sección dedicada en la página de inicio
            con todos tus parques, atracciones, espectáculos y restaurantes guardados. Con la
            ubicación activada, se ordenan por distancia – el más cercano primero.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="¿Qué se guarda?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parques',
                desc: 'Estado, horarios y nivel de afluencia de un vistazo',
              },
              {
                icon: '🎢',
                label: 'Atracciones',
                desc: 'Tiempo de espera en vivo y tendencia directamente en el resumen',
              },
              { icon: '🎭', label: 'Espectáculos', desc: 'El próximo horario siempre visible' },
              { icon: '🍽️', label: 'Restaurantes', desc: 'Estado de cocina y ubicación' },
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

        <TipBox label="Consejo">
          Guarda entre 5 y 10 atracciones favoritas del parque que vayas a visitar. El día de tu
          visita verás al instante cuáles tienen tiempos de espera cortos – ideal para decidir sobre
          la marcha.
        </TipBox>
      </Section>

      {/* ── 4. Página del Parque ─────────────────────────────────────────────── */}
      <Section id="parkseite" title="La Página del Parque">
        <p className="text-muted-foreground mb-4">
          Cada parque tiene su propia página con datos en tiempo real, horarios de apertura, un
          calendario interactivo y un mapa.
        </p>
        <InfoBox label="Nota">
          Todos los horarios se muestran en la <strong>zona horaria local del parque</strong> –
          independientemente de dónde te encuentres. Un parque en Florida muestra hora del Este,
          Europa-Park muestra hora de Europa Central.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Pestañas – Atracciones, Shows, Calendario, Mapa">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Atracciones',
                desc: 'Todas las atracciones con tiempo de espera en vivo, estado, tendencia y comparación con la media.',
              },
              {
                icon: '🎭',
                label: 'Shows',
                desc: 'Todos los espectáculos con estado actual y próximos horarios.',
              },
              {
                icon: '📅',
                label: 'Calendario',
                desc: 'Previsión de más de 30 días con predicciones de afluencia, tiempo, festivos y vacaciones escolares.',
              },
              {
                icon: '🗺️',
                label: 'Mapa',
                desc: 'Mapa interactivo con todas las atracciones, shows y restaurantes.',
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

        <SubSection title="Pestaña Shows: Horarios de un vistazo">
          <p className="text-muted-foreground text-sm">
            La pestaña Shows lista todos los espectáculos con sus horarios para hoy. Los horarios
            pasados aparecen tachados, el <strong>próximo pase</strong> se resalta en verde – para
            que siempre sepas cuándo y dónde estar.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Atracciones y Shows de Temporada">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Algunas atracciones de temporada y shows solo funcionan en ciertas épocas del año –
              como pistas de hielo en invierno o atracciones acuáticas en verano. park.fan lo
              detecta automáticamente y oculta esas entradas fuera de temporada por defecto.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Invierno',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: 'La atracción está en temporada (p. ej. evento de invierno). El badge aparece en la tarjeta.',
                },
                {
                  icon: Sun,
                  label: 'Verano',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Atracción de verano – p. ej. atracciones acuáticas. Activa de mayo a septiembre.',
                },
                {
                  icon: Leaf,
                  label: 'Temporada',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Fuera de temporada: badge atenuado. Atracción oculta en pestañas y mapa por defecto.',
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
                <EyeOff className="h-3 w-3" />3 fuera de temporada
              </button>
              <p className="text-muted-foreground text-sm">
                Cuando hay entradas fuera de temporada ocultas, este botón aparece junto al título
                de la sección. Haz clic para mostrarlas.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Insignias ─────────────────────────────────────────────────────── */}
      <Section id="badges" title="Insignias e Indicadores de Estado">
        <p className="text-muted-foreground mb-4">
          park.fan utiliza un sistema de colores consistente para que la información sea
          comprensible de un vistazo.
        </p>

        <SubSection title="Estado de Parques y Atracciones">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color: 'badge-status-operating',
                label: 'Operativo',
                desc: 'La atracción / el parque está en funcionamiento. Los tiempos de espera se actualizan en vivo.',
              },
              {
                icon: AlertTriangle,
                color: 'badge-status-down',
                label: 'Avería',
                desc: 'Cerrado temporalmente – p. ej. problema técnico o parada de seguridad. Normalmente breve.',
              },
              {
                icon: XCircle,
                color: 'badge-status-closed',
                label: 'Cerrado',
                desc: 'Sin operación hoy – cierre de temporada o día de descanso programado.',
              },
              {
                icon: Wrench,
                color: 'badge-status-refurbishment',
                label: 'Renovación',
                desc: 'Mantenimiento prolongado. Cerrado durante días o semanas.',
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

        <SubSection title="Niveles de Afluencia">
          <p className="text-muted-foreground mb-3 text-sm">
            El nivel de afluencia muestra lo concurrido que está un parque o atracción en relación
            con la mediana histórica de tiempo de espera (P50). El 100% significa exactamente tan
            concurrido como un día promedio.
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'badge-crowd-very-low',
                label: 'Muy Baja',
                icon: User,
                threshold: '≤ 60% de P50',
                desc: 'Notablemente más tranquilo de lo habitual. Casi sin colas – día ideal para visitar.',
              },
              {
                color: 'badge-crowd-low',
                label: 'Baja',
                icon: User,
                threshold: '61–89% de P50',
                desc: 'Por debajo de la media – tiempos de espera cortos en la mayoría de atracciones.',
              },
              {
                color: 'badge-crowd-moderate',
                label: 'Moderada',
                icon: Users,
                threshold: '90–110% de P50',
                desc: 'Día típico – tiempos de espera dentro del rango esperado (±10% de la mediana).',
              },
              {
                color: 'badge-crowd-high',
                label: 'Alta',
                icon: Users,
                threshold: '111–150% de P50',
                desc: 'Más concurrido que la media – tiempos de espera notablemente más largos.',
              },
              {
                color: 'badge-crowd-very-high',
                label: 'Muy Alta',
                icon: Users,
                threshold: '151–200% de P50',
                desc: 'Muy concurrido – esperas casi el doble de lo habitual. Llega temprano.',
              },
              {
                color: 'badge-crowd-extreme',
                label: 'Extrema',
                icon: AlertTriangle,
                threshold: '> 200% de P50',
                desc: 'Afluencia récord – más del doble de lo habitual. Vacaciones escolares, eventos especiales.',
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
          <InfoBox label="Nota">
            <strong>¿Cómo se calcula el nivel de afluencia?</strong> park.fan compara el tiempo de
            espera promedio actual con la mediana histórica (P50). El 100% significa igual de
            concurrido que un día promedio; el 60% es notablemente más tranquilo, el 200% significa
            el doble de afluencia que lo habitual.
          </InfoBox>
        </SubSection>

        <SubSection title="Indicadores de Tendencia">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Subiendo',
                desc: 'La cola se alarga. Únete pronto.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Estable',
                desc: 'El tiempo de espera se mantiene constante.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'Bajando',
                desc: 'La cola se acorta – buen momento para unirse.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-24 items-center gap-1 text-sm font-semibold ${color}`}>
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

        <SubSection title="Tipos de Cola">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Fila Individual',
                termId: 'single-rider',
                desc: 'A menudo mucho más corta que la fila normal – pero no puedes ir con tu grupo.',
              },
              {
                color: 'badge-status-down',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: 'Pase exprés de pago (p. ej. en Disney). Muestra el precio actual y la hora de regreso.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Hora de Regreso',
                termId: 'virtual-queue',
                desc: 'Cola virtual gratuita – reserva un horario y regresa más tarde.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Grupo de Embarque',
                termId: 'boarding-group',
                desc: 'Cola virtual con número de grupo – popular para nuevas atracciones muy demandadas.',
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

      {/* ── 6. Calendario ────────────────────────────────────────────────────── */}
      <Section id="kalender" title="El Calendario de Afluencia">
        <p className="text-muted-foreground mb-4">
          El calendario es la herramienta de planificación más potente de park.fan. Muestra una
          previsión basada en IA para cada uno de los próximos 30+ días – nivel de afluencia,
          horarios de apertura, tiempo y eventos especiales, todo de un vistazo.
        </p>

        <SubSection title="¿Qué muestra cada tarjeta del calendario?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Una tarjeta típica del calendario muestra:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Fecha y día de la semana</strong>
              </li>
              <li>
                🎯 <strong>Insignia de Afluencia</strong> (p. ej. &quot;Muy Alta&quot;) – la
                previsión de IA para la concurrencia general
              </li>
              <li>
                🕐 <strong>Horario de apertura</strong> – o &quot;Est.&quot; si aún no está
                confirmado oficialmente
              </li>
              <li>
                🌤️ <strong>Previsión meteorológica</strong> con temperaturas mín./máx.
              </li>
              <li>
                ⌚ <strong>Tiempo de espera medio</strong> – espera media prevista en todas las
                atracciones
              </li>
              <li>
                🎟️ <strong>Precio de la entrada</strong>, cuando lo publica el parque
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>¿Qué significa &quot;Est.&quot;?</strong> Los horarios marcados como
            &quot;Est.&quot; (Estimado) aún no han sido confirmados oficialmente por el parque.
            park.fan los deriva de patrones históricos – pueden cambiar.
          </p>
        </SubSection>

        <SubSection title="Iconos de la tarjeta del calendario">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Festivo',
                desc: 'Los parques suelen abrir más, pero también están más concurridos. ¡Consulta la previsión!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Vacaciones escolares',
                desc: 'Normalmente los días más concurridos del año – posibles tiempos de espera extremos.',
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Puente',
                desc: 'Probablemente más concurrido, ya que mucha gente aprovecha el fin de semana largo.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Parque Cerrado',
                desc: 'Sin operación ese día – sin previsión disponible.',
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

        <SubSection title="Ejemplo práctico: encontrar el mejor día de visita">
          <p className="text-muted-foreground mb-3 text-sm">
            Estás planeando visitar Europa-Park en octubre. Así se usa el calendario:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Abre la página del parque y cambia a la pestaña <strong>Calendario</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Verás de inmediato las semanas de vacaciones escolares – muchas tarjetas con el
                icono <Backpack className="inline h-4 w-4 text-yellow-500" /> e insignias de{' '}
                <strong>&quot;Muy Alta&quot;</strong> o <strong>&quot;Extrema&quot;</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Busca un martes o miércoles <em>sin</em> icono de festivo – estos suelen mostrar
                <strong> &quot;Baja&quot;</strong> o <strong>&quot;Moderada&quot;</strong>. Los
                horarios de apertura y la previsión del tiempo te ayudan a decidir.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Compra las entradas con antelación – en los días verdes del pronóstico, los cupos
                pueden ser limitados.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="es" />
          </div>
        </SubSection>

        <SubSection title="Calendario de atracciones">
          <p className="text-muted-foreground text-sm">
            La página de detalle de cada atracción también tiene un calendario histórico que muestra
            lo concurrida que estuvo cada día pasado – y si estaba en funcionamiento o no. Perfecto
            para detectar patrones recurrentes: ¿tuvo Taron sistemáticamente colas cortas los jueves
            por la tarde el mes pasado? Puede que también la próxima semana.
          </p>
        </SubSection>

        <TipBox label="Consejo">
          Los mejores días de visita son normalmente los días de semana fuera de las vacaciones
          escolares – martes, miércoles y jueves muestran los niveles de afluencia más bajos. Evita
          las semanas de vacaciones escolares en regiones densamente pobladas.
        </TipBox>
      </Section>

      {/* ── 7. Predicciones IA ───────────────────────────────────────────────── */}
      <Section id="prognosen" title="Predicciones con IA">
        <p className="text-muted-foreground mb-4">
          park.fan utiliza aprendizaje automático para predecir los niveles de afluencia y los
          tiempos de espera con días de antelación. El modelo se entrena continuamente con nuevos
          datos y tiene en cuenta cuatro factores clave:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Datos históricos',
              desc: 'Millones de datos de colas por atracción, día de la semana y hora del día.',
            },
            {
              icon: '📅',
              title: 'Calendarios de festivos',
              desc: 'Vacaciones escolares y días festivos en Europa y todo el mundo.',
            },
            {
              icon: '🌤️',
              title: 'Previsiones del tiempo',
              desc: 'Temperatura, lluvia y sol – el mal tiempo empuja a las multitudes hacia las atracciones interiores.',
            },
            {
              icon: '🎉',
              title: 'Eventos especiales',
              desc: 'Noches de Halloween, eventos navideños y otras fechas específicas del parque generan una asistencia significativamente mayor.',
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

        <SubSection title="Dónde encontrar las predicciones">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 En el calendario de afluencia</p>
              <p className="text-muted-foreground mt-0.5">
                Cada tarjeta del calendario contiene una previsión diaria: nivel de afluencia,
                tiempo de espera medio y horario de apertura – hasta 30+ días de antelación.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Insignia de hora punta en la página del parque</p>
              <p className="text-muted-foreground mt-0.5">
                La cabecera del parque muestra cuándo se espera el pico de afluencia de hoy – p. ej.
                &quot;Pico en 1h 30min&quot;. Planifica una pausa para comer o visita una atracción
                menos popular justo en ese intervalo.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">
                📈 Gráfico de predicción por horas en la página de la atracción
              </p>
              <p className="text-muted-foreground mt-0.5">
                Cada atracción tiene su propia página con un gráfico que muestra cómo se prevé que
                evolucionen los tiempos de espera a lo largo del día – para hoy y mañana.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Ejemplo práctico: usar las predicciones el día de la visita">
          <p className="text-muted-foreground mb-3 text-sm">
            Visitas Phantasialand un sábado durante las vacaciones escolares. El calendario muestra
            &quot;Muy Alta&quot;. Así te ayudan las predicciones:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>En la entrada:</strong> La insignia de hora punta muestra &quot;Pico en
                ~2h&quot; – tienes hasta las 11:30 aprox. para tus primeros highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Abre la página de Taron:</strong> El gráfico de predicción muestra 9:30 ≈ 15
                min, 12:00 ≈ 65 min, 15:00 ≈ 40 min → monta justo al abrir o a media tarde.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Come durante el pico:</strong> En lugar de hacer cola al mediodía,
                aprovechas para comer. Las tendencias en vivo confirman que a las 15:00 la espera
                baja – momento perfecto para montar.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="¿Qué precisión tienen las predicciones?">
          <p className="text-muted-foreground text-sm">
            La precisión varía según el parque y el horizonte de predicción. La página de detalle de
            cada atracción muestra su calidad de predicción – de <strong>Baja</strong> a{' '}
            <strong>Excelente</strong>. Más datos históricos significa previsiones más precisas. Las
            predicciones a corto plazo (1–3 días) son intrínsecamente más fiables que las de largo
            plazo (7–14 días).
          </p>
        </SubSection>

        <SubSection title="Minigráficos de tiempo de espera">
          <p className="text-muted-foreground text-sm">
            Cada tarjeta de atracción muestra un pequeño minigráfico con la tendencia del tiempo de
            espera en las últimas horas. Puedes ver al instante si las colas están aumentando,
            estables o disminuyendo.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Consejo">
          Combina calendario y predicciones: elige un día verde del calendario, luego consulta la
          previsión horaria en la página de la atracción para encontrar el momento más tranquilo.
          Siempre llegarás a la cola más corta.
        </TipBox>
      </Section>

      {/* ── 8. Para quién ────────────────────────────────────────────────────── */}
      <Section id="personas" title="¿Para quién es park.fan?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Familias"
            subtitle="Planificando el día perfecto para todos"
          >
            <Li>Calendario de afluencia: ¿qué día tiene las colas más cortas?</Li>
            <Li>Tiempo en el calendario: ¿día lluvioso? ¡Consulta las atracciones de interior!</Li>
            <Li>Favoritos: guarda las 10 atracciones imprescindibles para los niños.</Li>
            <Li>
              Tiempos de espera en vivo: decide sobre la marcha qué atracción visitar a
              continuación.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Entusiastas de Parques Temáticos"
            subtitle="Cada minuto debe estar optimizado"
          >
            <Li>
              Nivel de afluencia (base P50): entiende si una atracción está realmente por encima de
              la media.
            </Li>
            <Li>Tendencias históricas: ¿cuándo suele tener Taron tiempos de espera cortos?</Li>
            <Li>Indicadores de tendencia: ¿sube la cola? Espera 20 minutos y puede acortarse.</Li>
            <Li>
              Fila Individual / Lightning Lane: todos los tipos de cola con tiempos y precios.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Visitantes por Primera Vez"
            subtitle="Primera visita a un gran parque temático"
          >
            <Li>
              Búsqueda: encuentra tu parque rápidamente, incluso si no conoces el nombre exacto.
            </Li>
            <Li>Mapa del parque: oriéntate antes y durante tu visita.</Li>
            <Li>
              Insignias de estado: verde = en marcha, naranja = incidencia breve, gris = cerrado
              hoy.
            </Li>
            <Li>
              Calendario de afluencia: los colores lo dicen todo – verde es bueno, rojo es
              estresante.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Visitantes Espontáneos"
            subtitle="Decisión de última hora, máxima eficiencia"
          >
            <Li>Ubicación: park.fan encuentra automáticamente el parque más cercano.</Li>
            <Li>
              Tiempos de espera en vivo: ve al instante qué está abierto y cuánto hay que esperar.
            </Li>
            <Li>Indicadores de tendencia: ¿baja la cola? El momento perfecto para unirse.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Parques populares ────────────────────────────────────────────── */}
      <Section id="parks" title="Parques populares">
        <p className="text-muted-foreground mb-6">
          park.fan cubre más de 150 parques temáticos en todo el mundo. Aquí están los más visitados
          de tu región con datos en directo:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glosario ─────────────────────────────────────────────────── */}
      <Section id="glossar" title="El Glosario y Resaltado de Términos">
        <p className="text-muted-foreground mb-4">
          park.fan mantiene un{' '}
          <Link href="/glosario" className="text-primary underline">
            glosario completo de términos de parques temáticos
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {`desde tiempos de espera y niveles de afluencia hasta elementos de montaña rusa y colas virtuales. Cada entrada incluye una definición corta y una explicación detallada.`}
          </GlossaryInject>
        </p>

        <SubSection title="Resaltado automático de términos en páginas de atracciones">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {`En las páginas de atracciones, los términos del glosario se detectan automáticamente en el texto y se subrayan con una línea discontinua. Al pasar el cursor aparece una definición breve; al hacer clic accedes directamente a la entrada completa del glosario.`}
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Texto de ejemplo (pasa el cursor sobre los términos subrayados)
            </p>
            <p>
              <GlossaryInject>
                {`La mejor forma de planificar tu visita es revisar el calendario de afluencia antes de reservar. En un día pico, los tiempos de espera para las atracciones más populares pueden superar los 90 minutos. Una cola virtual te permite reservar tu turno sin hacer cola, mientras que el carril de single rider puede reducir la espera a la mitad. Si el nivel de afluencia es alto, un pase express suele merecer la pena.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Consejo">
          El glosario completo está disponible en{' '}
          <Link href="/glosario" className="text-primary font-medium underline">
            park.fan/glosario
          </Link>{' '}
          con términos organizados en 7 categorías.
        </TipBox>
      </Section>

      {/* ── 11. Preguntas Frecuentes ─────────────────────────────────────────── */}
      <Section id="faq" title="Preguntas Frecuentes">
        <div className="space-y-4">
          {[
            {
              q: '¿Con qué frecuencia se actualizan los tiempos de espera?',
              a: 'Los tiempos de espera se actualizan cada minuto. En algunos parques, las actualizaciones se producen cada 2–5 minutos según la disponibilidad de datos.',
            },
            {
              q: '¿De dónde provienen los datos?',
              a: 'park.fan obtiene datos en vivo de ThemeParks.wiki, Queue-Times.com y Wartezeiten.app.',
            },
            {
              q: '¿Es gratuito park.fan?',
              a: 'Sí, park.fan es completamente gratuito y no requiere registro.',
            },
            {
              q: '¿Los favoritos se sincronizan entre dispositivos?',
              a: 'No, los favoritos se guardan localmente en tu navegador (localStorage). Solo están disponibles en el dispositivo donde los guardaste.',
            },
            {
              q: '¿Con cuánta antelación hace previsiones el calendario de afluencia?',
              a: 'El calendario muestra previsiones para más de 30 días. Las previsiones para fechas más lejanas son naturalmente un poco menos precisas que las de corto plazo.',
            },
            {
              q: '¿Cuántos parques están incluidos?',
              a: 'park.fan cubre actualmente más de 150 parques con más de 5.000 atracciones en todo el mundo – desde Walt Disney World y Universal hasta Europa-Park, Phantasialand y parques en Asia y Australia.',
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

export function ContentES() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroES />
      <ContentESSections />
    </div>
  );
}
