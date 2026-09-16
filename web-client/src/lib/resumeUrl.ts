// The public "Download Resume" URL — served by the API (see
// server/src/ats-resume/resume.controller.ts), not a same-origin static
// file. Same NEXT_PUBLIC_API_URL env var src/blog/api.ts and
// src/admin/api.ts already use.
export const resumeDownloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/resume`
