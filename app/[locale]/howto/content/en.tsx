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

function IntroEN() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          Sound familiar? You're standing in an 80-minute queue for Taron – and just ten metres away
          another ride has no wait at all. Or: you book your holiday and discover that every school
          in the country is on break that exact week.
        </p>
        <p className="text-muted-foreground">
          park.fan was built out of exactly that frustration. What started as a small side project –
          "let me just track some wait times" – has grown into a platform with live data from 150+
          parks, over 5,000 attractions and millions of queue data points processed every day.
        </p>
        <p className="text-muted-foreground">
          The goal is simple: <strong>take the guesswork out of your theme park visit.</strong> Use
          the crowd calendar to pick the right day, navigate with live wait times, and rely on AI
          predictions to know when each ride will be at its quietest. This page explains every
          feature in detail.
        </p>
      </div>
      <nav aria-label="Table of Contents" className="bg-muted/40 not-prose rounded-xl border p-5">
        <p className="mb-3 font-semibold">Table of Contents</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Search'],
            ['#standort', '2. Location & Nearby'],
            ['#favoriten', '3. Favorites'],
            ['#parkseite', '4. The Park Page'],
            ['#badges', '5. Badges & Indicators'],
            ['#kalender', '6. Crowd Calendar'],
            ['#prognosen', '7. AI Predictions'],
            ['#personas', '8. Who is it for?'],
            ['#glossar', '10. Glossary'],
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

