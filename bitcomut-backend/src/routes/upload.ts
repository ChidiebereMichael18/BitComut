import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { pool } from "../db/pool";
import { audit } from "../services/audit";
import { config } from "../config";
import { asyncHandler, HttpError } from "../middleware/handlers";
import { requireAuth, requireStudentAccess, requireUniversityAccess } from "../middleware/auth";

// Ensure the upload directory exists before multer tries to write to it.
if (config.UPLOAD_DIR) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const MAX_PROFILE_PIC_BYTES = 5 * 1024 * 1024; // 5 MB

function publicUrl(fileName: string): string {
  const base = (config.BASE_URL || `http://localhost:${config.PORT}`).replace(/\/$/, "");
  return `${base}/uploads/${fileName}`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME[file.mimetype] ?? ".bin";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_PROFILE_PIC_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME[file.mimetype]) return cb(null, true);
    cb(new HttpError(400, "Only JPEG, PNG, WebP or GIF images are allowed"));
  },
});

export const uploadRouter = Router();

// Upload a profile picture for a student or a university.
// Body: multipart/form-data
//   profile_pic : the image file (max 5 MB)
//   kind        : "student" | "university"
//   id          : the owner's UUID
uploadRouter.post(
  "/profile-pic",
  requireAuth,
  upload.single("profile_pic"),
  asyncHandler(async (req, res) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) throw new HttpError(400, "profile_pic file is required");

    const { kind, id } = req.body as { kind?: string; id?: string };
    if ((kind !== "student" && kind !== "university") || !id) {
      throw new HttpError(400, "kind (student|university) and id are required");
    }

    // Only the owner (or an admin) may set a profile picture.
    if (kind === "student") requireStudentAccess(req, id);
    else requireUniversityAccess(req, id);

    const url = publicUrl(file.filename);
    let updated;

    if (kind === "student") {
      const { rows } = await pool.query(
        `UPDATE students SET profile_pic = $1 WHERE id = $2 RETURNING id, name, profile_pic`,
        [url, id]
      );
      updated = rows[0];
    } else {
      const { rows } = await pool.query(
        `UPDATE universities SET profile_pic = $1 WHERE id = $2 RETURNING id, name, profile_pic`,
        [url, id]
      );
      updated = rows[0];
    }

    if (!updated) {
      // Record not found -> remove the just-written file so nothing is orphaned.
      fs.rmSync(path.join(config.UPLOAD_DIR, file.filename), { force: true });
      throw new HttpError(404, `${kind} not found`);
    }

    await audit({
      actor: kind,
      action: `${kind}.profile_pic_updated`,
      entity: kind === "student" ? "students" : "universities",
      entityId: id,
      meta: { profile_pic: url },
    });

    res.json({ ok: true, url, profile_pic: url, ...updated });
  })
);
