
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";

const rules = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "Uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase", test: (v: string) => /[a-z]/.test(v) },
  { label: "Number", test: (v: string) => /\d/.test(v) },
  { label: "Special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("email")?.trim().toLowerCase() ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      router.replace("/forgot-password");
      return;
    }

    setEmail(value);
    setReady(true);
  }, [router]);

  const checks = rules.map((rule) => ({
    label: rule.label,
    valid: rule.test(password),
  }));

  const validPassword =
    password.length <= 128 && checks.every((rule) => rule.valid);

  const matches = confirm.length > 0 && password === confirm;
  const mismatch = confirm.length > 0 && password !== confirm;

  const canSubmit =
    ready &&
    /^\d{6}$/.test(otp) &&
    validPassword &&
    matches &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error ?? "Unable to reset password.");
        return;
      }

      toast.success("Password updated successfully.");
      router.replace("/login");
    } catch {
      toast.error("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-white via-green-50 to-emerald-100 px-3 py-5 sm:px-5">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-green-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-emerald-300/25 blur-3xl" />

      <section className="relative z-10 w-full max-w-[420px] rounded-2xl border border-green-100 bg-white/95 p-5 shadow-xl shadow-emerald-900/10 sm:p-6">
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-700"
        >
          <ArrowLeft size={15} />
          Back
        </Link>

        <div className="mb-5 mt-3 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-green-100 bg-white shadow-sm">
            <img
              src="/logo.png"
              alt="Trashure"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="mt-3 text-[23px] font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
            Reset Password
          </h1>

          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Verify your code and create a new password.
          </p>
        </div>

        <form
          className="space-y-3.5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div>
            <label
              htmlFor="recovery-email"
              className="text-xs font-semibold text-zinc-700"
            >
              Email address
            </label>

            <div className="relative mt-1.5">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                id="recovery-email"
                value={email}
                type="email"
                readOnly
                className="h-10 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-9 text-sm text-zinc-500 outline-none"
              />
              <Lock
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="recovery-otp"
              className="text-xs font-semibold text-zinc-700"
            >
              Verification code
            </label>

            <div className="relative mt-1.5">
              <KeyRound
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                id="recovery-otp"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                disabled={loading}
                className="h-10 w-full rounded-lg border border-zinc-200 pl-9 pr-3 text-base font-semibold tracking-[0.3em] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="new-password"
                className="text-xs font-semibold text-zinc-700"
              >
                New password
              </label>
              <span className="text-[11px] tabular-nums text-zinc-400">
                {password.length}/128
              </span>
            </div>

            <div className="relative mt-1.5">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                id="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="New password"
                maxLength={128}
                disabled={loading}
                className="h-10 w-full rounded-lg border border-zinc-200 pl-9 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-700"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-lg bg-zinc-50 p-2.5">
              {checks.map((rule) => (
                <div key={rule.label} className="flex items-center gap-1.5">
                  {rule.valid ? (
                    <Check size={13} className="shrink-0 text-emerald-600" />
                  ) : (
                    <X size={13} className="shrink-0 text-zinc-300" />
                  )}
                  <span
                    className={`text-[11px] ${
                      rule.valid ? "text-emerald-700" : "text-zinc-500"
                    }`}
                  >
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="text-xs font-semibold text-zinc-700"
            >
              Confirm password
            </label>

            <div className="relative mt-1.5">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                id="confirm-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm new password"
                maxLength={128}
                disabled={loading}
                aria-invalid={mismatch}
                className={`h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none focus:ring-2 ${
                  mismatch
                    ? "border-red-300 focus:ring-red-100"
                    : matches
                      ? "border-emerald-300 focus:ring-emerald-100"
                      : "border-zinc-200 focus:ring-emerald-500/15"
                }`}
              />
            </div>

            {confirm.length > 0 && (
              <p
                aria-live="polite"
                className={`mt-1 flex items-center gap-1 text-[11px] ${
                  matches ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {matches ? <Check size={12} /> : <X size={12} />}
                {matches ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-2.5 text-[11px] leading-relaxed text-emerald-800">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            Your code expires in 5 minutes. Never share it.
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-700 text-sm font-bold text-white shadow-md shadow-green-600/15 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Updating...
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-zinc-400">
          Trashure · Team Aureloop
        </p>
      </section>
    </main>
  );
}
