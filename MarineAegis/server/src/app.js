import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

export function createApp() {
  const app = express();
  const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: allowedOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/api/health", (req, res) => {
    res.json({ success: true, service: "marineaegis-api" });
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/forms", formRoutes);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(clientDist));
    app.get("/{*path}", (req, res) => res.sendFile(path.join(clientDist, "index.html")));
  } else {
    app.use(notFound);
  }

  app.use(errorHandler);
  return app;
}
