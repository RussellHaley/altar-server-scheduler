import { auth } from "@/auth";
import { googleSignIn, logout } from "@/app/auth-actions";
import { AdminNav } from "@/components/admin-nav";
import { prisma } from "@/lib/prisma";

const parishTimeZone = "America/Vancouver";
const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function localDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: parishTimeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function parseMonth(value: string | undefined, fallback: string) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : fallback;
}

function shiftMonth(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, number - 1, 1)));
}

function calendarDays(month: string) {
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(year, number - 1, 1 - offset));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return { date, key: date.toISOString().slice(0, 10), inMonth: date.getUTCMonth() === first.getUTCMonth() };
  });
}

function serviceColour(colour: string | null) {
  const normalized = colour?.toLowerCase();
  return ["white", "green", "red", "violet", "rose", "black"].includes(normalized ?? "") ? `liturgical-${normalized}` : "liturgical-default";
}

function serviceHref(month: string, rotaId: string, serviceId: string) {
  return `/?rota=${encodeURIComponent(rotaId)}&month=${month}&service=${encodeURIComponent(serviceId)}`;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ rota?: string; month?: string; service?: string }> }) {
  const session = await auth();
  const query = await searchParams;
  const rotas = await prisma.rota.findMany({
    where: { state: "PUBLISHED" },
    include: { services: { orderBy: { startsAt: "asc" }, select: { id: true, name: true, startsAt: true, liturgicalColor: true, slots: { select: { id: true } } } } },
    orderBy: { startDate: "desc" },
  });
  const today = localDateKey(new Date());
  const rota = rotas.find((candidate) => candidate.id === query.rota)
    ?? rotas.find((candidate) => localDateKey(candidate.startDate) <= today && localDateKey(candidate.endDate) >= today)
    ?? rotas[0];
  const fallbackMonth = rota?.services[0] ? localDateKey(rota.services[0].startsAt).slice(0, 7) : today.slice(0, 7);
  const month = parseMonth(query.month, fallbackMonth);
  const selectedService = session?.user?.id && query.service
    ? await prisma.service.findFirst({
        where: { id: query.service, rota: { state: "PUBLISHED" } },
        include: { slots: { orderBy: { requirement: { displayOrder: "asc" } }, include: { assignment: { include: { profile: true } }, requirement: { include: { role: true } } } } },
      })
    : null;
  const servicesByDate = new Map<string, typeof rota extends null ? never : NonNullable<typeof rota>["services"]>();
  if (rota) for (const service of rota.services) {
    const key = localDateKey(service.startsAt);
    const services = servicesByDate.get(key) ?? [];
    services.push(service);
    servicesByDate.set(key, services);
  }

  return <main className="shell calendar-shell">
    <header className="topbar"><div><h1>SJHN Altar Server Scheduler</h1><p>Published parish rota</p></div><div className="home-menu">
      {session?.user?.id ? <>{session.user.isAdministrator ? <a href="/admin">Administration</a> : <a href="/account">My household</a>}<form action={logout}><button type="submit">Sign out</button></form></> : <form action={googleSignIn}><button type="submit">Sign in</button></form>}
    </div></header>
    {session && !session.user.id && <section className="card"><p>Your Google account is signed in but is not enrolled in the parish scheduler. Ask an administrator for an invitation to access assignments.</p><form action={logout}><button type="submit">Sign out</button></form></section>}
    {session?.user?.isAdministrator && <AdminNav />}
    {!rota ? <section className="card"><p>No published rotas are available.</p></section> : <>
      <header className="calendar-header"><div><h2>Rota calendar</h2><p>{rota.name}</p></div>
        {rotas.length > 1 && <form action="/" className="rota-picker"><label>Rota<select defaultValue={rota.id} name="rota">{rotas.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label><input type="hidden" name="month" value={month} /><button type="submit">View rota</button></form>}
      </header>
      <nav className="month-navigation" aria-label="Calendar month"><a href={`/?rota=${encodeURIComponent(rota.id)}&month=${shiftMonth(month, -1)}`}>← Previous</a><h2>{monthLabel(month)}</h2><a href={`/?rota=${encodeURIComponent(rota.id)}&month=${shiftMonth(month, 1)}`}>Next →</a></nav>
      <section className="month-calendar" aria-label={`${monthLabel(month)} calendar`}>
        {weekdayNames.map((day) => <div className="weekday" key={day}>{day}</div>)}
        {calendarDays(month).map((day) => <article className={`calendar-day${day.inMonth ? "" : " outside-month"}`} key={day.key}>
          <div className="calendar-date"><time dateTime={day.key}>{day.date.getUTCDate()}</time></div>
          {(servicesByDate.get(day.key) ?? []).map((service) => {
            const time = new Intl.DateTimeFormat("en-CA", { timeZone: parishTimeZone, hour: "numeric", minute: "2-digit" }).format(service.startsAt);
            const label = <><span className="service-time">{time}</span><span className="service-name">{service.name}</span><span className="service-slots">{service.slots.length} positions</span></>;
            return session?.user?.id
              ? <a className={`calendar-service ${serviceColour(service.liturgicalColor)}`} href={serviceHref(month, rota.id, service.id)} key={service.id}>{label}</a>
              : <div className={`calendar-service ${serviceColour(service.liturgicalColor)}`} key={service.id}>{label}</div>;
          })}
        </article>)}
      </section>
      {selectedService && <section className="card" id="assignments"><h2>{selectedService.name}</h2><p>{new Intl.DateTimeFormat("en-CA", { dateStyle: "full", timeStyle: "short", timeZone: parishTimeZone }).format(selectedService.startsAt)}</p><ul>{selectedService.slots.map((slot) => <li key={slot.id}>{slot.requirement.role.abbreviation} {slot.slotNumber}: {slot.assignment ? (slot.assignment.profile.kind === "MINOR" ? `${slot.assignment.profile.firstName} ${slot.assignment.profile.lastName.slice(0, 1)}.` : `${slot.assignment.profile.firstName} ${slot.assignment.profile.lastName}`) : <em>Open</em>}</li>)}</ul></section>}
    </>}
  </main>;
}
