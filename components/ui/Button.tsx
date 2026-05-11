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
    "bg-[#1E4B3B] !text-white visited:!text-white hover:bg-[#16382c] hover:!text-white focus-visible:outline-[#1E4B3B] shadow-[0_1px_3px_rgba(30,75,59,0.3)]",
  secondary:
    "bg-[#f0e9de] text-[#2a2018] hover:bg-[#e8dece] focus-visible:outline-[#d4c6b2] border border-[#e2d6c4]",
  ghost:
    "bg-transparent text-[#1f1914] hover:bg-[#f0e9de] focus-visible:outline-[#d4c6b2]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-[13.5px]",
  lg: "h-[3.1rem] px-7 text-[15px]",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "active:scale-95",
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
