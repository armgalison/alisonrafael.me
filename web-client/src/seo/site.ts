// Site-wide identity shared by every route's metadata and JSON-LD, so the
// resume and the Blog describe the same person the same way.
export const SITE_ORIGIN = 'https://alisonrafael.me'

export const SITE_TITLE = 'Alison Rafael Marinho Gonçalves — Full Stack Software Engineer'

// The suffix the root layout's title.template appends to every child title.
export const SITE_SHORT_NAME = 'Alison Rafael'

// The Person node's @id: the resume page defines it in full, the Blog's
// JSON-LD points at it as the author instead of repeating it.
export const PERSON_ID = `${SITE_ORIGIN}/#person`

export const AVATAR_URL = `${SITE_ORIGIN}/avatar.png`
