import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import ChurchAppShell from "@/components/ChurchAppShell";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
    divisionId: string;
  }>;
  searchParams?: Promise<{
    q?: string;
    assign?: string;
  }>;
};

const divisionRoles = ["MEMBER", "COORDINATOR"] as const;

async function assignMember(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const divisionId = String(formData.get("divisionId") || "");
  const churchMemberId = String(formData.get("churchMemberId") || "");
  const role = String(formData.get("role") || "MEMBER");

  if (!tenantSlug || !divisionId || !churchMemberId) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  const division = await db.churchDivision.findFirst({
    where: {
      id: divisionId,
      churchId: church.id,
    },
    select: { id: true },
  });

  const member = await db.churchMember.findFirst({
    where: {
      id: churchMemberId,
      churchId: church.id,
    },
    select: { id: true },
  });

  if (!division || !member) return;

  await db.divisionMember.upsert({
    where: {
      divisionId_churchMemberId: {
        divisionId: division.id,
        churchMemberId: member.id,
      },
    },
    update: {
      role: role as any,
    },
    create: {
      churchId: church.id,
      divisionId: division.id,
      churchMemberId: member.id,
      role: role as any,
    },
  });

  revalidatePath(`/church/${church.slug}/divisions/${division.id}`);
  revalidatePath(`/church/${church.slug}/divisions`);
  revalidatePath(`/church/${church.slug}/members`);
  redirect(`/church/${church.slug}/divisions/${division.id}`);
}

async function updateDivisionMemberRole(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const divisionId = String(formData.get("divisionId") || "");
  const divisionMemberId = String(formData.get("divisionMemberId") || "");
  const role = String(formData.get("role") || "MEMBER");

  if (!tenantSlug || !divisionId || !divisionMemberId) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  await db.divisionMember.updateMany({
    where: {
      id: divisionMemberId,
      churchId: church.id,
      divisionId,
    },
    data: {
      role: role as any,
    },
  });

  revalidatePath(`/church/${church.slug}/divisions/${divisionId}`);
}

async function removeDivisionMember(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const divisionId = String(formData.get("divisionId") || "");
  const divisionMemberId = String(formData.get("divisionMemberId") || "");

  if (!tenantSlug || !divisionId || !divisionMemberId) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  await db.divisionMember.deleteMany({
    where: {
      id: divisionMemberId,
      churchId: church.id,
      divisionId,
    },
  });

  revalidatePath(`/church/${church.slug}/divisions/${divisionId}`);
  revalidatePath(`/church/${church.slug}/members`);
}

