"use client";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";

 
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
        <a href="/blogs" className="hover:underline">Blog</a>
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