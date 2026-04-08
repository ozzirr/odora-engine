import { useTranslations } from "next-intl";

import { Link } from "@/lib/navigation";
import { NoteIcon } from "@/components/perfumes/NoteIcons";

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
          <div key={type} className="rounded-2xl border border-[#ddcfbc] bg-white p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              {t(`types.${type}`)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {items.map((item) => (
                <Link
                  key={`${type}-${item.slug}`}
                  href={{ pathname: "/perfumes", query: { note: item.slug } }}
                  className="flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-[1.8rem] border border-[#ddcfbc] bg-[#f8f4ed] px-3 py-3 text-center text-[#3f3125] shadow-[0_1px_0_rgba(84,62,38,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ccb79a] hover:bg-[#f2e9dc] hover:text-[#2e231a]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/75 text-[#9a8266]">
                    <NoteIcon slug={item.slug} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-balance font-display text-[1.08rem] leading-[1.02] tracking-[-0.02em] sm:text-[1.14rem]">
                    {item.name}
                    {item.intensity ? ` ${item.intensity}/10` : ""}
                  </span>
                </Link>
              ))}
              {items.length === 0 ? <p className="col-span-3 text-sm text-[#6b5948]">{t("empty")}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
