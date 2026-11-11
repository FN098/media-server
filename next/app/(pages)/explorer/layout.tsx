import { SlideshowProvider } from "@/feature/_old/viewers/media-viewer/providers/slideshow-provider";
import { HistoryProvider } from "@/feature/history/providers/history-provider";
import { TagEditorProvider } from "@/feature/tag-editor/providers/tag-editor-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TagEditorProvider>
      <SlideshowProvider>
        <HistoryProvider>{children}</HistoryProvider>
      </SlideshowProvider>
    </TagEditorProvider>
  );
}
