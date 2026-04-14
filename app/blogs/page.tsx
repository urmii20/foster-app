"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif   = Bree_Serif({ weight: "400", subsets: ["latin"] });

const blogTitleStyle: React.CSSProperties = {
  fontFamily: "'Britannic Bold', serif",
  fontSize: 96,
  lineHeight: 1,
  color: "#E22726",
};

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
      <circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/>
      <circle cx="6" cy="11" r="1.7"/><circle cx="18" cy="11" r="1.7"/>
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

const BG      = ["#F4CED3", "#F4CED3", "#F4CED3"];
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

const L_LEFT_EMOJIS   = ["🐶", "🐱", "🐕", "🐈"];
const L_BOTTOM_EMOJIS = ["🐾", "🦮", "🐩", "🐕‍🦺"];

function EmojiTile({ emoji, delay }: { emoji: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 14 }}
      className="w-[100px] h-[100px] rounded-2xl flex items-center justify-center text-4xl shadow-sm"
      style={{ backgroundColor: "#FCE7EA", border: "2px solid #F8BBD0" }}
    >
      {emoji}
    </motion.div>
  );
}

export default function BlogsPage() {
  const [active, setActive] = useState(0);
  const groupRot = (1 - active) * 60;

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden ${breeSerif.className}`}
      style={{ backgroundColor: BG[active], transition: "background-color 0.5s" }}
    >
      {/* ── Disk Navigation (UNCHANGED) ─────────────────────────── */}
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

      {/* ── Content Area ────────────────────────────────────────── */}
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

            {/* ════════════════════════════════════════════════════════
                BLOG 1 — FOSTER vs ADOPTION
                Both cards white, "Fostering" / "Adoption" highlighted
                ════════════════════════════════════════════════════════ */}
            {active === 0 && (
              <>
                <h1 className="text-center mb-8" style={blogTitleStyle}>
                  FOSTER vs ADOPTION
                </h1>
                <div className="grid grid-cols-2 gap-5">
                  {/* Left Card — Foster */}
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <div className="p-8 pb-52">
                      <div className="flex flex-col gap-3 text-[15px] text-[#2A2A2A] leading-relaxed">
                        <p><span className="text-[#E22726] text-[20px] font-bold">Fostering</span> is providing a temporary home for animals awaiting permanent adoption.</p>
                        <p>To give animals a safe space to recover, socialize, and thrive outside a stressful shelter environment.</p>
                        <br />
                        <p className="text-[#999] italic text-sm">Myth: &ldquo;I&rsquo;ll get too attached.&rdquo;</p>
                        <p><strong>Fact:</strong> While saying goodbye is hard, fostering allows you to help many animals, and some foster parents eventually adopt their fosters.</p>
                        <br />
                        <p className="text-[#999] italic text-sm">Myth: &ldquo;Fostering is too expensive.&rdquo;</p>
                        <p><strong>Fact:</strong> Rescues usually cover food and veterinary costs.</p>
                      </div>
                    </div>
                    <img
                      src="/blog-girl-yellow.png"
                      alt="Girl with cat"
                      className="absolute bottom-0 left-0 w-48 object-contain"
                      style={{ maxHeight: 200 }}
                    />
                  </div>

                  {/* Right Card — Adoption */}
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <img
                      src="/blog-girl-red.png"
                      alt="Girl with cat"
                      className="absolute top-0 right-0 w-48 object-contain"
                      style={{ maxHeight: 200 }}
                    />
                    <div className="p-8" style={{ paddingTop: 200 }}>
                      <div className="flex flex-col gap-3 text-[15px] text-[#2A2A2A] leading-relaxed">
                        <p><span className="text-[#E22726] text-[20px] font-bold">Adoption</span> is legally taking ownership of a pet for the rest of its life.</p>
                        <p>Providing a permanent family and loving environment for a pet.</p>
                        <br />
                        <p className="text-[#999] italic text-sm">Myth: &ldquo;Shelter animals are damaged.&rdquo;</p>
                        <p><strong>Fact:</strong> Most animals are in shelters due to human circumstances, like housing issues or allergies, not behavioral issues.</p>
                        <br />
                        <p className="text-[#999] italic text-sm">Myth: &ldquo;Adopting takes too long.&rdquo;</p>
                        <p><strong>Fact:</strong> The process is designed to ensure a good match, not to be a hurdle.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════════════════
                BLOG 2 — EMOTIONAL REWARDS OF FOSTERING
                ════════════════════════════════════════════════════════ */}
            {active === 1 && (
              <div className="flex flex-col w-full">
                <h1 className="leading-[1.1] text-left mb-8" style={blogTitleStyle}>
                  EMOTIONAL REWARDS<br />OF FOSTERING
                </h1>

                <div className="flex gap-8 w-full items-stretch">
                  <div className="flex flex-col gap-5 w-[45%] max-w-[500px] flex-shrink-0">
                    <div className="flex-1 rounded-[1.5rem] p-7 flex flex-col justify-center gap-3 shadow-sm bg-white border border-[#E0E0E0]">
                      <p className="text-[17px] font-bold text-[#2A2A2A] leading-snug">
                        Fostering gives animals a safe and loving environment outside of a shelter.
                      </p>
                      <p className="text-[15px] text-[#888] leading-snug italic">
                        &ldquo;For dogs who lived their whole life in a kennel, a few hours of romping freely in a backyard and cuddling on someone&rsquo;s lap is a blessing.&rdquo;
                      </p>
                    </div>

                    <div
                      className="flex-1 rounded-[1.5rem] p-7 flex flex-col justify-center gap-3 shadow-sm bg-white"
                    >
                      <p className="text-[17px] font-bold text-[#2A2A2A] leading-snug">
                        Fostering can significantly improve an animal&rsquo;s chances of adoption by socializing them and providing potential adopters with valuable insights.
                      </p>
                      <p className="text-[15px] text-[#888] leading-snug italic">
                        &ldquo;Studies have shown that even a few hours away from the shelter makes a dog 5x more likely to be adopted.&rdquo;
                      </p>
                    </div>
                  </div>

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
                      paddingRight: "calc(2rem + 60px)",
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

            {/* ════════════════════════════════════════════════════════
                BLOG 3 — NO TIME? TRY SHORT TERM FOSTERING
                ════════════════════════════════════════════════════════ */}
            {active === 2 && (
              <div className="flex flex-col w-full">
                <h1 className="text-left mb-10" style={blogTitleStyle}>
                  NO TIME? TRY SHORT<br />TERM FOSTERING
                </h1>

                <div className="flex gap-4 items-start">
                  <div className="flex flex-col gap-3 flex-shrink-0">
                    {L_LEFT_EMOJIS.map((emoji, i) => (
                      <EmojiTile key={`left-${i}`} emoji={emoji} delay={i * 0.07} />
                    ))}
                  </div>

                  <div className="flex flex-col gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="rounded-xl bg-white p-10"
                      style={{ border: "3px solid #4A90D9", maxWidth: 560 }}
                    >
                      <div className="flex flex-col gap-6 text-[16px] text-[#2A2A2A] leading-relaxed">
                        <p>
                          Fostering does not always require a long-term commitment. Even a few hours or days in a home environment can improve an animal&rsquo;s mental well-being.
                        </p>
                        <p>
                          It is a great option for people with busy schedules who still want to help.
                        </p>
                        <p>
                          Short-term fostering allows you to contribute without long-term responsibility. It can also be a good way to ease into fostering for the first time.
                        </p>
                      </div>
                    </motion.div>

                    <div className="flex gap-3">
                      {L_BOTTOM_EMOJIS.map((emoji, i) => (
                        <EmojiTile key={`bottom-${i}`} emoji={emoji} delay={0.3 + i * 0.07} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}