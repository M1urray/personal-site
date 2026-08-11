import type { Metadata } from "next";
import Link from "next/link";
import { RequestTrace } from "@/components/RequestTrace";
import { JsonLd } from "@/components/JsonLd";
import { ContactForm } from "@/components/ContactForm";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { contactFormEnabled, newsletterEnabled } from "@/lib/env";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  jobTitle: siteConfig.role,
  url: siteConfig.url,
  email: `mailto:${siteConfig.email}`,
  telephone: `+${siteConfig.phone.replace(/\D/g, "")}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nairobi",
    addressCountry: "KE",
  },
  sameAs: [siteConfig.links.linkedin, siteConfig.links.github],
  knowsAbout: [
    "Microsoft Dynamics 365 Business Central",
    "AL language",
    "OData",
    "SOAP",
    "ASP.NET Core",
    "API gateway architecture",
    "OAuth 2.0 / OIDC",
    "ERP integration",
  ],
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={personLd} />

      {/* ============ HERO ============ */}
      <header className="hero">
        <div className="hero-grid">
          <div>
            <div className="status">
              <span className="dot" />
              NAIROBI, KENYA — OPEN TO WORK
            </div>
            <h1>
              Robert Kamau<span className="l2">Njonjo</span>
            </h1>
            <p className="lede">
              I connect <em>Microsoft Dynamics&nbsp;365 Business Central</em> to
              everything else.
            </p>
            <p className="sub">
              Four years building the APIs, gateways and portals that let
              organisations actually use the data locked inside their ERP — for
              government, public sector and enterprise clients across Kenya.
            </p>
            <div className="cta-row">
              <Link className="btn btn-solid" href="/work">
                View the work
              </Link>
              <Link className="btn" href="/#contact">
                Get in touch
              </Link>
              {/* Place Robert_Njonjo_CV.pdf in /public and this resolves */}
              <a className="btn" href="/Robert_Njonjo_CV.pdf" download>
                Download CV
              </a>
            </div>
          </div>
          <div>
            <div className="portrait">
              {/*
                SWAP THE PORTRAIT: drop portrait.jpg into /public and replace
                the placeholder below with
                  <img src="/portrait.jpg" alt="Robert Kamau Njonjo" />
                The greyscale + amber duotone treatment is applied by CSS.
              */}
              <div className="portrait-ph">RN</div>
            </div>
            <div className="portrait-cap">FIG. 01 — R. NJONJO</div>
          </div>
        </div>

        {/* ============ SIGNATURE: REQUEST TRACE ============ */}
        <RequestTrace />
      </header>

      {/* ============ PROFILE ============ */}
      <section id="profile">
        <div className="sec-head">
          <div className="eyebrow">/profile</div>
          <h2>What I actually do</h2>
        </div>
        <div className="profile-grid">
          <div className="profile-body">
            <p>
              Most enterprise software problems aren&apos;t hard because the
              code is hard. They&apos;re hard because two systems that were
              never designed to talk to each other have to, and the seam between
              them is where security, reliability and data integrity all get
              decided at once.
            </p>
            <p>
              That seam is my work. I design and build the integration layers
              over Microsoft Dynamics 365 Business Central — AL extensions
              inside the ERP, OData and SOAP services over it, gateway
              architectures in front of it, and the web portals that expose it
              safely to people outside the organisation.
            </p>
            <p>
              I work across the full stack because integration demands it. The
              same problem reaches from an AL codeunit through a .NET service
              and a React front end down to the IIS configuration and the CI
              pipeline that ships it.
            </p>
          </div>
          <div className="spec">
            <div className="spec-row">
              <div className="spec-k">ERP</div>
              <div className="spec-v">
                Dynamics 365 Business Central — AL codeunits, page &amp; table
                extensions, OData v4, SOAP, API pages
              </div>
            </div>
            <div className="spec-row">
              <div className="spec-k">Backend</div>
              <div className="spec-v">
                C#, ASP.NET MVC, ASP.NET Core Web API, .NET Framework, Entity
                Framework, Python
              </div>
            </div>
            <div className="spec-row">
              <div className="spec-k">Frontend</div>
              <div className="spec-v">
                React, TypeScript, Angular, JavaScript
              </div>
            </div>
            <div className="spec-row">
              <div className="spec-k">Architecture</div>
              <div className="spec-v">
                API gateways, OAuth 2.0 / OIDC, role-based access control,
                circuit breakers, response caching
              </div>
            </div>
            <div className="spec-row">
              <div className="spec-k">Infra</div>
              <div className="spec-v">
                Jenkins CI/CD, IIS (ARR, URL Rewrite, SSL), Windows Server,
                WinRM, Docker, Linux
              </div>
            </div>
            <div className="spec-row">
              <div className="spec-k">Data</div>
              <div className="spec-v">SQL Server, PostgreSQL</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ EXPERIENCE ============ */}
      <section id="experience">
        <div className="sec-head">
          <div className="eyebrow">/experience</div>
          <h2>Four years, one specialism</h2>
          <p className="sec-note">
            Every role since 2022 has come back to the same problem — getting
            enterprise systems to exchange data they were never built to share.
          </p>
        </div>

        <div className="roles">
          <article className="role now">
            <div className="role-top">
              <h3 className="role-org">Greencom Enterprise Solutions</h3>
              <div className="role-when">JUL 2024 — PRESENT</div>
            </div>
            <div className="role-title">Software Engineer</div>
            <ul>
              <li>
                <strong>
                  Lead developer on the enterprise ERP ecosystem for the
                  Judiciary of Kenya
                </strong>{" "}
                — a four-application suite covering supplier onboarding and
                procurement, external-entity engagement and contractor
                management, unified behind a central API gateway.
              </li>
              <li>
                <strong>
                  Architected the migration of the supplier procurement portal
                </strong>{" "}
                from a data-replica model to a gateway API model, authoring the
                design covering OAuth 2.0 / OIDC authentication, role-based
                access control, circuit-breaker resilience, response caching and
                a phased delivery roadmap.
              </li>
              <li>
                Designed and built{" "}
                <strong>REST API layers over Business Central</strong> exposing
                ERP data to external-facing portals, with role-scoped access and
                multi-tier approval workflows.
              </li>
              <li>
                Developed and refactored{" "}
                <strong>Business Central AL codeunits</strong> for procurement,
                store requests, petty cash and staff claims — implementing
                idempotent upsert patterns and resolving number-series and
                validation defects.
              </li>
              <li>
                Own <strong>Jenkins CI/CD pipelines</strong> for .NET and React
                deployment to IIS, and SharePoint 2019 document-management
                deployment over WinRM.
              </li>
              <li>
                Administer{" "}
                <strong>
                  IIS infrastructure for client-facing payment services
                </strong>{" "}
                — ARR reverse proxy, URL rewriting, SSL provisioning and DNS
                resolution.
              </li>
              <li>
                Produce architecture documentation and deliver technical
                training to client engineering teams.
              </li>
            </ul>
            <div className="stack">
              <span className="chip">C#</span>
              <span className="chip">AL</span>
              <span className="chip">ASP.NET MVC</span>
              <span className="chip">.NET CORE</span>
              <span className="chip">REACT</span>
              <span className="chip">TYPESCRIPT</span>
              <span className="chip">JENKINS</span>
              <span className="chip">IIS</span>
              <span className="chip">SQL SERVER</span>
            </div>
          </article>

          <article className="role">
            <div className="role-top">
              <h3 className="role-org">Dynasoft Business Solutions</h3>
              <div className="role-when">APR 2024 — JUL 2024</div>
            </div>
            <div className="role-title">
              System Developer — Web &amp; Mobile
            </div>
            <ul>
              <li>
                Built cross-platform web and mobile solutions interfacing with
                Microsoft Dynamics 365 Business Central and NAV web services.
              </li>
              <li>
                Implemented Jenkins CI/CD pipelines, moving the team from weekly
                to daily release cadence.
              </li>
              <li>
                Ran peer code reviews and mentored junior developers in .NET
                Core and Angular.
              </li>
            </ul>
            <div className="stack">
              <span className="chip">.NET CORE</span>
              <span className="chip">ANGULAR</span>
              <span className="chip">DYNAMICS 365</span>
              <span className="chip">JENKINS</span>
            </div>
          </article>

          <article className="role">
            <div className="role-top">
              <h3 className="role-org">DSL Systems and Solutions</h3>
              <div className="role-when">APR 2023 — APR 2024</div>
            </div>
            <div className="role-title">Software Developer</div>
            <ul>
              <li>
                Led integration development against Business Central APIs over
                OData and SOAP for clients across multiple sectors, working end
                to end from requirements through deployment.
              </li>
              <li>
                Introduced Git and GitHub version control with branching and
                code-review standards to a team previously working without
                formal source control.
              </li>
              <li>
                Migrated a .NET API to Docker containers, resolving Business
                Central and Active Directory authentication under Linux hosting.
              </li>
            </ul>
            <div className="stack">
              <span className="chip">ODATA</span>
              <span className="chip">SOAP</span>
              <span className="chip">.NET</span>
              <span className="chip">DOCKER</span>
              <span className="chip">GIT</span>
            </div>
          </article>

          <article className="role">
            <div className="role-top">
              <h3 className="role-org">Kenya Revenue Authority</h3>
              <div className="role-when">JAN 2022 — MAR 2023</div>
            </div>
            <div className="role-title">Junior Software Developer</div>
            <ul>
              <li>
                Built, within a team of five, a data-exchange platform bridging
                KRA and licensed betting operators — enabling automated
                transaction reporting and tax assessment for the sector.
              </li>
              <li>
                Implemented the <strong>KRA TV</strong> feature, delivering
                simplified tax and customs content to taxpayers nationally.
              </li>
            </ul>
            <div className="stack">
              <span className="chip">APACHE NIFI</span>
              <span className="chip">KAFKA</span>
              <span className="chip">C#</span>
              <span className="chip">LINUX</span>
            </div>
          </article>
        </div>
      </section>

      {/* ============ WORK ============ */}
      <section id="work">
        <div className="sec-head">
          <div className="eyebrow">/work</div>
          <h2>Selected work</h2>
        </div>

        <div className="case">
          <div className="case-tag">CASE STUDY — PUBLIC SECTOR ERP</div>
          <h3>Judiciary of Kenya — supplier and procurement ecosystem</h3>
          <p>
            A four-application suite covering supplier onboarding and
            procurement, external-entity engagement and contractor management,
            unified behind a central API gateway with Business Central as the
            system of record. The procurement portal originally ran on a
            replicated copy of ERP data — a model that drifted, aged badly and
            widened the security surface. I architected and led its migration to
            a gateway API: a single authenticated entry point with OAuth 2.0
            token exchange, role-scoped access, circuit-breaker resilience and
            response caching, delivered in phases against a live production
            system.
          </p>
          <a
            className="live"
            href="https://supplier.judiciary.go.ke/"
            target="_blank"
            rel="noopener"
          >
            <span className="dot" />
            supplier.judiciary.go.ke — live in production
          </a>
        </div>

        <div className="mini-grid">
          <div className="mini">
            <h4>Event ticketing and payments platform</h4>
            <p>
              PHP application with Paystack payment integration and QR-code
              ticket generation and validation, delivered for a Nairobi
              hospitality client.
            </p>
          </div>
          <div className="mini">
            <h4>Algorithmic trading indicators</h4>
            <p>
              Pine Script v5 indicators for TradingView — market-structure
              detection, dollar-index supply and demand zone tracking with
              volume confirmation, and multi-confluence signal generation.
            </p>
          </div>
        </div>
      </section>

      {/* ============ WRITING ============ */}
      <section id="writing">
        <div className="sec-head">
          <div className="eyebrow">/writing</div>
          <h2>Notes from the seam</h2>
        </div>
        <div className="writing">
          <h3>In progress</h3>
          <p>
            Working notes on Business Central integration — the specific
            failures, error messages and design decisions that only show up once
            a system is in production. Written for the developer who has just
            pasted an error string into a search bar at 2am.
          </p>
          <div className="topics">
            <span className="topic">
              Authenticating to BC OData from .NET after basic auth
            </span>
            <span className="topic">
              Why you shouldn&apos;t replicate ERP data into your portal
            </span>
            <span className="topic">
              Idempotent upserts and the number series trap
            </span>
            <span className="topic">
              BC inside a Linux container — the AD problem
            </span>
            <span className="topic">OData vs SOAP vs API pages</span>
          </div>
        </div>
        <NewsletterSignup enabled={newsletterEnabled()} />
      </section>

      {/* ============ CONTACT ============ */}
      <section id="contact">
        <div className="sec-head">
          <div className="eyebrow">/contact</div>
          <h2>Available for integration work</h2>
          <p className="sec-note">
            Open to senior engineering and technical lead roles, and to Business
            Central integration projects — including subcontract work for
            implementation partners.
          </p>
        </div>
        <div className="contact-grid">
          <a className="ct" href={`mailto:${siteConfig.email}`}>
            <div className="ct-k">Email</div>
            <div className="ct-v">{siteConfig.email}</div>
          </a>
          <a
            className="ct"
            href={`tel:+${siteConfig.phone.replace(/\D/g, "")}`}
          >
            <div className="ct-k">Phone</div>
            <div className="ct-v">{siteConfig.phoneDisplay}</div>
          </a>
          <a
            className="ct"
            href={siteConfig.links.linkedin}
            target="_blank"
            rel="noopener"
          >
            <div className="ct-k">LinkedIn</div>
            <div className="ct-v">{siteConfig.links.linkedinHandle}</div>
          </a>
          <a
            className="ct"
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener"
          >
            <div className="ct-k">GitHub</div>
            <div className="ct-v">{siteConfig.links.githubHandle}</div>
          </a>
        </div>
        <ContactForm enabled={contactFormEnabled()} />
      </section>
    </>
  );
}
