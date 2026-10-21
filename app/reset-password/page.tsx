"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;

    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        toast.error("Please verify your email first.");
        router.replace("/forgot-password");
        return;
      }

      setSignedIn(true);
      setChecking(false);
    };

    void check();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  const handleSubmit = async () => {
    if (!password) {
      toast.error("Password is required.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
        return;
      }

      await supabase.auth.signOut();

      toast.success("Password updated. Please sign in.");
      router.replace("/login");
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
            Start
            <br />
            Fresh.
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-600">
            You&apos;re verified. Choose a new password to secure your Trashure
            account.
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
            Set a New Password
          </h2>

          <p className="mt-2 text-center text-sm text-zinc-500">
            Choose a strong password for your Trashure account.
          </p>

          {checking ? (
            <div className="mt-10 flex justify-center">
              <Loader2 className="animate-spin text-green-600" size={28} />
            </div>
          ) : signedIn ? (
            <div className="mt-7 space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">
                  New Password
                </label>

                <div className="relative mt-2">
                  <Lock
                    className="absolute left-4 top-3.5 text-zinc-400"
                    size={18}
                  />

                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-zinc-200 py-3 pl-11 pr-11 outline-none transition focus:ring-2 focus:ring-green-500 disabled:bg-zinc-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-zinc-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Confirm Password
                </label>

                <div className="relative mt-2">
                  <Lock
                    className="absolute left-4 top-3.5 text-zinc-400"
                    size={18}
                  />

                  <input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-zinc-200 py-3 pl-11 outline-none transition focus:ring-2 focus:ring-green-500 disabled:bg-zinc-50"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-xs leading-relaxed text-green-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                Use at least 8 characters. Mix letters, numbers, and symbols for
                a stronger password.
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-700 py-3.5 font-semibold text-white shadow-lg shadow-green-500/30 transition hover:-translate-y-1 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Update password"
                )}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}