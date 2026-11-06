import type { Metadata } from 'next'
import { About } from '../components/About'
import { Contact } from '../components/Contact'
import { Credentials } from '../components/Credentials'
import { Experience } from '../components/Experience'
import { Hero } from '../components/Hero'
import { HomeFooter } from '../components/home/HomeFooter'
import { HomeHeader } from '../components/home/HomeHeader'
import { HomeSection } from '../components/home/HomeSection'
import '../components/home/industry.css'
import { Projects } from '../components/Projects'
import { Skills } from '../components/Skills'
import type { ResumeContent } from '../content/types'
import { getResumeContent } from '../i18n'
import { LiveCursorOverlay } from '../live-cursors/components/LiveCursorOverlay'
import { PageViewBeacon } from '../page-views/PageViewBeacon'
import { JsonLd } from '../seo/JsonLd'
import { AVATAR_URL, PERSON_ID, SITE_ORIGIN, SITE_TITLE } from '../seo/site'

// The headline is multi-line on screen; as one line of text each line
// becomes its own sentence.
function oneLine(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('. ')
}

// The description follows the Resume Profile's headline and location, so an
// Admin edit in Settings reaches search snippets too. Title and the rest
// come from the root layout.
export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getResumeContent()
  const description = `${meta.name} (Alison Rafael) — Full Stack Software Engineer based in ${meta.location}. ${oneLine(meta.headline)}.`

  return {
    description,
    openGraph: {
      type: 'profile',
      url: SITE_ORIGIN,
      title: SITE_TITLE,
      description,
      siteName: SITE_TITLE,
      images: [{ url: AVATAR_URL, alt: `Portrait of ${meta.name}` }],
    },
    twitter: { card: 'summary', title: SITE_TITLE, description, images: [AVATAR_URL] },
  }
}

// schema.org ProfilePage + Person: tells search engines who this page is
// about and, via sameAs, which LinkedIn/GitHub profiles are the same person.
function profileJsonLd(content: ResumeContent) {
  const { meta, links, topSkills, experience } = content
  const [locality, region, country] = meta.location.split(',').map((part) => part.trim())
  const current = experience.find((entry) => entry.roles.some((role) => /present/i.test(role.period)))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: meta.name,
        alternateName: ['Alison Rafael', 'Alison Gonçalves'],
        jobTitle: 'Full Stack Software Engineer',
        description: oneLine(meta.headline),
        url: SITE_ORIGIN,
        image: AVATAR_URL,
        address: {
          '@type': 'PostalAddress',
          addressLocality: locality,
          addressRegion: region,
          addressCountry: country,
        },
        sameAs: [links.linkedin, links.github].filter(Boolean),
        knowsAbout: topSkills,
        ...(current && { worksFor: { '@type': 'Organization', name: current.company } }),
      },
      {
        '@type': 'ProfilePage',
        '@id': `${SITE_ORIGIN}/#profile`,
        url: SITE_ORIGIN,
        name: SITE_TITLE,
        mainEntity: { '@id': PERSON_ID },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: SITE_ORIGIN,
        name: meta.name,
        publisher: { '@id': PERSON_ID },
      },
    ],
  }
}

// Server Component. The Resume Profile part of `content` is fetched from the
// API per request (cached until the Admin's next Settings save, see
// i18n/index.ts's getResumeContent), the rest is the static ../content/en.ts
// copy. Client islands: the Live Cursor overlay, the Page View beacon and the
// hero chat (HeroChatWrapper) — see
// docs/adr/0013-migrate-web-client-to-nextjs-app-router.md. Styling comes from
// the `.industry` scope in components/home/industry.css, which only this page loads.
export default async function Home() {
  const content = await getResumeContent()
  const { sectionTitles } = content

  return (
    <div id="top" className="industry flex min-h-screen flex-col">
      <JsonLd data={profileJsonLd(content)} />
      <LiveCursorOverlay room="home" />
      <PageViewBeacon />
      <HomeHeader content={content} />
      <main className="mx-auto box-border w-full max-w-[1200px] px-[clamp(20px,4vw,48px)]">
        <Hero content={content} />
        <About content={content} />

        <HomeSection id="experience" index="02 / Experience" title={`${sectionTitles.experience}.`}>
          <Experience entries={content.experience} />
        </HomeSection>

        {content.projects.length > 0 && (
          <HomeSection id="projects" index="03 / Projects" title={`${sectionTitles.projects}.`}>
            <Projects entries={content.projects} />
          </HomeSection>
        )}

        <HomeSection id="skills" index="04 / Skills" title={`${sectionTitles.topSkills}.`}>
          <Skills
            topSkills={content.topSkills}
            technologyGroups={content.technologyGroups}
            languages={content.languages}
            languagesTitle={sectionTitles.languages}
          />
        </HomeSection>

        <HomeSection id="credentials" index="05 / Credentials" title={`${sectionTitles.credentials}.`}>
          <Credentials
            educationTitle={sectionTitles.education}
            certificationsTitle={sectionTitles.certifications}
            education={content.education}
            certifications={content.certifications}
          />
        </HomeSection>

        <HomeSection id="contact" index="06 / Contact" title={`${sectionTitles.contact}.`}>
          <Contact content={content} />
        </HomeSection>
      </main>

      <HomeFooter content={content} />
    </div>
  )
}
