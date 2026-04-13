"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { Irish_Grover, Bree_Serif } from "next/font/google";
 
const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });
 
 
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");   // where to send them after login
 
  const [mode, setMode] = useState<"choose" | "user">("choose");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
 
  const handleUserAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
 
    try {
      // Step 1: Firebase authentication
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
 
      const uid = userCredential.user.uid;
 
      // Step 2: Set the server-side session cookie (role = "user")
      // This is what middleware reads to protect routes.
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, role: "user" }),
      });
 
      if (!res.ok) throw new Error("Failed to create session");
 
      // Step 3: Navigate AFTER the cookie is set (no race condition)
      const destination = redirectTo || "/dashboard";
      router.push(destination);
 
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Try logging in.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email. Try signing up.");
      } else {
        setError("Something went wrong. Please try again.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };
 
  // ── STEP 1: Choose who you are ─────────────────────────────────────────────
 
  if (mode === "choose") {
    return (
      <main className={`min-h-screen bg-[#F5F5EC] flex flex-col items-center justify-center p-6 ${breeSerif.className}`}>
        <div className="w-full max-w-lg text-center mb-12">
          <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em] font-bold">Welcome Back</span>
          <h1 className={`${irishGrover.className} text-6xl text-[#1E1E1E] mt-4`}>Who Are You?</h1>
        </div>
 
        <div className="w-full max-w-lg flex flex-col gap-5">
          <button
            onClick={() => setMode("user")}
            className="w-full p-10 bg-white rounded-[2.5rem] border-2 border-[#D9D9D9] hover:border-[#E22726] hover:shadow-xl transition-all text-left group"
          >
            <p className="text-[#E22726] text-[11px] font-bold uppercase tracking-[0.3em] mb-2">I want to foster</p>
            <h2 className={`${irishGrover.className} text-4xl text-[#1E1E1E] group-hover:text-[#E22726] transition-colors`}>
              I'm a User →
            </h2>
          </button>
 
          <button
            onClick={() => router.push("/shelter/login")}
            className="w-full p-10 bg-[#1E1E1E] rounded-[2.5rem] border-2 border-[#1E1E1E] hover:bg-[#2a2a2a] transition-all text-left group"
          >
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-2">Manage animals</p>
            <h2 className={`${irishGrover.className} text-4xl text-white`}>
              I'm a Shelter →
            </h2>
          </button>
        </div>
      </main>
    );
  }
 
  // ── STEP 2: User login / signup form ──────────────────────────────────────
 
  return (
    <main className={`min-h-screen bg-[#F5F5EC] flex items-center justify-center p-6 ${breeSerif.className}`}>
      <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100">
 
        <button
          onClick={() => { setMode("choose"); setError(""); }}
          className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-8 hover:text-[#E22726] transition-colors"
        >
          ← Back
        </button>
 
        <header className="text-center mb-10">
          <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em] font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </span>
          <h1 className={`${irishGrover.className} text-5xl text-[#1E1E1E] mt-3`}>
            {isSignUp ? "Sign Up" : "Log In"}
          </h1>
        </header>
 
        <form onSubmit={handleUserAuth} className="space-y-6">
          <div>
            <label className="block text-[13px] uppercase tracking-widest text-[#1E1E1E] mb-3 ml-2 font-bold">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-6 py-5 bg-[#F5F5EC] rounded-2xl border-none focus:ring-2 focus:ring-[#E22726] text-[16px] outline-none transition-all placeholder:text-gray-400"
            />
          </div>
 
          <div>
            <label className="block text-[13px] uppercase tracking-widest text-[#1E1E1E] mb-3 ml-2 font-bold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="w-full px-6 py-5 bg-[#F5F5EC] rounded-2xl border-none focus:ring-2 focus:ring-[#E22726] text-[16px] outline-none transition-all placeholder:text-gray-400"
            />
            {isSignUp && (
              <p className="text-[11px] text-gray-400 mt-2 ml-2 font-bold uppercase tracking-wider">
                Minimum 6 characters
              </p>
            )}
          </div>
 
          {error && (
            <p className="text-[#E22726] text-sm text-center font-bold">{error}</p>
          )}
 
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-6 rounded-2xl text-[16px] tracking-[0.2em] uppercase font-bold transition-all shadow-lg ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#E22726] text-white hover:bg-[#b31d1d]"
            }`}
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Log In"}
          </button>
        </form>
 
        <p className="text-center mt-8 text-gray-400 text-sm font-bold">
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="text-[#E22726] hover:underline uppercase tracking-wider text-[11px] font-bold"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </main>
  );
}
 