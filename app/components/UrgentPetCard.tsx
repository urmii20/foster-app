import { Bree_Serif } from "next/font/google";
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

function formatAge(age: string | number): string {
  if (!age && age !== 0) return "";
  const num = parseFloat(String(age));
  if (isNaN(num)) return String(age); // already text like "2 years"
  if (num < 1) {
    const months = Math.round(num * 12);
    return months <= 1 ? "1 month old" : `${months} months old`;
  }
  return num === 1 ? "1 year old" : `${num} years old`;
}

export default function UrgentPetCard({ name, location, time, image }) {
  return (
    <div className="min-w-[280px] w-[280px] shrink-0 flex flex-col rounded-[2rem] overflow-hidden bg-white border-2 border-[#D9D9D9] snap-start">
      <div className="relative h-[220px] w-full bg-gray-200">
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <div className="absolute bottom-3 right-3 bg-[#E22726] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border-2 border-white shadow-sm">
          Urgent
        </div>
      </div>
      
      <div className="flex flex-col gap-2 p-5 border-t-2 border-[#D9D9D9]">
        <h3 className={`text-2xl uppercase ${breeSerif.className} text-[#1E1E1E]`}>
          {name}
        </h3>
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#1E1E1E]">
          <svg className="w-3 h-3 text-[#E22726]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>{location}</span>
          <span className="text-[#E22726] text-[8px]">▼</span>
          <span>{formatAge(time)}</span>
        </div>
      </div>
    </div>
  );
}