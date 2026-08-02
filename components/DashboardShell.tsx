import Link from "next/link";

export function DashboardShell({
  role,
  children,
}: {
  role: "Teacher" | "Student" | "Parent";
  children: React.ReactNode;
}) {
  const base = role.toLowerCase();
  const portalName =
    role === "Teacher"
      ? "Academy Headquarters"
      : role === "Student"
        ? "Student Banking"
        : "Family Portal";

  return (
    <div className="dashboard">
      <aside className="sidebar no-print">
        <div className="brand">
          <span className="seal">FFA</span>
          <span>{portalName}</span>
        </div>
        <nav className="side-nav" aria-label={`${portalName} navigation`}>
          <Link href={`/${base}`}>Dashboard</Link>
          {role === "Teacher" && <Link href="/teacher#members">Academy Members</Link>}
          {role === "Teacher" && <Link href="/teacher#banking">Banking Actions</Link>}
          {role === "Teacher" && <Link href="/teacher#activity">Recent Activity</Link>}
          <Link href={`/${base}`}>Statements</Link>
          <Link href="/">Public Home</Link>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
