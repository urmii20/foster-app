"use client";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete session cookie:", err);
    }
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase signOut error:", err);
    }
    router.push("/login");
  };

  const linkClass = (href: string) =>
    `hover:underline transition-opacity ${pathname === href ? "opacity-100 underline" : "opacity-70 hover:opacity-100"}`;

  return (
    <nav className="flex items-center justify-between px-12 py-8 text-[#E22726] text-xs font-bold uppercase tracking-widest">
      <div className="flex gap-12">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Home
        </Link>
        <Link href="/blogs" className={linkClass("/blogs")}>
          Blog
        </Link>
        <Link href="/about" className={linkClass("/about")}>
          About Us
        </Link>
        <Link href="/UserCalendar" className={linkClass("/UserCalendar")}>
          Calendar
        </Link>
      </div>

      <div className="flex items-center gap-8">
        {/* Favorites with heart icon */}
        <Link href="/favorites" className={`flex items-center gap-2 ${linkClass("/favorites")}`}>
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill={pathname === "/favorites" ? "#E22726" : "none"}
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Favorites
        </Link>

        {/* Profile icon */}
        <Link href="/profile" className={`flex items-center gap-2 ${linkClass("/profile")}`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          Profile
        </Link>

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