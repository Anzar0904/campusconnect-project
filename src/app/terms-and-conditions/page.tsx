import { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { TERMS_AND_CONDITIONS } from '@/lib/legal/terms-and-conditions'
import { LEGAL_META } from '@/lib/legal/meta'

export const metadata: Metadata = {
  title: 'Terms and Conditions · IILM Connect',
  description: 'The terms that govern your use of the IILM Connect platform.',
}

export default function TermsAndConditionsPage() {
  return <LegalPage document={TERMS_AND_CONDITIONS} meta={LEGAL_META} logoId="terms-and-conditions" />
}
