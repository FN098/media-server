import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";
import { SearchFocusProvider } from "@/providers/search/search-focus-provider";

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
