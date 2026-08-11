import type { Metadata } from "next";
import Link from "next/link";
import { getAllCaseStudies } from "@/lib/work";

const description =
  "Selected integration work over Microsoft Dynamics 365 Business Central — public-sector ERP, payments and more.";

export const metadata: Metadata = {
  title: "Work",
  description,
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Work — Robert Kamau Njonjo",
    description,
    url: "/work",
  },
};

export default function WorkPage() {
  const studies = getAllCaseStudies();

  return (
    <div className="page">
      <div className="sec-head">
        <div className="eyebrow">/work</div>
        <h1>Selected work</h1>
        <p className="sec-note">{description}</p>
      </div>

      {studies.length === 0 ? (
        <p className="empty-note">Case studies are on the way.</p>
      ) : (
        <div className="work-list">
          {studies.map((study) => (
            <Link
              key={study.slug}
              href={`/work/${study.slug}`}
              className="work-card"
            >
              <div className="work-card-tag">
                <span>{study.sector}</span>
                {study.liveUrl && (
                  <span className="work-live">
                    <span className="dot" />
                    live in production
                  </span>
                )}
              </div>
              <h2 className="work-card-title">{study.title}</h2>
              <p className="work-card-desc">{study.description}</p>
              <div className="work-card-foot">
                <div className="work-card-stack">
                  {study.stack.slice(0, 6).map((tech) => (
                    <span className="chip" key={tech}>
                      {tech}
                    </span>
                  ))}
                </div>
                <span className="work-more">Read the case study →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
