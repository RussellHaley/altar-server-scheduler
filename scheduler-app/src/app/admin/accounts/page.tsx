import { auth } from "@/auth";
import { cancelEnrollmentInvitation, createEnrollmentInvitation } from "@/app/actions";
import { AdminNav } from "@/components/admin-nav";
import { isInvitationUsable } from "@/lib/enrollment";
import { prisma } from "@/lib/prisma";

function invitationStatus(invitation: { usedAt: Date | null; cancelledAt: Date | null; expiresAt: Date }) {
  if (invitation.usedAt) return "Used";
  if (invitation.cancelledAt) return "Cancelled";
  if (invitation.expiresAt <= new Date()) return "Expired";
  return "Pending";
}

export default async function AccountAdminPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdministrator) return <main className="shell"><h1>Administrator access required</h1></main>;
  const params = await searchParams;
  const createdToken = params.created;
  const [users, invitations] = await Promise.all([
    prisma.userAccount.findMany({
      include: {
        adultProfile: true,
        managedMinors: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      },
      orderBy: { displayName: "asc" },
    }),
    prisma.enrollmentInvitation.findMany({
      include: { createdBy: true, usedBy: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return <main className="shell">
    <p><a href="/admin">← Administration</a></p>
    <AdminNav />
    <h1>Accounts</h1>
    <p>Manage adult login accounts, contact details, administrator access, profile links, and enrollment invitations.</p>
    {createdToken && <section className="card">
      <h2>Invitation link created</h2>
      <p>This link is shown once. Send it manually to the invited person.</p>
      <input readOnly value={`/enroll/${createdToken}`} className="copy-field" aria-label="Enrollment link" />
    </section>}
    <div className="grid">
      <section className="card">
        <h2>Create invitation</h2>
        <form action={createEnrollmentInvitation} className="form">
          <label>Email address <input name="email" type="email" required /></label>
          <button type="submit">Create enrollment link</button>
        </form>
      </section>
      <section className="card">
        <h2>Enrollment policy</h2>
        <p>Only an existing parish account, a configured bootstrap administrator, or a valid invitation can create scheduler access. Invitations expire after 14 days and are tied to one email address.</p>
      </section>
    </div>
    <section className="card"><h2>Existing accounts</h2>{users.length === 0 ? <p>No user accounts have enrolled yet.</p> : <div className="server-list">
      {users.map((user) => <a className="server-row" href={`/admin/accounts/${user.id}`} key={user.id}>
        <span><strong>{user.displayName}</strong><small>{user.email}{user.isAdministrator ? " · administrator" : ""}</small></span>
        <span>{user.adultProfile ? `Linked to ${user.adultProfile.firstName} ${user.adultProfile.lastName}` : "No adult server profile"}<small>{user.managedMinors.length} managed minor{user.managedMinors.length === 1 ? "" : "s"}</small></span>
      </a>)}
    </div>}</section>
    <section className="card">
      <h2>Invitations</h2>
      {invitations.length === 0 ? <p>No invitations have been created.</p> : <div className="server-list">
        {invitations.map((invitation) => {
          const usable = isInvitationUsable(invitation);
          return <div className="server-row" key={invitation.id}>
            <span><strong>{invitation.email}</strong><small>{invitationStatus(invitation)} · expires {invitation.expiresAt.toLocaleDateString()}</small></span>
            <span>
              Created by {invitation.createdBy.displayName}
              <small>{invitation.usedBy ? `Used by ${invitation.usedBy.displayName}` : invitation.invitationType.replaceAll("_", " ").toLowerCase()}</small>
              {usable && <form action={cancelEnrollmentInvitation} className="inline-form">
                <input type="hidden" name="invitationId" value={invitation.id} />
                <button type="submit" className="quiet-button">Cancel</button>
              </form>}
            </span>
          </div>;
        })}
      </div>}
    </section>
  </main>;
}
