import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResumePage } from './pages/ResumePage'

// Lazy so the Admin Panel (and its markdown editor dependency) never ships
// in the public resume page's JS bundle — see ADR 0005.
const AdminRoutes = lazy(() => import('./admin/AdminRoutes'))

// Same reasoning for the Blog reading UI: react-markdown and the blog
// components should only load once a visitor navigates to /blog*, not as
// part of the resume page's main bundle.
const BlogRoutes = lazy(() => import('./blog/BlogRoutes'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ResumePage />} />
      <Route
        path="/blog/*"
        element={
          <Suspense fallback={null}>
            <BlogRoutes />
          </Suspense>
        }
      />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={null}>
            <AdminRoutes />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
