import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { Container } from "@/components/layout/Container";
import {
  CopyLinkButton,
  DisabledSocialButton,
  ShareButtons,
} from "@/components/lists/ShareButtons";
import { UserAvatar } from "@/components/lists/UserAvatar";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getLocalizedPathname, hasLocale, type AppLocale } from "@/lib/i18n";
import { Link } from "@/lib/navigation";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/metadata";
import { parsePublicListKey } from "@/lib/perfume-lists";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/auth-state";

export const dynamic = "force-dynamic";

type PublicListPageProps = {
  params: Promise<{
    locale: string;
    listKey: string;
  }>;
};

const listInclude = {
  user: true,
  items: {
    orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
    include: {
      perfume: {
        include: {
          brand: true,
          notes: {
            select: {
              intensity: true,
              note: { select: { name: true, slug: true, noteType: true } },
            },
          },
          offers: { include: { store: true } },
        },
      },
    },
  },
};

async function getList(listKey: string) {
  const parsed = parsePublicListKey(listKey);
  if (!parsed) return null;

  return prisma.perfumeList.findFirst({
    where: { id: parsed.id },
    include: listInclude,
  });
}

async function getSimilarLists(currentListId: number, perfumeIds: number[]) {
  if (perfumeIds.length === 0) return [];

  const candidates = await prisma.perfumeList.findMany({
    where: {
      visibility: "PUBLIC",
      id: { not: currentListId },
      items: { some: { perfumeId: { in: perfumeIds } } },
    },
    include: {
      user: true,
      items: {
        select: { perfumeId: true },
      },
    },
    take: 30,
    orderBy: { updatedAt: "desc" },
  });

  const overlapSet = new Set(perfumeIds);

  return candidates
    .map((list) => {
      const overlap = list.items.filter((item) => overlapSet.has(item.perfumeId)).length;
      return { list, overlap };
    })
    .filter((entry) => entry.overlap >= 2)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 6)
    .map(({ list }) => list);
}

export async function generateMetadata({ params }: PublicListPageProps): Promise<Metadata> {
  const { locale, listKey } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const [list, currentUser] = await Promise.all([getList(listKey), getCurrentUser()]);

  if (!list || (list.visibility === "PRIVATE" && list.userId !== currentUser?.id)) {
    return buildPageMetadata({
      title: "Lista profumi Odora",
      description: "Scopri una selezione di profumi creata su Odora.",
      locale: resolvedLocale,
      pathname: "/lists/[listKey]",
      params: { listKey },
    });
  }

  return buildPageMetadata({
    title: `${list.name} | Lista profumi Odora`,
    description: list.description || "Scopri la selezione di profumi creata su Odora.",
    locale: resolvedLocale,
    pathname: "/lists/[listKey]",
    params: { listKey: `${list.id}-${list.slug}` },
    image: list.items[0]?.perfume.imageUrl,
  });
}

