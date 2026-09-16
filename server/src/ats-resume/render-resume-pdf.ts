import PDFDocument from 'pdfkit';

// Hand-rolled, not a full markdown-to-PDF library: the system prompt in
// ats-resume.service.ts already constrains Claude to only ever emit the
// subset an ATS parser cares about (headings, bullets, plain paragraphs —
// no tables/images/nested lists), so this only needs to handle that
// subset. Plain single-column layout is the point — that's what makes a
// resume ATS-parseable in the first place; everything below is purely
// visual polish (color, spacing, hanging-indent bullets, a two-tone
// title/dates split) layered on top of that same plain-text structure, so
// none of it changes what an ATS parser actually extracts.
const ACCENT = '#0b6e5f';
const ACCENT_RULE = '#bfe3da';
const INK = '#1c2126';
const MUTED = '#5f6b7a';

// A "### " line is a job-title/company/dates or degree/school/dates line.
// When it ends in a parenthetical (how every date range in the Resume
// Profile is formatted, e.g. "(5 years)" / "(January 2018 - Present)"),
// split it so the dates render right-aligned and muted, matching how a
// professionally laid-out resume distinguishes role from tenure — with a
// plain bold-line fallback when a line doesn't match, so this never breaks
// on an unexpected shape.
const TRAILING_DATE_RE = /^(.*\S)\s+(\([^()]*\))\s*$/;

export function renderResumePdf(markdown: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 38, left: 56, right: 56 },
      // Needed to add page numbers after the fact once the total page
      // count is known — see the footer loop right before doc.end() below.
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    // Set the instant a '# ' name heading renders, so the very next
    // non-blank line (the injected contact line — see ats-resume.service.ts's
    // withContactLine) gets styled as a centered, muted subtitle instead of
    // a plain body paragraph, without the renderer needing to know anything
    // about that line's actual content.
    let expectContactLine = false;

    const lines = markdown.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') {
        doc.moveDown(0.3);
        continue;
      }

      if (line.startsWith('# ')) {
        doc
          .font('Helvetica-Bold')
          .fontSize(20)
          .fillColor(ACCENT)
          .text(stripEmphasis(line.slice(2)), { align: 'center' });
        doc.moveDown(0.15);
        expectContactLine = true;
        continue;
      }

      if (expectContactLine) {
        expectContactLine = false;
        const contact = stripEmphasis(line);
        doc.font('Helvetica').fillColor(MUTED);
        // Shrink until the whole contact line fits on one row — with up to
        // five items (phone/email/LinkedIn/GitHub/site) joined by wide
        // separators, a fixed size can wrap mid-separator and look broken.
        let contactSize = 9.5;
        while (
          contactSize > 7.5 &&
          doc.fontSize(contactSize).widthOfString(contact, { characterSpacing: 0.2 }) > contentWidth
        ) {
          contactSize -= 0.25;
        }
        doc.fontSize(contactSize).text(contact, { align: 'center', characterSpacing: 0.2 });
        doc.moveDown(0.4);
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .strokeColor(ACCENT)
          .lineWidth(1.1)
          .stroke();
        doc.moveDown(0.5);
        continue;
      }

      if (line.startsWith('## ')) {
        doc.moveDown(0.35);
        doc
          .font('Helvetica-Bold')
          .fontSize(11.5)
          .fillColor(ACCENT)
          .text(stripEmphasis(line.slice(3)).toUpperCase(), { characterSpacing: 0.9 });
        doc
          .moveTo(doc.page.margins.left, doc.y + 2)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
          .strokeColor(ACCENT_RULE)
          .lineWidth(1)
          .stroke();
        doc.moveDown(0.35);
        continue;
      }

      if (line.startsWith('### ')) {
        const headingText = stripEmphasis(line.slice(4));
        // Widow/orphan control: a role/degree heading stranded alone at the
        // bottom of a page, with its bullets starting fresh on the next
        // page with zero context, reads as broken even though nothing is
        // lost from an ATS parser's point of view. Reserve room for the
        // heading *and* its first bullet together so a page break instead
        // pushes the whole entry to the next page.
        const nextLine = lines[i + 1]?.trim() ?? '';
        if (nextLine.startsWith('- ') || nextLine.startsWith('* ')) {
          const headingHeight = estimateSubHeadingHeight(doc, headingText, contentWidth);
          const firstBulletHeight = estimateBulletHeight(doc, stripEmphasis(nextLine.slice(2)), contentWidth);
          ensureSpace(doc, headingHeight + firstBulletHeight + 6);
        }
        drawSubHeading(doc, headingText, contentWidth);
        doc.moveDown(0.15);
        continue;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        drawBullet(doc, stripEmphasis(line.slice(2)), contentWidth);
        continue;
      }

      doc
        .font('Helvetica')
        .fontSize(10.4)
        .fillColor(INK)
        .text(stripEmphasis(line), { width: contentWidth, lineGap: 1.5 });
      doc.moveDown(0.15);
    }

    // A multi-page resume with no page numbers reads like the later pages
    // are an accident rather than an intentional continuation — cheap to
    // fix, and only relevant once there's more than one page.
    const { start, count } = doc.bufferedPageRange();
    if (count > 1) {
      for (let p = start; p < start + count; p++) {
        doc.switchToPage(p);
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(MUTED)
          .text(`Page ${p + 1} of ${count}`, doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 14, {
            width: contentWidth,
            align: 'center',
            lineBreak: false,
          });
      }
    }

    doc.end();
  });
}

