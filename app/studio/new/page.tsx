import Link from "next/link";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { PostEditor } from "@/components/studio/PostEditor";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return (
    <>
      <StudioHeader />
      <div className="studio-body">
        <Link href="/studio" className="back-link">
          ← All posts
        </Link>
        <PostEditor />
      </div>
    </>
  );
}
