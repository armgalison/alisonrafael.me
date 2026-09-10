import MDEditor, { type ICommand } from '@uiw/react-md-editor'
import { Columns2, Eye, ImagePlus, Pencil, Save, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'

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
  const copy = useAdminContent()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [coverBusy, setCoverBusy] = useState(false)
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keeps the latest markdown reachable from paste/drop handlers, whose
  // upload promise resolves after `content` may have moved on — reading
  // React state directly there would close over a stale value.
  const contentRef = useRef(content)
  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    if (!isEditing || !token || !id) return
    api
      .getPost(token, id)
      .then((post) => {
        setTitle(post.title)
        setSlug(post.slug)
        setSlugTouched(true)
        setExcerpt(post.excerpt)
        setContent(post.content)
        setCoverImageUrl(post.coverImageUrl)
      })
      .catch(() => setError(copy.editor.loadError))
      .finally(() => setLoading(false))
  }, [isEditing, token, id, copy.editor.loadError])

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  // Same file-picker + upload path as the editor's toolbar image button,
  // but stores the URL as the Post's cover rather than inserting markdown.
  function pickCover() {
    if (!token) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setCoverBusy(true)
      setError(null)
      try {
        const { url } = await api.uploadImage(token, file)
        setCoverImageUrl(url)
      } catch {
        setError(copy.editor.coverImageError)
      } finally {
        setCoverBusy(false)
      }
    }
    input.click()
  }

  const insertUploadedImage = useCallback(
    async (file: File, cursorPos: number) => {
      if (!token) return
      try {
        const { url } = await api.uploadImage(token, file)
        const current = contentRef.current
        const insertion = `![](${url})`
        setContent(current.slice(0, cursorPos) + insertion + current.slice(cursorPos))
      } catch {
        // A dropped/pasted image that fails to upload just doesn't get
        // inserted — the admin still has the toolbar button to retry.
      }
    },
    [token],
  )

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'))
    if (!file) return
    e.preventDefault()
    void insertUploadedImage(file, e.currentTarget.selectionStart ?? contentRef.current.length)
  }

  function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.dataTransfer?.files ?? []).find((f) => f.type.startsWith('image/'))
    if (!file) return
    e.preventDefault()
    void insertUploadedImage(file, e.currentTarget.selectionStart ?? contentRef.current.length)
  }

  // View-mode toggle icons (edit / split / preview-only) are in the
  // "extra" toolbar group and ship with the library's default GitHub-style
  // glyphs, which don't match lucide-react's icon set used everywhere else
  // in the panel — re-skin just those three, visual-only.
  const viewModeIcons: Record<string, ReactElement> = {
    edit: <Pencil size={12} />,
    live: <Columns2 size={12} />,
    preview: <Eye size={12} />,
  }

  // Swap the toolbar's default "image" button (which just inserts
  // placeholder syntax) for one that opens a file picker and uploads
  // through our own API, matching the paste/drop behavior above.
  const commandsFilter = useCallback(
    (command: ICommand, isExtra: boolean): ICommand | false => {
      if (isExtra) {
        const icon = command.name ? viewModeIcons[command.name] : undefined
        return icon ? { ...command, icon } : command
      }
      if (command.keyCommand !== 'image' || !token) return command
      return {
        ...command,
        icon: <ImagePlus size={12} />,
        execute: (_state, textApi) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return
            try {
              const { url } = await api.uploadImage(token, file)
              textApi.replaceSelection(`![](${url})`)
            } catch {
              // Same as paste/drop: fail silently, toolbar button stays usable.
            }
          }
          input.click()
        },
      }
    },
    [token],
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      if (isEditing && id) {
        await api.updatePost(token, id, { title, slug, excerpt, content, coverImageUrl, published })
      } else {
        await api.createPost(token, { title, slug, excerpt, content, coverImageUrl, published })
      }
      navigate('/admin/posts')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.editor.saveError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-ink-dim">{copy.common.loading}</p>

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">{isEditing ? copy.editor.editPostHeading : copy.editor.newPostHeading}</h1>

      <div>
        <label className="mb-1 block text-sm text-ink-dim" htmlFor="title">
          {copy.editor.titleLabel}
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
          {copy.editor.slugLabel}
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
          {copy.editor.excerptLabel}
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
        <span className="mb-1 block text-sm text-ink-dim">{copy.editor.coverImageLabel}</span>
        {coverImageUrl ? (
          <div className="flex flex-col gap-2">
            <img
              src={coverImageUrl}
              alt=""
              className="aspect-[16/9] w-full max-w-md rounded-md border border-line object-cover"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={pickCover}
                disabled={coverBusy}
                className="rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent-dim disabled:opacity-50"
              >
                {coverBusy ? copy.editor.coverImageUploading : copy.editor.coverImageReplace}
              </button>
              <button
                type="button"
                onClick={() => setCoverImageUrl(null)}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-dim transition-colors hover:text-ink"
              >
                {copy.editor.coverImageRemove}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={pickCover}
            disabled={coverBusy}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent-dim disabled:opacity-50"
          >
            <ImagePlus size={14} />
            {coverBusy ? copy.editor.coverImageUploading : copy.editor.coverImageUpload}
          </button>
        )}
      </div>

      <div data-color-mode="dark">
        <span className="mb-1 block text-sm text-ink-dim">{copy.editor.contentLabel}</span>
        <MDEditor
          value={content}
          onChange={(value) => setContent(value ?? '')}
          preview="live"
          height={320}
          commandsFilter={commandsFilter}
          textareaProps={{
            placeholder: copy.editor.markdownPlaceholder,
            onPaste: handlePaste,
            onDrop: handleDrop,
          }}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="size-4 accent-[var(--color-accent)]"
        />
        {copy.editor.publishedLabel}
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? copy.editor.saving : copy.editor.save}
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/posts')}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:text-ink"
        >
          <X size={14} />
          {copy.editor.cancel}
        </button>
      </div>
    </form>
  )
}
