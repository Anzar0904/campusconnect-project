import { Skeleton } from '@/components/ui/Skeleton'

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 space-y-8">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20" />
      </div>
      <div className="space-y-3 w-64">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>
    </div>
  )
}
