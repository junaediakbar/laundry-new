import { PageHeader } from "@/components/shared/page-header"
import { WhatsAppTestForm } from "@/components/whatsapp/whatsapp-test-form"

export default function WhatsAppAdminPage() {
  return (
    <div>
      <PageHeader title="WhatsApp Notifications" description="Admin tools untuk testing template messages." />
      <WhatsAppTestForm />
    </div>
  )
}
