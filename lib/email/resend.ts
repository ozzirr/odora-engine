import { Resend } from "resend";

let resendClient: Resend | null = null;

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  ok: boolean;
  id?: string;
  error?: unknown;
};

export function getAuthEmailProvider() {
  return process.env.ODORA_AUTH_EMAIL_PROVIDER?.trim().toLowerCase() === "resend" ? "resend" : "supabase";
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.ODORA_EMAIL_FROM?.trim());
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing required environment variable: RESEND_API_KEY");
  }

  resendClient ??= new Resend(apiKey);
  return resendClient;
}

function getSender() {
  const sender = process.env.ODORA_EMAIL_FROM?.trim();
  if (!sender) {
    throw new Error("Missing required environment variable: ODORA_EMAIL_FROM");
  }

  return sender;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  try {
    const replyTo = process.env.ODORA_EMAIL_REPLY_TO?.trim();
    const { data, error } = await getResendClient().emails.send({
      from: getSender(),
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      return { ok: false, error };
    }

    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error };
  }
}
