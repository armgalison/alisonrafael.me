import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
  type MDXEditorMethods,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import { useAuth } from '../AuthContext'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function PostEditorPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { token } = useAuth()
  const navigate = useNavigate()
  const editorRef = useRef<MDXEditorMethods>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditing || !token || !id) return
    api
      .getPost(token, id)
      .then((post) => {
        setTitle(post.title)
        setSlug(post.slug)
        setSlugTouched(true)
        setExcerpt(post.excerpt)
        setPublished(post.published)
        editorRef.current?.setMarkdown(post.content)
      })
      .catch(() => setError('Falha ao carregar o post.'))
      .finally(() => setLoading(false))
  }, [isEditing, token, id])

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    const content = editorRef.current?.getMarkdown() ?? ''
    try {
      if (isEditing && id) {
        await api.updatePost(token, id, { title, slug, excerpt, content, published })
      } else {
        await api.createPost(token, { title, slug, excerpt, content, published })
      }
      navigate('/admin/posts')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar o post.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-ink-dim">Carregando…</p>

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">{isEditing ? 'Editar post' : 'Novo post'}</h1>

      <div>
        <label className="mb-1 block text-sm text-ink-dim" htmlFor="title">
          Título
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full rounded-md border border-line bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent-dim"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink-dim" htmlFor="slug">
          Slug
        </label>
        <input
          id="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          className="w-full rounded-md border border-line bg-surface-raised px-3 py-2 font-mono text-sm outline-none focus:border-accent-dim"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink-dim" htmlFor="excerpt">
          Resumo
        </label>
        <textarea
          id="excerpt"
          required
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full rounded-md border border-line bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent-dim"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm text-ink-dim">Conteúdo</span>
        <div className="overflow-hidden rounded-md border border-line">
          <MDXEditor
            ref={editorRef}
            markdown=""
            className="dark-theme"
            contentEditableClassName="prose prose-invert max-w-none min-h-64 px-3 py-2"
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              linkPlugin(),
              linkDialogPlugin(),
              imagePlugin({
                imageUploadHandler: async (file: File) => {
                  if (!token) throw new Error('Not authenticated')
                  const { url } = await api.uploadImage(token, file)
                  return url
                },
              }),
              markdownShortcutPlugin(),
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <BlockTypeSelect />
                    <ListsToggle />
                    <CreateLink />
                    <InsertImage />
                  </>
                ),
              }),
            ]}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="size-4 accent-[var(--color-accent)]"
        />
        Publicado
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/posts')}
          className="rounded-md border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
