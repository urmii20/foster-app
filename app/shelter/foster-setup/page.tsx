"use client";
import { Irish_Grover, Bree_Serif } from "next/font/google";
import { useState } from "react";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

type Task = { id: string; day: number; time: string; title: string; type: 'one-off' | 'daily' };

export default function ShelterCalendarSetup() {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', day: 1, time: '08:00 AM', title: 'Give Ear Drops', type: 'daily' },
    { id: '2', day: 14, time: '04:00 PM', title: 'Checkup at Arc', type: 'one-off' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("08:00 AM");
  const [isRecurring, setIsRecurring] = useState(false);

  const daysInMonth = 30;

  const handleAddTask = () => {
    if (!newTaskTitle) return;
    
    // If daily, we would conceptually generate 30 tasks for the backend here. 
    // For UI preview, we'll just add it to the selected day.
    const newTask: Task = {
      id: Date.now().toString(),
      day: selectedDay,
      time: newTaskTime,
      title: newTaskTitle,
      type: isRecurring ? 'daily' : 'one-off'
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const tasksForSelectedDay = tasks.filter(t => t.day === selectedDay || t.type === 'daily');

  return (
    <div className={`min-h-screen bg-[#F5F5EC] flex ${breeSerif.className} text-[#1E1E1E]`}>
      
      {/* Mocked Sidebar from your design */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col p-6 shadow-sm z-10">
        <h1 className={`${irishGrover.className} text-2xl text-[#E22726] leading-tight mb-10`}>
          ARC ANIMAL<br/><span className="text-[#1E1E1E]">SHELTER</span>
        </h1>
        <div className="flex flex-col gap-4 text-lg font-bold text-gray-600">
          <div className="p-3 cursor-pointer">Dashboard</div>
          <div className="p-3 bg-[#E22726] text-white rounded-xl shadow-md cursor-pointer">Active Fosters</div>
          <div className="p-3 cursor-pointer">Add New Pet</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 flex flex-col h-screen overflow-hidden">
        <div className="mb-8">
          <span className="text-[#E22726] text-sm font-bold tracking-[0.2em] uppercase">Foster Setup</span>
          <h2 className={`${irishGrover.className} text-5xl mt-2`}>Jonnie's Calendar</h2>
          <p className="text-gray-500 mt-2 font-bold">Foster: Urmi Hrishikesh Hindlekar (30 Days)</p>
        </div>

        <div className="flex gap-8 flex-1 overflow-hidden">
          
          {/* Left: 30-Day Grid */}
          <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-200 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-7 gap-3">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                <div key={d} className="text-center text-xs font-bold text-gray-400 tracking-wider mb-2">{d}</div>
              ))}
              
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayTasks = tasks.filter(t => t.day === day || t.type === 'daily');
                return (
                  <div 
                    key={day} 
                    onClick={() => setSelectedDay(day)}
                    className={`h-24 rounded-2xl p-2 border-2 cursor-pointer transition-all flex flex-col justify-between
                      ${selectedDay === day ? 'border-[#E22726] bg-red-50' : 'border-gray-100 hover:border-gray-300'}
                    `}
                  >
                    <span className={`font-bold ${selectedDay === day ? 'text-[#E22726]' : 'text-gray-700'}`}>{day}</span>
                    {dayTasks.length > 0 && (
                      <div className="bg-[#0F9D58] text-white text-[10px] px-2 py-1 rounded-md font-bold text-center">
                        {dayTasks.length} Task{dayTasks.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Task Editor Panel */}
          <div className="w-[400px] bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col">
            <h3 className={`${irishGrover.className} text-3xl mb-6`}>Day {selectedDay} Tasks</h3>
            
            {/* Task List */}
            <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-3 pr-2">
              {tasksForSelectedDay.length === 0 ? (
                <p className="text-gray-400 text-center mt-10">No tasks for this day.</p>
              ) : (
                tasksForSelectedDay.map(task => (
                  <div key={task.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center group">
                    <div>
                      <div className="font-bold text-[#1E1E1E] text-lg">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.time} • {task.type === 'daily' ? 'Repeats Daily' : 'One-off'}</div>
                    </div>
                    <button onClick={() => handleDeleteTask(task.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xl px-2">
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Task Form */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Add New Task</h4>
              <input 
                type="text" 
                placeholder="Task Title (e.g. Morning Walk)" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 mb-3 font-sans"
              />
              <div className="flex gap-3 mb-4">
                <input 
                  type="time" 
                  value="08:00"
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="w-1/2 p-3 rounded-xl border border-gray-300 font-sans"
                />
                <button 
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-1/2 p-3 rounded-xl border font-bold text-sm transition-colors ${isRecurring ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                >
                  {isRecurring ? '🔄 Daily' : '📌 One-off'}
                </button>
              </div>
              <button 
                onClick={handleAddTask}
                className="w-full bg-[#0F9D58] hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors tracking-wider"
              >
                SAVE TASK
              </button>
            </div>
          </div>

        </div>
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}