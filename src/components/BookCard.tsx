import { Link } from 'react-router-dom'
import type { Book } from '../lib/db'

export default function BookCard({ book }: { book: Book }) {
  return (
    <Link to={`/book/${book.id}`} className="block">
      <div className="aspect-[3/4] bg-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
      </div>
      <p className="mt-1 text-sm font-medium truncate text-neutral-900">
        {book.title || '(タイトル未設定)'}
      </p>
      <p className="text-xs text-neutral-500 truncate">{book.author}</p>
    </Link>
  )
}
