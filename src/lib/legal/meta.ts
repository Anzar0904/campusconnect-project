import { LegalMeta } from './types'

// Front matter shared by both documents — transcribed exactly as it
// appears at the top of the source file provided by IILM University.
export const LEGAL_META: LegalMeta = {
  effectiveDate: '8 June 2026',
  version: '1.0',
  lastUpdated: '8 June 2026',
  rows: [
    { label: 'Platform', value: 'IILM Connect — Campus Social & Utility App' },
    { label: 'Operated by', value: 'IILM University, Gurugram, Haryana, India' },
    { label: 'Contact', value: 'connect@iilm.edu' },
    { label: 'Scope', value: 'All students, faculty, and staff with an @iilm.edu email address' },
  ],
}
