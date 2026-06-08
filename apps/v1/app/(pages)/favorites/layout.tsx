import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";
import { HistoryProvider } from "@/providers/history-provider";
import { SearchFocusProvider } from "@/providers/search-focus-provider";
import { SlideshowProvider } from "@/providers/slideshow-provider";
import { TagEditorProvider } from "@/providers/tag-editor-provider";

const meta = resolvePageMeta("favorites");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <SearchFocusProvider>
      <TagEditorProvider>
        <SlideshowProvider>
          <HistoryProvider>
            <div className="relative w-full min-h-svh flex flex-col overflow-hidden">
              <PageBackground accent={meta.accent} />
              <Header
                title={meta.title}
                icon={meta.icon}
                basePath={meta.url}
                features={{
                  navigation: false,
                }}
                accent={meta.accent}
              />
              <main className="flex-1 overflow-y-auto">
                <div className="flex w-full h-full items-center justify-center">
                  {children}
                </div>
              </main>
            </div>
          </HistoryProvider>
        </SlideshowProvider>
      </TagEditorProvider>
    </SearchFocusProvider>
  );
}
