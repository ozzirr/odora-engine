import { Badge } from "@/components/ui/Badge";

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
      <div className="mt-4 flex flex-wrap gap-3">
        {items.map((item) => (
          <Badge
            key={`${title}-${item.name}`}
            className="px-4 py-2.5 text-[0.97rem] font-medium tracking-[0.01em]"
          >
            {item.name}
            {item.weight ? ` ${item.weight}/10` : ""}
          </Badge>
        ))}
      </div>
    </div>
  );
}
