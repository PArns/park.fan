/**
 * Re-encode an `ImageResponse` as JPEG.
 *
 * `next/og` (Satori → resvg) can only emit PNG, and PNG is the wrong container for what these
 * cards are: a photograph under a gradient. resvg's encoder writes every pixel of that photo out
 * losslessly, so a place card left the function at ~850 KB — by far the largest response the site
 * serves, and `/api/og` moved 273 MB in 24 h because of it.
 *
 * Measured across the card types (source PNG → JPEG q82 + mozjpeg):
 *
 *     attraction (photo)   853 KB →  57 KB       country (map SVG)    71 KB → 31 KB
 *     park       (photo)   740 KB →  68 KB       glossary (flat)      48 KB → 31 KB
 *     home       (photo)   824 KB →  80 KB
 *
 * JPEG wins for every one of them, including the flat text cards where PNG would normally have
 * the edge — the gradient wash behind them is a continuous tone, which is exactly PNG's weakness.
 *
 * mozjpeg costs ~52 ms more per render than the baseline encoder (70 ms vs 18 ms) and saves a
 * further 18 KB. That trade is lopsided in its favour here: the cards are cached 30 days, so the
 * encode happens once while the saving applies to every serve.
 *
 * The URL ends in `og.jpg` to match (see `OG_IMAGE_FILENAME`). The route keeps answering the old
 * `og.png` directly — not via a redirect — so the name already baked into indexed pages and cached
 * social previews still resolves without an extra hop.
 *
 * Degrades to the original PNG whenever sharp is unavailable or the encode fails, so a problem
 * here means "bigger images", never a broken preview.
 *
 * That fallback is why sharp is imported DYNAMICALLY, inside the try. As a top-level
 * `import sharp from 'sharp'` the module failed to evaluate when the native binary couldn't be
 * dlopen'd in the serverless runtime — before any try/catch could run — and took every OG image
 * on the site to a 500 with it. The package was a devDependency at the time, so it existed during
 * the build (the crop scripts use it) but not in the deployed function. It is a real dependency
 * now, and this import shape makes the route survive being wrong about that again.
 */
export async function ogAsJpeg(image: Response): Promise<Response> {
  // Buffered before the try: `arrayBuffer()` consumes the stream, so the PNG fallback below has to
  // be rebuilt from these bytes — `image` itself is no longer replayable once this line has run.
  const png = Buffer.from(await image.arrayBuffer());
  const headers = new Headers(image.headers);

  try {
    const { default: sharp } = await import('sharp');
    const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    // Carry the caller's headers (Cache-Control above all) and correct the ones that describe the
    // body — Content-Length would otherwise still claim the PNG's size.
    headers.set('Content-Type', 'image/jpeg');
    headers.set('Content-Length', String(jpeg.length));
    return new Response(new Uint8Array(jpeg), { status: image.status, headers });
  } catch (error) {
    // Covers both a failed dlopen of sharp's native binary and a failed encode.
    console.error('[OG Image] JPEG re-encode unavailable, serving PNG:', error);
    headers.set('Content-Length', String(png.length));
    return new Response(new Uint8Array(png), { status: image.status, headers });
  }
}
