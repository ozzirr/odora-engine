import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1E4B3B] !text-white visited:!text-white hover:bg-[#183D30] hover:!text-white focus-visible:outline-[#1E4B3B]",
  secondary:
    "bg-[#f0e9de] text-[#1f1914] hover:bg-[#e7ddcf] focus-visible:outline-[#d4c6b2]",
  ghost:
    "bg-transparent text-[#1f1914] hover:bg-[#efe8dc] focus-visible:outline-[#d4c6b2]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
