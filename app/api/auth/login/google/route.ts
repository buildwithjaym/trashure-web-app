import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");

  let next = searchParams.get("next") ?? "/profiles";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    next = "/profiles";
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login/auth-code-error?reason=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth exchange failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login/auth-code-error?reason=${encodeURIComponent(error.message)}`
    );
  }

  // ---- OAuth-only gate ----
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!profile) {
      next = "/create-account";
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}