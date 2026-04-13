"use client";
import { useState, useEffect } from "react";
import FosterForm from "./FosterForm";
import { Bree_Serif, Irish_Grover } from "next/font/google";
import ShelterModal from "../components/ShelterModal";

const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });
const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });

/**
 * FIX LOG
 * ───────
 * NEW — Added TypeScript types for props (was implicit any).
 *
 * NEW — Added a safety check: if pet.status becomes "fostered" while the
 *       modal is open (e.g. another user's application was approved), the
 *       "Foster" button is disabled and shows "In Foster Home" instead.
 *       This prevents the form from opening for an already-fostered pet.
 *
 * NEW — Flip state resets when the modal opens for a different pet,
 *       preventing stale UI from the previous pet's card.
 */

const STEPS = [
  { step: "1", title: "APPLY", desc: "FILL OUT A FORM" },
  { step: "2", title: "REVIEW", desc: "WE CHECK COMPATIBILITY" },
  { step: "3", title: "MEET", desc: "VISIT & INTERACT" },
  { step: "4", title: "FOSTER", desc: "TAKE THEM HOME" },
];

interface PetModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: any;
}

export default function PetModal({ isOpen, onClose, pet }: PetModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isShelterModalOpen, setIsShelterModalOpen] = useState(false);

  // Reset flip state when modal opens/closes or pet changes
  useEffect(() => {
    if (isOpen) {
      setIsFlipped(false);
      setIsFormOpen(false);
    }
  }, [isOpen, pet?.id]);

  if (!isOpen || !pet) return null;

  const isFostered = pet.status === "fostered";

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest("button")) return;
    setIsFlipped(!isFlipped);
  };

  const handleFosterClick = () => {
    // Safety check: don't open form if pet was fostered while modal was open
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
              {!isFlipped && (
                <div className="absolute top-6 right-6 w-32 h-32 z-30 pointer-events-none">
                  {pet.isVaccinated && (
                    <img
                      src="/vaccinated.png"
                      className="absolute top-0 right-0 w-24 h-24 object-contain rotate-[12deg]"
                      alt="Vaccinated"
                    />
                  )}
                  {pet.isSpayed && (
                    <img
                      src="/spayed.png"
                      className="absolute top-2 right-4 w-24 h-24 object-contain rotate-[-10deg]"
                      alt="Spayed"
                    />
                  )}
                  {pet.isNeutered && (
                    <img
                      src="/neutered.png"
                      className="absolute top-1 right-2 w-24 h-24 object-contain rotate-[5deg]"
                      alt="Neutered"
                    />
                  )}
                </div>
              )}

              <h2
                className={`text-[64px] uppercase text-[#1E1E1E] leading-none tracking-tight pr-32 ${irishGrover.className}`}
              >
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
                <p className="text-[16px] uppercase tracking-wider text-[#1E1E1E]">
                  {pet.headline}
                </p>
                <p className="mt-2 text-[14px] uppercase tracking-[0.15em] text-[#1E1E1E]/60">
                  {pet.traits}
                </p>
              </div>
              <div className="mt-8 text-[14px] uppercase tracking-[0.1em] text-[#1E1E1E] leading-relaxed">
                <p>{pet.medical}</p>
                <p>IDEAL FOSTER DURATION: {pet.duration}</p>
              </div>
            </div>

            {/* Front bottom buttons */}
            <div className="absolute bottom-0 left-[42%] right-0 h-[80px] pl-12 pr-10 flex gap-4">
              {isFostered ? (
                <button
                  disabled
                  className="flex-1 bg-gray-400 text-white rounded-t-[1.5rem] text-[14px] tracking-widest uppercase cursor-not-allowed"
                >
                  IN FOSTER HOME
                </button>
              ) : (
                <button
                  className="flex-1 bg-[#E22726] text-white rounded-t-[1.5rem] text-[14px] tracking-widest uppercase hover:bg-[#A91E1E] transition"
                  onClick={handleFosterClick}
                >
                  FOSTER {pet.name}
                </button>
              )}
              <button className="flex-1 bg-[#FEA8B3]/68 text-[#FFFFFF] rounded-t-[1.5rem] text-[14px] tracking-widest uppercase hover:bg-[#E2455A]/70 transition">
                ADOPTION ENQUIRY
              </button>
            </div>
          </div>

          {/* ══════════════════════════ BACK ══════════════════════════ */}
          <div
            className={`absolute inset-0 bg-[#F5F5EC] rounded-[2.5rem] shadow-2xl border border-[#D9D9D9] flex flex-col items-center pt-10 px-12 backface-hidden ${breeSerif.className} ${!isFlipped ? "pointer-events-none" : ""}`}
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="w-full max-w-3xl flex flex-col items-center h-full relative">
              <h2
                className={`text-[40px] uppercase text-[#1E1E1E] flex items-center gap-4 ${irishGrover.className}`}
              >
                <button
                  onClick={() => setIsShelterModalOpen(true)}
                  className="hover:text-[#E22726] transition-colors"
                >
                  THE ARC ANIMAL PROJECT
                </button>
                <span className="flex items-center text-2xl mt-1 tracking-widest font-sans">
                  <span className="text-[#FFC107]">★★★★</span>
                  <span className="text-[#D9D9D9]">★</span>
                </span>
              </h2>

              <p className="text-[13px] uppercase tracking-[0.15em] text-center mt-3 max-w-xl leading-relaxed text-[#1E1E1E]/90">
                A NON-PROFIT ORGANIZATION DEDICATED TO RESCUING, REHABILITATING,
                AND REHOMING ANIMALS IN NEED SINCE 2014.
              </p>

              <div className="w-full max-w-2xl border-t border-[#D9D9D9] my-6" />

              <div className="flex justify-center gap-16 w-full text-[14px] uppercase tracking-[0.15em] text-[#1E1E1E] mb-8">
                <div className="flex flex-col gap-3 text-left">
                  <p>📍 LOCATION: {pet.location}</p>
                  <p>🗓 DURATION: {pet.duration || "3-4 WEEKS"}</p>
                </div>
                <div className="flex flex-col gap-3 text-left">
                  <p>SUPPLIES PROVIDED</p>
                  <p>MEDICAL COVERED</p>
                </div>
              </div>

              <div className="flex w-full justify-between items-start text-center relative px-4">
                <div className="absolute top-5 left-12 right-12 h-[1px] bg-[#D9D9D9]" />
                {STEPS.map(({ step, title, desc }) => (
                  <div
                    key={step}
                    className="flex flex-col items-center bg-[#F5F5EC] px-4 z-10"
                  >
                    <div className="w-10 h-10 rounded-full border-[1.5px] border-[#1E1E1E] flex items-center justify-center mb-4 text-[15px] bg-[#F5F5EC]">
                      {step}
                    </div>
                    <p className="text-[13px] uppercase tracking-widest mb-1">
                      {title}
                    </p>
                    <p className="text-[11px] text-[#1E1E1E]/60 uppercase tracking-widest">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-[12px] uppercase tracking-[0.2em] text-[#1E1E1E]/40">
                24/7 PET COORDINATION AVAILABLE FOR ALL FOSTERS
              </p>

              {/* Back bottom buttons */}
              <div className="absolute bottom-0 left-0 right-0 h-[64px] flex justify-center gap-6">
                <button className="w-[260px] bg-[#FEA8B3]/68 text-[#FFFFFF] rounded-t-[1.25rem] text-[12px] uppercase hover:bg-[#E2455A]/70 transition">
                  REQUIREMENTS
                </button>
                <button className="w-[260px] bg-[#E22726] text-white rounded-t-[1.25rem] text-[12px] uppercase hover:bg-[#A91E1E] transition">
                  CONTACT US
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FosterForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        pet={pet}
      />
      {isShelterModalOpen && (
        <ShelterModal
          isOpen={isShelterModalOpen}
          onClose={() => setIsShelterModalOpen(false)}
        />
      )}
    </div>
  );
}