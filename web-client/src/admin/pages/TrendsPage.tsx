import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, RefreshCw, Sparkles, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { easeOut } from '../../lib/motion'
import { api, ApiError, type DraftResult, type RankedTrend } from '../api'
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
    try {
      const search = await api.discoverTrends(token)
      setTrends(search.trends)
      setSearchedAt(search.createdAt)
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
    const chosen = trends.filter((_, index) => selected.has(index))
    try {
      const outcome = await api.createDrafts(token, chosen)
      setResults(outcome)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : content.trends.discoverError)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <Link to="/admin/posts" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink">
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
                            <Link to={`/admin/posts/${result.postId}`} className="underline hover:text-ink">
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
