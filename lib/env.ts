/**
 * Server-side feature detection. These read non-public env vars and must only
 * be called from server components and route handlers. They let the UI degrade
 * gracefully — a contact form falls back to mailto, the newsletter hides —
 * when the corresponding services are not configured.
 */
export const isDbConfigured = (): boolean => Boolean(process.env.DATABASE_URL);

export const isEmailConfigured = (): boolean =>
  Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL);

/** Contact form works if we can either store the enquiry or email it. */
export const contactFormEnabled = (): boolean =>
  isDbConfigured() || isEmailConfigured();

/** Double opt-in needs both a store and the ability to send a confirmation. */
export const newsletterEnabled = (): boolean =>
  isDbConfigured() && isEmailConfigured();
