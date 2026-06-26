'use client'

import React from 'react'
import { Toaster, useToasterStore, toast as hotToast, Toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Loader2, X } from 'lucide-react'

// Custom stacked Toast Card Component
const CustomToastCard = ({ toast, index, total }: { toast: Toast; index: number; total: number }) => {
  // Swipe to dismiss drag handler
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100 || info.offset.x < -100) {
      hotToast.dismiss(toast.id)
    }
  }

  // Calculate chronological stack order (newest on top)
  const inverseIndex = total - 1 - index
  
  // Render up to 3 visible items in stack, collapse/hide the rest
  const isVisible = inverseIndex < 3
  
  // Stacking offset offsets
  const yOffset = isVisible ? inverseIndex * 10 : 0
  const scale = isVisible ? 1 - inverseIndex * 0.04 : 0.9
  const opacity = isVisible ? 1 - inverseIndex * 0.35 : 0

  // Style mapping for variants
  const typeConfig = {
    success: {
      bg: 'bg-[#0b0f19]/95 border-emerald-500/20 shadow-[0_8px_30px_rgba(16,185,129,0.06)]',
      icon: <CheckCircle2 className="text-emerald-400 w-4 h-4 shrink-0" />,
      barColor: 'bg-emerald-500'
    },
    error: {
      bg: 'bg-[#0f0b0c]/95 border-rose-500/20 shadow-[0_8px_30px_rgba(244,63,94,0.06)]',
      icon: <AlertCircle className="text-rose-400 w-4 h-4 shrink-0" />,
      barColor: 'bg-rose-500'
    },
    loading: {
      bg: 'bg-[#090d16]/95 border-cyan-500/20 shadow-[0_8px_30px_rgba(6,182,212,0.06)]',
      icon: <Loader2 className="text-cyan-400 w-4 h-4 animate-spin shrink-0" />,
      barColor: 'bg-cyan-500'
    },
    blank: {
      bg: 'bg-[#0d0d11]/95 border-white/[0.06] shadow-[0_8px_30px_rgba(255,255,255,0.03)]',
      icon: <Info className="text-zinc-400 w-4 h-4 shrink-0" />,
      barColor: 'bg-brand-500'
    },
    custom: {
      bg: 'bg-[#0b0c16]/95 border-indigo-500/20 shadow-[0_8px_30px_rgba(99,102,241,0.06)]',
      icon: <Info className="text-indigo-400 w-4 h-4 shrink-0" />,
      barColor: 'bg-indigo-500'
    }
  }

  // Handle standard warning types if sent as custom
  const isWarning = String(toast.message).toLowerCase().includes('warning') || String(toast.message).toLowerCase().includes('slow down')
  const variantKey = isWarning ? 'error' : (toast.type as keyof typeof typeConfig)
  const config = typeConfig[variantKey] || typeConfig.blank

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: -150, right: 150 }}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ 
        y: yOffset, 
        scale, 
        opacity,
        transition: { type: 'spring', stiffness: 350, damping: 28 } 
      }}
      exit={{ 
        opacity: 0, 
        x: 150, 
        scale: 0.9, 
        transition: { duration: 0.22 } 
      }}
      style={{
        zIndex: 100 - inverseIndex,
        pointerEvents: isVisible ? 'auto' : 'none',
        position: 'absolute',
        bottom: 0,
        right: 0,
      }}
      className={`w-full max-w-[340px] p-3.5 border rounded-xl backdrop-blur-2xl flex items-start gap-3 relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${config.bg}`}
    >
      <div className="mt-0.5 shrink-0">{isWarning ? <AlertTriangle className="text-amber-400 w-4 h-4 shrink-0" /> : config.icon}</div>
      
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[11px] text-zinc-300 font-semibold leading-relaxed font-sans text-left">
          {typeof toast.message === 'function' ? (toast.message as any)(toast) : toast.message}
        </p>
      </div>

      <button
        onClick={() => hotToast.dismiss(toast.id)}
        className="w-4 h-4 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors absolute top-3.5 right-3"
      >
        <X size={10} />
      </button>

      {/* Shrinking Countdown Progress Bar */}
      {toast.duration !== Infinity && toast.type !== 'loading' && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-[2px] ${config.barColor}`}
        />
      )}
    </motion.div>
  )
}

export default function ToastProvider() {
  const { toasts } = useToasterStore()

  return (
    <>
      {/* Hide the default toaster visual wrappers, keeping the state listeners active */}
      <Toaster>
        {(t) => <div style={{ display: 'none' }} />}
      </Toaster>
      
      {/* Custom responsive stack notification drawer */}
      <div className="fixed bottom-24 right-4 left-4 sm:left-auto md:bottom-6 md:right-6 z-[99999] w-[calc(100%-32px)] sm:w-[340px] h-[120px] pointer-events-none">
        <AnimatePresence>
          {toasts.map((t, idx) => (
            <CustomToastCard key={t.id} toast={t} index={idx} total={toasts.length} />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
