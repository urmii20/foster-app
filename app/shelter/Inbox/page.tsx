"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { Irish_Grover, Bree_Serif } from "next/font/google";
 
const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });
 
function SetupFosterModal({ application, onClose }: { application: any; onClose: () => void }) {
  const [dates, setDates] = useState({ start: "", end: "" });
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");
 
  const handleApproveAndLaunch = async () => {
    if (!dates.start) return alert("Please select a start date.");
 
    const batch = writeBatch(db);
 
    // 1. Create the foster document
    const fosterRef = doc(collection(db, "fosters"));
    batch.set(fosterRef, {
      userId: application.userId || "guest",
      petId: application.petId || "unknown",
      petName: application.petName,
      startDate: dates.start,
      endDate: dates.end,
      status: "active",
      createdAt: new Date().toISOString(),
    });
 
    // 2. Write each task as a doc in the subcollection
    tasks.forEach((title) => {
      const taskRef = doc(collection(db, `fosters/${fosterRef.id}/tasks`));
      batch.set(taskRef, {
        title,
        date: dates.start,
        isCompleted: false,
      });
    });
 
    // 3. Update application status
    batch.update(doc(db, "foster_applications", application.id), { status: "approved" });
 
    // 4. Update pet status to "fostered"
    if (application.petId) {
      batch.update(doc(db, "pets", application.petId), { status: "fostered" });
    }
 
    await batch.commit();
    onClose();
  };
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#F5F5EC] p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-gray-200">
        <h2 className={`text-3xl uppercase mb-6 ${irishGrover.className}`}>Setup Journey</h2>
 
        <div className="space-y-4 font-sans">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Start Date</label>
            <input type="date" className="w-full p-4 rounded-2xl border mt-1"
              onChange={e => setDates({ ...dates, start: e.target.value })} />
          </div>
 
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">End Date (Optional)</label>
            <input type="date" className="w-full p-4 rounded-2xl border mt-1"
              onChange={e => setDates({ ...dates, end: e.target.value })} />
          </div>
 
          <div className="border-t pt-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">
              Add Initial Tasks (max 3)
            </label>
            <div className="flex gap-2 mt-1">
              <input
                className="flex-1 p-4 rounded-2xl border text-sm"
                placeholder="e.g. Pick up meds"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && taskInput && tasks.length < 3) {
                    setTasks([...tasks, taskInput]);
                    setTaskInput("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (taskInput && tasks.length < 3) {
                    setTasks([...tasks, taskInput]);
                    setTaskInput("");
                  }
                }}
                className="bg-[#35D0E6] text-white px-6 rounded-2xl font-bold"
              >+</button>
            </div>
          </div>
 
          <div className="max-h-24 overflow-y-auto space-y-2">
            {tasks.map((t, i) => (
              <div key={i} className="text-[10px] bg-white p-3 rounded-xl border font-bold uppercase flex justify-between">
                {t}
                <span className="text-red-400 cursor-pointer" onClick={() => setTasks(tasks.filter((_, idx) => idx !== i))}>✕</span>
              </div>
            ))}
          </div>
        </div>
 
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Cancel</button>
          <button onClick={handleApproveAndLaunch} className="flex-[2] py-4 bg-[#E22726] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-200">
            Approve & Start
          </button>
        </div>
      </div>
    </div>
  );
}
 
export default function ShelterInbox() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
 
  const cardColors = [
    "bg-[#EEEFE8] border-[#5568af]", "bg-[#C9BDEE] border-[#DCEDC8]",
    "bg-[#E9ACBB] border-[#FFE0B2]", "bg-[#8FBC93] border-[#E1BEE7]",
    "bg-[#FCEBFF] border-[#B2EBF2]",
  ];
 
  useEffect(() => {
    const q = query(collection(db, "foster_applications"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApps(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
 
  const handleReject = async (id: string) => {
    await updateDoc(doc(db, "foster_applications", id), { status: "rejected" });
  };
 
  return (
    <main className={`min-h-screen bg-[#F5F5EC] p-10 ${breeSerif.className} font-normal`}>
      <header className="mb-12">
        <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em]">Shelter Portal</span>
        <h1 className={`${irishGrover.className} text-5xl text-[#1E1E1E] mt-3`}>Incoming Applications</h1>
      </header>
 
      {loading ? (
        <p className="animate-pulse text-gray-400 text-lg">Loading applications...</p>
      ) : (
        <div className="grid gap-8">
          {apps.map((app: any, index: number) => {
            const bgColorClass = cardColors[index % cardColors.length];
            return (
              <div key={app.id} className={`${bgColorClass} rounded-[2.5rem] p-8 border-2 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 transition-transform hover:scale-[1.01]`}>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center text-2xl text-[#1B4D6B]">
                    {app.fullName ? app.fullName[0] : "?"}
                  </div>
                  <div>
                    <h3 className="text-[20px] text-[#1E1E1E] leading-tight mb-1">{app.fullName || "Anonymous"}</h3>
                    <p className="text-[14px] text-gray-400 uppercase tracking-widest">
                      Applied for: <span className="text-[#E22726]">{app.petName}</span>
                    </p>
                  </div>
                </div>
 
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6 text-[15px] text-gray-600 font-bold uppercase tracking-tight">
                  <p>🏠 {app.residence}</p>
                  <p>🐾 Exp: {app.experience}</p>
                  <p>⌛ Status: <span className={`${app.status === "approved" ? "text-emerald-600" : app.status === "rejected" ? "text-red-500" : "text-orange-400"}`}>{app.status}</span></p>
                </div>
 
                <div className="flex gap-4">
                  {app.status === "pending" && (
                    <>
                      <button onClick={() => handleReject(app.id)} className="px-8 py-4 bg-white/50 text-red-600 border border-red-200 rounded-2xl text-[12px] tracking-widest hover:bg-red-600 hover:text-white transition-all uppercase font-bold">Reject</button>
                      <button onClick={() => setSelectedApp(app)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[12px] tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all uppercase font-bold">Approve & Setup</button>
                    </>
                  )}
                  {app.status === "approved" && (
                    <span className="text-emerald-600 text-[13px] tracking-widest border border-emerald-200 bg-emerald-50 px-6 py-3 rounded-2xl uppercase font-bold">✓ Approved</span>
                  )}
                  {app.status === "rejected" && (
                    <span className="text-red-500 text-[13px] tracking-widest border border-red-200 bg-red-50 px-6 py-3 rounded-2xl uppercase font-bold">✕ Rejected</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
 
      {selectedApp && (
        <SetupFosterModal application={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </main>
  );
}