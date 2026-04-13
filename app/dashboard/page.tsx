"use client";
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Navbar from "../components/Navbar";
import UrgentPetCard from "../components/UrgentPetCard";
import ZoomedOutPetCard from "../components/ZoomedOutPetCard";
import PetModal from "../components/PetModal";

export default function Dashboard() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging,   setIsDragging]   = useState(false);
  const [startX,       setStartX]       = useState(0);
  const [scrollLeft,   setScrollLeft]   = useState(0);
  const [pets,         setPets]         = useState<any[]>([]);
  const [selectedPet,  setSelectedPet]  = useState<any | null>(null);

  useEffect(() => {
    // FIX: switched from getDocs (one-time fetch) to onSnapshot (real-time).
    // This means when an admin approves an application and sets a pet to
    // "fostered", the user's dashboard updates live without a page reload,
    // preventing the race where a user could still click a pet that was
    // just approved for someone else.
    const unsub = onSnapshot(collection(db, "pets"), (snapshot) => {
      setPets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const urgentPets  = pets.filter(pet => pet.isUrgent);
  const regularPets = pets.filter(pet => !pet.isUrgent);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(false); // reset — only set true on actual movement
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!startX || !carouselRef.current) return;
    const x    = e.pageX - carouselRef.current.offsetLeft;
    const walk = Math.abs(x - startX);
    if (walk > 5) setIsDragging(true); // threshold prevents click-as-drag
    const scrollWalk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - scrollWalk;
  };

  const handlePetClick = (pet: any) => {
    if (isDragging || pet.status === "fostered") return;
    setSelectedPet(pet);
  };

  return (
    <main className="min-h-screen bg-[#F5F5EC] text-[#1E1E1E] pb-20 relative">
      <Navbar />
      <PetModal
        isOpen={!!selectedPet}
        onClose={() => setSelectedPet(null)}
        pet={selectedPet}
      />

      <div className="px-12 pt-4">

        {/* Urgent pets carousel */}
        {urgentPets.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[#E22726] text-xs font-bold uppercase tracking-[0.2em]">Urgent</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {urgentPets.map(pet => (
                <div
                  key={pet.id}
                  onClick={() => handlePetClick(pet)}
                  className="flex-shrink-0 cursor-pointer"
                >
                  <UrgentPetCard
                    name={pet.name}
                    age={pet.age}
                    breed={pet.breed}
                    image={pet.image || "/jonnie.png"}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All pets grid */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[#E22726] text-xs font-bold uppercase tracking-[0.2em]">All Pets</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {regularPets.map(pet => (
              <div
                key={pet.id}
                onClick={() => handlePetClick(pet)}
                className={`relative rounded-3xl transition-transform ${
                  pet.status === "fostered"
                    ? "cursor-not-allowed"
                    : "cursor-pointer hover:scale-[1.02]"
                }`}
              >
                <ZoomedOutPetCard
                  name={pet.name}
                  age={pet.age}
                  breed={pet.breed}
                  image={pet.image || "/jonnie.png"}
                />
                {pet.status === "fostered" && (
                  <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold uppercase tracking-widest bg-[#E22726] px-4 py-2 rounded-full">
                      In Foster Home
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}