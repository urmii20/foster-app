"use client";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Bree_Serif, Irish_Grover } from "next/font/google";

const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });
const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });

interface Toast {
  id: string;
  petName: string;
  visible: boolean;
}

interface ApprovalToastProps {
  userId: string;
}

export default function ApprovalToast({ userId }: ApprovalToastProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Listen for applications that are approved but not yet notified
    const q = query(
      collection(db, "foster_applications"),
      where("userId", "==", userId),
      where("status", "==", "approved"),
      where("userNotified", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const newToast: Toast = {
          id: docSnap.id,
          petName: data.petName || "your pet",
          visible: true,
        };

        setToasts((prev) => {
          if (prev.find((t) => t.id === docSnap.id)) return prev;
          return [...prev, newToast];
        });

        // Mark as notified so it doesn't re-show on refresh
        updateDoc(doc(db, "foster_applications", docSnap.id), {
          userNotified: true,
        }).catch(console.error);

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === docSnap.id ? { ...t, visible: false } : t))
          );
        }, 8000);
      });
    });

    return () => unsub();
  }, [userId]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));
  };

  const visible = toasts.filter((t) => t.visible);
  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {visible.map((toast) => (
        <div
          key={toast.id}
          className={`${breeSerif.className} w-[340px] bg-white rounded-[1.5rem] shadow-2xl border-2 border-[#E22726] p-5 animate-in slide-in-from-right-4 duration-500`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Paw icon */}
              <div className="w-10 h-10 rounded-full bg-[#FCEAEB] flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🐾</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E22726] mb-0.5">
                  Application Approved!
                </p>
                <p className={`${irishGrover.className} text-xl text-[#1E1E1E] leading-tight`}>
                  {toast.petName} is yours to foster!
                </p>
                <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                  Check your email for the full schedule &amp; next steps.
                </p>
              </div>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-gray-300 hover:text-[#E22726] transition-colors mt-0.5 flex-shrink-0 text-lg leading-none"
            >
              ✕
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E22726] rounded-full"
              style={{ animation: "shrink 8s linear forwards" }}
            />
          </div>
          <style>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}