function ContentENSections() {
  return (
    <>
      {/* ── 1. Search ───────────────────────────────────────────────────────── */}
      <Section id="suche" title="Search">
        <p className="text-muted-foreground mb-4">
          The global search is the fastest way to find a park, attraction, show or restaurant –
          whether you're on desktop or mobile.
        </p>

        <SubSection title="Opening the search">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Desktop:</strong> Press{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              or <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) to open the search at any time.
            </p>
            <p>
              <strong>Mobile & Desktop:</strong> Tap the <Search className="inline h-4 w-4" /> icon
              in the header or the search field on the homepage.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="What you can search for">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parks', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attractions', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Cities & Countries', desc: 'Orlando, Paris, Germany...' },
              { icon: '🎭', label: 'Shows', desc: 'Show schedules and times' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Dining options inside parks' },
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
          The search uses smart full-text search that works even with typos. Search for
          &quot;fantasia&quot; and you&apos;ll find &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>
      {/* ── 2. Location ─────────────────────────────────────────────────────── */}
      <Section id="standort" title="Location & Nearby Parks">
        <p className="text-muted-foreground mb-4">
          With your location enabled, park.fan becomes smarter: see nearby parks and attractions
          sorted by distance. park.fan does not store your location.
        </p>
        <SubSection title="In-Park Navigation">
          <p className="text-muted-foreground text-sm">
            When you're in a park, park.fan automatically detects which park you're in and shows
            "You're in [Park Name]" on the homepage. The park map displays your live location –
            perfect for navigating between rides.
          </p>
        </SubSection>

        <NearbyParksCard />
      </Section>
      {/* ── 3. Favorites ────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favorites">
        <p className="text-muted-foreground mb-4">
          Save parks, attractions, shows and restaurants as favorites for quick access directly on
          the homepage.
        </p>

        <SubSection title="Adding a favorite">
          <p className="text-sm">
            Click the <Star className="inline h-4 w-4 text-yellow-500" /> star on any park or
            attraction card. Favorites are saved locally in your browser – no login required.
          </p>
        </SubSection>

        <SubSection title="Favorites on the homepage">
          <p className="text-muted-foreground text-sm">
            Once you have at least one favorite, a dedicated section appears on the homepage showing
            all saved parks, attractions, shows and restaurants. With location enabled, they are
            sorted by distance – nearest first.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="What gets saved?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parks',
                desc: 'Status, opening hours and crowd level at a glance',
              },
              {
                icon: '🎢',
                label: 'Attractions',
                desc: 'Live wait time and trend directly in the overview',
              },
              { icon: '🎭', label: 'Shows', desc: 'Next showtime always visible' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Kitchen status and location' },
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

        <TipBox label="Tip">
          Save your 5–10 favorite attractions at your target park. On the day of your visit,
          you&apos;ll instantly see which ones have short wait times – great for on-the-fly
          decisions.
        </TipBox>
      </Section>

      {/* ── 4. Park Page ────────────────────────────────────────────────────── */}
      <Section id="parkseite" title="The Park Page">
        <p className="text-muted-foreground mb-4">
          Every park has its own page with live data, opening hours, an interactive calendar and a
          map.
        </p>
        <InfoBox label="Note">
          All times are displayed in the <strong>park&apos;s local timezone</strong> — regardless of
          where you are. A park in Florida shows Eastern Time, Europa-Park shows Central European
          Time.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Tabs – Attractions, Shows, Calendar, Map">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attractions',
                desc: 'All rides with live wait time, status, trend and comparison to average.',
              },
              {
                icon: '🎭',
                label: 'Shows',
                desc: 'All shows with current status and upcoming showtimes.',
              },
              {
                icon: '📅',
                label: 'Calendar',
                desc: '30+ day outlook with crowd predictions, weather, holidays and school vacations.',
              },
              {
                icon: '🗺️',
                label: 'Map',
                desc: 'Interactive map with all attractions, shows and restaurants.',
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

        <SubSection title="Shows Tab: Showtimes at a Glance">
          <p className="text-muted-foreground text-sm">
            The Shows tab lists all shows with their showtimes for today. Past times are struck
            through, the <strong>next showtime</strong> is highlighted in green — so you always know
            when and where to be.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Seasonal Attractions & Shows">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Some seasonal attractions and shows only operate during certain months — like ice
              rinks in winter or water rides in summer. park.fan detects this automatically and
              hides those entries outside their season by default.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Winter',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: 'Attraction is currently in season (e.g. a winter event). Badge appears on the card.',
                },
                {
                  icon: Sun,
                  label: 'Summer',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Summer attraction – e.g. a water ride. Active from May to September.',
                },
                {
                  icon: Leaf,
                  label: 'Seasonal',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Off-season: badge is dimmed. Attraction hidden in tabs and on the map by default.',
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
                <EyeOff className="h-3 w-3" />3 off-season
              </button>
              <p className="text-muted-foreground text-sm">
                When off-season entries are hidden, this button appears next to the section heading.
                Click it to reveal them — useful if you want to find a winter attraction in summer,
                for example.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badges ───────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badges & Status Indicators">
        <p className="text-muted-foreground mb-4">
          park.fan uses a consistent color system to make information immediately understandable.
        </p>

        <SubSection title="Park & Attraction Status">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color: 'badge-status-operating',
                label: 'Operating',
                desc: 'Attraction / park is running. Wait times are updated live.',
              },
              {
                icon: AlertTriangle,
                color: 'badge-status-down',
                label: 'Down',
                desc: 'Temporarily closed – e.g. technical issue or safety pause. Usually brief.',
              },
              {
                icon: XCircle,
                color: 'badge-status-closed',
                label: 'Closed',
                desc: 'Not operating today – seasonal closure or scheduled rest day.',
              },
              {
                icon: Wrench,
                color: 'badge-status-refurbishment',
                label: 'Refurbishment',
                desc: 'Extended maintenance. Closed for days or weeks.',
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

        <SubSection title="Crowd Levels">
          <p className="text-muted-foreground mb-3 text-sm">
            The crowd level shows how busy a park or attraction is relative to the historical median
            wait time (P50) – the typical value for that attraction. 100% means exactly as busy as
            an average day.
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'badge-crowd-very-low',
                label: 'Very Low',
                icon: User,
                threshold: '≤ 60% of P50',
                desc: 'Noticeably quieter than usual. Almost no queues – ideal visit day.',
              },
              {
                color: 'badge-crowd-low',
                label: 'Low',
                icon: User,
                threshold: '61–89% of P50',
                desc: 'Below average – short wait times at most attractions.',
              },
              {
                color: 'badge-crowd-moderate',
                label: 'Moderate',
                icon: Users,
                threshold: '90–110% of P50',
                desc: 'Typical day – wait times within the expected range (±10% of median).',
              },
              {
                color: 'badge-crowd-high',
                label: 'High',
                icon: Users,
                threshold: '111–150% of P50',
                desc: 'Busier than average – noticeably longer wait times.',
              },
              {
                color: 'badge-crowd-very-high',
                label: 'Very High',
                icon: Users,
                threshold: '151–200% of P50',
                desc: 'Very crowded – waits nearly twice as long as usual. Arrive early.',
              },
              {
                color: 'badge-crowd-extreme',
                label: 'Extreme',
                icon: AlertTriangle,
                threshold: '> 200% of P50',
                desc: 'Record crowds – more than twice as busy as a typical day. School holidays, special events.',
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
            <strong>How is the crowd level calculated?</strong> park.fan compares the current
            average wait time with the historical median (P50) – the typical value for that
            attraction. 100% means exactly as busy as an average day; 60% is notably quieter, 200%
            means twice as crowded as usual.
          </InfoBox>
        </SubSection>

        <SubSection title="Trend Indicators">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Rising',
                desc: 'Queue is getting longer. Queue up soon.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stable',
                desc: 'Wait time remains constant.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'Falling',
                desc: 'Queue is getting shorter – good moment to join.',
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

        <SubSection title="Queue Types">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Single Rider',
                termId: 'single-rider',
                desc: "Often much shorter than regular queue – but you can't ride with your group.",
              },
              {
                color: 'badge-status-down',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: 'Paid express pass (e.g. at Disney). Shows current price and return time.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Return Time',
                termId: 'virtual-queue',
                desc: 'Free virtual queue – reserve a time slot and return later.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Boarding Group',
                termId: 'boarding-group',
                desc: 'Virtual queue with group number – popular for highly demanded new rides.',
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

      {/* ── 6. Calendar ─────────────────────────────────────────────────────── */}
      <Section id="kalender" title="The Crowd Calendar">
        <p className="text-muted-foreground mb-4">
          The calendar is the most powerful planning tool on park.fan. It shows an AI-powered
          forecast for each of the next 30+ days – crowd level, opening hours, weather and special
          events, all at a glance.
        </p>

        <SubSection title="What's on each calendar card?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">A typical calendar card shows:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Date and weekday</strong>
              </li>
              <li>
                🎯 <strong>Crowd Level badge</strong> (e.g. "Very High") – the AI forecast for
                overall busyness
              </li>
              <li>
                🕐 <strong>Opening hours</strong> – or "Est." if not yet officially confirmed (see
                below)
              </li>
              <li>
                🌤️ <strong>Weather forecast</strong> with min/max temperature
              </li>
              <li>
                ⌚ <strong>Avg. wait time</strong> – predicted average wait across all attractions
              </li>
              <li>
                🎟️ <strong>Ticket price</strong>, when published by the park
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>What does "Est." mean?</strong> Opening hours marked "Est." (Estimated) have not
            yet been officially confirmed by the park. park.fan derives them from historical
            patterns – they may still change.
          </p>
        </SubSection>

        <SubSection title="Calendar card icons">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Public Holiday',
                desc: 'Parks often open longer, but also busier. Check the forecast!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'School Holidays',
                desc: 'Typically the busiest days of the year – extreme wait times possible.',
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Bridge Day',
                desc: 'Likely to be busier as many people extend long weekends.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Park Closed',
                desc: 'No operation on this day – no forecast available.',
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

        <SubSection title="Practical example: finding the best visit day">
          <p className="text-muted-foreground mb-3 text-sm">
            You're planning a visit to Europa-Park in October. Here's how to use the calendar:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Open the park page and switch to the <strong>Calendar</strong> tab.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                You'll immediately spot the school holiday weeks – lots of cards with the{' '}
                <Backpack className="inline h-4 w-4 text-yellow-500" /> icon and badges showing{' '}
                <strong>"Very High"</strong> or <strong>"Extreme"</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Look for a Tuesday or Wednesday <em>without</em> a holiday icon – these often show{' '}
                <strong>"Low"</strong> or <strong>"Moderate"</strong>. Opening hours and the weather
                forecast help you make the final call.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Book tickets early – on forecast green days, ticket contingents can be limited.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="en" />
          </div>
        </SubSection>

        <SubSection title="Attraction calendar">
          <p className="text-muted-foreground text-sm">
            Each attraction's detail page also has a historical calendar showing how busy it was on
            every past day – and whether it was operating or not. This is perfect for spotting
            recurring patterns: did Taron consistently have short waits on Thursday afternoons over
            the past month? It might next week too.
          </p>
        </SubSection>

        <TipBox label="Tip">
          Best visit days are typically early weekdays outside of school holidays – Tuesday through
          Thursday show the lowest crowd levels. Avoid school holiday weeks in densely populated
          regions.
        </TipBox>
      </Section>

      {/* ── 7. AI Predictions ───────────────────────────────────────────────────── */}
      <Section id="prognosen" title="AI-Powered Predictions">
        <p className="text-muted-foreground mb-4">
          park.fan uses machine learning to predict crowd levels and wait times days in advance. The
          model is continuously trained on new data and considers four key factors:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Historical data',
              desc: 'Millions of queue data points per attraction, weekday and time of day.',
            },
            {
              icon: '📅',
              title: 'Holiday calendars',
              desc: 'School holidays and public holidays across Europe and worldwide.',
            },
            {
              icon: '🌤️',
              title: 'Weather forecasts',
              desc: 'Temperature, rain and sunshine – bad weather pushes crowds towards indoor rides.',
            },
            {
              icon: '🎉',
              title: 'Special events',
              desc: 'Halloween nights, Christmas events and other park-specific dates drive significantly higher attendance.',
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

        <SubSection title="Where to find predictions">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 In the crowd calendar</p>
              <p className="text-muted-foreground mt-0.5">
                Every calendar card contains a day-level forecast: crowd level, average wait time
                and opening hours – up to 30+ days ahead.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Peak-time badge on the park page</p>
              <p className="text-muted-foreground mt-0.5">
                The park header shows when today's crowd peak is expected – e.g. "Peak in 1h 30m".
                Plan a lunch break or a visit to a less popular ride for exactly that window.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📈 Hourly prediction chart on the attraction page</p>
              <p className="text-muted-foreground mt-0.5">
                Every attraction has its own page with a chart showing how wait times are forecast
                to evolve through the day – for today and tomorrow.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Practical example: using predictions on the day">
          <p className="text-muted-foreground mb-3 text-sm">
            You're visiting Phantasialand on a Saturday during school holidays. The calendar shows
            "Very High". Here's how predictions help:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>At the gate:</strong> The peak-time badge shows "Peak in ~2h" – you have
                until around 11:30 for your first highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Open the Taron page:</strong> The prediction chart shows 9:30 ≈ 15 min,
                12:00 ≈ 65 min, 15:00 ≈ 40 min → ride right after opening or mid-afternoon.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Lunch during peak:</strong> Instead of queuing at noon, you grab lunch. Live
                trends confirm: by 15:00 the wait is dropping – perfect moment to ride.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="How accurate are predictions?">
          <p className="text-muted-foreground text-sm">
            Accuracy varies by park and forecast window. Each attraction's detail page shows its
            prediction quality – from <strong>Poor</strong> to <strong>Excellent</strong>. More
            historical data means more precise forecasts. Short-term predictions (1–3 days) are
            inherently more reliable than longer-range ones (7–14 days).
          </p>
        </SubSection>

        <SubSection title="Wait time sparklines">
          <p className="text-muted-foreground text-sm">
            Every attraction card shows a small sparkline graph with the wait time trend over the
            last few hours. You can instantly see whether queues are building up, holding steady or
            shrinking.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Tip">
          Combine calendar and predictions: pick a green day from the calendar, then check the
          hourly forecast on the attraction page to find the quietest slot. You&apos;ll always
          arrive at the shortest queue.
        </TipBox>
      </Section>

      {/* ── 8. Personas ─────────────────────────────────────────────────────── */}
      <Section id="personas" title="Who is park.fan for?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Families"
            subtitle="Planning a perfect day out for everyone"
          >
            <Li>Crowd calendar: which day has the shortest queues?</Li>
            <Li>Weather in the calendar: planning for a rainy day? Check indoor rides!</Li>
            <Li>Favorites: save the 10 must-do rides for kids.</Li>
            <Li>Live wait times: decide on the fly which ride to do next.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Theme Park Enthusiasts"
            subtitle="Every minute must be optimised"
          >
            <Li>
              Crowd level (P50 baseline): understand if a ride is genuinely above average – or just
              "normal".
            </Li>
            <Li>Historical trends: when does Taron typically have short waits?</Li>
            <Li>Trend indicators: queue rising? Wait 20 minutes and it might be shorter.</Li>
            <Li>Single Rider / Lightning Lane: all queue types shown with times and prices.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="First-Time Visitors"
            subtitle="First time at a major theme park"
          >
            <Li>Search: find your park quickly, even if you don't know the exact name.</Li>
            <Li>Park map: get oriented before and during your visit.</Li>
            <Li>Status badges: green = running, orange = brief issue, grey = closed today.</Li>
            <Li>Crowd calendar: colours tell everything – green is good, red is stressful.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Spontaneous Visitors"
            subtitle="Last-minute decision, maximum efficiency"
          >
            <Li>Location: park.fan automatically finds your nearest park.</Li>
            <Li>Live wait times: instantly see what's open and how long the wait is.</Li>
            <Li>Trend indicators: queue falling? Perfect moment to join.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Popular Parks ────────────────────────────────────────────────── */}
      <Section id="parks" title="Popular Parks">
        <p className="text-muted-foreground mb-6">
          park.fan covers 150+ theme parks worldwide – from Walt Disney World to Universal Studios
          and Europa-Park. Here are the most-visited parks in your region with live data:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glossary ─────────────────────────────────────────────────── */}
      <Section id="glossar" title="The Glossary & Term Highlighting">
        <p className="text-muted-foreground mb-4">
          park.fan maintains a full{' '}
          <Link href="/glossary" className="text-primary underline">
            Theme Park Glossary
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {
              'covering everything from wait times and crowd levels to roller coaster elements and virtual queues. Each entry includes a short definition and a detailed explanation.'
            }
          </GlossaryInject>
        </p>

        <SubSection title="Automatic term highlighting on attraction pages">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {
                'On attraction pages, glossary terms are automatically detected in text and underlined with a dashed line. Hovering reveals a short definition tooltip – clicking takes you directly to the full glossary entry. This happens automatically with no manual linking required.'
              }
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Example text (hover over the dashed terms)
            </p>
            <p>
              <GlossaryInject>
                {`The best way to plan your visit is to check the crowd calendar before booking. On a peak day, wait times for popular rides can exceed 90 minutes – making rope drop strategy essential. A virtual queue lets you reserve a ride slot without standing in line, while a single rider lane can cut your wait by over half. When crowd levels are high, an express pass is often worth the cost.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Tip">
          The full glossary is available at{' '}
          <Link href="/glossary" className="text-primary font-medium underline">
            park.fan/glossary
          </Link>{' '}
          <GlossaryInject>
            {
              '– with terms organised across 7 categories: Wait Times, Crowd Levels, Park Operations, Planning, Attractions, Coasters and Coaster Elements.'
            }
          </GlossaryInject>
        </TipBox>
      </Section>

      {/* ── 11. FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Frequently Asked Questions">
        <div className="space-y-4">
          {[
            {
              q: 'How often are wait times updated?',
              a: 'Wait times are updated every minute. For some parks, updates occur every 2–5 minutes depending on data availability.',
            },
            {
              q: 'Where does the data come from?',
              a: 'park.fan sources live data from ThemeParks.wiki, Queue-Times.com and Wartezeiten.app.',
            },
            {
              q: 'Is park.fan free?',
              a: 'Yes, park.fan is completely free and requires no registration.',
            },
            {
              q: 'Are favorites synced across devices?',
              a: "No, favorites are stored locally in your browser (localStorage). They're only available on the device where you saved them.",
            },
            {
              q: 'How far ahead does the crowd calendar forecast?',
              a: 'The calendar shows forecasts for 30+ days ahead. Forecasts for dates further away are naturally slightly less precise than near-term predictions.',
            },
            {
              q: 'How many parks are covered?',
              a: 'park.fan currently covers 150+ parks with 5,000+ attractions worldwide – from Walt Disney World and Universal to Europa-Park, Phantasialand and parks across Asia and Australia.',
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

export function ContentEN() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroEN />
      <ContentENSections />
    </div>
  );
}
