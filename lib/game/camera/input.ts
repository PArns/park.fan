/**
 * Pointer, wheel, keyboard and touch → controller intents.
 *
 * Pointer Events rather than mouse + touch: one code path covers a mouse, a trackpad, a pen and a
 * phone, and D-015 ("the game loads on phones with touch camera controls") is then one gesture
 * handler instead of a second input stack. Nothing here decides how the camera moves — it decides
 * what the user asked for and hands it to `controller.ts`.
 *
 * Every listener is added inside `attachCameraInput()` and removed by the returned function; the
 * file touches no DOM global at module scope, so `lib/game/camera/index.ts` stays importable on
 * the worker (`scripts/test-game-lint.mjs` checks the first, the dynamic import in `index.ts`
 * covers the second).
 */

import type { CameraController, DragKind } from './controller';
import type { Ndc } from './pose';

export interface InputConfig {
  /** Mouse buttons that pan. 0 left, 1 middle, 2 right. */
  panButtons: number[];
  /** Mouse buttons that orbit. */
  orbitButtons: number[];
  /** Scroll the view when the pointer rests near the edge of the canvas. */
  edgePan: boolean;
  /** Width of the edge band in pixels. */
  edgeBand: number;
  /** Whether keys and the pointer do anything at all. */
  enabled: boolean;
}

export const DEFAULT_INPUT: InputConfig = {
  panButtons: [0, 1],
  orbitButtons: [2],
  edgePan: true,
  edgeBand: 10,
  enabled: true,
};

export interface CameraInput {
  config(): InputConfig;
  setConfig(patch: Partial<InputConfig>): void;
  /** Called once per render frame, before `controller.update`. */
  pump(): void;
  /** Screen pixel → normalised device coordinates, for `screenToGround`. */
  toNdc(clientX: number, clientY: number): Ndc;
  detach(): void;
}

/** WASD plus the arrows plus the two rotate/tilt pairs. Keyed by `KeyboardEvent.code`. */
const KEYS: Record<
  string,
  { right?: number; forward?: number; yaw?: number; pitch?: number; zoom?: number }
> = {
  KeyW: { forward: 1 },
  ArrowUp: { forward: 1 },
  KeyS: { forward: -1 },
  ArrowDown: { forward: -1 },
  KeyA: { right: -1 },
  ArrowLeft: { right: -1 },
  KeyD: { right: 1 },
  ArrowRight: { right: 1 },
  KeyQ: { yaw: 1 },
  KeyE: { yaw: -1 },
  PageUp: { pitch: -1 },
  PageDown: { pitch: 1 },
  Equal: { zoom: 1 },
  NumpadAdd: { zoom: 1 },
  Minus: { zoom: -1 },
  NumpadSubtract: { zoom: -1 },
};

interface Touch {
  x: number;
  y: number;
}

