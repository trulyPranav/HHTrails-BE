import serverless from 'serverless-http';
import app from '../src/app';

// Wrap the Express app for Vercel serverless execution.
// All requests arriving at Vercel are routed here via vercel.json.
export default serverless(app);
