"use client";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase"; 
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

/**
 * FIX LOG
 * ───────
 * CRITICAL — Removed Firebase Storage entirely. The project is on the free
 *            Spark plan which does NOT include Storage. uploadBytes() was
 *            silently failing → imageUrl stayed "" → no images on dashboard.
 *
 *            NEW APPROACH: Convert the image to a base64 data URL on the
 *            client and store it directly in the Firestore document's
 *            `image` field. Firestore docs can be up to 1MB. We compress
 *            the image to fit under ~800KB using canvas resizing.
 *
 * VALIDATION — Name required, age must be number, duration 1-365,
 *              only JPG/PNG/WEBP accepted, max 5MB before compression.
 *
 * FORM RESET — Fields clear after successful submission.
 */

const INITIAL_FORM = {
  name: "", age: "", breed: "", gender: "", location: "",
  headline: "", traits: "", medical: "", duration: "",
  isUrgent: false, vetStatus: "", status: "available"
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/* ── Compress image via canvas and return a base64 data URL ────────── */
function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ShelterUpload() {
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Pet name is required.";
    if (formData.age.trim() && isNaN(Number(formData.age)))
      e.age = "Age must be a number.";
    if (formData.duration.trim()) {
      const d = Number(formData.duration);
      if (isNaN(d) || d < 1 || d > 365) e.duration = "Duration must be between 1 and 365.";
    }
    if (imageFile && !ALLOWED_IMAGE_TYPES.includes(imageFile.type))
      e.image = "Only JPG, PNG, WEBP allowed.";
    if (imageFile && imageFile.size > MAX_IMAGE_SIZE)
      e.image = "Image must be under 5 MB.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageChange = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0] || null;
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setErrors(p => ({ ...p, image: "Only JPG, PNG, WEBP images are allowed. PDFs are not accepted." }));
        setImageFile(null); setImagePreview(""); ev.target.value = ""; return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setErrors(p => ({ ...p, image: "Image must be under 5 MB." }));
        setImageFile(null); setImagePreview(""); ev.target.value = ""; return;
      }
      setErrors(p => { const n = { ...p }; delete n.image; return n; });
      try {
        const preview = await compressImage(file);
        setImagePreview(preview);
      } catch {
        setImagePreview("");
      }
    }
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    setStatusMsg("Compressing image & saving pet...");
    
    try {
      let imageUrl = "";

      // Convert image to base64 (NO Firebase Storage needed)
      if (imageFile) {
        imageUrl = await compressImage(imageFile, 800, 0.7);
      }

      const finalPetData = { 
        ...formData, 
        image: imageUrl,
        isVaccinated: formData.vetStatus.includes("VACCINATED"),
        isSpayed: formData.vetStatus.includes("SPAYED"),
        isNeutered: formData.vetStatus.includes("NEUTERED")
      };

      await addDoc(collection(db, "pets"), finalPetData);
      setStatusMsg("Pet added successfully! 🎉");

      // Reset form
      setFormData({ ...INITIAL_FORM });
      setImageFile(null);
      setImagePreview("");
      setErrors({});
      const fi = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fi) fi.value = "";
      
    } catch (error: any) {
      console.error(error);
      setStatusMsg("Error saving pet. " + (error.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-[#E22726] text-[11px] font-bold mt-1 ml-2 normal-case tracking-normal">{errors[field]}</p> : null;

  return (
    <main className={`min-h-screen bg-[#F5F5EC] text-[#1E1E1E] pb-20 pt-12 flex flex-col items-center ${breeSerif.className} font-normal`}>
      <div className="w-full max-w-3xl p-12 bg-white rounded-[3rem] border border-[#D9D9D9] shadow-xl">
        
        <header className="mb-10 text-center">
          <span className="text-[#E22726] text-[14px] uppercase tracking-[0.3em] font-bold">Management</span>
          <h2 className={`${irishGrover.className} text-5xl mt-3 text-[#1E1E1E]`}>Add a New Pet</h2>
        </header>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 uppercase tracking-widest text-[#1E1E1E]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="ml-2 text-[13px] font-bold">Pet Name</label>
              <input type="text" placeholder="e.g. Jonnie" value={formData.name} className={`bg-[#F5F5EC] p-5 rounded-2xl outline-none border ${errors.name ? "border-red-400" : "border-[#D9D9D9]"} focus:border-[#E22726] transition-all`} onChange={e => setFormData({...formData, name: e.target.value})} />
              <FieldError field="name" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="ml-2 text-[13px] font-bold">Age</label>
              <input type="text" placeholder="e.g. 2 Years" value={formData.age} className={`bg-[#F5F5EC] p-5 rounded-2xl outline-none border ${errors.age ? "border-red-400" : "border-[#D9D9D9]"} focus:border-[#E22726] transition-all`} onChange={e => setFormData({...formData, age: e.target.value})} />
              <FieldError field="age" />
            </div>

            <input type="text" placeholder="Breed" value={formData.breed} className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, breed: e.target.value})} />
            <input type="text" placeholder="Gender" value={formData.gender} className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, gender: e.target.value})} />
            <input type="text" placeholder="Location" value={formData.location} className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, location: e.target.value})} />

            <div className="flex flex-col gap-2">
              <input type="text" placeholder="Duration (days)" value={formData.duration} className={`bg-[#F5F5EC] p-5 rounded-2xl outline-none border ${errors.duration ? "border-red-400" : "border-[#D9D9D9]"} focus:border-[#E22726] transition-all`} onChange={e => setFormData({...formData, duration: e.target.value})} />
              <FieldError field="duration" />
            </div>
          </div>

          <input type="text" placeholder="Headline" value={formData.headline} className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, headline: e.target.value})} />
          <input type="text" placeholder="Traits" value={formData.traits} className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, traits: e.target.value})} />
          <input type="text" placeholder="Medical Status" value={formData.medical} className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, medical: e.target.value})} />
          
          <div className="flex flex-col gap-2">
             <label className="ml-2 text-[13px] font-bold">Upload Pet Photo</label>
             <input 
               type="file" 
               accept="image/jpeg, image/png, image/webp"
               className={`bg-[#F5F5EC] p-4 rounded-2xl border ${errors.image ? "border-red-400" : "border-[#D9D9D9]"} focus:border-[#E22726] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#1A4B6B] file:text-white cursor-pointer`}
               onChange={handleImageChange} 
             />
             <FieldError field="image" />
             {imagePreview && (
               <div className="mt-2 flex items-center gap-4">
                 <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#D9D9D9]" />
                 <span className="text-[11px] text-emerald-600 font-bold normal-case tracking-normal">Image ready for upload</span>
               </div>
             )}
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center mt-4">
            <select 
              value={formData.vetStatus}
              className="flex-1 w-full bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] appearance-none transition-all cursor-pointer" 
              onChange={e => setFormData({...formData, vetStatus: e.target.value})}
            >
              <option value="">Select Vet Stamp...</option>
              <option value="SPAYED AND VACCINATED">Spayed &amp; Vaccinated</option>
              <option value="NEUTERED AND VACCINATED">Neutered &amp; Vaccinated</option>
              <option value="ONLY VACCINATED">Only Vaccinated</option>
            </select>

            <label className="flex items-center gap-3 cursor-pointer text-[14px] font-bold whitespace-nowrap">
              <input type="checkbox" checked={formData.isUrgent} className="w-6 h-6 accent-[#E22726]" onChange={e => setFormData({...formData, isUrgent: e.target.checked})} />
              Urgent Case?
            </label>
          </div>

          <button type="submit" disabled={isSubmitting} className={`mt-6 py-6 rounded-2xl text-[18px] transition shadow-lg font-bold ${isSubmitting ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-[#E22726] text-white hover:bg-[#b31d1d]"}`}>
            {isSubmitting ? "Saving..." : "Upload Pet"}
          </button>
          
          {statusMsg && <p className={`text-center mt-4 text-[18px] font-bold uppercase ${statusMsg.includes("successfully") ? "text-emerald-600" : "text-[#E22726]"}`}>{statusMsg}</p>}
        </form>
      </div>
    </main>
  );
}