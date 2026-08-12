import Link from "next/link";

export function StudioHeader() {
  return (
    <header className="studio-bar">
      <div className="studio-bar-in">
        <Link href="/studio" className="nav-id">
          R.<b>STUDIO</b>
        </Link>
        <div className="studio-bar-actions">
          <Link href="/writing" className="studio-bar-link">
            view site
          </Link>
          <form action="/api/studio/logout" method="post">
            <button type="submit" className="studio-bar-link as-button">
              sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
