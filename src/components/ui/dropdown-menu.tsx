"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, ChevronRight } from "lucide-react"

// Lightweight dropdown menu components built without Radix UI dependency
// Uses native HTML + CSS for maximum compatibility

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
})

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  children,
  asChild,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  const { setOpen, open } = React.useContext(DropdownMenuContext)
  return (
    <div
      className={cn("cursor-pointer", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 4,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "end"
  sideOffset?: number
}) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown-content]')) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, setOpen])

  if (!open) return null

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }

  return (
    <div
      data-dropdown-content
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] glass-dropdown rounded-xl p-1 shadow-2xl",
        alignClasses[align],
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuGroup({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("py-1", className)} {...props}>{children}</div>
}

function DropdownMenuItem({
  className,
  inset,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors focus:outline-none",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { checked?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg pl-8 pr-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check size={12} className="text-brand-400" />}
      </span>
      {children}
    </div>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg pl-8 pr-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("my-1 h-px bg-white/[0.06]", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ml-auto text-[10px] font-mono text-zinc-500 tracking-widest", className)}
      {...props}
    />
  )
}

function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <div className="relative">{children}</div>
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight size={12} className="ml-auto text-zinc-500" />
    </div>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "absolute left-full top-0 z-50 min-w-[8rem] glass-dropdown rounded-xl p-1 shadow-2xl ml-1",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuRadioGroup({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
