'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, RefreshCw, Sparkles, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { easeOut } from '../../lib/motion'
import { api, ApiError, type DraftResult, type RankedTrend, type TrendsStreamEvent } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'

function formatRelativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

interface LiveEntry {
  id: number
  kind: 'thinking' | 'status'
  text: string
}

// Consecutive thinking deltas merge into one flowing block instead of a
// list of tiny fragments; a status event (phase change, web search
// starting/finishing, a new draft starting) always starts a fresh block —
// that's a natural, meaningful break, not noise.
function appendLiveEvent(prev: LiveEntry[], event: TrendsStreamEvent): LiveEntry[] {
  if (event.type === 'thinking') {
    const last = prev[prev.length - 1]
    if (last?.kind === 'thinking') {
      return [...prev.slice(0, -1), { ...last, text: last.text + event.delta }]
    }
    return [...prev, { id: prev.length, kind: 'thinking', text: event.delta }]
  }
  if (event.type === 'status') {
    return [...prev, { id: prev.length, kind: 'status', text: event.message }]
  }
  return prev
}

function LivePanel({ heading, entries }: { heading: string; entries: LiveEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [entries])

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface-raised/60">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-dim/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-dim/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
        <span className="ml-2 font-mono text-xs text-ink-dim">{heading}</span>
      </div>
      <div ref={scrollRef} className="max-h-64 space-y-2 overflow-y-auto p-5 font-mono text-xs leading-relaxed">
        {entries.map((entry) =>
          entry.kind === 'status' ? (
            <p key={entry.id} className="text-ink-dim">
              <span className="text-accent">❯</span> {entry.text}
            </p>
          ) : (
            <p key={entry.id} className="whitespace-pre-wrap text-ink-dim/80">
              {entry.text}
            </p>
          ),
        )}
        <span className="inline-block h-3 w-1.5 animate-pulse bg-accent" />
      </div>
    </div>
  )
}

export function TrendsPage() {
  const { token } = useAuth()
  const content = useAdminContent()

  const [loadingLatest, setLoadingLatest] = useState(true)
  const [trends, setTrends] = useState<RankedTrend[] | null>(null)
  const [searchedAt, setSearchedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [results, setResults] = useState<DraftResult[] | null>(null)
  const [live, setLive] = useState<LiveEntry[]>([])

  // Only ever reads the last saved search — never triggers a new (paid)
  // discovery run on its own. "New search" below is the only thing that
  // does that, by the Admin's own choice.
  useEffect(() => {
    if (!token) return
    api
      .getLatestTrendSearch(token)
      .then((search) => {
        if (search) {
          setTrends(search.trends)
          setSearchedAt(search.createdAt)
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : content.trends.discoverError))
      .finally(() => setLoadingLatest(false))
  }, [token, content.trends.discoverError])

  async function handleNewSearch() {
    if (!token) return
    setSearching(true)
    setError(null)
    setResults(null)
    setSelected(new Set())
    setLive([])
    try {
      await api.streamDiscoverTrends(token, (event) => {
        setLive((prev) => appendLiveEvent(prev, event))
        if (event.type === 'result') {
          setTrends(event.result.trends)
          setSearchedAt(event.result.createdAt)
        } else if (event.type === 'error') {
          setError(event.message)
        }
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : content.trends.discoverError)
    } finally {
      setSearching(false)
    }
  }

  function toggleSelected(index: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function handleCreatePosts() {
    if (!token || !trends) return
    setCreating(true)
    setResults(null)
    setError(null)
    setLive([])
    const chosen = trends.filter((_, index) => selected.has(index))
    try {
      await api.streamCreateDrafts(token, chosen, (event) => {
        setLive((prev) => appendLiveEvent(prev, event))
        if (event.type === 'draft_result') {
          setResults((prev) => [...(prev ?? []), event.result])
        } else if (event.type === 'error') {
          setError(event.message)
        }
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : content.trends.discoverError)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <Link href="/admin/posts" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink">
        <ArrowLeft size={14} />
        {content.trends.backToPosts}
      </Link>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Sparkles size={18} />
          </span>
          <div>
            <h1 className="text-xl font-semibold">{content.trends.heading}</h1>
            <p className="text-sm text-ink-dim">
              {searchedAt ? `${content.trends.lastSearchedPrefix} ${formatRelativeTime(searchedAt)}` : content.trends.subtitle}
            </p>
          </div>
        </div>
        {!loadingLatest && (
          <button
            type="button"
            onClick={handleNewSearch}
            disabled={searching}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent-dim hover:text-accent disabled:opacity-50"
          >
            <RefreshCw size={14} />
            {trends ? content.trends.newSearch : content.trends.searchNow}
          </button>
        )}
      </div>

      {loadingLatest && <p className="text-sm text-ink-dim">{content.common.loading}</p>}
      {searching && <p className="text-sm text-ink-dim">{content.trends.discovering}</p>}
      {(searching || creating) && <LivePanel heading={content.trends.liveOutputHeading} entries={live} />}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loadingLatest && !searching && !trends && !error && <p className="text-sm text-ink-dim">{content.trends.noSearchYet}</p>}
      {!searching && trends?.length === 0 && <p className="text-sm text-ink-dim">{content.trends.empty}</p>}

      {!searching && trends && trends.length > 0 && (
        <>
          <ul className="mt-4 flex flex-col gap-2">
            {trends.map((trend, index) => {
              const result = results?.find((r) => r.topic === trend.topic)
              return (
                <motion.li
                  key={trend.topic}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03, ease: easeOut }}
                  className="rounded-lg border border-line bg-surface-raised px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(index)}
                      onChange={() => toggleSelected(index)}
                      className="mt-1 size-4 shrink-0 accent-[var(--color-accent)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{trend.topic}</p>
                      <p className="mt-0.5 text-sm text-ink-dim">{trend.summary}</p>
                      <p className="mt-1 text-xs text-accent">
                        {content.trends.relevancePrefix} {trend.relevance}
                      </p>
                      {result && (
                        <p
                          className={`mt-2 flex items-center gap-1.5 text-xs ${
                            result.status === 'created' ? 'text-accent' : 'text-red-400'
                          }`}
                        >
                          {result.status === 'created' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {result.status === 'created' ? content.trends.created : `${content.trends.failed}: ${result.error}`}
                          {result.status === 'created' && result.postId && (
                            <Link href={`/admin/posts/${result.postId}`} className="underline hover:text-ink">
                              {content.trends.viewPost}
                            </Link>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ul>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              disabled={selected.size === 0 || creating}
              onClick={handleCreatePosts}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {creating ? content.trends.creating : content.trends.createPosts}
            </button>
            <span className="text-sm text-ink-dim">{content.trends.selectedCount(selected.size)}</span>
          </div>
        </>
      )}
    </div>
  )
}
