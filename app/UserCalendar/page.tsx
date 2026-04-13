"use client";
import { Irish_Grover, Bree_Serif } from "next/font/google";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  limit,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

/**
 * FIX LOG
 * ───────
 * H3  — auth.currentUser is null on initial page load because Firebase Auth
 *        is asynchronous. Previously the code ran the Firestore query with
 *        "guest" as the UID, finding no foster data → blank/crash.
 *        FIX: Use onAuthStateChanged to wait for the auth state to resolve
 *        before running the Firestore query.
 *
 * M2  — Calendar month was not derived from the foster's startDate.
 *        FIX: Calendar now displays the month/year from startDate, not the
 *        current month. The "Today" button highlights the correct day.
 *
 * M3  — Tasks were fetched with getDocs (one-time) inside an onSnapshot.
 *        FIX: Tasks subcollection now uses its own onSnapshot listener so
 *        task completion persists and updates in real-time.
 *
 * NEW — Pending Approval screen for users with no active foster (Test 6.4).
 *
 * NEW — Error callback on all onSnapshot listeners (Test 9.1).
 */

interface Task {
  id: string;
  time?: string;
  title: string;
  isCompleted: boolean;
  date: string;
}

export default function UserCalendar() {
  const [fosterData, setFosterData] = useState<any>(null);
  const [showTasks, setShowTasks] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── FIX H3: Wait for Firebase Auth to resolve ─────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
      setAuthResolved(true);
    });
    return () => unsubAuth();
  }, []);

  // ── Foster data listener (only runs once auth is resolved) ────────────
  useEffect(() => {
    if (!authResolved) return; // wait for auth
    if (!uid) {
      // No user logged in — show pending state
      setIsLoading(false);
      setFosterData(null);
      return;
    }

    const fosterQuery = query(
      collection(db, "fosters"),
      where("userId", "==", uid),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubFoster = onSnapshot(
      fosterQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          const id = docSnap.id;

          const start = new Date(data.startDate);
          const today = new Date();
          const diffTime = today.getTime() - start.getTime();
          const currentDayCalculated =
            Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

          setFosterData({ id, ...data, currentDay: currentDayCalculated });
        } else {
          setFosterData(null);
        }
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Foster data listener error:", err);
        setError("Lost connection to server. Data may be stale.");
        setIsLoading(false);
      }
    );

    return () => unsubFoster();
  }, [authResolved, uid]);

  // ── FIX M3: Real-time task listener (replaces getDocs) ────────────────
  useEffect(() => {
    if (!fosterData?.id) {
      setTodaysTasks([]);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const unsubTasks = onSnapshot(
      collection(db, `fosters/${fosterData.id}/tasks`),
      (snapshot) => {
        const allTasks = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Task)
        );
        // Filter for today — task dates are stored as YYYY-MM-DD strings
        setTodaysTasks(allTasks.filter((t) => t.date === todayStr));
      },
      (err) => {
        console.error("Tasks listener error:", err);
      }
    );

    return () => unsubTasks();
  }, [fosterData?.id]);

  // ── Toggle task completion ─────────────────────────────────────────────
  const toggleTaskCompletion = async (task: Task) => {
    if (!fosterData) return;
    try {
      await updateDoc(doc(db, `fosters/${fosterData.id}/tasks`, task.id), {
        isCompleted: !task.isCompleted,
      });
      // Real-time listener will update todaysTasks automatically (FIX M3)
    } catch (err) {
      console.error("Error toggling task:", err);
      alert("Failed to update task. Please try again.");
    }
  };

  // ── FIX M2: Derive calendar month from foster startDate ───────────────
  const getCalendarData = () => {
    if (!fosterData?.startDate) {
      // Fallback to current month if no foster
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
      };
    }
    const start = new Date(fosterData.startDate);
    return {
      year: start.getFullYear(),
      month: start.getMonth(),
      daysInMonth: new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0
      ).getDate(),
    };
  };

  const calendarData = getCalendarData();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const startDate = fosterData?.startDate ? new Date(fosterData.startDate) : null;

  // ── LOADING STATE ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className={`min-h-screen bg-[#F5F5EC] flex items-center justify-center ${breeSerif.className}`}>
        <p className="text-gray-400 text-lg font-bold uppercase tracking-widest animate-pulse">
          Loading your calendar...
        </p>
      </main>
    );
  }

  // ── FIX Test 6.4: Pending/No-Foster screen ────────────────────────────
  if (!fosterData) {
    return (
      <main className={`min-h-screen bg-[#F5F5EC] flex flex-col items-center justify-center p-10 ${breeSerif.className}`}>
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-4xl mb-8 mx-auto">
            ⏳
          </div>
          <h2 className={`${irishGrover.className} text-4xl text-[#1E1E1E] mb-4`}>
            Pending Approval
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            {uid
              ? "Your foster application is being reviewed by the shelter. Once approved, your calendar and tasks will appear here."
              : "Please log in to view your foster calendar."}
          </p>
        </div>
      </main>
    );
  }

  // ── MAIN CALENDAR VIEW ────────────────────────────────────────────────
  return (
    <main className={`min-h-screen bg-[#F5F5EC] text-[#1E1E1E] p-10 ${breeSerif.className}`}>
      {/* Error banner (Test 9.1) */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-2xl text-sm font-bold uppercase tracking-widest text-center">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em] font-bold">
          Your Foster Journey
        </span>
        <h1 className={`${irishGrover.className} text-5xl mt-2`}>
          Day {fosterData.currentDay} with {fosterData.petName || "Your Pet"}
        </h1>
      </div>

      {/* Calendar Grid — FIX M2: month derived from startDate */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-200 shadow-sm mb-8">
        <h3 className={`${irishGrover.className} text-2xl mb-6`}>
          {monthNames[calendarData.month]} {calendarData.year}
        </h3>

        <div className="grid grid-cols-7 gap-2 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pb-2">
              {day}
            </div>
          ))}

          {/* Offset for the first day of the month */}
          {Array.from({
            length: new Date(calendarData.year, calendarData.month, 1).getDay(),
          }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Days of the month */}
          {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const isStartDay =
              startDate &&
              dayNum === startDate.getDate() &&
              calendarData.month === startDate.getMonth() &&
              calendarData.year === startDate.getFullYear();

            return (
              <div
                key={dayNum}
                className={`py-3 rounded-2xl text-sm font-bold transition-all ${
                  isToday
                    ? "bg-[#E22726] text-white shadow-lg"
                    : isStartDay
                    ? "bg-[#35D0E6] text-white"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Tasks Button */}
      <button
        onClick={() => setShowTasks(true)}
        className="w-full py-5 bg-[#E22726] text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-[#b31d1d] transition-all shadow-xl"
      >
        Today — {todaysTasks.length} Task{todaysTasks.length !== 1 ? "s" : ""}
      </button>

      {/* Task Modal */}
      {showTasks && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowTasks(false)}
        >
          <div
            className="bg-[#F5F5EC] rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`${irishGrover.className} text-2xl`}>Today&apos;s Tasks</h3>
              <button
                onClick={() => setShowTasks(false)}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black"
              >
                ✕
              </button>
            </div>

            {todaysTasks.length === 0 ? (
              <p className="text-gray-400 text-center py-8 font-bold uppercase tracking-widest text-sm">
                No tasks for today.
              </p>
            ) : (
              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskCompletion(task)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                      task.isCompleted
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        task.isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {task.isCompleted && <span className="text-xs">✓</span>}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-bold text-sm uppercase tracking-widest ${
                          task.isCompleted
                            ? "line-through text-gray-400"
                            : "text-[#1E1E1E]"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.time && (
                        <p className="text-xs text-gray-400 mt-1">{task.time}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}