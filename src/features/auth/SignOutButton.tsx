"use client";

import { useTransition } from "react";

import { signOut } from "./actions";

export function SignOutButton({ email }: { email?: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-3">
      {email && <span className="text-muted-foreground hidden text-xs sm:inline">{email}</span>}
      <button
        onClick={() => start(() => signOut())}
        disabled={pending}
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline disabled:opacity-50"
      >
        {pending ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
