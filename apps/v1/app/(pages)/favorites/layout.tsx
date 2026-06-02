import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";
import { HistoryProvider } from "@/providers/history-provider";
import { SearchFocusProvider } from "@/providers/search-focus.provider";
import { TagEditorProvider } from "@/providers/tag-editor-provider";

const meta = resolvePageMeta("favorites");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <SearchFocusProvider>
      <div className="w-full h-svh flex flex-col overflow-hidden">
        <Header
          title={meta.title}
          icon={meta.icon}
          basePath={meta.url}
          features={{
            navigation: false,
          }}
        />
        <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <TagEditorProvider>
            <HistoryProvider>{children}</HistoryProvider>
          </TagEditorProvider>
        </main>
      </div>
    </SearchFocusProvider>
  );
}
