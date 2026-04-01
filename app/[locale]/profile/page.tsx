import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { signOut } from "@/app/profile/actions";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { Container } from "@/components/layout/Container";
import { getLocalizedPathname, hasLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { getCurrentUserSummary } from "@/lib/supabase/auth-state";

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
  const user = await getCurrentUserSummary();

  if (!user.isAuthenticated || !user.email) {
    redirect(
      getLocalizedPathname(resolvedLocale, "/login", undefined, {
        next: getLocalizedPathname(resolvedLocale, "/profile"),
      }),
    );
  }

  return (
    <Container className="py-14 sm:py-18">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{t("eyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl text-[#21180f]">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#685747]">{t("subtitle")}</p>

          <div className="mt-8">
            <ProfileForm email={user.email} initialName={user.displayName ?? ""} />
          </div>
        </section>

        <aside className="rounded-3xl border border-[#ddcfbe] bg-[#f8f2e8] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{t("session.eyebrow")}</p>
          <h2 className="mt-2 font-display text-3xl text-[#21180f]">{t("session.title")}</h2>
          <p className="mt-3 text-sm text-[#685747]">
            {t("session.authenticatedAs")} <span className="font-medium text-[#2c2219]">{user.email}</span>.
          </p>

          <form action={signOut} className="mt-6">
            <input type="hidden" name="locale" value={resolvedLocale} />
            <LogoutButton />
          </form>
        </aside>
      </div>
    </Container>
  );
}
