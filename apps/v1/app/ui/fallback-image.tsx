import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface FallbackImageProps extends ImageProps {
  fallback?: React.ReactNode;
}

export default function FallbackImage({
  fallback,
  alt = "",
  ...props
}: FallbackImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return fallback;
  }

  return <Image {...props} alt={alt} onError={() => setError(true)} />;
}
