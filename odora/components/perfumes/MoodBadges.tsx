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
    <div className="rounded-2xl border border-[#ddcfbc] bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7763]">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={`${title}-${item.name}`}>
            {item.name}
            {item.weight ? ` ${item.weight}/10` : ""}
          </Badge>
        ))}
      </div>
    </div>
  );
}
