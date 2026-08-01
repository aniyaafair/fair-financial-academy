import Link from "next/link";
export function DashboardShell({ role, children }: { role: "Teacher"|"Student"|"Parent"; children: React.ReactNode }) {
  const base = role.toLowerCase();
  return <div className="dashboard"><aside className="sidebar"><div className="brand"><span className="seal">FFA</span><span>{role} Portal</span></div><div style={{marginTop:28}}><Link href={`/${base}`}>Dashboard</Link><Link href={`/${base}`}>Transactions</Link><Link href={`/${base}`}>Statements</Link><Link href="/">Home</Link></div></aside><main className="main">{children}</main></div>;
}
