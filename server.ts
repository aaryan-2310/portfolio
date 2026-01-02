/* eslint-disable @typescript-eslint/no-unused-vars */
import { CommonEngine } from '@angular/ssr/node';
import { render } from '@netlify/angular-runtime/common-engine';

// Create CommonEngine instance for SSR
const commonEngine = new CommonEngine();

/**
 * Netlify serverless function handler for Angular SSR
 */
export async function netlifyCommonEngineHandler(
  request: Request,
  context: unknown,
): Promise<Response> {
  // Example API endpoints can be defined here.
  // Uncomment and define endpoints as necessary.
  // const pathname = new URL(request.url).pathname;
  // if (pathname === '/api/hello') {
  //   return Response.json({ message: 'Hello from the API' });
  // }

  return await render(commonEngine);
}

/**
 * Local development server using Express
 * Only runs when executed directly (not on Netlify)
 */
async function runLocalServer(): Promise<void> {
  // Dynamic imports to avoid loading these modules on Netlify Edge
  const { APP_BASE_HREF } = await import('@angular/common');
  const express = (await import('express')).default;
  const { fileURLToPath } = await import('node:url');
  const { dirname, join, resolve } = await import('node:path');
  const bootstrap = (await import('./src/main.server')).default;

  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve static files from /browser
  server.get(
    '**',
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: 'index.html',
    }),
  );

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then(html => res.send(html))
      .catch(err => next(err));
  });

  const port = process.env['PORT'] || 4000;
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Only run local server if not on Netlify (check for NETLIFY environment variable)
if (!process.env['NETLIFY']) {
  runLocalServer();
}
