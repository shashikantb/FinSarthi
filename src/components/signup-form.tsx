
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleEnum } from "@/lib/db/schema";

const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(roleEnum.enumValues),
});

type SignupFormValues = z.infer<typeof signupSchema>;

// This component is now only for the dedicated /signup page, not the onboarding flow.
export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const methods = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'customer',
    }
  });

  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await createUser({
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.password, // This is insecure, for prototype only
        role: data.role,
        isAvailable: data.role === 'coach' ? false : undefined, // Default coach to not available
      });
      
      toast({
        title: "Account Created!",
        description: "You can now log in.",
      });
      
      router.push("/login");

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
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="role">I am a...</Label>
                <Select onValueChange={(value) => methods.setValue('role', value as 'customer' | 'coach')} defaultValue="customer">
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                  </SelectContent>
                </Select>
                 {methods.formState.errors.role && (
                  <p className="text-xs text-destructive">{methods.formState.errors.role.message}</p>
                )}
            </div>
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
              {isLoading ? <Loader2 className="animate-spin" /> : "Create an account"}
            </Button>
          </form>
        </FormProvider>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
