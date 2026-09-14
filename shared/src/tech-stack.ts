// The Tech Stack: Alison's own career-wide skill list, canonically owned
// here so both web-client (renders it in the public Skills section) and
// server (feeds it to the trend-relevance filter agent) read the same
// values. Not this repository's own implementation stack — see the Tech
// Stack / Trend definitions in CONTEXT.md and ADR 0008.
export interface TechStackGroup {
  label: string
  items: string[]
}

export const techStackGroups: TechStackGroup[] = [
  { label: 'Languages', items: ['JavaScript', 'TypeScript'] },
  { label: 'Frameworks', items: ['Angular', 'NestJS', 'Vue.js', 'Express.js', 'pdfjs-dist'] },
  { label: 'Protocols', items: ['HTTP', 'MQTT', 'CoAP', 'OPC UA'] },
  { label: 'Databases', items: ['PostgreSQL', 'MongoDB'] },
  { label: 'Cloud & DevOps', items: ['AWS', 'Docker', 'Kubernetes'] },
  { label: 'Other Tools', items: ['Git', 'Jest', 'Playwright'] },
  { label: 'Observability', items: ['Datadog', 'LogRocket'] },
]
