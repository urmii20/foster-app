"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Irish_Grover, Bree_Serif } from "next/font/google";

const irishGrover = Irish_Grover({ weight: "400", subsets: ["latin"] });
const breeSerif = Bree_Serif({ weight: "400", subsets: ["latin"] });

type Screen = "choose" | "user" | "otp" | "forgot" | "forgot_sent";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [screen, setScreen] = useState<Screen>("choose");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [pendingUid, setPendingUid] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── OTP helpers ────────────────────────────────────────────────────────

  /** Generates a code, writes it to Firestore CLIENT-SIDE (authenticated),
   *  then calls the API route which only sends the email. */
  const generateAndSendOtp = async (targetEmail: string): Promise<boolean> => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const safeKey = targetEmail.toLowerCase().replace(/[^a-z0-9]/g, "_");

      // Write to Firestore from the browser — the user is now authenticated
      // so this satisfies Firestore security rules without needing Admin SDK
      await setDoc(doc(db, "otps", safeKey), {
        email: targetEmail.toLowerCase(),
        code,
        expiresAt,
        used: false,
        createdAt: new Date().toISOString(),
      });

      // Call API route which only sends the email (no Firestore on the server)
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, code }),
      });

      if (!res.ok) {
        console.error("send-otp API error:", await res.text());
        return false;
      }

      return true;
    } catch (err) {
      console.error("generateAndSendOtp error:", err);
      return false;
    }
  };

  /** Verifies OTP entirely client-side — no API call needed. */
  const verifyOtpClientSide = async (
    targetEmail: string,
    code: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const safeKey = targetEmail.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const snap = await getDoc(doc(db, "otps", safeKey));

      if (!snap.exists()) {
        return { ok: false, error: "Code not found. Please request a new one." };
      }

      const data = snap.data();

      if (data.used) {
        return { ok: false, error: "This code has already been used." };
      }

      if (new Date(data.expiresAt) < new Date()) {
        return { ok: false, error: "Code expired. Please request a new one." };
      }

      if (data.code !== code) {
        return { ok: false, error: "Incorrect code. Please try again." };
      }

      // Mark used so it can't be replayed
      await updateDoc(doc(db, "otps", safeKey), { used: true });

      return { ok: true };
    } catch (err) {
      console.error("verifyOtpClientSide error:", err);
      return { ok: false, error: "Verification failed. Please try again." };
    }
  };

  const finaliseSession = async (uid: string) => {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, role: "user" }),
    });
    if (!res.ok) throw new Error("Failed to create session");
    router.push(redirectTo || "/dashboard");
  };

  // ── Signup / login ──────────────────────────────────────────────────────
  const handleUserAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // 1. Create Firebase account
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        setPendingUid(uid);

        // 2. Generate OTP, save to Firestore (client, authenticated), send email
        const sent = await generateAndSendOtp(email);
        if (!sent) {
          // Roll back account creation so the email isn't orphaned
          await cred.user.delete();
          setError("Could not send verification code. Please try again.");
          setLoading(false);
          return;
        }

        setResendCooldown(60);
        setScreen("otp");
      } else {
        // Standard login — no OTP
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await finaliseSession(cred.user.uid);
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Try logging in.");
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password"
      ) {
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

  // ── OTP submission ────────────────────────────────────────────────────
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const code = otpDigits.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      setLoading(false);
      return;
    }

    const result = await verifyOtpClientSide(email, code);
    if (!result.ok) {
      setError(result.error || "Verification failed.");
      setLoading(false);
      return;
    }

    try {
      await finaliseSession(pendingUid);
    } catch (err) {
      console.error(err);
      setError("Session error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ───────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail, {
        url: `${window.location.origin}/login`,
      });
      setScreen("forgot_sent");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError("Could not send reset email. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigit = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // ── CHOOSE WHO YOU ARE ─────────────────────────────────────────────────
  if (screen === "choose") {
    return (
      <main
        className={`min-h-screen bg-[#F5F5EC] flex flex-col items-center justify-center p-6 ${breeSerif.className}`}
      >
        <div className="w-full max-w-lg text-center mb-12">
          <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em] font-bold">
            Welcome Back
          </span>
          <h1 className={`${irishGrover.className} text-6xl text-[#1E1E1E] mt-4`}>
            Who Are You?
          </h1>
        </div>
        <div className="w-full max-w-lg flex flex-col gap-5">
          <button
            onClick={() => setScreen("user")}
            className="w-full p-10 bg-white rounded-[2.5rem] border-2 border-[#D9D9D9] hover:border-[#E22726] hover:shadow-xl transition-all text-left group"
          >
            <p className="text-[#E22726] text-[11px] font-bold uppercase tracking-[0.3em] mb-2">
              I want to foster
            </p>
            <h2
              className={`${irishGrover.className} text-4xl text-[#1E1E1E] group-hover:text-[#E22726] transition-colors`}
            >
              I'm a User →
            </h2>
          </button>
          <button
            onClick={() => router.push("/shelter/login")}
            className="w-full p-10 bg-[#1E1E1E] rounded-[2.5rem] border-2 border-[#1E1E1E] hover:bg-[#2a2a2a] transition-all text-left"
          >
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-2">
              Manage animals
            </p>
            <h2 className={`${irishGrover.className} text-4xl text-white`}>
              I'm a Shelter →
            </h2>
          </button>
        </div>
      </main>
    );
  }

  // ── FORGOT PASSWORD SENT ───────────────────────────────────────────────
  if (screen === "forgot_sent") {
    return (
      <main
        className={`min-h-screen bg-[#F5F5EC] flex items-center justify-center p-6 ${breeSerif.className}`}
      >
        <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-[#FCEAEB] rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            📧
          </div>
          <h2 className={`${irishGrover.className} text-4xl mb-3`}>Email Sent!</h2>
          <p className="text-sm text-[#666] mb-8">
            A password reset link has been sent to{" "}
            <strong>{forgotEmail}</strong>. Check your inbox and spam folder.
          </p>
          <button
            onClick={() => {
              setScreen("user");
              setError("");
            }}
            // AFTER
            className="w-full p-4 bg-[#F5F5EC] border-2 border-[#D9D9D9] rounded-2xl text-sm text-[#1E1E1E] placeholder:text-[#888] focus:border-[#E22726] outline-none transition"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  // ── FORGOT PASSWORD FORM ───────────────────────────────────────────────
  if (screen === "forgot") {
    return (
      <main
        className={`min-h-screen bg-[#F5F5EC] flex items-center justify-center p-6 ${breeSerif.className}`}
      >
        <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100">
          <button
            onClick={() => {
              setScreen("user");
              setError("");
            }}
            className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-8 hover:text-[#E22726] transition-colors"
          >
            ← Back
          </button>
          <header className="text-center mb-10">
            <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em] font-bold">
              Reset Access
            </span>
            <h1 className={`${irishGrover.className} text-5xl mt-2`}>
              Forgot Password
            </h1>
            <p className="text-sm text-[#999] mt-3">
              Enter your registered email and we'll send a reset link.
            </p>
          </header>
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-4 bg-[#F5F5EC] border-2 border-[#D9D9D9] rounded-2xl text-sm focus:border-[#E22726] outline-none transition"
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="text-[#E22726] text-xs font-bold uppercase tracking-wide text-center">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#1E1E1E] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#E22726] transition disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Reset Link →"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── OTP SCREEN ────────────────────────────────────────────────────────
  if (screen === "otp") {
    return (
      <main
        className={`min-h-screen bg-[#F5F5EC] flex items-center justify-center p-6 ${breeSerif.className}`}
      >
        <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100">
          <header className="text-center mb-10">
            <div className="w-14 h-14 bg-[#FCEAEB] rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              📬
            </div>
            <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em] font-bold">
              Verify Your Email
            </span>
            <h1 className={`${irishGrover.className} text-5xl mt-2`}>Enter OTP</h1>
            <p className="text-sm text-[#999] mt-3">
              We sent a 6-digit code to{" "}
              <strong className="text-[#1E1E1E]">{email}</strong>
            </p>
            <p className="text-xs text-[#999] mt-1">
              No email? Check your spam folder, or use the resend button below.
            </p>
          </header>

          <form onSubmit={handleOtpVerify} className="space-y-8">
            <div className="flex gap-3 justify-center">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-[#D9D9D9] rounded-2xl bg-[#F5F5EC] focus:border-[#E22726] outline-none transition"
                />
              ))}
            </div>

            {error && (
              <p className="text-[#E22726] text-xs font-bold uppercase tracking-wide text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#1E1E1E] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#E22726] transition disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify & Continue →"}
            </button>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-[#999]">
                  Resend in{" "}
                  <span className="font-bold text-[#1E1E1E]">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    setOtpDigits(["", "", "", "", "", ""]);
                    const sent = await generateAndSendOtp(email);
                    if (sent) {
                      setResendCooldown(60);
                    } else {
                      setError("Could not resend. Please try again.");
                    }
                  }}
                  className="text-xs text-[#E22726] font-bold uppercase tracking-widest hover:underline"
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    );
  }

  // ── LOGIN / SIGNUP FORM ────────────────────────────────────────────────
  return (
    <main
      className={`min-h-screen bg-[#F5F5EC] flex items-center justify-center p-6 ${breeSerif.className}`}
    >
      <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100">
        <button
          onClick={() => {
            setScreen("choose");
            setError("");
          }}
          className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-8 hover:text-[#E22726] transition-colors"
        >
          ← Back
        </button>

        <header className="text-center mb-10">
          <span className="text-[#E22726] text-[12px] uppercase tracking-[0.3em] font-bold">
            {isSignUp ? "Join Us" : "Welcome Back"}
          </span>
          <h1 className={`${irishGrover.className} text-5xl text-[#1E1E1E] mt-2`}>
            {isSignUp ? "Create Account" : "Sign In"}
          </h1>
          {isSignUp && (
            <p className="text-xs text-[#999] mt-2">
              We'll verify your email with a one-time code.
            </p>
          )}
        </header>

        <form onSubmit={handleUserAuth} className="space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-4 bg-[#F5F5EC] border-2 border-[#D9D9D9] rounded-2xl text-sm focus:border-[#E22726] outline-none transition"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 bg-[#F5F5EC] border-2 border-[#D9D9D9] rounded-2xl text-sm focus:border-[#E22726] outline-none transition"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <p className="text-[#E22726] text-xs font-bold uppercase tracking-wide text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#1E1E1E] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#E22726] transition-all disabled:opacity-50 shadow-xl mt-2"
          >
            {loading
              ? "Please wait…"
              : isSignUp
              ? "Create Account →"
              : "Sign In →"}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              setIsSignUp((v) => !v);
              setError("");
            }}
            className="text-xs text-gray-500 hover:text-[#E22726] transition font-bold uppercase tracking-widest"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "New here? Create account"}
          </button>
          {!isSignUp && (
            <button
              onClick={() => {
                setScreen("forgot");
                setForgotEmail(email);
                setError("");
              }}
              className="text-xs text-gray-400 hover:text-[#E22726] transition uppercase tracking-widest"
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </main>
  );
}