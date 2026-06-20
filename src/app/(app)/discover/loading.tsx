import { Skeleton } from '@/components/ui/Skeleton'

export default function DiscoverLoading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Skeleton className="h-10 flex-1 min-w-48" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card-premium p-6 flex flex-col items-center text-center space-y-5">
            <Skeleton variant="circle" className="w-20 h-20" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto opacity-60" />
            </div>
            <Skeleton className="h-12 w-full opacity-40" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
