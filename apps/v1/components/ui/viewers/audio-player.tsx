import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { MediaNode } from "@/lib/media/types";
import { getAbsoluteMediaUrl } from "@/lib/path/helpers";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shadcn-overrides/components/ui/tooltip";
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

export function AudioPlayer({
  media,
  active,
}: {
  media: MediaNode;
  active: boolean;
}) {
  const playerRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isRepeating, setIsRepeating] = useState(false);
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
    }
  }, [isRepeating, playerRef, setIsPlaying]);

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
  const toggleRepeating = () => setIsRepeating((prev) => !prev);

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

  // ショートカット
  useShortcutKeys([
    { key: "Ctrl+ArrowRight", callback: () => seek(10) },
    { key: "Ctrl+ArrowLeft", callback: () => seek(-10) },
    { key: " ", callback: () => togglePlaying() },
    { key: "r", callback: () => toggleRepeating() },
  ]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative flex flex-col items-center gap-8 p-10 w-full max-w-sm bg-white/5 rounded-[40px] border border-white/10 shadow-2xl">
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
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          {isRepeating ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </PlayerButton>

        {/* オーディオビジュアル */}
        <div className="w-40 h-40 bg-linear-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
          <Music size={64} className="text-white" />
        </div>

        {/* メタデータ */}
        <div className="text-center w-full">
          <h3 className="text-white text-lg font-semibold truncate px-4">
            <MarqueeText autoplay text={media.title ?? media.name} />
          </h3>
          <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase mt-1">
            Audio Track
          </p>
        </div>

        {/* カスタムシークバー */}
        <div
          className="w-full px-2"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
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
        <div
          className="flex items-center gap-10"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          {/* 10秒戻る */}
          <PlayerButton
            onClick={() => seek(-10)}
            label="Back 10s"
            shortcut="Ctrl + ←"
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
            shortcut="Ctrl + →"
            className="text-white/60 hover:text-white transition-all active:scale-90"
          >
            <RotateCw size={28} />
          </PlayerButton>
        </div>

        {active && (
          <audio
            ref={playerRef}
            src={getAbsoluteMediaUrl(media.path)}
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
}: PlayerButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={onClick} className={className}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-white/10 border-white/20 backdrop-blur-md text-white"
        sideOffset={20}
      >
        <p>
          {label} <span className="text-white/40 ml-1">[{shortcut}]</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
