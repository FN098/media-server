"use client";

import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { Button } from "@/shadcn/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";

export function ScrollEdgeButtons() {
  const direction = useScrollDirection(5);

  const scrollToEdge = () => {
    if (!direction) return;

    const targetY =
      direction === "up" ? 0 : document.documentElement.scrollHeight;

    setTimeout(() => {
      window.scrollTo({
        top: targetY,
        behavior: "smooth",
      });
    }, 0);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {direction && (
          <motion.div
            key={direction}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-14 w-14 rounded-full shadow-xl border touch-none bg-background/90 backdrop-blur"
              onClick={scrollToEdge}
            >
              {direction === "up" ? <ArrowUp /> : <ArrowDown />}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
