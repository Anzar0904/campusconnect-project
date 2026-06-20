'use client'

import { motion } from 'framer-motion'

export default function CodingArenaClient() {
  return (
    <div className="animate-fade-in flex items-center justify-center h-[calc(100vh-140px)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-premium p-12 max-w-md w-full text-center space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 opacity-10 pointer-events-none"
          style={{background:'radial-gradient(ellipse at top, #10b981 0%, transparent 70%)'}} />

        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center relative z-10 shadow-2xl"
          style={{background:'linear-gradient(135deg,#059669,#10b981)',boxShadow:'0 0 40px rgba(16,185,129,0.3)'}}>
          <span className="material-symbols-outlined text-[40px] text-white" style={{fontVariationSettings:"'FILL' 1"}}>code</span>
        </div>
        
        <div className="relative z-10 space-y-2">
          <span className="chip-pro text-[10px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400 mb-2">
            IN DEVELOPMENT
          </span>
          <h1 className="display-heading text-3xl tracking-tight">Coding Arena</h1>
          <p className="body-pro text-sm leading-relaxed text-zinc-400">
            We are building a secure code execution engine. Soon you&apos;ll be able to practice DSA, join campus contests, and climb the university leaderboard.
          </p>
        </div>

        <div className="pt-6 border-t border-white/[0.04] relative z-10">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Expected Rollout: Winter 2026</p>
        </div>
      </motion.div>
    </div>
  )
}
