
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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppTranslations } from "@/hooks/use-app-translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleEnum } from "@/lib/db/schema";


const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password cannot be empty."),
  role: z.enum(roleEnum.enumValues),
});

type LoginFormValues = z.infer<typeof loginSchema>;


export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useAppTranslations();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'customer'
    }
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    const loggedInUser = await login(data.email, data.password, data.role);
    if (loggedInUser) {
        if (loggedInUser.role === 'coach') {
            router.push("/coach-dashboard");
        } else {
            router.push("/dashboard");
        }
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials or role. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{t.login_page.title}</CardTitle>
          <CardDescription>
            {t.login_page.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4">
               <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  onValueChange={(value) => form.setValue('role', value as 'customer' | 'coach')}
                  defaultValue={form.getValues('role')}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t.onboarding.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...form.register("email")}
                />
                 {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t.onboarding.password}</Label>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    {t.login_page.forgot_password}
                  </Link>
                </div>
                <Input id="password" type="password" {...form.register("password")} />
                {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.common.login}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            {t.login_page.no_account}{" "}
            <Link href="/signup" className="underline">
              {t.login_page.signup}
            </Link>
          </div>
        </CardContent>
        <div className="pb-4 text-center text-sm">
            <Link href="/home" className="underline text-muted-foreground">
              Back to Home
            </Link>
        </div>
      </Card>
    </div>
  );
}
