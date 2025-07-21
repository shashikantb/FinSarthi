
import { SignupForm } from "@/components/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="mx-auto max-w-sm w-full text-center">
            <SignupForm />
            <p className="text-sm mt-4">
                Trying to get started? <Link href="/onboarding" className="underline">Go to onboarding</Link>.
            </p>
        </div>
    </div>
  );
}
