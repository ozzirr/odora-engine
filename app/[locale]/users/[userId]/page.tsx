import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/lists/UserAvatar";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { hasLocale, type AppLocale } from "@/lib/i18n";
import { Link } from "@/lib/navigation";
import { buildPageMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/auth-state";

export const dynamic = "force-dynamic";

type UserProfilePageProps = {
  params: Promise<{ locale: string; userId: string }>;
};

async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, bio: true },
  });
  if (!user) return null;

  const lists = await prisma.perfumeList.findMany({
    where: { userId, visibility: "PUBLIC" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      updatedAt: true,
      _count: { select: { items: true, saves: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return { user, lists };
}

async function getSavedLists(userId: string) {
  return prisma.perfumeListSave.findMany({
    where: { userId, list: { visibility: "PUBLIC" } },
    select: {
      list: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          user: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { locale, userId } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "userProfile.page" });
  const profile = await getProfile(userId);

  if (!profile) {
    return buildPageMetadata({
      title: t("notFoundTitle"),
      description: t("notFoundDescription"),
      locale: resolvedLocale,
      pathname: "/users/[userId]",
      params: { userId },
      robots: { index: false, follow: false },
    });
  }

  const name = profile.user.name?.trim() || "Odora";

  return buildPageMetadata({
    title: `${name} | Odora`,
    description: profile.user.bio?.trim() || t("subtitle", { name }),
    locale: resolvedLocale,
    pathname: "/users/[userId]",
    params: { userId },
  });
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { locale, userId } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const profile = await getProfile(userId);

  if (!profile) notFound();

  const t = await getTranslations({ locale: resolvedLocale, namespace: "userProfile.page" });
  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === userId;
  const savedLists = isOwner ? await getSavedLists(userId) : [];
  const name = profile.user.name?.trim() || "Odora";

  return (
    <ScopedIntlProvider locale={resolvedLocale} namespaces={["common", "userProfile"]}>
      <Container className="space-y-10 py-10 sm:py-14">
        <header className="rounded-[2rem] border border-[#ddcfbe] bg-[linear-gradient(180deg,#fffdf9,#f7f0e6)] p-6 shadow-[0_22px_54px_-38px_rgba(50,35,20,0.34)] sm:p-10">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <UserAvatar name={name} size="lg" />
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7762]">
                {t("eyebrow")}
              </p>
              <h1 className="font-display text-3xl text-[#21180f] sm:text-4xl">{name}</h1>
              <p className="max-w-2xl text-[14.5px] leading-[1.7] text-[#6b5a49]">
                {profile.user.bio?.trim() || t("subtitle", { name })}
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <SectionTitle title={t("listsTitle", { name })} />
          {profile.lists.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.lists.map((list) => (
                <Link
                  key={list.id}
                  href={{
                    pathname: "/lists/[listKey]",
                    params: { listKey: `${list.id}-${list.slug}` },
                  }}
                  className="group block rounded-2xl border border-[#ddcfbe] bg-white p-5 shadow-[0_18px_40px_-36px_rgba(50,35,20,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-30px_rgba(50,35,20,0.45)]"
                >
                  <h3 className="font-display text-lg leading-tight text-[#21180f] group-hover:text-[#1f4b3b]">
                    {list.name}
                  </h3>
                  {list.description ? (
                    <p className="mt-2 line-clamp-2 text-[13.5px] text-[#6b5a49]">{list.description}</p>
                  ) : null}
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
                    {t("perfumeCount", { count: list._count.items })}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8b7762]">{t("listsEmpty")}</p>
          )}
        </section>

        {isOwner ? (
          <section className="space-y-4">
            <SectionTitle title={t("savedTitle")} />
            {savedLists.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedLists.map(({ list }) => {
                  const author = list.user.name?.trim() || "Odora";
                  return (
                    <Link
                      key={list.id}
                      href={{
                        pathname: "/lists/[listKey]",
                        params: { listKey: `${list.id}-${list.slug}` },
                      }}
                      className="group block rounded-2xl border border-[#ddcfbe] bg-white p-5 shadow-[0_18px_40px_-36px_rgba(50,35,20,0.3)] transition hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar name={author} size="sm" />
                        <p className="text-xs font-medium text-[#8b7762]">{author}</p>
                      </div>
                      <h3 className="mt-3 font-display text-lg leading-tight text-[#21180f] group-hover:text-[#1f4b3b]">
                        {list.name}
                      </h3>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
                        {t("perfumeCount", { count: list._count.items })}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#8b7762]">{t("savedEmpty")}</p>
            )}
          </section>
        ) : null}

      </Container>
    </ScopedIntlProvider>
  );
}
