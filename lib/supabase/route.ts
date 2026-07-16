import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";


function requireEnvironmentValue(
  name: string,
  value: string | undefined,
) {
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}


/**
 * Cookie-aware Supabase client for Route Handlers, Server Actions,
 * and other server-only code.
 *
 * Use a fresh client for each request:
 *
 *   const supabase = await createRouteClient();
 */
export async function createRouteClient() {
  const supabaseUrl = requireEnvironmentValue(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  const supabaseKey = requireEnvironmentValue(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          for (const {
            name,
            value,
            options,
          } of cookiesToSet) {
            cookieStore.set(
              name,
              value,
              options,
            );
          }
        },
      },
    },
  );
}
