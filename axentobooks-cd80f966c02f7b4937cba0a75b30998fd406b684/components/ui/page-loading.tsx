import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-[80%]" />
              <Skeleton className="h-4 w-[60%]" />
              <Skeleton className="h-32 w-full" />
              <div className="flex justify-between mt-4">
                <Skeleton className="h-8 w-[100px]" />
                <Skeleton className="h-8 w-[100px]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary content section */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-8 w-[120px]" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </div>
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
