"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase"; // Adjust path if needed
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Irish_Grover, Bree_Serif } from "next/font/google";
import Link from "next/link";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

export default function ShelterDashboard() {
  const [stats, setStats] = useState({ totalPets: 0, pendingApps: 0, activeFosters: 0 });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If no one is logged in, send them back to the login page
        router.push("/shelter/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Real-time listener for Pets
    const unsubPets = onSnapshot(collection(db, "pets"), (snap) => {
      const pets = snap.docs.map(doc => doc.data());
      setStats(prev => ({ 
        ...prev, 
        totalPets: pets.length,
        activeFosters: pets.filter((p: any) => p.status === "fostered").length 
      }));
    });

    // Real-time listener for Applications
    const unsubApps = onSnapshot(collection(db, "foster_applications"), (snap) => {
      const apps = snap.docs.map(doc => doc.data());
      setStats(prev => ({ 
        ...prev, 
        pendingApps: apps.filter((a: any) => a.status === "pending").length 
      }));
    });

    return () => { unsubPets(); unsubApps(); };
  }, []);

  return (
    <main className={`min-h-screen bg-[#F5F5EC] p-10 ${breeSerif.className}`}>
      <header className="mb-12">
        <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em]">Management</span>
        <h1 className={`${irishGrover.className} text-6xl text-[#1E1E1E] mt-3 uppercase`}>Shelter Hub</h1>
      </header>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatCard label="Total Rescues" value={stats.totalPets} color="bg-[#E3F2FD] border-[#BBDEFB]" />
        <StatCard label="Pending Apps" value={stats.pendingApps} color="bg-[#FFF3E3] border-[#FFE0B2]" highlight={stats.pendingApps > 0} />
        <StatCard label="In Foster Homes" value={stats.activeFosters} color="bg-[#F1F8E9] border-[#DCEDC8]" />
      </div>

      {/* QUICK ACTIONS - BENTO STYLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* REVIEW APPLICATIONS - Wide Bento Card */}
        <Link href="/shelter/Inbox" className="group p-10 bg-white rounded-[3rem] border-2 border-[#E22726] transition-all shadow-md hover:shadow-xl md:col-span-2 flex flex-col justify-center min-h-[160px]">
          <h2 className={`${irishGrover.className} text-4xl md:text-5xl mb-3 text-[#E22726]`}>Review Applications →</h2>
          <p className="text-gray-500 text-xl font-bold tracking-wide">Check who wants to foster your animals.</p>
        </Link>

        {/* MANAGE INVENTORY - Square Bento Card */}
        <Link href="/shelter/Inventory" className="group p-10 bg-[#1E1E1E] text-white rounded-[3rem] border-2 border-[#1E1E1E] hover:bg-[#2a2a2a] transition-all shadow-lg flex flex-col justify-center min-h-[200px]">
          <h2 className={`${irishGrover.className} text-3xl mb-2`}>Manage Inventory →</h2>
          <p className="text-gray-300 text-lg tracking-wide">Add new pets or update their status.</p>
        </Link>

        {/* ACTIVE FOSTERS - Square Bento Card */}
        <Link href="/shelter/active-fosters" className="group p-10 bg-[#35D0E6] text-[#1E1E1E] rounded-[3rem] border-2 border-[#35D0E6] hover:bg-[#2bc2d8] transition-all shadow-lg flex flex-col justify-center min-h-[200px]">
          <h2 className={`${irishGrover.className} text-3xl mb-2`}>Active Fosters →</h2>
          <p className="text-[#1E1E1E]/80 font-bold text-lg tracking-wide">Track pets currently in foster homes.</p>
        </Link>
        
      </div>
    </main>
  );
}

function StatCard({ label, value, color, highlight = false }: any) {
  return (
    <div className={`${color} p-10 rounded-[3rem] border-2 shadow-sm transition-transform hover:scale-[1.02]`}>
      <p className="text-[14px] uppercase tracking-widest text-[#1B4D6B]/60 mb-1">{label}</p>
      <h3 className={`${irishGrover.className} text-6xl text-[#1B4D6B] ${highlight && value > 0 ? 'animate-bounce' : ''}`}>
        {value}
      </h3>
    </div>
  );
}