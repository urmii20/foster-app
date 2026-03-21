"use client";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { db, storage } from "../../../lib/firebase"; 
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

export default function ShelterUpload() {
  const [formData, setFormData] = useState({
    name: "", age: "", breed: "", gender: "", location: "",
    headline: "", traits: "", medical: "", duration: "",
    isUrgent: false, vetStatus: "", status: "available"
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("Uploading image & saving pet...");
    
    try {
      let imageUrl = "";

      // 1. Upload Image to Storage
      if (imageFile) {
        const imageRef = ref(storage, `pets/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      // 2. MAP THE STAMP BOOLEANS BASED ON DROPDOWN SELECTION
      // This ensures your Modal sees the correct true/false values
      const finalPetData = { 
        ...formData, 
        image: imageUrl,
        isVaccinated: formData.vetStatus.includes("VACCINATED"),
        isSpayed: formData.vetStatus.includes("SPAYED"),
        isNeutered: formData.vetStatus.includes("NEUTERED")
      };

      // 3. Save to Firestore
      await addDoc(collection(db, "pets"), finalPetData);
      setStatusMsg("Pet added successfully! 🎉");
      
    } catch (error) {
      console.error(error);
      setStatusMsg("Error saving pet.");
    }
  };

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
              <input type="text" placeholder="e.g. Jonnie" required className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="ml-2 text-[13px] font-bold">Age</label>
              <input type="text" placeholder="e.g. 2 Years" required className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, age: e.target.value})} />
            </div>

            <input type="text" placeholder="Breed" className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, breed: e.target.value})} />
            <input type="text" placeholder="Gender" className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, gender: e.target.value})} />
            <input type="text" placeholder="Location" required className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, location: e.target.value})} />
            <input type="text" placeholder="Duration" className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, duration: e.target.value})} />
          </div>

          <input type="text" placeholder="Headline" className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, headline: e.target.value})} />
          <input type="text" placeholder="Traits" className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, traits: e.target.value})} />
          <input type="text" placeholder="Medical Status" className="bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] transition-all" onChange={e => setFormData({...formData, medical: e.target.value})} />
          
          <div className="flex flex-col gap-2">
             <label className="ml-2 text-[13px] font-bold">Upload Pet Photo</label>
             <input 
               type="file" 
               accept="image/jpeg, image/png, image/webp"
               className="bg-[#F5F5EC] p-4 rounded-2xl border border-[#D9D9D9] focus:border-[#E22726] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#1A4B6B] file:text-white cursor-pointer" 
               onChange={(e) => {
                 if (e.target.files && e.target.files[0]) {
                   setImageFile(e.target.files[0]);
                 }
               }} 
             />
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center mt-4">
            <select 
              className="flex-1 w-full bg-[#F5F5EC] p-5 rounded-2xl outline-none border border-[#D9D9D9] focus:border-[#E22726] appearance-none transition-all cursor-pointer" 
              onChange={e => setFormData({...formData, vetStatus: e.target.value})}
            >
              <option value="">Select Vet Stamp...</option>
              <option value="SPAYED AND VACCINATED">Spayed & Vaccinated</option>
              <option value="NEUTERED AND VACCINATED">Neutered & Vaccinated</option>
              <option value="ONLY VACCINATED">Only Vaccinated</option>
            </select>

            <label className="flex items-center gap-3 cursor-pointer text-[14px] font-bold whitespace-nowrap">
              <input type="checkbox" className="w-6 h-6 accent-[#E22726]" onChange={e => setFormData({...formData, isUrgent: e.target.checked})} />
              Urgent Case?
            </label>
          </div>

          <button type="submit" className="mt-6 bg-[#E22726] text-white py-6 rounded-2xl text-[18px] hover:bg-[#b31d1d] transition shadow-lg font-bold">
            Upload Pet 
          </button>
          
          {statusMsg && <p className="text-center mt-4 text-[#E22726] text-[18px] font-bold uppercase">{statusMsg}</p>}
        </form>
      </div>
    </main>
  );
}