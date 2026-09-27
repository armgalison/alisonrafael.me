'use client'

import { Activity } from 'lucide-react'
import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { api, type PageViewFilters, type PageViewList, type PageViewSummary } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'

type Days = 7 | 30

const neutralBtn =
  'rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent-dim disabled:opacity-50'
const input =
  'min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-dim focus:border-accent-dim focus:outline-none'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface-raised px-4 py-3">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-dim uppercase">{title}</h2>
      {children}
    </section>
  )
}

function CountRows({ rows }: { rows: { key: string; label: ReactNode; count: number }[] }) {
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {rows.map((row) => (
        <li key={row.key} className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate">{row.label}</span>
          <span className="shrink-0 font-mono text-xs text-ink-dim">{row.count}</span>
        </li>
      ))}
    </ul>
  )
}

export function AccessLogPage() {
  const { token } = useAuth()
  const content = useAdminContent()
  const copy = content.accessLog

  const [days, setDays] = useState<Days>(7)
  const [summary, setSummary] = useState<PageViewSummary | null>(null)
  const [list, setList] = useState<PageViewList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Omit<PageViewFilters, 'days' | 'page'>>({})
  const [draft, setDraft] = useState({ host: '', path: '', ip: '' })
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setSummary(null)
    api
      .getPageViewSummary(token, days)
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch(() => {
        if (!cancelled) setError(copy.loadError)
      })
    return () => {
      cancelled = true
    }
  }, [token, days, copy.loadError])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setList(null)
    api
      .listPageViews(token, { days, page, ...filters })
      .then((data) => {
        if (!cancelled) setList(data)
      })
      .catch(() => {
        if (!cancelled) setError(copy.loadError)
      })
    return () => {
      cancelled = true
    }
  }, [token, days, page, filters, copy.loadError])

  function applyFilters(next: typeof draft) {
    setDraft(next)
    setFilters({
      host: next.host.trim() || undefined,
      path: next.path.trim() || undefined,
      ip: next.ip.trim() || undefined,
    })
    setPage(1)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    applyFilters(draft)
  }

  const maxPerDay = Math.max(1, ...(summary?.perDay.map((d) => d.count) ?? []))
  const pages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Activity size={18} />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{copy.heading}</h1>
          <p className="text-sm text-ink-dim">{copy.subtitle}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {([7, 30] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setDays(n)
              setPage(1)
            }}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              days === n ? 'border-accent-dim text-accent' : 'border-line text-ink-dim hover:text-ink'
            }`}
          >
            {copy.days(n)}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {!summary && !error && <p className="mb-6 text-sm text-ink-dim">{copy.loading}</p>}

      {summary && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          <Panel title={copy.pageViews}>
            <p className="text-2xl font-semibold">{summary.totals.pageViews}</p>
            <p className="text-sm text-ink-dim">
              {summary.totals.uniqueIps} {copy.uniqueIps}
            </p>
          </Panel>

          <Panel title={copy.perDay}>
            <ul className="flex flex-col gap-0.5">
              {summary.perDay.map((d) => (
                <li key={d.day} className="flex items-center gap-2 font-mono text-xs text-ink-dim">
                  <span className="w-12 shrink-0">{d.day.slice(5)}</span>
                  <span className="h-2 bg-accent" style={{ width: `${(d.count / maxPerDay) * 100}%` }} />
                  <span className="shrink-0">{d.count}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={copy.topPages}>
            <CountRows
              rows={summary.topPages.map((p) => ({
                key: p.host + p.path,
                label: (
                  <>
                    <span className="text-ink-dim">{p.host}</span>
                    {p.path}
                  </>
                ),
                count: p.count,
              }))}
            />
          </Panel>

          <Panel title={copy.topReferrers}>
            {summary.topReferrers.length === 0 ? (
              <p className="text-sm text-ink-dim">{copy.noReferrers}</p>
            ) : (
              <CountRows rows={summary.topReferrers.map((r) => ({ key: r.host, label: r.host, count: r.count }))} />
            )}
          </Panel>

          <div className="sm:col-span-2">
            <Panel title={copy.topNetworks}>
              <CountRows
                rows={summary.topNetworks.map((n) => ({
                  key: n.asnOrg ?? '',
                  label: (
                    <>
                      {n.asnOrg ?? copy.unknownNetwork}
                      {n.country && <span className="text-ink-dim"> · {n.country}</span>}
                      <span className="text-ink-dim">
                        {' '}
                        · {n.uniqueIps} {copy.uniqueIps}
                      </span>
                    </>
                  ),
                  count: n.count,
                }))}
              />
            </Panel>
          </div>
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">{copy.filtersHeading}</h2>
      <form onSubmit={onSubmit} className="mb-4 flex flex-wrap gap-2">
        <input
          className={input}
          placeholder={copy.hostPlaceholder}
          value={draft.host}
          onChange={(e) => setDraft({ ...draft, host: e.target.value })}
        />
        <input
          className={input}
          placeholder={copy.pathPlaceholder}
          value={draft.path}
          onChange={(e) => setDraft({ ...draft, path: e.target.value })}
        />
        <input
          className={input}
          placeholder={copy.ipPlaceholder}
          value={draft.ip}
          onChange={(e) => setDraft({ ...draft, ip: e.target.value })}
        />
        <button type="submit" className={neutralBtn}>
          {copy.apply}
        </button>
        <button type="button" className={neutralBtn} onClick={() => applyFilters({ host: '', path: '', ip: '' })}>
          {copy.clear}
        </button>
      </form>

      {!list && !error && <p className="text-sm text-ink-dim">{copy.loading}</p>}
      {list?.items.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ink-dim">
          {copy.empty}
        </p>
      )}

      {list && list.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-raised text-xs text-ink-dim">
                <tr>
                  <th className="px-3 py-2 font-medium">{copy.colTime}</th>
                  <th className="px-3 py-2 font-medium">{copy.colPage}</th>
                  <th className="px-3 py-2 font-medium">{copy.colVisitor}</th>
                  <th className="px-3 py-2 font-medium">{copy.colReferrer}</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((view) => (
                  <tr key={view.id} className="border-t border-line align-top">
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-ink-dim">
                      {formatTime(view.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-ink-dim">{view.host}</span>
                      {view.path}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        title={copy.filterByIp}
                        onClick={() => applyFilters({ ...draft, ip: view.ip })}
                        className="font-mono text-xs underline hover:text-accent"
                      >
                        {view.ip}
                      </button>
                      <p className="text-xs text-ink-dim">
                        {[view.asnOrg, view.country].filter(Boolean).join(' · ') || copy.unknownNetwork}
                      </p>
                      {view.userAgent && (
                        <p className="max-w-xs truncate text-xs text-ink-dim" title={view.userAgent}>
                          {view.userAgent}
                        </p>
                      )}
                    </td>
                    <td className="max-w-48 truncate px-3 py-2 text-xs text-ink-dim" title={view.referrer ?? ''}>
                      {view.referrer ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-ink-dim">
            <span>{copy.pageOf(list.page, pages, list.total)}</span>
            <div className="flex gap-2">
              <button type="button" className={neutralBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {copy.previous}
              </button>
              <button
                type="button"
                className={neutralBtn}
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
              >
                {copy.next}
              </button>
            </div>
          </div>
        </>
      )}

      <p className="mt-8 text-xs text-ink-dim">
        <a href="https://db-ip.com" target="_blank" rel="noreferrer" className="underline hover:text-ink">
          {copy.attribution}
        </a>
      </p>
    </div>
  )
}
