'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react'
import Image from 'next/image'

export const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#030712] pt-28 pb-20 px-6 sm:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-ambient-blue opacity-100 pointer-events-none z-0" />
      <div className="absolute top-[5%] right-[5%] w-[900px] h-[900px] bg-ambient-hero pointer-events-none z-0 filter blur-[90px]" />
      <div className="absolute bottom-0 left-[10%] w-[650px] h-[650px] bg-ambient-purple opacity-100 pointer-events-none z-0" />

      {/* Hero Content Left */}
      <div className="lg:col-span-5 flex flex-col justify-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-full w-fit backdrop-blur-md shadow-inner">
          <Sparkles size={11} className="text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Built for students. Loved by campuses.</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05]">
          One Campus. <br />
          Every <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent neon-glow-text">Connection.</span> <br />
          Limitless <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">Possibilities.</span>
        </h1>

        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-lg font-medium">
          CampusConnect is your all-in-one student OS built with 20+ powerful modules to learn, connect, build, and grow — exclusively engineered for college life.
        </p>

      </div>

      {/* Hero Interactive Space Right */}
      <div className="lg:col-span-7 relative flex items-center justify-center min-h-[660px] z-10 select-none">
        
        {/* Triple Orbit Layering */}
        <div className="absolute w-[520px] h-[520px] border border-white/[0.03] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="orbit-line-1 absolute w-full h-full top-1/2 left-1/2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 absolute top-0 left-1/2 shadow-[0_0_12px_#22d3ee]" />
          </div>
        </div>
        <div className="absolute w-[660px] h-[660px] border border-dashed border-white/[0.02] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="orbit-line-2 absolute w-full h-full top-1/2 left-1/2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 absolute bottom-0 left-1/2 shadow-[0_0_10px_#a855f7]" />
          </div>
        </div>
        <div className="absolute w-[780px] h-[780px] border border-white/[0.01] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="orbit-line-3 absolute w-full h-full top-1/2 left-1/2">
            <div className="w-1 h-1 rounded-full bg-blue-500 absolute left-0 top-1/2" />
          </div>
        </div>

        {/* Core Masked Engine Node Container */}
        <div className="relative w-104 h-104 sm:w-120 sm:h-120 rounded-full overflow-hidden border border-white/[0.14] bg-gradient-to-b from-blue-950/20 via-transparent to-transparent p-1 shadow-[0_0_90px_rgba(37,99,235,0.25)] flex items-center justify-center z-10">
          <Image 
            src="https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=700&q=80" 
            alt="Spatial Engine Visualization Asset Layer"
            width={700}
            height={700}
            className="w-full h-full object-cover rounded-full mix-blend-lighten scale-102 filter contrast-[1.15] brightness-90 saturate-[1.10]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-95" />
        </div>

        {/* Floating Spatial Cards with Calibrated Depth Overlaps & Micro-Movements */}
        <motion.div 
          initial={{ y: 0, x: 0 }}
          animate={{ y: [0, -10, 0], x: [0, 4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-0 sm:left-4 z-30 w-52 glass-panel-base floating-card-depth-1 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5.5 h-5.5 rounded-md bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 flex items-center justify-center text-[9px] font-black text-white shadow-md shadow-cyan-500/10">AI</div>
            <span className="text-[11px] font-bold text-white tracking-tight">AI Assistant</span>
          </div>
          <p className="text-[10px] text-neutral-300 leading-normal font-medium">Hi Ananya! I found 3 upcoming hackathons matching your tech stack.</p>
          <div className="mt-3 flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span className="text-[9px] text-neutral-400 font-bold tracking-tight">Systems Intelligent</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 0, x: 0 }}
          animate={{ y: [0, 8, 0], x: [0, -6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute bottom-16 left-[-10px] sm:left-0 z-30 w-56 glass-panel-base floating-card-depth-2 rounded-2xl p-4"
        >
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2.5">Internship Match</p>
          <div className="flex items-center gap-3 border-t border-white/[0.05] pt-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900/80 border border-white/10 flex items-center justify-center text-xs font-black text-white shadow-inner">L</div>
            <div>
              <p className="text-[11px] font-bold text-white tracking-tight">Product Intern</p>
              <p className="text-[9px] text-neutral-400 font-medium">at Linear Corporation</p>
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">92% Match</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 neon-ring-active" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ x: 0, y: 0 }}
          animate={{ x: [0, -8, 0], y: [0, -6, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute bottom-6 right-2 sm:right-8 z-30 w-60 glass-panel-base floating-card-depth-2 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-white tracking-tight">Study Group</span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]" />
          </div>
          <p className="text-[10px] text-neutral-300 font-medium mb-3.5">Algorithms Study Group<br/><span className="text-neutral-500 text-[9px] font-semibold">12 members active now</span></p>
          <div className="flex -space-x-2 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full border border-[#030712] bg-neutral-800 text-[8px] flex items-center justify-center font-bold text-neutral-400 shadow-sm">U{i}</div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 0 }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="absolute top-12 right-0 sm:right-4 z-30 w-48 glass-panel-base floating-card-depth-1 rounded-2xl p-4"
        >
          <div className="text-[9px] uppercase tracking-widest font-bold text-neutral-400 mb-1.5">Marketplace</div>
          <p className="text-[11px] font-bold text-white tracking-tight truncate">Mechanical Keyboard</p>
          <p className="text-[11px] font-black text-cyan-400 mt-2">₹2,500</p>
        </motion.div>

        <motion.div 
          initial={{ x: 0, y: 0 }}
          animate={{ x: [0, 6, 0], y: [0, 8, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute top-1/2 right-[-20px] sm:right-[-10px] z-30 w-48 glass-panel-base floating-card-depth-1 rounded-2xl p-4"
        >
          <div className="text-[9px] uppercase tracking-widest font-bold text-neutral-400 mb-1.5">Hackathon</div>
          <p className="text-[11px] font-bold text-white tracking-tight truncate">CodeArena 2024</p>
          <p className="text-[10px] text-cyan-400 font-bold mt-2 cursor-pointer hover:underline flex items-center gap-1">
            Register now <span className="text-xs">→</span>
          </p>
          <div className="mt-3 flex -space-x-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-4.5 h-4.5 rounded-full border border-neutral-950 bg-neutral-800" />
            ))}
            <span className="text-[8px] text-neutral-400 font-bold self-center pl-2">+124</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
