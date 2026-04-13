"use client";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";

/**
 * FIX LOG
 * ───────
 * NEW — Logout now has try-catch. If the session-delete API call fails,
 *       we still proceed with Firebase signOut and redirect (best-effort
 *       cleanup) rather than leaving the user stuck on a broken page.
 */

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete session cookie:", err);
      // Continue — best-effort cleanup
    }

    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase signOut error:", err);
    }

    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between px-12 py-8 text-[#E22726] text-xs font-bold uppercase tracking-widest">
      <div className="flex gap-12">
        <a href="/dashboard" className="hover:underline">
          Home
        </a>
        <a href="/blogs" className="hover:underline">
          Blog
        </a>
        <a href="#" className="hover:underline">
          About Us
        </a>
        <a href="/UserCalendar" className="hover:underline">
          Calendar
        </a>
      </div>

      <div className="flex items-center gap-12">
        <a href="#" className="hover:underline">
          Favorites
        </a>
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