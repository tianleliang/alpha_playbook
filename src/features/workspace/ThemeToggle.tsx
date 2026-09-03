"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Light or dark, remembered.
 *
 * Reads the stored choice on mount and follows the system until you make one.
 * The class itself is set before paint by a small script in the layout, so
 * there is no flash of the wrong theme on load - this component only ever
 * catches up with what is already on screen.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("playbook:theme", next ? "dark" : "light");
    } catch {
      // Private browsing, or storage is blocked. The toggle still works for
      // this visit; it just will not be remembered.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      className="border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors"
    >
      <span
        className="bg-foreground/80 absolute size-4 rounded-full transition-transform duration-200 motion-reduce:transition-none"
        style={{ transform: dark ? "translateX(1.375rem)" : "translateX(0.2rem)" }}
      />
      <Sun className="pointer-events-none absolute left-1.5 size-2.5 opacity-70" />
      <Moon className="pointer-events-none absolute right-1.5 size-2.5 opacity-70" />
    </button>
  );
}
