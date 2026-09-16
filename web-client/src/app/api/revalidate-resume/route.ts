import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

// Called by the Admin Panel's Resume Profile editor (Settings page) right
// after a successful PATCH /resume-profile, so the public resume page
// (tagged 'resume-profile', see content/resumeProfileApi.ts) picks up the
// change immediately instead of waiting for a redeploy. `{ expire: 0 }`
// (rather than the usually-recommended `'max'` stale-while-revalidate
// profile) means the very next request blocks for a fresh fetch instead of
// serving one more stale copy — this fires rarely, right after a deliberate
// admin edit, so correctness beats the perf win `'max'` is for. No auth
// guard: it only busts a cache tag — no data mutation, nothing sensitive to
// protect — same low-stakes pragmatism as this codebase's plain in-memory
// comment rate limiter (see ADR 0009).
export async function POST() {
  revalidateTag('resume-profile', { expire: 0 })
  return NextResponse.json({ revalidated: true })
}
