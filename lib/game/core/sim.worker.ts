/**
 * Web Worker entry: wires `SimRuntime` to postMessage. Nothing else lives here.
 *
 * Created by the host as
 *   new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' })
 */

import { SimRuntime } from './sim-runtime';
import { GAME_MODULES } from '../modules';
import type { MainToWorker, WorkerToMain } from './protocol';

const post = (msg: WorkerToMain, transfer?: ArrayBuffer[]) => {
  (self as unknown as Worker).postMessage(msg, transfer ?? []);
};

const runtime = new SimRuntime(GAME_MODULES, post);

self.onmessage = (e: MessageEvent<MainToWorker>) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case 'init':
        runtime.init(msg);
        runtime.start();
        break;
      case 'command':
        runtime.command(msg.cmd);
        break;
      case 'speed':
        runtime.setSpeed(msg.speed);
        break;
      case 'save':
        runtime.snapshot(msg.requestId);
        break;
      case 'load':
        runtime.stop();
        runtime.load(msg.world);
        runtime.start();
        break;
      case 'step':
        runtime.step(msg.ticks);
        break;
      case 'dispose':
        runtime.dispose();
        self.close();
        break;
    }
  } catch (error) {
    post({
      type: 'error',
      where: msg.type,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

self.onerror = (event) => {
  post({ type: 'error', where: 'worker', message: String((event as ErrorEvent).message ?? event) });
};
