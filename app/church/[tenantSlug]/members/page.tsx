import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  Archive,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import ChurchAppShell from "@/components/ChurchAppShell";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
  searchParams?: Promise<{
    q?: string;
    status?: string;
    role?: string;
    division?: string;
    edit?: string;
    add?: string;
    filters?: string;
  }>;
};

const churchRoles = [
  "MEMBER",
  "SERVANT",
  "DIVISION_COORDINATOR",
  "CHURCH_ADMIN",
] as const;

const memberStatuses = ["INVITED", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;
const divisionRoles = ["MEMBER", "COORDINATOR"] as const;

function buildMemberCode(prefix: string, nextNumber: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(nextNumber).padStart(4, "0")}`;
}

function makePrefix(churchName: string, churchSlug: string) {
  const fromName = churchName
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 5);

  if (fromName.length >= 2) return fromName;

  return churchSlug.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 5);
}

function queryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });

  const output = search.toString();
  return output ? `?${output}` : "";
}

async function createMember(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const manualMemberCode = String(formData.get("memberCode") || "")
    .trim()
    .toUpperCase();
  const role = String(formData.get("role") || "MEMBER");
  const status = String(formData.get("status") || "ACTIVE");
  const divisionId = String(formData.get("divisionId") || "");
  const divisionRole = String(formData.get("divisionRole") || "MEMBER");

  if (!tenantSlug || !name || !email) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      memberCodePrefix: true,
      memberCodeNextNumber: true,
      memberCodeMode: true,
    },
  });

  if (!church) return;

  let memberCode: string | null = manualMemberCode || null;
  let shouldIncrementCode = false;

  if (church.memberCodeMode === "AUTO_GENERATE" && !memberCode) {
    const prefix =
      church.memberCodePrefix || makePrefix(church.name, church.slug);
    memberCode = buildMemberCode(prefix, church.memberCodeNextNumber);
    shouldIncrementCode = true;
  }

  if (church.memberCodeMode === "MANUAL" && !memberCode) return;

  const user = await db.user.upsert({
    where: { email },
    update: {
      name,
      phone: phone || null,
    },
    create: {
      name,
      email,
      phone: phone || null,
    },
  });

  const churchMember = await db.churchMember.upsert({
    where: {
      churchId_userId: {
        churchId: church.id,
        userId: user.id,
      },
    },
    update: {
      role: role as any,
      status: status as any,
      ...(memberCode ? { memberCode } : {}),
    },
    create: {
      churchId: church.id,
      userId: user.id,
      memberCode,
      role: role as any,
      status: status as any,
    },
  });

  if (shouldIncrementCode) {
    await db.church.update({
      where: { id: church.id },
      data: {
        memberCodePrefix:
          church.memberCodePrefix || makePrefix(church.name, church.slug),
        memberCodeNextNumber: {
          increment: 1,
        },
      },
    });
  }

  if (divisionId) {
    const division = await db.churchDivision.findFirst({
      where: {
        id: divisionId,
        churchId: church.id,
      },
      select: { id: true },
    });

    if (division) {
      await db.divisionMember.upsert({
        where: {
          divisionId_churchMemberId: {
            divisionId: division.id,
            churchMemberId: churchMember.id,
          },
        },
        update: {
          role: divisionRole as any,
        },
        create: {
          churchId: church.id,
          divisionId: division.id,
          churchMemberId: churchMember.id,
          role: divisionRole as any,
        },
      });
    }
  }

  revalidatePath(`/church/${church.slug}/members`);
  revalidatePath(`/church/${church.slug}/dashboard`);
  redirect(`/church/${church.slug}/members`);
}

async function updateMember(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const churchMemberId = String(formData.get("churchMemberId") || "");
  const userId = String(formData.get("userId") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const memberCode = String(formData.get("memberCode") || "")
    .trim()
    .toUpperCase();
  const role = String(formData.get("role") || "MEMBER");
  const status = String(formData.get("status") || "ACTIVE");
  const divisionId = String(formData.get("divisionId") || "");
  const divisionRole = String(formData.get("divisionRole") || "MEMBER");

  if (!tenantSlug || !churchMemberId || !userId || !name || !email) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  const existingEmail = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingEmail && existingEmail.id !== userId) return;

  if (memberCode) {
    const existingCode = await db.churchMember.findFirst({
      where: {
        churchId: church.id,
        memberCode,
        NOT: { id: churchMemberId },
      },
      select: { id: true },
    });

    if (existingCode) return;
  }

  await db.user.updateMany({
    where: {
      id: userId,
      churchMembers: {
        some: {
          id: churchMemberId,
          churchId: church.id,
        },
      },
    },
    data: {
      name,
      email,
      phone: phone || null,
    },
  });

  await db.churchMember.updateMany({
    where: {
      id: churchMemberId,
      churchId: church.id,
    },
    data: {
      memberCode: memberCode || null,
      role: role as any,
      status: status as any,
    },
  });

  if (divisionId) {
    const division = await db.churchDivision.findFirst({
      where: {
        id: divisionId,
        churchId: church.id,
      },
      select: { id: true },
    });

    if (division) {
      await db.divisionMember.upsert({
        where: {
          divisionId_churchMemberId: {
            divisionId: division.id,
            churchMemberId,
          },
        },
        update: {
          role: divisionRole as any,
        },
        create: {
          churchId: church.id,
          divisionId: division.id,
          churchMemberId,
          role: divisionRole as any,
        },
      });
    }
  }

  revalidatePath(`/church/${church.slug}/members`);
  revalidatePath(`/church/${church.slug}/dashboard`);
  redirect(`/church/${church.slug}/members`);
}

async function archiveMember(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const churchMemberId = String(formData.get("churchMemberId") || "");

  if (!tenantSlug || !churchMemberId) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  await db.churchMember.updateMany({
    where: {
      id: churchMemberId,
      churchId: church.id,
    },
    data: {
      status: "ARCHIVED",
    },
  });

  revalidatePath(`/church/${church.slug}/members`);
  revalidatePath(`/church/${church.slug}/dashboard`);
}

export default async function MembersPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params;
  const query = (await searchParams) || {};

  const q = query.q?.trim() || "";
  const selectedStatus = query.status || "";
  const selectedRole = query.role || "";
  const selectedDivision = query.division || "";
  const editId = query.edit || "";
  const addOpen = query.add === "1";
  const filtersOpen = query.filters === "1";

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    include: {
      divisions: {
        orderBy: { createdAt: "asc" },
      },
      members: {
        where: {
          ...(selectedStatus ? { status: selectedStatus as any } : {}),
          ...(selectedRole ? { role: selectedRole as any } : {}),
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
          ...(selectedDivision
            ? {
                divisionMembers: {
                  some: {
                    divisionId: selectedDivision,
                  },
                },
              }
            : {}),
        },
        orderBy: { createdAt: "asc" },
        include: {
          user: true,
          divisionMembers: {
            include: {
              division: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!church) notFound();

  const visibleMembers = church.members.filter(
    (member) => member.status !== "ARCHIVED" || selectedStatus === "ARCHIVED"
  );

  const activeCount = church.members.filter((m) => m.status === "ACTIVE").length;
  const servantCount = church.members.filter((m) => m.role === "SERVANT").length;
  const coordinatorCount = church.members.filter(
    (m) =>
      m.role === "DIVISION_COORDINATOR" ||
      m.divisionMembers.some((dm) => dm.role === "COORDINATOR")
  ).length;

  const editMember = editId
    ? await db.churchMember.findFirst({
        where: {
          id: editId,
          churchId: church.id,
        },
        include: {
          user: true,
          divisionMembers: {
            include: {
              division: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      })
    : null;

  const primaryDivision = editMember?.divisionMembers[0] ?? null;
  const basePath = `/church/${church.slug}/members`;

  const filterCount = [q, selectedStatus, selectedRole, selectedDivision].filter(
    Boolean
  ).length;

  const closeFiltersUrl = `${basePath}${queryString({
    q,
    status: selectedStatus,
    role: selectedRole,
    division: selectedDivision,
  })}`;

  const openFiltersUrl = `${basePath}${queryString({
    q,
    status: selectedStatus,
    role: selectedRole,
    division: selectedDivision,
    filters: "1",
  })}`;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="members">
      <div className="pb-28 pt-5 md:py-8">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
              People Database
            </p>
            <h1 className="text-3xl font-black tracking-tight text-black md:text-5xl">
              Members
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/50">
              Kelola jemaat, pelayan, NIJ, role sistem, dan assignment divisi.
            </p>
          </div>

          <div className="flex w-full gap-2 md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Link
                href={openFiltersUrl}
                className="font-mono flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-xs font-bold uppercase tracking-[0.08em] text-black shadow-sm transition hover:bg-black/[0.03] md:w-auto"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {filterCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D4F93A] px-1.5 text-[10px] font-black text-black">
                    {filterCount}
                  </span>
                )}
              </Link>

              {filtersOpen && (
                <>
                  <Link
                    href={closeFiltersUrl}
                    className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm md:hidden"
                    scroll={false}
                  />

                  <div className="fixed bottom-0 left-0 right-0 z-[80] max-h-[90vh] overflow-y-auto rounded-t-[28px] border-t border-black/10 bg-white shadow-2xl md:absolute md:bottom-auto md:left-auto md:right-0 md:top-[calc(100%+12px)] md:w-[360px] md:rounded-2xl md:border">
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/95 px-5 py-4 backdrop-blur">
                      <Link
                        href={basePath}
                        className="font-mono rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-black shadow-sm hover:bg-black/5"
                        scroll={false}
                      >
                        Clear
                      </Link>

                      <h2 className="text-lg font-black tracking-tight text-black">
                        Filters
                      </h2>

                      <Link
                        href={closeFiltersUrl}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black/10"
                        scroll={false}
                      >
                        <X className="h-4 w-4" />
                      </Link>
                    </div>

                    <form action={basePath} className="space-y-5 p-6 pb-10 md:pb-6">
                      <FilterGroup title="Search">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                          <input
                            name="q"
                            defaultValue={q}
                            placeholder="Name, email, WA, NIJ..."
                            className="h-11 w-full rounded-2xl border border-black/10 bg-[#FAFAFA] pl-10 pr-4 text-sm font-medium outline-none placeholder:text-black/30 focus:border-black focus:bg-white focus:ring-4 focus:ring-[#D4F93A]/20"
                          />
                        </div>
                      </FilterGroup>

                      <FilterGroup title="Status">
                        <FilterSelect name="status" defaultValue={selectedStatus}>
                          <option value="">All status</option>
                          {memberStatuses.map((item) => (
                            <option key={item} value={item}>
                              {item.replaceAll("_", " ")}
                            </option>
                          ))}
                        </FilterSelect>
                      </FilterGroup>

                      <FilterGroup title="Role">
                        <FilterSelect name="role" defaultValue={selectedRole}>
                          <option value="">All roles</option>
                          {churchRoles.map((item) => (
                            <option key={item} value={item}>
                              {item.replaceAll("_", " ")}
                            </option>
                          ))}
                        </FilterSelect>
                      </FilterGroup>

                      <FilterGroup title="Division">
                        <FilterSelect name="division" defaultValue={selectedDivision}>
                          <option value="">All divisions</option>
                          {church.divisions.map((division) => (
                            <option key={division.id} value={division.id}>
                              {division.name}
                            </option>
                          ))}
                        </FilterSelect>
                      </FilterGroup>

                      <button
                        type="submit"
                        className="font-mono flex h-12 w-full items-center justify-center rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-black/90"
                      >
                        Apply filter
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>

            <Link
              href={`${basePath}?add=1`}
              className="font-mono flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-sm hover:bg-black/90 md:flex-none"
            >
              <Plus className="h-4 w-4" />
              Add
            </Link>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          <MetricCard label="All" value={String(church._count.members)} />
          <MetricCard label="Active" value={String(activeCount)} />
          <MetricCard label="Servants" value={String(servantCount)} />
          <MetricCard label="Leaders" value={String(coordinatorCount)} />
        </div>

        <section className="overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 bg-white p-4 md:flex md:items-center md:justify-between md:gap-4 md:p-5">
            <div className="mb-3 md:mb-0">
              <h2 className="text-lg font-black tracking-tight text-black">
                All Members{" "}
                <span className="ml-1 text-black/25">{visibleMembers.length}</span>
              </h2>
              <p className="text-xs font-medium text-black/40">
                Compact database view
              </p>
            </div>

            <form action={basePath} className="relative w-full md:w-[320px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search member..."
                className="h-11 w-full rounded-2xl border border-black/10 bg-[#FAFAFA] pl-10 pr-4 text-sm font-medium outline-none placeholder:text-black/30 focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
              />
              <input type="hidden" name="status" value={selectedStatus} />
              <input type="hidden" name="role" value={selectedRole} />
              <input type="hidden" name="division" value={selectedDivision} />
            </form>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-[#FAFAFA]">
                  <TableHead>User</TableHead>
                  <TableHead>NIJ</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Divisions</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead align="right">Action</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/5 bg-white">
                {visibleMembers.length > 0 ? (
                  visibleMembers.map((member) => (
                    <MemberTableRow
                      key={member.id}
                      member={member}
                      churchSlug={church.slug}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="block bg-[#FAFAFA] p-3 md:hidden">
            {visibleMembers.length > 0 ? (
              <div className="flex flex-col gap-3">
                {visibleMembers.map((member) => (
                  <MemberMobileCard
                    key={member.id}
                    member={member}
                    churchSlug={church.slug}
                  />
                ))}
              </div>
            ) : (
              <div className="py-10">
                <EmptyState />
              </div>
            )}
          </div>
        </section>

        {(addOpen || editMember) && (
          <ModalShell closeHref={basePath}>
            <div className="grid max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[30px] bg-white shadow-2xl md:grid-cols-[1fr_310px]">
              <div className="overflow-y-auto p-5 md:p-7">
                <div className="mb-6 flex items-start justify-between border-b border-black/5 pb-5">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-black">
                      {editMember ? "Edit Member" : "Add Member"}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-black/45">
                      Profile, access role, NIJ, dan assignment divisi.
                    </p>
                  </div>

                  <Link
                    href={basePath}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black/10"
                  >
                    <X className="h-4 w-4" />
                  </Link>
                </div>

                <form
                  action={editMember ? updateMember : createMember}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <input type="hidden" name="tenantSlug" value={church.slug} />

                  {editMember && (
                    <>
                      <input
                        type="hidden"
                        name="churchMemberId"
                        value={editMember.id}
                      />
                      <input
                        type="hidden"
                        name="userId"
                        value={editMember.userId}
                      />
                    </>
                  )}

                  <Field
                    label="Full Name"
                    name="name"
                    placeholder="John Doe"
                    defaultValue={editMember?.user.name || ""}
                    required
                  />

                  <Field
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    defaultValue={editMember?.user.email || ""}
                    required
                  />

                  <Field
                    label="WhatsApp Number"
                    name="phone"
                    placeholder="0812xxxxxxxx"
                    defaultValue={editMember?.user.phone || ""}
                  />

                  <Field
                    label="NIJ / Member Code"
                    name="memberCode"
                    placeholder={
                      church.memberCodeMode === "AUTO_GENERATE"
                        ? "Auto Generated"
                        : "Misal: MEM-001"
                    }
                    defaultValue={editMember?.memberCode || ""}
                    required={!editMember && church.memberCodeMode === "MANUAL"}
                  />

                  <SelectField
                    label="System Role"
                    name="role"
                    options={churchRoles}
                    defaultValue={editMember?.role || "MEMBER"}
                  />

                  <SelectField
                    label="Status"
                    name="status"
                    options={memberStatuses}
                    defaultValue={editMember?.status || "ACTIVE"}
                  />

                  <div className="col-span-full mt-2 border-t border-black/5 pt-5">
                    <h3 className="mb-4 text-sm font-black text-black">
                      Division Assignment
                    </h3>

                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/45">
                          Primary Division
                        </span>
                        <select
                          name="divisionId"
                          defaultValue={primaryDivision?.divisionId || ""}
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow focus:border-black focus:ring-4 focus:ring-black/5"
                        >
                          <option value="">-- No Division --</option>
                          {church.divisions.map((division) => (
                            <option key={division.id} value={division.id}>
                              {division.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <SelectField
                        label="Division Role"
                        name="divisionRole"
                        options={divisionRoles}
                        defaultValue={primaryDivision?.role || "MEMBER"}
                      />
                    </div>
                  </div>

                  <div className="col-span-full mt-2 flex justify-end gap-3">
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
                      {editMember ? "Save" : "Add Member"}
                    </button>
                  </div>
                </form>
              </div>

              <aside className="hidden border-l border-black/10 bg-[#FAFAFA] p-6 md:block">
                <ShieldCheck className="mb-4 h-6 w-6 text-black/40" />

                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-black">
                  NIJ System
                </h3>

                <p className="mt-2 text-sm font-medium leading-relaxed text-black/50">
                  Mode penomoran jemaat saat ini:{" "}
                  <b className="text-black">
                    {church.memberCodeMode.replaceAll("_", " ")}
                  </b>
                  .
                </p>

                <div className="mt-5 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold text-black/40">Prefix</p>
                  <p className="font-mono text-sm font-black text-black">
                    {church.memberCodePrefix ||
                      makePrefix(church.name, church.slug)}
                  </p>
                </div>

                <div className="mt-2 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold text-black/40">
                    Next Number
                  </p>
                  <p className="font-mono text-sm font-black text-black">
                    {church.memberCodeNextNumber}
                  </p>
                </div>
              </aside>
            </div>
          </ModalShell>
        )}
      </div>
    </ChurchAppShell>
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

function TableHead({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-black/35 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
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
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-black/30">
        <UsersRound className="h-6 w-6" />
      </div>

      <p className="text-base font-black text-black">No members found</p>

      <p className="mt-1 text-center text-sm font-medium text-black/45">
        Change filter or add new member.
      </p>
    </div>
  );
}

function MemberTableRow({
  member,
  churchSlug,
}: {
  member: any;
  churchSlug: string;
}) {
  return (
    <tr className="group transition-colors hover:bg-black/[0.02]">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={member.user.name || member.user.email} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-tight text-black">
              {member.user.name || "-"}
            </p>
            <p className="truncate text-xs font-medium text-black/45">
              {member.user.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <MonoPill>{member.memberCode || "NO NIJ"}</MonoPill>
      </td>

      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge label={member.role} />
          <Badge label={member.status} tone="lime" />
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex max-w-[240px] flex-wrap gap-1.5">
          {member.divisionMembers.length > 0 ? (
            member.divisionMembers.map((item: any) => (
              <Badge key={item.id} label={item.division.name} tone="soft" />
            ))
          ) : (
            <Badge label="No Division" tone="muted" />
          )}
        </div>
      </td>

      <td className="px-4 py-4 text-xs font-medium text-black/45">
        {new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(member.createdAt)}
      </td>

      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          <Link
            href={`/church/${churchSlug}/members?edit=${member.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>

          <form action={archiveMember}>
            <input type="hidden" name="tenantSlug" value={churchSlug} />
            <input type="hidden" name="churchMemberId" value={member.id} />
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
              title="Archive"
            >
              <Archive className="h-4 w-4" />
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}

function MemberMobileCard({
  member,
  churchSlug,
}: {
  member: any;
  churchSlug: string;
}) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <MonoPill>{member.memberCode || "NO NIJ"}</MonoPill>

        <div className="flex shrink-0 gap-1">
          <Link
            href={`/church/${churchSlug}/members?edit=${member.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
          >
            <Pencil className="h-4 w-4" />
          </Link>

          <form action={archiveMember}>
            <input type="hidden" name="tenantSlug" value={churchSlug} />
            <input type="hidden" name="churchMemberId" value={member.id} />
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
            >
              <Archive className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Avatar name={member.user.name || member.user.email} size="lg" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black leading-tight tracking-tight text-black">
            {member.user.name || "-"}
          </p>

          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-black/45">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <p className="truncate text-xs font-medium">{member.user.email}</p>
          </div>

          {member.user.phone && (
            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-black/40">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <p className="truncate text-xs font-medium">{member.user.phone}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-2xl bg-[#FAFAFA] p-3">
        <InfoRow label="System">
          <Badge label={member.role} />
          <Badge label={member.status} tone="lime" />
        </InfoRow>

        <InfoRow label="Division">
          {member.divisionMembers.length > 0 ? (
            member.divisionMembers.map((item: any) => (
              <Badge key={item.id} label={item.division.name} tone="soft" />
            ))
          ) : (
            <Badge label="No Division" tone="muted" />
          )}
        </InfoRow>
      </div>
    </div>
  );
}

function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#D4F93A] font-black text-black shadow-sm ${
        size === "lg" ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs"
      }`}
    >
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

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[74px_1fr] items-start gap-2">
      <span className="pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/30">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Badge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "lime" | "soft" | "muted";
}) {
  const className =
    tone === "lime"
      ? "border-[#D4F93A] bg-[#D4F93A]/30 text-black"
      : tone === "soft"
        ? "border-black/10 bg-white text-black/55"
        : tone === "muted"
          ? "border-black/10 bg-white text-black/35"
          : "border-black/70 bg-white text-black";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] ${className}`}
    >
      {label.replaceAll("_", " ")}
    </span>
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

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-black/45">
        {label}
      </span>

      <select
        name={name}
        defaultValue={defaultValue || options[0]}
        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow focus:border-black focus:ring-4 focus:ring-black/5"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-black/45">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function FilterSelect({
  name,
  defaultValue,
  children,
}: {
  name: string;
  defaultValue?: string;
  children: ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue || ""}
      className="h-11 w-full rounded-2xl border border-black/10 bg-[#FAFAFA] px-4 text-sm font-medium outline-none focus:border-black focus:bg-white focus:ring-4 focus:ring-[#D4F93A]/20"
    >
      {children}
    </select>
  );
}