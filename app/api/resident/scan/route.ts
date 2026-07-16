import { NextResponse } from "next/server";

import {
  analyzeResidentImage,
  type MaterialOption,
} from "@/lib/gemini/resident-scan";
import { createRouteClient } from "@/lib/supabase/route";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;


const SCAN_BUCKET = "resident-scans";

const MAX_FILE_BYTES =
  5 * 1024 * 1024;

const MAX_HINT_LENGTH =
  300;

const MAX_SCANS_PER_MINUTE =
  3;

const MAX_SCANS_PER_DAY =
  100;

const ALLOWED_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);


interface ResidentProfileRow {
  id: string;
  auth_id: string;
  full_name: string;
  role: string;
  barangay: string | null;
  city: string | null;
  province: string | null;
}


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


function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (
      error as {
        message?: unknown;
      }
    ).message === "string"
  ) {
    return (
      error as {
        message: string;
      }
    ).message;
  }

  return fallback;
}


function extensionFromMimeType(
  mimeType: string,
) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  return "webp";
}


function beginningOfToday() {
  const date =
    new Date();

  date.setHours(
    0,
    0,
    0,
    0,
  );

  return date.toISOString();
}


function residentLocation(
  profile: ResidentProfileRow,
) {
  return [
    profile.barangay,
    profile.city,
    profile.province,
  ]
    .filter(Boolean)
    .join(", ");
}


async function removeUploadedFile(
  supabase: Awaited<
    ReturnType<
      typeof createRouteClient
    >
  >,
  path: string | null,
) {
  if (!path) {
    return;
  }

  const {
    error,
  } =
    await supabase.storage
      .from(SCAN_BUCKET)
      .remove([
        path,
      ]);

  if (error) {
    console.warn(
      "Resident scan image cleanup failed:",
      error,
    );
  }
}


