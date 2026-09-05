/**
 * Ride status, reliability and breakdowns.
 *
 * The one thing this system is careful about: **a ride that breaks while a train is on the track
 * does not stop that train mid-air.** It stops accepting dispatches; the trains module brings
 * whatever is running back to a station and then holds it. A breakdown that teleported a train to
 * a halt would be the crash detector's problem and a physics bug at the same time.
 */

import type { SimSystem } from '../core/sim/context';
import { TICKS_PER_GAME_MINUTE } from '../core/units';
import { NO_ENTITY } from '../core/ids';

/** Reliability lost per game hour of operation. A ride left open a season needs a mechanic. */
const WEAR_PER_HOUR = 0.011;

export const ridesSystem: SimSystem = {
  id: 'rides',
  tick(ctx) {
    const hourly = ctx.world.tick % (TICKS_PER_GAME_MINUTE * 60) === 0;
    const rng = ctx.rng('breakdowns');

    for (const key of Object.keys(ctx.world.entities.ride)) {
      const ride = ctx.world.entities.ride[Number(key)]!;
      ride.ticksSinceInspection++;

      if (hourly && (ride.status === 'open' || ride.status === 'testing')) {
        ride.reliability = Math.max(0, ride.reliability - WEAR_PER_HOUR);
      }

      if (ride.status !== 'open') continue;

      /**
       * Breakdown chance per minute, from reliability.
       *
       * Quadratic, so a well-maintained ride essentially never breaks and a neglected one breaks
       * often — a linear curve makes a fresh ride break about a fifth as often as a worn one,
       * which reads as bad luck rather than as neglect.
       */
      if (ctx.world.tick % TICKS_PER_GAME_MINUTE === 0) {
        const risk = (1 - ride.reliability) * (1 - ride.reliability) * 0.02;
        if (rng.bool(risk)) {
          ride.status = 'broken';
          ride.assignedMechanic = NO_ENTITY;
          ctx.notify({
            level: 'warn',
            title: 'Störung',
            body: 'Eine Attraktion ist ausgefallen und braucht einen Mechaniker.',
          });
        }
      }
    }
  },

  audit(ctx) {
    let broken = 0;
    for (const ride of Object.values(ctx.world.entities.ride)) if (ride.status === 'broken') broken++;
    return { ridesBroken: broken };
  },
};
