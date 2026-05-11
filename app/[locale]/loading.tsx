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

function CardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)]">
      <SkeletonBlock className={cn("rounded-2xl", tall ? "h-44" : "h-28")} />
      <SkeletonBlock className="mt-4 h-3 w-24" />
      <SkeletonBlock className="mt-3 h-6 w-4/5 rounded-xl" />
      <SkeletonBlock className="mt-3 h-3.5 w-full" />
      <SkeletonBlock className="mt-2 h-3.5 w-2/3" />
    </div>
  );
}

export default function LocaleRouteLoading() {
  return (
    <Container className="space-y-5 pt-4 pb-14 md:space-y-8 md:pt-6">
      <div role="status" aria-live="polite" className="sr-only">
        Loading page
      </div>

      <section className="rounded-2xl border border-[#ddcfbc] bg-[#fffdf9] p-4 shadow-[0_26px_70px_-48px_rgba(50,35,20,0.42)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          <div>
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="mt-4 h-11 w-full max-w-xl rounded-2xl sm:h-14" />
            <SkeletonBlock className="mt-4 h-4 w-full max-w-2xl" />
            <SkeletonBlock className="mt-2 h-4 w-4/5 max-w-xl" />
            <div className="mt-5 flex flex-wrap gap-2">
              <SkeletonBlock className="h-10 w-32 rounded-2xl bg-[#1e4b3b]/50" />
              <SkeletonBlock className="h-10 w-28 rounded-2xl" />
            </div>
          </div>
          <SkeletonBlock className="hidden h-48 rounded-2xl bg-[#f1e7d8] lg:block" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton tall />
        <CardSkeleton tall />
        <CardSkeleton tall />
      </section>

      <section className="rounded-2xl border border-[#ddcfbc] bg-white p-4 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.22)] sm:p-6">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-3 h-8 w-72 max-w-full rounded-xl" />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>
    </Container>
  );
}
