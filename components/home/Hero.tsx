import { useTranslations } from "next-intl";

import { AuthModalTrigger } from "@/components/auth/AuthModalTrigger";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";

export function Hero() {
  const t = useTranslations("home.hero");
  const valueProps = [t("valueProps.compare"), t("valueProps.explore"), t("valueProps.choose")];

  return (
    <section className="pt-10 sm:pt-14 lg:pt-16">
      <Container>
        <div className="paper-texture relative overflow-hidden rounded-[2rem] border border-[#e4d8c8]/80 bg-[linear-gradient(135deg,#faf6ef_0%,#f7f0e5_56%,#f1e4d2_100%)] px-6 py-8 shadow-[0_24px_70px_-34px_rgba(50,35,20,0.34)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.88),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(226,209,186,0.56),transparent_28%),linear-gradient(120deg,rgba(255,255,255,0.1),transparent_44%)]" />
          <div className="pointer-events-none absolute inset-4 rounded-[1.55rem] border border-white/40 sm:inset-6" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-[linear-gradient(180deg,rgba(202,176,126,0.18),transparent_38%,rgba(202,176,126,0.08)_100%)]" />
          <div className="pointer-events-none absolute -left-16 top-8 h-36 w-36 rounded-full bg-white/40 blur-[72px] sm:h-52 sm:w-52" />
          <div className="pointer-events-none absolute -right-14 bottom-0 h-44 w-44 rounded-full bg-[#eadbc6]/48 blur-[74px] sm:h-60 sm:w-60" />

          <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1.18fr)_19rem] lg:items-end">
            <div className="text-center lg:text-left">
              <p className="inline-flex rounded-full border border-white/55 bg-white/58 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#907b66] shadow-[0_10px_24px_-18px_rgba(52,37,24,0.3)] backdrop-blur-[2px] sm:text-[10.5px] sm:tracking-[0.24em]">
                {t("eyebrow")}
              </p>

              <h1 className="mx-auto mt-5 max-w-[12.5ch] text-balance font-display text-[2.65rem] leading-[0.92] tracking-[-0.025em] text-[#1c1712] sm:mt-6 sm:max-w-[10.5ch] sm:text-[3.7rem] lg:mx-0 lg:text-[4.9rem]">
                {t("title")}
              </h1>

              <p className="mx-auto mt-4 max-w-[32rem] text-[15px] leading-[1.66] text-[#6b5a49] sm:mt-5 sm:text-[16.5px] sm:leading-[1.76] lg:mx-0 lg:max-w-[38rem]">
                {t("subtitle")}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <Link
                  href="/finder"
                  className={buttonStyles({
                    size: "lg",
                    className:
                      "w-full min-w-[12rem] shadow-[0_10px_26px_-12px_rgba(30,75,59,0.5)] sm:w-auto",
                  })}
                >
                  {t("startFinder")}
                </Link>
                <AuthModalTrigger
                  mode="signup"
                  className={buttonStyles({
                    variant: "secondary",
                    size: "lg",
                    className: "w-full min-w-[11rem] bg-white/58 backdrop-blur-[2px] sm:w-auto",
                  })}
                >
                  {t("browseCatalog")}
                </AuthModalTrigger>
              </div>

              <ul className="mt-6 flex flex-col items-center gap-2 text-left sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-4 sm:gap-y-2 lg:hidden">
                {valueProps.map((item, index) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="font-display text-[1rem] text-[#b08c20]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[12.5px] leading-[1.35] text-[#7a6857]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden rounded-[1.55rem] border border-white/55 bg-white/48 p-4 text-left shadow-[0_18px_44px_-30px_rgba(47,34,22,0.34)] backdrop-blur-[3px] sm:p-5 lg:block">
              <div className="flex items-center justify-between gap-3 border-b border-[#e6d8c5] pb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8f7a66]">
                  {t("spotlight")}
                </p>
                <span className="h-2.5 w-2.5 rounded-full bg-[#1E4B3B]" aria-hidden="true" />
              </div>

              <ul className="mt-4 space-y-2.5">
                {valueProps.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-[1.1rem] border border-[#eadfcf] bg-[#fffaf3]/82 px-3.5 py-3"
                  >
                    <span className="font-display text-[1.2rem] leading-none text-[#b08c20]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] leading-[1.45] text-[#6d5b49]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
