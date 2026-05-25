import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { MediaNode } from "@/lib/media/types";
import { resolveMediaUrl } from "@/lib/media/url";
import { Kbd } from "@/shadcn/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import {
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface AudioPlayerProps {
  media: MediaNode;
  active?: boolean;
  isRepeating?: boolean;
  onRepeatingChange?: (value: boolean) => void;
  disableRepeat?: boolean;
  onEnded?: () => void;
}

export function AudioPlayer({
  media,
  active = true,
  isRepeating = false,
  onRepeatingChange,
  disableRepeat,
  onEnded,
}: AudioPlayerProps) {
  const playerRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 再生率を計算 (0 ~ 100)
  const progress = duration ? (currentTime / duration) * 100 : 0;

  // 再生時間の更新を監視
  const handleTimeUpdate = useCallback(() => {
    const audio = playerRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  }, [playerRef, setCurrentTime]);

  // メタデータ読み込み時に長さを取得
  const handleLoadedMetadata = useCallback(() => {
    const audio = playerRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  }, [playerRef, setDuration]);

  // 曲が終了した時の処理
  const handleEnded = useCallback(() => {
    if (isRepeating && playerRef.current) {
      playerRef.current.currentTime = 0;
      playerRef.current.play().catch(() => {});
    } else {
      setIsPlaying(false);
      onEnded?.();
    }
  }, [isRepeating, onEnded]);

  // 再生・一時停止
  const togglePlaying = useCallback(() => {
    const audio = playerRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch((e) => console.error(e));
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [playerRef, setIsPlaying]);

  // リピート再生
  const toggleRepeating = () => {
    onRepeatingChange?.(!isRepeating);
  };

  // シーク
  const seek = useCallback((seconds: number) => {
    const audio = playerRef.current;
    if (audio) {
      audio.currentTime += seconds;
    }
  }, []);

  // シークバーを操作したときの処理
  const handleSeekChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = Number(e.target.value);
      setCurrentTime(time);
      if (playerRef.current) playerRef.current.currentTime = time;
    },
    []
  );

  // 秒を 00:00 形式に変換
  const formatTime = useCallback((time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // ===== ショートカット =====

  // Space: 再生/一時停止
  useHotkeys(
    "space",
    (e) => {
      e.preventDefault(); // 親のビューア側などのイベント伝播を阻止
      togglePlaying();
    },
    { scopes: ["viewer", "tag-editor"], enabled: active }
  );

  // ↑: 10秒進む
  useHotkeys(
    "arrowup",
    (e) => {
      // 長押し（連打）を無視
      if (e.repeat) return;
      seek(10);
    },
    { scopes: ["viewer", "tag-editor"], enabled: active }
  );

  // ↓: 10秒戻る
  useHotkeys(
    "arrowdown",
    (e) => {
      // 長押し（連打）を無視
      if (e.repeat) return;
      seek(-10);
    },
    { scopes: ["viewer", "tag-editor"], enabled: active }
  );

  // R: リプレイ有効/無効
  useHotkeys("r", () => toggleRepeating(), {
    scopes: ["viewer", "tag-editor"],
    enabled: active,
  });

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* プレーヤー本体 */}
      <div className="relative flex flex-col items-center gap-8 p-10 w-full max-w-sm bg-white/5 rounded-[40px] border border-white/10 shadow-2xl overflow-hidden">
        {/* リピートバッジ */}
        <PlayerButton
          onClick={toggleRepeating}
          className={`absolute top-8 right-8 p-2 rounded-full transition-all ${
            isRepeating
              ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              : "text-white/30 hover:text-white/60"
          }`}
          label="Repeat"
          shortcut="R"
          disabled={disableRepeat}
        >
          {isRepeating ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </PlayerButton>

        {media.previewPath && (
          <div className="absolute inset-0 -z-10 opacity-20 blur-3xl scale-150">
            <MediaThumb node={media} className="w-full h-full object-cover" />
          </div>
        )}

        {/* オーディオビジュアル / アルバムアート */}
        <div className="relative w-40 h-40 bg-linear-to-br from-indigo-500 to-purple-600 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
          {media.previewPath ? (
            // プレビューパスがある場合はサムネイルを表示
            <MediaThumb
              node={media}
              className="w-full h-full object-cover"
              showIcon={false}
            />
          ) : (
            // ない場合はデフォルトのアイコンを表示
            <Music size={64} className="text-white" />
          )}

          {/* 装飾用のオーバーレイ（画像の上にかすかにグラデーションをのせる） */}
          {media.previewPath && (
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          )}
        </div>

        {/* メタデータ */}
        <div className="text-center w-full">
          <h3 className="text-white text-lg font-semibold truncate px-4">
            {media.title ?? media.name}
          </h3>
          <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase mt-1">
            Audio Track
          </p>
        </div>

        {/* カスタムシークバー */}
        <div className="w-full px-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="any"
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            style={{
              background: `linear-gradient(to right, #6366f1 ${progress}%, rgba(255, 255, 255, 0.1) ${progress}%)`,
            }}
          />
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] text-white/40 font-mono">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] text-white/40 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* メイン操作系 */}
        <div className="flex items-center gap-10">
          {/* 10秒戻る */}
          <PlayerButton
            onClick={() => seek(-10)}
            label="Back 10s"
            shortcut="↓"
            className="text-white/60 hover:text-white transition-all active:scale-90"
          >
            <RotateCcw size={28} />
          </PlayerButton>

          {/* 再生 / 一時停止 */}
          <PlayerButton
            onClick={togglePlaying}
            label={isPlaying ? "Pause" : "Play"}
            shortcut="Space"
            className="w-20 h-20 flex items-center justify-center bg-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            {isPlaying ? (
              <Pause className="text-black fill-black" size={32} />
            ) : (
              <Play className="text-black fill-black ml-1" size={32} />
            )}
          </PlayerButton>

          {/* 10秒進む */}
          <PlayerButton
            onClick={() => seek(10)}
            label="Forward 10s"
            shortcut="↑"
            className="text-white/60 hover:text-white transition-all active:scale-90"
          >
            <RotateCw size={28} />
          </PlayerButton>
        </div>

        {active && (
          <audio
            ref={playerRef}
            src={resolveMediaUrl(media)}
            autoPlay
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
}

interface PlayerButtonProps extends React.ComponentProps<"button"> {
  label: string;
  shortcut?: string;
}

function PlayerButton({
  onClick,
  children,
  label,
  shortcut,
  className,
  ...rest
}: PlayerButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={onClick} className={className} {...rest}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={20}>
        <p className="flex gap-2">
          <span>{label}</span>
          <Kbd>{shortcut}</Kbd>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
