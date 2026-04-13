"use client";
import { useState, useEffect } from "react";
import { Bree_Serif, Irish_Grover } from "next/font/google";
import { db, auth } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
 
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });
const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
 
const STEP_TITLES = ["Personal Info", "Home Life", "Suitability", "Confirmation"];
 
const INITIAL_FORM = {
  fullName: "", phone: "", email: "", location: "",
  residence: "House", ownRent: "Own", otherPets: "", children: "None",
  experience: "No", whyFoster: "", duration: "Flexible",
  confirmExpenses: false, confirmMedical: false, confirmAgreement: false,
};
 
const Input = ({ label, type = "text", value, onChange, placeholder = "" }) => (
  <div>
    <label className="block text-[12px] uppercase tracking-widest text-[1E1E1E] mb-2 ml-1">{label}</label>
    <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:border-[#35D0E6] outline-none transition-all shadow-sm" />
  </div>
);
 
const Select = ({ label, options, value, onChange }) => (
  <div className="flex-1">
    <label className="block text-[12px] uppercase tracking-widest text-[1E1E1E] mb-2 ml-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none shadow-sm cursor-pointer">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
 
const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-4 cursor-pointer group">
    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? "bg-[#E22726] border-[#E22726]" : "border-gray-200 group-hover:border-gray-400"}`}>
      {checked && <span className="text-white text-[10px]">✓</span>}
    </div>
    <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="text-xs text-gray-700 font-medium tracking-wide">{label}</span>
  </label>
);
 
export default function FosterForm({ isOpen, onClose, pet }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
 
  useEffect(() => { if (isOpen) { setStep(1); setIsSuccess(false); } }, [isOpen]);
 
  // Auth check — if not logged in, close form and redirect to /login
  useEffect(() => {
    if (isOpen && !auth.currentUser) {
      onClose();
      router.push("/login");
    }
  }, [isOpen]);
 
  if (!isOpen) return null;
 
  const set = (key) => (val) => setFormData(f => ({ ...f, [key]: val }));
 
  const validateAndNext = () => {
    if (step === 1 && (!formData.fullName.trim() || !formData.phone.trim()))
      return alert("Please fill in all contact details.");
    if (step === 2 && !formData.otherPets.trim())
      return alert("Please mention if you have other pets (or type 'None').");
    setStep(s => s + 1);
  };
 
  const handleSubmit = async () => {
    if (!formData.confirmAgreement) return alert("You must agree to the terms to submit.");
    setIsSubmitting(true);
    try {
      // auth.currentUser is guaranteed here because of the check above
      const userId = auth.currentUser!.uid;
 
      await addDoc(collection(db, "foster_applications"), {
        ...formData,
        userId,
        petId: pet.id,
        petName: pet.name,
        status: "pending",
        submittedAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Could not send application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
 
  if (isSuccess) return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#F5F5EC] h-full p-10 flex flex-col items-center justify-center text-center shadow-2xl">
        <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mb-8 animate-bounce">✓</div>
        <h2 className={`${irishGrover.className} text-3xl text-[#1E1E1E] mb-4`}>SUCCESS!</h2>
        <p className={`${breeSerif.className} text-gray-600 mb-10 leading-relaxed text-lg`}>
          Your application for <strong>{pet.name}</strong> is in our system. The shelter will review it shortly.
        </p>
        <button onClick={onClose} className="w-full py-5 bg-[#1E1E1E] text-white rounded-2xl uppercase tracking-[0.2em] font-bold hover:bg-[#E22726] transition-all">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
 
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#F5F5EC] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
 
        <div className="p-8 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[#E22726] text-[10px] font-bold uppercase tracking-[0.2em]">Application Process</p>
              <h2 className={`${irishGrover.className} text-3xl text-[#1E1E1E]`}>{STEP_TITLES[step - 1]}</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-all">✕</button>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#E22726] transition-all duration-700 ease-in-out" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>
 
        <div className={`flex-1 overflow-y-auto px-8 py-10 ${breeSerif.className}`}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {step === 1 && (
              <div className="space-y-6">
                <Input label="Full Name" value={formData.fullName} onChange={set("fullName")} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone" value={formData.phone} onChange={set("phone")} />
                  <Input label="City" value={formData.location} onChange={set("location")} />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Residence" options={["House", "Apartment", "Studio"]} value={formData.residence} onChange={set("residence")} />
                </div>
                <Input label="Other Pets" placeholder="e.g. 2 Golden Retrievers" value={formData.otherPets} onChange={set("otherPets")} />
                <Select label="Children" options={["None", "Under 5", "School Age", "Teens"]} value={formData.children} onChange={set("children")} />
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <Select label="Previous Foster Experience?" options={["Yes", "No"]} value={formData.experience} onChange={set("experience")} />
              </div>
            )}
            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
                  <Checkbox label="I can cover basic food/supplies" checked={formData.confirmExpenses} onChange={set("confirmExpenses")} />
                  <Checkbox label="I can manage medical visits" checked={formData.confirmMedical} onChange={set("confirmMedical")} />
                  <Checkbox label="I agree to terms and conditions" checked={formData.confirmAgreement} onChange={set("confirmAgreement")} />
                </div>
                <div className="p-5 bg-[#35D0E6]/10 rounded-2xl border-2 border-dashed border-[#35D0E6]/30 flex items-center gap-4">
                  <img src={pet.image} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" alt={pet.name} />
                  <div>
                    <p className="text-[12px] uppercase text-gray-400 font-bold tracking-widest">Finalizing for</p>
                    <p className={`${irishGrover.className} text-2xl text-[#1E1E1E]`}>{pet.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
 
        <div className="p-8 border-t border-gray-200 bg-white flex gap-4">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-4 border border-gray-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">Back</button>
          )}
          <button onClick={step === 4 ? handleSubmit : validateAndNext} disabled={isSubmitting}
            className={`flex-[2] py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl text-white ${isSubmitting ? "bg-gray-400" : "bg-[#1E1E1E] hover:bg-[#E22726] active:scale-95"}`}>
            {isSubmitting ? "Sending..." : step === 4 ? "Submit App" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}