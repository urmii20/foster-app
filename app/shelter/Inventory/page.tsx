"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

const INITIAL_FORM = {
  name: "", age: "", species: "Dog", breed: "", gender: "", location: "",
  headline: "", traits: "", medical: "", healthNotes: "", duration: "",
  isUrgent: false, vetStatus: "", status: "available",
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const SPECIES_OPTIONS = ["Dog", "Cat", "Rabbit", "Bird", "Other"];
const INDIAN_CITIES = ["Mumbai", "Pune", "Nashik", "Nagpur", "Thane", "Navi Mumbai", "Aurangabad", "Kolhapur", "Other"];

function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

type PetTab = "add" | "manage";

export default function ShelterInventory() {
  const [activeTab, setActiveTab] = useState<PetTab>("add");
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage tab
  const [pets, setPets] = useState<any[]>([]);
  const [editingPet, setEditingPet] = useState<any | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editUrgent, setEditUrgent] = useState(false);
  const [savingPet, setSavingPet] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pets"), (snap) => {
      setPets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Pet name is required.";
    if (formData.age.trim() && isNaN(Number(formData.age))) e.age = "Age must be a number.";
    if (formData.duration.trim()) {
      const d = Number(formData.duration);
      if (isNaN(d) || d < 1 || d > 365) e.duration = "Duration must be 1–365.";
    }
    if (imageFile && !ALLOWED_IMAGE_TYPES.includes(imageFile.type)) e.image = "Only JPG, PNG, WEBP allowed.";
    if (imageFile && imageFile.size > MAX_IMAGE_SIZE) e.image = "Image must be under 5 MB.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageChange = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0] || null;
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((p) => ({ ...p, image: "Only JPG, PNG, WEBP allowed." }));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setErrors((p) => ({ ...p, image: "Image must be under 5 MB." }));
      return;
    }
    setErrors((p) => { const n = { ...p }; delete n.image; return n; });
    setImageFile(file);
    try { setImagePreview(await compressImage(file)); } catch { setImagePreview(""); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    setStatusMsg("Saving pet…");
    try {
      let imageUrl = "";
      if (imageFile) imageUrl = await compressImage(imageFile, 800, 0.7);
      await addDoc(collection(db, "pets"), {
        ...formData,
        image: imageUrl,
        isVaccinated: formData.vetStatus.includes("VACCINATED"),
        isSpayed: formData.vetStatus.includes("SPAYED"),
        isNeutered: formData.vetStatus.includes("NEUTERED"),
        createdAt: new Date().toISOString(),
      });
      setStatusMsg("Pet added successfully! 🎉");
      setFormData({ ...INITIAL_FORM });
      setImageFile(null);
      setImagePreview("");
      setErrors({});
    } catch (err: any) {
      setStatusMsg("Error: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (pet: any) => {
    setEditingPet(pet);
    setEditNotes(pet.healthNotes || "");
    setEditUrgent(pet.isUrgent || false);
  };

  const saveEdit = async () => {
    if (!editingPet) return;
    setSavingPet(true);
    try {
      await updateDoc(doc(db, "pets", editingPet.id), {
        healthNotes: editNotes,
        isUrgent: editUrgent,
      });
      setEditingPet(null);
    } catch (e) { console.error(e); }
    setSavingPet(false);
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-[#E22726] text-[11px] font-bold mt-1 ml-2">{errors[field]}</p> : null;

  const inputClass = "bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all w-full";

  return (
    <main className={`min-h-screen bg-[#F5F5EC] text-[#1E1E1E] pb-20 pt-12 flex flex-col items-center ${breeSerif.className}`}>
      <div className="w-full max-w-3xl">

        {/* Tabs */}
        <div className="flex gap-1 border-b-2 border-[#D9D9D9] mb-8">
          {(["add", "manage"] as PetTab[]).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 -mb-[2px] ${activeTab === t ? "border-[#E22726] text-[#E22726]" : "border-transparent text-[#999] hover:text-[#1E1E1E]"}`}>
              {t === "add" ? "Add New Pet" : `Manage Pets (${pets.length})`}
            </button>
          ))}
        </div>

        {/* ── ADD TAB ─────────────────────────────────────────── */}
        {activeTab === "add" && (
          <div className="p-12 bg-white rounded-[3rem] border border-[#D9D9D9] shadow-xl">
            <header className="mb-10 text-center">
              <span className="text-[#E22726] text-[14px] uppercase tracking-[0.3em] font-bold">Management</span>
              <h2 className={`${irishGrover.className} text-5xl mt-3`}>Add a New Pet</h2>
            </header>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 uppercase tracking-widest">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="ml-2 text-[13px] font-bold">Pet Name *</label>
                  <input type="text" placeholder="e.g. Jonnie" value={formData.name}
                    className={`${inputClass} ${errors.name ? "border-red-400" : ""}`}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <FieldError field="name" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="ml-2 text-[13px] font-bold">Species</label>
                  <select value={formData.species} onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    className={inputClass + " appearance-none cursor-pointer"}>
                    {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="ml-2 text-[13px] font-bold">Age</label>
                  <input type="text" placeholder="e.g. 2 Years" value={formData.age}
                    className={`${inputClass} ${errors.age ? "border-red-400" : ""}`}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                  <FieldError field="age" />
                </div>
                <input type="text" placeholder="Breed" value={formData.breed} className={inputClass}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })} />
                <input type="text" placeholder="Gender" value={formData.gender} className={inputClass}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })} />
                <select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={inputClass + " appearance-none cursor-pointer"}>
                  <option value="">Select City…</option>
                  {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex flex-col gap-2 col-span-2">
                  <label className="ml-2 text-[13px] font-bold">Duration (days)</label>
                  <input type="text" placeholder="e.g. 30" value={formData.duration}
                    className={`${inputClass} ${errors.duration ? "border-red-400" : ""}`}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                  <FieldError field="duration" />
                </div>
              </div>

              <input type="text" placeholder="Headline" value={formData.headline} className={inputClass}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })} />
              <input type="text" placeholder="Traits (e.g. Friendly, Playful)" value={formData.traits} className={inputClass}
                onChange={(e) => setFormData({ ...formData, traits: e.target.value })} />
              <input type="text" placeholder="Medical Status" value={formData.medical} className={inputClass}
                onChange={(e) => setFormData({ ...formData, medical: e.target.value })} />

              <div>
                <label className="ml-2 text-[13px] font-bold block mb-2">Health & Care Notes (shown to potential fosters)</label>
                <textarea
                  placeholder="e.g. Needs daily medication. Anxious around loud noises. Enjoys morning walks."
                  value={formData.healthNotes}
                  rows={3}
                  className={inputClass + " resize-none normal-case tracking-normal"}
                  onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="ml-2 text-[13px] font-bold">Upload Pet Photo</label>
                <input type="file" accept="image/jpeg,image/png,image/webp"
                  className={`bg-[#F5F5EC] p-4 rounded-2xl border ${errors.image ? "border-red-400" : "border-[#D9D9D9]"} focus:border-[#E22726] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#E22726] file:text-white cursor-pointer w-full`}
                  onChange={handleImageChange} />
                <FieldError field="image" />
                {imagePreview && (
                  <div className="flex items-center gap-4 mt-2">
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#D9D9D9]" />
                    <span className="text-[11px] text-emerald-600 font-bold normal-case tracking-normal">Image ready</span>
                  </div>
                )}
              </div>

              <div className="flex gap-6 items-center">
                <select value={formData.vetStatus} onChange={(e) => setFormData({ ...formData, vetStatus: e.target.value })}
                  className={inputClass + " appearance-none cursor-pointer flex-1"}>
                  <option value="">Select Vet Status…</option>
                  <option value="SPAYED AND VACCINATED">Spayed & Vaccinated</option>
                  <option value="NEUTERED AND VACCINATED">Neutered & Vaccinated</option>
                  <option value="ONLY VACCINATED">Only Vaccinated</option>
                </select>
                <label className="flex items-center gap-3 cursor-pointer text-[13px] font-bold whitespace-nowrap">
                  <input type="checkbox" checked={formData.isUrgent} className="w-6 h-6 accent-[#E22726]"
                    onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })} />
                  Urgent Case?
                </label>
              </div>

              <button type="submit" disabled={isSubmitting}
                className={`mt-4 py-6 rounded-2xl text-[18px] transition shadow-lg font-bold ${isSubmitting ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-[#E22726] text-white hover:bg-[#b31d1d]"}`}>
                {isSubmitting ? "Saving…" : "Upload Pet"}
              </button>
              {statusMsg && (
                <p className={`text-center text-[16px] font-bold uppercase ${statusMsg.includes("successfully") ? "text-emerald-600" : "text-[#E22726]"}`}>{statusMsg}</p>
              )}
            </form>
          </div>
        )}

        {/* ── MANAGE TAB ──────────────────────────────────────── */}
        {activeTab === "manage" && (
          <div className="space-y-4">
            {pets.length === 0 ? (
              <div className="py-20 text-center text-[#999] text-sm font-bold uppercase tracking-widest">No pets in the system yet.</div>
            ) : (
              pets.map((pet) => (
                <div key={pet.id} className="bg-white rounded-[2rem] border-2 border-[#D9D9D9] p-6 flex gap-5 items-start">
                  <img src={pet.image || "/jonnie.png"} alt={pet.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#F5F5EC] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className={`${irishGrover.className} text-2xl`}>{pet.name}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${pet.status === "fostered" ? "bg-blue-100 text-blue-600" : pet.isUrgent ? "bg-[#FCEAEB] text-[#E22726]" : "bg-green-100 text-green-600"}`}>
                        {pet.status === "fostered" ? "Fostered" : pet.isUrgent ? "Urgent" : "Available"}
                      </span>
                    </div>
                    <p className="text-xs text-[#999] font-bold uppercase tracking-widest">{pet.species} · {pet.breed || "Mixed"} · {pet.location}</p>
                    {pet.healthNotes && (
                      <p className="text-xs text-[#666] mt-2 leading-relaxed">{pet.healthNotes}</p>
                    )}
                  </div>
                  <button onClick={() => openEdit(pet)}
                    className="flex-shrink-0 px-5 py-2 border-2 border-[#D9D9D9] rounded-xl text-[11px] font-bold uppercase tracking-widest hover:border-[#E22726] hover:text-[#E22726] transition">
                    Edit Notes
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Edit notes modal ────────────────────────────────── */}
      {editingPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className={`bg-[#F5F5EC] rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl ${breeSerif.className}`}>
            <div className="flex items-center gap-3 mb-6">
              <img src={editingPet.image || "/jonnie.png"} alt={editingPet.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className={`${irishGrover.className} text-2xl`}>{editingPet.name}</p>
                <p className="text-[10px] text-[#999] font-bold uppercase tracking-widest">Edit Pet Details</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2">Health & Care Notes</label>
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={5}
                className="w-full p-4 bg-white border-2 border-[#D9D9D9] rounded-2xl text-sm focus:border-[#E22726] outline-none resize-none"
                placeholder="Medication schedules, behavioural notes, dietary requirements…" />
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={editUrgent} onChange={(e) => setEditUrgent(e.target.checked)} className="w-5 h-5 accent-[#E22726]" />
                <span className="text-sm font-bold uppercase tracking-widest">Mark as Urgent</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditingPet(null)}
                className="flex-1 py-3 border-2 border-[#D9D9D9] rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={savingPet}
                className="flex-[2] py-3 bg-[#E22726] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#b31d1d] transition disabled:opacity-50">
                {savingPet ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}