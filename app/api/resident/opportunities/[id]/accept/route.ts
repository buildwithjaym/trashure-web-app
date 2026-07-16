import type {
  NextRequest,
} from "next/server";

import {
  NextResponse,
} from "next/server";

import {
  createRouteClient,
} from "@/lib/supabase/route";


export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";


type AcceptRouteContext = {
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


export async function POST(
  request: NextRequest,
  {
    params,
  }: AcceptRouteContext,
): Promise<Response> {
  const {
    id,
  } =
    await params;


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


  let body: {
    response_id?: unknown;
  };


  try {
    body =
      await request.json();
  } catch {
    return jsonError(
      "The request body is not valid JSON.",
      400,
    );
  }


  if (
    typeof body.response_id !==
      "string" ||
    !isUuid(
      body.response_id,
    )
  ) {
    return jsonError(
      "A valid recycler response is required.",
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
      "You must be signed in.",
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
      "Resident account was not found.",
      404,
    );
  }


  if (
    profile.role !==
    "resident"
  ) {
    return jsonError(
      "Only resident accounts can accept recycler offers.",
      403,
    );
  }


  const {
    data:
      result,
    error:
      acceptError,
  } =
    await supabase.rpc(
      "accept_opportunity_response",
      {
        p_opportunity_id:
          id,

        p_response_id:
          body.response_id,
      },
    );


  if (
    acceptError
  ) {
    return jsonError(
      acceptError.message ||
      "The recycler offer could not be accepted.",
      400,
    );
  }


  return NextResponse.json(
    {
      success:
        true,

      result:
        result ??
        null,
    },
    {
      status:
        200,
    },
  );
}