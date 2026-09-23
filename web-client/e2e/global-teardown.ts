import { API_URL } from './support'

export default async function globalTeardown() {
  const { E2E_POST_ID: id, E2E_ADMIN_TOKEN: token } = process.env
  if (!id || !token) return
  await fetch(`${API_URL}/posts/admin/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
