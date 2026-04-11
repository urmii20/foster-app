"use client";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
 
/**
 * WHY THIS CHANGED
 * ─────────────────
 * The original Navbar had a "Login" button but no logout. Once a user
 * was signed in, there was no way to log out — and no session cookie
 * was being cleared anyway.
 *
 * This version adds a logout that:
 * 1. Calls DELETE /api/auth/session to clear the HTTP-only cookie
 * 2. Signs out of Firebase
 * 3. Redirects to /login
 */
 
export default function Navbar() {
  const router = useRouter();
 
  const handleLogout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut(auth);
    router.push("/login");
  };
 
  return (
    <nav className="flex items-center justify-between px-12 py-8 text-[#E22726] text-xs font-bold uppercase tracking-widest">
      <div className="flex gap-12">
        <a href="/dashboard" className="hover:underline">Home</a>
        <a href="#" className="hover:underline">Blog</a>
        <a href="#" className="hover:underline">About Us</a>
        <a href="/UserCalendar" className="hover:underline">Calendar</a>
      </div>
 
      <div className="flex items-center gap-12">
        <a href="#" className="hover:underline">Favorites</a>
        <button
          onClick={handleLogout}
          className="border-2 border-[#E22726] rounded-full px-8 py-2 hover:bg-[#E22726] hover:text-[#F5F5EC] transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}