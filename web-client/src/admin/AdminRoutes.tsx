import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { AuthProvider } from './AuthContext'
import { LoginPage } from './pages/LoginPage'
import { PostEditorPage } from './pages/PostEditorPage'
import { PostListPage } from './pages/PostListPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProtectedRoute } from './ProtectedRoute'

// Lazy-loaded as a whole from App.tsx (ADR 0005) — keep everything the
// Admin Panel needs, including MDXEditor, reachable only from here so it
// never ships in the public resume page's bundle.
export default function AdminRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="posts" replace />} />
            <Route path="posts" element={<PostListPage />} />
            <Route path="posts/new" element={<PostEditorPage />} />
            <Route path="posts/:id" element={<PostEditorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
