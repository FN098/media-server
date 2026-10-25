import { SearchFocusProvider } from "@/__feature/search/providers/search-focus-provider";
import { SlideshowProvider } from "@/__feature/viewers/media-viewer/providers/slideshow-provider";
import { DashboardHeader } from "@/app/(pages)/(dashboard)/_components/header";
import { PageBackground } from "@/app/(pages)/_components/background/page-background";
import { resolvePageMeta } from "@/app/(pages)/_lib/page-meta/resolvers";
import { HistoryProvider } from "@/feature/history/providers/history-provider";
import { TagEditorProvider } from "@/feature/tag-editor/_providers/tag-editor-provider";

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
              <DashboardHeader
                title={meta.title}
                icon={meta.icon}
                baseUrl={meta.url}
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
