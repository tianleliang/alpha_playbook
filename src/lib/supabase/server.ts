/**
 * Supabase on the server.
 *
 * Reads the session out of cookies, so every query runs as the signed-in user
 * and row-level security applies. This is the client almost everything uses.
 *
 * Note: always ask for the user with getUser(), never getSession(). getSession
 * trusts the cookie as-is; getUser checks it against Supabase.
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Server components cannot set cookies. The middleware refreshes
            // the session instead, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/** The signed-in user, or null. Verified against Supabase, not just the cookie. */
export async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
