import { en } from '../content/en'
import { fetchResumeProfile } from '../content/resumeProfileApi'
import type { ResumeContent, StaticResumeContent } from '../content/types'

// Add a new locale by dropping a `<locale>.ts` file in `src/content/`
// (matching `types.ts`'s StaticResumeContent) and registering it here.
export const locales = {
  en,
} satisfies Record<string, StaticResumeContent>

export type Locale = keyof typeof locales

export const defaultLocale: Locale = 'en'

// The static UI copy only (nav labels, hero text, contact info, section
// titles, footer) — everything that isn't Resume Profile data. Use
// getResumeContent() for the full page content.
export function useResumeContent(locale: Locale = defaultLocale): StaticResumeContent {
  return locales[locale]
}

// The full page content: the static copy above merged with the live Resume
// Profile (name/headline/location, skills, experience, education, ...),
// fetched from the API and cached until the Admin's next Settings save
// (see content/resumeProfileApi.ts) — not from the old static shared/
// import, so an edit shows up on the public site without a redeploy.
export async function getResumeContent(locale: Locale = defaultLocale): Promise<ResumeContent> {
  const staticContent = locales[locale]
  const profile = await fetchResumeProfile()
  return {
    ...staticContent,
    meta: { name: profile.name, headline: profile.headline, location: profile.location },
    links: profile.links,
    topSkills: profile.topSkills,
    technologyGroups: profile.technologyGroups,
    languages: profile.languages,
    certifications: profile.certifications,
    experience: profile.experience,
    education: profile.education,
  }
}
