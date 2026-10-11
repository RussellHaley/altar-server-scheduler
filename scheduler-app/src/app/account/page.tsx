import { auth } from "@/auth";
import { deleteAvailabilityOverride, updateAvailabilityRule, updateOwnAccountContact } from "@/app/actions";
import { AvailabilityOverrideForm } from "@/components/availability-override-form";
import { logout } from "@/app/auth-actions";
import { prisma } from "@/lib/prisma";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function timeValue(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined) return "";
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function displayName(profile: { firstName: string; lastName: string; kind: string }) {
  return profile.kind === "MINOR" ? `${profile.firstName} ${profile.lastName.slice(0, 1)}.` : `${profile.firstName} ${profile.lastName}`;
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) return <main className="shell"><h1>Account access required</h1><p>Sign in with an enrolled account to view household assignments and availability.</p></main>;
  const account = await prisma.userAccount.findUnique({
    where: { id: session.user.id },
    include: {
      adultProfile: { include: { availabilityRules: true, availabilityOverrides: { orderBy: { startsAt: "asc" } } } },
      managedMinors: { include: { availabilityRules: true, availabilityOverrides: { orderBy: { startsAt: "asc" } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
    },
  });
  if (!account) return <main className="shell"><h1>Enrollment required</h1><p>Your sign-in is not linked to a parish account.</p><form action={logout}><button type="submit">Sign out</button></form></main>;
  const householdProfiles = [account.adultProfile, ...account.managedMinors].filter((profile) => profile !== null);
  const profileIds = householdProfiles.map((profile) => profile.id);
  const assignments = profileIds.length === 0 ? [] : await prisma.assignment.findMany({
    where: {
      profileId: { in: profileIds },
      slot: { service: { startsAt: { gte: new Date() }, rota: { state: "PUBLISHED" } } },
    },
    include: { profile: true, slot: { include: { requirement: { include: { role: true } }, service: { include: { rota: true } } } } },
    orderBy: { slot: { service: { startsAt: "asc" } } },
    take: 50,
  });
  return <main className="shell">
    <header className="topbar"><div><p><a href="/">← Published rota</a></p><h1>My household</h1><p>Assignments and availability for your linked adult profile and managed minors.</p></div><div>{session.user.isAdministrator && <a href="/admin">Administration</a>}<form action={logout}><button type="submit">Sign out</button></form></div></header>
    <div className="grid">
      <section className="card"><h2>Contact</h2><dl className="details"><dt>Email</dt><dd>{account.email}</dd><dt>Primary phone</dt><dd>{account.phonePrimary || "Not recorded"}</dd><dt>Secondary phone</dt><dd>{account.phoneSecondary || "Not recorded"}</dd></dl>
        <form action={updateOwnAccountContact} className="form"><label>Display name <input name="displayName" defaultValue={account.displayName} required /></label><label>Primary phone <input name="phonePrimary" type="tel" defaultValue={account.phonePrimary ?? ""} /></label><label>Secondary phone <input name="phoneSecondary" type="tel" defaultValue={account.phoneSecondary ?? ""} /></label><button type="submit">Update contact</button></form>
      </section>
      <section className="card"><h2>Household profiles</h2>{householdProfiles.length === 0 ? <p>No server profiles are linked to this account yet.</p> : <ul className="plain-list">{householdProfiles.map((profile) => <li key={profile.id}><span><strong>{displayName(profile)}</strong><small>{profile.kind === "MINOR" ? "Minor" : "Adult"} · {profile.status.toLowerCase()}</small></span></li>)}</ul>}</section>
    </div>
    <section className="card"><h2>Upcoming assignments</h2>{assignments.length === 0 ? <p>No upcoming published assignments for this household.</p> : <div className="assignment-list">{assignments.map((assignment) => <a href="/" key={assignment.id}><strong>{assignment.slot.service.startsAt.toLocaleString()} — {assignment.slot.service.name}</strong><span>{displayName(assignment.profile)} · {assignment.slot.requirement.role.name} {assignment.slot.slotNumber}</span></a>)}</div>}</section>
    <section className="card"><h2>Availability</h2>{householdProfiles.length === 0 ? <p>Availability can be managed after a server profile is linked to this account.</p> : <div className="availability-profiles">{householdProfiles.map((profile) => {
      const rulesByDay = new Map(profile.availabilityRules.map((rule) => [rule.dayOfWeek, rule]));
      return <article className="availability-profile" key={profile.id}>
        <h3>{displayName(profile)}</h3>
        <div className="availability-week">{weekdays.map((weekday, dayOfWeek) => {
          const rule = rulesByDay.get(dayOfWeek);
          return <form action={updateAvailabilityRule} className="availability-day" key={weekday}>
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
            <strong>{weekday}</strong>
            <label>Status <select name="isAvailable" defaultValue={rule?.isAvailable === false ? "false" : "true"}><option value="true">Available</option><option value="false">Unavailable</option></select></label>
            <label>From <input name="availableFrom" type="time" defaultValue={timeValue(rule?.availableFromMinutes)} /></label>
            <label>Until <input name="availableUntil" type="time" defaultValue={timeValue(rule?.availableUntilMinutes)} /></label>
            <button type="submit">Save</button>
          </form>;
        })}</div>
        <div className="grid">
          <section><h4>Date overrides</h4>{profile.availabilityOverrides.length === 0 ? <p>No date-specific overrides.</p> : <ul className="plain-list">{profile.availabilityOverrides.map((override) => <li key={override.id}><span><strong>{override.isAvailable ? "Available" : "Unavailable"}</strong><small>{override.startsAt.toLocaleDateString()} to {override.endsAt.toLocaleDateString()}{override.reason ? ` · ${override.reason}` : ""}</small></span><form action={deleteAvailabilityOverride}><input type="hidden" name="overrideId" value={override.id} /><button type="submit" className="quiet-button">Remove</button></form></li>)}</ul>}</section>
          <section><h4>Add override</h4><AvailabilityOverrideForm profileId={profile.id} today={dateValue(new Date())} /></section>
        </div>
      </article>;
    })}</div>}</section>
  </main>;
}
