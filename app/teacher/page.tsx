"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DecoratedDebitCard } from "@/components/DecoratedDebitCard";
import {
  AcademyCareer,
  AcademyMember,
  makeId,
  makePin,
  slugifyCareer,
} from "@/lib/academyStore";
import {
  ensureDefaultCareers,
  ensureFirebaseSession,
  removeAcademyCareer,
  removeAcademyMember,
  saveAcademyCareer,
  saveAcademyMember,
  saveManyAcademyMembers,
  watchAcademyCareers,
  watchAcademyMembers,
} from "@/lib/firestoreAcademy";

const TEACHER_NAME = "Ms. Fair";
const WEEKLY_RENT = 10;
const DEPOSIT_REASONS = [
  "Completed Homework",
  "Positive Participation",
  "Followed Instructions the First Time",
  "Completed Classroom Job",
  "Helped Others",
  "Brought or Properly Used Supplies",
  "Being Safe",
  "Being Responsible",
  "Being Respectful",
  "Stayed Focused During Work Time",
  "Submitted Work",
  "Used an Appropriate Voice Level",
];
const WITHDRAWAL_REASONS = [
  "Missing Homework",
  "Did Not Participate Appropriately",
  "Did Not Follow Instructions the First Time",
  "Did Not Complete Classroom Job",
  "Did Not Help or Cooperate with Others",
  "Needed Extra Copies or Supplies",
  "Being Unsafe",
  "Being Irresponsible",
  "Being Disrespectful",
  "Store Purchase",
  "Excessive Talking",
  "Did Not Submit Work",
];
const REASON_OPTIONS = [...DEPOSIT_REASONS, ...WITHDRAWAL_REASONS, "Custom Reason"];

