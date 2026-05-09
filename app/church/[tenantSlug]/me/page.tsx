import Link from "next/link";
import { CalendarCheck, Network, UserRound, MessageSquareText } from "lucide-react";
import ChurchAppShell from "@/components/ChurchAppShell";
import { requireChurchAccess } from "@/lib/church-access";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function MyPortalPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const access = await requireChurchAccess(tenantSlug);
  const member = await db.churchMember.findFirst({
    where: {
      churchId: access.churchId,
      userId: access.userId,
    },
    select: {
      status: true,
      memberCode: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const cards = [
    {
      title: "My Profile",
      desc: "Lihat dan update data profil pribadi.",
      href: `/church/${tenantSlug}/me/profile`,
      icon: UserRound,
    },
    {
      title: "My Divisions",
      desc: "Lihat divisi pelayanan yang kamu ikuti.",
      href: `/church/${tenantSlug}/me/divisions`,
      icon: Network,
    },
    {
      title: "My Schedule",
      desc: "Lihat jadwal pelayanan dan konfirmasi kehadiran.",
      href: `/church/${tenantSlug}/me/schedule`,
      icon: CalendarCheck,
    },
    {
      title: "Feedback",
      desc: "Isi feedback pelayanan dan catatan setelah melayani.",
      href: `/church/${tenantSlug}/me/feedback`,
      icon: MessageSquareText,
    },
  ];

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="me">
      <div className="pb-28 pt-5 md:py-8">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
            Personal Portal
          </p>
          <h1 className="text-3xl font-black tracking-tight text-black md:text-5xl">
            My KiraServe
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/50">
            Portal pribadi untuk jadwal, divisi, availability, dan feedback pelayanan.
          </p>
        </div>

        <div className="mb-5 rounded-[26px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
            Current Role
          </p>
          <p className="mt-1 text-2xl font-black text-black">
            {access.role.replaceAll("_", " ")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="font-mono rounded-full border border-black/10 bg-[#FAFAFA] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black/45">
              {member?.status || "UNKNOWN"}
            </span>
            <span className="font-mono rounded-full border border-black/10 bg-[#FAFAFA] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black/45">
              {member?.memberCode || "NO NIJ"}
            </span>
          </div>
          {member?.status !== "ACTIVE" && (
            <div className="mt-4 rounded-2xl border border-[#D4F93A] bg-[#D4F93A]/25 p-4 text-sm font-bold leading-relaxed text-black">
              Akun kamu sudah terdaftar dan sedang menunggu approval admin.
              NIJ akan muncul setelah admin approve.
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {cards.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-[24px] border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F5EF] text-black transition group-hover:bg-[#D4F93A]">
                  <item.icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="font-black tracking-tight text-black">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-black/45">
                    {item.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ChurchAppShell>
  );
}
