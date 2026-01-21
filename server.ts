
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const angularAppEngine = new AngularAppEngine();

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(async (req: Request) => {
    const res = await angularAppEngine.handle(req);
    return res || new Response('Not found', { status: 404 });
});

/**
 * The standard Express server for local development and Node.js hosting.
 * Note: Vercel can also use this if configured, but typically uses the reqHandler.
 */
// If you want to run this as a standalone Node server (e.g. `node dist/server/server.mjs`):
// We need to verify if we are in the main module.

// However, for Vercel deployment, `reqHandler` is the key.
// And we need to ensure the MANIFEST is loaded if we are in a non-standard build env.
// But standard `ng build` SHOULD inject the manifest into `server.ts` if it is the entry point
// AND it follows the pattern.
// User had trouble with manifest before. Importing `main.server` fixed it.
// I will KEEP the import of `main.server` to be safe.

import './src/main.server';

// Optional: standard express for local testing if `npm run serve:ssr` is used.
// (Simplified for now to just Vercel/Edge compatibility focus, but Vercel uses Node by default unless configured otherwise)
