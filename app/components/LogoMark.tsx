import React from "react";
import Image from "next/image";

interface LogoMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
}

export default function LogoMark({ className = "", size = "md", priority = false }: LogoMarkProps) {
  const sizeStyles = {
    sm: { width: 110, height: 42, className: "h-7 sm:h-8 w-auto" },
    md: { width: 160, height: 62, className: "h-8 sm:h-10 w-auto" },
    lg: { width: 220, height: 85, className: "h-14 sm:h-16 w-auto" },
    xl: { width: 320, height: 124, className: "h-20 sm:h-24 w-auto" },
  }[size];

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <Image
        src="/logo.svg"
        alt="YeHagere"
        width={sizeStyles.width}
        height={sizeStyles.height}
        className={`${sizeStyles.className} object-contain transition-transform duration-200`}
        priority={priority || size === "md" || size === "lg"}
      />
    </div>
  );
}


