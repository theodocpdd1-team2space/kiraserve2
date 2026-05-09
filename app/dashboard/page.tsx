import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Church, LogOut, UserRound } from "lucide-react";
import {
  getCurrentUser,
  getMembershipHomePath,
  getUserMemberships,
} from "@/lib/auth";
import { logout } from "@/lib/auth-actions";

export default async function WorkspaceDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const memberships = await getUserMemberships(user.id);

  return (
    <main className="min-h-screen bg-[#F6F7F1] px-4 py-8 text-black md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="mb-6 inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4F93A] text-xl font-black text-black">
                K
              </span>
              <span className="text-xl font-black tracking-tight">KiraServe</span>
            </Link>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black/35">
              Workspaces
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
              Pilih workspace
            </h1>
            <p className="mt-2 text-sm font-medium text-black/50">
              Login sebagai {user.name || user.email}
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="font-mono flex h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 text-xs font-bold uppercase tracking-[0.12em] text-black shadow-sm hover:bg-black/5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </header>

        {memberships.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {memberships.map((membership) => (
              <Link
                key={membership.id}
                href={getMembershipHomePath(membership)}
                className="group rounded-[26px] border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
                      <Church className="h-6 w-6" />
                    </div>
                    <h2 className="truncate text-xl font-black tracking-tight text-black">
                      {membership.church.name}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{membership.role.replaceAll("_", " ")}</Badge>
                      <Badge tone={membership.status === "ACTIVE" ? "lime" : "muted"}>
                        {membership.status.replaceAll("_", " ")}
                      </Badge>
                      <Badge tone="muted">
                        {membership.memberCode || "NO NIJ"}
                      </Badge>
                    </div>
                  </div>

                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-black/25 transition group-hover:translate-x-1 group-hover:text-black" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <section className="rounded-[30px] border border-dashed border-black/15 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-black/35">
              <UserRound className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-black">
              Belum terhubung ke church
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-black/50">
              Register sebagai jemaat dengan slug gereja, atau buat workspace
              baru kalau kamu admin gereja.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/register"
                className="font-mono flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-black/90"
              >
                Register Member
              </Link>
              <Link
                href="/activate?plan=growth"
                className="font-mono flex h-11 items-center justify-center rounded-2xl border border-black/10 bg-white px-5 text-xs font-bold uppercase tracking-[0.12em] text-black hover:bg-black/5"
              >
                Create Workspace
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "lime" | "muted";
}) {
  const className =
    tone === "lime"
      ? "border-[#D4F93A] bg-[#D4F93A]/30 text-black"
      : tone === "muted"
        ? "border-black/10 bg-[#FAFAFA] text-black/45"
        : "border-black/70 bg-white text-black";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${className}`}
    >
      {children}
    </span>
  );
}
