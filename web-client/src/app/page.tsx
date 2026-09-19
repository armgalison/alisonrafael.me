import { Briefcase, Send, Sparkles, SquareUser } from 'lucide-react'
import { Contact } from '../components/Contact'
import { Credentials } from '../components/Credentials'
import { Experience } from '../components/Experience'
import { Footer } from '../components/Footer'
import { HashScrollOnLoad } from '../components/HashScrollOnLoad'
import { Hero } from '../components/Hero'
import { Nav } from '../components/Nav'
import { SectionHeading } from '../components/Section'
import { Skills } from '../components/Skills'
import { Stats } from '../components/Stats'
import { getResumeContent } from '../i18n'
import { LiveCursorOverlay } from '../live-cursors/components/LiveCursorOverlay'

// Server Component — renders fully server-side. The Resume Profile part of
// `content` is fetched from the API per request (cached until the Admin's
// next Settings save, see i18n/index.ts's getResumeContent), the rest is
// still the static ../content/en.ts copy. The interactive/animated pieces
// (Nav, Hero, Experience, Reveal, ...) are client islands within it — see
// docs/adr/0013-migrate-web-client-to-nextjs-app-router.md.
export default async function Home() {
  const content = await getResumeContent()

  return (
    <div className="min-h-screen bg-surface text-ink">
      <HashScrollOnLoad />
      <LiveCursorOverlay room="home" />
      <Nav content={content} />
      <main>
        <Hero content={content} />
        <Stats content={content} />

        <div className="mx-auto max-w-6xl px-6 pt-8 pb-8 lg:grid lg:grid-cols-[1fr_336px] lg:items-start lg:gap-16">
          <section id="experience" className="scroll-mt-24">
            <SectionHeading title={content.sectionTitles.experience} icon={Briefcase} />
            <Experience entries={content.experience} />
          </section>

          <aside className="mt-16 space-y-14 lg:sticky lg:top-24 lg:mt-0 lg:self-start">
            <section id="skills" className="scroll-mt-24">
              <SectionHeading title={content.sectionTitles.topSkills} icon={Sparkles} />
              <Skills
                topSkills={content.topSkills}
                technologyGroups={content.technologyGroups}
                languages={content.languages}
              />
            </section>

            <section id="credentials" className="scroll-mt-24">
              <SectionHeading title={content.sectionTitles.credentials} icon={SquareUser} />
              <Credentials
                educationTitle={content.sectionTitles.education}
                certificationsTitle={content.sectionTitles.certifications}
                education={content.education}
                certifications={content.certifications}
              />
            </section>
          </aside>
        </div>

        <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-6 pt-8 pb-8">
          <SectionHeading title={content.sectionTitles.contact} icon={Send} />
          <Contact content={content} />
        </section>
      </main>

      <Footer content={content} />
    </div>
  )
}
