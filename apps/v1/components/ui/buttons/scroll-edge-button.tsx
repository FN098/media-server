"use client";

import { MotionButton } from "@/components/ui/buttons/motion-button";
import { useScrollEdge } from "@/hooks/use-scroll-edge";
import { Button } from "@/shadcn/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";

export function ScrollEdgeButtons() {
  const { showTop, showBottom } = useScrollEdge();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {showTop && (
          <MotionButton key="top">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              <ArrowUp />
            </Button>
          </MotionButton>
        )}

        {showBottom && (
          <MotionButton key="bottom">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg"
              onClick={() =>
                window.scrollTo({
                  top: document.documentElement.scrollHeight,
                  behavior: "smooth",
                })
              }
            >
              <ArrowDown />
            </Button>
          </MotionButton>
        )}
      </AnimatePresence>
    </div>
  );
}
