'use client'

import React, { useState, useEffect } from 'react'
import { Briefcase, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface CommunityItem {
  id: string
  name: string
  member_count: number
}

interface JobItem {
  role: string
  company: string
  match: string
  color: string
}

export const SecondarySidebar: React.FC = () => {
  const supabase = createClient()
  const [communities, setCommunities] = useState<CommunityItem[]>([])
  const [jobs, setJobs] = useState<JobItem[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch real communities that the user is a member of (or fallback to top communities)
        const { data: memberships } = await supabase
          .from('community_members')
          .select('community_id, communities(id, name, member_count)')
          .eq('user_id', user.id)
          .limit(3)

        let loadedComms: CommunityItem[] = []
        if (memberships && memberships.length > 0) {
          loadedComms = memberships
            .map((m: any) => m.communities)
            .filter(Boolean) as CommunityItem[]
        }

        if (loadedComms.length === 0) {
          const { data: topComms } = await supabase
            .from('communities')
            .select('id, name, member_count')
            .order('member_count', { ascending: false })
            .limit(3)
          if (topComms) loadedComms = topComms
        }
        setCommunities(loadedComms)

        // 2. Fetch real internships from the database (or fallback to basic fields)
        const { data: dbJobs } = await supabase
          .from('internships')
          .select('id, title, company, type')
          .limit(3)

        if (dbJobs && dbJobs.length > 0) {
          setJobs(dbJobs.map((j: any) => ({
            role: j.title,
            company: j.company,
            match: j.type === 'Technical' ? '92% Match' : '85% Match',
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          })))
        } else {
          // Hardcoded fallback ONLY if database is totally empty
          setJobs([
            { role: 'Software Engineer', company: 'IILM Systems', match: '90% Match', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { role: 'Management Trainee', company: 'College Connect', match: '85% Match', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
          ])
        }
      } catch (err) {
        console.error('Error fetching secondary sidebar details:', err)
      }
    }
    fetchData()
  }, [supabase])

  return (
    <div className="space-y-5">
      {/* Internships widget */}
      <div className="glass-panel-base rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Briefcase size={14} className="text-amber-400" />
            <span>Internship Matches</span>
          </div>
          <Link href="/internships" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">
            View all
          </Link>
        </div>

        <div className="space-y-2.5">
          {jobs.map((job, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
              <div>
                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">{job.role}</p>
                <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{job.company}</p>
              </div>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border tracking-wide ${job.color}`}>
                {job.match}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Communities widget */}
      <div className="glass-panel-base rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Users size={14} className="text-purple-400" />
            <span>My Communities</span>
          </div>
          <Link href="/community" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {communities.map((comm, idx) => {
            const initial = comm.name.slice(0, 2).toUpperCase()
            // Deterministic gradient indices
            const gradients = [
              'from-blue-600 to-indigo-600',
              'from-pink-600 to-purple-600',
              'from-cyan-600 to-blue-600'
            ]
            const grad = gradients[idx % gradients.length]

            return (
              <div key={comm.id} className="flex items-center justify-between group p-1 rounded-xl hover:bg-white/[0.01]">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} text-white text-[10px] font-black flex items-center justify-center shadow-md`}>
                    {initial}
                  </div>
                  <div>
                    <Link href={`/community/${comm.id}`} className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer tracking-tight">
                      {comm.name}
                    </Link>
                    <p className="text-[10px] text-neutral-500 font-medium mt-0.5">
                      {comm.member_count} active node{comm.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Link href={`/community/${comm.id}`} className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] rounded-lg transition-all tracking-wide active:scale-95">
                  Enter
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
