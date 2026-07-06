import { TacticsGame } from '@/components/tactics/tactics-game';

/**
 * /dev/tactics — Queue Tactics, a TFT-style auto battler built to kill time
 * while standing in a ride queue: fully local (no server), no timers, resumes
 * after interruptions. Prototype route, not linked from the site.
 */
export default function TacticsPage() {
  return <TacticsGame />;
}
