import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ReferenceLocation } from '../types';

interface ReferenceLocationContextValue {
  /** Null until the user shares a location or picks a starting point. */
  reference: ReferenceLocation | null;
  setReference: (reference: ReferenceLocation | null) => void;
}

const ReferenceLocationContext = createContext<ReferenceLocationContextValue | null>(null);

/**
 * Holds the point that place-card distances are measured from. Phase 1 starts with none,
 * so cards hide distance until a reference is set.
 */
export function ReferenceLocationProvider({
  children,
  initial = null,
}: {
  children: ReactNode;
  initial?: ReferenceLocation | null;
}) {
  const [reference, setReference] = useState<ReferenceLocation | null>(initial);
  const value = useMemo(() => ({ reference, setReference }), [reference]);
  return (
    <ReferenceLocationContext.Provider value={value}>{children}</ReferenceLocationContext.Provider>
  );
}

export function useReferenceLocation(): ReferenceLocationContextValue {
  const context = useContext(ReferenceLocationContext);
  if (!context) {
    throw new Error('useReferenceLocation must be used inside <ReferenceLocationProvider>.');
  }
  return context;
}
