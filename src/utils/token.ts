import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { randomUUID } from "crypto";
import db from "../db/index.js";
import type { LinkTokenRow } from "../types/index.js";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const expiresIn = process.env.JWT_EXPIRES_IN ?? "10m";

export interface LinkTokenPayload extends JWTPayload {
  discord_id: string;
  jti: string;
}

export async function generateLinkToken(discordId: string): Promise<string> {
  const jti = randomUUID();

  const token = await new SignJWT({ discord_id: discordId })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  // Persist token record so we can mark it as used
  const expiresAt = new Date(Date.now() + parseExpiry(expiresIn)).toISOString();
  db.prepare(
    "INSERT INTO link_tokens (token_id, discord_id, expires_at, used) VALUES (?, ?, ?, 0)",
  ).run(jti, discordId, expiresAt);

  return token;
}

export async function verifyLinkToken(
  token: string,
): Promise<LinkTokenPayload> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

  const jti = payload.jti;
  if (!jti || typeof payload["discord_id"] !== "string") {
    throw new Error("Invalid token payload");
  }

  const row = db
    .prepare("SELECT * FROM link_tokens WHERE token_id = ?")
    .get(jti) as LinkTokenRow | undefined;

  if (!row) throw new Error("Token not found");
  if (row.used) throw new Error("Token already used");

  return payload as LinkTokenPayload;
}

export function consumeLinkToken(jti: string): void {
  db.prepare("UPDATE link_tokens SET used = 1 WHERE token_id = ?").run(jti);
}

/** Convert expiresIn string like "10m", "1h" to milliseconds */
function parseExpiry(s: string): number {
  const match = s.match(/^(\d+)([smhd])$/);
  if (!match) return 10 * 60 * 1000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const map: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };
  return n * map[unit];
}
