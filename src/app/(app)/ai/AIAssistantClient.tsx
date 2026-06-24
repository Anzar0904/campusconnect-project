'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Bot, Send, Sparkles, User, RefreshCw, AlertCircle, ArrowRight,
  Calendar, Briefcase, FileText, ShoppingBag, BookOpen, MessageSquare, 
  Compass, ShieldAlert, GraduationCap, Trophy, Users, ShieldCheck, 
  MailOpen, Lock, FolderOpen
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  dataType?: 'campus' | 'user' | 'general'
  dataIntent?: string
  payload?: any
}

const SUGGESTED_PROMPTS = [
  { text: 'Show upcoming events', icon: '📅' },
  { text: 'Show internships for my branch', icon: '💼' },
  { text: 'Recommend communities for me', icon: '⚡' },
  { text: 'What should I do next?', icon: '🚀' }
]

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split('**')
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-extrabold text-cyan-400">{part}</strong>
    }
    return part
  })
}

function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  return (
    <div className="space-y-1.5 text-left font-sans">
      {lines.map((line, idx) => {
        let cleanLine = line.trim()
        if (!cleanLine) return <div key={idx} className="h-2" />

        // Header check
        if (cleanLine.startsWith('### ')) {
          return <h3 key={idx} className="text-xs font-bold text-white tracking-tight mt-3 mb-1.5 uppercase font-mono">{cleanLine.slice(4)}</h3>
        }
        if (cleanLine.startsWith('## ')) {
          return <h2 key={idx} className="text-sm font-black text-white mt-4 mb-2">{cleanLine.slice(3)}</h2>
        }
        if (cleanLine.startsWith('# ')) {
          return <h1 key={idx} className="text-base font-black text-white mt-5 mb-2.5">{cleanLine.slice(2)}</h1>
        }

        // Unordered List
        if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 my-1">
              <span className="text-cyan-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <p className="text-xs text-neutral-300 leading-relaxed flex-1">{parseBold(cleanLine.slice(2))}</p>
            </div>
          )
        }

        // Ordered List
        const numMatch = cleanLine.match(/^(\d+)\.\s(.*)$/)
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 my-1">
              <span className="text-[10px] font-mono font-bold text-cyan-400 mt-0.5 shrink-0">{numMatch[1]}.</span>
              <p className="text-xs text-neutral-300 leading-relaxed flex-1">{parseBold(numMatch[2])}</p>
            </div>
          )
        }

        return <p key={idx} className="text-xs text-neutral-300 leading-relaxed">{parseBold(cleanLine)}</p>
      })}
    </div>
  )
}

function getBranchKeywords(branch: string | null | undefined): string[] {
  if (!branch) return []
  const b = branch.toLowerCase()
  if (b.includes('cse') || b.includes('computer') || b.includes('software') || b.includes('it') || b.includes('information')) {
    return ['software', 'developer', 'computer', 'web', 'frontend', 'backend', 'fullstack', 'programming', 'tech', 'coding', 'data', 'react', 'node', 'python', 'java']
  }
  if (b.includes('ece') || b.includes('electronics') || b.includes('electrical') || b.includes('eee')) {
    return ['electronics', 'circuit', 'embedded', 'core', 'vlsi', 'hardware', 'signal', 'telecom', 'electrical']
  }
  if (b.includes('mech') || b.includes('mechanical') || b.includes('civil') || b.includes('engineering')) {
    return ['mechanical', 'civil', 'site', 'production', 'design', 'cad', 'structure', 'core', 'industry']
  }
  if (b.includes('mba') || b.includes('bba') || b.includes('management') || b.includes('business') || b.includes('marketing') || b.includes('finance')) {
    return ['marketing', 'finance', 'business', 'management', 'mba', 'analyst', 'sales', 'consultant', 'hr', 'operations']
  }
  return []
}

function getProfileCompletion(profile: any) {
  if (!profile) return { pct: 0, missing: [] }
  const fields = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'username', label: 'Username' },
    { key: 'avatar_url', label: 'Avatar Image' },
    { key: 'bio', label: 'Biography' },
    { key: 'branch', label: 'Branch / Course' },
    { key: 'year', label: 'Academic Year' },
    { key: 'roll_number', label: 'Roll Number' },
    { key: 'hostel', label: 'Hostel Name' },
    { key: 'phone', label: 'Phone Number' }
  ]
  const filled = fields.filter(f => profile[f.key] !== null && profile[f.key] !== undefined && String(profile[f.key]).trim() !== '')
  const missing = fields.filter(f => profile[f.key] === null || profile[f.key] === undefined || String(profile[f.key]).trim() === '').map(f => f.label)
  const pct = Math.round((filled.length / fields.length) * 100)
  return { pct, missing }
}

const STORAGE_KEY = 'ai_assistant_history'
const WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Welcome! I am your **Campus Copilot v2**, powered exclusively by secure local data. Ask me for recommendations, event registrations, matching internships, marketplace items, or check your dashboard action plan!',
  created_at: '2026-06-24T12:00:00.000Z',
  dataType: 'general'
}

