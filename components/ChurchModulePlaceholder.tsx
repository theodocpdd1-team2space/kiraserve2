import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";

type ChurchModulePlaceholderProps = {
  title: string;
  eyebrow: string;
  description: string;
  tenantSlug: string;
  primaryLabel?: string;
  primaryHref?: string;
  features: string[];
};

export default function ChurchModulePlaceholder({
  title,
  eyebrow,
  description,
  tenantSlug,
  primaryLabel = "Back to Dashboard",
  primaryHref,
  features,
}: ChurchModulePlaceholderProps) {
  return (
    <div className="py-8">
      <section className="relative overflow-hidden rounded-[34px] bg-[#D4F93A] p-7 shadow-sm md:p-10">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/35 blur-[60px]" />
        <div className="absolute bottom-[-90px] right-[18%] h-52 w-52 rounded-full bg-black/10 blur-[55px]" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <div className="mb-7 inline-flex items-center rounded-full bg-black/[0.08] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-black/70 backdrop-blur-md">
              <span className="mr-2 flex h-1.5 w-1.5 rounded-full bg-black" />
              {eyebrow}
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.06em] md:text-6xl">
              {title}
            </h1>

            <p className="mt-5 max-w-xl text-sm font-bold leading-relaxed text-black/55 md:text-base">
              {description}
            </p>
          </div>

          <div className="rounded-[28px] bg-black p-6 text-white shadow-[0_24px_80px_-45px_rgba(0,0,0,0.8)]">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
              <Construction className="h-6 w-6" />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
              Development Status
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">
              Module Placeholder
            </h2>

            <p className="mt-3 text-sm font-semibold leading-relaxed text-white/45">
              Halaman ini sudah masuk struktur aplikasi. Fitur lengkap akan
              dibangun bertahap setelah foundation stabil.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[32px] border border-black/[0.055] bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/30">
            Planned Features
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.055em]">
            Yang akan dibangun di modul ini
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature}
                className="rounded-[24px] border border-black/[0.055] bg-[#F8F9F5] p-4"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#D4F93A] text-sm font-black text-black">
                  {index + 1}
                </div>
                <p className="text-sm font-black leading-relaxed text-black">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[32px] border border-black/[0.055] bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/30">
            Next Action
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.055em]">
            Modul sudah siap untuk dikembangkan.
          </h2>

          <p className="mt-3 text-sm font-semibold leading-relaxed text-black/45">
            Route ini sudah tidak 404. Setelah ini, kita bisa bangun fitur
            sebenarnya dengan query tenant-safe berdasarkan slug gereja.
          </p>

          <Link
            href={primaryHref || `/church/${tenantSlug}/dashboard`}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3.5 text-sm font-black text-white"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </section>
    </div>
  );
}