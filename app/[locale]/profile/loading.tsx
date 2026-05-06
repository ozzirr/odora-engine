import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-[#e8dece]",
        "after:absolute after:inset-y-0 after:-left-1/2 after:w-1/2 after:bg-gradient-to-r after:from-transparent after:via-white/45 after:to-transparent after:content-['']",
        "motion-safe:after:animate-[loading-slide_1.65s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

function FieldSkeleton() {
  return (
    <div>
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-2 h-12 w-full rounded-2xl bg-white" />
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="grid gap-5 rounded-[1.65rem] border border-[#e0d2c0] bg-white/88 p-4 md:grid-cols-[minmax(15rem,0.82fr)_minmax(0,1fr)] md:p-5">
      <div className="grid h-44 grid-cols-4 grid-rows-2 gap-2 rounded-[1.35rem] border border-[#e0d2c0] bg-[#f8f2e8] p-2 sm:h-52">
        <SkeletonBlock className="col-span-2 row-span-2 rounded-[1rem] bg-white" />
        <SkeletonBlock className="rounded-[1rem] bg-white" />
        <SkeletonBlock className="rounded-[1rem] bg-white" />
        <SkeletonBlock className="rounded-[1rem] bg-white" />
        <SkeletonBlock className="rounded-[1rem] bg-white" />
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-8 w-56 max-w-full rounded-xl" />
            <SkeletonBlock className="mt-4 h-3.5 w-full max-w-md" />
            <SkeletonBlock className="mt-2 h-3.5 w-4/5 max-w-sm" />
          </div>
          <SkeletonBlock className="h-8 w-28" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <SkeletonBlock className="h-8 w-24" />
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonBlock className="h-8 w-28" />
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <SkeletonBlock className="h-10 w-20 bg-[#214f3e]" />
          <SkeletonBlock className="h-10 w-24" />
          <SkeletonBlock className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <Container className="pt-8 pb-2 sm:pt-10 sm:pb-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#ddcfbe] bg-[linear-gradient(135deg,#fffdf9_0%,#f7f0e6_100%)] shadow-[0_24px_58px_-42px_rgba(53,39,27,0.48)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
            <div className="p-6 sm:p-8 lg:p-9">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <SkeletonBlock className="h-20 w-20 rounded-[1.55rem] bg-[#214f3e]" />
                <div className="min-w-0 flex-1">
                  <SkeletonBlock className="h-3 w-28" />
                  <SkeletonBlock className="mt-3 h-12 w-64 max-w-full rounded-xl" />
                  <SkeletonBlock className="mt-4 h-3.5 w-full max-w-xl" />
                  <SkeletonBlock className="mt-2 h-3.5 w-4/5 max-w-md" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-[#e5d8c7] bg-white/42 lg:border-l lg:border-t-0">
              {[0, 1, 2].map((item) => (
                <div key={item} className="border-r border-[#e5d8c7] px-4 py-5 last:border-r-0 lg:py-8">
                  <SkeletonBlock className="mx-auto h-9 w-12 rounded-xl" />
                  <SkeletonBlock className="mx-auto mt-3 h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
          <section className="rounded-[1.75rem] border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.36)] sm:p-8">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="mt-3 h-8 w-56 rounded-xl" />
            <div className="mt-8 space-y-5">
              <FieldSkeleton />
              <FieldSkeleton />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
              <SkeletonBlock className="h-12 w-full rounded-full bg-[#214f3e] sm:w-40" />
            </div>
          </section>

          <aside className="rounded-[1.75rem] border border-[#ddcfbe] bg-[#f8f2e8] p-6 sm:p-8">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-3 h-8 w-52 rounded-xl" />
            <SkeletonBlock className="mt-5 h-3.5 w-full" />
            <SkeletonBlock className="mt-8 h-12 w-full rounded-full" />
          </aside>
        </div>

        <section className="rounded-[2rem] border border-[#ddcfbe] bg-[linear-gradient(180deg,#fffdf9,#f7f0e6)] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-3 w-44" />
              <SkeletonBlock className="mt-3 h-8 w-48 rounded-xl" />
              <SkeletonBlock className="mt-4 h-3.5 w-full max-w-lg" />
            </div>
            <SkeletonBlock className="h-12 w-full rounded-full bg-[#214f3e] sm:w-44" />
          </div>
          <div className="mt-6 grid gap-4">
            <ListCardSkeleton />
          </div>
        </section>
      </div>
    </Container>
  );
}
