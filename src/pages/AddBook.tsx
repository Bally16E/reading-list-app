import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addBook, generateId, type Book, type BookStatus } from '../lib/db'

const STATUSES: { key: BookStatus; label: string }[] = [
  { key: 'tsundoku', label: '積読' },
  { key: 'reading', label: '読んでいる' },
  { key: 'finished', label: '読了' },
]

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    img.src = src
  })
}

// iPhoneのカメラ写真は数MBあり、Base64のまま保存すると容量超過で失敗しやすいため縮小する
async function resizeImage(file: File, maxSize = 1000, quality = 0.8): Promise<string> {
  const original = await readFileAsDataUrl(file)
  const img = await loadImage(original)
  let { width, height } = img
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = Math.round((height * maxSize) / width)
      width = maxSize
    } else {
      width = Math.round((width * maxSize) / height)
      height = maxSize
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return original
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

async function recognizeCover(imageDataUrl: string): Promise<{ title: string; author: string } | null> {
  try {
    const res = await fetch('/api/recognize-cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default function AddBook() {
  const navigate = useNavigate()
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState<BookStatus>('tsundoku')
  const [saving, setSaving] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setError('')
    try {
      const dataUrl = await resizeImage(f)
      setImageDataUrl(dataUrl)
      setRecognizing(true)
      const result = await recognizeCover(dataUrl)
      if (result) {
        setTitle((current) => current || result.title)
        setAuthor((current) => current || result.author)
      }
    } catch (err) {
      console.error(err)
      setError('画像の読み込みに失敗しました。もう一度お試しください。')
    } finally {
      setRecognizing(false)
    }
  }

  const handleSave = async () => {
    if (!imageDataUrl) return
    setSaving(true)
    setError('')
    try {
      const book: Book = {
        id: generateId(),
        title: title.trim(),
        author: author.trim(),
        status,
        coverImage: imageDataUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await addBook(book)
      navigate('/')
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error ? err.message : String(err)
      setError(`保存に失敗しました(${detail})。もう一度お試しください。`)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-xl text-neutral-700" aria-label="戻る">
          ←
        </button>
        <h1 className="text-lg font-bold text-neutral-900">本を追加</h1>
      </header>

      <main className="p-4 space-y-5">
        <label className="block cursor-pointer">
          <div className="aspect-[3/4] max-w-[200px] mx-auto bg-neutral-200 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-neutral-300">
            {imageDataUrl ? (
              <img src={imageDataUrl} alt="表紙プレビュー" className="w-full h-full object-cover" />
            ) : (
              <span className="text-neutral-400 text-sm px-4 text-center">タップして表紙を撮影</span>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">タイトル</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="未入力(表紙から自動入力されます)"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
          />
          {recognizing && <p className="mt-1 text-xs text-neutral-500">AIが表紙を読み取っています...</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">著者</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="未入力"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">ステータス</label>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  status === s.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-neutral-300 text-neutral-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!imageDataUrl || saving}
          className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40"
        >
          {saving ? '保存中...' : '登録する'}
        </button>
      </main>
    </div>
  )
}
