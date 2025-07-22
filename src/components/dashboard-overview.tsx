
"use client";

import { useEffect, useState } from "react";
import { BarChart, CreditCard, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { Button } from "./ui/button";
import { getLatestAdviceSessionForUser } from "@/services/advice-service";
import type { AdviceSession } from "@/lib/db/schema";
import { useAppTranslations } from "@/hooks/use-app-translations";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export function DashboardOverview() {
  const [data, setData] = useState<AdviceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useAppTranslations();

  useEffect(() => {
    async function loadDashboardData() {
        setLoading(true);
        try {
            // For this prototype, we fetch data for the most recently created user
            // to simulate a logged-in state.
            const latestSession = await getLatestAdviceSessionForUser();
            setData(latestSession);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
            setData(null);
        }
        setLoading(false);
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-80" />
        </div>
    );
  }

  if (!data) {
    return (
      <Card className="w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-3 w-fit">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>{t.dashboard.no_data_title}</CardTitle>
          <CardDescription>
            {t.dashboard.no_data_desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">{t.dashboard.no_data_cta_text}</p>
          <Button asChild>
            <Link href="/advice">{t.dashboard.no_data_cta_button}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const monthlySavings = data.income - data.expenses;
  
  const chartData = [
    { month: "Current", income: data.income, expenses: data.expenses },
    { month: "Prev 1", income: data.income * 0.9, expenses: data.expenses * 1.05 },
    { month: "Prev 2", income: data.income * 0.95, expenses: data.expenses * 0.98 },
    { month: "Prev 3", income: data.income * 0.88, expenses: data.expenses * 1.1 },
    { month: "Prev 4", income: data.income * 0.92, expenses: data.expenses * 1.02 },
    { month: "Prev 5", income: data.income * 0.85, expenses: data.expenses * 0.95 },
  ].reverse();

  return (
    <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.monthly_savings}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{monthlySavings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{t.dashboard.based_on_input}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.investment_growth}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+8.1%</div>
                    <p className="text-xs text-muted-foreground">{t.dashboard.total_portfolio}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.credit_score}</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">750</div>
                    <p className="text-xs text-muted-foreground">{t.dashboard.from_last_check}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.dashboard.budget_adherence}</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">95%</div>
                    <p className="text-xs text-muted-foreground">{t.dashboard.doing_great}</p>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>{t.dashboard.income_vs_expenses}</CardTitle>
                <CardDescription>{t.dashboard.cash_flow_desc}</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <RechartsBarChart accessibilityLayer data={chartData}>
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
