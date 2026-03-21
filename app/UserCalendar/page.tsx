"use client";
import { Irish_Grover, Bree_Serif } from "next/font/google";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, limit } from "firebase/firestore";
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

export default function UserCalendar() {
  const [fosterData, setFosterData] = useState<any>(null);
  const [showTasks, setShowTasks] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Real-time Foster Data
  useEffect(() => {
    const user = auth.currentUser;
    // Default to a guest view or handle authentication if you want to require login
    const uid = user ? user.uid : "guest"; 

    const fosterQuery = query(
      collection(db, "fosters"),
      where("userId", "==", uid),
      where("status", "==", "active"),
      limit(1)
    );

    const unsubscribe = onSnapshot(fosterQuery, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        const id = snapshot.docs[0].id;

        // Calculate Day X of Y based on shelter's start date
        const start = new Date(docData.startDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - start.getTime());
        const currentDayCalculated = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        setFosterData({ 
          id, 
          ...docData, 
          currentDay: currentDayCalculated 
        });

        // Filter tasks for TODAY'S date string (YYYY-MM-DD)
        const todayStr = today.toISOString().split('T')[0];
        const filtered = (docData.tasks || []).filter((t: any) => t.date === todayStr);
        setTodaysTasks(filtered);
      } else {
        setFosterData(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Update Firebase when user checks off a task
  const toggleTaskCompletion = async (taskIndex: number, currentStatus: boolean) => {
    if (!fosterData) return;
    try {
      const newTasks = [...fosterData.tasks];
      // Find the specific task in the master array and update it
      const taskToUpdate = todaysTasks[taskIndex];
      const masterIndex = newTasks.findIndex(t => t.title === taskToUpdate.title && t.date === taskToUpdate.date);
      
      if(masterIndex !== -1) {
         newTasks[masterIndex].isCompleted = !currentStatus;
         await updateDoc(doc(db, "fosters", fosterData.id), { tasks: newTasks });
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Calendar configuration
  const month = "MAR";
  const year = "2026";
  const daysInMonth = 31;
  const blankStartDays = 3;

  const allCells = [
    ...Array(blankStartDays).fill(""), 
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(35 - blankStartDays - daysInMonth).fill("") 
  ];

  // STATE A: Loading
  if (isLoading) {
    return <div className="min-h-screen bg-[#AFD8FB] flex items-center justify-center font-bold uppercase tracking-widest">Loading Journey...</div>;
  }

  // STATE B: Pending Approval (Hidden Calendar)
  if (!fosterData) {
    return (
      <main className={`min-h-screen bg-[#F5F5EC] flex flex-col items-center justify-center p-10 text-center ${breeSerif.className}`}>
        <div className="w-24 h-24 bg-white rounded-full mb-8 flex items-center justify-center text-4xl shadow-sm border border-gray-200">⏳</div>
        <h1 className={`${irishGrover.className} text-5xl text-[#1E1E1E] mb-4 uppercase`}>Pending Approval</h1>
        <p className="max-w-md text-gray-400 font-bold text-[10px] tracking-[0.2em] uppercase leading-loose">
          Your foster calendar is hidden. Once the shelter sets your dates and tasks, your journey will begin here!
        </p>
      </main>
    );
  }

  // STATE C: Approved (Revealed Calendar)
  return (
    <main className={`min-h-[150vh] bg-[#AFD8FB] w-full relative flex flex-col overflow-x-hidden no-scrollbar ${breeSerif.className}`}>      
      
      <div className="absolute top-[650px] left-1/2 -translate-x-1/2 w-[2000px] h-[2000px] bg-[#8CB8DB] rounded-full z-0"></div>
      
      <div className="bg-[#1A4B6B] text-white w-full pt-10 pb-0 [clip-path:ellipse(65%_100%_at_50%_0%)] relative z-10">
        
        <div className="flex justify-between items-start mb-5 pl-8 pr-0 max-w-7xl mx-auto relative w-full">
          <h1 className={`${irishGrover.className} text-8xl tracking-widest flex items-start gap-3`}>
            {month}
            <span className="text-4xl leading-tight mt-1">{year.substring(0, 2)}<br/>{year.substring(2, 4)}</span>
          </h1>
          
          <div className="absolute left-1/2 -translate-x-1/2 top-5 flex flex-col items-center w-80">
            <div className="text-center border-b-2 border-white pb-2 w-full">
              <span className="text-sm tracking-[0.2em] uppercase">Day {fosterData.currentDay} with {fosterData.petName}</span>
            </div>
            <span className="text-[10px] tracking-[0.15em] text-white/70 uppercase mt-2 font-bold">
              Start: {fosterData.startDate}
            </span>
          </div>

          <button 
            onClick={() => setShowTasks(true)}
            className="bg-[#E22726] text-white text-xs px-6 py-3 font-bold tracking-widest uppercase mt-4 rounded-l-lg hover:bg-red-700 transition-transform active:scale-95 shadow-lg flex items-center gap-2"
          >
            Today - {todaysTasks.length} Tasks
          </button>
        </div>

        <div className="w-full border-t border-white/20">
          <div className="grid grid-cols-7 text-center text-[13px] tracking-[0.1em] border-b border-white/35">
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day, i) => (
              <div key={day} className={`py-3 ${i !== 6 ? 'border-r border-white/35' : ''}`}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 text-xl font-bold">
            {allCells.map((val, index) => {
              const isLastRow = index >= 28; 
              const isLastCol = index % 7 === 6; 
              return (
                <div key={index} className={`p-4 text-right hover:bg-white/10 transition-colors cursor-pointer ${!isLastCol ? 'border-r border-white/35' : ''} ${isLastRow ? 'h-[350px] border-b-0' : 'h-[110px] border-b border-white/35'}`}>
                  {val}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-[13px] w-full flex justify-center pointer-events-none overflow-visible">
        <img src="/dog-front.png" alt="Dog front" className="w-[60vw] max-w-[900px] object-contain object-top translate-x-[35%]" />
      </div>

      <div className="relative z-20 flex flex-col items-center mt-60 pb-96 w-full">
        <h2 className={`${irishGrover.className} text-white text-5xl mb-12 tracking-wide drop-shadow-md`}>NEED SOMETHING?</h2>
        <div className="flex flex-row justify-center gap-6 w-full px-4">
          {['Message\nShelter', 'Emergency\nHelp', "Pet\nProfile", 'Care &\nMedication'].map((label) => (
            <button key={label} className="bg-[#F5F5EC] text-[#1E1E1E] text-[12px] font-bold uppercase tracking-widest py-8 px-6 rounded-2xl shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:bg-white transition-all text-center leading-relaxed whitespace-pre-line w-44 border border-[#E5E5E5]">
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 left-[-2%] z-0 pointer-events-none w-[28vw] max-w-[350px]">
        <img src="/dog-back.png" alt="Dog tail" className="w-full h-auto object-bottom object-left opacity-90" />
      </div>

      {/* --- TASK MODAL OVERLAY --- */}
      {showTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A4B6B]/60 backdrop-blur-sm px-4">
          <div className="bg-[#F5F5EC] rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <button onClick={() => setShowTasks(false)} className="absolute top-6 right-6 text-gray-400 hover:text-[#E22726] font-bold text-xl">✕</button>
            
            <span className="text-[#E22726] text-xs font-bold tracking-[0.2em] uppercase">Day {fosterData.currentDay}</span>
            <h3 className={`${irishGrover.className} text-[#1E1E1E] text-4xl mt-1 mb-6`}>Today's Tasks</h3>
            
            <div className="flex flex-col gap-4">
              {todaysTasks.length === 0 && (
                <p className="text-gray-500 text-center py-4 font-bold uppercase tracking-widest text-xs">No tasks assigned for today! 🎉</p>
              )}
              
              {todaysTasks.map((task, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${task.isCompleted ? 'border-[#0F9D58] bg-green-50/50' : 'border-gray-200 bg-white'}`}>
                  <div>
                    <div className={`font-bold text-lg ${task.isCompleted ? 'text-gray-400 line-through' : 'text-[#1E1E1E] uppercase'}`}>{task.title}</div>
                    <div className="text-xs text-gray-500 font-sans mt-1 uppercase tracking-widest">{task.date}</div>
                  </div>
                  {/* Clickable Checkbox that updates Firebase */}
                  <div 
                    onClick={() => toggleTaskCompletion(index, task.isCompleted)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${task.isCompleted ? 'bg-[#0F9D58] border-[#0F9D58]' : 'border-gray-300 hover:border-[#0F9D58]'}`}
                  >
                    {task.isCompleted && <span className="text-white font-bold text-sm">✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowTasks(false)} className="w-full mt-8 bg-[#E22726] text-white font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-red-700 transition-colors shadow-md">
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