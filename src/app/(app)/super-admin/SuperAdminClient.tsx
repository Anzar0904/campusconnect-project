'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function SuperAdminClient({ userId, ownerEmail }: { userId: string, ownerEmail: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [activeTab, setActiveTab] = useState<
  'overview'|'users'|'colleges'|'admins'|'moderation'|'dating'|'audit'
>('overview')

  // Data states
  const [metrics, setMetrics] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [colleges, setColleges] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [datingRequests, setDatingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch High-Level Metrics
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: verifiedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true)
      const { count: collegeCount } = await supabase.from('colleges').select('*', { count: 'exact', head: true })
      const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      const { count: reportCount } = await supabase.from('abuse_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')

      setMetrics({
        totalUsers: userCount || 0,
        verifiedUsers: verifiedCount || 0,
        totalColleges: collegeCount || 0,
        totalPosts: postCount || 0,
        pendingReports: reportCount || 0
      })

      // 2. Fetch Detailed Data
      const { data: userData } = await supabase.from('profiles').select('id, full_name, email, role, is_verified, is_suspended, accepted_terms_at, created_at, colleges(name)').order('created_at', { ascending: false }).limit(50)
      const { data: collegeData } = await supabase.from('colleges').select('*').order('name')
      const { data: logData } = await supabase.from('role_audit_logs').select('*, changed_by:profiles!role_audit_logs_changed_by_fkey(full_name), target_user:profiles!role_audit_logs_target_user_fkey(full_name)').order('created_at', { ascending: false }).limit(30)
      const { data: reportData } = await supabase.from('abuse_reports').select('*, reporter:profiles!abuse_reports_reporter_id_fkey(full_name)').order('created_at', { ascending: false }).limit(30)
      const { data: inviteData } = await supabase.from('admin_invitations').select('*, inviter:profiles!admin_invitations_invited_by_fkey(full_name), college:colleges(name)').order('created_at', { ascending: false })

      const { data: datingRequests } = await supabase
  .from('dating_verification_requests')
  .select('*')
  .eq('status', 'pending')

      setUsers(userData || [])
      setColleges(collegeData || [])
      setLogs(logData || [])
      setReports(reportData || [])
      setInvites(inviteData || [])
      setDatingRequests(datingRequests || [])

    } catch (err) {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- ACTIONS ---

  async function handleVerifyUser(targetId: string, verify: boolean) {
   const { error } = await (supabase as any)
  .from('profiles')
  .update({
    is_verified: verify
  })
  .eq('id', targetId)
  }

  async function handleSuspendUser(targetId: string, suspend: boolean) {
    if (!confirm(`Are you sure you want to ${suspend ? 'suspend' : 'reactivate'} this user?`)) return
    const { error } = await (supabase as any)
  .from('profiles')
  .update({
    is_suspended: suspend
  })
  .eq('id', targetId)
    if (error) { toast.error(error.message); return }
    toast.success(suspend ? 'User suspended' : 'User reactivated')
    fetchData()
  }

  async function handleUpdateRole(targetId: string, newRole: string) {
    if (!confirm(`Are you sure you want to promote this user to ${newRole}?`)) return
    const { error } = await (supabase as any)
  .from('profiles')
  .update({
    role: newRole
  })
  .eq('id', targetId)
    if (error) { toast.error(error.message); return }
    toast.success('Role updated successfully')
    fetchData()
  }

  async function handleToggleCollege(id: string, currentStatus: boolean) {
    const { error } = await (supabase as any)
  .from('colleges')
  .update({
    is_active: !currentStatus
  })
  .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(!currentStatus ? 'College activated' : 'College disabled')
    fetchData()
  }

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'COLLEGE_ADMIN', college_id: '' })
  const [collegeForm, setCollegeForm] = useState({ name: '', city: '', email_domain: '' })
  const [searchQuery, setSearchQuery] = useState('')

  async function handleInviteAdmin() {
    if (!inviteForm.email) return toast.error('Email is required')
    const { error } = await (supabase as any)
  .from('admin_invitations')
  .insert({
      email: inviteForm.email,
      role: inviteForm.role,
      college_id: inviteForm.role === 'COLLEGE_ADMIN' ? inviteForm.college_id : null,
      invited_by: userId
    })
    if (error) { toast.error(error.message); return }
    toast.success('Invitation created!')
    setInviteForm({ email: '', role: 'COLLEGE_ADMIN', college_id: '' })
    fetchData()
  }

  async function handleCreateCollege() {
    if (!collegeForm.name || !collegeForm.email_domain) return toast.error('Name and domain are required')
    const { error } = await (supabase as any)
  .from('colleges')
  .insert([collegeForm])
    if (error) { toast.error(error.message); return }
    toast.success('College added!')
    setCollegeForm({ name: '', city: '', email_domain: '' })
    fetchData()
  }
  async function handleApproveDatingRequest(
  requestId: string,
  userId: string
  
) {
  const { error: profileError } = await (supabase as any)
  .from('profiles')
  .update({
    dating_verified: true
  })
  .eq('id', userId)

  if (profileError) {
    toast.error(profileError.message)
    return
  }

  const {
  data: { user }
} = await supabase.auth.getUser()

  const { error: requestError } = await supabase
    .from('dating_verification_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id
    })
    .eq('id', requestId)

  if (requestError) {
    toast.error(requestError.message)
    return
  }

  toast.success('Dating verification approved')
  fetchData()
}

  async function handleUpdateReportStatus(id: string, newStatus: string) {
    const { error } = await (supabase as any)
  .from('abuse_reports')
  .update({
    status: newStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: userId
  })
  .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Report ' + newStatus)
    fetchData()
  }

  if (loading) return <div className="p-12 text-center text-on-surface-variant animate-pulse">Loading Platform Data...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface tracking-tight">Super Admin Platform</h1>
        <p className="text-on-surface-variant font-mono mt-1 text-sm">Global infrastructure and access management</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['overview','users','colleges','admins','moderation','dating','audit'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-mono transition-all capitalize ${activeTab === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface border border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-primary">
            <h3 className="text-sm font-mono text-on-surface-variant mb-2">Total Users</h3>
            <p className="font-display text-3xl font-bold text-on-surface">{metrics.totalUsers}</p>
          </div>
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-[#86efac]">
            <h3 className="text-sm font-mono text-on-surface-variant mb-2">Verified Students</h3>
            <p className="font-display text-3xl font-bold text-on-surface">{metrics.verifiedUsers}</p>
          </div>
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-[#c3c0ff]">
            <h3 className="text-sm font-mono text-on-surface-variant mb-2">Active Colleges</h3>
            <p className="font-display text-3xl font-bold text-on-surface">{metrics.totalColleges}</p>
          </div>
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-[#fbbf24]">
            <h3 className="text-sm font-mono text-on-surface-variant mb-2">Pending Reports</h3>
            <p className="font-display text-3xl font-bold text-on-surface">{metrics.pendingReports}</p>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <input 
            className="input-glass w-full max-w-md" 
            placeholder="Search users by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-on-surface-variant font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">College</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Legal</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="font-medium text-on-surface">{u.full_name}</p>
                      <p className="text-xs text-on-surface-variant">{u.email}</p>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{u.colleges?.name || 'No College'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-mono w-fit ${u.is_verified ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-on-surface-variant'}`}>
                          {u.is_verified ? 'Verified' : 'Pending'}
                        </span>
                        {u.is_suspended && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-mono w-fit bg-red-500/20 text-red-400">
                            Suspended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.accepted_terms_at ? (
                        <span className="text-[10px] font-mono text-green-400" title={`Accepted on ${format(new Date(u.accepted_terms_at), 'PPP')}`}>
                          Accepted
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-error">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-mono ${u.role === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-400' : u.role === 'COLLEGE_ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleVerifyUser(u.id, !u.is_verified)} className="btn-ghost text-xs px-3 py-1">
                        {u.is_verified ? 'Revoke' : 'Verify'}
                      </button>
                      <button 
                        onClick={() => handleSuspendUser(u.id, !u.is_suspended)} 
                        disabled={u.email === ownerEmail}
                        className={`btn-ghost text-xs px-3 py-1 ${u.is_suspended ? 'text-green-400 hover:bg-green-400/10' : 'text-red-400 hover:bg-red-400/10'}`}
                      >
                        {u.is_suspended ? 'Reactivate' : 'Suspend'}
                      </button>
                      <select 
                        className="input-glass text-xs py-1.5 w-32"
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        disabled={u.email === ownerEmail}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="COLLEGE_ADMIN">College Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Colleges Tab */}
      {activeTab === 'colleges' && (
        <div className="space-y-6">
          <div className="glass-elevated rounded-xl p-5 border border-white/10 space-y-4">
            <h3 className="font-display font-semibold text-on-surface">Add New College</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input className="input-glass" placeholder="College Name" value={collegeForm.name} onChange={e=>setCollegeForm(p=>({...p,name:e.target.value}))} />
              <input className="input-glass" placeholder="City" value={collegeForm.city} onChange={e=>setCollegeForm(p=>({...p,city:e.target.value}))} />
              <input className="input-glass" placeholder="Domain (e.g. mit.edu)" value={collegeForm.email_domain} onChange={e=>setCollegeForm(p=>({...p,email_domain:e.target.value}))} />
            </div>
            <div className="flex justify-end">
              <button onClick={handleCreateCollege} className="btn-primary text-sm px-6">Add College</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colleges.map(c => (
            <div key={c.id} className="glass-card rounded-xl p-5 flex items-center justify-between border border-white/5">
              <div>
                <h3 className="font-display font-semibold text-on-surface">{c.name}</h3>
                <p className="text-xs text-on-surface-variant font-mono mt-1">@{c.email_domain}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-md text-[10px] font-mono ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {c.is_active ? 'Active' : 'Disabled'}
                </span>
                <button onClick={() => handleToggleCollege(c.id, c.is_active)} className="btn-ghost text-xs p-2 rounded-lg hover:bg-white/10">
                  <DynamicIcon name={c.is_active ? 'block' : 'check_circle'} size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'dating' && (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">
      Dating Verification Requests
    </h2>

    {datingRequests.length === 0 ? (
      <div className="glass-card rounded-2xl p-6">
        No pending requests
      </div>
    ) : (
      datingRequests.map((request) => (
        <div
          key={request.id}
          className="glass-card rounded-2xl p-6"
        >
          <div className="space-y-2">
            <p><strong>Name:</strong> {request.full_name}</p>
            <p><strong>Email:</strong> {request.email}</p>
            <p><strong>Branch:</strong> {request.branch}</p>
            <p><strong>Year:</strong> {request.year}</p>
            <p><strong>Roll No:</strong> {request.roll_number}</p>
            <p><strong>Status:</strong> {request.status}</p>

            <button
  onClick={() => {
    const { data } = supabase.storage
      .from('dating-verification')
      .getPublicUrl(request.id_card_url)

    window.open(data.publicUrl, '_blank')
  }}
  className="text-primary underline"
>
  View ID Card
</button>

            <div className="pt-4">
              <button
                onClick={() =>
                  handleApproveDatingRequest(
                    request.id,
                    request.user_id
                  )
                }
                className="px-4 py-2 bg-green-600 rounded-xl"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      ))
    )}
  </div>
)}
      {activeTab === 'audit' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-on-surface-variant font-mono text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Target User</th>
                  <th className="px-6 py-4">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">{format(new Date(l.created_at), 'MMM d, HH:mm')}</td>
                    <td className="px-6 py-4 text-on-surface font-medium">{l.changed_by?.full_name || 'System'}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{l.target_user?.full_name || 'Unknown'}</td>
                    <td className="px-6 py-4 font-mono text-[11px]">
                      <span className="text-error opacity-70">{l.old_role}</span>
                      <span className="mx-2 text-on-surface-variant">→</span>
                      <span className="text-success opacity-90">{l.new_role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="glass-elevated rounded-xl p-5 border border-white/10 space-y-4">
            <h3 className="font-display font-semibold text-on-surface">Invite Administrator</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input className="input-glass col-span-2" placeholder="Email Address" value={inviteForm.email} onChange={e=>setInviteForm(p=>({...p,email:e.target.value}))} />
              <select className="input-glass" value={inviteForm.role} onChange={e=>setInviteForm(p=>({...p,role:e.target.value}))}>
                <option value="COLLEGE_ADMIN">College Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              {inviteForm.role === 'COLLEGE_ADMIN' && (
                <select className="input-glass" value={inviteForm.college_id} onChange={e=>setInviteForm(p=>({...p,college_id:e.target.value}))}>
                  <option value="">Select College</option>
                  {colleges.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={handleInviteAdmin} className="btn-primary text-sm px-6">Send Invitation</button>
            </div>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-on-surface-variant font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">College</th>
                    <th className="px-6 py-4">Invited By</th>
                    <th className="px-6 py-4">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invites.map(i => (
                    <tr key={i.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 text-on-surface">{i.email}</td>
                      <td className="px-6 py-4 font-mono text-[10px] text-tertiary">{i.role}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{i.college?.name || '-'}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{i.inviter?.full_name}</td>
                      <td className="px-6 py-4 text-on-surface-variant text-xs">{format(new Date(i.expires_at), 'MMM d')}</td>
                    </tr>
                  ))}
                  {invites.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No active invitations</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Tab */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-on-surface-variant">
              No pending abuse reports. Great job!
            </div>
          ) : (
            reports.map(r => (
              <div key={r.id} className="glass-card rounded-xl p-5 border border-error/20 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-error/20 text-error uppercase">{r.target_type}</span>
                    <span className="font-display font-semibold text-on-surface">Reported for: {r.reason}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">Target ID: <span className="font-mono text-xs">{r.target_id}</span></p>
                  <p className="text-xs text-on-surface-variant">Reported by {r.reporter?.full_name} on {format(new Date(r.created_at), 'MMM d')}</p>
                  {r.details && <div className="mt-2 p-3 rounded-lg bg-black/20 text-sm text-on-surface italic">&quot;{r.details}&quot;</div>}
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => handleUpdateReportStatus(r.id, 'dismissed')} className="btn-ghost text-xs flex-1 md:flex-none">Dismiss</button>
                  <button onClick={() => handleUpdateReportStatus(r.id, 'actioned')} className="btn-primary text-xs bg-error hover:bg-error/80 flex-1 md:flex-none">Take Action</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}