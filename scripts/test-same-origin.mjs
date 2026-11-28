// A write on a cookie-authenticated route must come from a page of this origin: the session
// cookie is SameSite=Strict, and every *.park.fan host is the same site.
import { isCrossOriginWrite } from '../lib/security/same-origin.ts';
import { runCases } from './lib/run-cases.mjs';

const req = (method, headers = {}) => ({ method, headers: new Headers(headers) });

const testCases = [
  {
    name: 'A read is never refused',
    actual: () => isCrossOriginWrite(req('GET', { 'sec-fetch-site': 'cross-site' })),
    expected: false,
  },
  {
    name: 'A same-origin write passes',
    actual: () => isCrossOriginWrite(req('POST', { 'sec-fetch-site': 'same-origin' })),
    expected: false,
  },
  {
    name: 'A write from a sibling host is refused',
    actual: () => isCrossOriginWrite(req('POST', { 'sec-fetch-site': 'same-site' })),
    expected: true,
  },
  {
    name: 'A write from another site is refused',
    actual: () => isCrossOriginWrite(req('DELETE', { 'sec-fetch-site': 'cross-site' })),
    expected: true,
  },
  {
    name: 'Without Sec-Fetch-Site the Origin decides: same host passes',
    actual: () =>
      isCrossOriginWrite(req('PATCH', { origin: 'https://park.fan', host: 'park.fan' })),
    expected: false,
  },
  {
    name: 'Without Sec-Fetch-Site the Origin decides: another host is refused',
    actual: () =>
      isCrossOriginWrite(req('PATCH', { origin: 'https://api.park.fan', host: 'park.fan' })),
    expected: true,
  },
  {
    name: 'A caller that sends neither header is not a browser page',
    actual: () => isCrossOriginWrite(req('POST')),
    expected: false,
  },
];

console.log('🧪 Testing the same-origin check for cookie-authenticated writes\n');

await runCases(testCases);
