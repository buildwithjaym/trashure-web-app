"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const steps = ["Account", "Profile", "Location", "Role"];

const roles = [
  {
    value: "resident",
    title: "Resident",
    description: "Scan materials and discover their circular value.",
  },
  {
    value: "school_partner",
    title: "School / Community Partner",
    description: "Receive materials for sustainability projects.",
  },
  {
    value: "recycler_partner",
    title: "Recycler Partner",
    description: "Connect recycling opportunities and materials.",
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

export default function CreateAccountPage() {
  const router = useRouter();
  const supabase = createClient();

  // The single source of truth for "which mode are we in".
  // null  → guest mode (email/password signup)
  // User  → OAuth mode (already signed in, e.g. via Google)
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<Form>(emptyForm);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const isOAuth = Boolean(authUser);

  const updateField = (field: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ---- Load existing session (OAuth prefill) --------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled || !user) return;

        setAuthUser(user);

        const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;

        setForm((prev) => ({
          ...prev,
          full_name: meta.full_name ?? meta.name ?? prev.full_name,
          email: user.email ?? prev.email,
          // password is intentionally never prefilled from metadata
        }));

        // Try to reuse the OAuth avatar (Google sets avatar_url/picture)
        const avatarUrl = meta.avatar_url ?? meta.picture;
        if (avatarUrl) {
          try {
            const res = await fetch(avatarUrl);
            const type = res.headers.get("content-type") ?? "";
            if (res.ok && type.startsWith("image/")) {
              const blob = await res.blob();
              const file = new File([blob], "avatar.jpg", { type: blob.type });
              if (!cancelled) handleImage(file);
            }
          } catch {
            // silent — user can still upload manually
          }
        }
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Free the object URL when the preview changes or on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // ---- Image handling ------------------------------------------------------
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

  // ---- Step navigation -----------------------------------------------------
  const nextStep = () => {
    if (step > 4) return;

    if (step === 1) {
      if (!form.full_name || !form.email) {
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
      if (!form.barangay || !form.city || !form.province) {
        toast.error("Complete your location.");
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  // ---- Upload avatar, return public URL (or "" if none) --------------------
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

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  // ---- Submit --------------------------------------------------------------
  const createAccount = async () => {
    if (!form.role) {
      toast.error("Select your account type.");
      return;
    }

    setLoading(true);
    try {
      // STEP 1: resolve the auth user id
      let authId: string;

      if (isOAuth && authUser) {
        // Already signed in — use the existing session
        authId = authUser.id;
      } else {
        // Guest mode — create the auth account first
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
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

      // STEP 2: upload avatar (if any)
      const avatarUrl = await uploadAvatar(authId);
      if (avatarUrl === null) return; // upload failed, already toasted

      // STEP 3: write the profile (upsert is safe for both modes)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            auth_id: authId,
            full_name: form.full_name,
            email: form.email,
            avatar_url: avatarUrl,
            age: Number(form.age),
            sex: form.sex,
            barangay: form.barangay,
            city: form.city,
            province: form.province,
            role: form.role,
            onboarding_completed: true,
          },
          { onConflict: "auth_id" },
        );

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      toast.success("You successfully created your account!");
      router.push("/profiles");
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Render --------------------------------------------------------------
  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-green-50 to-emerald-100">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-green-50 to-emerald-100 px-4 py-8">
      <div className="w-full max-w-xl rounded-[32px] border border-green-100 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-green-600"
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        {/* Step indicator */}
        <div className="mt-8 flex justify-between">
          {steps.map((item, index) => {
            const active = index + 1 === step;
            const done = index + 1 < step;
            return (
              <div key={item} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    active || done
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {done ? <Check size={18} /> : index + 1}
                </div>
                <span className="text-xs font-medium">{item}</span>
              </div>
            );
          })}
        </div>

        <h1 className="mt-10 text-3xl font-black text-zinc-900">
          Create your Trashure account
        </h1>

        {/* Step 1 — Account */}
        {step === 1 && (
          <div className="mt-6 space-y-4">
            <input
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 p-3 outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Email address"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={isOAuth}
              className="w-full rounded-xl border border-zinc-200 p-3 outline-none focus:ring-2 focus:ring-green-500 disabled:bg-zinc-50 disabled:text-zinc-500"
            />
            {/* Password only for guest signup — OAuth users don't have one */}
            {!isOAuth && (
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="w-full rounded-xl border border-zinc-200 p-3 outline-none focus:ring-2 focus:ring-green-500"
              />
            )}
            {isOAuth && (
              <p className="text-xs text-zinc-500">
                You&apos;re signed in with Google. Just finish your profile below.
              </p>
            )}
          </div>
        )}

        {/* Step 2 — Profile */}
        {step === 2 && (
          <div className="mt-6 space-y-5">
            <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-green-200 p-6 text-center hover:bg-green-50">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile preview"
                  className="mx-auto h-28 w-28 rounded-full object-cover"
                />
              ) : (
                <div>
                  <ImagePlus className="mx-auto text-green-600" />
                  <p className="mt-3 font-medium">Upload profile photo</p>
                  <p className="text-sm text-zinc-500">JPG PNG WEBP • Max 5MB</p>
                </div>
              )}
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => e.target.files && handleImage(e.target.files[0])}
              />
            </label>

            <input
              placeholder="Age"
              type="number"
              min={13}
              max={120}
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
              className="w-full rounded-xl border p-3"
            />

            <select
              value={form.sex}
              onChange={(e) => updateField("sex", e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option value="">Select sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>
          </div>
        )}

        {/* Step 3 — Location */}
        {step === 3 && (
          <div className="mt-6 space-y-4">
            <input
              placeholder="Barangay"
              value={form.barangay}
              onChange={(e) => updateField("barangay", e.target.value)}
              className="w-full rounded-xl border p-3"
            />
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="w-full rounded-xl border p-3"
            />
            <input
              placeholder="Province"
              value={form.province}
              onChange={(e) => updateField("province", e.target.value)}
              className="w-full rounded-xl border p-3"
            />
          </div>
        )}

        {/* Step 4 — Role */}
        {step === 4 && (
          <div className="mt-6 space-y-3">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => updateField("role", role.value)}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  form.role === role.value
                    ? "border-green-600 bg-green-50"
                    : "border-zinc-200 hover:border-green-300"
                }`}
              >
                <h3 className="font-bold">{role.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{role.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* Footer navigation */}
        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-xl border px-5 py-3"
              disabled={loading}
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              disabled={loading}
              onClick={nextStep}
              className="ml-auto flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-white disabled:opacity-60"
            >
              Next
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              disabled={loading || uploading}
              onClick={createAccount}
              className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-700 px-6 py-3 text-white disabled:opacity-60"
            >
              {loading || uploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}