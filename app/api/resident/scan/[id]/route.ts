import { NextResponse } from "next/server";

import { createRouteClient } from "@/lib/supabase/route";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const SCAN_BUCKET = "resident-scans";


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};


type RouteSupabaseClient = Awaited<
  ReturnType<typeof createRouteClient>
>;


interface ResidentProfile {
  id: string;
  auth_id: string;
  role: string;
}


type ResidentContext =
  | {
      ok: true;
      supabase: RouteSupabaseClient;
      profile: ResidentProfile;
    }
  | {
      ok: false;
      supabase: RouteSupabaseClient;
      response: NextResponse;
    };


function jsonError(
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
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


function isUuid(
  value: string,
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}


async function getResidentContext(): Promise<ResidentContext> {
  const supabase =
    await createRouteClient();


  const {
    data: {
      user,
    },
    error: authError,
  } =
    await supabase.auth.getUser();


  if (
    authError ||
    !user
  ) {
    return {
      ok: false,
      supabase,
      response: jsonError(
        "You must be signed in.",
        401,
        authError,
      ),
    };
  }


  const {
    data: profile,
    error: profileError,
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
    return {
      ok: false,
      supabase,
      response: jsonError(
        "Resident account was not found.",
        404,
        profileError,
      ),
    };
  }


  if (
    profile.role !==
    "resident"
  ) {
    return {
      ok: false,
      supabase,
      response: jsonError(
        "Only resident accounts can manage scans.",
        403,
      ),
    };
  }


  return {
    ok: true,
    supabase,
    profile: profile as ResidentProfile,
  };
}


export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const {
    id,
  } =
    await context.params;


  if (
    !isUuid(id)
  ) {
    return jsonError(
      "Invalid scan identifier.",
      400,
    );
  }


  const resident =
    await getResidentContext();


  if (
    !resident.ok
  ) {
    return resident.response;
  }


  const {
    supabase,
    profile,
  } =
    resident;


  let body: {
    material_id?: unknown;
  };


  try {
    body =
      await request.json();
  } catch {
    return jsonError(
      "The confirmation request is not valid JSON.",
      400,
    );
  }


  if (
    typeof body.material_id !==
      "string" ||
    !isUuid(
      body.material_id,
    )
  ) {
    return jsonError(
      "Select a valid material before confirming the result.",
      400,
    );
  }


  const {
    data: existingScan,
    error: scanError,
  } =
    await supabase
      .from("scans")
      .select(`
        id,
        user_id,
        material_id,
        analysis_status
      `)
      .eq(
        "id",
        id,
      )
      .eq(
        "user_id",
        profile.id,
      )
      .single();


  if (
    scanError ||
    !existingScan
  ) {
    return jsonError(
      "The scan result was not found.",
      404,
      scanError,
    );
  }


  const {
    data: material,
    error: materialError,
  } =
    await supabase
      .from("materials")
      .select(`
        id,
        material_name,
        category
      `)
      .eq(
        "id",
        body.material_id,
      )
      .single();


  if (
    materialError ||
    !material
  ) {
    return jsonError(
      "The selected material was not found.",
      400,
      materialError,
    );
  }


  const corrected =
    existingScan.material_id !==
    material.id;


  const {
    data: updatedScan,
    error: updateError,
  } =
    await supabase
      .from("scans")
      .update({
        material_id:
          material.id,

        material_type:
          material.material_name,

        material_category:
          material.category,

        correction_material_id:
          corrected
            ? material.id
            : null,

        user_confirmed:
          true,

        needs_user_confirmation:
          false,

        analysis_status:
          "completed",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        id,
      )
      .eq(
        "user_id",
        profile.id,
      )
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
    updateError ||
    !updatedScan
  ) {
    return jsonError(
      "The material confirmation could not be saved.",
      500,
      updateError,
    );
  }


  return NextResponse.json({
    scan:
      updatedScan,

    material,

    corrected,
  });
}


export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const {
    id,
  } =
    await context.params;


  if (
    !isUuid(id)
  ) {
    return jsonError(
      "Invalid scan identifier.",
      400,
    );
  }


  const resident =
    await getResidentContext();


  if (
    !resident.ok
  ) {
    return resident.response;
  }


  const {
    supabase,
    profile,
  } =
    resident;


  const {
    data: existingScan,
    error: scanError,
  } =
    await supabase
      .from("scans")
      .select(`
        id,
        user_id,
        image_storage_path
      `)
      .eq(
        "id",
        id,
      )
      .eq(
        "user_id",
        profile.id,
      )
      .single();


  if (
    scanError ||
    !existingScan
  ) {
    return jsonError(
      "The scan result was not found.",
      404,
      scanError,
    );
  }


  const {
    error: deleteError,
  } =
    await supabase
      .from("scans")
      .delete()
      .eq(
        "id",
        id,
      )
      .eq(
        "user_id",
        profile.id,
      );


  if (
    deleteError
  ) {
    return jsonError(
      "The scan record could not be deleted.",
      500,
      deleteError,
    );
  }


  let imageDeleted =
    true;


  if (
    existingScan.image_storage_path
  ) {
    const {
      error: storageError,
    } =
      await supabase.storage
        .from(
          SCAN_BUCKET,
        )
        .remove([
          existingScan.image_storage_path,
        ]);


    if (
      storageError
    ) {
      imageDeleted =
        false;

      console.warn(
        "The scan record was deleted, but image cleanup failed:",
        storageError,
      );
    }
  }


  return NextResponse.json({
    success:
      true,

    image_deleted:
      imageDeleted,
  });
}