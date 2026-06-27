'use client'

import React, { useState } from 'react'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'
import { Image as ImageIcon, BarChart2, Calendar, FileText, Heart, MessageSquare, Share2, Check } from 'lucide-react'
import { useGsapReveal } from '@/hooks/useGsapMotion'

export const FeedSection: React.FC = () => {
  const [postText, setPostText] = useState('')
  const containerRef = useGsapReveal({ stagger: 0.08, y: 15 }) as React.RefObject<HTMLDivElement>

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="card-premium rounded-2xl p-4">
        <div className="flex gap-3.5">
          <GlobalAvatar
            avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
            fullName="Ananya Singh"
            size="md"
          />
          <div className="flex-1">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's on your mind, Ananya?"
              className="w-full bg-transparent border-none outline-none resize-none text-xs text-neutral-200 placeholder-neutral-500 pt-2 h-10 focus:ring-0 font-medium"
            />
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.04] pt-3 mt-1.5">
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-100 px-2 py-1 rounded-lg hover:bg-white/[0.02] text-[11px] font-bold transition-all">
                  <ImageIcon size={13} className="text-neutral-400" />
                  <span>Photo</span>
                </button>
                <button className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-100 px-2 py-1 rounded-lg hover:bg-white/[0.02] text-[11px] font-bold transition-all">
                  <BarChart2 size={13} className="text-neutral-400" />
                  <span>Poll</span>
                </button>
                <button className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-100 px-2 py-1 rounded-lg hover:bg-white/[0.02] text-[11px] font-bold transition-all">
                  <Calendar size={13} className="text-neutral-400" />
                  <span>Event</span>
                </button>
                <button className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-100 px-2 py-1 rounded-lg hover:bg-white/[0.02] text-[11px] font-bold transition-all">
                  <FileText size={13} className="text-neutral-400" />
                  <span>Article</span>
                </button>
              </div>

              <button className="px-5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-blue-600/10">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 border-b border-white/[0.04] text-[11px] font-bold tracking-tight">
        <button className="text-blue-400 border-b-2 border-blue-400 pb-2 px-1">For You</button>
        <button className="text-neutral-500 hover:text-neutral-300 pb-2 px-1 transition-colors">Following</button>
        <button className="text-neutral-500 hover:text-neutral-300 pb-2 px-1 transition-colors">Trending</button>
      </div>

      <div 
        className="card-premium rounded-2xl p-4.5 space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-xs">
              TS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">Tech Society</span>
                <div className="w-3 h-3 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                  <Check size={8} className="text-blue-400" strokeWidth={3} />
                </div>
              </div>
              <span className="text-[10px] text-neutral-500">2h ago</span>
            </div>
          </div>
          <button className="text-neutral-500 hover:text-white text-xs">•••</button>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-white tracking-tight">Hack the future at CodeArena 2024 🚀</p>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
            India&apos;s biggest inter-college coding competition. Register now and showcase your skills! Let&apos;s build something great!
          </p>
        </div>

        <div className="relative rounded-xl overflow-hidden aspect-[21/9] bg-[#050811] border border-white/[0.04] flex items-center justify-between px-8 group cursor-pointer shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-blue-900/10 opacity-40 pointer-events-none" />
          <div className="z-10">
            <h3 className="text-xl font-black text-white tracking-tighter leading-none">
              CODEARENA <br />
              <span className="text-blue-500 font-black">2024</span>
            </h3>
          </div>
          <div className="absolute right-4 bottom-0 top-0 w-1/2 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-2xl absolute animate-pulse" />
            <span className="text-6xl filter drop-shadow-md transform group-hover:scale-105 transition-transform duration-500">👨‍💻</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 text-[11px] font-bold text-neutral-400">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 hover:text-rose-400 transition-colors">
              <Heart size={13} />
              <span>182</span>
            </button>
            <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
              <MessageSquare size={13} />
              <span>24 Comments</span>
            </button>
          </div>
          <button className="flex items-center gap-1 hover:text-neutral-200 transition-colors">
            <Share2 size={13} />
            <span>12 Shares</span>
          </button>
        </div>
      </div>
    </div>
  )
}
