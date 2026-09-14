import { jsPDF } from 'jspdf'

export interface CoverLetterSender {
  name: string
  location: string
  phone: string
  email: string
  linkedinLabel: string
}

const MARGIN = 56
const PAGE_WIDTH = 595.28 // A4 at 72dpi points
const PAGE_HEIGHT = 841.89
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

// Pure text-layout formatting — no Claude call here. The letter's wording
// was already generated once (see ToolsCoverLetterPage); this only lays it
// out as a real cover letter (letterhead, date, salutation, closing).
export function downloadCoverLetterPdf(coverLetter: string, sender: CoverLetterSender): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = MARGIN

  function ensureSpace(lineHeight: number) {
    if (y + lineHeight > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  function writeLines(lines: string[], lineHeight: number) {
    for (const line of lines) {
      ensureSpace(lineHeight)
      doc.text(line, MARGIN, y)
      y += lineHeight
    }
  }

  // Letterhead
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(sender.name, MARGIN, y)
  y += 20

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text([sender.location, sender.phone, sender.email, sender.linkedinLabel].join('  |  '), MARGIN, y)
  y += 16

  doc.setDrawColor(200)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 24

  // Date
  doc.setTextColor(0)
  doc.setFontSize(11)
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), MARGIN, y)
  y += 28

  // Salutation
  doc.text('Dear Hiring Manager,', MARGIN, y)
  y += 22

  // Body — one blank line between paragraphs, matching the generated text's
  // own paragraph breaks.
  const paragraphs = coverLetter
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph, CONTENT_WIDTH) as string[]
    writeLines(lines, 15)
    y += 10
  }

  // Closing
  ensureSpace(60)
  y += 10
  doc.text('Sincerely,', MARGIN, y)
  y += 34
  doc.text(sender.name, MARGIN, y)

  const fileDate = new Date().toISOString().slice(0, 10)
  doc.save(`Cover Letter - ${fileDate}.pdf`)
}
