import { Container } from "@/components/layout/Container";

export default function PerfumesLoading() {
  return (
    <Container className="pt-10">
      <div className="h-20 animate-pulse rounded-2xl bg-[#efe5d8]" />

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-[#dfd1bf] bg-white p-5">
          <div className="h-6 w-24 animate-pulse rounded bg-[#f0e6d8]" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-11 animate-pulse rounded-xl bg-[#f5eee3]" />
            ))}
          </div>
        </aside>

        <section className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-[#e1d5c5] bg-white"
            >
              <div className="h-56 animate-pulse bg-[#efe5d8]" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-24 animate-pulse rounded bg-[#f1e8dc]" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-[#f1e8dc]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#f6efe5]" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-[#f6efe5]" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </Container>
  );
}
