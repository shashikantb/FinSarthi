import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
       <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      <div className="space-y-8 mt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/4" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
             <Skeleton className="h-6 w-1/4" />
             <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
             <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
