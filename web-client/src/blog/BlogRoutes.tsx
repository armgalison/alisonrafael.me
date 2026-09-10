import { Route, Routes } from 'react-router-dom'
import { BlogListPage } from './pages/BlogListPage'
import { BlogPostPage } from './pages/BlogPostPage'

// Lazy-loaded as a whole from App.tsx (ADR 0005) — keeps react-markdown and
// the Blog reading UI's own components out of the public resume page's
// main bundle; they only load once a visitor actually navigates to /blog*.
export default function BlogRoutes() {
  return (
    <Routes>
      <Route index element={<BlogListPage />} />
      <Route path=":slug" element={<BlogPostPage />} />
    </Routes>
  )
}
