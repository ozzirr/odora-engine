import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

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

function MoodCardSkeleton({ tone }: { tone: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-card)] border border-[#e2d6c6]/60 p-5 shadow-[var(--shadow-card)] sm:p-[1.375rem]", tone)}>
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/20 blur-[56px]" />
      <div className="relative grid min-h-[10.25rem] grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3">
        <SkeletonBlock className="h-7 w-24 bg-white/40" />
        <SkeletonBlock className="h-14 w-14 rounded-2xl bg-white/40" />
        <div className="col-span-2">
          <SkeletonBlock className="h-9 w-32 rounded-xl bg-white/44" />
          <SkeletonBlock className="mt-3 h-3.5 w-full bg-white/36" />
          <SkeletonBlock className="mt-2 h-3.5 w-3/4 bg-white/36" />
        </div>
        <SkeletonBlock className="col-span-2 mt-1 h-3 w-28 bg-white/36" />
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <>
      <section className="pt-10 sm:pt-14 lg:pt-16">
        <Container>
          <div className="paper-texture relative overflow-hidden rounded-[2rem] border border-[#e7dbc9] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(246,238,228,0.98))] px-6 py-8 text-[#1e1813] shadow-[0_30px_90px_-48px_rgba(45,31,18,0.28)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.85),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(214,232,220,0.55),transparent_30%),radial-gradient(circle_at_82%_82%,rgba(232,214,188,0.46),transparent_28%)]" />
            <div className="pointer-events-none absolute inset-4 rounded-[1.55rem] border border-white/55 sm:inset-6" />
            <div className="relative mx-auto max-w-[52rem] text-center">
              <SkeletonBlock className="mx-auto h-9 w-48 bg-white/70" />
              <SkeletonBlock className="mx-auto mt-5 h-24 w-full max-w-[34rem] rounded-[1.4rem] sm:mt-6 sm:h-32" />
              <SkeletonBlock className="mx-auto mt-5 h-4 w-full max-w-[42rem]" />
              <SkeletonBlock className="mx-auto mt-2 h-4 w-4/5 max-w-[34rem]" />
              <SkeletonBlock className="mx-auto mt-6 h-[3.1rem] w-full min-w-[16rem] max-w-[18rem] rounded-full bg-[#1e4b3b]/55 sm:mt-7" />
            </div>

            <div className="relative mt-8 border-t border-[#eadfce] pt-7 sm:mt-10 sm:pt-8">
              <SkeletonBlock className="mx-auto h-3 w-32 bg-[#d9b77f]/60" />
              <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-white/12 bg-white/[0.08] py-3 sm:mt-5 sm:py-4">
                <div className="flex gap-3 px-2">
                  {[0, 1, 2, 3].map((item) => (
                    <SkeletonBlock key={item} className="h-16 min-w-[10.5rem] rounded-[1.15rem] bg-[#fff8ed]/80 sm:min-w-[12rem]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <div className="mt-5 rounded-[1.4rem] border border-[#eadfce] bg-white/72 px-4 py-3 shadow-[0_12px_30px_-26px_rgba(50,35,20,0.2)] sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonBlock key={item} className="h-3 w-28" />
            ))}
          </div>
        </div>
      </Container>

      <Container>
        <section className="section-gap space-y-10">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-full max-w-md rounded-xl" />
            <SkeletonBlock className="h-4 w-full max-w-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MoodCardSkeleton tone="bg-gradient-to-br from-[#f9ead7] to-[#e8cda8]" />
            <MoodCardSkeleton tone="bg-gradient-to-br from-[#e8f0df] to-[#c9d7b8]" />
            <MoodCardSkeleton tone="bg-gradient-to-br from-[#f4e1df] to-[#e2beb9]" />
            <MoodCardSkeleton tone="bg-gradient-to-br from-[#e9edf3] to-[#cbd5df]" />
            <MoodCardSkeleton tone="bg-gradient-to-br from-[#f6ecd9] to-[#ddc29b]" />
            <MoodCardSkeleton tone="bg-gradient-to-br from-[#e6efe9] to-[#b9d0c2]" />
          </div>
        </section>

        <section className="section-gap space-y-10">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-full max-w-md rounded-xl" />
            <SkeletonBlock className="h-4 w-full max-w-xl" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="relative overflow-hidden rounded-[var(--radius-card)] border border-[#ede4d8] bg-white/80 p-7 shadow-[var(--shadow-card)]">
                <SkeletonBlock className="h-11 w-11 rounded-[0.85rem]" />
                <SkeletonBlock className="mt-5 h-3 w-10" />
                <SkeletonBlock className="mt-3 h-8 w-40 rounded-xl" />
                <SkeletonBlock className="mt-4 h-4 w-full max-w-xs" />
                <SkeletonBlock className="mt-2 h-4 w-3/4 max-w-xs" />
              </div>
            ))}
          </div>
          <div className="pb-16 lg:pb-20" />
        </section>
      </Container>
    </>
  );
}
