"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DecoratedDebitCard } from "@/components/DecoratedDebitCard";
import { AcademyMember, CardPattern, CardTheme } from "@/lib/academyStore";
import { ensureFirebaseSession, saveAcademyMember, watchAcademyMembers } from "@/lib/firestoreAcademy";

const THEMES: { value: CardTheme; label: string }[] = [
  { value: "academy", label: "Academy Green" }, { value: "ocean", label: "Ocean Blue" }, { value: "sunset", label: "Sunset Glow" }, { value: "purple", label: "Royal Purple" }, { value: "midnight", label: "Midnight Gold" },
];
const PATTERNS: { value: CardPattern; label: string }[] = [
  { value: "waves", label: "Waves" }, { value: "stars", label: "Stars" }, { value: "dots", label: "Dots" }, { value: "confetti", label: "Confetti" }, { value: "none", label: "No pattern" },
];
const ICONS = ["⭐", "📚", "🎓", "💡", "🌱", "🏆", "🦒", "🦋", "⚽", "🎨", "🚀", "💎"];

export default function StudentPage() {
  const [members, setMembers] = useState<AcademyMember[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [draft, setDraft] = useState<AcademyMember | null>(null);
  const [message, setMessage] = useState("Connecting to Firebase…");

  useEffect(() => {
    let unsubscribe = () => {};
    ensureFirebaseSession().then(() => {
      unsubscribe = watchAcademyMembers((next) => {
        setMembers(next);
        const session = sessionStorage.getItem("ffaDemoUser");
        let id = next[0]?.id || "";
        if (session) { try { id = JSON.parse(session).studentId || id; } catch {} }
        setCurrentId(id);
        const found = next.find((member) => member.id === id) ?? next[0] ?? null;
        setDraft(found);
        setMessage(found ? "Your account is synchronized." : "No connected account was found.");
      }, (error) => setMessage(`Firebase error: ${error}`));
    }).catch((error: Error) => setMessage(`Firebase sign-in error: ${error.message}`));
    return () => unsubscribe();
  }, []);

  const member = useMemo(() => draft ?? members.find((item) => item.id === currentId) ?? members[0], [draft, members, currentId]);
  if (!member) return <DashboardShell role="Student"><h1>Student Banking</h1><p>{message}</p></DashboardShell>;

  function updateCard(patch: Partial<AcademyMember>) {
    setMessage("");
    setDraft((current) => current ? { ...current, ...patch } : current);
  }

  async function saveCard() {
    if (!draft) return;
    await saveAcademyMember(draft);
    setMessage("Your card design was saved to Firebase!");
  }

  return (
    <DashboardShell role="Student">
      <div className="page-heading"><div><p className="eyebrow">STUDENT BANKING</p><h1>Welcome, {member.name.split(" ")[0]}!</h1><p>Check your synchronized balance and design a debit card that feels like you.</p></div></div>
      {message && <div className="success-banner">{message}</div>}

      <div className="grid">
        <div className="card"><div>Current balance</div><div className="metric">${member.balance.toFixed(2)}</div></div>
        <div className="card"><div>Current career</div><h2>{member.career}</h2><span className="pill">${member.weeklyPay} weekly</span></div>
        <div className="card"><div>Friday rent</div><h2>$20</h2><p>Payroll and rent post Friday morning.</p></div>
      </div>

      <section className="section card-studio-layout">
        <div><DecoratedDebitCard member={member} /><p className="muted-note">Decorations change only the look of the card.</p></div>
        <div className="card card-studio no-print">
          <h2>Debit Card Design Studio</h2>
          <label>Card color</label><select value={member.cardTheme} onChange={(event) => updateCard({ cardTheme: event.target.value as CardTheme })}>{THEMES.map((theme) => <option value={theme.value} key={theme.value}>{theme.label}</option>)}</select>
          <label>Pattern</label><select value={member.cardPattern} onChange={(event) => updateCard({ cardPattern: event.target.value as CardPattern })}>{PATTERNS.map((pattern) => <option value={pattern.value} key={pattern.value}>{pattern.label}</option>)}</select>
          <label>Choose one icon</label><div className="icon-picker">{ICONS.map((icon) => <button type="button" className={member.cardIcon === icon ? "icon-choice selected" : "icon-choice"} onClick={() => updateCard({ cardIcon: icon })} key={icon}>{icon}</button>)}</div>
          <label>Card motto</label><input maxLength={38} value={member.cardMotto} onChange={(event) => updateCard({ cardMotto: event.target.value })} />
          <button className="btn btn-primary" onClick={saveCard} style={{ marginTop: 16 }}>Save my card design</button>
        </div>
      </section>

      <section className="card">
        <h2>Recent transactions</h2>
        <div className="table-scroll"><table className="table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead><tbody>{member.transactions.length ? member.transactions.map((transaction) => <tr key={transaction.id}><td>{new Date(transaction.date).toLocaleDateString()}</td><td>{transaction.description}</td><td>{transaction.category}</td><td className={transaction.amount >= 0 ? "money-positive" : "money-negative"}>{transaction.amount >= 0 ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}</td></tr>) : <tr><td colSpan={4}>No transactions yet.</td></tr>}</tbody></table></div>
      </section>
    </DashboardShell>
  );
}
