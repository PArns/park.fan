const INDEXNOW_KEY = 'f179c6a9d9f0022913e75fae2dcaa75a';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const BASE_URL = 'https://park.fan';

export async function submitUrlsToIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: 'park.fan',
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });

  if (!response.ok) {
    throw new Error(`IndexNow submission failed: ${response.status} ${response.statusText}`);
  }
}
