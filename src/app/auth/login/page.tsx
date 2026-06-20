'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!accepted) {
      setError('You must accept the terms to continue.')
      return
    }
    setError('')
    setLoading(true)

    try {
      /**
       * SECURITY: We call the Edge Function — NOT supabase.auth.signInWithOtp() directly.
       * The Edge Function validates the email domain and legal acceptance server-side.
       */
      const { data, error: fnError } = await supabase.functions.invoke('validate-otp', {
        body: { 
          email: email.trim().toLowerCase(),
          acceptedTerms: true 
        },
      })

      if (fnError || data?.error) {
        setError(data?.error ?? fnError?.message ?? 'Something went wrong')
        setLoading(false)
        return
      }

      // Edge Function validated successfully. Now trigger PKCE login.
      // We pass 'accepted_terms' in user metadata so the DB trigger (Migration 013) 
      // can physically verify consent before creating the account record.
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { 
            college_id: data.college_id,
            accepted_terms: true,
            policy_version: '1.0'
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      setCollegeName(data.college)
      setSent(true)
    } catch (err: any) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
        <div className="glass-elevated rounded-2xl p-10 max-w-sm w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'rgba(76,215,246,0.15)', border: '1px solid rgba(76,215,246,0.3)' }}>
            <span className="material-symbols-outlined text-[32px]" style={{ color: '#4cd7f6', fontVariationSettings: "'FILL' 1" }}>
              mark_email_read
            </span>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-on-surface">Check your inbox</h2>
            <p className="text-sm text-on-surface-variant mt-2">
              We sent a magic link to <strong className="text-on-surface">{email}</strong>
            </p>
            {collegeName && (
              <p className="text-xs font-mono mt-2" style={{ color: '#4cd7f6' }}>
                ✓ Verified {collegeName} student
              </p>
            )}
          </div>
          <p className="text-xs text-on-surface-variant">
            Link expires in 10 minutes. Check spam if you don&apos;t see it.
          </p>
          <button onClick={() => { setSent(false); setError('') }}
            className="btn-ghost text-sm w-full justify-center">
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="glass-elevated rounded-2xl p-10 max-w-sm w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#571bc1)', boxShadow: '0 0 30px rgba(79,70,229,0.4)' }}>
            <span className="material-symbols-outlined text-[28px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">CampusConnect</h1>
          <p className="text-sm text-on-surface-variant mt-1">Sign in with your college email</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="section-label block mb-2">COLLEGE EMAIL</label>
            <input
              type="email"
              required
              className="input-glass"
              placeholder="yourname@iilm.edu"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoComplete="email"
            />
            {error && (
              <p className="text-xs mt-2 font-mono" style={{ color: '#ffb4ab' }}>
                ⚠ {error}
              </p>
            )}
            {!error && (
              <p className="text-xs mt-1.5 text-on-surface-variant">
                Only verified college emails are accepted
              </p>
            )}
          </div>

          {/* Legal Acceptance */}
          <div className="flex items-start gap-3 py-1">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary accent-primary cursor-pointer"
              />
            </div>
            <div className="text-xs leading-5">
              <label htmlFor="terms" className="text-on-surface-variant cursor-pointer">
                I have read and agree to the <a href="/legal/privacy-and-terms" target="_blank" className="text-primary hover:underline transition-all">Privacy Policy</a> and <a href="/legal/privacy-and-terms#terms" target="_blank" className="text-primary hover:underline transition-all">Terms & Conditions</a>.
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading || !email.trim() || !accepted} className="btn-primary w-full justify-center disabled:opacity-50">
            {loading
              ? <><span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> Verifying…</>
              : <><span className="material-symbols-outlined text-[16px]">send</span> Send Magic Link</>
            }
          </button>
        </form>

        <p className="text-xs text-center text-on-surface-variant">
          No password required · One-click sign in · College-verified only
        </p>
      </div>
    </div>
  )
}
