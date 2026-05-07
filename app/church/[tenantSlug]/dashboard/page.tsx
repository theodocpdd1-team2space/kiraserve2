import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CreditCard,
  Network,
  Plus,
  Sparkles,
  Ticket,
  UsersRound,
} from "lucide-react";
import ChurchAppShell from "@/components/ChurchAppShell";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

const moduleItems = [
  { title: "Members", href: "members", icon: UsersRound },
  { title: "Divisions", href: "divisions", icon: Network },
  { title: "Scheduling", href: "scheduling", icon: CalendarCheck },
  { title: "Events", href: "events", icon: Ticket },
  { title: "Data Ministry", href: "data-ministry", icon: BarChart3 },
];

export default async function ChurchDashboardPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    include: {
      divisions: {
        orderBy: { createdAt: "asc" },
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

  const activeSubscription = church.subscriptions[0] ?? null;

  const trialEndsText = activeSubscription?.trialEndsAt
    ? new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(activeSubscription.trialEndsAt)
    : "-";

  const stats = [
    {
      label: "Total Relawan",
      value: String(church._count.members),
      note: "User & jemaat",
      icon: UsersRound,
      variant: "white",
    },
    {
      label: "Divisi Aktif",
      value: String(church._count.divisions),
      note: "Tim ministry",
      icon: Network,
      variant: "black",
    },
    {
      label: "Plan",
      value: activeSubscription?.planCode?.toUpperCase() || "-",
      note: activeSubscription?.status || "No subscription",
      icon: CreditCard,
      variant: "white",
    },
    {
      label: "Workspace",
      value: church.status,
      note: "Status tenant",
      icon: Sparkles,
      variant: "lime",
    },
  ];

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="dashboard">
      <div className="py-8">
        <section className="relative overflow-hidden rounded-[34px] bg-[#D4F93A] p-7 shadow-sm md:p-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/35 blur-[60px]" />
          <div className="absolute bottom-[-90px] right-[18%] h-52 w-52 rounded-full bg-black/10 blur-[55px]" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_330px] lg:items-end">
            <div>
              <div className="mb-7 inline-flex items-center rounded-full bg-black/[0.08] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-black/70 backdrop-blur-md">
                <span className="mr-2 flex h-1.5 w-1.5 rounded-full bg-black" />
                Overview
              </div>

              <h2 className="max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.06em] md:text-6xl">
                Kelola relawan.
                <br />
                <span className="text-black/38">Super mudah.</span>
              </h2>

              <p className="mt-5 max-w-xl text-sm font-bold leading-relaxed text-black/55 md:text-base">
                Workspace aktif. Pantau jadwal pelayanan, absensi, divisi,
                event, dan data ministry dari satu dashboard.
              </p>
            </div>

            <div className="rounded-[28px] bg-black p-6 text-white shadow-[0_24px_80px_-45px_rgba(0,0,0,0.8)]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                Tenant Slug
              </p>
              <p className="mt-3 break-words text-2xl font-black tracking-[-0.05em]">
                {church.slug}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <MiniInfo label="PIC" value={church.picName || "-"} />
                <MiniInfo label="Trial" value={trialEndsText} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              note={stat.note}
              icon={stat.icon}
              variant={stat.variant}
            />
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/35">
                  Modules
                </p>
                <h3 className="mt-1 text-2xl font-black tracking-[-0.055em]">
                  Modul Workspace
                </h3>
              </div>

              <Link
                href={`/church/${church.slug}/scheduling`}
                className="hidden items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-black text-white md:inline-flex"
              >
                Buat Jadwal
                <Plus className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {moduleItems.map((action) => (
                <Link
                  key={action.href}
                  href={`/church/${church.slug}/${action.href}`}
                  className="group flex items-center gap-4 rounded-[26px] border border-black/[0.055] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_24px_70px_-50px_rgba(0,0,0,0.38)]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[19px] bg-[#F0F2EA] text-black transition-colors group-hover:bg-[#D4F93A]">
                    <action.icon className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-black tracking-[-0.035em] text-black">
                      {action.title}
                    </h4>
                    <p className="truncate text-xs font-semibold text-black/38">
                      {getActionDescription(action.href)}
                    </p>
                  </div>

                  <ArrowRight className="h-5 w-5 shrink-0 text-black/12 transition group-hover:-rotate-45 group-hover:text-black" />
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-[30px] border border-black/[0.055] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/30">
                    Next Recommendation
                  </p>
                  <h3 className="mt-2 text-xl font-black tracking-[-0.05em]">
                    Lengkapi data divisi dan mulai buat jadwal pelayanan.
                  </h3>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-black/45">
                    Setelah divisi dan pelayan dimasukkan, KiraServe bisa mulai
                    membantu scheduling, confirmation, dan data ministry.
                  </p>
                </div>

                <Link
                  href={`/church/${church.slug}/divisions`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#D4F93A] px-6 py-4 text-sm font-black text-black"
                >
                  Setup Divisions
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-black/[0.055] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/30">
                    Divisions
                  </p>
                  <h3 className="mt-1 text-2xl font-black tracking-[-0.055em]">
                    Divisi Pelayanan
                  </h3>
                </div>

                <Link
                  href={`/church/${church.slug}/divisions`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {church.divisions.length > 0 ? (
                  church.divisions.slice(0, 5).map((division, index) => (
                    <div
                      key={division.id}
                      className="flex items-center justify-between rounded-[22px] bg-[#F8F9F5] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4F93A] text-sm font-black text-black">
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-sm font-black text-black">
                            {division.name}
                          </p>
                          <p className="text-xs font-semibold text-black/38">
                            PIC: {division.picName || "Belum diatur"}
                          </p>
                        </div>
                      </div>

                      <div className="h-2.5 w-2.5 rounded-full bg-[#D4F93A]" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-[#F8F9F5] py-10 text-center">
                    <Network className="mb-3 h-7 w-7 text-black/20" />
                    <p className="text-sm font-black text-black/42">
                      Belum ada divisi
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] bg-[#0B0D0F] p-6 text-white shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D4F93A]">
                Billing
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.055em]">
                {activeSubscription?.planCode?.toUpperCase() || "TRIAL"}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-white/45">
                Trial aktif sampai {trialEndsText}. Payment masih mode
                dummy/manual selama development.
              </p>

              <Link
                href={`/church/${church.slug}/billing`}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D4F93A] px-5 py-3.5 text-sm font-black text-black"
              >
                Manage Billing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </ChurchAppShell>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ElementType;
  variant: string;
}) {
  const isBlack = variant === "black";
  const isLime = variant === "lime";

  return (
    <div
      className={`flex min-h-[158px] flex-col justify-between rounded-[28px] border p-5 shadow-sm transition active:scale-[0.98] ${
        isBlack
          ? "border-transparent bg-[#070A0D] text-white"
          : isLime
            ? "border-transparent bg-[#D4F93A] text-black"
            : "border-black/[0.055] bg-white text-black"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[16px] ${
            isBlack
              ? "bg-white/10 text-[#D4F93A]"
              : isLime
                ? "bg-black/10 text-black"
                : "bg-black/[0.045] text-black"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div>
        <p className="text-3xl font-black tracking-[-0.055em]">{value}</p>
        <p
          className={`mt-1 text-[10px] font-black uppercase tracking-[0.18em] ${
            isBlack ? "text-white/45" : "text-black/38"
          }`}
        >
          {label}
        </p>
        <p
          className={`mt-2 text-xs font-semibold ${
            isBlack ? "text-white/35" : "text-black/38"
          }`}
        >
          {note}
        </p>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/8 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>
      <p className="mt-1 line-clamp-1 text-xs font-black text-white">{value}</p>
    </div>
  );
}

function getActionDescription(href: string) {
  const map: Record<string, string> = {
    members: "Kelola database jemaat & relawan.",
    divisions: "Atur tim & struktur ministry.",
    scheduling: "Jadwal pelayanan rutin.",
    events: "Registrasi & QR check-in event.",
    "data-ministry": "Statistik & laporan kehadiran.",
  };

  return map[href] || "Kelola modul KiraServe.";
}