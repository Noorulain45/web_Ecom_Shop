import { Router, Request, Response } from "express";
import { connectDB } from "../lib/db";
import User from "../models/User";
import { getSession } from "../lib/auth";

const router = Router();

// PATCH /api/users/me — update own profile (name, avatar)
router.patch("/me", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });

  await connectDB();
  const { name, avatar } = req.body;
  const update: Record<string, unknown> = {};
  if (name && typeof name === "string") update.name = name.trim();
  if (typeof avatar === "string") update.avatar = avatar;

  if (Object.keys(update).length === 0)
    return res.status(400).json({ error: "Nothing to update." });

  const user = await User.findByIdAndUpdate(session.userId, update, { new: true }).select("-password");
  if (!user) return res.status(404).json({ error: "User not found." });
  return res.json(user);
});

// GET /api/users
router.get("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session || session.role !== "superadmin")
    return res.status(403).json({ error: "Forbidden." });

  await connectDB();
  const role = req.query.role as string | undefined;
  const query = role ? { role } : {};

  const users = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();
  return res.json(users);
});

// PATCH /api/users/:id
router.patch("/:id", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session || session.role !== "superadmin")
    return res.status(403).json({ error: "Forbidden." });

  const { id } = req.params;
  if (id === session.userId)
    return res.status(400).json({ error: "You cannot modify your own account." });

  await connectDB();
  const update: Record<string, unknown> = {};
  if (typeof req.body.isBlocked === "boolean") update.isBlocked = req.body.isBlocked;

  if (Object.keys(update).length === 0)
    return res.status(400).json({ error: "Nothing to update." });

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select("-password");
  if (!user) return res.status(404).json({ error: "User not found." });
  return res.json(user);
});

// DELETE /api/users/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session || session.role !== "superadmin")
    return res.status(403).json({ error: "Forbidden." });

  const { id } = req.params;
  if (id === session.userId)
    return res.status(400).json({ error: "You cannot delete your own account." });

  await connectDB();
  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ error: "User not found." });
  return res.json({ success: true });
});

export default router;
