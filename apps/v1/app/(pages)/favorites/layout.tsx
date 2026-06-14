import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";
import { HistoryProvider } from "@/providers/navigation/history-provider";
import { SearchFocusProvider } from "@/providers/search/search-focus-provider";
import { TagEditorProvider } from "@/providers/tag-editor/tag-editor-provider";
import { SlideshowProvider } from "@/providers/viewer/slideshow-provider";

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
