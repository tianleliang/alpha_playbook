/**
 * Saving and loading.
 *
 * Everything lives in plain JSON files under `data/`, one file per project.
 * You can open them in any text editor and read them. That is deliberate -
 * it means your data is never trapped inside the app, and swapping this for a
 * real database later only means rewriting this one file.
 *
 * Server-side only. Never import this into a component that runs in the browser.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Profile, Project } from "./types";

const DATA_DIR = join(process.cwd(), "data");
const PROJECTS_DIR = join(DATA_DIR, "projects");
const PROFILE_FILE = join(DATA_DIR, "profile.json");

async function ensureDirs(): Promise<void> {
  await mkdir(PROJECTS_DIR, { recursive: true });
}

/**
 * Write to a temporary file, then rename it into place. Renaming is atomic, so
 * a crash mid-write can never leave a half-written project on disk.
 */
async function writeAtomic(path: string, value: unknown): Promise<void> {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
  await rename(tmp, path);
}

async function readJson<T>(path: string): Promise<T | null> {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(await readFile(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- profile

export async function readProfile(): Promise<Profile | null> {
  return readJson<Profile>(PROFILE_FILE);
}

export async function writeProfile(profile: Profile): Promise<Profile> {
  await ensureDirs();
  const saved = { ...profile, updatedAt: new Date().toISOString() };
  await writeAtomic(PROFILE_FILE, saved);
  return saved;
}

export async function hasProfile(): Promise<boolean> {
  return existsSync(PROFILE_FILE);
}

// ---------------------------------------------------------------- projects

function projectPath(id: string): string {
  return join(PROJECTS_DIR, `${id}.json`);
}

export async function readProject(id: string): Promise<Project | null> {
  return readJson<Project>(projectPath(id));
}

/** Newest activity first. */
export async function listProjects(): Promise<Project[]> {
  await ensureDirs();
  const files = (await readdir(PROJECTS_DIR)).filter((f) => f.endsWith(".json"));
  const projects: Project[] = [];
  for (const file of files) {
    const project = await readJson<Project>(join(PROJECTS_DIR, file));
    if (project) projects.push(project);
  }
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Save changes to a project that already exists. Stamps `updatedAt` so the
 * project list stays ordered by real activity.
 */
export async function writeProject(project: Project): Promise<Project> {
  await ensureDirs();
  const saved = { ...project, updatedAt: new Date().toISOString() };
  await writeAtomic(projectPath(project.id), saved);
  return saved;
}

/**
 * Save a brand new project. Refuses if one with this id already exists, which
 * is how re-submitting the identical goal gets caught instead of silently
 * overwriting the work you already did on it.
 */
export async function createProject(project: Project): Promise<Project> {
  await ensureDirs();
  if (existsSync(projectPath(project.id))) {
    throw new Error(
      `You already have a project for this goal: "${project.title}". Open it instead of creating a duplicate.`,
    );
  }
  return writeProject(project);
}

export async function deleteProject(id: string): Promise<void> {
  const path = projectPath(id);
  if (existsSync(path)) await unlink(path);
}

// ---------------------------------------------------------------- export

/** Everything, in one object. For backups and for moving to a real database later. */
export async function exportAll(): Promise<{ profile: Profile | null; projects: Project[] }> {
  return { profile: await readProfile(), projects: await listProjects() };
}
