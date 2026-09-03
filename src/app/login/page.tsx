import { LoginForm } from "@/features/auth/LoginForm";
import { ThemeToggle } from "@/features/workspace/ThemeToggle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col justify-center px-6 py-20 sm:py-28">
      <header className="mb-9 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
            Playbook
          </p>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Turn one goal into a plan you can actually run.
        </h1>
      </header>

      <LoginForm next={next} />
    </main>
  );
}
