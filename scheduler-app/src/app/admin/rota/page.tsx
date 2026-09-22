import { auth } from "@/auth";
import { createRota, createServiceFromTemplate, publishRota } from "@/app/actions";
import { AdminNav } from "@/components/admin-nav";
import { prisma } from "@/lib/prisma";

export default async function RotaAdminPage() {
  const session = await auth();
  if (!session?.user?.isAdministrator) return <main className="shell"><h1>Administrator access required</h1></main>;
  const [rotas, templates] = await Promise.all([
    prisma.rota.findMany({ include: { services: { orderBy: { startsAt: "asc" } } }, orderBy: { startDate: "desc" } }),
    prisma.serviceTemplate.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  return <main className="shell">
    <p><a href="/admin">← Administration</a></p>
    <AdminNav />
    <h1>Rota administration</h1>
    <div className="grid">
      <section className="card"><h2>Create an empty rota</h2><form action={createRota} className="form">
        <input name="name" placeholder="Rota name" required />
        <label>Start <input name="startDate" type="date" required /></label>
        <label>End <input name="endDate" type="date" required /></label>
        <button type="submit">Create rota</button>
      </form></section>
      <section className="card"><h2>Import parish calendar</h2><p>Calendar imports are currently run from the command line so the source file is validated before it reaches the database.</p><code>npm run calendar:import -- /path/to/schedule.json --dry-run</code><p>Remove <code>--dry-run</code> to import it as a generated rota. A browser upload workflow can be added once the review process is settled.</p></section>
    </div>
    <section className="card"><h2>Rotas and services</h2>{rotas.length === 0 ? <p>No rotas yet.</p> : rotas.map((rota) => <article key={rota.id} className="rota">
      <h3>{rota.name} <span className="pill">{rota.state}</span></h3>
      <p>{rota.startDate.toLocaleDateString()} – {rota.endDate.toLocaleDateString()} · {rota.services.length} services · <a href={`/admin/calendar?rota=${rota.id}`}>View calendar</a></p>
      <details><summary>Add an individual service</summary><form action={createServiceFromTemplate} className="inline-form">
        <input type="hidden" name="rotaId" value={rota.id} />
        <input name="name" placeholder="Service name" required />
        <input name="startsAt" type="datetime-local" required />
        <select name="templateId" required><option value="">Template</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
        <button type="submit">Add service</button>
      </form></details>
      <p className="service-links">{rota.services.slice(0, 8).map((service) => <a href={`/admin/services/${service.id}`} key={service.id}>{service.startsAt.toLocaleDateString()} — {service.name}</a>)}{rota.services.length > 8 && <span>…and {rota.services.length - 8} more in the calendar</span>}</p>
      {rota.state !== "PUBLISHED" && <form action={publishRota}><input type="hidden" name="rotaId" value={rota.id} /><button type="submit">Publish rota</button></form>}
    </article>)}</section>
  </main>;
}
