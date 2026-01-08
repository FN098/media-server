"use client";

import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { Button } from "@/shadcn/components/ui/button";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";

export function ScrollEdgeButtons() {
  const direction = useScrollDirection();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {direction && (
          <MotionButton key={direction}>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg"
              onClick={() => {
                if (direction === "up") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: "smooth",
                  });
                }
              }}
            >
              {direction === "up" ? <ArrowUp /> : <ArrowDown />}
            </Button>
          </MotionButton>
        )}
      </AnimatePresence>
    </div>
  );
}

const variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
} satisfies Variants;

function MotionButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
