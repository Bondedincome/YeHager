import React from "react";

interface LogoMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function LogoMark({ className = "", size = "md" }: LogoMarkProps) {
  const sizeClasses = {
    sm: "text-lg tracking-tight",
    md: "text-2xl sm:text-3xl tracking-tight",
    lg: "text-3xl sm:text-4xl tracking-tight",
    xl: "text-4xl sm:text-5xl tracking-tight",
  }[size];

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <span
        className={`font-black uppercase text-black font-serif italic tracking-tighter ${sizeClasses} flex items-start`}
        style={{
          fontFamily: "'Playfair Display', 'Didot', 'Bodoni MT', Georgia, serif",
          letterSpacing: "-0.04em",
        }}
      >
        <span className="font-extrabold not-italic mr-[1px] tracking-normal font-sans">Ye</span>
        <span className="font-serif italic font-black">Hageré</span>
        <sup className="text-[9px] font-sans font-semibold not-italic ml-0.5 mt-0.5">TM</sup>
      </span>
    </div>
  );
}

