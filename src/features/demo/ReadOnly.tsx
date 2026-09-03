"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Marks a subtree as a saved run rather than a live one.
 *
 * The demo renders the exact same components as the real app - same layout,
 * same data shapes, same everything. The only difference is that the controls
 * do not fire, so anyone can click around without changing what the next
 * visitor sees.
 */
const ReadOnlyContext = createContext(false);

export function ReadOnly({ children }: { children: ReactNode }) {
  return <ReadOnlyContext.Provider value={true}>{children}</ReadOnlyContext.Provider>;
}

export function useReadOnly(): boolean {
  return useContext(ReadOnlyContext);
}
