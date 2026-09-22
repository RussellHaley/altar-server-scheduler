import { auth } from "@/auth";
import { AdminNav } from "@/components/admin-nav";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isAdministrator) return <main className="shell"><h1>Administrator access required</h1><p>Sign in with an approved administrator account.</p></main>;
  const [serverCount, activeServerCount, userCount, rotaCount, generatedCount, openSlotCount] = await Promise.all([
    prisma.serverProfile.count(),
    prisma.serverProfile.count({ where: { status: "ACTIVE" } }),
    prisma.userAccount.count(),
    prisma.rota.count(),
    prisma.rota.count({ where: { state: { in: ["GENERATED", "UNDER_REVIEW"] } } }),
    prisma.positionSlot.count({ where: { state: "OPEN" } }),
  ]);
  return <main className="shell">
    <p><a href="/">← Published rota</a></p>
    <AdminNav />
    <h1>Administration</h1>
    <p>Manage the parish’s people, calendar-generated rotas, and service assignments.</p>
    <div className="grid admin-summary">
      <section className="card"><h2>{activeServerCount}</h2><p>active servers</p><a href="/admin/servers">Manage servers →</a></section>
      <section className="card"><h2>{userCount}</h2><p>accounts</p><a href="/admin/accounts">Manage accounts →</a></section>
      <section className="card"><h2>{rotaCount}</h2><p>rotas</p><a href="/admin/rota">Manage rotas →</a></section>
      <section className="card"><h2>{generatedCount}</h2><p>awaiting review</p><a href="/admin/calendar">Review calendar →</a></section>
      <section className="card"><h2>{openSlotCount}</h2><p>open positions</p><a href="/admin/calendar">Assign servers →</a></section>
    </div>
    {serverCount === 0 && <section className="card"><h2>Start here</h2><p>Add the parish’s server profiles, grant their qualifications, then import or create a rota.</p><a href="/admin/servers">Add a server →</a></section>}
  </main>;
}
