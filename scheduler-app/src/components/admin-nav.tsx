import Link from "next/link";

export function AdminNav() {
  return <nav className="admin-nav" aria-label="Administration">
    <Link href="/admin">Overview</Link>
    <Link href="/admin/rota">Rota administration</Link>
    <Link href="/admin/calendar">Calendar</Link>
    <Link href="/admin/servers">Server administration</Link>
    <Link href="/admin/accounts">Accounts</Link>
  </nav>;
}
