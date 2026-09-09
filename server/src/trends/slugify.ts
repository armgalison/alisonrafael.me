// Mirrors web-client's src/admin/pages/PostEditorPage.tsx slugify() — kept
// as a separate small copy rather than a second shared/ export because it's
// a pure string-transform function, not data; duplicating a one-line
// algorithm doesn't carry the drift risk a data list does.
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
