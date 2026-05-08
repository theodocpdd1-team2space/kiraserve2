import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
  X,
  Network,
} from "lucide-react";
import ChurchAppShell from "@/components/ChurchAppShell";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
  searchParams?: Promise<{
    q?: string;
    add?: string;
    edit?: string;
  }>;
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
  redirect(`/church/${church.slug}/divisions`);
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
  redirect(`/church/${church.slug}/divisions`);
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

export default async function DivisionsPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params;
  const query = (await searchParams) || {};

  const q = query.q?.trim() || "";
  const addOpen = query.add === "1";
  const editId = query.edit || "";

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    include: {
      divisions: {
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { picName: { contains: q, mode: "insensitive" } },
                { picPhone: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: {
              divisionMembers: true,
            },
          },
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

  const editDivision = editId
    ? await db.churchDivision.findFirst({
        where: {
          id: editId,
          churchId: church.id,
        },
      })
    : null;

  const basePath = `/church/${church.slug}/divisions`;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="divisions">
      <div className="pb-28 pt-5 md:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
              Ministry Structure
            </p>
            <h1 className="text-3xl font-black tracking-tight text-black md:text-5xl">
              Divisions
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/50">
              Kelola struktur tim pelayanan, PIC divisi, dan member yang tergabung di tiap divisi.
            </p>
          </div>

          <Link
            href={`${basePath}?add=1`}
            className="font-mono flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-sm hover:bg-black/90"
          >
            <Plus className="h-4 w-4" />
            Add Division
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
          <MetricCard label="Total Divisions" value={String(church._count.divisions)} />
          <MetricCard label="Total Members" value={String(church._count.members)} />
          <MetricCard label="Filtered" value={String(church.divisions.length)} />
        </div>

        <section className="overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 bg-white p-4 md:flex md:items-center md:justify-between md:gap-4 md:p-5">
            <div className="mb-3 md:mb-0">
              <h2 className="text-lg font-black tracking-tight text-black">
                All Divisions{" "}
                <span className="ml-1 text-black/25">{church.divisions.length}</span>
              </h2>
              <p className="text-xs font-medium text-black/40">
                Klik division untuk membuka detail dan assign member.
              </p>
            </div>

            <form action={basePath} className="relative w-full md:w-[340px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search division..."
                className="h-11 w-full rounded-2xl border border-black/10 bg-[#FAFAFA] pl-10 pr-4 text-sm font-medium outline-none placeholder:text-black/30 focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
              />
            </form>
          </div>

          {church.divisions.length > 0 ? (
            <div className="grid gap-3 bg-[#FAFAFA] p-3 md:grid-cols-2 xl:grid-cols-3">
              {church.divisions.map((division) => (
                <DivisionCard
                  key={division.id}
                  tenantSlug={church.slug}
                  division={division}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#FAFAFA] px-6 py-16">
              <EmptyState />
            </div>
          )}
        </section>

        {(addOpen || editDivision) && (
          <ModalShell closeHref={basePath}>
            <div className="mx-auto max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
              <div className="border-b border-black/5 p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-black">
                      {editDivision ? "Edit Division" : "Add Division"}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-black/45">
                      Atur nama divisi dan PIC sementara. Assignment member ada di detail divisi.
                    </p>
                  </div>

                  <Link
                    href={basePath}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black/10"
                  >
                    <X className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <form
                action={editDivision ? updateDivision : createDivision}
                className="grid gap-5 p-5 md:grid-cols-2 md:p-7"
              >
                <input type="hidden" name="tenantSlug" value={church.slug} />
                {editDivision && (
                  <input type="hidden" name="divisionId" value={editDivision.id} />
                )}

                <Field
                  label="Division Name"
                  name="name"
                  placeholder="Multimedia"
                  defaultValue={editDivision?.name || ""}
                  required
                />

                <Field
                  label="PIC Name"
                  name="picName"
                  placeholder="Nama koordinator"
                  defaultValue={editDivision?.picName || ""}
                />

                <Field
                  label="PIC Phone"
                  name="picPhone"
                  placeholder="0812xxxxxxxx"
                  defaultValue={editDivision?.picPhone || ""}
                />

                <div className="col-span-full flex justify-end gap-3 border-t border-black/5 pt-5">
                  <Link
                    href={basePath}
                    className="font-mono flex h-11 items-center justify-center rounded-2xl border border-black/10 bg-white px-5 text-xs font-bold uppercase tracking-[0.1em] text-black hover:bg-black/5"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    className="font-mono flex h-11 items-center justify-center rounded-2xl bg-black px-6 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-black/90"
                  >
                    {editDivision ? "Save" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </ModalShell>
        )}
      </div>
    </ChurchAppShell>
  );
}

function DivisionCard({
  tenantSlug,
  division,
}: {
  tenantSlug: string;
  division: {
    id: string;
    name: string;
    picName: string | null;
    picPhone: string | null;
    createdAt: Date;
    _count: {
      divisionMembers: number;
    };
  };
}) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
            <Network className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-black tracking-tight text-black">
              {division.name}
            </h3>
            <p className="truncate text-sm font-medium text-black/45">
              PIC: {division.picName || "Belum diatur"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Link
            href={`/church/${tenantSlug}/divisions?edit=${division.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
          >
            <Pencil className="h-4 w-4" />
          </Link>

          <form action={deleteDivision}>
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <input type="hidden" name="divisionId" value={division.id} />
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-[#FAFAFA] p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/30">
              Members
            </p>
            <p className="mt-1 text-2xl font-black text-black">
              {division._count.divisionMembers}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/30">
              Phone
            </p>
            <p className="mt-1 truncate text-sm font-bold text-black">
              {division.picPhone || "—"}
            </p>
          </div>
        </div>
      </div>

      <Link
        href={`/church/${tenantSlug}/divisions/${division.id}`}
        className="font-mono flex h-11 items-center justify-center gap-2 rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-black/90"
      >
        Open Detail
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm md:p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/35">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight text-black">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-black/30">
        <UsersRound className="h-6 w-6" />
      </div>
      <p className="text-base font-black text-black">No divisions found</p>
      <p className="mt-1 text-sm font-medium text-black/45">
        Tambahkan divisi seperti Worship, Multimedia, Usher, Kids Ministry, dan lainnya.
      </p>
    </div>
  );
}

function ModalShell({
  children,
  closeHref,
}: {
  children: ReactNode;
  closeHref: string;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
      <Link href={closeHref} className="absolute inset-0" scroll={false} />

      <div className="relative z-10 flex w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-black/45">
        {label}
      </span>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow placeholder:text-black/30 focus:border-black focus:ring-4 focus:ring-black/5"
      />
    </label>
  );
}