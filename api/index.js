
// Vercel Serverless Function entry point
// This file delegates to the Angular SSR bundle.

export default async function handler(req, res) {
  // Import the Angular server bundle dynamically.
  // The path is relative to the current file at RUNTIME.
  const server = await import('../dist/server/server.mjs');
  
  // Delegate to the requested handler exported from server.ts
  const response = await server.reqHandler(req);
  
  // If the response is a standard Web Response (Fetch API), we need to pipe it to the Node response.
  if (response instanceof Response) {
      // Set status and headers
      res.status(response.status);
      response.headers.forEach((value, key) => {
          res.setHeader(key, value);
      });
      
      // Stream the body
      const body = await response.text(); // Or arrayBuffer for binary
      res.send(body);
  } else {
      // If it's already handling the response (Express style), we might not need to do anything?
      // createRequestHandler returns a function that takes (req) -> Promise<Response>.
      // So the logic above handles the Response object.
  }
}
