'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, MapPin, Upload, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ADMIN_PASS_HEADER, useAdmin } from '../../_lib/admin-context';
import type { AnalyzedFile, Assignment, Vocabulary } from '../_lib/types';

/**
 * Drop a hundred photos in, correct what the GPS got wrong, open one pull request.
 *
 * The flow is deliberately two-stage. Dropping files only *analyzes* them: the
 * server reads each file's EXIF and answers where it was taken. The park comes
 * back filled in (the nearest park is right ~89 % of the time and parks are
 * kilometres apart), the ride comes back as a distance-ranked shortlist and NOT a
 * decision — the nearest attraction is the right one only ~55 % of the time, so
 * auto-picking it would mislabel half the batch while looking reviewed.
 *
 * Nothing is written until "Commit": then the files and the corrected assignments
 * go to `/api/admin/media/commit`, which lands them in the repository as a draft PR.
 */

const INPUT =
  'border-border bg-background focus:border-foreground w-full rounded-md border px-2 py-1 text-xs outline-none';

/** `DSC_0042 (1).JPG` → `dsc-0042-1` — the id half of a media path. */
function toSlug(fileName: string): string {
  return (
    fileName
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image'
  );
}

function extOf(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
  return ext === 'jpeg' ? 'jpg' : ext;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

interface Props {
  vocabulary: Vocabulary;
  /** Open a fresh pull request instead of joining the running session. */
  newSession?: boolean;
  onDone: (pullRequestUrl: string | null, joinedSession?: boolean) => void;
  onClose: () => void;
}

export function MediaUpload({ vocabulary, newSession, onDone, onClose }: Props) {
  const { pass } = useAdmin();
  const [files, setFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<AnalyzedFile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback(
    async (incoming: File[]) => {
      const images = incoming.filter((f) => f.type.startsWith('image/'));
      if (!images.length) return;
      setBusy(`Reading ${images.length} file${images.length === 1 ? '' : 's'}…`);
      setError(null);
      try {
        const form = new FormData();
        for (const file of images) form.append('files', file);
        const response = await fetch('/api/admin/media/analyze', {
          method: 'POST',
          headers: { [ADMIN_PASS_HEADER]: pass },
          body: form,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Analysis failed');

        setFiles(images);
        setAnalysis(data.files);
        setAssignments(
          (data.files as AnalyzedFile[]).map((f) => ({
            // The park is proposed as an answer; the ride deliberately is not.
            collection: f.suggestion.park?.slug ?? '',
            name: toSlug(f.name),
            ext: extOf(f.name),
            park: f.suggestion.park?.confidence === 'confident' ? f.suggestion.park.slug : null,
            ride: null,
            area: null,
            tags: ['photo'],
            roles: [],
            alt: '',
            caption: '',
            shotAt: f.shotAt,
            skip: false,
          }))
        );
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [pass]
  );

  const update = (index: number, patch: Partial<Assignment>) =>
    setAssignments((all) => all.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  async function commit() {
    const queued = assignments
      .map((assignment, index) => ({ assignment, index }))
      .filter(({ assignment }) => !assignment.skip);

    const missing = queued.filter(({ assignment }) => !assignment.collection || !assignment.name);
    if (missing.length) {
      setError(`${missing.length} file(s) still need a collection and a name.`);
      return;
    }

    setBusy(`Committing ${queued.length} image${queued.length === 1 ? '' : 's'}…`);
    setError(null);
    try {
      const operations = await Promise.all(
        queued.map(async ({ assignment, index }) => ({
          op: 'create' as const,
          collection: assignment.collection,
          name: assignment.name,
          ext: assignment.ext,
          contentBase64: await readAsBase64(files[index]),
          sidecar: {
            park: assignment.park,
            ride: assignment.ride,
            area: assignment.area,
            tags: assignment.tags,
            roles: assignment.roles,
            alt: assignment.alt ? { de: assignment.alt } : {},
            caption: assignment.caption ? { de: assignment.caption } : {},
            shotAt: assignment.shotAt,
          },
        }))
      );

      const response = await fetch('/api/admin/media/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [ADMIN_PASS_HEADER]: pass },
        body: JSON.stringify({
          title: `media: add ${operations.length} images`,
          newSession,
          operations,
        }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 207) throw new Error(data.error ?? 'Commit failed');
      onDone(data.pullRequest ?? null, data.joinedSession);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const pending = assignments.filter((a) => !a.skip).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-background border-border mx-auto max-w-5xl rounded-xl border p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Add images</h2>
          <button type="button" onClick={onClose} className="hover:bg-muted rounded p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {analysis.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            // Moving over the icon or the copy fires dragleave on the zone too;
            // without the relatedTarget check the highlight flickers off as soon
            // as the pointer crosses a child.
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void analyze(Array.from(e.dataTransfer.files));
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-12 text-center transition-colors',
              dragging ? 'border-foreground bg-muted/50' : 'border-border hover:border-foreground'
            )}
          >
            <Upload className="text-muted-foreground h-8 w-8" />
            <p className="text-sm font-medium">Drop photos here, or click to choose</p>
            <p className="text-muted-foreground max-w-md text-xs">
              Each file is read for its GPS tag and capture date. The park is filled in
              automatically where the coordinates are unambiguous; the ride is offered as a
              shortlist because the nearest attraction is only right about half the time.
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void analyze(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {analysis.map((file, index) => {
              const assignment = assignments[index];
              if (!assignment) return null;
              return (
                <div
                  key={`${file.name}-${index}`}
                  className={cn(
                    'border-border grid grid-cols-[80px_minmax(0,1fr)] gap-3 rounded-lg border p-3',
                    assignment.skip && 'opacity-40'
                  )}
                >
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local blob, never optimized */}
                    <img
                      src={URL.createObjectURL(files[index])}
                      alt=""
                      className="aspect-square w-full rounded object-cover"
                    />
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      {file.width}×{file.height}
                    </p>
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => update(index, { skip: !assignment.skip })}
                        className="border-border hover:bg-muted shrink-0 rounded border px-2 py-0.5 text-[11px]"
                      >
                        {assignment.skip ? 'Include' : 'Skip'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {file.lowRes && (
                        <span className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300">
                          <AlertTriangle className="h-3 w-3" />
                          below {vocabulary.lowResLongEdge}px
                        </span>
                      )}
                      {file.gps ? (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {file.suggestion.park
                            ? `${file.suggestion.park.name} · ${file.suggestion.park.distanceLabel}`
                            : 'no park nearby'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">no GPS — assign manually</span>
                      )}
                      {file.shotAt && <span className="text-muted-foreground">{file.shotAt}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <input
                        className={INPUT}
                        placeholder="collection"
                        list="upload-collections"
                        value={assignment.collection}
                        onChange={(e) => update(index, { collection: e.target.value })}
                      />
                      <input
                        className={INPUT}
                        placeholder="file name"
                        value={assignment.name}
                        onChange={(e) => update(index, { name: e.target.value })}
                      />
                      <input
                        className={INPUT}
                        placeholder="park"
                        value={assignment.park ?? ''}
                        onChange={(e) => update(index, { park: e.target.value || null })}
                      />
                      <input
                        className={INPUT}
                        placeholder="ride"
                        value={assignment.ride ?? ''}
                        onChange={(e) => update(index, { ride: e.target.value || null })}
                      />
                    </div>

                    {file.suggestion.rides.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-muted-foreground text-[11px]">Nearest rides:</span>
                        {file.suggestion.rides.map((ride) => (
                          <button
                            key={ride.slug}
                            type="button"
                            onClick={() =>
                              update(index, {
                                ride: ride.slug,
                                area: ride.area,
                                park: assignment.park ?? file.suggestion.park?.slug ?? null,
                              })
                            }
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-[11px]',
                              assignment.ride === ride.slug
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border text-muted-foreground hover:border-foreground'
                            )}
                          >
                            {ride.name}
                            <span className="opacity-60"> · {ride.distanceLabel}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <input
                      className={INPUT}
                      placeholder="Alt text (German)"
                      value={assignment.alt}
                      onChange={(e) => update(index, { alt: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}

            <datalist id="upload-collections">
              {vocabulary.collections.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {error}
          </p>
        )}

        {analysis.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              {pending} of {analysis.length} will be committed as one draft pull request.
            </p>
            <button
              type="button"
              onClick={commit}
              disabled={Boolean(busy) || pending === 0}
              className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {busy ?? `Commit ${pending} image${pending === 1 ? '' : 's'}`}
            </button>
          </div>
        )}

        {busy && analysis.length === 0 && (
          <p className="text-muted-foreground mt-3 text-center text-xs">{busy}</p>
        )}
      </div>
    </div>
  );
}
