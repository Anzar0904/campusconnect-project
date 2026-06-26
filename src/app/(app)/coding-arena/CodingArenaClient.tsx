'use client'

import React, { useRef } from 'react'
import { Code2, Terminal as TerminalIcon, Play, Trophy, Users, ShieldAlert, CheckCircle, RefreshCw, Cpu, Award } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useGsapReveal, useGsapTilt, useGsapMagnetic, Easing, getPrefersReducedMotion } from '@/hooks/useGsapMotion'

const MOCK_PROBLEMS = [
  { id: 1, title: 'Two Sum II', difficulty: 'Easy', category: 'Arrays & Hashing', points: '50 XP', accuracy: '94.2%', status: 'solved' },
  { id: 2, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', category: 'Sliding Window', points: '100 XP', accuracy: '78.5%', status: 'attempted' },
  { id: 3, title: 'Merge k Sorted Lists', difficulty: 'Hard', category: 'Linked Lists', points: '200 XP', accuracy: '45.1%', status: 'unsolved' }
]

export default function CodingArenaClient() {
  const containerRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const terminalTextRef = useRef<HTMLSpanElement>(null)
  const runBtnRef = useGsapMagnetic(0.3) as React.RefObject<HTMLButtonElement>

  // Apply tilt to mock problem cards
  const card1Ref = useGsapTilt(8) as React.RefObject<HTMLDivElement>
  const card2Ref = useGsapTilt(8) as React.RefObject<HTMLDivElement>
  const card3Ref = useGsapTilt(8) as React.RefObject<HTMLDivElement>

  useGSAP(() => {
    if (getPrefersReducedMotion()) return

    const tl = gsap.timeline({ defaults: { ease: Easing.premium } })

    // Entrance timeline
    tl.fromTo(statsRef.current?.children || [], { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.6 })
      .fromTo(cardsRef.current?.children || [], { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.1, duration: 0.7 }, '-=0.4')
      .fromTo(editorRef.current, { opacity: 0, scale: 0.96, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.9 }, '-=0.5')

    // Terminal typing animation loop
    if (terminalTextRef.current) {
      const text = 'npm run test:challenges\n\n> campusconnect-challenges@1.0.0 test\n> jest --passWithNoTests\n\nPASS  src/__tests__/two-sum.test.ts (4.82s)\n  ✓ Two Sum II challenge validation (14/14 tests)\n\nTest Suites: 1 passed, 1 total\nTests:       14 passed, 14 total\nSnapshots:   0 total\nTime:        5.12s\n\nPoints rewarded: +100 XP 🏆 (Level Up imminent)'
      let progress = { charIndex: 0 }
      
      gsap.to(progress, {
        charIndex: text.length,
        duration: 4.5,
        ease: 'none',
        delay: 1.2,
        onUpdate: () => {
          if (terminalTextRef.current) {
            terminalTextRef.current.innerText = text.slice(0, Math.floor(progress.charIndex))
          }
        }
      })
    }
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6 reveal-coding-arena">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="display-heading text-3xl flex items-center gap-2">
            Coding Arena
            <Code2 className="text-emerald-400" size={28} />
          </h1>
          <p className="body-pro text-sm text-zinc-400">Solve data structures, algorithm challenges, and join live weekly contests.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip-pro text-[10px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
            Live Contest In 2 Hours
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3.5 select-none">
        {[
          { label: 'Contest Rating', value: '1,420', icon: Trophy, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'Global Rank', value: '#324', icon: Award, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Problems Solved', value: '42 / 120', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Arena Streak', value: '5 Days', icon: Cpu, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-[#18181B] border border-white/[0.04] p-4.5 rounded-2xl flex items-center gap-4 hover:border-white/[0.08] transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-white tracking-tight mt-0.5">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Problem Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Featured Challenges</h2>
          </div>

          <div ref={cardsRef} className="space-y-3">
            {MOCK_PROBLEMS.map((prob, idx) => {
              const refs = [card1Ref, card2Ref, card3Ref]
              return (
                <div 
                  ref={refs[idx]}
                  key={prob.id} 
                  className="bg-[#18181B]/80 border border-white/[0.04] hover:border-white/[0.08] p-4.5 rounded-2xl flex justify-between items-center transition-all duration-300 group cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        prob.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        prob.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>{prob.difficulty}</span>
                      <span className="text-[9px] font-mono text-zinc-500">{prob.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-tight mt-1 group-hover:text-emerald-400 transition-colors">{prob.title}</h3>
                    <p className="text-[10px] text-zinc-500">Accuracy: {prob.accuracy} • {prob.points}</p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    prob.status === 'solved' ? 'bg-emerald-500' :
                    prob.status === 'attempted' ? 'bg-amber-500' : 'bg-zinc-700'
                  }`} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Code Editor & Terminal Mockup */}
        <div ref={editorRef} className="lg:col-span-7 space-y-4">
          <div className="bg-[#151518] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
            {/* Tab top */}
            <div className="bg-[#18181b] border-b border-white/[0.04] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[10px] font-mono text-zinc-500 ml-3">solution.ts — TypeScript</span>
              </div>
              <button 
                ref={runBtnRef}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-md shadow-emerald-600/10 active:scale-95 transition-all"
              >
                <Play size={10} fill="white" />
                RUN CODE
              </button>
            </div>

            {/* Code Body */}
            <div className="p-4 font-mono text-xs text-zinc-300 space-y-1.5 select-text overflow-x-auto">
              <p className="text-zinc-500 select-none">1 <span className="text-indigo-400">function</span> <span className="text-emerald-400">twoSum</span>(nums: <span className="text-blue-400">number[]</span>, target: <span className="text-blue-400">number</span>): <span className="text-blue-400">number[]</span> &#123;</p>
              <p className="text-zinc-500 select-none">2   <span className="text-indigo-400">const</span> map = <span className="text-indigo-400">new</span> <span className="text-amber-400">Map</span>&lt;<span className="text-blue-400">number, number</span>&gt;();</p>
              <p className="text-zinc-500 select-none">3   <span className="text-indigo-400">for</span> (<span className="text-indigo-400">let</span> i = 0; i &lt; nums.length; i++) &#123;</p>
              <p className="text-zinc-500 select-none">4     <span className="text-indigo-400">const</span> complement = target - nums[i];</p>
              <p className="text-zinc-500 select-none">5     <span className="text-indigo-400">if</span> (map.<span className="text-cyan-400">has</span>(complement)) &#123;</p>
              <p className="text-zinc-500 select-none">6       <span className="text-indigo-400">return</span> [map.<span className="text-cyan-400">get</span>(complement)!, i];</p>
              <p className="text-zinc-500 select-none">7     &#125;</p>
              <p className="text-zinc-500 select-none">8     map.<span className="text-cyan-400">set</span>(nums[i], i);</p>
              <p className="text-zinc-500 select-none">9   &#125;</p>
              <p className="text-zinc-500 select-none">10  <span className="text-indigo-400">return</span> [];</p>
              <p className="text-zinc-500 select-none">11 &#125;;</p>
            </div>

            {/* Terminal Screen mockup */}
            <div className="bg-[#0b0b0d] border-t border-white/[0.06] p-4.5 min-h-[160px] flex flex-col font-mono text-[10px] text-zinc-400">
              <div className="flex items-center gap-1.5 text-zinc-500 select-none mb-2">
                <TerminalIcon size={12} />
                <span>TERMINAL (campustest runner)</span>
              </div>
              <span ref={terminalTextRef} className="text-emerald-400/90 whitespace-pre-wrap leading-relaxed select-text">
                Initializing execution environment...
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
