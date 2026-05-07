import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import ChurchAppShell from "@/components/ChurchAppShell";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

async function createDivision(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const name = String(formData.get("name") || "").trim();
  const picName = String(formData.get("picName") || "").trim();
  const picPhone = String(formData.get("picPhone") || "").trim();

  if (!tenantSlug || !name) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  await db.churchDivision.create({
    data: {
      churchId: church.id,
      name,
      picName: picName || null,
      picPhone: picPhone || null,
    },
  });

  revalidatePath(`/church/${church.slug}/divisions`);
  revalidatePath(`/church/${church.slug}/dashboard`);
}

async function updateDivision(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const divisionId = String(formData.get("divisionId") || "");
  const name = String(formData.get("name") || "").trim();
  const picName = String(formData.get("picName") || "").trim();
  const picPhone = String(formData.get("picPhone") || "").trim();

  if (!tenantSlug || !divisionId || !name) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  await db.churchDivision.updateMany({
    where: {
      id: divisionId,
      churchId: church.id,
    },
    data: {
      name,
      picName: picName || null,
      picPhone: picPhone || null,
    },
  });

  revalidatePath(`/church/${church.slug}/divisions`);
  revalidatePath(`/church/${church.slug}/dashboard`);
}

async function deleteDivision(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const divisionId = String(formData.get("divisionId") || "");

  if (!tenantSlug || !divisionId) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  await db.churchDivision.deleteMany({
    where: {
      id: divisionId,
      churchId: church.id,
    },
  });

  revalidatePath(`/church/${church.slug}/divisions`);
  revalidatePath(`/church/${church.slug}/dashboard`);
}

