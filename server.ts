
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularAppEngine = new AngularAppEngine();

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(async (req: Request) => {
    const res = await angularAppEngine.handle(req);
    return res || new Response('Not found', { status: 404 });
});
import './src/main.server';
