'use client'

import { PlugZap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type ConnectedClient } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'

const MCP_URL = `${process.env.NEXT_PUBLIC_API_URL}/mcp`

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

// Settings → Connected clients: the AI clients allowed into the Admin MCP
// (ADR 0021), each revocable on the spot.
export function ConnectedClientsPage() {
  const { token } = useAuth()
  const copy = useAdminContent().connectedClients

  const [clients, setClients] = useState<ConnectedClient[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    api
      .listConnectedClients(token)
      .then((data) => {
        if (!cancelled) setClients(data)
      })
      .catch(() => {
        if (!cancelled) setError(copy.loadError)
      })
    return () => {
      cancelled = true
    }
  }, [token, copy.loadError])

  async function revoke(client: ConnectedClient) {
    if (!token || !window.confirm(copy.revokeConfirm(client.clientName))) return
    setRevoking(client.id)
    setError(null)
    try {
      await api.revokeConnectedClient(token, client.id)
      setClients((current) => current?.filter((c) => c.id !== client.id) ?? null)
    } catch {
      setError(copy.revokeError)
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <PlugZap size={18} />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{copy.heading}</h1>
          <p className="text-sm text-ink-dim">{copy.subtitle}</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-line bg-surface-raised px-4 py-3">
        <p className="mb-1 text-xs font-semibold tracking-wide text-ink-dim uppercase">{copy.endpointLabel}</p>
        <code className="font-mono text-sm break-all">{MCP_URL}</code>
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {!clients && !error && <p className="text-sm text-ink-dim">{copy.loading}</p>}
      {clients?.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ink-dim">
          {copy.empty}
        </p>
      )}

      {clients && clients.length > 0 && (
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {clients.map((client) => (
            <li key={client.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{client.clientName}</p>
                <p className="text-xs text-ink-dim">
                  {copy.connected(formatTime(client.createdAt))} ·{' '}
                  {client.lastUsedAt ? copy.lastUsed(formatTime(client.lastUsedAt)) : copy.neverUsed}
                </p>
                <p className="text-xs text-ink-dim">{copy.expires(formatTime(client.expiresAt))}</p>
              </div>
              <button
                type="button"
                className={neutralBtn}
                disabled={revoking === client.id}
                onClick={() => revoke(client)}
              >
                {copy.revoke}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
