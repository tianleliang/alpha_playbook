/**
 * Saving and loading.
 *
 * Everything lives in Postgres, in two tables, as JSONB. The domain objects go
 * in exactly as `types.ts` defines them, which means the shape can change
 * without a migration - Postgres owns identity and ownership, this app owns
 * the shape.
 *
 * Every read and write runs as the signed-in user, so row-level security
 * decides what is visible. Nothing here filters by user by hand, because a
 * policy you cannot forget beats a `where` clause you can.
 *
 * Server-side only. Never import this into a component that runs in the browser.
 */

import type { Profile, Project } from "./types";
import { createClient } from "@/lib/supabase/server";

async function db() {
  return createClient();
}

/** Supabase returns this when a single-row query finds nothing. */
const NOT_FOUND = "PGRST116";

async function requireUser(): Promise<string> {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

// ---------------------------------------------------------------- profile

export async function readProfile(): Promise<Profile | null> {
  const supabase = await db();
  const { data, error } = await supabase.from("profiles").select("data").single();

  if (error) {
    if (error.code === NOT_FOUND) return null;
    throw new Error(`Could not load your profile: ${error.message}`);
  }
  return (data?.data as Profile) ?? null;
}

export async function writeProfile(profile: Profile): Promise<Profile> {
  const userId = await requireUser();
  const supabase = await db();
  const saved = { ...profile, updatedAt: new Date().toISOString() };

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, data: saved, updated_at: saved.updatedAt });

  if (error) throw new Error(`Could not save your profile: ${error.message}`);
  return saved;
}

export async function hasProfile(): Promise<boolean> {
  return (await readProfile()) !== null;
}

// ---------------------------------------------------------------- projects

export async function readProject(id: string): Promise<Project | null> {
  const supabase = await db();
  const { data, error } = await supabase.from("projects").select("data").eq("id", id).single();

  if (error) {
    if (error.code === NOT_FOUND) return null;
    throw new Error(`Could not load that goal: ${error.message}`);
  }
  return (data?.data as Project) ?? null;
}

/** Newest activity first. */
export async function listProjects(): Promise<Project[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("projects")
    .select("data")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Could not load your goals: ${error.message}`);
  return (data ?? []).map((row) => row.data as Project);
}

/**
 * Save changes to a goal that already exists. Stamps `updatedAt` so the list
 * stays ordered by real activity.
 */
export async function writeProject(project: Project): Promise<Project> {
  const userId = await requireUser();
  const supabase = await db();
  const saved = { ...project, updatedAt: new Date().toISOString() };

  const { error } = await supabase
    .from("projects")
    .upsert({ id: saved.id, user_id: userId, data: saved, updated_at: saved.updatedAt });

  if (error) throw new Error(`Could not save that goal: ${error.message}`);
  return saved;
}

/**
 * Save a brand new goal.
 *
 * Ids are derived from the goal itself, so submitting the identical goal twice
 * collides on the primary key. That is the point: it is caught here instead of
 * quietly overwriting the work already done on it.
 */
export async function createProject(project: Project): Promise<Project> {
  const userId = await requireUser();
  const supabase = await db();
  const saved = { ...project, updatedAt: new Date().toISOString() };

  const { error } = await supabase
    .from("projects")
    .insert({ id: saved.id, user_id: userId, data: saved, updated_at: saved.updatedAt });

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `You already have a goal for this: "${project.title}". Open it instead of starting again.`,
      );
    }
    throw new Error(`Could not create that goal: ${error.message}`);
  }
  return saved;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(`Could not delete that goal: ${error.message}`);
}

// ---------------------------------------------------------------- export

/** Everything you own, in one object. For backups and for moving elsewhere. */
export async function exportAll(): Promise<{ profile: Profile | null; projects: Project[] }> {
  return { profile: await readProfile(), projects: await listProjects() };
}
