const stepRows = Array.from({ length: 6 }, (_, index) => index);

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-gradient-to-r from-[#eadfce] via-white to-[#eadfce] ${className}`}
    />
  );
}

export default function FinderLoading() {
  return (
    <div className="bg-[#211914]">
      <main className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden pb-24 text-[#1e1813]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.7),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(220,234,223,0.48),transparent_24%),linear-gradient(180deg,#f8f4ec_0%,#fbf8f2_52%,#f4ede3_100%)]" />

        <div className="relative mx-auto grid min-h-[calc(100svh-10.5rem)] w-full max-w-6xl items-center gap-8 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:p-8">
          <section className="max-w-3xl">
            <SkeletonBlock className="h-7 w-36 border border-[#e0d3c3] bg-white/70" />

            <div className="mt-6 space-y-3">
              <SkeletonBlock className="h-14 w-[13rem] rounded-[1rem] sm:h-20 sm:w-[19rem]" />
              <SkeletonBlock className="h-14 w-[10rem] rounded-[1rem] sm:h-20 sm:w-[15rem]" />
            </div>

            <div className="mt-6 max-w-xl space-y-3">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-10/12" />
              <SkeletonBlock className="h-4 w-7/12" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <SkeletonBlock className="h-12 w-40 rounded-xl bg-[#d9b77f]/70" />
            </div>
          </section>

          <aside className="paper-texture hidden rounded-[1.6rem] border border-[#e5d9c8] bg-white/72 p-5 shadow-[0_24px_54px_-38px_rgba(50,35,20,0.22)] lg:block">
            <SkeletonBlock className="h-4 w-28" />
            <div className="mt-5 space-y-3">
              {stepRows.map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-3 rounded-[1rem] border border-[#eadfce] bg-[#fcfaf6] px-4 py-3"
                >
                  <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full bg-[#d9b77f]/70" />
                  <SkeletonBlock className="h-4 w-36" />
                </div>
              ))}
            </div>
          </aside>

          <section className="rounded-[1.6rem] border border-[#e5d9c8] bg-white/72 p-4 shadow-[0_24px_54px_-38px_rgba(50,35,20,0.22)] lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-8 w-20 rounded-full bg-[#d9b77f]/70" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {stepRows.slice(0, 4).map((row) => (
                <div key={row} className="rounded-2xl border border-[#eadfce] bg-[#fcfaf6] p-3">
                  <SkeletonBlock className="h-7 w-7 rounded-full bg-[#d9b77f]/70" />
                  <SkeletonBlock className="mt-3 h-3 w-20" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
