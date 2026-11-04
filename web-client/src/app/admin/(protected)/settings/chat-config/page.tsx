import { Gate } from '../../Gate'
import { ChatConfigPage } from '../../../../../admin/pages/ChatConfigPage'

export const metadata = { title: 'Chat Config' }

export default function Page() {
  return (
    <Gate>
      <ChatConfigPage />
    </Gate>
  )
}
