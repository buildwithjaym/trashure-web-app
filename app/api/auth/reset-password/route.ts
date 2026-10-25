
import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { jwtDecrypt } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const COOKIE_NAME = "trashure_recovery_challenge";

function getEncryptionKey(): Uint8Array {
  const secret = process.env.PASSWORD_RESET_OTP_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Invalid recovery configuration.");
  }

  return createHash("sha256").update(secret).digest();
}

function clearChallenge(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 0,
  });

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const otp =
      typeof body?.otp === "string" ? body.otp.trim() : "";

    const password =
      typeof body?.password === "string" ? body.password : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Enter a valid six-digit code." },
        { status: 400 }
      );
    }

    if (
      password.length < 8 ||
      password.length > 128 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return NextResponse.json(
        { error: "Password does not meet the security requirements." },
        { status: 400 }
      );
    }

    const challenge = request.cookies.get(COOKIE_NAME)?.value;

    if (!challenge) {
      return NextResponse.json(
        { error: "Recovery code expired. Request a new one." },
        { status: 401 }
      );
    }

    let payload;

    try {
      const result = await jwtDecrypt(
        challenge,
        getEncryptionKey(),
        {
          keyManagementAlgorithms: ["dir"],
          contentEncryptionAlgorithms: ["A256GCM"],
        }
      );

      payload = result.payload;
    } catch {
      return clearChallenge(
        NextResponse.json(
          { error: "Recovery code expired. Request a new one." },
          { status: 401 }
        )
      );
    }

    if (
      payload.purpose !== "trashure-password-reset" ||
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.otp !== "string" ||
      payload.email.toLowerCase() !== email
    ) {
      return NextResponse.json(
        { error: "Invalid recovery request." },
        { status: 401 }
      );
    }

    const expected = Buffer.from(payload.otp, "utf8");
    const received = Buffer.from(otp, "utf8");

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.updateUserById(
        payload.userId,
        { password }
      );

    if (error || !data.user) {
      console.error("Password update failed:", error?.message);

      return NextResponse.json(
        { error: "Unable to update password." },
        { status: 500 }
      );
    }

    return clearChallenge(
      NextResponse.json({
        message: "Password updated successfully.",
      })
    );
  } catch (error) {
    console.error("Password reset failed:", error);

    return NextResponse.json(
      { error: "Unable to reset password." },
      { status: 500 }
    );
  }
}
