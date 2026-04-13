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
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(`${appUrl}/store/login?error=token_failed`);

    // Fetch user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    await connectDB();

    // Find or create user
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
      // Link provider to existing local account
      user.provider = "google";
      user.providerId = profile.id;
      if (!user.avatar) user.avatar = profile.picture;
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
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/store/login?error=server_error`);
  }
}
