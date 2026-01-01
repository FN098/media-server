import { AnimatedCheckCircle } from "@/components/ui/animated-check-circle";
import { AnimatePresence, motion } from "framer-motion";

export function SaveConfirmationOverlay({ trigger }: { trigger: boolean }) {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <AnimatedCheckCircle active size={100} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
