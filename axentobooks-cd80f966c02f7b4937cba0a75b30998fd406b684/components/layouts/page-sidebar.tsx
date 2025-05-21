"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  Calendar,
  FileSpreadsheet,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { BusinessName } from "@/components/layouts/business-name";
import { Suspense } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: FileSpreadsheet,
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Beta Feedback",
    href: "/feedback",
    icon: MessageSquare,
  },
];

export function PageSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 z-[60] h-[calc(100vh-4rem)] w-64 border-r bg-sidebar-background">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Suspense fallback={<div className="h-6 w-24 animate-pulse rounded bg-muted" />}>
            <BusinessName />
          </Suspense>
        </div>
        <SidebarSeparator />
        <SidebarContent className="h-[calc(100vh-5rem)] overflow-y-auto">
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <Link href={item.href} className="flex items-center gap-x-3">
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </div>
    </aside>
  );
}

// Add invoice creation date and paid date to invoice