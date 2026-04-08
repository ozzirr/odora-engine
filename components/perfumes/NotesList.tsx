import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/Badge";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export type NoteListItem = {
  name: string;
  slug: string;
  noteType: string;
  intensity: number | null;
};

const orderedTypes = ["TOP", "HEART", "BASE"];

const noteBadgeStyles = [
  "border-[#e3d2a1] bg-[#f8f1dd] text-[#75572d] font-semibold",
  "border-[#ccdcbc] bg-[#edf4e9] text-[#4f6845] font-medium",
  "border-[#c8dce1] bg-[#e9f4f6] text-[#42626f] font-medium",
  "border-[#e2c8cf] bg-[#f7ecef] text-[#7c4d5c] font-medium",
  "border-[#deccb7] bg-[#f5ede4] text-[#6f4e36] font-display text-[1.02rem]",
  "border-[#d8cbe8] bg-[#f1ecf7] text-[#5d4a78] font-medium",
  "border-[#d9d1c7] bg-[#f2efea] text-[#5a5044] font-semibold",
  "border-[#ccdece] bg-[#edf5ee] text-[#4b6651] font-medium",
] as const;

function getNoteBadgeStyle(slug: string) {
  const hash = Array.from(slug).reduce((total, char) => total + char.charCodeAt(0), 0);
  return noteBadgeStyles[hash % noteBadgeStyles.length];
}

export function NotesList({ notes }: { notes: NoteListItem[] }) {
  const t = useTranslations("perfume.notes");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {orderedTypes.map((type) => {
        const items = notes.filter((note) => note.noteType === type);

        return (
          <div key={type} className="rounded-2xl border border-[#ddcfbc] bg-white p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              {t(`types.${type}`)}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {items.map((item) => (
                <Link
                  key={`${type}-${item.slug}`}
                  href={{ pathname: "/perfumes", query: { note: item.slug } }}
                  className="group"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "cursor-pointer px-4 py-2.5 text-[0.97rem] tracking-[0.01em] shadow-[0_1px_0_rgba(84,62,38,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[0.98] group-focus-visible:brightness-[0.98]",
                      getNoteBadgeStyle(item.slug),
                    )}
                  >
                    {item.name}
                    {item.intensity ? ` ${item.intensity}/10` : ""}
                  </Badge>
                </Link>
              ))}
              {items.length === 0 ? <p className="text-sm text-[#6b5948]">{t("empty")}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
