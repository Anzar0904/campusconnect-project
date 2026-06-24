'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function DatingVerificationPage() {
  const supabase = createClient()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('Please upload ID card'); return }
    if (!fullName.trim()) { toast.error('Enter your full name'); return }
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Check for existing pending request
      const { data: existing } = await supabase
        .from('dating_verification_requests')
        .select('id, status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved'])
        .maybeSingle()

      if (existing?.status === 'approved') {
        toast.success('You are already verified!')
        router.push('/dating')
        return
      }
      if (existing?.status === 'pending') {
        toast('Your verification request is already pending review.')
        setSubmitted(true)
        setLoading(false)
        return
      }

      const filePath = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('dating-verification')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: profile } = await supabase
        .from('profiles')
        .select('college_id')
        .eq('id', user.id)
        .single()

      const { error: insertError } = await (supabase as any)
        .from('dating_verification_requests')
        .insert({
          user_id: user.id,
          college_id: profile?.college_id,
          full_name: fullName.trim(),
          email: user.email ?? '',
          branch: branch.trim(),
          year: year.trim(),
          roll_number: rollNumber.trim(),
          id_card_url: filePath,
          status: 'pending',
        })
      if (insertError) throw insertError

      toast.success('Verification submitted! You will be notified once approved.')
      setSubmitted(true)
    } catch (error: any) {
      toast.error(error?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-2xl font-bold text-white">Request Submitted</h1>
          <p className="text-zinc-400">Your verification is under review. You will be notified once approved.</p>
          <button onClick={() => router.push('/dating')} className="btn-premium px-8 py-3">
            Back to Dating
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Dating Verification</h1>
        <p className="text-zinc-400 mb-6">Submit your student details for approval.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Full Name"
            required
            className="input-pro w-full"
          />
          <input
            value={branch}
            onChange={e => setBranch(e.target.value)}
            placeholder="Branch / Programme"
            className="input-pro w-full"
          />
          <input
            value={year}
            onChange={e => setYear(e.target.value)}
            placeholder="Year (e.g. 2)"
            className="input-pro w-full"
          />
          <input
            value={rollNumber}
            onChange={e => setRollNumber(e.target.value)}
            placeholder="Roll Number"
            className="input-pro w-full"
          />
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Student ID Card *</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              required
              className="input-pro w-full text-sm"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-premium w-full py-3 justify-center">
            {loading ? 'Submitting...' : 'Submit Verification'}
          </button>
        </form>
      </div>
    </div>
  )
}
