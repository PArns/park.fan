import { createElement, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';

const OKLCH = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g;

/** sRGB hex of an `oklch(L C H)` colour, L and C as plain numbers, H in degrees. */
export function oklchToHex(l: number, c: number, h: number): string {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((v) => v ** 3);
  const rgb = [
    [4.0767416621, -3.3077115913, 0.2309699292],
    [-1.2684380046, 2.6097574011, -0.3413193965],
    [-0.0041960863, -0.7034186147, 1.707614701],
  ].map(([x, y, z]) => x * lms[0] + y * lms[1] + z * lms[2]);
  return `#${rgb
    .map((v) => {
      const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
      return Math.round(Math.min(1, Math.max(0, s)) * 255)
        .toString(16)
        .padStart(2, '0');
    })
    .join('')}`;
}

/**
 * A drawing as Satori can render it: its components called through to plain SVG elements, and
 * every `oklch()` colour, which Satori's SVG renderer does not read, as hex. For components
 * without hooks only, which is what the drawing's pieces are.
 */
export function forSatori(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(forSatori);
  if (!isValidElement(node)) return node;
  const { type, props, key } = node as ReactElement<Record<string, unknown>>;
  if (typeof type === 'function') return forSatori((type as (p: object) => ReactNode)(props));
  if ((type as unknown) === Fragment) return forSatori(props.children as ReactNode);
  const converted: Record<string, unknown> = { key };
  for (const [name, value] of Object.entries(props)) {
    converted[name] =
      name === 'children'
        ? forSatori(value as ReactNode)
        : typeof value === 'string'
          ? value.replace(OKLCH, (_, l, c, h) => oklchToHex(+l, +c, +h))
          : value;
  }
  return createElement(type as string, converted);
}
