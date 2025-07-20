
// src/components/dashboard-overview.tsx
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

interface FinancialData {
  income: number;
  expenses: number;
}

export function DashboardOverview() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Fetch the entire history
      const savedHistory = localStorage.getItem("finsarthi_advice_history");
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        // Use the most recent entry for the dashboard
        if (history.length > 0) {
            const latestEntry = history[0];
            setData({
                income: latestEntry.income || 0,
                expenses: latestEntry.expenses || 0,
            });
        }
      }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setData(null);
    }
    setLoading(false);
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
          <CardTitle>No Financial Data Found</CardTitle>
          <CardDescription>
            You haven't generated any personalized advice yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">Get started by answering a few questions to create your financial snapshot.</p>
          <Button asChild>
            <Link href="/advice">Generate My Advice</Link>
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
                    <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{monthlySavings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Based on your latest input</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Investment Growth</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+8.1%</div>
                    <p className="text-xs text-muted-foreground">Total portfolio value $12,430</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">750</div>
                    <p className="text-xs text-muted-foreground">+10 points from last check</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Budget Adherence</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">95%</div>
                    <p className="text-xs text-muted-foreground">You are doing great this month!</p>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Income vs. Expenses</CardTitle>
                <CardDescription>A look at your cash flow over the last 6 months (simulated).</CardDescription>
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
