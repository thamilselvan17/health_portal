import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "5mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);

let setupDone = false;
let setupError: Error | null = null;

const setupPromise = (async () => {
  try {
    // Dynamic import so native-module errors are caught here
    const { registerRoutes } = await import("../server/routes");
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express error handler:", err);
      if (res.headersSent) return next(err);
      return res.status(status).json({ message });
    });

    setupDone = true;
  } catch (err: any) {
    console.error("FATAL: Failed to initialize API handler:", err);
    setupError = err;

    // Fallback: still respond so Vercel doesn't show a generic 500
    app.use((_req: Request, res: Response) => {
      res.status(500).json({
        message: "Server initialization failed",
        error: err?.message || String(err),
      });
    });
    setupDone = true;
  }
})();

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: any, res: any) {
  if (!setupDone) {
    await setupPromise;
  }
  app(req, res);
}
