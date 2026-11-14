'use client';

import { useTranslations } from 'next-intl';
import { ShoppingBag, Ticket } from 'lucide-react';
import { setTickets } from '@/lib/trip-regions/plan-tickets';
import { tripTicketAnswer } from '@/lib/trip-regions/ticket-answer';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import { usePlanContext } from '../../planner/plan-context';
import { PlanTickets } from '../../planner/plan-tickets';
import { PlanTicketsCard } from '../../planner/plan-tickets-card';
import { useStatePlan } from '../../planner/use-trip-plan';
import { useWizardFrame, type WizardStepProps } from '../wizard-step';

/**
 * The last step, "Do you have tickets yet?": two big answers. "Not yet", the default, shows what the
 * plan needs, the tickets card the result shows too (`PlanTicketsCard`: per resort its days and,
 * where it pays, the hopper); "Yes, bought already" opens the planner's ticket step under it
 * (`PlanTickets`), and the plan then keeps to the tickets' dates. Going back to "Not yet" takes the
 * tickets entered here out of the plan again.
 */
export function TicketsStep({ askId }: WizardStepProps) {
  const t = useTranslations('tripPlanner.wizard.tickets');
  const { region, update, tickets: catalog, today, state } = usePlanContext();
  const { ticketStep, defaultMonth, edit } = useWizardFrame();
  const plan = useStatePlan();
  const owned = ticketStep.answer === 'yes';

  return (
    <div className="flex flex-col gap-5">
      <WizardOptionGroup labelledBy={askId} className="grid-cols-2">
        <WizardOptionCard
          size="tile"
          checked={!owned}
          onSelect={() => {
            tripTicketAnswer(region.slug).set('no');
            if (state.tickets.length > 0) update((s) => setTickets(s, [], catalog, today));
          }}
          icon={ShoppingBag}
          title={t('notYet')}
          hint={t('notYetHint')}
          data-wizard-tickets="no"
        />
        <WizardOptionCard
          size="tile"
          checked={owned}
          onSelect={() => ticketStep.open('wizard')}
          icon={Ticket}
          title={t('owned')}
          hint={t('ownedHint')}
          data-wizard-tickets="yes"
        />
      </WizardOptionGroup>
      {owned ? (
        <PlanTickets step={ticketStep} defaultMonth={defaultMonth} />
      ) : (
        plan.data && <PlanTicketsCard plan={plan.data} edit={edit} />
      )}
    </div>
  );
}
