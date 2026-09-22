import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { grantQualification, linkAdultProfileAccount, revokeQualification, updateProfileStatus, updateUserAccountContact } from "@/app/actions";
import { AdminNav } from "@/components/admin-nav";
import { prisma } from "@/lib/prisma";

export default async function ServerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdministrator) return <main className="shell"><h1>Administrator access required</h1></main>;
  const { id } = await params;
  const [profile, roles, userAccounts] = await Promise.all([
    prisma.serverProfile.findUnique({
      where: { id },
      include: {
        account: true,
        manager: true,
        qualifications: { include: { role: true, grantedBy: true }, orderBy: { role: { displayOrder: "asc" } } },
        assignments: { include: { slot: { include: { requirement: { include: { role: true } }, service: { include: { rota: true } } } } }, orderBy: { assignedAt: "desc" } },
      },
    }),
    prisma.role.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }),
    prisma.userAccount.findMany({ include: { adultProfile: true }, orderBy: { displayName: "asc" } }),
  ]);
  if (!profile) notFound();
  const availableRoles = roles.filter((role) => !profile.qualifications.some((qualification) => qualification.roleId === role.id));
  const linkableAccounts = userAccounts.filter((account) => !account.adultProfile || account.adultProfile.id === profile.id);
  const contactAccount = profile.kind === "ADULT" ? profile.account : profile.manager;
  return <main className="shell">
    <p><a href="/admin/servers">← Server administration</a></p>
    <AdminNav />
    <h1>{profile.firstName} {profile.lastName}</h1>
    <div className="grid">
      <section className="card"><h2>Profile</h2><dl className="details"><dt>Type</dt><dd>{profile.kind === "MINOR" ? "Minor" : "Adult"}</dd><dt>Date of birth</dt><dd>{profile.dateOfBirth.toLocaleDateString()}</dd><dt>Linked account</dt><dd>{profile.account ? <a href={`/admin/accounts/${profile.account.id}`}>{profile.account.displayName} ({profile.account.email})</a> : "Not recorded"}</dd><dt>Managing adult</dt><dd>{profile.manager ? <a href={`/admin/accounts/${profile.manager.id}`}>{profile.manager.displayName} ({profile.manager.email})</a> : "Not recorded"}</dd><dt>Status</dt><dd>{profile.status}</dd></dl>
        <form action={updateProfileStatus} className="inline-form"><input type="hidden" name="profileId" value={profile.id} /><select name="status" defaultValue={profile.status}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><button type="submit">Update status</button></form>
        {profile.kind === "ADULT" && <form action={linkAdultProfileAccount} className="form"><input type="hidden" name="profileId" value={profile.id} /><input type="hidden" name="returnTo" value={`/admin/servers/${profile.id}`} /><label>Linked account <select name="accountId" defaultValue={profile.accountId ?? ""}><option value="">No linked account</option>{linkableAccounts.map((account) => <option key={account.id} value={account.id}>{account.displayName} ({account.email})</option>)}</select></label><button type="submit">Update linked account</button></form>}
      </section>
      <section className="card"><h2>Contact</h2>{contactAccount ? <><dl className="details"><dt>Name</dt><dd>{contactAccount.displayName}</dd><dt>Email</dt><dd>{contactAccount.email}</dd><dt>Primary phone</dt><dd>{contactAccount.phonePrimary || "Not recorded"}</dd><dt>Secondary phone</dt><dd>{contactAccount.phoneSecondary || "Not recorded"}</dd></dl><form action={updateUserAccountContact} className="form"><input type="hidden" name="accountId" value={contactAccount.id} /><input type="hidden" name="profileId" value={profile.id} /><label>Primary phone <input name="phonePrimary" type="tel" defaultValue={contactAccount.phonePrimary ?? ""} /></label><label>Secondary phone <input name="phoneSecondary" type="tel" defaultValue={contactAccount.phoneSecondary ?? ""} /></label><button type="submit">Update contact</button></form></> : <p>No linked account contact is recorded for this profile.</p>}</section>
      <section className="card"><h2>Qualifications</h2>{profile.qualifications.length === 0 ? <p>No qualifications granted.</p> : <ul className="plain-list">{profile.qualifications.map((qualification) => <li key={qualification.id}><span><strong>{qualification.role.name}</strong> ({qualification.role.abbreviation})<small>Granted {qualification.grantedAt.toLocaleDateString()} by {qualification.grantedBy.displayName}</small></span><form action={revokeQualification}><input type="hidden" name="qualificationId" value={qualification.id} /><input type="hidden" name="profileId" value={profile.id} /><button className="quiet-button" type="submit">Revoke</button></form></li>)}</ul>}
        {availableRoles.length > 0 && <form action={grantQualification} className="inline-form"><input type="hidden" name="profileId" value={profile.id} /><select name="roleId" required><option value="">Grant qualification</option>{availableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button type="submit">Grant</button></form>}
      </section>
    </div>
    <section className="card"><h2>Service assignments</h2>{profile.assignments.length === 0 ? <p>No assignments yet.</p> : <div className="assignment-list">{profile.assignments.map((assignment) => <a href={`/admin/services/${assignment.slot.service.id}`} key={assignment.id}><strong>{assignment.slot.service.startsAt.toLocaleString()} — {assignment.slot.service.name}</strong><span>{assignment.slot.service.rota.name} · {assignment.slot.requirement.role.name} {assignment.slot.slotNumber}</span></a>)}</div>}</section>
  </main>;
}
