import { get, set } from 'idb-keyval'

export type BookStatus = 'wantToRead' | 'tsundoku' | 'reading' | 'finished'

export interface Book {
  id: string
  title: string
  author: string
  status: BookStatus
  coverImage: string
  notes?: string
  recordDate: string
  createdAt: number
  updatedAt: number
}

// Formats a Date as YYYY-MM-DD in the local timezone (not UTC, so it matches
// the user's actual calendar day near midnight).
export function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayDateString(): string {
  return formatDateString(new Date())
}

const BOOKS_KEY = 'books'

// crypto.randomUUID() requires a secure context (HTTPS/localhost) and is
// unavailable when accessing the dev server over plain http via a LAN IP.
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function getAllBooks(): Promise<Book[]> {
  const books = await get<Book[]>(BOOKS_KEY)
  return books ?? []
}

async function saveAllBooks(books: Book[]): Promise<void> {
  await set(BOOKS_KEY, books)
}

export async function addBook(book: Book): Promise<void> {
  const books = await getAllBooks()
  books.unshift(book)
  await saveAllBooks(books)
}

export async function updateBook(id: string, updates: Partial<Omit<Book, 'id'>>): Promise<void> {
  const books = await getAllBooks()
  const index = books.findIndex((b) => b.id === id)
  if (index === -1) return
  books[index] = { ...books[index], ...updates, updatedAt: Date.now() }
  await saveAllBooks(books)
}

export async function deleteBook(id: string): Promise<void> {
  const books = await getAllBooks()
  await saveAllBooks(books.filter((b) => b.id !== id))
}
