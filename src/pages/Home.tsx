import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllBooks, type Book, type BookStatus } from '../lib/db'
import BookCard from '../components/BookCard'

const TABS: { key: BookStatus; label: string }[] = [
  { key: 'wantToRead', label: '読みたい' },
  { key: 'tsundoku', label: '積読' },
  { key: 'reading', label: '読んでいる' },
  { key: 'finished', label: '読了' },
]

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [tab, setTab] = useState<BookStatus>('tsundoku')

  useEffect(() => {
    getAllBooks().then(setBooks)
  }, [])

  const filtered = books.filter((b) => b.status === tab)

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3">
        <h1 className="text-lg font-bold text-neutral-900">読書リスト</h1>
      </header>

      <nav className="flex bg-white border-b border-neutral-200 sticky top-[49px] z-10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-neutral-500 border-b-2 border-transparent'
            }`}
          >
            {t.label} ({books.filter((b) => b.status === t.key).length})
          </button>
        ))}
      </nav>

      <main className="p-4 grid grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-neutral-400 mt-12">まだ本がありません</p>
        )}
        {filtered.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </main>

      <Link
        to="/add"
        aria-label="本を追加"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white text-3xl leading-none flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        +
      </Link>
    </div>
  )
}
