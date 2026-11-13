/**
 * The trip planner's tickets in a browser on Orlando (PAR-1298), as part of `pnpm check:planner`;
 * `pnpm check:planner --orlando` runs this part alone.
 *
 * It needs the trip-region routes, so the site has to point at an API that has them: the API
 * repo's `pnpm trip-regions:dev` on :3001 with `NEXT_PUBLIC_API_URL=http://localhost:3001`
 * (docs/features/orlando-planner.md). The dates are the owner's own case, a UK family's Disney
 * 14-Day Magic Ticket and Universal 14-day ticket from Sun, Feb 7, 2027, so the run asserts on
 * the trip the feature was designed for; the plan-first trip needs dates whose evenings the
 * calendar already knows, so it is counted from today.
 */

const SHEET = '[data-slot="sheet-content"]';
const PHONE = { width: 390, height: 844 };
const DESK = { width: 1280, height: 900 };
const PLAN_TIMEOUT = 90_000;

/** `YYYY-MM-DD` plus `days`, in UTC, which is all a date string needs. */
function addDays(date, days) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today in Orlando, where the planner reads it. */
function orlandoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

/**
 * Run the ticket checks. `check(name, ok, detail)` is the caller's, so the balance is one.
 */
export async function checkOrlandoTickets({ browser, base, check }) {
  const errors = [];
  const open = async (viewport, { answer, view, colorScheme = 'dark', locale } = {}) => {
    const context = await browser.newContext({ viewport, colorScheme, ...(locale && { locale }) });
    await context.addInitScript(
      ({ answer, view }) => {
        try {
          if (answer) localStorage.setItem('parkfan_orlando_tickets_asked', answer);
          if (view) localStorage.setItem('parkfan_orlando_view', view);
          // Parky's lines sit over the result's lower right on a phone; a closed one mutes them.
          sessionStorage.setItem('parkfan:assistant-muted', '1');
        } catch {}
        // The statistic's test seam: every event the page reports lands here.
        window.__parkfanEventLog = [];
      },
      { answer, view }
    );
    const page = await context.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text().slice(0, 200));
    });
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    return { context, page };
  };
  /** The live planner, once the Suspense fallback has been swapped for it. */
  const ready = async (page, path) => {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-orlando-planner]').length === 1 &&
        !document.querySelector('[data-orlando-planner] [data-setup-row]:disabled'),
      null,
      { timeout: 60_000 }
    );
  };
  const query = (page) => new URL(page.url()).searchParams;
  /** The properties of every `name` event the page reported, once at least one is in. */
  const events = async (page, name) => {
    await page
      .waitForFunction((n) => (window.__parkfanEventLog ?? []).some((e) => e.name === n), name, {
        timeout: 5000,
      })
      .catch(() => {});
    return page.evaluate(
      (n) => (window.__parkfanEventLog ?? []).filter((e) => e.name === n).map((e) => e.props ?? {}),
      name
    );
  };
  const asked = (page) =>
    page.evaluate(() => {
      try {
        return localStorage.getItem('parkfan_orlando_tickets_asked');
      } catch {
        return null;
      }
    });
  const rowValue = (page) =>
    page
      .locator('[data-setup-row="tickets"]')
      .innerText()
      .then((t) => t.split('\n').at(-1));
  /**
   * The row's line once it says `text`, or what it says after 5 s. The answer is read from this
   * browser's storage after hydration, so the first frame still asks the question.
   */
  const rowSays = async (page, text) => {
    await page
      .waitForFunction(
        (t) => document.querySelector('[data-setup-row="tickets"]')?.textContent?.endsWith(t),
        text,
        { timeout: 5000 }
      )
      .catch(() => {});
    return rowValue(page);
  };
  const startTrip = (page) =>
    page.getByRole('button', { name: 'Plan my Orlando trip' }).last().click();
  const sheetTitle = (page) =>
    page.locator(`${SHEET} h2, ${SHEET} [data-slot="sheet-title"]`).first().innerText();
  /** A ticket's first day through its own month grid. */
  const pickStart = async (scope, card, date) => {
    const field = scope.locator('[data-ticket-card] [data-ticket-start]').nth(card);
    await field.click();
    const cardScope = scope.locator('[data-ticket-card]').nth(card);
    for (let i = 0; i < 14; i++) {
      if (await cardScope.locator(`[data-plan-date="${date}"]:not([disabled])`).count()) break;
      await cardScope.getByRole('button', { name: 'Next month' }).click();
    }
    await cardScope.locator(`[data-plan-date="${date}"]`).click();
  };

  // ── The step: skipped, "Not yet", and the walk it starts ──────────────────────
  {
    const { context, page } = await open(PHONE);
    await ready(page, '/en/orlando#planner');
    check(
      'Orlando · Tickets ist die erste Zeile und fragt, solange nicht geantwortet wurde',
      (await rowSays(page, 'Already have tickets?')) === 'Already have tickets?'
    );
    await startTrip(page);
    await page.locator(`${SHEET} [data-plan-tickets]`).waitFor();
    check(
      'Orlando · „Plan my Orlando trip“ öffnet zuerst Tickets',
      (await sheetTitle(page)) === 'Tickets'
    );
    const started = await events(page, 'trip_planner_started');
    check(
      'Orlando · Ereignis trip_planner_started mit Region und Quelle des Starts',
      started.length === 1 && started[0].source === 'button' && started[0].region === 'orlando',
      JSON.stringify(started)
    );
    await page.getByRole('button', { name: 'Next: dates' }).click();
    await page.waitForFunction(
      (sel) => document.querySelector(sel)?.textContent?.startsWith('Dates'),
      `${SHEET} [data-slot="sheet-title"]`
    );
    const skipped = await events(page, 'trip_tickets_answered');
    check(
      'Orlando · Ereignis trip_tickets_answered: „Next: dates“ ohne Antwort ist skipped',
      skipped.length === 1 && skipped[0].answer === 'skipped' && skipped[0].region === 'orlando',
      JSON.stringify(skipped)
    );
    check(
      'Orlando · „Next: dates“ ohne Antwort überspringt und merkt sich „Not yet“',
      (await asked(page)) === 'no' && !query(page).has('tickets'),
      `asked=${await asked(page)}`
    );
    await page.keyboard.press('Escape');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page, '/en/orlando#planner');
    check(
      'Orlando · danach heißt die Zeile „No tickets entered“',
      (await rowSays(page, 'No tickets entered')) === 'No tickets entered',
      await rowValue(page)
    );
    await startTrip(page);
    await page.waitForFunction(
      (sel) => document.querySelector(sel)?.textContent?.startsWith('Dates'),
      `${SHEET} [data-slot="sheet-title"]`
    );
    check('Orlando · und der Weg beginnt bei den Reisedaten', (await sheetTitle(page)) === 'Dates');
    await context.close();
  }
  {
    const { context, page } = await open(PHONE);
    await ready(page, '/en/orlando#planner');
    await startTrip(page);
    await page.locator(`${SHEET} [data-ticket-answer="no"]`).click();
    await page.waitForFunction(
      (sel) => document.querySelector(sel)?.textContent?.startsWith('Dates'),
      `${SHEET} [data-slot="sheet-title"]`
    );
    check(
      'Orlando · „Not yet, just plan“ antwortet und öffnet die Reisedaten mit einem Druck',
      (await asked(page)) === 'no'
    );
    const answered = await events(page, 'trip_tickets_answered');
    check(
      'Orlando · Ereignis trip_tickets_answered: not_yet',
      answered.length === 1 && answered[0].answer === 'not_yet' && answered[0].region === 'orlando',
      JSON.stringify(answered)
    );
    await context.close();
  }

  // ── "Yes": the owner's case, the UK combo, the dates it gives the trip ─────────
  let ownerLink = null;
  {
    const { context, page } = await open(PHONE);
    await ready(page, '/en/orlando#planner');
    await startTrip(page);
    const yes = page.locator(`${SHEET} [data-ticket-answer="yes"]`);
    await yes.click();
    check(
      'Orlando · „Yes, I have tickets“ klappt die Resorts auf (aria-expanded)',
      (await yes.getAttribute('aria-expanded')) === 'true'
    );
    await page.locator(`${SHEET} [data-ticket-combo]`).click();
    const cards = page.locator(`${SHEET} [data-ticket-card]`);
    check(
      'Orlando · das Combo Ticket trägt beide Tickets mit einem Druck ein',
      (await cards.count()) === 2 &&
        (await cards.nth(0).innerText()).includes('14-Day Magic Ticket') &&
        (await cards.nth(1).innerText()).includes('14-day ticket')
    );
    const sheet = page.locator(SHEET);
    await pickStart(sheet, 0, '2027-02-07');
    const shared = await cards.nth(1).locator('[data-ticket-start]').innerText();
    check(
      'Orlando · beide Hälften des Combo Tickets beginnen am selben ersten Tag',
      shared.includes('Sun, Feb 7, 2027'),
      shared
    );
    const yesAnswer = await events(page, 'trip_tickets_answered');
    const added = await events(page, 'trip_ticket_added');
    const started2 = await events(page, 'trip_ticket_start');
    check(
      'Orlando · Ereignisse: yes, zwei Tickets über das Combo, ein erster Tag',
      yesAnswer.length === 1 &&
        yesAnswer[0].answer === 'yes' &&
        added.length === 2 &&
        added.every((e) => e.via === 'combo' && e.region === 'orlando') &&
        added.map((e) => e.resort).join() === 'walt-disney-world,universal-orlando' &&
        started2.length === 1 &&
        started2[0].start === 'set',
      JSON.stringify({ yesAnswer, added, started2 })
    );
    const disney = await sheet.locator('[data-ticket-window]').nth(0).innerText();
    const universal = await sheet.locator('[data-ticket-window]').nth(1).innerText();
    check(
      'Orlando · das Fenster steht in Daten: Disney „any 14 days in these 18“',
      disney.includes('Valid Sun, Feb 7 to Wed, Feb 24: any 14 days in these 18.'),
      disney
    );
    check(
      'Orlando · Universal jeden Tag, per Startdatum das Three Park Adventure Ticket',
      universal.includes('Valid every day from Sun, Feb 7 to Sat, Feb 20.') &&
        universal.includes('Three Park Adventure'),
      universal
    );
    const q = query(page);
    check(
      'Orlando · tickets= in der Adresse, wie der Vertrag es schreibt',
      q.get('tickets') === 'wdw-uk-14-day-magic@2027-02-07,uor-uk-three-park-adventure@2027-02-07',
      q.get('tickets') ?? 'fehlt'
    );
    check(
      'Orlando · die Reisedaten kommen aus den Tickets (erster Tag bis Ende des längsten Fensters)',
      q.get('from') === '2027-02-07' && q.get('to') === '2027-02-24',
      `${q.get('from')} – ${q.get('to')}`
    );
    await page.getByRole('button', { name: 'Next: dates' }).click();
    await page.locator(`${SHEET} [data-plan-ticket-key]`).waitFor();
    const key = await page.locator(`${SHEET} [data-plan-ticket-key]`).innerText();
    const bars = await page
      .locator(`${SHEET} [data-plan-date="2027-02-10"] [data-plan-ticket-bar]`)
      .count();
    check(
      'Orlando · die Fenster liegen als Balken unter den Daten, mit Legende',
      key.includes('Disney ticket') && key.includes('Universal ticket') && bars === 2,
      `${key.replace(/\n/g, ' · ')}, ${bars} Balken am 10.`
    );
    await page.getByRole('button', { name: 'Next: parks' }).click();
    await page.locator(SHEET).getByRole('button', { name: 'Plan', exact: true }).click();
    const card = page.locator('[data-plan-tickets-card]');
    await card.waitFor({ timeout: PLAN_TIMEOUT });
    const uses = await card
      .locator('[data-plan-owned-use]')
      .evaluateAll((els) =>
        els.map((e) => `${e.getAttribute('data-plan-owned-use')}: ${e.textContent}`)
      );
    const requested = (await events(page, 'trip_plan_requested')).at(-1);
    const shown = (await events(page, 'trip_plan_shown')).at(-1);
    check(
      'Orlando · Ereignisse trip_plan_requested und trip_plan_shown zum Plan mit eigenen Tickets',
      requested?.region === 'orlando' &&
        requested.mode === 'dates' &&
        requested.days === '15-21' &&
        requested.tickets === 'owned' &&
        requested.parks === 0 &&
        !('from' in requested) &&
        shown?.mode === 'dates' &&
        (shown.outcome === 'ok' || shown.outcome === 'relaxed'),
      JSON.stringify({ requested, shown })
    );
    check(
      'Orlando · „Your tickets“: Disney zählt Tage, Universal gilt jeden Tag',
      (await card.getAttribute('data-plan-tickets-card')) === 'owned' &&
        uses.some((u) => /^counted: \d+ of 14 days/.test(u)) &&
        uses.some((u) => /^everyDay: used on \d+ of its 14 days/.test(u)),
      uses.join(' | ')
    );
    ownerLink = page.url();
    await context.close();
  }

  // ── Links round-trip: a copied link, the relay, Parky's hand-off ──────────────
  if (ownerLink) {
    const { context, page } = await open(PHONE, { answer: 'yes' });
    const asked = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/trip-regions/orlando/plan')) asked.push(new URL(r.url()));
    });
    await ready(page, new URL(ownerLink).pathname + new URL(ownerLink).search + '#planner');
    await page.locator('[data-plan-tickets-card]').waitFor({ timeout: PLAN_TIMEOUT });
    check(
      'Orlando · ein kopierter Link öffnet dieselben Tickets, ohne die Adresse umzuschreiben',
      page.url() === ownerLink &&
        (await rowSays(page, 'Disney 14-Day Magic Ticket · Universal 14-day ticket')) ===
          'Disney 14-Day Magic Ticket · Universal 14-day ticket',
      await rowValue(page)
    );
    const fromLink = await events(page, 'trip_planner_started');
    check(
      'Orlando · Ereignis trip_planner_started: ein Link mit Plan ist source link',
      fromLink.length === 1 && fromLink[0].source === 'link' && fromLink[0].region === 'orlando',
      JSON.stringify(fromLink)
    );
    await context.close();
  }
  {
    // Parky's `plan_vacation` link, as the API writes it: URLSearchParams, so `@` and `?` encoded.
    const { context, page } = await open(DESK, { answer: 'yes' });
    const asked = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/trip-regions/orlando/plan')) asked.push(new URL(r.url()));
    });
    const parky =
      '/en/orlando?from=2027-02-08&to=2027-02-17&blocks=1&hopper=universal-orlando' +
      '&tickets=wdw-date-based.4.h%3F%402027-02-12#planner';
    await ready(page, parky);
    await page.locator('[data-plan-tickets-card]').waitFor({ timeout: PLAN_TIMEOUT });
    const sent = asked.at(-1)?.searchParams;
    check(
      'Orlando · Parkys Link mit tickets=, hopper= und blocks= kommt am Relay an',
      sent?.get('tickets') === 'wdw-date-based.4.h?@2027-02-12' &&
        sent?.get('hopper') === 'universal-orlando' &&
        sent?.get('blocks') === '1',
      sent ? sent.toString() : 'keine Anfrage'
    );
    check(
      'Orlando · und die Tickets-Zeile liest das Ticket aus ihm',
      (await page.locator('[data-plan-disclosure="tickets"] button').first().innerText()).includes(
        'Disney 4 days'
      ),
      await page.locator('[data-plan-disclosure="tickets"] button').first().innerText()
    );
    await context.close();
  }

  // ── Plan first: the compact block, its details, the hopper per resort ─────────
  // A trip three weeks out, where the calendar knows the evenings the hopper verdict counts.
  const from = addDays(orlandoToday(), 21);
  const firstPath = `/en/orlando?from=${from}&to=${addDays(from, 8)}#planner`;
  {
    // A browser that names its languages, as a visitor's does: the purchase links read them.
    const { context, page } = await open(PHONE, { answer: 'no', locale: 'en-GB' });
    await ready(page, firstPath);
    const card = page.locator('[data-plan-tickets-card="suggested"]');
    await card.waitFor({ timeout: PLAN_TIMEOUT });
    const box = await card.boundingBox();
    check(
      'Orlando · Plan first: ein kompakter Block auf Level 0 (Satz und „Ticket details“)',
      box !== null &&
        box.height <= 200 &&
        (await card.locator('[data-plan-ticket-sentence]').count()) === 1,
      box ? `${Math.round(box.height)} px` : 'kein Block'
    );
    await card.locator('[data-plan-ticket-details]').click();
    await page.locator(`${SHEET} [data-plan-ticket-details-body]`).waitFor();
    check(
      'Orlando · auf dem Telefon öffnen die Details ein Sheet',
      (await page.locator(`${SHEET} [data-plan-suggestion]`).count()) >= 1
    );
    const opened = await events(page, 'trip_ticket_details_opened');
    check(
      'Orlando · Ereignis trip_ticket_details_opened: sheet',
      opened.length === 1 && opened[0].surface === 'sheet' && opened[0].region === 'orlando',
      JSON.stringify(opened)
    );
    await context.close();
  }
  {
    const { context, page } = await open(DESK, { answer: 'no' });
    await ready(page, firstPath);
    const card = page.locator('[data-plan-tickets-card="suggested"]');
    await card.waitFor({ timeout: PLAN_TIMEOUT });
    const details = card.locator('[data-plan-ticket-details]');
    await details.click();
    check(
      'Orlando · am Schreibtisch klappen die Details an Ort und Stelle auf',
      (await details.getAttribute('aria-expanded')) === 'true' &&
        (await card.locator('[data-plan-ticket-details-body]').isVisible())
    );
    const inline = await events(page, 'trip_ticket_details_opened');
    check(
      'Orlando · Ereignis trip_ticket_details_opened: inline',
      inline.length === 1 && inline[0].surface === 'inline',
      JSON.stringify(inline)
    );
    const toggles = card.locator('[data-plan-hopper-toggle]');
    const count = await toggles.count();
    if (count === 0) {
      check(
        'Orlando · „Show the plan with Park Hopper“ erscheint, wo der Hopper etwas bringt',
        (await card.locator('[data-plan-verdict]').count()) > 0,
        'auf diesen Tagen bringt kein Hopper etwas'
      );
    } else {
      const resort = await toggles.first().getAttribute('data-plan-hopper-toggle');
      await toggles.first().click();
      await page.waitForFunction(
        (r) => new URL(location.href).searchParams.get('hopper') === r,
        resort,
        { timeout: 10_000 }
      );
      check(
        'Orlando · „Show the plan with Park Hopper“ setzt hopper= nur für dieses Resort',
        query(page).get('hopper') === resort && !query(page).has('ticket'),
        page.url()
      );
      const toggled = await events(page, 'trip_hopper_toggled');
      check(
        'Orlando · Ereignis trip_hopper_toggled mit Resort und Richtung',
        toggled.length === 1 && toggled[0].resort === resort && toggled[0].on === true,
        JSON.stringify(toggled)
      );
      await page
        .locator(`[data-plan-hopper-toggle="${resort}"][aria-pressed="true"]`)
        .waitFor({ timeout: PLAN_TIMEOUT });
      check(
        'Orlando · und heißt danach „Show the plan without …“',
        (await page.locator(`[data-plan-hopper-toggle="${resort}"]`).innerText()).startsWith(
          'Show the plan without'
        )
      );
    }
    await context.close();
  }

  // ── Where to buy: the links' attributes and the partner label ────────────────
  {
    // The seed carries no sponsored link, so one is added to the answer the browser receives.
    const { context, page } = await open(DESK, { answer: 'no' });
    await page.route('**/api/trip-regions/orlando/plan?*', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      for (const s of json?.meta?.ticketSuggestion ?? []) {
        s.links = [
          {
            seller: 'Partner Shop',
            url: 'https://partner.example/tickets',
            sponsored: true,
          },
          ...(s.links ?? []),
        ];
      }
      await route.fulfill({ response, json });
    });
    await ready(page, firstPath);
    const card = page.locator('[data-plan-tickets-card="suggested"]');
    await card.waitFor({ timeout: PLAN_TIMEOUT });
    await card.locator('[data-plan-ticket-details]').click();
    const sponsored = card.locator('[data-ticket-link="sponsored"]').first();
    const official = card.locator('[data-ticket-link="official"]').first();
    const attrs = async (link) => ({
      rel: await link.getAttribute('rel'),
      referrer: await link.getAttribute('referrerpolicy'),
      target: await link.getAttribute('target'),
    });
    const a = await attrs(sponsored);
    const b = await attrs(official);
    check(
      'Orlando · ein Partnerlink ist rel="sponsored nofollow noopener" und nennt park.fan als Herkunft',
      a.rel === 'sponsored nofollow noopener' && a.referrer === 'origin' && a.target === '_blank',
      JSON.stringify(a)
    );
    check(
      'Orlando · der offizielle Shop ist rel="noopener" ohne noreferrer, Herkunft park.fan',
      b.rel === 'noopener' && b.referrer === 'origin',
      JSON.stringify(b)
    );
    // The click opens the seller in a new tab; the count is what matters here.
    context.on('page', (opened) => opened.close().catch(() => {}));
    await sponsored.click();
    const counted = await page.evaluate(() =>
      (window.__parkfanEventLog ?? []).filter((e) => e.name === 'ticket_link_clicked')
    );
    check(
      'Orlando · ein Klick auf einen Ticket-Link zählt als ticket_link_clicked',
      counted.length === 1 &&
        counted[0].props.kind === 'sponsored' &&
        counted[0].props.seller === 'Partner Shop' &&
        counted[0].props.host === 'partner.example' &&
        counted[0].props.position === 1 &&
        counted[0].props.surface === 'suggestion' &&
        counted[0].props.ticket_mode === 'plan_first',
      JSON.stringify(counted[0]?.props ?? 'kein Ereignis')
    );
    const label = sponsored.locator('xpath=following-sibling::*[@data-partner-label]');
    await label.click();
    const note = page.locator('[data-partner-note]');
    await note.waitFor({ timeout: 5000 }).catch(() => {});
    check(
      'Orlando · neben dem Partnerlink steht „Partner link“ und erklärt sich auf Druck',
      (await label.isVisible()) &&
        (await label.innerText()).includes('Partner link') &&
        (await note.isVisible()) &&
        (await note.innerText()).includes('commission'),
      await note.innerText().catch(() => 'keine Erklärung')
    );
    await context.close();
  }

  // ── The ticket day: Week header and the day's sheet ──────────────────────────
  const ownedPath =
    '/en/orlando?from=2027-02-08&to=2027-02-17' +
    '&tickets=uor-date-based.3@2027-02-09,wdw-date-based.4.h@2027-02-12#planner';
  for (const [viewport, label, text] of [
    [DESK, 'am Schreibtisch', 'Disney day 2 of 4'],
    [PHONE, 'auf dem Telefon (drei Spalten)', 'day 2 of 4'],
  ]) {
    const { context, page } = await open(viewport, { answer: 'yes', view: 'week' });
    await ready(page, ownedPath);
    await page.locator('[data-plan-view="week"]').waitFor({ timeout: PLAN_TIMEOUT });
    let header = page.locator(`[data-plan-ticket-day="${text}"]`);
    for (let i = 0; i < 3 && !(await header.count()); i++) {
      await page.getByRole('button', { name: 'Later days' }).click();
      header = page.locator(`[data-plan-ticket-day="${text}"]`);
    }
    check(`Orlando · Week-Kopf ${label}: „${text}“`, (await header.count()) === 1);
    if (viewport === DESK) {
      await header.locator('xpath=ancestor::li[1]//button').first().click();
      const fact = page.locator(`${SHEET} [data-plan-sheet-ticket]`);
      await fact.waitFor();
      check(
        'Orlando · das Blatt des Tages nennt den Ticket-Tag und das Fenster',
        (await fact.innerText()).startsWith('Disney day 2 of 4, Park Hopper included.') &&
          (await fact.innerText()).includes('valid Fri, Feb 12 to Thu, Feb 18'),
        await fact.innerText()
      );
    }
    await context.close();
  }

  // ── A day outside its ticket, with both ways out ─────────────────────────────
  {
    const outsidePath =
      '/en/orlando?from=2027-02-08&to=2027-02-17&tickets=wdw-date-based.4@2027-02-14#planner';
    const { context, page } = await open(DESK, { answer: 'yes', view: 'agenda' });
    await ready(page, outsidePath);
    const warning = page.locator('[data-plan-outside]');
    await warning.waitFor({ timeout: PLAN_TIMEOUT });
    check(
      'Orlando · ein Tag außerhalb seines Tickets warnt im Ticket mit zwei Auswegen',
      (await warning.getByRole('button').count()) === 2 &&
        (await page.locator('[data-plan-marker="outside_ticket"]').count()) >= 1,
      await warning.innerText()
    );
    await warning.getByRole('button', { name: 'Change ticket' }).click();
    await page.waitForFunction(
      () => document.activeElement?.hasAttribute('data-ticket-start'),
      null,
      { timeout: 10_000 }
    );
    check(
      'Orlando · „Change ticket“ öffnet das Ticket mit dem Fokus auf seinem ersten Tag',
      await page.evaluate(() => document.activeElement?.hasAttribute('data-ticket-start'))
    );
    const slug = await warning.evaluate((el) => el.textContent ?? '');
    await page
      .locator('[data-plan-outside]')
      .getByRole('button', { name: 'Leave this visit out' })
      .click();
    await page.waitForFunction(() => new URL(location.href).searchParams.has('parks'), null, {
      timeout: 10_000,
    });
    check(
      'Orlando · „Leave this visit out“ nimmt den Besuch aus den Parks',
      !(query(page).get('parks') ?? '').includes('magic-kingdom-park'),
      `${slug.slice(0, 60)} → parks=${query(page).get('parks')}`
    );
    const ways = await events(page, 'trip_outside_ticket_action');
    check(
      'Orlando · Ereignis trip_outside_ticket_action für beide Auswege',
      ways.map((e) => `${e.region}:${e.action}`).join() ===
        'orlando:change_ticket,orlando:leave_out',
      JSON.stringify(ways)
    );
    await context.close();
  }

  check(
    'Orlando · keine Konsolenfehler in den Ticket-Abläufen',
    errors.length === 0,
    errors.slice(0, 3).join(' | ')
  );
}
