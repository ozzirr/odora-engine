import { cn } from "@/lib/utils";

type PerfumeDetailLoadingStateProps = {
  perfumeName?: string | null;
  variant?: "page" | "overlay";
};

const PILL_WIDTHS = ["w-28", "w-20", "w-24"];
const STAT_WIDTHS = ["w-16", "w-14", "w-20"];

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-full bg-[#e8dece]", className)} />;
}

export function PerfumeDetailLoadingState({ variant = "page" }: PerfumeDetailLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mx-auto w-full overflow-hidden rounded-[2rem] border border-[#dfd1bf] bg-[#fffaf3] p-4 shadow-[0_28px_65px_-42px_rgba(50,35,20,0.42)] sm:p-6",
        variant === "overlay" ? "max-w-[22rem] sm:max-w-2xl" : "max-w-5xl",
      )}
    >
      <span className="sr-only">Caricamento profumo</span>
      <div className="grid gap-5 md:grid-cols-[180px_1fr]">
        <div className="aspect-square rounded-3xl border border-[#e5d8c8] bg-white p-3">
          <div className="h-full rounded-2xl bg-[#eee5d8]" />
        </div>
        <div className="min-w-0 py-1">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-4 h-10 w-4/5 max-w-[460px] rounded-2xl" />
          <SkeletonBlock className="mt-3 h-4 w-64 max-w-full" />
          <div className="mt-4 flex flex-wrap gap-2">
            {PILL_WIDTHS.map((width) => (
              <SkeletonBlock key={width} className={cn("h-8", width)} />
            ))}
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {STAT_WIDTHS.map((width) => (
              <div key={width} className="rounded-2xl border border-[#eadfce] bg-white px-4 py-3">
                <SkeletonBlock className="h-2.5 w-20" />
                <SkeletonBlock className={cn("mt-3 h-6 rounded-xl", width)} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-3 rounded-3xl border border-[#eadfce] bg-white p-4">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-8 w-72 max-w-full rounded-2xl" />
        <SkeletonBlock className="h-4 w-full max-w-2xl" />
        <SkeletonBlock className="h-4 w-4/5 max-w-xl" />
      </div>
    </div>
  );
}
