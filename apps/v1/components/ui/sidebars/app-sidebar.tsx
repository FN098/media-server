"use client";

import { ThemeSelect } from "@/components/ui/selects/theme-select";
import { pageMetas } from "@/lib/page-meta";
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
  SidebarTrigger,
  useSidebar,
} from "@/shadcn-overrides/components/ui/sidebar";
import { Button } from "@/shadcn/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

// Menu items.
const items = [
  pageMetas["dashboard"],
  pageMetas["explorer"],
  pageMetas["favorites"],
  pageMetas["trash"],
  pageMetas["settings"],
  pageMetas["sandbox"],
  pageMetas["maintenance"],
];

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();

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
                    <Link href={item.url} onClick={() => setOpenMobile(false)}>
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

      <SidebarFooter className="p-4">
        <ThemeSelect />
      </SidebarFooter>
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
