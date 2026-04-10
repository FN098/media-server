import { MediaFsNodeType } from "@/lib/media/types";
import { cn } from "@/shadcn/lib/utils";
import {
  FileText,
  Film,
  Folder,
  Image as ImageIcon,
  Music,
} from "lucide-react";
import { ReactNode } from "react";

// アイコンの定義を React コンポーネントに差し替え
const mediaThumbIcons: Record<MediaFsNodeType, ReactNode> = {
  audio: <Music className="w-full h-full" />,
  directory: <Folder className="w-full h-full fill-current opacity-80" />,
  file: <FileText className="w-full h-full" />,
  image: <ImageIcon className="w-full h-full" />,
  video: <Film className="w-full h-full" />,
};

export function MediaThumbIcon({
  type,
  className,
}: {
  type: MediaFsNodeType;
  className?: string;
}) {
  return (
    <div className={cn("text-white/90 drop-shadow-sm", className)}>
      {mediaThumbIcons[type]}
    </div>
  );
}
