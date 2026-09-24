# Content plan — "Notes from a regulated build"

30 articles drawn from a large .NET + React case-management build, written to be
short enough for LinkedIn and substantial enough to be worth a click through to
the site.

The series exists to do one job: put a steady, technical signal in front of
Dynamics/.NET hiring managers, with every post linking back to the site.

---

## Disclosure rule

Everything in `content/series/dotnet-lessons.ts` has been written to this
standard. **Hold it for anything added later.**

Never appears:

- the client, the tribunal, the jurisdiction, the employer, the product name
- requirement or design-document citations (`FR-xxx`, `SDD §x`)
- statutory specifics — deadline lengths, register number formats, party names
- vendor endpoints, header names, connection details
- production incidents attributable to the client
- unresolved design questions (they read as criticism of a live client system)

Also true of every snippet: **no client source is reproduced.** Each one is a
generic illustration written to teach the pattern. Most articles carry no domain
framing at all; a few say "a regulated case-management system" and stop there.

> Worth a sanity check with whoever holds your contract before the first one goes
> out. Publishing generalised engineering lessons is normal and defensible, but
> IP and confidentiality clauses vary, and it is much cheaper to ask once now
> than to unpublish later.

---

## Running order

Sequenced so the early posts stand alone and the later ones can reference them.
Ten waves of three, one wave per three weeks at two posts a week.

| # | Wave | Article | Category |
|---|---|---|---|
| 1 | Architecture | Your State Machine Should Be Data, Not a Workflow Engine | dotnet |
| 2 | Architecture | Let the Compiler Enforce Your Architecture | dotnet |
| 3 | Architecture | Split Your Test Projects So a Wrong Dependency Won't Compile | dotnet |
| 4 | Rules engine | Design Preconditions That Can't Become an N+1 | dotnet |
| 5 | Rules engine | Check Permission Before You Check Preconditions | dotnet |
| 6 | Rules engine | A Refused Operation Is a Return Value, Not an Exception | dotnet |
| 7 | Rules engine | Omit Actions the User Can't Take | dotnet |
| 8 | Rules engine | Validate Your Rule Table at Startup, and Refuse to Boot | dotnet |
| 9 | Temporal | Effective-Dated Rules: Never Default to UtcNow | dotnet |
| 10 | EF Core | Why Your New Child Row Becomes a Phantom UPDATE | dotnet |
| 11 | EF Core | One DbContext, However Many Modules | dotnet |
| 12 | EF Core | PostgreSQL Gives You a Free Concurrency Token: xmin | dotnet |
| 13 | EF Core | The Migration EF Core Can't Write for You | dotnet |
| 14 | Correctness | Money Is an Integer | dotnet |
| 15 | Correctness | Gapless Sequential Numbers Under Concurrency | dotnet |
| 16 | Correctness | Working Days or Calendar Days — Never Assume | dotnet |
| 17 | Correctness | Snapshot the Rule, Not Just the Answer | dotnet |
| 18 | Reporting | Define "Open" Exactly Once | dotnet |
| 19 | Reporting | Put Pure Calculations Where You Can Test Them | dotnet |
| 20 | Delivery | Run Migrations Automatically in Development Only | dotnet |
| 21 | Integration | One Seam, One Implementation, and No Fallback | integration |
| 22 | Integration | Some Settings Belong in the Database, Read Per Call | integration |
| 23 | Integration | Verify the Write When the Store Won't Give You a Checksum | integration |
| 24 | Integration | An Upstream Failure Is Not a 500 | integration |
| 25 | Identity | Password, Then One-Time Code | integration |
| 26 | Identity | Rotate Refresh Tokens by Appending, Not Replacing | integration |
| 27 | Identity | An Identifier Is Not a Credential | integration |
| 28 | Identity | Purpose-Separate Your Encryption Keys | integration |
| 29 | Identity | Re-read Authorisation State on Every Request | integration |
| 30 | Web | Don't Return Your SPA Shell to a fetch() | integration |
| — | Web | Render Untrusted Documents — Don't Execute Them | integration |

