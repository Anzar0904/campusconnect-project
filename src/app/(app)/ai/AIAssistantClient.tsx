'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bot, Send, Sparkles, User, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const SUGGESTED_PROMPTS = [
  { text: 'How do I earn rewards points?', icon: '🏆' },
  { text: 'What clubs can I join on campus?', icon: '⚡' },
  { text: 'Where do I find study notes or exam papers?', icon: '📚' },
  { text: 'Explain the campus dating match system rules', icon: '❤️' }
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
    <div className="space-y-1.5 text-left">
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

export default function AIAssistantClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your **Campus AI Assistant**. I can guide you through societies, campus notes, events, placements, and matches. Ask me anything about CampusConnect!',
      created_at: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getAIResponse = (query: string): string => {
    const q = query.toLowerCase()
    if (q.includes('rewards') || q.includes('point') || q.includes('earn')) {
      return `### How to Earn Reward Points
You can collect **Campus points** for being an active student node:
1. **Upload Notes**: Earns **20 pts** for every reference note uploaded.
2. **Coding Challenge**: Solves in Coding Arena award **10 to 40 pts** depending on difficulty.
3. **Event RSVP**: Attending official university events grants **25 pts**.
4. **Platform Sign-in Streak**: Log in consecutive days to receive bonus multipliers.
5. **Dating verification & profile completion**: Instantly unlocks **100 pts** validation bonus.`
    }
    if (q.includes('club') || q.includes('societ') || q.includes('cell')) {
      return `### Campus Organizations
Here are the top-rated student organisations at IILM Connect:
- **Entrepreneurship Cell**: Startup incubator, hosts pitch nights & business workshops.
- **Marketing Club**: Case studies, brand hackathons & advertising competitions.
- **Finance Club**: Portfolio simulations & CFA study groups.
- **Tech & Coding Club**: Competitive code rounds, hackathons & project build meetups.
- **Debate & MUN Club**: Public speaking and inter-college assemblies.`
    }
    if (q.includes('note') || q.includes('exam') || q.includes('syllabus') || q.includes('paper')) {
      return `### Notes & Exam Archives
We maintain a decentralised library for academics:
- **Notes Library**: Student-uploaded lecture reference summaries sorted by subject codes.
- **Past Papers**: Exam archives with solutions from previous semesters.
- **Study Hub**: Create or join virtual study rooms to collaborate on tasks in real-time.
Access these resources from the **Academics** tab in your All Features grid menu.`
    }
    if (q.includes('dating') || q.includes('gender') || q.includes('match') || q.includes('swipe')) {
      return `### Campus Dating System Rules
The dating hub is designed around campus security and gender privacy:
1. **Verification Lock**: Only verified university students can set up profiles.
2. **Gender-Aware Matching**: Male users see only female profiles, and female users see only male profiles.
3. **Mutual Agreement**: Swiping right registers a like. A match occurs only when both users like each other.
4. **Chat Unlock**: Direct messaging is unlocked *only* after a mutual match is achieved. No unwanted messaging is permitted.`
    }
    if (q.includes('coding') || q.includes('arena') || q.includes('contest') || q.includes('problem')) {
      return `### Coding Arena
Unleash your developer potential:
- Challenge yourself with weekly DSA and system problems.
- Compile and test your solutions inside our browser compiler.
- Compete on the leaderboard to claim top developer rank and win reward multipliers.`
    }
    return `### IILM Campus AI Assistant
I search through database nodes to find answer details. I can assist you with:
- **Academics**: Note uploads, previous papers, study groups.
- **Careers**: Internship matches, placements status.
- **Socials**: Communities, student-run clubs, connections requests.
- **Dating system rules**: Verified matches, gender-aware search filters.
Try checking out one of the suggested prompts below!`
  }

  const handleSend = (text: string) => {
    if (!text.trim() || isGenerating) return
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setIsGenerating(true)

    setTimeout(() => {
      const botResponse = getAIResponse(text)
      const botMsgPlaceholder: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, botMsgPlaceholder])
      
      // Stream bot response word-by-word
      setLoading(false)
      let currentText = ''
      const words = botResponse.split(' ')
      let i = 0
      
      const timer = setInterval(() => {
        if (i < words.length) {
          currentText += (i === 0 ? '' : ' ') + words[i]
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: currentText }]
            }
            return prev
          })
          i++
        } else {
          clearInterval(timer)
          setIsGenerating(false)
        }
      }, 35)
    }, 800)
  }

  const clearChat = () => {
    if (isGenerating) return
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I am your **Campus AI Assistant**. I can guide you through societies, campus notes, events, placements, and matches. Ask me anything about CampusConnect!',
        created_at: new Date().toISOString()
      }
    ])
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
              Campus Connect AI
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-400">
                <Sparkles size={8} /> ACTIVE
              </span>
            </h2>
            <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">Large Language Model v1.2-beta</p>
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
                    "flex items-start gap-3.5 max-w-3xl",
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

                  <div className="space-y-1">
                    <div className={clsx(
                      "px-4 py-3 rounded-2xl leading-relaxed shadow-lg text-xs font-medium border",
                      isBot 
                        ? "bg-[#0d121f]/75 border-white/[0.08]" 
                        : "bg-gradient-to-br from-cyan-600/90 to-blue-600/90 text-white border-transparent"
                    )}>
                      {isBot ? parseMarkdown(m.content) : parseBold(m.content)}
                    </div>
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
                  <p className="text-[10px] text-neutral-500 mt-1 font-mono uppercase tracking-tight flex items-center gap-1">
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
            placeholder="Type a campus question..."
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
