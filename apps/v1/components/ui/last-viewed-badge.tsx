import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, Sparkles } from "lucide-react";

export const FolderStatusBadge = ({
  date,
}: {
  date?: Date | string | null;
}) => {
  // 1. 未訪問 (date が存在しない) 場合
  if (!date) {
    return (
      <div className="absolute top-1 right-1 flex items-center gap-1 bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-sm text-[10px] shadow-sm animate-pulse">
        <Sparkles size={10} fill="currentColor" />
        <span>NEW</span>
      </div>
    );
  }

  // 2. 訪問済みの場合
  const lastDate = new Date(date);
  const now = new Date();
  const diffInDays =
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

  // 1日以内なら少し明るめ、それ以降は馴染む色に
  const isRecent = diffInDays < 1;
  const colorClass = isRecent
    ? "bg-blue-500 text-white"
    : "bg-black/60 text-gray-300";

  return (
    <div
      className={`absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] backdrop-blur-sm ${colorClass}`}
    >
      <Clock size={10} />
      <span>
        {formatDistanceToNow(lastDate, { addSuffix: true, locale: ja })}
      </span>
    </div>
  );
};
