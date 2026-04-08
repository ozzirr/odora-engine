type MoodBadgeItem = {
  name: string;
  weight: number | null;
};

type MoodBadgesProps = {
  title: string;
  items: MoodBadgeItem[];
};

export function MoodBadges({ title, items }: MoodBadgesProps) {
  return (
    <div className="rounded-2xl border border-[#ddcfbc] bg-white p-5 md:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7763]">{title}</h3>
      <div className="mt-4 space-y-2.5">
        {items.map((item, index) => (
          <div
            key={`${title}-${item.name}`}
            className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-[#eee3d3] bg-[#faf7f1] px-4 py-3.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0e8dc] text-[11px] font-semibold tracking-[0.08em] text-[#8d7760]">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <span className="text-[1.02rem] font-medium leading-[1.2] text-[#3f3125]">{item.name}</span>
            </div>
            {item.weight ? (
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a846d]">
                {item.weight}/10
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
