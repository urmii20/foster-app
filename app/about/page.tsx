"use client";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

const TEAM = [
  {
    name: "Dr. Priya Mehta",
    role: "Shelter Director",
    bio: "15 years of veterinary care across Mumbai's stray population.",
    emoji: "🐕",
  },
  {
    name: "Arun Sharma",
    role: "Foster Coordinator",
    bio: "Matches animals with the perfect foster families across Maharashtra.",
    emoji: "🐈",
  },
  {
    name: "Neha Kulkarni",
    role: "Volunteer Lead",
    bio: "Manages 60+ active volunteers and community outreach programmes.",
    emoji: "🐇",
  },
];

const STATS = [
  { value: "340+", label: "Animals Rescued" },
  { value: "120+", label: "Active Foster Families" },
  { value: "8 yrs", label: "Serving Mumbai" },
  { value: "95%", label: "Adoption Rate" },
];

export default function AboutPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    // POST to email API (non-blocking for demo)
    try {
      await fetch("/api/send-contact-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 600)); // UX delay
    setSubmitted(true);
    setSubmitting(false);
  };

  const inputClass =
    "w-full p-4 bg-[#F5F5EC] border-2 border-[#D9D9D9] rounded-2xl text-sm focus:border-[#E22726] outline-none transition-all";

  const CITIES = [
    "Mumbai", "Pune", "Nashik", "Nagpur", "Aurangabad",
    "Thane", "Navi Mumbai", "Kolhapur", "Solapur", "Other",
  ];

  return (
    <main className={`min-h-screen bg-[#F5F5EC] text-[#1E1E1E] ${breeSerif.className}`}>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="px-12 pt-4 pb-16">
        <span className="text-[#E22726] text-[11px] uppercase tracking-[0.3em] font-bold">
          Mumbai's Animal Shelter
        </span>
        <h1 className={`${irishGrover.className} text-[clamp(3.5rem,7vw,7rem)] text-[#1E1E1E] mt-2 leading-[1] mb-6`}>
          WHO WE ARE
        </h1>
        <div className="grid grid-cols-2 gap-12 max-w-5xl">
          <p className="text-[15px] text-[#444] leading-relaxed">
            We are Mumbai's dedicated animal fostering shelter, bridging the gap between animals in need and loving temporary homes across Maharashtra. Every animal that comes through our doors deserves safety, care, and a chance at a permanent family.
          </p>
          <p className="text-[15px] text-[#444] leading-relaxed">
            Founded in 2016, we have worked with the Brihanmumbai Municipal Corporation (BMC) and local NGOs to rescue, rehabilitate, and rehome stray and surrendered animals across the city. Fostering is our primary model — it gives animals the home environment they need to thrive.
          </p>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="px-12 py-12 bg-[#1E1E1E]">
        <div className="grid grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className={`${irishGrover.className} text-5xl text-[#E22726] mb-1`}>{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────────── */}
      <section className="px-12 py-16 grid grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-[#E22726] text-[11px] uppercase tracking-[0.3em] font-bold">Our Mission</span>
          <h2 className={`${irishGrover.className} text-5xl mt-2 mb-6`}>Every Paw Matters</h2>
          <p className="text-[15px] text-[#444] leading-relaxed mb-4">
            India has an estimated 35 million stray dogs and countless cats in urban areas. The challenge is immense — but fostering creates a distributed network of care that no single shelter can replicate alone.
          </p>
          <p className="text-[15px] text-[#444] leading-relaxed">
            We focus on Mumbai and the wider Maharashtra region, partnering with veterinary clinics, animal welfare organisations, and compassionate individuals who open their homes as temporary shelters.
          </p>
        </div>
        <div className="bg-[#FCEAEB] rounded-[2.5rem] p-10 flex flex-col gap-6">
          {[
            { icon: "🏠", title: "Home-Based Care", desc: "Animals thrive more in home environments than kennels." },
            { icon: "🩺", title: "Vet-Backed", desc: "All animals receive health checks before and after fostering." },
            { icon: "🤝", title: "Community-First", desc: "We train and support every foster family through the journey." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <p className="font-bold text-sm uppercase tracking-widest mb-1">{item.title}</p>
                <p className="text-sm text-[#666]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────── */}
      <section className="px-12 py-12 bg-white">
        <span className="text-[#E22726] text-[11px] uppercase tracking-[0.3em] font-bold">The People</span>
        <h2 className={`${irishGrover.className} text-5xl mt-2 mb-10`}>Our Team</h2>
        <div className="grid grid-cols-3 gap-8">
          {TEAM.map((member) => (
            <div key={member.name} className="bg-[#F5F5EC] rounded-[2rem] p-8 border-2 border-[#D9D9D9]">
              <div className="w-16 h-16 rounded-full bg-[#FCEAEB] flex items-center justify-center text-3xl mb-5">
                {member.emoji}
              </div>
              <p className={`${irishGrover.className} text-2xl mb-1`}>{member.name}</p>
              <p className="text-[#E22726] text-[11px] font-bold uppercase tracking-widest mb-3">{member.role}</p>
              <p className="text-sm text-[#666]">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────── */}
      <section className="px-12 py-16" id="contact">
        <div className="grid grid-cols-2 gap-16 max-w-5xl mx-auto">
          {/* Left: info */}
          <div>
            <span className="text-[#E22726] text-[11px] uppercase tracking-[0.3em] font-bold">Get In Touch</span>
            <h2 className={`${irishGrover.className} text-5xl mt-2 mb-8`}>Contact Us</h2>

            <div className="flex flex-col gap-6">
              {[
                {
                  icon: "📍",
                  label: "Address",
                  value: "47, Parel Road, Near Byculla Zoo, Mumbai — 400 012, Maharashtra",
                },
                {
                  icon: "📞",
                  label: "Phone",
                  value: "+91 98765 43210  (Mon–Sat, 9 AM – 6 PM IST)",
                },
                {
                  icon: "✉️",
                  label: "Email",
                  value: "hello@pawsheltermumbai.in",
                },
                {
                  icon: "🕐",
                  label: "Visiting Hours",
                  value: "Monday to Saturday · 10:00 AM – 5:00 PM IST",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#E22726] mb-0.5">{item.label}</p>
                    <p className="text-sm text-[#444]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div>
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 bg-white rounded-[2.5rem] p-10 border-2 border-[#D9D9D9]">
                <div className="w-16 h-16 rounded-full bg-[#FCEAEB] flex items-center justify-center text-3xl">🐾</div>
                <p className={`${irishGrover.className} text-3xl`}>Message Sent!</p>
                <p className="text-sm text-[#666]">We'll respond within 1–2 business days.</p>
                <button
                  onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", phone: "", city: "", message: "" }); }}
                  className="mt-4 border-2 border-[#E22726] text-[#E22726] px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#E22726] hover:text-white transition"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-[2.5rem] p-10 border-2 border-[#D9D9D9] flex flex-col gap-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 ml-1">Full Name *</label>
                    <input value={formData.name} onChange={set("name")} placeholder="e.g. Rahul Desai" className={inputClass} required />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 ml-1">Email *</label>
                    <input type="email" value={formData.email} onChange={set("email")} placeholder="you@example.com" className={inputClass} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 ml-1">Phone (WhatsApp)</label>
                    <input value={formData.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 ml-1">City</label>
                    <select value={formData.city} onChange={set("city")} className={inputClass}>
                      <option value="">Select city…</option>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 ml-1">Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={set("message")}
                    rows={5}
                    placeholder="Tell us what's on your mind…"
                    className={inputClass + " resize-none"}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#E22726] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#b31d1d] transition-all disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send Message →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}