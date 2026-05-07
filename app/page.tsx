"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Database,
  Globe2,
  MessageCircle,
  MousePointer2,
  Network,
  ShieldCheck,
  Ticket,
} from "lucide-react";

const navItems = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "/pricing" },
  { label: "Activation", href: "/activate?plan=growth" },
  { label: "Support", href: "/support" },
];

const stats = [
  { label: "Total Members", value: "1,248", growth: "+8.5%" },
  { label: "Active Volunteers", value: "356", growth: "+12.1%" },
  { label: "Upcoming Events", value: "8", growth: "+14.3%" },
  { label: "Attendance", value: "842", growth: "+6.7%" },
];

const features = [
  {
    icon: CalendarCheck,
    title: "Smart Scheduling",
    desc: "Automated ministry rotations, serving role matching, conflict warning, and volunteer confirmations.",
  },
  {
    icon: Database,
    title: "Manajemen Jemaat",
    desc: "Centralized member database for families, service history, pastoral notes, and church identity numbers.",
  },
  {
    icon: Ticket,
    title: "Event Registration",
    desc: "Registration forms, QR tickets, digital check-in, and exportable participant data.",
  },
  {
    icon: BarChart3,
    title: "Data Ministry",
    desc: "Granular insights into attendance, ministry growth, volunteer engagement, and service activity.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#0B0D0F] selection:bg-[#D4F93A] selection:text-black">
      <nav className="fixed top-0 z-[100] w-full border-b border-black/[0.04] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-[-0.05em]">
            KiraServe<span className="text-[#A3E635]">.</span>
          </Link>

          <div className="hidden items-center gap-9 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[13px] font-medium text-black/55 transition hover:text-black"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden text-[13px] font-medium text-black/55 transition hover:text-black sm:block"
            >
              Log in
            </Link>
            <Link
              href="/pricing"
              className="rounded-full bg-[#0B0D0F] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-black/80"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-28 pt-40 md:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-24 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[#D4F93A]/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 top-96 h-[420px] w-[420px] rounded-full bg-black/[0.03] blur-[100px]" />

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.02] px-4 py-1.5 text-[13px] font-medium text-black/70">
              <span className="flex h-2 w-2 rounded-full bg-[#A3E635]" />
              New: Church workspace activation flow
            </div>

            <h1 className="max-w-5xl text-5xl font-bold leading-[0.95] tracking-[-0.055em] md:text-7xl lg:text-[104px]">
              Fokus pelayanan. <br />
              <span className="font-serif italic text-black/30">
                Sistem urus sisanya.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-black/50">
              KiraServe adalah sistem operasi pelayanan gereja modern. Kelola
              jadwal, jemaat, event, warta, dan data ministry dalam satu
              interface yang bersih, cepat, dan presisi.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 rounded-full bg-[#D4F93A] px-8 py-4 font-bold text-black transition hover:scale-[1.02] active:scale-[0.98]"
              >
                Coba Gratis 14 Hari <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#product"
                className="rounded-full border border-black/10 bg-white px-8 py-4 font-bold transition hover:bg-black/[0.02]"
              >
                Lihat Produk
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 38 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.75 }}
            className="relative mt-24"
          >
            <div className="absolute -inset-5 bg-gradient-to-b from-[#D4F93A]/25 to-transparent opacity-60 blur-3xl" />

            <div className="relative rounded-[34px] border border-black/[0.08] bg-white p-4 shadow-[0_32px_90px_-40px_rgba(0,0,0,0.28)]">
              <div className="overflow-hidden rounded-[26px] border border-black/[0.06] bg-[#F8F9F6]">
                <div className="flex h-12 items-center justify-between border-b border-black/[0.06] bg-white px-6">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                  </div>
                  <div className="hidden rounded-full bg-[#D4F93A] px-3 py-1 text-[11px] font-bold text-black md:block">
                    Live System
                  </div>
                </div>

                <div className="grid lg:grid-cols-[250px_1fr]">
                  <aside className="hidden border-r border-black/[0.06] bg-white p-6 lg:block">
                    <div className="mb-8 text-lg font-bold tracking-[-0.04em]">
                      KiraServe
                    </div>
                    <div className="space-y-2">
                      {[
                        "Dashboard",
                        "Scheduling",
                        "Members",
                        "Events",
                        "Reports",
                      ].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                            index === 0
                              ? "bg-[#D4F93A] text-black"
                              : "text-black/40"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div className="p-6 md:p-8">
                    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-black/35">
                          Grace Community Church
                        </p>
                        <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] md:text-4xl">
                          Sunday Service Dashboard
                        </h2>
                      </div>
                      <button className="w-fit rounded-full bg-black px-4 py-2 text-[12px] font-semibold text-white">
                        Send Reminder
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {stats.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-black/[0.06] bg-white p-4"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/30">
                            {item.label}
                          </p>
                          <div className="mt-4 flex items-end justify-between gap-3">
                            <p className="text-3xl font-bold tracking-[-0.05em]">
                              {item.value}
                            </p>
                            <p className="rounded-full bg-[#D4F93A]/30 px-2 py-1 text-[11px] font-bold text-lime-700">
                              {item.growth}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                      <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
                        <div className="mb-5 flex items-center justify-between">
                          <h3 className="text-xl font-bold tracking-[-0.04em]">
                            Upcoming Services
                          </h3>
                          <span className="text-[12px] font-semibold text-black/40">
                            View all
                          </span>
                        </div>

                        <div className="space-y-3">
                          {[
                            ["SUN 25", "Sunday Worship Service", "Confirmed"],
                            ["SUN 01", "Youth & Young Adults", "Pending"],
                            ["WED 04", "Midweek Bible Study", "Confirmed"],
                          ].map(([date, title, status]) => (
                            <div
                              key={title}
                              className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8F9F6] p-4"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-14 items-center justify-center rounded-xl bg-[#D4F93A] text-center text-xs font-bold">
                                  {date}
                                </div>
                                <div>
                                  <p className="font-semibold">{title}</p>
                                  <p className="text-sm text-black/40">
                                    09:00 AM • Main Sanctuary
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`hidden rounded-full px-3 py-1 text-[12px] font-bold md:block ${
                                  status === "Pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-lime-100 text-lime-700"
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#0B0D0F] p-5 text-white">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold tracking-[-0.04em]">
                            Confirmation
                          </h3>
                          <MousePointer2 className="h-4 w-4 text-[#D4F93A]" />
                        </div>

                        <div className="mx-auto mt-7 flex h-36 w-36 items-center justify-center rounded-full border-[14px] border-[#D4F93A]">
                          <div className="text-center">
                            <p className="text-4xl font-bold tracking-[-0.05em]">
                              78%
                            </p>
                            <p className="text-xs text-white/40">Confirmed</p>
                          </div>
                        </div>

                        <div className="mt-7 space-y-3 text-sm">
                          <ConfirmRow label="Confirmed" value="278" />
                          <ConfirmRow label="Pending" value="63" muted />
                          <ConfirmRow label="Not Responded" value="15" muted />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <MiniPanel icon={Globe2} title="Smart Warta" />
                      <MiniPanel icon={Network} title="Divisions" />
                      <MiniPanel icon={ShieldCheck} title="Tenant Safe" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="product" className="bg-[#0B0D0F] py-32 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 max-w-3xl">
            <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.22em] text-[#D4F93A]">
              Product System
            </p>
            <h2 className="text-4xl font-bold tracking-[-0.04em] md:text-6xl">
              Dibuat untuk gereja yang ingin bergerak lebih cepat.
            </h2>
          </div>

          <div className="grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <div
                key={item.title}
                className="bg-[#0B0D0F] p-10 transition hover:bg-white/[0.025]"
              >
                <item.icon className="mb-8 h-8 w-8 text-[#D4F93A]" />
                <h3 className="mb-4 text-xl font-bold">{item.title}</h3>
                <p className="text-[15px] leading-relaxed text-white/50">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-28">
        <div className="mx-auto max-w-7xl rounded-[34px] bg-[#D4F93A] p-10 md:p-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <h2 className="text-4xl font-bold tracking-[-0.04em] md:text-6xl">
              Siap membuat pelayanan lebih teratur?
            </h2>
            <div>
              <p className="text-lg leading-relaxed text-black/60">
                Mulai dari trial gratis. Pilih paket, lanjut checkout dummy,
                lalu aktifkan workspace gereja dalam beberapa langkah.
              </p>
              <Link
                href="/pricing"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 text-sm font-bold text-white transition hover:scale-[1.02]"
              >
                Pilih Paket <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/[0.05] bg-white py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-xl font-bold tracking-[-0.05em]">KiraServe</p>
            <p className="mt-3 text-sm text-black/40">
              Powered by CVisual.
            </p>
          </div>

          <a
            href="https://wa.me/62895345902896"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-black/50 hover:text-black"
          >
            <MessageCircle className="h-4 w-4" />
            Support WA 0895345902896
          </a>
        </div>
      </footer>
    </main>
  );
}

function ConfirmRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={muted ? "text-white/35" : "text-white/70"}>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function MiniPanel({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
      <Icon className="mb-3 h-5 w-5 text-black/60" />
      <p className="font-semibold">{title}</p>
    </div>
  );
}