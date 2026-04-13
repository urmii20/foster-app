"use client";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, where, writeBatch } from "firebase/firestore";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif   = Bree_Serif({ weight: "400", subsets: ["latin"] });

function SetupFosterModal({ application, onClose }: { application: any; onClose: () => void }) {
  const [dates,     setDates]     = useState({ start: "", end: "" });
  const [tasks,     setTasks]     = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState("");

  const handleApproveAndLaunch = async () => {
    if (!dates.start) return alert("Please select a start date.");
    if (!application.userId || application.userId === "guest") {
      return alert("This application has no valid user ID. The applicant must resubmit.");
    }

    const startObj     = new Date(dates.start);
    const endObj       = dates.end ? new Date(dates.end) : null;
    const durationDays = endObj
      ? Math.max(1, Math.ceil((endObj.getTime() - startObj.getTime()) / 86400000))
      : 30;

    setSaving(true);
    setSaveErr("");

    try {
      const batch     = writeBatch(db);
      const fosterRef = doc(collection(db, "fosters"));

      batch.set(fosterRef, {
        userId: application.userId, petId: application.petId ?? "unknown",
        petName: application.petName, startDate: dates.start,
        endDate: dates.end ?? "", durationDays, status: "active",
        createdAt: new Date().toISOString(),
      });

      tasks.forEach((title) => {
        const taskRef = doc(collection(db, `fosters/${fosterRef.id}/tasks`));
        batch.set(taskRef, { title, date: dates.start, isCompleted: false });
      });

      batch.update(doc(db, "foster_applications", application.id), { status: "approved" });

      if (application.petId && application.petId !== "unknown") {
        batch.update(doc(db, "pets", application.petId), { status: "fostered" });
      }

      await batch.commit();
      onClose();
    } catch (err: any) {
      console.error("Batch commit failed:", err);
      setSaveErr("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`bg-[#F5F5EC] rounded-3xl p-10 w-full max-w-lg shadow-2xl ${breeSerif.className}`}>
        <h2 className={`${irishGrover.className} text-3xl mb-2`}>Set Up Foster</h2>
        <p className="text-sm text-gray-500 mb-6">Applicant: <strong>{application.fullName}</strong> · Pet: <strong>{application.petName}</strong></p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {["start", "end"].map((key) => (
            <div key={key}>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">{key === "start" ? "Start Date *" : "End Date"}</label>
              <input type="date" value={(dates as any)[key]} onChange={(e) => setDates((d) => ({ ...d, [key]: e.target.value }))}
                className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:border-[#E22726] outline-none" />
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">Add Care Tasks</label>
          <div className="flex gap-3">
            <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && taskInput.trim()) { setTasks(t => [...t, taskInput.trim()]); setTaskInput(""); }}}
              placeholder="e.g. Morning feeding at 8am"
              className="flex-1 p-3 rounded-xl border border-gray-200 bg-white focus:border-[#E22726] outline-none text-sm" />
            <button onClick={() => { if (taskInput.trim()) { setTasks(t => [...t, taskInput.trim()]); setTaskInput(""); }}}
              className="px-4 py-2 bg-[#1E1E1E] text-white rounded-xl text-xs font-bold hover:bg-[#E22726] transition-all">Add</button>
          </div>
        </div>

        {tasks.length > 0 && (
          <ul className="mb-6 flex flex-col gap-2 max-h-36 overflow-y-auto">
            {tasks.map((t, i) => (
              <li key={i} className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 text-sm">
                <span>{t}</span>
                <button onClick={() => setTasks(ts => ts.filter((_, j) => j !== i))} className="text-gray-300 hover:text-[#E22726] text-xs">✕</button>
              </li>
            ))}
          </ul>
        )}

        {saveErr && <p className="text-[#E22726] text-xs font-bold mb-4">{saveErr}</p>}

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 border border-gray-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50">Cancel</button>
          <button onClick={handleApproveAndLaunch} disabled={saving}
            className={`flex-[2] py-4 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-[#E22726] hover:bg-red-700"}`}>
            {saving ? "Saving…" : "Approve & Launch"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [selected,     setSelected]     = useState<any | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [dbError,      setDbError]      = useState(false);

  useEffect(() => {
    const q = query(collection(db, "foster_applications"), where("status", "==", "pending"));
    const unsub = onSnapshot(
      q,
      (snap) => { setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setIsLoading(false); },
      (err) => { console.error("Inbox listener error:", err); setDbError(true); setIsLoading(false); }
    );
    return () => unsub();
  }, []);

  const handleReject = async (application: any) => {
    if (!confirm(`Reject ${application.fullName}'s application for ${application.petName}?`)) return;
    try {
      await updateDoc(doc(db, "foster_applications", application.id), { status: "rejected" });
    } catch (err) {
      console.error("Reject failed:", err);
      alert("Could not reject. Please try again.");
    }
  };

  return (
    <div className={`flex-1 p-10 min-h-screen bg-[#F5F5EC] ${breeSerif.className} text-[#1E1E1E]`}>
      <span className="text-[#E22726] text-sm font-bold tracking-[0.2em] uppercase">Shelter</span>
      <h2 className={`${irishGrover.className} text-5xl mt-2 mb-8`}>Applications Inbox</h2>

      {dbError && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-[#E22726] font-bold">⚠ Could not load applications. Check your connection and refresh.</div>}
      {isLoading && <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading...</p>}
      {!isLoading && applications.length === 0 && !dbError && (
        <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No pending applications</p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {applications.map((app) => (
          <div key={app.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-start justify-between gap-6">
            <div className="flex flex-col gap-1">
              <p className={`${irishGrover.className} text-2xl`}>{app.fullName}</p>
              <p className="text-sm text-gray-500">Applying for <strong>{app.petName}</strong></p>
              <p className="text-xs text-gray-400 mt-1">{app.location} · {app.residence} · {app.experience === "Yes" ? "Has foster experience" : "First-time fosterer"}</p>
              {(!app.userId || app.userId === "guest") && (
                <p className="text-xs text-[#E22726] font-bold mt-1">⚠ Missing user ID — approval blocked</p>
              )}
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button onClick={() => handleReject(app)} className="px-6 py-3 border-2 border-gray-200 text-gray-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-[#E22726] hover:text-[#E22726] transition-all">Reject</button>
              <button onClick={() => setSelected(app)} className="px-6 py-3 bg-[#1E1E1E] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#E22726] transition-all">Approve →</button>
            </div>
          </div>
        ))}
      </div>

      {selected && <SetupFosterModal application={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}