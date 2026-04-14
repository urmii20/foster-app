"use client";
import { Irish_Grover, Bree_Serif } from "next/font/google";
import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot, doc, updateDoc, limit, orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

interface Task {
  id: string;
  time?: string;
  title: string;
  isCompleted: boolean;
  date: string;
}

// Returns how many consecutive days ending today had ≥1 completed task
function calcStreak(allTasks: Task[]): number {
  const completedDates = new Set(
    allTasks.filter((t) => t.isCompleted).map((t) => t.date)
  );
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
  const [fosterData, setFosterData] = useState<any>(null);
  const [showTasks, setShowTasks] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renewalRequested, setRenewalRequested] = useState(false);
  const [requestingRenewal, setRequestingRenewal] = useState(false);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthResolved(true);
    });
    return () => unsub();
  }, []);

  // Foster data
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
      console.error(err);
      setError("Lost connection. Data may be stale.");
      setIsLoading(false);
    });
    return () => unsub();
  }, [authResolved, uid]);

  // All tasks (for streak)
  useEffect(() => {
    if (!fosterData?.id) { setTodaysTasks([]); setAllTasks([]); return; }
    const todayStr = new Date().toISOString().split("T")[0];
    const unsub = onSnapshot(collection(db, `fosters/${fosterData.id}/tasks`), (snap) => {
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
      setAllTasks(tasks);
      setTodaysTasks(tasks.filter((t) => t.date === todayStr));
    });
    return () => unsub();
  }, [fosterData?.id]);

  const toggleTask = async (task: Task) => {
    if (!fosterData) return;
    try {
      await updateDoc(doc(db, `fosters/${fosterData.id}/tasks`, task.id), {
        isCompleted: !task.isCompleted,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const requestRenewal = async () => {
    if (!fosterData || requestingRenewal) return;
    setRequestingRenewal(true);
    try {
      await updateDoc(doc(db, "fosters", fosterData.id), { renewalRequested: true });
      setRenewalRequested(true);
    } catch (err) {
      console.error(err);
    }
    setRequestingRenewal(false);
  };

  // ── Calendar helpers ──────────────────────────────────────────────────
  const getCalendarData = () => {
    if (!fosterData?.startDate) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth(), daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() };
    }
    const start = new Date(fosterData.startDate);
    return {
      year: start.getFullYear(),
      month: start.getMonth(),
      daysInMonth: new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate(),
    };
  };

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const cal = getCalendarData();
  const todayStr = new Date().toISOString().split("T")[0];
  const startDate = fosterData?.startDate ? new Date(fosterData.startDate) : null;
  const streak = calcStreak(allTasks);

  // Days remaining calculation
  const daysRemaining = (() => {
    if (!fosterData?.endDate) return null;
    const end = new Date(fosterData.endDate);
    return Math.ceil((end.getTime() - Date.now()) / 86400000);
  })();
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;

  // Task completeness today
  const completedToday = todaysTasks.filter((t) => t.isCompleted).length;
  const allDoneToday = todaysTasks.length > 0 && completedToday === todaysTasks.length;

  // ── Loading ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className={`min-h-screen bg-[#F5F5EC] flex items-center justify-center ${breeSerif.className}`}>
        <p className="text-gray-400 text-lg font-bold uppercase tracking-widest animate-pulse">Loading your calendar…</p>
      </main>
    );
  }

  // ── No active foster ──────────────────────────────────────────────────
  if (!fosterData) {
    return (
      <main className={`min-h-screen bg-[#F5F5EC] flex flex-col items-center justify-center p-10 ${breeSerif.className}`}>
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-4xl mb-8 mx-auto">⏳</div>
          <h2 className={`${irishGrover.className} text-4xl text-[#1E1E1E] mb-4`}>Pending Approval</h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            {uid
              ? "Your foster application is being reviewed. Once approved, your calendar and tasks will appear here."
              : "Please log in to view your foster calendar."}
          </p>
          <a href="/dashboard" className="mt-8 inline-block border-2 border-[#E22726] text-[#E22726] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#E22726] hover:text-white transition-all">
            Browse Pets →
          </a>
        </div>
      </main>
    );
  }

  // ── Full calendar view ────────────────────────────────────────────────
  return (
    <main className={`min-h-screen bg-[#F5F5EC] flex flex-col items-center justify-center p-6 ${breeSerif.className}`}>
      <div className="w-full max-w-xl space-y-5">

        {/* ── Expiry warning / renewal ──────────────────────────── */}
        {isExpiringSoon && (
          <div className={`rounded-[1.5rem] p-5 border-2 flex items-center justify-between gap-4 ${renewalRequested ? "bg-green-50 border-green-200" : "bg-[#FFF3E3] border-[#FFE0B2]"}`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${renewalRequested ? "text-green-600" : "text-orange-500"}`}>
                {renewalRequested ? "Renewal Requested" : `Foster Ending in ${daysRemaining} Day${daysRemaining !== 1 ? "s" : ""}`}
              </p>
              <p className="text-sm text-[#444]">
                {renewalRequested
                  ? "The shelter has been notified. They'll confirm the extension."
                  : `Your foster period for ${fosterData.petName} ends soon.`}
              </p>
            </div>
            {!renewalRequested && (
              <button onClick={requestRenewal} disabled={requestingRenewal}
                className="flex-shrink-0 px-5 py-2.5 bg-[#1E1E1E] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#E22726] transition disabled:opacity-50">
                {requestingRenewal ? "Sending…" : "Request Renewal"}
              </button>
            )}
          </div>
        )}

        {/* ── Header card ──────────────────────────────────────────── */}
        <div className="bg-[#1E1E1E] text-white rounded-[2.5rem] p-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#E22726] text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Currently Fostering</p>
              <h2 className={`${irishGrover.className} text-4xl`}>{fosterData.petName}</h2>
              <p className="text-gray-400 text-sm mt-1">Day {fosterData.currentDay} of {fosterData.durationDays || "?"}</p>
            </div>
            {/* ── Streak badge ──── */}
            <div className="text-center">
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${streak > 0 ? "bg-[#E22726]" : "bg-white/10"}`}>
                <span className="text-2xl leading-none">{streak > 0 ? "🔥" : "💤"}</span>
                <span className={`${irishGrover.className} text-xl leading-none`}>{streak}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                Day streak
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {fosterData.durationDays && (
            <div className="mt-5">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#E22726] rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((fosterData.currentDay / fosterData.durationDays) * 100))}%` }} />
              </div>
              <p className="text-gray-500 text-[10px] mt-1 text-right">
                {Math.min(100, Math.round((fosterData.currentDay / fosterData.durationDays) * 100))}% complete
              </p>
            </div>
          )}
        </div>

        {/* ── Today's task summary ─────────────────────────────────── */}
        {todaysTasks.length > 0 && (
          <div className={`rounded-[2rem] p-5 border-2 flex items-center justify-between ${allDoneToday ? "bg-green-50 border-green-200" : "bg-white border-[#D9D9D9]"}`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${allDoneToday ? "text-green-600" : "text-[#E22726]"}`}>Today's Progress</p>
              <p className="text-sm font-bold text-[#1E1E1E]">{completedToday} / {todaysTasks.length} tasks done {allDoneToday && "🎉"}</p>
            </div>
            <div className="flex gap-1">
              {todaysTasks.map((t) => (
                <div key={t.id} className={`w-3 h-3 rounded-full ${t.isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>
        )}

        {/* ── Calendar ────────────────────────────────────────────── */}
        <div className="bg-white rounded-[2.5rem] p-8 border-2 border-[#D9D9D9] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className={`${irishGrover.className} text-3xl`}>{MONTH_NAMES[cal.month]} {cal.year}</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#999]">
              {startDate ? `Started ${startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : ""}
            </span>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 text-center mb-3">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
              <div key={d} className="text-[10px] font-bold uppercase tracking-widest text-[#999]">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {/* Leading empty cells */}
            {Array.from({ length: new Date(cal.year, cal.month, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: cal.daysInMonth }, (_, i) => i + 1).map((dayNum) => {
              const dateStr = `${cal.year}-${String(cal.month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const isStartDay = startDate && dateStr === fosterData.startDate;
              // Check if this day had all tasks completed
              const dayTasks = allTasks.filter((t) => t.date === dateStr);
              const dayDone = dayTasks.length > 0 && dayTasks.every((t) => t.isCompleted);
              return (
                <div key={dayNum}
                  className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all cursor-default
                    ${isToday ? "bg-[#E22726] text-white shadow-lg" :
                      isStartDay ? "bg-[#35D0E6] text-white" :
                      dayDone ? "bg-green-100 text-green-700 ring-2 ring-green-300" :
                      "hover:bg-gray-100 text-gray-600"}`}>
                  {dayNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Today's Tasks Button ────────────────────────────────── */}
        <button onClick={() => setShowTasks(true)}
          className="w-full py-5 bg-[#E22726] text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-[#b31d1d] transition-all shadow-xl">
          Today — {todaysTasks.length} Task{todaysTasks.length !== 1 ? "s" : ""}
        </button>
      </div>

      {/* ── Task modal ───────────────────────────────────────────── */}
      {showTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowTasks(false)}>
          <div className="bg-[#F5F5EC] rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className={`${irishGrover.className} text-2xl`}>Today's Tasks</h3>
                {streak > 0 && (
                  <p className="text-[10px] text-[#E22726] font-bold uppercase tracking-widest mt-0.5">
                    🔥 {streak}-day streak — keep it up!
                  </p>
                )}
              </div>
              <button onClick={() => setShowTasks(false)}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black">✕</button>
            </div>

            {todaysTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No tasks for today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <div key={task.id} onClick={() => toggleTask(task)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${task.isCompleted ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-gray-300"}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.isCompleted ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}>
                      {task.isCompleted && <span className="text-xs">✓</span>}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm uppercase tracking-widest ${task.isCompleted ? "line-through text-gray-400" : "text-[#1E1E1E]"}`}>{task.title}</p>
                      {task.time && <p className="text-xs text-gray-400 mt-0.5">{task.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allDoneToday && (
              <div className="mt-5 p-4 bg-green-50 rounded-2xl border border-green-200 text-center">
                <p className="text-green-600 font-bold text-sm uppercase tracking-widest">All done for today! 🎉</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-300 text-red-800 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest">
          {error}
        </div>
      )}
    </main>
  );
}