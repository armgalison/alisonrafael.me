import { resumeProfile } from '@portifolio/shared'
import type { ResumeContent } from './types'

export const en: ResumeContent = {
  meta: {
    name: resumeProfile.name,
    headline: resumeProfile.headline,
    location: resumeProfile.location,
  },
  contact: {
    phone: '+55 35 99198-3363',
    email: 'armg.alison@gmail.com',
    linkedin: 'https://www.linkedin.com/in/armgalison',
    linkedinLabel: 'linkedin.com/in/armgalison',
  },
  nav: {
    experience: 'Experience',
    skills: 'Skills',
    credentials: 'Credentials',
    contact: 'Contact',
  },
  hero: {
    greeting: "Hi, I'm Alison.",
    downloadResume: 'Download Resume',
    contactMe: 'Get in Touch',
    terminalIntro: 'git log --oneline -3',
    // Paraphrased, in commit-message shorthand, from the real BairesDev
    // description below — not new claims, just a different presentation.
    terminalCommits: [
      'perf: endpoint latency, seconds → ms',
      'refactor: file pipeline → streaming',
      'lead: 3rd-party integrations',
    ],
  },
  sectionTitles: {
    experience: 'Experience',
    topSkills: 'Skills',
    languages: 'Languages',
    credentials: 'Credentials',
    education: 'Education',
    certifications: 'Certifications',
    contact: 'Get in Touch',
  },
  // Sourced from shared/'s resumeProfile (see ADR 0008) — server's
  // cover-letter generator reads the same data.
  topSkills: resumeProfile.topSkills,
  technologyGroups: resumeProfile.technologyGroups,
  languages: resumeProfile.languages,
  certifications: resumeProfile.certifications,
  experience: resumeProfile.experience,
  education: resumeProfile.education,
  footer: {
    rights: 'Built with React, Tailwind, Claude Code, and a healthy dose of caffeine.',
  },
}
