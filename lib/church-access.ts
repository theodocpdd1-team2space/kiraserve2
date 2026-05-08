import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export type ChurchAccess = {
  userId: string;
  churchId: string;
  tenantSlug: string;
  churchName: string;
  role: "CHURCH_OWNER" | "CHURCH_ADMIN" | "DIVISION_COORDINATOR" | "SERVANT" | "MEMBER";
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
 * DEVELOPMENT FALLBACK:
 * Selama auth/session belum final, helper ini akan memakai member pertama
 * dalam church sebagai current user.
 *
 * Nanti setelah NextAuth aman, kita ganti fallback ini menjadi session user.
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

  // lanjutkan isi lama di bawahnya...

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

  const canManageChurch = isOwner || isAdmin;
  const canViewAdminWorkspace = isOwner || isAdmin || isCoordinator;
  const canViewMembers = isOwner || isAdmin;
  const canManageMembers = isOwner || isAdmin;
  const canViewAllDivisions = isOwner || isAdmin;
  const canManageAllDivisions = isOwner || isAdmin;
  const canViewBilling = isOwner;
  const canViewSettings = isOwner || isAdmin;

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

  if (!access.canViewAdminWorkspace) {
    redirect(`/church/${tenantSlug}/me`);
  }

  return access;
}

export async function requireChurchAdminAccess(tenantSlug: string) {
  const access = await requireChurchAccess(tenantSlug);

  if (!access.canManageChurch) {
    redirect(`/church/${tenantSlug}/dashboard`);
  }

  return access;
}

export async function requireMembersAccess(tenantSlug: string) {
  const access = await requireChurchAccess(tenantSlug);

  if (!access.canViewMembers) {
    redirect(`/church/${tenantSlug}/dashboard`);
  }

  return access;
}

export async function requireDivisionAccess(
  tenantSlug: string,
  divisionId: string
) {
  const access = await requireChurchAccess(tenantSlug);

  if (access.canViewAllDivisions) {
    return access;
  }

  if (!access.coordinatedDivisionIds.includes(divisionId)) {
    redirect(`/church/${tenantSlug}/divisions`);
  }

  return access;
}

export function canManageDivision(access: ChurchAccess, divisionId: string) {
  if (access.canManageAllDivisions) return true;
  return access.coordinatedDivisionIds.includes(divisionId);
}

export function getAllowedDivisionWhere(access: ChurchAccess) {
  if (access.canViewAllDivisions) {
    return {};
  }

  return {
    id: {
      in: access.coordinatedDivisionIds,
    },
  };
}

export function getAllowedDivisionMemberWhere(access: ChurchAccess) {
  if (access.canViewAllDivisions) {
    return {};
  }

  return {
    divisionId: {
      in: access.coordinatedDivisionIds,
    },
  };
}