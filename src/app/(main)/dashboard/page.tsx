
"use client";

import { DashboardOverview } from "@/components/dashboard-overview";
import { useAppTranslations } from "@/hooks/use-app-translations";

export default function DashboardPage() {
  const { t } = useAppTranslations();
  return (
    <div className="space-y-4">
        <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold md:text-3xl">{t.dashboard.welcome}</h1>
            <p className="text-muted-foreground">
                {t.dashboard.snapshot}
            </p>
        </div>
        <DashboardOverview />
    </div>
  );
}
