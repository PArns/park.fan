/**
 * A four-function expression evaluator over an element's parameters.
 *
 * It exists so a track element can be *data*. A drop is "fall `$height` metres at `$angle`
 * degrees", and the straight in the middle of it is `$height / sin(rad($angle))` — arithmetic the
 * element has to do somewhere. Without an evaluator that somewhere is TypeScript, and then a pack
 * cannot add an element without a code change, which is the requirement this module is graded on.
 *
 * It is deliberately tiny and deliberately not `Function()`: a content pack is data that arrives
 * from a URL (`registry.loadPackFromUrl`), and handing that to the JavaScript compiler turns a
 * manifest into an execution surface. The grammar is numbers, `$param` references, `+ - * / %`,
 * unary minus, parentheses, and eight named functions. Anything else throws with the offending
 * text, which is the same contract `parsePack` gives.
 */

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  abs: Math.abs,
  sqrt: Math.sqrt,
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  pi: () => Math.PI,
  /** Degrees to radians. Every angle a human types into a manifest is in degrees. */
  rad: (d) => (d * Math.PI) / 180,
  /**
   * Radians to degrees, and it is not decoration: an angle ARGUMENT is converted from degrees by
   * `normalizeArgs`, so an expression that computes one with `atan` has to hand the result back in
   * degrees or the conversion runs twice. `deg(atan(...))` is the shape that appears here.
   */
  deg: (r) => (r * 180) / Math.PI,
};

type Token =
  { kind: 'num'; value: number } | { kind: 'param'; name: string } | { kind: 'op'; text: string };

/** A value in an element script: a literal, or an expression over the element's parameters. */
export type Expr = number | string;

const CACHE = new Map<string, Token[]>();

export function evaluate(expr: Expr, params: Record<string, number>): number {
  if (typeof expr === 'number') return expr;
  const tokens = tokenize(expr);
  const parser = { tokens, i: 0, params, source: expr };
  const value = parseSum(parser);
  if (parser.i < tokens.length) throw new Error(`track expression: trailing input in "${expr}"`);
  if (!Number.isFinite(value)) throw new Error(`track expression: "${expr}" is not finite`);
  return value;
}

function tokenize(source: string): Token[] {
  const cached = CACHE.get(source);
  if (cached) return cached;
  const out: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (c === ' ' || c === '\t') {
      i++;
      continue;
    }
    if (c === '$') {
      let j = i + 1;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j])) j++;
      if (j === i + 1) throw new Error(`track expression: empty parameter name in "${source}"`);
      out.push({ kind: 'param', name: source.slice(i + 1, j) });
      i = j;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < source.length && /[0-9.]/.test(source[j])) j++;
      const value = Number(source.slice(i, j));
      if (!Number.isFinite(value)) throw new Error(`track expression: bad number in "${source}"`);
      out.push({ kind: 'num', value });
      i = j;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      let j = i;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j])) j++;
      out.push({ kind: 'op', text: source.slice(i, j) });
      i = j;
      continue;
    }
    if ('+-*/%(),'.includes(c)) {
      out.push({ kind: 'op', text: c });
      i++;
      continue;
    }
    throw new Error(`track expression: unexpected "${c}" in "${source}"`);
  }
  CACHE.set(source, out);
  return out;
}

interface Parser {
  tokens: Token[];
  i: number;
  params: Record<string, number>;
  source: string;
}

function peek(p: Parser): Token | undefined {
  return p.tokens[p.i];
}

function eat(p: Parser, text: string): boolean {
  const t = peek(p);
  if (t && t.kind === 'op' && t.text === text) {
    p.i++;
    return true;
  }
  return false;
}

function parseSum(p: Parser): number {
  let value = parseProduct(p);
  for (;;) {
    if (eat(p, '+')) value += parseProduct(p);
    else if (eat(p, '-')) value -= parseProduct(p);
    else return value;
  }
}

function parseProduct(p: Parser): number {
  let value = parseUnary(p);
  for (;;) {
    if (eat(p, '*')) value *= parseUnary(p);
    else if (eat(p, '/')) value /= parseUnary(p);
    else if (eat(p, '%')) value %= parseUnary(p);
    else return value;
  }
}

function parseUnary(p: Parser): number {
  if (eat(p, '-')) return -parseUnary(p);
  if (eat(p, '+')) return parseUnary(p);
  return parseAtom(p);
}

function parseAtom(p: Parser): number {
  const t = peek(p);
  if (!t) throw new Error(`track expression: unexpected end of "${p.source}"`);
  if (t.kind === 'num') {
    p.i++;
    return t.value;
  }
  if (t.kind === 'param') {
    p.i++;
    const value = p.params[t.name];
    if (typeof value !== 'number') {
      throw new Error(`track expression: "${p.source}" reads unknown parameter "${t.name}"`);
    }
    return value;
  }
  if (t.text === '(') {
    p.i++;
    const value = parseSum(p);
    if (!eat(p, ')')) throw new Error(`track expression: missing ")" in "${p.source}"`);
    return value;
  }
  const fn = FUNCTIONS[t.text];
  if (!fn) throw new Error(`track expression: unknown function "${t.text}" in "${p.source}"`);
  p.i++;
  if (!eat(p, '('))
    throw new Error(`track expression: "${t.text}" needs its arguments in "${p.source}"`);
  const args: number[] = [];
  if (!eat(p, ')')) {
    do {
      args.push(parseSum(p));
    } while (eat(p, ','));
    if (!eat(p, ')')) throw new Error(`track expression: missing ")" in "${p.source}"`);
  }
  return fn(...args);
}
