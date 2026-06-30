import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64" />
      <Card className="p-0">
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="ml-auto h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-8 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </Card>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <KpiSkeleton />
      <TableSkeleton />
    </div>
  );
}
