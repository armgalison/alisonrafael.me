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
import { useResumeContent } from '../i18n'

// Server Component — content is static (../content/en.ts) so this renders
// fully server-side, no data fetching. The interactive/animated pieces
// (Nav, Hero, Experience, Reveal, ...) are client islands within it — see
// docs/adr/0013-migrate-web-client-to-nextjs-app-router.md.
export default function Home() {
  const content = useResumeContent()

  return (
    <div className="min-h-screen bg-surface text-ink">
      <HashScrollOnLoad />
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

        <section id="contact" className="mx-auto max-w-4xl scroll-mt-24 px-6 py-16">
          <SectionHeading title={content.sectionTitles.contact} icon={Send} />
          <Contact content={content} />
        </section>
      </main>

      <Footer content={content} />
    </div>
  )
}
