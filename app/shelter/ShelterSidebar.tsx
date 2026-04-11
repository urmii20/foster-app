"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { Irish_Grover, Bree_Serif } from "next/font/google";
 
const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });
 
/**
 * WHY LOGOUT CHANGED
 * ───────────────────
 * The old logout only called Firebase signOut(). That clears Firebase's
 * client-side auth state, but it does NOT clear the __session cookie we
 * added. Middleware reads the cookie, not Firebase state — so after the
 * old logout, a user could still access shelter routes because the cookie
 * was still there.
 *
 * The fix: call DELETE /api/auth/session first to clear the cookie,
 * THEN sign out of Firebase, THEN redirect to login.
 */
 
export default function ShelterSidebar() {
  const pathname = usePathname();
  const router = useRouter();
 
  const handleLogout = async () => {
    // 1. Clear the server-side session cookie (this is what middleware reads)
    await fetch("/api/auth/session", { method: "DELETE" });
 
    // 2. Sign out of Firebase (clears client-side auth state)
    await signOut(auth);
 
    // 3. Redirect to login
    router.push("/shelter/login");
  };
 
  const menuItems = [
    { name: "Dashboard",    path: "/shelter/dashboard",      icon: "📊" },
    { name: "Applications", path: "/shelter/Inbox",          icon: "📩" },
    { name: "Add New Pet",  path: "/shelter/Inventory",      icon: "🐾" },
  ];
 
  return (
    <div className={`w-72 min-h-screen bg-white border-r border-[#D9D9D9] p-8 flex flex-col justify-between ${breeSerif.className} font-normal`}>
      <div>
        <div className="mb-12 px-2">
          <h1 className={`${irishGrover.className} text-[#E22726] text-3xl leading-tight uppercase`}>
            Arc Animal<br/><span className="text-[#1E1E1E]">Shelter</span>
          </h1>
        </div>
 
        <nav className="space-y-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[18px] transition-all border ${
                  isActive
                    ? "bg-[#E22726] text-white border-[#E22726] shadow-md"
                    : "text-[#1E1E1E] border-transparent hover:border-[#D9D9D9] hover:bg-[#F5F5EC]"
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
 
      <button
        onClick={handleLogout}
        className="flex items-center gap-4 px-6 py-4 rounded-2xl text-[18px] text-gray-400 hover:text-[#E22726] hover:bg-red-50 transition-all border border-transparent hover:border-red-100 uppercase tracking-widest font-bold"
      >
        🚪 Logout
      </button>
    </div>
  );
}