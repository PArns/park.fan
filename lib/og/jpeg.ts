/**
 * Re-encodes an `ImageResponse` as JPEG. `next/og` can only emit PNG, which stores the photo under
 * a card's gradient losslessly and made the OG cards the largest responses on the site; JPEG (q82,
 * mozjpeg) is far smaller for every card type, flat ones included. mozjpeg's extra encode time is
 * paid once, since the cards are cached for 30 days. The URL ends in `og.jpg`
 * (`OG_IMAGE_FILENAME`); the route still answers the old `og.png` directly.
 *
 * Falls back to the PNG when sharp is unavailable or the encode fails. That is why sharp is
 * imported dynamically, inside the try: a top-level import that cannot load the native binary
 * fails module evaluation and takes every OG image to a 500.
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
