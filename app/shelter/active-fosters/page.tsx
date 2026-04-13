"use client";
import { Irish_Grover, Bree_Serif } from "next/font/google";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

type Foster = {
  id: string;
  petId: string;
  userId: string;
  startDate: string;
  currentDay: number;
  duration: number;
};

export default function Dashboard() {
  const [fosters, setFosters] = useState<Foster[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listener 1: Active fosters
  useEffect(() => {
    const q = query(collection(db, "fosters"), where("status", "==", "active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeFosters = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const start = new Date(data.startDate);
        const today = new Date();
        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: docSnap.id,
          petId: data.petId,
          userId: data.userId,
          startDate: start.toLocaleDateString(),
          currentDay: diffDays > 0 ? diffDays : 1,
          duration: data.durationDays || 30,
        };
      });
      setFosters(activeFosters);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error("Active fosters listener error:", err);
      setError("Connection lost. Data may be stale.");
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // FIX: Listener 2 — Pending applications (was hardcoded 0)
  useEffect(() => {
    const q = query(collection(db, "foster_applications"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => setPendingCount(snap.size), (err) => console.error(err));
    return () => unsub();
  }, []);

  // FIX: Listener 3 — Total pets (was hardcoded --)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pets"), (snap) => setTotalPets(snap.size), (err) => console.error(err));
    return () => unsub();
  }, []);

  // FIX: Complete foster now ALSO resets pet status to "available"
  const handleCompleteFoster = async (foster: Foster) => {
    if (!window.confirm("Mark this foster as completed? Pet will return to 'available'.")) return;
    try {
      await updateDoc(doc(db, "fosters", foster.id), { status: "completed" });
      if (foster.petId) {
        await updateDoc(doc(db, "pets", foster.petId), { status: "available" });
      }
    } catch (err) {
      console.error("Error completing foster:", err);
      alert("Failed to complete. Check console.");
    }
  };

  return (
    <div className={`flex-1 p-10 w-full min-h-screen bg-[#F5F5EC] ${breeSerif.className} text-[#1E1E1E]`}>
      <span className="text-[#E22726] text-sm font-bold tracking-[0.2em] uppercase">Overview</span>
      <h2 className={`${irishGrover.className} text-5xl mt-2 mb-8`}>Dashboard</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-2xl text-sm font-bold uppercase tracking-widest text-center">{error}</div>
      )}

      {/* FIX: All three cards now show live data */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Active Fosters</h3>
          <p className={`${irishGrover.className} text-4xl`}>{fosters.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Pending Applications</h3>
          <p className={`${irishGrover.className} text-4xl`}>{pendingCount}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Total Pets</h3>
          <p className={`${irishGrover.className} text-4xl`}>{totalPets}</p>
        </div>
      </div>

      <h3 className="font-bold text-xl mb-6 uppercase tracking-wider">Current Active Fosters</h3>
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-100 text-gray-400 text-sm tracking-wider uppercase">
              <th className="pb-4 font-bold">Pet ID</th>
              <th className="pb-4 font-bold">User ID</th>
              <th className="pb-4 font-bold">Start Date</th>
              <th className="pb-4 font-bold">Progress</th>
              <th className="pb-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Live Data...</td></tr>
            ) : fosters.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400 font-bold uppercase tracking-widest">No active fosters right now.</td></tr>
            ) : (
              fosters.map((f) => {
                const progress = Math.min(Math.round((f.currentDay / f.duration) * 100), 100);
                return (
                  <tr key={f.id} className="border-b border-gray-50">
                    <td className="py-5 text-sm font-bold">{f.petId}</td>
                    <td className="py-5 text-sm">{f.userId}</td>
                    <td className="py-5 text-sm">{f.startDate}</td>
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Day {f.currentDay}/{f.duration}</span>
                      </div>
                    </td>
                    <td className="py-5 text-right">
                      <button onClick={() => handleCompleteFoster(f)}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                        Complete
                      </button>
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