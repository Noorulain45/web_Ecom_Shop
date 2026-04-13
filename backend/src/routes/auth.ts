import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import User from "../models/User";
import { signToken, getSession } from "../lib/auth";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function setCookieToken(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 * 1000,
    path: "/",
  });
}

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const valid = await bcrypt.compare(password, user.password!);
    if (!valid) return res.status(401).json({ error: "Invalid credentials." });

    if (user.isBlocked)
      return res.status(403).json({ error: "Your account has been blocked. Contact support." });

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
    });

    setCookieToken(res, token);
    return res.json({ message: "Logged in.", role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required." });

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already in use." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: "user" });

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    setCookieToken(res, token);
    return res.status(201).json({ message: "Registered successfully.", role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("auth_token", { path: "/" });
  return res.json({ message: "Logged out." });
});

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });

  await connectDB();
  const user = await User.findById(session.userId).select("loyaltyPoints").lean();
  const loyaltyPoints = (user as any)?.loyaltyPoints ?? 0;
  return res.json({ ...session, loyaltyPoints });
});

// ─── Google OAuth ────────────────────────────────────────────────────────────

router.get("/google", (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${FRONTEND_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/google/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.redirect(`${FRONTEND_URL}/store/login?error=no_code`);

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${FRONTEND_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token)
      return res.redirect(`${FRONTEND_URL}/store/login?error=token_failed`);

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as any;

    await connectDB();
    let user = await User.findOne({ email: profile.email });
    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email,
        avatar: profile.picture,
        provider: "google",
        providerId: profile.id,
        role: "user",
      });
    } else if (!user.providerId) {
      user.provider = "google";
      user.providerId = profile.id;
      if (!user.avatar) user.avatar = profile.picture;
      await user.save();
    }

    if (user.isBlocked) return res.redirect(`${FRONTEND_URL}/store/login?error=blocked`);

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
    });

    setCookieToken(res, token);
    return res.redirect(`${FRONTEND_URL}/store`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return res.redirect(`${FRONTEND_URL}/store/login?error=server_error`);
  }
});

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────

router.get("/github", (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${FRONTEND_URL}/api/auth/github/callback`,
    scope: "read:user user:email",
  });
  return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get("/github/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.redirect(`${FRONTEND_URL}/store/login?error=no_code`);

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: `${FRONTEND_URL}/api/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token)
      return res.redirect(`${FRONTEND_URL}/store/login?error=token_failed`);

    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "arik-app" },
    });
    const profile = await profileRes.json() as any;

    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "arik-app" },
      });
      const emails: { email: string; primary: boolean; verified: boolean }[] = await emailsRes.json() as any;
      email = emails.find((e) => e.primary && e.verified)?.email ?? null;
    }
    if (!email) return res.redirect(`${FRONTEND_URL}/store/login?error=no_email`);

    await connectDB();
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.login,
        email,
        avatar: profile.avatar_url,
        provider: "github",
        providerId: String(profile.id),
        role: "user",
      });
    } else if (!user.providerId) {
      user.provider = "github";
      user.providerId = String(profile.id);
      if (!user.avatar) user.avatar = profile.avatar_url;
      await user.save();
    }

    if (user.isBlocked) return res.redirect(`${FRONTEND_URL}/store/login?error=blocked`);

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
    });

    setCookieToken(res, token);
    return res.redirect(`${FRONTEND_URL}/store`);
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    return res.redirect(`${FRONTEND_URL}/store/login?error=server_error`);
  }
});

// ─── Discord OAuth ────────────────────────────────────────────────────────────

router.get("/discord", (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${FRONTEND_URL}/api/auth/discord/callback`,
    response_type: "code",
    scope: "identify email",
  });
  return res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

router.get("/discord/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.redirect(`${FRONTEND_URL}/store/login?error=no_code`);

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${FRONTEND_URL}/api/auth/discord/callback`,
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token)
      return res.redirect(`${FRONTEND_URL}/store/login?error=token_failed`);

    const profileRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as any;
    if (!profile.email) return res.redirect(`${FRONTEND_URL}/store/login?error=no_email`);

    const avatar = profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator || "0") % 5}.png`;

    await connectDB();
    let user = await User.findOne({ email: profile.email });
    if (!user) {
      user = await User.create({
        name: profile.global_name || profile.username,
        email: profile.email,
        avatar,
        provider: "discord",
        providerId: profile.id,
        role: "user",
      });
    } else if (!user.providerId) {
      user.provider = "discord";
      user.providerId = profile.id;
      if (!user.avatar) user.avatar = avatar;
      await user.save();
    }

    if (user.isBlocked) return res.redirect(`${FRONTEND_URL}/store/login?error=blocked`);

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
    });

    setCookieToken(res, token);
    return res.redirect(`${FRONTEND_URL}/store`);
  } catch (err) {
    console.error("Discord OAuth error:", err);
    return res.redirect(`${FRONTEND_URL}/store/login?error=server_error`);
  }
});

export default router;
