import { motion } from "framer-motion";

type Props = {
  active: boolean;
  size?: number;
};

export function AnimatedCheckCircle({ active, size = 16 }: Props) {
  const r = 9.5;
  const c = 2 * Math.PI * r;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial={false}
      animate={active ? { scale: [1, 1.2, 1] } : { scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* 円 */}
      <motion.circle
        cx="12"
        cy="12"
        r={r}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={active ? 0 : c}
        stroke={active ? "#22c55e" : "currentColor"}
        initial={false}
        animate={{
          strokeDashoffset: active ? 0 : c,
          stroke: active ? "#22c55e" : "currentColor",
        }}
        transition={{
          strokeDashoffset: { duration: 0.35, ease: "easeInOut" },
          stroke: { duration: 0.15, delay: 0.35 },
        }}
      />

      {/* チェック */}
      <motion.path
        d="M7 12.5l3 3 7-7"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
        }
        transition={{
          pathLength: { duration: 0.2, delay: 0.35 },
          opacity: { duration: 0.01, delay: 0.35 },
        }}
      />
    </motion.svg>
  );
}
