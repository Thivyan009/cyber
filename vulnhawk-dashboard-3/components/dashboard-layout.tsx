"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  FileText,
  Home,
  LogOut,
  Settings,
  Shield,
  Target,
  User,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { AttackDialog } from "@/components/attack-dialog"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user] = useState({
    name: "Alex Johnson",
    email: "alex@example.com",
    image: "/placeholder.svg?height=32&width=32",
  })

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="py-4">
            <div className="flex items-center px-4">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="ml-2 text-xl font-bold">VulnHawk X</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/"}>
                      <Link href="/">
                        <Home />
                        <span>Overview</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/reports"}>
                      <Link href="/reports">
                        <FileText />
                        <span>Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <AttackDialog />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Analytics</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="#">
                        <BarChart3 />
                        <span>Statistics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="#">
                        <Activity />
                        <span>Vulnerability Trends</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="#">
                        <AlertTriangle />
                        <span>Risk Assessment</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>AJ</AvatarFallback>
                </Avatar>
                <div className="ml-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <Button variant="ghost" size="icon">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1">
          <header className="border-b border-border">
            <div className="flex h-16 items-center px-6">
              <SidebarTrigger />
              <div className="ml-4 text-lg font-medium">VulnHawk X Dashboard</div>
              <div className="ml-auto flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
