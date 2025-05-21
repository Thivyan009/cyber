"use client";

import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import GoogleAnalytics from "@/components/analytics/google-analytics";
import "@/styles/globals.css";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { BusinessProvider } from "@/hooks/use-business";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  const isOnboardingPage =
    pathname?.startsWith("/onboarding") ||
    pathname === "/force-onboarding-direct";
  const shouldShowHeader = !isAuthPage && !isOnboardingPage;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics />
        <Toaster position="top-right" />
        <CurrencyProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <BusinessProvider>
              <Providers>
                <div className="relative flex min-h-screen flex-col">
                  {shouldShowHeader && <Header />}
                  <main className="flex-1">{children}</main>
                </div>
              </Providers>
            </BusinessProvider>
          </ThemeProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
