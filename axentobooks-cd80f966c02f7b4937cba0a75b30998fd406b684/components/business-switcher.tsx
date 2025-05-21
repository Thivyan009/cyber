"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Plus, ChevronDown } from "lucide-react";
import { Business } from "@/lib/types/business";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BusinessSwitcherProps {
  businesses: Business[];
  currentBusinessId: string;
  onBusinessChange: (businessId: string) => void;
}

export function BusinessSwitcher({
  businesses,
  currentBusinessId,
  onBusinessChange,
}: BusinessSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const currentBusiness = businesses.find((b) => b.id === currentBusinessId);

  console.log("BusinessSwitcher received businesses:", businesses); // Debug log
  console.log("Current business:", currentBusiness); // Debug log

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 hover:bg-accent hover:text-accent-foreground"
        >
          <Building2 className="mr-2 h-4 w-4" />
          <span className="max-w-[150px] truncate">
            {currentBusiness?.name || "Select Business"}
          </span>
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 transition-transform duration-200",
              open && "transform rotate-180"
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {businesses.map((business) => (
          <DropdownMenuItem
            key={business.id}
            onClick={() => {
              onBusinessChange(business.id);
              setOpen(false);
            }}
            className={cn(
              "flex items-center cursor-pointer hover:bg-accent",
              business.id === currentBusinessId && "bg-accent"
            )}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="truncate">{business.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            router.push("/onboarding/new-business");
          }}
          className="flex items-center text-primary hover:bg-accent cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Business
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
