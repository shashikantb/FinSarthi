import { FinancialCoach } from "@/components/financial-coach";

export default function CoachPage() {
  return (
    <div className="space-y-4">
       <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">FinSarthi Coach</h1>
        <p className="text-muted-foreground">
          Your personal AI financial coach. Ask me anything about your finances.
        </p>
      </div>
      <div className="mt-6">
        <FinancialCoach />
      </div>
    </div>
  );
}
