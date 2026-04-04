'use client';

import { useState } from 'react';
import { refractive } from '@hashintel/refractive';
import { Clock, Users, Activity, TrendingUp, MapPin } from 'lucide-react';
import { REFRACTIVE_DEFAULTS } from '@/lib/refractive-defaults';
import { useMounted } from '@/lib/use-mounted';

const RefractiveDiv = refractive.div;

const PARAMS = [
  { key: 'radius', label: 'radius', min: 0, max: 48, step: 1, default: REFRACTIVE_DEFAULTS.radius },
  { key: 'blur', label: 'blur', min: 0, max: 20, step: 0.5, default: REFRACTIVE_DEFAULTS.blur },
  {
    key: 'glassThickness',
    label: 'glassThickness',
    min: 0,
    max: 400,
    step: 5,
    default: REFRACTIVE_DEFAULTS.glassThickness,
  },
  {
    key: 'bezelWidth',
    label: 'bezelWidth',
    min: 0,
    max: 60,
    step: 1,
    default: REFRACTIVE_DEFAULTS.bezelWidth,
  },
  {
    key: 'refractiveIndex',
    label: 'refractiveIndex',
    min: 1,
    max: 3,
    step: 0.05,
    default: REFRACTIVE_DEFAULTS.refractiveIndex,
  },
  {
    key: 'specularOpacity',
    label: 'specularOpacity',
    min: 0,
    max: 1,
    step: 0.05,
    default: REFRACTIVE_DEFAULTS.specularOpacity,
  },
  {
    key: 'specularAngle',
    label: 'specularAngle',
    min: 0,
    max: 360,
    step: 1,
    default: REFRACTIVE_DEFAULTS.specularAngle,
  },
] as const;

type ParamKey = (typeof PARAMS)[number]['key'];
type Values = Record<ParamKey, number>;

const DEFAULTS: Values = Object.fromEntries(PARAMS.map((p) => [p.key, p.default])) as Values;

export function RefractivePlayground() {
  const [values, setValues] = useState<Values>(DEFAULTS);
  const mounted = useMounted();

  function set(key: ParamKey, value: number) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_1fr]">
      {/* Sliders */}
      <div className="space-y-4">
        {PARAMS.map((p) => (
          <div key={p.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <code className="text-primary text-xs font-semibold">{p.label}</code>
              <span className="text-muted-foreground w-12 text-right font-mono text-xs">
                {values[p.key]}
              </span>
            </div>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={values[p.key]}
              onChange={(e) => set(p.key, Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="text-muted-foreground flex justify-between font-mono text-[10px]">
              <span>{p.min}</span>
              <span className="opacity-50">pkg default: {p.default === 0 ? '0' : p.default}</span>
              <span>{p.max}</span>
            </div>
          </div>
        ))}
        <button
          onClick={() => setValues(DEFAULTS)}
          className="text-muted-foreground hover:text-foreground mt-2 w-full rounded border border-white/20 py-1.5 text-xs transition-colors"
        >
          Reset to defaults
        </button>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        {mounted ? (
          <RefractiveDiv
            className="bg-background/40 p-6"
            refraction={{
              radius: values.radius,
              blur: values.blur,
              glassThickness: values.glassThickness,
              bezelWidth: values.bezelWidth,
              refractiveIndex: values.refractiveIndex,
              specularOpacity: values.specularOpacity,
              specularAngle: values.specularAngle,
            }}
          >
            {/* Park header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Phantasialand</h3>
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3" />
                  Brühl · Germany
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tabular-nums">35</p>
                <p className="text-muted-foreground text-xs">min avg wait</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-border/30 mb-4 border-t" />

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Ø Wartezeit', value: '35 min', icon: Clock },
                { label: 'Auslastung', value: '67 %', icon: Users },
                { label: 'Rides open', value: '38 / 42', icon: Activity },
                { label: 'Peak', value: '14:30', icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="space-y-0.5">
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Icon className="h-3 w-3" />
                    {label}
                  </div>
                  <p className="font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            {/* Attraction list */}
            <div className="border-border/30 mt-4 space-y-2 border-t pt-4">
              {[
                { name: 'Taron', wait: 45, color: 'bg-orange-400' },
                { name: 'Black Mamba', wait: 30, color: 'bg-yellow-400' },
                { name: 'Chiapas', wait: 20, color: 'bg-green-400' },
              ].map(({ name, wait, color }) => (
                <div key={name} className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="flex-1 text-sm">{name}</span>
                  <span className="text-muted-foreground font-mono text-sm">{wait} min</span>
                  <div className="bg-muted/40 h-1.5 w-24 overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${(wait / 60) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </RefractiveDiv>
        ) : (
          <div className="bg-background/60 rounded-xl p-6 backdrop-blur-md" />
        )}

        {/* Current values as code */}
        <pre className="bg-muted/30 rounded-lg p-3 font-mono text-[11px] leading-relaxed">
          {`refraction={{
${PARAMS.map((p) => `  ${p.key}: ${values[p.key]},`).join('\n')}
}}`}
        </pre>
      </div>
    </div>
  );
}
