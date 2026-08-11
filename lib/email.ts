import type { ReactElement } from "react";
import { Resend } from "resend";

let cached: Resend | null = null;

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

export type SendResult =
  { sent: true; id: string | undefined } | { sent: false; reason: string };

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
  headers?: Record<string, string>;
}): Promise<SendResult> {
  const resend = client();
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!resend || !from) {
    return { sent: false, reason: "email-not-configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      react: opts.react,
      replyTo: opts.replyTo,
      headers: opts.headers,
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true, id: data?.id };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "unknown-send-error",
    };
  }
}
