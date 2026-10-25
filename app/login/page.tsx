
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.8 7.18l7.73 6C44.38 38.03 46.98 31.89 46.98 24.55Z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.86 23.86 0 0 0 0 24c0 3.87.93 7.5 2.56 10.78l7.97-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (user) {
          router.replace("/profiles");
          return;
        }

        setCheckingSession(false);
      } catch {
        if (active) setCheckingSession(false);
      }
    };

    void check();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(
      () => setCooldown((seconds) => Math.max(0, seconds - 1)),
      1000
    );

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading || googleLoading) return;

    if (cooldown > 0) {
      toast.warning(`Please wait ${cooldown} seconds before trying again.`);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }

    if (!password) {
      toast.error("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.user) {
        const nextAttempts = attempts + 1;

        toast.error("Invalid email or password.");

        if (nextAttempts >= 5) {
          setCooldown(30);
          setAttempts(0);
          toast.warning("Too many attempts. Try again in 30 seconds.");
        } else {
          setAttempts(nextAttempts);
        }

        return;
      }

      setAttempts(0);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name,role")
        .eq("auth_id", data.user.id)
        .single();

      if (profileError || !profile) {
        toast.error("Profile not found. Please complete registration.");
        await supabase.auth.signOut();
        return;
      }

      if (!profile.role) {
        toast.error("Account role is missing.");
        await supabase.auth.signOut();
        return;
      }

      toast.success(
        `Welcome back${profile.full_name ? `, ${profile.full_name}` : ""}!`
      );

      router.push("/profiles");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    if (loading || googleLoading) return;

    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/login/google?next=/profiles`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) toast.error(error.message);
    } catch {
      toast.error("Google sign-in could not be started. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f5faf6]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <Loader2
              className="animate-spin text-emerald-700"
              size={24}
              aria-hidden="true"
            />
          </div>
          <span className="text-sm text-zinc-500">Preparing your account...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f5faf6]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-green-200/40 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1440px] items-center justify-center p-3 sm:p-6 lg:p-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/80 bg-white shadow-xl shadow-emerald-950/5 lg:min-h-[680px] lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#123d2c] via-[#126344] to-[#07834b] p-10 text-white lg:flex xl:p-14">
            <div
              aria-hidden="true"
              className="absolute -right-28 top-20 h-80 w-80 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -right-16 top-32 h-56 w-56 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-emerald-300/10 blur-2xl"
            />

            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg">
                  <img
                    src="/logo.png"
                    alt="Trashure"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xl font-black tracking-wide">TRASHURE</p>
                  <p className="text-[10px] font-medium tracking-[0.22em] text-emerald-100">
                    BY TEAM AURELOOP
                  </p>
                </div>
              </Link>

              <div className="mt-24 max-w-md xl:mt-28">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-medium text-emerald-50 backdrop-blur-sm">
                  <Sparkles size={14} />
                  Discover value in what others discard
                </div>

                <h1 className="text-5xl font-black leading-[1.12] tracking-tight xl:text-6xl">
                  Turn trash
                  <br />
                  into <span className="text-emerald-200">treasure.</span>
                </h1>

                <p className="mt-6 max-w-sm text-base leading-7 text-emerald-50/85">
                  Discover the value of discarded materials and help build a
                  smarter, more sustainable circular economy.
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-200/15">
                  <ShieldCheck size={21} className="text-emerald-100" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Your journey starts here</p>
                  <p className="mt-1 text-xs text-emerald-50/70">
                    Sign in to continue with Trashure.
                  </p>
                </div>
                <CheckCircle2 size={19} className="ml-auto text-emerald-200" />
              </div>

              <p className="text-xs text-emerald-100/60">
                © {new Date().getFullYear()} Trashure · Team Aureloop
              </p>
            </div>
          </aside>

          <section
            aria-labelledby="login-title"
            className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-10 lg:px-10 xl:px-14"
          >
            <div className="w-full max-w-[390px]">
              <div className="mb-7 flex items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-zinc-500 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <ArrowLeft size={15} />
                  Home
                </Link>

                <span className="text-xs font-medium text-zinc-400">
                  Welcome to Trashure
                </span>
              </div>

              <div className="mb-7 text-center lg:text-left">
                <div className="mb-5 flex justify-center lg:hidden">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white p-1 shadow-sm">
                    <img
                      src="/logo.png"
                      alt="Trashure logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Your sustainable journey
                </p>

                <h2
                  id="login-title"
                  className="mt-2 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl"
                >
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Sign in to discover more value in Trashure.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="text-sm font-semibold text-zinc-700"
                  >
                    Email address
                  </label>

                  <div className="relative mt-2">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={18}
                    />
                    <input
                      id="login-email"
                      name="email"
                      autoComplete="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="login-password"
                      className="text-sm font-semibold text-zinc-700"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="rounded text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative mt-2">
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={18}
                    />
                    <input
                      id="login-password"
                      name="password"
                      autoComplete="current-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-11 pr-12 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading || cooldown > 0}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-700/15 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-700/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : cooldown > 0 ? (
                    `Try again in ${cooldown}s`
                  ) : (
                    <>
                      Sign in to your account
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-200" />
                <span className="text-[10px] font-bold tracking-[0.18em] text-zinc-400">
                  OR CONTINUE WITH
                </span>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>

              <button
                type="button"
                onClick={googleLogin}
                disabled={loading || googleLoading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 size={19} className="animate-spin" />
                ) : (
                  <GoogleLogo />
                )}
                {googleLoading ? "Connecting to Google..." : "Continue with Google"}
              </button>

              <p className="mt-7 text-center text-sm text-zinc-500">
                New to Trashure?{" "}
                <Link
                  href="/create-account"
                  className="font-bold text-emerald-700 transition hover:text-emerald-800 hover:underline"
                >
                  Create an account
                </Link>
              </p>

              <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
                <ShieldCheck size={14} />
                Secure sign-in · Team Aureloop
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
