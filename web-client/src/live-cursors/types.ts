// Deliberately separate from any server-side type — same "no shared wire
// type between apps" precedent as src/blog/api.ts's Post interface.
export interface CursorState {
  color: string
  xPct: number
  yPct: number
}
