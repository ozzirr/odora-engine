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
  imageUrl: string | null;
  brand: {
    name: string;
  };
  descriptionShort: string;
  fragranceFamily: string;
  notes?: Array<{
    intensity: number | null;
    note: {
      name: string;
      slug: string;
    };
  }>;
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

function withNewsletterUtm(url: string, content: string) {
  const parsed = new URL(url);
  parsed.searchParams.set("utm_source", "newsletter");
  parsed.searchParams.set("utm_medium", "email");
  parsed.searchParams.set("utm_campaign", "weekly_recommendations");
  parsed.searchParams.set("utm_content", content);
  return parsed.toString();
}

function renderLayout(preview: string, heading: string, body: string, footer?: string) {
  const logoUrl = toAbsoluteUrl("/images/odora_logo_m.png");

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
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 24px;background:#fbf8f2;border:1px solid #eadfce;border-radius:14px;" bgcolor="#fbf8f2">
        <tr>
          <td style="padding:10px 14px;background:#fbf8f2;border-radius:14px;" bgcolor="#fbf8f2">
            <img src="${escapeHtml(logoUrl)}" width="154" height="39" alt="Odora" style="display:block;width:154px;height:auto;border:0;outline:none;text-decoration:none;color:#1f4d3d;font-size:24px;font-weight:700;" />
          </td>
        </tr>
      </table>
      <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;line-height:34px;color:#21180f;">${escapeHtml(heading)}</h1>
      ${body}
      ${footer ? `<footer style="border-top:1px solid #eadfd3;margin-top:28px;padding-top:18px;font-size:12px;line-height:18px;color:#8a7868;">${footer}</footer>` : ""}
    </main>
  </body>
</html>`;
}

function normalizeTaxonomyKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, "")
    .replace(/[\/\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getLocalizedFamily(value: string, locale: AppLocale) {
  const key = normalizeTaxonomyKey(value);
  const familyKey = key.includes("amber")
    ? "amber"
    : key.includes("floral")
      ? "floral"
      : key.includes("woody") || key.includes("wood")
        ? "woody"
        : key.includes("fresh")
          ? "fresh"
          : key.includes("oriental")
            ? "oriental"
            : key.includes("gourmand")
              ? "gourmand"
              : key.includes("citrus")
                ? "citrus"
                : key.includes("aromatic")
                  ? "aromatic"
                  : key;

  const itFamilies: Record<string, string> = {
    amber: "ambrato",
    floral: "floreale",
    woody: "legnoso",
    fresh: "fresco",
    oriental: "orientale",
    gourmand: "gourmand",
    citrus: "agrumato",
    aromatic: "aromatico",
  };
  const enFamilies: Record<string, string> = {
    amber: "amber",
    floral: "floral",
    woody: "woody",
    fresh: "fresh",
    oriental: "oriental",
    gourmand: "gourmand",
    citrus: "citrus",
    aromatic: "aromatic",
  };

  return (locale === "it" ? itFamilies : enFamilies)[familyKey] ?? value;
}

function getLocalizedNote(note: { name: string; slug: string }, locale: AppLocale) {
  const itNotes: Record<string, string> = {
    bergamot: "bergamotto",
    vanilla: "vaniglia",
    oud: "oud",
    musk: "muschio",
    amber: "ambra",
    rose: "rosa",
    sandalwood: "sandalo",
    citrus: "agrumi",
    jasmine: "gelsomino",
    coffee: "caffe",
    patchouli: "patchouli",
  };

  return locale === "it" ? itNotes[note.slug] ?? note.name : note.name;
}

function joinLocalizedList(values: string[], locale: AppLocale) {
  if (values.length <= 1) {
    return values.join("");
  }

  const conjunction = locale === "it" ? " e " : " and ";
  return `${values.slice(0, -1).join(", ")}${conjunction}${values.at(-1)}`;
}

function getWeeklyPerfumeDescription(perfume: WeeklyPerfume, locale: AppLocale) {
  const description = perfume.descriptionShort?.trim();
  if (description) {
    return locale === "it" ? translatePerfumeDescription(description, perfume) : description;
  }

  const family = getLocalizedFamily(perfume.fragranceFamily, locale).toLowerCase();
  const notes = (perfume.notes ?? [])
    .slice()
    .sort((left, right) => (right.intensity ?? 0) - (left.intensity ?? 0))
    .map((item) => getLocalizedNote(item.note, locale))
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 3);

  if (notes.length > 0) {
    const noteList = joinLocalizedList(notes, locale);
    return locale === "it"
      ? `Un profumo ${family} da esplorare se ami note come ${noteList}.`
      : `A ${family} fragrance to explore if you enjoy notes like ${noteList}.`;
  }

  return locale === "it"
    ? `Un profumo ${family} selezionato dal catalogo Odora per questa settimana.`
    : `A ${family} fragrance selected from the Odora catalog for this week.`;
}

function translateProfile(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => getLocalizedFamily(part, "it").toLowerCase())
    .join(" ");
}

function translatePerfumeDescription(description: string, perfume: WeeklyPerfume) {
  const profileMatch = description.match(/^(.+) by (.+) is an? (.+) profile(?: with strong identity)?\.$/i);
  if (profileMatch) {
    const [, name, brand, profile] = profileMatch;
    const translatedProfile = translateProfile(profile);
    const identitySuffix = /with strong identity/i.test(description) ? " dalla personalità decisa" : "";
    return `${name} di ${brand} ha un profilo ${translatedProfile}${identitySuffix}.`;
  }

  const topHeartBaseMatch = description.match(
    /^(.+) by (.+) belongs to the (.+) family with top notes of (.+), (?:a heart of|heart notes of) (.+), and (?:a base of|base notes of) (.+)\.$/i,
  );
  if (topHeartBaseMatch) {
    const [, name, brand, family, top, heart, base] = topHeartBaseMatch;
    return `${name} di ${brand} appartiene alla famiglia ${translateProfile(family)}, con note di testa di ${top}, cuore di ${heart} e fondo di ${base}.`;
  }

  if (/\bby\b/i.test(description)) {
    return description
      .replace(/\s+by\s+/i, " di ")
      .replace(/\sis an?\s/i, " ha un ")
      .replace(/\sprofile with strong identity\./i, "profilo dalla personalità decisa.")
      .replace(/\sprofile\./i, "profilo.");
  }

  const family = getLocalizedFamily(perfume.fragranceFamily, "it").toLowerCase();
  return `${perfume.name} di ${perfume.brand.name} ha un profilo ${family}.`;
}

function getWeeklySubject(locale: AppLocale) {
  const date = new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date());

  return locale === "it"
    ? `5 profumi consigliati · ${date}`
    : `5 fragrance picks · ${date}`;
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
    .map((perfume, index) => {
      const href = withNewsletterUtm(
        toAbsoluteUrl(
          getLocalizedPathname(locale, "/perfumes/[slug]", {
            slug: perfume.slug,
          }),
        ),
        `perfume_${index + 1}`,
      );
      const title = `${perfume.brand.name} ${perfume.name}`;
      const description = getWeeklyPerfumeDescription(perfume, locale);
      const imageUrl = perfume.imageUrl?.trim() || toAbsoluteUrl("/images/perfume-placeholder.svg");

      return `<tr>
        <td style="padding:0 0 16px;width:74px;vertical-align:top;">
          <a href="${escapeHtml(href)}" style="text-decoration:none;">
            <img src="${escapeHtml(imageUrl)}" width="64" height="80" alt="${escapeHtml(title)}" style="display:block;width:64px;height:80px;object-fit:cover;border:1px solid #e3d6c8;border-radius:12px;background:#fbf7f0;" />
          </a>
        </td>
        <td style="padding:0 0 16px 12px;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;line-height:22px;color:#21180f;">
            <a href="${escapeHtml(href)}" style="color:#21180f;text-decoration:none;">${escapeHtml(title)}</a>
          </p>
          <p style="margin:0;font-size:14px;line-height:21px;color:#6b5a49;">${escapeHtml(description)}</p>
        </td>
      </tr>`;
    })
    .join("");
}

export function sendWeeklyRecommendationsEmail({
  to,
  locale,
  perfumes,
  blogPost,
}: WeeklyRecommendationsEmailInput) {
  const subject = getWeeklySubject(locale);
  const heading =
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
    ? withNewsletterUtm(
        toAbsoluteUrl(getLocalizedPathname(locale, "/blog/[slug]", { slug: blogPost.slug })),
        "blog_latest",
      )
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
    heading,
    `<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#5f4d3d;">${escapeHtml(intro)}</p>
     <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0;">${renderPerfumeList(perfumes, locale)}</table>
     ${blogBlock}`,
    `${escapeHtml(locale === "it" ? "Ricevi questa email perche hai dato consenso alle comunicazioni marketing di Odora." : "You receive this email because you opted in to Odora marketing emails.")}
     <br /><a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b5a49;">${escapeHtml(locale === "it" ? "Disiscriviti" : "Unsubscribe")}</a>`,
  );

  const perfumeText = perfumes
    .map((perfume, index) => {
      const href = withNewsletterUtm(
        toAbsoluteUrl(getLocalizedPathname(locale, "/perfumes/[slug]", { slug: perfume.slug })),
        `perfume_${index + 1}`,
      );
      return `${index + 1}. ${perfume.brand.name} ${perfume.name}\n${getWeeklyPerfumeDescription(perfume, locale)}\n${href}`;
    })
    .join("\n");
  const blogText = blogPost && blogUrl ? `\n\n${blogPost.title}\n${blogUrl}` : "";

  return sendEmail({
    to,
    subject,
    html,
    text: `${intro}\n\n${perfumeText}${blogText}\n\n${unsubscribeUrl}`,
  });
}
