"use client";
import ShelterSidebar from "./ShelterSidebar";
import { usePathname } from "next/navigation";

export default function ShelterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // We DON'T want the sidebar to show up on the Login pages
  const isLoginPage = pathname === "/shelter/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5EC]">
      {/* The Sidebar stays fixed on the left */}
      <ShelterSidebar />

      {/* The rest of the page content scrolls on the right */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}