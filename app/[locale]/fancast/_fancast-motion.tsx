// Motion primitives now live in the shared marketing kit so the Fancast page and
// the "best time to visit" hub share one implementation. Kept as a thin re-export
// so existing Fancast content imports (`./_fancast-motion`) stay valid.
export { Reveal, ScrollCue } from '@/components/marketing/scroll-reveal';
