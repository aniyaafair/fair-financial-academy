"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setWorking(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/teacher");
    } catch {
      setError("The email or password was not accepted.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="login-wrap">
      <section className="card login-card">
        <div className="brand" style={{ color: "var(--navy)" }}>
          <span className="seal">FFA</span>
          <span>Academy Headquarters</span>
        </div>

        <h1>Teacher Login</h1>
        <p>Authorized teacher access only.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="teacher-email">Email address</label>
          <input
            id="teacher-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="teacher-password">Password</label>
          <input
            id="teacher-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button
            className="btn btn-primary"
            type="submit"
            disabled={working}
            style={{ width: "100%", marginTop: 20 }}
          >
            {working ? "Signing in…" : "Open Academy Headquarters"}
          </button>

          {error && <div className="error">{error}</div>}
        </form>
      </section>
    </main>
  );
}