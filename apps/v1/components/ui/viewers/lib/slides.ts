import { MediaNode } from "@/lib/media/types";

//
// 型
//

export type EmptySlide = {
  key: string;
  type: "empty";
  position: "first" | "last";
};

export type NavigationSlide = {
  key: string;
  type: "navigation";
  direction: "next" | "prev";
};

export type ContentSlide = {
  key: string;
  type: "content";
  node: MediaNode;
};

export type MediaViewerSlide = EmptySlide | NavigationSlide | ContentSlide;

export const firstSlide: EmptySlide = {
  key: ":first-slide",
  type: "empty",
  position: "first",
};

export const lastSlide: EmptySlide = {
  key: ":last-slide",
  type: "empty",
  position: "last",
};

export const prevSlide: NavigationSlide = {
  key: ":prev-slide",
  type: "navigation",
  direction: "prev",
};

export const nextSlide: NavigationSlide = {
  key: ":next-slide",
  type: "navigation",
  direction: "next",
};

//
// スライド構築
//

export function buildMediaViewerSlides({
  nodes,
  hasPrev,
  hasNext,
}: {
  nodes: MediaNode[];
  hasPrev: boolean;
  hasNext: boolean;
}): MediaViewerSlide[] {
  // [前へ] -> [最初のページ] -> [メディア一覧] -> [最後のページ] -> [次へ]
  const slides: MediaViewerSlide[] = nodes.map((node) => ({
    key: node.id ?? node.path,
    type: "content",
    node,
  }));

  // 前側
  slides.unshift(firstSlide);
  if (hasPrev) slides.unshift(prevSlide);

  // 後側
  slides.push(lastSlide);
  if (hasNext) slides.push(nextSlide);

  return slides;
}

//
// index helpers
//

export function getMediaOffset(hasPrev: boolean): number {
  return 1 + (hasPrev ? 1 : 0);
}

export function getSlideIndex(mediaIndex: number, hasPrev: boolean): number {
  return mediaIndex + getMediaOffset(hasPrev);
}

export function getMediaIndex(slideIndex: number, hasPrev: boolean): number {
  return slideIndex - getMediaOffset(hasPrev);
}
