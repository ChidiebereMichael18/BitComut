import express from "express";
import cors from "cors";
import { config } from "./config";
import { connectDb } from "./db/pool";
import { studentRouter } from "./routes/student";
import { universityRouter } from "./routes/university";
import { adminRouter } from "./routes/admin";
import { uploadRouter } from "./routes/upload";
import { authRouter } from "./routes/auth";
import { seedAdmin } from "./services/auth";
import { errorHandler, notFound } from "./middleware/handlers";
import { currentRailKind, getRailStatus } from "./services/payments";

export async function start(): Promise<void> {
  await connectDb();
  await seedAdmin();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Serve uploaded profile pictures (public/uploads).
  app.use("/uploads", express.static(config.UPLOAD_DIR));

  app.get(
    "/health",
    async (_req, res) =>
      res.json({
        ok: true,
        service: "bitpulse",
        corridor: `${config.CORRIDOR_FROM}->${config.CORRIDOR_TO}`,
        rail: currentRailKind(),
        ...(await getRailStatus()),
      })
  );

  app.use("/api/auth", authRouter);
  app.use("/api/student", studentRouter);
  app.use("/api/university", universityRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/upload", uploadRouter);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(config.PORT, () => {
    console.log(`[server] BitPulse backend listening on http://localhost:${config.PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
}
