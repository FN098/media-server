import { DashboardHeader } from "@/app/(pages)/(dashboard)/_components/header";
import { PageBackground } from "@/app/(pages)/_components/background/page-background";
import { resolvePageMeta } from "@/app/(pages)/_lib/page-meta/resolvers";
import { HistoryProvider } from "@/app/(pages)/explorer/_providers/history-provider";
import { SearchFocusProvider } from "@/feature/search/providers/search-focus-provider";
import { TagEditorProvider } from "@/feature/tag-editor/providers/tag-editor-provider";
import { SlideshowProvider } from "@/feature/viewers/media-viewer/providers/slideshow-provider";

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
