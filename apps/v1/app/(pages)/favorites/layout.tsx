import { PageBackground } from "@/feature/background/ui/page-background";
import { Header } from "@/feature/header/ui/header";
import { HistoryProvider } from "@/feature/history/providers/history-provider";
import { SearchFocusProvider } from "@/feature/search/providers/search-focus-provider";
import { TagEditorProvider } from "@/feature/tag-editor/providers/tag-editor-provider";
import { SlideshowProvider } from "@/feature/viewer/providers/slideshow-provider";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("favorites");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <SearchFocusProvider>
      <TagEditorProvider>
        <SlideshowProvider>
          <HistoryProvider>
            <div className="relative w-full h-screen flex flex-col">
              <PageBackground
                accent={meta.accent}
                backgroundType={meta.backgroundType}
              />
              <Header
                title={meta.title}
                icon={meta.icon}
                basePath={meta.url}
                features={{
                  navigation: false,
                }}
                accent={meta.accent}
              />
              <main>{children}</main>
            </div>
          </HistoryProvider>
        </SlideshowProvider>
      </TagEditorProvider>
    </SearchFocusProvider>
  );
}
