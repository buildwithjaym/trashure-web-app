"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

const REASON_MESSAGES: Record<string, string> = {
  no_code:
    "Google sign-in was cancelled or the authorization code was missing. Please try again.",
  access_denied:
    "You cancelled the Google sign-in request. No changes were made.",
  invalid_request:
    "The sign-in request was invalid or has expired. Please start again.",
  no_user:
    "Google sign-in completed, but we couldn't load your account. Please try again.",
  profile_lookup_failed:
    "We couldn't load your Trashure profile. Please try again or contact support.",
};

const FALLBACK_MESSAGE =
  "We couldn't complete the Google sign-in. Please try again.";

function friendlyMessage(reason: string | null) {
  if (!reason) return FALLBACK_MESSAGE;

  const known = REASON_MESSAGES[reason];
  if (known) return known;

  try {
    const decoded = decodeURIComponent(reason).trim();
    if (!decoded) return FALLBACK_MESSAGE;
    return decoded.length > 240 ? `${decoded.slice(0, 240)}…` : decoded;
  } catch {
    return FALLBACK_MESSAGE;
  }
}

/* ---------------------------------------------------------------------------
 * Content (uses useSearchParams — must live inside a Suspense boundary)
 * ------------------------------------------------------------------------- */

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    setReason(searchParams.get("reason"));
  }, [searchParams]);

  const message = friendlyMessage(reason);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-green-50 to-emerald-100 px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-green-300/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl"
      />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg">
            <img
              src="/logo.png"
              alt="Trashure"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight text-zinc-900">
            Sign-in
            <br />
            Interrupted.
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-600">
            Something went wrong while connecting your Google account. Your
            Trashure account was not changed.
          </p>
        </div>

        <section
          aria-labelledby="auth-error-title"
          className="mx-auto w-full max-w-md rounded-3xl border border-green-100 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="mb-5 flex justify-center lg:hidden">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
              <img
                src="/logo.png"
                alt="Trashure"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-md text-sm text-zinc-500 transition hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <ArrowLeft size={18} aria-hidden="true" /> Back to login
          </Link>

          <div className="mt-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={30} aria-hidden="true" />
            </div>
          </div>

          <h2
            id="auth-error-title"
            className="mt-5 text-center text-3xl font-black text-zinc-900"
          >
            Sign-in Failed
          </h2>

          <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500">
            {message}
          </p>

          <div className="mt-7 space-y-3">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-700 px-4 py-3.5 font-semibold text-white shadow-lg shadow-green-500/20 transition hover:from-green-600 hover:to-emerald-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              <RefreshCcw size={18} aria-hidden="true" />
              Try again
            </Link>

            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              Return to home
            </Link>
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-xl bg-green-50 p-3 text-xs leading-relaxed text-green-800">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              If this keeps happening, try signing in with your email and
              password instead, or contact Trashure support.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------------------
 * Fallback (shown while the Suspense boundary resolves searchParams)
 * ------------------------------------------------------------------------- */

function AuthCodeErrorFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-green-50 to-emerald-100 px-4">
      <Loader2
        className="animate-spin text-green-600"
        size={32}
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </main>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={<AuthCodeErrorFallback />}>
      <AuthCodeErrorContent />
    </Suspense>
  );
}