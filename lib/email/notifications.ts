import type { AppLocale } from "@/lib/i18n";
import { getLocalizedPathname } from "@/lib/i18n";
import { toAbsoluteUrl } from "@/lib/metadata";
import { createNewsletterToken } from "@/lib/newsletter";
import { sendEmail } from "@/lib/email/resend";
import type { FinderPreferences } from "@/lib/finder";

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

type FinderReportPerfume = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  fragranceFamily: string;
  ratingInternal?: number | null;
  bestPriceAmount?: number | null;
  bestTotalPriceAmount?: number | null;
  bestCurrency?: string | null;
  brand: {
    name: string;
  };
  notes?: Array<{
    intensity?: number | null;
    note?: {
      name?: string | null;
      slug?: string | null;
    } | null;
  }>;
};

type FinderReportEmailInput = {
  to: string;
  locale: AppLocale;
  preferences: FinderPreferences;
  perfumes: FinderReportPerfume[];
  totalMatches: number;
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

function renderGreenButton(label: string, href: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;border-radius:999px;background:#1E4B3B;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;line-height:22px;padding:14px 22px;text-decoration:none;">${escapeHtml(label)}</a>`;
}

function withNewsletterUtm(url: string, content: string) {
  const parsed = new URL(url);
  parsed.searchParams.set("utm_source", "newsletter");
  parsed.searchParams.set("utm_medium", "email");
  parsed.searchParams.set("utm_campaign", "weekly_recommendations");
  parsed.searchParams.set("utm_content", content);
  return parsed.toString();
}

function withFinderReportUtm(url: string, content: string) {
  const parsed = new URL(url);
  parsed.searchParams.set("utm_source", "finder_report");
  parsed.searchParams.set("utm_medium", "email");
  parsed.searchParams.set("utm_campaign", "finder_report");
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

function capitalizeLabel(value: string) {
  const trimmed = value.trim();
  return trimmed ? `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}` : trimmed;
}

type FinderPreferenceKind = "mood" | "season" | "occasion" | "note" | "gender" | "budget";

function getLocalizedPreferenceLabel(kind: FinderPreferenceKind, value: string, locale: AppLocale) {
  const labels: Record<FinderPreferenceKind, Record<string, { it: string; en: string }>> = {
    mood: {
      elegant: { it: "Elegante", en: "Elegant" },
      fresh: { it: "Fresco", en: "Fresh" },
      romantic: { it: "Romantico", en: "Romantic" },
      bold: { it: "Deciso", en: "Bold" },
      cozy: { it: "Avvolgente", en: "Cozy" },
    },
    season: {
      spring: { it: "Primavera", en: "Spring" },
      summer: { it: "Estate", en: "Summer" },
      fall: { it: "Autunno", en: "Fall" },
      winter: { it: "Inverno", en: "Winter" },
    },
    occasion: {
      "daily-wear": { it: "Uso quotidiano", en: "Daily wear" },
      office: { it: "Ufficio", en: "Office" },
      "date-night": { it: "Serata romantica", en: "Date night" },
    },
    note: {
      bergamot: { it: "Bergamotto", en: "Bergamot" },
      vanilla: { it: "Vaniglia", en: "Vanilla" },
      oud: { it: "Oud", en: "Oud" },
      musk: { it: "Muschio", en: "Musk" },
      amber: { it: "Ambra", en: "Amber" },
      rose: { it: "Rosa", en: "Rose" },
      sandalwood: { it: "Sandalo", en: "Sandalwood" },
      citrus: { it: "Agrumi", en: "Citrus" },
    },
    gender: {
      any: { it: "Libero", en: "Open" },
      male: { it: "Uomo", en: "Male" },
      female: { it: "Donna", en: "Female" },
      unisex: { it: "Unisex", en: "Unisex" },
    },
    budget: {
      any: { it: "Qualsiasi budget", en: "Any budget" },
      budget: { it: "Budget", en: "Budget" },
      mid: { it: "Medio", en: "Mid" },
      premium: { it: "Premium", en: "Premium" },
      luxury: { it: "Lusso", en: "Luxury" },
    },
  };

  return labels[kind][value]?.[locale] ?? capitalizeLabel(value.replace(/-/g, " "));
}

function getFinderPreferenceChips(preferences: FinderPreferences, locale: AppLocale) {
  const chips: string[] = [];

  if (preferences.mood) chips.push(getLocalizedPreferenceLabel("mood", preferences.mood, locale));
  if (preferences.season) chips.push(getLocalizedPreferenceLabel("season", preferences.season, locale));
  if (preferences.occasion) chips.push(getLocalizedPreferenceLabel("occasion", preferences.occasion, locale));
  if (preferences.preferredNote) chips.push(getLocalizedPreferenceLabel("note", preferences.preferredNote, locale));
  if (preferences.budget !== "any") chips.push(getLocalizedPreferenceLabel("budget", preferences.budget, locale));
  if (preferences.gender !== "any") chips.push(getLocalizedPreferenceLabel("gender", preferences.gender, locale));

  return chips;
}

function formatFinderPrice(perfume: FinderReportPerfume, locale: AppLocale) {
  const amount = perfume.bestTotalPriceAmount ?? perfume.bestPriceAmount;
  const currency = perfume.bestCurrency ?? "EUR";

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return null;
  }

  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

function getFinderPerfumeNotes(perfume: FinderReportPerfume, locale: AppLocale) {
  return (perfume.notes ?? [])
    .slice()
    .sort((left, right) => (right.intensity ?? 0) - (left.intensity ?? 0))
    .map((item) => item.note)
    .filter((note): note is { name?: string | null; slug?: string | null } => Boolean(note))
    .map((note) => getLocalizedNote({ name: note.name ?? note.slug ?? "", slug: note.slug ?? "" }, locale))
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 3);
}

function renderFinderPerfumeCards(perfumes: FinderReportPerfume[], locale: AppLocale) {
  return perfumes
    .map((perfume, index) => {
      const href = withFinderReportUtm(
        toAbsoluteUrl(getLocalizedPathname(locale, "/perfumes/[slug]", { slug: perfume.slug })),
        `match_${index + 1}`,
      );
      const imageUrl = perfume.imageUrl?.trim() || toAbsoluteUrl("/images/perfume-placeholder.svg");
      const family = getLocalizedFamily(perfume.fragranceFamily, locale);
      const notes = getFinderPerfumeNotes(perfume, locale);
      const noteLine = notes.length > 0 ? ` · ${joinLocalizedList(notes, locale)}` : "";
      const rating =
        typeof perfume.ratingInternal === "number" && Number.isFinite(perfume.ratingInternal)
          ? perfume.ratingInternal.toFixed(1)
          : null;
      const price = formatFinderPrice(perfume, locale);
      const meta = [family, rating ? `Odora ${rating}` : null, price ? `${locale === "it" ? "da" : "from"} ${price}` : null]
        .filter(Boolean)
        .join(" · ");

      return `<tr>
        <td style="padding:0 0 18px;width:90px;vertical-align:top;">
          <a href="${escapeHtml(href)}" style="text-decoration:none;">
            <img src="${escapeHtml(imageUrl)}" width="78" height="98" alt="${escapeHtml(`${perfume.brand.name} ${perfume.name}`)}" style="display:block;width:78px;height:98px;object-fit:cover;border:1px solid #e3d6c8;border-radius:14px;background:#fbf7f0;" />
          </a>
        </td>
        <td style="padding:0 0 18px 14px;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#907b66;">${escapeHtml(perfume.brand.name)}</p>
          <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:23px;line-height:28px;color:#21180f;">
            <a href="${escapeHtml(href)}" style="color:#21180f;text-decoration:none;">${escapeHtml(perfume.name)}</a>
          </p>
          <p style="margin:0 0 8px;font-size:14px;line-height:21px;color:#6b5a49;">${escapeHtml(`${family}${noteLine}`)}</p>
          <p style="margin:0;font-size:12px;line-height:18px;color:#806b56;">${escapeHtml(meta)}</p>
        </td>
      </tr>`;
    })
    .join("");
}

function getFinderReportSubject(locale: AppLocale, totalMatches: number) {
  return locale === "it"
    ? `Il tuo report Odora: ${totalMatches} fragranze compatibili`
    : `Your Odora report: ${totalMatches} matching fragrances`;
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

export function sendFinderReportEmail({
  to,
  locale,
  preferences,
  perfumes,
  totalMatches,
}: FinderReportEmailInput) {
  const subject = getFinderReportSubject(locale, totalMatches);
  const signupUrl = withFinderReportUtm(toAbsoluteUrl(getLocalizedPathname(locale, "/signup")), "create_account");
  const finderUrl = withFinderReportUtm(toAbsoluteUrl(getLocalizedPathname(locale, "/finder")), "open_finder");
  const unsubscribeUrl = toAbsoluteUrl(
    `/api/newsletter/unsubscribe?email=${encodeURIComponent(to)}&token=${createNewsletterToken(to)}`,
  );
  const chips = getFinderPreferenceChips(preferences, locale);
  const topPerfumes = perfumes.slice(0, 5);
  const isItalian = locale === "it";
  const heading = isItalian ? "La tua selezione personale Odora" : "Your personal Odora selection";
  const intro = isItalian
    ? `Abbiamo incrociato le tue scelte sensoriali con il catalogo Odora e selezionato i match piu coerenti. Qui sotto trovi i primi risultati; creando un account puoi salvarli e continuare a costruire il tuo profilo olfattivo.`
    : `We matched your sensory choices against the Odora catalog and selected the most coherent fragrances. Below are the first results; create an account to save them and keep building your olfactory profile.`;
  const reportLine = isItalian
    ? `Abbiamo trovato ${totalMatches} fragranze compatibili.`
    : `We found ${totalMatches} matching fragrances.`;
  const preferenceBlock =
    chips.length > 0
      ? `<div style="margin:22px 0;padding:16px;border:1px solid #eadfd3;border-radius:16px;background:#fbf8f2;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#907b66;">${escapeHtml(isItalian ? "Profilo letto dal Finder" : "Profile read by Finder")}</p>
          <p style="margin:0;font-size:14px;line-height:24px;color:#5f4d3d;">${chips
            .map((chip) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:7px 10px;border:1px solid #e0d3c1;border-radius:999px;background:#ffffff;color:#3f3126;">${escapeHtml(chip)}</span>`)
            .join("")}</p>
        </div>`
      : "";
  const perfumeBlock =
    topPerfumes.length > 0
      ? `<section style="margin-top:24px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#907b66;">${escapeHtml(isItalian ? "I primi match" : "Top matches")}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${renderFinderPerfumeCards(topPerfumes, locale)}</table>
        </section>`
      : "";
  const ctaText = isItalian
    ? "Crea un account Odora per salvare questa selezione, ritrovare i profumi nel tuo profilo e usarli come base per nuove ricerche."
    : "Create an Odora account to save this selection, find the perfumes in your profile, and use them as the base for future searches.";

  const html = renderLayout(
    subject,
    heading,
    `<p style="margin:0 0 14px;font-size:16px;line-height:25px;color:#5f4d3d;">${escapeHtml(intro)}</p>
     <p style="margin:0 0 20px;font-size:16px;font-weight:700;line-height:24px;color:#21180f;">${escapeHtml(reportLine)}</p>
     ${preferenceBlock}
     ${perfumeBlock}
     <section style="margin-top:26px;padding:22px;border-radius:18px;background:#1f1914;color:#fff8ed;">
       <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#d9b77f;">${escapeHtml(isItalian ? "Continua su Odora" : "Continue on Odora")}</p>
       <p style="margin:0 0 18px;font-size:15px;line-height:23px;color:#ead8bd;">${escapeHtml(ctaText)}</p>
       ${renderGreenButton(isItalian ? "Crea account e salva i profumi" : "Create account and save perfumes", signupUrl)}
       <p style="margin:14px 0 0;font-size:13px;line-height:20px;color:#cbbba4;">
         <a href="${escapeHtml(finderUrl)}" style="color:#ead8bd;">${escapeHtml(isItalian ? "Riapri lo Smart Finder" : "Reopen Smart Finder")}</a>
       </p>
     </section>`,
    `${escapeHtml(isItalian ? "Ricevi questa email perche hai richiesto il report Finder e dato consenso alle comunicazioni Odora." : "You receive this email because you requested the Finder report and opted in to Odora emails.")}
     <br /><a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b5a49;">${escapeHtml(isItalian ? "Disiscriviti" : "Unsubscribe")}</a>`,
  );

  const perfumeText = topPerfumes
    .map((perfume, index) => {
      const href = withFinderReportUtm(
        toAbsoluteUrl(getLocalizedPathname(locale, "/perfumes/[slug]", { slug: perfume.slug })),
        `match_${index + 1}`,
      );
      return `${index + 1}. ${perfume.brand.name} ${perfume.name}\n${href}`;
    })
    .join("\n\n");

  return sendEmail({
    to,
    subject,
    html,
    text: `${heading}\n\n${intro}\n\n${reportLine}\n\n${chips.join(" · ")}\n\n${perfumeText}\n\n${ctaText}\n${signupUrl}\n\n${unsubscribeUrl}`,
  });
}

