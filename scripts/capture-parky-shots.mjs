/**
 * The screenshots on Parky's page (`/[locale]/parky`), taken from the real widget on a phone in
 * each of the six languages: two chats laid into the browser's session as if they had happened, and
 * Parky searching along in the palette. The chats are fixtures, so every language shows the same
 * conversation; the cards in them draw from the fixture too, not from live data.
 *
 * Needs a running site with Parky's API reachable for the page around it:
 * `pnpm build && pnpm start -p 3100`, then
 * `node scripts/capture-parky-shots.mjs --base=http://localhost:3100`.
 * Writes `public/parky/<locale>/{chat,plan,search}.webp`.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { chromium, devices } from 'playwright';
import sharp from 'sharp';

const base =
  process.argv.find((arg) => arg.startsWith('--base='))?.slice(7) ?? 'http://localhost:3000';
const only = process.argv.find((arg) => arg.startsWith('--locale='))?.slice(9);

const PHANTASIALAND = 'parks/europe/germany/bruehl/phantasialand';
const EUROPA_PARK = 'parks/europe/germany/rust/europa-park';

/** A Saturday in the season, for the times on the cards. */
const OPENS = '2026-06-13T09:00:00+02:00';
const CLOSES = '2026-06-13T18:00:00+02:00';

/** The two chats, in each language: what was asked and what Parky answered. */
const CHATS = {
  de: {
    waits: [
      'Wie lang ist die Warteschlange bei Taron gerade?',
      'Bei Taron wartest du gerade 35 Minuten. Für einen Samstag ist das wenig, am Nachmittag sind es dort oft über 60.',
      'Und was geht sonst gerade schnell?',
      'Kurz sind gerade **Black Mamba** mit 15 Minuten, **Chiapas** mit 20 Minuten und **F.L.Y.** mit 25 Minuten. Danach würde ich Taron noch mal probieren.',
    ],
    plan: [
      'Plan mir Samstag im Europa-Park mit den großen Achterbahnen.',
      'Erledigt: Silver Star, Blue Fire, Voltron Nevera und Wodan stehen in deinem Tagesplan für Samstag. Fang zur Öffnung mit Voltron an, morgens ist die Warteschlange dort noch kurz.',
    ],
    search: 'Taron',
  },
  en: {
    waits: [
      'How long is the queue for Taron right now?',
      'Taron is at 35 minutes right now. That is short for a Saturday; in the afternoon it is often over 60.',
      'And what else is quick at the moment?',
      'Short right now: **Black Mamba** at 15 minutes, **Chiapas** at 20 minutes and **F.L.Y.** at 25 minutes. After those I would try Taron again.',
    ],
    plan: [
      'Plan my Saturday at Europa-Park with the big coasters.',
      'Done: Silver Star, Blue Fire, Voltron Nevera and Wodan are in your day plan for Saturday. Start with Voltron at opening, while its queue is still short.',
    ],
    search: 'Taron',
  },
  nl: {
    waits: [
      'Hoe lang is de wachtrij bij Taron nu?',
      'Bij Taron wacht je nu 35 minuten. Voor een zaterdag is dat kort, ’s middags is het daar vaak meer dan 60.',
      'En wat gaat er verder nu snel?',
      'Kort zijn nu **Black Mamba** met 15 minuten, **Chiapas** met 20 minuten en **F.L.Y.** met 25 minuten. Daarna zou ik Taron nog eens proberen.',
    ],
    plan: [
      'Plan mijn zaterdag in Europa-Park met de grote achtbanen.',
      'Klaar: Silver Star, Blue Fire, Voltron Nevera en Wodan staan in je dagplanning voor zaterdag. Begin bij de opening met Voltron, dan is de wachtrij daar nog kort.',
    ],
    search: 'Taron',
  },
  fr: {
    waits: [
      'Quelle est l’attente pour Taron en ce moment ?',
      'Pour Taron, l’attente est de 35 minutes en ce moment. C’est peu pour un samedi : l’après-midi, elle dépasse souvent 60.',
      'Et qu’est-ce qui va vite en ce moment ?',
      'En ce moment, c’est court pour **Black Mamba** avec 15 minutes, **Chiapas** avec 20 minutes et **F.L.Y.** avec 25 minutes. Ensuite, je retenterais Taron.',
    ],
    plan: [
      'Planifie mon samedi à Europa-Park avec les grands huit.',
      'C’est fait : Silver Star, Blue Fire, Voltron Nevera et Wodan sont dans ton planning de samedi. Commence par Voltron dès l’ouverture, la file y est encore courte le matin.',
    ],
    search: 'Taron',
  },
  es: {
    waits: [
      '¿Cuánta cola hay ahora en Taron?',
      'En Taron se esperan ahora 35 minutos. Para ser sábado es poco: por la tarde suele pasar de 60.',
      '¿Y qué más va rápido ahora?',
      'Ahora van rápido **Black Mamba** con 15 minutos, **Chiapas** con 20 minutos y **F.L.Y.** con 25 minutos. Después volvería a probar Taron.',
    ],
    plan: [
      'Planifícame el sábado en Europa-Park con las montañas rusas grandes.',
      'Hecho: Silver Star, Blue Fire, Voltron Nevera y Wodan están en tu plan del sábado. Empieza con Voltron a la apertura, por la mañana la cola aún es corta.',
    ],
    search: 'Taron',
  },
  it: {
    waits: [
      'Quanta coda c’è adesso per Taron?',
      'Per Taron si aspettano adesso 35 minuti. Per un sabato è poco: nel pomeriggio spesso si superano i 60.',
      'E cos’altro va veloce adesso?',
      'Adesso vanno veloci **Black Mamba** con 15 minuti, **Chiapas** con 20 minuti e **F.L.Y.** con 25 minuti. Dopo riproverei Taron.',
    ],
    plan: [
      'Pianificami il sabato a Europa-Park con le montagne russe più grandi.',
      'Fatto: Silver Star, Blue Fire, Voltron Nevera e Wodan sono nel tuo piano di sabato. Comincia con Voltron all’apertura, la mattina la coda è ancora corta.',
    ],
    search: 'Taron',
  },
};

