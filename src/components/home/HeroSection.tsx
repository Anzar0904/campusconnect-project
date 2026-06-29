'use client'

import React, { useRef } from 'react'
import { 
  Sparkles, 
  Store, 
  Terminal, 
  Users, 
  Briefcase, 
  Calendar, 
  Award, 
  ArrowRight 
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useGsapMagnetic, useGsapTilt, Easing, getPrefersReducedMotion } from '@/hooks/useGsapMotion'

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sparklesRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const ctaContainerRef = useRef<HTMLDivElement>(null)
  const trustRef = useRef<HTMLDivElement>(null)
  const imageFrameRef = useRef<HTMLDivElement>(null)

  // Magnetic button effects for primary CTAs
  const getStartedRef = useGsapMagnetic(0.3) as React.RefObject<HTMLAnchorElement>
  const exploreRef = useGsapMagnetic(0.15) as React.RefObject<HTMLAnchorElement>

  // Subtle 3D tilt effects for surrounding widgets on hover
  const card1Ref = useGsapTilt(10) as React.RefObject<HTMLDivElement>
  const card2Ref = useGsapTilt(10) as React.RefObject<HTMLDivElement>
  const card3Ref = useGsapTilt(10) as React.RefObject<HTMLDivElement>
  const card4Ref = useGsapTilt(10) as React.RefObject<HTMLDivElement>
  const card5Ref = useGsapTilt(10) as React.RefObject<HTMLDivElement>
  const card6Ref = useGsapTilt(10) as React.RefObject<HTMLDivElement>
  const card7Ref = useGsapTilt(10) as React.RefObject<HTMLDivElement>

  useGSAP(() => {
    if (getPrefersReducedMotion()) {
      return
    }

    // 1. Initial Reveal Timeline
    const tl = gsap.timeline({ defaults: { ease: Easing.premium } })

    tl.fromTo(sparklesRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 })
      .fromTo(titleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.45')
      .fromTo(descRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
      .fromTo(ctaContainerRef.current?.children || [], { opacity: 0, y: 15, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, stagger: 0.08, duration: 0.6 }, '-=0.4')
      .fromTo(trustRef.current?.children || [], { opacity: 0, x: -10 }, { opacity: 1, x: 0, stagger: 0.06, duration: 0.5 }, '-=0.3')
      .fromTo(imageFrameRef.current, { opacity: 0, scale: 0.94, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 1, ease: Easing.power4Out }, 0.2)

    // Stagger reveal of the 7 cards
    const cards = [card1Ref.current, card2Ref.current, card3Ref.current, card4Ref.current, card5Ref.current, card6Ref.current, card7Ref.current]
    cards.forEach((card, index) => {
      if (card) {
        tl.fromTo(
          card,
          { opacity: 0, scale: 0.85, y: index % 2 === 0 ? 25 : -25 },
          { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: Easing.backOut },
          0.3 + index * 0.06
        )

        // Continuous floating animation loop using GSAP
        const deltaY = index % 2 === 0 ? 8 : -8
        const deltaX = index % 3 === 0 ? 3 : -3
        gsap.to(card, {
          y: `+=${deltaY}`,
          x: `+=${deltaX}`,
          duration: 3 + index * 0.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.1,
        })
      }
    })

    // Ambient glow movement loop (subtle mouse follow and floating glow)
    gsap.to('.bg-glow-1', {
      xPercent: 15,
      yPercent: -10,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
    gsap.to('.bg-glow-2', {
      xPercent: -15,
      yPercent: 15,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="relative min-h-[90vh] lg:min-h-screen w-full overflow-hidden bg-[#09090B] pt-24 pb-16 lg:pt-36 lg:pb-24 px-4 sm:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10">
      {/* Full‑screen background wrapper to ignore section padding */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Background Gradients & Ambient Effects */}
        <div className="bg-glow-1 absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.035),transparent_50%)] pointer-events-none" />
        <div className="bg-glow-2 absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(34,197,94,0.02),transparent_50%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.025)_0%,transparent_70%)] pointer-events-none" />
      </div>

      {/* Hero Content Left (45%) */}
      <div className="lg:col-span-5 flex flex-col justify-center space-y-6 z-10 text-center lg:text-left">
        <div 
          ref={sparklesRef}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.01] border border-white/[0.04] rounded-full w-fit mx-auto lg:mx-0 backdrop-blur-md shadow-sm"
        >
          <Sparkles size={11} className="text-brand-500 animate-pulse" />
          <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">Designed for college life</span>
        </div>

        <h1 
          ref={titleRef}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-sans"
        >
          The Operating System <br/>
          <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">for Campus Life.</span>
        </h1>

        <p 
          ref={descRef}
          className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 font-normal"
        >
          CampusConnect is your all-in-one student workspace. Learn, connect, trade, and grow with 20+ integrated modules designed exclusively for your college ecosystem.
        </p>

        <div 
          ref={ctaContainerRef}
          className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
        >
          <Link 
            ref={getStartedRef}
            href="/auth/login" 
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all duration-300 active:scale-95 shadow-[0_4px_20px_rgba(59,130,246,0.2)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.3)] inline-flex items-center justify-center gap-2 group"
          >
            Get Started
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link 
            ref={exploreRef}
            href="/dashboard" 
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.06] text-zinc-300 hover:text-white font-semibold text-sm transition-all duration-300 active:scale-95 inline-flex items-center justify-center gap-2"
          >
            Explore Campus
          </Link>
        </div>

        {/* Trust Indicators */}
        <div 
          ref={trustRef}
          className="flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-6 text-[11px] font-semibold text-zinc-500 justify-center lg:justify-start border-t border-white/[0.04] mt-6"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[#22C55E]">✓</span> Verified Students
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#22C55E]">✓</span> Secure College Network
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#22C55E]">✓</span> 20+ Campus Modules
          </div>
        </div>
      </div>

      {/* Hero Interactive Space Right (55%) */}
      <div className="lg:col-span-7 relative flex flex-col items-center justify-center w-full min-h-[420px] sm:min-h-[500px] lg:min-h-[660px] z-10 select-none overflow-visible">
        
        {/* Centerpiece Image Frame */}
        <div
          ref={imageFrameRef}
          className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[460px] lg:h-[460px] rounded-3xl overflow-hidden border border-white/[0.04] bg-[#18181B] p-1.5 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex items-center justify-center z-10"
        >
          <Image 
            src="/images/hero-centerpiece.jpg" 
            alt="CampusConnect Ecosystem Illustration representing students collaborating around a study desk"
            width={460}
            height={460}
            className="w-full h-full object-cover rounded-2xl filter brightness-95 contrast-[1.01]"
            priority
          />
          {/* Subtle reflection gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] via-transparent to-white/[0.03] pointer-events-none rounded-2xl" />
        </div>

        {/* Surrounding Floating Feature Cards */}
        <div className="w-full lg:absolute lg:inset-0 flex flex-wrap lg:block justify-center gap-4 mt-8 lg:mt-0 z-20">
          
          {/* Card 1: AI Assistant (Top-Left, Purple theme) */}
          <div 
            ref={card1Ref}
            className="w-[calc(50%-8px)] sm:w-[220px] lg:w-52 lg:absolute lg:top-4 lg:left-4 bg-[#18181B]/85 backdrop-blur-md border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#232329]/95 rounded-2xl p-4 transition-colors duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Sparkles size={11} />
              </div>
              <span className="text-[11px] font-semibold text-zinc-200">AI Assistant</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal font-normal">Found 3 internships matching your profile.</p>
          </div>

          {/* Card 2: Marketplace (Top-Right, Green theme) */}
          <div 
            ref={card2Ref}
            className="w-[calc(50%-8px)] sm:w-[220px] lg:w-52 lg:absolute lg:top-12 lg:right-[-20px] bg-[#18181B]/85 backdrop-blur-md border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#232329]/95 rounded-2xl p-4 transition-colors duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <Store size={11} />
              </div>
              <span className="text-[11px] font-semibold text-zinc-200">Marketplace</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">Mechanical KB</span>
              <span className="text-[10px] font-semibold text-green-400">₹2,500</span>
            </div>
          </div>

          {/* Card 3: Coding Arena (Middle-Left, Amber theme) */}
          <div 
            ref={card3Ref}
            className="w-[calc(50%-8px)] sm:w-[220px] lg:w-52 lg:absolute lg:top-[38%] lg:left-[-70px] bg-[#18181B]/85 backdrop-blur-md border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#232329]/95 rounded-2xl p-4 transition-colors duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Terminal size={11} />
              </div>
              <span className="text-[11px] font-semibold text-zinc-200">Coding Arena</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-zinc-400">Weekly Contest</span>
              <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">Live</span>
            </div>
          </div>

          {/* Card 4: Study Group (Bottom-Left, Blue theme) */}
          <div 
            ref={card4Ref}
            className="w-[calc(50%-8px)] sm:w-[220px] lg:w-52 lg:absolute lg:bottom-6 lg:left-[-20px] bg-[#18181B]/85 backdrop-blur-md border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#232329]/95 rounded-2xl p-4 transition-colors duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users size={11} />
              </div>
              <span className="text-[11px] font-semibold text-zinc-200">Study Group</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-zinc-400">Algorithms</span>
              <span className="text-[9px] text-zinc-500 font-medium">12 Active</span>
            </div>
          </div>

          {/* Card 5: Internships (Bottom-Right, Green match indicator) */}
          <div 
            ref={card5Ref}
            className="w-[calc(50%-8px)] sm:w-[220px] lg:w-52 lg:absolute lg:bottom-8 lg:right-[-20px] bg-[#18181B]/85 backdrop-blur-md border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#232329]/95 rounded-2xl p-4 transition-colors duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Briefcase size={11} />
              </div>
              <span className="text-[11px] font-semibold text-zinc-200">Internships</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">Frontend Intern</span>
              <span className="text-[8px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-1 py-0.5 rounded">92% Match</span>
            </div>
          </div>

          {/* Card 6: Events (Middle-Right, Blue theme) */}
          <div 
            ref={card6Ref}
            className="w-[calc(50%-8px)] sm:w-[220px] lg:w-52 lg:absolute lg:top-[42%] lg:right-[-70px] bg-[#18181B]/85 backdrop-blur-md border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#232329]/95 rounded-2xl p-4 transition-colors duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Calendar size={11} />
              </div>
              <span className="text-[11px] font-semibold text-zinc-200">Events</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-zinc-400 truncate">Hackathon</span>
              <span className="text-[9px] text-blue-400 font-medium">Tomorrow</span>
            </div>
          </div>

          {/* Card 7: Rewards (Top-Middle, Amber theme) */}
          <div 
            ref={card7Ref}
            className="w-[calc(50%-8px)] sm:w-[220px] lg:w-52 lg:absolute lg:top-[-25px] lg:left-[130px] bg-[#18181B]/85 backdrop-blur-md border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#232329]/95 rounded-2xl p-4 transition-colors duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Award size={11} />
              </div>
              <span className="text-[11px] font-semibold text-zinc-200">Rewards</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-zinc-400">Level Up</span>
              <span className="text-[9px] font-mono text-amber-400 font-semibold">+250 XP</span>
            </div>
        </div>
      </div>
    </div>
    </section>
  )
}
