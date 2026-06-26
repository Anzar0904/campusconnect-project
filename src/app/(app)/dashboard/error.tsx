'use client'
import { AlertCircle } from 'lucide-react'


import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle className="text-red-400" size={40} />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="font-display text-2xl font-bold text-zinc-50 tracking-tight">Something went wrong</h2>
        <p className="text-zinc-400 font-body text-sm leading-relaxed">
          An unexpected error occurred while loading this section. Our team has been notified.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="btn-premium px-8 py-2.5"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="btn-ghost-pro px-6 py-2.5"
        >
          Return Home
        </button>
      </div>
      
      {error.digest && (
        <p className="text-[10px] font-mono text-zinc-600 mt-8">Error ID: {error.digest}</p>
      )}
    </div>
  )
}