export default async function DivisionDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { tenantSlug, divisionId } = await params;
  const query = (await searchParams) || {};
  const q = query.q?.trim() || "";
  const assignOpen = query.assign === "1";

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!church) notFound();

  const division = await db.churchDivision.findFirst({
    where: {
      id: divisionId,
      churchId: church.id,
    },
    include: {
      divisionMembers: {
        orderBy: { createdAt: "asc" },
        include: {
          churchMember: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!division) notFound();

  const existingMemberIds = division.divisionMembers.map(
    (item) => item.churchMemberId
  );

  const availableMembers = await db.churchMember.findMany({
    where: {
      churchId: church.id,
      id: {
        notIn: existingMemberIds.length > 0 ? existingMemberIds : ["__none__"],
      },
      status: {
        not: "ARCHIVED",
      },
      ...(q
        ? {
            OR: [
              { memberCode: { contains: q, mode: "insensitive" } },
              { user: { name: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              { user: { phone: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const coordinatorCount = division.divisionMembers.filter(
    (item) => item.role === "COORDINATOR"
  ).length;

  const basePath = `/church/${church.slug}/divisions/${division.id}`;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="divisions">
      <div className="pb-28 pt-5 md:py-8">
        <div className="mb-6">
          <Link
            href={`/church/${church.slug}/divisions`}
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-black/45 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to divisions
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                Division Detail
              </p>
              <h1 className="text-3xl font-black tracking-tight text-black md:text-5xl">
                {division.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/50">
                Kelola member dalam divisi ini dan role per divisi. Satu orang bisa menjadi coordinator di divisi ini, tapi member di divisi lain.
              </p>
            </div>

            <Link
              href={`${basePath}?assign=1`}
              className="font-mono flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-sm hover:bg-black/90"
            >
              <UserPlus className="h-4 w-4" />
              Assign Member
            </Link>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          <MetricCard label="Members" value={String(division.divisionMembers.length)} />
          <MetricCard label="Coordinators" value={String(coordinatorCount)} />
          <MetricCard label="PIC Name" value={division.picName || "—"} compact />
          <MetricCard label="PIC Phone" value={division.picPhone || "—"} compact />
        </div>

        <section className="overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 bg-white p-4 md:p-5">
            <h2 className="text-lg font-black tracking-tight text-black">
              Division Members{" "}
              <span className="ml-1 text-black/25">
                {division.divisionMembers.length}
              </span>
            </h2>
            <p className="text-xs font-medium text-black/40">
              Role di sini khusus untuk divisi {division.name}.
            </p>
          </div>

          {division.divisionMembers.length > 0 ? (
            <div className="divide-y divide-black/5">
              {division.divisionMembers.map((item) => (
                <DivisionMemberRow
                  key={item.id}
                  tenantSlug={church.slug}
                  divisionId={division.id}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#FAFAFA] px-6 py-16">
              <EmptyState />
            </div>
          )}
        </section>

        {assignOpen && (
          <ModalShell closeHref={basePath}>
            <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
              <div className="border-b border-black/5 p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-black">
                      Assign Member
                    </h2>
                    <p className="mt-1 text-sm font-medium text-black/45">
                      Tambahkan member ke divisi {division.name}.
                    </p>
                  </div>

                  <Link
                    href={basePath}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black/10"
                  >
                    <X className="h-4 w-4" />
                  </Link>
                </div>

                <form action={basePath} className="relative mt-5">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search available member..."
                    className="h-11 w-full rounded-2xl border border-black/10 bg-[#FAFAFA] pl-10 pr-4 text-sm font-medium outline-none placeholder:text-black/30 focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                  <input type="hidden" name="assign" value="1" />
                </form>
              </div>

              <div className="max-h-[58vh] overflow-y-auto bg-[#FAFAFA] p-3">
                {availableMembers.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {availableMembers.map((member) => (
                      <AvailableMemberCard
                        key={member.id}
                        tenantSlug={church.slug}
                        divisionId={division.id}
                        member={member}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-14">
                    <EmptyAvailableState />
                  </div>
                )}
              </div>
            </div>
          </ModalShell>
        )}
      </div>
    </ChurchAppShell>
  );
}

function DivisionMemberRow({
  tenantSlug,
  divisionId,
  item,
}: {
  tenantSlug: string;
  divisionId: string;
  item: any;
}) {
  const user = item.churchMember.user;

  return (
    <div className="grid gap-4 bg-white p-4 md:grid-cols-[1fr_220px_96px] md:items-center md:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={user.name || user.email} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-tight text-black">
            {user.name || "-"}
          </p>
          <p className="truncate text-xs font-medium text-black/45">
            {user.email}
          </p>
          <div className="mt-1">
            <MonoPill>{item.churchMember.memberCode || "NO NIJ"}</MonoPill>
          </div>
        </div>
      </div>

      <form action={updateDivisionMemberRole} className="flex gap-2">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        <input type="hidden" name="divisionId" value={divisionId} />
        <input type="hidden" name="divisionMemberId" value={item.id} />

        <select
          name="role"
          defaultValue={item.role}
          className="h-10 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[#FAFAFA] px-3 text-sm font-medium outline-none focus:border-black focus:bg-white"
        >
          {divisionRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="font-mono h-10 rounded-2xl bg-black px-4 text-xs font-bold uppercase tracking-[0.1em] text-white"
        >
          Save
        </button>
      </form>

      <form action={removeDivisionMember} className="md:justify-self-end">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        <input type="hidden" name="divisionId" value={divisionId} />
        <input type="hidden" name="divisionMemberId" value={item.id} />

        <button
          type="submit"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-bold text-red-600 hover:bg-red-100 md:w-10 md:px-0"
        >
          <Trash2 className="h-4 w-4" />
          <span className="md:hidden">Remove</span>
        </button>
      </form>
    </div>
  );
}

function AvailableMemberCard({
  tenantSlug,
  divisionId,
  member,
}: {
  tenantSlug: string;
  divisionId: string;
  member: any;
}) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={member.user.name || member.user.email} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-tight text-black">
            {member.user.name || "-"}
          </p>
          <p className="truncate text-xs font-medium text-black/45">
            {member.user.email}
          </p>
          <div className="mt-1">
            <MonoPill>{member.memberCode || "NO NIJ"}</MonoPill>
          </div>
        </div>
      </div>

      <form action={assignMember} className="grid gap-2">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        <input type="hidden" name="divisionId" value={divisionId} />
        <input type="hidden" name="churchMemberId" value={member.id} />

        <select
          name="role"
          defaultValue="MEMBER"
          className="h-11 rounded-2xl border border-black/10 bg-[#FAFAFA] px-3 text-sm font-medium outline-none focus:border-black focus:bg-white"
        >
          {divisionRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="font-mono flex h-11 items-center justify-center gap-2 rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-black/90"
        >
          <Plus className="h-4 w-4" />
          Assign
        </button>
      </form>
    </div>
  );
}

function MetricCard({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm md:p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/35">
        {label}
      </p>
      <p
        className={`mt-1 truncate font-black tracking-tight text-black ${
          compact ? "text-base" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D4F93A] text-sm font-black text-black shadow-sm">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function MonoPill({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono inline-flex max-w-full items-center rounded-xl border border-black/10 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black/45">
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-black/30">
        <UsersRound className="h-6 w-6" />
      </div>
      <p className="text-base font-black text-black">No member assigned</p>
      <p className="mt-1 text-sm font-medium text-black/45">
        Klik Assign Member untuk menambahkan orang ke divisi ini.
      </p>
    </div>
  );
}

function EmptyAvailableState() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-black/30">
        <Crown className="h-6 w-6" />
      </div>
      <p className="text-base font-black text-black">No available member</p>
      <p className="mt-1 text-sm font-medium text-black/45">
        Semua member sudah masuk divisi ini atau hasil pencarian kosong.
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <Link href={closeHref} className="absolute inset-0" scroll={false} />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}