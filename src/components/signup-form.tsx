
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUser } from "@/services/user-service";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema is simplified for coach-only signup
const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignupFormValues = z.infer<typeof signupSchema>;

// This component is now only for the dedicated /signup page, for coaches.
export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const methods = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await createUser({
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.password, // This is insecure, for prototype only
        role: 'coach', // Role is hardcoded to 'coach'
        isAvailable: false, // Default coach to not available
      });
      
      toast({
        title: "Coach Account Created!",
        description: "You can now log in using the main login button on the homepage.",
      });
      
      router.push("/home");

    } catch (error) {
      console.error("Signup failed:", error);
      toast({
        title: "Signup Failed",
        description: "An error occurred. The email might already be in use.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-xl">Coach Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create a coach account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                placeholder="Max Robinson"
                {...methods.register("fullName")}
              />
              {methods.formState.errors.fullName && (
                  <p className="text-xs text-destructive">{methods.formState.errors.fullName.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...methods.register("email")}
              />
              {methods.formState.errors.email && (
                  <p className="text-xs text-destructive">{methods.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...methods.register("password")} />
              {methods.formState.errors.password && (
                  <p className="text-xs text-destructive">{methods.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Create Coach Account"}
            </Button>
          </form>
        </FormProvider>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/home" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
