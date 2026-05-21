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

import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { weatherCodeToScene, type WeatherScene } from './weather-scene';
import './weather-background.css';

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

export const WeatherBackground = memo(function WeatherBackground({
  code,
  isDay = true,
  className,
  glass = false,
  glassOpacity = 0.6,
  glassBlur = 8,
}: WeatherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { scene, intensity, precipitation } = useMemo(() => weatherCodeToScene(code), [code]);

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
            style={{
              top: '55%',
              animationDuration: '12s',
              animationDirection: 'alternate-reverse',
            }}
          />
          <span style={{ top: '76%', animationDuration: '10.5s' }} />
        </div>
      )}

      {precipitation && <canvas ref={canvasRef} className="weather-bg__canvas" />}

      {scene === 'thunderstorm' && (
        <>
          <div className="weather-bg__flash" />
          <svg className="weather-bg__bolt" viewBox="0 0 26 44" width="26" height="44">
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
    </div>
  );
});
