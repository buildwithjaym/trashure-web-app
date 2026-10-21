import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isSafeNextPath(value: string | null): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.startsWith("/\\")) return false;
  return true;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  // ---- Safe redirect target (default: /profiles) ----
  const next = isSafeNextPath(nextParam) ? nextParam : "/profiles";

  // ---- Missing code ----
  if (!code) {
    return NextResponse.redirect(
      `${origin}/login/auth-code-error?reason=no_code`,
    );
  }

  // ---- Exchange code for session ----
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth exchange failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login/auth-code-error?reason=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  // ---- OAuth-only gate: no profile → onboarding ----
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Exchange succeeded but no user — treat as auth failure.
    return NextResponse.redirect(
      `${origin}/login/auth-code-error?reason=no_user`,
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup failed:", profileError.message);
    return NextResponse.redirect(
      `${origin}/login/auth-code-error?reason=${encodeURIComponent(
        "profile_lookup_failed",
      )}`,
    );
  }

  // Has profile → honor `next` (safe). No profile → force onboarding.
  const destination = profile ? next : "/create-account";

  return NextResponse.redirect(`${origin}${destination}`);
}