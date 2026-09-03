/**
 * The mark: a path with a dot on it.
 *
 * Same shape as the step rail, which is the one genuinely distinctive thing in
 * the app. Using it as the logo means the identity and the interface are the
 * same idea rather than two unrelated ones.
 */
export function Mark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M4 16.5 C4 11, 7 9.5, 10 9.5 S16 8, 16 3.5"
        stroke="var(--support)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="4" cy="16.5" r="1.6" fill="var(--done)" />
      <circle cx="10" cy="9.5" r="2.4" fill="var(--brand)" />
      <circle cx="10" cy="9.5" r="4.4" stroke="var(--brand)" strokeWidth="1" opacity="0.3" />
      <circle cx="16" cy="3.5" r="1.4" stroke="var(--support)" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}
