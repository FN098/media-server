import { APP_CONFIG } from "@/app.config";
import { Dashboard } from "@/feature/dashboard";
import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import { getRecentFolders } from "@/lib/folder/repository";
import { Metadata } from "next";

const RECENT_FOLDERS_LIMIT = 20;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_CONFIG.meta.title}`,
};

export default async function DashboardPage() {
  const user = await resolveCurrentUserOrThrow();
  const folders = await getRecentFolders(user.id, RECENT_FOLDERS_LIMIT);

  return <Dashboard folders={folders} />;
}
