import { useTranslations } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";

type CatalogGateProps = {
  previewLimit: number;
};

export function CatalogGate({ previewLimit }: CatalogGateProps) {
  const t = useTranslations("catalog.gate");

  return (
    <div className="rounded-2xl border border-[#d8c8b5] bg-[#fbf5ec] px-6 py-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7763]">{t("eyebrow")}</p>
      <h3 className="mt-2 font-display text-3xl text-[#201711]">{t("title")}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-[#675545]">
        {t("description", { previewLimit })}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/login" className={buttonStyles()}>
          {t("login")}
        </Link>
        <Link href="/signup" className={buttonStyles({ variant: "secondary" })}>
          {t("signup")}
        </Link>
      </div>
    </div>
  );
}
