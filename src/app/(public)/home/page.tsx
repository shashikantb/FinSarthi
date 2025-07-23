"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bot, BarChart2, MessageSquare, Briefcase } from "lucide-react";
import { AuthDialog } from "@/components/auth-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FinancialCoach } from "@/components/financial-coach";
import type { User } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppTranslations } from "@/providers/translations-provider";

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-xl shadow-sm">
    {icon}
    <h3 className="mt-4 mb-2 text-lg font-bold font-headline">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
)

const HeroIllustration = () => (
    <div className="relative flex justify-center items-center">
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-primary/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/10 rounded-full animate-pulse delay-500"></div>
        <div className="relative p-8 bg-card/60 backdrop-blur-sm rounded-full shadow-lg border">
            <Bot className="h-32 w-32 text-primary" strokeWidth={1.5} />
            <div className="absolute top-8 -right-4 bg-card p-3 rounded-full shadow-md">
                <BarChart2 className="h-6 w-6 text-accent"/>
            </div>
             <div className="absolute bottom-8 -left-4 bg-card p-3 rounded-full shadow-md">
                <MessageSquare className="h-6 w-6 text-accent"/>
            </div>
        </div>
    </div>
)


export default function HomePage() {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const router = useRouter();
  const { t } = useAppTranslations();
  
  const guestUser: User = {
      id: "guest",
      fullName: "Guest",
      email: null,
      phone: null,
      passwordHash: null,
      age: null,
      city: null,
      country: null,
      gender: null,
      role: "customer",
      isAvailable: false,
      createdAt: new Date(),
  };

  return (
    <div className="flex flex-col bg-background">
      <section className="relative w-full py-20 md:py-32 lg:py-40">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 xl:gap-32">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl xl:text-6xl/none">
                  {t.home.title}
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  {t.home.description}
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button onClick={() => setIsAuthDialogOpen(true)} size="lg">
                    {t.home.get_started} <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">{t.home.toolkit_title}</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-lg lg:text-base xl:text-lg">
                        {t.home.toolkit_description}
                    </p>
                </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
               <FeatureCard 
                    icon={<MessageSquare className="h-12 w-12 text-primary" />}
                    title={t.home.feature1_title}
                    description={t.home.feature1_desc}
                />
                <FeatureCard 
                    icon={<Briefcase className="h-12 w-12 text-primary" />}
                    title={t.home.feature2_title}
                    description={t.home.feature2_desc}
                />
                 <FeatureCard 
                    icon={<BarChart2 className="h-12 w-12 text-primary" />}
                    title={t.home.feature3_title}
                    description={t.home.feature3_desc}
                />
            </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
             <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">{t.home.try_now_title}</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-lg lg:text-base xl:text-lg">
                        {t.home.try_now_desc}
                    </p>
                </div>
            </div>
            <FinancialCoach currentUser={guestUser} />
        </div>
      </section>
      
      <AuthDialog 
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        onLoginSuccess={() => {
            setIsAuthDialogOpen(false);
            router.push('/coach');
        }}
      />
    </div>
  );
}
