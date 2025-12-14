"use client";

import { Button } from "@/shadcn/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shadcn/components/ui/overrides/sidebar";
import { useSidebar } from "@/shadcn/components/ui/sidebar";
import { cn } from "@/shadcn/lib/utils";
import {
  Check,
  LayoutDashboard,
  LucideIcon,
  Menu,
  Search,
  Settings,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Explorer",
    url: "/dashboard/explorer",
    icon: Search,
  },
  {
    title: "Sample",
    url: "/dashboard/sample",
    icon: Check,
  },
  {
    title: "Favorites",
    url: "#",
    icon: Star,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar forceMobile>
      <SidebarHeader>
        <div className="flex justify-end items-center">
          <SidebarMenuButton asChild className="w-auto">
            <AppSidebarCloseButton />
          </SidebarMenuButton>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>App Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

type SidebarTriggerProps = React.ComponentProps<typeof Button> & {
  icon: LucideIcon;
  open: boolean;
};

/**
 * Shadcn UI カスタム
 * @see \@/shadcn/components/ui/sidebar > SidebarTrigger
 */
function SidebarTrigger({
  className,
  onClick,
  open,
  icon: Icon,
  ...props
}: SidebarTriggerProps) {
  const { setOpen, setOpenMobile } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        setOpen(open);
        setOpenMobile(open);
      }}
      {...props}
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export function AppSidebarOpenButton(
  props: React.ComponentProps<typeof Button>
) {
  return <SidebarTrigger icon={Menu} {...props} open={true} />;
}

export function AppSidebarCloseButton(
  props: React.ComponentProps<typeof Button>
) {
  return <SidebarTrigger icon={X} {...props} open={false} />;
}
