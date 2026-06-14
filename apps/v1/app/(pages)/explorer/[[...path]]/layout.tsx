import { PageBackground } from "@/feature/background/ui/page-background";
import { Header } from "@/feature/header";
import { SearchFocusProvider } from "@/feature/search/providers/search-focus-provider";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("explorer");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

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
          basePath={meta.url}
          accent={meta.accent}
        />
        <main>{children}</main>
      </div>
    </SearchFocusProvider>
  );
}
