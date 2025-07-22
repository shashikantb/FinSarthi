
import { SignupForm } from "@/components/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12">
        <div className="mx-auto max-w-sm w-full text-center">
            <SignupForm />
            <p className="text-sm text-muted-foreground mt-4 px-4">
                Are you a customer? For the best experience, <Link href="/onboarding" className="underline font-semibold text-primary">Get Started</Link> with our guided onboarding.
            </p>
        </div>
    </div>
  );
}
