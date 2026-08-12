import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio",
  // The studio is private — keep it out of search results entirely.
  robots: { index: false, follow: false, nocache: true },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="studio">{children}</div>;
}
