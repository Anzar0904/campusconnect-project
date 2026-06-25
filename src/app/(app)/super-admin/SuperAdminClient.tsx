'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { X, Trophy, Calendar, Sparkles, BookOpen, FileText, User, Users, Shield, Briefcase, Store, MessageSquare, Trash2, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAutoAnimate } from '@formkit/auto-animate/react'

export default function SuperAdminClient({ userId, ownerEmail }: { userId: string, ownerEmail: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [parentUsers] = useAutoAnimate()
  const [parentDating] = useAutoAnimate()
  const [parentReports] = useAutoAnimate()
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

  // User Inspector state
  const [selectedUserInspectorId, setSelectedUserInspectorId] = useState<string | null>(null)
  const [inspectorData, setInspectorData] = useState<any>(null)
  const [loadingInspector, setLoadingInspector] = useState(false)
  const [inspectorActiveSubTab, setInspectorActiveSubTab] = useState<'profile'|'posts'|'friends'|'modules'|'rewards'>('profile')

  const fetchInspectorData = async (targetId: string) => {
    setLoadingInspector(true)
    try {
      const { data, error } = await supabase.rpc('get_user_inspector_data', { p_user_id: targetId })
      if (error) {
        toast.error('Failed to load user inspection details: ' + error.message)
      } else {
        setInspectorData(data)
      }
    } catch (e: any) {
      toast.error('Error fetching user data: ' + e.message)
    } finally {
      setLoadingInspector(false)
    }
  }

  const handleInspectUser = (targetId: string) => {
    setSelectedUserInspectorId(targetId)
    setInspectorData(null)
    setInspectorActiveSubTab('profile')
    fetchInspectorData(targetId)
  }

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
      .from('profiles_secure')
      .update({
        is_verified: verify
      })
      .eq('id', targetId)
    if (error) { toast.error(error.message); return }
    toast.success(verify ? 'User verified' : 'User verification revoked')
    fetchData()
  }

  async function handleSuspendUser(targetId: string, suspend: boolean) {
    if (!confirm(`Are you sure you want to ${suspend ? 'suspend' : 'reactivate'} this user?`)) return
    const { error } = await (supabase as any)
  .from('profiles_secure')
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
  .from('profiles_secure')
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
  .from('profiles_secure')
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-5 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

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
                <tbody ref={parentUsers} className="divide-y divide-white/5">
                  {users.filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleInspectUser(u.id)}>
                      <p className="font-medium text-on-surface hover:text-cyan-400 transition-colors">{u.full_name}</p>
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
  <div ref={parentDating} className="space-y-4">
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
        <div ref={parentReports} className="space-y-4">
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

      {selectedUserInspectorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedUserInspectorId(null)} />
          <div className="card-premium max-w-4xl w-full max-h-[85vh] relative z-10 flex flex-col bg-[#090d16] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-white/10 flex flex-col gap-4 bg-white/[0.01]">
              {/* Back navigation & Breadcrumbs */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setSelectedUserInspectorId(null)}
                  className="md:hidden flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                {/* Desktop Breadcrumbs */}
                <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                  <span className="cursor-pointer hover:text-white" onClick={() => { setSelectedUserInspectorId(null); router.push('/dashboard') }}>Dashboard</span>
                  <span>&gt;</span>
                  <span className="cursor-pointer hover:text-white" onClick={() => setSelectedUserInspectorId(null)}>Super Admin</span>
                  <span>&gt;</span>
                  <span className="text-white font-medium">User Inspector</span>
                </div>
                {/* Close Button on Desktop */}
                <button 
                  onClick={() => setSelectedUserInspectorId(null)}
                  className="hidden md:block text-zinc-400 hover:text-white hover:opacity-80"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 overflow-hidden font-bold">
                    {inspectorData?.profile?.avatar_url ? (
                      <img src={inspectorData.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      inspectorData?.profile?.full_name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">
                      {inspectorData ? inspectorData.profile.full_name : 'Loading User Profile...'}
                      {inspectorData?.profile?.is_verified && (
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-mono font-bold">Verified</span>
                      )}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                      {inspectorData ? `@${inspectorData.profile.username || 'no_username'} · ${inspectorData.profile.email}` : 'Loading details...'}
                    </p>
                  </div>
                </div>
                {/* Mobile-only Close Button */}
                <button onClick={() => setSelectedUserInspectorId(null)} className="md:hidden w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingInspector ? (
                <div className="space-y-6 animate-pulse">
                  <div className="h-8 bg-white/5 rounded-xl w-1/4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-32 bg-white/5 rounded-2xl" />
                    <div className="h-32 bg-white/5 rounded-2xl" />
                  </div>
                </div>
              ) : inspectorData ? (
                <>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-black/20 w-fit border border-white/[0.03]">
                    {([
                      ['profile', '👤 Profile'],
                      ['posts', '📝 Posts'],
                      ['friends', '👥 Friends'],
                      ['modules', '📦 Modules'],
                      ['rewards', '🏆 Rewards']
                    ] as const).map(([tabId, label]) => (
                      <button
                        key={tabId}
                        onClick={() => setInspectorActiveSubTab(tabId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${inspectorActiveSubTab === tabId ? 'bg-white/[0.08] text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {inspectorActiveSubTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      <div className="md:col-span-5 space-y-4">
                        <div className="glass-card rounded-2xl p-4.5 space-y-3.5 border border-white/5">
                          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">Information</h3>
                          <div className="space-y-2 text-xs">
                            <p className="text-zinc-400"><strong>Branch:</strong> <span className="text-zinc-200">{inspectorData.profile.branch || 'Not set'}</span></p>
                            <p className="text-zinc-400"><strong>Year:</strong> <span className="text-zinc-200">{inspectorData.profile.year ? `Year ${inspectorData.profile.year}` : 'Not set'}</span></p>
                            <p className="text-zinc-400"><strong>College:</strong> <span className="text-zinc-200">{inspectorData.profile.college_name || 'No college linked'}</span></p>
                            <p className="text-zinc-400"><strong>System Role:</strong> <span className="text-zinc-200 uppercase font-mono">{inspectorData.profile.role}</span></p>
                            <p className="text-zinc-400"><strong>Join Date:</strong> <span className="text-zinc-200">{format(new Date(inspectorData.profile.created_at), 'PPP')}</span></p>
                          </div>
                        </div>
                        <div className="glass-card rounded-2xl p-4.5 space-y-3 border border-white/5">
                          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">Bio</h3>
                          <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">{inspectorData.profile.bio || 'No bio entered.'}</p>
                        </div>
                      </div>
                      <div className="md:col-span-7 space-y-4">
                        <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Activity Metrics</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { label: 'Posts', value: inspectorData.counts.total_posts, color: 'border-l-cyan-500' },
                            { label: 'Friends', value: inspectorData.counts.total_friends, color: 'border-l-blue-500' },
                            { label: 'Communities', value: inspectorData.counts.total_communities, color: 'border-l-indigo-500' },
                            { label: 'Clubs Joined', value: inspectorData.counts.total_clubs, color: 'border-l-purple-500' },
                            { label: 'Clubs Led', value: inspectorData.counts.total_clubs_led, color: 'border-l-pink-500' },
                            { label: 'Events Joined', value: inspectorData.counts.total_events, color: 'border-l-amber-500' },
                            { label: 'Study Groups', value: inspectorData.counts.total_study_groups, color: 'border-l-rose-500' },
                            { label: 'Marketplace', value: inspectorData.counts.total_marketplace, color: 'border-l-emerald-500' },
                            { label: 'Notes', value: inspectorData.counts.total_notes, color: 'border-l-violet-500' },
                            { label: 'Papers', value: inspectorData.counts.total_papers, color: 'border-l-fuchsia-500' }
                          ].map(metric => (
                            <div key={metric.label} className={`glass-card rounded-xl p-3.5 border-l-4 ${metric.color} border border-white/5`}>
                              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight leading-none mb-1">{metric.label}</p>
                              <p className="font-display text-xl font-bold text-zinc-100">{metric.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {inspectorActiveSubTab === 'posts' && (
                    <div className="space-y-3">
                      {inspectorData.posts.length === 0 ? (
                        <p className="text-zinc-500 text-xs italic py-6 text-center">No posts published by this user.</p>
                      ) : (
                        inspectorData.posts.map((p: any) => (
                          <div key={p.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs space-y-2">
                            <p className="text-zinc-300 whitespace-pre-wrap">{p.content}</p>
                            <div className="flex gap-4 text-[10px] font-mono text-zinc-500 pt-1.5 border-t border-white/[0.02]">
                              <span>❤️ {p.likes_count} likes</span>
                              <span>💬 {p.comments_count} comments</span>
                              <span className="ml-auto">{format(new Date(p.created_at), 'PPP')}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {inspectorActiveSubTab === 'friends' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {inspectorData.friends.length === 0 ? (
                        <p className="col-span-full text-zinc-500 text-xs italic py-6 text-center">No active friends found.</p>
                      ) : (
                        inspectorData.friends.map((f: any) => (
                          <div key={f.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-zinc-400 text-xs overflow-hidden shrink-0">
                              {f.avatar_url ? (
                                <img src={f.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                f.full_name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs truncate leading-tight">{f.full_name}</p>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">@{f.username || 'no_username'}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {inspectorActiveSubTab === 'modules' && (
                    <div className="space-y-6">
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Communities Joined ({inspectorData.communities.length})</h4>
                        {inspectorData.communities.length === 0 ? (
                          <p className="text-zinc-600 text-xs italic pl-1">None joined</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.communities.map((c: any) => (
                              <div key={c.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
                                <p className="font-bold text-white leading-tight">{c.name}</p>
                                <span className="text-[9px] uppercase font-mono tracking-wider text-cyan-400 bg-cyan-500/5 px-1.5 py-0.5 rounded border border-cyan-500/10 mt-1.5 inline-block">{c.category}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Clubs Joined & Led ({inspectorData.clubs.length})</h4>
                        {inspectorData.clubs.length === 0 ? (
                          <p className="text-zinc-600 text-xs italic pl-1">None joined</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.clubs.map((c: any) => (
                              <div key={c.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-white leading-tight">{c.name}</p>
                                  <span className="text-[9px] uppercase font-mono tracking-wider text-purple-400 bg-purple-500/5 px-1.5 py-0.5 rounded border border-purple-500/10 mt-1.5 inline-block">{c.category}</span>
                                </div>
                                <span className={`text-[10px] font-mono capitalize px-2 py-0.5 rounded-full ${c.role === 'president' || c.role === 'leader' || c.role === 'lead' ? 'bg-pink-500/20 text-pink-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                  {c.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Registered Events ({inspectorData.events.length})</h4>
                        {inspectorData.events.length === 0 ? (
                          <p className="text-zinc-600 text-xs italic pl-1">None registered</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.events.map((e: any) => (
                              <div key={e.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
                                <p className="font-bold text-white leading-tight truncate">{e.title}</p>
                                <p className="text-[10px] text-zinc-500 mt-1">📍 {e.venue || 'Campus'} · {format(new Date(e.start_time), 'PPp')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Study Groups Joined ({inspectorData.study_groups.length})</h4>
                        {inspectorData.study_groups.length === 0 ? (
                          <p className="text-zinc-600 text-xs italic pl-1">None joined</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.study_groups.map((s: any) => (
                              <div key={s.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
                                <p className="font-bold text-white leading-tight">{s.name}</p>
                                <p className="text-[10px] text-zinc-500 mt-1">📚 {s.subject}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Marketplace Listings ({inspectorData.marketplace.length})</h4>
                        {inspectorData.marketplace.length === 0 ? (
                          <p className="text-zinc-600 text-xs italic pl-1">No listings active</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.marketplace.map((m: any) => (
                              <div key={m.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-white leading-tight">{m.title}</p>
                                  <p className="text-[10px] text-cyan-400 font-bold mt-1">₹{m.price}</p>
                                </div>
                                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full ${m.status === 'available' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                  {m.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {inspectorActiveSubTab === 'rewards' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card rounded-2xl p-4.5 border-l-4 border-l-amber-500 border border-white/5">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight mb-1">Current Points</p>
                          <p className="font-display text-2xl font-bold text-zinc-100">{inspectorData.points_rank.total_points}</p>
                        </div>
                        <div className="glass-card rounded-2xl p-4.5 border-l-4 border-l-cyan-500 border border-white/5">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight mb-1">Current Rank</p>
                          <p className="font-display text-2xl font-bold text-zinc-100">#{inspectorData.points_rank.rank}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Achievements Earned ({inspectorData.achievements.length})</h4>
                        {inspectorData.achievements.length === 0 ? (
                          <p className="text-zinc-500 text-xs italic py-4 pl-1">No achievements unlocked yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {inspectorData.achievements.map((ac: any) => (
                              <div key={ac.id} className="glass-card rounded-xl p-3.5 flex items-center gap-3 border border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 shadow-sm">
                                  <Trophy size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-zinc-100 text-xs leading-none">{ac.name}</p>
                                  <p className="text-[10px] text-zinc-500 truncate mt-1">{ac.description}</p>
                                  <span className="text-[9px] font-mono text-zinc-600 block mt-1.5">Unlocked {format(new Date(ac.unlocked_at), 'PPP')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-zinc-500 text-xs text-center py-12">Failed to load inspect info.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}