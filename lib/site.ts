/**
 * Single source of truth for site-wide identity, URLs and metadata defaults.
 * NEXT_PUBLIC_SITE_URL is optional — the site builds and renders without it.
 */
export const siteConfig = {
  name: "Robert Kamau Njonjo",
  shortName: "R. Njonjo",
  /**
   * Other ways people write the name when searching. Fed to search engines as
   * schema.org alternateName so "Robert Njonjo" resolves to the same person as
   * "Robert Kamau Njonjo".
   */
  alternateNames: ["Robert Njonjo", "Robert K. Njonjo"],
  role: ".NET Software Engineer",
  location: "Nairobi, Kenya",
  description:
    "Robert Kamau Njonjo (Robert Njonjo) is a .NET software engineer in Nairobi, Kenya, building custom C# systems and integrating them with Dynamics 365 Business Central.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
  email: "rknjonjo@gmail.com",
  // No phone number, deliberately: it is scraped from public pages and, if it
  // is also an M-Pesa line, invites SIM-swap and impersonation scams. People
  // reach Robert by email or the contact form, and get a number once they reply.
  links: {
    linkedin: "https://www.linkedin.com/in/robert-njonjo/",
    linkedinHandle: "in/robert-njonjo",
    github: "https://github.com/M1urray",
    githubHandle: "github.com/M1urray",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Stable schema.org identifiers. Pages that mention the author point at the
 * same @id, which is how a search engine learns the articles, the CV and the
 * homepage are all about one person.
 */
export const schemaIds = {
  person: `${siteConfig.url}/#person`,
  website: `${siteConfig.url}/#website`,
} as const;

/** Primary navigation — shared by the header and mobile menu. */
export const navLinks = [
  { href: "/work", label: "/work" },
  { href: "/writing", label: "/writing" },
  { href: "/cv", label: "/cv" },
  { href: "/#contact", label: "/contact" },
] as const;
