import { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { PRIVACY_POLICY } from '@/lib/legal/privacy-policy'
import { LEGAL_META } from '@/lib/legal/meta'

export const metadata: Metadata = {
  title: 'Privacy Policy · IILM Connect',
  description: 'How IILM Connect collects, uses, stores, shares, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return <LegalPage document={PRIVACY_POLICY} meta={LEGAL_META} logoId="privacy-policy" />
}
