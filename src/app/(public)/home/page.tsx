
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bot, BarChart2, MessageSquare, Briefcase } from "lucide-react";

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
  return (
    <div className="flex flex-col bg-background">
      <section className="relative w-full py-20 md:py-32 lg:py-40">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 xl:gap-32">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Your Personal AI Financial Coach
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  FinSarthi provides personalized financial advice to help you
                  achieve your goals. Get guidance on budgeting, saving,
                  investing, and more.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/onboarding">
                    Get Started <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                   <Link href="/login">
                    Login
                  </Link>
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
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">All-in-One Financial Toolkit</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-lg lg:text-base xl:text-lg">
                        From asking simple questions to generating complex financial plans, FinSarthi has the tools you need to succeed.
                    </p>
                </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
               <FeatureCard 
                    icon={<MessageSquare className="h-12 w-12 text-primary" />}
                    title="AI Coach"
                    description="Get instant answers to your financial questions from our conversational AI."
                />
                <FeatureCard 
                    icon={<Briefcase className="h-12 w-12 text-primary" />}
                    title="Personalized Plans"
                    description="Generate detailed, step-by-step financial plans tailored to your specific goals."
                />
                 <FeatureCard 
                    icon={<BarChart2 className="h-12 w-12 text-primary" />}
                    title="Financial Tools"
                    description="Simplify complex news and financial jargon with our easy-to-use summarizer and translator."
                />
            </div>
        </div>
      </section>

    </div>
  );
}
