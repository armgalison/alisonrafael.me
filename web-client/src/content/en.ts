import type { StaticResumeContent } from './types'

export const en: StaticResumeContent = {
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
  footer: {
    rights: 'Built with React, Tailwind, Claude Code, and a healthy dose of caffeine.',
  },
}
