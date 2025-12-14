"use client";

import { LucideIcon, Menu, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/shadcn/components/ui/button";
import { useSidebar } from "@/shadcn/components/ui/sidebar";
import { cn } from "@/shadcn/lib/utils";

type SidebarTriggerProps = React.ComponentProps<typeof Button> & {
  icon: LucideIcon;
  open: boolean;
};

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
