"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bree_Serif, Irish_Grover } from "next/font/google";

const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });
const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });

export default function LandingPage() {
  const [isExpanding, setIsExpanding] = useState(false);
  const router = useRouter();

  const handleTap = () => {
    setIsExpanding(true);
    setTimeout(() => {
      router.push("/transition"); 
    }, 800);
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#E22726] text-[#F3F8F9]">
      <img 
        src="/landing-page.svg" 
        alt="Cat Background" 
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
      />

      {/* Full-screen grid overlay for structural alignment */}
      <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
  
      {/* Anchors text to start at column 6 and end at 12, pushed down by 35vh */}
      <div className={`col-start-6 col-end-12 pt-[35vh] flex flex-col items-end gap-3 z-10 pointer-events-auto ${irishGrover.className} leading-tight`}>

      <p className="text-[50px] tracking-wider">
      THE PURPOSE OF LIFE IS
      </p>
      <p className="text-[45px] tracking-wider mr-4 md:mr-8">
      TO TAKE CARE OF
      </p>
    
      <p className="text-[40px] tracking-widest uppercase mr-8 md:mr-16" style={{ wordSpacing: "0.2em" }}>
      LITTLE CREATURES
      </p>
  </div>
</div>

      {/* Enlarge ball to w-32 h-32 */}
      <motion.div
        className="absolute left-[45%] top-[74%] w-32 h-32 bg-[#FF9A9E] rounded-full cursor-pointer z-20 overflow-hidden shadow-lg"
        onClick={handleTap}
        initial={{ scale: 1 }}
        animate={isExpanding ? { scale: 60, opacity: 1, backgroundColor: "#FF9A9E" } : { y: [0, -15, 0] }}
        transition={
          isExpanding 
            ? { duration: 0.8, ease: "easeInOut" }
            : { repeat: Infinity, duration: 2, ease: "easeInOut" }
        }
      >
       <svg viewBox="26 26 138.5 138.5" fill="none" xmlns="http://www.w3.org/2000/svg"
       className="w-full h-full absolute inset-0 -rotate-[57.5deg]">
        {/* <circle cx="95.3236" cy="95.3236" r="69.0469" transform="rotate(-57.524 95.3236 95.3236)" fill="#FEA8B3"/> */}
        <path d="M27.0783 107.886C64.8444 74.3815 133.446 81.7922 123.5 158" stroke="#D9D9D9" strokeWidth="2"/>
        <path d="M83.8088 27.6873C79.3279 58.8754 117.904 103.531 162.736 84.2369" stroke="#D9D9D9" strokeWidth="2"/>
        <path d="M58.2392 153.567C113.414 107.242 129.072 81.6706 130.98 36.7438" stroke="#D9D9D9" strokeWidth="2"/>
      </svg>
      </motion.div>

      <div className="absolute bottom-8 w-full text-center z-10">
        <p className="text-xs tracking-widest uppercase font-bold ${breeSerif.className}">
          Tap the ball to begin
        </p>
      </div>
    </main>
  );
}