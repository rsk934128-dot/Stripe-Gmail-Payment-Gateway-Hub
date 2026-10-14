import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import app from './server-api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Vite Middleware integration in dev or static files in prod
async function startServer() {
  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          watch: null,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('⚠️ Vite dev server middleware failed to mount, serving static files:', err);
      mountStaticServing();
    }
  } else {
    mountStaticServing();
  }

  function mountStaticServing() {
    app.use('/src/assets', express.static(path.join(__dirname, 'src/assets')));
    app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));
    app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (_req, res) => {
      const distIndex = path.join(__dirname, 'dist', 'index.html');
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        const publicIndex = path.join(__dirname, 'index.html');
        if (fs.existsSync(publicIndex)) {
          res.sendFile(publicIndex);
        } else {
          res.status(404).send('Application build in progress. Please run npm run build.');
        }
      }
    });
  }

  // Terminal catch-all error middleware for static files or server errors
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('🚨 [Server Root Exception]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        code: 'SERVER_EXCEPTION',
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Stripe & Gmail Gateway Hub running at http://localhost:${PORT}`);
  });
}

// Only start the standalone listener if not running in a serverless environment (like Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
