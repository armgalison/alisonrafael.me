'use client'

import { useEffect, useState } from 'react'
import { api, type ChatSessionList, type ChatTranscript } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'

const neutralBtn =
  'rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent-dim disabled:opacity-50'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// "BR" -> "Brazil"; falls back to the code if the runtime can't name it.
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
function countryName(code: string | null): string | null {
  if (!code) return null
  try {
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

// Read-only list of recorded hero-chat conversations, with the selected
// one's full transcript beside it.
export function ChatConversationsPanel() {
  const { token } = useAuth()
  const copy = useAdminContent().chatConversations

  const [page, setPage] = useState(1)
  const [list, setList] = useState<ChatSessionList | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<ChatTranscript | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setList(null)
    api
      .listChatSessions(token, page)
      .then((data) => {
        if (!cancelled) setList(data)
      })
      .catch(() => {
        if (!cancelled) setError(copy.loadError)
      })
    return () => {
      cancelled = true
    }
  }, [token, page, copy.loadError])

  useEffect(() => {
    if (!token || !selectedId) return
    let cancelled = false
    setTranscript(null)
    api
      .getChatSession(token, selectedId)
      .then((data) => {
        if (!cancelled) setTranscript(data)
      })
      .catch(() => {
        if (!cancelled) setError(copy.loadError)
      })
    return () => {
      cancelled = true
    }
  }, [token, selectedId, copy.loadError])

  const pages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">{copy.heading}</h2>
        <p className="text-sm text-ink-dim">{copy.subtitle}</p>
      </div>

      {error && (
        <p className="rounded-md border border-line px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="flex min-w-0 flex-col gap-3">
          {!list && !error && <p className="text-sm text-ink-dim">{copy.loading}</p>}
          {list && list.items.length === 0 && <p className="text-sm text-ink-dim">{copy.empty}</p>}
          {list && list.items.length > 0 && (
            <ul className="flex flex-col gap-2">
              {list.items.map((session) => {
                const selected = session.id === selectedId
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(session.id)}
                      aria-pressed={selected}
                      className={`flex w-full flex-col gap-1 rounded-lg border px-3 py-2 text-left transition-colors ${
                        selected ? 'border-ink bg-surface-raised' : 'border-line hover:border-accent-dim'
                      }`}
                    >
                      <span className="flex items-baseline justify-between gap-3 text-xs text-ink-dim">
                        <span>{formatTime(session.lastMessageAt)}</span>
                        <span className="shrink-0 font-mono">{copy.messages(session.messageCount)}</span>
                      </span>
                      <span className="truncate text-sm">{session.preview || copy.noPreview}</span>
                      <span className="truncate text-xs text-ink-dim">
                        {[session.ip, countryName(session.country), session.asnOrg].filter(Boolean).join(' · ') ||
                          copy.unknownVisitor}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {list && list.total > list.pageSize && (
            <div className="flex items-center justify-between gap-3 text-sm text-ink-dim">
              <span>{copy.pageOf(list.page, pages, list.total)}</span>
              <div className="flex gap-2">
                <button type="button" className={neutralBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  {copy.previous}
                </button>
                <button type="button" className={neutralBtn} disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  {copy.next}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-lg border border-line bg-surface-raised p-4">
          {!selectedId && <p className="text-sm text-ink-dim">{copy.selectHint}</p>}
          {selectedId && !transcript && !error && <p className="text-sm text-ink-dim">{copy.loading}</p>}
          {transcript && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-ink-dim">
                {formatTime(transcript.firstMessageAt)} – {formatTime(transcript.lastMessageAt)}
              </p>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-b border-line pb-3 text-sm">
                <dt className="text-ink-dim">{copy.ipLabel}</dt>
                <dd className="font-mono text-xs leading-5">{transcript.ip ?? copy.unknownVisitor}</dd>
                <dt className="text-ink-dim">{copy.locationLabel}</dt>
                <dd>{countryName(transcript.country) ?? copy.unknownVisitor}</dd>
                <dt className="text-ink-dim">{copy.networkLabel}</dt>
                <dd>
                  {transcript.asnOrg
                    ? `${transcript.asnOrg}${transcript.asn ? ` (AS${transcript.asn})` : ''}`
                    : transcript.ip
                      ? copy.unknownNetwork
                      : copy.unknownVisitor}
                </dd>
                <dt className="text-ink-dim">{copy.userAgentLabel}</dt>
                <dd className="truncate text-xs leading-5" title={transcript.userAgent ?? undefined}>
                  {transcript.userAgent ?? copy.unknownVisitor}
                </dd>
              </dl>
              <ol className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
                {transcript.messages.map((message) => {
                  const isUser = message.role === 'user'
                  return (
                    <li
                      key={message.id}
                      className={`flex max-w-[85%] flex-col gap-1 ${isUser ? 'self-end items-end' : 'self-start'}`}
                    >
                      <span className="text-xs text-ink-dim">
                        {isUser ? copy.visitor : copy.assistant} · {formatTime(message.createdAt)}
                      </span>
                      <p
                        className={`rounded-lg border px-3 py-2 text-sm break-words whitespace-pre-wrap ${
                          isUser ? 'border-ink bg-surface' : 'border-line bg-surface'
                        }`}
                      >
                        {message.content}
                      </p>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
