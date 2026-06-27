'use client'
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'


import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    // Check for error forwarded from /auth/callback
    const error = params.get('error')
    if (error) {
      const messages: Record<string, string> = {
        missing_code: 'Magic link was incomplete. Please request a new one.',
        exchange_failed: 'Magic link has expired or was already used. Please request a new one.',
      }
      setErrorMsg(messages[error] ?? 'Authentication failed. Please try again.')
      setStatus('error')
      return
    }

    // Dynamically import Supabase client to avoid SSR issues
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()

      // Check if session already exists (callback already ran)
      supabase.auth.getSession().then((res: any) => {
        const session = res.data?.session
        if (session) {
          setStatus('success')
          setTimeout(() => router.replace('/dashboard'), 1200)
        }
      })

      // Also listen for the SIGNED_IN event in case callback is in-flight
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
        if (event === 'SIGNED_IN' && session) {
          setStatus('success')
          setTimeout(() => router.replace('/dashboard'), 1200)
        }
        if (event === 'SIGNED_OUT') {
          setStatus('error')
          setErrorMsg('Session could not be established. Please try again.')
        }
      })

      // Timeout guard — if nothing happens in 8 seconds, show error
      const timeout = setTimeout(() => {
        setStatus(s => s === 'loading' ? 'error' : s)
        setErrorMsg(e => e || 'Verification timed out. Please try again.')
      }, 8000)

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    })
  }, [params, router])

  return (
    <div className="text-center animate-fade-in max-w-sm w-full space-y-4">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #4cd7f6)' }}>
            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          </div>
          <p className="font-display text-lg font-semibold text-on-surface">Signing you in…</p>
          <p className="text-sm text-on-surface-variant">Verifying your magic link</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'rgba(76,215,246,0.2)', border: '1px solid rgba(76,215,246,0.4)' }}>
            <CheckCircle style={{ color: '#4cd7f6', fontVariationSettings: "'FILL' 1" }} size={36} />
          </div>
          <p className="font-display text-lg font-semibold text-on-surface">Verified! Welcome back 🎉</p>
          <p className="text-sm text-on-surface-variant">Taking you to your campus…</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'rgba(147,0,10,0.2)', border: '1px solid rgba(255,180,171,0.3)' }}>
            <AlertCircle style={{ color: '#ffb4ab' }} size={36} />
          </div>
          <p className="font-display text-lg font-semibold text-on-surface">Link invalid or expired</p>
          <p className="text-sm text-on-surface-variant px-4">
            {errorMsg || 'This magic link cannot be used. Please request a new one.'}
          </p>
          <a href="/auth/login"
            className="btn-primary inline-flex items-center gap-2 mt-2">
            <ArrowLeft size={16} />
            Back to Login
          </a>
        </>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #4cd7f6)' }}>
            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          </div>
          <p className="font-display text-lg font-semibold text-on-surface mt-4">Verifying session…</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
