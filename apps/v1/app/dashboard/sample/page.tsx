"use client";

import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useState } from "react";

const images = [
  "https://picsum.photos/id/1015/600/400",
  "https://picsum.photos/id/1016/600/400",
  "https://picsum.photos/id/1018/600/400",
];

export default function SwipeGallery() {
  const [index, setIndex] = useState(0);

  // React Spring のアニメーション
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(({ down, movement: [mx], direction: [dx], cancel }) => {
    if (down && Math.abs(mx) > 200) {
      if (dx > 0) {
        setIndex((i) => (i > 0 ? i - 1 : i));
      } else {
        setIndex((i) => (i < images.length - 1 ? i + 1 : i));
      }
      cancel?.();
    }
    api.start({ x: down ? mx : 0, immediate: down });
  });

  return (
    <div
      style={{
        width: "600px",
        height: "400px",
        overflow: "hidden",
        margin: "50px auto",
        position: "relative",
      }}
    >
      <animated.img
        {...bind()}
        src={images[index]}
        alt="Swipe"
        style={{
          x,
          touchAction: "pan-y",
          width: "100%",
          height: "100%",
          userSelect: "none",
          cursor: "grab",
          position: "absolute",
        }}
      />
    </div>
  );
}
