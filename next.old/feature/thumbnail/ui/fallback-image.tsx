import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface FallbackImageProps extends ImageProps {
  fallback?: React.ReactNode;
}

export function FallbackImage({
  fallback,
  alt = "",
  onError,
  ...props
}: FallbackImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return fallback;
  }

  return (
    <Image
      {...props}
      alt={alt}
      onError={(e) => {
        setError(true);
        onError?.(e);
      }}
    />
  );
}
