"use client";

import { AudioPlayer } from "@/components/ui/viewers/audio-player";
import { ImageViewer } from "@/components/ui/viewers/image-viewer";
import { MediaViewerSlide } from "@/components/ui/viewers/lib/media-viewer/slides";
import { VideoPlayer } from "@/components/ui/viewers/video-player";
import { assertNever } from "@/lib/utils/assert";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface MediaViewerSlideRendererProps {
  slide: MediaViewerSlide;
  active: boolean;
  isRepeating: boolean;
  onRepeatingChange: (value: boolean) => void;
}

export function MediaViewerSlideRenderer({
  slide,
  active,
  isRepeating,
  onRepeatingChange,
}: MediaViewerSlideRendererProps) {
  switch (slide.type) {
    case "empty":
      return slide.position === "first" ? (
        <div className="flex flex-col items-center justify-center text-white/70">
          <ChevronLeft className="mb-4" size={64} strokeWidth={1} />
          <p className="text-xl font-medium mb-2">最初のページです</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-white/70">
          <ChevronRight className="mb-4" size={64} strokeWidth={1} />
          <p className="text-xl font-medium mb-2">最後のページです</p>
        </div>
      );

    case "navigation":
      return (
        <div className="flex flex-col items-center justify-center text-white/50">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p>
            {slide.direction === "prev"
              ? "前のフォルダへ..."
              : "次のフォルダへ..."}
          </p>
        </div>
      );

    case "content":
      switch (slide.node.type) {
        case "image":
          return <ImageViewer media={slide.node} active={active} />;

        case "video":
          return <VideoPlayer media={slide.node} active={active} />;

        case "audio":
          return (
            <AudioPlayer
              media={slide.node}
              active={active}
              isRepeating={isRepeating}
              onRepeatingChange={onRepeatingChange}
            />
          );

        default:
          return assertNever(slide.node);
      }

    default:
      return assertNever(slide);
  }
}
