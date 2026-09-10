import { en } from '../content/en'
import type { AdminContent } from '../content/types'

// Mirrors src/i18n/index.ts's pattern for the public site: add a locale by
// dropping a `<locale>.ts` file in `src/admin/content/` and registering it
// here. The Admin Panel is English-only today by design (see CONTEXT.md).
export const adminLocales = {
  en,
} satisfies Record<string, AdminContent>

export type AdminLocale = keyof typeof adminLocales

export const defaultAdminLocale: AdminLocale = 'en'

export function useAdminContent(locale: AdminLocale = defaultAdminLocale): AdminContent {
  return adminLocales[locale]
}
