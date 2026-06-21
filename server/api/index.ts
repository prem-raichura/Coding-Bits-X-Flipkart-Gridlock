// Vercel serverless entry. vercel.json routes all requests here.
// @vercel/node serves an exported Express app directly (Node req/res),
// so we simply re-export the app built in src/index.ts.
import app from '../src/index.js';

export default app;
