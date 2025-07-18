import { AdviceForm } from "@/components/advice-form";

export default function OnboardingPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">Let's Get to Know You</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Answer a few questions to receive AI-powered financial guidance tailored to your goals. 
          This will help us create your personalized financial plan.
        </p>
      </div>
      <div className="mt-6 max-w-4xl mx-auto">
        <AdviceForm />
      </div>
    </div>
  );
}
