import { auth } from "@/auth";
import { AdminNav } from "@/components/admin-nav";
import { prisma } from "@/lib/prisma";

const parishTimeZone = "America/Vancouver";
const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function datePart(date: Date, part: Intl.DateTimeFormatPartTypes) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: parishTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).find((item) => item.type === part)?.value ?? "";
}

function localDateKey(date: Date) {
  return `${datePart(date, "year")}-${datePart(date, "month")}-${datePart(date, "day")}`;
}

function parseMonth(value: string | undefined, fallback: string) {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  return fallback;
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

function weekdayOffset(month: string) {
  const [year, number] = month.split("-").map(Number);
  return (new Date(Date.UTC(year, number - 1, 1)).getUTCDay() + 6) % 7;
}

function calendarDays(month: string) {
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const start = new Date(Date.UTC(year, number - 1, 1 - weekdayOffset(month)));
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

export default async function AdminCalendarPage({ searchParams }: { searchParams: Promise<{ rota?: string; month?: string; day?: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdministrator) return <main className="shell"><h1>Administrator access required</h1><p>Sign in with an approved administrator account.</p></main>;

  const query = await searchParams;
  const rotas = await prisma.rota.findMany({
    include: {
      services: {
        orderBy: { startsAt: "asc" },
        include: { slots: { select: { id: true, assignment: { select: { id: true } } } } },
      },
    },
    orderBy: { startDate: "desc" },
  });
  const rota = rotas.find((candidate) => candidate.id === query.rota) ?? rotas[0];

  if (!rota) return <main className="shell"><p><a href="/admin">← Administration</a></p><h1>Calendar</h1><section className="card"><p>No rotas are available yet.</p></section></main>;

  const firstServiceMonth = rota.services[0] ? localDateKey(rota.services[0].startsAt).slice(0, 7) : new Date().toISOString().slice(0, 7);
  const month = parseMonth(query.month, firstServiceMonth);
  const selectedDay = query.day && /^\d{4}-\d{2}-\d{2}$/.test(query.day) ? query.day : undefined;
  const servicesByDate = new Map<string, typeof rota.services>();
  for (const service of rota.services) {
    const key = localDateKey(service.startsAt);
    if (!servicesByDate.has(key)) servicesByDate.set(key, []);
    servicesByDate.get(key)?.push(service);
  }
  const days = calendarDays(month);
  const rotaQuery = `rota=${encodeURIComponent(rota.id)}`;

  return <main className="shell calendar-shell">
    <p><a href="/admin">← Administration</a></p>
    <AdminNav />
    <header className="calendar-header">
      <div><h1>Rota calendar</h1><p>{rota.name} <span className="pill">{rota.state}</span></p></div>
      <form action="/admin/calendar" className="rota-picker">
        <label>Rota<select defaultValue={rota.id} name="rota" aria-label="Select rota">
          {rotas.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
        </select></label>
        <input type="hidden" name="month" value={month} />
        <button type="submit">View rota</button>
      </form>
    </header>
    <p className="calendar-note">The calendar uses parish time ({parishTimeZone.replace("_", " ")}). Select a service to review or assign its positions.</p>
    <nav className="month-navigation" aria-label="Calendar month">
      <a href={`/admin/calendar?${rotaQuery}&month=${shiftMonth(month, -1)}`}>← Previous</a>
      <h2>{monthLabel(month)}</h2>
      <a href={`/admin/calendar?${rotaQuery}&month=${shiftMonth(month, 1)}`}>Next →</a>
    </nav>
    <section className="month-calendar" aria-label={`${monthLabel(month)} calendar`}>
      {weekdayNames.map((day) => <div className="weekday" key={day}>{day}</div>)}
      {days.map((day) => {
        const services = servicesByDate.get(day.key) ?? [];
        return <article className={`calendar-day${day.inMonth ? "" : " outside-month"}${day.key === selectedDay ? " selected-day" : ""}`} key={day.key}>
          <div className="calendar-date"><time dateTime={day.key}>{day.date.getUTCDate()}</time></div>
          {services.map((service) => {
            const assigned = service.slots.filter((slot) => slot.assignment).length;
            const time = new Intl.DateTimeFormat("en-CA", { timeZone: parishTimeZone, hour: "numeric", minute: "2-digit" }).format(service.startsAt);
            return <a className={`calendar-service ${serviceColour(service.liturgicalColor)}`} href={`/admin/services/${service.id}`} key={service.id}>
              <span className="service-time">{time}</span>
              <span className="service-name">{service.name}</span>
              <span className="service-slots">{assigned}/{service.slots.length} assigned</span>
            </a>;
          })}
        </article>;
      })}
    </section>
  </main>;
}
