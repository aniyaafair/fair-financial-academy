"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [studentId, setStudentId] = useState(
    searchParams.get("student") || ""
  );
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"student" | "parent">("student");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formattedId = studentId.trim().toUpperCase();

    if (!formattedId) {
      setError("Enter your Academy Member ID.");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError("Enter your 4-digit PIN.");
      return;
    }

    sessionStorage.setItem(
      "ffaDemoUser",
      JSON.stringify({
        studentId: formattedId,
        pin,
        role,
      })
    );

    router.push(role === "parent" ? "/parent" : "/student");
  }

  return (
    <main className="login-wrap">
      <section className="card login-card">
        <div className="brand" style={{ color: "var(--navy)" }}>
          <span className="seal">FFA</span>
          <span>Fair Financial Academy</span>
        </div>

        <h1>Portal Login</h1>

        <section
          style={{
            margin: "20px 0",
            padding: 18,
            border: "2px solid var(--gold)",
            borderRadius: 18,
            background: "#fffaf0",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Academy Headquarters</h2>
          <p>Authorized teacher access only.</p>

          <Link className="btn btn-primary" href="/teacher-login">
            Teacher Login
          </Link>
        </section>

        <h2>Student or Family Access</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="portal-role">Choose a portal</label>
          <select
            id="portal-role"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as "student" | "parent")
            }
          >
            <option value="student">Student Banking</option>
            <option value="parent">Family Portal</option>
          </select>

          <label htmlFor="student-id">Academy Member ID</label>
          <input
            id="student-id"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="FFA0001"
            required
          />

          <label htmlFor="student-pin">Shared 4-digit PIN</label>
          <input
            id="student-pin"
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            type="password"
            placeholder="••••"
            required
          />

          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: "100%", marginTop: 20 }}
          >
            Sign In
          </button>

          {error && <div className="error">{error}</div>}
        </form>

        <Link
          href="/"
          style={{ display: "block", marginTop: 20, textAlign: "center" }}
        >
          Return to homepage
        </Link>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-wrap">Loading portal…</main>}>
      <LoginForm />
    </Suspense>
  );
}