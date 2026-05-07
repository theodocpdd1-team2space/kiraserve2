"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

const plans = [
  {
    code: "starter",
    name: "Starter",
    price: "Rp9.900",
    desc: "Untuk gereja kecil atau tim pelayanan yang baru mulai digital.",
    features: [
      "1 Church Workspace",
      "Basic schedule management",
      "Division management",
      "Share jadwal WhatsApp",
      "Google Calendar link",
      "Basic support",
    ],
  },
  {
    code: "growth",
    name: "Growth",
    price: "Rp27.900",
    desc: "Untuk gereja yang aktif mengatur pelayanan mingguan dan koordinasi volunteer.",
    recommended: true,
    features: [
      "Unlimited division",
      "Smart scheduling",
      "Conflict warning",
      "Confirmation attendance",
      "Pretty share link",
      "Data Ministry basic",
      "Priority support",
    ],
  },
  {
    code: "pro",
    name: "Pro Ministry",
    price: "Rp49.000",
    desc: "Untuk gereja berkembang yang butuh event, jemaat, dan laporan lengkap.",
    features: [
      "Advanced smart scheduling",
      "Data Ministry dashboard",
      "Event registration",
      "Manajemen jemaat",
      "Auto nomor jemaat",
      "Export report",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-[#0B0D0F] selection:bg-[#D4F93A]">
      <nav className="fixed top-0 z-[100] w-full border-b border-black/[0.04] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-[-0.05em]">
            KiraServe<span className="text-[#A3E635]">.</span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <Link href="/" className="text-[13px] font-medium text-black/50 hover:text-black">
              Product
            </Link>
            <Link href="/pricing" className="text-[13px] font-medium text-black">
              Pricing
            </Link>
            <Link href="/activate?plan=growth" className="text-[13px] font-medium text-black/50 hover:text-black">
              Activation
            </Link>
          </div>

          <Link
            href="/login"
            className="rounded-full bg-[#0B0D0F] px-5 py-2.5 text-[13px] font-semibold text-white"
          >
            Log in
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-24 pt-36 md:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-16 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D4F93A]/20 blur-[120px]" />

        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-2 text-[13px] font-medium text-black/50 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.02] px-4 py-1.5 text-[13px] font-medium">
              <Sparkles className="h-4 w-4 text-[#A3E635]" />
              Development pricing
            </div>

            <h1 className="text-5xl font-bold leading-[0.95] tracking-[-0.055em] md:text-7xl lg:text-[100px]">
              Pilih plan. <br />
              <span className="font-serif italic text-black/30">
                Aktifkan trial.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-black/50">
              Harga sementara selama KiraServe masih tahap pengembangan.
              Payment masih dummy, tapi flow aktivasi trial sudah siap.
            </p>
          </motion.div>

          <div className="mt-20 grid gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <motion.article
                key={plan.code}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.55 }}
                className={`relative overflow-hidden rounded-[32px] border p-8 transition hover:-translate-y-1 ${
                  plan.recommended
                    ? "border-black bg-[#0B0D0F] text-white shadow-[0_32px_80px_-42px_rgba(0,0,0,0.7)]"
                    : "border-black/[0.08] bg-white text-black shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)]"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#D4F93A]/20 blur-3xl" />
                )}

                <div className="relative">
                  <div
                    className={`mb-7 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${
                      plan.recommended
                        ? "bg-[#D4F93A] text-black"
                        : "bg-black/[0.04] text-black/45"
                    }`}
                  >
                    {plan.recommended ? "Most recommended" : "Monthly"}
                  </div>

                  <h2 className="text-3xl font-bold tracking-[-0.04em]">
                    {plan.name}
                  </h2>

                  <div className="mt-5 flex items-end gap-2">
                    <p
                      className={`text-5xl font-bold tracking-[-0.06em] ${
                        plan.recommended ? "text-[#D4F93A]" : "text-black"
                      }`}
                    >
                      {plan.price}
                    </p>
                    <p className={plan.recommended ? "pb-2 text-white/35" : "pb-2 text-black/35"}>
                      /bulan
                    </p>
                  </div>

                  <p
                    className={`mt-5 min-h-[72px] leading-relaxed ${
                      plan.recommended ? "text-white/45" : "text-black/45"
                    }`}
                  >
                    {plan.desc}
                  </p>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4F93A] text-black">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span
                          className={`text-sm leading-6 ${
                            plan.recommended ? "text-white/65" : "text-black/55"
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/checkout?plan=${plan.code}`}
                    className={`mt-10 flex items-center justify-center gap-2 rounded-full px-6 py-4 font-bold transition ${
                      plan.recommended
                        ? "bg-[#D4F93A] text-black hover:bg-[#C6FF2E]"
                        : "bg-black text-white hover:bg-black/85"
                    }`}
                  >
                    Pilih {plan.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-black/40">
            Harga sementara karena KiraServe masih dalam tahap development.
            Paket, fitur, dan harga dapat berubah mengikuti perkembangan produk.
          </p>
        </div>
      </section>
    </main>
  );
}