"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif   = Bree_Serif({ weight: "400", subsets: ["latin"] });

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? "#E22726" : "#C0C0C0"} strokeWidth="1.6" width="30" height="30">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function PawIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? "#E22726" : "#C0C0C0"} strokeWidth="1.6" width="30" height="30">
      <circle cx="9"  cy="6"  r="1.7"/>
      <circle cx="15" cy="6"  r="1.7"/>
      <circle cx="6"  cy="11" r="1.7"/>
      <circle cx="18" cy="11" r="1.7"/>
      <path d="M12 22c-3 0-7-3-7-7 0-2 1.5-3.5 3.5-4h7c2 .5 3.5 2 3.5 4 0 4-4 7-7 7z"/>
    </svg>
  );
}
function HourglassIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? "#E22726" : "#C0C0C0"} strokeWidth="1.6" width="30" height="30">
      <path d="M5 2h14M5 22h14M6 2v4l6 6-6 6v4M18 2v4l-6 6 6 6v4"/>
    </svg>
  );
}

const BG      = ["#FFF0F2", "#FCF6F6", "#EBF5EB"];
const CARD_BG = "#F5F0E8";

const DISK_DIAMETER = 580; 
const DISK_R        = DISK_DIAMETER / 2;
const DISK_CX       = -100;                
const INNER_R       = 210;                

const BTN_ANGLES_DEG = [-60, 0, 60];
const BTNS = BTN_ANGLES_DEG.map(deg => ({
  deg,
  rad: (deg * Math.PI) / 180,
}));

const CONTENT_LEFT = DISK_CX + DISK_R + 80; 

