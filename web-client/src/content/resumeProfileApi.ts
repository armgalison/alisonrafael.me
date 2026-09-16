import { resumeProfile, type ResumeProfile } from '@portifolio/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL as string

// Cached indefinitely by Next.js's Data Cache under this tag, until an
// Admin save in Settings hits /api/revalidate-resume and busts it — that's
// the "cache until the next update" behavior, not a time-based guess.
//
// Falls back to the bundled static default rather than throwing when the
// request fails: `next build` prerenders this route against whatever API
// is live at build time, which on the very first deploy of the
// GET /resume-profile route is still the *previous* deployed API (both
// images build before either is swapped in — see deploy.yml) and would
// 404. Crashing the build over that would be worse than briefly showing
// the seed content until the Admin's next Settings save revalidates it.
export async function fetchResumeProfile(): Promise<ResumeProfile> {
  try {
    const res = await fetch(`${API_URL}/resume-profile`, { next: { tags: ['resume-profile'] } })
    if (!res.ok) throw new Error(`${res.status}`)
    return (await res.json()) as ResumeProfile
  } catch (err) {
    console.warn(`Failed to fetch Resume Profile, using the bundled default: ${err}`)
    return resumeProfile
  }
}
