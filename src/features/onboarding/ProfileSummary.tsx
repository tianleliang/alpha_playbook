import type { Profile } from "@/core/types";

const SECTIONS: Array<{ key: keyof Profile; label: string }> = [
  { key: "currentState", label: "Where you are" },
  { key: "capabilities", label: "What you can do" },
  { key: "credibilityAndAssets", label: "What you have built" },
  { key: "relationshipsAndAccess", label: "Who you know" },
  { key: "directionAndLogic", label: "Where you are heading" },
  { key: "underusedLeverage", label: "Not being used yet" },
  { key: "unknowns", label: "Still unclear" },
];

/**
 * What the app understood about you. Shown collapsed by default - it matters
 * that it is inspectable, not that it is prominent.
 */
export function ProfileSummary({ profile }: { profile: Profile }) {
  const filled = SECTIONS.filter((s) => (profile[s.key] as string[]).length > 0);

  return (
    <details className="group border-border bg-card rounded-lg border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm">
        <span className="font-medium">Your profile</span>
        <span className="text-muted-foreground text-xs">
          {filled.length} sections &middot; click to review
        </span>
      </summary>
      <div className="border-border grid gap-5 border-t px-4 py-4 sm:grid-cols-2">
        {filled.map((section) => (
          <div key={section.key} className="flex flex-col gap-1.5">
            <h3 className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
              {section.label}
            </h3>
            <ul className="flex flex-col gap-1">
              {(profile[section.key] as string[]).map((item, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
