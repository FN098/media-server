"use client";

import { ThemeSelect } from "@/components/ui/selects/theme-select";
import { authClient } from "@/lib/auth/better-auth-client";
import { resolvePageMetas } from "@/lib/page-meta/resolvers";
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
import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

const menuItems = resolvePageMetas([
  "dashboard",
  "explorer",
  "favorites",
  "trash",
  "settings",
  "sandbox",
  "maintenance",
]);

export function AppMenuSidebar() {
  const { setOpenMobile } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();

    setOpenMobile(false);
  };

  return (
    <Sidebar forceMobile>
      {/* ヘッダー */}
      <SidebarHeader className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 border border-indigo-500/30">
              <div className="h-2 w-2 rounded-sm bg-indigo-400" />
            </div>
            <span className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
              Media Server
            </span>
          </div>
          <SidebarMenuButton asChild className="w-auto">
            <AppSidebarCloseButton />
          </SidebarMenuButton>
        </div>
      </SidebarHeader>

      {/* メニュー */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-widest text-zinc-600 uppercase mb-1">
            App Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="group rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 transition-colors data-[active=true]:bg-indigo-500/15 data-[active=true]:text-indigo-300"
                  >
                    <Link href={item.url} onClick={() => setOpenMobile(false)}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* フッター */}
      <SidebarFooter className="border-t border-white/[0.06] px-4 py-4 space-y-3">
        <ThemeSelect />

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span>ログアウト</span>
        </button>
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
