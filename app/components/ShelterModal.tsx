"use client";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

export default function ShelterModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-sm">
      
      {/* Invisible backdrop layer to click and close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      {/* The Sliding Sidebar - Wide, square corners, professional */}
      <div className={`relative w-full max-w-2xl h-full bg-[#F5F5EC] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-300 ${breeSerif.className}`}>
        
        {/* Close Button - Placed over the image for a clean look */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-20 bg-white/50 hover:bg-white text-[#1E1E1E] w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all font-sans shadow-sm"
        >
          ✕
        </button>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          
          {/* TOP HALF: Space for Shelter Image */}
          <div className="w-full h-72 md:h-80 bg-[#E6E6DC] relative shrink-0 flex items-center justify-center border-b border-gray-300">
            <span className="text-gray-400 font-bold tracking-widest uppercase text-sm">
              [ Shelter Image Space ]
            </span>
          </div>

          {/* BOTTOM HALF: Info Layout matching your screenshot */}
          <div className="p-10 md:p-14 text-[#1E1E1E] flex flex-col">
            
            <h2 className={`${irishGrover.className} text-4xl md:text-5xl text-center mb-6 tracking-wide leading-tight`}>
              THE ARC ANIMAL PROJECT
            </h2>

            <p className="text-[#E22726] font-bold text-[13px] md:text-sm uppercase tracking-widest leading-relaxed text-center mb-10 max-w-lg mx-auto">
              Helping foster animals with local volunteers to provide medical care & safe foster homes since 2014.
            </p>

            <hr className="border-black/20 mb-10 w-full" />

            {/* Contact Info Block */}
            <div className="space-y-4  text-sm tracking-wider uppercase mb-12">
              <p className="leading-relaxed text-[#463939]">
                <strong className="mr-2 text-[#1E1E1E]">ADDRESS:</strong> 
                ARC ANIMAL SHELTER 45 PAWS AVENUE, PHASE 2 KOREGAON PARK, MUMBAI MAHARASHTRA 4010303
              </p>
              
              <p className="leading-relaxed lowercase">
                <strong className="mr-2 uppercase">EMAIL:</strong> 
                arc@shelter.com
              </p>

              {/* Social Icons positioned directly below email */}
              <div className="flex gap-5 pt-3">
                <a href="tel:+919876543210" className="text-2xl hover:text-[#E22726] transition-colors hover:-translate-y-1 transform">📞</a>
                <a href="https://instagram.com" className="text-2xl hover:text-[#E22726] transition-colors hover:-translate-y-1 transform">📸</a>
              </div>
            </div>

            {/* About Us */}
            <div className="mb-10">
              <h3 className="font-bold text-lg mb-4 uppercase tracking-widest">ABOUT US</h3>
              <p className="leading-relaxed text-[15px] uppercase text-justify tracking-wide text-[#463939]/90">
                At ARC Animal Shelter, we believe every animal deserves a second chance at a happy, healthy life. Founded in the heart of Mumbai, our mission is to rescue, rehabilitate, and rehome stray and abandoned animals who have nowhere else to turn. We are a volunteer-driven, no-kill facility dedicated to providing medical care, behavioral training, and a safe haven until our furry residents find their forever families. Through community education and our short-term foster programs, we aim to bridge the gap between street survival and loving homes. Whether it is an urgent medical rescue or simply providing a warm bed and a full belly, we are committed to being the voice for those who cannot speak for themselves.
              </p>
            </div>

          </div>
        </div>

      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}