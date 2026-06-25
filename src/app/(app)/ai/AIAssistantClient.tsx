'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Bot, Send, Sparkles, User, RefreshCw, AlertCircle, ArrowRight,
  Calendar, Briefcase, FileText, ShoppingBag, BookOpen, MessageSquare, 
  Compass, ShieldAlert, GraduationCap, Trophy, Users, ShieldCheck, 
  MailOpen, Lock, FolderOpen, Pin, PinOff, Trash2, Edit3, Check, X,
  ThumbsUp, ThumbsDown, Copy, Plus, Menu, Search, ImageIcon, StopCircle, CornerUpLeft
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { useAutoAnimate } from '@formkit/auto-animate/react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  dataType?: 'campus' | 'user' | 'general'
  dataIntent?: string
  payload?: any
  feedback?: 'like' | 'dislike'
}

interface ChatThread {
  id: string
  title: string
  messages: ChatMessage[]
  created_at: string
  isPinned?: boolean
}

const WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Welcome! I am your **Campus Copilot v2**, powered exclusively by secure local data. Ask me for recommendations, event registrations, matching internships, marketplace items, or check your dashboard action plan!',
  created_at: '2026-06-24T12:00:00.000Z',
  dataType: 'general'
}

const CAMPUS_PROMPTS = [
  { text: 'Show upcoming events', icon: '📅', desc: 'Find campus meetups and schedule' },
  { text: 'Show internships for my branch', icon: '💼', desc: 'Get roles tailored to your studies' },
  { text: 'Recommend communities for me', icon: '⚡', desc: 'Discover student clubs to join' },
  { text: 'What should I do next?', icon: '🚀', desc: 'Get your personalized campus action plan' },
  { text: 'Explain ML', icon: '🤖', desc: 'Quick overview of machine learning concepts' },
  { text: 'DBMS Normalization', icon: '📊', desc: 'Cheatsheet table of 1NF, 2NF, 3NF & BCNF' }
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
  const parts: { type: 'code' | 'table' | 'text'; content: string; language?: string }[] = []
  
  let currentPos = 0
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let match
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(currentPos, match.index)
    if (textBefore.trim()) {
      parts.push({ type: 'text', content: textBefore })
    }
    parts.push({ type: 'code', content: match[2], language: match[1] })
    currentPos = codeBlockRegex.lastIndex
  }
  
  const textAfter = text.slice(currentPos)
  if (textAfter.trim() || parts.length === 0) {
    parts.push({ type: 'text', content: textAfter })
  }
  
  return (
    <div className="space-y-3.5 text-left font-sans">
      {parts.map((part, partIdx) => {
        if (part.type === 'code') {
          return (
            <div key={partIdx} className="rounded-xl overflow-hidden border border-white/[0.08] bg-zinc-950/70 my-3">
              <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.05] text-[10px] font-mono text-zinc-500 select-none">
                <span>{part.language || 'code'}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(part.content)
                    toast.success('Code copied to clipboard!')
                  }}
                  className="hover:text-white transition-colors uppercase font-bold flex items-center gap-1"
                >
                  <Copy size={10} /> Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[11px] font-mono text-cyan-300/90 leading-relaxed bg-[#050811]/30">
                <code>{part.content}</code>
              </pre>
            </div>
          )
        }
        
        const lines = part.content.split('\n')
        const renderedElements: React.ReactNode[] = []
        let tableLines: string[] = []
        let inTable = false
        
        const flushTable = (key: number) => {
          if (tableLines.length === 0) return null
          
          const rows = tableLines.map(line => 
            line.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          )
          
          tableLines = []
          if (rows.length < 1) return null
          
          const headers = rows[0]
          const dataRows = rows.slice(2)
          
          return (
            <div key={`table-${key}`} className="overflow-x-auto my-4 rounded-xl border border-white/[0.08] bg-white/[0.01]">
              <table className="min-w-full text-[11px] font-medium text-zinc-300">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.06] text-left">
                    {headers.map((h, i) => (
                      <th key={i} className="px-4 py-2.5 font-bold text-white uppercase tracking-wider">{parseBold(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {dataRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-white/[0.01] transition-colors">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2.5">{parseBold(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        
        lines.forEach((line, lineIdx) => {
          const cleanLine = line.trim()
          if (cleanLine.startsWith('|')) {
            inTable = true
            tableLines.push(line)
          } else {
            if (inTable) {
              const tbl = flushTable(lineIdx)
              if (tbl) renderedElements.push(tbl)
              inTable = false
            }
            
            if (!cleanLine) {
              renderedElements.push(<div key={lineIdx} className="h-2" />)
              return
            }
            
            if (cleanLine.startsWith('### ')) {
              renderedElements.push(
                <h3 key={lineIdx} className="text-xs font-bold text-white tracking-tight mt-4 mb-1.5 uppercase font-mono border-b border-white/[0.04] pb-1">
                  {cleanLine.slice(4)}
                </h3>
              )
              return
            }
            if (cleanLine.startsWith('## ')) {
              renderedElements.push(
                <h2 key={lineIdx} className="text-sm font-black text-white mt-5 mb-2 border-b border-white/[0.06] pb-1.5">
                  {cleanLine.slice(3)}
                </h2>
              )
              return
            }
            if (cleanLine.startsWith('# ')) {
              renderedElements.push(
                <h1 key={lineIdx} className="text-base font-black text-white mt-6 mb-3">
                  {cleanLine.slice(2)}
                </h1>
              )
              return
            }
            
            if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
              renderedElements.push(
                <div key={lineIdx} className="flex items-start gap-2 pl-2 my-1">
                  <span className="text-cyan-400 mt-2 shrink-0 w-1 h-1 rounded-full bg-cyan-400" />
                  <p className="text-[12px] text-zinc-300 leading-relaxed flex-1">{parseBold(cleanLine.slice(2))}</p>
                </div>
              )
              return
            }
            
            const numMatch = cleanLine.match(/^(\d+)\.\s(.*)$/)
            if (numMatch) {
              renderedElements.push(
                <div key={lineIdx} className="flex items-start gap-2 pl-2 my-1">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 mt-0.5 shrink-0">{numMatch[1]}.</span>
                  <p className="text-[12px] text-zinc-300 leading-relaxed flex-1">{parseBold(numMatch[2])}</p>
                </div>
              )
              return
            }
            
            renderedElements.push(
              <p key={lineIdx} className="text-[12px] text-zinc-300 leading-relaxed">
                {parseBold(cleanLine)}
              </p>
            )
          }
        })
        
        if (inTable) {
          const tbl = flushTable(lines.length)
          if (tbl) renderedElements.push(tbl)
        }
        
        return <div key={partIdx} className="space-y-1.5">{renderedElements}</div>
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

const THREADS_STORAGE_KEY = 'ai_assistant_threads'
const ACTIVE_THREAD_KEY = 'ai_assistant_active_thread_id'

export default function AIAssistantClient() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [collegeId, setCollegeId] = useState<string | null>(null)

  // Threads states
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadSearch, setThreadSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Renaming chat state
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Textarea input and streaming states
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(false)

  // Attachment placeholder state
  const [dragActive, setDragActive] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [parentThreads] = useAutoAnimate()
  const [parentMessages] = useAutoAnimate()

  // Load threads on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THREADS_STORAGE_KEY)
      const storedActive = localStorage.getItem(ACTIVE_THREAD_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatThread[]
        setThreads(parsed)
        if (storedActive && parsed.some(t => t.id === storedActive)) {
          setActiveThreadId(storedActive)
        } else if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id)
        }
      } else {
        // Create initial default thread
        const defaultThread: ChatThread = {
          id: 'default-thread',
          title: 'Campus Copilot Session',
          messages: [WELCOME_MSG],
          created_at: new Date().toISOString()
        }
        setThreads([defaultThread])
        setActiveThreadId(defaultThread.id)
        localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify([defaultThread]))
        localStorage.setItem(ACTIVE_THREAD_KEY, defaultThread.id)
      }
    } catch {
      const defaultThread: ChatThread = {
        id: 'default-thread',
        title: 'Campus Copilot Session',
        messages: [WELCOME_MSG],
        created_at: new Date().toISOString()
      }
      setThreads([defaultThread])
      setActiveThreadId(defaultThread.id)
    }
  }, [])

  // Auto-grow Textarea height adjustment
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  // Get active thread
  const activeThread = useMemo(() => {
    return threads.find(t => t.id === activeThreadId) || null
  }, [threads, activeThreadId])

  // Get messages of active thread
  const messages = useMemo(() => {
    return activeThread?.messages || []
  }, [activeThread])

  // Save threads helper
  const saveThreads = (updatedThreads: ChatThread[]) => {
    setThreads(updatedThreads)
    try {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updatedThreads))
    } catch (e) {
      console.error(e)
    }
  }

  // Session Init
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

  // Auto Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, isGenerating])

  // Query Classifier (keeps original rules)
  function classifyQuery(query: string): string {
    const q = query.toLowerCase().trim()
    const cleanQ = q.replace(/[?.!,]/g, '').trim()

    if (cleanQ.includes('what should i do next') || cleanQ === 'what next' || cleanQ.includes('action plan')) {
      return 'COPILOT_DASHBOARD_INSIGHTS'
    }

    if (cleanQ.includes('recommend communities') || cleanQ.includes('recommend community')) {
      return 'RECOMMEND_COMMUNITIES'
    }
    if (cleanQ.includes('recommend internships') || cleanQ.includes('recommend internship') || cleanQ.includes('recommend roles') || cleanQ.includes('recommend jobs')) {
      return 'RECOMMEND_INTERNSHIPS'
    }
    if (cleanQ.includes('recommend study groups') || cleanQ.includes('recommend study group')) {
      return 'RECOMMEND_STUDY_GROUPS'
    }

    if (cleanQ.includes('registered events') || (cleanQ.includes('my') && cleanQ.includes('events') && cleanQ.includes('register'))) {
      return 'USER_REGISTERED_EVENTS'
    }
    if (cleanQ.includes('upcoming events') || (cleanQ.includes('event') && cleanQ.includes('upcoming')) || cleanQ === 'show events' || cleanQ === 'events') {
      return 'CAMPUS_EVENTS'
    }

    if (cleanQ.includes('internships for my branch') || cleanQ.includes('internship for my branch') || cleanQ.includes('branch internships')) {
      return 'CAMPUS_INTERNSHIPS_BRANCH'
    }
    if (cleanQ.includes('internships') || cleanQ.includes('active internships') || cleanQ === 'show internships') {
      return 'CAMPUS_INTERNSHIPS'
    }
    if (cleanQ.includes('applications') || cleanQ.includes('my applications') || cleanQ === 'applied internships') {
      return 'USER_APPLICATIONS'
    }

    if (cleanQ.includes('my communities') || cleanQ.includes('communities i joined')) {
      return 'USER_COMMUNITIES'
    }
    if (cleanQ.includes('communities') || cleanQ === 'show communities') {
      return 'CAMPUS_COMMUNITIES'
    }

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

    if (cleanQ.includes('my listings') || cleanQ.includes('my marketplace') || cleanQ.includes('items i listed')) {
      return 'USER_MARKETPLACE'
    }
    if (cleanQ.includes('marketplace listings') || cleanQ.includes('marketplace') || cleanQ === 'show marketplace') {
      return 'CAMPUS_MARKETPLACE'
    }

    if (cleanQ.includes('profile completion')) {
      return 'USER_PROFILE_COMPLETION'
    }
    if (cleanQ.includes('profile status') || cleanQ === 'profile' || cleanQ === 'my status') {
      return 'USER_PROFILE_STATUS'
    }

    if (cleanQ.includes('unread messages') || (cleanQ.includes('messages') && cleanQ.includes('unread'))) {
      return 'USER_UNREAD_MESSAGES'
    }

    return 'GENERAL_AI'
  }

  // Database fetcher (keeps original logic)
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

  // Helper Intent title texts (keeps original logic)
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

  // Handle Send action
  const handleSend = async (text: string) => {
    if (!text.trim() || isGenerating) return
    if (!activeThreadId) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString()
    }

    // Clear textarea height and value
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Append message to active thread
    const activeThr = threads.find(t => t.id === activeThreadId)
    if (!activeThr) return

    let updatedMessages = [...activeThr.messages, userMsg]
    
    // Automatically rename the thread if it was just created (default title)
    let updatedTitle = activeThr.title
    if (activeThr.title === 'New Chat' || activeThr.title === 'Campus Copilot Session') {
      updatedTitle = text.length > 25 ? text.substring(0, 25) + '...' : text
    }

    const updatedThread = {
      ...activeThr,
      title: updatedTitle,
      messages: updatedMessages
    }

    const nextThreads = threads.map(t => t.id === activeThreadId ? updatedThread : t)
    saveThreads(nextThreads)

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

      const activeThrWithBot = threads.find(t => t.id === activeThreadId)
      if (!activeThrWithBot) return
      let finalMessages = [...activeThrWithBot.messages, botMsgPlaceholder]
      saveThreads(threads.map(t => t.id === activeThreadId ? { ...activeThrWithBot, messages: finalMessages } : t))

      const words = botResponse.split(' ')
      let i = 0
      let currentText = ''
      
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)
      
      streamIntervalRef.current = setInterval(() => {
        if (i < words.length) {
          currentText += (i === 0 ? '' : ' ') + words[i]
          setThreads(prev => {
            const currentThreadItem = prev.find(t => t.id === activeThreadId)
            if (!currentThreadItem) return prev
            
            const updatedMsgs = currentThreadItem.messages.map((m, idx) => {
              if (idx === currentThreadItem.messages.length - 1 && m.role === 'assistant') {
                return { ...m, content: currentText }
              }
              return m
            })
            
            const nextList = prev.map(t => t.id === activeThreadId ? { ...currentThreadItem, messages: updatedMsgs } : t)
            if (i === words.length - 1) {
              try { localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(nextList)) } catch {}
            }
            return nextList
          })
          i++
        } else {
          if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)
          setIsGenerating(false)
        }
      }, 25)
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

      const activeThrWithBot = threads.find(t => t.id === activeThreadId)
      if (activeThrWithBot) {
        const finalList = [...activeThrWithBot.messages, botMsg]
        saveThreads(threads.map(t => t.id === activeThreadId ? { ...activeThrWithBot, messages: finalList } : t))
      }
      setIsGenerating(false)
    }
  }

  // Stop current text generation
  const stopGeneration = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
    }
    setIsGenerating(false)
    toast.success('Generation stopped.')
  }

  // Regenerate last assistant response
  const regenerateLastResponse = () => {
    if (isGenerating || !activeThread || messages.length < 2) return
    
    // Find last user message
    let lastUserMsgIdx = -1
    for (let idx = messages.length - 1; idx >= 0; idx--) {
      if (messages[idx].role === 'user') {
        lastUserMsgIdx = idx
        break
      }
    }
    
    if (lastUserMsgIdx === -1) return

    const userMessageContent = messages[lastUserMsgIdx].content
    
    // Slice up to the last user message (including it)
    const messagesBefore = messages.slice(0, lastUserMsgIdx + 1)
    
    const updatedThread = {
      ...activeThread,
      messages: messagesBefore
    }
    
    const nextThreads = threads.map(t => t.id === activeThreadId ? updatedThread : t)
    saveThreads(nextThreads)
    
    // Trigger handleSend again
    handleSend(userMessageContent)
  }

  // Clear chat logs in current thread
  const clearChat = () => {
    if (isGenerating || !activeThreadId) return
    const updatedThread = {
      ...activeThread!,
      messages: [WELCOME_MSG]
    }
    saveThreads(threads.map(t => t.id === activeThreadId ? updatedThread : t))
    toast.success('Chat cleared.')
  }

  // Create new thread conversation
  const createNewThread = () => {
    if (isGenerating) return
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [WELCOME_MSG],
      created_at: new Date().toISOString()
    }
    const nextThreads = [newThread, ...threads]
    saveThreads(nextThreads)
    setActiveThreadId(newThread.id)
    localStorage.setItem(ACTIVE_THREAD_KEY, newThread.id)
    toast.success('New chat started!')
  }

  // Delete specific conversation thread
  const deleteThread = (threadId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isGenerating) return
    
    const updatedThreads = threads.filter(t => t.id !== threadId)
    if (updatedThreads.length === 0) {
      const fallbackThread: ChatThread = {
        id: 'default-thread',
        title: 'Campus Copilot Session',
        messages: [WELCOME_MSG],
        created_at: new Date().toISOString()
      }
      saveThreads([fallbackThread])
      setActiveThreadId(fallbackThread.id)
      localStorage.setItem(ACTIVE_THREAD_KEY, fallbackThread.id)
    } else {
      saveThreads(updatedThreads)
      if (activeThreadId === threadId) {
        setActiveThreadId(updatedThreads[0].id)
        localStorage.setItem(ACTIVE_THREAD_KEY, updatedThreads[0].id)
      }
    }
    toast.success('Chat deleted.')
  }

  // Pin/Unpin thread
  const togglePinThread = (threadId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = threads.map(t => {
      if (t.id === threadId) {
        return { ...t, isPinned: !t.isPinned }
      }
      return t
    })
    saveThreads(updated)
    toast.success(threads.find(t => t.id === threadId)?.isPinned ? 'Chat unpinned' : 'Chat pinned')
  }

  // Start renaming thread
  const startRename = (thread: ChatThread, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingThreadId(thread.id)
    setEditingTitle(thread.title)
  }

  // Commit rename
  const saveRename = (threadId: string) => {
    if (!editingTitle.trim()) return
    const updated = threads.map(t => {
      if (t.id === threadId) {
        return { ...t, title: editingTitle.trim() }
      }
      return t
    })
    saveThreads(updated)
    setEditingThreadId(null)
    toast.success('Chat renamed.')
  }

  // Toggle feedback
  const toggleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    if (!activeThread) return
    const updatedMsgs = activeThread.messages.map(m => {
      if (m.id === msgId) {
        const prevFeedback = m.feedback
        return { ...m, feedback: prevFeedback === type ? undefined : type }
      }
      return m
    })
    saveThreads(threads.map(t => t.id === activeThreadId ? { ...t, messages: updatedMsgs } : t))
    toast.success('Thank you for your feedback!')
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
      if (activeThread) {
        const updatedMsgs = activeThread.messages.map(m => {
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
        })
        saveThreads(threads.map(t => t.id === activeThreadId ? { ...t, messages: updatedMsgs } : t))
      }
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
      if (activeThread) {
        const updatedMsgs = activeThread.messages.map(m => {
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
        })
        saveThreads(threads.map(t => t.id === activeThreadId ? { ...t, messages: updatedMsgs } : t))
      }
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
      if (activeThread) {
        const updatedMsgs = activeThread.messages.map(m => {
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
        })
        saveThreads(threads.map(t => t.id === activeThreadId ? { ...t, messages: updatedMsgs } : t))
      }
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
      if (activeThread) {
        const updatedMsgs = activeThread.messages.map(m => {
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
        })
        saveThreads(threads.map(t => t.id === activeThreadId ? { ...t, messages: updatedMsgs } : t))
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to apply")
    }
  }

  // File drag-n-drop handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachedFile(e.dataTransfer.files[0])
      toast.success(`Attached file: ${e.dataTransfer.files[0].name}`)
    }
  }

  // Keyboard shortcut listener inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setInput('')
    }
  }

  // Filter threads for search
  const filteredThreads = useMemo(() => {
    if (!threadSearch.trim()) return threads
    return threads.filter(t => t.title.toLowerCase().includes(threadSearch.toLowerCase()))
  }, [threads, threadSearch])

  // Split threads by Pinned vs Recent
  const pinnedThreads = useMemo(() => filteredThreads.filter(t => t.isPinned), [filteredThreads])
  const recentThreads = useMemo(() => filteredThreads.filter(t => !t.isPinned), [filteredThreads])

  // Custom Structured Data Cards (retains original look elevated)
  function renderEmptyState(title: string, subtext: string, path: string, cta: string) {
    return (
      <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.05] flex flex-col items-center text-center max-w-sm mx-auto my-2 select-none">
        <div className="w-9 h-9 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-zinc-500 mb-2">
          <FolderOpen size={16} />
        </div>
        <h5 className="text-[11px] font-bold text-zinc-300 font-display">{title}</h5>
        <p className="text-[9.5px] text-zinc-500 mt-1 leading-relaxed px-2">{subtext}</p>
        <a
          href={path}
          className="mt-3 px-3 py-1.5 bg-[#0d121f] border border-white/[0.06] hover:border-cyan-500/20 hover:bg-cyan-500/5 hover:text-white transition-all text-neutral-400 rounded-lg text-[9px] font-bold inline-flex items-center gap-1.5"
        >
          {cta} <ArrowRight size={8} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {payload.map((event: any) => (
              <div key={event.id} className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[8.5px] font-mono text-cyan-400 uppercase tracking-tight bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/15 font-bold">{event.category}</span>
                    <span className="text-[8.5px] font-mono text-zinc-500 flex items-center gap-1">RSVP: {event.attendee_count}</span>
                  </div>
                  <h4 className="text-[11px] font-bold text-zinc-200 mt-2 font-display">{event.title}</h4>
                  <p className="text-[9.5px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{event.description || 'No description provided.'}</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between">
                  <div className="text-[9px] text-zinc-550 font-mono flex flex-col">
                    <span className="truncate">📍 {event.venue || 'TBD'}</span>
                    <span className="text-cyan-400 font-bold mt-0.5">{new Date(event.start_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <a href="/events" className="px-2 py-1 bg-[#0d121f] border border-white/[0.06] text-neutral-400 hover:text-white rounded text-[9px] font-bold transition-all">View</a>
                    {!event.isRegistered ? (
                      <button
                        onClick={() => handleRegisterEvent(msgId, event.id)}
                        className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                      >
                        Register
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 font-bold">Registered</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {payload.map((intern: any) => (
              <div key={intern.id} className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[8.5px] font-mono text-cyan-400 uppercase tracking-tight bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/15 font-bold">{intern.type}</span>
                    {intern.deadline && (
                      <span className="text-[8.5px] font-mono text-zinc-500">Ends: {new Date(intern.deadline).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-bold text-zinc-200 mt-2 font-display">{intern.title}</h4>
                  <p className="text-[9.5px] text-cyan-400/90 font-bold">{intern.company}</p>
                  <p className="text-[9.5px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{intern.description || 'No description.'}</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between">
                  <div className="text-[9px] text-zinc-550 font-mono font-bold flex flex-col">
                    <span className="truncate">💼 {intern.stipend || 'Unpaid'}</span>
                    <span className="mt-0.5">⏱ {intern.duration || 'N/A'}</span>
                  </div>
                  {!intern.isApplied ? (
                    <button
                      onClick={() => handleApplyInternship(msgId, intern)}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                    >
                      Apply
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/15 font-bold">Applied</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {payload.map((drive: any) => (
              <div key={drive.id} className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[8.5px] font-mono text-indigo-400 uppercase tracking-tight bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/15 font-bold">FTE DRIVE</span>
                    {drive.deadline && (
                      <span className="text-[8.5px] font-mono text-zinc-500">Register by: {new Date(drive.deadline).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-bold text-zinc-200 mt-2 font-display">{drive.title}</h4>
                  <p className="text-[9.5px] text-cyan-400/90 font-bold">{drive.company}</p>
                  <p className="text-[9.5px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{drive.description || 'No job description.'}</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between">
                  <div className="text-[9px] text-zinc-550 font-mono font-bold flex flex-col">
                    <span className="truncate">💼 CTC: {drive.stipend || 'Not Disclosed'}</span>
                    <span className="mt-0.5">📍 {drive.location || 'On-site'}</span>
                  </div>
                  {!drive.isApplied ? (
                    <button
                      onClick={() => handleApplyInternship(msgId, drive)}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                    >
                      Apply
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/15 font-bold">Applied</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {payload.map((c: any) => (
              <div key={c.id} className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-200 font-display">{c.name}</h4>
                      <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-tight bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/15 font-bold">{c.category}</span>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">{c.description || 'No description.'}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between font-mono font-bold">
                  <span className="text-[9px] text-zinc-550">👥 {c.member_count} members</span>
                  {!c.isJoined ? (
                    <button
                      onClick={() => handleJoinCommunity(msgId, c.id)}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                    >
                      Join
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/15 font-bold">Joined</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {payload.map((g: any) => (
              <div key={g.id} className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/15 font-bold">STUDY ROOM</span>
                  <h4 className="text-[11px] font-bold text-zinc-200 mt-2 font-display">{g.subject}</h4>
                  <p className="text-[9.5px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{g.description || 'No description.'}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between font-mono font-bold">
                  <div className="text-[9px] text-zinc-550 flex flex-col">
                    <span>📍 {g.venue || 'Online'}</span>
                    <span className="text-cyan-400 mt-0.5">{new Date(g.meeting_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                  {!g.isJoined ? (
                    <button
                      onClick={() => handleJoinStudyGroup(msgId, g.id)}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 text-white rounded text-[9px] font-bold transition-all"
                    >
                      Join
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/15 font-bold">Joined</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {payload.map((item: any) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[8.5px] font-mono text-amber-400 uppercase tracking-tight bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15 font-bold">{item.condition}</span>
                    <span className="text-[10px] font-mono text-zinc-100 font-bold">₹{item.price}</span>
                  </div>
                  <h4 className="text-[11px] font-bold text-zinc-200 mt-2 font-display">{item.title}</h4>
                  <p className="text-[9.5px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between font-mono font-bold text-[9px] text-zinc-550">
                  <span>Category: {item.category}</span>
                  <a href="/marketplace" className="px-2.5 py-1 bg-[#0d121f] border border-white/[0.06] text-neutral-400 hover:text-white rounded font-bold transition-all">View</a>
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
          <div className="space-y-1.5">
            {payload.map((note: any) => (
              <div key={note.id} className="p-3 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8.5px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/15 font-bold">{note.course_code || 'ACAD'}</span>
                    <span className="text-[9.5px] text-zinc-500 truncate">{note.subject}</span>
                  </div>
                  <h4 className="text-[11px] font-bold text-zinc-100 mt-1 truncate">{note.title}</h4>
                  <p className="text-[9.5px] text-zinc-500 truncate mt-0.5">{note.description || 'No description'}</p>
                </div>
                <a
                  href={note.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 text-white rounded-lg text-[9px] font-bold transition-all shrink-0 flex items-center gap-1 font-mono"
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
          <div className="space-y-1.5">
            {payload.map((paper: any) => (
              <div key={paper.id} className="p-3 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8.5px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/15 font-bold">{paper.course_code || 'EXAM'}</span>
                    <span className="text-[8.5px] font-mono text-zinc-550 bg-zinc-950/50 px-1.5 py-0.5 rounded border border-white/[0.03] font-bold">{paper.exam_year} • {paper.semester} Sem</span>
                  </div>
                  <h4 className="text-[11px] font-bold text-zinc-100 mt-1 truncate">{paper.subject}</h4>
                  <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold">{paper.exam_type?.replace('_', ' ')}</span>
                </div>
                <a
                  href={paper.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 text-white rounded-lg text-[9px] font-bold transition-all shrink-0 flex items-center gap-1 font-mono"
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
          <div className="space-y-1.5">
            {payload.map((msg: any) => (
              <div key={msg.id} className="p-3 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                    <span className="text-[11px] font-bold text-zinc-200">{msg.profiles?.full_name || `@${msg.profiles?.username || 'user'}`}</span>
                    <span className="text-[8.5px] font-mono text-zinc-550 font-bold">{new Date(msg.created_at).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 truncate pl-3">&quot;{msg.content}&quot;</p>
                </div>
                <a
                  href="/messages"
                  className="px-2.5 py-1.5 bg-[#0d121f] border border-white/[0.06] hover:text-white hover:bg-white/[0.03] text-neutral-400 rounded-lg text-[9px] font-bold transition-all shrink-0 font-mono"
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
          <div className="space-y-1.5">
            {payload.map((app: any, idx: number) => {
              const isIntern = app.type === 'Internship'
              const dateStr = new Date(app.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
              return (
                <div key={app.id || idx} className="p-3 rounded-xl bg-zinc-900/30 border border-white/[0.06] hover:border-cyan-500/20 transition-all flex items-center justify-between gap-3">
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
                      <span className="text-[9px] text-zinc-500 font-medium">Applied: {dateStr}</span>
                    </div>
                    <h4 className="text-[11px] font-bold text-zinc-200 mt-1 truncate">{app.company}</h4>
                    <p className="text-[9.5px] text-zinc-400 mt-0.5 truncate font-medium">Role: {app.role || 'Candidate'}</p>
                  </div>
                  <span className={clsx(
                    "px-2 py-0.5 rounded-lg text-[9px] font-bold border capitalize shrink-0 font-mono",
                    app.status === 'selected' || app.status === 'offer'
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-bold"
                      : app.status === 'shortlisted'
                      ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400"
                      : app.status === 'rejected'
                      ? "bg-red-500/10 border-red-500/25 text-red-400"
                      : "bg-zinc-800 border-white/[0.05] text-zinc-500"
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
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-tight font-bold">Identity Profile</span>
                    <span className="text-[8.5px] font-mono text-cyan-400 uppercase tracking-tight bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/15 font-bold">{p.role}</span>
                  </div>
                  <h4 className="text-[11px] font-bold text-zinc-200 mt-2 font-display">{p.full_name}</h4>
                  <p className="text-[9.5px] text-zinc-550">@{p.username || 'username'}</p>
                  <p className="text-[9.5px] text-indigo-400 font-mono mt-1.5 font-bold">🎓 {p.colleges?.name || 'IILM Connect College'}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-500">
                  <div>
                    <p className="text-[7.5px] uppercase text-zinc-600 font-bold">Branch & Year</p>
                    <p className="text-zinc-400 font-bold">{p.branch || 'N/A'}, Yr {p.year || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[7.5px] uppercase text-zinc-600 font-bold">Roll Number</p>
                    <p className="text-zinc-400 font-bold">{p.roll_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] flex flex-col justify-between">
                <div>
                  <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-tight font-bold">Status & Rewards</span>
                  <div className="flex items-center gap-1.5 mt-2 select-none">
                    <span className={clsx(
                      "text-[8.5px] font-mono uppercase tracking-tight px-1.5 py-0.5 rounded border flex items-center gap-0.5 font-bold",
                      p.is_verified ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                      Student: {p.is_verified ? 'Verified' : 'Pending'}
                    </span>
                    <span className={clsx(
                      "text-[8.5px] font-mono uppercase tracking-tight px-1.5 py-0.5 rounded border flex items-center gap-0.5 font-bold",
                      p.dating_verified ? "bg-pink-500/10 border-pink-500/20 text-pink-400" : "bg-zinc-800 border-white/[0.05] text-zinc-550"
                    )}>
                      Dating: {p.dating_verified ? 'Verified' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div>
                      <p className="text-[7.5px] uppercase text-zinc-650 font-mono font-bold">Rewards</p>
                      <p className="text-xs font-black text-cyan-400 font-mono">🏆 {pts?.total || 0} pts</p>
                    </div>
                    <div>
                      <p className="text-[7.5px] uppercase text-zinc-650 font-mono font-bold">Level</p>
                      <p className="text-[10px] font-bold text-zinc-300 font-mono">Lv. {pts?.level || 1}</p>
                    </div>
                    <div>
                      <p className="text-[7.5px] uppercase text-zinc-650 font-mono font-bold">Streak</p>
                      <p className="text-[10px] font-bold text-amber-400 font-mono">🔥 {pts?.streak_days || 0}d</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.04] text-[8.5px] text-zinc-600 font-mono select-none">
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
          <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] space-y-3">
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
                <h5 className="text-[9px] text-zinc-500 font-mono uppercase font-black tracking-wider">Missing Fields:</h5>
                <ul className="mt-1 space-y-0.5 pl-1">
                  {missing.map((field: string, idx: number) => (
                    <li key={idx} className="text-[9.5px] text-zinc-550 flex items-center gap-1.5 font-sans font-medium">
                      <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[9.5px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg w-fit font-bold">
                <ShieldCheck size={11} /> Profile 100% complete!
              </div>
            )}
          </div>
        )
      }
      case 'COPILOT_DASHBOARD_INSIGHTS': {
        const { profileCompletion, missingFields, events, communities, internships, studyGroups } = payload
        return (
          <div className="space-y-3 max-w-4xl">
            <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-200 font-display">
                  <Trophy size={12} className="text-cyan-400 animate-pulse" />
                  Campus Copilot Action Plan
                </div>
                <span className="text-[9.5px] font-mono font-bold text-cyan-400">{profileCompletion}% Complete</span>
              </div>
              <div className="w-full bg-zinc-950/80 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" style={{ width: `${profileCompletion}%` }} />
              </div>
              {missingFields.length > 0 && (
                <p className="text-[9px] text-zinc-550">
                  💡 Fill in to complete: <span className="text-zinc-400 font-bold">{missingFields.slice(0, 3).join(', ')}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <h5 className="text-[9px] font-mono uppercase font-black text-zinc-500 flex items-center gap-1.5 px-1 select-none">
                  <Calendar size={9} className="text-cyan-400" /> Upcoming Events
                </h5>
                {events.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-zinc-900/10 border border-dashed border-white/[0.03] text-center text-[9px] text-zinc-600 select-none">No new events</div>
                ) : (
                  events.map((e: any) => (
                    <div key={e.id} className="p-2.5 rounded-xl bg-zinc-900/35 border border-white/[0.05] flex flex-col justify-between min-h-[84px] hover:border-cyan-500/10 transition-all">
                      <div>
                        <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{e.title}</h6>
                        <p className="text-[8px] text-zinc-500 font-mono mt-0.5">📍 {e.venue || 'Campus'}</p>
                      </div>
                      <div className="mt-2 pt-1 border-t border-white/[0.03] flex items-center justify-between">
                        <span className="text-[8px] font-mono text-cyan-400 font-bold">{new Date(e.start_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        {e.isRegistered ? (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 font-bold">Registered</span>
                        ) : (
                          <button
                            onClick={() => handleRegisterEvent(msgId, e.id)}
                            className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 text-white rounded text-[8px] font-bold font-mono transition-all"
                          >
                            Register
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-1.5">
                <h5 className="text-[9px] font-mono uppercase font-black text-zinc-500 flex items-center gap-1.5 px-1 select-none">
                  <Briefcase size={9} className="text-cyan-400" /> Suggested Careers
                </h5>
                {internships.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-zinc-900/10 border border-dashed border-white/[0.03] text-center text-[9px] text-zinc-600 select-none">No match internships</div>
                ) : (
                  internships.map((i: any) => (
                    <div key={i.id} className="p-2.5 rounded-xl bg-zinc-900/35 border border-white/[0.05] flex flex-col justify-between min-h-[84px] hover:border-cyan-500/10 transition-all">
                      <div>
                        <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{i.title}</h6>
                        <p className="text-[8px] text-cyan-400 font-medium">{i.company}</p>
                      </div>
                      <div className="mt-2 pt-1 border-t border-white/[0.03] flex items-center justify-between">
                        <span className="text-[8px] font-mono text-zinc-650">{i.location || 'Hybrid'}</span>
                        {i.isApplied ? (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 font-bold">Applied</span>
                        ) : (
                          <button
                            onClick={() => handleApplyInternship(msgId, i)}
                            className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 text-white rounded text-[8px] font-bold font-mono transition-all"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-1.5">
                <h5 className="text-[9px] font-mono uppercase font-black text-zinc-500 flex items-center gap-1.5 px-1 select-none">
                  <Users size={9} className="text-indigo-400" /> Clubs to Join
                </h5>
                {communities.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-zinc-900/10 border border-dashed border-white/[0.03] text-center text-[9px] text-zinc-600 select-none">No suggested clubs</div>
                ) : (
                  communities.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-zinc-900/35 border border-white/[0.05] flex flex-col justify-between min-h-[84px] hover:border-indigo-500/10 transition-all">
                      <div>
                        <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{c.name}</h6>
                        <p className="text-[8px] text-zinc-500 font-mono">👥 {c.member_count} members</p>
                      </div>
                      <div className="mt-2 pt-1 border-t border-white/[0.03] flex items-center justify-between">
                        <span className="text-[8px] font-mono text-indigo-400 font-semibold uppercase">{c.category}</span>
                        {c.isJoined ? (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 font-bold">Joined</span>
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

              <div className="space-y-1.5">
                <h5 className="text-[9px] font-mono uppercase font-black text-zinc-500 flex items-center gap-1.5 px-1 select-none">
                  <BookOpen size={9} className="text-indigo-400" /> Study Rooms
                </h5>
                {studyGroups.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-zinc-900/10 border border-dashed border-white/[0.03] text-center text-[9px] text-zinc-600 select-none">No study groups</div>
                ) : (
                  studyGroups.map((g: any) => (
                    <div key={g.id} className="p-2.5 rounded-xl bg-zinc-900/35 border border-white/[0.05] flex flex-col justify-between min-h-[84px] hover:border-indigo-500/10 transition-all">
                      <div>
                        <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{g.subject}</h6>
                        <p className="text-[8px] text-zinc-500 line-clamp-1 mt-0.5">{g.description || 'No desc'}</p>
                      </div>
                      <div className="mt-2 pt-1 border-t border-white/[0.03] flex items-center justify-between">
                        <span className="text-[8px] font-mono text-zinc-650 font-medium">📍 {g.venue || 'Online'}</span>
                        {g.isJoined ? (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 font-bold">Joined</span>
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
    <div className="h-[calc(100vh-130px)] border border-white/[0.08] bg-[#090d16]/30 backdrop-blur-3xl rounded-3xl overflow-hidden flex shadow-2xl relative select-none">
      
      {/* Background radial soft light blobs */}
      <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-cyan-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/5 blur-[90px] pointer-events-none" />

      {/* 1. Collapsible Premium Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="h-full border-r border-white/[0.08] bg-[#030712]/40 flex flex-col shrink-0 overflow-hidden relative select-none z-30"
          >
            {/* Sidebar header */}
            <div className="p-4 border-b border-white/[0.05] space-y-3 shrink-0">
              <button 
                onClick={createNewThread}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/15 hover:to-blue-500/15 border border-cyan-500/25 text-cyan-400 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Plus size={14} /> New Chat
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={13} />
                <input
                  value={threadSearch}
                  onChange={e => setThreadSearch(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-[#030712]/50 border border-white/[0.06] rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-550 outline-none focus:border-cyan-500/30 transition-all font-medium"
                />
              </div>
            </div>

            {/* List of chat threads */}
            <div ref={parentThreads} className="flex-1 overflow-y-auto p-2 space-y-3.5 custom-scrollbar pb-6">
              {/* Pinned threads */}
              {pinnedThreads.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[8px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-2 mb-1.5">Pinned Chats</p>
                  {pinnedThreads.map(thread => (
                    <div 
                      key={thread.id}
                      onClick={() => {
                        setActiveThreadId(thread.id)
                        localStorage.setItem(ACTIVE_THREAD_KEY, thread.id)
                      }}
                      className={clsx(
                        "group relative p-2 rounded-xl flex items-center justify-between transition-all border cursor-pointer select-none",
                        activeThreadId === thread.id 
                          ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400 font-bold" 
                          : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-12 flex-1">
                        <Pin size={10} className="shrink-0 text-cyan-400/80 rotate-45" />
                        {editingThreadId === thread.id ? (
                          <input
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onBlur={() => saveRename(thread.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveRename(thread.id)
                              if (e.key === 'Escape') setEditingThreadId(null)
                            }}
                            className="bg-zinc-950 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-[11px] truncate">{thread.title}</span>
                        )}
                      </div>
                      
                      {/* Hover action bar */}
                      <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-zinc-950/70 p-0.5 rounded border border-white/[0.04]">
                        <button
                          onClick={(e) => startRename(thread, e)}
                          title="Rename"
                          className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                          <Edit3 size={10} />
                        </button>
                        <button
                          onClick={(e) => togglePinThread(thread.id, e)}
                          title="Unpin"
                          className="p-1 hover:bg-white/5 rounded text-cyan-400 transition-colors"
                        >
                          <PinOff size={10} />
                        </button>
                        <button
                          onClick={(e) => deleteThread(thread.id, e)}
                          title="Delete"
                          className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent threads */}
              <div className="space-y-1">
                <p className="text-[8px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-2 mb-1.5">Recents</p>
                {recentThreads.length === 0 && pinnedThreads.length === 0 ? (
                  <p className="text-[10px] text-zinc-550 px-2 italic">No chats found.</p>
                ) : (
                  recentThreads.map(thread => (
                    <div 
                      key={thread.id}
                      onClick={() => {
                        setActiveThreadId(thread.id)
                        localStorage.setItem(ACTIVE_THREAD_KEY, thread.id)
                      }}
                      className={clsx(
                        "group relative p-2 rounded-xl flex items-center justify-between transition-all border cursor-pointer select-none",
                        activeThreadId === thread.id 
                          ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400 font-bold" 
                          : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-12 flex-1">
                        <MessageSquare size={10} className="shrink-0 text-zinc-550" />
                        {editingThreadId === thread.id ? (
                          <input
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onBlur={() => saveRename(thread.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveRename(thread.id)
                              if (e.key === 'Escape') setEditingThreadId(null)
                            }}
                            className="bg-zinc-950 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-[11px] truncate">{thread.title}</span>
                        )}
                      </div>
                      
                      {/* Hover action bar */}
                      <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-zinc-950/70 p-0.5 rounded border border-white/[0.04]">
                        <button
                          onClick={(e) => startRename(thread, e)}
                          title="Rename"
                          className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                          <Edit3 size={10} />
                        </button>
                        <button
                          onClick={(e) => togglePinThread(thread.id, e)}
                          title="Pin Chat"
                          className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-cyan-400 transition-colors"
                        >
                          <Pin size={10} />
                        </button>
                        <button
                          onClick={(e) => deleteThread(thread.id, e)}
                          title="Delete Chat"
                          className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Chat Box pane */}
      <div className="flex-1 flex flex-col bg-[#030712]/10 relative min-w-0">
        
        {/* Header bar */}
        <header className="h-[73px] px-6 border-b border-white/[0.05] flex items-center justify-between bg-[#030712]/30 backdrop-blur-xl z-20 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-xl border border-white/[0.05] text-zinc-400 hover:text-zinc-200 transition-all"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              <Menu size={15} />
            </button>

            <div className={clsx(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              isGenerating 
                ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]" 
                : "bg-cyan-500/10 border border-cyan-500/15 text-cyan-400"
            )}>
              <Bot className={clsx(isGenerating && "animate-pulse")} size={18} />
            </div>

            <div>
              <h2 className="font-display font-black text-xs sm:text-[13px] text-white tracking-tight flex items-center gap-1.5 leading-none">
                {activeThread ? activeThread.title : 'Campus Copilot'}
                <span className={clsx(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border transition-colors",
                  isGenerating 
                    ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-400" 
                    : "bg-cyan-500/10 border-cyan-500/15 text-cyan-400"
                )}>
                  <Sparkles size={8} className={clsx(isGenerating && "animate-spin")} /> LOCAL AI
                </span>
              </h2>
              <p className="text-[9px] text-zinc-500 mt-1 font-mono">Recommend engine secure logs</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={clearChat}
              disabled={isGenerating}
              className="p-2 bg-[#0d121f]/50 border border-white/[0.06] rounded-xl text-zinc-400 hover:text-white transition-colors hover:bg-white/[0.03] disabled:opacity-50"
              title="Reset conversation"
              aria-label="Clear chat messages"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </header>

        {/* Chat message viewport */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={clsx(
            "flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-gradient-to-b from-[#090d16]/10 to-[#030712]/20 flex flex-col relative",
            dragActive && "border-2 border-dashed border-cyan-500/50 bg-cyan-500/[0.02]"
          )}
        >
          {dragActive && (
            <div className="absolute inset-0 bg-[#090d16]/80 flex flex-col items-center justify-center z-50 pointer-events-none select-none">
              <Bot size={36} className="text-cyan-400 animate-bounce" />
              <p className="text-xs text-white font-mono uppercase font-black tracking-wider mt-4">Drop File Here</p>
              <p className="text-[10px] text-zinc-550 mt-1">Attachments will be uploaded securely</p>
            </div>
          )}

          {/* Empty welcome screen state */}
          {messages.length === 1 && !loading ? (
            <div className="my-auto flex flex-col items-center justify-center p-4 max-w-2xl mx-auto select-none">
              {/* Illustration banner */}
              <div className="w-14 h-14 rounded-3xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-xl mb-4 relative">
                <Bot size={24} className="animate-pulse" />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border border-[#090d16] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <h3 className="font-display font-black text-sm text-zinc-200 tracking-tight uppercase font-mono">Welcome to Campus Copilot</h3>
              <p className="text-[11px] text-zinc-500 mt-2 text-center max-w-md leading-relaxed">
                I am your private rule-based recommender engine. I run entirely client-side using local database tables to secure your files and chats.
              </p>

              {/* Suggested campus actions grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-8">
                {CAMPUS_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    className="p-3 bg-[#0d121f]/35 border border-white/[0.05] hover:border-cyan-500/20 hover:bg-cyan-500/5 rounded-2xl flex items-start gap-3 text-left transition-all group"
                  >
                    <span className="text-lg shrink-0 mt-0.5">{p.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-zinc-300 group-hover:text-cyan-400 transition-colors">{p.text}</p>
                      <p className="text-[9px] text-zinc-550 mt-0.5 line-clamp-1">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Message stream
            <div ref={parentMessages} className="space-y-6 flex-1">
              <AnimatePresence initial={false}>
                {messages.map((m) => {
                  const isBot = m.role === 'assistant'
                  return (
                    <motion.div 
                      key={m.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className={clsx(
                        "flex items-start gap-3.5 w-full",
                        isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                      )}
                    >
                      {/* Avatar */}
                      <div className={clsx(
                        "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border select-none",
                        isBot 
                          ? (isGenerating 
                            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.2)]" 
                            : "bg-cyan-500/10 border-cyan-500/15 text-cyan-400") 
                          : "bg-zinc-950 border-white/[0.05] text-zinc-400"
                      )}>
                        {isBot ? <Bot size={14} /> : <User size={14} />}
                      </div>

                      {/* Message Content Bubble */}
                      <div className="space-y-3 flex-1 min-w-0 max-w-[85%] sm:max-w-[75%]">
                        <div className={clsx(
                          "px-4 py-3 rounded-2xl leading-relaxed text-xs shadow-md border font-sans",
                          isBot 
                            ? "bg-[#0d121f]/75 border-white/[0.06] text-zinc-200 rounded-tl-none" 
                            : "bg-gradient-to-br from-cyan-600/80 to-blue-600/80 text-white border-transparent rounded-tr-none"
                        )}>
                          {isBot ? parseMarkdown(m.content) : parseBold(m.content)}
                        </div>

                        {/* Direct Structured Campus Results */}
                        {isBot && m.dataType && m.payload && (
                          <div className="space-y-2 max-w-full">
                            <div className="flex items-center gap-2 px-1 select-none">
                              <span className={clsx(
                                "text-[8px] font-mono font-black tracking-wider uppercase px-2 py-0.5 rounded border",
                                m.dataType === 'campus' 
                                  ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" 
                                  : m.dataType === 'user'
                                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                  : "bg-zinc-900 border-white/[0.05] text-zinc-500"
                              )}>
                                {m.dataType === 'campus' ? 'Campus Logs' : m.dataType === 'user' ? 'Personal Logs' : 'Results'}
                              </span>
                            </div>
                            {renderStructuredData(m.id, m.dataIntent, m.payload)}
                          </div>
                        )}

                        {/* Interactive bot utility options row (hover visible) */}
                        {isBot && m.id !== 'welcome' && (
                          <div className="flex items-center gap-2 px-1 select-none">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(m.content)
                                toast.success('Text copied to clipboard!')
                              }}
                              className="p-1 text-zinc-500 hover:text-zinc-350 hover:bg-white/5 rounded transition-all"
                              title="Copy response text"
                              aria-label="Copy response text"
                            >
                              <Copy size={11} />
                            </button>
                            <button
                              onClick={() => toggleFeedback(m.id, 'like')}
                              className={clsx(
                                "p-1 rounded transition-all",
                                m.feedback === 'like' ? "text-cyan-400 bg-cyan-500/5" : "text-zinc-550 hover:text-zinc-400"
                              )}
                              title="Helpful"
                              aria-label="Mark helpful"
                            >
                              <ThumbsUp size={11} />
                            </button>
                            <button
                              onClick={() => toggleFeedback(m.id, 'dislike')}
                              className={clsx(
                                "p-1 rounded transition-all",
                                m.feedback === 'dislike' ? "text-red-400 bg-red-500/5" : "text-zinc-550 hover:text-zinc-400"
                              )}
                              title="Not helpful"
                              aria-label="Mark unhelpful"
                            >
                              <ThumbsDown size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Streaming/Loading animation states */}
              {loading && (
                <div className="flex items-start gap-3.5 mr-auto max-w-xl">
                  <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.2)] animate-pulse">
                    <Bot size={14} />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-[#0d121f]/75 border border-white/[0.06] flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Drag files and active prompt compose block */}
        <footer className="p-4 border-t border-white/[0.05] bg-[#030712]/30 backdrop-blur-xl shrink-0 select-none">
          <div className="flex flex-col gap-2">
            
            {/* Attachment preview banner */}
            {attachedFile && (
              <div className="px-3 py-1.5 bg-zinc-950/80 border border-white/10 rounded-xl flex items-center justify-between text-[10px] text-zinc-400 max-w-sm">
                <div className="flex items-center gap-2 truncate">
                  <ImageIcon size={12} className="text-cyan-400" />
                  <span className="truncate">{attachedFile.name}</span>
                </div>
                <button 
                  onClick={() => setAttachedFile(null)}
                  className="p-1 text-zinc-550 hover:text-white rounded"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            {/* Compose Textarea box wrapper */}
            <div className="flex items-end gap-2 relative">
              
              {/* Attachment file selector */}
              <button
                onClick={() => {
                  const inputEl = document.createElement('input')
                  inputEl.type = 'file'
                  inputEl.accept = 'image/*'
                  inputEl.onchange = (e: any) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachedFile(e.target.files[0])
                      toast.success(`Attached: ${e.target.files[0].name}`)
                    }
                  }
                  inputEl.click()
                }}
                className="p-3 bg-[#0d121f]/50 border border-white/[0.06] rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-all"
                title="Add attachment"
                aria-label="Add attachment"
              >
                <ImageIcon size={15} />
              </button>

              <div className="flex-1 relative flex items-center">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask Campus Copilot... (Enter to send, Shift+Enter for new line)"
                  className="w-full bg-[#0d121f]/50 border border-white/[0.06] focus:border-cyan-500/40 rounded-xl pl-4 pr-10 py-3 text-xs text-zinc-200 placeholder:text-zinc-550 outline-none transition-all resize-none max-h-40 custom-scrollbar font-medium"
                />
                
                {/* Floating Clear/Regen tools inside composer */}
                <div className="absolute right-3 bottom-2 flex items-center gap-1.5">
                  {messages.length > 1 && !isGenerating && (
                    <button
                      onClick={regenerateLastResponse}
                      className="p-1 text-zinc-500 hover:text-cyan-400 hover:bg-white/5 rounded-md transition-colors"
                      title="Regenerate response"
                      aria-label="Regenerate last response"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Send / Stop Generation Trigger */}
              {isGenerating ? (
                <button
                  onClick={stopGeneration}
                  className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500/15 transition-all shadow-lg shrink-0 flex items-center justify-center animate-pulse"
                  title="Stop generation"
                  aria-label="Stop generation"
                >
                  <StopCircle size={15} />
                </button>
              ) : (
                <button
                  onClick={() => handleSend(input)}
                  disabled={(!input.trim() && !attachedFile) || isGenerating}
                  className={clsx(
                    "p-3 rounded-xl font-bold transition-all shadow-lg shrink-0 flex items-center justify-center",
                    input.trim() || attachedFile
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-105 active:scale-95"
                      : "bg-[#0d121f]/50 border border-white/[0.06] text-zinc-650"
                  )}
                  title="Send query"
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              )}
            </div>

          </div>
        </footer>

      </div>

    </div>
  )
}
