import { SearchFocusProvider } from "@/__feature/search/providers/search-focus-provider";
import { PageBackground } from "@/app/(pages)/_components/background/page-background";
import { resolvePageMeta } from "@/app/(pages)/_lib/page-meta/resolvers";
import { DashboardHeader } from "@/feature/header/components/dashboard-header";
import { getFolderPathTree } from "@/lib/folder/repository";

interface ExplorerLayoutProps {
  // パスパラメータ: /explorer/[id]
  params: Promise<{
    id: string;
  }>;
  children: React.ReactNode;
}

const meta = resolvePageMeta("explorer");

export default async function Layout(props: ExplorerLayoutProps) {
  if (!meta) return;

  const { id } = await props.params;
  const { children } = props;

  const tree = await getFolderPathTree(id);

  const breadcrumbs = tree.map((n, i) => ({
    key: i === 0 ? "home" : n.id,
    href: `/explorer/${n.id}`,
    label: n.name || "HOME",
  }));

  return (
    <SearchFocusProvider>
      <div className="relative w-full h-screen flex flex-col">
        <PageBackground
          accent={meta.accent}
          backgroundType={meta.backgroundType}
        />
        <DashboardHeader
          title={meta.title}
          icon={meta.icon}
          accent={meta.accent}
          breadcrumbs={breadcrumbs}
        />
        <main>{children}</main>
      </div>
    </SearchFocusProvider>
  );
}
