import { About } from '../components/About'
import { Contact } from '../components/Contact'
import { Credentials } from '../components/Credentials'
import { Experience } from '../components/Experience'
import { Footer } from '../components/Footer'
import { Hero } from '../components/Hero'
import { Section } from '../components/Section'
import { SiteHeader } from '../components/SiteHeader'
import { Skills } from '../components/Skills'
import { getResumeContent } from '../i18n'
import { LiveCursorOverlay } from '../live-cursors/components/LiveCursorOverlay'

// Server Component — renders fully server-side. The Resume Profile part of
// `content` is fetched from the API per request (cached until the Admin's
// next Settings save, see i18n/index.ts's getResumeContent), the rest is
// still the static ../content/en.ts copy. There is no client-side JS in the
// page's own markup — only the Live Cursor overlay is a client island — see
// docs/adr/0013-migrate-web-client-to-nextjs-app-router.md.
export default async function Home() {
  const content = await getResumeContent()
  const { sectionTitles } = content

  return (
    <div className="min-h-screen bg-surface text-ink">
      <LiveCursorOverlay room="home" />
      <SiteHeader content={content} />
      <main>
        <Hero content={content} />
        <About content={content} />

        <Section id="experience" index="02 / Experience" title={`${sectionTitles.experience}.`} flush>
          <Experience entries={content.experience} />
        </Section>

        <Section id="skills" index="03 / Skills" title={`${sectionTitles.topSkills}.`}>
          <Skills
            topSkills={content.topSkills}
            technologyGroups={content.technologyGroups}
            languages={content.languages}
            languagesTitle={sectionTitles.languages}
          />
        </Section>

        <Section id="credentials" index="04 / Credentials" title={`${sectionTitles.credentials}.`}>
          <Credentials
            educationTitle={sectionTitles.education}
            certificationsTitle={sectionTitles.certifications}
            education={content.education}
            certifications={content.certifications}
          />
        </Section>

        <Section id="contact" index="05 / Contact" title={`${sectionTitles.contact}.`}>
          <Contact content={content} />
        </Section>
      </main>

      <Footer content={content} />
    </div>
  )
}
