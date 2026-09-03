import Link from "next/link";
import { redirect } from "next/navigation";

import { getProvider } from "@/ai";
import { Chip } from "@/components/panel";
import { STAGE_LABEL, stageOf } from "@/core/flow";
import { listProjects, readProfile } from "@/core/store";
import { currentUser } from "@/lib/supabase/server";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { ThemeToggle } from "@/features/workspace/ThemeToggle";
import { GoalForm } from "@/features/goal/GoalForm";
import { ProfileSummary } from "@/features/onboarding/ProfileSummary";

export default async function HomePage() {
  const user = await currentUser();
  const profile = await readProfile();
  if (!profile) redirect("/onboarding");

  const projects = await listProjects();
  const provider = getProvider();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-14 sm:py-20">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
          Playbook
        </p>
        <div className="flex items-center gap-3">
          {provider.isMock && <Chip>{provider.name}</Chip>}
          <ThemeToggle />
          <SignOutButton email={user?.email} />
        </div>
      </header>

      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          What&rsquo;s your goal?
        </h1>
        <GoalForm />
      </section>

      {projects.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
            In progress
          </h2>
          <ul className="flex flex-col gap-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/project/${project.id}`}
                  className="border-border hover:border-foreground/30 flex flex-col gap-1.5 rounded-lg border px-4 py-3.5 transition-colors"
                >
                  <span className="font-medium">{project.title}</span>
                  <span className="text-muted-foreground text-sm">
                    {STAGE_LABEL[stageOf(project)]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ProfileSummary profile={profile} />
    </main>
  );
}
