
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  UserRound,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const steps = [
  { label: "Account", short: "Account", icon: LockKeyhole },
  { label: "Profile", short: "Profile", icon: UserRound },
  { label: "Location", short: "Location", icon: MapPin },
  { label: "Role", short: "Role", icon: Users },
];

const roles = [
  {
    value: "resident",
    title: "Resident",
    description: "Discover the value of discarded materials.",
    icon: UserRound,
  },
  {
    value: "school_partner",
    title: "School / Community Partner",
    description: "Support sustainability projects and communities.",
    icon: Users,
  },
  {
    value: "recycler_partner",
    title: "Recycler Partner",
    description: "Connect recycling opportunities and materials.",
    icon: MapPin,
  },
];

type Form = {
  full_name: string;
  email: string;
  password: string;
  age: string;
  sex: string;
  barangay: string;
  city: string;
  province: string;
  role: string;
};

const emptyForm: Form = {
  full_name: "",
  email: "",
  password: "",
  age: "",
  sex: "",
  barangay: "",
  city: "",
  province: "",
  role: "",
};

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 sm:text-sm";

export default function CreateAccountPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<Form>(emptyForm);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isOAuth = Boolean(authUser);

  const updateField = (field: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled || !user) return;

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (existingProfile) {
          router.replace("/profiles");
          return;
        }

        setAuthUser(user);

        const meta = (user.user_metadata ?? {}) as Record<
          string,
          string | undefined
        >;

        setForm((prev) => ({
          ...prev,
          full_name: meta.full_name ?? meta.name ?? prev.full_name,
          email: user.email ?? prev.email,
        }));

        const avatarUrl = meta.avatar_url ?? meta.picture;

        if (avatarUrl) {
          try {
            const res = await fetch(avatarUrl);
            const type = res.headers.get("content-type") ?? "";

            if (res.ok && type.startsWith("image/")) {
              const blob = await res.blob();
              const file = new File([blob], "avatar.jpg", {
                type: blob.type,
              });

              if (!cancelled) handleImage(file);
            }
          } catch {
            // User can upload a profile photo manually.
          }
        }
      } catch {
        if (!cancelled) {
          toast.error("Unable to check your account. Please try again.");
        }
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleImage = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be below 5MB.");
      return;
    }

    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const nextStep = () => {
    if (step > 4) return;

    if (step === 1) {
      if (!form.full_name.trim() || !form.email.trim()) {
        toast.error("Complete your account information.");
        return;
      }

      if (!isOAuth && !form.password) {
        toast.error("Password is required.");
        return;
      }
    }

    if (step === 2) {
      const age = Number(form.age);

      if (!form.age || Number.isNaN(age) || age < 13 || age > 120) {
        toast.error("Enter a valid age.");
        return;
      }

      if (!form.sex) {
        toast.error("Select your sex.");
        return;
      }

      if (!avatar) {
        toast.error("Add a profile photo.");
        return;
      }
    }

    if (step === 3) {
      if (
        !form.barangay.trim() ||
        !form.city.trim() ||
        !form.province.trim()
      ) {
        toast.error("Complete your location.");
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const uploadAvatar = async (authId: string): Promise<string | null> => {
    if (!avatar) return "";

    setUploading(true);

    try {
      const ext = avatar.name.split(".").pop() || "jpg";
      const filePath = `${authId}/profile.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatar, { upsert: true });

      if (uploadError) {
        toast.error(uploadError.message);
        return null;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const createAccount = async () => {
    if (!form.role) {
      toast.error("Select your account type.");
      return;
    }

    setLoading(true);

    try {
      let authId: string;

      if (isOAuth && authUser) {
        authId = authUser.id;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.full_name,
              role: form.role,
            },
          },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (!data.user) {
          toast.error("Unable to create account.");
          return;
        }

        authId = data.user.id;
      }

      const avatarUrl = await uploadAvatar(authId);

      if (avatarUrl === null) return;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            auth_id: authId,
            full_name: form.full_name,
            email: form.email.trim(),
            avatar_url: avatarUrl,
            age: Number(form.age),
            sex: form.sex,
            barangay: form.barangay,
            city: form.city,
            province: form.province,
            role: form.role,
            onboarding_completed: true,
          },
          { onConflict: "auth_id" }
        );

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      toast.success("You successfully created your account!");
      router.push("/profiles");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f4faf5] px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <Loader2
              className="animate-spin text-emerald-700"
              size={24}
            />
          </div>
          <p className="text-sm text-zinc-500">
            Preparing your registration...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#f4faf5] px-3 py-4 sm:px-5 sm:py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-32 -top-32 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-36 -right-24 h-80 w-80 rounded-full bg-green-200/40 blur-3xl"
      />

      <section className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white bg-white shadow-xl shadow-emerald-950/5 sm:rounded-3xl lg:min-h-[min(700px,calc(100dvh-40px))] lg:flex-row">
        <aside className="relative hidden w-[36%] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#123d2c] via-[#126344] to-[#07834b] p-7 text-white lg:flex xl:p-9">
          <div
            aria-hidden="true"
            className="absolute -right-24 top-20 h-64 w-64 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -right-12 top-32 h-40 w-40 rounded-full border border-white/10"
          />

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5">
                <img
                  src="/logo.png"
                  alt="Trashure"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-lg font-black tracking-wider">TRASHURE</p>
                <p className="text-[9px] tracking-[0.2em] text-emerald-100">
                  TEAM AURELOOP
                </p>
              </div>
            </Link>

            <div className="mt-20 xl:mt-24">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] text-emerald-50">
                <CheckCircle2 size={14} />
                Join the circular economy
              </div>

              <h1 className="mt-5 text-4xl font-black leading-[1.12] tracking-tight xl:text-[42px]">
                Make every
                <br />
                resource
                <br />
                <span className="text-emerald-200">count.</span>
              </h1>

              <p className="mt-4 max-w-[250px] text-sm leading-6 text-emerald-50/80">
                Create your account and help turn discarded materials into
                opportunities for a greener community.
              </p>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/15 pt-4">
            <p className="text-xs leading-5 text-emerald-100/70">
              A smarter, more sustainable future starts with you.
            </p>
            <p className="mt-3 text-[10px] text-emerald-100/50">
              © {new Date().getFullYear()} Trashure · Team Aureloop
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6 lg:p-8 xl:p-10">
          <header className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-zinc-500 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <ArrowLeft size={15} />
              Home
            </Link>

            <span className="text-right text-xs text-zinc-400">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Sign in
              </Link>
            </span>
          </header>

          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
            <div className="mb-4 mt-5 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-100 bg-white p-1 shadow-sm">
                <img
                  src="/logo.png"
                  alt="Trashure"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-black tracking-wide text-zinc-900">
                  TRASHURE
                </p>
                <p className="text-[10px] tracking-wider text-emerald-700">
                  BY TEAM AURELOOP
                </p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                Step {step} of {steps.length}
              </p>

              <h2 className="mt-1.5 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                {step === 1 && "Create your account"}
                {step === 2 && "Build your profile"}
                {step === 3 && "Where are you located?"}
                {step === 4 && "Choose your role"}
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-500 sm:text-sm">
                {step === 1 && "Start with your basic account information."}
                {step === 2 && "Help your community recognize your profile."}
                {step === 3 && "Tell us where you're based."}
                {step === 4 &&
                  "Choose how you want to participate in Trashure."}
              </p>
            </div>

            <nav aria-label="Registration progress" className="mb-5">
              <div className="flex items-start">
                {steps.map((item, index) => {
                  const number = index + 1;
                  const active = number === step;
                  const done = number < step;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="relative flex min-w-0 flex-1 flex-col items-center"
                    >
                      {index > 0 && (
                        <div
                          className={`absolute right-1/2 top-[15px] h-[2px] w-full ${
                            done ? "bg-emerald-500" : "bg-zinc-200"
                          }`}
                          aria-hidden="true"
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-[31px] w-[31px] items-center justify-center rounded-full border transition-colors ${
                          done
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : active
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-50"
                              : "border-zinc-200 bg-white text-zinc-400"
                        }`}
                        aria-current={active ? "step" : undefined}
                      >
                        {done ? <Check size={15} /> : <Icon size={14} />}
                      </div>

                      <span
                        className={`mt-2 text-[10px] font-semibold sm:text-xs ${
                          active
                            ? "text-emerald-800"
                            : done
                              ? "text-zinc-600"
                              : "text-zinc-400"
                        }`}
                      >
                        {item.short}
                      </span>
                    </div>
                  );
                })}
              </div>
            </nav>

            <div className="min-w-0">
              {step === 1 && (
                <div className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="full-name"
                      className="mb-1.5 block text-xs font-semibold text-zinc-700"
                    >
                      Full name
                    </label>
                    <input
                      id="full-name"
                      name="name"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={form.full_name}
                      onChange={(e) =>
                        updateField("full_name", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="mb-1.5 block text-xs font-semibold text-zinc-700"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                      <input
                        id="signup-email"
                        name="email"
                        autoComplete="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) =>
                          updateField("email", e.target.value)
                        }
                        disabled={isOAuth}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  {!isOAuth && (
                    <div>
                      <label
                        htmlFor="signup-password"
                        className="mb-1.5 block text-xs font-semibold text-zinc-700"
                      >
                        Password
                      </label>

                      <div className="group relative">
                        <LockKeyhole
                          size={17}
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-emerald-600"
                        />

                        <input
                          id="signup-password"
                          name="password"
                          autoComplete="new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={form.password}
                          onChange={(e) =>
                            updateField("password", e.target.value)
                          }
                          className={`${inputClass} pl-10 pr-12`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((visible) => !visible)
                          }
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          {showPassword ? (
                            <EyeOff size={19} aria-hidden="true" />
                          ) : (
                            <Eye size={19} aria-hidden="true" />
                          )}
                        </button>
                      </div>

                      <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">
                        Use a password you can remember and keep private.
                      </p>
                    </div>
                  )}

                  {isOAuth && (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-700"
                      />
                      <p className="text-xs leading-5 text-emerald-800">
                        Google sign-in connected. Continue to complete your
                        profile.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-3 transition hover:border-emerald-500 hover:bg-emerald-50 sm:gap-4 sm:p-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Camera size={24} className="text-emerald-600" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-800">
                        {preview
                          ? "Change profile photo"
                          : "Add a profile photo"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        JPG, PNG or WEBP · Maximum 5MB
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <ImagePlus size={13} />
                        Choose image
                      </span>
                    </div>

                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImage(file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="signup-age"
                        className="mb-1.5 block text-xs font-semibold text-zinc-700"
                      >
                        Age
                      </label>
                      <input
                        id="signup-age"
                        type="number"
                        min={13}
                        max={120}
                        placeholder="Your age"
                        value={form.age}
                        onChange={(e) =>
                          updateField("age", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="signup-sex"
                        className="mb-1.5 block text-xs font-semibold text-zinc-700"
                      >
                        Sex
                      </label>
                      <select
                        id="signup-sex"
                        value={form.sex}
                        onChange={(e) =>
                          updateField("sex", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer_not">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
                      <MapPin size={18} />
                    </div>
                    <p className="text-xs leading-5 text-emerald-900">
                      Your location helps Trashure connect you with relevant
                      community opportunities.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-barangay"
                      className="mb-1.5 block text-xs font-semibold text-zinc-700"
                    >
                      Barangay
                    </label>
                    <input
                      id="signup-barangay"
                      autoComplete="address-level3"
                      placeholder="Enter your barangay"
                      value={form.barangay}
                      onChange={(e) =>
                        updateField("barangay", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="signup-city"
                        className="mb-1.5 block text-xs font-semibold text-zinc-700"
                      >
                        City / Municipality
                      </label>
                      <input
                        id="signup-city"
                        autoComplete="address-level2"
                        placeholder="City"
                        value={form.city}
                        onChange={(e) =>
                          updateField("city", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="signup-province"
                        className="mb-1.5 block text-xs font-semibold text-zinc-700"
                      >
                        Province
                      </label>
                      <input
                        id="signup-province"
                        autoComplete="address-level1"
                        placeholder="Province"
                        value={form.province}
                        onChange={(e) =>
                          updateField("province", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-2.5">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const selected = form.role === role.value;

                    return (
                      <button
                        key={role.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => updateField("role", role.value)}
                        className={`flex min-h-[76px] w-full items-center gap-3 rounded-xl border p-3 text-left transition sm:p-3.5 ${
                          selected
                            ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10"
                            : "border-zinc-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-emerald-600 text-white"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          <Icon size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-zinc-800">
                            {role.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                            {role.description}
                          </p>
                        </div>

                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-zinc-300"
                          }`}
                        >
                          {selected && <Check size={12} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-zinc-100 pt-4">
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                disabled={step === 1 || loading || uploading}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:invisible sm:px-4 sm:text-sm"
              >
                <ArrowLeft size={15} />
                Back
              </button>

              <p
                className="text-center text-[10px] text-zinc-400 sm:text-xs"
                aria-live="polite"
              >
                {step === 4 ? "Almost there!" : `${step} of ${steps.length}`}
              </p>

              {step < 4 ? (
                <button
                  type="button"
                  disabled={loading || uploading}
                  onClick={nextStep}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 px-4 text-xs font-bold text-white shadow-md shadow-emerald-700/15 transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 disabled:opacity-50 sm:gap-2 sm:px-6 sm:text-sm"
                >
                  Continue
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading || uploading}
                  onClick={createAccount}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 px-3 text-xs font-bold text-white shadow-md shadow-emerald-700/15 transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 disabled:opacity-50 sm:gap-2 sm:px-5 sm:text-sm"
                >
                  {loading || uploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create account
                      <Check size={15} />
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-[10px] leading-4 text-zinc-400">
              By creating an account, you&apos;re joining a more sustainable
              future with Trashure.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
