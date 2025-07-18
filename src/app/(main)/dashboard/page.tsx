import { DashboardOverview } from "@/components/dashboard-overview";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
        <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold md:text-3xl">Welcome back, User!</h1>
            <p className="text-muted-foreground">
                Here's a snapshot of your financial health.
            </p>
        </div>
        <DashboardOverview />
    </div>
  );
}
