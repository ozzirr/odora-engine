import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

import { NoteIcon } from "@/components/perfumes/NoteIcons";
import type { NoteListItem } from "@/components/perfumes/NotesList";
import { Link } from "@/lib/navigation";

const orderedTypes = ["TOP", "HEART", "BASE"] as const;

export function OlfactoryPyramidCard({ notes }: { notes: NoteListItem[] }) {
  const t = useTranslations("perfume.notes");
  const locale = useLocale();

  return (
    <section className="rounded-[1.45rem] border border-[#ddcfbc] bg-white p-5 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)] sm:p-6">
      <h2 className="font-display text-2xl text-[#21180f]">
        {locale === "it" ? "Piramide olfattiva" : "Olfactory pyramid"}
      </h2>
      <div className="mt-5 divide-y divide-[#eadfce]">
        {orderedTypes.map((type) => {
          const items = notes.filter((note) => note.noteType === type);

          return (
            <div key={type} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-sm font-semibold text-[#1e4b3b]">{t(`types.${type}`)}</h3>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {items.slice(0, 4).map((item) => (
                  <Link
                    key={`${type}-${item.slug}`}
                    href={{ pathname: "/perfumes", query: { note: item.slug } }}
                    className="group flex min-w-0 flex-col items-center gap-2 text-center"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f4ed] text-[#9a8266] transition-colors group-hover:bg-[#efe5d7]">
                      <NoteIcon slug={item.slug} className="h-6 w-6" />
                    </span>
                    <span className="line-clamp-2 text-[12px] font-medium leading-tight text-[#3f3125]">
                      {item.name}
                    </span>
                  </Link>
                ))}
                {items.length === 0 ? (
                  <p className="col-span-4 text-sm text-[#6b5948]">{t("empty")}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
