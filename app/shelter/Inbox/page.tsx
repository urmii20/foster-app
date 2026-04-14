"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection, onSnapshot, doc, updateDoc,
  query, orderBy, writeBatch,
} from "firebase/firestore";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

const cardColors = [
  "bg-[#E8F4FD] border-[#BBDEFB]",
  "bg-[#FFF3E3] border-[#FFE0B2]",
  "bg-[#F1F8E9] border-[#DCEDC8]",
  "bg-[#FCE4EC] border-[#F8BBD0]",
];

// ── SetupFosterModal ──────────────────────────────────────────────────────────
function SetupFosterModal({
  application,
  onClose,
}: {
  application: any;
  onClose: () => void;
}) {
  const [dates, setDates] = useState({ start: "", end: "" });
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleApproveAndLaunch = async () => {
    if (!dates.start) return alert("Please select a start date.");
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      const batch = writeBatch(db);

      // Calculate durationDays
      let durationDays = 30;
      if (dates.start && dates.end) {
        const diff = Math.ceil(
          (new Date(dates.end).getTime() - new Date(dates.start).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (diff > 0) durationDays = diff;
      }

      // 1. Create foster document
      const fosterRef = doc(collection(db, "fosters"));
      batch.set(fosterRef, {
        userId: application.userId || "guest",
        petId: application.petId || "unknown",
        petName: application.petName,
        startDate: dates.start,
        endDate: dates.end,
        durationDays,
        status: "active",
        createdAt: new Date().toISOString(),
      });

      // 2. Write tasks as subcollection
      tasks.forEach((title) => {
        const taskRef = doc(collection(db, `fosters/${fosterRef.id}/tasks`));
        batch.set(taskRef, {
          title,
          date: dates.start,
          isCompleted: false,
        });
      });

      // 3. Update application: status=approved + userNotified=false (triggers toast)
      batch.update(doc(db, "foster_applications", application.id), {
        status: "approved",
        userNotified: false,   // ← ApprovalToast watches for this
      });

      // 4. Mark pet as fostered
      if (application.petId) {
        batch.update(doc(db, "pets", application.petId), { status: "fostered" });
      }

      await batch.commit();

      // 5. Send approval email (non-blocking — don't fail the whole flow if email fails)
      if (application.email) {
        fetch("/api/send-approval-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: application.email,
            userName: application.fullName,
            petName: application.petName,
            startDate: dates.start,
            endDate: dates.end,
            tasks,
          }),
        }).catch(console.error);
      }

      onClose();
    } catch (err: any) {
      console.error("Approve & Launch failed:", err);
      setError("Failed to approve: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className={`bg-[#F5F5EC] p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-gray-200 ${breeSerif.className}`}
      >
        <h2 className={`text-3xl uppercase mb-6 ${irishGrover.className}`}>
          Setup Journey
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">
              Start Date *
            </label>
            <input
            type="date"
            className="w-full p-4 rounded-2xl border-2 border-[#D9D9D9] mt-1 bg-white text-[#1E1E1E] focus:border-[#E22726] outline-none"
            onChange={(e) => setDates({ ...dates, start: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">
              End Date (Optional)
            </label>
            <input
            type="date"
            className="w-full p-4 rounded-2xl border-2 border-[#D9D9D9] mt-1 bg-white text-[#1E1E1E] focus:border-[#E22726] outline-none"
            onChange={(e) => setDates({ ...dates, end: e.target.value })}
            />
          </div>

          <div className="border-t-2 border-[#D9D9D9] pt-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">
              Initial Care Tasks (max 5)
            </label>
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 p-4 rounded-2xl border-2 border-[#D9D9D9] text-sm bg-white text-[#1E1E1E] focus:border-[#E22726] outline-none"
                placeholder="e.g. Vet check-up on Day 1"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && taskInput.trim() && tasks.length < 5) {
                    setTasks([...tasks, taskInput.trim()]);
                    setTaskInput("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (taskInput.trim() && tasks.length < 5) {
                    setTasks([...tasks, taskInput.trim()]);
                    setTaskInput("");
                  }
                }}
                className="px-5 bg-[#1E1E1E] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#E22726] transition"
              >
                +
              </button>
            </div>
            {tasks.length > 0 && (
              <ul className="mt-3 space-y-2">
                {tasks.map((t, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center text-sm bg-white rounded-xl px-4 py-2 border border-[#D9D9D9]"
                  >
                    <span>{t}</span>
                    <button
                      onClick={() => setTasks(tasks.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="text-[#E22726] text-xs font-bold uppercase tracking-wide text-center">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-4 border-2 border-[#D9D9D9] rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApproveAndLaunch}
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? "Launching…" : "Approve & Launch →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Inbox page ───────────────────────────────────────────────────────────
export default function InboxPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "foster_applications"),
      orderBy("submittedAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setApps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Inbox listener error:", err);
        setError("Connection lost. Data may be stale.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject this application?")) return;
    try {
      await updateDoc(doc(db, "foster_applications", id), { status: "rejected" });
    } catch (err) {
      console.error("Reject failed:", err);
      alert("Failed to reject. Please try again.");
    }
  };

  return (
    <main
      className={`min-h-screen bg-[#F5F5EC] p-10 ${breeSerif.className} font-normal`}
    >
      <header className="mb-12">
        <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em]">
          Shelter Portal
        </span>
        <h1
          className={`${irishGrover.className} text-5xl text-[#1E1E1E] mt-3`}
        >
          Incoming Applications
        </h1>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-2xl text-sm font-bold uppercase tracking-widest text-center">
          {error}
        </div>
      )}

      {loading ? (
        <p className="animate-pulse text-gray-400 text-lg">
          Loading applications…
        </p>
      ) : apps.length === 0 ? (
        <div className="py-20 text-center text-[#999] text-sm font-bold uppercase tracking-widest">
          No applications yet.
        </div>
      ) : (
        <div className="grid gap-8">
          {apps.map((app: any, index: number) => {
            const bgColorClass = cardColors[index % cardColors.length];
            return (
              <div
                key={app.id}
                className={`${bgColorClass} rounded-[2.5rem] p-8 border-2 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 transition-transform hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center text-2xl font-bold text-[#1E1E1E]">
                    {app.fullName ? app.fullName[0].toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="text-[20px] text-[#1E1E1E] leading-tight mb-1 font-bold">
                      {app.fullName || "Anonymous"}
                    </h3>
                    <p className="text-[13px] text-gray-500 uppercase tracking-widest">
                      For:{" "}
                      <span className="text-[#E22726] font-bold">
                        {app.petName}
                      </span>
                    </p>
                    {app.email && (
                      <p className="text-[12px] text-gray-400 mt-0.5">{app.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 text-[13px] text-gray-600 font-bold uppercase tracking-tight">
                  <p>🏠 {app.residence || "N/A"}</p>
                  <p>🐾 Exp: {app.experience || "N/A"}</p>
                  <p>
                    ⌛ Status:{" "}
                    <span
                      className={
                        app.status === "approved"
                          ? "text-emerald-600"
                          : app.status === "rejected"
                          ? "text-red-500"
                          : "text-orange-400"
                      }
                    >
                      {app.status}
                    </span>
                  </p>
                  <p>👤 {app.children || "No children"}</p>
                  <p>🐕 {app.otherPets || "No other pets"}</p>
                  {app.location && <p>📍 {app.location}</p>}
                </div>

                <div className="flex gap-4">
                  {app.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleReject(app.id)}
                        className="px-6 py-3 bg-white/50 text-red-600 border border-red-200 rounded-2xl text-[11px] tracking-widest hover:bg-red-600 hover:text-white transition-all uppercase font-bold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all uppercase font-bold"
                      >
                        Approve &amp; Setup
                      </button>
                    </>
                  )}
                  {app.status === "approved" && (
                    <span className="text-emerald-600 text-[11px] tracking-widest border border-emerald-200 bg-emerald-50 px-6 py-3 rounded-2xl uppercase font-bold">
                      ✓ Approved
                    </span>
                  )}
                  {app.status === "rejected" && (
                    <span className="text-red-500 text-[11px] tracking-widest border border-red-200 bg-red-50 px-6 py-3 rounded-2xl uppercase font-bold">
                      ✕ Rejected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <SetupFosterModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </main>
  );
}