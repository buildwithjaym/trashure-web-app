import { NextResponse } from "next/server";

import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { createRouteClient } from "@/lib/supabase/route";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const SCAN_BUCKET =
  "resident-scans";


function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
  }

  return createSupabaseAdminClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken:
          false,

        persistSession:
          false,
      },
    },
  );
}


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};


function jsonError(
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error:
        message,

      details:
        details ??
        null,
    },
    {
      status,
    },
  );
}


function isUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}


export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const {
    id,
  } =
    await context.params;

  if (
    !isUuid(
      id,
    )
  ) {
    return jsonError(
      "Invalid opportunity identifier.",
      400,
    );
  }

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
      .from(
        "profiles",
      )
      .select(`
        id,
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
      "Profile was not found.",
      404,
      profileError,
    );
  }

  const {
    data:
      opportunity,
    error:
      opportunityError,
  } =
    await supabase
      .from(
        "material_opportunities",
      )
      .select(`
        id,
        resident_profile_id,
        material_id,
        scan_id,
        status,
        selected_junkshop_id
      `)
      .eq(
        "id",
        id,
      )
      .maybeSingle();

  if (
    opportunityError
  ) {
    return jsonError(
      "The opportunity could not be loaded.",
      500,
      opportunityError,
    );
  }

  if (
    !opportunity
  ) {
    return jsonError(
      "The opportunity image was not found.",
      404,
    );
  }

  let authorized =
    false;

  if (
    profile.role ===
      "resident" &&
    opportunity.resident_profile_id ===
      profile.id
  ) {
    authorized =
      true;
  }

  if (
    profile.role ===
      "recycler_partner"
  ) {
    const {
      data:
        junkshop,
      error:
        junkshopError,
    } =
      await supabase
        .from(
          "junkshops",
        )
        .select(`
          id,
          verification_status,
          is_active
        `)
        .eq(
          "profile_id",
          profile.id,
        )
        .maybeSingle();

    if (
      junkshopError
    ) {
      return jsonError(
        "Recycler authorization could not be verified.",
        500,
        junkshopError,
      );
    }

    if (
      junkshop &&
      junkshop.verification_status ===
        "approved" &&
      junkshop.is_active
    ) {
      if (
        (
          opportunity.status ===
            "accepted" ||
          opportunity.status ===
            "completed"
        ) &&
        opportunity.selected_junkshop_id ===
          junkshop.id
      ) {
        authorized =
          true;
      }

      if (
        opportunity.status ===
        "open"
      ) {
        const {
          data:
            acceptedMaterial,
          error:
            acceptedMaterialError,
        } =
          await supabase
            .from(
              "junkshop_materials",
            )
            .select(
              "id",
            )
            .eq(
              "junkshop_id",
              junkshop.id,
            )
            .eq(
              "material_id",
              opportunity.material_id,
            )
            .eq(
              "is_accepting",
              true,
            )
            .maybeSingle();

        if (
          acceptedMaterialError
        ) {
          return jsonError(
            "Material authorization could not be verified.",
            500,
            acceptedMaterialError,
          );
        }

        authorized =
          Boolean(
            acceptedMaterial,
          );
      }
    }
  }

  if (
    !authorized
  ) {
    return jsonError(
      "You cannot access this opportunity image.",
      403,
    );
  }

  if (
    !opportunity.scan_id
  ) {
    return jsonError(
      "This opportunity has no linked scan image.",
      404,
    );
  }

  let admin:
    ReturnType<
      typeof createAdminClient
    >;

  try {
    admin =
      createAdminClient();
  } catch (
    error
  ) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "The opportunity image service is not configured.",
      503,
    );
  }

  const {
    data:
      scan,
    error:
      scanError,
  } =
    await admin
      .from(
        "scans",
      )
      .select(`
        id,
        user_id,
        material_id,
        image_storage_path
      `)
      .eq(
        "id",
        opportunity.scan_id,
      )
      .eq(
        "user_id",
        opportunity.resident_profile_id,
      )
      .maybeSingle();

  if (
    scanError
  ) {
    return jsonError(
      "The linked scan could not be loaded.",
      500,
      scanError,
    );
  }

  if (
    !scan?.image_storage_path
  ) {
    return jsonError(
      "The linked scan image was not found.",
      404,
    );
  }

  if (
    scan.material_id !==
    opportunity.material_id
  ) {
    return jsonError(
      "The opportunity material no longer matches the scan.",
      409,
    );
  }

  const {
    data:
      image,
    error:
      downloadError,
  } =
    await admin.storage
      .from(
        SCAN_BUCKET,
      )
      .download(
        scan.image_storage_path,
      );

  if (
    downloadError ||
    !image
  ) {
    return jsonError(
      "The opportunity image could not be downloaded.",
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