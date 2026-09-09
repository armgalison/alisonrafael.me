import { Route, Routes } from 'react-router-dom'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResumePage } from './pages/ResumePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ResumePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
