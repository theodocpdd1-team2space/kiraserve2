import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CreditCard,
  Database,
  Home,
  MoreHorizontal,
  Network,
  Plus,
  Settings,
  Ticket,
  UsersRound,
} from "lucide-react";
import { db } from "@/lib/db";

type ChurchAppShellProps = {
  tenantSlug: string;
  active: string;
  children: React.ReactNode;
};

const navItems = [
  { title: "Dashboard", href: "dashboard", icon: Home },
  { title: "Members", href: "members", icon: UsersRound },
  { title: "Divisions", href: "divisions", icon: Network },
  { title: "Scheduling", href: "scheduling", icon: CalendarCheck },
  { title: "Events", href: "events", icon: Ticket },
  { title: "Data Ministry", href: "data-ministry", icon: BarChart3 },
  { title: "Billing", href: "billing", icon: CreditCard },
  { title: "Settings", href: "settings", icon: Settings },
];

export default async function ChurchAppShell({
  tenantSlug,
  active,
  children,
}: ChurchAppShellProps) {
  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!church) notFound();

  const activeSubscription = church.subscriptions[0] ?? null;

  const trialEndsText = activeSubscription?.trialEndsAt
    ? new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(activeSubscription.trialEndsAt)
    : "-";

  return (
    <main className="min-h-screen bg-[#F6F7F1] text-[#0B0D0F] selection:bg-[#D4F93A] selection:text-black">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-[284px] border-r border-black/[0.06] bg-white p-5 lg:flex lg:flex-col">
          <Link
            href="/"
            className="mb-8 flex items-center gap-3 rounded-[24px] px-2 py-2"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#D4F93A] text-black shadow-sm">
              <span className="text-2xl font-black tracking-[-0.12em]">
                K
              </span>
            </div>

            <div>
              <p className="text-xl font-black tracking-[-0.05em] text-black">
                KiraServe
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/35">
                Church OS
              </p>
            </div>
          </Link>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = item.href === active;

              return (
                <Link
                  key={item.href}
                  href={`/church/${church.slug}/${item.href}`}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition-all ${
                    isActive
                      ? "bg-[#0B0D0F] text-[#D4F93A] shadow-[0_16px_40px_-24px_rgba(0,0,0,0.8)]"
                      : "text-black/55 hover:bg-black/[0.045] hover:text-black"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-[26px] bg-[#0B0D0F] p-5 text-white">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
                <Database className="h-5 w-5" />
              </div>

              <p className="text-base font-black tracking-[-0.04em]">
                Trial aktif
              </p>

              <p className="mt-2 text-xs leading-relaxed text-white/45">
                Trial berakhir pada{" "}
                <span className="font-black text-white">{trialEndsText}</span>.
              </p>

              <Link
                href={`/church/${church.slug}/billing`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D4F93A] px-4 py-3 text-sm font-black text-black transition hover:scale-[1.015]"
              >
                Upgrade Plan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="px-2 text-[11px] font-bold leading-relaxed text-black/35">
              Powered by CVisual · KiraServe Development Build
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 pb-28 lg:pl-[284px] lg:pb-10">
          <header className="sticky top-0 z-40 border-b border-black/[0.05] bg-[#F6F7F1]/82 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-5 py-5 md:px-8 xl:px-12">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/35">
                  Workspace
                </p>
                <h1 className="mt-1 truncate text-2xl font-black tracking-[-0.055em] md:text-3xl">
                  {church.name}
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/c/${church.slug}`}
                  className="hidden items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-black text-black shadow-sm ring-1 ring-black/[0.06] transition hover:bg-black/[0.04] md:flex"
                >
                  Public Page
                </Link>

                <Link
                  href="/dashboard"
                  className="hidden rounded-full bg-black px-5 py-2.5 text-sm font-black text-white md:inline-flex"
                >
                  Workspaces
                </Link>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D4F93A] text-black shadow-sm ring-1 ring-black/[0.06]">
                  <span className="font-black">
                    {church.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className="px-5 md:px-8 xl:px-12">{children}</div>
        </section>

        <nav className="fixed bottom-5 left-1/2 z-50 flex w-[90%] max-w-[420px] -translate-x-1/2 items-center justify-between rounded-[32px] bg-[#070A0D]/95 px-4 py-3 shadow-[0_22px_55px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl lg:hidden">
          <MobileNavIcon
            href={`/church/${church.slug}/dashboard`}
            active={active === "dashboard"}
            icon={Home}
          />
          <MobileNavIcon
            href={`/church/${church.slug}/members`}
            active={active === "members"}
            icon={UsersRound}
          />

          <Link
            href={`/church/${church.slug}/scheduling`}
            className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4F93A] text-black shadow-lg shadow-[#D4F93A]/20 active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={3} />
          </Link>

          <MobileNavIcon
            href={`/church/${church.slug}/scheduling`}
            active={active === "scheduling"}
            icon={CalendarCheck}
          />
          <MobileNavIcon
            href={`/church/${church.slug}/settings`}
            active={active === "settings"}
            icon={MoreHorizontal}
          />
        </nav>
      </div>
    </main>
  );
}

function MobileNavIcon({
  href,
  icon: Icon,
  active,
}: {
  href: string;
  icon: React.ElementType;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center p-2 transition ${
        active ? "text-[#D4F93A]" : "text-white/40 hover:text-white"
      }`}
    >
      <Icon className="h-6 w-6" strokeWidth={active ? 2.6 : 2} />
    </Link>
  );
}