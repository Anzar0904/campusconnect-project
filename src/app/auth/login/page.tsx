'use client'
import { MailCheck, Network, RefreshCw, Send, Shield, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

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
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="card-elevated rounded-2xl p-10 max-w-sm w-full text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.15))', border: '1px solid rgba(34,211,238,0.25)' }}>
            <MailCheck style={{ color: '#22d3ee' }} size={32} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Check your inbox</h2>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              We sent a magic link to{' '}
              <strong className="text-white font-semibold">{email}</strong>
            </p>
            {collegeName && (
              <p className="text-xs font-mono mt-3 text-emerald-400">
                ✓ Verified {collegeName} student
              </p>
            )}
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Link expires in 10 minutes. Check spam if you don&apos;t see it.
          </p>
          <button
            onClick={() => { setSent(false); setError('') }}
            className="btn-ghost-pro text-sm w-full justify-center"
          >
            Use a different email
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="card-elevated rounded-2xl p-8 sm:p-10 max-w-sm w-full space-y-7"
      >
        {/* Logo + Brand */}
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(99,102,241,0.15)' }}>
              <Network className="text-white" size={30} />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
              <Shield size={10} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              CampusConnect
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Your campus. Connected.</p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-3">
          <span className="chip chip-success text-[10px]">
            <Shield size={9} /> College-verified
          </span>
          <span className="chip chip-primary text-[10px]">
            <Sparkles size={9} /> No password
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="section-label block mb-2">COLLEGE EMAIL</label>
            <input
              type="email"
              required
              id="email"
              name="email"
              className="input-pro"
              placeholder="yourname@college.edu"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoComplete="email"
              autoFocus
            />
            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs mt-2 font-medium text-red-400 flex items-center gap-1.5"
                >
                  ⚠ {error}
                </motion.p>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs mt-1.5 text-zinc-500"
                >
                  Only verified college emails are accepted
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Legal Acceptance */}
          <div className="flex items-start gap-3 py-1">
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-brand-500 focus:ring-brand-500/40 accent-brand-500 cursor-pointer"
              />
            </div>
            <label htmlFor="terms" className="text-xs leading-5 text-zinc-400 cursor-pointer">
              I agree to the{' '}
              <a href="/legal/privacy-and-terms" target="_blank" className="text-brand-400 hover:text-brand-300 transition-colors hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/legal/privacy-and-terms#terms" target="_blank" className="text-brand-400 hover:text-brand-300 transition-colors hover:underline">
                Terms &amp; Conditions
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !accepted}
            id="send-magic-link"
            className="btn-premium w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={15} />
                Verifying…
              </>
            ) : (
              <>
                <Send size={15} />
                Send Magic Link
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-zinc-500 leading-relaxed">
          No password required · One-click sign in · College-verified only
        </p>
      </motion.div>
    </div>
  )
}