export default function BlogsPage() {
  const [active, setActive] = useState(0);
  const groupRot = (1 - active) * 60;

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden ${breeSerif.className}`}
      style={{ backgroundColor: BG[active], transition: "background-color 0.5s" }}
    >
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 20 }}>
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width:  DISK_DIAMETER,
            height: DISK_DIAMETER,
            left:   DISK_CX - DISK_R,
            top:    `calc(50vh - ${DISK_R}px)`,
            backgroundColor: "rgba(255,255,255,0.28)",
            border: "1.5px solid rgba(190,130,140,0.35)",
          }}
          animate={{ rotate: groupRot }}
          transition={{ type: "spring", stiffness: 70, damping: 15 }}
        >
          {BTNS.map((btn, i) => (
            <motion.button
              key={i}
              onClick={() => setActive(i)}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.07 }}
              animate={{ rotate: -groupRot }} 
              transition={{ type: "spring", stiffness: 70, damping: 15 }}
              className="absolute flex items-center justify-center rounded-full pointer-events-auto"
              style={{
                width:  76, 
                height: 76, 
                left:   DISK_R + INNER_R * Math.cos(btn.rad) - 38, 
                top:    DISK_R + INNER_R * Math.sin(btn.rad) - 38, 
                backgroundColor: "#FFFFFF",
                border: active === i ? "3px solid #E22726" : "2px solid #DDDDDD",
                boxShadow: active === i ? "0 0 0 8px rgba(226,39,38,0.12)" : "0 4px 14px rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
            >
              {i === 0 && <HeartIcon     active={active === 0} />}
              {i === 1 && <PawIcon       active={active === 1} />}
              {i === 2 && <HourglassIcon active={active === 2} />}
            </motion.button>
          ))}
        </motion.div>
      </div>

      <div
        className="flex flex-col min-h-screen justify-center"
        style={{
          marginLeft:    CONTENT_LEFT,
          paddingRight:  60, 
          paddingTop:    44,
          paddingBottom: 60,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* ── Blog 1 ─────────────────── */}
            {active === 0 && (
              <>
                <h1
                  className={`${irishGrover.className} text-center mb-8`}
                  style={{ fontSize: "clamp(3rem, 5.5vw, 5.5rem)", color: "#E22726", lineHeight: 1 }}
                >
                  FOSTER vs ADOPTION
                </h1>
                <div className="grid grid-cols-2 gap-5">
                  <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: CARD_BG, minHeight: 520 }}>
                    <div className="p-8 pb-48">
                      <div className="flex flex-col gap-3 text-[15px] text-[#2A2A2A] leading-relaxed">
                        <p>Fostering is providing a temporary home for animals awaiting permanent adoption.</p>
                        <p>To give animals a safe space to recover, socialize, and thrive outside a stressful shelter environment.</p>
                        <br />
                        <p className="text-[#999] italic text-sm">Myth: "I'll get too attached."</p>
                        <p>Fact: While saying goodbye is hard, fostering allows you to help many animals, and some foster parents eventually adopt their fosters.</p>
                      </div>
                    </div>
                    <img src="/blog-girl-yellow.png" alt="Girl with cat" className="absolute bottom-0 left-0 w-52 object-contain" style={{ maxHeight: 220 }} />
                  </div>
                  <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: CARD_BG, minHeight: 520 }}>
                    <img src="/blog-girl-red.png" alt="Girl with cat" className="absolute top-0 right-0 w-56 object-contain" style={{ maxHeight: 240 }} />
                    <div className="p-8" style={{ paddingTop: 240 }}>
                      <div className="flex flex-col gap-3 text-[15px] text-[#2A2A2A] leading-relaxed">
                        <p>Adoption is legally taking ownership of a pet for the rest of its life.</p>
                        <p>Providing a permanent family and loving environment for a pet.</p>
                        <br />
                        <p className="text-[#999] italic text-sm">Myth: "Shelter animals are damaged."</p>
                        <p>Fact: Most animals are in shelters due to human circumstances, like housing issues or allergies, not behavioral issues.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Blog 2 ─────────────────── */}
            {active === 1 && (
              <div className="flex flex-col w-full">
                {/* Title perfectly matched to Blog 1's size */}
                <h1
                  className={`${irishGrover.className} leading-[1.1] text-left mb-8 whitespace-nowrap`}
                  style={{ fontSize: "clamp(3rem, 5.5vw, 5.5rem)", color: "#E22726" }}
                >
                  EMOTIONAL REWARDS<br />OF FOSTERING
                </h1>

                <div className="flex gap-10 h-[480px] w-full items-stretch">
                  
                  {/* Left Column: Cards */}
                  <div className="flex flex-col gap-5 w-[45%] max-w-[460px] flex-shrink-0 h-full">
                    {[
                      {
                        q: `"Fostering gives animals a safe and loving environment outside of a shelter."`,
                        s: `"For dogs who lived their whole life in a kennel, a few hours of romping freely in a backyard and cuddling on someone's lap is a blessing."`,
                      },
                      {
                        q: "Fostering can significantly improve an animal's chances of adoption by socialising them and providing potential adopters with valuable insights.",
                        s: `"Studies have shown that even a few hours away from the shelter makes a dog 5x more likely to be adopted."`,
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex-1 rounded-[1.5rem] p-7 flex flex-col justify-center gap-2 shadow-sm bg-white">
                        <p className="text-[15px] font-bold text-[#2A2A2A] leading-snug italic">{item.q}</p>
                        <p className="text-[14px] text-[#888] leading-snug italic">{item.s}</p>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: object-contain prevents cropping, padding ensures pink border remains visible */}
                  <motion.div 
                    initial={{ x: 60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="flex-grow flex items-center justify-center overflow-hidden shadow-sm" 
                    style={{ 
                      backgroundColor: "#FCE7EA", 
                      borderTopLeftRadius: "60px",
                      borderBottomLeftRadius: "60px",
                      borderTopRightRadius: "0px",    
                      borderBottomRightRadius: "0px", 
                      marginRight: "-60px",
                      padding: "2rem",
                      paddingRight: "calc(2rem + 60px)" // Adds extra right padding to visually center the image despite the negative margin
                    }}
                  >
                    <img 
                      src="/foster-collage.png" 
                      alt="Fostering collage" 
                      className="w-full h-full object-contain rounded-[1.5rem] shadow-sm" 
                    />
                  </motion.div>
                </div>
              </div>
            )}

            {/* ── Blog 3 ─────────────────── */}
            {active === 2 && (
              <>
                <h1
                  className={`${irishGrover.className} text-center mb-8`}
                  style={{ fontSize: "clamp(2rem, 3.8vw, 4rem)", color: "#1E7A1E", lineHeight: 1 }}
                >
                  PREPARING YOUR HOME<br />FOR A FOSTER PET
                </h1>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { n: "01", h: "Create a safe space",    b: "Set up a quiet, contained area with bedding, water, and a few toys. New animals need a calm zone to decompress before exploring the whole home." },
                    { n: "02", h: "Pet-proof your space",    b: "Secure loose wires, remove toxic plants, and block off areas that could be dangerous. Think at the animal's eye level — what can be chewed, knocked over, or escaped through." },
                    { n: "03", h: "Speak to your household", b: "Make sure everyone at home is aligned on rules — no feeding from the table, who handles feeding time, and how to greet the animal calmly on arrival." },
                    { n: "04", h: "Stock up on supplies",    b: "Your shelter will usually provide food and medical costs. But having a collar, leash, food bowls, and a basic first-aid kit on hand makes the first day much smoother." },
                  ].map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="rounded-xl p-6 flex flex-col gap-2"
                      style={{ backgroundColor: CARD_BG, minHeight: "250px" }}
                    >
                      <span className={`${irishGrover.className} text-4xl`} style={{ color: "#1E7A1E" }}>{s.n}</span>
                      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A2A2A]">{s.h}</h3>
                      <p className="text-[15px] text-[#2A2A2A] leading-relaxed">{s.b}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}