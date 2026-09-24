/**
 * "Notes from a regulated build" — a 30-part series.
 *
 * Lessons drawn from building a large .NET + React case-management system.
 * Deliberately domain-free: no client, no product, no jurisdiction, no
 * requirement citations, and no reproduced source. Every snippet is a generic
 * illustration written to teach the pattern.
 *
 * Seed these into the studio as DRAFTS with `pnpm series:seed`, review each
 * one, then publish on the schedule in docs/content-plan.md.
 */

export type SeriesArticle = {
  slug: string;
  title: string;
  description: string;
  category: "dotnet" | "integration" | "business-central";
  body: string;
};

export const series: SeriesArticle[] = [
  {
    slug: "the-state-machine-is-data",
    title: "Your State Machine Should Be Data, Not a Workflow Engine",
    description:
      "Statuses and permitted moves as rows; preconditions as code. The split that lets a business add a state without a release.",
    category: "dotnet",
    body: `Most systems that model a process reach for one of two extremes: a big \`switch\` on an enum, or a full workflow engine. Both hurt, in opposite directions.

## The problem

A hard-coded state machine means every new status is a release. A workflow engine means a second runtime, a second mental model, and a designer nobody on the team wants to own.

## The split that worked

Put **what** in the database and **how** in code:

- Which statuses exist, and which moves are permitted between them — rows.
- What must be true before a move is allowed — named predicates in C#.

A transition row references its preconditions by key:

\`\`\`csharp
public interface ITransitionGuard
{
    string Key { get; }                        // matches a key on the transition row
    GuardResult Evaluate(GuardContext context);
}
\`\`\`

Adding a rule becomes a row plus, at most, one new class. Adding a *status* becomes a row and nothing else.

## Why it matters

The engine never reads your status constants. Those exist for guards, seeders and tests. That's what keeps the table authoritative — the moment code branches on \`if (status == Approved)\`, the database has stopped being the source of truth and you have two of them.

One caution: this only works if the table is validated. A transition naming a precondition that no longer exists must be caught loudly, not skipped silently. More on that later in the series.`,
  },
  {
    slug: "compiler-enforced-architecture",
    title: "Let the Compiler Enforce Your Architecture",
    description:
      "Layering diagrams don't stop anyone. `internal` plus `InternalsVisibleTo` does — a bypass becomes a build error.",
    category: "dotnet",
    body: `Every team has an architecture diagram with arrows pointing one way. Almost none of them can stop a developer drawing a new arrow at 5pm on a Friday.

## The problem

"Infrastructure must not mutate domain state" is a convention. Conventions are enforced by code review, and code review is enforced by whoever is awake.

## Making it structural

Mark the mutating method \`internal\`, then grant visibility to exactly the assemblies allowed to call it:

\`\`\`xml
<ItemGroup>
  <InternalsVisibleTo Include="MyApp.Application" />
  <InternalsVisibleTo Include="MyApp.Domain.Tests" />
</ItemGroup>
\`\`\`

\`\`\`csharp
public sealed class Order
{
    public OrderStatus Status { get; private set; }

    // Only the Application layer may move an order. Persistence cannot,
    // even by accident — it will not compile.
    internal void ApplyTransition(OrderStatus next) => Status = next;
}
\`\`\`

Now the persistence layer physically cannot set a status. Not "shouldn't" — *can't*.

## Why it matters

The rule stops depending on memory. A new developer doesn't need to have read the architecture doc; they need to get the build green, and the build knows the rule.

Keep that \`InternalsVisibleTo\` list short and treat additions to it as architectural changes, because that's what they are. The moment it lists every project, you've deleted the constraint while leaving the ceremony in place.`,
  },
  {
    slug: "tests-that-enforce-dependencies",
    title: "Split Your Test Projects So a Wrong Dependency Won't Compile",
    description:
      "One test project per layer isn't bureaucracy — it's how an accidental EF Core reference in a use case becomes a build failure.",
    category: "dotnet",
    body: `A single \`Tests\` project referencing everything is convenient, and it quietly destroys one of the best guarantees you have.

## The problem

If your test project references both the Application layer and Entity Framework, then an accidental \`using Microsoft.EntityFrameworkCore;\` inside a use case still compiles. Your dependency rule is now documentation.

## The arrangement

Give each layer its own test project, referencing only what that layer is allowed to see:

\`\`\`
MyApp.Application.Tests     -> references Application only
MyApp.Infrastructure.Tests  -> references Infrastructure
\`\`\`

Now an EF Core type leaking into a use case fails to build in \`Application.Tests\`, at the exact moment it's introduced, with an error that names the file.

## Why it matters

This is the cheapest architectural test you will ever write, because you don't write it. There's no reflection-based convention test to maintain, no NetArchTest assertions drifting out of date. The project reference graph *is* the assertion.

The temptation to merge them is real — two projects means two \`dotnet test\` invocations and some duplicated fixtures. Resist it. The duplication is a few builder helpers. What you'd be trading away is the only thing stopping your layers collapsing into each other over a couple of busy quarters.

If the shared fixtures genuinely hurt, extract a small \`TestSupport\` project that references nothing but the domain.`,
  },
  {
    slug: "guards-that-cannot-n-plus-one",
    title: "Design Preconditions That Can't Become an N+1",
    description:
      "If a validation rule can query the database, one day it will — inside a loop. Hand it facts instead.",
    category: "dotnet",
    body: `Give a precondition check a \`DbContext\` and you've written a performance bug with a delayed fuse.

## The problem

A rule like "the response must already be on file" needs data. The obvious move is to inject a repository:

\`\`\`csharp
// Tempting, and a trap.
public sealed class ResponseFiledGuard(IResponseRepository repo) : IGuard
{
    public bool IsSatisfied(Order order) => repo.ExistsFor(order.Id);  // a query, per guard
}
\`\`\`

Five rules on one transition is five round trips. Evaluate that transition for twenty rows to render a list, and you have a hundred.

## Gather once, then evaluate

Make the engine collect everything the rules could need, once, and pass it in:

\`\`\`csharp
public sealed record GuardContext(
    Order Order,
    IReadOnlySet<string> ActorPermissions,
    IReadOnlyDictionary<string, string> Facts)
{
    public bool FactIsTrue(string key) =>
        Facts.TryGetValue(key, out var v) && bool.TryParse(v, out var b) && b;
}
\`\`\`

Rules become pure functions over that record. They cannot query, because they have nothing to query with.

## Why it matters

Purity here buys two things at once. Performance is bounded by construction — one fact-gathering trip per transition, no matter how many rules run. And every rule becomes trivially testable: build a context, assert the outcome, no database, no mocks.

Keeping facts as a string dictionary looks crude next to a typed context object. It's deliberate: a new rule needs a new *fact*, not a new context type and a change to every call site.`,
  },
  {
    slug: "permission-before-preconditions",
    title: "Check Permission Before You Check Preconditions",
    description:
      "The order of two `if` statements decides whether your error messages leak your business state to people who can't act.",
    category: "dotnet",
    body: `Two checks guard most privileged operations: *may this person do it*, and *is it possible right now*. The order matters more than it looks.

## The problem

Do preconditions first and your error messages become an information channel:

> "You cannot approve this: the second signature is still outstanding."

Useful for an approver. But if the caller had no right to approve anything, you've just told them the case exists, that it's mid-approval, and which step it's waiting on.

## The order

\`\`\`csharp
// 1. May the actor perform this action at all?
if (!actor.Permissions.Contains(transition.RequiredPermission))
    return TransitionOutcome.Refused(Refusal.NotPermitted);

// 2. Only now, is it possible?
var failures = guards.Where(g => !g.Evaluate(context).Satisfied).ToList();
if (failures.Count > 0)
    return TransitionOutcome.Refused(Refusal.PreconditionUnmet, failures);
\`\`\`

An unauthorised caller gets one flat refusal and learns nothing about the state of the thing they touched.

## Why it matters

This is the cheapest information-disclosure fix in any workflow system, and it is almost always got wrong — because preconditions are the *interesting* logic, so they get written first and the permission check gets bolted on afterwards, where it reads naturally.

Worth writing the test that pins it: an actor without the permission gets exactly the same response whether or not the preconditions are met. If those two responses ever differ — in body, in status code, or in *timing* — the check has moved back to the wrong place.`,
  },
  {
    slug: "refusal-is-a-return-value",
    title: "A Refused Operation Is a Return Value, Not an Exception",
    description:
      '"You may not do that yet" is an ordinary outcome. Throwing for it costs you the reason and flattens your HTTP responses.',
    category: "dotnet",
    body: `Exceptions are for the unexpected. A business rule declining an operation is the most expected thing your system does.

## The problem

\`\`\`csharp
if (!guard.IsSatisfied(context))
    throw new InvalidOperationException("Precondition not met");
\`\`\`

Everything that made the refusal useful is now a string. The caller can't tell "not permitted" from "not yet" from "already done" without parsing prose, so the API layer collapses all of it into one status code — usually 400, sometimes 500.

## Model the outcomes

\`\`\`csharp
public enum Refusal { NotPermitted, PreconditionUnmet, NoSuchTransition, Conflict }

public sealed record TransitionOutcome(
    bool Succeeded,
    Refusal? Refusal = null,
    IReadOnlyList<GuardResult> Failures = null);
\`\`\`

Each refusal now maps to a distinct HTTP response — 403, 422, 404, 409 — and the failures carry which rules were unmet and why.

## Why it matters

Two things fall out of this that you don't get from exceptions.

The API layer becomes a translation, not a decision. It maps an enum to a status code; it isn't inferring intent from an exception type someone chose in a hurry.

And you can evaluate *all* the rules instead of stopping at the first. A user fixing three problems one refusal at a time will submit three times and resent you for it. Return the whole list.

Keep exceptions for the genuinely exceptional: the transition row naming a rule that doesn't exist. That one *should* explode.`,
  },
  {
    slug: "omit-what-the-user-cannot-do",
    title: "Omit Actions the User Can't Take — Don't Render Them Disabled",
    description:
      "A greyed-out button is an inventory of your permission model, handed to whoever hovers it.",
    category: "dotnet",
    body: `The convention is to render every action and disable the ones unavailable. For permission-gated operations, that's the wrong default.

## The problem

A disabled "Strike Out" button tells a clerk that striking out exists, that it applies to this record, and that someone in the building can do it. Multiply by every action on every screen and your UI has documented your authorisation model for anyone who reads it.

There's a worse version: the button is disabled client-side only, and the endpoint isn't checked. Now it's not just disclosure.

## Two different answers

Be explicit that these are different questions:

- **Not permitted for this actor** → omit the action entirely.
- **Permitted, but not possible yet** → show it, disabled, with the reason.

\`\`\`csharp
public async Task<IReadOnlyList<AvailableAction>> AvailableActionsAsync(
    Guid recordId, Actor actor)
{
    var transitions = await ResolveTransitionsAsync(recordId);

    return transitions
        // Silently gone if the actor may not act.
        .Where(t => actor.Permissions.Contains(t.RequiredPermission))
        .Select(t => new AvailableAction(
            t.ActionKey,
            Enabled: GuardsPass(t, context),
            Reason: FirstUnmetRequirement(t, context)))
        .ToList();
}
\`\`\`

## Why it matters

The screen renders from this list, so the UI can't drift from the rules — there's no second copy of the permission logic in a component.

And the distinction is honest. "You can't see this" and "you can't do this *yet*" are genuinely different messages. Collapsing them into one grey button communicates neither.`,
  },
  {
    slug: "fail-closed-validate-at-startup",
    title: "Validate Your Rule Table at Startup, and Refuse to Boot",
    description:
      "Config-driven rules have a failure mode code doesn't: a row naming something that no longer exists. Catch it at boot, not at 4pm.",
    category: "dotnet",
    body: `Moving rules into the database buys flexibility and hands you a new way to fail. A row can reference a rule that was renamed, or a status nobody defined.

## The problem

The runtime discovers this at the worst moment — a user clicks an action and the lookup returns nothing. Now you choose between two bad defaults:

- **Fail open:** an unknown rule is skipped. The transition proceeds *without* the precondition it was supposed to have. This is the one that ends up in an incident report.
- **Fail closed, silently:** the action vanishes from the UI with no explanation and someone spends a morning on it.

## Check the whole table at boot

\`\`\`csharp
public async Task ValidateTransitionTableAsync(CancellationToken ct)
{
    var known = GuardKeys.All;
    var rows  = await db.Transitions.AsNoTracking().ToListAsync(ct);

    var broken = rows
        .SelectMany(r => r.GuardKeys.Select(k => (r, k)))
        .Where(x => !known.Contains(x.k))
        .ToList();

    if (broken.Count > 0)
        throw new InvalidOperationException(
            $"Transition rows name unknown rules: {string.Join(", ", broken.Select(b => $"{b.r.Key} -> {b.k}"))}");
}
\`\`\`

The app refuses to start, and the message names the rows.

## Why it matters

The failure moves from production runtime to deployment, where you have a rollback and nobody is waiting.

Pair it with a small trick to catch renames even earlier: have the seeder import the key constants via \`using static\`, so renaming a rule breaks the *compile* rather than the boot.

Then make the whole thing default to refusal — an action naming a rule you can't resolve is refused, never allowed. Config-driven systems must fail closed. The flexibility is worth it; the ambiguity isn't.`,
  },
  {
    slug: "effective-dated-rules-and-utcnow",
    title: "Effective-Dated Rules: Never Default to UtcNow",
    description:
      "A rule that only applies from the moment its object was constructed is a rule that can't describe anything that happened before today.",
    category: "dotnet",
    body: `If your rules change over time, each one needs a date it came into force. The default value of that date is where this goes wrong.

## The problem

\`\`\`csharp
public sealed class Rule
{
    // Looks harmless. Is not.
    public DateTime EffectiveFrom { get; } = DateTime.UtcNow;
}
\`\`\`

The rule is now in force from *the moment the object happened to be constructed*. Which is: whenever the app last started, or whenever the seeder ran.

Resolve a rule for something dated earlier and you match nothing at all. Import two years of historical records and every one of them resolves to "no applicable rule".

## Make it an input

\`\`\`csharp
public sealed class Rule
{
    // Beginning of time by default: the rule has always applied unless
    // the caller says otherwise.
    public DateTime EffectiveFrom { get; }

    public Rule(string key, DateTime? effectiveFrom = null)
    {
        Key = key;
        EffectiveFrom = effectiveFrom ?? DateTime.MinValue;
    }
}
\`\`\`

Rules that encode long-standing policy get the default and apply to all of history. Rules that genuinely start on a date get that date, explicitly.

## Why it matters

The failure is invisible in every test you're likely to write, because tests create a rule and immediately use it — with \`UtcNow\` a millisecond in the past, it matches.

It only shows up with historical data: a backlog import, a reopened old record, a report over last year. By then the code has been "working" for months.

When in doubt, ask what the rule *describes*. If it encodes policy that predates your system, it cannot have come into force the day you deployed.`,
  },
  {
    slug: "ef-core-phantom-update",
    title: "EF Core: Why Your New Child Row Becomes a Phantom UPDATE",
    description:
      "Assign entity IDs in the constructor and EF assumes anything it discovers already exists. The error names a concurrency problem you don't have.",
    category: "dotnet",
    body: `This one has bitten me on three different entity types in the same codebase, which is how I learned it's structural rather than careless.

## The setup

A sensible base entity generates its own identity, so an object is fully-formed before it's persisted:

\`\`\`csharp
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}
\`\`\`

## The problem

Add a child to a tracked parent's collection and EF Core inspects it. The key is populated, so change detection concludes this is an **existing** row and marks it \`Modified\`.

\`\`\`csharp
var order = await db.Orders.Include(o => o.Lines).FirstAsync(...);
order.AddLine(sku, quantity);   // Id assigned in the constructor
await db.SaveChangesAsync();    // issues UPDATE, not INSERT
\`\`\`

EF issues an \`UPDATE\` against an id that isn't in the table. Zero rows affected, and you get:

> The database operation was expected to affect 1 row(s), but actually affected 0 row(s).

A concurrency error, for a row that has never existed. The message points at optimistic concurrency, which is not the problem, and you lose an hour.

## The fix

Register the child explicitly:

\`\`\`csharp
var line = order.AddLine(sku, quantity);
db.OrderLines.Add(line);            // now it's Added, not Modified
await db.SaveChangesAsync();
\`\`\`

## Making it hard to forget

The habit doesn't stick, so lean on the API instead. Have methods that create children **return what they created** — a method returning \`OrderLine\` invites the caller to do something with it, where a \`void\` method looks finished.

Then put the explanation on \`Entity.Id\` itself, where the cause lives. The person who hits this will be reading the stack trace, not your wiki.`,
  },
  {
    slug: "one-dbcontext-many-modules",
    title: "One DbContext, However Many Modules",
    description:
      "A second DbContext promises isolation and delivers two change trackers, two transactions and a bug you'll find in production.",
    category: "dotnet",
    body: `As a codebase grows into modules, someone always proposes a \`DbContext\` per module. It sounds like good boundaries. It's usually a transaction bug waiting to happen.

## The problem

Two contexts mean two change trackers and two \`SaveChangesAsync\` calls. The moment one operation touches both modules, atomicity is your problem:

\`\`\`csharp
await ordersContext.SaveChangesAsync();      // committed
await billingContext.SaveChangesAsync();     // throws — orders are now orphaned
\`\`\`

You can reach for \`TransactionScope\` or a shared connection. Now you've built distributed-transaction plumbing to solve a problem you created.

## The arrangement

One context. A new module means new \`DbSet\`s and an \`IEntityTypeConfiguration\`, never a second context:

\`\`\`csharp
public sealed class ApplicationDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Invoice> Invoices => Set<Invoice>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(b);
    }
}
\`\`\`

\`ApplyConfigurationsFromAssembly\` means adding a module doesn't touch this file at all — you add a configuration class and it's discovered.

## Where the boundary actually goes

Isolation belongs in the *application* layer: each module gets its own use cases, its own domain types, and doesn't reach into another module's entities. That's a boundary you can enforce with project references and the compiler.

Module boundaries are about who may call what. They were never about how many connections you hold.

If you genuinely need separate contexts — a read model on a replica, a different database — that's a real reason. "Modules" isn't one.`,
  },
  {
    slug: "xmin-concurrency-token",
    title: "PostgreSQL Gives You a Free Concurrency Token: xmin",
    description:
      "You don't need a RowVersion column. Postgres already tracks the transaction that last wrote each row.",
    category: "dotnet",
    body: `Optimistic concurrency in EF Core usually starts with adding a \`RowVersion\` column. On PostgreSQL you can skip it.

## The problem with a column

A \`RowVersion\`/\`xmin\`-shaped column you maintain yourself is one more thing to get right: it has to be in the model, in every migration, and incremented on every write path — including the ones that bypass EF.

## Use the system column

Every Postgres row already carries \`xmin\`, the id of the transaction that last wrote it. EF Core's Npgsql provider exposes it as a shadow property:

\`\`\`csharp
protected override void OnModelCreating(ModelBuilder b)
{
    b.Entity<Order>().UseXminAsConcurrencyToken();
}
\`\`\`

No column, no migration, no maintenance. Any write — from EF, from a script, from psql — advances it, because the database does it.

## Surfacing it over HTTP

It maps cleanly onto conditional requests:

\`\`\`csharp
// Read: hand the caller the version.
Response.Headers.ETag = $"\\"{order.Version}\\"";

// Write: require it back, and let the DB arbitrate.
if (Request.Headers.IfMatch != expectedEtag)
    return StatusCode(StatusCodes.Status412PreconditionFailed);
\`\`\`

A client that fetched a record, sat on the screen for ten minutes, then saved gets a 412 rather than silently overwriting someone else's edit.

## Why it matters

The guarantee moves into the database, where concurrent writers actually meet. An application-maintained version column is only as good as the code paths that remember to touch it — and there is always one that doesn't.

Catch \`DbUpdateConcurrencyException\` and translate it to 409/412 at the edge. Don't retry automatically: you don't know whether the user still wants what they typed ten minutes ago.`,
  },
  {
    slug: "the-migration-ef-cannot-write",
    title: "The Migration EF Core Can't Write for You",
    description:
      "Some guarantees aren't expressible in a model. Hand-write the migration, and make sure a regeneration can never drop it.",
    category: "dotnet",
    body: `EF Core migrations are generated from your model. Which means any guarantee your model can't express simply won't be in them.

## Two examples

**An append-only table.** An audit log is worthless if the application can rewrite it. You want the database to refuse:

\`\`\`sql
CREATE RULE audit_event_no_update AS ON UPDATE TO audit_event DO INSTEAD NOTHING;
CREATE RULE audit_event_no_delete AS ON DELETE TO audit_event DO INSTEAD NOTHING;
\`\`\`

**A cross-table invariant.** "A status change must be accompanied by a history row, in the same transaction" is not a foreign key and not a check constraint. It's a deferred constraint trigger:

\`\`\`sql
CREATE CONSTRAINT TRIGGER status_requires_history
AFTER UPDATE OF status ON record
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_history_row_exists();
\`\`\`

Deferred matters: at the instant of the \`UPDATE\` the history row may not be inserted yet. Checking at commit lets both orders of operation work.

## Protecting it

Write it as a real migration with \`migrationBuilder.Sql(...)\`, and leave a comment saying it is hand-written and why. A schema regeneration — the thing someone does when migrations get messy — will otherwise quietly drop it, and nothing will fail. The audit table just becomes writable one Tuesday.

## Why it matters

Permissions reinforce this. If your application connects as a role that *cannot* grant itself \`UPDATE\` on the audit table, the guarantee holds even if someone finds a way around the rule. Least privilege isn't only about attackers — it's about making your own invariants unbreakable by your own code.

Any rule you'd be embarrassed to discover was bypassable belongs in the database, not in a service method.`,
  },
  {
    slug: "money-is-an-integer",
    title: "Money Is an Integer",
    description:
      "Minor units in a 64-bit integer. Not float, not decimal-by-default, and never a double anywhere near a total.",
    category: "dotnet",
    body: `This is old advice that keeps needing repeating, because the default types are all subtly wrong.

## The rule

Store money as **minor units in a 64-bit integer**. 1,234.56 is \`123456L\`.

\`\`\`csharp
public readonly record struct Money(long MinorUnits, string Currency)
{
    public static Money FromMajor(decimal amount, string currency) =>
        new((long)Math.Round(amount * 100m, MidpointRounding.ToEven), currency);

    public decimal ToMajor() => MinorUnits / 100m;

    public static Money operator +(Money a, Money b) =>
        a.Currency == b.Currency
            ? new(a.MinorUnits + b.MinorUnits, a.Currency)
            : throw new InvalidOperationException("Currency mismatch");
}
\`\`\`

## Why not the alternatives

**\`double\`/\`float\`** — binary floating point can't represent 0.1. Errors accumulate across a sum and you get a reconciliation that's out by a cent with no explanation.

**\`decimal\`** — genuinely accurate, and fine in C#. The trouble is the round trip: it maps to \`numeric\`, serialises through JSON as a number, and somewhere between your API and a browser it meets a JavaScript \`number\`, which is a double. The precision you paid for is gone at the edge.

An integer survives every hop. JSON integers are exact up to 2^53, comfortably past any realistic amount in cents.

## The part people skip

Put the **currency next to the amount**, and refuse to add two Money values of different currencies. A bare \`long\` is a number of unspecified units, and it will eventually be added to a number of different unspecified units.

Round once, at the boundary where a human decides the number — never in the middle of a calculation chain.`,
  },
  {
    slug: "gapless-numbering-under-concurrency",
    title: "Gapless Sequential Numbers Under Concurrency",
    description:
      "A database sequence gives you unique numbers, not gapless ones. When a register must have no holes, you need a row lock.",
    category: "dotnet",
    body: `"Give me the next number in the series" looks trivial until two requests arrive at once, or one of them rolls back.

## Why a sequence isn't enough

\`SEQUENCE\` and \`IDENTITY\` are built to be fast under concurrency, which they achieve by **not** being transactional. Take number 41 and roll back, and 41 is gone forever. For a surrogate key that's correct. For a statutory register that must run 1, 2, 3 with no holes, it's a defect — a missing number is something you have to explain.

## Serialise on a row

\`\`\`csharp
await using var tx = await db.Database.BeginTransactionAsync(ct);

// Lock the counter row; concurrent callers queue here.
var series = await db.NumberSeries
    .FromSqlInterpolated($@"
        SELECT * FROM number_series
        WHERE key = {key}
        FOR UPDATE")
    .SingleAsync(ct);

series.Advance();                       // next++
var number = series.Format();           // e.g. REF-00042/2026

record.Assign(number);
db.History.Add(new HistoryEntry(record.Id, number));

await db.SaveChangesAsync(ct);
await tx.CommitAsync(ct);               // number and its use commit together
\`\`\`

\`FOR UPDATE\` is the whole trick. The second caller blocks until the first commits or rolls back — and on rollback the counter goes back with it.

## The part that's easy to miss

Everything that depends on the number must be in **the same transaction**. If the number commits and the work that justified it fails afterwards, you've burned one and you're back to explaining a hole.

Yes, this serialises issuance. That's the requirement — you're asking for a total order. At registry volumes the lock is held for milliseconds. If you're issuing thousands per second, you don't want gapless numbering, you want a sequence, and someone should check which one the rule actually requires.`,
  },
  {
    slug: "working-days-versus-calendar-days",
    title: "Working Days or Calendar Days — Never Assume",
    description:
      "Two deadline rules, twelve days apart, and the wrong one looks exactly like the right one.",
    category: "dotnet",
    body: `Regulated processes mix units deliberately. One party gets 30 **working** days to respond; an extension is capped at 5 **calendar** days. Both are "days" in the requirements document, and they are not the same thing.

## The trap

Thirty working days from 4 September is 16 October. Thirty calendar days is 4 October. Twelve days apart on a statutory window — and a wrong deadline renders correctly, sorts correctly, and looks entirely plausible on screen.

## Don't hard-code the unit

Make it data, read per rule:

\`\`\`csharp
public sealed record DeadlineRule(string Key, int Amount, DayUnit Unit);

public DateOnly Compute(DateOnly from, DeadlineRule rule) => rule.Unit switch
{
    DayUnit.Calendar => from.AddDays(rule.Amount),
    DayUnit.Working  => AddWorkingDays(from, rule.Amount),
    _ => throw new ArgumentOutOfRangeException(nameof(rule))
};

private DateOnly AddWorkingDays(DateOnly from, int count)
{
    var date = from;
    while (count > 0)
    {
        date = date.AddDays(1);
        if (date.DayOfWeek is not (DayOfWeek.Saturday or DayOfWeek.Sunday)
            && !holidays.Contains(date))
            count--;
    }
    return date;
}
\`\`\`

## Be honest about the holiday list

Working-day maths needs a holiday calendar, and that calendar is usually someone else's to publish. If you're running on a provisional list, say so — in the logs at startup, and on the screen.

Mark a deadline counted across an unconfirmed holiday as **indicative** rather than presenting it as authoritative. A date that might move by a day is useful. A date that might move by a day while claiming to be certain is a liability.

The general principle: when a requirement says "days", that's an unanswered question, not a specification.`,
  },
  {
    slug: "snapshot-the-rule-not-the-answer",
    title: "Snapshot the Rule, Not Just the Answer",
    description:
      "Storing a computed date tells you what. Storing the rule that produced it tells you why — years later, after the rule changed.",
    category: "dotnet",
    body: `You compute a deadline and store the date. Two years later someone asks why it was that date, and the rule has been amended twice since.

## The problem

The stored date is the *output* of inputs you didn't keep. Recomputing it today gives a different answer, because today's rule is different. You can't reconstruct the original, and you can't defend it.

## Keep the derivation

Store the rule as it stood, alongside the result:

\`\`\`csharp
public sealed class Deadline
{
    public DateOnly DueOn { get; }

    // jsonb: the rule as applied, structured — not prose.
    public string RuleSnapshot { get; }
}
\`\`\`

\`\`\`json
{
  "ruleKey": "response.window",
  "amount": 30,
  "unit": "working",
  "countedFrom": "2026-09-04",
  "holidaysApplied": ["2026-09-06"],
  "holidayListStatus": "provisional",
  "ruleVersion": 3
}
\`\`\`

## Structured, not a sentence

The temptation is to store \`"30 working days from service"\` and move on. Prose can be read by a human and by nothing else. Structured JSON can be queried — *which deadlines were computed under version 2 of this rule?* — which is exactly the question an audit asks.

PostgreSQL's \`jsonb\` handles this well: indexable, queryable, and it doesn't need a migration each time a rule gains a field.

## Why it matters

Anything that produces a consequential number — a deadline, a fee, an eligibility decision — has the same shape. Keep the answer *and* the reasoning, or accept that the answer becomes unexplainable the moment the rule moves.

A good test: if the rules table were wiped tomorrow, could you still explain every decision already made? If not, you're storing outputs and hoping.`,
  },
  {
    slug: "define-open-exactly-once",
    title: 'Define "Open" Exactly Once',
    description:
      "Two screens counting the same thing with two copies of the filter is how a dashboard and a report disagree on the same morning.",
    category: "dotnet",
    body: `A dashboard says 412 open cases. The report says 389. Both are "right" — they were written six weeks apart by two people with two reasonable readings of the word *open*.

## The problem

Terms like open, active, lodged, overdue feel self-evident, so each query re-expresses them inline:

\`\`\`csharp
// Dashboard
.Where(c => c.Status != "Closed" && c.Status != "Withdrawn")

// Report — written later, and not wrong exactly
.Where(c => c.Status != "Closed" && c.Status != "Withdrawn" && c.Status != "StruckOff")
\`\`\`

Nobody notices until two numbers meet on one page, or in a meeting.

## One definition, imported everywhere

\`\`\`csharp
public static class CaseQueryRules
{
    // The definition of "open". Both the dashboard and the reports read this.
    // A second copy is how the two screens come to disagree.
    public static IQueryable<Case> Open(this IQueryable<Case> q) =>
        q.Where(c => !ClosedStatuses.Contains(c.Status));

    public static readonly IReadOnlySet<string> ClosedStatuses =
        new HashSet<string> { "Closed", "Withdrawn", "StruckOff" };
}
\`\`\`

Both screens call \`.Open()\`. Changing the definition changes both, and the diff shows exactly one place.

## Write down the ambiguity

The valuable part isn't the refactor — it's what you find doing it. In one system, a struck-off record could be *reinstated*, so the lifecycle didn't treat it as terminal, while reports had always counted it as closed. Both defensible; they can't both be right.

When you find one of those, resolve it with the business rather than picking. And leave the question in a comment where the definition lives, so the next person inherits the reasoning instead of rediscovering the contradiction.`,
  },
  {
    slug: "pure-calculations-where-you-can-test-them",
    title: "Put Pure Calculations Where You Can Test Them Without a Database",
    description:
      "Banding, medians and thresholds don't need SQL. Pull them out and they become tested in milliseconds.",
    category: "dotnet",
    body: `Reporting logic drifts into SQL because the data is already there. Then the only way to test a median is to stand up a database and insert fixtures.

## The problem

\`\`\`sql
SELECT CASE
         WHEN days_overdue <= 0  THEN 'on-time'
         WHEN days_overdue <= 7  THEN '1-7 days'
         WHEN days_overdue <= 30 THEN '8-30 days'
         ELSE '30+ days'
       END AS band, COUNT(*)
FROM deadline GROUP BY 1;
\`\`\`

The band boundaries — business rules someone will argue about — are now in a string inside a repository, testable only with a live database.

## Split the query from the maths

Let the database do what it's good at: fetch the rows. Do the classification in C#:

\`\`\`csharp
public static class DashboardBands
{
    public static IReadOnlyList<Band> Band(IEnumerable<int> daysOverdue)
    {
        var counts = Definitions.ToDictionary(d => d.Label, _ => 0);
        foreach (var d in daysOverdue)
            counts[Definitions.First(def => def.Matches(d)).Label]++;

        // Every band, including the empty ones.
        return Definitions.Select(d => new Band(d.Label, counts[d.Label])).ToList();
    }
}
\`\`\`

Now it's a unit test with an array of integers, and it runs in a millisecond.

## Emit the empty bands

Note the last line. A chart built from a \`GROUP BY\` shows only the buckets that occurred — so "nothing overdue" and "no deadlines computed at all" draw the identical picture: an empty chart.

Always emit the full set of bands with zeros. A bar chart with four labelled bands all at zero says *we measured, and it's fine*. An empty chart says nothing, and the reader supplies their own meaning.

The boundary is roughly: aggregation the database can do cheaply stays in SQL; anything a person might argue about belongs in code you can test.`,
  },
  {
    slug: "migrations-automatic-in-development-only",
    title: "Run Migrations Automatically in Development Only",
    description:
      "`db.Database.Migrate()` on startup is a gift locally and a hazard the first time two instances start at once.",
    category: "dotnet",
    body: `Calling \`Migrate()\` at boot is genuinely good developer experience. Pull the branch, run the app, schema is current. The trouble is what it does everywhere else.

## The problem

In any environment with more than one instance, startup is concurrent. Two instances boot, both find pending migrations, both begin applying them. EF takes a lock on the history table so you usually avoid corruption — but "usually" is carrying weight, and a blue-green cutover makes it worse: the old and new versions are briefly both running, racing on one schema, each wanting a different shape.

You also can't review what's about to run. A migration that rewrites a large table locks it, and you find out because requests are timing out.

## Gate it

\`\`\`csharp
if (app.Environment.IsDevelopment())
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
}
\`\`\`

Elsewhere, migration is an explicit, approved pipeline step that runs **before** the new version deploys:

\`\`\`bash
dotnet ef database update --connection "$CONNECTION_STRING"
\`\`\`

## Why it matters

Schema changes become a decision with a person attached, at a moment when someone is watching — rather than a side effect of whichever container happened to start first.

Worth adding: on startup in non-development environments, *check* for pending migrations and refuse to start if any exist. The app doesn't apply them; it just declines to run against a schema it wasn't built for. That turns "mysterious column not found" at 3pm into a clear failure at deploy time.`,
  },
  {
    slug: "one-seam-one-implementation-no-fallback",
    title: "One Seam, One Implementation, and No Fallback",
    description:
      "An interface with a \"local\" fallback isn't flexibility — it's a second code path that only runs when something is already wrong.",
    category: "integration",
    body: `You define \`IDocumentStore\` so the external system can be swapped. Then you add a local-disk implementation "for development". That second implementation is rarely the asset it looks like.

## What the fallback actually does

It gives you a path that runs precisely when the real one is unavailable — so the system appears to work while doing something different from production. Uploads land on a disk nobody backs up, and the failure surfaces later as missing files rather than immediately as a failed upload.

There's a sharper version of this. A service unit hardened with \`ProtectSystem=strict\` makes its install directory read-only. A disk-backed store pointed there doesn't throw on startup; it throws on the first write. Two days of uploads met a read-only directory instead of landing anywhere, and the application had reported success each time.

## Keep the seam, drop the spare

\`\`\`csharp
public interface IDocumentStore
{
    Task<StoreResult> UploadAsync(DocumentUpload upload, CancellationToken ct);
    Task<Stream> RetrieveAsync(string externalId, CancellationToken ct);
}
\`\`\`

The interface earns its place by keeping the vendor's HTTP details out of your application layer and by making the store fakeable in tests. Neither requires a *second production* implementation.

## What to do in development instead

Point at the real system's test instance. If there isn't one, let the operation fail loudly with a message naming what isn't configured:

\`\`\`csharp
if (string.IsNullOrWhiteSpace(settings.BaseAddress))
    return StoreResult.Failed(
        "No document store is configured. Set it under Configuration → Documents.");
\`\`\`

A developer who can't upload knows immediately. A developer whose uploads silently go to \`/tmp\` finds out in a demo.

Abstractions exist to isolate change. They don't have to be populated to be useful.`,
  },
  {
    slug: "settings-in-the-database-read-per-call",
    title: "Some Settings Belong in the Database, Read Per Call",
    description:
      "An integration address in appsettings means a file edit and a restart in every environment. Sometimes that's the wrong home.",
    category: "integration",
    body: `Configuration defaults to \`appsettings.json\` and environment variables. For the address of a system an administrator might move, that's often wrong.

## The problem

An external system relocates. The address lives in config, so every environment needs a file edited, a secret rotated and a service restarted — coordinated, out of hours, by someone with production access. Meanwhile uploads fail.

The administrator who knows the new address is not the person who can deploy.

## Move it, and read it per call

\`\`\`csharp
public sealed class DbEdmsSettings(IServiceScopeFactory scopes, IConfiguration fallback)
{
    // Read per call, not cached at startup: a change takes effect on the
    // next upload rather than the next restart.
    public async Task<EdmsSettings> CurrentAsync(CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var rows = await db.ConfigurationSettings
            .Where(s => s.Section == "documents")
            .ToDictionaryAsync(s => s.Key, s => s.Value, ct);

        // appsettings remains the fallback for anything left blank.
        return new EdmsSettings(
            rows.GetValueOrDefault("baseAddress") ?? fallback["Edms:BaseAddress"],
            rows.GetValueOrDefault("authHeader")  ?? fallback["Edms:AuthHeader"]);
    }
}
\`\`\`

## Two details that matter

**Secrets are still secrets.** The auth header is encrypted at rest and masked on screen. Moving a setting into the database doesn't make it plain text.

**Don't add a startup guard for it.** A check that reads only \`appsettings\` will refuse to start a perfectly good server whose integration is configured in the database. Validate at point of use and return a message naming where to fix it.

The test for which home a setting wants: *who changes this, and how often?* Deploy-time infrastructure belongs in config. Something an administrator adjusts belongs on a screen.`,
  },
  {
    slug: "verify-the-write-when-theres-no-checksum",
    title: "Verify the Write When the Store Won't Give You a Checksum",
    description:
      "Hashing the bytes you just sent proves nothing. Read them back and hash what the store actually holds.",
    category: "integration",
    body: `You upload a file and want to record its hash so corruption is detectable later. The obvious implementation quietly proves nothing.

## The problem

\`\`\`csharp
var bytes  = await ReadAsync(upload);
var digest = SHA256.HashData(bytes);

await store.UploadAsync(bytes, ct);
document.ConfirmStored(externalId, digest);   // hash of what we *sent*
\`\`\`

That hash describes the bytes in your process memory. It says nothing about what the remote system persisted. Compare it later against itself and it always matches — a check that can't fail isn't a check.

## Read it back

If the store returns no checksum of its own, fetch what it stored:

\`\`\`csharp
var sent = await ReadAsync(upload);
var result = await store.UploadAsync(sent, ct);

// Hash what the store actually holds, not what we handed it.
await using var stored = await store.RetrieveAsync(result.ExternalId, ct);
var digest = await SHA256.HashDataAsync(stored, ct);

document.ConfirmStored(result.ExternalId, digest);
\`\`\`

Now the recorded hash describes the stored object. Truncation, a transcoding proxy, or a store that silently rewrites content types all become visible.

## The trade, stated plainly

This doubles the traffic per upload. Worth it when the document is the record — a filing, a signed agreement, evidence — and not worth it for avatars.

If the store *does* return a checksum, use theirs and skip the read-back. Just check what it's computed over: some return a hash of a transformed object, which is a different guarantee than you think you're getting.`,
  },
  {
    slug: "an-upstream-failure-is-not-a-500",
    title: "An Upstream Failure Is Not a 500",
    description:
      "When a system you depend on refuses, pass on what it said. A generic error hides the one piece of information that helps.",
    category: "integration",
    body: `Your application calls another system. That system returns 413, or rejects the file type, or says the account is out of quota. The lazy path is to let it bubble and return 500.

## Why that's the wrong answer

A 500 says *I am broken*. You aren't — you worked correctly and were refused. The distinction matters to everyone downstream:

- The user can't tell whether to retry, fix the file, or call someone.
- Your monitoring counts an upstream refusal as your own availability incident.
- The one useful sentence — the upstream's own words — is now only in a log.

## Pass the refusal through

\`\`\`csharp
var response = await http.PostAsync(endpoint, content, ct);

if (!response.IsSuccessStatusCode)
{
    var detail = await response.Content.ReadAsStringAsync(ct);

    // A failed row carrying the store's words — never an unhandled 500.
    return StoreResult.Failed(
        $"The document store refused this upload ({(int)response.StatusCode}): {Summarise(detail)}");
}
\`\`\`

The operation is recorded as failed, with the reason attached, and the caller gets something actionable.

## Two cautions

**Summarise, don't forward verbatim.** Upstream errors can carry internal hostnames, stack traces or tokens. Map the ones you know; truncate the rest.

**Distinguish refusal from unreachable.** "Rejected your file" is a user-fixable problem. "Couldn't establish a connection" is an operational one that should page someone. They read almost identically in a \`catch\` block and want completely different handling.

Reserve 500 for *you* failing. Everything else deserves a more specific answer.`,
  },
  {
    slug: "password-then-one-time-code",
    title: "Password, Then One-Time Code — and the Challenge Opens Nothing",
    description:
      "The intermediate token between the two factors is where MFA usually leaks. It should name no roles and open no endpoint.",
    category: "integration",
    body: `Two-factor auth is standard. The subtle part is what the server hands back *between* the factors.

## The leak

A correct password returns a token, and it's tempting to make that token useful — the user's roles, their name, maybe a permissions array for the UI to preload. Now a stolen password alone yields a map of what that account can do, without ever passing the second factor.

Worse is the version where the interim token is accepted by real endpoints because one middleware didn't distinguish it.

## Make the challenge inert

\`\`\`csharp
// Step 1: password verified. This opens nothing.
var challenge = new AuthChallenge(
    ChallengeId: Guid.NewGuid(),
    ExpiresAt: now.AddMinutes(5));
// No roles. No permissions. No display name. No access token.

// Step 2: code verified against the challenge — only now is a session issued.
\`\`\`

The challenge identifies an in-progress attempt and nothing else.

## Two details worth the effort

**Make an unknown username cost the same as a real one.** If a missing account returns instantly and a real one takes 80ms hashing, that timing is an enumeration oracle. Verify against a decoy hash so both paths do the work:

\`\`\`csharp
var user = await users.FindAsync(username, ct);
var hash = user?.PasswordHash ?? DecoyHash;   // same cost either way
var ok   = Argon2id.Verify(hash, password) && user is not null;
\`\`\`

**Use a memory-hard hash.** Argon2id with a real memory cost (64 MiB is a reasonable floor) rather than a fast one. The point is to make offline cracking expensive if the table ever leaks.

The rule generalises: every intermediate artefact in an auth flow should carry the minimum needed to continue the flow, and nothing that's useful on its own.`,
  },
  {
    slug: "rotate-refresh-tokens-by-appending",
    title: "Rotate Refresh Tokens by Appending, Not Replacing",
    description:
      "If a superseded token simply stops existing, replay looks identical to a slow network. Keep it, and the attack becomes visible.",
    category: "integration",
    body: `Rotating refresh tokens is good practice: each use issues a new one. The question is what happens to the old.

## The problem with deleting

Delete the old token and a replayed one is indistinguishable from an expired one, a race between two tabs, or a client that retried on a flaky connection. All you can do is reject it. You learn nothing, and neither does the user.

## Append instead

Keep superseded tokens, marked, pointing at their successor:

\`\`\`csharp
public sealed class RefreshToken
{
    public string  Hash        { get; }        // hashed at rest, never stored raw
    public Guid?   SupersededBy { get; private set; }
    public DateTime? RevokedAt  { get; private set; }

    public RefreshToken Rotate()
    {
        var next = new RefreshToken(SessionId);
        SupersededBy = next.Id;                 // the chain stays intact
        return next;
    }
}
\`\`\`

Now a presented token resolves to one of three states, and they mean different things:

- **Active** → rotate, carry on.
- **Unknown** → never issued here. Reject.
- **Superseded** → *this token was already used.* Either it was stolen and replayed, or the legitimate client never received its replacement.

## What to do with the third case

Treat it as a compromised chain: revoke the whole session family, force re-authentication, and record it. That's the detection you bought — and you only have it because the old token still resolves.

Two things to keep alongside it. **Hash refresh tokens at rest**, so a database leak doesn't hand over live sessions. And **prune the chain** on a schedule, or your token table grows forever; keeping superseded entries past the refresh window buys nothing.`,
  },
  {
    slug: "an-identifier-is-not-a-credential",
    title: "An Identifier Is Not a Credential",
    description:
      "Knowing someone's reference number proves nothing about your right to act for them. Systems conflate these constantly.",
    category: "integration",
    body: `Tax numbers, account numbers, customer references, national IDs. They're printed on correspondence, shared with suppliers, quoted in emails. They identify. They do not authenticate, and they do not authorise.

## Where it goes wrong

Binding a submission to a reference number is genuinely useful: an agent can act for a client, and the client can find the record later. But if the number is the *only* check, then anyone who knows it can act as that party.

Reference numbers are not secret. Treating one as proof is equivalent to accepting a username with no password.

## Separate the three questions

\`\`\`csharp
// Who are you?            -> authentication (session)
// Who are you acting for? -> a nominated relationship, not a typed number
// May you?                -> authorisation

var mayAct = await representations.IsNominatedAsync(actor.PartyId, onBehalfOf, ct);

if (!mayAct && await parties.IsRegisteredAsync(onBehalfOf, ct))
    return Refuse("You are not nominated to act for this party.");

if (!mayAct)
    return AcceptButFlagForVerification();   // unregistered: allow, verify offline
\`\`\`

The party nominates who may act for them. An unnominated agent filing for a *registered* party is refused. Filing for an *unregistered* party is allowed, because the relationship can't be checked yet — and flagged so a human verifies the paperwork.

## Two supporting habits

**Select, don't type.** Let filers pick from a list of parties they're entitled to act for, rather than typing a number. Show masked identifiers in that list — it's for recognition, not disclosure.

**Never let a typed identifier overwrite stored contact details.** Fill blanks, and only blanks. Otherwise an agent lodging for a client can redirect that client's notices on every other matter by typing a different email — which is account takeover wearing a data-entry costume.`,
  },
  {
    slug: "purpose-separate-your-encryption-keys",
    title: "Purpose-Separate Your Encryption Keys (and Beware Normalisation)",
    description:
      "One protector reused for two kinds of secret turned a valid password into a mangled one — and nothing threw.",
    category: "integration",
    body: `You have a protector that encrypts sensitive values at rest. A second kind of secret shows up. Reusing the existing one looks like sensible economy.

## The failure

The original protector was built for a **reference number**, so it normalised before encrypting: upper-cased, stripped punctuation. Entirely correct for an identifier where \`ab-123\` and \`AB123\` are the same value.

Then it was reused for a mail-server password. \`Sm7p-Pass!\` was normalised to \`SM7PPASS\`, encrypted, and stored.

Nothing threw. Encryption succeeded, decryption succeeded, round-tripping was consistent. The mail server answered *535 5.7.3 Authentication unsuccessful* with a password the administrator could see was correct on screen.

## Separate by purpose

Same master key, different derived keys, and a version prefix that says which:

\`\`\`csharp
// Identifiers: normalise, then encrypt.
public sealed class IdentifierProtector : ISecretProtector
{
    private const string Purpose = "app:identifier:aes";
    private const string Prefix  = "v1:";
    public string Protect(string raw) => Encrypt(Normalise(raw), Purpose, Prefix);
}

// Arbitrary secrets: encrypt the bytes exactly as given.
public sealed class SettingProtector : ISecretProtector
{
    private const string Purpose = "app:setting:aes";
    private const string Prefix  = "s1:";
    public string Protect(string raw) => Encrypt(raw, Purpose, Prefix);   // no normalisation
}
\`\`\`

## Make the old format unreadable, not silently wrong

A \`v1:\` value presented to the settings protector is **refused**, not decrypted. The screen then shows the secret as unset, so it gets retyped rather than trusted.

That's the important half. Migrating the old values "helpfully" would have preserved mangled passwords and kept the bug. Refusing surfaces it once, in the only place someone can fix it.

The general rule: transformation belongs to the *type* of data, not the crypto. Once a protector both encrypts and edits, it can't be reused safely — and it will be reused.`,
  },
  {
    slug: "re-read-authorisation-every-request",
    title: "Re-read Authorisation State on Every Request",
    description:
      "If permissions live in the token, disabling an account does nothing until it expires. That window is the whole problem.",
    category: "integration",
    body: `Packing roles and permissions into a JWT is the standard performance move: no database call to authorise. The cost is that the token is a *snapshot*.

## The problem

Someone leaves, or an account is compromised and disabled. If authorisation is read from the token, that account keeps working until expiry — fifteen minutes, an hour, whatever you chose. The moment you most need access revoked is the moment your design defers it.

It's the same for permission changes. Revoke a permission and the user keeps it until they happen to re-authenticate.

## Read the current state

\`\`\`csharp
public async Task<AuthorisationResult> AuthoriseAsync(ClaimsPrincipal principal, CancellationToken ct)
{
    var accountId = principal.AccountId();

    // Current state, not what was true when the token was minted.
    var account = await accounts.FindAsync(accountId, ct);

    if (account is null || !account.IsActive)
        return AuthorisationResult.Denied("Account is not active.");

    return AuthorisationResult.Allowed(account.EffectivePermissions);
}
\`\`\`

A disabled account now stops working on the **next call**.

## "But that's a database hit per request"

It is, and it's usually a single indexed primary-key lookup — small next to what the request goes on to do. Cache it for a few seconds if you must; a 5-second window is a different proposition from a 60-minute one.

Keep the token for *authentication* — proving who the caller is, which doesn't change mid-session. Look up *authorisation* — what they may currently do, which does.

The question to ask of any auth design: **how long after I click "disable" can this person still act?** If the honest answer is "up to an hour", that's a decision, and it should be one you made on purpose.`,
  },
  {
    slug: "dont-return-html-to-a-fetch",
    title: "Don't Return Your SPA Shell to a fetch()",
    description:
      "A catch-all that serves index.html will happily answer a mistyped API call with HTML. Debugging that costs an afternoon.",
    category: "integration",
    body: `Single-page apps need a catch-all so client routes survive a refresh. \`MapFallbackToFile("index.html")\` does it in one line, and quietly creates a bad failure mode.

## The problem

The fallback matches *everything* unmatched — including \`/api/\` paths. Mistype a route, or call an endpoint removed last sprint, and the server returns **200 OK with an HTML document**.

On the client:

\`\`\`text
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
\`\`\`

Which points at your JSON parser, not at the 404 that actually happened. The status code says success. Your error tracking logs a parse failure. Nobody looks at routing for another hour.

## Exclude the API from the fallback

\`\`\`csharp
app.MapFallback(async context =>
{
    // An unknown API path is a 404 — never the SPA shell.
    if (context.Request.Path.StartsWithSegments("/api"))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    context.Response.ContentType = "text/html";
    await context.Response.SendFileAsync(
        Path.Combine(env.WebRootPath, "index.html"));
});
\`\`\`

Now a wrong endpoint fails as a 404 with no body, which is what the client already knows how to handle.

## The general shape

Any catch-all should be explicit about what it refuses to catch. Fallbacks are written for the common case and then silently handle cases nobody considered.

Worth a smoke test in CI: request \`/api/definitely-not-real\` and assert a 404 with a non-HTML content type. It's two lines and it pins a behaviour that's easy to undo with a routing tweak.`,
  },
  {
    slug: "render-untrusted-documents-dont-execute-them",
    title: "Render Untrusted Documents — Don't Execute Them",
    description:
      "A PDF is a program. Handing a user-uploaded one to the browser's viewer is running a stranger's file inside your session.",
    category: "integration",
    body: `Any system that accepts uploads eventually has to show them back. The convenient options are the dangerous ones.

## The problem

A PDF is not a picture. It's a document format with scripting, embedded files and external references. Point an \`<iframe>\` at an uploaded one and the browser's viewer executes it — in a context that may share an origin with your application.

The same applies to SVG, which is XML that can carry \`<script>\`.

## Paint it, don't run it

Render the PDF yourself, onto a canvas:

\`\`\`ts
// Lazy-loaded: the renderer is a large chunk and most screens never need it.
const pdfjs = await import("pdfjs-dist");

const doc  = await pdfjs.getDocument({ data: bytes }).promise;
const page = await doc.getPage(1);

const viewport = page.getViewport({ scale: 1.5 });
const canvas = canvasRef.current!;
canvas.width  = viewport.width;
canvas.height = viewport.height;

await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
\`\`\`

The output is pixels. Nothing in the file runs.

## The supporting pieces

**Re-type from what you recorded.** Build the blob URL using the MIME type captured at upload — not one echoed back by a remote store, and never the browser's sniffing.

**Keep the download path honest.** The endpoint serving raw bytes should still send \`Content-Disposition: attachment\` so a direct hit downloads rather than renders.

**Keep the CSP tight.** In-app rendering needs \`blob:\` in \`img-src\`/\`frame-src\`. Add it for this and nothing else, and don't loosen \`script-src\` to make a viewer work — that's the whole thing you're avoiding.

The line worth holding: **reading** a document and **running** it are different operations, and only one of them is what the user asked for.`,
  },
];