/** The two chats as the widget keeps them in the session (`parkfan:assistant-chat`). */
function stored(locale, which) {
  const lines = CHATS[locale][which];
  const id = (i) => `demo-${which}-${i}`;
  const messages = lines.map((text, i) => ({
    id: id(i),
    role: i % 2 === 0 ? 'user' : 'assistant',
    text,
    ...(i % 2 === 1 && { messageId: id(i) }),
  }));
  if (which === 'waits') {
    messages[1].cards = [
      {
        kind: 'ride',
        name: 'Taron',
        park: 'Phantasialand',
        status: 'OPERATING',
        crowdLevel: 'moderate',
        waitMinutes: 35,
        url: `/${PHANTASIALAND}/taron`,
      },
    ];
    messages[3].cards = [
      {
        kind: 'rides',
        park: 'Phantasialand',
        order: 'shortest',
        rides: [
          { name: 'Black Mamba', waitMinutes: 15 },
          { name: 'Chiapas', waitMinutes: 20 },
          { name: 'F.L.Y.', waitMinutes: 25 },
        ],
        url: `/${PHANTASIALAND}`,
      },
    ];
  } else {
    messages[1].chips = ['planned'];
    messages[1].cards = [
      {
        kind: 'park',
        name: 'Europa-Park',
        place: 'Rust',
        status: 'OPERATING',
        crowdLevel: 'high',
        opens: OPENS,
        closes: CLOSES,
        waits: [
          { name: 'Voltron Nevera', waitMinutes: 55 },
          { name: 'Silver Star', waitMinutes: 40 },
          { name: 'Blue Fire', waitMinutes: 35 },
        ],
        url: `/${EUROPA_PARK}`,
      },
    ];
  }
  return { conversationId: `demo-${which}`, messages };
}

/** A phone in the dark theme, Parky forced on, its lines muted and its challenge passed. */
async function phone(browser, locale, chat) {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale,
    timezoneId: 'Europe/Berlin',
    colorScheme: 'dark',
  });
  await context.addInitScript(
    ({ chat }) => {
      try {
        sessionStorage.setItem(
          'parkfan:assistant-session',
          JSON.stringify({ token: 'demo', expiresAt: Date.now() + 7_200_000 })
        );
        sessionStorage.setItem('parkfan:assistant-muted', '1');
        sessionStorage.setItem('parkfan:assistant-teasers', '9');
        if (chat) sessionStorage.setItem('parkfan:assistant-chat', JSON.stringify(chat));
      } catch {
        // A fresh context always has storage.
      }
    },
    { chat }
  );
  const page = await context.newPage();
  return { context, page };
}

async function settle(page, path) {
  await page.goto(`${base}/${path}`, { waitUntil: 'load', timeout: 300_000 });
  await page.addStyleTag({
    content: '.tsqd-parent-container, nextjs-portal { display: none !important }',
  });
  await page.waitForSelector('button.fixed[aria-expanded]', { timeout: 120_000 });
  // Long enough for the entrance to land and the page's images to arrive.
  await page.waitForTimeout(4_000);
}

async function save(page, locale, name) {
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 82 }).toFile(`public/parky/${locale}/${name}.webp`);
  console.log(`  ✓ ${locale}/${name}.webp`);
}

const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}
);
for (const locale of Object.keys(CHATS)) {
  if (only && locale !== only) continue;
  mkdirSync(`public/parky/${locale}`, { recursive: true });

  for (const [name, which, park] of [
    ['chat', 'waits', PHANTASIALAND],
    ['plan', 'plan', EUROPA_PARK],
  ]) {
    const { context, page } = await phone(browser, locale, stored(locale, which));
    await settle(page, `${locale}/${park}?assistant=on&parky=pop`);
    await page.locator('button.fixed[aria-expanded]').click();
    await page.waitForTimeout(2_500);
    // From the first question on, not scrolled to the latest answer as the widget opens.
    await page.evaluate(() => {
      for (const element of document.querySelectorAll('[role="dialog"] *, aside *')) {
        if (element.scrollHeight > element.clientHeight + 4) element.scrollTop = 0;
      }
    });
    await page.waitForTimeout(400);
    await save(page, locale, name);
    await context.close();
  }

  const { context, page } = await phone(browser, locale, null);
  await settle(page, `${locale}?assistant=on&parky=pop`);
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(800);
  await page.keyboard.type(CHATS[locale].search, { delay: 60 });
  await page.waitForTimeout(2_500);
  await save(page, locale, 'search');
  await context.close();
}
await browser.close();
