/**
 * The trip planner's tickets in a browser on Orlando (PAR-1298), as part of `pnpm check:planner`;
 * `pnpm check:planner --orlando` runs this part alone. The questions are the assistant's
 * (`TripWizard`, a dialog that „Plan my trip“ opens); the answer's tickets, a day's sheet and its
 * edits (pin, undo, the swap mode) are the result's.
 *
 * It needs the trip-region routes, so the site has to point at an API that has them: the API
 * repo's `pnpm trip-regions:dev` on :3001 with `NEXT_PUBLIC_API_URL=http://localhost:3001`
 * (docs/features/orlando-planner.md). The dates are the owner's own case, a UK family's Disney
 * 14-Day Magic Ticket and Universal 14-day ticket from Sun, Feb 7, 2027, so the run asserts on
 * the trip the feature was designed for; the plan-first trip needs dates whose evenings the
 * calendar already knows, so it is counted from today.
 */

const SHEET = '[data-slot="sheet-content"]';
const WIZARD = '[data-trip-wizard]';
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
    // The Suspense fallback draws the same planner with its buttons off.
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-trip-planner]').length === 1 &&
        !document.querySelector(
          '[data-trip-planner] > button:disabled, [data-trip-planner] [data-plan-answers] button:disabled'
        ),
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
  /**
   * „Plan my trip“ in the hub's head: the planner's own button is hidden while the hub shows
   * chapter 01. Pressed before the head has hydrated it only follows its `#planner`, so again.
   */
  const startTrip = async (page) => {
    const wizard = page.locator(WIZARD);
    for (let i = 0; i < 4 && !(await wizard.count()); i++) {
      await page.locator('a[data-landing-action]', { hasText: 'Plan my trip' }).first().click();
      await wizard.waitFor({ timeout: 5000 }).catch(() => {});
    }
  };
  /** The assistant's „Step 2 of 6“, which its dialog is described by. */
  const wizardStep = (page) =>
    page.locator(`${WIZARD} [data-slot="dialog-description"]`).innerText();
  /** Two dates in the assistant's date grid, a later month where the first has none of them. */
  const pickDates = async (scope, dates) => {
    for (const date of dates) {
      for (let i = 0; i < 3; i++) {
        if (await scope.locator(`[data-plan-date="${date}"]:not([disabled])`).count()) break;
        await scope.getByRole('button', { name: 'Next month' }).first().click();
      }
      await scope.locator(`[data-plan-date="${date}"]`).first().click();
    }
  };
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

  // ── The walk: the assistant asks the dates first, the tickets last ──────────────
  {
    const { context, page } = await open(PHONE);
    await ready(page, '/en/orlando#planner');
    await startTrip(page);
    await page.locator(WIZARD).waitFor();
    check(
      'Orlando · „Plan my trip“ öffnet den Assistenten auf den Reisedaten',
      (await wizardStep(page)).startsWith('Step 1 of') &&
        (await page.locator(`${WIZARD} [data-plan-date]`).count()) > 0
    );
    check(
      'Orlando · Tickets sind ein Schritt des Assistenten, nicht vor den Daten',
      (await page.getByRole('button', { name: /^Step \d+, Tickets$/ }).count()) === 1 &&
        (await page.locator(`${WIZARD} [data-wizard-tickets]`).count()) === 0
    );
    const started = await events(page, 'trip_planner_started');
    check(
      'Orlando · Ereignis trip_planner_started mit Region und Quelle des Starts',
      started.length === 1 && started[0].source === 'hero' && started[0].region === 'orlando',
      JSON.stringify(started)
    );
    await page.keyboard.press('Escape');
    await page.locator(WIZARD).waitFor({ state: 'detached' });
    const closed = await events(page, 'trip_wizard_closed');
    check(
      'Orlando · ohne Plan geschlossen zählt trip_wizard_closed mit dem Schritt',
      closed.length === 1 && closed[0].step === 'dates',
      JSON.stringify(closed)
    );
    check(
      'Orlando · ohne Daten steht „Already have tickets?“ einmal, auf der Landingpage',
      (await page.locator('[data-plan-tickets-ask]').count()) === 1
    );
    await context.close();
  }
  {
    const { context, page } = await open(PHONE);
    await ready(
      page,
      `/en/orlando?from=${addDays(orlandoToday(), 21)}&to=${addDays(orlandoToday(), 28)}#planner`
    );
    await page
      .locator('[data-plan-tickets-card] [data-plan-tickets-ask]')
      .waitFor({ timeout: PLAN_TIMEOUT });
    check(
      'Orlando · ein geteilter Plan fragt nicht nach Tickets: die Karte trägt „Already have tickets?“',
      (await page.locator(WIZARD).count()) === 0 &&
        (await page.locator('[data-plan-tickets-card] [data-plan-tickets-ask]').count()) === 1
    );
    await context.close();
  }

  // ── The desk: the dates, the plan early, an answer changed, a day pinned and swapped ───
  {
    const { context, page } = await open(DESK, { view: 'agenda' });
    await ready(page, '/en/orlando#planner');
    await startTrip(page);
    const wizard = page.locator(WIZARD);
    const first = addDays(orlandoToday(), 21);
    await pickDates(wizard, [first, addDays(first, 6)]);
    await wizard.locator('[data-wizard-next]').click();
    await page.waitForFunction(
      (sel) => document.querySelector(sel)?.textContent?.startsWith('Step 2 of'),
      `${WIZARD} [data-slot="dialog-description"]`
    );
    const steps = await events(page, 'trip_wizard_step');
    check(
      'Orlando · „Next“ zählt trip_wizard_step mit Schritt und Weg',
      steps.some((e) => e.step === 'parks' && e.via === 'next'),
      JSON.stringify(steps)
    );
    await wizard.locator('[data-wizard-show-plan]').click();
    await page.locator('[data-plan-answers]').waitFor();
    await page.locator('[data-plan-day-card]').first().waitFor({ timeout: PLAN_TIMEOUT });
    // The dialog leaves after its exit animation, which can outlast the first day card.
    await wizard.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    const finished = await events(page, 'trip_wizard_finished');
    check(
      'Orlando · „Show the plan now“ schließt den Assistenten früh (early) und zeigt den Plan',
      finished.length === 1 && finished[0].early === true && (await wizard.count()) === 0,
      JSON.stringify(finished)
    );
    await page
      .locator('[data-plan-answers]')
      .getByRole('button', { name: /Evenings/ })
      .click();
    await page.locator(`${WIZARD} [data-wizard-evenings]`).waitFor();
    const back = await events(page, 'trip_wizard_step');
    check(
      'Orlando · eine Antwort im Ergebnis öffnet ihren Schritt (via answers)',
      back.some((e) => e.step === 'evenings' && e.via === 'answers'),
      JSON.stringify(back)
    );
    await page
      .locator(`${WIZARD} [data-wizard-evenings]`)
      .getByRole('button', { name: /^Evenings/ })
      .first()
      .click();
    const changed = await events(page, 'trip_option_changed');
    check(
      'Orlando · eine Option zählt mit ihrem Wert und wer sie geändert hat',
      changed.length === 1 &&
        changed[0].option === 'evenings' &&
        changed[0].value === 'off' &&
        changed[0].by === 'visitor',
      JSON.stringify(changed)
    );
    await page.keyboard.press('Escape');
    await page.locator(WIZARD).waitFor({ state: 'detached' });

    // A day's own edits: the pin is a pressed toggle, the status band says it, Undo takes it back.
    const card = page.locator('[data-plan-day-card="park"]').first();
    await card.waitFor({ timeout: PLAN_TIMEOUT });
    const pin = card.locator('[data-plan-day-actions] button[aria-pressed]');
    await pin.click();
    await page.locator('[data-plan-edit-status="pin"]').waitFor({ timeout: 10_000 });
    check(
      'Orlando · „Pin“ an der Tageskarte hält den Tag fest und sagt es im Statusband',
      (await pin.getAttribute('aria-pressed')) === 'true' &&
        (query(page).get('lock') ?? '').includes('@') &&
        (await events(page, 'trip_day_pinned')).at(-1)?.pinned === true,
      await page.locator('[data-plan-edit-status]').innerText()
    );
    await page.locator('[data-plan-edit-status]').getByRole('button', { name: 'Undo' }).click();
    await page.waitForFunction(() => !new URL(location.href).searchParams.has('lock'), null, {
      timeout: 10_000,
    });
    const undo = await events(page, 'trip_undo');
    check(
      'Orlando · „Undo“ nimmt den Pin zurück (trip_undo mit what: pin)',
      undo.length === 1 && undo[0].what === 'pin',
      JSON.stringify(undo)
    );
    await page
      .locator('[data-plan-day-card="park"]')
      .first()
      .locator('[data-plan-day-actions]')
      .getByRole('button', { name: /^Swap / })
      .click();
    const swap = page.locator('[data-plan-swap-mode]');
    await swap.waitFor();
    const rows = await swap.locator('li button:not([disabled])').allInnerTexts();
    check(
      'Orlando · „Swap“ zeigt jeden Tag mit der eigenen Zahl des Parks dort',
      rows.length > 0 && rows.some((r) => / \d+ min \([+±−-]\d+\)/.test(r)),
      rows.slice(0, 3).join(' | ').replace(/\n/g, ' ')
    );
    await swap.locator('li button:not([disabled])').first().click();
    await page.locator('[data-plan-edit-status="swap"]').waitFor({ timeout: 10_000 });
    check(
      'Orlando · ein Tausch hält beide Tage fest und zählt trip_day_swapped',
      (query(page).get('lock') ?? '').split(',').length === 2 &&
        (await events(page, 'trip_day_swapped')).length === 1
    );
    await context.close();
  }

  // ── "Yes": the owner's case, the UK combo, the dates it gives the trip ─────────
  let ownerLink = null;
  {
    const { context, page } = await open(PHONE);
    await ready(page, '/en/orlando#planner');
    // The landing's „Add them“ is the one way to tickets before dates.
    const ask = page.locator('[data-plan-tickets-ask] button');
    const reachable = await ask.isVisible();
    check(
      'Orlando · ohne Daten ist „Add them“ zu sehen, die Tickets können vor den Daten kommen',
      reachable,
      reachable ? '' : 'versteckt: die Landingpage zeigt „Add them“ nicht'
    );
    if (reachable) {
      await ask.click();
      await page.locator(`${WIZARD} [data-plan-tickets]`).waitFor();
      check(
        'Orlando · „Add them“ öffnet den Ticket-Schritt des Assistenten mit den Resorts',
        (await page.locator(`${WIZARD} [data-ticket-add]`).count()) >= 2
      );
      await page.locator(`${WIZARD} [data-ticket-combo]`).click();
      const cards = page.locator(`${WIZARD} [data-ticket-card]`);
      check(
        'Orlando · das Combo Ticket trägt beide Tickets mit einem Druck ein',
        (await cards.count()) === 2 &&
          (await cards.nth(0).innerText()).includes('14-Day Magic Ticket') &&
          (await cards.nth(1).innerText()).includes('14-day ticket')
      );
      const sheet = page.locator(WIZARD);
      await pickStart(sheet, 0, '2027-02-07');
      const shared = await cards.nth(1).locator('[data-ticket-start]').innerText();
      check(
        'Orlando · beide Hälften des Combo Tickets beginnen am selben ersten Tag',
        shared.includes('Sun, Feb 7, 2027'),
        shared
      );
      const opened = await events(page, 'trip_tickets_opened');
      const added = await events(page, 'trip_ticket_added');
      const started2 = await events(page, 'trip_ticket_start');
      check(
        'Orlando · Ereignisse: Tickets geöffnet (ask, erstes Mal), zwei Tickets über das Combo, ein erster Tag',
        opened.length === 1 &&
          opened[0].from === 'ask' &&
          opened[0].first === true &&
          added.length === 2 &&
          added.every((e) => e.via === 'combo' && e.region === 'orlando') &&
          added.map((e) => e.resort).join() === 'walt-disney-world,universal-orlando' &&
          started2.length === 1 &&
          started2[0].start === 'set',
        JSON.stringify({ opened, added, started2 })
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
        q.get('tickets') ===
          'wdw-uk-14-day-magic@2027-02-07,uor-uk-three-park-adventure@2027-02-07',
        q.get('tickets') ?? 'fehlt'
      );
      check(
        'Orlando · die Reisedaten kommen aus den Tickets (erster Tag bis Ende des längsten Fensters)',
        q.get('from') === '2027-02-07' && q.get('to') === '2027-02-24',
        `${q.get('from')} – ${q.get('to')}`
      );
      await page.getByRole('button', { name: 'Step 1, Dates' }).click();
      await page.locator(`${WIZARD} [data-plan-ticket-key]`).waitFor();
      const key = await page.locator(`${WIZARD} [data-plan-ticket-key]`).innerText();
      const bars = await page
        .locator(`${WIZARD} [data-plan-date="2027-02-10"] [data-plan-ticket-bar]`)
        .count();
      check(
        'Orlando · die Fenster liegen als Balken unter den Daten, mit Legende',
        key.includes('Disney ticket') && key.includes('Universal ticket') && bars === 2,
        `${key.replace(/\n/g, ' · ')}, ${bars} Balken am 10.`
      );
      await page.locator(`${WIZARD} [data-wizard-show-plan]`).click();
      await page.locator(WIZARD).waitFor({ state: 'detached' });
      const card = page.locator('[data-plan-tickets-card]').last();
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
    }
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
    await page
      .waitForFunction(
        () =>
          document
            .querySelector('[data-plan-tickets-card]')
            ?.textContent?.includes('Three Park Adventure'),
        null,
        { timeout: PLAN_TIMEOUT }
      )
      .catch(() => {});
    const owned = await page.locator('[data-plan-tickets-card]').innerText();
    check(
      'Orlando · ein kopierter Link öffnet dieselben Tickets, ohne die Adresse umzuschreiben',
      page.url() === ownerLink &&
        owned.includes('14-Day Magic Ticket') &&
        owned.includes('Three Park Adventure'),
      owned.slice(0, 160)
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
      'Orlando · und die Karte liest das Ticket aus ihm',
      (await page.locator('[data-plan-tickets-card]').innerText()).includes('Disney'),
      (await page.locator('[data-plan-tickets-card]').innerText()).slice(0, 120)
    );
    await context.close();
  }

  // ── Plan first: a ticket per resort, its rules, the hopper per resort ─────────
  // A trip three weeks out, where the calendar knows the evenings the hopper verdict counts.
  const from = addDays(orlandoToday(), 21);
  const firstPath = `/en/orlando?from=${from}&to=${addDays(from, 8)}#planner`;
  {
    // A browser that names its languages, as a visitor's does: the purchase links read them.
    const { context, page } = await open(PHONE, { answer: 'no', locale: 'en-GB' });
    await ready(page, firstPath);
    const card = page.locator('[data-plan-tickets-card="suggested"]');
    await card.waitFor({ timeout: PLAN_TIMEOUT });
    const tickets = card.locator('[data-plan-suggestion]');
    const count = await tickets.count();
    let complete = count > 0;
    for (let i = 0; i < count; i++) {
      const ticket = tickets.nth(i);
      complete &&=
        (await ticket.locator('[data-plan-suggestion-product]').count()) === 1 &&
        (await ticket.locator('[data-plan-suggestion-day]').count()) > 0 &&
        (await ticket.locator('[data-plan-purchase-links] [data-ticket-link]').count()) > 0;
    }
    check(
      'Orlando · Plan first: Satz, dann ein Ticket pro Resort mit Produkt, Parktagen und Kauf-Links, ohne Klappe davor',
      complete && (await card.locator('[data-plan-ticket-sentence]').count()) === 1,
      `${count} Tickets`
    );
    const buy = await card.locator('[data-ticket-link]').first().boundingBox();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    check(
      'Orlando · auf dem Telefon sind die Kauf-Links 44 px hohe Knöpfe im Bild, ohne Querscrollen',
      buy !== null && buy.height >= 44 && buy.x + buy.width <= 390 && width <= 390,
      buy
        ? `${Math.round(buy.height)} px hoch, rechts bei ${Math.round(buy.x + buy.width)}`
        : 'kein Link'
    );
    await context.close();
  }
  {
    const { context, page } = await open(DESK, { answer: 'no' });
    await ready(page, firstPath);
    const card = page.locator('[data-plan-tickets-card="suggested"]');
    await card.waitFor({ timeout: PLAN_TIMEOUT });
    const facts = card.locator('[data-plan-ticket-facts]').first();
    if ((await facts.count()) > 0) {
      const resort = await facts.getAttribute('data-plan-ticket-facts');
      await facts.locator('summary').click();
      check(
        'Orlando · „How the ticket works“ klappt die Regeln des Tickets an Ort und Stelle auf',
        (await facts.getAttribute('open')) !== null
      );
      const opened = await events(page, 'trip_ticket_details_opened');
      check(
        'Orlando · Ereignis trip_ticket_details_opened mit dem Resort',
        opened.length === 1 && opened[0].resort === resort && opened[0].region === 'orlando',
        JSON.stringify(opened)
      );
    }
    const toggles = card.locator('[data-plan-hopper-toggle]');
    const count = await toggles.count();
    if (count === 0) {
      check(
        'Orlando · „Plan with Park Hopper“ erscheint, wo der Hopper etwas bringt',
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
        'Orlando · „Plan with Park Hopper“ setzt hopper= nur für dieses Resort',
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
        'Orlando · und heißt danach „Plan without …“',
        (await page.locator(`[data-plan-hopper-toggle="${resort}"]`).innerText()).startsWith(
          'Plan without'
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
    // `orderTicketLinks` puts the visitor's own store first, so the stub's place is the list's.
    const position = await sponsored.evaluate(
      (el) =>
        [
          ...(el.closest('[data-plan-purchase-links]') ?? document).querySelectorAll(
            '[data-ticket-link]'
          ),
        ].indexOf(el) + 1
    );
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
        counted[0].props.position === position &&
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
        (await page
          .locator('[data-plan-chip="outside_ticket"], [data-plan-marker="outside_ticket"]')
          .count()) >= 1,
      await warning.innerText()
    );
    await warning.getByRole('button', { name: 'Change ticket' }).click();
    await page
      .waitForFunction(() => document.activeElement?.hasAttribute('data-ticket-start'), null, {
        timeout: 10_000,
      })
      .catch(() => {});
    check(
      'Orlando · „Change ticket“ öffnet das Ticket mit dem Fokus auf seinem ersten Tag',
      await page.evaluate(() => document.activeElement?.hasAttribute('data-ticket-start'))
    );
    await page.keyboard.press('Escape');
    await page.locator(WIZARD).waitFor({ state: 'detached' });
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
      // Which park the plan puts outside the ticket is the plan's; one of the seven goes.
      (query(page).get('parks') ?? '').split(',').length === 6,
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
