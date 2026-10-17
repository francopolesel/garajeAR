import React from "react";
import { cn } from "../../lib/utils";

interface LogoProps {
  className?: string;
  alt?: string;
  variant?: "full" | "icon";
}

export function Logo({ className, alt = "GarajeAR", variant = "full" }: LogoProps) {
  if (variant === "icon") {
    return <img src="/brand/icon.svg" alt={alt} className={cn("h-8 w-8", className)} />;
  }
  return (
    <>
      <img src="/brand/logo.svg" alt={alt} className={cn("h-8 w-auto dark:hidden", className)} />
      <img src="/brand/logo-dark.svg" alt={alt} className={cn("h-8 w-auto hidden dark:block", className)} />
    </>
  );
}
