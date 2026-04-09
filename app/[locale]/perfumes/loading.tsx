import { Container } from "@/components/layout/Container";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[1rem] bg-[#f1e9dd] ${className}`} />;
}

function PerfumeListItemSkeleton() {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#e1d5c5] bg-white shadow-[0_20px_45px_-36px_rgba(50,35,20,0.4)]">
      <div className="grid min-h-[12.5rem] grid-cols-[8.5rem_minmax(0,1fr)] sm:grid-cols-[11rem_minmax(0,1fr)]">
        <SkeletonBlock className="h-full min-h-[12.5rem] rounded-none bg-[#efe5d8]" />

        <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <SkeletonBlock className="h-4 w-36 rounded-full" />
              <SkeletonBlock className="h-9 w-24 rounded-full bg-[#2b2118]" />
            </div>

            <div className="space-y-3">
              <SkeletonBlock className="h-10 w-3/4 sm:h-12" />
              <SkeletonBlock className="h-5 w-full" />
              <SkeletonBlock className="h-5 w-4/5" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-8 w-24 rounded-full" />
              <SkeletonBlock className="h-8 w-20 rounded-full" />
              <SkeletonBlock className="h-8 w-28 rounded-full bg-[#2b2118]" />
            </div>

            <SkeletonBlock className="h-5 w-32" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PerfumesLoading() {
  return (
    <Container className="pt-6 sm:pt-8">
      <section className="space-y-4 rounded-3xl border border-[#dfd1bf] bg-white p-6 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-8">
        <SkeletonBlock className="h-4 w-24 rounded-full" />
        <SkeletonBlock className="h-12 w-full max-w-5xl sm:h-16" />
        <SkeletonBlock className="h-5 w-full max-w-3xl" />
        <SkeletonBlock className="h-5 w-4/5 max-w-2xl" />

        <div className="mt-3 flex flex-wrap gap-3">
          <SkeletonBlock className="h-12 w-36 rounded-full bg-[#21563f]" />
          <SkeletonBlock className="h-12 w-40 rounded-full" />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="rounded-2xl border border-[#dfd1bf] bg-white p-5 lg:self-start">
          <div className="mb-4 rounded-[1.7rem] border border-[#ddcfbc] bg-[#faf6ef] p-3.5">
            <SkeletonBlock className="h-4 w-28 rounded-full" />
            <div className="mt-3 flex items-center gap-3 rounded-[1.5rem] border border-[#e6d8c6] bg-white px-3 py-3">
              <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-28 rounded-full" />
                <SkeletonBlock className="h-8 w-32" />
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-5 w-16 rounded-full" />
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
            <SkeletonBlock className="h-5 w-20 rounded-full" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <SkeletonBlock className="h-4 w-28 rounded-full" />
                <SkeletonBlock className="h-11 w-full rounded-xl bg-[#fdfbf7]" />
              </div>
            ))}

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between rounded-xl border border-[#dfd1bf] px-3 py-3">
                <SkeletonBlock className="h-4 w-24 rounded-full" />
                <SkeletonBlock className="h-6 w-11 rounded-full" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#dfd1bf] px-3 py-3">
                <SkeletonBlock className="h-4 w-24 rounded-full" />
                <SkeletonBlock className="h-6 w-11 rounded-full" />
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-4 lg:min-w-0 lg:pb-8">
          <SkeletonBlock className="h-5 w-52 rounded-full" />

          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <PerfumeListItemSkeleton key={index} />
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
