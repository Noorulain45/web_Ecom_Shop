import { Router, Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { getSession } from "../lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type."));
  },
});

// POST /api/upload
router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });
  if (!["admin", "superadmin"].includes(session.role))
    return res.status(403).json({ error: "Forbidden." });

  if (!req.file) return res.status(400).json({ error: "No file provided." });

  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "arik-products", resource_type: "image" },
        (err, res) => {
          if (err || !res) return reject(err);
          resolve({ secure_url: res.secure_url, public_id: res.public_id });
        }
      ).end(req.file!.buffer);
    });

    return res.json(result);
  } catch {
    return res.status(500).json({ error: "Upload failed." });
  }
});

export default router;
