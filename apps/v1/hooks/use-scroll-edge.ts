import { useEffect, useState } from "react";

export function useScrollEdge() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      setShowTop(scrollTop > 200);
      setShowBottom(scrollTop + clientHeight < scrollHeight - 200);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { showTop, showBottom };
}
