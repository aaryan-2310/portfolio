import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import { join } from 'node:path';
// import type { VercelRequest, VercelResponse } from '@vercel/node';
// Paths relative to Vercel's deployment structure
// In Vercel, the function runs from .vercel/output/functions/api/ssr.func/
// The dist folder is included via includeFiles in vercel.json
const distServerFolder = join(process.cwd(), 'dist', 'server');
const distBrowserFolder = join(process.cwd(), 'dist', 'browser');
const indexHtml = join(distServerFolder, 'index.server.html');

let commonEngine: CommonEngine | null = null;
let bootstrap: any = null;

async function getBootstrap() {
    if (!bootstrap) {
        // Dynamic import of the server bundle
        const serverModule = await import(join(distServerFolder, 'main.server.mjs'));
        bootstrap = serverModule.default;
    }
    return bootstrap;
}

export default async function handler(req, res) {
    try {
        if (!commonEngine) {
            commonEngine = new CommonEngine();
        }

        const appBootstrap = await getBootstrap();
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const url = `${protocol}://${host}${req.url}`;

        const html = await commonEngine.render({
            bootstrap: appBootstrap,
            documentFilePath: indexHtml,
            url,
            publicPath: distBrowserFolder,
            providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
        });

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        res.status(200).send(html);
    } catch (err) {
        console.error('SSR Error:', err);
        res.status(500).send('Internal Server Error');
    }
}
