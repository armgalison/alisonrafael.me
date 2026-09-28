'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { easeOut } from '../../lib/motion'
import type { ResumeProfile } from '../api'
import { useAdminContent } from '../i18n'
import { CheckboxField, ListEditor, StringListEditor, TextField } from './fields'

type ExperienceEntry = ResumeProfile['experience'][number]
type ExperienceRole = ExperienceEntry['roles'][number]

const newRole = (): ExperienceRole => ({ title: '', period: '', location: '', description: '', emphasized: false })

function Section({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-xl border border-line bg-surface-raised">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold"
      >
        {title}
        <ChevronDown size={16} className={`text-ink-dim transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-line px-5 py-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

// A structured editor for every field of the Resume Profile (shared's
// ResumeProfile). Fully controlled — the page owns loading and saving.
export function ResumeProfileForm({
  value,
  onChange,
}: {
  value: ResumeProfile
  onChange: (value: ResumeProfile) => void
}) {
  const content = useAdminContent().resumeProfile
  const { sections, fields, items } = content

  function set<K extends keyof ResumeProfile>(key: K, next: ResumeProfile[K]) {
    onChange({ ...value, [key]: next })
  }

  function setLink(key: keyof ResumeProfile['links'], next: string) {
    set('links', { ...value.links, [key]: next })
  }

  return (
    <div className="space-y-3">
      <Section title={sections.basics} defaultOpen>
        <TextField label={fields.name} value={value.name} onChange={(v) => set('name', v)} />
        <TextField label={fields.headline} value={value.headline} onChange={(v) => set('headline', v)} multiline />
        <TextField label={fields.location} value={value.location} onChange={(v) => set('location', v)} />
      </Section>

      <Section title={sections.links}>
        <Grid>
          <TextField label={fields.phone} value={value.links.phone} onChange={(v) => setLink('phone', v)} />
          <TextField label={fields.email} value={value.links.email} onChange={(v) => setLink('email', v)} />
          <TextField label={fields.linkedin} value={value.links.linkedin} onChange={(v) => setLink('linkedin', v)} />
          <TextField
            label={fields.linkedinLabel}
            value={value.links.linkedinLabel}
            onChange={(v) => setLink('linkedinLabel', v)}
          />
          <TextField label={fields.github} value={value.links.github} onChange={(v) => setLink('github', v)} />
          <TextField
            label={fields.githubLabel}
            value={value.links.githubLabel}
            onChange={(v) => setLink('githubLabel', v)}
          />
          <TextField label={fields.website} value={value.links.website} onChange={(v) => setLink('website', v)} />
          <TextField
            label={fields.websiteLabel}
            value={value.links.websiteLabel}
            onChange={(v) => setLink('websiteLabel', v)}
          />
        </Grid>
      </Section>

      <Section title={sections.topSkills}>
        <StringListEditor itemLabel={fields.skill} items={value.topSkills} onChange={(v) => set('topSkills', v)} />
      </Section>

      <Section title={sections.technologyGroups}>
        <ListEditor
          items={value.technologyGroups}
          onChange={(v) => set('technologyGroups', v)}
          newItem={() => ({ label: '', items: [] })}
          itemLabel={items.technologyGroup}
          itemTitle={(group, i) => group.label || `#${i + 1}`}
          renderItem={(group, update) => (
            <div className="space-y-4">
              <TextField label={fields.groupLabel} value={group.label} onChange={(v) => update({ ...group, label: v })} />
              <StringListEditor
                label={fields.groupItems}
                itemLabel={fields.technology}
                items={group.items}
                onChange={(v) => update({ ...group, items: v })}
              />
            </div>
          )}
        />
      </Section>

      <Section title={sections.languages}>
        <ListEditor
          items={value.languages}
          onChange={(v) => set('languages', v)}
          newItem={() => ({ name: '', level: '' })}
          itemLabel={items.language}
          itemTitle={(language, i) => language.name || `#${i + 1}`}
          renderItem={(language, update) => (
            <Grid>
              <TextField
                label={fields.languageName}
                value={language.name}
                onChange={(v) => update({ ...language, name: v })}
              />
              <TextField
                label={fields.languageLevel}
                value={language.level}
                onChange={(v) => update({ ...language, level: v })}
              />
            </Grid>
          )}
        />
      </Section>

      <Section title={sections.certifications}>
        <StringListEditor
          itemLabel={fields.certification}
          items={value.certifications}
          onChange={(v) => set('certifications', v)}
        />
      </Section>

      <Section title={sections.experience}>
        <ListEditor
          items={value.experience}
          onChange={(v) => set('experience', v)}
          newItem={(): ExperienceEntry => ({ company: '', roles: [newRole()], emphasized: false })}
          itemLabel={items.experience}
          itemTitle={(entry, i) => entry.company || `#${i + 1}`}
          renderItem={(entry, update) => (
            <div className="space-y-4">
              <Grid>
                <TextField label={fields.company} value={entry.company} onChange={(v) => update({ ...entry, company: v })} />
                <TextField
                  label={fields.totalDuration}
                  value={entry.totalDuration ?? ''}
                  onChange={(v) => update({ ...entry, totalDuration: v })}
                />
              </Grid>
              <CheckboxField
                label={fields.emphasized}
                checked={entry.emphasized}
                onChange={(v) => update({ ...entry, emphasized: v })}
              />
              <div>
                <p className="mb-2 text-xs text-ink-dim">{fields.roles}</p>
                <ListEditor
                  items={entry.roles}
                  onChange={(v) => update({ ...entry, roles: v })}
                  newItem={newRole}
                  itemLabel={fields.role}
                  itemTitle={(role, i) => role.title || `#${i + 1}`}
                  renderItem={(role, updateRole) => (
                    <div className="space-y-4">
                      <Grid>
                        <TextField
                          label={fields.title}
                          value={role.title}
                          onChange={(v) => updateRole({ ...role, title: v })}
                        />
                        <TextField
                          label={fields.period}
                          value={role.period}
                          onChange={(v) => updateRole({ ...role, period: v })}
                        />
                      </Grid>
                      <TextField
                        label={fields.location}
                        value={role.location}
                        onChange={(v) => updateRole({ ...role, location: v })}
                      />
                      <TextField
                        label={fields.description}
                        value={role.description}
                        onChange={(v) => updateRole({ ...role, description: v })}
                        multiline
                      />
                      <CheckboxField
                        label={fields.emphasized}
                        checked={role.emphasized}
                        onChange={(v) => updateRole({ ...role, emphasized: v })}
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        />
      </Section>

      <Section title={sections.projects}>
        <ListEditor
          items={value.projects}
          onChange={(v) => set('projects', v)}
          newItem={() => ({ name: '', period: '', association: '', description: '', skills: [] })}
          itemLabel={items.project}
          itemTitle={(project, i) => project.name || `#${i + 1}`}
          renderItem={(project, update) => (
            <div className="space-y-4">
              <Grid>
                <TextField
                  label={fields.projectName}
                  value={project.name}
                  onChange={(v) => update({ ...project, name: v })}
                />
                <TextField
                  label={fields.period}
                  value={project.period}
                  onChange={(v) => update({ ...project, period: v })}
                />
              </Grid>
              <TextField
                label={fields.association}
                value={project.association}
                onChange={(v) => update({ ...project, association: v })}
              />
              <TextField
                label={fields.description}
                value={project.description}
                onChange={(v) => update({ ...project, description: v })}
                multiline
              />
              <StringListEditor
                label={fields.skills}
                itemLabel={fields.skill}
                items={project.skills}
                onChange={(v) => update({ ...project, skills: v })}
              />
            </div>
          )}
        />
      </Section>

      <Section title={sections.education}>
        <ListEditor
          items={value.education}
          onChange={(v) => set('education', v)}
          newItem={() => ({ school: '', degree: '', period: '' })}
          itemLabel={items.education}
          itemTitle={(entry, i) => entry.school || `#${i + 1}`}
          renderItem={(entry, update) => (
            <div className="space-y-4">
              <TextField label={fields.school} value={entry.school} onChange={(v) => update({ ...entry, school: v })} />
              <Grid>
                <TextField label={fields.degree} value={entry.degree} onChange={(v) => update({ ...entry, degree: v })} />
                <TextField label={fields.period} value={entry.period} onChange={(v) => update({ ...entry, period: v })} />
              </Grid>
            </div>
          )}
        />
      </Section>
    </div>
  )
}
