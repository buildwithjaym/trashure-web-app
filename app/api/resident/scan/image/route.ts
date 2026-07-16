import { NextResponse } from "next/server";

import { createRouteClient } from "@/lib/supabase/route";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const SCAN_BUCKET = "resident-scans";


function jsonError(
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error: message,
      details: details ?? null,
    },
    {
      status,
    },
  );
}


function isSafeStoragePath(
  path: string,
) {
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("..")
  ) {
    return false;
  }

  const segments =
    path.split("/");


  return (
    segments.length ===
      2 &&
    Boolean(
      segments[0],
    ) &&
    Boolean(
      segments[1],
    )
  );
}


export async function GET(
  request: Request,
) {
  const supabase =
    await createRouteClient();


  const {
    data: {
      user,
    },
    error:
      authError,
  } =
    await supabase.auth.getUser();


  if (
    authError ||
    !user
  ) {
    return jsonError(
      "You must be signed in to view this image.",
      401,
    );
  }


  const {
    data:
      profile,
    error:
      profileError,
  } =
    await supabase
      .from("profiles")
      .select(`
        id,
        auth_id,
        role
      `)
      .eq(
        "auth_id",
        user.id,
      )
      .single();


  if (
    profileError ||
    !profile
  ) {
    return jsonError(
      "Resident account was not found.",
      404,
      profileError,
    );
  }


  if (
    profile.role !==
    "resident"
  ) {
    return jsonError(
      "Only resident accounts can view resident scan images.",
      403,
    );
  }


  const requestUrl =
    new URL(
      request.url,
    );

  const path =
    requestUrl.searchParams.get(
      "path",
    );


  if (
    !path ||
    !isSafeStoragePath(
      path,
    )
  ) {
    return jsonError(
      "A valid scan image path is required.",
      400,
    );
  }


  const [
    ownerFolder,
  ] =
    path.split("/");


  if (
    ownerFolder !==
    user.id
  ) {
    return jsonError(
      "You cannot access this scan image.",
      403,
    );
  }


  const {
    data:
      scan,
    error:
      scanError,
  } =
    await supabase
      .from("scans")
      .select(`
        id,
        user_id,
        image_storage_path
      `)
      .eq(
        "user_id",
        profile.id,
      )
      .eq(
        "image_storage_path",
        path,
      )
      .maybeSingle();


  if (
    scanError
  ) {
    return jsonError(
      "The image ownership could not be verified.",
      500,
      scanError,
    );
  }


  if (
    !scan
  ) {
    return jsonError(
      "The scan image was not found.",
      404,
    );
  }


  const {
    data:
      image,
    error:
      downloadError,
  } =
    await supabase.storage
      .from(SCAN_BUCKET)
      .download(
        path,
      );


  if (
    downloadError ||
    !image
  ) {
    return jsonError(
      "The scan image could not be downloaded.",
      404,
      downloadError,
    );
  }


  const arrayBuffer =
    await image.arrayBuffer();


  return new NextResponse(
    arrayBuffer,
    {
      status:
        200,

      headers: {
        "Content-Type":
          image.type ||
          "application/octet-stream",

        "Content-Length":
          String(
            arrayBuffer.byteLength,
          ),

        "Cache-Control":
          "private, max-age=300, must-revalidate",

        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}
