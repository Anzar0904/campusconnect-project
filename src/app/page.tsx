import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { NotificationProvider } from '@/hooks/useNotifications'
import { ProfileProvider } from '@/hooks/useCurrentProfile'
import { HeroSection } from '@/components/home/HeroSection'
import { ModuleSection } from '@/components/home/ModuleSection'
import { FeedSection } from '@/components/dashboard/FeedSection'
import { RightWidgetsColumn, MiddleRightWidgetsColumn } from '@/components/dashboard/SidebarWidgets'
import { ArrowRight, Star, Heart, Shield, Terminal, ArrowUpRight } from 'lucide-react'

export const metadata = {
  title: 'CampusConnect - Student Operating System',
  description: 'All-in-one student OS architecture dashboard layout layer.',
}

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <ProfileProvider initialProfile={null} userId="">
      <NotificationProvider userId="">
        <div className="min-h-screen bg-[#030712] text-neutral-100 flex flex-col font-sans antialiased selection:bg-blue-500/30 selection:text-white overflow-x-hidden">
        <Navbar />

        <main className="flex-1 flex flex-col w-full z-10">
          <HeroSection />
          
          <div className="my-4">
            <ModuleSection />
          </div>

          {/* Primary Functional Dashboard Node Grid */}
          <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-12 lg:px-20 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
            <div className="lg:col-span-6 xl:col-span-6">
              <FeedSection />
            </div>

            <div className="lg:col-span-3 xl:col-span-3">
              <MiddleRightWidgetsColumn />
            </div>

            <div className="lg:col-span-3 xl:col-span-3">
              <RightWidgetsColumn />
            </div>
          </div>

          {/* High Fidelity Testimonials Grid Section Pass */}
          <section className="w-full px-6 sm:px-12 lg:px-20 py-16 bg-[#030712]/50 relative">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-ambient-purple opacity-20 pointer-events-none filter blur-[100px]" />
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-3 mb-12">
                <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase bg-cyan-400/10 px-2.5 py-1 rounded-md border border-cyan-500/10">Wall of Trust</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">What Student Leaders Say</h2>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto font-medium">Connecting campuses natively from inside the modern student workspace framework.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Rahul Mehta", role: "GDSC Lead, IITB", text: "CampusConnect changed how our entire developer society operates. Structuring tasks, events, and community updates has never been this fluid.", avatar: "RM" },
                  { name: "Sneha Nair", role: "Cultural Sec, NITK", text: "We managed our entire annual fest operations layer via CampusConnect. From ticket sales inside the marketplace module to real-time chat sync.", avatar: "SN" },
                  { name: "Kabir Verma", role: "B.Tech CSE, SRM", text: "The automated AI internship match engine paired me with a funded product team within two weeks of updating my profile array node.", avatar: "KV" }
                ].map((t, idx) => (
                  <div key={idx} className="glass-panel-base rounded-2xl p-5 flex flex-col justify-between group hover:border-cyan-500/20 transition-all duration-300">
                    <div>
                      <div className="flex gap-1 mb-4 text-pink-500">
                        {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" strokeWidth={0} />)}
                      </div>
                      <p className="text-neutral-300 text-xs sm:text-[13px] leading-relaxed font-medium italic">&ldquo;{t.text}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-3 mt-5 border-t border-white/[0.04] pt-3.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shadow-inner">
                        {t.avatar}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-tight">{t.name}</h4>
                        <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* High Fidelity Space Optimized CTA Module Layer */}
          <section className="w-full px-6 sm:px-12 lg:px-20 py-16 bg-[#030712]">
            <div className="max-w-5xl mx-auto glass-panel-base rounded-3xl p-8 sm:p-12 relative overflow-hidden text-center space-y-6 shadow-[0_0_80px_rgba(37,99,235,0.15)] border-white/[0.08]">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto shadow-inner mb-2 animate-bounce">
                <Terminal size={20} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight max-w-xl mx-auto leading-tight">
                Ready to Upgrade Your <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Campus Protocol?</span>
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto font-medium">
                Join half a million students deployment infrastructure operating on the next-generation spatial engine structure layer.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <Link href="/auth/login" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide transition-all duration-300 shadow-[0_4px_25px_rgba(37,99,235,0.45)] flex items-center gap-2 group cursor-pointer">
                  Deploy Now Free
                  <ArrowRight size={14} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="mailto:support@campusconnect.com" className="px-6 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-neutral-300 font-bold text-xs tracking-wide transition-all duration-300 backdrop-blur-md cursor-pointer">
                  Contact Core Systems
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Premium Multi-Column Grid System Footer */}
        <footer className="w-full border-t border-white/[0.05] bg-[#01040a] z-10 pt-12 pb-6 px-6 sm:px-12 lg:px-20">
          <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 text-xs font-medium text-neutral-400">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <svg className="w-7 h-7 shrink-0 drop-shadow-[0_0_8px_rgba(6,182,212,0.45)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M75,28 C62,13 38,13 25,28 C12,43 12,63 25,78 C38,93 62,93 75,78 C82,71 85,62 84,53 C83,48 78,49 79,54 C80,60 78,66 73,71 C63,81 43,81 33,71 C23,61 23,45 33,35 C43,25 63,25 73,35 C77,39 79,45 79,51 C79,56 84,55 84,50 C84,41 81,34 75,28 Z"
                    fill="url(#c-gradient-landing)"
                    strokeWidth="1"
                  />
                  <linearGradient id="c-gradient-landing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </svg>
                <span className="text-white font-bold text-base tracking-tight">Campus<span className="text-neutral-400 font-normal">Connect</span></span>
              </div>
              <p className="text-neutral-500 max-w-sm text-[11px] leading-relaxed">
                The comprehensive hyper-scalable Operating System custom engineered to organize student nodes, digital assets, and cross-functional connectivity paths.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white text-[10px]">Architecture</h4>
              <ul className="space-y-2 text-[11px]">
                <li className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center gap-0.5">Core Kernel <ArrowUpRight size={10} className="opacity-40" /></li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Distributed Feed</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Spatial Matching</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white text-[10px]">Resources</h4>
              <ul className="space-y-2 text-[11px]">
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">API Endpoint</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">System Status</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Dev Documentation</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white text-[10px]">Security</h4>
              <ul className="space-y-2 text-[11px]">
                <li className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center gap-1"><Shield size={10} className="text-emerald-400" /> AES-256 Auth</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Privacy Nodes</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="max-w-[1600px] mx-auto pt-6 border-t border-white/[0.03] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase font-bold tracking-widest text-neutral-600">
            <div className="flex items-center gap-1.5">
              <span>CampusConnect Architecture Suite</span>
              <span className="text-neutral-800">•</span>
              <span className="text-neutral-500 font-semibold lowercase">v2026.4.2 space-engine-optimized</span>
            </div>
            <div className="flex items-center gap-1 hover:text-neutral-400 cursor-pointer transition-colors">
              <span>Secured Node Stack</span>
              <Heart size={10} className="text-rose-600 fill-rose-600" />
              <span>Encrypted Connection</span>
            </div>
          </div>
        </footer>
      </div>
      </NotificationProvider>
    </ProfileProvider>
  )
}
