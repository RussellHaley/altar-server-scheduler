import { auth } from "@/auth";
import { createProfile } from "@/app/actions";
import { AdminNav } from "@/components/admin-nav";
import { prisma } from "@/lib/prisma";

export default async function ServerAdminPage() {
  const session = await auth();
  if (!session?.user?.isAdministrator) return <main className="shell"><h1>Administrator access required</h1></main>;
  const [profiles, userAccounts] = await Promise.all([
    prisma.serverProfile.findMany({
      include: { qualifications: { include: { role: true } }, assignments: true },
      orderBy: [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.userAccount.findMany({ include: { adultProfile: true }, orderBy: { displayName: "asc" } }),
  ]);
  const unlinkedAccounts = userAccounts.filter((account) => !account.adultProfile);
  return <main className="shell">
    <p><a href="/admin">← Administration</a></p>
    <AdminNav />
    <h1>Server administration</h1>
    <div className="grid">
      <section className="card"><h2>Add server profile</h2><form action={createProfile} className="form">
        <input name="firstName" placeholder="First name" required /><input name="lastName" placeholder="Last name" required />
        <label>Date of birth <input name="dateOfBirth" type="date" required /></label>
        <label>Profile type <select name="kind" defaultValue="MINOR"><option value="MINOR">Minor</option><option value="ADULT">Adult</option></select></label>
        <label>Linked adult account (adult profiles)<select name="accountId" defaultValue=""><option value="">No linked account yet</option>{unlinkedAccounts.map((account) => <option key={account.id} value={account.id}>{account.displayName} ({account.email})</option>)}</select></label>
        <label>Managing adult (required for minors)<select name="managerId" defaultValue=""><option value="">Select managing adult</option>{userAccounts.map((account) => <option key={account.id} value={account.id}>{account.displayName} ({account.email})</option>)}</select></label>
        <button type="submit">Create profile</button>
      </form></section>
      <section className="card"><h2>How qualifications work</h2><p>Qualifications are roles a server has been approved to fill. Open a server profile to grant or revoke them. Service assignments are made from the relevant service page.</p></section>
    </div>
    <section className="card"><h2>All servers</h2>{profiles.length === 0 ? <p>No server profiles yet.</p> : <div className="server-list">{profiles.map((profile) => <a className="server-row" href={`/admin/servers/${profile.id}`} key={profile.id}>
      <span><strong>{profile.firstName} {profile.lastName}</strong><small>{profile.kind === "MINOR" ? "Minor" : "Adult"} · {profile.status.toLowerCase()}</small></span>
      <span>{profile.qualifications.map((qualification) => qualification.role.abbreviation).join(", ") || "No qualifications"}<small>{profile.assignments.length} assignments</small></span>
    </a>)}</div>}</section>
  </main>;
}
