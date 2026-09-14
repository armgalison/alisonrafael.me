// Canonically owned in shared/ (see ADR 0008) since server's cover-letter
// generator needs the same shapes.
export type { ExperienceRole, ExperienceEntry, LanguageSkill, EducationEntry } from '@portifolio/shared'
import type { EducationEntry, ExperienceEntry, LanguageSkill } from '@portifolio/shared'

export interface ResumeContent {
  meta: {
    name: string
    headline: string
    location: string
  }
  contact: {
    phone: string
    email: string
    linkedin: string
    linkedinLabel: string
  }
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
  topSkills: string[]
  technologyGroups: Array<{ label: string; items: string[] }>
  languages: LanguageSkill[]
  certifications: string[]
  experience: ExperienceEntry[]
  education: EducationEntry[]
  footer: {
    rights: string
  }
}
