
"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

const sendCode = async () => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    toast.error("Email is required.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    toast.error("Enter a valid email address.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(
        result.error ?? "Unable to send the recovery code."
      );
      return;
    }

    toast.success("OTP sent to your email.");

    router.push(
      `/reset-password?email=${encodeURIComponent(normalizedEmail)}`
    );
  } catch {
    toast.error("Unable to connect to the server. Please try again.");
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
            Forgot your password? Enter the email associated
            with your Trashure account. We&apos;ll send you a
            verification code so you can securely reset your
            password.
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

          <h2 className="mt-6 text-center text-3xl font-black text-zinc-900">
            Forgot Password
          </h2>

          <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500">
            Enter your registered email address to receive a
            six-digit password recovery code.
          </p>

          <div className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="recovery-email"
                className="text-sm font-medium text-zinc-700"
              >
                Email address
              </label>

              <div className="relative mt-2">
                <Mail
                  className="absolute left-4 top-3.5 text-zinc-400"
                  size={18}
                />

                <input
                  id="recovery-email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !loading
                    ) {
                      void sendCode();
                    }
                  }}
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  maxLength={254}
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-200 py-3 pl-11 pr-4 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500 disabled:bg-zinc-50 disabled:text-zinc-500"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => void sendCode()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-700 py-3.5 font-semibold text-white shadow-lg shadow-green-500/30 transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Sending code...
                </>
              ) : (
                "Send recovery code"
              )}
            </button>

            <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-xs leading-relaxed text-green-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Your recovery code expires in five minutes.
              Never share your verification code with anyone.
            </div>

            <p className="pt-3 text-center text-sm text-zinc-500">
              Remembered your password?
              <Link
                href="/login"
                className="ml-1 font-semibold text-green-600 transition hover:text-green-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
