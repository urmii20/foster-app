import { Bree_Serif } from "next/font/google";
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

export default function ZoomedOutPetCard({ name, age, breed, image }) {
  return (
    <div className="w-[260px] flex flex-col rounded-3xl overflow-hidden border-2 border-[#D9D9D9] bg-[#F5F5EC]">
      <div className="h-[260px] w-full bg-[#35D0E6]">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      
      <div className="flex flex-col gap-1 p-6 border-t-2 border-[#D9D9D9]">
        <h3 className={`text-2xl uppercase ${breeSerif.className} text-[#1E1E1E]`}>
          {name}
        </h3>
        <p className="text-sm font-semibold tracking-wider uppercase text-[#1E1E1E]">
          {age}
        </p>
        <p className="text-sm font-semibold tracking-wider uppercase text-[#1E1E1E]">
          {breed}
        </p>
      </div>
    </div>
  );
}