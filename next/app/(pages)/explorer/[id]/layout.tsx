import { PageBackground } from "@/feature/background/ui/page-background";
import { Header } from "@/feature/header/ui";
import { SearchFocusProvider } from "@/feature/search/providers/search-focus-provider";
import { getFolderPathTree } from "@/lib/folder/repository";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

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
        <Header
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
