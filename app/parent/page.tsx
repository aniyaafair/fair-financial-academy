"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { PrintButton } from "@/components/PrintButton";
import type { AcademyMember } from "@/lib/academyStore";
import {
  ensureFirebaseSession,
  watchAcademyMembers,
} from "@/lib/firestoreAcademy";

export default function ParentPage() {
  const [member, setMember] = useState<AcademyMember | null>(null);
  const [message, setMessage] = useState("Connecting to Firebase…");

  useEffect(() => {
    let unsubscribe = () => {};

    ensureFirebaseSession()
      .then(() => {
        unsubscribe = watchAcademyMembers(
          (members) => {
            const savedLogin = sessionStorage.getItem("ffaDemoUser");

            if (!savedLogin) {
              setMember(null);
              setMessage("Please sign in through the Family Portal.");
              return;
            }

            try {
              const login = JSON.parse(savedLogin);
              const studentId = String(login.studentId || "").toUpperCase();

              const found =
                members.find(
                  (item) => item.id.toUpperCase() === studentId
                ) || null;

              setMember(found);
              setMessage(
                found
                  ? "Family account information is synchronized."
                  : "No Academy Member account was found for this login."
              );
            } catch {
              setMember(null);
              setMessage("The saved login information could not be read.");
            }
          },
          (error) => setMessage(`Firebase error: ${error}`)
        );
      })
      .catch((error: Error) => {
        setMessage(`Firebase sign-in error: ${error.message}`);
      });

    return () => unsubscribe();
  }, []);

  const payrollTotal = useMemo(() => {
    if (!member) return 0;

    return member.transactions
      .filter((item) => item.category === "Payroll")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [member]);

  const rentTotal = useMemo(() => {
    if (!member) return 0;

    return Math.abs(
      member.transactions
        .filter((item) => item.category === "Rent")
        .reduce((sum, item) => sum + item.amount, 0)
    );
  }, [member]);

  if (!member) {
    return (
      <DashboardShell role="Parent">
        <h1>Family Portal</h1>

        <section className="card">
          <p>{message}</p>

          <Link className="btn btn-primary" href="/login">
            Return to login
          </Link>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="Parent">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Fair Financial Academy</p>
          <h1>Family Portal</h1>
          <p>
            Read-only account access for {member.name}.
          </p>
        </div>

        <Link className="btn btn-secondary" href="/login">
          Sign out
        </Link>
      </header>

      <div className="success-banner">{message}</div>

      <div className="grid">
        <article className="card">
          <div>Current balance</div>
          <div className="metric">
            ${member.balance.toFixed(2)}
          </div>
        </article>

        <article className="card">
          <div>Academy career</div>
          <div className="metric" style={{ fontSize: "1.5rem" }}>
            {member.career || "Not assigned"}
          </div>
        </article>

        <article className="card">
          <div>Weekly salary</div>
          <div className="metric">
            ${member.weeklyPay.toFixed(2)}
          </div>
        </article>

        <article className="card">
          <div>Total paychecks</div>
          <div className="metric">
            ${payrollTotal.toFixed(2)}
          </div>
        </article>

        <article className="card">
          <div>Total rent paid</div>
          <div className="metric">
            ${rentTotal.toFixed(2)}
          </div>
        </article>

        <article className="card">
          <div>Academy Member ID</div>
          <div className="metric" style={{ fontSize: "1.4rem" }}>
            {member.id}
          </div>
        </article>
      </div>

      <section className="section card">
        <h2>Transaction history</h2>

        {member.transactions.length === 0 ? (
          <p>No transactions have been posted yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {[...member.transactions]
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() -
                      new Date(a.date).getTime()
                  )
                  .map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        {new Date(
                          transaction.date
                        ).toLocaleDateString()}
                      </td>
                      <td>{transaction.description}</td>
                      <td>{transaction.category}</td>
                      <td
                        className={
                          transaction.amount >= 0
                            ? "money-positive"
                            : "money-negative"
                        }
                      >
                        {transaction.amount >= 0 ? "+" : "-"}$
                        {Math.abs(transaction.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <PrintButton />
      </section>

      <section className="section card">
        <h2>Family access</h2>
        <p>
          This portal is read-only. Families can review balances,
          paychecks, rent, deposits, deductions, and purchases, but
          cannot change the student account.
        </p>
      </section>
    </DashboardShell>
  );
}