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
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${appUrl}/api/auth/discord/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(`${appUrl}/store/login?error=token_failed`);

    // Fetch user profile
    const profileRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) return NextResponse.redirect(`${appUrl}/store/login?error=no_email`);

    // Build avatar URL
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
    console.error("Discord OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/store/login?error=server_error`);
  }
}
