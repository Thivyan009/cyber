import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Axento Books - Authentication",
  description: "Sign in or sign up to Axento Books",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
