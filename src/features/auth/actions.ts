"use server";

/**
 * Sign up, sign in, sign out.
 *
 * Supabase handles the password. This app never sees, stores, or transmits one
 * beyond passing it straight to their client.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Supabase messages are fine but terse. Say what to do about it. */
function readable(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "That email and password do not match an account.";
  }
  if (/already registered|already exists/i.test(message)) {
    return "There is already an account with that email. Try signing in instead.";
  }
  if (/password should be at least/i.test(message)) {
    return "Passwords need to be at least 6 characters.";
  }
  if (/invalid.*email/i.test(message)) return "That does not look like a valid email address.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  return message;
}

export async function signIn(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: readable(error.message) };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and a password." };
  if (password.length < 6) return { error: "Passwords need to be at least 6 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: readable(error.message) };

  // With email confirmation switched on, there is no session yet.
  if (!data.session) {
    return { error: "Check your email for a confirmation link, then sign in." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
