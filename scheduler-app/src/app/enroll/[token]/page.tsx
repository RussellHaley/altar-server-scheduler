import { auth } from "@/auth";
import { acceptEnrollmentInvitation } from "@/app/actions";
import { googleEnrollmentSignIn, logout } from "@/app/auth-actions";
import { hashEnrollmentToken, isInvitationUsable } from "@/lib/enrollment";
import { prisma } from "@/lib/prisma";

export default async function EnrollmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await prisma.enrollmentInvitation.findUnique({ where: { tokenHash: hashEnrollmentToken(token) } });
  if (!invitation || !isInvitationUsable(invitation)) return <main className="shell"><h1>Invitation unavailable</h1><section className="card"><p>This invitation is invalid, expired, already used, or cancelled.</p></section></main>;
  const session = await auth();
  if (!session) return <main className="shell"><h1>Accept scheduler invitation</h1><section className="card"><p>Sign in with the invited Google account to continue.</p><form action={googleEnrollmentSignIn}><input type="hidden" name="token" value={token} /><button type="submit">Sign in with Google</button></form></section></main>;
  const signedInEmail = session.user.email?.toLowerCase();
  if (signedInEmail !== invitation.email.toLowerCase()) return <main className="shell"><h1>Wrong Google account</h1><section className="card"><p>This invitation was issued for a different email address. Sign out, then open the invitation link again with the invited Google account.</p><p>Currently signed in as {session.user.email}.</p><form action={logout}><button type="submit">Sign out</button></form></section></main>;
  return <main className="shell"><h1>Accept scheduler invitation</h1><section className="card"><p>This will enroll {invitation.email} for access to the parish scheduler.</p><form action={acceptEnrollmentInvitation} className="form"><input type="hidden" name="token" value={token} /><label>Primary phone <input name="phonePrimary" type="tel" autoComplete="tel" /></label><label>Secondary phone <input name="phoneSecondary" type="tel" /></label><button type="submit">Accept invitation</button></form></section></main>;
}
