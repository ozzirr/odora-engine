import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { signOut } from "@/app/profile/actions";
import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PerfumeListsSection } from "@/components/profile/PerfumeListsSection";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { Container } from "@/components/layout/Container";
import { getLocalizedPathname, hasLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { ensureAppUser, getUserPerfumeLists } from "@/lib/perfume-lists";
import { getCurrentUser, getCurrentUserSummary } from "@/lib/supabase/auth-state";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.profile" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/profile",
    robots: {
      index: false,
      follow: true,
    },
  });
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "profile.page" });
  const [user, supabaseUser] = await Promise.all([getCurrentUserSummary(), getCurrentUser()]);

  if (!user.isAuthenticated || !user.email || !supabaseUser) {
    redirect(
      getLocalizedPathname(resolvedLocale, "/login", undefined, {
        next: getLocalizedPathname(resolvedLocale, "/profile"),
      }),
    );
  }

  const appUser = await ensureAppUser(supabaseUser);
  const lists = await getUserPerfumeLists(appUser.id);
  const savedPerfumeCount = lists.reduce((total, list) => total + list.itemCount, 0);
  const publicListCount = lists.filter((list) => list.visibility === "PUBLIC").length;
  const displayName = appUser.name ?? user.displayName ?? user.email.split("@")[0] ?? "Odora";
  const profileInitial = displayName.trim().slice(0, 1).toUpperCase() || "O";

  return (
    <Container className="pt-8 pb-2 sm:pt-10 sm:pb-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#ddcfbe] bg-[linear-gradient(135deg,#fffdf9_0%,#f7f0e6_100%)] shadow-[0_24px_58px_-42px_rgba(53,39,27,0.48)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
            <div className="p-6 sm:p-8 lg:p-9">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.55rem] border border-[#d8c9b6] bg-[#214f3e] font-display text-4xl text-white shadow-[0_18px_34px_-24px_rgba(31,72,57,0.85)]">
                  {profileInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b7762]">{t("eyebrow")}</p>
                  <h1 className="mt-2 font-display text-4xl leading-none text-[#21180f] sm:text-5xl">{displayName}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#685747]">{t("subtitle")}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-[#e5d8c7] bg-white/42 lg:border-l lg:border-t-0">
              {[
                { label: "Liste", value: lists.length },
                { label: "Profumi", value: savedPerfumeCount },
                { label: "Pubbliche", value: publicListCount },
              ].map((item) => (
                <div key={item.label} className="border-r border-[#e5d8c7] px-4 py-5 text-center last:border-r-0 lg:py-8">
                  <p className="font-display text-3xl leading-none text-[#21180f]">{item.value}</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b7762]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <section className="rounded-[1.75rem] border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.36)] sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">Dati personali</p>
              <h2 className="mt-2 font-display text-3xl text-[#21180f]">{t("title")}</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#685747]">Nome, nazione e data di nascita aiutano Odora a rendere piu personale l&apos;esperienza.</p>
          </div>
          <div className="mt-8">
            <ScopedIntlProvider locale={resolvedLocale} namespaces={["profile"]}>
              <ProfileForm
                email={user.email}
                initialName={displayName}
                initialCountryCode={appUser.countryCode}
                initialBirthDate={appUser.birthDate ? appUser.birthDate.toISOString().slice(0, 10) : null}
              />
            </ScopedIntlProvider>
          </div>
        </section>

        <aside className="rounded-[1.75rem] border border-[#ddcfbe] bg-[#f8f2e8] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{t("session.eyebrow")}</p>
          <h2 className="mt-2 font-display text-3xl text-[#21180f]">{t("session.title")}</h2>
          <p className="mt-3 text-sm text-[#685747]">
            {t("session.authenticatedAs")} <span className="font-medium text-[#2c2219]">{user.email}</span>.
          </p>

          <form action={signOut} className="mt-6">
            <input type="hidden" name="locale" value={resolvedLocale} />
            <ScopedIntlProvider locale={resolvedLocale} namespaces={["profile"]}>
              <LogoutButton />
            </ScopedIntlProvider>
          </form>
        </aside>
        </div>

        <PerfumeListsSection locale={resolvedLocale} lists={lists} />
      </div>
    </Container>
  );
}
