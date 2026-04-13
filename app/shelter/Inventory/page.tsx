"use client";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif   = Bree_Serif({ weight: "400", subsets: ["latin"] });

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ShelterUpload() {
  const [formData, setFormData] = useState({
    name: "", age: "", breed: "", gender: "", location: "",
    headline: "", traits: "", medical: "", duration: "",
    isUrgent: false, vetStatus: "", status: "available",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim())     e.name     = "Pet name is required.";
    if (!formData.breed.trim())    e.breed    = "Breed is required.";
    if (!formData.gender.trim())   e.gender   = "Gender is required.";
    if (!formData.location.trim()) e.location = "Location is required.";
    const ageNum = parseFloat(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 30) e.age = "Age must be a number between 0.1 and 30.";
    const durNum = parseInt(formData.duration, 10);
    if (!formData.duration || isNaN(durNum) || durNum <= 0 || durNum > 365) e.duration = "Duration must be between 1 and 365 days.";
    if (imageFile) {
      if (!ALLOWED_TYPES.includes(imageFile.type)) e.image = "Image must be JPG, PNG, or WebP.";
      if (imageFile.size > MAX_FILE_SIZE) e.image = "Image must be under 5 MB.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setErrors(p => ({ ...p, image: "Only JPG, PNG, and WebP are accepted." })); e.target.value = ""; return; }
    if (file.size > MAX_FILE_SIZE) { setErrors(p => ({ ...p, image: "File is too large. Max 5 MB." })); e.target.value = ""; return; }
    setErrors(p => ({ ...p, image: "" }));
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setStatusMsg("Uploading...");
    try {
      let imageUrl = "";
      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const imageRef = ref(storage, `pets/${Date.now()}_${safeName}`);
        const result   = await uploadBytes(imageRef, imageFile);
        imageUrl       = await getDownloadURL(result.ref);
      }
      const v = formData.vetStatus;
      await addDoc(collection(db, "pets"), {
        ...formData,
        age: parseFloat(formData.age),
        durationDays: parseInt(formData.duration, 10),
        image: imageUrl,
        isVaccinated: v === "VACCINATED" || v === "VACCINATED_SPAYED" || v === "VACCINATED_NEUTERED",
        isSpayed:     v === "SPAYED"    || v === "VACCINATED_SPAYED",
        isNeutered:   v === "NEUTERED"  || v === "VACCINATED_NEUTERED",
        status: "available",
        createdAt: new Date().toISOString(),
      });
      setStatusMsg("Pet added successfully! 🎉");
      setFormData({ name: "", age: "", breed: "", gender: "", location: "", headline: "", traits: "", medical: "", duration: "", isUrgent: false, vetStatus: "", status: "available" });
      setImageFile(null);
    } catch (error) {
      console.error(error);
      setStatusMsg("Error saving pet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const field = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(f => ({ ...f, [key]: e.target.value }));

  return (
    <main className={`min-h-screen bg-[#F5F5EC] text-[#1E1E1E] pb-20 pt-12 flex flex-col items-center ${breeSerif.className}`}>
      <div className="w-full max-w-3xl p-12 bg-white rounded-[3rem] border border-[#D9D9D9] shadow-xl">
        <header className="mb-10 text-center">
          <span className="text-[#E22726] text-[14px] uppercase tracking-[0.3em] font-bold">Management</span>
          <h2 className={`${irishGrover.className} text-5xl mt-3 text-[#1E1E1E]`}>Add a New Pet</h2>
        </header>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 uppercase tracking-widest text-[#1E1E1E]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[["name","Pet Name *","text"],["age","Age (years) *","number"],["breed","Breed *","text"],["location","Location *","text"]].map(([key, label, type]) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="ml-2 text-[13px] font-bold">{label}</label>
                <input type={type} value={(formData as any)[key]} onChange={field(key)}
                  min={type === "number" ? "0.1" : undefined} max={type === "number" ? "30" : undefined} step={type === "number" ? "0.1" : undefined}
                  className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" />
                {(errors as any)[key] && <p className="text-[#E22726] text-xs ml-2">{(errors as any)[key]}</p>}
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <label className="ml-2 text-[13px] font-bold">Gender *</label>
              <select value={formData.gender} onChange={field("gender")} className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <p className="text-[#E22726] text-xs ml-2">{errors.gender}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="ml-2 text-[13px] font-bold">Foster Duration (days) *</label>
              <input type="number" min="1" max="365" step="1" value={formData.duration} onChange={field("duration")}
                className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" />
              {errors.duration && <p className="text-[#E22726] text-xs ml-2">{errors.duration}</p>}
            </div>
          </div>
          {["headline","traits","medical"].map(key => (
            <input key={key} type="text" value={(formData as any)[key]} onChange={field(key)} placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" />
          ))}
          <div className="flex flex-col gap-2">
            <label className="ml-2 text-[13px] font-bold">Vet Status</label>
            <select value={formData.vetStatus} onChange={field("vetStatus")} className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all">
              <option value="">None</option>
              <option value="VACCINATED">Vaccinated only</option>
              <option value="SPAYED">Spayed only</option>
              <option value="NEUTERED">Neutered only</option>
              <option value="VACCINATED_SPAYED">Vaccinated + Spayed</option>
              <option value="VACCINATED_NEUTERED">Vaccinated + Neutered</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer ml-2">
            <input type="checkbox" checked={formData.isUrgent} onChange={e => setFormData(f => ({ ...f, isUrgent: e.target.checked }))} className="w-5 h-5 accent-[#E22726]" />
            <span className="text-[13px] font-bold">Mark as Urgent</span>
          </label>
          <div className="flex flex-col gap-2">
            <label className="ml-2 text-[13px] font-bold">Upload Pet Photo</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange}
              className="bg-[#F5F5EC] p-4 rounded-2xl border border-[#D9D9D9] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#1A4B6B] file:text-white cursor-pointer" />
            {errors.image && <p className="text-[#E22726] text-xs ml-2">{errors.image}</p>}
            <p className="text-xs text-gray-400 ml-2">JPG, PNG, or WebP · Max 5 MB</p>
          </div>
          {statusMsg && <p className={`text-center font-bold text-sm ${statusMsg.includes("Error") ? "text-[#E22726]" : "text-green-600"}`}>{statusMsg}</p>}
          <button type="submit" disabled={isLoading} className={`w-full py-6 rounded-2xl text-[16px] tracking-[0.2em] uppercase transition-all shadow-lg font-bold ${isLoading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#E22726] text-white hover:bg-[#b31d1d]"}`}>
            {isLoading ? "Saving..." : "Add Pet"}
          </button>
        </form>
      </div>
    </main>
  );
}