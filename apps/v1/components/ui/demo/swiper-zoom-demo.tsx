/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef } from "react";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

// Swiperのスタイルをインポート
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";

export const ImageZoomSwiper = () => {
  const swiperRef = useRef<SwiperClass | null>(null);

  // マウスホイールイベントでズームを制御する関数
  const handleWheel = (e: React.WheelEvent) => {
    const swiper = swiperRef.current;
    if (!swiper?.zoom) return;

    // 現在のスケールを取得
    const currentScale = swiper.zoom.scale;

    // スクロール方向に応じて加減算（0.2ステップの例）
    // deltaYが負なら拡大、正なら縮小
    const delta = e.deltaY < 0 ? 0.4 : -0.4;

    // 新しいスケールを計算（例：1倍から3倍の範囲に収める）
    const newScale = Math.min(Math.max(currentScale + delta, 1), 3);

    // 引数に新しい倍率を直接渡す
    // これにより内部的に位置計算と再描画が行われます
    if (newScale === 1) {
      swiper.zoom.out();
    } else {
      swiper.zoom.in(newScale);
    }
  };

  return (
    <div style={{ width: "100%", height: "500px", backgroundColor: "#000" }}>
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        modules={[Zoom, Navigation, Pagination]}
        zoom={true} // ズーム機能を有効化
        navigation={true}
        pagination={{ clickable: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <SwiperSlide onWheel={handleWheel}>
          <div className="swiper-zoom-container">
            <img src="https://picsum.photos/id/10/1200/800" alt="Sample 1" />
          </div>
        </SwiperSlide>

        <SwiperSlide onWheel={handleWheel}>
          <div className="swiper-zoom-container">
            <img src="https://picsum.photos/id/20/1200/800" alt="Sample 2" />
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};
