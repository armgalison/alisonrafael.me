// Canonically owned in shared/ (see ADR 0008) since server's cover-letter
// generator needs the same shapes.
export type { ExperienceRole, ExperienceEntry, LanguageSkill, EducationEntry, ResumeLinks } from '@portifolio/shared'
import type { EducationEntry, ExperienceEntry, LanguageSkill, ResumeLinks } from '@portifolio/shared'

// The hand-authored UI copy that stays a static file — everything else
// (name/headline/location, contact links, topSkills, technologyGroups,
// languages, certifications, experience, education) is Resume Profile
// data, now fetched live from the API (see src/i18n/index.ts's
// getResumeContent) so an Admin edit in Settings shows up without a
// redeploy.
export interface StaticResumeContent {
  nav: {
    experience: string
    skills: string
    credentials: string
    contact: string
  }
  hero: {
    greeting: string
    downloadResume: string
    contactMe: string
    terminalIntro: string
    terminalCommits: string[]
  }
  sectionTitles: {
    experience: string
    topSkills: string
    languages: string
    credentials: string
    education: string
    certifications: string
    contact: string
  }
  footer: {
    rights: string
  }
}

export interface ResumeContent extends StaticResumeContent {
  meta: {
    name: string
    headline: string
    location: string
  }
  links: ResumeLinks
  topSkills: string[]
  technologyGroups: Array<{ label: string; items: string[] }>
  languages: LanguageSkill[]
  certifications: string[]
  experience: ExperienceEntry[]
  education: EducationEntry[]
}
