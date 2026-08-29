import Link from "next/link";
import { redirect } from "next/navigation";
import { getMessages, getSessionUser } from "@/lib/data";
import { ClientThread } from "@/components/ClientThread";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const messages = await getMessages(session.user.id);

  return (
    <main className="page-pad" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 56px)" }}>
      <div className="flex items-center gap-3">
        <Link href="/app" style={{ fontSize: "var(--text-sm)", color: "var(--text-accent)" }}>
          ← Home
        </Link>
        <h1 style={{ fontSize: "var(--text-lg)" }}>Nicole</h1>
      </div>
      <ClientThread clientId={session.user.id} initial={messages} />
    </main>
  );
}
