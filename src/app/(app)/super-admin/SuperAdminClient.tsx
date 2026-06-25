'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { X, Trophy, Calendar, Sparkles, BookOpen, FileText, User, Users, Shield, Briefcase, Store, MessageSquare, Trash2, ChevronLeft, ShieldCheck, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { cn } from '@/lib/utils'

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
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold text-white tracking-tight leading-none">Super Admin Platform</h1>
        <p className="text-zinc-400 font-mono mt-1 text-xs uppercase tracking-widest font-bold">Global infrastructure and access management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.02] w-fit border border-white/[0.04] overflow-x-auto max-w-full scrollbar-none select-none">
        {(['overview','users','colleges','admins','moderation','dating','audit'] as const).map(t => {
          const isActive = activeTab === t
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold font-display tracking-wide capitalize transition-all whitespace-nowrap active:scale-95 cursor-pointer",
                isActive 
                  ? "bg-brand-500/10 border border-brand-500/20 text-brand-400 shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {t === 'dating' ? 'Dating Verification' : t}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-premium p-6 space-y-2 border border-white/[0.06] shadow-premium">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Total Users</span>
              <Users size={16} className="text-blue-400" />
            </div>
            <p className="font-display text-3xl font-bold text-white">{metrics.totalUsers}</p>
          </div>
          <div className="card-premium p-6 space-y-2 border border-white/[0.06] shadow-premium">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Verified Students</span>
              <ShieldCheck size={16} className="text-emerald-400" />
            </div>
            <p className="font-display text-3xl font-bold text-white">{metrics.verifiedUsers}</p>
          </div>
          <div className="card-premium p-6 space-y-2 border border-white/[0.06] shadow-premium">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Active Colleges</span>
              <BookOpen size={16} className="text-purple-400" />
            </div>
            <p className="font-display text-3xl font-bold text-white">{metrics.totalColleges}</p>
          </div>
          <div className="card-premium p-6 space-y-2 border border-white/[0.06] shadow-premium">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Pending Reports</span>
              <Trash2 size={16} className="text-red-400" />
            </div>
            <p className="font-display text-3xl font-bold text-white">{metrics.pendingReports}</p>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <input 
            className="input-pro w-full max-w-md" 
            placeholder="Search users by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="card-premium overflow-hidden border border-white/[0.06] shadow-premium">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/[0.04] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">User</th>
                    <th className="px-6 py-4 font-bold">College</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Legal</th>
                    <th className="px-6 py-4 font-bold">Role</th>
                    <th className="px-6 py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody ref={parentUsers} className="divide-y divide-white/[0.03]">
                  {users.filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleInspectUser(u.id)}>
                      <p className="font-bold text-white hover:text-brand-400 transition-colors">{u.full_name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{u.email}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-medium">{u.colleges?.name || 'No College'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-mono font-bold w-fit uppercase",
                          u.is_verified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-zinc-500 border border-white/5'
                        )}>
                          {u.is_verified ? 'Verified' : 'Pending'}
                        </span>
                        {u.is_suspended && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold w-fit bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                            Suspended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.accepted_terms_at ? (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase" title={`Accepted on ${format(new Date(u.accepted_terms_at), 'PPP')}`}>
                          Accepted
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase",
                        u.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : u.role === 'COLLEGE_ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => handleVerifyUser(u.id, !u.is_verified)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-200 hover:text-white cursor-pointer active:scale-95">
                        {u.is_verified ? 'Revoke' : 'Verify'}
                      </button>
                      <button 
                        onClick={() => handleSuspendUser(u.id, !u.is_suspended)} 
                        disabled={u.email === ownerEmail}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all border cursor-pointer active:scale-95",
                          u.is_suspended 
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
                        )}
                      >
                        {u.is_suspended ? 'Reactivate' : 'Suspend'}
                      </button>
                      <select 
                        className="bg-zinc-900 border border-white/[0.08] hover:border-white/[0.12] rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-zinc-300 focus:outline-none transition-all cursor-pointer inline-block outline-none"
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
          <div className="card-premium p-6 border border-white/[0.06] shadow-premium space-y-6">
            <div className="border-b border-white/[0.04] pb-4">
              <h3 className="text-sm font-bold text-white tracking-tight">Add New College</h3>
              <p className="text-[11px] text-zinc-400 mt-1">Register a new college entity to enable student registrations under its domain name.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">College Name</span>
                <input className="input-pro text-xs font-medium" placeholder="IILM University" value={collegeForm.name} onChange={e=>setCollegeForm(p=>({...p,name:e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">City</span>
                <input className="input-pro text-xs font-medium" placeholder="Greater Noida" value={collegeForm.city} onChange={e=>setCollegeForm(p=>({...p,city:e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Email Domain</span>
                <input className="input-pro text-xs font-medium" placeholder="iilm.edu" value={collegeForm.email_domain} onChange={e=>setCollegeForm(p=>({...p,email_domain:e.target.value}))} />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleCreateCollege} className="btn-premium px-8 text-xs font-semibold">Add College</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {colleges.map(c => (
              <div key={c.id} className="card-premium p-5 flex items-center justify-between border border-white/[0.06] shadow-premium">
                <div>
                  <h3 className="text-xs font-bold text-white">{c.name}</h3>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">@{c.email_domain} · {c.city || 'No City'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase",
                    c.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  )}>
                    {c.is_active ? 'Active' : 'Disabled'}
                  </span>
                  <button 
                    onClick={() => handleToggleCollege(c.id, c.is_active)} 
                    className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    <DynamicIcon name={c.is_active ? 'block' : 'check_circle'} size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dating Tab */}
      {activeTab === 'dating' && (
        <div ref={parentDating} className="space-y-6">
          <div className="border-b border-white/[0.04] pb-4">
            <h2 className="text-base font-bold text-white tracking-tight">Dating Verification Requests</h2>
            <p className="text-xs text-zinc-400 mt-1">Review student ID submissions to approve dating module access.</p>
          </div>

          {datingRequests.length === 0 ? (
            <div className="card-premium p-8 text-center text-zinc-500 text-xs italic">
              No pending requests
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datingRequests.map((request) => (
                <div
                  key={request.id}
                  className="card-premium p-6 border border-white/[0.06] shadow-premium space-y-4"
                >
                  <div className="space-y-2 text-xs">
                    <p className="text-zinc-400"><strong>Name:</strong> <span className="text-zinc-200 font-bold">{request.full_name}</span></p>
                    <p className="text-zinc-400"><strong>Email:</strong> <span className="text-zinc-200">{request.email}</span></p>
                    <p className="text-zinc-400"><strong>Branch:</strong> <span className="text-zinc-200">{request.branch}</span></p>
                    <p className="text-zinc-400"><strong>Year:</strong> <span className="text-zinc-200">{request.year}</span></p>
                    <p className="text-zinc-400"><strong>Roll No:</strong> <span className="text-zinc-200">{request.roll_number}</span></p>
                    <p className="text-zinc-400"><strong>Status:</strong> <span className="text-zinc-200 uppercase font-mono">{request.status}</span></p>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={() => {
                        const { data } = supabase.storage
                          .from('dating-verification')
                          .getPublicUrl(request.id_card_url)

                        window.open(data.publicUrl, '_blank')
                      }}
                      className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-200 hover:text-white cursor-pointer active:scale-95"
                    >
                      View ID Card
                    </button>
                    <button
                      onClick={() =>
                        handleApproveDatingRequest(
                          request.id,
                          request.user_id
                        )
                      }
                      className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 text-white cursor-pointer active:scale-95"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="card-premium overflow-hidden border border-white/[0.06] shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.04] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Time</th>
                  <th className="px-6 py-4 font-bold">Actor</th>
                  <th className="px-6 py-4 font-bold">Target User</th>
                  <th className="px-6 py-4 font-bold">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">{format(new Date(l.created_at), 'MMM d, HH:mm')}</td>
                    <td className="px-6 py-4 text-white font-medium">{l.changed_by?.full_name || 'System'}</td>
                    <td className="px-6 py-4 text-zinc-300">{l.target_user?.full_name || 'Unknown'}</td>
                    <td className="px-6 py-4 font-mono text-[10px]">
                      <span className="text-red-400 opacity-80">{l.old_role}</span>
                      <span className="mx-2 text-zinc-500">→</span>
                      <span className="text-emerald-400 opacity-90">{l.new_role}</span>
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
          <div className="card-premium p-6 border border-white/[0.06] shadow-premium space-y-6">
            <div className="border-b border-white/[0.04] pb-4">
              <h3 className="text-sm font-bold text-white tracking-tight">Invite Administrator</h3>
              <p className="text-[11px] text-zinc-400 mt-1">Send an invitation email to delegate roles such as College Admin or Super Admin.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Email Address</span>
                <input className="input-pro text-xs font-medium" placeholder="admin@iilm.edu" value={inviteForm.email} onChange={e=>setInviteForm(p=>({...p,email:e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Admin Role</span>
                <select className="input-pro text-xs font-medium appearance-none cursor-pointer" value={inviteForm.role} onChange={e=>setInviteForm(p=>({...p,role:e.target.value}))}>
                  <option value="COLLEGE_ADMIN">College Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              {inviteForm.role === 'COLLEGE_ADMIN' && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Select College</span>
                  <select className="input-pro text-xs font-medium appearance-none cursor-pointer" value={inviteForm.college_id} onChange={e=>setInviteForm(p=>({...p,college_id:e.target.value}))}>
                    <option value="">Choose College</option>
                    {colleges.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={handleInviteAdmin} className="btn-premium px-8 text-xs font-semibold">Send Invitation</button>
            </div>
          </div>
          <div className="card-premium overflow-hidden border border-white/[0.06] shadow-premium">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/[0.04] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Email</th>
                    <th className="px-6 py-4 font-bold">Role</th>
                    <th className="px-6 py-4 font-bold">College</th>
                    <th className="px-6 py-4 font-bold">Invited By</th>
                    <th className="px-6 py-4 font-bold">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {invites.map(i => (
                    <tr key={i.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{i.email}</td>
                      <td className="px-6 py-4 font-mono text-[10px] text-brand-400">{i.role}</td>
                      <td className="px-6 py-4 text-zinc-300">{i.college?.name || '-'}</td>
                      <td className="px-6 py-4 text-zinc-300">{i.inviter?.full_name}</td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-[10px]">{format(new Date(i.expires_at), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                  {invites.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500 text-xs italic">
                        No active invitations
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Tab */}
      {activeTab === 'moderation' && (
        <div ref={parentReports} className="space-y-4">
          <div className="border-b border-white/[0.04] pb-4">
            <h2 className="text-base font-bold text-white tracking-tight">Content Moderation & Reports</h2>
            <p className="text-xs text-zinc-400 mt-1">Review student flags and moderation reports.</p>
          </div>

          {reports.length === 0 ? (
            <div className="card-premium p-8 text-center text-zinc-500 text-xs italic">
              No pending abuse reports. Great job!
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(r => (
                <div key={r.id} className="card-premium p-6 border border-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.02)] flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase">{r.target_type}</span>
                      <span className="font-bold text-white">Reported for: <span className="text-red-400">{r.reason}</span></span>
                    </div>
                    <p className="text-zinc-400">Target ID: <span className="font-mono text-[11px] text-zinc-300">{r.target_id}</span></p>
                    <p className="text-zinc-500">Reported by {r.reporter?.full_name} on {format(new Date(r.created_at), 'PPP')}</p>
                    {r.details && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] text-xs text-zinc-300 italic">
                        &quot;{r.details}&quot;
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto shrink-0">
                    <button onClick={() => handleUpdateReportStatus(r.id, 'dismissed')} className="btn-ghost-pro py-2 text-xs flex-1 md:flex-none">Dismiss</button>
                    <button onClick={() => handleUpdateReportStatus(r.id, 'actioned')} className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 border border-red-500/20 text-white cursor-pointer transition-all active:scale-95 flex-1 md:flex-none">Take Action</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Inspector Modal */}
      {selectedUserInspectorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUserInspectorId(null)} />
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#111317] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 animate-scale-up">
            <div className="p-6 border-b border-white/[0.04] flex flex-col gap-4 bg-white/[0.01]">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <button
                  onClick={() => setSelectedUserInspectorId(null)}
                  className="md:hidden flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                  <span className="cursor-pointer hover:text-white" onClick={() => { setSelectedUserInspectorId(null); router.push('/dashboard') }}>Dashboard</span>
                  <span>&gt;</span>
                  <span className="cursor-pointer hover:text-white" onClick={() => setSelectedUserInspectorId(null)}>Super Admin</span>
                  <span>&gt;</span>
                  <span className="text-white font-medium">User Inspector</span>
                </div>
                <button 
                  onClick={() => setSelectedUserInspectorId(null)}
                  className="hidden md:block text-zinc-500 hover:text-white transition-colors"
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
                    <h2 className="font-display font-bold text-white text-base flex items-center gap-2">
                      {inspectorData ? inspectorData.profile.full_name : 'Loading User Profile...'}
                      {inspectorData?.profile?.is_verified && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">Verified</span>
                      )}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                      {inspectorData ? `@${inspectorData.profile.username || 'no_username'} · ${inspectorData.profile.email}` : 'Loading details...'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedUserInspectorId(null)} className="md:hidden w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                  <X size={14} />
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
                  <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.01] border border-white/[0.04] w-fit">
                    {([
                      ['profile', '👤 Profile'],
                      ['posts', '📝 Posts'],
                      ['friends', '👥 Friends'],
                      ['modules', '📦 Modules'],
                      ['rewards', '🏆 Rewards']
                    ] as const).map(([tabId, label]) => {
                      const isActive = inspectorActiveSubTab === tabId
                      return (
                        <button
                          key={tabId}
                          onClick={() => setInspectorActiveSubTab(tabId)}
                          className={cn(
                            "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95",
                            isActive 
                              ? 'bg-brand-500/10 border border-brand-500/20 text-brand-400 shadow-sm' 
                              : 'text-zinc-500 hover:text-zinc-300'
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {inspectorActiveSubTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      <div className="md:col-span-5 space-y-4">
                        <div className="card-premium p-5 space-y-3.5 border border-white/[0.06] shadow-premium">
                          <h3 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Information</h3>
                          <div className="space-y-2 text-xs">
                            <p className="text-zinc-400"><strong>Branch:</strong> <span className="text-zinc-200">{inspectorData.profile.branch || 'Not set'}</span></p>
                            <p className="text-zinc-400"><strong>Year:</strong> <span className="text-zinc-200">{inspectorData.profile.year ? `Year ${inspectorData.profile.year}` : 'Not set'}</span></p>
                            <p className="text-zinc-400"><strong>College:</strong> <span className="text-zinc-200">{inspectorData.profile.college_name || 'No college linked'}</span></p>
                            <p className="text-zinc-400"><strong>System Role:</strong> <span className="text-zinc-200 uppercase font-mono">{inspectorData.profile.role}</span></p>
                            <p className="text-zinc-400"><strong>Join Date:</strong> <span className="text-zinc-200">{format(new Date(inspectorData.profile.created_at), 'PPP')}</span></p>
                          </div>
                        </div>
                        <div className="card-premium p-5 space-y-3 border border-white/[0.06] shadow-premium">
                          <h3 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Bio</h3>
                          <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-medium">{inspectorData.profile.bio || 'No bio entered.'}</p>
                        </div>
                      </div>
                      <div className="md:col-span-7 space-y-4">
                        <h3 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Activity Metrics</h3>
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
                            <div key={metric.label} className={cn("card-premium p-4 border-l-4 border border-white/[0.06] shadow-premium", metric.color)}>
                              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider leading-none mb-1.5 font-bold">{metric.label}</p>
                              <p className="font-display text-xl font-bold text-white">{metric.value}</p>
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
                          <div key={p.id} className="card-premium p-4 border border-white/[0.06] shadow-premium text-xs space-y-2">
                            <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed font-medium">{p.content}</p>
                            <div className="flex gap-4 text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/[0.04]">
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
                          <div key={f.id} className="card-premium p-3 border border-white/[0.06] shadow-premium flex items-center gap-3">
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
                        <h4 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Communities Joined ({inspectorData.communities.length})</h4>
                        {inspectorData.communities.length === 0 ? (
                          <p className="text-zinc-500 text-xs italic pl-1">None joined</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.communities.map((c: any) => (
                              <div key={c.id} className="card-premium p-3.5 border border-white/[0.06] shadow-premium text-xs">
                                <p className="font-bold text-white leading-tight">{c.name}</p>
                                <span className="text-[9px] uppercase font-mono tracking-wider text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 mt-1.5 inline-block font-bold">{c.category}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Clubs Joined & Led ({inspectorData.clubs.length})</h4>
                        {inspectorData.clubs.length === 0 ? (
                          <p className="text-zinc-500 text-xs italic pl-1">None joined</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.clubs.map((c: any) => (
                              <div key={c.id} className="card-premium p-3.5 border border-white/[0.06] shadow-premium text-xs flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-white leading-tight">{c.name}</p>
                                  <span className="text-[9px] uppercase font-mono tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 mt-1.5 inline-block font-bold">{c.category}</span>
                                </div>
                                <span className="text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400">
                                  {c.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Registered Events ({inspectorData.events.length})</h4>
                        {inspectorData.events.length === 0 ? (
                          <p className="text-zinc-500 text-xs italic pl-1">None registered</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.events.map((e: any) => (
                              <div key={e.id} className="card-premium p-3.5 border border-white/[0.06] shadow-premium text-xs">
                                <p className="font-bold text-white leading-tight truncate">{e.title}</p>
                                <p className="text-[10px] text-zinc-500 mt-1">📍 {e.venue || 'Campus'} · {format(new Date(e.start_time), 'PPp')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Study Groups Joined ({inspectorData.study_groups.length})</h4>
                        {inspectorData.study_groups.length === 0 ? (
                          <p className="text-zinc-500 text-xs italic pl-1">None joined</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.study_groups.map((s: any) => (
                              <div key={s.id} className="card-premium p-3.5 border border-white/[0.06] shadow-premium text-xs">
                                <p className="font-bold text-white leading-tight">{s.name}</p>
                                <p className="text-[10px] text-zinc-500 mt-1 font-medium">📚 {s.subject}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Marketplace Listings ({inspectorData.marketplace.length})</h4>
                        {inspectorData.marketplace.length === 0 ? (
                          <p className="text-zinc-500 text-xs italic pl-1">No listings active</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inspectorData.marketplace.map((m: any) => (
                              <div key={m.id} className="card-premium p-3.5 border border-white/[0.06] shadow-premium text-xs flex justify-between items-center font-medium">
                                <div>
                                  <p className="font-bold text-white leading-tight">{m.title}</p>
                                  <p className="text-[10px] text-brand-400 font-bold mt-1">₹{m.price}</p>
                                </div>
                                <span className={cn(
                                  "text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border",
                                  m.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                )}>
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
                        <div className="card-premium p-5 border-l-4 border-l-amber-500 border border-white/[0.06] shadow-premium">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Current Points</p>
                          <p className="font-display text-2xl font-bold text-white">{inspectorData.points_rank.total_points}</p>
                        </div>
                        <div className="card-premium p-5 border-l-4 border-l-cyan-500 border border-white/[0.06] shadow-premium">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Current Rank</p>
                          <p className="font-display text-2xl font-bold text-white">#{inspectorData.points_rank.rank}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">Achievements Earned ({inspectorData.achievements.length})</h4>
                        {inspectorData.achievements.length === 0 ? (
                          <p className="text-zinc-500 text-xs italic py-4 pl-1">No achievements unlocked yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {inspectorData.achievements.map((ac: any) => (
                              <div key={ac.id} className="card-premium p-4 flex items-center gap-3 border border-white/[0.06] shadow-premium">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 shadow-sm">
                                  <Trophy size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white text-xs leading-none">{ac.name}</p>
                                  <p className="text-[10px] text-zinc-400 truncate mt-1.5 font-medium">{ac.description}</p>
                                  <span className="text-[9px] font-mono text-zinc-500 block mt-2">Unlocked {format(new Date(ac.unlocked_at), 'PPP')}</span>
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