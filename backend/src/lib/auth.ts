import { SignJWT, jwtVerify } from "jose";
import { Request } from "express";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "arik_super_secret_jwt_key_2024"
);

export type TokenPayload = {
  userId: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  name: string;
  avatar?: string;
};

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  // Cookie-based auth
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (match) return match[1];
  // Bearer token fallback
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function getSession(req: Request): Promise<TokenPayload | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
