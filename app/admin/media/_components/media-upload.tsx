'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, MapPin, Upload, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ADMIN_PASS_HEADER, useAdmin } from '../../_lib/admin-context';
import {
  ParkRidePicker,
  type PickerMode,
  type PickerResult,
} from '../../blog-editor/_components/park-ride-picker';
import type { AnalyzedFile, Assignment, Vocabulary } from '../_lib/types';
import { analyzePayload, fitForCommit } from '../_lib/upload-transport';
import { UploadWalkthrough } from './upload-walkthrough';

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

  /** Which photo of the queue is on screen, and whether the queue is done. */
  const [cursor, setCursor] = useState(0);
  const [stage, setStage] = useState<'walk' | 'review'>('walk');
  const [picker, setPicker] = useState<PickerMode | null>(null);

  // Created once per batch and revoked on unmount. Calling createObjectURL in
  // render, as this used to, mints a new URL — and leaks the old one — on every
  // keystroke in every field.
  const blobUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => blobUrls.forEach((url) => URL.revokeObjectURL(url)), [blobUrls]);

  const analyze = useCallback(
    async (incoming: File[]) => {
      const images = incoming.filter((f) => f.type.startsWith('image/'));
      if (!images.length) return;
      setBusy(`Reading ${images.length} file${images.length === 1 ? '' : 's'}…`);
      setError(null);
      try {
        // One request per file. The batch used to go up as a single multipart, which
        // meant a handful of photos exceeded the ~4.5 MB body limit and the whole
        // drop failed — see `_lib/upload-transport.ts`.
        const analyzed: AnalyzedFile[] = [];
        for (const [index, file] of images.entries()) {
          setBusy(`Reading ${index + 1} of ${images.length}…`);
          const form = new FormData();
          form.append('files', analyzePayload(file), file.name);
          const response = await fetch('/api/admin/media/analyze', {
            method: 'POST',
            headers: { [ADMIN_PASS_HEADER]: pass },
            body: form,
          });
          const one = await response.json();
          if (!response.ok) throw new Error(one.error ?? `Analysis failed for ${file.name}`);
          analyzed.push(...(one.files as AnalyzedFile[]));
        }
        const data = { files: analyzed };

        setFiles(images);
        setAnalysis(data.files);
        setCursor(0);
        setStage('walk');
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
            focus: null,
            skip: false,
            done: false,
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

  const goNext = useCallback(() => {
    setAssignments((all) => all.map((a, i) => (i === cursor ? { ...a, done: true } : a)));
    setCursor((c) => {
      if (c + 1 < assignments.length) return c + 1;
      setStage('review');
      return c;
    });
  }, [cursor, assignments.length]);

  const goBack = useCallback(() => setCursor((c) => Math.max(0, c - 1)), []);

  /** Skip marks the decision and moves on — it is not a way out of the queue. */
  const skipCurrent = useCallback(() => {
    setAssignments((all) => all.map((a, i) => (i === cursor ? { ...a, skip: !a.skip } : a)));
  }, [cursor]);

  /** A pick from the shared catalog picker, applied to the photo on screen. */
  const applyPick = (result: PickerResult) => {
    const segments = result.refKey
      .replace(/^\/parks\//, '')
      .split('/')
      .filter(Boolean);
    const rideIndex = segments.indexOf('attractions');
    const parkSegments = rideIndex >= 0 ? segments.slice(0, rideIndex) : segments.slice(0, 4);
    if (result.kind === 'park') {
      update(cursor, { park: parkSegments[3] ?? null });
    } else {
      update(cursor, {
        ride: segments[segments.length - 1] ?? null,
        park: result.parentParkSlug ?? parkSegments[3] ?? null,
      });
    }
    setPicker(null);
  };

  async function commit() {
    const queued = assignments
      .map((assignment, index) => ({ assignment, index }))
      .filter(({ assignment }) => !assignment.skip);

    const missing = queued.filter(({ assignment }) => !assignment.collection || !assignment.name);
    if (missing.length) {
      setError(`${missing.length} file(s) still need a collection and a name.`);
      return;
    }

    setError(null);
    let landed = 0;
    let pullRequest: string | null = null;
    let joined = false;
    const shrunk: string[] = [];

    try {
      // ONE REQUEST PER IMAGE, in order. A batch in a single body is what exceeded
      // the ~4.5 MB serverless limit; sequential is what lets the first request open
      // the session pull request and the rest find and join it instead of racing to
      // open their own. See `_lib/upload-transport.ts`.
      for (const { assignment, index } of queued) {
        setBusy(`Committing ${landed + 1} of ${queued.length}…`);

        // Only now, after `analyze` has already read the original's EXIF: the
        // re-encode strips it, so `gps` and `shotAt` are written into the sidecar
        // explicitly rather than left for the build to re-read off the file.
        const { file, shrunk: wasShrunk } = await fitForCommit(files[index]);
        if (wasShrunk) shrunk.push(assignment.name);
        const exif = analysis[index];

        const response = await fetch('/api/admin/media/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', [ADMIN_PASS_HEADER]: pass },
          body: JSON.stringify({
            title: `media: add ${assignment.name}`,
            // Only the FIRST image may start a new pull request; the rest join
            // whatever it opened, or the session that was already running.
            newSession: landed === 0 ? newSession : false,
            operations: [
              {
                op: 'create' as const,
                collection: assignment.collection,
                name: assignment.name,
                ext: wasShrunk ? 'jpg' : assignment.ext,
                contentBase64: await readAsBase64(file),
                sidecar: {
                  park: assignment.park,
                  ride: assignment.ride,
                  area: assignment.area,
                  tags: assignment.tags,
                  roles: assignment.roles,
                  alt: assignment.alt ? { de: assignment.alt } : {},
                  caption: assignment.caption ? { de: assignment.caption } : {},
                  shotAt: assignment.shotAt,
                  focus: assignment.focus,
                  gps: wasShrunk && exif?.gps ? { lat: exif.gps.lat, lon: exif.gps.lon } : null,
                },
              },
            ],
          }),
        });
        const data = await response.json();
        if (!response.ok && response.status !== 207) {
          throw new Error(
            `${assignment.name}: ${data.error ?? 'commit failed'}` +
              (landed ? ` — ${landed} image${landed === 1 ? '' : 's'} already landed.` : '')
          );
        }
        pullRequest = data.pullRequest ?? pullRequest;
        joined = joined || Boolean(data.joinedSession);
        landed++;
      }

      if (shrunk.length) {
        console.info(
          `[media] resized to fit the upload limit: ${shrunk.join(', ')} — GPS and capture date were carried into the sidecar.`
        );
      }
      onDone(pullRequest, joined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const pending = assignments.filter((a) => !a.skip).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="bg-background ring-border flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl shadow-2xl ring-1">
        <header className="border-border/70 flex shrink-0 items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            {analysis.length === 0
              ? 'Add images'
              : stage === 'walk'
                ? 'Going through the batch'
                : `Ready to commit — ${pending} of ${analysis.length}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 lg:overflow-hidden">
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
          ) : stage === 'walk' ? (
            <UploadWalkthrough
              key={cursor}
              index={cursor}
              file={analysis[cursor]}
              blobUrl={blobUrls[cursor]}
              assignment={assignments[cursor]}
              vocabulary={vocabulary}
              total={analysis.length}
              doneCount={assignments.filter((a) => a.done).length}
              onChange={(patch) => update(cursor, patch)}
              onBack={goBack}
              onNext={goNext}
              onSkip={skipCurrent}
              onPickPark={() => setPicker('park')}
              onPickRide={() => setPicker('ride')}
            />
          ) : (
            <div className="min-h-0 space-y-3 lg:overflow-y-auto">
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
                        src={blobUrls[index]}
                        alt=""
                        className="aspect-square w-full rounded object-cover"
                        style={{
                          objectPosition: assignment.focus
                            ? `${assignment.focus.x * 100}% ${assignment.focus.y * 100}%`
                            : '50% 50%',
                        }}
                      />
                      <p className="text-muted-foreground mt-1 text-[10px]">
                        {file.width}×{file.height}
                      </p>
                    </div>

                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-xs">{file.name}</span>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCursor(index);
                              setStage('walk');
                            }}
                            className="border-border hover:bg-muted rounded border px-2 py-0.5 text-[11px]"
                          >
                            Revisit
                          </button>
                          <button
                            type="button"
                            onClick={() => update(index, { skip: !assignment.skip })}
                            className="border-border hover:bg-muted rounded border px-2 py-0.5 text-[11px]"
                          >
                            {assignment.skip ? 'Include' : 'Skip'}
                          </button>
                        </div>
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
                        {file.shotAt && (
                          <span className="text-muted-foreground">{file.shotAt}</span>
                        )}
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

          {busy && analysis.length === 0 && (
            <p className="text-muted-foreground mt-3 text-center text-xs">{busy}</p>
          )}
        </div>

        {analysis.length > 0 && stage === 'review' && (
          <footer className="border-border/70 bg-muted/30 flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3">
            <div className="text-muted-foreground text-xs">
              <p>
                {pending} of {analysis.length} land in one draft pull request.
              </p>
              {assignments.some((a) => !a.focus && !a.skip) && (
                <p className="text-amber-500">
                  {assignments.filter((a) => !a.focus && !a.skip).length} without a focal point —
                  they crop from the centre.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCursor(0);
                  setStage('walk');
                }}
                className="border-border hover:bg-muted rounded-lg border px-3 py-2 text-sm"
              >
                Go through them again
              </button>
              <button
                type="button"
                onClick={commit}
                disabled={Boolean(busy) || pending === 0}
                className="bg-foreground text-background rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ?? `Commit ${pending} image${pending === 1 ? '' : 's'}`}
              </button>
            </div>
          </footer>
        )}

        <ParkRidePicker mode={picker} onPick={applyPick} onClose={() => setPicker(null)} />
      </div>
    </div>
  );
}
