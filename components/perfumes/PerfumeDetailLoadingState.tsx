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

function BottleImageSkeleton() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-[radial-gradient(circle_at_28%_18%,#fffaf2_0%,#f2e8da_46%,#e7dccd_100%)]">
      <div className="absolute inset-x-10 top-8 h-24 rounded-full bg-white/45 blur-3xl sm:inset-x-16 sm:top-10" />
      <div className="absolute inset-x-8 bottom-8 h-24 rounded-full bg-[#d8c7b0]/35 blur-3xl sm:inset-x-14" />

      <div className="absolute left-1/2 top-1/2 h-[72%] w-[34%] min-w-28 max-w-52 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-0 h-[12%] w-[42%] -translate-x-1/2 rounded-t-[1.1rem] rounded-b-md bg-[#d3c2ac]" />
        <div className="absolute left-1/2 top-[9%] h-[9%] w-[56%] -translate-x-1/2 rounded-lg bg-[#c8b59d]" />
        <div className="absolute left-1/2 top-[17%] h-[78%] w-full -translate-x-1/2 rounded-[2.25rem] border border-[#d5c4ad] bg-[#efe5d7]/82 shadow-[0_28px_46px_-30px_rgba(66,48,31,0.5)]" />
        <div className="absolute left-1/2 top-[35%] h-[28%] w-[72%] -translate-x-1/2 rounded-[1.2rem] border border-[#d9c9b4] bg-[#f8f1e7]/88" />
        <div className="absolute left-[18%] top-[24%] h-[58%] w-[10%] rounded-full bg-white/45 blur-sm" />
        <div className="absolute right-[18%] top-[28%] h-[50%] w-[8%] rounded-full bg-white/35 blur-sm" />
      </div>
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
    <section className="rounded-[1.45rem] border border-[#ddcfbc] bg-white p-5 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)] sm:p-6">
      <SkeletonBlock className="h-8 w-56 rounded-xl" />
      <div className="mt-5 space-y-5">
        {[0, 1, 2].map((row) => (
          <div key={row} className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-4 border-b border-[#eadfce] pb-4 last:border-0 last:pb-0">
            <SkeletonBlock className="h-4 w-24" />
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex flex-col items-center gap-2">
                  <SkeletonBlock className="h-10 w-10 rounded-full" />
                  <SkeletonBlock className="h-2.5 w-14" />
                </div>
              ))}
            </div>
          </div>
        ))}
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
    <section className="rounded-3xl border border-[#ddcfbc] bg-[#fffdf9] p-5 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-7">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-9 w-72 max-w-full rounded-xl" />
      <SkeletonBlock className="mt-3 h-3.5 w-full max-w-lg" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[0, 1].map((form) => (
          <div key={form} className="rounded-2xl border border-[#eadfce] bg-white p-4">
            <SkeletonBlock className="h-7 w-48 rounded-xl" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((input) => (
                <SkeletonBlock key={input} className="h-11 rounded-xl" />
              ))}
            </div>
            <SkeletonBlock className="mt-3 h-20 rounded-xl" />
            <SkeletonBlock className="mt-3 h-11 rounded-xl bg-[#d8cdbb]" />
          </div>
        ))}
      </div>
    </section>
  );
}

function CommunitySkeleton() {
  return (
    <section className="rounded-3xl border border-[#ddcfbc] bg-[#fffdf9] p-5 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-7">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-3 h-9 w-72 max-w-full rounded-xl" />
          <SkeletonBlock className="mt-3 h-3.5 w-full max-w-lg" />
        </div>
        <div>
          <SkeletonBlock className="h-7 w-52 rounded-xl" />
          <div className="mt-4 space-y-3">
            <SkeletonBlock className="h-24 rounded-[1.25rem]" />
            <SkeletonBlock className="h-24 rounded-[1.25rem]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function UtilityCardsSkeleton() {
  return (
    <section className="rounded-[1.45rem] border border-[#eadfce] bg-white p-5 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)]">
      <SkeletonBlock className="h-7 w-48 rounded-xl" />
      <div className="mt-4 space-y-3">
        <SkeletonBlock className="h-3.5 w-72 max-w-full" />
        <SkeletonBlock className="h-3.5 w-56 max-w-full" />
        <SkeletonBlock className="h-11 w-full rounded-xl" />
      </div>
    </section>
  );
}

function PriceSkeleton() {
  return (
    <section className="rounded-[1.55rem] border border-[#e1d2bf] bg-white p-5 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)] sm:p-6">
      <SkeletonBlock className="h-3 w-40" />
      <SkeletonBlock className="mt-4 h-14 w-48 rounded-xl" />
      <SkeletonBlock className="mt-4 h-4 w-40" />
      <SkeletonBlock className="mt-3 h-4 w-64 max-w-full" />
      <SkeletonBlock className="mt-5 h-12 rounded-full bg-[#f3c879]" />
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

export function PerfumeDetailLoadingState({ variant = "page" }: PerfumeDetailLoadingStateProps) {
  return (
    <div role="status" aria-live="polite" data-loading-variant={variant} className="w-full space-y-6 md:space-y-8">
      <span className="sr-only">Caricamento profumo</span>

      <div
        className={cn(
          "w-full rounded-[1.7rem] border border-[#ddd0be] bg-[#fffdf9] p-4 shadow-[0_26px_70px_-48px_rgba(50,35,20,0.42)] sm:p-5 lg:p-6",
        )}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="relative h-[20rem] overflow-hidden rounded-[1.25rem] border border-[#ddcfbc] bg-white shadow-[0_18px_36px_-28px_rgba(53,39,27,0.28)] sm:h-[25rem] lg:h-[31rem]">
            <BottleImageSkeleton />
          </div>

          <div className="min-w-0 lg:py-2">
            <div className="mt-6 min-w-0 lg:mt-0">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="mt-3 h-14 w-4/5 max-w-[360px] rounded-[1rem] sm:h-16 lg:h-20 lg:max-w-[430px]" />
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
              <SkeletonBlock className="h-12 rounded-full sm:col-span-2" />
            </div>

          </div>
        </div>
      </div>

      <OverviewSkeleton />
      <PyramidSkeleton />
      <BadgePanelsSkeleton />
      <ContributeSkeleton />
      <CommunitySkeleton />
      <UtilityCardsSkeleton />
      <PriceSkeleton />
      <RelatedSkeleton />
      <RelatedSkeleton />
      <FaqSkeleton />
    </div>
  );
}
