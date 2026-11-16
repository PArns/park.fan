'use client';

import { useState } from 'react';
import {
  KEY_EXPIRY_CHOICES,
  MAX_REQUESTS_PER_HOUR,
  keyExpiryDay,
  keyExpiryFrom,
  parseRequestsPerHour,
  type KeyExpiryChoice,
} from '@/lib/admin/api-keys';
import {
  PERMISSION_GROUP_OPTIONS,
  formatPermissions,
  permissionLabel,
} from '@/lib/admin/developer-labels';
import {
  API_PERMISSION_GROUPS,
  LEGACY_KEY_PERMISSIONS,
  sortPermissions,
  type ApiPermission,
} from '@/lib/developers/permissions';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { parkCatalogOptions, useParkCatalog } from '../../_lib/use-park-catalog';
import { Field, MultiSearchSelect, Select, TextInput, ToggleChips } from '../../_ui/controls';

/** The hourly allowance, as a number field that also takes German thousands points. */
export function LimitField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const invalid = parseRequestsPerHour(value) === undefined;
  return (
    <Field
      label="Anfragen pro Stunde"
      htmlFor={id}
      hint="Gezählt ab jeder vollen Stunde, zusätzlich zum allgemeinen Limit der API. Leer lassen, wenn der Key kein eigenes Limit haben soll."
      error={
        invalid
          ? `Eine ganze Zahl von 1 bis ${MAX_REQUESTS_PER_HOUR.toLocaleString('de-DE')} oder leer.`
          : null
      }
    >
      <TextInput
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="kein eigenes Limit"
        autoComplete="off"
        aria-invalid={invalid || undefined}
      />
    </Field>
  );
}

/**
 * The permissions a key carries, group by group: each group's permissions as toggles, and a button
 * that grants or takes the whole group. Against an API that does not store permissions yet it says
 * so instead: such a key opens everything (`LEGACY_KEY_PERMISSIONS`).
 */
export function PermissionsField({
  stored,
  value,
  onChange,
  requested,
}: {
  stored: boolean;
  value: ApiPermission[];
  onChange: (permissions: ApiPermission[]) => void;
  /** What a request asked for, marked so the owner sees what they add or take away. */
  requested?: readonly ApiPermission[];
}) {
  if (!stored) {
    return (
      <Field label="Berechtigungen">
        <p className="text-muted-foreground text-xs leading-snug">
          Die API speichert noch keine Berechtigungen. Jeder Key öffnet{' '}
          {formatPermissions(LEGACY_KEY_PERMISSIONS)}.
        </p>
      </Field>
    );
  }
  const asked = new Set(requested ?? []);
  return (
    <Field
      label="Berechtigungen"
      hint={
        requested
          ? 'Vorausgewählt ist, was der Antrag wollte; ein Punkt markiert es. Wartezeiten sind auch ohne Key offen.'
          : 'Was der Key öffnet. Wartezeiten sind auch ohne Key offen.'
      }
      error={value.length === 0 ? 'Mindestens eine Berechtigung.' : null}
    >
      <div className="divide-border/60 border-border/60 divide-y rounded-lg border">
        {PERMISSION_GROUP_OPTIONS.map((group) => {
          const members = API_PERMISSION_GROUPS[group.id];
          const held = members.filter((permission) => value.includes(permission));
          const all = held.length === members.length;
          return (
            <div key={group.id} className="space-y-2 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium">{group.label}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      sortPermissions(
                        all
                          ? value.filter((permission) => !members.includes(permission))
                          : [...value, ...members]
                      )
                    )
                  }
                  className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                >
                  {all ? 'keine' : 'alle'}
                </button>
              </div>
              <ToggleChips
                label={group.label}
                options={members.map((permission) => ({
                  value: permission,
                  label: `${permissionLabel(permission).title}${asked.has(permission) ? ' •' : ''}`,
                  title: permissionLabel(permission).description,
                }))}
                value={held}
                onChange={(next) =>
                  onChange(
                    sortPermissions([
                      ...value.filter((permission) => !members.includes(permission)),
                      ...next,
                    ])
                  )
                }
              />
            </div>
          );
        })}
      </div>
    </Field>
  );
}

/** Adds parks one at a time through the admin's park search; a chosen park is a chip to remove. */
export function ParksField({
  id,
  value,
  onChange,
  requested,
}: {
  id: string;
  value: string[];
  onChange: (ids: string[]) => void;
  /** The parks a key request named in its own words, to pick them from the list. */
  requested?: string;
}) {
  const parks = useParkCatalog();
  return (
    <Field
      label="Parks"
      htmlFor={id}
      hint={
        requested
          ? `Laut Antrag: ${requested}. Leer für alle Parks.`
          : 'Leer für alle Parks. Mit einer Auswahl öffnet der Key die Daten nur für diese Parks.'
      }
      error={parks.isError ? 'Die Parkliste ließ sich nicht laden.' : null}
    >
      <MultiSearchSelect
        id={id}
        value={value}
        onChange={onChange}
        options={parkCatalogOptions(parks.data?.parks ?? [])}
        placeholder={parks.isLoading ? 'Parks werden geladen…' : 'Park hinzufügen'}
        searchPlaceholder="Park suchen…"
        disabled={parks.isLoading || parks.isError}
        fuzzy="park"
      />
    </Field>
  );
}

/**
 * The end-date field's state: a lifetime, a day or never, and the date that stands for once the
 * clock is known. `unchanged` while it still says what `initial` said, so an edit can leave an
 * expired key's past date alone instead of sending it back to be refused.
 */
export function useKeyExpiry(initial: string | null) {
  const [choice, setChoice] = useState<KeyExpiryChoice>(initial ? 'date' : 'never');
  const [day, setDay] = useState(initial ? keyExpiryDay(initial) : '');
  const now = useMinuteNow();
  const unchanged =
    initial === null ? choice === 'never' : choice === 'date' && day === keyExpiryDay(initial);
  const expiresAt = unchanged
    ? initial
    : now === null
      ? undefined
      : keyExpiryFrom(choice, day, now);
  return { choice, setChoice, day, setDay, unchanged, expiresAt };
}

/** The end date: never, a lifetime, or a day of the owner's choosing. */
export function ExpiryField({
  id,
  expiry,
}: {
  id: string;
  expiry: ReturnType<typeof useKeyExpiry>;
}) {
  const past = expiry.choice === 'date' && expiry.day !== '' && expiry.expiresAt === undefined;
  return (
    <Field
      label="Gültig"
      htmlFor={id}
      hint="Ein Datum gilt einschließlich, bis Mitternacht deutscher Zeit. Ist der Key abgelaufen, verlängerst du ihn hier mit einem neuen Datum."
      error={past ? 'Dieser Tag ist schon vorbei.' : null}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          id={id}
          value={expiry.choice}
          allowEmpty={false}
          onValueChange={(value) =>
            expiry.setChoice((value as KeyExpiryChoice | null) ?? expiry.choice)
          }
          options={[...KEY_EXPIRY_CHOICES]}
        />
        {expiry.choice === 'date' && (
          <TextInput
            type="date"
            value={expiry.day}
            onChange={(event) => expiry.setDay(event.target.value)}
            aria-label="Gültig bis einschließlich"
            aria-invalid={past || undefined}
          />
        )}
      </div>
    </Field>
  );
}
