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
  certifications: [],
  experience: [
    {
      company: 'BairesDev',
      emphasized: true,
      roles: [
        {
          title: 'Principal Software Engineer',
          period: 'September 2021 - Present (5 years)',
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
            'At LABSIT, I focused on web application development as a frontend engineer, where I played a pivotal role in creating an Angular library that significantly improved development efficiency. Leading a squad, I was responsible for task delegation, architectural decisions, and code reviews, ensuring high-quality deliverables. My experience here has honed my leadership and technical skills in a dynamic environment of an established company.',
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
            'At TECLA, I contributed to the development of a web-based mental health system, focusing on migrating a legacy system to modern web technologies. My experience included participating in agile Scrum practices and completing HIPAA training to ensure compliance. Although my tenure was brief, it was an enriching opportunity that enhanced my skills in web application development and teamwork.',
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
          period: 'February 2018 - August 2020 (2 years 7 months)',
          location: 'Santa Rita do Sapucaí, MG',
          emphasized: false,
          description:
            'At Inatel Competence Center, I have played a pivotal role in developing web applications tailored for Telecom product management. My focus has been on enhancing user experience and ensuring efficient functionality. Working closely with cross-functional teams, I have contributed to the seamless integration of features while continuously improving my skills in frontend development.',
        },
        {
          title: 'Software Development Intern',
          period: 'March 2017 - February 2018 (1 year)',
          location: 'Santa Rita do Sapucaí, Minas Gerais',
          emphasized: false,
          description:
            'I designed and implemented an IoT platform from scratch, capable of handling thousands of requests per hour and supporting multiple communication protocols such as HTTP, CoAP, and MQTT. To validate the solution, we integrated devices across the INATEL campus. This allowed me to develop a comprehensive application that enabled real-time visualization.',
        },
        {
          title: 'Software Development Intern',
          period: 'June 2016 - February 2017 (9 months)',
          location: 'Santa Rita do Sapucaí, MG',
          emphasized: false,
          description:
            'Validated potential projects, contributing to accurate project estimations and proof of concepts to ensure feasibility. Researched and summarized new frameworks and technologies, providing valuable insights to senior engineers. Enhanced project validation efficiency, reducing validation time through thorough analysis and innovative approaches.',
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
