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
      animate={{ scale: active ? [1, 1.2, 1] : 1 }}
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
        strokeDashoffset={c}
        stroke="#22c55e"
        initial={{ strokeDashoffset: c }}
        animate={{
          strokeDashoffset: active ? 0 : c,
        }}
        transition={{
          strokeDashoffset: { duration: 0.35, ease: "easeInOut" },
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
          pathLength: { duration: 0.2, delay: 0.35 }, // 円が描き終わった後に開始
          opacity: { duration: 0.01, delay: 0.35 },
        }}
      />
    </motion.svg>
  );
}
