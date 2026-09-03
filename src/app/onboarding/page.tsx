import { redirect } from "next/navigation";

import { OnboardingForm } from "@/features/onboarding/OnboardingForm";
import { ThemeToggle } from "@/features/workspace/ThemeToggle";
import { hasProfile } from "@/core/store";

export default async function OnboardingPage() {
  if (await hasProfile()) redirect("/");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <header className="mb-12 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
            Playbook
          </p>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          First, who are we working with?
        </h1>
        <p className="text-muted-foreground max-w-prose text-base leading-relaxed">
          Plans get built around what you already have, so it needs to know what that is. Two minutes, once.
        </p>
      </header>

      <OnboardingForm />
    </main>
  );
}