export async function POST(
  request: Request,
) {
  const supabase =
    await createRouteClient();

  let uploadedPath:
    string | null = null;


  try {
    /* ---------------------------------------------------------
       1. AUTHENTICATE THE CURRENT USER
    --------------------------------------------------------- */

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
        "You must be signed in to scan an item.",
        401,
      );
    }


    /* ---------------------------------------------------------
       2. LOAD AND VALIDATE THE RESIDENT PROFILE
    --------------------------------------------------------- */

    const {
      data:
        profileData,
      error:
        profileError,
    } =
      await supabase
        .from("profiles")
        .select(`
          id,
          auth_id,
          full_name,
          role,
          barangay,
          city,
          province
        `)
        .eq(
          "auth_id",
          user.id,
        )
        .single();


    if (
      profileError ||
      !profileData
    ) {
      return jsonError(
        "Resident account was not found.",
        404,
        profileError,
      );
    }


    const profile =
      profileData as ResidentProfileRow;


    if (
      profile.role !==
      "resident"
    ) {
      return jsonError(
        "Only resident accounts can use this scanner.",
        403,
      );
    }


    /* ---------------------------------------------------------
       3. BASIC APPLICATION-LEVEL RATE LIMITING

       This counts successfully saved scans. A production system
       with public traffic should also use an external limiter.
    --------------------------------------------------------- */

    const oneMinuteAgo =
      new Date(
        Date.now() -
          60_000,
      ).toISOString();


    const [
      minuteCountResult,
      dailyCountResult,
    ] =
      await Promise.all([
        supabase
          .from("scans")
          .select(
            "id",
            {
              count:
                "exact",

              head:
                true,
            },
          )
          .eq(
            "user_id",
            profile.id,
          )
          .gte(
            "created_at",
            oneMinuteAgo,
          ),

        supabase
          .from("scans")
          .select(
            "id",
            {
              count:
                "exact",

              head:
                true,
            },
          )
          .eq(
            "user_id",
            profile.id,
          )
          .gte(
            "created_at",
            beginningOfToday(),
          ),
      ]);


    if (
      minuteCountResult.error ||
      dailyCountResult.error
    ) {
      return jsonError(
        "The scanner rate limit could not be verified.",
        500,
        minuteCountResult.error ??
          dailyCountResult.error,
      );
    }


    if (
      (
        minuteCountResult.count ??
        0
      ) >=
      MAX_SCANS_PER_MINUTE
    ) {
      return jsonError(
        "Too many scan requests. Wait one minute before trying again.",
        429,
      );
    }


    if (
      (
        dailyCountResult.count ??
        0
      ) >=
      MAX_SCANS_PER_DAY
    ) {
      return jsonError(
        "The daily scan limit has been reached.",
        429,
      );
    }


    /* ---------------------------------------------------------
       4. READ AND VALIDATE THE MULTIPART FORM
    --------------------------------------------------------- */

    let formData:
      FormData;

    try {
      formData =
        await request.formData();
    } catch {
      return jsonError(
        "The scan request must contain multipart form data.",
        400,
      );
    }


    const image =
      formData.get(
        "image",
      );

    const userHint =
      String(
        formData.get(
          "user_hint",
        ) ??
          "",
      )
        .trim()
        .slice(
          0,
          MAX_HINT_LENGTH,
        );


    if (
      !(
        image instanceof
        File
      )
    ) {
      return jsonError(
        "Select or capture an image.",
        400,
      );
    }


    if (
      !ALLOWED_MIME_TYPES.has(
        image.type,
      )
    ) {
      return jsonError(
        "Only JPEG, PNG, and WebP images are supported.",
        400,
      );
    }


    if (
      image.size <=
        0 ||
      image.size >
        MAX_FILE_BYTES
    ) {
      return jsonError(
        "The processed image must be smaller than 5 MB.",
        400,
      );
    }


    /* ---------------------------------------------------------
       5. LOAD THE DATABASE MATERIAL CATALOG
    --------------------------------------------------------- */

    const {
      data:
        materialRows,
      error:
        materialError,
    } =
      await supabase
        .from("materials")
        .select(`
          id,
          material_name,
          category
        `)
        .order(
          "category",
          {
            ascending:
              true,
          },
        )
        .order(
          "material_name",
          {
            ascending:
              true,
          },
        );


    if (materialError) {
      return jsonError(
        "The material catalog could not be loaded.",
        500,
        materialError,
      );
    }


    const materials =
      (
        materialRows ??
        []
      ) as MaterialOption[];


    if (
      materials.length ===
      0
    ) {
      return jsonError(
        "The material catalog is empty. Add materials before using the scanner.",
        503,
      );
    }


    /* ---------------------------------------------------------
       6. ANALYZE THE IMAGE WITH GEMINI
    --------------------------------------------------------- */

    const imageBuffer =
      Buffer.from(
        await image.arrayBuffer(),
      );


    const analysis =
      await analyzeResidentImage({
        imageBuffer,

        mimeType:
          image.type,

        materials,

        userHint,

        location:
          residentLocation(
            profile,
          ),
      });


    /* ---------------------------------------------------------
       7. UPLOAD THE PROCESSED IMAGE TO PRIVATE STORAGE
    --------------------------------------------------------- */

    const fileExtension =
      extensionFromMimeType(
        image.type,
      );


    uploadedPath =
      `${user.id}/${crypto.randomUUID()}.${fileExtension}`;


    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(SCAN_BUCKET)
        .upload(
          uploadedPath,
          imageBuffer,
          {
            contentType:
              image.type,

            cacheControl:
              "3600",

            upsert:
              false,
          },
        );


    if (uploadError) {
      uploadedPath =
        null;

      return jsonError(
        "The scan image could not be stored.",
        500,
        uploadError,
      );
    }


    /* ---------------------------------------------------------
       8. SAVE THE NORMALIZED RESULT
    --------------------------------------------------------- */

    const result =
      analysis.result;


    const analysisStatus =
      result.needs_user_confirmation
        ? "needs_confirmation"
        : "completed";


    const protectedImageUrl =
      `/api/resident/scan/image?path=${encodeURIComponent(
        uploadedPath,
      )}`;


    const recommendedAction = {
      primary_action:
        result.primary_action,

      title:
        result.action_title,

      description:
        result.action_description,

      alternatives:
        result.alternative_actions,

      confirmation_question:
        result.confirmation_question,
    };


    const {
      data:
        insertedScan,
      error:
        insertError,
    } =
      await supabase
        .from("scans")
        .insert({
          user_id:
            profile.id,

          image_url:
            protectedImageUrl,

          image_storage_path:
            uploadedPath,

          detected_object:
            result.detected_object,

          object_description:
            result.object_description,

          material_id:
            result.matched_material?.id ??
            null,

          material_type:
            result.material_name,

          material_category:
            result.material_category,

          condition:
            result.condition,

          confidence_score:
            result.confidence_score,

          primary_action:
            result.primary_action,

          recommended_action:
            recommendedAction,

          preparation_steps:
            result.preparation_steps,

          hazardous:
            result.hazardous,

          hazard_notes:
            result.hazard_notes ||
            null,

          needs_user_confirmation:
            result.needs_user_confirmation,

          user_confirmed:
            false,

          correction_material_id:
            null,

          ai_raw_result:
            result,

          model_name:
            analysis.model,

          analysis_status:
            analysisStatus,

          barangay:
            profile.barangay,

          updated_at:
            new Date().toISOString(),
        })
        .select(`
          id,
          user_id,
          image_url,
          image_storage_path,
          detected_object,
          object_description,
          material_id,
          material_type,
          material_category,
          condition,
          confidence_score,
          primary_action,
          recommended_action,
          preparation_steps,
          hazardous,
          hazard_notes,
          needs_user_confirmation,
          user_confirmed,
          correction_material_id,
          model_name,
          analysis_status,
          barangay,
          created_at,
          updated_at
        `)
        .single();


    if (
      insertError ||
      !insertedScan
    ) {
      await removeUploadedFile(
        supabase,
        uploadedPath,
      );

      uploadedPath =
        null;

      return jsonError(
        "The scan result could not be saved.",
        500,
        insertError,
      );
    }


    /* ---------------------------------------------------------
       9. RETURN THE SAVED SCAN
    --------------------------------------------------------- */

    return NextResponse.json(
      {
        scan:
          insertedScan,

        matched_material:
          result.matched_material,

        model:
          analysis.model,
      },
      {
        status:
          201,
      },
    );
  } catch (error) {
    await removeUploadedFile(
      supabase,
      uploadedPath,
    );

    console.error(
      "Resident scan API failed:",
      error,
    );


    const message =
      getErrorMessage(
        error,
        "Unable to analyze the image.",
      );


    const status =
      message.includes(
        "GEMINI_API_KEY",
      ) ||
      message.includes(
        "not configured",
      )
        ? 503
        : 500;


    return jsonError(
      message,
      status,
    );
  }
}
