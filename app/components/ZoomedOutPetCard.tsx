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

export default function ZoomedOutPetCard({ name, age, breed, image }: {
  name: string; age: string; breed: string; image: string;
}) {
  return (
    <div className="w-full flex flex-col rounded-3xl overflow-hidden border-2 border-[#D9D9D9] bg-white">
      <div className="w-full aspect-square overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col gap-1 p-5 border-t-2 border-[#D9D9D9]">
        <h3 className={`text-xl uppercase ${breeSerif.className} text-[#1E1E1E]`}>{name}</h3>
        <p className="text-xs font-semibold tracking-wider uppercase text-[#1E1E1E]">{formatAge(age)}</p>
        <p className="text-xs font-semibold tracking-wider uppercase text-[#1E1E1E]">{breed}</p>
      </div>
    </div>
  );
}