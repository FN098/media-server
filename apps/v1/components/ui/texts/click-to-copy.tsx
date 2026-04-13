"use client";

import React, { useRef } from "react";
import { toast } from "sonner";

export function ClickToCopy({
  text,
  children,
}: {
  text?: string;
  children: React.ReactNode;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  const copy = async () => {
    // 1. text プロパティがあれば優先、なければ DOM の innerText を取得
    const targetText = text ?? elementRef.current?.innerText ?? "";

    if (!targetText.trim()) return;

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(targetText);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = targetText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    toast.info("コピーしました");
  };

  return (
    <div
      ref={elementRef}
      onClick={() => void copy()}
      className="cursor-pointer active:opacity-70"
    >
      {children}
    </div>
  );
}
