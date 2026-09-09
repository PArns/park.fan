/**
 * A node resolve hook so `selftest.mjs` can import `main.ts` and count what it leaks.
 *
 * `main.ts` imports Babylon the way the whole project does — deep and extensionless
 * (`@babylonjs/core/Meshes/mesh`) — which is what the bundler wants and what bare node ESM refuses.
 * `scripts/register-path-alias.mjs` already probes extensions for the project's own relative and
 * `@/` imports; it does not for a package's subpath, and it is not this module's file to edit. So
 * the selftest registers this on top of it for the one thing it needs.
 *
 * Node-only, loaded through `module.register()` at runtime, and imported by nothing the bundler
 * can see. It exists so the "no leak across three dispose/reboot cycles" line of the budget rubric
 * has a measurement behind it — see `selftest.mjs`, section 9.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@babylonjs/') && !/\.(js|mjs|cjs|json)$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.js`, context);
    } catch {
      /* not a file — fall through and let the default resolver answer */
    }
  }
  return nextResolve(specifier, context);
}
