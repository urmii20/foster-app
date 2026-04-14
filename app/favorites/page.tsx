"use client";
import { useEffect, useState, useCallback } from "react";
import {
  collection, query, where, onSnapshot,
  doc, getDoc, deleteDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import PetModal from "../components/PetModal";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

export default function FavoritesPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [favPets, setFavPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!uid) { setFavPets([]); setLoading(false); return; }

    const q = query(collection(db, "favorites"), where("userId", "==", uid));
    const unsub = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) { setFavPets([]); setLoading(false); return; }
        const petIds = snap.docs.map((d) => d.data().petId as string);
        const petDocs = await Promise.all(petIds.map((id) => getDoc(doc(db, "pets", id))));
        setFavPets(petDocs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { console.error("Favorites listener:", err); setLoading(false); }
    );
    return () => unsub();
  }, [uid, authLoading]);

  const removeFavorite = useCallback(
    async (e: React.MouseEvent, petId: string) => {
      e.stopPropagation();
      if (!uid || removingId) return;
      setRemovingId(petId);
      try {
        await deleteDoc(doc(db, "favorites", `${uid}_${petId}`));
      } catch (err) {
        console.error("Remove favorite:", err);
      }
      setRemovingId(null);
    },
    [uid, removingId]
  );

  return (
    <main className={`min-h-screen bg-[#F5F5EC] text-[#1E1E1E] pb-20 ${breeSerif.className}`}>
      <Navbar />
      <PetModal isOpen={!!selectedPet} onClose={() => setSelectedPet(null)} pet={selectedPet} />

      <div className="px-12 pt-4">
        <span className="text-[#E22726] text-[11px] uppercase tracking-[0.3em] font-bold">Your Saved Pets</span>
        <h1 className={`${irishGrover.className} text-6xl text-[#1E1E1E] mt-2 mb-10`}>Favourites</h1>

        {(authLoading || loading) ? (
          <div className="py-20 text-center text-[#999] text-sm font-bold uppercase tracking-widest animate-pulse">Loading…</div>
        ) : !uid ? (
          <div className="py-24 flex flex-col items-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-[#FCEAEB] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="#E22726" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <p className={`${irishGrover.className} text-3xl mb-2`}>Sign in to see favourites</p>
            <a href="/login" className="border-2 border-[#E22726] text-[#E22726] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#E22726] hover:text-white transition-all">Sign In →</a>
          </div>
        ) : favPets.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-[#FCEAEB] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="#E22726" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div>
              <p className={`${irishGrover.className} text-3xl mb-2`}>No favourites yet</p>
              <p className="text-sm text-[#999]">Tap the ♥ on any pet to save them here.</p>
            </div>
            <a href="/dashboard" className="mt-2 border-2 border-[#E22726] text-[#E22726] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#E22726] hover:text-white transition-all">Browse Pets →</a>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            {favPets.map((pet) => (
              <div key={pet.id} className="group relative bg-white rounded-[2rem] overflow-hidden border border-[#D9D9D9] shadow-sm hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="relative h-52 overflow-hidden bg-[#F5F5EC]">
                  <img src={pet.image || "/jonnie.png"} alt={pet.name} className="w-full h-full object-cover" />
                  {pet.status === "fostered" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-[11px] font-bold uppercase tracking-widest bg-[#E22726] px-4 py-2 rounded-full">In Foster Home</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => removeFavorite(e, pet.id)}
                    disabled={removingId === pet.id}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={removingId === pet.id ? "none" : "#E22726"} stroke="#E22726" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`${irishGrover.className} text-2xl`}>{pet.name}</h3>
                    {pet.isUrgent && <span className="text-[10px] font-bold uppercase tracking-widest bg-[#FCEAEB] text-[#E22726] px-3 py-1 rounded-full">Urgent</span>}
                  </div>
                  <p className="text-xs text-[#999] font-bold uppercase tracking-widest mb-1">{pet.breed || pet.species}</p>
                  {pet.location && <p className="text-xs text-[#999]">📍 {pet.location}</p>}
                  <button
                    onClick={() => { if (pet.status !== "fostered") setSelectedPet(pet); }}
                    disabled={pet.status === "fostered"}
                    className={`mt-5 w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${pet.status === "fostered" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#1E1E1E] text-white hover:bg-[#E22726]"}`}
                  >
                    {pet.status === "fostered" ? "Currently Fostered" : "View & Apply →"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}