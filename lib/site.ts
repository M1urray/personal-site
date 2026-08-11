/**
 * Single source of truth for site-wide identity, URLs and metadata defaults.
 * NEXT_PUBLIC_SITE_URL is optional — the site builds and renders without it.
 */
export const siteConfig = {
  name: "Robert Kamau Njonjo",
  shortName: "R. Njonjo",
  role: "Business Central Integration Engineer",
  location: "Nairobi, Kenya",
  description:
    "Software engineer specialising in Microsoft Dynamics 365 Business Central integration. AL extensions, OData and SOAP layers, gateway architectures and ERP-connected portals for government and enterprise.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
  email: "rknjonjo@gmail.com",
  phone: "+254745310513",
  phoneDisplay: "+254 745 310 513",
  links: {
    linkedin: "https://www.linkedin.com/in/robert-njonjo/",
    linkedinHandle: "in/robert-njonjo",
    github: "https://github.com/M1urray",
    githubHandle: "github.com/M1urray",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Primary navigation — shared by the header and mobile menu. */
export const navLinks = [
  { href: "/work", label: "/work" },
  { href: "/writing", label: "/writing" },
  { href: "/cv", label: "/cv" },
  { href: "/#contact", label: "/contact" },
] as const;
