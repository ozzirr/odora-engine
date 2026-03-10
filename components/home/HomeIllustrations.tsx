import type { ReactNode, SVGProps } from "react";

import type { QuickFilterIllustration } from "@/lib/homepage";

function IllustrationFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center rounded-[1.75rem] border border-white/55 bg-white/40 shadow-[0_18px_30px_-24px_rgba(44,31,20,0.45)] backdrop-blur-[2px]">
      <div className="absolute inset-3 rounded-[1.35rem] border border-[#fff8ef]/70" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Stroke(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="#6f5b46"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function MoodIllustration({ illustration }: { illustration: QuickFilterIllustration }) {
  switch (illustration) {
    case "vanilla":
      return (
        <IllustrationFrame>
          <Stroke className="h-16 w-16">
            <path d="M60 86c0-18 1-33 0-52" />
            <path d="M60 49c-9-13-23-14-28-4-5 10 3 23 18 24" />
            <path d="M60 41c9-13 23-14 28-4 5 10-3 23-18 24" />
            <path d="M60 71c-8 1-14 6-16 12" />
            <path d="M60 71c8 1 14 6 16 12" />
          </Stroke>
        </IllustrationFrame>
      );
    case "fresh":
      return (
        <IllustrationFrame>
          <Stroke className="h-16 w-16">
            <path d="M45 74c0-14 7-26 16-34 9 8 16 20 16 34" />
            <path d="M61 40c4 8 6 15 6 22" />
            <path d="M33 83c9-10 18-14 28-14 10 0 19 4 27 14" />
            <path d="M40 92c7-6 14-9 21-9 8 0 15 3 22 9" />
          </Stroke>
        </IllustrationFrame>
      );
    case "oud":
      return (
        <IllustrationFrame>
          <Stroke className="h-16 w-16">
            <path d="M38 79c7-18 18-33 32-44 8 6 13 17 13 28 0 19-15 28-29 28-8 0-12-4-16-12Z" />
            <path d="M44 78c9-6 18-9 28-10" />
            <path d="M56 50c5 8 9 17 10 27" />
          </Stroke>
        </IllustrationFrame>
      );
    case "musk":
      return (
        <IllustrationFrame>
          <Stroke className="h-16 w-16">
            <path d="M38 69c0-17 11-28 24-28 11 0 20 8 20 19 0 17-17 29-37 29-10 0-17-7-17-15 0-6 4-11 10-14" />
            <path d="M45 56c4 1 8 4 11 8" />
            <path d="M64 49c4 2 8 6 10 11" />
          </Stroke>
        </IllustrationFrame>
      );
    case "rose":
      return (
        <IllustrationFrame>
          <Stroke className="h-16 w-16">
            <path d="M60 88V63" />
            <path d="M60 63c-10 0-20-8-20-18s9-18 20-18 20 8 20 18-10 18-20 18Z" />
            <path d="M50 34c3 8 6 12 10 12s7-4 10-12" />
            <path d="M44 52c6 2 11 6 16 12" />
            <path d="M76 52c-6 2-11 6-16 12" />
          </Stroke>
        </IllustrationFrame>
      );
    case "citrus":
      return (
        <IllustrationFrame>
          <Stroke className="h-16 w-16">
            <circle cx="60" cy="60" r="22" />
            <path d="M60 38v44" />
            <path d="M38 60h44" />
            <path d="M44 44l32 32" />
            <path d="M76 44 44 76" />
            <path d="M71 26c5 2 10 6 13 11" />
          </Stroke>
        </IllustrationFrame>
      );
  }
}

export function DiscoverIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
      <path d="M11 8.5v5" />
      <path d="M8.5 11H13.5" />
    </svg>
  );
}

export function CompareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 4v16" />
      <path d="M17 4v16" />
      <path d="M4 8h6" />
      <path d="M14 15h6" />
      <path d="M5.5 12h3" />
      <path d="M15.5 11h3" />
    </svg>
  );
}

export function BuyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 7h12l-1.1 10.1a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
      <path d="M10 11h4" />
    </svg>
  );
}
