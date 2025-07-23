import { Logo } from "@/components/logo";
import React from "react";

function PublicFooter() {
    return (
        <footer className="py-6 md:px-8 md:py-0 border-t">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built by FINmate.
                </p>
            </div>
        </footer>
    )
}


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <Logo />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <PublicFooter/>
    </div>
  );
}
