import { en } from '../content/en'
import type { ResumeContent } from '../content/types'

// Add a new locale by dropping a `<locale>.ts` file in `src/content/`
// (matching `types.ts`) and registering it here.
export const locales = {
  en,
} satisfies Record<string, ResumeContent>

export type Locale = keyof typeof locales

export const defaultLocale: Locale = 'en'

export function useResumeContent(locale: Locale = defaultLocale): ResumeContent {
  return locales[locale]
}
