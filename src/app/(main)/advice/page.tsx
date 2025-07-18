import { AdviceForm } from "@/components/advice-form";

export default function AdvicePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">Personalized Financial Advice</h1>
        <p className="text-muted-foreground">
          Answer a few questions to receive AI-powered financial guidance tailored to your goals.
        </p>
      </div>
      <div className="mt-6">
        <AdviceForm />
      </div>
    </div>
  );
}
