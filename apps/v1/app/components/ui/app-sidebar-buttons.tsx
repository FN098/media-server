"use client";

import { LucideIcon, Menu, PanelLeft, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/shadcn/components/ui/button";
import { useSidebar } from "@/shadcn/components/ui/sidebar";
import { cn } from "@/shadcn/lib/utils";

type SidebarTriggerProps = React.ComponentProps<typeof Button> & {
  icon: LucideIcon;
};

function SidebarTrigger({
  className,
  onClick,
  icon: Icon,
  ...props
}: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
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
  const { isMobile } = useSidebar();

  return <SidebarTrigger icon={isMobile ? Menu : PanelLeft} {...props} />;
}

export function AppSidebarCloseButton(
  props: React.ComponentProps<typeof Button>
) {
  const { isMobile } = useSidebar();

  return <SidebarTrigger icon={isMobile ? X : PanelLeft} {...props} />;
}
