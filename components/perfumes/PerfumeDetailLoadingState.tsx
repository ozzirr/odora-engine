import { cn } from "@/lib/utils";

type PerfumeDetailLoadingStateProps = {
  perfumeName?: string | null;
  variant?: "page" | "overlay";
};

const PILL_WIDTHS = ["w-24", "w-20"];
const STAT_WIDTHS = ["w-16", "w-14", "w-16"];

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-full bg-[#e8dece]", className)} />;
}

export function PerfumeDetailLoadingState({ variant = "page" }: PerfumeDetailLoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <span className="sr-only">Caricamento profumo</span>

      <div
        className={cn(
          "w-full rounded-[1.7rem] border border-[#ddd0be] bg-[#fffdf9] p-4 shadow-[0_26px_70px_-48px_rgba(50,35,20,0.42)] sm:p-5 lg:p-6",
          variant === "overlay" ? "mx-auto max-w-5xl" : undefined,
        )}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="h-[20rem] rounded-[1.25rem] border border-[#ddcfbc] bg-white p-3 shadow-[0_18px_36px_-28px_rgba(53,39,27,0.28)] sm:h-[25rem] lg:h-[31rem]">
            <div className="h-full rounded-[1rem] bg-[#eee5d8]" />
          </div>

          <div className="min-w-0 lg:py-2">
            <div className="mt-6 lg:mt-0">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="mt-4 h-12 w-4/5 max-w-[360px] rounded-2xl sm:h-14" />
              <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {PILL_WIDTHS.map((width) => (
                <SkeletonBlock key={width} className={cn("h-7", width)} />
              ))}
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-[#dfd1be] bg-[#fffdf9]/88 p-3 sm:p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="mt-3 h-9 w-24 rounded-xl" />
                </div>
                <SkeletonBlock className="h-4 w-24" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {STAT_WIDTHS.map((width, index) => (
                  <div key={`${width}-${index}`} className="rounded-[1rem] border border-[#deceb9] bg-white/78 px-3 py-3">
                    <SkeletonBlock className="mx-auto h-2.5 w-16" />
                    <SkeletonBlock className={cn("mx-auto mt-3 h-5 rounded-xl", width)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SkeletonBlock className="h-12 rounded-full" />
              <SkeletonBlock className="hidden h-12 rounded-full bg-[#f3c879] sm:block" />
            </div>

            <div className="mt-4 hidden rounded-[1.55rem] border border-[#e1d2bf] bg-white/92 p-4 sm:block sm:p-5">
              <SkeletonBlock className="h-3 w-36" />
              <SkeletonBlock className="mt-4 h-12 w-44 rounded-xl" />
              <SkeletonBlock className="mt-4 h-4 w-36" />
              <SkeletonBlock className="mt-3 h-4 w-56 max-w-full" />
              <SkeletonBlock className="mt-5 h-[3.25rem] rounded-full bg-[#f3c879]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
