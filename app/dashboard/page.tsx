"use client";
import { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Navbar from "../components/Navbar";
import UrgentPetCard from "../components/UrgentPetCard";
import ZoomedOutPetCard from "../components/ZoomedOutPetCard";
import PetModal from "../components/PetModal";

export default function Dashboard() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // New state for database pets and the currently selected modal pet
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);

  // Fetch pets from Firestore when the page loads
  useEffect(() => {
    const fetchPets = async () => {
      const querySnapshot = await getDocs(collection(db, "pets"));
      const petsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPets(petsData);
    };
    fetchPets();
  }, []);

  // Filter them based on the checkbox from your shelter upload form
  const urgentPets = pets.filter(pet => pet.isUrgent);
  const regularPets = pets.filter(pet => !pet.isUrgent);

  // Drag handlers for the carousel
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <main className="min-h-screen bg-[#F5F5EC] text-[#1E1E1E] pb-20 relative">
      <Navbar />
      
      {/* Pass the selected pet data into the modal */}
      <PetModal isOpen={!!selectedPet} onClose={() => setSelectedPet(null)} pet={selectedPet} />

      <div className="px-12 py-4 flex justify-between border-b-2 border-t-2 border-[#D9D9D9] mb-12">
        <input type="text" placeholder="SEARCH PETS BY NAME, BREED OR LOCATION..." className="bg-transparent outline-none w-1/2 text-xs font-bold tracking-widest uppercase placeholder:text-[#1E1E1E]/50" />
        <div className="flex gap-4 text-xs font-bold tracking-widest">
          <button className="border-2 border-[#D9D9D9] bg-white px-6 py-1 rounded-full">FILTER</button>
          <button className="border-2 border-[#D9D9D9] bg-white px-6 py-1 rounded-full">SORT: RECENTLY ADDED</button>
        </div>
      </div>

      <div className="flex flex-col gap-16">
        <section className="w-full">
          <h2 className="px-12 text-sm font-bold mb-4 uppercase tracking-widest">Urgent Foster Cases</h2>
          <div className="w-full bg-[#FCEAEB] py-8 pl-12 border-y border-[#D9D9D9]/50">
            <div 
              ref={carouselRef} onMouseDown={handleMouseDown} onMouseLeave={() => setIsDragging(false)} onMouseUp={() => setIsDragging(false)} onMouseMove={handleMouseMove}
              className={`flex gap-6 overflow-x-auto pb-4 pr-12 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDragging ? "cursor-grabbing" : "cursor-grab snap-x snap-mandatory"}`}
            >
              {urgentPets.map(pet => (
                <div key={pet.id} onClick={() => !isDragging && setSelectedPet(pet)} className="cursor-pointer">
                  <UrgentPetCard name={pet.name} location={pet.location} time={pet.age || pet.duration} image={pet.image || "/jonnie.png"} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-12">
          <h2 className="text-sm font-bold mb-6 uppercase tracking-widest">Find Your Next Friend</h2>
          <div className="grid grid-cols-3 gap-8">
            {regularPets.map(pet => (
              <div key={pet.id} onClick={() => setSelectedPet(pet)} className="cursor-pointer hover:scale-[1.02] transition-transform">
                <ZoomedOutPetCard name={pet.name} age={pet.age} breed={pet.breed} image={pet.image || "/jonnie.png"} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}