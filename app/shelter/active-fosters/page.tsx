"use client";
import { Irish_Grover, Bree_Serif } from "next/font/google";
import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot, doc, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

type Foster = {
  id: string;
  petId: string;
  userId: string;
  petName: string;
  startDate: string;
  endDate: string;
  currentDay: number;
  duration: number;
  renewalRequested: boolean;
};

export default function ActiveFosters() {
  const [fosters, setFosters] = useState<Foster[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});

  // Active fosters
  useEffect(() => {
    const q = query(collection(db, "fosters"), where("status", "==", "active"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        const start = new Date(data.startDate);
        const elapsed = Math.max(1, Math.ceil((Date.now() - start.getTime()) / 86400000));
        return {
          id: d.id,
          petId: data.petId || "",
          petName: data.petName || "Unknown",
          userId: data.userId || "",
          startDate: start.toLocaleDateString("en-IN"),
          endDate: data.endDate || "",
          currentDay: elapsed,
          duration: data.durationDays || 30,
          renewalRequested: data.renewalRequested || false,
        };
      });
      setFosters(list);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error(err);
      setError("Connection lost. Data may be stale.");
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Pending count
  useEffect(() => {
    const q = query(collection(db, "foster_applications"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (s) => setPendingCount(s.size));
    return () => unsub();
  }, []);

  // Total pets
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pets"), (s) => setTotalPets(s.size));
    return () => unsub();
  }, []);

  const completeFoster = async (foster: Foster) => {
    if (!window.confirm(`Mark foster for ${foster.petName} as completed?`)) return;
    try {
      await updateDoc(doc(db, "fosters", foster.id), { status: "completed" });
      if (foster.petId) await updateDoc(doc(db, "pets", foster.petId), { status: "available" });
    } catch (err) { console.error(err); alert("Failed. Check console."); }
  };

  const extendFoster = async (foster: Foster) => {
    const days = parseInt(extendDays[foster.id] || "");
    if (isNaN(days) || days < 1 || days > 90) {
      alert("Please enter a valid number of days (1–90).");
      return;
    }
    setExtendingId(foster.id);
    try {
      const currentEnd = foster.endDate ? new Date(foster.endDate) : new Date();
      const newEnd = new Date(currentEnd.getTime() + days * 86400000);
      const newEndStr = newEnd.toISOString().split("T")[0];
      const newDuration = foster.duration + days;
      await updateDoc(doc(db, "fosters", foster.id), {
        endDate: newEndStr,
        durationDays: newDuration,
        renewalRequested: false,  // clear the renewal flag
      });
      setExtendDays((prev) => { const n = { ...prev }; delete n[foster.id]; return n; });
    } catch (err) { console.error(err); }
    setExtendingId(null);
  };

  return (
    <div className={`flex-1 p-10 w-full min-h-screen bg-[#F5F5EC] ${breeSerif.className} text-[#1E1E1E]`}>
      <span className="text-[#E22726] text-sm font-bold tracking-[0.2em] uppercase">Overview</span>
      <h2 className={`${irishGrover.className} text-5xl mt-2 mb-8`}>Active Fosters</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-2xl text-sm font-bold uppercase tracking-widest text-center">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {[
          { label: "Active Fosters",       value: fosters.length },
          { label: "Pending Applications", value: pendingCount },
          { label: "Total Pets",           value: totalPets },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">{s.label}</h3>
            <p className={`${irishGrover.className} text-4xl`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Renewal requests highlight */}
      {fosters.some((f) => f.renewalRequested) && (
        <div className="mb-6 p-4 bg-[#FFF3E3] border-2 border-[#FFE0B2] rounded-2xl flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <p className="text-sm font-bold text-orange-600 uppercase tracking-widest">
            {fosters.filter((f) => f.renewalRequested).length} foster renewal request{fosters.filter((f) => f.renewalRequested).length !== 1 ? "s" : ""} pending
          </p>
        </div>
      )}

      <h3 className="font-bold text-xl mb-6 uppercase tracking-wider">Current Active Fosters</h3>
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-100 bg-[#F5F5EC] text-gray-400 text-xs tracking-wider uppercase">
              <th className="px-6 py-4 font-bold">Pet</th>
              <th className="px-6 py-4 font-bold">User ID</th>
              <th className="px-6 py-4 font-bold">Start</th>
              <th className="px-6 py-4 font-bold">Progress</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading…</td></tr>
            ) : fosters.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest">No active fosters.</td></tr>
            ) : (
              fosters.map((foster) => {
                const pct = Math.min(100, Math.round((foster.currentDay / foster.duration) * 100));
                const daysLeft = foster.duration - foster.currentDay;
                const nearEnd = daysLeft <= 3 && daysLeft >= 0;
                return (
                  <tr key={foster.id} className="border-b border-gray-100 hover:bg-[#F5F5EC]/50 transition">
                    <td className="px-6 py-5">
                      <p className="font-bold text-[#1E1E1E]">{foster.petName}</p>
                      <p className="text-xs text-[#999]">{foster.petId.slice(0, 8)}…</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#999] font-mono">{foster.userId.slice(0, 10)}…</td>
                    <td className="px-6 py-5 text-sm">{foster.startDate}</td>
                    <td className="px-6 py-5 w-48">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#E22726] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[#999] w-10 text-right">{pct}%</span>
                      </div>
                      <p className="text-[10px] text-[#999] mt-1">Day {foster.currentDay} of {foster.duration}</p>
                    </td>
                    <td className="px-6 py-5">
                      {foster.renewalRequested ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                          Renewal Req
                        </span>
                      ) : nearEnd ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full">
                          Ending Soon
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-600 px-3 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Extend input — shows for renewal requests or near-end fosters */}
                        {(foster.renewalRequested || nearEnd) && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1" max="90"
                              placeholder="Days"
                              value={extendDays[foster.id] || ""}
                              onChange={(e) => setExtendDays((prev) => ({ ...prev, [foster.id]: e.target.value }))}
                              className="w-20 px-3 py-1.5 border-2 border-[#D9D9D9] rounded-xl text-xs font-bold text-center outline-none focus:border-[#E22726]"
                            />
                            <button
                              onClick={() => extendFoster(foster)}
                              disabled={extendingId === foster.id}
                              className="px-4 py-1.5 bg-orange-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition disabled:opacity-50"
                            >
                              {extendingId === foster.id ? "…" : "Extend"}
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => completeFoster(foster)}
                          className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition"
                        >
                          Complete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}