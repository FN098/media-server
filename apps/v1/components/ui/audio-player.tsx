import dynamic from "next/dynamic";
import "plyr/dist/plyr.css";

const Plyr = dynamic(() => import("plyr-react").then((mod) => mod.Plyr), {
  ssr: false,
});

export function AudioPlayer({ src, type }: { src: string; type?: string }) {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
      <Plyr
        source={{
          type: "audio",
          sources: [{ src, type }],
        }}
        autoPlay={true}
        options={{
          controls: ["play", "progress", "current-time", "mute", "volume"],
        }}
      />
    </div>
  );
}
