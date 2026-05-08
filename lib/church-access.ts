import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export type ChurchAccess = {
  userId: string;
  churchId: string;
  tenantSlug: string;
  churchName: string;
  role:
    | "CHURCH_OWNER"
    | "CHURCH_ADMIN"
    | "DIVISION_COORDINATOR"
    | "SERVANT"
    | "MEMBER";
  coordinatedDivisionIds: string[];
  memberDivisionIds: string[];
  isOwner: boolean;
  isAdmin: boolean;
  isCoordinator: boolean;
  isServant: boolean;
  isMember: boolean;
  canManageChurch: boolean;
  canViewAdminWorkspace: boolean;
  canViewMembers: boolean;
  canManageMembers: boolean;
  canViewAllDivisions: boolean;
  canManageAllDivisions: boolean;
  canViewBilling: boolean;
  canViewSettings: boolean;
};

type AccessInput = {
  tenantSlug: string;
  userEmail?: string | null;
  userId?: string | null;
};

/**
 * TEMP DEV ACCESS MODE
 * Permission final sengaja belum dipaksa.
 * Tujuannya supaya halaman admin tetap bisa dibuka selama development fitur.
 *
 * Kalau DEV_TEST_USER_EMAIL di .env diisi, sistem akan pakai user itu.
 * Kalau kosong, sistem pakai church member pertama dari tenant.
 *
 * Nanti setelah auth/session final, file ini baru diketatkan lagi.
 */
export async function getChurchAccess({
  tenantSlug,
  userEmail,
  userId,
}: AccessInput): Promise<ChurchAccess | null> {
  const devTestUserEmail = process.env.DEV_TEST_USER_EMAIL || null;
  const effectiveUserEmail = userEmail || devTestUserEmail;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!church) return null;

  const churchMember = await db.churchMember.findFirst({
    where: {
      churchId: church.id,
      ...(userId ? { userId } : {}),
      ...(effectiveUserEmail
        ? { user: { email: effectiveUserEmail.toLowerCase() } }
        : {}),
    },
    include: {
      user: true,
      divisionMembers: {
        select: {
          divisionId: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!churchMember) return null;

  const coordinatedDivisionIds = churchMember.divisionMembers
    .filter((item) => item.role === "COORDINATOR")
    .map((item) => item.divisionId);

  const memberDivisionIds = churchMember.divisionMembers.map(
    (item) => item.divisionId
  );

  const isOwner = churchMember.role === "CHURCH_OWNER";
  const isAdmin = churchMember.role === "CHURCH_ADMIN";
  const isCoordinator =
    churchMember.role === "DIVISION_COORDINATOR" ||
    coordinatedDivisionIds.length > 0;
  const isServant = churchMember.role === "SERVANT";
  const isMember = churchMember.role === "MEMBER";

  /**
   * TEMP DEV:
   * Semua akses admin dibuat true dulu supaya development tidak mental/redirect.
   * Permission final nanti setelah auth/session login rapi.
   */
  const canManageChurch = true;
  const canViewAdminWorkspace = true;
  const canViewMembers = true;
  const canManageMembers = true;
  const canViewAllDivisions = true;
  const canManageAllDivisions = true;
  const canViewBilling = true;
  const canViewSettings = true;

  return {
    userId: churchMember.userId,
    churchId: church.id,
    tenantSlug: church.slug,
    churchName: church.name,
    role: churchMember.role,
    coordinatedDivisionIds,
    memberDivisionIds,
    isOwner,
    isAdmin,
    isCoordinator,
    isServant,
    isMember,
    canManageChurch,
    canViewAdminWorkspace,
    canViewMembers,
    canManageMembers,
    canViewAllDivisions,
    canManageAllDivisions,
    canViewBilling,
    canViewSettings,
  };
}

export async function requireChurchAccess(tenantSlug: string) {
  const access = await getChurchAccess({ tenantSlug });

  if (!access) {
    redirect(`/login?next=/church/${tenantSlug}/dashboard`);
  }

  return access;
}

export async function requireChurchAdminAccess(tenantSlug: string) {
  const access = await requireChurchAccess(tenantSlug);
  return access;
}

export async function requireMembersAccess(tenantSlug: string) {
  const access = await requireChurchAccess(tenantSlug);
  return access;
}

export async function requireDivisionAccess(
  tenantSlug: string,
  divisionId: string
) {
  const access = await requireChurchAccess(tenantSlug);
  return access;
}

export function canManageDivision(access: ChurchAccess, divisionId: string) {
  return true;
}

export function getAllowedDivisionWhere(access: ChurchAccess) {
  return {};
}

export function getAllowedDivisionMemberWhere(access: ChurchAccess) {
  return {};
}
