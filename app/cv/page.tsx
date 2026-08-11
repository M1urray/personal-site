import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { summary, skills, roles } from "@/lib/resume";

const description =
  "Full CV for Robert Kamau Njonjo — Business Central integration engineer, Nairobi. Four years building APIs, gateways and portals over Microsoft Dynamics 365 Business Central.";

export const metadata: Metadata = {
  title: "CV",
  description,
  alternates: { canonical: "/cv" },
  openGraph: {
    title: "CV — Robert Kamau Njonjo",
    description,
    url: "/cv",
  },
};

export default function CvPage() {
  return (
    <div className="page cv">
      <header className="cv-head">
        <div className="eyebrow">/cv</div>
        <h1>Robert Kamau Njonjo</h1>
        <p className="cv-role">
          {siteConfig.role} · {siteConfig.location}
        </p>
        <div className="cv-contacts">
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          <a href={`tel:+${siteConfig.phone.replace(/\D/g, "")}`}>
            {siteConfig.phoneDisplay}
          </a>
          <a href={siteConfig.links.linkedin} target="_blank" rel="noopener">
            {siteConfig.links.linkedinHandle}
          </a>
          <a href={siteConfig.links.github} target="_blank" rel="noopener">
            {siteConfig.links.githubHandle}
          </a>
        </div>
        <div className="cta-row">
          <a className="btn btn-solid" href="/Robert_Njonjo_CV.pdf" download>
            Download PDF
          </a>
        </div>
      </header>

      <section className="cv-section">
        <h2 className="eyebrow">summary</h2>
        <div className="cv-summary">
          {summary.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      <section className="cv-section">
        <h2 className="eyebrow">skills</h2>
        <div className="spec">
          {skills.map((skill) => (
            <div className="spec-row" key={skill.label}>
              <div className="spec-k">{skill.label}</div>
              <div className="spec-v">{skill.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cv-section">
        <h2 className="eyebrow">experience</h2>
        <div className="roles">
          {roles.map((role) => (
            <article
              className={`role${role.current ? "now" : ""}`}
              key={role.org}
            >
              <div className="role-top">
                <h3 className="role-org">{role.org}</h3>
                <div className="role-when">{role.when}</div>
              </div>
              <div className="role-title">{role.title}</div>
              <ul>
                {role.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
              <div className="stack">
                {role.stack.map((tech) => (
                  <span className="chip" key={tech}>
                    {tech}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