// Splits "Title, Company" / "Degree, Field, School" style text on its
// first comma so the first segment (the thing a reader scans for first —
// role or degree) reads bold and everything after reads in a lighter,
// muted weight, instead of one undifferentiated bold run.
function splitLead(text: string): [string, string | null] {
  const commaIndex = text.indexOf(',');
  if (commaIndex === -1) return [text, null];
  return [text.slice(0, commaIndex), text.slice(commaIndex)];
}

// pdfkit's automatic pagination only reliably kicks in for text placed via
// its own auto-flowing cursor — every draw call below gives an explicit
// (x, y) instead (that's what makes the hanging-indent bullets and the
// title/dates split possible), which bypasses that logic and, near a page
// boundary, was rendering the same line fragmented across a near-blank
// extra page. This checks the space a block needs *before* drawing it and
// forces a clean page break ourselves when it won't fit, so every explicit-
// position draw always starts on a page with enough room.
function ensureSpace(doc: PDFKit.PDFDocument, height: number): void {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + height > bottom) doc.addPage();
}

function renderLead(doc: PDFKit.PDFDocument, value: string, width: number, y: number): void {
  const left = doc.page.margins.left;
  const [lead, rest] = splitLead(value);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(lead, left, y, {
    width,
    lineBreak: false,
    continued: rest !== null,
  });
  if (rest !== null) doc.font('Helvetica').fontSize(10.5).fillColor(MUTED).text(rest, { lineBreak: false });
  doc.x = left;
}

function drawSubHeading(doc: PDFKit.PDFDocument, text: string, contentWidth: number): void {
  const left = doc.page.margins.left;
  const match = text.match(TRAILING_DATE_RE);

  if (!match) {
    const height = doc.font('Helvetica-Bold').fontSize(10.5).heightOfString(text, { width: contentWidth });
    ensureSpace(doc, height);
    renderLead(doc, text, contentWidth, doc.y);
    return;
  }

  const [, primary, dates] = match;
  doc.font('Helvetica-Bold').fontSize(10.5);
  const dateWidth = doc.widthOfString(dates);
  const primaryWidth = contentWidth - dateWidth - 8;

  // Only split into a title/dates row when the title actually fits on one
  // line at that width — otherwise (e.g. a long degree name) fall back to
  // the plain full-width bold line, then the dates on their own muted line
  // beneath it, rather than forcing a cramped two-line wrap next to dates
  // that were only ever meant to sit beside a single line of text.
  if (doc.widthOfString(primary) > primaryWidth) {
    const leadHeight = doc.heightOfString(primary, { width: contentWidth });
    const dateHeight = doc.font('Helvetica-Oblique').fontSize(9.5).heightOfString(dates, { width: contentWidth });
    ensureSpace(doc, leadHeight + dateHeight + 2);
    renderLead(doc, primary, contentWidth, doc.y);
    doc.moveDown(0.05);
    doc
      .font('Helvetica-Oblique')
      .fontSize(9.5)
      .fillColor(MUTED)
      .text(dates, left, doc.y, { width: contentWidth, align: 'right' });
    return;
  }

  const height = doc.font('Helvetica-Bold').fontSize(10.5).heightOfString(primary, { width: primaryWidth });
  ensureSpace(doc, height);
  const y = doc.y;
  renderLead(doc, primary, primaryWidth, y);
  doc
    .font('Helvetica-Oblique')
    .fontSize(9.5)
    .fillColor(MUTED)
    .text(dates, left + contentWidth - dateWidth, y, { width: dateWidth, lineBreak: false });
  doc.x = left;
}

// A conservative (single-line-worst-case) estimate of a "### " heading's
// rendered height, used only for the widow/orphan look-ahead above —
// drawSubHeading does its own precise ensureSpace() per code path when it
// actually renders, so slightly overestimating here is safe.
function estimateSubHeadingHeight(doc: PDFKit.PDFDocument, text: string, contentWidth: number): number {
  return doc.font('Helvetica-Bold').fontSize(10.5).heightOfString(text, { width: contentWidth });
}

function estimateBulletHeight(doc: PDFKit.PDFDocument, text: string, contentWidth: number): number {
  const bulletIndent = 14;
  return doc.font('Helvetica').fontSize(10).heightOfString(text, { width: contentWidth - bulletIndent, lineGap: 1.5 });
}

function drawBullet(doc: PDFKit.PDFDocument, text: string, contentWidth: number): void {
  const bulletIndent = 14;
  const left = doc.page.margins.left;
  const textWidth = contentWidth - bulletIndent;

  const textHeight = estimateBulletHeight(doc, text, contentWidth);
  ensureSpace(doc, textHeight);

  doc.font('Helvetica').fontSize(10);
  const startY = doc.y;
  doc.fillColor(ACCENT).text('•', left, startY, { width: bulletIndent, lineBreak: false });
  doc.fillColor(INK).text(text, left + bulletIndent, startY, { width: textWidth, lineGap: 1.5 });

  doc.x = left;
  doc.y = startY + textHeight;
  doc.moveDown(0.22);
}

function stripEmphasis(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1');
}
