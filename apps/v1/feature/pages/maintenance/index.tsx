"use client";

import { DatabaseBackupCard } from "@/feature/pages/maintenance/components/db-backup/ui/database-backup-card";
import { GhostMediaCleanupCard } from "@/feature/pages/maintenance/components/ghost-media/ui/ghost-media-cleanup-card";
import { GhostTagsCleanupCard } from "@/feature/pages/maintenance/components/ghost-tag/ui/ghost-tags-cleanup-card";
import { GhostThumbCleanupCard } from "@/feature/pages/maintenance/components/ghost-thumbnail/ui/ghost-thumb-cleanup-card";
import { TagMasterProvider } from "@/feature/pages/maintenance/components/tag-master/providers/tag-master-provider";
import { TagMasterManagerCard } from "@/feature/pages/maintenance/components/tag-master/ui/tag-master-manager-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { DatabaseIcon, GhostIcon, TagIcon } from "lucide-react";
import { useState } from "react";

// メニュー定義
const NAVIGATION_ITEMS = [
  { id: "backup", label: "Database Backup", icon: DatabaseIcon },
  { id: "cleanup", label: "Ghost Cleanup", icon: GhostIcon },
  { id: "tag_master", label: "Tag Master Manager", icon: TagIcon },
] as const;

type TabId = (typeof NAVIGATION_ITEMS)[number]["id"];

export function Maintenance() {
  const [activeTab, setActiveTab] = useState<TabId>("backup");

  return (
    <div className="flex flex-col md:flex-row w-full min-h-[calc(100vh-3rem)] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* モバイル用 */}
      <div className="block md:hidden p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <label className="text-xs font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase block mb-2">
          Maintenance Tasks
        </label>

        <Select
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabId)}
        >
          <SelectTrigger className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 text-zinc-700 dark:text-zinc-300">
            <SelectValue placeholder="Select task" />
          </SelectTrigger>

          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <SelectItem
                  key={item.id}
                  value={item.id}
                  className="py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 focus:bg-zinc-50 dark:focus:bg-zinc-800/50 focus:text-zinc-900 dark:focus:text-zinc-100 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-600" />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* デスクトップ用 */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-6">
        <div>
          <span className="px-3 text-[10px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase block mb-2">
            Maintenance Tasks
          </span>
          <nav className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/*　メインコンテンツ */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeTab === "backup" && (
            <div className="max-w-2xl animate-fade-in">
              <DatabaseBackupCard />
            </div>
          )}

          {activeTab === "cleanup" && (
            <div className="grid gap-6 md:grid-cols-1 animate-fade-in">
              <GhostTagsCleanupCard />
              <GhostMediaCleanupCard />
              <GhostThumbCleanupCard />
            </div>
          )}

          {activeTab === "tag_master" && (
            <div className="animate-fade-in">
              <TagMasterProvider>
                <TagMasterManagerCard />
              </TagMasterProvider>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
