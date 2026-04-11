"use client";
import { useState } from "react";
import { auth } from "../../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Irish_Grover, Bree_Serif } from "next/font/google";
 
const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });
 
/**
 * WHY THIS FILE CHANGED
 * ──────────────────────
 * Same root problem as the user login — no session cookie, so middleware
 * had nothing to read. Anyone who knew the URL could access shelter routes.
 *
 * This page sets role="shelter_admin" in the session cookie.
 * Middleware sees that role and blocks regular users from /shelter/* routes.
 *
 * The shelter login intentionally has NO sign-up option — shelter accounts
 * are created manually by the system administrator in Firebase Console.
 * This prevents anyone from self-registering as a shelter admin.
 */
 
export default function ShelterLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
 
    try {
      // Step 1: Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
 
      // Step 2: Set session cookie with shelter_admin role
      // Middleware uses this role to block regular users from /shelter/* routes.
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, role: "shelter_admin" }),
      });
 
      if (!res.ok) throw new Error("Failed to create session");
 
      // Step 3: Navigate AFTER cookie is set
      router.push("/shelter/dashboard");
 
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid credentials. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        setError("No shelter account found with this email.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a few minutes.");
      } else {
        setError("Something went wrong. Please try again.");
        console.error(err);
      }
    } finally {
      setLoading(false);
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
            <label className="block text-[16px] uppercase tracking-widest text-black mb-3 ml-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-8 py-5 bg-[#F5F5EC] rounded-2xl border-none focus:ring-2 focus:ring-[#E22726] text-[18px] text-[#1E1E1E] transition-all placeholder:text-gray-400 outline-none"
              placeholder="admin@shelter.com"
              autoComplete="email"
              required
            />
          </div>
 
          <div>
            <label className="block text-[16px] uppercase tracking-widest text-black mb-3 ml-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-8 py-5 bg-[#F5F5EC] rounded-2xl border-none focus:ring-2 focus:ring-[#E22726] text-[18px] text-[#1E1E1E] transition-all placeholder:text-gray-400 outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
 
          {error && (
            <p className="text-[#E22726] text-sm text-center font-bold">{error}</p>
          )}
 
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-6 rounded-2xl text-[18px] tracking-[0.2em] uppercase transition-all shadow-lg font-bold ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#E22726] text-white hover:bg-[#b31d1d]"
            }`}
          >
            {loading ? "Verifying..." : "Enter Shelter"}
          </button>
        </form>
 
        <p className="text-center mt-10 text-gray-400 text-sm">
          Forgot password? Contact system administrator.
        </p>
      </div>
    </main>
  );
}