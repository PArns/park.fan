'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Eye, Pencil, Plus, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  TICKETS_QUERY_KEY,
  formatTicketDays,
  formatTicketLinks,
  formatTicketSale,
  groupTicketsByResort,
  sortTicketProducts,
  ticketCatalogKey,
  ticketCatalogPath,
  ticketClicks,
  ticketOrderAfterMove,
  type AdminTicketCatalog,
  type AdminTicketProduct,
} from '@/lib/admin/tickets';
import { ORLANDO_REGION } from '@/lib/orlando/types';
import { cn } from '@/lib/utils';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { useCan } from '../_app/session';
import { SYSTEM_MONO } from '../_ui/code-block';
import { MoveButtons, TextInput } from '../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from '../_ui/primitives';
import { useToast } from '../_ui/toast';
import { ClickFigure } from './_components/click-figure';
import { TicketEditor, type TicketClickState } from './_components/ticket-editor';
import { useTicketClicks, useTripRegion } from './_lib/use-ticket-data';

/**
 * The ticket catalog of the Orlando planner: every product with the rules the plan computes with
 * and where it is bought, kept here instead of in a deploy. Reading needs any role, every write
 * `editor`; the API checks each write whole and plans a sample trip with it before it saves.
 */
export default function TicketsPage() {
  const region = ORLANDO_REGION;
  const canEdit = useCan('editor');
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const client = useQueryClient();
  const catalog = useAdminQuery<AdminTicketCatalog>(
    ticketCatalogKey(region),
    ticketCatalogPath(region)
  );
  const tripRegion = useTripRegion(region);
  const products = useMemo(
    () => sortTicketProducts(catalog.data?.tickets ?? []),
    [catalog.data?.tickets]
  );
  const clicks = useTicketClicks(products);
  const groups = useMemo(
    () => groupTicketsByResort(products, tripRegion.data?.groups ?? []),
    [products, tripRegion.data?.groups]
  );
  const [editing, setEditing] = useState<AdminTicketProduct | 'new' | null>(null);
  // Kept after the dialog closes, so its text does not change while it fades out.
  const [archiving, setArchiving] = useState<AdminTicketProduct | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [moving, setMoving] = useState(false);

  async function move(slug: string, direction: -1 | 1) {
    const order = ticketOrderAfterMove(products, slug, direction);
    if (!order || moving) return;
    setMoving(true);
    // The list moves at once; the answer, or a refusal, sets it right afterwards.
    client.setQueryData<AdminTicketCatalog>(ticketCatalogKey(region), (data) =>
      data
        ? {
            ...data,
            tickets: data.tickets.map((ticket) => ({
              ...ticket,
              sortOrder: order.indexOf(ticket.slug),
            })),
          }
        : data
    );
    try {
      await adminFetch(ticketCatalogPath(region, 'order'), {
        method: 'PUT',
        body: { slugs: order },
      });
    } catch (err) {
      toast.push({
        title: 'Reihenfolge nicht gespeichert',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      invalidate(TICKETS_QUERY_KEY);
      setMoving(false);
    }
  }

  async function archive(product: AdminTicketProduct, why: string) {
    try {
      await adminFetch(ticketCatalogPath(region, product.slug, 'archive'), {
        method: 'POST',
        body: why.trim() ? { reason: why.trim() } : {},
      });
      invalidate(TICKETS_QUERY_KEY);
      toast.push({ title: `„${product.name}“ archiviert`, tone: 'success' });
    } catch (err) {
      toast.push({
        title: 'Archivieren fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    }
  }

  async function restore(product: AdminTicketProduct) {
    try {
      await adminFetch(ticketCatalogPath(region, product.slug), {
        method: 'PATCH',
        body: { active: true },
      });
      invalidate(TICKETS_QUERY_KEY);
      toast.push({ title: `„${product.name}“ ist wieder im Katalog`, tone: 'success' });
    } catch (err) {
      toast.push({
        title: 'Wieder aufnehmen fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    }
  }

  const regionReady = tripRegion.isSuccess;

  return (
    <AdminPage>
      <Panel>
        <PanelHeader
          icon={Ticket}
          title="Tickets für Orlando"
          hint={
            catalog.data
              ? `${products.filter((product) => product.active).length} im Katalog, ${products.filter((product) => !product.active).length} archiviert. Der Planer rechnet sofort mit einer Änderung, die Website zeigt sie nach spätestens 15 Minuten.`
              : 'Was der Urlaubsplaner über Tickets weiß: Produkte, Regeln und wo man sie kauft.'
          }
          action={
            canEdit ? (
              <Button
                size="sm"
                variant="outline"
                disabled={!regionReady}
                onClick={() => setEditing('new')}
              >
                <Plus className="h-4 w-4" /> Neues Ticket
              </Button>
            ) : null
          }
        />
        {catalog.isError ? (
          <ErrorState message={catalog.error.message} onRetry={() => void catalog.refetch()} />
        ) : catalog.isLoading ? (
          <SkeletonRows rows={6} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="Noch keine Tickets"
            description="Die API legt den Katalog beim ersten Start aus ihrer eigenen Liste an. Weitere Tickets kommen über „Neues Ticket“ dazu."
          />
        ) : (
          <PanelBody className="space-y-6">
            {!canEdit && (
              <p className="text-muted-foreground text-xs">
                Dein Konto darf lesen, aber nicht kuratieren.
              </p>
            )}
            {tripRegion.isError && (
              <p className="text-xs text-amber-300">
                Die Parks der Region ließen sich nicht laden ({tripRegion.error.message}); die
                Resorts stehen unter ihrem Schlüssel, und bearbeiten geht erst wieder mit ihnen.
              </p>
            )}
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`resort-${group.key}`}>
                <h3
                  id={`resort-${group.key}`}
                  className="text-muted-foreground mb-2 text-xs font-medium"
                >
                  {group.name} · {group.products.length}
                </h3>
                <ul className="space-y-2">
                  {group.products.map((product, index) => (
                    <TicketRow
                      key={product.slug}
                      product={product}
                      clicks={clicks}
                      canEdit={canEdit}
                      canOpen={regionReady}
                      onUp={
                        canEdit && index > 0 && !moving ? () => void move(product.slug, -1) : null
                      }
                      onDown={
                        canEdit && index < group.products.length - 1 && !moving
                          ? () => void move(product.slug, 1)
                          : null
                      }
                      onOpen={() => setEditing(product)}
                      onArchive={() => {
                        setArchiving(product);
                        setReason('');
                        setConfirming(true);
                      }}
                      onRestore={() => void restore(product)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </PanelBody>
        )}
      </Panel>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        icon={Archive}
        title={`„${archiving?.name ?? ''}“ archivieren?`}
        description="Das Ticket verschwindet aus dem Katalog des Planers und wird nicht mehr vorgeschlagen. Geteilte Pläne, die es nennen, rechnen weiter damit und sagen, dass es archiviert ist. Du kannst es jederzeit wieder aufnehmen."
        confirmLabel="Archivieren"
        cancelLabel="Abbrechen"
        onConfirm={() => archiving && void archive(archiving, reason)}
      >
        <TextInput
          aria-label="Warum? Steht im Änderungsprotokoll."
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Warum? (steht im Änderungsprotokoll)"
        />
      </ConfirmDialog>

      {editing && tripRegion.data && (
        <TicketEditor
          region={region}
          product={editing === 'new' ? null : editing}
          groups={tripRegion.data.groups}
          parks={tripRegion.data.parks}
          canEdit={canEdit}
          clicks={clicks}
          onClose={() => setEditing(null)}
        />
      )}
    </AdminPage>
  );
}

/** One product as the list shows it: name and state, its days, sale, links and clicks. */
function TicketRow({
  product,
  clicks,
  canEdit,
  canOpen,
  onUp,
  onDown,
  onOpen,
  onArchive,
  onRestore,
}: {
  product: AdminTicketProduct;
  clicks: TicketClickState;
  canEdit: boolean;
  /** The form needs the region's parks; until they are there it cannot open. */
  canOpen: boolean;
  onUp: (() => void) | null;
  onDown: (() => void) | null;
  onOpen: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const archived = !product.active;
  const partner = product.links.some((link) => link.sponsored);
  const total = ticketClicks(product, clicks.byHost, clicks.bySeller).total;
  const iconButton = 'text-muted-foreground hover:text-foreground rounded p-1.5 max-sm:p-3';
  return (
    // On a phone the name and the details take the card's width and the buttons get a line of
    // their own; from `sm` the buttons sit on the name's line.
    <li className="border-border/60 bg-card/40 flex flex-wrap items-start gap-x-3 rounded-lg border px-3 py-2.5">
      <p
        className={cn(
          'flex min-w-0 flex-1 basis-full flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:basis-0',
          archived && 'opacity-60'
        )}
      >
        <span className="min-w-0 font-medium">{product.name}</span>
        {archived && <Chip>archiviert</Chip>}
        {!archived && product.suggestRank !== null && (
          <Chip
            tone="primary"
            className="tabular-nums"
          >{`Vorschlag, Rang ${product.suggestRank}`}</Chip>
        )}
        {partner && <Chip tone="warning">Partnerlink</Chip>}
        {product.confidence === 'low' && <Chip tone="warning">Regeln unsicher</Chip>}
      </p>
      <div className="-my-1 -mr-1 flex shrink-0 max-sm:order-last max-sm:mt-1 max-sm:w-full max-sm:justify-end">
        {canEdit && <MoveButtons name={product.name} onUp={onUp} onDown={onDown} />}
        <button
          type="button"
          onClick={onOpen}
          disabled={!canOpen}
          aria-label={`${product.name} ${canEdit ? 'bearbeiten' : 'ansehen'}`}
          className={cn(iconButton, 'disabled:opacity-30')}
        >
          {canEdit ? (
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Eye className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
        {canEdit &&
          (archived ? (
            <button
              type="button"
              onClick={onRestore}
              aria-label={`${product.name} wieder in den Katalog aufnehmen`}
              title="Wieder aufnehmen"
              className={iconButton}
            >
              <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={onArchive}
              aria-label={`${product.name} archivieren`}
              title="Archivieren"
              className={cn(iconButton, 'hover:text-destructive')}
            >
              <Archive className="h-3.5 w-3.5" aria-hidden />
            </button>
          ))}
      </div>
      <p
        className={cn(
          'text-muted-foreground mt-1 flex basis-full flex-wrap gap-x-3 gap-y-0.5 text-xs',
          archived && 'opacity-60'
        )}
      >
        <code className={cn(SYSTEM_MONO, 'break-all')}>{product.slug}</code>
        <span>{formatTicketDays(product)}</span>
        <span>{formatTicketSale(product)}</span>
        <span>{formatTicketLinks(product.links)}</span>
        <ClickFigure count={total} loading={clicks.loading} failed={clicks.failed} />
      </p>
    </li>
  );
}
