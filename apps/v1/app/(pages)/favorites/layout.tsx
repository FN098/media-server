import { Header } from "@/components/ui/headers/header";
import { PATHS } from "@/lib/path/paths";
import { SearchProvider } from "@/providers/search-provider";
import { TagEditorProvider } from "@/providers/tag-editor-provider";
import { ViewModeProvider } from "@/providers/view-mode-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <SearchProvider>
        <TagEditorProvider>
          <div className="flex flex-col min-h-screen">
            <Header title="Favorites" basePath={PATHS.client.favorites.root} />
            <main className="flex-1 flex">{children}</main>
          </div>
        </TagEditorProvider>
      </SearchProvider>
    </ViewModeProvider>
  );
}
