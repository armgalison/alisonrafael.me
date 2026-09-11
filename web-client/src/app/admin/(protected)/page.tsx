'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Bare /admin -> /admin/posts. Deliberately inside (protected), not a
// server-side redirect() at a route any unauthenticated visit could hit
// first — this must only ever fire once Gate has already let an
// authenticated admin through, matching the old nesting where the
// index -> Navigate("posts") route was itself a child of ProtectedRoute
// (so an unauthenticated /admin visit lands on /admin/login, not
// /admin/posts).
export default function AdminIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/posts')
  }, [router])
  return null
}
