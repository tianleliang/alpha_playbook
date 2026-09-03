import { LoginForm } from "@/features/auth/LoginForm";

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
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Turn one goal into a plan you can actually run.
        </h1>
      </header>

      <LoginForm next={next} />
    </main>
  );
}