export default function AIAssistantClient() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [collegeId, setCollegeId] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Restore chat history client-side to prevent Next.js hydration mismatch
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setMessages(JSON.parse(stored))
      } else {
        setMessages([WELCOME_MSG])
      }
    } catch {
      setMessages([WELCOME_MSG])
    }
  }, [])

  useEffect(() => {
    async function initSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('college_id')
          .eq('id', user.id)
          .single()
        if (profile?.college_id) {
          setCollegeId(profile.college_id)
        }
      }
    }
    initSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const persistMessages = (msgs: ChatMessage[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50))) } catch {}
  }

  function classifyQuery(query: string): string {
    const q = query.toLowerCase().trim()
    const cleanQ = q.replace(/[?.!,]/g, '').trim()

    if (cleanQ.includes('what should i do next') || cleanQ === 'what next' || cleanQ.includes('action plan')) {
      return 'COPILOT_DASHBOARD_INSIGHTS'
    }

    // Recommendations check first
    if (cleanQ.includes('recommend communities') || cleanQ.includes('recommend community')) {
      return 'RECOMMEND_COMMUNITIES'
    }
    if (cleanQ.includes('recommend internships') || cleanQ.includes('recommend internship') || cleanQ.includes('recommend roles') || cleanQ.includes('recommend jobs')) {
      return 'RECOMMEND_INTERNSHIPS'
    }
    if (cleanQ.includes('recommend study groups') || cleanQ.includes('recommend study group')) {
      return 'RECOMMEND_STUDY_GROUPS'
    }

    // Events
    if (cleanQ.includes('registered events') || (cleanQ.includes('my') && cleanQ.includes('events') && cleanQ.includes('register'))) {
      return 'USER_REGISTERED_EVENTS'
    }
    if (cleanQ.includes('upcoming events') || (cleanQ.includes('event') && cleanQ.includes('upcoming')) || cleanQ === 'show events' || cleanQ === 'events') {
      return 'CAMPUS_EVENTS'
    }

    // Internships & applications
    if (cleanQ.includes('internships for my branch') || cleanQ.includes('internship for my branch') || cleanQ.includes('branch internships')) {
      return 'CAMPUS_INTERNSHIPS_BRANCH'
    }
    if (cleanQ.includes('internships') || cleanQ.includes('active internships') || cleanQ === 'show internships') {
      return 'CAMPUS_INTERNSHIPS'
    }
    if (cleanQ.includes('applications') || cleanQ.includes('my applications') || cleanQ === 'applied internships') {
      return 'USER_APPLICATIONS'
    }

    // Communities
    if (cleanQ.includes('my communities') || cleanQ.includes('communities i joined')) {
      return 'USER_COMMUNITIES'
    }
    if (cleanQ.includes('communities') || cleanQ === 'show communities') {
      return 'CAMPUS_COMMUNITIES'
    }

    // Study
    if (cleanQ.includes('my study groups') || cleanQ.includes('study groups i joined')) {
      return 'USER_STUDY_GROUPS'
    }
    if (cleanQ.includes('study groups') || cleanQ.includes('study group') || cleanQ === 'show study groups') {
      return 'CAMPUS_STUDY_GROUPS'
    }
    if (cleanQ.includes('recent notes') || cleanQ === 'show notes' || cleanQ === 'notes') {
      return 'CAMPUS_NOTES'
    }
    if (cleanQ.includes('past papers') || cleanQ === 'show papers' || cleanQ === 'papers') {
      return 'CAMPUS_PAPERS'
    }

    // Marketplace
    if (cleanQ.includes('my listings') || cleanQ.includes('my marketplace') || cleanQ.includes('items i listed')) {
      return 'USER_MARKETPLACE'
    }
    if (cleanQ.includes('marketplace listings') || cleanQ.includes('marketplace') || cleanQ === 'show marketplace') {
      return 'CAMPUS_MARKETPLACE'
    }

    // Profile
    if (cleanQ.includes('profile completion')) {
      return 'USER_PROFILE_COMPLETION'
    }
    if (cleanQ.includes('profile status') || cleanQ === 'profile' || cleanQ === 'my status') {
      return 'USER_PROFILE_STATUS'
    }

    // Messages
    if (cleanQ.includes('unread messages') || (cleanQ.includes('messages') && cleanQ.includes('unread'))) {
      return 'USER_UNREAD_MESSAGES'
    }

    return 'GENERAL_AI'
  }

  const fetchDirectData = async (intent: string) => {
    if (!userId) return null
    const today = new Date().toISOString().split('T')[0]
    const nowStr = new Date().toISOString()

    try {
      switch (intent) {
        case 'CAMPUS_EVENTS': {
          let query = supabase.from('events').select('id, title, description, venue, start_time, category, attendee_count')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data } = await query.gte('start_time', nowStr).order('start_time', { ascending: true }).limit(4)
          
          const { data: rsvps } = await supabase.from('event_attendees').select('event_id').eq('user_id', userId)
          const rsvpsSet = new Set((rsvps || []).map((x: any) => x.event_id))

          return (data || []).map((e: any) => ({ ...e, isRegistered: rsvpsSet.has(e.id) }))
        }
        case 'USER_REGISTERED_EVENTS': {
          const { data } = await supabase
            .from('event_attendees')
            .select('created_at, events(id, title, description, venue, start_time, category, attendee_count)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
          const list = (data || []).map((x: any) => x.events).filter(Boolean)
          return list.map((e: any) => ({ ...e, isRegistered: true }))
        }
        case 'CAMPUS_INTERNSHIPS': {
          let query = supabase.from('internships').select('id, title, company, description, location, type, duration, stipend, deadline, apply_link')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data } = await query.or(`deadline.gte.${today},deadline.is.null`).neq('duration', 'Full-Time').order('created_at', { ascending: false }).limit(4)
          
          const { data: apps } = await supabase.from('internship_applications').select('internship_id').eq('user_id', userId)
          const appsSet = new Set((apps || []).map((x: any) => x.internship_id))

          return (data || []).map((i: any) => ({ ...i, isApplied: appsSet.has(i.id) }))
        }
        case 'CAMPUS_INTERNSHIPS_BRANCH': {
          const { data: prof } = await supabase.from('profiles').select('branch').eq('id', userId).single()
          let query = supabase.from('internships').select('id, title, company, description, location, type, duration, stipend, deadline, apply_link')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data: interns } = await query.or(`deadline.gte.${today},deadline.is.null`).neq('duration', 'Full-Time').order('created_at', { ascending: false })

          const keywords = getBranchKeywords(prof?.branch)
          const filtered = keywords.length > 0
            ? (interns || []).filter((i: any) => {
                const title = (i.title || '').toLowerCase()
                const desc = (i.description || '').toLowerCase()
                return keywords.some(kw => title.includes(kw) || desc.includes(kw))
              })
            : (interns || [])

          const { data: apps } = await supabase.from('internship_applications').select('internship_id').eq('user_id', userId)
          const appsSet = new Set((apps || []).map((x: any) => x.internship_id))

          return filtered.map((i: any) => ({ ...i, isApplied: appsSet.has(i.id) })).slice(0, 4)
        }
        case 'CAMPUS_PLACEMENTS': {
          let query = supabase.from('internships').select('id, title, company, description, location, type, duration, stipend, deadline')
          if (collegeId) query = query.eq('college_id', collegeId)
          let { data } = await query.eq('duration', 'Full-Time').or(`deadline.gte.${today},deadline.is.null`).order('created_at', { ascending: false }).limit(4)
          
          if (!data || data.length === 0) {
            let fallbackQuery = supabase.from('internships').select('id, title, company, description, location, type, duration, stipend, deadline')
            if (collegeId) fallbackQuery = fallbackQuery.eq('college_id', collegeId)
            const res = await fallbackQuery.or(`deadline.gte.${today},deadline.is.null`).order('created_at', { ascending: false }).limit(4)
            data = res.data
          }

          const { data: apps } = await supabase.from('internship_applications').select('internship_id').eq('user_id', userId)
          const appsSet = new Set((apps || []).map((x: any) => x.internship_id))

          return (data || []).map((i: any) => ({ ...i, isApplied: appsSet.has(i.id) }))
        }
        case 'CAMPUS_COMMUNITIES': {
          let query = supabase.from('communities').select('id, name, description, member_count, category, icon_url')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data } = await query.order('member_count', { ascending: false }).limit(6)
          
          const { data: joined } = await supabase.from('community_members').select('community_id').eq('user_id', userId)
          const joinedSet = new Set((joined || []).map((x: any) => x.community_id))

          return (data || []).map((c: any) => ({ ...c, isJoined: joinedSet.has(c.id) }))
        }
        case 'USER_COMMUNITIES': {
          const { data } = await supabase
            .from('community_members')
            .select('joined_at, communities(id, name, description, member_count, category, icon_url)')
            .eq('user_id', userId)
            .order('joined_at', { ascending: false })
          const list = (data || []).map((x: any) => x.communities).filter(Boolean)
          return list.map((c: any) => ({ ...c, isJoined: true }))
        }
        case 'RECOMMEND_COMMUNITIES': {
          const { data: prof } = await supabase.from('profiles').select('branch, year').eq('id', userId).single()
          
          const { data: joined } = await supabase.from('community_members').select('community_id').eq('user_id', userId)
          const joinedIds = new Set((joined || []).map((x: any) => x.community_id))
          
          const { data: apps } = await supabase.from('internship_applications').select('role, company').eq('user_id', userId)
          const appKeywords = (apps || []).map((a: any) => (a.role || '').toLowerCase() + ' ' + (a.company || '').toLowerCase())

          let query = supabase.from('communities').select('id, name, description, member_count, category, icon_url')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data: allComms } = await query.order('member_count', { ascending: false }).limit(30)
          
          const recommended = (allComms || []).filter((c: any) => !joinedIds.has(c.id))
          const branchKws = getBranchKeywords(prof?.branch)
          
          const scored = recommended.map((c: any) => {
            let score = 0
            const cName = (c.name || '').toLowerCase()
            const cDesc = (c.description || '').toLowerCase()
            
            branchKws.forEach((kw: string) => {
              if (cName.includes(kw) || cDesc.includes(kw)) score += 10
            })
            
            appKeywords.forEach((kw: string) => {
              kw.split(' ').forEach((tok: string) => {
                if (tok.length > 2 && (cName.includes(tok) || cDesc.includes(tok))) score += 5
              })
            })

            const isTech = c.category?.toLowerCase() === 'technical' || cName.includes('dev') || cName.includes('code') || cName.includes('tech')
            if (prof?.year) {
              const y = parseInt(String(prof.year))
              if (y >= 3 && isTech) score += 8
              if (y <= 2 && !isTech) score += 5
            }

            return { ...c, score }
          }).sort((a: any, b: any) => b.score - a.score)

          return scored.map((c: any) => ({ ...c, isJoined: false })).slice(0, 4)
        }
        case 'RECOMMEND_INTERNSHIPS': {
          const { data: prof } = await supabase.from('profiles').select('branch, year').eq('id', userId).single()
          
          const { data: applied } = await supabase.from('internship_applications').select('internship_id').eq('user_id', userId)
          const appliedIds = new Set((applied || []).map((x: any) => x.internship_id))

          const { data: userComms } = await supabase.from('community_members').select('communities(name, category)').eq('user_id', userId)
          const commNames = (userComms || []).map((x: any) => x.communities).filter(Boolean).map((c: any) => (c.name || '').toLowerCase() + ' ' + (c.category || '').toLowerCase())

          const { data: attended } = await supabase.from('event_attendees').select('events(title, category)').eq('user_id', userId)
          const eventKeywords = (attended || []).map((x: any) => x.events).filter(Boolean).map((e: any) => (e.title || '').toLowerCase() + ' ' + (e.category || '').toLowerCase())

          let query = supabase.from('internships').select('id, title, company, description, location, type, duration, stipend, deadline, apply_link')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data: interns } = await query.or(`deadline.gte.${today},deadline.is.null`).neq('duration', 'Full-Time').order('created_at', { ascending: false })

          const branchKws = getBranchKeywords(prof?.branch)
          const recommended = (interns || []).filter((i: any) => !appliedIds.has(i.id))

          const scored = recommended.map((i: any) => {
            let score = 0
            const iTitle = (i.title || '').toLowerCase()
            const iDesc = (i.description || '').toLowerCase()

            branchKws.forEach((kw: string) => {
              if (iTitle.includes(kw) || iDesc.includes(kw)) score += 15
            })

            commNames.forEach((cStr: string) => {
              cStr.split(' ').forEach((tok: string) => {
                if (tok.length > 2 && (iTitle.includes(tok) || iDesc.includes(tok))) score += 5
              })
            })

            eventKeywords.forEach((eStr: string) => {
              eStr.split(' ').forEach((tok: string) => {
                if (tok.length > 2 && (iTitle.includes(tok) || iDesc.includes(tok))) score += 5
              })
            })

            if (prof?.year) {
              const y = parseInt(String(prof.year))
              const isRemote = (i.location || '').toLowerCase().includes('remote')
              const isPartTime = (i.type || '').toLowerCase().includes('part-time') || (i.duration || '').toLowerCase().includes('month')
              
              if (y <= 2) {
                if (isRemote) score += 10
                if (isPartTime) score += 5
              } else {
                if (!isRemote) score += 8
              }
            }

            return { ...i, score }
          }).sort((a: any, b: any) => b.score - a.score)

          return scored.map((i: any) => ({ ...i, isApplied: false })).slice(0, 4)
        }
        case 'RECOMMEND_STUDY_GROUPS': {
          const { data: prof } = await supabase.from('profiles').select('branch, year').eq('id', userId).single()
          
          const { data: joined } = await supabase.from('study_group_members').select('group_id').eq('user_id', userId)
          const joinedIds = new Set((joined || []).map((x: any) => x.group_id))

          const { data: userComms } = await supabase.from('community_members').select('communities(name, category)').eq('user_id', userId)
          const commNames = (userComms || []).map((x: any) => x.communities).filter(Boolean).map((c: any) => (c.name || '').toLowerCase())

          let query = supabase.from('study_groups').select('id, subject, description, venue, meeting_time, max_members')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data: groups } = await query.order('created_at', { ascending: false }).limit(20)

          const branchKws = getBranchKeywords(prof?.branch)
          const recommended = (groups || []).filter((g: any) => !joinedIds.has(g.id))

          const scored = recommended.map((g: any) => {
            let score = 0
            const gSubj = (g.subject || '').toLowerCase()
            const gDesc = (g.description || '').toLowerCase()

            branchKws.forEach((kw: string) => {
              if (gSubj.includes(kw) || gDesc.includes(kw)) score += 15
            })

            commNames.forEach((cName: string) => {
              cName.split(' ').forEach((tok: string) => {
                if (tok.length > 2 && (gSubj.includes(tok) || gDesc.includes(tok))) score += 8
              })
            })

            return { ...g, score }
          }).sort((a: any, b: any) => b.score - a.score)

          return scored.map((g: any) => ({ ...g, isJoined: false })).slice(0, 4)
        }
        case 'CAMPUS_STUDY_GROUPS': {
          let query = supabase.from('study_groups').select('id, subject, description, venue, meeting_time, max_members')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data } = await query.order('created_at', { ascending: false }).limit(6)

          const { data: joined } = await supabase.from('study_group_members').select('group_id').eq('user_id', userId)
          const joinedIds = new Set((joined || []).map((x: any) => x.group_id))

          return (data || []).map((g: any) => ({ ...g, isJoined: joinedIds.has(g.id) }))
        }
        case 'USER_STUDY_GROUPS': {
          const { data } = await supabase
            .from('study_group_members')
            .select('joined_at, study_groups(id, subject, description, venue, meeting_time, max_members)')
            .eq('user_id', userId)
            .order('joined_at', { ascending: false })
          const list = (data || []).map((x: any) => x.study_groups).filter(Boolean)
          return list.map((g: any) => ({ ...g, isJoined: true }))
        }
        case 'CAMPUS_NOTES': {
          let query = supabase.from('notes').select('id, title, subject, course_code, description, file_url, downloads, likes')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data } = await query.order('created_at', { ascending: false }).limit(4)
          return data || []
        }
        case 'CAMPUS_PAPERS': {
          let query = supabase.from('exam_papers').select('id, subject, course_code, exam_year, semester, exam_type, file_url')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data } = await query.order('created_at', { ascending: false }).limit(4)
          return data || []
        }
        case 'CAMPUS_MARKETPLACE': {
          let query = supabase.from('marketplace_items').select('id, title, description, price, category, condition, images, status')
          if (collegeId) query = query.eq('college_id', collegeId)
          const { data } = await query.eq('status', 'available').order('created_at', { ascending: false }).limit(4)
          return data || []
        }
        case 'USER_MARKETPLACE': {
          const { data } = await supabase
            .from('marketplace_items')
            .select('id, title, description, price, category, condition, images, status')
            .eq('seller_id', userId)
            .order('created_at', { ascending: false })
          return data || []
        }
        case 'USER_UNREAD_MESSAGES': {
          const { data } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id, profiles!messages_sender_id_fkey(full_name, username)')
            .eq('receiver_id', userId)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(5)
          return data || []
        }
        case 'USER_APPLICATIONS': {
          const [internshipsRes, placementsRes] = await Promise.all([
            supabase
              .from('internship_applications')
              .select('id, company, role, status, applied_at')
              .eq('user_id', userId)
              .order('applied_at', { ascending: false }),
            supabase
              .from('placement_registrations')
              .select('id, company, status, registered_at')
              .eq('user_id', userId)
              .order('registered_at', { ascending: false })
          ])
          const merged = [
            ...(internshipsRes.data || []).map((x: any) => ({ ...x, type: 'Internship', date: x.applied_at })),
            ...(placementsRes.data || []).map((x: any) => ({ ...x, type: 'Placement Drive', date: x.registered_at, role: 'FTE Candidate' }))
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          return merged
        }
        case 'USER_PROFILE_STATUS': {
          const [profileRes, pointsRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, username, email, branch, year, roll_number, phone, is_verified, dating_verified, role, colleges(name)')
              .eq('id', userId)
              .single(),
            supabase
              .from('user_points')
              .select('total, level, streak_days')
              .eq('user_id', userId)
              .single()
          ])
          return {
            profile: profileRes.data,
            points: pointsRes.data
          }
        }
        case 'USER_PROFILE_COMPLETION': {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url, bio, branch, year, roll_number, hostel, phone')
            .eq('id', userId)
            .single()
          const { pct, missing } = getProfileCompletion(profile)
          return { profile, pct, missing }
        }
        case 'COPILOT_DASHBOARD_INSIGHTS': {
          const { data: profile } = await supabase.from('profiles').select('full_name, username, avatar_url, bio, branch, year, roll_number, hostel, phone').eq('id', userId).single()
          const { pct: profileCompletion, missing: missingFields } = getProfileCompletion(profile)

          const { data: userRSVPs } = await supabase.from('event_attendees').select('event_id').eq('user_id', userId)
          const userRSVPsSet = new Set((userRSVPs || []).map((x: any) => x.event_id))

          const { data: userComms } = await supabase.from('community_members').select('community_id').eq('user_id', userId)
          const userCommsSet = new Set((userComms || []).map((x: any) => x.community_id))

          const { data: userGroups } = await supabase.from('study_group_members').select('group_id').eq('user_id', userId)
          const userGroupsSet = new Set((userGroups || []).map((x: any) => x.group_id))

          const { data: userApps } = await supabase.from('internship_applications').select('internship_id').eq('user_id', userId)
          const userAppsSet = new Set((userApps || []).map((x: any) => x.internship_id))

          const [eventsRes, commsRes, internshipsRes, groupsRes] = await Promise.all([
            supabase.from('events').select('id, title, description, venue, start_time, category, attendee_count').gte('start_time', nowStr).order('start_time', { ascending: true }).limit(5),
            supabase.from('communities').select('id, name, description, member_count, category, icon_url').order('member_count', { ascending: false }).limit(5),
            supabase.from('internships').select('id, title, company, description, location, type, duration, stipend, deadline').or(`deadline.gte.${today},deadline.is.null`).neq('duration', 'Full-Time').order('created_at', { ascending: false }).limit(10),
            supabase.from('study_groups').select('id, subject, description, venue, meeting_time, max_members').order('created_at', { ascending: false }).limit(5)
          ])

          const unRSVPedEvents = (eventsRes.data || [])
            .filter((e: any) => !userRSVPsSet.has(e.id))
            .slice(0, 2)

          const unjoinedComms = (commsRes.data || [])
            .filter((c: any) => !userCommsSet.has(c.id))
            .slice(0, 2)

          const keywords = getBranchKeywords(profile?.branch)
          const branchInternships = keywords.length > 0
            ? (internshipsRes.data || []).filter((i: any) => {
                const title = (i.title || '').toLowerCase()
                const desc = (i.description || '').toLowerCase()
                return keywords.some((kw: any) => title.includes(kw) || desc.includes(kw))
              })
            : (internshipsRes.data || [])

          const unappliedInternships = branchInternships
            .filter((i: any) => !userAppsSet.has(i.id))
            .slice(0, 2)

          const unjoinedGroups = (groupsRes.data || [])
            .filter((g: any) => !userGroupsSet.has(g.id))
            .slice(0, 2)

          return {
            profileCompletion,
            missingFields,
            events: unRSVPedEvents,
            communities: unjoinedComms,
            internships: unappliedInternships,
            studyGroups: unjoinedGroups
          }
        }
        default:
          return null
      }
    } catch (err) {
      console.error('Error fetching direct data:', err)
      return null
    }
  }

  function getIntentText(intent: string): string {
    switch (intent) {
      case 'CAMPUS_EVENTS':
        return 'Here are the upcoming events scheduled on campus:'
      case 'USER_REGISTERED_EVENTS':
        return 'Here are the events you are currently registered for:'
      case 'CAMPUS_INTERNSHIPS':
        return 'Here are the active internship listings currently available:'
      case 'CAMPUS_INTERNSHIPS_BRANCH':
        return 'Here are active internships matching your branch profile:'
      case 'CAMPUS_PLACEMENTS':
        return 'Here are the active placement drives currently open for registrations:'
      case 'CAMPUS_COMMUNITIES':
        return 'Here are the clubs and communities active on CampusConnect:'
      case 'USER_COMMUNITIES':
        return 'Here are the communities you have joined:'
      case 'RECOMMEND_COMMUNITIES':
        return 'Based on active student memberships, here are communities we recommend you join:'
      case 'RECOMMEND_INTERNSHIPS':
        return 'Based on your academic branch, we recommend applying to these internships:'
      case 'RECOMMEND_STUDY_GROUPS':
        return 'Looking for peers? Here are study groups we suggest joining:'
      case 'CAMPUS_STUDY_GROUPS':
        return 'Here are active student study groups on campus:'
      case 'USER_STUDY_GROUPS':
        return 'Here are the study groups you are a member of:'
      case 'CAMPUS_NOTES':
        return 'Here are the recently uploaded study notes:'
      case 'CAMPUS_PAPERS':
        return 'Here are the exam past papers available in the library:'
      case 'CAMPUS_MARKETPLACE':
        return 'Here are the active marketplace listings on campus:'
      case 'USER_MARKETPLACE':
        return 'Here are the marketplace items you have listed for sale:'
      case 'USER_UNREAD_MESSAGES':
        return 'You have these unread messages in your inbox:'
      case 'USER_APPLICATIONS':
        return 'Here is the status of your internship and placement applications:'
      case 'USER_PROFILE_STATUS':
        return 'Here is your profile verification and rewards status:'
      case 'USER_PROFILE_COMPLETION':
        return 'Here is your profile completion status:'
      case 'COPILOT_DASHBOARD_INSIGHTS':
        return 'Here is your personalized Campus Copilot Action Plan:'
      default:
        return 'Query results:'
    }
  }

  const handleSend = async (text: string) => {
    if (!text.trim() || isGenerating) return
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString()
    }

    setMessages(prev => {
      const next = [...prev, userMsg]
      persistMessages(next)
      return next
    })
    setInput('')
    setLoading(true)
    setIsGenerating(true)

    const intent = classifyQuery(text)

    if (intent === 'GENERAL_AI') {
      setLoading(false)
      const q = text.toLowerCase().trim()
      let botResponse = ''

      if (q.includes('dbms normalization') || q.includes('database normalization') || q.includes('normalization')) {
        botResponse = `### DBMS Normalization
DBMS Normalization is the systematic process of organizing data in a database to avoid data redundancy and maintain data integrity. It involves dividing a database into two or more tables and defining relationships between them.

Here is a summary of the normal forms:
1. **First Normal Form (1NF):** Each table cell should contain only single (atomic) values. Eliminate repeating groups in individual tables.
2. **Second Normal Form (2NF):** Meet all requirements of 1NF. Remove subset data that applies to multiple rows of a table and place them in separate tables. There must be no partial dependency of any column on the primary key.
3. **Third Normal Form (3NF):** Meet all requirements of 2NF. Remove columns that do not depend on the primary key (no transitive functional dependencies).
4. **Boyce-Codd Normal Form (BCNF):** A stronger version of 3NF. For any dependency A -> B, A must be a super key.

#### Normalization Summary Table:
| Normal Form | Rule | Key Objective |
| :--- | :--- | :--- |
| **1NF** | Atomic values, unique column names | Eliminate duplicate columns |
| **2NF** | Meet 1NF, no partial dependency | Separate table for subset data |
| **3NF** | Meet 2NF, no transitive dependency | Eliminate columns not dependent on key |
| **BCNF** | For A -> B, A must be Super Key | Resolve anomalies in multi-valued keys |`
      } else if (q.includes('create a resume') || q.includes('create resume') || q.includes('resume template') || q.includes('resume')) {
        botResponse = `### Premium Markdown Resume Template
Here is a professional resume template structured in Markdown. You can copy and customize this to build your portfolio.

\`\`\`markdown
# [YOUR NAME]
📍 Greater Noida, UP | ✉️ email@iilm.edu | 📞 +91-XXXX-XXXXXX | 🔗 github.com/username

## EDUCATION
*   **IILM University**, B.Tech in Computer Science & Engineering (2023 - 2027)
    *   *CGPA:* 8.9/10.0
*   **High School**, CBSE Board (Graduated 2023)
    *   *Percentage:* 94.5%

## TECHNICAL SKILLS
*   **Languages:** JavaScript (ES6+), TypeScript, SQL (PostgreSQL), HTML5, CSS3
*   **Frameworks & Libraries:** React, Next.js, Node.js, Express, TailwindCSS
*   **Tools & Databases:** Supabase, Git/GitHub, VS Code, Postman, Jest

## PROJECTS
### CampusConnect (React, Next.js, Supabase)
*   Developed a campus social network enabling student communities, notes exchange, and careers hub.
*   Implemented Row-Level Security (RLS) policies on Supabase tables to secure student data.
*   Created a real-time chat application with message tracking.

## EXPERIENCES
### Frontend Web Developer Intern | TechCorp (Summer 2025)
*   Collaborated with backend engineers to integrate RESTful API endpoints.
*   Built responsive client interfaces using Next.js and TailwindCSS, improving load speed by 25%.
\`\`\``
      } else if (q.includes('machine learning') || q.includes('explain ml') || q.includes('explain machine learning')) {
        botResponse = `### Understanding Machine Learning
Machine Learning (ML) is a branch of artificial intelligence (AI) focused on building applications that learn from data and improve their accuracy over time without being explicitly programmed.

#### Three Main Categories of ML:
1. **Supervised Learning:**
   *   The algorithm is trained on labeled training data (input-output pairs).
   *   *Common Algorithms:* Linear Regression, Support Vector Machines (SVM), Decision Trees, Random Forest.
   *   *Examples:* Spam detection, house price prediction.
2. **Unsupervised Learning:**
   *   The algorithm is given unlabeled data and must find patterns or structures on its own.
   *   *Common Algorithms:* K-Means Clustering, Hierarchical Clustering, Principal Component Analysis (PCA).
   *   *Examples:* Customer segmentation, anomaly detection.
3. **Reinforcement Learning:**
   *   The algorithm learns by interacting with an environment, receiving rewards for good behavior and penalties for bad.
   *   *Common Algorithms:* Q-Learning, Deep Q-Networks (DQN).
   *   *Examples:* Autonomous driving, game playing (AlphaGo).

#### Key Workflow Steps:
- **Data Collection:** Gather representative samples.
- **Data Preprocessing:** Clean, normalize, and handle missing values.
- **Model Training:** Fit the algorithm on training data.
- **Model Evaluation:** Check accuracy on a test split.`
      } else {
        botResponse = `### Campus Copilot v2
I am your **Campus Copilot**, running securely on local CampusConnect database records. I do not forward your data to external APIs like Gemini or OpenAI.

I can help you navigate campus life with these direct commands:

- **Events**: 'Show upcoming events', 'Show my registered events'
- **Careers**: 'Show internships', 'Show internships for my branch', 'Show my applications'
- **Socials**: 'Show communities', 'Show my communities', 'Recommend communities'
- **Academics**: 'Show study groups', 'Show my study groups', 'Show recent notes', 'Show past papers'
- **Marketplace**: 'Show marketplace listings', 'Show my listings'
- **Profile**: 'Show profile status', 'Show profile completion %'
- **Action Plan**: 'What should I do next?'

Type any of these commands to start!`
      }
      
      const botMsgPlaceholder: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        dataType: 'general',
        dataIntent: intent
      }
      setMessages(prev => [...prev, botMsgPlaceholder])

      const words = botResponse.split(' ')
      let i = 0
      let currentText = ''
      const timer = setInterval(() => {
        if (i < words.length) {
          currentText += (i === 0 ? '' : ' ') + words[i]
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant') {
              const next = [...prev.slice(0, -1), { ...last, content: currentText }]
              if (i === words.length - 1) persistMessages(next)
              return next
            }
            return prev
          })
          i++
        } else {
          clearInterval(timer)
          setIsGenerating(false)
        }
      }, 10)
    } else {
      const data = await fetchDirectData(intent)
      setLoading(false)

      const isUserQuery = intent.startsWith('USER_') || intent.startsWith('RECOMMEND_') || intent === 'COPILOT_DASHBOARD_INSIGHTS'
      const botResponseText = getIntentText(intent)

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botResponseText,
        created_at: new Date().toISOString(),
        dataType: isUserQuery ? 'user' : 'campus',
        dataIntent: intent,
        payload: data
      }

      setMessages(prev => {
        const next = [...prev, botMsg]
        persistMessages(next)
        return next
      })
      setIsGenerating(false)
    }
  }

  const clearChat = () => {
    if (isGenerating) return
    const initial = [WELCOME_MSG]
    setMessages(initial)
    persistMessages(initial)
  }

  // --- Inline Action Handlers ---
  const handleRegisterEvent = async (msgId: string, eventId: string) => {
    if (!userId) return
    try {
      const { error } = await supabase.from('event_attendees').insert({
        event_id: eventId,
        user_id: userId
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Registered for event successfully!")
      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.payload) {
          if (m.dataIntent === 'COPILOT_DASHBOARD_INSIGHTS') {
            const up = { ...m.payload }
            if (up.events) {
              up.events = up.events.map((e: any) => e.id === eventId ? { ...e, isRegistered: true, attendee_count: (e.attendee_count || 0) + 1 } : e)
            }
            return { ...m, payload: up }
          }
          const updatedPayload = Array.isArray(m.payload)
            ? m.payload.map((e: any) => e.id === eventId ? { ...e, isRegistered: true, attendee_count: (e.attendee_count || 0) + 1 } : e)
            : m.payload
          return { ...m, payload: updatedPayload }
        }
        return m
      }))
    } catch (err: any) {
      toast.error(err.message || "Failed to register")
    }
  }

  const handleJoinCommunity = async (msgId: string, communityId: string) => {
    if (!userId) return
    try {
      const { error } = await supabase.from('community_members').insert({
        community_id: communityId,
        user_id: userId,
        role: 'member'
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Successfully joined the community!")
      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.payload) {
          if (m.dataIntent === 'COPILOT_DASHBOARD_INSIGHTS') {
            const up = { ...m.payload }
            if (up.communities) {
              up.communities = up.communities.map((c: any) => c.id === communityId ? { ...c, isJoined: true, member_count: (c.member_count || 0) + 1 } : c)
            }
            return { ...m, payload: up }
          }
          const updatedPayload = Array.isArray(m.payload)
            ? m.payload.map((c: any) => c.id === communityId ? { ...c, isJoined: true, member_count: (c.member_count || 0) + 1 } : c)
            : m.payload
          return { ...m, payload: updatedPayload }
        }
        return m
      }))
    } catch (err: any) {
      toast.error(err.message || "Failed to join community")
    }
  }

  const handleJoinStudyGroup = async (msgId: string, groupId: string) => {
    if (!userId) return
    try {
      const { error } = await supabase.from('study_group_members').insert({
        group_id: groupId,
        user_id: userId
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Joined study group successfully!")
      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.payload) {
          if (m.dataIntent === 'COPILOT_DASHBOARD_INSIGHTS') {
            const up = { ...m.payload }
            if (up.studyGroups) {
              up.studyGroups = up.studyGroups.map((g: any) => g.id === groupId ? { ...g, isJoined: true } : g)
            }
            return { ...m, payload: up }
          }
          const updatedPayload = Array.isArray(m.payload)
            ? m.payload.map((g: any) => g.id === groupId ? { ...g, isJoined: true } : g)
            : m.payload
          return { ...m, payload: updatedPayload }
        }
        return m
      }))
    } catch (err: any) {
      toast.error(err.message || "Failed to join study group")
    }
  }

  const handleApplyInternship = async (msgId: string, internship: any) => {
    if (!userId) return
    try {
      const { error } = await supabase.from('internship_applications').insert({
        internship_id: internship.id,
        user_id: userId,
        company: internship.company,
        role: internship.title,
        status: 'applied'
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`Applied to ${internship.title} at ${internship.company}!`)
      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.payload) {
          if (m.dataIntent === 'COPILOT_DASHBOARD_INSIGHTS') {
            const up = { ...m.payload }
            if (up.internships) {
              up.internships = up.internships.map((i: any) => i.id === internship.id ? { ...i, isApplied: true } : i)
            }
            return { ...m, payload: up }
          }
          const updatedPayload = Array.isArray(m.payload)
            ? m.payload.map((i: any) => i.id === internship.id ? { ...i, isApplied: true } : i)
            : m.payload
          return { ...m, payload: updatedPayload }
        }
        return m
      }))
    } catch (err: any) {
      toast.error(err.message || "Failed to apply")
    }
  }

  function renderEmptyState(title: string, subtext: string, path: string, cta: string) {
    return (
      <div className="p-5 rounded-2xl bg-zinc-900/25 border border-white/[0.06] flex flex-col items-center text-center max-w-sm mx-auto my-1">
        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-zinc-650 mb-3">
          <FolderOpen size={18} />
        </div>
        <h5 className="text-xs font-bold text-zinc-300 font-display">{title}</h5>
        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed px-2">{subtext}</p>
        <a
          href={path}
          className="mt-4 px-3.5 py-1.5 bg-[#0d121f]/70 border border-white/[0.08] hover:border-cyan-500/20 hover:bg-cyan-500/5 hover:text-white transition-all text-neutral-400 rounded-xl text-[10px] font-bold inline-flex items-center gap-1.5"
        >
          {cta} <ArrowRight size={10} />
        </a>
      </div>
    )
  }

  function renderStructuredData(msgId: string, intent: string | undefined, payload: any) {
    if (!intent) return null

    switch (intent) {
      case 'CAMPUS_EVENTS':
      case 'USER_REGISTERED_EVENTS': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("No Events", "There are no events matching your request.", "/events", "Browse Events")
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {payload.map((event: any) => (
              <div key={event.id} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-tight bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 font-bold">{event.category}</span>
                    <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 font-bold">RSVP: {event.attendee_count}</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 mt-2 font-display">{event.title}</h4>
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{event.description || 'No description provided.'}</p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
                  <div className="text-[10px] text-zinc-500 font-mono flex flex-col">
                    <span className="truncate">📍 {event.venue || 'TBD'}</span>
                    <span className="text-cyan-400 font-bold mt-0.5">{new Date(event.start_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a href="/events" className="px-2 py-1 bg-[#0d121f]/50 border border-white/[0.06] text-neutral-400 hover:text-white rounded text-[9px] font-bold transition-all">View</a>
                    {!event.isRegistered ? (
                      <button
                        onClick={() => handleRegisterEvent(msgId, event.id)}
                        className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                      >
                        Register
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">Registered</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
      case 'CAMPUS_INTERNSHIPS':
      case 'CAMPUS_INTERNSHIPS_BRANCH':
      case 'RECOMMEND_INTERNSHIPS': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("No Internships", "There are no active internships currently available.", "/internships", "Browse Portal")
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {payload.map((intern: any) => (
              <div key={intern.id} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-tight bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">{intern.type}</span>
                    {intern.deadline && (
                      <span className="text-[9px] font-mono text-zinc-500 font-semibold">Ends: {new Date(intern.deadline).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 mt-2 font-display">{intern.title}</h4>
                  <p className="text-[10px] text-cyan-400/90 font-bold">{intern.company}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{intern.description || 'No description.'}</p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
                  <div className="text-[10px] text-zinc-550 font-mono font-bold flex flex-col">
                    <span className="truncate">💼 {intern.stipend || 'Unpaid'}</span>
                    <span className="mt-0.5">⏱ {intern.duration || 'N/A'}</span>
                  </div>
                  {!intern.isApplied ? (
                    <button
                      onClick={() => handleApplyInternship(msgId, intern)}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                    >
                      Apply
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-bold">Applied</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
      case 'CAMPUS_PLACEMENTS': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("No Placement Drives", "There are no active placement drives currently open.", "/placements", "View Careers Dashboard")
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {payload.map((drive: any) => (
              <div key={drive.id} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-tight bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">FTE DRIVE</span>
                    {drive.deadline && (
                      <span className="text-[9px] font-mono text-zinc-500 font-semibold">Register by: {new Date(drive.deadline).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 mt-2 font-display">{drive.title}</h4>
                  <p className="text-[10px] text-cyan-400/90 font-bold">{drive.company}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{drive.description || 'No job description.'}</p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
                  <div className="text-[10px] text-zinc-550 font-mono font-bold flex flex-col">
                    <span className="truncate">💼 CTC: {drive.stipend || 'Not Disclosed'}</span>
                    <span className="mt-0.5">📍 {drive.location || 'On-site'}</span>
                  </div>
                  {!drive.isApplied ? (
                    <button
                      onClick={() => handleApplyInternship(msgId, drive)}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                    >
                      Apply
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-bold">Applied</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
      case 'CAMPUS_COMMUNITIES':
      case 'USER_COMMUNITIES':
      case 'RECOMMEND_COMMUNITIES': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("No Communities", "No communities matching your parameters were found.", "/community", "Find Communities")
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {payload.map((c: any) => (
              <div key={c.id} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100 font-display">{c.name}</h4>
                      <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-tight bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/20 font-bold">{c.category}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2 line-clamp-2">{c.description || 'No description.'}</p>
                </div>
                <div className="mt-3.5 pt-2 border-t border-white/[0.05] flex items-center justify-between font-mono font-bold">
                  <span className="text-[9px] text-zinc-550">👥 {c.member_count} members</span>
                  {!c.isJoined ? (
                    <button
                      onClick={() => handleJoinCommunity(msgId, c.id)}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                    >
                      Join
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-bold">Joined</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
      case 'CAMPUS_STUDY_GROUPS':
      case 'USER_STUDY_GROUPS':
      case 'RECOMMEND_STUDY_GROUPS': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("No Study Groups", "No study groups found on campus.", "/study", "Explore Study Groups")
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {payload.map((g: any) => (
              <div key={g.id} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">STUDY ROOM</span>
                  <h4 className="text-xs font-bold text-zinc-100 mt-2 font-display">{g.subject}</h4>
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{g.description || 'No description.'}</p>
                </div>
                <div className="mt-3.5 pt-2 border-t border-white/[0.05] flex items-center justify-between font-mono font-bold">
                  <div className="text-[9px] text-zinc-550 flex flex-col">
                    <span>📍 {g.venue || 'Online'}</span>
                    <span className="text-cyan-400 mt-0.5">{new Date(g.meeting_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                  {!g.isJoined ? (
                    <button
                      onClick={() => handleJoinStudyGroup(msgId, g.id)}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                    >
                      Join
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-bold">Joined</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
      case 'CAMPUS_MARKETPLACE':
      case 'USER_MARKETPLACE': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("No Items", "No items listed for sale in the marketplace.", "/marketplace", "Explore Shop")
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {payload.map((item: any) => (
              <div key={item.id} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-tight bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">{item.condition}</span>
                    <span className="text-[10px] font-mono text-zinc-100 font-bold">₹{item.price}</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 mt-2 font-display">{item.title}</h4>
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{item.description}</p>
                </div>
                <div className="mt-3.5 pt-2 border-t border-white/[0.05] flex items-center justify-between font-mono font-bold text-[9px] text-zinc-550">
                  <span>Category: {item.category}</span>
                  <a href="/marketplace" className="px-2.5 py-1 bg-[#0d121f]/50 border border-white/[0.06] text-neutral-400 hover:text-white rounded font-bold transition-all">View</a>
                </div>
              </div>
            ))}
          </div>
        )
      }
      case 'CAMPUS_NOTES': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("No Notes Found", "There are no academic notes uploaded yet.", "/notes", "Upload Notes")
        }
        return (
          <div className="space-y-2">
            {payload.map((note: any) => (
              <div key={note.id} className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">{note.course_code || 'ACAD'}</span>
                    <span className="text-[10px] text-zinc-500 truncate">{note.subject}</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 mt-1 truncate">{note.title}</h4>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{note.description || 'No description'}</p>
                </div>
                <a
                  href={note.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded-xl text-[10px] font-bold transition-all shrink-0 flex items-center gap-1 shadow-lg shadow-cyan-500/10 font-mono"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        )
      }
      case 'CAMPUS_PAPERS': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("No Papers Found", "There are no exam past papers uploaded yet.", "/papers", "Upload Papers")
        }
        return (
          <div className="space-y-2">
            {payload.map((paper: any) => (
              <div key={paper.id} className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">{paper.course_code || 'EXAM'}</span>
                    <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950/50 px-2 py-0.5 rounded border border-white/[0.03] font-bold">{paper.exam_year} • {paper.semester} Sem</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 mt-1 truncate">{paper.subject}</h4>
                  <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold">{paper.exam_type?.replace('_', ' ')}</span>
                </div>
                <a
                  href={paper.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded-xl text-[10px] font-bold transition-all shrink-0 flex items-center gap-1 shadow-lg font-mono"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        )
      }
      case 'USER_UNREAD_MESSAGES': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("Inbox Clean", "You have no unread messages.", "/messages", "Go to Messenger")
        }
        return (
          <div className="space-y-2">
            {payload.map((msg: any) => (
              <div key={msg.id} className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-indigo-500/30 transition-all flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                    <span className="text-xs font-bold text-zinc-100">{msg.profiles?.full_name || `@${msg.profiles?.username || 'user'}`}</span>
                    <span className="text-[9px] font-mono text-zinc-500 font-bold">{new Date(msg.created_at).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 truncate pl-4">&quot;{msg.content}&quot;</p>
                </div>
                <a
                  href="/messages"
                  className="px-3 py-1.5 bg-[#0d121f]/50 border border-white/[0.06] hover:text-white hover:bg-white/[0.03] text-neutral-400 rounded-xl text-[10px] font-bold transition-all shrink-0"
                >
                  Reply
                </a>
              </div>
            ))}
          </div>
        )
      }
      case 'USER_APPLICATIONS': {
        if (!payload || payload.length === 0) {
          return renderEmptyState("No Applications", "You haven't applied to any internships or placement drives yet.", "/internships", "Find Roles")
        }
        return (
          <div className="space-y-2">
            {payload.map((app: any, idx: number) => {
              const isIntern = app.type === 'Internship'
              const dateStr = new Date(app.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
              return (
                <div key={app.id || idx} className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-indigo-500/30 transition-all flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border",
                        isIntern 
                          ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" 
                          : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                      )}>
                        {app.type}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">Applied: {dateStr}</span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-100 mt-1 truncate">{app.company}</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate font-medium">Role: {app.role || 'Candidate'}</p>
                  </div>
                  <span className={clsx(
                    "px-2.5 py-1 rounded-xl text-[10px] font-bold border capitalize shrink-0 font-mono",
                    app.status === 'selected' || app.status === 'offer'
                      ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-400 font-black animate-pulse"
                      : app.status === 'shortlisted'
                      ? "bg-cyan-500/15 border-cyan-500/35 text-cyan-400"
                      : app.status === 'rejected'
                      ? "bg-red-500/15 border-red-500/35 text-red-400"
                      : "bg-zinc-500/10 border-white/[0.06] text-zinc-400"
                  )}>
                    {app.status}
                  </span>
                </div>
              )
            })}
          </div>
        )
      }
      case 'USER_PROFILE_STATUS': {
        if (!payload || !payload.profile) {
          return renderEmptyState("No Data", "Unable to load profile data.", "/profile", "Go to Profile")
        }
        const { profile: p, points: pts } = payload
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Profile Core */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tight font-bold">Identity Profile</span>
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-tight bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold">{p.role}</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 mt-2 font-display">{p.full_name}</h4>
                  <p className="text-[10px] text-zinc-400">@{p.username || 'username'}</p>
                  <p className="text-[10px] text-indigo-400 font-mono mt-1.5 font-bold">🎓 {p.colleges?.name || 'IILM Connect College'}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.05] grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-500">
                  <div>
                    <p className="text-[8px] uppercase text-zinc-600 font-bold">Branch & Year</p>
                    <p className="text-zinc-400 font-bold">{p.branch || 'N/A'}, Yr {p.year || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase text-zinc-600 font-bold">Roll Number</p>
                    <p className="text-zinc-400 font-bold">{p.roll_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Verification & Rewards */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tight font-bold">Status & Rewards</span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={clsx(
                      "text-[9px] font-mono uppercase tracking-tight px-1.5 py-0.5 rounded border flex items-center gap-0.5 font-bold",
                      p.is_verified 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                      Student: {p.is_verified ? 'Verified' : 'Pending'}
                    </span>
                    <span className={clsx(
                      "text-[9px] font-mono uppercase tracking-tight px-1.5 py-0.5 rounded border flex items-center gap-0.5 font-bold",
                      p.dating_verified 
                        ? "bg-pink-500/10 border-pink-500/20 text-pink-400" 
                        : "bg-zinc-800 border-white/[0.05] text-zinc-500"
                    )}>
                      Dating: {p.dating_verified ? 'Verified' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3.5">
                    <div>
                      <p className="text-[8px] uppercase text-zinc-600 font-mono font-bold">Rewards Balance</p>
                      <p className="text-sm font-black text-cyan-400 font-mono">🏆 {pts?.total || 0} pts</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase text-zinc-600 font-mono font-bold">Level</p>
                      <p className="text-xs font-bold text-zinc-300 font-mono">Lv. {pts?.level || 1}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase text-zinc-600 font-mono font-bold">Streak</p>
                      <p className="text-xs font-bold text-amber-400 font-mono">🔥 {pts?.streak_days || 0} days</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.05] text-[9px] text-zinc-650 font-mono">
                  Last Active: {pts?.last_active || 'Today'}
                </div>
              </div>
            </div>
          </div>
        )
      }
      case 'USER_PROFILE_COMPLETION': {
        const { pct, missing } = payload
        return (
          <div className="card-premium p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-4">
            <div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                <span className="font-bold">Profile Completion</span>
                <span className="font-mono text-cyan-400 font-bold">{pct}%</span>
              </div>
              <div className="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.03]">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {missing.length > 0 ? (
              <div>
                <h5 className="text-[10px] text-zinc-350 font-mono uppercase font-black tracking-wider">Missing Fields:</h5>
                <ul className="mt-1.5 space-y-1 pl-1">
                  {missing.map((field: string, idx: number) => (
                    <li key={idx} className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-sans font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl w-fit font-bold">
                <ShieldCheck size={12} /> Profile 100% complete!
              </div>
            )}
          </div>
        )
      }
      case 'COPILOT_DASHBOARD_INSIGHTS': {
        const { profileCompletion, missingFields, events, communities, internships, studyGroups } = payload
        return (
          <div className="space-y-4 max-w-4xl">
            {/* Profile Completion bar */}
            <div className="card-premium p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-150 font-display">
                  <Trophy size={14} className="text-cyan-400 animate-pulse" />
                  Campus Connect Action Plan
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-400">{profileCompletion}% Complete</span>
              </div>
              <div className="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" style={{ width: `${profileCompletion}%` }} />
              </div>
              {missingFields.length > 0 && (
                <p className="text-[9px] text-zinc-500">
                  💡 Boost your profile by filling in: <span className="text-zinc-400 font-bold">{missingFields.slice(0, 3).join(', ')}</span>
                </p>
              )}
            </div>

            {/* Grid sections for suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Events section */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-mono uppercase font-black text-zinc-400 flex items-center gap-1.5 px-1">
                  <Calendar size={10} className="text-cyan-400" /> Upcoming Events
                </h5>
                {events.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-zinc-900/10 border border-dashed border-white/[0.04] text-center text-[9px] text-zinc-550">No new events</div>
                ) : (
                  events.map((e: any) => (
                    <div key={e.id} className="p-3 rounded-xl bg-zinc-900/30 border border-white/[0.05] flex flex-col justify-between min-h-[96px] hover:border-cyan-500/20 transition-all">
                      <div>
                        <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{e.title}</h6>
                        <p className="text-[8px] text-zinc-500 mt-0.5 font-mono">📍 {e.venue || 'Campus'}</p>
                      </div>
                      <div className="mt-2.5 pt-1.5 border-t border-white/[0.03] flex items-center justify-between">
                        <span className="text-[8px] font-mono text-cyan-400 font-bold">{new Date(e.start_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        {e.isRegistered ? (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">Registered</span>
                        ) : (
                          <button
                            onClick={() => handleRegisterEvent(msgId, e.id)}
                            className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded text-[8px] font-bold font-mono transition-all"
                          >
                            Register
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Internships section */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-mono uppercase font-black text-zinc-400 flex items-center gap-1.5 px-1">
                  <Briefcase size={10} className="text-cyan-400" /> Suggested Careers
                </h5>
                {internships.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-zinc-900/10 border border-dashed border-white/[0.04] text-center text-[9px] text-zinc-550">No match internships</div>
                ) : (
                  internships.map((i: any) => (
                    <div key={i.id} className="p-3 rounded-xl bg-zinc-900/30 border border-white/[0.05] flex flex-col justify-between min-h-[96px] hover:border-cyan-500/20 transition-all">
                      <div>
                        <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{i.title}</h6>
                        <p className="text-[8px] text-cyan-400 font-medium">{i.company}</p>
                      </div>
                      <div className="mt-2.5 pt-1.5 border-t border-white/[0.03] flex items-center justify-between">
                        <span className="text-[8px] font-mono text-zinc-550">{i.location || 'Hybrid'}</span>
                        {i.isApplied ? (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">Applied</span>
                        ) : (
                          <button
                            onClick={() => handleApplyInternship(msgId, i)}
                            className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded text-[8px] font-bold font-mono transition-all"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Communities section */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-mono uppercase font-black text-zinc-400 flex items-center gap-1.5 px-1">
                  <Users size={10} className="text-indigo-400" /> Communities to Join
                </h5>
                {communities.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-zinc-900/10 border border-dashed border-white/[0.04] text-center text-[9px] text-zinc-550">No suggested clubs</div>
                ) : (
                  communities.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-xl bg-zinc-900/30 border border-white/[0.05] flex flex-col justify-between min-h-[96px] hover:border-indigo-500/20 transition-all">
                      <div>
                        <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{c.name}</h6>
                        <p className="text-[8px] text-zinc-500 font-mono">👥 {c.member_count} members</p>
                      </div>
                      <div className="mt-2.5 pt-1.5 border-t border-white/[0.03] flex items-center justify-between">
                        <span className="text-[8px] font-mono text-indigo-400 font-semibold uppercase">{c.category}</span>
                        {c.isJoined ? (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">Joined</span>
                        ) : (
                          <button
                            onClick={() => handleJoinCommunity(msgId, c.id)}
                            className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded text-[8px] font-bold font-mono transition-all"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Study Groups section */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-mono uppercase font-black text-zinc-400 flex items-center gap-1.5 px-1">
                  <BookOpen size={10} className="text-indigo-400" /> Study Rooms
                </h5>
                {studyGroups.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-zinc-900/10 border border-dashed border-white/[0.04] text-center text-[9px] text-zinc-550">No study groups</div>
                ) : (
                  studyGroups.map((g: any) => (
                    <div key={g.id} className="p-3 rounded-xl bg-zinc-900/30 border border-white/[0.05] flex flex-col justify-between min-h-[96px] hover:border-indigo-500/20 transition-all">
                      <div>
                        <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{g.subject}</h6>
                        <p className="text-[8px] text-zinc-500 line-clamp-1 mt-0.5">{g.description || 'No desc'}</p>
                      </div>
                      <div className="mt-2.5 pt-1.5 border-t border-white/[0.03] flex items-center justify-between">
                        <span className="text-[8px] font-mono text-zinc-550">📍 {g.venue || 'Online'}</span>
                        {g.isJoined ? (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">Joined</span>
                        ) : (
                          <button
                            onClick={() => handleJoinStudyGroup(msgId, g.id)}
                            className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-105 active:scale-95 text-white rounded text-[8px] font-bold font-mono transition-all"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div className="h-[calc(100vh-140px)] border border-white/[0.08] bg-[#090d16]/30 backdrop-blur-3xl rounded-3xl overflow-hidden flex flex-col shadow-2xl relative max-w-5xl mx-auto">
      {/* Glow effects */}
      <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-cyan-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="h-[73px] px-6 border-b border-white/[0.05] flex items-center justify-between bg-[#030712]/30 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Bot className="text-white animate-pulse" size={20} />
          </div>
          <div>
            <h2 className="font-display font-black text-sm text-white tracking-tight flex items-center gap-2">
              Campus Copilot
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-400 font-bold">
                <Sparkles size={8} /> V2 LOCAL
              </span>
            </h2>
            <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">Rule-based Recommendation Engine</p>
          </div>
        </div>

        <button 
          onClick={clearChat}
          disabled={isGenerating}
          className="p-2 bg-[#0d121f]/50 border border-white/[0.06] rounded-xl text-neutral-400 hover:text-white transition-colors hover:bg-white/[0.03] disabled:opacity-50"
          title="Reset conversation"
        >
          <RefreshCw size={14} />
        </button>
      </header>

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#090d16]/10 to-[#030712]/30 flex flex-col justify-between">
        
        <div className="space-y-6 flex-1">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isBot = m.role === 'assistant'
              return (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "flex items-start gap-3.5 max-w-4xl w-full",
                    isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                  )}
                >
                  <div className={clsx(
                    "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border",
                    isBot 
                      ? "bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 border-cyan-500/20 text-cyan-400" 
                      : "bg-zinc-950 border-white/[0.05] text-indigo-400"
                  )}>
                    {isBot ? <Bot size={15} /> : <User size={15} />}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className={clsx(
                      "px-4 py-3 rounded-2xl leading-relaxed shadow-lg text-xs font-medium border max-w-3xl",
                      isBot 
                        ? "bg-[#0d121f]/75 border-white/[0.08]" 
                        : "bg-gradient-to-br from-cyan-600/90 to-blue-600/90 text-white border-transparent"
                    )}>
                      {isBot ? parseMarkdown(m.content) : parseBold(m.content)}
                    </div>

                    {/* Display structured result tags and cards */}
                    {isBot && m.dataType && m.payload && (
                      <div className="mt-3.5 space-y-2.5 max-w-4xl">
                        <div className="flex items-center gap-2 px-1">
                          <span className={clsx(
                            "text-[8px] font-mono font-black tracking-wider uppercase px-2 py-0.5 rounded-md border",
                            m.dataType === 'campus' 
                              ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" 
                              : m.dataType === 'user'
                              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                              : "bg-zinc-900 border-white/[0.05] text-zinc-500"
                          )}>
                            {m.dataType === 'campus' ? 'Campus Results' : m.dataType === 'user' ? 'User Results' : 'AI Response'}
                          </span>
                        </div>
                        {renderStructuredData(m.id, m.dataIntent, m.payload)}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {loading && (
            <div className="flex items-start gap-3.5 mr-auto max-w-xl">
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 border-cyan-500/20 text-cyan-400">
                <Bot size={15} />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#0d121f]/75 border border-white/[0.08] flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Cards */}
        {messages.length === 1 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-4xl mx-auto pt-8">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt.text)}
                className="p-4 rounded-2xl bg-[#0d121f]/35 border border-white/[0.06] hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
              >
                <span className="text-xl shrink-0">{prompt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-300 group-hover:text-white truncate transition-colors">{prompt.text}</p>
                  <p className="text-[10px] text-neutral-500 mt-1 font-mono uppercase tracking-tight flex items-center gap-1 font-bold">
                    Ask AI <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input container */}
      <footer className="p-4 border-t border-white/[0.05] bg-[#030712]/30 backdrop-blur-xl">
        <div className="flex items-center gap-3 relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend(input)
            }}
            placeholder="Type a campus command..."
            className="flex-1 bg-[#0d121f]/50 border border-white/[0.06] focus:border-cyan-500/50 rounded-xl px-4 py-3.5 text-xs text-zinc-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
          />

          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isGenerating}
            className="p-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shrink-0 flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </div>
      </footer>
    </div>
  )
}
