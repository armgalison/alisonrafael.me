// Resume facts: the subset of Alison's resume content that both apps need
// canonically in one place — web-client renders it in the public resume
// (en.ts), and server's cover-letter generator (see the "Tools" admin
// feature) feeds it to Claude as the candidate's background. Same reasoning
// as techStackGroups in tech-stack.ts (see CONTEXT.md and ADR 0008): the
// alternative was either a hand-duplicated copy on the server (silent
// drift) or the client re-sending this static data on every request.
import { techStackGroups } from './tech-stack.js'

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

export interface ResumeProfile {
  name: string
  headline: string
  location: string
  topSkills: string[]
  technologyGroups: { label: string; items: string[] }[]
  languages: LanguageSkill[]
  certifications: string[]
  experience: ExperienceEntry[]
  education: EducationEntry[]
}

export const resumeProfile: ResumeProfile = {
  name: 'Alison Rafael Marinho Gonçalves',
  headline:
    'Full-Stack Engineer · Delivering high-impact products\nTurning complex problems into scalable solutions',
  location: 'Pouso Alegre, Minas Gerais, Brazil',
  topSkills: [
    'AI-Native Development',
    'Functional Programming',
    'Full-Stack Engineering',
    'Site Reliability Engineering',
  ],
  technologyGroups: techStackGroups,
  languages: [
    { name: 'English', level: 'Full Professional' },
    { name: 'Portuguese', level: 'Native or Bilingual' },
  ],
  certifications: [
    'Testing Angular 4 (previously Angular 2) Apps with Jasmine',
    'Introduction to JavaScript Security LFS184',
  ],
  experience: [
    {
      company: 'BairesDev',
      emphasized: true,
      roles: [
        {
          title: 'Principal Software Engineer',
          period: 'September 2021 - Present (5 years 1 month)',
          location: 'San Francisco, California, United States',
          emphasized: true,
          description:
            'Dedicated to the wemlo (RE/MAX) project since joining the company, serving as a key contributor across platform reliability, scalability, and integrations. Led performance optimization initiatives that reduced critical endpoint response times from seconds to milliseconds through load testing and system improvements. Re-architected the file management framework to support data streaming, reducing memory consumption and infrastructure costs. Acted as technical lead for multiple complex third-party integrations, while driving SRE practices, code reviews, and deployment excellence to ensure platform stability and growth.',
        },
      ],
    },
    {
      company: 'labsit',
      emphasized: true,
      roles: [
        {
          title: 'Senior Software Engineer',
          period: 'August 2020 - September 2021 (1 year 2 months)',
          location: 'São Paulo, Brazil',
          emphasized: true,
          description:
            "I worked as a frontend engineer focused on web application development, leading a squad of 4-6 engineers responsible for architectural decisions, task delegation, and code reviews across the team's deliverables. I built an internal Angular component library, based on the company's design system, that grew to over 50 reusable components and was adopted across 6 projects. Since most of the team consisted of backend developers working on frontend tasks, the library cut their development time by at least 50%, letting them ship UI work without deep Angular expertise. I owned architectural decisions for frontend projects, setting technical direction and code standards that the squad followed, and led code reviews to maintain consistency and quality across deliverables. Leading the squad's day-to-day execution, I managed task delegation and sprint planning, balancing team capacity against delivery deadlines while mentoring engineers on frontend best practices.",
        },
      ],
    },
    {
      company: 'TECLA',
      emphasized: false,
      roles: [
        {
          title: 'Software Engineer',
          period: 'September 2020 - December 2020 (4 months)',
          location: 'Seattle, WA',
          emphasized: false,
          description:
            'I contributed to the development of a web-based mental health records system for ICANotes, a U.S. healthcare software company, focusing on migrating a legacy system to modern web technologies while maintaining HIPAA compliance throughout. I worked within an agile Scrum team, participating in sprint planning and delivery cycles, and completed formal HIPAA training to ensure the migration met healthcare data privacy and security standards. This experience gave me early exposure to U.S.-based engineering practices, healthcare compliance requirements, and remote collaboration with an international team.',
        },
      ],
    },
    {
      company: 'Inatel Competence Center',
      totalDuration: '4 years 3 months',
      emphasized: false,
      roles: [
        {
          title: 'Software Engineer',
          period: 'June 2016 - August 2020 (4 years 3 months)',
          location: 'Santa Rita do Sapucaí, MG',
          emphasized: false,
          description: 'I spent over four years at Inatel Competence Center, progressing from intern to Software Engineer while working on web applications for Telecom product management and an IoT platform built from the ground up. As an intern, I designed and implemented an IoT platform from scratch, supporting multiple communication protocols (HTTP, CoAP, and MQTT) and handling continuous data from over 200 devices, including campus lighting, sensors, and the main electrical panel, each sending requests at 1 request per second. I integrated the platform across the full INATEL campus and built a comprehensive application for real-time visualization of device data. In an earlier intern role, I supported project validation by researching new frameworks and technologies, producing proof-of-concepts and estimations that improved the accuracy and speed of project scoping for senior engineers. Moving into the Software Engineer role, I worked on a Telecom Plans Design System application for Ericsson, focusing on frontend development to support telecom product management, working closely with cross-functional teams to improve user experience and platform functionality',
        },
      ],
    },
  ],
  education: [
    {
      school: 'Universidade do Vale do Sapucaí - UNIVÁS',
      degree: 'Bachelor of Science, Information Technology',
      period: 'January 2014 - December 2017',
    },
  ],
}
