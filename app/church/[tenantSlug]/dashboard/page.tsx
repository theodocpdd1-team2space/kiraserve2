import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Network,
  Settings,
  Sparkles,
  Ticket,
  UsersRound,
} from "lucide-react";
import ChurchAppShell from "@/components/ChurchAppShell";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function ChurchDashboardPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    include: {
      divisions: {
        orderBy: { createdAt: "asc" },
        take: 5,
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          members: true,
          divisions: true,
        },
      },
    },
  });

  if (!church) notFound();

  const subscription = church.subscriptions[0] ?? null;

  const trialText = subscription?.trialEndsAt
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(subscription.trialEndsAt)
    : "Belum diatur";

  const cards = [
    {
      label: "Members",
      value: String(church._count.members),
      note: "Jemaat & pelayan",
      icon: UsersRound,
      href: `/church/${church.slug}/members`,
    },
    {
      label: "Divisions",
      value: String(church._count.divisions),
      note: "Tim ministry aktif",
      icon: Network,
      href: `/church/${church.slug}/divisions`,
    },
    {
      label: "Scheduling",
      value: "Ready",
      note: "Smart scheduling core",
      icon: CalendarCheck,
      href: `/church/${church.slug}/scheduling`,
    },
    {
      label: "Status",
      value: church.status,
      note: "Workspace status",
      icon: Sparkles,
      href: `/church/${church.slug}/settings`,
    },
  ];

  const modules = [
    {
      title: "Members",
      desc: "Kelola jemaat, pelayan, NIJ, dan assignment divisi.",
      href: `/church/${church.slug}/members`,
      icon: UsersRound,
    },
    {
      title: "Divisions",
      desc: "Atur struktur ministry dan koordinator pelayanan.",
      href: `/church/${church.slug}/divisions`,
      icon: Network,
    },
    {
      title: "Scheduling",
      desc: "Jadwal pelayanan, availability, dan date blocking.",
      href: `/church/${church.slug}/scheduling`,
      icon: CalendarCheck,
    },
    {
      title: "Events",
      desc: "Kelola event, registrasi, dan QR check-in.",
      href: `/church/${church.slug}/events`,
      icon: Ticket,
    },
    {
      title: "Data Ministry",
      desc: "Pantau attendance, volunteer rate, dan insight pelayanan.",
      href: `/church/${church.slug}/data-ministry`,
      icon: BarChart3,
    },
    {
      title: "Settings",
      desc: "Atur workspace, NIJ, role, dan preferensi gereja.",
      href: `/church/${church.slug}/settings`,
      icon: Settings,
    },
  ];

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="dashboard">
      <div className="pb-28 pt-5 md:py-8">
        <section className="mb-5 overflow-hidden rounded-[28px] bg-black text-white shadow-sm md:mb-6">
          <div className="relative p-5 md:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D4F93A]/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <div className="font-mono mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#D4F93A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4F93A]" />
                Workspace Overview
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
                <div>
                  <h1 className="max-w-2xl text-3xl font-black leading-[0.98] tracking-tight md:text-6xl">
                    Kelola pelayanan.
                    <span className="block font-light text-white/40">
                      Dalam satu sistem.
                    </span>
                  </h1>

                  <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/50 md:text-base">
                    Workspace aktif untuk mengatur jemaat, divisi, jadwal
                    pelayanan, event, dan data ministry gereja.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                        Current Plan
                      </p>
                      <p className="mt-1 text-2xl font-black tracking-tight text-white">
                        {subscription?.planCode?.toUpperCase() || "TRIAL"}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-2xl bg-black/30 px-3 py-3 text-sm font-medium text-white/55">
                    <Clock3 className="h-4 w-4 text-[#D4F93A]" />
                    Trial ends: {trialText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-[22px] border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F5EF] text-black transition group-hover:bg-[#D4F93A]">
                  <card.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-black/20 transition group-hover:-rotate-45 group-hover:text-black" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/35">
                {card.label}
              </p>
              <p className="mt-1 truncate text-2xl font-black tracking-tight text-black">
                {card.value}
              </p>
              <p className="mt-1 truncate text-xs font-medium text-black/40">
                {card.note}
              </p>
            </Link>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-black">
                  Modul Workspace
                </h2>
                <p className="mt-1 text-xs font-medium text-black/40">
                  Pilih area operasional yang ingin dikerjakan.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {modules.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-[24px] border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F5EF] text-black transition group-hover:bg-[#D4F93A]">
                      <item.icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-black tracking-tight text-black">
                        {item.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed text-black/45">
                        {item.desc}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-black/20 transition group-hover:-rotate-45 group-hover:text-black" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-black">
                    Divisi Pelayanan
                  </h2>
                  <p className="text-xs font-medium text-black/40">
                    Ministry structure
                  </p>
                </div>

                <Link
                  href={`/church/${church.slug}/divisions`}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-white"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-2">
                {church.divisions.length > 0 ? (
                  church.divisions.map((division) => (
                    <div
                      key={division.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAFAFA] p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">
                          {division.name}
                        </p>
                        <p className="truncate text-xs font-medium text-black/40">
                          PIC: {division.picName || "Belum diatur"}
                        </p>
                      </div>

                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#D4F93A]" />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAFA] p-6 text-center">
                    <Network className="mx-auto mb-2 h-6 w-6 text-black/25" />
                    <p className="text-sm font-bold text-black/45">
                      Belum ada divisi.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] bg-[#D4F93A] p-5 text-black shadow-sm">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-black/45">
                Next Core
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Smart Scheduling
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-black/60">
                Setelah members dan division stabil, kita masuk ke date
                blocking, max izin, availability, dan feedback pelayanan.
              </p>

              <Link
                href={`/church/${church.slug}/scheduling`}
                className="font-mono mt-5 inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white"
              >
                Open Scheduling
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </ChurchAppShell>
  );
}