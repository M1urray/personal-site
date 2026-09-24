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

**Two a week — Tuesday and Thursday, ~08:00 EAT.** Fifteen weeks of runway.

Tuesday/Thursday morning is when technical LinkedIn traffic is highest and
weekend posts are wasted. Don't batch-publish: the value is a visible, sustained
cadence, which is the thing a hiring manager reads as "this person is active".

---

## Seeding the drafts

```bash
pnpm series:seed
```

Inserts all 30 as **drafts**. Re-running skips anything already there; `--force`
overwrites drafts but never touches a published post.

Then, for each one: open `/studio`, read it, adjust anything that doesn't sound
like you, and hit Publish. **Read every one before it goes out** — your name is
on it.

---

## The Zapier automation

The site publishes an RSS feed at `/rss.xml` containing every published post
with an absolute URL. That is the integration point — no API keys, no webhook to
maintain.

Publishing a post revalidates the feed immediately (`revalidatePath("/rss.xml")`),
so a post is in the feed within seconds of you hitting Publish.

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

- **Turn the Zap on *after* you publish the first post manually.** RSS triggers
  can fire for existing items on first connect; you do not want thirty LinkedIn
  posts in one minute.
- Zapier polls every 5–15 minutes on most plans. Publish the night before if you
  want a precise morning slot, or let it drift — it doesn't matter much.
- Keep hashtags to three or four. More reads as spam and LinkedIn down-ranks it.
- The `description` field is the post summary from the studio, so it's worth
  writing that as the LinkedIn hook rather than as an abstract.

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
