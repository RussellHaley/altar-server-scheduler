import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assignProfile, clearAssignment } from "@/app/actions";
import { AdminNav } from "@/components/admin-nav";

const parishTimeZone = "America/Vancouver";

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: parishTimeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function calendarHref(rotaId: string, day: string) {
  return `/admin/calendar?rota=${encodeURIComponent(rotaId)}&month=${day.slice(0, 7)}&day=${day}`;
}

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdministrator) return <main className="shell"><h1>Administrator access required</h1></main>;
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id }, include: { rota: true, slots: { include: { assignment: { include: { profile: true } }, requirement: { include: { role: true } } }, orderBy: [{ requirement: { displayOrder: "asc" } }, { slotNumber: "asc" }] } } });
  if (!service) notFound();
  const [profiles, rotaServices] = await Promise.all([
    prisma.serverProfile.findMany({ where: { status: "ACTIVE" }, include: { qualifications: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    prisma.service.findMany({ where: { rotaId: service.rotaId }, select: { id: true, startsAt: true }, orderBy: { startsAt: "asc" } }),
  ]);
  const firstServiceByDay = new Map<string, string>();
  for (const candidate of rotaServices) {
    const day = dateKey(candidate.startsAt);
    if (!firstServiceByDay.has(day)) firstServiceByDay.set(day, candidate.id);
  }
  const days = [...firstServiceByDay.keys()];
  const currentDay = dateKey(service.startsAt);
  const dayIndex = days.indexOf(currentDay);
  const previousDay = dayIndex > 0 ? days[dayIndex - 1] : undefined;
  const nextDay = dayIndex >= 0 && dayIndex < days.length - 1 ? days[dayIndex + 1] : undefined;
  const dateTime = new Intl.DateTimeFormat("en-CA", { timeZone: parishTimeZone, weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(service.startsAt);
  return <main className="shell">
    <p><a href={calendarHref(service.rotaId, currentDay)}>← Rota calendar</a></p>
    <AdminNav />
    <p className="eyebrow">{service.rota.name}</p>
    <h1>{service.name}</h1>
    <p className="service-datetime"><time dateTime={service.startsAt.toISOString()}>{dateTime}</time></p>
    <nav className="schedule-day-navigation" aria-label="Scheduled day">
      {previousDay ? <a href={`/admin/services/${firstServiceByDay.get(previousDay)}`}>← Previous scheduled day</a> : <span />}
      <a href={calendarHref(service.rotaId, currentDay)}>Back to calendar</a>
      {nextDay ? <a href={`/admin/services/${firstServiceByDay.get(nextDay)}`}>Next scheduled day →</a> : <span />}
    </nav>
    <section className="card"><h2>Position slots</h2>{service.slots.map((slot) => <div className="slot-row" key={slot.id}><strong>{slot.requirement.role.abbreviation} {slot.slotNumber}</strong>{slot.assignment && <a href={`/admin/servers/${slot.assignment.profile.id}`}>{slot.assignment.profile.firstName} {slot.assignment.profile.lastName} · assigned</a>}<form action={assignProfile} className="inline-form"><input type="hidden" name="slotId" value={slot.id} /><select name="profileId" defaultValue={slot.assignment?.profile.id ?? ""} required><option value="">Qualified server</option>{profiles.filter((profile) => profile.qualifications.some((qualification) => qualification.roleId === slot.requirement.roleId)).map((profile) => <option key={profile.id} value={profile.id}>{profile.firstName} {profile.lastName}</option>)}</select><button type="submit">{slot.assignment ? "Change" : "Assign"}</button></form>{slot.assignment && <form action={clearAssignment}><input type="hidden" name="slotId" value={slot.id} /><button className="quiet-button" type="submit">Clear</button></form>}</div>)}</section>
  </main>;
}
