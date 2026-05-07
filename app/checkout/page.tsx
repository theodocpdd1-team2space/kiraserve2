"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Info,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const planMap: Record<string, { name: string; price: string; desc: string }> = {
  starter: {
    name: "Starter",
    price: "Rp9.900",
    desc: "Untuk gereja kecil atau tim pelayanan awal.",
  },
  growth: {
    name: "Growth",
    price: "Rp27.900",
    desc: "Untuk gereja aktif dengan operasional pelayanan mingguan.",
  },
  pro: {
    name: "Pro Ministry",
    price: "Rp49.000",
    desc: "Untuk gereja berkembang dengan kebutuhan sistem lengkap.",
  },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planCode = searchParams.get("plan") || "growth";
  const plan = planMap[planCode] || planMap.growth;

  return (
    <main className="min-h-screen bg-white text-[#0B0D0F] selection:bg-[#D4F93A]">
      <nav className="fixed top-0 z-[100] w-full border-b border-black/[0.04] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-[-0.05em]">
            KiraServe<span className="text-[#A3E635]">.</span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <Link href="/pricing" className="text-[13px] font-medium text-black/50 hover:text-black">
              Pricing
            </Link>
            <span className="text-[13px] font-medium text-black">
              Checkout
            </span>
            <Link href={`/activate?plan=${planCode}`} className="text-[13px] font-medium text-black/50 hover:text-black">
              Activation
            </Link>
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full bg-[#0B0D0F] px-5 py-2.5 text-[13px] font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Pricing
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-24 pt-36 md:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D4F93A]/20 blur-[120px]" />

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mx-auto mb-20 max-w-5xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.02] px-4 py-1.5 text-[13px] font-medium">
              <CreditCard className="h-4 w-4 text-[#A3E635]" />
              Checkout dummy
            </div>

            <h1 className="text-5xl font-bold leading-[0.95] tracking-[-0.055em] md:text-7xl lg:text-[100px]">
              Payment link. <br />
              <span className="font-serif italic text-black/30">
                Sedang dirapikan.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-black/50">
              Untuk tahap development, pembayaran belum otomatis. Flow checkout
              tetap dibuat rapi supaya siap disambungkan ke payment gateway.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <motion.section
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6 }}
              className="rounded-[32px] border border-black/[0.08] bg-white p-4 shadow-[0_32px_80px_-45px_rgba(0,0,0,0.35)]"
            >
              <div className="rounded-[24px] bg-[#0B0D0F] p-8 text-white md:p-10">
                <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#D4F93A]">
                  Manual activation
                </p>
                <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-0.04em] md:text-5xl">
                  Link proses pembayaran sedang dalam perbaikan.
                </h2>
                <p className="mt-5 max-w-2xl leading-relaxed text-white/45">
                  Jika ada hal yang ingin ditanyakan, silakan contact support
                  WA 0895345902896.
                </p>
              </div>

              <div className="p-6 md:p-8">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex gap-4">
                    <Info className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
                    <div>
                      <h3 className="font-bold">
                        Payment gateway belum aktif.
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-black/55">
                        Untuk sekarang kamu bisa lanjut aktivasi trial. Kalau
                        butuh bantuan, hubungi support WA{" "}
                        <a
                          href="https://wa.me/62895345902896"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-black underline underline-offset-4"
                        >
                          0895345902896
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <TrustCard icon={LockKeyhole} title="Secure Setup" />
                  <TrustCard icon={ShieldCheck} title="Trial Safe" />
                  <TrustCard icon={Sparkles} title="Manual Ready" />
                </div>

                <Link
                  href={`/activate?plan=${planCode}`}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#D4F93A] px-8 py-4 font-bold text-black transition hover:scale-[1.02]"
                >
                  Lanjut Aktivasi Trial <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="rounded-[32px] border border-black/[0.08] bg-white p-8 shadow-[0_32px_80px_-45px_rgba(0,0,0,0.25)] lg:sticky lg:top-24 lg:self-start"
            >
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/30">
                Order Summary
              </p>

              <h2 className="mt-5 text-5xl font-bold tracking-[-0.05em]">
                {plan.name}
              </h2>

              <p className="mt-4 leading-relaxed text-black/45">{plan.desc}</p>

              <div className="mt-8 rounded-3xl bg-[#0B0D0F] p-6 text-white">
                <div className="flex items-end gap-2">
                  <p className="text-5xl font-bold tracking-[-0.06em] text-[#D4F93A]">
                    {plan.price}
                  </p>
                  <p className="pb-2 text-white/35">/bulan</p>
                </div>

                <div className="mt-7 space-y-4 border-t border-white/10 pt-6 text-sm">
                  <SummaryRow label="Trial" value="14 Hari" />
                  <SummaryRow label="Payment" value="Dummy" />
                  <SummaryRow label="Activation" value="Manual" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Tanpa kartu kredit untuk trial",
                  "Bisa dibantu aktivasi manual",
                  "Siap untuk payment gateway",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4F93A]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-black/55">{item}</span>
                  </div>
                ))}
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function CheckoutLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="rounded-3xl border border-black/[0.08] bg-white p-8 font-bold shadow-xl">
        Loading checkout...
      </div>
    </main>
  );
}

function TrustCard({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#F9FAF9] p-5">
      <Icon className="mb-4 h-5 w-5 text-black/60" />
      <p className="font-semibold">{title}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/35">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}