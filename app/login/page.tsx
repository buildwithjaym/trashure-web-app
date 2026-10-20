"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/** Google SVG Logo */

function GoogleLogo() {

  return (

    <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20" className="shrink-0">

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

  useEffect(() => {

    if (cooldown <= 0) return;

    const timer = window.setTimeout(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);

    return () => window.clearTimeout(timer);

  }, [cooldown]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    if (loading || googleLoading) return;

    if (cooldown > 0) {

      toast.warning(`Please wait ${cooldown} seconds before trying again.`);

      return;

    }

    const normalizedEmail = email.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail) return void toast.error("Email is required.");

    if (!emailPattern.test(normalizedEmail)) return void toast.error("Invalid email format.");

    if (!password) return void toast.error("Password is required.");

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

      toast.success(`Welcome back${profile.full_name ? `, ${profile.full_name}` : ""}!`);

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

          queryParams: { access_type: "offline", prompt: "consent" },

        },

      });

      if (error) toast.error(error.message);

    } catch {

      toast.error("Google sign-in could not be started. Please try again.");

    } finally {

      setGoogleLoading(false);

    }

  };

  return (

    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-green-50 to-emerald-100 px-4 py-10">

      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-green-300/30 blur-3xl" />

      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2">

        <div className="hidden lg:block">

          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg">

            <img src="/logo.png" alt="Trashure" className="h-full w-full object-contain" />

          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight text-zinc-900">

            Turn Trash<br />Into Treasure.

          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-600">

            AI-powered circular economy platform that discovers the value of discarded materials.

          </p>

        </div>

        <section aria-labelledby="login-title" className="mx-auto w-full max-w-md rounded-3xl border border-green-100 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">

          <div className="mb-5 flex justify-center lg:hidden">

            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">

              <img src="/logo.png" alt="Trashure" className="h-full w-full object-contain" />

            </div>

          </div>

          <Link href="/" className="inline-flex items-center gap-2 rounded-md text-sm text-zinc-500 transition hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">

            <ArrowLeft size={18} aria-hidden="true" /> Back

          </Link>

          <h2 id="login-title" className="mt-6 text-center text-3xl font-black text-zinc-900">Welcome Back</h2>

          <p className="mt-2 text-center text-sm text-zinc-500">Sign in to continue your Trashure journey.</p>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">

            <div>

              <label htmlFor="login-email" className="text-sm font-medium text-zinc-700">Email</label>

              <div className="relative mt-2">

                <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />

                <input id="login-email" name="email" autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />

              </div>

            </div>

            <div>

              <label htmlFor="login-password" className="text-sm font-medium text-zinc-700">Password</label>

              <div className="relative mt-2">

                <Lock aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />

                <input id="login-password" name="password" autoComplete="current-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-11 pr-12 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />

                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">

                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}

                </button>

              </div>

            </div>

            <button type="submit" disabled={loading || googleLoading || cooldown > 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-700 px-4 py-3.5 font-semibold text-white shadow-lg shadow-green-500/20 transition hover:from-green-600 hover:to-emerald-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">

              {loading ? <><Loader2 size={19} className="animate-spin" aria-hidden="true" /> Signing in...</> : cooldown > 0 ? `Try again in ${cooldown}s` : "Sign In"}

            </button>

          </form>

          <div className="my-5 flex items-center gap-3" aria-hidden="true">

            <div className="h-px flex-1 bg-zinc-200" />

            <span className="text-xs font-medium tracking-wider text-zinc-400">OR</span>

            <div className="h-px flex-1 bg-zinc-200" />

          </div>

          <button type="button" onClick={googleLogin} disabled={loading || googleLoading} className="group flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">

            {googleLoading ? <Loader2 size={20} className="animate-spin text-zinc-600" aria-hidden="true" /> : <GoogleLogo />}

            <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>

          </button>

          <p className="pt-6 text-center text-sm text-zinc-500">

            Don&apos;t have an account?{" "}

            <Link href="/create-account" className="font-semibold text-green-600 transition hover:text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">Create Account</Link>

          </p>

        </section>

      </div>

    </main>

  );

}
