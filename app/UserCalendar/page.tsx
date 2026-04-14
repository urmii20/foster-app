"use client";
import { Irish_Grover, Bree_Serif } from "next/font/google";
import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, limit, orderBy, setDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

const MONTH_NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

interface Task {
  id: string;
  time?: string;
  title: string;
  isCompleted: boolean;
  date: string;
}

/** Count consecutive days ending today where ≥1 task was completed */
function calcStreak(tasks: Task[]): number {
  const completedDates = new Set(tasks.filter(t => t.isCompleted).map(t => t.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (!completedDates.has(dateStr)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function UserCalendar() {
  const [fosterData, setFosterData]         = useState<any>(null);
  const [showTasks, setShowTasks]           = useState(false);
  const [todaysTasks, setTodaysTasks]       = useState<Task[]>([]);
  const [allTasks, setAllTasks]             = useState<Task[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [uid, setUid]                       = useState<string | null>(null);
  const [authResolved, setAuthResolved]     = useState(false);
  const [renewalRequested, setRenewalRequested] = useState(false);
  const [requestingRenewal, setRequestingRenewal] = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  // ── Fix: wait for Firebase Auth to resolve before querying ─────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthResolved(true);
    });
    return () => unsub();
  }, []);

  // ── Foster data (real-time) ─────────────────────────────────────────
  useEffect(() => {
    if (!authResolved) return;
    if (!uid) { setIsLoading(false); setFosterData(null); return; }

    const q = query(
      collection(db, "fosters"),
      where("userId", "==", uid),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        const start = new Date(data.startDate);
        const elapsed = Math.ceil((Date.now() - start.getTime()) / 86400000) || 1;
        setFosterData({ id: d.id, ...data, currentDay: elapsed });
        setRenewalRequested(data.renewalRequested || false);
      } else {
        setFosterData(null);
      }
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error("Foster listener:", err);
      setError("Connection lost. Data may be stale.");
      setIsLoading(false);
    });
    return () => unsub();
  }, [authResolved, uid]);

  // ── Tasks (real-time) ───────────────────────────────────────────────
  useEffect(() => {
    if (!fosterData?.id) { setTodaysTasks([]); setAllTasks([]); return; }

    const todayStr = new Date().toISOString().split("T")[0];

    const unsub = onSnapshot(
      collection(db, `fosters/${fosterData.id}/tasks`),
      (snap) => {
        const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
        setAllTasks(tasks);
        setTodaysTasks(tasks.filter(t => t.date === todayStr));
      },
      (err) => console.error("Tasks listener:", err)
    );
    return () => unsub();
  }, [fosterData?.id]);

  const toggleTaskCompletion = async (task: Task) => {
    if (!fosterData) return;
    try {
      await updateDoc(doc(db, `fosters/${fosterData.id}/tasks`, task.id), {
        isCompleted: !task.isCompleted,
      });
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const requestRenewal = async () => {
    if (!fosterData || requestingRenewal) return;
    setRequestingRenewal(true);
    try {
      await updateDoc(doc(db, "fosters", fosterData.id), { renewalRequested: true });
      setRenewalRequested(true);
    } catch (err) { console.error(err); }
    setRequestingRenewal(false);
  };

  // ── Calendar grid helpers ───────────────────────────────────────────
  const getCalendarInfo = () => {
    const ref = fosterData?.startDate ? new Date(fosterData.startDate) : new Date();
    const y = ref.getFullYear();
    const m = ref.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    // Monday-first blank count: getDay() 0=Sun→6 blanks, 1=Mon→0, …
    const blank = (new Date(y, m, 1).getDay() + 6) % 7;
    return {
      monthStr: MONTH_NAMES[m],
      yearStr: String(y),
      daysInMonth,
      blankStartDays: blank,
    };
  };

  // ── Derived values ──────────────────────────────────────────────────
  const streak = calcStreak(allTasks);
  const todayStr = new Date().toISOString().split("T")[0];
  const completedToday = todaysTasks.filter(t => t.isCompleted).length;
  const allDoneToday = todaysTasks.length > 0 && completedToday === todaysTasks.length;

  const daysRemaining = fosterData?.endDate
    ? Math.ceil((new Date(fosterData.endDate).getTime() - Date.now()) / 86400000)
    : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;

  // ── Loading ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-[#AFD8FB] flex items-center justify-center font-bold uppercase tracking-widest ${breeSerif.className}`}>
        Loading Journey...
      </div>
    );
  }

  // ── No active foster ────────────────────────────────────────────────
  if (!fosterData) {
    return (
      <main className={`min-h-screen bg-[#F5F5EC] flex flex-col items-center justify-center p-10 text-center ${breeSerif.className}`}>
        <div className="w-24 h-24 bg-white rounded-full mb-8 flex items-center justify-center text-4xl shadow-sm border border-gray-200">⏳</div>
        <h1 className={`${irishGrover.className} text-5xl text-[#1E1E1E] mb-4 uppercase`}>Pending Approval</h1>
        <p className="max-w-md text-gray-400 font-bold text-[10px] tracking-[0.2em] uppercase leading-loose">
          Your foster calendar is hidden. Once the shelter sets your dates and tasks, your journey will begin here!
        </p>
        <a href="/dashboard" className="mt-8 inline-block border-2 border-[#E22726] text-[#E22726] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#E22726] hover:text-white transition-all">
          Browse Pets →
        </a>
      </main>
    );
  }

  const { monthStr, yearStr, daysInMonth, blankStartDays } = getCalendarInfo();
  const totalCells = Math.ceil((blankStartDays + daysInMonth) / 7) * 7;
  const allCells = [
    ...Array(blankStartDays).fill(""),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - blankStartDays - daysInMonth).fill(""),
  ];

  return (
    <main className={`min-h-[150vh] bg-[#AFD8FB] w-full relative flex flex-col overflow-x-hidden no-scrollbar ${breeSerif.className}`}>

      {/* ── Decorative background circle ─────────────────────────── */}
      <div className="absolute top-[650px] left-1/2 -translate-x-1/2 w-[2000px] h-[2000px] bg-[#8CB8DB] rounded-full z-0" />

      {/* ── Renewal banner (new — shown only when expiring soon) ──── */}
      {isExpiringSoon && (
        <div className={`relative z-20 mx-auto mt-4 w-full max-w-3xl px-4`}>
          <div className={`rounded-2xl px-6 py-4 flex items-center justify-between gap-4 shadow-md ${renewalRequested ? "bg-green-100 border-2 border-green-300" : "bg-[#FFF3E3] border-2 border-[#FFE0B2]"}`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${renewalRequested ? "text-green-600" : "text-orange-500"}`}>
                {renewalRequested ? "Renewal Requested ✓" : `Foster Ending in ${daysRemaining} Day${daysRemaining !== 1 ? "s" : ""}`}
              </p>
              <p className="text-sm text-[#444] mt-0.5">
                {renewalRequested
                  ? "The shelter has been notified and will confirm the extension."
                  : `Your foster period for ${fosterData.petName} ends very soon.`}
              </p>
            </div>
            {!renewalRequested && (
              <button
                onClick={requestRenewal}
                disabled={requestingRenewal}
                className="flex-shrink-0 px-5 py-2.5 bg-[#1A4B6B] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#E22726] transition disabled:opacity-50"
              >
                {requestingRenewal ? "Sending…" : "Request Renewal"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Blue header with clipped ellipse ─────────────────────── */}
      <div className="bg-[#1A4B6B] text-white w-full pt-10 pb-0 [clip-path:ellipse(65%_100%_at_50%_0%)] relative z-10">
        <div className="flex justify-between items-start mb-5 pl-8 pr-0 max-w-7xl mx-auto relative w-full">

          {/* Month + Year — original large display */}
          <h1 className={`${irishGrover.className} text-8xl tracking-widest flex items-start gap-3`}>
            {monthStr}
            <span className="text-4xl leading-tight mt-1">
              {yearStr.substring(0, 2)}<br />{yearStr.substring(2, 4)}
            </span>
          </h1>

          {/* Centre: Day counter + streak badge ─────────────────── */}
          <div className="absolute left-1/2 -translate-x-1/2 top-5 flex flex-col items-center w-80">
            <div className="text-center border-b-2 border-white pb-2 w-full">
              <span className="text-sm tracking-[0.2em] uppercase">
                Day {fosterData.currentDay} with {fosterData.petName}
              </span>
            </div>
            <span className="text-[10px] tracking-[0.15em] text-white/70 uppercase mt-2 font-bold">
              Start: {fosterData.startDate}
            </span>
            {/* Streak badge — subtle addition below start date */}
            {streak > 0 && (
              <div className="mt-2 flex items-center gap-1.5 bg-[#E22726] px-3 py-1 rounded-full">
                <span className="text-sm leading-none">🔥</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                  {streak}-day streak
                </span>
              </div>
            )}
          </div>

          {/* Today's tasks button */}
          <button
            onClick={() => setShowTasks(true)}
            className="bg-[#E22726] text-white text-xs px-6 py-3 font-bold tracking-widest uppercase mt-4 rounded-l-lg hover:bg-red-700 transition-transform active:scale-95 shadow-lg flex items-center gap-2"
          >
            Today — {todaysTasks.length} Task{todaysTasks.length !== 1 ? "s" : ""}
            {allDoneToday && <span>✓</span>}
          </button>
        </div>

        {/* ── Calendar grid ──────────────────────────────────────── */}
        <div className="w-full border-t border-white/20">
          <div className="grid grid-cols-7 text-center text-[13px] tracking-[0.1em] border-b border-white/35">
            {["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((day, i) => (
              <div key={day} className={`py-3 ${i !== 6 ? "border-r border-white/35" : ""}`}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 text-xl font-bold">
            {allCells.map((val, index) => {
              const isLastRow   = index >= totalCells - 7;
              const isLastCol   = index % 7 === 6;
              const row         = Math.floor(index / 7);
              const totalRows   = totalCells / 7;
              const isLastCalRow = row === totalRows - 1;

              // Build dateStr to check if this cell is today or start day
              let isToday = false;
              let isStartDay = false;
              if (val) {
                const { yearStr: y, monthStr: ms } = getCalendarInfo();
                const mIdx = MONTH_NAMES.indexOf(ms);
                const cellDate = `${y}-${String(mIdx + 1).padStart(2, "0")}-${String(val).padStart(2, "0")}`;
                isToday    = cellDate === todayStr;
                isStartDay = cellDate === fosterData.startDate;
              }

              return (
                <div
                  key={index}
                  className={`p-4 text-right transition-colors cursor-pointer relative
                    ${!isLastCol ? "border-r border-white/35" : ""}
                    ${!isLastCalRow ? "border-b border-white/35" : "border-b-0"}
                    ${isLastCalRow ? "h-[350px]" : "h-[110px]"}
                    ${val ? "hover:bg-white/10" : ""}
                  `}
                >
                  {val && (
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                      ${isToday    ? "bg-[#E22726] text-white shadow-lg" :
                        isStartDay ? "bg-[#35D0E6] text-[#1A4B6B]" :
                        ""}
                    `}>
                      {val}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Dog front image ──────────────────────────────────────── */}
      <div className="relative z-10 -mt-[13px] w-full flex justify-center pointer-events-none overflow-visible">
        <img
          src="/dog-front.png"
          alt="Dog front"
          className="w-[60vw] max-w-[900px] object-contain object-top translate-x-[35%]"
        />
      </div>

      {/* ── "NEED SOMETHING?" section ────────────────────────────── */}
      <div className="relative z-20 flex flex-col items-center mt-60 pb-96 w-full">
        <h2 className={`${irishGrover.className} text-white text-5xl mb-12 tracking-wide drop-shadow-md`}>
          NEED SOMETHING?
        </h2>
        <div className="flex flex-row justify-center gap-6 w-full px-4">
          {["Message\nShelter", "Emergency\nHelp", "Pet\nProfile", "Care &\nMedication"].map((label) => (
            <button
              key={label}
              className="bg-[#F5F5EC] text-[#1E1E1E] text-[12px] font-bold uppercase tracking-widest py-8 px-6 rounded-2xl shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:bg-white transition-all text-center leading-relaxed whitespace-pre-line w-44 border border-[#E5E5E5]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dog back/tail image ──────────────────────────────────── */}
      <div className="absolute bottom-10 left-[-2%] z-0 pointer-events-none w-[28vw] max-w-[350px]">
        <img
          src="/dog-back.png"
          alt="Dog tail"
          className="w-full h-auto object-bottom object-left opacity-90"
        />
      </div>

      {/* ── Error toast ──────────────────────────────────────────── */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-300 text-red-800 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest z-50">
          {error}
        </div>
      )}

      {/* ── Task modal ───────────────────────────────────────────── */}
      {showTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A4B6B]/60 backdrop-blur-sm px-4">
          <div className="bg-[#F5F5EC] rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowTasks(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#E22726] font-bold text-xl"
            >✕</button>

            <span className="text-[#E22726] text-xs font-bold tracking-[0.2em] uppercase">
              Day {fosterData.currentDay}
            </span>
            <h3 className={`${irishGrover.className} text-[#1E1E1E] text-4xl mt-1 mb-1`}>
              Today's Tasks
            </h3>
            {/* Streak line inside modal */}
            {streak > 0 && (
              <p className="text-[10px] text-[#E22726] font-bold uppercase tracking-widest mb-5">
                🔥 {streak}-day streak — keep it going!
              </p>
            )}
            {!streak && <div className="mb-5" />}

            <div className="flex flex-col gap-4">
              {todaysTasks.length === 0 && (
                <p className="text-gray-500 text-center py-4 font-bold uppercase tracking-widest text-xs">
                  No tasks assigned for today! 🎉
                </p>
              )}
              {todaysTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    task.isCompleted
                      ? "border-[#0F9D58] bg-green-50/50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div>
                    <div className={`font-bold text-lg ${task.isCompleted ? "text-gray-400 line-through" : "text-[#1E1E1E] uppercase"}`}>
                      {task.title}
                    </div>
                    <div className="text-xs text-gray-500 font-sans mt-1 uppercase tracking-widest">
                      {task.date}
                    </div>
                  </div>
                  <div
                    onClick={() => toggleTaskCompletion(task)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                      task.isCompleted
                        ? "bg-[#0F9D58] border-[#0F9D58]"
                        : "border-gray-300 hover:border-[#0F9D58]"
                    }`}
                  >
                    {task.isCompleted && <span className="text-white font-bold text-sm">✓</span>}
                  </div>
                </div>
              ))}
            </div>

            {allDoneToday && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-2xl text-center">
                <p className="text-green-600 font-bold text-xs uppercase tracking-widest">
                  All done for today! 🎉
                </p>
              </div>
            )}

            <button
              onClick={() => setShowTasks(false)}
              className="w-full mt-6 bg-[#E22726] text-white font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-red-700 transition-colors shadow-md"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}