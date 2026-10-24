import { APP_CONFIG } from "@/app.config";
import { Dashboard } from "@/feature/dashboard";
import { getCurrentUserOrThrow } from "@/lib/auth/current-user";
import { getRecentVisitedFolders } from "@/lib/folder/repository";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_CONFIG.meta.title}`,
};

export default async function DashboardPage() {
  const user = await getCurrentUserOrThrow();

  const folders = await getRecentVisitedFolders(
    user.id,
    APP_CONFIG.recentFolders.maxLength
  );

  return <Dashboard folders={folders} />;
}
