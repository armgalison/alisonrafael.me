import type { ResumeContent } from './types'

export const en: ResumeContent = {
  meta: {
    name: 'Alison Rafael Marinho Gonçalves',
    headline:
      'Full-Stack Engineer · Delivering high-impact products\nTurning complex problems into scalable solutions',
    location: 'Pouso Alegre, Minas Gerais, Brazil',
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
  topSkills: [
    'Telecommunications Engineering',
    'Cross-functional Collaborations',
    'Site Reliability Engineering',
  ],
  // Concrete technologies pulled from the experience/certification text above,
  // not a separate LinkedIn field — surfaced for recruiters scanning for stack fit.
  technologyGroups: [
    { label: 'Languages', items: ['JavaScript'] },
    { label: 'Frameworks & Testing', items: ['Angular', 'Jasmine'] },
    { label: 'Protocols', items: ['HTTP', 'MQTT', 'CoAP'] },
  ],
  languages: [
    { name: 'Portuguese', level: 'Native or Bilingual' },
    { name: 'English', level: 'Full Professional' },
  ],
  certifications: [
    'Testing Angular 4 (previously Angular 2) Apps with Jasmine',
    'Introduction to JavaScript Security',
    'LFS184',
  ],
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
  footer: {
    rights: 'Built with React, Tailwind, and a healthy dose of caffeine.',
  },
}
