"use client";

import { PATHS } from "@/lib/paths";
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
  SidebarTrigger,
} from "@/shadcn-overrides/components/ui/sidebar";
import { Button } from "@/shadcn/components/ui/button";
import {
  Flame,
  LayoutDashboard,
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
    url: PATHS.client.dashboard.root,
    icon: LayoutDashboard,
  },
  {
    title: "Explorer",
    url: PATHS.client.explorer.root,
    icon: Search,
  },
  {
    title: "Experimental",
    url: PATHS.client.experimental.root,
    icon: Flame,
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
