"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ensureFirebaseSession } from "@/lib/firestoreAcademy";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [studentId, setStudentId] = useState(params.get("student") || "");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const normalizedId = studentId.toUpperCase();
    if (!/^FFA-\d{4}-\d{3}$/.test(normalizedId)) return setError("Use an ID like FFA-2026-001.");
    if (!/^\d{4}$/.test(pin)) return setError("Enter a 4-digit PIN.");
    setBusy(true);
    try {
      await ensureFirebaseSession();
      const snapshot = await getDoc(doc(db, "academyMembers", normalizedId));
      if (!snapshot.exists() || String(snapshot.data().pin) !== pin) {
        setError("The student ID or PIN is incorrect.");
        return;
      }
      sessionStorage.setItem("ffaDemoUser", JSON.stringify({ studentId: normalizedId, role }));
      router.push(`/${role}`);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="login-wrap"><div className="card login-card">
    <div className="brand" style={{ color: "var(--navy)" }}><span className="seal">FFA</span><span>Connected Portal</span></div>
    <h1>Choose your portal</h1>
    <section style={{ margin: "20px 0", padding: 18, border: "2px solid var(--gold)", borderRadius: 18, background: "#fffaf0" }}>
      <h2 style={{ marginTop: 0 }}>Academy Headquarters</h2>
      <p>Teacher access for accounts, payroll, rent, and banking.</p>
      <Link className="btn btn-primary" href="/teacher" style={{ display: "inline-block", textDecoration: "none" }}>Open Teacher Portal</Link>
    </section>
    <h2>Student or Parent Login</h2>
    <p>Use the connected Academy Member ID and shared four-digit PIN.</p>
    <form onSubmit={submit}>
      <label>Portal</label><select value={role} onChange={(event) => setRole(event.target.value)}><option value="student">Student</option><option value="parent">Parent</option></select>
      <label>Student ID</label><input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="FFA-2026-001" autoCapitalize="characters" />
      <label>Shared 4-digit PIN</label><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" type="password" placeholder="••••" />
      <button className="btn btn-primary" style={{ width: "100%", marginTop: 20 }} disabled={busy}>{busy ? "Checking…" : "Sign in"}</button>
      {error && <div className="error">{error}</div>}
    </form>
  </div></div>;
}export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="login-wrap">
          <section className="card login-card">
            <p>Loading secure portal…</p>
          </section>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
