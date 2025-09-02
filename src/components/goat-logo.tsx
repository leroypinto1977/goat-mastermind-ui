"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GoatLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  clickable?: boolean;
}

export function GoatLogo({
  className,
  size = "md",
  variant = "full",
  clickable = true,
}: GoatLogoProps) {
  const imageSizes = {
    sm: { width: 80, height: 30 },
    md: { width: 120, height: 45 },
    lg: { width: 160, height: 60 },
    xl: { width: 200, height: 75 },
  };

  const iconSizes = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 80, height: 80 },
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const logoContent = (
    <div
      className={cn(
        "flex items-center gap-2 transition-all duration-200",
        clickable && "hover:scale-105 hover:opacity-90 cursor-pointer",
        className
      )}
    >
      {variant === "full" && (
        <Image
          src="/logo/the-goat-media-2-1-1.webp"
          alt="The GOAT Media"
          width={imageSizes[size].width}
          height={imageSizes[size].height}
          className="object-contain"
          priority
        />
      )}

      {variant === "icon" && (
        <Image
          src="/logo/the-goat-media-2-1-1.webp"
          alt="The GOAT Media"
          width={iconSizes[size].width}
          height={iconSizes[size].height}
          className="object-contain rounded-lg"
          priority
        />
      )}

      {variant === "text" && (
        <span className={cn("font-bold text-goat-brown", textSizes[size])}>
          THE GOAT MEDIA
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" className="no-underline">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
