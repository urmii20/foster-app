"use client";
import { useState } from "react";
import { auth } from "../../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

export default function ShelterLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/shelter/dashboard");
    } catch (err: any) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <main className={`min-h-screen bg-[#F5F5EC] flex items-center justify-center p-6 ${breeSerif.className} font-normal`}>
      <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100">
        
        <header className="text-center mb-10">
          <span className="text-[#E22726] text-[14px] uppercase tracking-[0.3em]">Staff Access</span>
          <h1 className={`${irishGrover.className} text-5xl text-[#1E1E1E] mt-4`}>SHELTER LOGIN</h1>
        </header>

        <form onSubmit={handleLogin} className="space-y-8">
          <div>
            <label className="block text-[16px] uppercase tracking-widest text-black mb-3 ml-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-8 py-5 bg-[#F5F5EC] rounded-2xl border-none focus:ring-2 focus:ring-[#E22726] text-[18px] text-[#1E1E1E] transition-all placeholder:text-gray-400"
              placeholder="admin@shelter.com"
              required
            />
          </div>

          <div>
            <label className="block text-[16px] uppercase tracking-widest text-black mb-3 ml-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-8 py-5 bg-[#F5F5EC] rounded-2xl border-none focus:ring-2 focus:ring-[#E22726] text-[18px] text-[#1E1E1E] transition-all  placeholder:text-gray-400"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-[#E22726] text-sm text-center font-bold">{error}</p>}

          <button 
            type="submit"
            className="w-full py-6 bg-[#E22726] text-white rounded-2xl text-[18px] tracking-[0.2em] hover:bg-[#b31d1d] transition-all shadow-lg uppercase"
          >
            Enter Shelter
          </button>
        </form>

        <p className="text-center mt-10 text-gray-400 text-sm">
          Forgot password? Contact system administrator.
        </p>
      </div>
    </main>
  );
}