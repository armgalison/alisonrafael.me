export interface ExperienceRole {
  title: string
  period: string
  location: string
  description: string
  emphasized: boolean
}

export interface ExperienceEntry {
  company: string
  totalDuration?: string
  roles: ExperienceRole[]
  emphasized: boolean
}

export interface LanguageSkill {
  name: string
  level: string
}

export interface EducationEntry {
  school: string
  degree: string
  period: string
}

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
