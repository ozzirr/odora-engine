import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/Badge";
import { Link } from "@/lib/navigation";

export type NoteListItem = {
  name: string;
  slug: string;
  noteType: string;
  intensity: number | null;
};

const orderedTypes = ["TOP", "HEART", "BASE"];

export function NotesList({ notes }: { notes: NoteListItem[] }) {
  const t = useTranslations("perfume.notes");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {orderedTypes.map((type) => {
        const items = notes.filter((note) => note.noteType === type);

        return (
          <div key={type} className="rounded-2xl border border-[#ddcfbc] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7763]">
              {t(`types.${type}`)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {items.map((item) => (
                <Link
                  key={`${type}-${item.slug}`}
                  href={{ pathname: "/perfumes", query: { note: item.slug } }}
                >
                  <Badge variant="outline" className="transition-colors hover:bg-[#efe3d2]">
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
