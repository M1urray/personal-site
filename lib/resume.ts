/**
 * Structured CV content. Drives the /cv page, the generated PDF and the
 * homepage profile, so all three stay in step.
 */

export const summary: string[] = [
  "Most business software isn’t hard because the code is hard. It’s hard because it has to fit how an organisation actually works — its approval chains, its exceptions, and the ERP it already runs on.",
  "That fit is my work. I build custom systems in .NET — line-of-business applications, APIs and the web portals customers and suppliers log into. Where those systems meet Microsoft Dynamics 365 Business Central, I build the integration layer too: AL extensions inside the ERP, OData and SOAP services over it, gateways in front of it.",
  "I work across the full stack because the problems do. One feature can run from a C# domain model through an API and a React front end, down to the IIS configuration and the CI pipeline that ships it.",
];

export type Skill = { label: string; value: string };

export const skills: Skill[] = [
  {
    label: "Backend",
    value:
      "C#, ASP.NET MVC, ASP.NET Core Web API, .NET Framework, Entity Framework, Python",
  },
  { label: "Frontend", value: "React, TypeScript, Angular, JavaScript" },
  {
    label: "ERP",
    value:
      "Dynamics 365 Business Central — AL codeunits, page & table extensions, OData v4, SOAP, API pages",
  },
  {
    label: "Architecture",
    value:
      "API gateways, OAuth 2.0 / OIDC, role-based access control, circuit breakers, response caching",
  },
  {
    label: "Infra",
    value:
      "Jenkins CI/CD, IIS (ARR, URL Rewrite, SSL), Windows Server, WinRM, Docker, Linux",
  },
  { label: "Data", value: "SQL Server, PostgreSQL" },
];

export type Role = {
  org: string;
  title: string;
  when: string;
  current?: boolean;
  bullets: string[];
  stack: string[];
};

export const roles: Role[] = [
  {
    org: "Greencom Enterprise Solutions",
    title: "Software Engineer",
    when: "JUL 2024 — PRESENT",
    current: true,
    bullets: [
      "Lead developer on the enterprise ERP ecosystem for the Judiciary of Kenya — a four-application suite covering supplier onboarding and procurement, external-entity engagement and contractor management, unified behind a central API gateway.",
      "Architected the migration of the supplier procurement portal from a data-replica model to a gateway API model, authoring the design covering OAuth 2.0 / OIDC authentication, role-based access control, circuit-breaker resilience, response caching and a phased delivery roadmap.",
      "Designed and built REST API layers over Business Central exposing ERP data to external-facing portals, with role-scoped access and multi-tier approval workflows.",
      "Developed and refactored Business Central AL codeunits for procurement, store requests, petty cash and staff claims — implementing idempotent upsert patterns and resolving number-series and validation defects.",
      "Own Jenkins CI/CD pipelines for .NET and React deployment to IIS, and SharePoint 2019 document-management deployment over WinRM.",
      "Administer IIS infrastructure for client-facing payment services — ARR reverse proxy, URL rewriting, SSL provisioning and DNS resolution.",
      "Produce architecture documentation and deliver technical training to client engineering teams.",
    ],
    stack: [
      "C#",
      "AL",
      "ASP.NET MVC",
      ".NET CORE",
      "REACT",
      "TYPESCRIPT",
      "JENKINS",
      "IIS",
      "SQL SERVER",
    ],
  },
  {
    org: "Dynasoft Business Solutions",
    title: "System Developer — Web & Mobile",
    when: "APR 2024 — JUL 2024",
    bullets: [
      "Built cross-platform web and mobile solutions interfacing with Microsoft Dynamics 365 Business Central and NAV web services.",
      "Implemented Jenkins CI/CD pipelines, moving the team from weekly to daily release cadence.",
      "Ran peer code reviews and mentored junior developers in .NET Core and Angular.",
    ],
    stack: [".NET CORE", "ANGULAR", "DYNAMICS 365", "JENKINS"],
  },
  {
    org: "DSL Systems and Solutions",
    title: "Software Developer",
    when: "APR 2023 — APR 2024",
    bullets: [
      "Led integration development against Business Central APIs over OData and SOAP for clients across multiple sectors, working end to end from requirements through deployment.",
      "Introduced Git and GitHub version control with branching and code-review standards to a team previously working without formal source control.",
      "Migrated a .NET API to Docker containers, resolving Business Central and Active Directory authentication under Linux hosting.",
    ],
    stack: ["ODATA", "SOAP", ".NET", "DOCKER", "GIT"],
  },
  {
    org: "Kenya Revenue Authority",
    title: "Junior Software Developer",
    when: "JAN 2022 — MAR 2023",
    bullets: [
      "Built, within a team of five, a data-exchange platform bridging KRA and licensed betting operators — enabling automated transaction reporting and tax assessment for the sector.",
      "Implemented the KRA TV feature, delivering simplified tax and customs content to taxpayers nationally.",
    ],
    stack: ["APACHE NIFI", "KAFKA", "C#", "LINUX"],
  },
];
