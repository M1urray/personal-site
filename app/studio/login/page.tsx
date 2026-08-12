import { Suspense } from "react";
import { LoginForm } from "@/components/studio/LoginForm";

// Reads the ?next= param, so it renders per-request rather than at build.
export const dynamic = "force-dynamic";

export default function StudioLoginPage() {
  return (
    <div className="studio-login">
      <div className="studio-login-card">
        <div className="eyebrow">/studio</div>
        <h1 className="studio-login-title">Sign in to write</h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
