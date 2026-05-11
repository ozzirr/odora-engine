"use client";

import { cn } from "@/lib/utils";

const fillClasses = [
  "w-0",
  "w-[10%]",
  "w-[20%]",
  "w-[30%]",
  "w-[40%]",
  "w-[50%]",
  "w-[60%]",
  "w-[70%]",
  "w-[80%]",
  "w-[90%]",
  "w-full",
];

type SliderProps = {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  onIntent?: () => void;
};

export function Slider({ label, name, value, onChange, onIntent }: SliderProps) {
  const safeValue = Math.min(10, Math.max(0, Math.round(value)));

  return (
    <label className="group block rounded-2xl border border-[#d7c8b6] bg-white p-3 shadow-[0_14px_30px_-30px_rgba(53,39,27,0.28)] transition-all duration-200 ease-out active:scale-[0.99] sm:p-4 sm:hover:-translate-y-0.5 sm:hover:border-[#b8cfbd] sm:hover:shadow-md">
      <span className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-[#21180f]">{label}</span>
        <span className="rounded-full bg-[#f4ece0] px-2.5 py-1 text-xs font-semibold text-[#1e4b3b]">
          {safeValue}/10
        </span>
      </span>
      <span className="relative mt-3 block h-8 sm:mt-5 sm:h-9">
        <span className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#1e4b3b] via-[#89a85e] to-[#d5ad68] opacity-25 sm:h-2.5" />
        <span
          className={cn(
            "absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#1e4b3b] via-[#6f9d57] to-[#d5ad68] transition-all duration-300 ease-out sm:h-2.5",
            fillClasses[safeValue],
          )}
        />
        <input
          aria-label={label}
          className="absolute inset-0 h-8 w-full cursor-pointer appearance-none bg-transparent accent-green-700 sm:h-9 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#1e4b3b] [&::-moz-range-thumb]:shadow-[0_0_0_5px_rgba(30,75,59,0.12),0_8px_22px_rgba(30,75,59,0.28)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-8 [&::-webkit-slider-runnable-track]:bg-transparent sm:[&::-webkit-slider-runnable-track]:h-9 [&::-webkit-slider-thumb]:mt-1 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#1e4b3b] [&::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgba(30,75,59,0.12),0_8px_22px_rgba(30,75,59,0.28)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:ring-2 active:[&::-webkit-slider-thumb]:ring-green-600 focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-green-600"
          max={10}
          min={0}
          name={name}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerDown={onIntent}
          onTouchStart={onIntent}
          type="range"
          value={safeValue}
        />
      </span>
    </label>
  );
}
