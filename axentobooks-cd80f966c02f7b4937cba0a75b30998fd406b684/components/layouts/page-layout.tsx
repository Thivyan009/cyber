import type { ReactNode } from "react";
import { PageSidebar } from "@/components/layouts/page-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PageTransition } from "@/components/motion/page-transition";
import { FadeIn } from "@/components/motion/fade-in";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function PageLayout({ children, title, description }: PageLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Fixed sidebar */}
        <div className="fixed left-0 top-0 z-30 h-screen">
          <PageSidebar />
        </div>
        {/* Main content with left margin to account for fixed sidebar */}
        <div className="flex-1 ml-64">
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <FadeIn>
              <div className="px-8 py-3 mb-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
              </div>
            </FadeIn>
          </div>
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </SidebarProvider>
  );
}
