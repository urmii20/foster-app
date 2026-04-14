"use client";
import { useState, useEffect } from "react";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

const STEPS = [
  {
    num: "01",
    icon: "📋",
    title: "APPLY",
    sub: "Fill Out a Form",
    desc: "Browse available pets and fill a short application with your living situation and experience. Takes under 3 minutes.",
    color: "#FCEAEB",
    border: "#F8BBD0",
  },
  {
    num: "02",
    icon: "🔍",
    title: "REVIEW",
    sub: "We Check Compatibility",
    desc: "Our shelter team reviews your application and matches you with the right animal for your home.",
    color: "#E8F4FD",
    border: "#BBDEFB",
  },
  {
    num: "03",
    icon: "🤝",
    title: "MEET",
    sub: "Visit & Interact",
    desc: "Come to the shelter to meet the animal, complete a brief orientation, and collect their care kit.",
    color: "#F1F8E9",
    border: "#DCEDC8",
  },
  {
    num: "04",
    icon: "🏠",
    title: "FOSTER",
    sub: "Take Them Home",
    desc: "The animal moves in! Your care calendar and daily task reminders are ready the moment you begin.",
    color: "#FFF3E3",
    border: "#FFE0B2",
  },
];

const STORAGE_KEY = "pawshelter_onboarded";

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch (_) {}
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (_) {}
    setVisible(false);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`${breeSerif.className} w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className="px-10 pt-10 pb-6 border-b-2 border-[#D9D9D9]">
          <p className="text-[#E22726] text-[11px] font-bold uppercase tracking-[0.3em] mb-1">
            How It Works
          </p>
          <h2 className={`${irishGrover.className} text-4xl text-[#1E1E1E]`}>
            Your Foster Journey
          </h2>
          {/* Step dots */}
          <div className="flex gap-2 mt-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-8 bg-[#E22726]" : "w-3 bg-[#D9D9D9] hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div
          className="px-10 py-8"
          style={{ background: current.color, borderBottom: `2px solid ${current.border}` }}
        >
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 bg-white shadow-sm"
              style={{ border: `2px solid ${current.border}` }}
            >
              {current.icon}
            </div>
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-[10px] font-bold text-[#999] uppercase tracking-widest">
                  Step {current.num}
                </span>
                <span className="text-[#E22726] text-[10px] font-bold uppercase tracking-widest">
                  {current.sub}
                </span>
              </div>
              <h3 className={`${irishGrover.className} text-3xl text-[#1E1E1E] mb-2`}>
                {current.title}
              </h3>
              <p className="text-[14px] text-[#555] leading-relaxed">{current.desc}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 border-2 border-[#D9D9D9] rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#F5F5EC] transition"
            >
              ← Back
            </button>
          )}
          {isLast ? (
            <button
              onClick={dismiss}
              className="flex-[2] py-3 bg-[#E22726] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#b31d1d] transition shadow-lg"
            >
              Get Started →
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-[2] py-3 bg-[#1E1E1E] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#E22726] transition shadow-lg"
            >
              Next →
            </button>
          )}
          <button
            onClick={dismiss}
            className="px-4 py-3 text-[#999] text-[10px] font-bold uppercase tracking-widest hover:text-[#1E1E1E] transition"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}