type BrandNewPerfumeEmailInput = {
  to: string;
  locale: AppLocale;
  brandName: string;
  brandSlug: string;
  perfumes: Array<{ name: string; slug: string; imageUrl: string | null }>;
};

export function sendBrandNewPerfumeEmail({
  to,
  locale,
  brandName,
  brandSlug,
  perfumes,
}: BrandNewPerfumeEmailInput) {
  const isItalian = locale === "it";
  const subject = isItalian
    ? perfumes.length === 1
      ? `${brandName}: nuova fragranza disponibile`
      : `${brandName}: ${perfumes.length} nuove fragranze`
    : perfumes.length === 1
      ? `${brandName}: a new fragrance has landed`
      : `${brandName}: ${perfumes.length} new fragrances`;

  const heading = isItalian
    ? `Novità da ${brandName}`
    : `New from ${brandName}`;
  const intro = isItalian
    ? `Un brand che segui ha rilasciato nuovi profumi. Ecco cosa è arrivato nel catalogo Odora:`
    : `A brand you follow has just released new perfumes. Here is what landed in the Odora catalog:`;

  const list = perfumes
    .map((perfume) => {
      const href = toAbsoluteUrl(
        getLocalizedPathname(locale, "/perfumes/[slug]", { slug: perfume.slug }),
      );
      const imageUrl = perfume.imageUrl?.trim() || toAbsoluteUrl("/images/perfume-placeholder.svg");
      return `<tr>
        <td style="padding:0 0 16px;width:74px;vertical-align:top;">
          <a href="${escapeHtml(href)}" style="text-decoration:none;">
            <img src="${escapeHtml(imageUrl)}" width="64" height="80" alt="${escapeHtml(perfume.name)}" style="display:block;width:64px;height:80px;object-fit:cover;border:1px solid #e3d6c8;border-radius:12px;background:#fbf7f0;" />
          </a>
        </td>
        <td style="padding:0 0 16px 12px;vertical-align:top;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:700;line-height:22px;color:#21180f;">
            <a href="${escapeHtml(href)}" style="color:#21180f;text-decoration:none;">${escapeHtml(`${brandName} ${perfume.name}`)}</a>
          </p>
          <p style="margin:0;">${renderButton(isItalian ? "Apri scheda" : "Open page", href)}</p>
        </td>
      </tr>`;
    })
    .join("");

  const brandHref = toAbsoluteUrl(
    getLocalizedPathname(locale, "/brands/[slug]", { slug: brandSlug }),
  );
  const brandCta = isItalian
    ? `Tutti i profumi di ${brandName}`
    : `All ${brandName} perfumes`;

  const html = renderLayout(
    subject,
    heading,
    `<p style="margin:0 0 18px;font-size:16px;line-height:24px;color:#5f4d3d;">${escapeHtml(intro)}</p>
     <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${list}</table>
     <p style="margin:18px 0 0;">${renderButton(brandCta, brandHref)}</p>`,
  );

  const textLines = perfumes
    .map((perfume) => {
      const href = toAbsoluteUrl(
        getLocalizedPathname(locale, "/perfumes/[slug]", { slug: perfume.slug }),
      );
      return `- ${brandName} ${perfume.name}: ${href}`;
    })
    .join("\n");

  return sendEmail({
    to,
    subject,
    html,
    text: `${heading}\n\n${intro}\n\n${textLines}\n\n${brandHref}`,
  });
}
