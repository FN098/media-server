import { PageBackground } from "@/feature/background/components/page-background";
import { DynamicBreadcrumbsProvider } from "@/feature/breadcrumbs/providers/dynamic-breadcrumbs-provider";
import { ExplorerHeader } from "@/feature/header/components/explorer-header";
import { getPageMeta } from "@/feature/page-meta/lib/page-meta";
import { SearchFocusProvider } from "@/feature/search/providers/search-focus-provider";
import { getFolderPathTree } from "@/lib/folder/repository";

interface ExplorerLayoutProps {
  // パスパラメータ: /explorer/[id]
  params: Promise<{
    id: string;
  }>;
  children: React.ReactNode;
}

const meta = getPageMeta("explorer");

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
      <DynamicBreadcrumbsProvider items={breadcrumbs}>
        <div className="relative w-full h-screen flex flex-col">
          <PageBackground accent={meta.accent} />
          <ExplorerHeader title={meta.title} accent={meta.accent} />
          <main>{children}</main>
        </div>
      </DynamicBreadcrumbsProvider>
    </SearchFocusProvider>
  );
}
