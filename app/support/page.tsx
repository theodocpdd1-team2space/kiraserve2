"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
  Timer,
} from "lucide-react";

const faqs = [
  {
    q: "Apakah KiraServe bisa dipakai untuk gereja kecil?",
    a: "Bisa. KiraServe fleksibel untuk gereja kecil, komunitas, ministry team, sampai gereja dengan banyak divisi.",
  },
  {
    q: "Apakah ada trial gratis?",
    a: "Ada. Akun gereja baru bisa mencoba KiraServe dengan trial 14 hari sebelum memilih paket berbayar.",
  },
  {
    q: "Apakah payment sudah aktif?",
    a: "Untuk saat ini payment masih dummy/manual. Aktivasi bisa dibantu lewat support.",
  },
  {
    q: "Apakah bisa request fitur?",
    a: "Bisa. Karena KiraServe masih tahap development, masukan dari gereja sangat membantu prioritas fitur berikutnya.",
  },
];

const topics = [
  "Aktivasi akun gereja",
  "Pertanyaan pricing",
  "Masalah login",
  "Request fitur",
  "Setup divisi",
  "Integrasi payment",
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#0B0D0F] selection:bg-[#D4F93A] selection:text-black">
      {/* Ultra Clean Navbar */}
      <nav className="fixed top-0 z-[100] w-full border-b border-black/[0.03] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            KiraServe<span className="text-[#A3E635]">.</span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {["Product", "Pricing", "Activation"].map((item) => (
              <Link
                key={item}
                href={item === "Activation" ? "/activate?plan=growth" : `/${item.toLowerCase()}`}
                className="text-[13px] font-medium text-black/50 transition hover:text-black"
              >
                {item}
              </Link>
            ))}
            <span className="text-[13px] font-bold text-black underline decoration-[#D4F93A] decoration-2 underline-offset-8">
              Support
            </span>
          </div>

          <Link
            href="/pricing"
            className="rounded-full bg-[#0B0D0F] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-black/80"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero & Form Section */}
      <section className="relative px-6 pb-24 pt-32 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="group mb-12 inline-flex items-center gap-2 text-[13px] font-medium text-black/40 transition hover:text-black"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 max-w-4xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-black/[0.02] px-4 py-1.5 text-[13px] font-medium">
              <Sparkles className="h-4 w-4 text-[#A3E635]" />
              KiraServe Help Center
            </div>

            <h1 className="text-5xl font-bold leading-[0.95] tracking-[-0.04em] md:text-7xl lg:text-[96px]">
              Ada yang bisa <br />
              <span className="font-serif italic text-black/30">
                kami bantu?
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-black/50">
              Tanya soal aktivasi workspace, pricing, setup divisi, login,
              atau request fitur. Tim KiraServe akan bantu secepat mungkin.
            </p>
          </motion.div>

          {/* 
            Grid Layout diperbaiki: 
            Kiri (Form) lebih lebar, Kanan (Sidebar Kontak) lengket saat discroll 
          */}
          <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Form Area */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-sm"
            >
              <div className="bg-[#0B0D0F] p-8 text-white md:p-10">
                <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#D4F93A]">
                  Contact Support
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Ceritakan kebutuhan gerejamu.
                </h2>
                <p className="mt-4 max-w-xl leading-relaxed text-white/50">
                  Form ini masih dummy untuk UI. Setelah backend aktif, pesan
                  bisa dikirim ke email support atau dashboard admin.
                </p>
              </div>

              <form className="space-y-6 p-8 md:p-10">
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Nama Lengkap" placeholder="Nama kamu" />
                  <Field label="Nama Gereja" placeholder="Nama gereja" />
                </div>

                <Field label="Email Bisnis" placeholder="nama@email.com" type="email" />

                <div className="space-y-2">
                  <label className="text-[13px] font-bold uppercase tracking-wider text-black/50">
                    Topik Bantuan
                  </label>
                  <select className="w-full appearance-none rounded-xl border border-black/[0.08] bg-[#F9FAF9] px-5 py-4 text-[15px] outline-none transition focus:border-black focus:bg-white focus:ring-4 focus:ring-[#D4F93A]/20">
                    <option>Pilih topik...</option>
                    {topics.map((topic) => (
                      <option key={topic}>{topic}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold uppercase tracking-wider text-black/50">
                    Pesan Detail
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tulis pertanyaan atau kebutuhan kamu di sini..."
                    className="w-full resize-none rounded-xl border border-black/[0.08] bg-[#F9FAF9] px-5 py-4 text-[15px] outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white focus:ring-4 focus:ring-[#D4F93A]/20"
                  />
                </div>

                <div className="flex flex-col gap-5 pt-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    className="inline-flex w-fit items-center gap-3 rounded-full bg-[#D4F93A] px-8 py-4 font-bold text-black transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Kirim Pertanyaan
                    <Send className="h-4 w-4" />
                  </button>

                  <p className="text-[13px] font-medium leading-relaxed text-black/40">
                    Atau email langsung ke{" "}
                    <a
                      href="mailto:support@kiraserve.com"
                      className="font-bold text-black hover:underline underline-offset-4"
                    >
                      support@kiraserve.com
                    </a>
                  </p>
                </div>
              </form>
            </motion.section>

            {/* Sidebar Area (Sticky) */}
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="space-y-6 lg:sticky lg:top-28"
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                <ContactCard
                  icon={Mail}
                  title="Email Support"
                  value="support@kiraserve.com"
                  desc="Untuk pertanyaan detail, aktivasi manual, dan request fitur."
                  href="mailto:support@kiraserve.com"
                />

                <ContactCard
                  icon={MessageCircle}
                  title="WhatsApp"
                  value="0895345902896"
                  desc="Untuk respon cepat seputar aktivasi, trial, dan demo singkat."
                  href="https://wa.me/62895345902896"
                />

                <ContactCard
                  icon={Timer}
                  title="Response Time"
                  value="Development Support"
                  desc="Respon diprioritaskan untuk user trial dan aktivasi."
                  className="md:col-span-2 lg:col-span-1"
                />
              </div>

              {/* Tips Box */}
              <div className="rounded-[24px] border border-black/[0.06] bg-white p-7 shadow-sm">
                <h3 className="text-xl font-bold tracking-tight">
                  Tips biar cepat dibantu
                </h3>
                <div className="mt-5 space-y-4">
                  {[
                    "Sebutkan nama gereja dan paket yang dipilih.",
                    "Jelaskan kendala dengan singkat dan jelas.",
                    "Kirim screenshot jika ada error.",
                    "Untuk request fitur, jelaskan workflow pelayanan yang ingin dibantu.",
                  ].map((item) => (
                    <div key={item} className="flex gap-3">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D4F93A] text-black">
                        <ArrowRight className="h-2.5 w-2.5" />
                      </span>
                      <p className="text-[14px] leading-relaxed text-black/60">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* FAQ Section Bento Style */}
      <section className="bg-[#0B0D0F] px-6 py-24 text-white md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.2em] text-[#D4F93A]">
              Frequently Asked Questions
            </p>
            <h2 className="text-4xl font-bold tracking-[-0.03em] md:text-5xl lg:text-6xl">
              Pertanyaan yang sering muncul.
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-[24px] bg-white/10 md:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-[#0B0D0F] p-8 transition duration-300 hover:bg-white/[0.03] md:p-10"
              >
                <HelpCircle className="mb-6 h-6 w-6 text-[#D4F93A]" />
                <h3 className="text-xl font-bold tracking-[-0.02em]">
                  {faq.q}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-white/50">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl rounded-[32px] bg-[#D4F93A] p-10 md:p-16 lg:p-20">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <h2 className="text-4xl font-bold leading-[1.1] tracking-[-0.03em] md:text-5xl lg:text-6xl">
              Belum yakin paket mana yang cocok?
            </h2>
            <div>
              <p className="text-lg leading-relaxed text-black/70">
                Hubungi support, ceritakan ukuran gereja dan kebutuhan
                pelayanan. Kami bantu arahkan paket dan flow aktivasi yang
                paling pas.
              </p>
              <a
                href="mailto:support@kiraserve.com"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0B0D0F] px-8 py-4 font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
              >
                Email Support
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="border-t border-black/[0.04] bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-bold tracking-tighter">
              KiraServe<span className="text-[#A3E635]">.</span>
            </p>
            <p className="mt-1 text-[13px] font-medium text-black/40">
              Powered by CVisual.
            </p>
          </div>

          <div className="flex flex-col gap-1 text-[13px] font-medium text-black/50 md:items-end">
            <a href="mailto:support@kiraserve.com" className="transition hover:text-black">
              support@kiraserve.com
            </a>
            <a
              href="https://wa.me/62895345902896"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-black"
            >
              WA 0895345902896
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Reusable Components Refined for Precision

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-bold uppercase tracking-wider text-black/50">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/[0.08] bg-[#F9FAF9] px-5 py-4 text-[15px] outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white focus:ring-4 focus:ring-[#D4F93A]/20"
      />
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  value,
  desc,
  href,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  desc: string;
  href?: string;
  className?: string;
}) {
  const content = (
    <div className={`flex h-full flex-col justify-between rounded-[24px] border border-black/[0.06] bg-white p-7 transition duration-300 hover:border-black/20 hover:shadow-lg hover:shadow-black/5 ${className}`}>
      <div>
        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4F93A]/20 text-[#84CC16]">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/40">
          {title}
        </p>
        <h3 className="mt-2 text-xl font-bold tracking-tight text-black">
          {value}
        </h3>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-black/50">{desc}</p>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="block h-full"
      >
        {content}
      </a>
    );
  }

  return content;
}