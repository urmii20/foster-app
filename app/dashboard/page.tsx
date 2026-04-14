"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  collection, onSnapshot, doc, setDoc, deleteDoc, query, where,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import UrgentPetCard from "../components/UrgentPetCard";
import ZoomedOutPetCard from "../components/ZoomedOutPetCard";
import PetModal from "../components/PetModal";
import ApprovalToast from "../components/ApprovalToast";
import OnboardingOverlay from "../components/OnboardingOverlay";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

type SortOption = "recently_added" | "name_az" | "age_asc";
const RECENTLY_VIEWED_KEY = "pawshelter_recent";
const MAX_RECENT = 4;

export default function Dashboard() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("All");
  const [sortOrder, setSortOrder] = useState<SortOption>("recently_added");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUid(user?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "pets"),
      (snap) => { setPets(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setError(null); },
      (err) => { console.error(err); setError("Connection lost. Data may be stale."); }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUid) return;
    const q = query(collection(db, "favorites"), where("userId", "==", currentUid));
    const unsub = onSnapshot(q, (snap) => {
      setFavorites(new Set(snap.docs.map((d) => d.data().petId as string)));
    });
    return () => unsub();
  }, [currentUid]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (raw) setRecentIds(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const saveRecentlyViewed = (petId: string) => {
    try {
      const prev: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
      const next = [petId, ...prev.filter((id) => id !== petId)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      setRecentIds(next);
    } catch (_) {}
  };

  const toggleFavorite = useCallback(
    async (e: React.MouseEvent, petId: string) => {
      e.stopPropagation();
      if (!currentUid) return;
      const ref = doc(db, "favorites", `${currentUid}_${petId}`);
      favorites.has(petId) ? await deleteDoc(ref) : await setDoc(ref, { userId: currentUid, petId, savedAt: new Date().toISOString() });
    },
    [currentUid, favorites]
  );

  const applyFiltersAndSort = useCallback((input: any[]) => {
    let r = [...input];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter((p) => p.name?.toLowerCase().includes(q) || p.breed?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q) || p.species?.toLowerCase().includes(q));
    }
    if (filterSpecies !== "All") r = r.filter((p) => p.species?.toLowerCase() === filterSpecies.toLowerCase());
    if (sortOrder === "name_az") r.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortOrder === "age_asc") r.sort((a, b) => (parseFloat(a.age) || 0) - (parseFloat(b.age) || 0));
    return r;
  }, [searchQuery, filterSpecies, sortOrder]);

  const urgentPets = applyFiltersAndSort(pets.filter((p) => p.isUrgent && p.status !== "fostered"));
  const regularPets = applyFiltersAndSort(pets.filter((p) => !p.isUrgent));
  const recentPets = recentIds.map((id) => pets.find((p) => p.id === id)).filter(Boolean);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    carouselRef.current.scrollLeft = scrollLeft - (e.pageX - carouselRef.current.offsetLeft - startX) * 2;
  };

  const handlePetClick = (pet: any) => {
    if (isDragging || pet.status === "fostered") return;
    saveRecentlyViewed(pet.id);
    setSelectedPet(pet);
  };

  const sortLabel: Record<SortOption, string> = {
    recently_added: "RECENTLY ADDED", name_az: "NAME A–Z", age_asc: "YOUNGEST FIRST",
  };
  const speciesOptions = ["All", "Dog", "Cat", "Rabbit", "Bird", "Other"];

  const Heart = ({ filled }: { filled: boolean }) => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={filled ? "#E22726" : "none"} stroke={filled ? "#E22726" : "#1E1E1E"} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  return (
    <main className={`min-h-screen bg-[#F5F5EC] text-[#1E1E1E] pb-20 relative ${breeSerif.className}`}>
      <OnboardingOverlay />
      <Navbar />
      {currentUid && <ApprovalToast userId={currentUid} />}
      <PetModal isOpen={!!selectedPet} onClose={() => setSelectedPet(null)} pet={selectedPet} />

      {error && (
        <div className="mx-12 mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-2xl text-sm font-bold uppercase tracking-widest text-center">{error}</div>
      )}

      {/* ── Search / Filter / Sort Bar ───────────────────────────── */}
      <div className="px-12 py-4 flex justify-between items-center border-b-2 border-t-2 border-[#D9D9D9] mb-12 gap-4">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH BY NAME, BREED OR CITY..."
          className="bg-transparent outline-none flex-1 text-xs font-bold tracking-widest uppercase placeholder:text-[#1E1E1E]/40" />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="text-[#E22726] text-xs font-bold uppercase tracking-widest hover:opacity-70 transition">CLEAR ✕</button>
        )}
        <div className="flex gap-3 text-xs font-bold tracking-widest">
          <div className="relative">
            <button onClick={() => { setShowFilterMenu((v) => !v); setShowSortMenu(false); }}
              className={`border-2 px-6 py-1.5 rounded-full transition-all ${filterSpecies !== "All" ? "border-[#E22726] text-[#E22726]" : "border-[#D9D9D9] bg-white hover:border-[#1E1E1E]"}`}>
              FILTER{filterSpecies !== "All" ? `: ${filterSpecies.toUpperCase()}` : ""}
            </button>
            {showFilterMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white border-2 border-[#D9D9D9] rounded-2xl shadow-xl z-40 overflow-hidden min-w-[160px]">
                {speciesOptions.map((opt) => (
                  <button key={opt} onClick={() => { setFilterSpecies(opt); setShowFilterMenu(false); }}
                    className={`w-full px-6 py-3 text-left text-xs font-bold tracking-widest uppercase transition hover:bg-[#F5F5EC] ${filterSpecies === opt ? "text-[#E22726]" : "text-[#1E1E1E]"}`}>
                    {opt === "All" ? "ALL ANIMALS" : opt}{filterSpecies === opt && " ✓"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { setShowSortMenu((v) => !v); setShowFilterMenu(false); }}
              className="border-2 border-[#D9D9D9] bg-white px-6 py-1.5 rounded-full hover:border-[#1E1E1E] transition-all">
              SORT: {sortLabel[sortOrder]}
            </button>
            {showSortMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white border-2 border-[#D9D9D9] rounded-2xl shadow-xl z-40 overflow-hidden min-w-[220px]">
                {(Object.entries(sortLabel) as [SortOption, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => { setSortOrder(key); setShowSortMenu(false); }}
                    className={`w-full px-6 py-3 text-left text-xs font-bold tracking-widest uppercase transition hover:bg-[#F5F5EC] ${sortOrder === key ? "text-[#E22726]" : "text-[#1E1E1E]"}`}>
                    {label}{sortOrder === key && " ✓"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(showFilterMenu || showSortMenu) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowFilterMenu(false); setShowSortMenu(false); }} />
      )}

      <div className="flex flex-col gap-16">
        {/* ── Urgent ──────────────────────────────────────────────── */}
        <section className="w-full">
          <h2 className="px-12 text-sm font-bold mb-4 uppercase tracking-widest">
            Urgent Foster Cases
            {urgentPets.length === 0 && (
              <span className="ml-3 text-[#999] normal-case tracking-normal font-normal text-xs">
                {searchQuery || filterSpecies !== "All" ? "No matches" : "None at the moment"}
              </span>
            )}
          </h2>
          {urgentPets.length > 0 && (
            <div className="w-full bg-[#FCEAEB] py-8 pl-12 border-y border-[#D9D9D9]/50">
              <div ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={() => setIsDragging(false)}
                onMouseUp={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
                className={`flex gap-6 overflow-x-auto pb-4 pr-12 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDragging ? "cursor-grabbing" : "cursor-grab snap-x snap-mandatory"}`}>
                {urgentPets.map((pet) => (
                  <div key={pet.id} className="relative flex-shrink-0">
                    <div onClick={() => handlePetClick(pet)} className="cursor-pointer">
                      <UrgentPetCard name={pet.name} location={pet.location} time={pet.age || pet.duration} image={pet.image || "/jonnie.png"} />
                    </div>
                    <button onClick={(e) => toggleFavorite(e, pet.id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10">
                      <Heart filled={favorites.has(pet.id)} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Regular pets grid ──────────────────────────────────── */}
        <section className="px-12">
          <h2 className="text-sm font-bold mb-6 uppercase tracking-widest">Find Your Next Friend</h2>
          {regularPets.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <div className="w-32 h-32 bg-[#FCEAEB] rounded-full flex items-center justify-center">
                  <span className="text-6xl">{searchQuery ? "🔍" : filterSpecies === "Cat" ? "🐱" : filterSpecies === "Dog" ? "🐕" : "🐾"}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full border-2 border-[#D9D9D9] flex items-center justify-center text-xl">
                  {searchQuery ? "❓" : "😴"}
                </div>
              </div>
              <div>
                <p className={`${irishGrover.className} text-3xl text-[#1E1E1E] mb-2`}>
                  {searchQuery ? `No pets matching "${searchQuery}"` :
                   filterSpecies !== "All" ? `No ${filterSpecies}s available right now` : "No pets available right now"}
                </p>
                <p className="text-sm text-[#999]">
                  {searchQuery || filterSpecies !== "All"
                    ? "Try clearing your filters — new rescues arrive regularly."
                    : "Check back soon — we rescue new animals every week."}
                </p>
              </div>
              {(searchQuery || filterSpecies !== "All") && (
                <button onClick={() => { setSearchQuery(""); setFilterSpecies("All"); }}
                  className="border-2 border-[#E22726] text-[#E22726] px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#E22726] hover:text-white transition-all">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-8">
              {regularPets.map((pet) => (
                <div key={pet.id} className="relative group">
                  <div onClick={() => handlePetClick(pet)}
                    className={`relative transition-transform ${pet.status === "fostered" ? "cursor-not-allowed" : "cursor-pointer hover:scale-[1.02]"}`}>
                    <ZoomedOutPetCard name={pet.name} age={pet.age} breed={pet.breed} image={pet.image || "/jonnie.png"} />
                    {pet.status === "fostered" && (
                      <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center">
                        <span className="text-white text-[11px] font-bold uppercase tracking-widest bg-[#E22726] px-4 py-2 rounded-full">In Foster Home</span>
                      </div>
                    )}
                  </div>
                  <button onClick={(e) => toggleFavorite(e, pet.id)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-10">
                    <Heart filled={favorites.has(pet.id)} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Recently Viewed ────────────────────────────────────── */}
        {recentPets.length > 0 && (
          <section className="px-12 pb-4">
            <h2 className="text-sm font-bold mb-5 uppercase tracking-widest text-[#999]">Recently Viewed</h2>
            <div className="flex gap-4 flex-wrap">
              {recentPets.map((pet: any) => (
                <div key={pet.id} onClick={() => handlePetClick(pet)}
                  className={`group flex items-center gap-4 bg-white border-2 border-[#D9D9D9] rounded-2xl px-5 py-3 flex-shrink-0 transition-all ${pet.status === "fostered" ? "opacity-50 cursor-not-allowed" : "hover:border-[#E22726] cursor-pointer hover:shadow-md"}`}>
                  <img src={pet.image || "/jonnie.png"} alt={pet.name} className="w-10 h-10 rounded-full object-cover border-2 border-[#F5F5EC]" />
                  <div>
                    <p className={`${irishGrover.className} text-lg leading-tight`}>{pet.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#999]">{pet.breed || pet.species || "Mixed"}</p>
                  </div>
                  {pet.status === "fostered" && (
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-[#FCEAEB] text-[#E22726] px-2 py-0.5 rounded-full">Fostered</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}