export default async function DivisionsPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    include: {
      divisions: {
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          divisions: true,
          members: true,
        },
      },
    },
  });

  if (!church) notFound();

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="divisions">
      <div className="py-8">
        <section className="relative overflow-hidden rounded-[34px] bg-[#D4F93A] p-7 shadow-sm md:p-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/35 blur-[60px]" />
          <div className="absolute bottom-[-90px] right-[18%] h-52 w-52 rounded-full bg-black/10 blur-[55px]" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <div className="mb-7 inline-flex items-center rounded-full bg-black/[0.08] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-black/70 backdrop-blur-md">
                <span className="mr-2 flex h-1.5 w-1.5 rounded-full bg-black" />
                Divisions
              </div>

              <h1 className="max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.06em] md:text-6xl">
                Struktur pelayanan.
                <br />
                <span className="text-black/38">Lebih rapi.</span>
              </h1>

              <p className="mt-5 max-w-xl text-sm font-bold leading-relaxed text-black/55 md:text-base">
                Divisi adalah fondasi KiraServe. Dari sini nanti kita sambungkan
                members, serving roles, koordinator, dan smart scheduling.
              </p>
            </div>

            <div className="rounded-[28px] bg-black p-6 text-white shadow-[0_24px_80px_-45px_rgba(0,0,0,0.8)]">
              <ShieldCheck className="mb-5 h-7 w-7 text-[#D4F93A]" />

              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                Tenant Safe
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">
                {church._count.divisions} divisi aktif
              </h2>

              <p className="mt-3 text-sm font-semibold leading-relaxed text-white/45">
                Semua data divisi dibatasi berdasarkan workspace{" "}
                <span className="font-black text-white">{church.slug}</span>.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="rounded-[32px] border border-black/[0.055] bg-white p-6 shadow-sm xl:sticky xl:top-28 xl:self-start">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
              <Plus className="h-6 w-6" />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/30">
              Add Division
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.055em]">
              Tambah divisi baru.
            </h2>

            <p className="mt-3 text-sm font-semibold leading-relaxed text-black/45">
              Contoh: Worship, Multimedia, Usher, Kids Ministry, Youth, Prayer,
              Hospitality, dan lainnya.
            </p>

            <form action={createDivision} className="mt-6 space-y-4">
              <input type="hidden" name="tenantSlug" value={church.slug} />

              <Field
                label="Nama Divisi"
                name="name"
                placeholder="Contoh: Multimedia"
                required
              />

              <Field
                label="Nama PIC / Koordinator"
                name="picName"
                placeholder="Contoh: Theo Filus"
              />

              <Field
                label="Nomor PIC"
                name="picPhone"
                placeholder="Contoh: 0895xxxxxxxx"
              />

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
              >
                Tambah Divisi
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </aside>

          <div className="rounded-[32px] border border-black/[0.055] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/30">
                  Division List
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.055em]">
                  Divisi pelayanan
                </h2>
              </div>

              <div className="rounded-full bg-[#F8F9F5] px-4 py-2 text-xs font-black text-black/45">
                {church.divisions.length} total division
              </div>
            </div>

            {church.divisions.length > 0 ? (
              <div className="space-y-4">
                {church.divisions.map((division, index) => (
                  <article
                    key={division.id}
                    className="rounded-[28px] border border-black/[0.055] bg-[#F8F9F5] p-5"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4F93A] text-sm font-black text-black">
                          {index + 1}
                        </div>

                        <div>
                          <h3 className="text-xl font-black tracking-[-0.045em]">
                            {division.name}
                          </h3>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-black/30">
                            Division ID: {division.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      <form action={deleteDivision}>
                        <input
                          type="hidden"
                          name="tenantSlug"
                          value={church.slug}
                        />
                        <input
                          type="hidden"
                          name="divisionId"
                          value={division.id}
                        />

                        <button
                          type="submit"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-500 ring-1 ring-black/[0.055] transition hover:bg-red-50"
                          title="Delete division"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>

                    <form
                      action={updateDivision}
                      className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                      <input type="hidden" name="tenantSlug" value={church.slug} />
                      <input
                        type="hidden"
                        name="divisionId"
                        value={division.id}
                      />

                      <InlineField
                        label="Nama Divisi"
                        name="name"
                        defaultValue={division.name}
                        required
                      />

                      <InlineField
                        label="PIC"
                        name="picName"
                        defaultValue={division.picName || ""}
                        placeholder="Belum diatur"
                      />

                      <InlineField
                        label="Nomor PIC"
                        name="picPhone"
                        defaultValue={division.picPhone || ""}
                        placeholder="Belum diatur"
                      />

                      <button
                        type="submit"
                        className="mt-6 inline-flex h-[46px] items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-black text-white transition hover:scale-[1.01] md:mt-auto"
                      >
                        Save
                        <Pencil className="h-4 w-4" />
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-black/10 bg-[#F8F9F5] p-8 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#D4F93A] text-black">
                  <Building2 className="h-8 w-8" />
                </div>

                <h3 className="text-2xl font-black tracking-[-0.05em]">
                  Belum ada divisi.
                </h3>

                <p className="mt-3 max-w-md text-sm font-semibold leading-relaxed text-black/45">
                  Tambahkan divisi pertama supaya nanti bisa dipakai untuk
                  members, serving roles, dan smart scheduling.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[32px] bg-black p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D4F93A]">
                Next Step
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.055em]">
                Setelah divisi aman, lanjut ke Members Basic.
              </h2>

              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-white/45">
                Members akan dihubungkan ke divisi. Setelah itu kita bisa buat
                Serving Roles dan Smart Scheduling dengan suggested member.
              </p>
            </div>

            <a
              href={`/church/${church.slug}/members`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#D4F93A] px-6 py-4 text-sm font-black text-black"
            >
              Go to Members
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>
    </ChurchAppShell>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-black/60">
        {label}
      </span>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-black/[0.075] bg-[#F8F9F5] px-4 py-3.5 text-sm font-bold outline-none transition placeholder:text-black/25 focus:border-black focus:bg-white focus:ring-4 focus:ring-[#D4F93A]/25"
      />
    </label>
  );
}

function InlineField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-black/30">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-black/[0.075] bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:text-black/25 focus:border-black focus:ring-4 focus:ring-[#D4F93A]/25"
      />
    </label>
  );
}