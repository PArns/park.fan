'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2, MapPin, Upload, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { FIELD_CLASS } from '../../_ui/controls';
import {
  ParkRidePicker,
  type PickerMode,
  type PickerResult,
} from '../../blog-editor/_components/park-ride-picker';
import type { AnalyzedFile, Assignment, Vocabulary } from '../_lib/types';
import { analyzePhoto, commitPhoto, toSlug, type PhotoSidecar } from '../../_lib/media-upload';
import { withoutMetadata } from '../../_lib/upload-transport';
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

/** One look for every field in the admin — see `FIELD_CLASS`. */
const INPUT = FIELD_CLASS;

/**
 * The batch dialog's own file-name rule. `toSlug`, `analyzePhoto` and `commitPhoto`
 * come from `admin/_lib/media-upload.ts`, which the field-capture route uses too —
 * a second copy here is how the two surfaces would start disagreeing about which
 * formats are acceptable and when EXIF has to be carried into the sidecar.
 */
function extOf(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
  return ext === 'jpeg' ? 'jpg' : ext;
}

/**
 * A batch that arrives with its files instead of a drop, and with part of the
 * answer already known — a visitor's submission names its park and ride, and
 * says who took the photos. The walkthrough still runs: the focal point, the
 * roles and the alt text need somebody to look at each picture either way.
 */
export interface UploadSeed {
  files: File[];
  /** Per file, laid over what the EXIF analysis proposed. */
  assignments: Array<Partial<Assignment>>;
  /** Written into every sidecar of the batch. */
  credit: NonNullable<PhotoSidecar['credit']>;
  /**
   * Re-encode before committing so no EXIF reaches `public/media/`, and keep the
   * GPS fix out of the sidecar. For photos somebody else took.
   */
  stripMetadata: boolean;
  /** Title of the pull request, should this batch be the one that opens it. */
  title: string;
}

/** One file of the batch that reached the media pull request. */
export interface LandedPhoto {
  /** Position in the batch, i.e. in `seed.files`. */
  index: number;
  /** `<collection>/<name>`. */
  id: string;
}

interface Props {
  vocabulary: Vocabulary;
  /** Open a fresh pull request instead of joining the running session. */
  newSession?: boolean;
  seed?: UploadSeed;
  onDone: (pullRequestUrl: string | null, joinedSession?: boolean, landed?: LandedPhoto[]) => void;
  onClose: () => void;
}

export function MediaUpload({ vocabulary, newSession, seed, onDone, onClose }: Props) {
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

  const analyze = useCallback(async (incoming: File[], presets?: Array<Partial<Assignment>>) => {
    const images = incoming.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    setBusy(`Reading ${images.length} file${images.length === 1 ? '' : 's'}…`);
    setError(null);
    try {
      // One request per file. The batch used to go up as a single multipart, which
      // meant a handful of photos exceeded the ~4.5 MB body limit and the whole
      // drop failed — see `admin/_lib/upload-transport.ts`.
      const analyzed: AnalyzedFile[] = [];
      for (const [index, file] of images.entries()) {
        setBusy(`Reading ${index + 1} of ${images.length}…`);
        analyzed.push(await analyzePhoto(file));
      }
      const data = { files: analyzed };

      setFiles(images);
      setAnalysis(data.files);
      setCursor(0);
      setStage('walk');
      setAssignments(
        (data.files as AnalyzedFile[]).map((f, index) => ({
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
          // What the caller already knows beats what the coordinates suggest: a
          // submission names its ride, and GPS only ranks candidates for one.
          ...presets?.[index],
        }))
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, []);

  // A seeded batch starts analyzing the moment the dialog opens. Once per
  // mount: Strict Mode runs effects twice, and a second pass would read every
  // file again and reset the walkthrough under the cursor.
  const seeded = useRef(false);
  useEffect(() => {
    if (!seed || seeded.current) return;
    seeded.current = true;
    void analyze(seed.files, seed.assignments);
  }, [seed, analyze]);

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
    const landedPhotos: LandedPhoto[] = [];

    try {
      // ONE REQUEST PER IMAGE, in order. A batch in a single body is what exceeded
      // the ~4.5 MB serverless limit; sequential is what lets the first request open
      // the session pull request and the rest find and join it instead of racing to
      // open their own. See `admin/_lib/upload-transport.ts`.
      for (const { assignment, index } of queued) {
        setBusy(`Committing ${landed + 1} of ${queued.length}…`);

        // `commitPhoto` owns the order of operations — transcode, then shrink,
        // then carry the analysis's EXIF into the sidecar if either of them
        // re-encoded the file. Reproducing it here is what let a HEIC through.
        let result;
        try {
          result = await commitPhoto({
            file: seed?.stripMetadata ? await withoutMetadata(files[index]) : files[index],
            collection: assignment.collection,
            name: assignment.name,
            // A stripped file has no coordinates left to protect, so the fix must
            // not come back in through the sidecar either. The capture date may.
            exif: seed?.stripMetadata
              ? { gps: null, shotAt: analysis[index].shotAt }
              : analysis[index],
            // Only the FIRST image may start a new pull request; the rest join
            // whatever it opened, or the session that was already running.
            newSession: landed === 0 ? newSession : false,
            title: seed?.title,
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
              ...(seed ? { credit: seed.credit } : {}),
            },
          });
        } catch (e) {
          throw new Error(
            (e as Error).message +
              (landed ? ` — ${landed} image${landed === 1 ? '' : 's'} already landed.` : '')
          );
        }
        if (result.shrunk || result.transcoded) shrunk.push(assignment.name);
        pullRequest = result.pullRequest ?? pullRequest;
        joined = joined || result.joinedSession;
        landedPhotos.push({ index, id: `${assignment.collection}/${assignment.name}` });
        landed++;
      }

      if (shrunk.length) {
        console.info(
          `[media] resized to fit the upload limit: ${shrunk.join(', ')} — GPS and capture date were carried into the sidecar.`
        );
      }
      onDone(pullRequest, joined, landedPhotos);
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
          {analysis.length === 0 && seed ? (
            // The files are already here; there is nothing to drop, only to wait for.
            <div className="text-muted-foreground flex items-center justify-center gap-2 p-12 text-sm">
              {!error && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ?? (error ? null : 'Reading the photos…')}
            </div>
          ) : analysis.length === 0 ? (
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

          {busy && analysis.length === 0 && !seed && (
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
