'use client';

/**
 * WeatherBackground
 * -----------------
 * An animated, layered weather scene (sky gradient, sun/moon, drifting
 * clouds, a precipitation canvas and lightning) driven by an Open-Meteo
 * `weather_code` and `is_day` flag.
 *
 * Drop it as the FIRST child of a card that is `position: relative;
 * overflow: hidden` — content goes above it with z-index 1+.
 *
 * The optional `glass` overlay tames the animation so card text stays
 * readable. The overlay is theme-aware: dark tint on dark UI, light
 * tint on light UI. The sky / cloud colors themselves stay physically
 * plausible regardless of theme — a sunny sky should look sunny.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { weatherCodeToScene, type WeatherScene } from './weather-scene';

export interface WeatherBackgroundProps {
  /** Open-Meteo `weather_code` (WMO interpretation code). */
  code: number;
  /** `true` = day, `false` = night. Defaults to day. */
  isDay?: boolean | number;
  className?: string;
  /** Render the frosted-glass overlay (backdrop blur + theme-aware tint). */
  glass?: boolean;
  /** Opacity (0..1) of the glass tint. Higher = less see-through. */
  glassOpacity?: number;
  /** Backdrop blur radius in pixels. Lower = sharper animation behind. */
  glassBlur?: number;
}

const CLOUD_PRESETS = [
  { top: '15%', scale: 1.0, duration: 48, delay: 0 },
  { top: '33%', scale: 0.72, duration: 64, delay: -26 },
  { top: '9%', scale: 0.55, duration: 56, delay: -41 },
  { top: '47%', scale: 0.86, duration: 73, delay: -13 },
  { top: '25%', scale: 0.62, duration: 60, delay: -50 },
] as const;

const CLOUD_COUNT: Record<WeatherScene, number> = {
  clear: 0,
  'partly-cloudy': 3,
  cloudy: 5,
  fog: 0,
  rain: 4,
  snow: 4,
  thunderstorm: 4,
};

const HAS_CELESTIAL: WeatherScene[] = ['clear', 'partly-cloudy'];

const STAR_COUNT = 38;

