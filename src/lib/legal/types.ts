// Structured content model for legal documents.
// Kept deliberately plain (paragraph / list / table) so the exact wording
// supplied by IILM University can be transcribed without any rewriting,
// summarising, or reformatting of the underlying text.

export interface LegalTableRow {
  label: string
  value: string
}

export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; rows: LegalTableRow[] }

export interface LegalSubsection {
  id: string
  heading: string
  blocks: LegalBlock[]
}

export interface LegalSection {
  id: string
  number: string
  heading: string
  blocks?: LegalBlock[]
  subsections?: LegalSubsection[]
}

export interface LegalDocument {
  /** e.g. "PART A — PRIVACY POLICY" */
  partLabel: string
  /** Short page title, e.g. "Privacy Policy" */
  title: string
  intro: LegalBlock[]
  sections: LegalSection[]
}

export interface LegalMeta {
  effectiveDate: string
  version: string
  lastUpdated: string
  rows: LegalTableRow[]
}
