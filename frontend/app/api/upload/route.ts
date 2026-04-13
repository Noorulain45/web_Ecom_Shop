import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { verifyToken } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  // Auth check
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  if (!["admin", "superadmin"].includes(session.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Unsupported file type." }, { status: 422 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File exceeds 5MB limit." }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "arik-products", resource_type: "image" },
        (err, res) => {
          if (err || !res) return reject(err);
          resolve({ secure_url: res.secure_url, public_id: res.public_id });
        }
      ).end(buffer);
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
