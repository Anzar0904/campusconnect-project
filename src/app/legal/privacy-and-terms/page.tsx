import { Download, Scale } from 'lucide-react'
import { format } from 'date-fns'

export const metadata = { title: 'Privacy & Terms — IILM Connect' }

export default function LegalPage() {
  const lastUpdated = new Date('2026-06-13')

  const SECTIONS = [
    {
      id: 'privacy',
      title: '1. Privacy Policy',
      content: `IILM Connect is committed to protecting your personal data. We collect your university email address, name, and campus affiliation to provide a verified social experience. Your data is isolated to your specific college campus and is not shared with third-party advertisers.`
    },
    {
      id: 'terms',
      title: '2. Terms of Service',
      content: `By using IILM Connect, you agree to abide by our community standards. The platform is designed for academic and social collaboration among verified university students.`
    },
    {
      id: 'content',
      title: '3. User Generated Content',
      content: `Users remain responsible for all content they publish, upload, or distribute through the platform. IILM Connect does not claim ownership of user content but requires a license to display it within the campus network.`
    },
    {
      id: 'suspension',
      title: '4. Account Suspension',
      content: `IILM Connect reserves the right to suspend or terminate access for policy violations, security risks, or misuse of the platform. Zero tolerance is enforced for harassment, hate speech, or impersonation.`
    },
    {
      id: 'consent',
      title: '5. Electronic Consent',
      content: `By selecting the acceptance checkbox and continuing registration, users provide legally binding electronic consent to these Terms and Privacy Policy.`
    },
    {
      id: 'logging',
      title: '6. Consent Logging',
      content: `The platform maintains timestamped records of policy acceptance for compliance and audit purposes. This includes your IP address and the version of the policy accepted.`
    },
    {
      id: 'updates',
      title: '7. Policy Updates',
      content: `Material policy updates may require renewed user consent before continued platform access. Material changes will be communicated via the platform dashboard.`
    }
  ]

  return (
    <div className="min-h-screen bg-surface text-on-surface p-6 md:p-12 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="space-y-4 border-b border-white/[0.06] pb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Scale className="text-white" size={18} />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Legal & Compliance</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-on-surface-variant">
            <span>Version: 1.0</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Last Updated: {format(lastUpdated, 'MMMM d, yyyy')}</span>
          </div>
        </header>

        {/* Table of Contents */}
        <nav className="glass-card rounded-2xl p-6 space-y-3 border border-white/[0.04]">
          <p className="section-label mb-4">TABLE OF CONTENTS</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="space-y-12">
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} className="scroll-mt-12 space-y-4">
              <h2 className="font-display text-xl font-bold text-on-surface flex items-center gap-3">
                {s.title}
              </h2>
              <p className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-wrap">
                {s.content}
              </p>
            </section>
          ))}
        </main>

        {/* Footer */}
        <footer className="pt-12 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-6 pb-20">
          <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest">
            © 2026 IILM Connect · Unified University Network
          </p>
          <button className="btn-ghost text-xs flex items-center gap-2">
            <Download size={16} />
            Download PDF
          </button>
        </footer>
      </div>
    </div>
  )
}
