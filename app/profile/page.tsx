"use client";
import { useEffect, useState } from "react";
import {
  collection, query, where, onSnapshot, doc, getDoc, updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import Navbar from "../components/Navbar";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

type Tab = "overview" | "applications" | "history";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700" },
  approved:  { label: "Approved",  color: "bg-green-100 text-green-700" },
  rejected:  { label: "Declined",  color: "bg-red-100 text-[#E22726]" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-500" },
  active:    { label: "Active",    color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [applications, setApplications] = useState<any[]>([]);
  const [activeFoster, setActiveFoster] = useState<any | null>(null);
  const [activePet, setActivePet] = useState<any | null>(null);
  const [fosterHistory, setFosterHistory] = useState<any[]>([]);
  const [favCount, setFavCount] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [requestingRenewal, setRequestingRenewal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setNameInput(u?.displayName || ""); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "foster_applications"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      apps.sort((a: any, b: any) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
      setApplications(apps);
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "fosters"), where("userId", "==", user.uid), where("status", "==", "active"));
    const unsub = onSnapshot(q, async (snap) => {
      if (snap.empty) { setActiveFoster(null); setActivePet(null); return; }
      const fd = snap.docs[0];
      const foster = { id: fd.id, ...fd.data() };
      setActiveFoster(foster);
      if ((foster as any).petId) {
        const ps = await getDoc(doc(db, "pets", (foster as any).petId));
        if (ps.exists()) setActivePet({ id: ps.id, ...ps.data() });
      }
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "fosters"), where("userId", "==", user.uid), where("status", "==", "completed"));
    const unsub = onSnapshot(q, (snap) => setFosterHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "favorites"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => setFavCount(snap.size));
    return () => unsub();
  }, [user?.uid]);

  const saveName = async () => {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    try { await updateProfile(user, { displayName: nameInput.trim() }); setEditingName(false); } catch (e) { console.error(e); }
    setSavingName(false);
  };

  const withdrawApplication = async (appId: string) => {
    if (!window.confirm("Withdraw this application? This cannot be undone.")) return;
    setWithdrawingId(appId);
    try { await updateDoc(doc(db, "foster_applications", appId), { status: "withdrawn" }); } catch (e) { console.error(e); }
    setWithdrawingId(null);
  };

  const requestRenewal = async () => {
    if (!activeFoster || requestingRenewal) return;
    setRequestingRenewal(true);
    try { await updateDoc(doc(db, "fosters", activeFoster.id), { renewalRequested: true }); } catch (e) { console.error(e); }
    setRequestingRenewal(false);
  };

  const fmt = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (!user) {
    return (
      <main className={`min-h-screen bg-[#F5F5EC] ${breeSerif.className}`}>
        <Navbar />
        <div className="px-12 py-20 text-center text-[#999] text-sm font-bold uppercase tracking-widest">Loading profile…</div>
      </main>
    );
  }

  const initials = (user.displayName || user.email || "U").slice(0, 2).toUpperCase();
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview",     label: "Overview" },
    { key: "applications", label: "Applications" },
    { key: "history",      label: "Foster History" },
  ];

  const daysRemaining = activeFoster?.endDate
    ? Math.ceil((new Date(activeFoster.endDate).getTime() - Date.now()) / 86400000)
    : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;
  const renewalAlreadyRequested = activeFoster?.renewalRequested === true;

  return (
    <main className={`min-h-screen bg-[#F5F5EC] text-[#1E1E1E] pb-20 ${breeSerif.className}`}>
      <Navbar />

      <div className="px-12 pt-4 pb-10 flex items-center gap-8 border-b-2 border-[#D9D9D9]">
        <div className="w-24 h-24 rounded-full bg-[#E22726] flex items-center justify-center flex-shrink-0">
          <span className={`${irishGrover.className} text-4xl text-white`}>{initials}</span>
        </div>
        <div className="flex-1">
          {editingName ? (
            <div className="flex items-center gap-3">
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                className="bg-white border-2 border-[#E22726] rounded-2xl px-4 py-2 text-2xl font-bold outline-none" autoFocus />
              <button onClick={saveName} disabled={savingName}
                className="px-6 py-2 bg-[#E22726] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-80 transition">
                {savingName ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditingName(false)} className="text-gray-400 text-sm">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className={`${irishGrover.className} text-4xl`}>{user.displayName || "Anonymous Foster"}</h1>
              <button onClick={() => setEditingName(true)} className="text-gray-300 hover:text-[#E22726] transition">✏️</button>
            </div>
          )}
          <p className="text-sm text-[#999] mt-1">{user.email}</p>
          <div className="flex gap-6 mt-3">
            {[
              { label: "Applications",     value: applications.length },
              { label: "Completed Fosters",value: fosterHistory.length },
              { label: "Saved Pets",       value: favCount },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`${irishGrover.className} text-2xl text-[#E22726]`}>{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#999]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        {activePet && (
          <div className="bg-white rounded-[1.5rem] border-2 border-[#E22726] p-5 flex items-center gap-4 flex-shrink-0">
            <img src={activePet.image || "/jonnie.png"} alt={activePet.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#F5F5EC]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#E22726]">Currently Fostering</p>
              <p className={`${irishGrover.className} text-xl`}>{activePet.name}</p>
              <p className="text-xs text-[#999]">Since {fmt(activeFoster?.startDate)}</p>
            </div>
          </div>
        )}
      </div>

      {isExpiringSoon && (
        <div className={`mx-12 mt-6 rounded-[1.5rem] p-5 border-2 flex items-center justify-between ${renewalAlreadyRequested ? "bg-green-50 border-green-200" : "bg-[#FFF3E3] border-[#FFE0B2]"}`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${renewalAlreadyRequested ? "text-green-600" : "text-orange-500"}`}>
              {renewalAlreadyRequested ? "Renewal Requested" : `Foster Ending in ${daysRemaining} Day${daysRemaining !== 1 ? "s" : ""}`}
            </p>
            <p className="text-sm text-[#444]">
              {renewalAlreadyRequested
                ? "The shelter has been notified and will confirm the extension."
                : `Your foster for ${activeFoster?.petName} ends on ${fmt(activeFoster.endDate)}.`}
            </p>
          </div>
          {!renewalAlreadyRequested && (
            <button onClick={requestRenewal} disabled={requestingRenewal}
              className="flex-shrink-0 px-5 py-2.5 bg-[#1E1E1E] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#E22726] transition disabled:opacity-50">
              {requestingRenewal ? "Sending…" : "Request Renewal"}
            </button>
          )}
        </div>
      )}

      <div className="px-12 pt-8">
        <div className="flex gap-1 border-b-2 border-[#D9D9D9] mb-8">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 -mb-[2px] ${tab === t.key ? "border-[#E22726] text-[#E22726]" : "border-transparent text-[#999] hover:text-[#1E1E1E]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] border-2 border-[#D9D9D9] p-8">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#999] mb-5">Account Details</p>
              {[
                { label: "Full Name",       value: user.displayName || "—" },
                { label: "Email",           value: user.email },
                { label: "Account Created", value: user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("en-IN") : "—" },
                { label: "Last Sign In",    value: user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-IN") : "—" },
                { label: "Email Verified",  value: user.emailVerified ? "✓ Verified" : "Not verified" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#999]">{item.label}</span>
                  <span className={`text-sm ${item.label === "Email Verified" && !user.emailVerified ? "text-[#E22726]" : ""}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-5">
              {activeFoster ? (
                <div className="bg-[#FCEAEB] rounded-[2rem] p-8 border-2 border-[#E22726]/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#E22726] mb-2">Currently Fostering</p>
                  <p className={`${irishGrover.className} text-3xl`}>{activePet?.name || activeFoster.petName}</p>
                  {activeFoster.startDate && activeFoster.durationDays && (() => {
                    const elapsed = Math.max(0, Math.ceil((Date.now() - new Date(activeFoster.startDate).getTime()) / 86400000));
                    const pct = Math.min(100, Math.round((elapsed / activeFoster.durationDays) * 100));
                    return (
                      <div className="mt-4">
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-[#E22726] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-[#999] mt-1">Day {elapsed} of {activeFoster.durationDays} ({pct}%)</p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-[#F5F5EC] rounded-[2rem] p-8 border-2 border-dashed border-[#D9D9D9] text-center">
                  <p className="text-4xl mb-3">🐾</p>
                  <p className="text-sm font-bold uppercase tracking-widest text-[#999]">Not fostering right now</p>
                  <a href="/dashboard" className="mt-4 inline-block text-xs font-bold text-[#E22726] underline uppercase tracking-widest">Browse pets →</a>
                </div>
              )}
              <div className="bg-white rounded-[2rem] p-8 border-2 border-[#D9D9D9]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#999] mb-4">Your Activity</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { n: applications.filter((a: any) => a.status === "pending").length,  l: "Pending" },
                    { n: applications.filter((a: any) => a.status === "approved").length, l: "Approved" },
                    { n: fosterHistory.length,                                             l: "Completed" },
                  ].map((s) => (
                    <div key={s.l}>
                      <p className={`${irishGrover.className} text-3xl text-[#E22726]`}>{s.n}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#999]">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "applications" && (
          <div>
            {applications.length === 0 ? (
              <div className="py-16 text-center text-[#999] text-sm font-bold uppercase tracking-widest">No applications yet.</div>
            ) : (
              <div className="bg-white rounded-[2rem] border-2 border-[#D9D9D9] overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-[#D9D9D9] bg-[#F5F5EC]">
                      {["Pet","Applied On","Status","Notes","Action"].map((h) => (
                        <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#999]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app: any) => {
                      const badge = STATUS_BADGE[app.status] || STATUS_BADGE.pending;
                      return (
                        <tr key={app.id} className="border-b border-[#D9D9D9]/50 hover:bg-[#F5F5EC]/50 transition">
                          <td className="px-6 py-4 font-bold">{app.petName || "—"}</td>
                          <td className="px-6 py-4 text-sm text-[#666]">{app.submittedAt?.toDate ? app.submittedAt.toDate().toLocaleDateString("en-IN") : "—"}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-[#999]">
                            {app.status === "approved"  ? "Check your email for schedule." :
                             app.status === "rejected"  ? "Not a match this time." :
                             app.status === "withdrawn" ? "You withdrew this application." :
                             "Under review — typically 2–3 business days."}
                          </td>
                          <td className="px-6 py-4">
                            {app.status === "pending" && (
                              <button onClick={() => withdrawApplication(app.id)} disabled={withdrawingId === app.id}
                                className="text-[10px] font-bold uppercase tracking-widest text-red-500 border border-red-200 px-4 py-1.5 rounded-full hover:bg-red-50 transition disabled:opacity-50">
                                {withdrawingId === app.id ? "…" : "Withdraw"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div>
            {fosterHistory.length === 0 ? (
              <div className="py-16 text-center text-[#999] text-sm font-bold uppercase tracking-widest">No completed fosters yet.</div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {fosterHistory.map((foster: any) => (
                  <div key={foster.id} className="bg-white rounded-[2rem] border-2 border-[#D9D9D9] p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">✓</div>
                      <div>
                        <p className={`${irishGrover.className} text-xl`}>{foster.petName || "Unknown Pet"}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">Completed</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Start",    value: fmt(foster.startDate) },
                        { label: "End",      value: fmt(foster.endDate) },
                        { label: "Duration", value: foster.durationDays ? `${foster.durationDays} days` : "—" },
                        { label: "Pet ID",   value: foster.petId ? foster.petId.slice(0, 8) + "…" : "—" },
                      ].map((f) => (
                        <div key={f.label}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#999]">{f.label}</p>
                          <p className="text-sm">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}