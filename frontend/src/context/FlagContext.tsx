import { createContext, useContext, useState, type ReactNode } from 'react'

// One flagged item: which defect it refers to, the note the engineer
// wrote, and its tracking status.
export interface FlaggedItem {
  defectId: number
  // A short label so the tracking panel can show WHAT was flagged
  // without needing to look up the full defect record again.
  label: string
  note: string
  status: 'under review' | 'resolved' | 'dismissed'
  flaggedAt: string // ISO timestamp, for sorting/display in the panel
}

interface FlagContextValue {
  flags: FlaggedItem[]
  addFlag: (item: Omit<FlaggedItem, 'flaggedAt'>) => void
  updateFlag: (defectId: number, updates: Partial<FlaggedItem>) => void
  removeFlag: (defectId: number) => void
  isFlagged: (defectId: number) => boolean
}

// The Context itself starts as `undefined` — components must be inside
// a <FlagProvider> to use it. We enforce this via the useFlags() hook
// below, which throws a clear error if used outside the provider,
// rather than silently failing.
const FlagContext = createContext<FlagContextValue | undefined>(undefined)

export function FlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FlaggedItem[]>([])

  const addFlag = (item: Omit<FlaggedItem, 'flaggedAt'>) => {
    setFlags((prev) => [
      ...prev,
      { ...item, flaggedAt: new Date().toISOString() },
    ])
  }

  const updateFlag = (defectId: number, updates: Partial<FlaggedItem>) => {
    setFlags((prev) =>
      prev.map((flag) =>
        flag.defectId === defectId ? { ...flag, ...updates } : flag
      )
    )
  }

  const removeFlag = (defectId: number) => {
    setFlags((prev) => prev.filter((flag) => flag.defectId !== defectId))
  }

  const isFlagged = (defectId: number) => flags.some((f) => f.defectId === defectId)

  return (
    <FlagContext.Provider value={{ flags, addFlag, updateFlag, removeFlag, isFlagged }}>
      {children}
    </FlagContext.Provider>
  )
}

// Custom hook — this is what every component actually calls, instead of
// importing FlagContext directly. It's a small convenience layer that
// also fails loudly (rather than silently returning undefined) if
// someone forgets to wrap the app in <FlagProvider>.
export function useFlags() {
  const context = useContext(FlagContext)
  if (!context) {
    throw new Error('useFlags must be used within a FlagProvider')
  }
  return context
}