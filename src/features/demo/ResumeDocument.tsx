import { DEMO_IDENTITY, DEMO_RESUME } from "@/demo/resume";

/**
 * The uploaded resume, rendered as a document.
 *
 * A wall of plain text does not read as "a resume someone uploaded" - it reads
 * as debug output. This is a page: white, serif headings, ruled sections. It
 * stays a real DOM document rather than an embedded PDF so it reflows on a
 * phone and does not need a plugin.
 */
export function ResumeDocument() {
  return (
    <div className="border-border overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="mx-auto max-w-[46rem] px-8 py-10 text-neutral-900 sm:px-12 sm:py-14">
        <header className="mb-7 border-b border-neutral-300 pb-5">
          <h3 className="font-serif text-[26px] leading-tight font-semibold tracking-tight">
            {DEMO_IDENTITY.name}
          </h3>
          <p className="mt-1.5 text-[12.5px] text-neutral-600">
            {DEMO_IDENTITY.location} &middot; {DEMO_IDENTITY.email}
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {DEMO_RESUME.map((section) => (
            <section key={section.heading}>
              <h4 className="mb-2.5 border-b border-neutral-200 pb-1 font-serif text-[11px] font-semibold tracking-[0.16em] text-neutral-500 uppercase">
                {section.heading}
              </h4>

              <div className="flex flex-col gap-3.5">
                {section.entries.map((entry) => (
                  <div key={entry.title}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className="text-[13.5px] font-semibold">{entry.title}</p>
                      {entry.meta && (
                        <p className="font-mono text-[11px] text-neutral-500">{entry.meta}</p>
                      )}
                    </div>

                    {entry.detail && (
                      <p className="mt-1 text-[13px] leading-relaxed text-neutral-700">
                        {entry.detail}
                      </p>
                    )}

                    {entry.bullets && (
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {entry.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex gap-2 text-[13px] leading-relaxed text-neutral-700"
                          >
                            <span className="text-neutral-400">&bull;</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The few things a person types alongside the upload. */
export function IdentityCard() {
  const rows: Array<[string, string]> = [
    ["Name", DEMO_IDENTITY.name],
    ["Where", DEMO_IDENTITY.location],
    ["School", DEMO_IDENTITY.school],
    ["Year", DEMO_IDENTITY.year],
  ];

  return (
    <dl className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
            {label}
          </dt>
          <dd className="text-sm leading-snug">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
