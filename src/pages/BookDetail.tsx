import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAllBooks, updateBook, deleteBook, type Book, type BookStatus } from '../lib/db'

const STATUSES: { key: BookStatus; label: string }[] = [
  { key: 'tsundoku', label: '積読' },
  { key: 'reading', label: '読んでいる' },
  { key: 'finished', label: '読了' },
]

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    getAllBooks().then((books) => {
      const found = books.find((b) => b.id === id) ?? null
      if (!found) {
        setNotFound(true)
        return
      }
      setBook(found)
      setTitle(found.title)
      setAuthor(found.author)
      setNotes(found.notes ?? '')
    })
  }, [id])

  if (notFound) return <div className="p-4 text-neutral-500">本が見つかりませんでした</div>
  if (!book) return <div className="p-4 text-neutral-500">読み込み中...</div>

  const handleStatusChange = async (status: BookStatus) => {
    const previous = book.status
    setBook({ ...book, status })
    try {
      await updateBook(book.id, { status })
    } catch (err) {
      console.error(err)
      setBook({ ...book, status: previous })
      setError('ステータスの更新に失敗しました。')
    }
  }

  const handleSaveText = async (showConfirmation = false) => {
    if (showConfirmation) setSaving(true)
    setError('')
    try {
      await updateBook(book.id, { title: title.trim(), author: author.trim(), notes })
      if (showConfirmation) {
        setSavedMessage(true)
        setTimeout(() => setSavedMessage(false), 2000)
      }
    } catch (err) {
      console.error(err)
      setError('保存に失敗しました。')
    } finally {
      if (showConfirmation) setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('この本を削除しますか?')) return
    try {
      await deleteBook(book.id)
      navigate('/')
    } catch (err) {
      console.error(err)
      setError('削除に失敗しました。')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-xl text-neutral-700" aria-label="戻る">
          ←
        </button>
        <h1 className="text-lg font-bold text-neutral-900">本の詳細</h1>
      </header>

      <main className="p-4 space-y-5">
        <div className="aspect-[3/4] max-w-[200px] mx-auto bg-neutral-200 rounded-lg overflow-hidden">
          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">タイトル</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleSaveText()}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">著者</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onBlur={() => handleSaveText()}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">感想</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => handleSaveText()}
            rows={5}
            placeholder="感想を入力(キーボードのマイクボタンで音声入力もできます)"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">ステータス</label>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() => handleStatusChange(s.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  book.status === s.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-neutral-300 text-neutral-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => handleSaveText(true)}
            disabled={saving}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
          {savedMessage && <p className="mt-2 text-sm text-green-600 text-center">保存しました</p>}
        </div>

        <button
          onClick={handleDelete}
          className="w-full py-3 rounded-lg border border-red-500 text-red-500 font-medium"
        >
          削除する
        </button>
      </main>
    </div>
  )
}
