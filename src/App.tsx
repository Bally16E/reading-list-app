import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AddBook from './pages/AddBook'
import BookDetail from './pages/BookDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddBook />} />
        <Route path="/book/:id" element={<BookDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
