'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DatingVerificationPage() {
  const supabase = createClient()

const [fullName, setFullName] = useState('')
const [branch, setBranch] = useState('')
const [year, setYear] = useState('')
const [rollNumber, setRollNumber] = useState('')
const [file, setFile] = useState<File | null>(null)
const [loading, setLoading] = useState(false)

const handleSubmit = async (
  e: React.FormEvent
) => {
  e.preventDefault()

  if (!file) {
    alert('Please upload ID card')
    return
  }

  setLoading(true)

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not logged in')
    }

    const filePath = `${user.id}/${Date.now()}-${file.name}`

    const { error: uploadError } =
      await supabase.storage
        .from('dating-verification')
        .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    

const { data: profile } = await supabase
  .from('profiles')
  .select('college_id')
  .eq('id', user.id)
  .single()

    const result = await (supabase as any)
  .from('dating_verification_requests')
  .insert({
    user_id: user.id,
    college_id: profile?.college_id,
    full_name: fullName,
    email: user.email ?? '',
    branch,
    year,
    roll_number: rollNumber,
    id_card_url: filePath,
    status: 'pending',
  })

console.log(result)

if (result.error) {
  throw result.error
}

    alert(
      'Verification request submitted successfully'
    )
  } catch (error: any) {
  console.error(error)

  alert(
    error?.message ||
    JSON.stringify(error) ||
    'Submission failed'
  )
}

  setLoading(false)
}
  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">
          Dating Verification
        </h1>

        <p className="text-on-surface-variant mb-6">
          Submit your student details for approval.
        </p>

        <form
  onSubmit={handleSubmit}
  className="space-y-4"
>
          <input
  value={fullName}
  onChange={(e) =>
    setFullName(e.target.value)
  }
  placeholder="Full Name"
  className="w-full p-3 rounded-xl"
/>

          <input
  value={branch}
  onChange={(e) =>
    setBranch(e.target.value)
  }
  placeholder="Branch"
  className="w-full p-3 rounded-xl"
/>

          <input
  value={year}
  onChange={(e) =>
    setYear(e.target.value)
  }
  placeholder="Year"
  className="w-full p-3 rounded-xl"
/>

          <input
  value={rollNumber}
  onChange={(e) =>
    setRollNumber(e.target.value)
  }
  placeholder="Roll Number"
  className="w-full p-3 rounded-xl"
/>

         <input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setFile(
      e.target.files?.[0] ?? null
    )
  }
/>

          <button
  type="submit"
  disabled={loading}
  className="btn-primary w-full"
>
  {loading
    ? 'Submitting...'
    : 'Submit Verification'}
</button>
        </form>
      </div>
    </div>
  )
}
