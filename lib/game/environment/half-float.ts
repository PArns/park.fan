/**
 * float32 → float16 conversion for the sky textures.
 *
 * The sky is HDR (a noon horizon reaches ~4, a night zenith ~0.01) and it is uploaded straight
 * from JS, so the choice is between RGBA32F and RGBA16F. WebGL2 filters RGBA16F in core, while
 * filtering RGBA32F needs OES_texture_float_linear — a missing extension there would silently
 * drop the dome to nearest sampling and band a gradient that is 90 % of the screen. Half also
 * halves the 1 MB upload. The cost is this routine, ~15 ops per value, run on ~390 k values per
 * refresh and spread over eight frames by the dome's chunked update.
 */

const F32 = new Float32Array(1);
const I32 = new Int32Array(F32.buffer);

/** IEEE 754 binary16 bit pattern for `value`, with round-to-nearest-even. */
export function floatToHalf(value: number): number {
  F32[0] = value;
  const x = I32[0];
  let bits = (x >> 16) & 0x8000;
  const exponent = (x >> 23) & 0xff;
  let mantissa = (x >> 12) & 0x07ff;
  if (exponent < 103) return bits; // underflows to signed zero
  if (exponent > 142) {
    // Infinity or NaN — a NaN in the sky would poison the whole mip chain, so clamp to the
    // largest finite half instead of propagating it.
    return bits | 0x7bff;
  }
  if (exponent < 113) {
    mantissa |= 0x0800;
    bits |= (mantissa >> (114 - exponent)) + ((mantissa >> (113 - exponent)) & 1);
    return bits;
  }
  bits |= ((exponent - 112) << 10) | (mantissa >> 1);
  bits += mantissa & 1;
  return bits;
}
