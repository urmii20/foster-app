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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "fosters"), where("status", "==", "active"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeFosters = snapshot.docs.map((doc) => {
        const data = doc.data();
        const start = new Date(data.startDate);
        const today = new Date();
        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: doc.id,
          petId: data.petId,
          userId: data.userId,
          startDate: start.toLocaleDateString(),
          currentDay: diffDays > 0 ? diffDays : 1,
          duration: data.durationDays,
        };
      });

      setFosters(activeFosters);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCompleteFoster = async (id: string) => {
    try {
      const fosterRef = doc(db, "fosters", id);
      await updateDoc(fosterRef, { status: "completed" });
    } catch (error) {
      console.error("Error completing foster:", error);
      alert("Failed to complete. Check console.");
    }
  };

  return (
    <div className={`flex-1 p-10 w-full min-h-screen bg-[#F5F5EC] ${breeSerif.className} text-[#1E1E1E]`}>
      <span className="text-[#E22726] text-sm font-bold tracking-[0.2em] uppercase">Overview</span>
      <h2 className={`${irishGrover.className} text-5xl mt-2 mb-8`}>Dashboard</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Active Fosters</h3>
          <p className={`${irishGrover.className} text-4xl`}>{fosters.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Pending Applications</h3>
          <p className={`${irishGrover.className} text-4xl`}>0</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Total Pets</h3>
          <p className={`${irishGrover.className} text-4xl`}>--</p>
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
              fosters.map((foster) => (
                <tr key={foster.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-6 font-bold text-xl">{foster.petId.substring(0, 8)}...</td>
                  <td className="py-6 text-gray-600 font-bold">{foster.userId.substring(0, 8)}...</td>
                  <td className="py-6 text-gray-500">{foster.startDate}</td>
                  <td className="py-6">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#E22726]">Day {foster.currentDay}</span>
                      <span className="text-gray-400 text-sm">of {foster.duration}</span>
                    </div>
                  </td>
                  <td className="py-6 text-right">
                    <button 
                      onClick={() => handleCompleteFoster(foster.id)}
                      className="bg-[#0F9D58] hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm tracking-widest uppercase"
                    >
                      Complete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}