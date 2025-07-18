"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutGrid,
  Lightbulb,
  Languages,
  Menu,
  User,
  PanelLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

function AppHeader() {
  const isMobile = useIsMobile();
  
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger asChild><Button variant="outline" size="icon" className="shrink-0"><Menu className="h-5 w-5"/></Button></SidebarTrigger>}
         <Logo/>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Search can go here */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src="https://placehold.co/100x100" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


function Logo() {
    return (
        <Link href="/dashboard" className="flex items-center gap-2 font-headline font-bold text-lg">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
            >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-primary">FinSarthi</span>
        </Link>
    )
}

function MainSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  
  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/summarizer", label: "News Summarizer", icon: FileText },
    { href: "/translator", label: "Term Translator", icon: Languages },
    { href: "/advice", label: "Personalized Advice", icon: Lightbulb },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-2">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label, hidden: state === 'expanded' }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <Separator className="mb-2"/>
        <div className="p-2 flex items-center gap-2">
            <Avatar>
                <AvatarImage src="https://placehold.co/100x100" alt="User" />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-sm font-semibold">User</span>
                <span className="text-xs text-muted-foreground">user@email.com</span>
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <MainSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 md:pl-[var(--sidebar-width-icon)] group-data-[state=expanded]/sidebar-wrapper:md:pl-[var(--sidebar-width)] transition-[padding-left] duration-200">
           <AppHeader/>
           <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
