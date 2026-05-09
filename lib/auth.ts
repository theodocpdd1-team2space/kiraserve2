import "server-only";
import { createHash, randomBytes, randomInt } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const AUTH_COOKIE_NAME = "kiraserve_session";
const SESSION_DAYS = 30;
const OTP_MINUTES = 10;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required in production.");
  }

  return secret || "kiraserve-dev-auth-secret";
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hashSessionToken(token: string) {
  return sha256(`${token}.${getAuthSecret()}`);
}

export function hashLoginCode(email: string, code: string) {
  return sha256(`${email.toLowerCase()}.${code}.${getAuthSecret()}`);
}

export function generateLoginCode() {
  return String(randomInt(100000, 1000000));
}

export function loginCodeExpiry() {
  return new Date(Date.now() + OTP_MINUTES * 60 * 1000);
}

export async function createAuthSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.authSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    await db.authSession.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await db.authSession.findUnique({
    where: {
      tokenHash: hashSessionToken(token),
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await db.authSession.deleteMany({ where: { id: session.id } });
    }

    return null;
  }

  return session.user;
}

export async function getUserMemberships(userId: string) {
  return db.churchMember.findMany({
    where: {
      userId,
      status: {
        not: "ARCHIVED",
      },
    },
    include: {
      church: true,
      divisionMembers: true,
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}

export function getMembershipHomePath(
  membership: Awaited<ReturnType<typeof getUserMemberships>>[number]
) {
  const hasAdminWorkspace =
    membership.status === "ACTIVE" &&
    (membership.role === "CHURCH_OWNER" ||
      membership.role === "CHURCH_ADMIN" ||
      membership.role === "DIVISION_COORDINATOR" ||
      membership.divisionMembers.some((item) => item.role === "COORDINATOR"));

  if (hasAdminWorkspace) {
    return `/church/${membership.church.slug}/dashboard`;
  }

  return `/church/${membership.church.slug}/me`;
}

export async function getPostLoginPath(userId: string) {
  const memberships = await getUserMemberships(userId);

  if (memberships.length === 0) {
    return "/dashboard";
  }

  const activeMembership =
    memberships.find((membership) => membership.status === "ACTIVE") ||
    memberships[0];

  return getMembershipHomePath(activeMembership);
}

export async function sendLoginCodeEmail({
  email,
  code,
}: {
  email: string;
  code: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Kode login KiraServe",
      html: `<p>Kode login KiraServe kamu:</p><h2>${code}</h2><p>Kode ini berlaku ${OTP_MINUTES} menit.</p>`,
      text: `Kode login KiraServe kamu: ${code}. Kode ini berlaku ${OTP_MINUTES} menit.`,
    }),
  });

  return response.ok;
}
