"use client";
import { useState, useEffect } from "react";
import FosterForm from "./FosterForm";
import { Bree_Serif, Irish_Grover } from "next/font/google";
import ShelterModal from "../components/ShelterModal";

const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });
const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });

const STEPS = [
  { step: "1", title: "APPLY",   desc: "FILL OUT A FORM" },
  { step: "2", title: "REVIEW",  desc: "WE CHECK COMPATIBILITY" },
  { step: "3", title: "MEET",    desc: "VISIT & INTERACT" },
  { step: "4", title: "FOSTER",  desc: "TAKE THEM HOME" },
];

interface PetModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: any;
}

function getSingleStamp(pet: any): string | null {
  const vs = (pet.vetStatus || "").toUpperCase();
  if (vs.includes("SPAYED"))     return "/spayed.png";
  if (vs.includes("NEUTERED"))   return "/neutered.png";
  if (vs.includes("VACCINATED") || pet.isVaccinated) return "/vaccinated.png";
  return null;
}

export default function PetModal({ isOpen, onClose, pet }: PetModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isShelterModalOpen, setIsShelterModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsFlipped(false);
      setIsFormOpen(false);
    }
  }, [isOpen, pet?.id]);

  if (!isOpen || !pet) return null;

  const isFostered = pet.status === "fostered";
  const stampSrc   = getSingleStamp(pet);

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest("button")) return;
    setIsFlipped(!isFlipped);
  };

  const handleFosterClick = () => {
    if (isFostered) return;
    setIsFormOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[960px] h-[540px]"
        style={{ perspective: "1200px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full h-full cursor-pointer transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          onClick={handleCardClick}
        >
          {/* ══════════════════════════ FRONT ══════════════════════════ */}
          <div
            className={`absolute inset-0 bg-[#F5F5EC] rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#D9D9D9] backface-hidden ${breeSerif.className} ${isFlipped ? "pointer-events-none" : ""}`}
          >
            <div className="absolute top-0 left-0 w-[42%] h-[80%] bg-[#35D0E6]">
              <img
                src={pet.image || "/jonnie.png"}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute top-0 left-[42%] right-0 bottom-[80px] pl-12 pr-8 flex flex-col justify-center">
              {!isFlipped && stampSrc && (
                <div className="absolute top-6 right-6 w-28 h-28 z-30 pointer-events-none">
                  <img
                    src={stampSrc}
                    className="w-full h-full object-contain rotate-[12deg]"
                    alt="Vet Status"
                  />
                </div>
              )}

              <h2 className={`text-[64px] uppercase text-[#1E1E1E] leading-none tracking-tight pr-32 ${irishGrover.className}`}>
                {pet.name}
              </h2>
              <div className="flex items-center gap-3 text-[14px] tracking-[0.15em] uppercase mt-5 text-[#1E1E1E]">
                <span>{pet.age}</span>
                <span>🐾</span>
                <span>{pet.breed || "MIXED BREED"}</span>
                <span>🐾</span>
                <span>{pet.gender}</span>
              </div>
              <div className="mt-8">
                <p className="text-[16px] uppercase tracking-wider text-[#1E1E1E]">{pet.headline}</p>
                <p className="mt-2 text-[14px] uppercase tracking-[0.15em] text-[#1E1E1E]/60">{pet.traits}</p>
              </div>
              <div className="mt-8 text-[15px] uppercase tracking-[0.1em] text-[#1E1E1E] leading-relaxed">
                {pet.medical && <p>MEDICAL RECORD: {pet.medical}</p>}
                <p>IDEAL FOSTER DURATION: {pet.duration} days</p>
              </div>
            </div>

            <div className="absolute bottom-0 left-[42%] right-0 h-[80px] pl-12 pr-10 flex gap-4">
              {isFostered ? (
                <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-t-[1.25rem] text-gray-400 text-[12px] uppercase font-bold tracking-widest">
                  Currently In Foster Home
                </div>
              ) : (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFosterClick(); }}
                    className="flex-1 bg-[#FEA8B3]/68 text-[#FFFFFF] rounded-t-[1.25rem] text-[15px] uppercase font-bold tracking-wider hover:bg-[#E2455A]/70 transition"
                  >
                    Foster {pet.name}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); window.location.href = '/about#contact'; }}
                    className="flex-1 bg-[#E22726] text-white rounded-t-[1.25rem] text-[15px] uppercase font-bold tracking-wider hover:bg-[#A91E1E] transition"
                  >
                    Adoption enquiry
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ══════════════════════════ BACK ══════════════════════════ */}
          <div
            className={`absolute inset-0 bg-[#F5F5EC] rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#D9D9D9] backface-hidden flex flex-col justify-between pt-12 ${breeSerif.className}`}
            style={{ transform: "rotateY(180deg)" }}
          >
            {/* Top Section */}
            <div className="flex flex-col items-center gap-3 w-full px-12">
              <div className="flex items-center gap-4">
                <h1 className={`${irishGrover.className} text-[38px] uppercase tracking-wider text-[#1E1E1E]`}>
                  The Arc Animal Project
                </h1>
                <div className="flex items-center gap-1.5 text-2xl">
                  <span className="text-[#FFC107]">★</span>
                  <span className="text-[#FFC107]">★</span>
                  <span className="text-[#FFC107]">★</span>
                  <span className="text-[#FFC107]">★</span>
                  <span className="text-[#D9D9D9]">★</span>
                </div>
              </div>
              <p className="text-[12px] uppercase tracking-[0.2em] leading-relaxed text-[#1E1E1E]/80 text-center max-w-[70%]">
                A Non-Profit Organization Dedicated To Rescuing, Rehabilitating, And Rehoming Animals In Need Since 2014.
              </p>
            </div>

            {/* Grid Section */}
            <div className="w-full px-24 mt-4">
              <div className="border-t border-[#D9D9D9] py-8 flex justify-center gap-24 w-full text-[13px] uppercase tracking-[0.15em] text-[#1E1E1E] font-bold">
                <div className="flex flex-col gap-4 text-left">
                  <p><span className="text-[#E22726] mr-2">📍</span> LOCATION: {pet.location || "MUMBAI"}</p>
                  <p><span className="text-[#1E1E1E]/40 mr-2">🗓</span> DURATION: {pet.duration} days</p>
                </div>
                <div className="flex flex-col gap-4 text-left">
                  <p>SUPPLIES PROVIDED</p>
                  <p>MEDICAL COVERED</p>
                </div>
              </div>
            </div>

            {/* Steps Section */}
            <div className="flex w-full justify-center items-start text-center relative px-20">
              <div className="absolute top-[20px] left-[150px] right-[150px] h-[1px] bg-[#D9D9D9]" />
              <div className="flex justify-between w-full max-w-[550px]">
                {STEPS.map(({ step, title, desc }) => (
                  <div key={step} className="flex flex-col items-center bg-[#F5F5EC] px-4 z-10">
                    <div className="w-10 h-10 rounded-full border-[1.5px] border-[#1E1E1E] flex items-center justify-center mb-3 text-[15px] font-bold bg-[#F5F5EC]">
                      {step}
                    </div>
                    <p className="text-[12px] font-bold uppercase tracking-widest mb-1">{title}</p>
                    <p className="text-[10px] text-[#1E1E1E]/60 uppercase tracking-widest whitespace-nowrap">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 24/7 Text */}
            <p className="text-center text-[11px] uppercase tracking-[0.2em] text-[#1E1E1E]/40 font-bold mt-4 mb-2">
              24/7 Pet Coordination Available For All Fosters
            </p>

            {/* Bottom Buttons */}
            <div className="w-full flex justify-center gap-8 px-20 mt-auto">
              <button className="w-[260px] h-[75px] bg-[#FFC0CB] text-white rounded-t-[1.5rem] text-[13px] font-bold uppercase tracking-widest hover:bg-[#FFB6C1] transition shadow-md">
                REQUIREMENTS
              </button>
              <button className="w-[260px] h-[75px] bg-[#E22726] text-white rounded-t-[1.5rem] text-[13px] font-bold uppercase tracking-widest hover:bg-[#CC233B] transition shadow-md">
                CONTACT US
              </button>
            </div>
          </div>
        </div>
      </div>

      <FosterForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} pet={pet} />
      {isShelterModalOpen && (
        <ShelterModal isOpen={isShelterModalOpen} onClose={() => setIsShelterModalOpen(false)} />
      )}
    </div>
  );
}