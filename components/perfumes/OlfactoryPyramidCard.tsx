import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

import { NoteIcon } from "@/components/perfumes/NoteIcons";
import type { NoteListItem } from "@/components/perfumes/NotesList";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const orderedTypes = ["TOP", "HEART", "BASE"] as const;
const pyramidLevels = {
  TOP: {
    width: "w-[72%] sm:w-[56%]",
    className: "rounded-[1.6rem] border-[#ead6a2] bg-[linear-gradient(135deg,#fff7dc_0%,#f1d278_58%,#e6b949_100%)]",
    iconClassName: "bg-white/72 text-[#9a6f1f]",
    labelClassName: "text-[#765114]",
  },
  HEART: {
    width: "w-[88%] sm:w-[76%]",
    className: "rounded-[1.6rem] border-[#d7d5ad] bg-[linear-gradient(135deg,#f3f7dd_0%,#c9d6a6_46%,#8aa568_100%)]",
    iconClassName: "bg-white/76 text-[#506d39]",
    labelClassName: "text-[#39532d]",
  },
  BASE: {
    width: "w-full",
    className: "rounded-[1.6rem] border-[#cfc0ad] bg-[linear-gradient(135deg,#eee0cf_0%,#c1aa92_48%,#8d6d50_100%)]",
    iconClassName: "bg-white/78 text-[#6d5038]",
    labelClassName: "text-[#4d3828]",
  },
} as const;

export function OlfactoryPyramidCard({ notes }: { notes: NoteListItem[] }) {
  const t = useTranslations("perfume.notes");
  const locale = useLocale();

  return (
    <section className="overflow-hidden rounded-2xl border border-[#ddcfbc] bg-white p-4 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)] sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#907b66]">
            {locale === "it" ? "Note" : "Notes"}
          </p>
          <h2 className="mt-1 font-display text-xl text-[#21180f] sm:text-2xl">
            {locale === "it" ? "Piramide olfattiva" : "Olfactory pyramid"}
          </h2>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#eadfce] bg-[radial-gradient(circle_at_50%_16%,rgba(217,183,127,0.14),transparent_34%),linear-gradient(180deg,#fffdf9_0%,#f7efe4_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:mt-5 sm:p-4">
        <div className="flex flex-col items-center gap-2.5">
        {orderedTypes.map((type) => {
          const items = notes.filter((note) => note.noteType === type);
          const level = pyramidLevels[type];

          return (
            <div
              key={type}
              className={cn(
                "relative min-h-[6.4rem] overflow-hidden border px-5 py-3 shadow-[0_20px_42px_-32px_rgba(53,39,27,0.46),inset_0_1px_0_rgba(255,255,255,0.42)] transition-transform duration-200 active:scale-[0.99] sm:min-h-[7rem] sm:px-8",
                level.width,
                level.className,
              )}
            >
              <div
                className={cn(
                  "mx-auto flex h-full max-w-[34rem] flex-col items-center justify-center gap-2.5 text-center",
                )}
              >
                <h3 className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", level.labelClassName)}>
                  {t(`types.${type}`)}
                </h3>
                <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {items.slice(0, 4).map((item) => (
                  <Link
                    key={`${type}-${item.slug}`}
                    href={{ pathname: "/perfumes", query: { note: item.slug } }}
                    className="group inline-flex max-w-[8.25rem] items-center gap-1.5 rounded-full border border-white/60 bg-white/52 px-2 py-1 text-left shadow-[0_10px_20px_-18px_rgba(53,39,27,0.42)] backdrop-blur-sm transition-all duration-200 hover:bg-white/72 active:scale-95"
                  >
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors", level.iconClassName)}>
                      <NoteIcon slug={item.slug} className="h-4 w-4" />
                    </span>
                    <span className="truncate text-[11px] font-semibold leading-tight text-[#2f251d]">
                      {item.name}
                    </span>
                  </Link>
                ))}
                {items.length === 0 ? (
                  <p className="text-sm text-[#6b5948]">{t("empty")}</p>
                ) : null}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}
