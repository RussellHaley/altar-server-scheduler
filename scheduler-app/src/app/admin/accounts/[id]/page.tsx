import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { linkAdultProfileAccount, updateUserAccountContact } from "@/app/actions";
import { AdminNav } from "@/components/admin-nav";
import { prisma } from "@/lib/prisma";

function invitationStatus(invitation: { usedAt: Date | null; cancelledAt: Date | null; expiresAt: Date }) {
  if (invitation.usedAt) return "Used";
  if (invitation.cancelledAt) return "Cancelled";
  if (invitation.expiresAt <= new Date()) return "Expired";
  return "Pending";
}

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdministrator) return <main className="shell"><h1>Administrator access required</h1></main>;
  const { id } = await params;
  const [user, adultProfiles] = await Promise.all([
    prisma.userAccount.findUnique({
      where: { id },
      include: {
        adultProfile: true,
        managedMinors: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      },
    }),
    prisma.serverProfile.findMany({
      where: { kind: "ADULT", OR: [{ accountId: null }, { accountId: id }] },
      include: { account: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);
  if (!user) notFound();
  const relevantInvitations = await prisma.enrollmentInvitation.findMany({
    where: { OR: [{ usedById: user.id }, { email: user.email }] },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return <main className="shell">
    <p><a href="/admin/accounts">← Accounts</a></p>
    <AdminNav />
    <h1>{user.displayName}</h1>
    <div className="grid">
      <section className="card"><h2>Account</h2><dl className="details"><dt>Email</dt><dd>{user.email}</dd><dt>Administrator</dt><dd>{user.isAdministrator ? "Yes" : "No"}</dd><dt>Created</dt><dd>{user.createdAt.toLocaleDateString()}</dd><dt>Updated</dt><dd>{user.updatedAt.toLocaleDateString()}</dd></dl>
        <form action={updateUserAccountContact} className="form">
          <input type="hidden" name="accountId" value={user.id} />
          <label>Display name <input name="displayName" defaultValue={user.displayName} required /></label>
          <label>Primary phone <input name="phonePrimary" type="tel" defaultValue={user.phonePrimary ?? ""} /></label>
          <label>Secondary phone <input name="phoneSecondary" type="tel" defaultValue={user.phoneSecondary ?? ""} /></label>
          <label>Administrator <select name="administratorValue" defaultValue={user.isAdministrator ? "true" : "false"}><option value="false">No</option><option value="true">Yes</option></select></label>
          <button type="submit">Update account</button>
        </form>
      </section>
      <section className="card"><h2>Adult server profile</h2>{user.adultProfile ? <p>Linked to <a href={`/admin/servers/${user.adultProfile.id}`}>{user.adultProfile.firstName} {user.adultProfile.lastName}</a>.</p> : <p>No adult server profile is linked.</p>}
        <form action={linkAdultProfileAccount} className="form">
          <input type="hidden" name="accountId" value={user.id} />
          <input type="hidden" name="returnTo" value={`/admin/accounts/${user.id}`} />
          <label>Adult profile <select name="profileId" defaultValue={user.adultProfile?.id ?? ""} required><option value="">Select adult profile</option>{adultProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.firstName} {profile.lastName}{profile.accountId && profile.accountId !== user.id ? ` (${profile.account?.displayName})` : ""}</option>)}</select></label>
          <button type="submit">Link profile</button>
        </form>
        {user.adultProfile && <form action={linkAdultProfileAccount} className="inline-form"><input type="hidden" name="profileId" value={user.adultProfile.id} /><input type="hidden" name="accountId" value="" /><input type="hidden" name="returnTo" value={`/admin/accounts/${user.id}`} /><button type="submit" className="quiet-button">Unlink profile</button></form>}
      </section>
    </div>
    <section className="card"><h2>Managed minors</h2>{user.managedMinors.length === 0 ? <p>No managed minor profiles.</p> : <div className="server-list">{user.managedMinors.map((profile) => <a className="server-row" href={`/admin/servers/${profile.id}`} key={profile.id}><span><strong>{profile.firstName} {profile.lastName}</strong><small>{profile.status.toLowerCase()}</small></span><span>Minor<small>Born {profile.dateOfBirth.toLocaleDateString()}</small></span></a>)}</div>}</section>
    <section className="card"><h2>Invitation history</h2>{relevantInvitations.length === 0 ? <p>No invitations are recorded for this account.</p> : <ul className="plain-list">{relevantInvitations.map((invitation) => <li key={invitation.id}><span><strong>{invitation.email}</strong><small>{invitationStatus(invitation)} · created {invitation.createdAt.toLocaleDateString()} · expires {invitation.expiresAt.toLocaleDateString()}</small></span></li>)}</ul>}</section>
  </main>;
}
