import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          {/* Logo placeholder */}
          <div className="flex justify-center">
            <Skeleton className="h-12 w-[180px] rounded-md" />
          </div>
          <Skeleton className="mx-auto h-7 w-[220px]" />
          <Skeleton className="mx-auto h-4 w-[180px]" />
        </div>

        <div className="space-y-4">
          {/* Form fields placeholders */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
            <Skeleton className="h-4 w-[120px]" />
          </div>

          <Skeleton className="h-10 w-full" />
        </div>

        <div className="text-center">
          <Skeleton className="mx-auto h-4 w-[200px]" />
        </div>
      </div>
    </div>
  );
}
