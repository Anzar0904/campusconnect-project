import { Skeleton } from '@/components/ui/Skeleton'

export default function MessagesLoading() {
  return (
    <div className="card-premium h-[calc(100vh-140px)] overflow-hidden flex animate-fade-in">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r border-white/[0.05] flex flex-col">
        <div className="p-4 border-b border-white/[0.05]">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="flex-1 p-2 space-y-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-3 flex gap-3">
              <Skeleton variant="circle" className="w-12 h-12 shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area Skeleton */}
      <div className="flex-1 flex flex-col bg-zinc-900/20">
        <div className="h-[73px] px-6 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="w-10 h-10" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        
        <div className="flex-1 p-6 space-y-8 overflow-hidden">
          <div className="flex flex-col items-start space-y-2 max-w-[70%]">
            <Skeleton className="h-10 w-64 rounded-2xl rounded-tl-none" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex flex-col items-end space-y-2 ml-auto max-w-[70%]">
            <Skeleton className="h-16 w-80 rounded-2xl rounded-tr-none bg-indigo-500/10 border-indigo-500/20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex flex-col items-start space-y-2 max-w-[70%]">
            <Skeleton className="h-20 w-72 rounded-2xl rounded-tl-none" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="p-4 border-t border-white/[0.05]">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
