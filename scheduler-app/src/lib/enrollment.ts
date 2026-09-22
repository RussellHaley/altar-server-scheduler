import { createHash, randomBytes } from "crypto";

export function createEnrollmentToken() {
  return randomBytes(32).toString("base64url");
}

export function hashEnrollmentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isInvitationUsable(invitation: { usedAt: Date | null; cancelledAt: Date | null; expiresAt: Date }, now = new Date()) {
  return !invitation.usedAt && !invitation.cancelledAt && invitation.expiresAt > now;
}
