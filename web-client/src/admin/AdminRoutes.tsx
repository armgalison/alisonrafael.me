import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { AuthProvider } from './AuthContext'
import { CommentsPage } from './pages/CommentsPage'
import { LoginPage } from './pages/LoginPage'
import { PostEditorPage } from './pages/PostEditorPage'
import { PostListPage } from './pages/PostListPage'
import { SettingsPage } from './pages/SettingsPage'
import { TrendsPage } from './pages/TrendsPage'
import { PendingCommentsProvider } from './PendingCommentsContext'
import { ProtectedRoute } from './ProtectedRoute'

// Lazy-loaded as a whole from App.tsx (ADR 0005) — keep everything the
// Admin Panel needs, including @uiw/react-md-editor, reachable only from
// here so it never ships in the public resume page's bundle.
export default function AdminRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <PendingCommentsProvider>
                <AdminLayout />
              </PendingCommentsProvider>
            }
          >
            <Route index element={<Navigate to="posts" replace />} />
            <Route path="posts" element={<PostListPage />} />
            <Route path="posts/new" element={<PostEditorPage />} />
            <Route path="posts/:id" element={<PostEditorPage />} />
            <Route path="comments" element={<CommentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="trends" element={<TrendsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
