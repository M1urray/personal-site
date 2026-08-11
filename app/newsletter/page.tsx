import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Newsletter",
  robots: { index: false, follow: true },
};

const MESSAGES: Record<string, { heading: string; body: string }> = {
  confirmed: {
    heading: "You’re subscribed",
    body: "Thanks for confirming. You’ll get the notes when there’s something worth reading — never more often than that.",
  },
  unsubscribed: {
    heading: "You’re unsubscribed",
    body: "You won’t receive any more emails. No hard feelings — the writing stays free to read here any time.",
  },
  already: {
    heading: "Already subscribed",
    body: "You’re on the list already. Nothing more to do.",
  },
  invalid: {
    heading: "That link didn’t work",
    body: "The link may have expired or already been used. Try subscribing again, or email rknjonjo@gmail.com if it keeps happening.",
  },
};

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const message = MESSAGES[status ?? ""] ?? MESSAGES.invalid;

  return (
    <div className="page">
      <div className="sec-head">
        <div className="eyebrow">/newsletter</div>
        <h1>{message!.heading}</h1>
        <p className="sec-note">{message!.body}</p>
      </div>
      <div className="cta-row">
        <Link className="btn btn-solid" href="/writing">
          Read the notes
        </Link>
        <Link className="btn" href="/">
          Back home
        </Link>
      </div>
    </div>
  );
}
