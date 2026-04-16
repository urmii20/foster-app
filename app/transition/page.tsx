"use client";
import { motion } from "framer-motion";
import { Bree_Serif } from "next/font/google";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

export default function IntermediaryPage() {
  const router = useRouter();

  // Optional: Automatically route to the next page after reading
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard"); 
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex h-screen w-full items-center justify-center bg-[#F5F5EC]">
      <motion.h1
        className={`text-2xl md:text-4xl lg:text-3xl text-[#39657E] tracking-wider ${breeSerif.className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        SOMEONE'S WAITING FOR YOU...
      </motion.h1>
    </main>
  );
}