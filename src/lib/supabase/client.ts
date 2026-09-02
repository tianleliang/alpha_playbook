/**
 * Supabase in the browser.
 *
 * Only ever used from client components, and only with the anon key, which is
 * safe to ship because row-level security is what actually protects the data.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
