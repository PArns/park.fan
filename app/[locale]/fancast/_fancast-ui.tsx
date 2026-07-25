// The editorial UI kit (hero, numbered section shells, split figures, crowd
// spectrum, …) now lives in the shared marketing module so the Fancast page and
// the "best time to visit" hub read as one design system. Kept as a thin
// re-export so existing Fancast content imports (`./_fancast-ui`) stay valid.
export {
  Hero,
  SectionShell,
  Lead,
  P,
  PG,
  Highlight,
  IngredientGrid,
  IngredientCard,
  CrowdSpectrum,
  SplitFigure,
  Figure,
  TouchpointGrid,
  FaqList,
} from '@/components/marketing/editorial-ui';
