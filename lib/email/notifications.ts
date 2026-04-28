import type { AppLocale } from "@/lib/i18n";
import { getLocalizedPathname } from "@/lib/i18n";
import { toAbsoluteUrl } from "@/lib/metadata";
import { createNewsletterToken } from "@/lib/newsletter";
import { sendEmail } from "@/lib/email/resend";

type ListSavedEmailInput = {
  to: string;
  creatorName: string | null;
  saverName: string | null;
  listName: string;
  listUrl: string;
  locale: AppLocale;
};

type WeeklyPerfume = {
  name: string;
  slug: string;
  brand: {
    name: string;
  };
  descriptionShort: string;
};

type WeeklyBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
};

type WeeklyRecommendationsEmailInput = {
  to: string;
  locale: AppLocale;
  perfumes: WeeklyPerfume[];
  blogPost: WeeklyBlogPost | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderButton(label: string, href: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;border-radius:999px;background:#2c2219;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;line-height:20px;padding:12px 18px;text-decoration:none;">${escapeHtml(label)}</a>`;
}

function renderLayout(preview: string, heading: string, body: string, footer?: string) {
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${escapeHtml(preview)}</title>
  </head>
  <body style="margin:0;background:#f7f1e8;padding:32px 16px;">
    <span style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${escapeHtml(preview)}</span>
    <main style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e3d6c8;border-radius:16px;padding:32px;font-family:Arial,sans-serif;color:#2c2219;">
      <p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:0;color:#7a5d43;">Odora</p>
      <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;line-height:34px;color:#21180f;">${escapeHtml(heading)}</h1>
      ${body}
      ${footer ? `<footer style="border-top:1px solid #eadfD3;margin-top:28px;padding-top:18px;font-size:12px;line-height:18px;color:#8a7868;">${footer}</footer>` : ""}
    </main>
  </body>
</html>`;
}

export function sendListSavedEmail({
  to,
  creatorName,
  saverName,
  listName,
  listUrl,
  locale,
}: ListSavedEmailInput) {
  const subject =
    locale === "it"
      ? `La tua lista "${listName}" e stata salvata`
      : `Your "${listName}" list was saved`;
  const displaySaver = saverName?.trim() || (locale === "it" ? "Un utente Odora" : "An Odora user");
  const greeting = creatorName?.trim()
    ? locale === "it"
      ? `Ciao ${creatorName.trim()},`
      : `Hi ${creatorName.trim()},`
    : locale === "it"
      ? "Ciao,"
      : "Hi,";
  const bodyText =
    locale === "it"
      ? `${displaySaver} ha salvato la tua lista "${listName}" tra i preferiti.`
      : `${displaySaver} saved your "${listName}" list.`;
  const buttonLabel = locale === "it" ? "Apri lista" : "Open list";

  const html = renderLayout(
    subject,
    subject,
    `<p style="margin:0 0 12px;font-size:16px;line-height:24px;color:#5f4d3d;">${escapeHtml(greeting)}</p>
     <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#5f4d3d;">${escapeHtml(bodyText)}</p>
     <p style="margin:0;">${renderButton(buttonLabel, listUrl)}</p>`,
  );

  return sendEmail({
    to,
    subject,
    html,
    text: `${greeting}\n\n${bodyText}\n\n${listUrl}`,
  });
}

function renderPerfumeList(perfumes: WeeklyPerfume[], locale: AppLocale) {
  return perfumes
    .map((perfume) => {
      const href = toAbsoluteUrl(
        getLocalizedPathname(locale, "/perfumes/[slug]", {
          slug: perfume.slug,
        }),
      );

      return `<li style="margin:0 0 18px;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:700;line-height:22px;color:#21180f;">
          <a href="${escapeHtml(href)}" style="color:#21180f;text-decoration:none;">${escapeHtml(perfume.brand.name)} ${escapeHtml(perfume.name)}</a>
        </p>
        <p style="margin:0;font-size:14px;line-height:21px;color:#6b5a49;">${escapeHtml(perfume.descriptionShort)}</p>
      </li>`;
    })
    .join("");
}

export function sendWeeklyRecommendationsEmail({
  to,
  locale,
  perfumes,
  blogPost,
}: WeeklyRecommendationsEmailInput) {
  const subject =
    locale === "it"
      ? "5 profumi consigliati questa settimana"
      : "5 fragrance picks for this week";
  const intro =
    locale === "it"
      ? "Una selezione rapida da esplorare questa settimana, piu l'ultima guida pubblicata sul blog."
      : "A quick selection to explore this week, plus the latest guide from the blog.";
  const unsubscribeUrl = toAbsoluteUrl(
    `/api/newsletter/unsubscribe?email=${encodeURIComponent(to)}&token=${createNewsletterToken(to)}`,
  );
  const blogUrl = blogPost
    ? toAbsoluteUrl(getLocalizedPathname(locale, "/blog/[slug]", { slug: blogPost.slug }))
    : null;
  const blogBlock =
    blogPost && blogUrl
      ? `<section style="border-top:1px solid #eadfd3;margin-top:26px;padding-top:22px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a7868;">${escapeHtml(locale === "it" ? "Guida dal blog" : "Guide from the blog")}</p>
          <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;line-height:28px;color:#21180f;">${escapeHtml(blogPost.title)}</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:21px;color:#6b5a49;">${escapeHtml(blogPost.excerpt)}</p>
          ${renderButton(locale === "it" ? "Leggi la guida" : "Read the guide", blogUrl)}
        </section>`
      : "";

  const html = renderLayout(
    subject,
    subject,
    `<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#5f4d3d;">${escapeHtml(intro)}</p>
     <ol style="margin:0;padding-left:22px;">${renderPerfumeList(perfumes, locale)}</ol>
     ${blogBlock}`,
    `${escapeHtml(locale === "it" ? "Ricevi questa email perche hai dato consenso alle comunicazioni marketing di Odora." : "You receive this email because you opted in to Odora marketing emails.")}
     <br /><a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b5a49;">${escapeHtml(locale === "it" ? "Disiscriviti" : "Unsubscribe")}</a>`,
  );

  const perfumeText = perfumes
    .map((perfume, index) => `${index + 1}. ${perfume.brand.name} ${perfume.name}`)
    .join("\n");
  const blogText = blogPost && blogUrl ? `\n\n${blogPost.title}\n${blogUrl}` : "";

  return sendEmail({
    to,
    subject,
    html,
    text: `${intro}\n\n${perfumeText}${blogText}\n\n${unsubscribeUrl}`,
  });
}
