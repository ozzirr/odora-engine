import { cn } from "@/lib/utils";

type PerfumeDetailLoadingStateProps = {
  perfumeName?: string | null;
  variant?: "page" | "overlay";
};

const PILL_WIDTHS = ["w-24", "w-20"];
const STAT_WIDTHS = ["w-16", "w-14", "w-16"];
const LOADING_STEPS = [
  { it: "Analisi note", en: "Reading notes" },
  { it: "Confronto prezzi", en: "Checking prices" },
  { it: "Scheda profumo", en: "Building page" },
];

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-full bg-[#e8dece]",
        "after:absolute after:inset-y-0 after:-left-1/2 after:w-1/2 after:bg-gradient-to-r after:from-transparent after:via-white/45 after:to-transparent after:content-['']",
        "motion-safe:after:animate-[loading-slide_1.65s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

function BottleImageSkeleton() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-[radial-gradient(circle_at_22%_12%,#fffaf2_0%,#f2e8da_42%,#e4d7c5_100%)]">
      <div className="absolute inset-x-8 top-4 h-16 rounded-full bg-white/55 blur-3xl sm:inset-x-16 sm:top-10 sm:h-24" />
      <div className="absolute inset-x-8 bottom-3 h-16 rounded-full bg-[#d8c7b0]/40 blur-3xl sm:inset-x-14 sm:bottom-8 sm:h-24" />
      <div className="perfume-loading-orbit absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d9b77f]/30" />
      <div className="perfume-loading-orbit absolute left-1/2 top-1/2 h-[52%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 [animation-direction:reverse] [animation-duration:10s]" />
      <div className="perfume-loading-mist absolute left-[18%] top-[18%] h-2 w-2 rounded-full bg-[#d9b77f]/55" />
      <div className="perfume-loading-mist absolute right-[24%] top-[28%] h-1.5 w-1.5 rounded-full bg-white/75 [animation-delay:0.7s]" />
      <div className="perfume-loading-mist absolute bottom-[24%] left-[28%] h-1.5 w-1.5 rounded-full bg-[#1e4b3b]/30 [animation-delay:1.2s]" />

      <div className="perfume-loading-float absolute left-1/2 top-1/2 h-[72%] w-[30%] min-w-20 max-w-28 -translate-x-1/2 -translate-y-1/2 sm:min-w-28 sm:max-w-52">
        <div className="absolute left-1/2 -top-[7%] h-[7%] w-[24%] -translate-x-1/2 rounded-t-md bg-[#bfa98e]" />
        <div className="absolute left-1/2 top-0 h-[12%] w-[42%] -translate-x-1/2 rounded-t-[1.1rem] rounded-b-md bg-[#d3c2ac]" />
        <div className="absolute left-1/2 top-[9%] h-[9%] w-[56%] -translate-x-1/2 rounded-lg bg-[#c8b59d]" />
        <div className="absolute left-1/2 top-[17%] h-[78%] w-full -translate-x-1/2 rounded-[2.25rem] border border-[#d5c4ad] bg-[#efe5d7]/82 shadow-[0_28px_46px_-30px_rgba(66,48,31,0.5),inset_0_1px_0_rgba(255,255,255,0.82)]" />
        <div className="absolute left-1/2 top-[35%] h-[28%] w-[72%] -translate-x-1/2 rounded-[1.2rem] border border-[#d9c9b4] bg-[#f8f1e7]/88" />
        <div className="absolute left-1/2 top-[45%] h-[4%] w-[46%] -translate-x-1/2 rounded-full bg-[#dfd0bb]" />
        <div className="absolute left-1/2 top-[54%] h-[3%] w-[32%] -translate-x-1/2 rounded-full bg-[#e4d7c5]" />
        <div className="absolute left-[18%] top-[24%] h-[58%] w-[10%] rounded-full bg-white/45 blur-sm" />
        <div className="absolute right-[18%] top-[28%] h-[50%] w-[8%] rounded-full bg-white/35 blur-sm" />
        <div className="absolute bottom-0 left-1/2 h-[5%] w-[72%] -translate-x-1/2 rounded-[50%] bg-[#b9a58c]/28 blur-sm" />
      </div>
    </div>
  );
}

function LoadingStageRail({ isItalian }: { isItalian: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {LOADING_STEPS.map((step, index) => (
        <div
          key={step.en}
          className="rounded-2xl border border-[#eadfce] bg-white/70 px-2 py-2 shadow-[0_14px_28px_-24px_rgba(53,39,27,0.38)] sm:px-3 sm:py-3"
        >
          <div className="flex items-center gap-2">
            <span
              className="perfume-loading-dot h-2 w-2 shrink-0 rounded-full bg-[#1e4b3b] sm:h-2.5 sm:w-2.5"
              style={{ animationDelay: `${index * 180}ms` }}
            />
            <span className="text-[9px] font-semibold uppercase leading-tight tracking-[0.08em] text-[#6d5a47] sm:text-[11px] sm:tracking-[0.12em]">
              {isItalian ? step.it : step.en}
            </span>
          </div>
          <SkeletonBlock className="mt-2 h-1 w-full bg-[#efe5d6] sm:h-1.5" />
        </div>
      ))}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <section className="rounded-[1.45rem] border border-[#ddcfbc] bg-white p-6 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)]">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-9 w-64 max-w-full rounded-xl" />
      <div className="mt-4 space-y-2">
        <SkeletonBlock className="h-3.5 w-full max-w-3xl" />
        <SkeletonBlock className="h-3.5 w-11/12 max-w-2xl" />
        <SkeletonBlock className="h-3.5 w-4/5 max-w-xl" />
      </div>
    </section>
  );
}

function PyramidSkeleton() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#ddcfbc] bg-white p-4 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)] sm:p-6">
      <SkeletonBlock className="h-3 w-16" />
      <SkeletonBlock className="mt-3 h-8 w-56 rounded-xl" />
      <div className="mt-4 rounded-2xl border border-[#eadfce] bg-[linear-gradient(180deg,#fffdf9_0%,#f7efe4_100%)] p-3 sm:p-4">
        <div className="flex flex-col items-center gap-2.5">
          {[
            { width: "w-[72%] sm:w-[56%]", tone: "bg-[#e8bd58]/62" },
            { width: "w-[88%] sm:w-[76%]", tone: "bg-[#8aa568]/58" },
            { width: "w-full", tone: "bg-[#8d6d50]/50" },
          ].map((row, index) => (
            <div key={index} className={cn("min-h-[6.4rem] rounded-[1.2rem] border border-white/60 px-5 py-3 shadow-[0_18px_34px_-30px_rgba(53,39,27,0.38)]", row.width, row.tone)}>
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <SkeletonBlock className="h-3 w-20 bg-white/65" />
                <div className="flex max-w-full flex-wrap justify-center gap-1.5">
                  {[0, 1, 2].map((item) => (
                    <SkeletonBlock key={item} className="h-8 w-24 rounded-full bg-white/58" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BadgePanelsSkeleton() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((panel) => (
        <div key={panel} className="rounded-[1.45rem] border border-[#eadfce] bg-white p-5 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)]">
          <SkeletonBlock className="h-3 w-24" />
          <div className="mt-4 space-y-2">
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </section>
  );
}

function ContributeSkeleton() {
  return (
    <section className="rounded-2xl border border-[#ddcfbc] bg-[#f6efe5] p-4 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-7">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-7 w-72 max-w-full rounded-xl" />
      <SkeletonBlock className="mt-3 h-3.5 w-full max-w-lg" />
      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonBlock key={item} className="h-20 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#b8cfbd] bg-[#eee2d2] p-4">
            <SkeletonBlock className="h-6 w-48 rounded-xl" />
            <div className="mt-4 grid gap-2.5">
              {[0, 1, 2].map((input) => (
                <SkeletonBlock key={input} className="h-20 rounded-2xl bg-white" />
              ))}
            </div>
            <SkeletonBlock className="mt-4 h-11 rounded-2xl bg-[#d8cdbb]" />
          </div>
          <SkeletonBlock className="h-28 rounded-2xl bg-white" />
        </div>
        <div>
          <SkeletonBlock className="h-7 w-52 rounded-xl" />
          <div className="mt-4 space-y-3">
            <SkeletonBlock className="h-32 rounded-2xl bg-white" />
            <SkeletonBlock className="h-32 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PriceStackSkeleton() {
  return (
    <div className="grid gap-4 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-[#d8c4aa] bg-[linear-gradient(180deg,#fffdf9_0%,#f7efe4_100%)] p-4 shadow-[0_22px_60px_-38px_rgba(44,31,20,0.38)] sm:p-5">
        <SkeletonBlock className="h-3 w-40" />
        <SkeletonBlock className="mt-4 h-14 w-48 rounded-xl" />
        <SkeletonBlock className="mt-4 h-4 w-40" />
        <SkeletonBlock className="mt-3 h-4 w-64 max-w-full" />
        <SkeletonBlock className="mt-5 h-12 rounded-2xl bg-[#1e4b3b]/65" />
        <SkeletonBlock className="mx-auto mt-3 h-3 w-44" />
      </div>
      <div className="rounded-2xl border border-[#eadfce] bg-[linear-gradient(135deg,#fffdf9,#fff7eb)] p-5 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.22)]">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="mt-3 h-7 w-56 max-w-full rounded-xl" />
        <SkeletonBlock className="mt-4 h-4 w-full max-w-sm" />
        <SkeletonBlock className="mt-4 h-11 rounded-2xl bg-[#f0e9de]" />
      </div>
    </div>
  );
}

function PyramidPriceSkeleton() {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-start">
      <PyramidSkeleton />
      <PriceStackSkeleton />
    </section>
  );
}

function RelatedSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <section className="space-y-4">
      <div>
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-3 h-8 w-72 max-w-full rounded-xl" />
        <SkeletonBlock className="mt-3 h-3.5 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-[var(--radius-card)] border border-[#ede4d8] bg-white shadow-[var(--shadow-card)]">
            <SkeletonBlock className="h-40 rounded-none sm:h-52" />
            <div className="p-4">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="mt-3 h-6 w-full rounded-lg" />
              <SkeletonBlock className="mt-3 h-6 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSkeleton() {
  return (
    <section className="space-y-4">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="h-8 w-80 max-w-full rounded-xl" />
      <div className="rounded-[1.45rem] border border-[#ddcfbc] bg-white">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="border-b border-[#eadfce] p-4 last:border-0">
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );
}

function SmartFinderSkeleton() {
  return (
    <section className="rounded-2xl border border-[#d7c8b6] bg-[linear-gradient(135deg,#fffdf9_0%,#edf4ee_54%,#f7efe4_100%)] p-4 shadow-[0_22px_55px_-40px_rgba(44,31,20,0.38)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-3 h-8 w-80 max-w-full rounded-xl" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
          <SkeletonBlock className="mt-2 h-4 w-3/4 max-w-xl" />
        </div>
        <SkeletonBlock className="h-12 w-full rounded-2xl bg-[#1e4b3b]/65 sm:w-44" />
      </div>
    </section>
  );
}

export function PerfumeDetailLoadingState({ perfumeName, variant = "page" }: PerfumeDetailLoadingStateProps) {
  const isOverlay = variant === "overlay";
  const isItalian = true;

  return (
    <div role="status" aria-live="polite" data-loading-variant={variant} className="w-full space-y-4 md:space-y-8">
      <span className="sr-only">Caricamento profumo</span>

      <div
        className={cn(
          "relative isolate w-full overflow-hidden rounded-2xl border border-[#ddd0be] bg-[#fffdf9] p-3 shadow-[0_26px_70px_-48px_rgba(50,35,20,0.42)] sm:p-5 lg:p-6",
        )}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(217,183,127,0.18),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(30,75,59,0.08),transparent_28%)]" />
        <div className="loading-bar-track mb-4 h-1.5 rounded-full bg-[#efe5d6]">
          <div className="loading-bar-fill h-full w-1/3 rounded-full bg-[#cda664]" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="relative order-2 h-40 overflow-hidden rounded-2xl border border-[#ddcfbc] bg-white shadow-[0_18px_36px_-28px_rgba(53,39,27,0.28)] sm:h-[25rem] lg:order-1 lg:h-[31rem]">
            <BottleImageSkeleton />
          </div>

          <div className="order-1 min-w-0 lg:order-2 lg:py-2">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-[#eadfce] bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a624b]">
                {isOverlay && perfumeName
                  ? `Prepariamo ${perfumeName}`
                  : "Prepariamo la scheda profumo"}
              </div>
              <SkeletonBlock className="mt-3 h-10 w-4/5 max-w-[320px] rounded-[1rem] sm:mt-4 sm:h-16 lg:h-20 lg:max-w-[430px]" />
              <SkeletonBlock className="mt-2 h-3.5 w-80 max-w-full sm:mt-3 sm:h-4" />
            </div>

            <div className="mt-3 sm:mt-5">
              <LoadingStageRail isItalian={isItalian} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              {PILL_WIDTHS.map((width) => (
                <SkeletonBlock key={width} className={cn("h-6 sm:h-7", width)} />
              ))}
            </div>

            <div className="mt-3 rounded-[1.35rem] border border-[#dfd1be] bg-[#fffdf9]/88 p-3 sm:mt-4 sm:p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="mt-2 h-8 w-24 rounded-xl sm:mt-3 sm:h-9" />
                </div>
                <SkeletonBlock className="h-3.5 w-20 sm:h-4 sm:w-24" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-2.5">
                {STAT_WIDTHS.map((width, index) => (
                  <div key={`${width}-${index}`} className="rounded-[1rem] border border-[#deceb9] bg-white/78 px-2 py-2 sm:px-3 sm:py-3">
                    <SkeletonBlock className="mx-auto h-2 w-12 sm:h-2.5 sm:w-16" />
                    <SkeletonBlock className={cn("mx-auto mt-2 h-4 rounded-xl sm:mt-3 sm:h-5", width)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
              <SkeletonBlock className="h-10 rounded-2xl bg-[#f0e9de] sm:h-12" />
              <SkeletonBlock className="hidden h-12 rounded-2xl bg-[#f3c879] sm:block" />
            </div>
          </div>
        </div>
      </div>

      <OverviewSkeleton />
      <PyramidPriceSkeleton />
      <BadgePanelsSkeleton />
      <ContributeSkeleton />
      <RelatedSkeleton />
      <RelatedSkeleton />
      <FaqSkeleton />
      <SmartFinderSkeleton />
    </div>
  );
}
