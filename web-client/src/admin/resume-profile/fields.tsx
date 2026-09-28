'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { useAdminContent } from '../i18n'

// Controlled form primitives for the Resume Profile form. Each is a thin
// wrapper so ResumeProfileForm can stay a flat description of the fields.

const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent-dim'

const iconButtonClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-surface hover:text-ink disabled:pointer-events-none disabled:opacity-30'

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-ink-dim">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </div>
  )
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-dim">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--color-accent)]"
      />
      {label}
    </label>
  )
}

function ItemControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number
  count: number
  onMove: (to: number) => void
  onRemove: () => void
}) {
  const content = useAdminContent().resumeProfile
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => onMove(index - 1)}
        disabled={index === 0}
        aria-label={content.moveUp}
        title={content.moveUp}
        className={iconButtonClass}
      >
        <ArrowUp size={14} />
      </button>
      <button
        type="button"
        onClick={() => onMove(index + 1)}
        disabled={index === count - 1}
        aria-label={content.moveDown}
        title={content.moveDown}
        className={iconButtonClass}
      >
        <ArrowDown size={14} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={content.remove}
        title={content.remove}
        className={`${iconButtonClass} hover:text-red-400`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  const content = useAdminContent().resumeProfile
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-dim transition-colors hover:border-accent hover:text-ink"
    >
      <Plus size={13} />
      {content.add} {label}
    </button>
  )
}

// A list of plain strings (skills, certifications, technologies): one input
// per row, reorderable.
export function StringListEditor({
  label,
  itemLabel,
  items,
  onChange,
}: {
  label?: string
  itemLabel: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div>
      {label && <p className="mb-1 text-xs text-ink-dim">{label}</p>}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <input
              type="text"
              value={item}
              aria-label={`${itemLabel} ${index + 1}`}
              onChange={(e) => onChange(items.map((current, i) => (i === index ? e.target.value : current)))}
              className={inputClass}
            />
            <ItemControls
              index={index}
              count={items.length}
              onMove={(to) => onChange(move(items, index, to))}
              onRemove={() => onChange(items.filter((_, i) => i !== index))}
            />
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <AddButton label={itemLabel} onClick={() => onChange([...items, ''])} />
      </div>
    </div>
  )
}

// A list of objects, each rendered as a card by `renderItem`. `update`
// replaces just that item, so callers never index into the array themselves.
export function ListEditor<T>({
  items,
  onChange,
  newItem,
  itemLabel,
  itemTitle,
  renderItem,
}: {
  items: T[]
  onChange: (items: T[]) => void
  newItem: () => T
  itemLabel: string
  itemTitle: (item: T, index: number) => string
  renderItem: (item: T, update: (item: T) => void) => ReactNode
}) {
  return (
    <div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="rounded-lg border border-line bg-surface/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold">{itemTitle(item, index)}</p>
              <ItemControls
                index={index}
                count={items.length}
                onMove={(to) => onChange(move(items, index, to))}
                onRemove={() => onChange(items.filter((_, i) => i !== index))}
              />
            </div>
            {renderItem(item, (next) => onChange(items.map((current, i) => (i === index ? next : current))))}
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <AddButton label={itemLabel} onClick={() => onChange([...items, newItem()])} />
      </div>
    </div>
  )
}