export function attachCameraInput(
  canvas: HTMLElement,
  controller: CameraController,
  initial?: Partial<InputConfig>
): CameraInput {
  let config: InputConfig = { ...DEFAULT_INPUT, ...initial };
  const held = new Set<string>();
  const pointers = new Map<number, Touch>();
  let boost = 1;
  let hover: { x: number; y: number } | null = null;
  let pinch: { distance: number; angle: number; midX: number; midY: number } | null = null;
  let dragPointer: number | null = null;

  const rect = () => canvas.getBoundingClientRect();

  const toNdc = (clientX: number, clientY: number): Ndc => {
    const r = rect();
    return {
      x: r.width > 0 ? ((clientX - r.left) / r.width) * 2 - 1 : 0,
      y: r.height > 0 ? 1 - ((clientY - r.top) / r.height) * 2 : 0,
    };
  };

  const kindFor = (button: number, ev: PointerEvent): DragKind | null => {
    if (ev.ctrlKey && config.panButtons.includes(button)) return 'tilt';
    if (ev.altKey && config.panButtons.includes(button)) return 'orbit';
    if (config.orbitButtons.includes(button)) return 'orbit';
    if (config.panButtons.includes(button)) return 'pan';
    return null;
  };

  const onPointerDown = (ev: PointerEvent) => {
    if (!config.enabled) return;
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 2) {
      // Second finger: end the one-finger pan and start a pinch.
      controller.endDrag();
      dragPointer = null;
      pinch = gesture();
      return;
    }
    if (pointers.size > 2) return;
    const kind = ev.pointerType === 'touch' ? 'pan' : kindFor(ev.button, ev);
    if (!kind) return;
    dragPointer = ev.pointerId;
    canvas.setPointerCapture?.(ev.pointerId);
    controller.beginDrag(kind, toNdc(ev.clientX, ev.clientY));
    ev.preventDefault();
  };

  function gesture() {
    const [a, b] = [...pointers.values()];
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      angle: Math.atan2(b.y - a.y, b.x - a.x),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
    };
  }

  const onPointerMove = (ev: PointerEvent) => {
    hover = { x: ev.clientX, y: ev.clientY };
    if (!config.enabled) return;
    if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 2 && pinch) {
      const now = gesture();
      // Pinch → zoom about the midpoint, twist → yaw about it, midpoint travel → pan. The same
      // three transforms the mouse uses, so a phone and a desktop cannot disagree about what
      // "zoom towards there" means.
      const ndc = toNdc(now.midX, now.midY);
      if (pinch.distance > 8 && now.distance > 8) {
        const notches = Math.log(pinch.distance / now.distance) / 0.18;
        if (Math.abs(notches) > 1e-3) controller.zoomAt(ndc, notches);
      }
      const twist = now.angle - pinch.angle;
      if (Math.abs(twist) > 0.004) {
        controller.beginDrag('orbit', ndc);
        controller.dragTo({ x: ndc.x - twist / (Math.PI / 2), y: ndc.y });
        controller.endDrag();
      }
      pinch = now;
      ev.preventDefault();
      return;
    }
    if (dragPointer !== ev.pointerId) return;
    controller.dragTo(toNdc(ev.clientX, ev.clientY));
    ev.preventDefault();
  };

  const release = (ev: PointerEvent) => {
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinch = null;
    if (dragPointer === ev.pointerId) {
      dragPointer = null;
      controller.endDrag();
      canvas.releasePointerCapture?.(ev.pointerId);
    }
  };

  const onWheel = (ev: WheelEvent) => {
    if (!config.enabled) return;
    // deltaMode 1 is lines, 2 is pages; normalise everything to "notches" so a trackpad's pixel
    // deltas and a wheel's 100-unit steps zoom by comparable amounts.
    const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 400 : 100;
    controller.zoomAt(toNdc(ev.clientX, ev.clientY), -ev.deltaY / unit);
    ev.preventDefault();
  };

  const onContextMenu = (ev: Event) => {
    // Right-drag orbits; without this the menu opens on mouse-up in the middle of it.
    if (config.enabled && config.orbitButtons.includes(2)) ev.preventDefault();
  };

  const typing = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    if (!config.enabled || typing(ev.target)) return;
    if (ev.shiftKey) boost = 2.5;
    if (!KEYS[ev.code]) return;
    held.add(ev.code);
    ev.preventDefault();
  };

  const onKeyUp = (ev: KeyboardEvent) => {
    if (!ev.shiftKey) boost = 1;
    held.delete(ev.code);
  };

  const onBlur = () => {
    held.clear();
    pointers.clear();
    pinch = null;
    dragPointer = null;
    boost = 1;
    hover = null;
    controller.endDrag();
  };

  const onPointerLeave = () => {
    hover = null;
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', onContextMenu);
  const doc = canvas.ownerDocument;
  const view = doc?.defaultView;
  view?.addEventListener('keydown', onKeyDown);
  view?.addEventListener('keyup', onKeyUp);
  view?.addEventListener('blur', onBlur);

  return {
    config: () => config,
    setConfig(patch) {
      config = { ...config, ...patch };
      if (!config.enabled) onBlur();
    },
    toNdc,
    pump() {
      let right = 0;
      let forward = 0;
      let yaw = 0;
      let pitch = 0;
      let zoom = 0;
      for (const code of held) {
        const k = KEYS[code];
        if (!k) continue;
        right += k.right ?? 0;
        forward += k.forward ?? 0;
        yaw += k.yaw ?? 0;
        pitch += k.pitch ?? 0;
        zoom += k.zoom ?? 0;
      }
      // Edge scroll. Only while the pointer is genuinely over the canvas and no drag is running —
      // the HUD sits on top of the canvas and swallows its own pointer events, so a pointer on a
      // panel simply never reaches here and the edge band cannot fire under it.
      if (config.edgePan && hover && !controller.dragging() && pointers.size === 0) {
        const r = rect();
        const band = config.edgeBand;
        const lx = hover.x - r.left;
        const ly = hover.y - r.top;
        if (lx >= 0 && ly >= 0 && lx <= r.width && ly <= r.height) {
          if (lx < band) right -= 1 - lx / band;
          else if (lx > r.width - band) right += 1 - (r.width - lx) / band;
          if (ly < band) forward += 1 - ly / band;
          else if (ly > r.height - band) forward -= 1 - (r.height - ly) / band;
        }
      }
      controller.setPanAxis(right * boost, forward * boost);
      controller.setSpinAxis(yaw, pitch);
      controller.setZoomAxis(zoom);
    },
    detach() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointercancel', release);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
      view?.removeEventListener('keydown', onKeyDown);
      view?.removeEventListener('keyup', onKeyUp);
      view?.removeEventListener('blur', onBlur);
      held.clear();
      pointers.clear();
    },
  };
}
