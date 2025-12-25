export function useFullscreen() {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // 全画面にする（document.documentElement でページ全体、特定の ref.current で要素のみ）
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(err);
      });
    } else {
      // 全画面を解除する
      document.exitFullscreen().catch((err) => {
        console.error(err);
      });
    }
  };

  return { toggleFullscreen };
}
