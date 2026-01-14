import { Header } from "@/components/ui/headers/header";
import { PATHS } from "@/lib/path/paths";
import { SearchProvider } from "@/providers/search-provider";
import { TagEditorProvider } from "@/providers/tag-editor-provider";
import { ViewModeProvider } from "@/providers/view-mode-provider";
import { ViewerProvider } from "@/providers/viewer-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <SearchProvider>
        <ViewerProvider>
          <TagEditorProvider>
            <div className="w-full h-svh flex flex-col overflow-hidden">
              <Header
                title="Favorites"
                basePath={PATHS.client.favorites.root}
                features={{
                  navigation: false,
                }}
              />
              <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {children}
              </main>
            </div>
          </TagEditorProvider>
        </ViewerProvider>
      </SearchProvider>
    </ViewModeProvider>
  );
}
