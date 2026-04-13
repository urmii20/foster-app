"use client";
import { Irish_Grover, Bree_Serif } from "next/font/google";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif   = Bree_Serif({ weight: "400", subsets: ["latin"] });

type Foster = {
  id: string; petId: string; petName: string; userId: string;
  startDate: string; currentDay: number; duration: number; isOverdue: boolean;
};

export default function ActiveFosters() {
  const [fosters,      setFosters]      = useState<Foster[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalPets,    setTotalPets]    = useState(0);
  const [isLoading,    setIsLoading]    = useState(true);
  const [dbError,      setDbError]      = useState(false);

  useEffect(() => {
    const q = query(collection(db, "fosters"), where("status", "==", "active"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const today = new Date();
        setFosters(snapshot.docs.map((d) => {
          const data  = d.data();
          const start = new Date(data.startDate);
          const diffTime  = isNaN(start.getTime()) ? 0 : today.getTime() - start.getTime();
          const diffDays  = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          const endDate   = data.endDate ? new Date(data.endDate) : null;
          const isOverdue = endDate && !isNaN(endDate.getTime()) ? today > endDate : false;
          return {
            id: d.id, petId: data.petId ?? "unknown",
            petName: data.petName ?? data.petId ?? "—",
            userId: data.userId ?? "—",
            startDate: isNaN(start.getTime()) ? "Invalid date" : start.toLocaleDateString(),
            currentDay: diffDays,
            duration: data.durationDays ?? diffDays,
            isOverdue,
          };
        }));
        setIsLoading(false);
      },
      (err) => { console.error("Active fosters error:", err); setDbError(true); setIsLoading(false); }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "foster_applications"), where("status", "==", "pending")),
      (snap) => setPendingCount(snap.size),
      (err) => console.error("Pending count error:", err)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "pets"),
      (snap) => setTotalPets(snap.size),
      (err) => console.error("Total pets error:", err)
    );
    return () => unsub();
  }, []);

  const handleComplete = async (id: string, petId: string) => {
    try {
      await updateDoc(doc(db, "fosters", id), { status: "completed" });
      if (petId && petId !== "unknown") {
        await updateDoc(doc(db, "pets", petId), { status: "available" });
      }
    } catch (error) {
      console.error("Error completing foster:", error);
      alert("Failed to complete. Please try again.");
    }
  };

  return (
    <div className={`flex-1 p-10 w-full min-h-screen bg-[#F5F5EC] ${breeSerif.className} text-[#1E1E1E]`}>
      <span className="text-[#E22726] text-sm font-bold tracking-[0.2em] uppercase">Overview</span>
      <h2 className={`${irishGrover.className} text-5xl mt-2 mb-8`}>Active Fosters</h2>

      {dbError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-[#E22726] font-bold">
          ⚠ Database connection error. Showing last known data.
        </div>
      )}

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
              <th className="pb-4 font-bold">Pet</th>
              <th className="pb-4 font-bold">User</th>
              <th className="pb-4 font-bold">Start Date</th>
              <th className="pb-4 font-bold">Progress</th>
              <th className="pb-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Live Data...</td></tr>
            ) : fosters.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400 font-bold uppercase tracking-widest">No Active Fosters</td></tr>
            ) : fosters.map((foster) => {
              const progress = Math.min(100, Math.round((foster.currentDay / foster.duration) * 100));
              return (
                <tr key={foster.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-5 font-bold">{foster.petName}</td>
                  <td className="py-5 text-sm text-gray-500 font-mono">{foster.userId.length > 12 ? `${foster.userId.slice(0, 10)}…` : foster.userId}</td>
                  <td className="py-5 text-sm">{foster.startDate}</td>
                  <td className="py-5 w-48">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: foster.isOverdue ? "#E22726" : "#35D0E6" }} />
                      </div>
                      <span className={`text-xs font-bold whitespace-nowrap ${foster.isOverdue ? "text-[#E22726]" : "text-gray-500"}`}>
                        {foster.isOverdue ? "OVERDUE" : `Day ${foster.currentDay}/${foster.duration}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 text-right">
                    <button onClick={() => handleComplete(foster.id, foster.petId)} className="px-5 py-2 bg-[#1E1E1E] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#E22726] transition-all">
                      Complete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}