export function WeatherBackground({
  code,
  isDay = true,
  className,
  glass = false,
  glassOpacity = 0.6,
  glassBlur = 8,
}: WeatherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { scene, intensity, precipitation } = useMemo(
    () => weatherCodeToScene(code),
    [code]
  );

  const day = Boolean(isDay);
  const cloudCount = CLOUD_COUNT[scene];
  const showCelestial = HAS_CELESTIAL.includes(scene);

  // Stable random star field, generated once on mount. useState's lazy
  // initializer runs Math.random() outside of the render path, satisfying
  // React's purity rules while still giving us a per-mount layout.
  const [stars] = useState(() =>
    Array.from({ length: STAR_COUNT }, () => ({
      top: Math.random() * 58,
      left: Math.random() * 100,
      size: 1 + Math.random() * 1.8,
      duration: 2.5 + Math.random() * 3,
      delay: -Math.random() * 4,
    }))
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !precipitation) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const heavy = intensity > 0.85;

    let width = 0;
    let height = 0;
    let frameId = 0;

    type Particle = { x: number; y: number; z: number };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const baseCount = precipitation === 'snow' ? 64 : 104;
    const count = Math.round(baseCount * (0.45 + intensity * 0.55));
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random(),
    }));

    const recycle = (p: Particle, length: number) => {
      p.y = -length;
      p.x = Math.random() * width;
      p.z = Math.random();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (precipitation === 'snow') {
        ctx.fillStyle = '#ffffff';
        for (const p of particles) {
          ctx.globalAlpha = 0.5 + p.z * 0.45;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1 + p.z * 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = heavy ? 'rgba(216,226,240,0.85)' : 'rgba(198,214,232,0.7)';
        for (const p of particles) {
          const length = (heavy ? 13 : 9) + p.z * 9;
          ctx.globalAlpha = 0.32 + p.z * 0.5;
          ctx.lineWidth = 0.8 + p.z * 1.1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2.4, p.y + length);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const step = () => {
      for (const p of particles) {
        if (precipitation === 'snow') {
          p.y += (0.35 + p.z) * (0.6 + intensity * 0.7);
          p.x += Math.sin((p.y + p.x) * 0.02) * 0.5;
          if (p.y > height + 8) recycle(p, 8);
        } else {
          const length = (heavy ? 13 : 9) + p.z * 9;
          p.y += ((heavy ? 9 : 6) + p.z * 6) * (0.7 + intensity * 0.6);
          p.x -= 0.7 + p.z * 0.8;
          if (p.y > height + 12 || p.x < -12) recycle(p, length);
        }
      }
      render();
      frameId = requestAnimationFrame(step);
    };

    render();
    if (!reduceMotion) frameId = requestAnimationFrame(step);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [precipitation, intensity]);

  return (
    <div
      className={`weather-bg${className ? ` ${className}` : ''}`}
      data-scene={scene}
      data-day={day ? 'day' : 'night'}
      aria-hidden="true"
    >
      {showCelestial && day && <div className="weather-bg__sun" />}
      {showCelestial && !day && <div className="weather-bg__moon" />}

      {showCelestial && !day && (
        <div className="weather-bg__stars">
          {stars.map((star, index) => (
            <span
              key={index}
              style={
                {
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  animationDuration: `${star.duration}s`,
                  animationDelay: `${star.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      {cloudCount > 0 && (
        <div className="weather-bg__clouds">
          {CLOUD_PRESETS.slice(0, cloudCount).map((cloud, index) => (
            <div
              key={index}
              className="weather-bg__cloud"
              style={
                {
                  top: cloud.top,
                  '--scale': cloud.scale,
                  '--duration': `${cloud.duration}s`,
                  '--delay': `${cloud.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      {scene === 'fog' && (
        <div className="weather-bg__fog">
          <span style={{ top: '32%', animationDuration: '9s' }} />
          <span
            style={{ top: '55%', animationDuration: '12s', animationDirection: 'alternate-reverse' }}
          />
          <span style={{ top: '76%', animationDuration: '10.5s' }} />
        </div>
      )}

      {precipitation && <canvas ref={canvasRef} className="weather-bg__canvas" />}

      {scene === 'thunderstorm' && (
        <>
          <div className="weather-bg__flash" />
          <svg
            className="weather-bg__bolt"
            viewBox="0 0 26 44"
            width="26"
            height="44"
          >
            <polygon points="15,1 3,24 12,24 9,43 24,17 14,17" fill="#FFF7CE" />
          </svg>
        </>
      )}

      {glass && (
        <div
          className="weather-bg__glass"
          style={
            {
              '--glass-opacity': glassOpacity,
              backdropFilter: `blur(${glassBlur}px) saturate(1.2)`,
              WebkitBackdropFilter: `blur(${glassBlur}px) saturate(1.2)`,
            } as CSSProperties
          }
        />
      )}

      <div className="weather-bg__sheen" />

      <style jsx>{`
        .weather-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: inherit;
          z-index: 0;
          --cloud: #ffffff;
        }

        /* --- Sky gradients (day) --- */
        .weather-bg[data-day='day'][data-scene='clear'],
        .weather-bg[data-day='day'][data-scene='partly-cloudy'] {
          background: radial-gradient(135% 105% at 50% 4%, #cdeafb 0%, #80bdec 42%, #4b91d6 80%, #3f84cd 100%);
        }
        .weather-bg[data-day='day'][data-scene='cloudy'] {
          background: radial-gradient(135% 105% at 50% 8%, #bac6d2 0%, #8c9aa9 52%, #6b7886 100%);
        }
        .weather-bg[data-day='day'][data-scene='fog'] {
          background: linear-gradient(180deg, #cdd4da 0%, #a6b0b9 60%, #97a2ac 100%);
        }
        .weather-bg[data-day='day'][data-scene='rain'] {
          background: radial-gradient(135% 105% at 50% 6%, #74808b 0%, #545f69 55%, #404a53 100%);
        }
        .weather-bg[data-day='day'][data-scene='snow'] {
          background: radial-gradient(135% 105% at 50% 8%, #b7c3cf 0%, #8e9ba8 52%, #717e8b 100%);
        }

        /* --- Sky gradients (night) --- */
        .weather-bg[data-day='night'][data-scene='clear'],
        .weather-bg[data-day='night'][data-scene='partly-cloudy'] {
          background: radial-gradient(135% 112% at 50% 2%, #34486f 0%, #1b2a49 40%, #0c152a 78%, #070c18 100%);
        }
        .weather-bg[data-day='night'][data-scene='cloudy'] {
          background: radial-gradient(135% 105% at 50% 8%, #3c4653 0%, #2a323d 55%, #1d232b 100%);
        }
        .weather-bg[data-day='night'][data-scene='fog'] {
          background: linear-gradient(180deg, #4a525b 0%, #353c45 60%, #2b313a 100%);
        }
        .weather-bg[data-day='night'][data-scene='rain'] {
          background: radial-gradient(135% 105% at 50% 6%, #3a444f 0%, #2a323b 55%, #1c2128 100%);
        }
        .weather-bg[data-day='night'][data-scene='snow'] {
          background: radial-gradient(135% 105% at 50% 8%, #3e4853 0%, #2f3741 55%, #242b33 100%);
        }

        .weather-bg[data-scene='thunderstorm'] {
          background: radial-gradient(140% 115% at 50% -6%, #3a4250 0%, #232936 55%, #161a22 100%);
        }

        /* --- Cloud color token per scene --- */
        .weather-bg[data-day='day'][data-scene='partly-cloudy'] { --cloud: #fbfdff; }
        .weather-bg[data-day='night'][data-scene='partly-cloudy'] { --cloud: #7c8699; }
        .weather-bg[data-day='day'][data-scene='cloudy'] { --cloud: #e7ecf2; }
        .weather-bg[data-day='night'][data-scene='cloudy'] { --cloud: #4c5662; }
        .weather-bg[data-day='day'][data-scene='rain'] { --cloud: #525c66; }
        .weather-bg[data-day='night'][data-scene='rain'] { --cloud: #3b444f; }
        .weather-bg[data-scene='thunderstorm'] { --cloud: #333a45; }
        .weather-bg[data-day='day'][data-scene='snow'] { --cloud: #dfe5ec; }
        .weather-bg[data-day='night'][data-scene='snow'] { --cloud: #535d69; }

        /* --- Sun and moon --- */
        .weather-bg__sun,
        .weather-bg__moon {
          position: absolute;
          top: 13%;
          left: 67%;
          z-index: 2;
        }
        .weather-bg__sun {
          width: 80px;
          height: 80px;
          margin-left: -40px;
          border-radius: 50%;
          background: radial-gradient(circle at 37% 33%, #fffef4 0%, #ffe7a2 37%, #ffc44e 70%, #f6a92c 100%);
          box-shadow: 0 0 40px 12px rgba(255, 196, 80, 0.55), 0 0 96px 34px rgba(255, 176, 58, 0.28);
          animation: weather-pulse 6s ease-in-out infinite;
        }
        .weather-bg__moon {
          width: 64px;
          height: 64px;
          margin-left: -32px;
          border-radius: 50%;
          background: radial-gradient(circle at 36% 32%, #fbfcff 0%, #dde4ef 56%, #b4bfd2 100%);
          box-shadow: 0 0 32px 9px rgba(202, 216, 242, 0.42), 0 0 76px 28px rgba(150, 170, 210, 0.2);
        }
        .weather-bg__moon::before,
        .weather-bg__moon::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          background: rgba(120, 134, 160, 0.3);
        }
        .weather-bg__moon::before { width: 15px; height: 15px; top: 16px; left: 34px; }
        .weather-bg__moon::after { width: 10px; height: 10px; top: 38px; left: 20px; }

        /* --- Stars --- */
        .weather-bg__stars {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .weather-bg__stars span {
          position: absolute;
          border-radius: 50%;
          background: #ffffff;
          animation-name: weather-twinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        /* --- Clouds --- */
        .weather-bg__clouds {
          position: absolute;
          inset: 0;
          z-index: 2;
        }
        .weather-bg__cloud {
          position: absolute;
          width: 104px;
          height: 32px;
          border-radius: 32px;
          background: var(--cloud);
          transform: scale(var(--scale));
          transform-origin: center;
          box-shadow: inset 0 10px 11px -7px rgba(255, 255, 255, 0.55), 0 12px 26px rgba(16, 22, 34, 0.3);
          animation: weather-drift var(--duration) linear infinite;
          animation-delay: var(--delay);
        }
        .weather-bg__cloud::before,
        .weather-bg__cloud::after {
          content: '';
          position: absolute;
          background: var(--cloud);
          border-radius: 50%;
          box-shadow: inset 0 9px 9px -6px rgba(255, 255, 255, 0.5);
        }
        .weather-bg__cloud::before { width: 50px; height: 50px; top: -24px; left: 15px; }
        .weather-bg__cloud::after { width: 36px; height: 36px; top: -17px; right: 17px; }

        /* --- Fog --- */
        .weather-bg__fog {
          position: absolute;
          inset: 0;
          z-index: 2;
        }
        .weather-bg__fog span {
          position: absolute;
          left: -32%;
          width: 164%;
          height: 42px;
          border-radius: 40px;
          background: rgba(244, 247, 250, 0.5);
          animation-name: weather-fog;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        .weather-bg[data-day='night'] .weather-bg__fog span {
          background: rgba(190, 200, 212, 0.34);
        }

        /* --- Precipitation canvas --- */
        .weather-bg__canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
        }

        /* --- Lightning --- */
        .weather-bg__flash {
          position: absolute;
          inset: 0;
          z-index: 4;
          background: #ffffff;
          opacity: 0;
          animation: weather-flash 7s linear infinite;
        }
        .weather-bg__bolt {
          position: absolute;
          top: 24%;
          left: 58%;
          z-index: 4;
          opacity: 0;
          animation: weather-flash 7s linear infinite;
        }

        /* --- Theme-aware glass overlay ---
           Default = light theme: a light tint over the animation so dark
           card text stays readable. The .dark class on <html> (next-themes)
           swaps to a dark tint for the same reason in dark mode. */
        .weather-bg__glass {
          position: absolute;
          inset: 0;
          z-index: 6;
          pointer-events: none;
          background-color: rgba(248, 250, 255, var(--glass-opacity, 0.6));
        }
        :global(html.dark) .weather-bg__glass {
          background-color: rgba(13, 15, 20, var(--glass-opacity, 0.6));
        }

        /* --- Glossy sheen overlay --- */
        .weather-bg__sheen {
          position: absolute;
          inset: 0;
          z-index: 7;
          pointer-events: none;
          background: linear-gradient(
            157deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.05) 17%,
            rgba(255, 255, 255, 0) 38%
          );
        }

        @keyframes weather-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.07); }
        }
        @keyframes weather-drift {
          from { left: -30%; }
          to { left: 118%; }
        }
        @keyframes weather-fog {
          from { transform: translateX(-7%); }
          to { transform: translateX(7%); }
        }
        @keyframes weather-flash {
          0%, 11%, 13.5%, 16.5%, 100% { opacity: 0; }
          12% { opacity: 0.92; }
          15% { opacity: 0.62; }
        }
        @keyframes weather-twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .weather-bg__sun,
          .weather-bg__cloud,
          .weather-bg__fog span,
          .weather-bg__flash,
          .weather-bg__bolt,
          .weather-bg__stars span {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
