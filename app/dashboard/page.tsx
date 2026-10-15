import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <main className="page">
      <Link href="/" className="muted">
        ← Home
      </Link>
      <p className="kicker">Protected route</p>
      <h1 className="display" style={{ fontSize: 80 }}>
        BACK
        <br />
        STAGE
      </h1>
      <div className="panel">
        <p className="lede" style={{ margin: 0 }}>
          This hallway is locked on the server. Google sign-in is the only pass.
        </p>
      </div>
    </main>
  );
}
