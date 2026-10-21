"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown for "resend code"
  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      toast.error("Email is required.");
      return;
    }

    if (!emailPattern.test(email)) {
      toast.error("Invalid email format.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Verification code sent. Check your inbox.");
      setStage("otp");
      setCooldown(0);
      startCooldown();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code) {
      toast.error("Enter the 6-digit code.");
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("The code must be 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });

      if (error || !data.session) {
        toast.error(error?.message ?? "Invalid or expired code.");
        return;
      }

      toast.success("Code verified. Set your new password.");
      router.replace("/reset-password");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-green-50 to-emerald-100 px-4">
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-green-300/30 blur-3xl" />

      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg">
            <img
              src="/logo.png"
              alt="Trashure Logo"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight text-zinc-900">
            Recover
            <br />
            Your Access.
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-600">
            We&apos;ll send a secure one-time code to your email. Verify it, then
            set a fresh password.
          </p>
        </div>

        <section className="mx-auto w-full max-w-md rounded-3xl border border-green-100 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-5 flex justify-center lg:hidden">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
              <img
                src="/logo.png"
                alt="Trashure Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-zinc-500 transition hover:text-green-600"
          >
            <ArrowLeft size={18} />
            Back to login
          </Link>

          {stage === "email" ? (
            <>
              <h2 className="mt-6 text-center text-3xl font-black text-zinc-900">
                Forgot Password
              </h2>

              <p className="mt-2 text-center text-sm text-zinc-500">
                Enter your account email and we&apos;ll send a 6-digit code.
              </p>

              <div className="mt-7 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Email
                  </label>

                  <div className="relative mt-2">
                    <Mail
                      className="absolute left-4 top-3.5 text-zinc-400"
                      size={18}
                    />

                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={loading}
                      className="w-full rounded-xl border border-zinc-200 py-3 pl-11 outline-none transition focus:ring-2 focus:ring-green-500 disabled:bg-zinc-50 disabled:text-zinc-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={sendCode}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-700 py-3.5 font-semibold text-white shadow-lg shadow-green-500/30 transition hover:-translate-y-1 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Send code"}
                </button>

                <p className="pt-3 text-center text-sm text-zinc-500">
                  Remembered it?
                  <Link href="/login" className="ml-1 font-semibold text-green-600">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-6 text-center text-3xl font-black text-zinc-900">
                Enter Code
              </h2>

              <p className="mt-2 text-center text-sm text-zinc-500">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-zinc-700">{email}</span>.
              </p>

              <div className="mt-7 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Verification code
                  </label>

                  <div className="relative mt-2">
                    <KeyRound
                      className="absolute left-4 top-3.5 text-zinc-400"
                      size={18}
                    />

                    <input
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      type="text"
                      inputMode="numeric"
                      placeholder="123456"
                      maxLength={6}
                      autoComplete="one-time-code"
                      disabled={loading}
                      className="w-full rounded-xl border border-zinc-200 py-3 pl-11 tracking-[0.4em] outline-none transition focus:ring-2 focus:ring-green-500 disabled:bg-zinc-50 disabled:text-zinc-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={verifyCode}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-700 py-3.5 font-semibold text-white shadow-lg shadow-green-500/30 transition hover:-translate-y-1 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Verify code"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStage("email");
                      setCode("");
                    }}
                    className="font-medium text-zinc-500 transition hover:text-green-600"
                  >
                    Change email
                  </button>

                  <button
                    type="button"
                    disabled={loading || cooldown > 0}
                    onClick={sendCode}
                    className="font-semibold text-green-600 disabled:opacity-50"
                  >
                    {cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : "Resend code"}
                  </button>
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-xs leading-relaxed text-green-800">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  Codes expire quickly. If it doesn&apos;t arrive, check spam or
                  try resending.
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}