export default async function PublicListPage({ params }: PublicListPageProps) {
  const { locale, listKey } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const [list, currentUser] = await Promise.all([getList(listKey), getCurrentUser()]);

  if (!list || (list.visibility === "PRIVATE" && list.userId !== currentUser?.id)) {
    notFound();
  }

  const canonicalKey = `${list.id}-${list.slug}`;
  if (listKey !== canonicalKey) {
    redirect(getLocalizedPathname(resolvedLocale, "/lists/[listKey]", { listKey: canonicalKey }));
  }

  const t = await getTranslations({ locale: resolvedLocale, namespace: "publicList.page" });
  const perfumes = list.items.map((item) => item.perfume);
  const perfumeIds = perfumes.map((p) => p.id);
  const similarLists = await getSimilarLists(list.id, perfumeIds);

  const authorName = list.user.name?.trim() || "Odora";
  const isPublic = list.visibility === "PUBLIC";
  const description = list.description?.trim() || t("descriptionFallback");
  const listPath = getLocalizedPathname(resolvedLocale, "/lists/[listKey]", {
    listKey: canonicalKey,
  });
  const absoluteUrl = toAbsoluteUrl(listPath);

  return (
    <ScopedIntlProvider locale={resolvedLocale} namespaces={["common", "catalog", "perfume", "taxonomy", "publicList"]}>
      <Container className="space-y-12 py-10 sm:py-14">
        {/* Hero */}
        <header className="rounded-[2rem] border border-[#ddcfbe] bg-[linear-gradient(180deg,#fffdf9,#f7f0e6)] p-6 shadow-[0_22px_54px_-38px_rgba(50,35,20,0.34)] sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                isPublic ? "bg-[#1f4b3b] text-white" : "bg-[#e8ddc9] text-[#5b4a36]"
              }`}
            >
              {isPublic ? t("badgePublic") : t("badgePrivate")}
            </span>
            <span className="text-xs text-[#8b7762]">
              {t("perfumeCount", { count: list.items.length })}
            </span>
          </div>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#21180f] sm:text-5xl">
            {list.name}
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-[1.7] text-[#5d4c3e]">{description}</p>

          <div className="mt-6 flex items-center gap-3">
            <UserAvatar name={authorName} size="md" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
                {t("byAuthor", { name: authorName })}
              </p>
            </div>
          </div>

          {isPublic ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <CopyLinkButton url={absoluteUrl} variant="primary" />
              <DisabledSocialButton label={t("saveSoon")} tooltip={t("comingSoon")} />
              <DisabledSocialButton label={t("followSoon")} tooltip={t("comingSoon")} />
            </div>
          ) : null}
        </header>

        {/* Author block */}
        <section className="rounded-2xl border border-[#ddcfbe] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(50,35,20,0.25)] sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <UserAvatar name={authorName} size="lg" />
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7762]">
                {t("authorEyebrow")}
              </p>
              <h2 className="font-display text-2xl text-[#21180f]">{authorName}</h2>
              <p className="text-[14.5px] leading-[1.7] text-[#6b5a49]">{t("authorBio")}</p>
            </div>
            <span
              title={t("comingSoon")}
              className="cursor-not-allowed rounded-full border border-dashed border-[#d8c9b6] bg-[#faf4eb] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#a89889]"
            >
              {t("authorAllLists")}
            </span>
          </div>
        </section>

        {/* Intro */}
        <section className="space-y-3">
          <SectionTitle eyebrow={t("introEyebrow")} title={t("introTitle")} subtitle={description} />
        </section>

        {/* Perfumes */}
        <section className="space-y-4">
          <SectionTitle eyebrow={t("perfumesEyebrow")} title={t("perfumesTitle")} />
          {perfumes.length > 0 ? (
            <PerfumeGrid perfumes={perfumes} />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-center text-sm text-[#655444]">
              {t("perfumesEmpty")}
            </div>
          )}
        </section>

        {/* Share */}
        {isPublic ? (
          <section className="rounded-2xl border border-[#ddcfbe] bg-[#fdf8ef] p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7762]">
              {t("shareEyebrow")}
            </p>
            <h2 className="mt-2 font-display text-2xl text-[#21180f]">{t("shareTitle")}</h2>
            <p className="mt-2 max-w-xl text-[14.5px] leading-[1.7] text-[#6b5a49]">
              {t("shareSubtitle")}
            </p>
            <div className="mt-5">
              <ShareButtons url={absoluteUrl} title={list.name} />
            </div>
          </section>
        ) : null}

        {/* Similar lists */}
        <section className="space-y-4">
          <SectionTitle eyebrow={t("similarEyebrow")} title={t("similarTitle")} />
          {similarLists.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarLists.map((similar) => {
                const similarAuthor = similar.user.name?.trim() || "Odora";
                return (
                  <Link
                    key={similar.id}
                    href={{ pathname: "/lists/[listKey]", params: { listKey: `${similar.id}-${similar.slug}` } }}
                    className="group block rounded-2xl border border-[#ddcfbe] bg-white p-5 shadow-[0_18px_40px_-36px_rgba(50,35,20,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-30px_rgba(50,35,20,0.45)]"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar name={similarAuthor} size="sm" />
                      <p className="text-xs font-medium text-[#8b7762]">{similarAuthor}</p>
                    </div>
                    <h3 className="mt-3 font-display text-lg leading-tight text-[#21180f] group-hover:text-[#1f4b3b]">
                      {similar.name}
                    </h3>
                    {similar.description ? (
                      <p className="mt-2 line-clamp-2 text-[13.5px] text-[#6b5a49]">
                        {similar.description}
                      </p>
                    ) : null}
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
                      {t("perfumeCount", { count: similar.items.length })}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#8b7762]">{t("similarEmpty")}</p>
          )}
        </section>

        {/* Final CTA */}
        <section className="rounded-[2rem] border border-[#ddcfbe] bg-[linear-gradient(135deg,#fffdf9,#efe6d8)] p-8 text-center shadow-[0_22px_54px_-38px_rgba(50,35,20,0.3)] sm:p-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7762]">
            {t("ctaEyebrow")}
          </p>
          <h2 className="mt-3 font-display text-3xl text-[#21180f] sm:text-4xl">{t("ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-[1.7] text-[#6b5a49]">
            {t("ctaSubtitle")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={{ pathname: "/perfumes" }}
              className="inline-flex items-center justify-center rounded-full bg-[#1f1914] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#3a2e24]"
            >
              {t("ctaCatalog")}
            </Link>
            <Link
              href={{ pathname: "/finder" }}
              className="inline-flex items-center justify-center rounded-full border border-[#ddcfbe] bg-white px-6 py-2.5 text-sm font-medium text-[#1f1914] transition hover:bg-[#faf4eb]"
            >
              {t("ctaFinder")}
            </Link>
          </div>
        </section>
      </Container>
    </ScopedIntlProvider>
  );
}