(31 rows: the last two are interchangeable as the closer. "Render Untrusted
Documents" is the stronger finish if you want to end on security.)

## Cadence

**One every two days, 06:00 UTC (09:00 EAT).** About two months of runway for
the 31 posts.

Don't batch-publish: the value is a visible, sustained cadence, which is the
thing a hiring manager reads as "this person is active".

The cadence is stored per post, in `posts.scheduled_for` — not in the cron
expression. A missed run therefore publishes late rather than never, and the
running order can be changed from the studio without a redeploy.

---

## Seeding the drafts

```bash
pnpm series:seed
```

Inserts all 31 as **drafts**. Re-running skips anything already there; `--force`
overwrites drafts but never touches a published post.

Nothing is queued by seeding. A draft only goes out once it has a date on it.

---

## Queueing them

Open `/studio`. The **Publishing queue** panel at the top takes a start date and
a gap in days, and dates every unscheduled draft in the running order above.
"Clear queue" takes them all back to plain drafts. Individual posts get a
**Publish on** date in the editor's post settings.

**Read every one before you queue it** — your name is on it, and the scheduler
publishes without asking again. Queue in batches you've actually read: a week's
worth at a time is a reasonable rhythm.

---

## How a post actually goes out

```
Vercel Cron  07:00 UTC daily
      │
      ▼
GET /api/cron/publish            Authorization: Bearer $CRON_SECRET
      │  takes the oldest due draft live (at most one per run)
      │  revalidates /writing, /, /rss.xml, /sitemap.xml
      ▼
/rss.xml gains an <item>
      │
      ▼
Zapier — RSS by Zapier: New Item in Feed
      │
      ▼
Zapier — LinkedIn: Create Share Update
```

Two halves, split on purpose:

- **The site half is Vercel Cron, not Zapier.** Zapier would need an endpoint to
  call anyway, so the endpoint is the work either way — and running it in the
  deployment means it can call `revalidatePath` directly, costs no Zapier tasks,
  and can't publish while Zapier is down or its trigger is misconfigured.
- **The LinkedIn half is Zapier**, because Zapier holds the LinkedIn OAuth
  token. RSS is the integration point: no API keys on our side, no webhook to
  maintain.

The cron runs at 07:00 UTC — an hour after the 06:00 publish slot — because
Vercel may fire a cron up to an hour late, and a late run must never skip a day.

**At most one post per run.** If the cron were down for a week, draining the
backlog at once would fire a burst of LinkedIn posts; a queue running a few days
late is much the lesser problem.

### Zap

**Trigger — RSS by Zapier → New Item in Feed**

| Field | Value |
|---|---|
| Feed URL | `https://personalsite-six-alpha.vercel.app/rss.xml` |
| Trigger for | Each new item |

**Action — LinkedIn → Create Share Update**

Template:

```
{{title}}

{{description}}

Full post: {{link}}

#dotnet #csharp #softwarearchitecture
```

`title`, `description` and `link` map to the RSS fields the feed already emits.

### Notes

- **Publish one post by hand from the studio before you turn the Zap on.** RSS
  triggers can fire for every existing item on first connect. With one item in
  the feed the worst case is one duplicate share; with thirty it's thirty.
- Zapier polls every 5–15 minutes on most plans, so a post queued for 06:00 UTC
  reaches LinkedIn somewhere in the following quarter-hour. Close enough.
- Keep hashtags to three or four. More reads as spam and LinkedIn down-ranks it.
- The `description` field is the post summary from the studio, so it's worth
  writing that as the LinkedIn hook rather than as an abstract.
- A post with a cover image also emits an `<enclosure>`, which Zapier can attach
  to the share. Without one, LinkedIn falls back to the page's OpenGraph card.

### Checking on it

The scheduler's runs show up under **Vercel → the project → Logs**, filtered to
`/api/cron/publish`. A successful run logs the slug it published.

To publish the next due post immediately rather than waiting for the cron:

```bash
curl -X POST https://<your-site>/api/cron/publish \
  -H "Authorization: Bearer $CRON_SECRET"
```

### When you buy the domain

One change, in one place:

1. Add the domain in Vercel → Settings → Domains.
2. Update `NEXT_PUBLIC_SITE_URL` to the new origin and redeploy.
3. Update the Feed URL in the Zap.

Canonical URLs, OG images, the sitemap and the feed all derive from that env
var, so everything else follows automatically. Posts published before the move
keep working — Vercel redirects the old origin.

---

## After the 30

The series is a runway, not a strategy. The thing that converts is
Business Central writing, because that's the search traffic with nobody good
serving it. These 30 buy you fifteen weeks of visible cadence while you write
the BC posts properly — which is why the `business-central` category is
deliberately empty here.
