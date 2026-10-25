
import { createHash, randomInt } from "node:crypto";
import { EncryptJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { passwordResetEmail } from "@/lib/email/password-reset-template";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const COOKIE_NAME = "trashure_recovery_challenge";
const OTP_TTL_SECONDS = 5 * 60;

function getEncryptionKey(): Uint8Array {
  const secret = process.env.PASSWORD_RESET_OTP_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "PASSWORD_RESET_OTP_SECRET must contain at least 32 characters."
    );
  }

  return createHash("sha256").update(secret).digest();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("auth_id, email")
        .ilike("email", email)
        .not("auth_id", "is", null)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Password recovery profile lookup failed:",
        profileError.message
      );

      return NextResponse.json(
        { error: "Unable to process your request. Please try again." },
        { status: 500 }
      );
    }

    if (!profile?.auth_id) {
      return NextResponse.json(
        { error: "This email does not exist in Trashure." },
        { status: 404 }
      );
    }

    const { data: authResult, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(profile.auth_id);

    const authUser = authResult.user;

    if (
      authError ||
      !authUser ||
      !authUser.email ||
      authUser.email.toLowerCase() !== email
    ) {
      console.error("Password recovery account lookup failed.");

      return NextResponse.json(
        { error: "Unable to process your request. Please try again." },
        { status: 500 }
      );
    }

    const otp = randomInt(0, 1_000_000)
      .toString()
      .padStart(6, "0");

    const challenge = await new EncryptJWT({
      purpose: "trashure-password-reset",
      userId: authUser.id,
      email: authUser.email.toLowerCase(),
      otp,
    })
      .setProtectedHeader({
        alg: "dir",
        enc: "A256GCM",
      })
      .setIssuedAt()
      .setExpirationTime(
        Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS
      )
      .encrypt(getEncryptionKey());

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

    if (
      !apiKey ||
      !from ||
      !siteUrl ||
      !siteUrl.startsWith("https://")
    ) {
      throw new Error("Email environment configuration is missing or invalid.");
    }

    const resend = new Resend(apiKey);

    const { error: emailError } = await resend.emails.send({
      from,
      to: [authUser.email],
      subject: `${otp} is your Trashure verification code`,
      text: [
        "TRASHURE | BY TEAM AURELOOP",
        "",
        "Let's get you back in.",
        "",
        `Your verification code is: ${otp}`,
        "",
        "This code expires in 5 minutes.",
        "Never share this code with anyone.",
        "",
        "If you did not request a reset, you can ignore this email.",
        "",
        "Team Aureloop",
        "Building a more sustainable future.",
      ].join("\n"),
      html: passwordResetEmail({
        otp,
        logoUrl: `${siteUrl}/logo.png`,
      }),
    });

    if (emailError) {
      console.error(
        "Resend delivery request failed:",
        emailError.message
      );

      return NextResponse.json(
        { error: "Unable to send the recovery email. Please try again." },
        { status: 502 }
      );
    }

    const response = NextResponse.json({
      message: "Verification code sent. Check your inbox.",
    });

    response.cookies.set(COOKIE_NAME, challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: OTP_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error(
      "Password recovery request failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Unable to process your request. Please try again." },
      { status: 500 }
    );
  }
}
