# robertnjonjo.com

Personal site, CV and technical blog for **Robert Kamau Njonjo** — a software
engineer specialising in Microsoft Dynamics 365 Business Central integration,
based in Nairobi, Kenya.

It's a CV, a case-study portfolio and a technical blog on one domain, built to
turn search traffic and referrals into hiring conversations.

![Social preview card](docs/preview.png)

---

## Stack

- **[Next.js 15](https://nextjs.org/)** (App Router) + **TypeScript** in `strict` mode
- **[Tailwind CSS v4](https://tailwindcss.com/)** — design tokens as CSS custom
  properties, exposed through `@theme`
- **[next/font](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)**
  self-hosting Archivo, IBM Plex Sans and IBM Plex Mono (no render-blocking font links)
- **[Neon](https://neon.tech/)** serverless Postgres via **[Drizzle ORM](https://orm.drizzle.team/)**
- **[Resend](https://resend.com/)** + **React Email** for transactional email
- **[Zod](https://zod.dev/)** for all input validation
- **MDX** for content — `gray-matter` frontmatter, `next-mdx-remote/rsc`,
  syntax highlighting via `rehype-pretty-code` (Shiki)
- Deployed on **[Vercel](https://vercel.com/)**

## Highlights

- **`RequestTrace`** — the signature component: an animated five-node request
  path (portal → gateway → token exchange → Business Central → response). Runs
  only when on screen, and freezes fully lit under `prefers-reduced-motion`.
- **MDX blog** at `/writing`, filterable by category (`business-central`,
  `dotnet`, `integration`), with per-post view counts.
- **Case studies** at `/work`, and a full **`/cv`** with a generated PDF.
- **Contact form** and **double opt-in newsletter** — shared Zod schemas on
  client and server, per-IP rate limiting, honeypot + time-to-submit checks,
  and real inline error messages. Both degrade to a mailto fallback when the
  backend isn't configured.
- **SEO**: per-page metadata, canonical URLs, OpenGraph/Twitter cards, dynamic
  OG images (`/og`), `sitemap.xml`, `robots.txt`, `rss.xml`, and JSON-LD
  (`Person` on the homepage, `BlogPosting`/`Article` on content).

> **The app builds and the homepage renders with no environment variables set.**
> The forms degrade gracefully rather than failing the build.

## Requirements

- Node `>=20.11` (see [`.nvmrc`](.nvmrc) — 22 recommended)
- [pnpm](https://pnpm.io/) 11 (`corepack enable pnpm`)

## Local setup

```bash
# 1. Install dependencies
pnpm install

# 2. (Optional) configure services — see Environment below
cp .env.example .env.local

# 3. Run the dev server
pnpm dev
```

Open <http://localhost:3000>.

## Environment

All variables are optional for local development — copy `.env.example` to
`.env.local` and fill in what you need.

| Variable               | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`         | Neon Postgres connection string (Drizzle). Stores enquiries and view counts. |
| `RESEND_API_KEY`       | Resend API key for sending email.                              |
| `CONTACT_TO_EMAIL`     | Inbox that receives contact-form notifications.                |
| `CONTACT_FROM_EMAIL`   | Verified Resend sender, e.g. `Robert <hello@yourdomain.com>`.  |
| `IP_HASH_SALT`         | Salt used to hash client IPs before storage. Raw IPs are never stored. |
| `NEXT_PUBLIC_SITE_URL` | Public canonical origin (no trailing slash), e.g. `https://robertnjonjo.com`. |

Without `DATABASE_URL` / Resend keys: the contact form shows a mailto fallback
and the newsletter is hidden.

## Database

Schema lives in [`db/schema.ts`](db/schema.ts) (subscribers, enquiries,
post_views). Migrations are in [`drizzle/`](drizzle/).

```bash
pnpm db:generate   # generate a migration from schema changes
pnpm db:push       # push the schema to your Neon database
```

## Content

- **Blog posts** — add an `.mdx` file to [`content/posts/`](content/posts/) with
  frontmatter (`title`, `description`, `date`, `category`, `published`). It
  appears on `/writing` automatically, no other change needed.
- **Case studies** — add an `.mdx` file to [`content/work/`](content/work/) with
  frontmatter (`title`, `description`, `date`, `client`, `sector`, `stack`,
  optional `liveUrl`, `featured`).

Categories are fixed to `business-central`, `dotnet`, `integration`.

## The CV PDF

The downloadable CV at `/Robert_Njonjo_CV.pdf` is generated from the shared
resume data in [`lib/resume.ts`](lib/resume.ts):

```bash
pnpm cv:pdf
```

## Scripts

| Script              | Does                                            |
| ------------------- | ----------------------------------------------- |
| `pnpm dev`          | Start the dev server                            |
| `pnpm build`        | Production build                                |
| `pnpm start`        | Serve the production build                      |
| `pnpm typecheck`    | `tsc --noEmit`                                  |
| `pnpm lint`         | ESLint                                          |
| `pnpm format`       | Prettier (write)                                |
| `pnpm cv:pdf`       | Regenerate the CV PDF                           |
| `pnpm db:generate`  | Generate a Drizzle migration                    |
| `pnpm db:push`      | Push schema to the database                     |

## Deployment (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Add the environment variables above in the Vercel project settings.
3. Deploy — Vercel detects Next.js and builds automatically.

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs typecheck,
lint, format check and build on every push and pull request.

## Reference

[`reference/index.html`](reference/index.html) is the original single-file
design the site is ported from — the source of truth for layout, colour and copy.

## License

Code is [MIT licensed](LICENSE). Written content (blog posts, case studies, CV)
is © Robert Kamau Njonjo.
