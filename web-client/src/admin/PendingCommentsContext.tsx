'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import { useAuth } from './AuthContext'

interface PendingCommentsContextValue {
  pendingCount: number
  refreshPendingCount: () => Promise<void>
}

const PendingCommentsContext = createContext<PendingCommentsContextValue | null>(null)

// Holds the count of comments awaiting moderation so AdminLayout can show a
// nav badge and CommentsPage can refresh it after each action without a
// navigation. Rendered inside AuthProvider + ProtectedRoute, so `token` is
// always set here.
export function PendingCommentsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    if (!token) return
    try {
      const { count } = await api.pendingCommentCount(token)
      setPendingCount(count)
    } catch {
      // A failed count is not worth surfacing — leave the last known value.
    }
  }, [token])

  useEffect(() => {
    void refreshPendingCount()
  }, [refreshPendingCount])

  return (
    <PendingCommentsContext.Provider value={{ pendingCount, refreshPendingCount }}>
      {children}
    </PendingCommentsContext.Provider>
  )
}

export function usePendingComments() {
  const ctx = useContext(PendingCommentsContext)
  if (!ctx) throw new Error('usePendingComments must be used within a PendingCommentsProvider')
  return ctx
}
