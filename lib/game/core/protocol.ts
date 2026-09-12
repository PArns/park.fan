/**
 * The typed message protocol between the main thread and sim.worker.ts, plus the frame writer
 * that owns the transferable buffers.
 */

import type { Clock, Command, SimFrame, SimFrameWriter, Speed, World } from './types';

export interface InitMessage {
  type: 'init';
  world: World;
  /** Pack manifests in registration order (already validated on the main side). */
  packs: unknown[];
  /** Module ids to create on the sim side, in dependency order. */
  modules: string[];
}
export interface CommandMessage {
  type: 'command';
  cmd: Command;
}
export interface SpeedMessage {
  type: 'speed';
  speed: Speed;
}
export interface SaveMessage {
  type: 'save';
  requestId: number;
}
export interface LoadMessage {
  type: 'load';
  world: World;
}
export interface DisposeMessage {
  type: 'dispose';
}
/** Run `ticks` ticks immediately (soak/tests), ignoring the wall clock. */
export interface StepMessage {
  type: 'step';
  ticks: number;
}
export type MainToWorker =
  | InitMessage
  | CommandMessage
  | SpeedMessage
  | SaveMessage
  | LoadMessage
  | DisposeMessage
  | StepMessage;

export interface ReadyMessage {
  type: 'ready';
  tick: number;
  clock: Clock;
  failed: string[];
}
export interface FrameMessage {
  type: 'frame';
  frame: SimFrame;
}
export interface EventMessage {
  type: 'event';
  name: string;
  payload: unknown;
}
export interface SnapshotMessage {
  type: 'snapshot';
  requestId: number;
  json: string;
}
export interface ErrorMessage {
  type: 'error';
  where: string;
  message: string;
}
export type WorkerToMain =
  ReadyMessage | FrameMessage | EventMessage | SnapshotMessage | ErrorMessage;

/**
 * Double-buffered frame writer. `begin()` starts a frame; modules claim views; `end()` returns
 * the buffers to transfer. Two sets alternate so the worker never writes into a buffer the main
 * thread still reads; if the main thread has not returned a set (it never does — transfer is
 * one-way), fresh buffers are allocated, which is cheap at 20 Hz for a few hundred KB.
 */
export class FrameWriter implements SimFrameWriter {
  private buffers: Record<string, ArrayBuffer> = {};
  private stats: Record<string, number> = {};

  begin(): void {
    this.buffers = {};
    this.stats = {};
  }

  f32(name: string, length: number): Float32Array {
    const view = new Float32Array(length);
    this.buffers[name] = view.buffer;
    return view;
  }

  u8(name: string, length: number): Uint8Array {
    const view = new Uint8Array(length);
    this.buffers[name] = view.buffer;
    return view;
  }

  u16(name: string, length: number): Uint16Array {
    const view = new Uint16Array(length);
    this.buffers[name] = view.buffer;
    return view;
  }

  stat(name: string, value: number): void {
    this.stats[name] = value;
  }

  end(): {
    buffers: Record<string, ArrayBuffer>;
    stats: Record<string, number>;
    transfer: ArrayBuffer[];
  } {
    const transfer = Object.values(this.buffers);
    return { buffers: this.buffers, stats: this.stats, transfer };
  }
}
