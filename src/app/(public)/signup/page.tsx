
import { SignupForm } from "@/components/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12">
        <div className="mx-auto max-w-sm w-full text-center">
            <SignupForm />
            <p className="text-sm text-muted-foreground mt-4 px-4">
                This form is for coach registration only.
            </p>
        </div>
    </div>
  );
}
