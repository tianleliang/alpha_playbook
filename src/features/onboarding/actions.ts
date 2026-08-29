"use server";

/**
 * Onboarding: turn whatever the user pastes into a saved Profile.
 *
 * The Profile is what makes a plan personal instead of generic. It fills the
 * same slot the Personal Leverage Map fills in the Obsidian system, so a real
 * vault export can replace it later without anything downstream changing.
 */

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";

import { getProvider } from "@/ai";
import { readProfile, writeProfile } from "@/core/store";
import type { Profile } from "@/core/types";

/** Pull readable text out of an uploaded file so the user does not have to copy-paste. */
export async function extractText(formData: FormData): Promise<{ text: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { text: "", error: "No file was selected." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { text: "", error: "That file is over 8MB. Paste the text instead." };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());

  if (file.name.toLowerCase().endsWith(".pdf")) {
    try {
      const { extractText: extractPdfText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(buffer);
      const { text } = await extractPdfText(pdf, { mergePages: true });
      const merged = Array.isArray(text) ? text.join("\n") : text;
      if (!merged.trim()) {
        return { text: "", error: "That PDF has no selectable text. Paste it in instead." };
      }
      return { text: merged.trim() };
    } catch {
      return { text: "", error: "Could not read that PDF. Paste the text instead." };
    }
  }

  return { text: new TextDecoder().decode(buffer).trim() };
}

export async function saveProfile(formData: FormData): Promise<void> {
  const input = {
    resume: String(formData.get("resume") ?? "").trim(),
    direction: String(formData.get("direction") ?? "").trim(),
    access: String(formData.get("access") ?? "").trim(),
    constraints: String(formData.get("constraints") ?? "").trim(),
  };

  if (!input.resume) throw new Error("Tell us something about your background first.");

  const draft = await getProvider().synthesizeProfile(input);
  const existing = await readProfile();
  const now = new Date().toISOString();

  const profile: Profile = {
    id: existing?.id ?? randomUUID(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    raw: input,
    ...draft,
  };

  await writeProfile(profile);
  redirect("/");
}
