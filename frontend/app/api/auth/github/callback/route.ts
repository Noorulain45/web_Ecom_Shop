import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code) return NextResponse.redirect(`${appUrl}/store/login?error=no_code`);

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: `${appUrl}/api/auth/github/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(`${appUrl}/store/login?error=token_failed`);

    // Fetch user profile
    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "shop-co-app" },
    });
    const profile = await profileRes.json();

    // GitHub may not expose email publicly — fetch it separately
    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "shop-co-app" },
      });
      const emails: { email: string; primary: boolean; verified: boolean }[] = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? null;
    }

    if (!email) return NextResponse.redirect(`${appUrl}/store/login?error=no_email`);

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

    if (user.isBlocked) return NextResponse.redirect(`${appUrl}/store/login?error=blocked`);

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
    });

    const res = NextResponse.redirect(`${appUrl}/store`);
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/store/login?error=server_error`);
  }
}
