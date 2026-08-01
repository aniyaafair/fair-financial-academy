import Link from "next/link";
export function SiteHeader() {
  return <div className="header"><nav className="nav"><Link className="brand" href="/"><span className="seal">FFA</span><span>Fair Financial Academy</span></Link><div className="navlinks"><Link href="/#academy">About</Link><Link href="/#features">Programs</Link><Link href="/login">Portal Login</Link></div></nav></div>;
}