export default function TeacherPage() {
  const [members, setMembers] = useState<AcademyMember[]>([]);
  const [careers, setCareers] = useState<AcademyCareer[]>([]);
  const [name, setName] = useState("");
  const [careerId, setCareerId] = useState("");
  const [startingBalance, setStartingBalance] = useState("0");
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("5");
  const [reason, setReason] = useState(DEPOSIT_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [classAmount, setClassAmount] = useState("5");
  const [classReason, setClassReason] = useState(DEPOSIT_REASONS[0]);
  const [classCustomReason, setClassCustomReason] = useState("");
  const [checkedMemberIds, setCheckedMemberIds] = useState<string[]>([]);
  const [transactionBusy, setTransactionBusy] = useState(false);
  const transactionLock = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const [notice, setNotice] = useState("Connecting to Firebase…");
  const [busy, setBusy] = useState(true);

  const [newCareerName, setNewCareerName] = useState("");
  const [newCareerPay, setNewCareerPay] = useState("26");
  const [newCareerPositions, setNewCareerPositions] = useState("1");
  const [jobDrafts, setJobDrafts] = useState<Record<string, string>>({});
  const [savingJobs, setSavingJobs] = useState(false);

  useEffect(() => {
    let unsubscribeMembers = () => {};
    let unsubscribeCareers = () => {};

    ensureFirebaseSession()
      .then(async () => {
        await ensureDefaultCareers();
        unsubscribeMembers = watchAcademyMembers(
          (next) => {
            setMembers(next);
            setSelectedId((current) => current || next[0]?.id || "");
            setBusy(false);
          },
          (message) => {
            setBusy(false);
            setNotice(`Firebase member error: ${message}`);
          },
        );
        unsubscribeCareers = watchAcademyCareers(
          (next) => {
            setCareers(next);
            setCareerId((current) => current || next.find((item) => item.active)?.id || "");
            setNotice("Academy records and careers are synchronized with Firebase.");
          },
          (message) => setNotice(`Firebase career error: ${message}`),
        );
      })
      .catch((error: Error) => {
        setBusy(false);
        setNotice(`Firebase sign-in error: ${error.message}`);
      });

    return () => {
      unsubscribeMembers();
      unsubscribeCareers();
    };
  }, []);

  const activeCareers = useMemo(() => careers.filter((career) => career.active), [careers]);
  const classBalance = useMemo(() => members.reduce((sum, member) => sum + member.balance, 0), [members]);
  const selected = members.find((member) => member.id === selectedId) ?? members[0];
  const selectedCareer = activeCareers.find((career) => career.id === careerId) ?? activeCareers[0];

  const filledByCareer = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((member) => counts.set(member.career, (counts.get(member.career) ?? 0) + 1));
    return counts;
  }, [members]);
  const pendingJobChanges = members.filter((member) => jobDrafts[member.id] &&
    activeCareers.find((career) => career.id === jobDrafts[member.id])?.name !== member.career);

  function nextMemberId() {
    const used = new Set(members.map((member) => member.id));
    let index = 1;
    while (used.has(makeId(index))) index += 1;
    return makeId(index);
  }

  async function addMember(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !selectedCareer) return;

    const filled = filledByCareer.get(selectedCareer.name) ?? 0;
    if (filled >= selectedCareer.positions) {
      setNotice(`${selectedCareer.name} is full (${filled}/${selectedCareer.positions}). Increase its positions or choose another career.`);
      return;
    }

    const next: AcademyMember = {
      id: nextMemberId(),
      name: name.trim(),
      pin: makePin(),
      career: selectedCareer.name,
      weeklyPay: selectedCareer.pay,
      balance: Number(startingBalance) || 0,
      memberSince: new Date().toISOString().slice(0, 10),
      cardTheme: "academy",
      cardPattern: "waves",
      cardIcon: "⭐",
      cardMotto: "Learn • Earn • Save • Grow",
      transactions: [],
    };

    await saveAcademyMember(next);
    setSelectedId(next.id);
    setName("");
    setStartingBalance("0");
    setNotice(`${next.name} was added. ID: ${next.id} • Shared PIN: ${next.pin}`);
  }

  function resolvedReason(choice: string, custom: string) {
    return choice === "Custom Reason" ? custom.trim() : choice;
  }

  function enableTransactionAudio() {
    try {
      const context = audioContext.current ?? new AudioContext();
      audioContext.current = context;
      void context.resume();
    } catch {
      // Transactions still work if browser audio is unavailable.
    }
  }

  function playTransactionChime(direction: 1 | -1) {
    const context = audioContext.current;
    if (!context) return;
    try {
      const start = context.currentTime + 0.02;
      // A rising major chord for deposits; a falling minor phrase for withdrawals.
      const notes = direction === 1 ? [523.25, 659.25, 783.99, 1046.5] : [392, 349.23, 311.13, 261.63];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        const at = start + index * (direction === 1 ? 0.105 : 0.17);
        oscillator.type = direction === 1 ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, at);
        volume.gain.setValueAtTime(0.0001, at);
        volume.gain.exponentialRampToValueAtTime(0.24, at + 0.02);
        volume.gain.exponentialRampToValueAtTime(0.0001, at + (direction === 1 ? 0.28 : 0.36));
        oscillator.connect(volume).connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + (direction === 1 ? 0.29 : 0.37));
      });
    } catch {
      // Transactions still work if the browser does not support or allow audio.
    }
  }

  function previewTransactionChime(direction: 1 | -1) {
    enableTransactionAudio();
    playTransactionChime(direction);
  }

  async function withTransactionLock(action: () => Promise<void>) {
    if (transactionLock.current) return;
    transactionLock.current = true;
    setTransactionBusy(true);
    try {
      await action();
    } catch (error) {
      setNotice(`Transaction error: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      transactionLock.current = false;
      setTransactionBusy(false);
    }
  }

  async function postTransaction(direction: 1 | -1) {
    if (transactionLock.current) return;
    const value = Number(amount);
    const description = resolvedReason(reason, customReason);
    if (!selected || !Number.isFinite(value) || value <= 0) {
      setNotice("Enter an amount greater than $0.");
      return;
    }
    if (!description) {
      setNotice("Enter a custom reason before posting the transaction.");
      return;
    }
    enableTransactionAudio();
    const action = direction === 1 ? "deposit" : "withdrawal";
    if (!confirm(`Confirm a $${value.toFixed(2)} ${action} for ${selected.name}?\nReason: ${description}`)) return;

    await withTransactionLock(async () => {
      const signed = value * direction;
      const updated: AcademyMember = {
        ...selected,
        balance: selected.balance + signed,
        transactions: [
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            description,
            category: direction === 1 ? "Deposit" : "Withdrawal",
            amount: signed,
            teacher: TEACHER_NAME,
          },
          ...selected.transactions,
        ],
      };
      await saveAcademyMember(updated);
      playTransactionChime(direction);
      setNotice(`${direction === 1 ? "Deposit" : "Withdrawal"} posted for ${selected.name}.`);
    });
  }

  async function postClassTransaction(direction: 1 | -1) {
    if (transactionLock.current) return;
    const value = Number(classAmount);
    const description = resolvedReason(classReason, classCustomReason);
    const recipients = members.filter((member) => checkedMemberIds.includes(member.id));
    if (!Number.isFinite(value) || value <= 0) {
      setNotice("Enter a class transaction amount greater than $0.");
      return;
    }
    if (!description) {
      setNotice("Enter a custom class transaction reason before posting.");
      return;
    }
    if (!recipients.length) {
      setNotice("Select at least one Academy Member.");
      return;
    }
    enableTransactionAudio();
    const action = direction === 1 ? "deposit" : "withdrawal";
    if (!confirm(`Confirm a $${value.toFixed(2)} ${action} for ${recipients.length} selected member(s)?\nReason: ${description}`)) return;

    await withTransactionLock(async () => {
      const signed = value * direction;
      const now = new Date().toISOString();
      const batchId = crypto.randomUUID();
      const updated = recipients.map((member) => ({
        ...member,
        balance: member.balance + signed,
        transactions: [
          {
            id: crypto.randomUUID(),
            batchId,
            date: now,
            description,
            category: direction === 1 ? "Deposit" as const : "Withdrawal" as const,
            amount: signed,
            teacher: TEACHER_NAME,
          },
          ...member.transactions,
        ],
      }));
      await saveManyAcademyMembers(updated);
      playTransactionChime(direction);
      setNotice(`${direction === 1 ? "Deposit" : "Withdrawal"} posted for ${recipients.length} selected Academy Member(s).`);
    });
  }

  async function runFridayPayroll() {
    if (transactionLock.current) return;
    if (!members.length || !confirm(`Run Friday payroll for all ${members.length} Academy Member(s)?`)) return;
    await withTransactionLock(async () => {
      const today = new Date().toISOString();
      const batchId = crypto.randomUUID();
      const updated = members.map((member) => ({
        ...member,
        balance: member.balance + member.weeklyPay,
        transactions: [
          {
            id: crypto.randomUUID(),
            batchId,
            date: today,
            description: "Friday academy paycheck",
            category: "Payroll" as const,
            amount: member.weeklyPay,
            teacher: TEACHER_NAME,
          },
          ...member.transactions,
        ],
      }));
      await saveManyAcademyMembers(updated);
      setNotice("Friday payroll was posted for every Academy Member.");
    });
  }

  async function collectFridayRent() {
    if (transactionLock.current) return;
    if (!members.length || !confirm(`Collect $${WEEKLY_RENT} Friday rent from all ${members.length} Academy Member(s)?`)) return;
    await withTransactionLock(async () => {
      const today = new Date().toISOString();
      const batchId = crypto.randomUUID();
      const updated = members.map((member) => ({
        ...member,
        balance: member.balance - WEEKLY_RENT,
        transactions: [
          {
            id: crypto.randomUUID(),
            batchId,
            date: today,
            description: "Friday classroom rent",
            category: "Rent" as const,
            amount: -WEEKLY_RENT,
            teacher: TEACHER_NAME,
          },
          ...member.transactions,
        ],
      }));
      await saveManyAcademyMembers(updated);
      setNotice(`Friday rent of $${WEEKLY_RENT} was deducted for every Academy Member.`);
    });
  }

  async function createCareer(event: FormEvent) {
    event.preventDefault();
    const careerName = newCareerName.trim();
    if (!careerName) return;
    const id = slugifyCareer(careerName);
    const career: AcademyCareer = {
      id,
      name: careerName,
      pay: Math.max(0, Number(newCareerPay) || 0),
      positions: Math.max(1, Math.floor(Number(newCareerPositions) || 1)),
      active: true,
      sortOrder: careers.length + 1,
    };
    await saveAcademyCareer(career);
    setNewCareerName("");
    setNewCareerPay("26");
    setNewCareerPositions("1");
    setNotice(`${career.name} was added to Academy Careers.`);
  }

  async function updateCareer(career: AcademyCareer, changes: Partial<AcademyCareer>) {
    const updated = { ...career, ...changes };
    await saveAcademyCareer(updated);
    setNotice(`${updated.name} was updated.`);
  }

  async function saveMonthlyJobs() {
    if (!pendingJobChanges.length || savingJobs) return;
    const finalCounts = new Map<string, number>();
    for (const member of members) {
      const chosen = activeCareers.find((career) => career.id === jobDrafts[member.id]);
      const name = chosen?.name ?? member.career;
      finalCounts.set(name, (finalCounts.get(name) ?? 0) + 1);
    }
    const overfilled = activeCareers.find((career) => (finalCounts.get(career.name) ?? 0) > career.positions);
    if (overfilled) {
      setNotice(`${overfilled.name} has ${finalCounts.get(overfilled.name)} students but only ${overfilled.positions} positions. Adjust the selections or increase positions, then save.`);
      return;
    }
    setSavingJobs(true);
    try {
      await saveManyAcademyMembers(pendingJobChanges.map((member) => {
        const chosen = activeCareers.find((career) => career.id === jobDrafts[member.id])!;
        return { ...member, career: chosen.name, weeklyPay: chosen.pay };
      }));
      setNotice(`Saved ${pendingJobChanges.length} job change(s). Future paychecks use each student's new weekly pay.`);
      setJobDrafts({});
    } catch (error) {
      setNotice(`Could not save job changes: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setSavingJobs(false);
    }
  }

  async function deleteCareer(career: AcademyCareer) {
    const filled = filledByCareer.get(career.name) ?? 0;
    if (filled > 0) {
      setNotice(`You cannot delete ${career.name} while ${filled} member(s) are assigned to it. Reassign them first.`);
      return;
    }
    if (!confirm(`Delete ${career.name}?`)) return;
    await removeAcademyCareer(career.id);
  }

  async function removeMember(id: string) {
    if (!confirm("Remove this Academy Member?")) return;
    await removeAcademyMember(id);
    setSelectedId("");
  }

  function downloadBackup() {
    const blob = new Blob([JSON.stringify({ members, careers }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `fair-financial-academy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <DashboardShell role="Teacher">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACADEMY HEADQUARTERS</p>
          <h1>Good afternoon, Ms. Fair</h1>
          <p>Manage members, careers, Friday payroll, rent, banking, and debit cards.</p>
        </div>
        <button className="btn btn-secondary no-print" onClick={downloadBackup}>Download backup</button>
      </div>

      {notice && <div className="success-banner">{notice}</div>}
      {busy && <p>Loading Academy records…</p>}

      <div className="grid teacher-metrics">
        <div className="card"><div>Academy Members</div><div className="metric">{members.length}</div></div>
        <div className="card"><div>Class bank balance</div><div className="metric">${classBalance.toFixed(2)}</div></div>
        <div className="card"><div>Career positions</div><div className="metric">{activeCareers.reduce((sum, item) => sum + item.positions, 0)}</div></div>
        <div className="card"><div>Friday rent total</div><div className="metric">${(members.length * WEEKLY_RENT).toFixed(2)}</div></div>
      </div>

      <section className="section two-column">
        <form className="card" onSubmit={addMember}>
          <h2>Add Academy Member</h2>
          <label>Student name</label>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Student name" required />
          <label>Academy career</label>
          <select value={careerId} onChange={(event) => setCareerId(event.target.value)}>
            {activeCareers.map((career) => {
              const filled = filledByCareer.get(career.name) ?? 0;
              return <option key={career.id} value={career.id}>{career.name} — ${career.pay} ({filled}/{career.positions})</option>;
            })}
          </select>
          <label>Starting balance</label>
          <input inputMode="decimal" value={startingBalance} onChange={(event) => setStartingBalance(event.target.value)} />
          <button className="btn btn-primary" type="submit" style={{ marginTop: 16 }}>Create account + shared PIN</button>
        </form>

        <div className="card">
          <h2>Friday Money Day</h2>
          <p>Run payroll first, then collect ${WEEKLY_RENT} rent. Students can shop Friday afternoon with the remaining balance.</p>
          <div className="actions no-print">
            <button disabled={transactionBusy} className="btn btn-primary" onClick={runFridayPayroll}>1. Run Friday payroll</button>
            <button disabled={transactionBusy} className="btn btn-secondary" onClick={collectFridayRent}>2. Collect Friday rent</button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="page-heading" style={{ marginBottom: 12 }}>
          <div><h2>Academy Careers</h2><p>Edit available jobs here. At the start of each month, assign students new jobs in the Academy Members table below.</p></div>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Career</th><th>Weekly pay</th><th>Positions</th><th>Filled</th><th>Active</th><th /></tr></thead>
            <tbody>
              {careers.map((career) => {
                const filled = filledByCareer.get(career.name) ?? 0;
                return (
                  <tr key={career.id}>
                    <td><input value={career.name} onChange={(event) => updateCareer(career, { name: event.target.value })} /></td>
                    <td><input style={{ maxWidth: 90 }} inputMode="decimal" value={career.pay} onChange={(event) => updateCareer(career, { pay: Math.max(0, Number(event.target.value) || 0) })} /></td>
                    <td><input style={{ maxWidth: 80 }} inputMode="numeric" value={career.positions} onChange={(event) => updateCareer(career, { positions: Math.max(1, Math.floor(Number(event.target.value) || 1)) })} /></td>
                    <td>{filled}/{career.positions}</td>
                    <td><input type="checkbox" checked={career.active} onChange={(event) => updateCareer(career, { active: event.target.checked })} /></td>
                    <td><button className="danger-button no-print" onClick={() => deleteCareer(career)}>Delete</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <form onSubmit={createCareer} className="actions no-print" style={{ marginTop: 18, alignItems: "end" }}>
          <div><label>New career</label><input value={newCareerName} onChange={(event) => setNewCareerName(event.target.value)} placeholder="Career name" /></div>
          <div><label>Weekly pay</label><input style={{ maxWidth: 110 }} value={newCareerPay} onChange={(event) => setNewCareerPay(event.target.value)} /></div>
          <div><label>Positions</label><input style={{ maxWidth: 100 }} value={newCareerPositions} onChange={(event) => setNewCareerPositions(event.target.value)} /></div>
          <button className="btn btn-primary" type="submit">Add career</button>
        </form>
      </section>

      <section className="card">
          <h2>Academy Members</h2>
          <p>Monthly job rotation: choose jobs for students, then select Save job changes. You can swap students between full jobs before saving. Future paychecks use the new weekly pay.</p>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Name</th><th>ID</th><th>Shared PIN</th><th>Career</th><th>Pay</th><th>Balance</th><th /></tr></thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td><button className="link-button" onClick={() => setSelectedId(member.id)}>{member.name}</button></td>
                  <td>{member.id}</td><td><strong>{member.pin}</strong></td>
                  <td><select aria-label={`Career for ${member.name}`} disabled={savingJobs} value={jobDrafts[member.id] ?? activeCareers.find((career) => career.name === member.career)?.id ?? ""} onChange={(event) => setJobDrafts((current) => ({ ...current, [member.id]: event.target.value }))}><option value="" disabled>{member.career}</option>{activeCareers.map((career) => <option key={career.id} value={career.id}>{career.name}</option>)}</select></td>
                  <td>${member.weeklyPay}</td><td>${member.balance.toFixed(2)}</td>
                  <td><button className="danger-button no-print" onClick={() => removeMember(member.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions no-print" style={{ marginTop: 16 }}><button className="btn btn-primary" disabled={!pendingJobChanges.length || savingJobs} onClick={saveMonthlyJobs}>{savingJobs ? "Saving…" : `Save job changes${pendingJobChanges.length ? ` (${pendingJobChanges.length})` : ""}`}</button>{pendingJobChanges.length > 0 && <button className="btn btn-secondary" disabled={savingJobs} onClick={() => setJobDrafts({})}>Cancel changes</button>}</div>
      </section>

      {selected && (
        <section className="section two-column">
          <div className="card transaction-card">
            <h2>Individual Transaction</h2>
            <label>Select member</label>
            <select value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>{members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select>
            <label>Amount</label><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <label>Reason</label>
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              <optgroup label="Deposits">{DEPOSIT_REASONS.map((item) => <option key={item}>{item}</option>)}</optgroup>
              <optgroup label="Withdrawals">{WITHDRAWAL_REASONS.map((item) => <option key={item}>{item}</option>)}</optgroup>
              <option>{REASON_OPTIONS[REASON_OPTIONS.length - 1]}</option>
            </select>
            {reason === "Custom Reason" && <input aria-label="Custom individual reason" value={customReason} onChange={(event) => setCustomReason(event.target.value)} placeholder="Type the custom reason" />}
            <div className="actions no-print"><button disabled={transactionBusy} className="btn btn-primary" onClick={() => postTransaction(1)}>Deposit</button><button disabled={transactionBusy} className="btn btn-secondary" onClick={() => postTransaction(-1)}>Withdraw</button></div>
            <div className="actions no-print"><button className="text-button" type="button" onClick={() => previewTransactionChime(1)}>Hear deposit sound</button><button className="text-button" type="button" onClick={() => previewTransactionChime(-1)}>Hear withdrawal sound</button></div>
            <p><strong>Shared parent/student PIN:</strong> {selected.pin}</p>
          </div>
          <div><DecoratedDebitCard member={selected} /><p className="muted-note">Student card choices synchronize across devices.</p></div>
        </section>
      )}

      {!!members.length && (
        <section className="section two-column">
          <div className="card transaction-card">
            <div className="section-title-row">
              <div><h2>Class Transaction</h2><p>Choose any members, or select the whole class.</p></div>
              <div className="actions no-print compact-actions">
                <button className="text-button" type="button" onClick={() => setCheckedMemberIds(members.map((member) => member.id))}>Select all</button>
                <button className="text-button" type="button" onClick={() => setCheckedMemberIds([])}>Clear</button>
              </div>
            </div>
            <div className="member-checklist">
              {members.map((member) => (
                <label className="member-check" key={member.id}>
                  <input type="checkbox" checked={checkedMemberIds.includes(member.id)} onChange={(event) => setCheckedMemberIds((current) => event.target.checked ? [...current, member.id] : current.filter((id) => id !== member.id))} />
                  <span>{member.name}</span><small>{member.id}</small>
                </label>
              ))}
            </div>
            <label>Amount per member</label><input inputMode="decimal" value={classAmount} onChange={(event) => setClassAmount(event.target.value)} />
            <label>Reason</label>
            <select value={classReason} onChange={(event) => setClassReason(event.target.value)}>
              <optgroup label="Deposits">{DEPOSIT_REASONS.map((item) => <option key={item}>{item}</option>)}</optgroup>
              <optgroup label="Withdrawals">{WITHDRAWAL_REASONS.map((item) => <option key={item}>{item}</option>)}</optgroup>
              <option>{REASON_OPTIONS[REASON_OPTIONS.length - 1]}</option>
            </select>
            {classReason === "Custom Reason" && <input aria-label="Custom class reason" value={classCustomReason} onChange={(event) => setClassCustomReason(event.target.value)} placeholder="Type the custom reason" />}
            <div className="actions no-print"><button disabled={transactionBusy} className="btn btn-primary" onClick={() => postClassTransaction(1)}>Deposit to selected</button><button disabled={transactionBusy} className="btn btn-secondary" onClick={() => postClassTransaction(-1)}>Withdraw from selected</button></div>
          </div>

          <div className="card">
            <h2>Transaction History</h2>
            <label>View member</label>
            <select value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>{members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select>
            {selected?.transactions.length ? (
              <div className="transaction-history">
                {selected.transactions.map((transaction) => (
                  <div className="transaction-history-row" key={transaction.id}>
                    <div><strong>{transaction.description}</strong><span>{new Date(transaction.date).toLocaleString()} • {transaction.teacher ?? "Academy system"}</span></div>
                    <strong className={transaction.amount >= 0 ? "money-positive" : "money-negative"}>{transaction.amount >= 0 ? "+" : "−"}${Math.abs(transaction.amount).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            ) : <p className="muted-note">No transactions yet.</p>}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
