
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-xl shadow-sm">
    {icon}
    <h3 className="mt-4 mb-2 text-lg font-bold font-headline">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
)

const sliderImages = [
    { src: 'https://placehold.co/1200x600.png', alt: 'Financial coach advising a client', hint: 'financial advice' },
    { src: 'https://placehold.co/1200x600.png', alt: 'A person creating a budget at a desk', hint: 'budgeting desk' },
    { src: 'https://placehold.co/1200x600.png', alt: 'An upward-trending investment chart on a screen', hint: 'investment chart' },
    { src: 'https://placehold.co/1200x600.png', alt: 'A happy couple planning their finances together', hint: 'happy couple' },
]

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
               <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full max-w-xl"
                >
                <CarouselContent>
                    {sliderImages.map((image, index) => (
                    <CarouselItem key={index}>
                        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-2xl">
                            <Image
                                src={image.src}
                                alt={image.alt}
                                fill
                                className="object-cover"
                                data-ai-hint={image.hint}
                            />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                             <div className="absolute bottom-0 left-0 p-6">
                                <h3 className="text-xl font-bold text-white font-headline">{image.alt}</h3>
                             </div>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
             </Carousel>
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
