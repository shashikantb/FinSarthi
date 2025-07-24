
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  LayoutGrid,
  Lightbulb,
  Languages,
  Menu,
  User,
  PanelLeft,
  MessageCircle,
  Settings,
  Loader2,
  LogOut,
  Users,
  History,
  Contact
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
  SidebarMenuBadge,
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
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { useAppTranslations } from "@/providers/translations-provider";
import { getUnreadMessageCountForUser } from "@/services/chat-service";

function AppHeader() {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const { t } = useAppTranslations();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/home');
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger><Menu className="h-5 w-5"/></SidebarTrigger>}
         <div className="hidden md:block">
            <Logo/>
         </div>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Search can go here */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src="https://placehold.co/100x100" data-ai-hint="profile picture" alt={user?.fullName ?? 'User'} />
                <AvatarFallback>{user?.fullName?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t.common.my_account}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/settings">{t.common.settings}</Link></DropdownMenuItem>
            <DropdownMenuItem>{t.common.support}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t.common.logout}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function MainSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const { t } = useAppTranslations();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchCount = async () => {
      try {
        const count = await getUnreadMessageCountForUser(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread message count", error);
      }
    };
    
    fetchCount();
    const interval = setInterval(fetchCount, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [user, pathname]); // Re-check when user changes or path changes


  const handleLogout = () => {
    logout();
    router.push('/home');
  };
  
  const menuItems = [
    { href: "/coach", label: t.nav.coach, icon: MessageCircle, badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { href: "/advice", label: t.nav.advice, icon: History },
    { href: "/summarizer", label: t.nav.summarizer, icon: FileText },
    { href: "/translator", label: t.nav.translator, icon: Languages },
    { href: "/coaches", label: t.nav.regional_coaches, icon: Users },
    { href: "/contact", label: t.nav.contact_us, icon: Contact },
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
                  {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="mb-2"/>
        <SidebarMenu>
            <SidebarMenuItem>
                 <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/settings")}
                    tooltip={{ children: t.common.settings, hidden: state === 'expanded' }}
                >
                    <Link href="/settings">
                        <Settings />
                        <span>{t.common.settings}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                 <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip={{ children: t.common.logout, hidden: state === 'expanded' }}
                >
                    <LogOut />
                    <span>{t.common.logout}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <MainSidebar />
                <div className="flex flex-1 flex-col sm:gap-4 sm:py-4 md:pl-[var(--sidebar-width-icon)] group-data-[state=expanded]/sidebar-wrapper:md:pl-[var(--sidebar-width)] transition-[padding-left] duration-200">
                    <AppHeader/>
                    <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
}

function CoachLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/home');
  };

  const navItems = [
    { href: '/coach-dashboard', label: 'Requests' },
    { href: '/coach', label: 'Chat' },
  ]

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Logo />
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
           {navItems.map(item => (
             <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-foreground ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground'}`}
            >
                {item.label}
            </Link>
           ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="https://placehold.co/100x100" data-ai-hint="profile picture" alt={user?.fullName ?? 'Coach'} />
                  <AvatarFallback>{user?.fullName?.[0]?.toUpperCase() ?? 'C'}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  )
}


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/home");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user.role === 'coach') {
    const allowedCoachRoutes = ['/coach-dashboard', '/coach'];
    // If user is a coach and not on an allowed coach page, redirect them.
    if (!allowedCoachRoutes.includes(pathname)) {
      router.replace('/coach-dashboard');
      // Show a loading spinner while redirecting
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    // Render the dedicated layout for coaches
    return <CoachLayout>{children}</CoachLayout>;
  }

  // If a customer tries to access a coach route, redirect them to their main page
  if (user.role === 'customer' && (pathname === '/coach-dashboard')) {
      router.replace('/coach');
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  // Render the standard protected layout for customers
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
