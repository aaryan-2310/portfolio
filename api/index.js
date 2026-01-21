
// Vercel Serverless Function entry point
// This file delegates to the Angular SSR bundle.

export default async function handler(req, res) {
  try {
    // Import the Angular server bundle dynamically.
    const server = await import('../dist/server/server.mjs');
    
    // Delegate to the requested handler exported from server.ts
    // createRequestHandler returns (req, res, next)
    await server.reqHandler(req, res, (err) => {
       if (err) {
         console.error('SSR Error:', err);
         res.status(500).send('Internal Server Error');
       }
    });
  } catch (e) {
    console.error('Failed to load SSR bundle:', e);
    
    // Fallback or explicit error
    res.status(500).send(`Error loading server bundle: ${e.message}`);
  }
}
