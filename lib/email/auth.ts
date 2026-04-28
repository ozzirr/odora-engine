import type { AppLocale } from "@/lib/i18n";
import { getBaseSiteUrl } from "@/lib/site-url";
import { sendEmail } from "@/lib/email/resend";

type AuthEmailInput = {
  to: string;
  name?: string;
  locale: AppLocale;
  actionUrl: string;
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

function renderLayout(preview: string, heading: string, body: string, buttonLabel: string, actionUrl: string) {
  const siteUrl = getBaseSiteUrl();

  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${escapeHtml(preview)}</title>
  </head>
  <body style="margin:0;background:#f7f1e8;padding:32px 16px;">
    <span style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${escapeHtml(preview)}</span>
    <main style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3d6c8;border-radius:16px;padding:32px;font-family:Arial,sans-serif;color:#2c2219;">
      <p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:0;color:#7a5d43;">Odora</p>
      <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;line-height:34px;color:#21180f;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#5f4d3d;">${escapeHtml(body)}</p>
      <p style="margin:0 0 24px;">${renderButton(buttonLabel, actionUrl)}</p>
      <p style="margin:0;font-size:12px;line-height:18px;color:#8a7868;">${escapeHtml(siteUrl)}</p>
    </main>
  </body>
</html>`;
}

export function sendSignupConfirmationEmail({ to, name, locale, actionUrl }: AuthEmailInput) {
  const displayName = name?.trim();
  const greeting =
    locale === "it"
      ? displayName
        ? `Ciao ${displayName}, conferma la registrazione per completare l'accesso a Odora.`
        : "Conferma la registrazione per completare l'accesso a Odora."
      : displayName
        ? `Hi ${displayName}, confirm your registration to finish signing in to Odora.`
        : "Confirm your registration to finish signing in to Odora.";
  const subject = locale === "it" ? "Conferma la tua email su Odora" : "Confirm your Odora email";
  const buttonLabel = locale === "it" ? "Conferma email" : "Confirm email";
  const preview = locale === "it" ? "Completa la registrazione a Odora" : "Complete your Odora registration";

  return sendEmail({
    to,
    subject,
    html: renderLayout(preview, subject, greeting, buttonLabel, actionUrl),
    text: `${greeting}\n\n${actionUrl}`,
  });
}

export function sendPasswordResetEmail({ to, locale, actionUrl }: AuthEmailInput) {
  const subject = locale === "it" ? "Reimposta la password di Odora" : "Reset your Odora password";
  const body =
    locale === "it"
      ? "Abbiamo ricevuto una richiesta di reimpostazione password. Usa questo link per scegliere una nuova password."
      : "We received a password reset request. Use this link to choose a new password.";
  const buttonLabel = locale === "it" ? "Reimposta password" : "Reset password";
  const preview = locale === "it" ? "Link per reimpostare la password" : "Password reset link";

  return sendEmail({
    to,
    subject,
    html: renderLayout(preview, subject, body, buttonLabel, actionUrl),
    text: `${body}\n\n${actionUrl}`,
  });
}
