"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createAuthSession,
  destroyCurrentSession,
  generateLoginCode,
  getPostLoginPath,
  hashLoginCode,
  loginCodeExpiry,
  sendLoginCodeEmail,
} from "@/lib/auth";
import { db } from "@/lib/db";

function loginError(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function loginWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    loginError("Isi email dan password dulu.");
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    loginError("Email atau password belum cocok.");
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);

  if (!passwordOk) {
    loginError("Email atau password belum cocok.");
  }

  await createAuthSession(user.id);
  redirect(next || (await getPostLoginPath(user.id)));
}

export async function requestLoginCode(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/login?mode=code&error=Isi email dulu.");
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  let devCode = "";
  let emailSent = false;

  if (user) {
    const code = generateLoginCode();
    devCode = code;

    await db.loginOtp.create({
      data: {
        email,
        codeHash: hashLoginCode(email, code),
        expiresAt: loginCodeExpiry(),
      },
    });

    emailSent = await sendLoginCodeEmail({ email, code });
  }

  const params = new URLSearchParams({
    mode: "code",
    sent: "1",
    email,
  });

  if (devCode && !emailSent) {
    params.set("devCode", devCode);
  }

  redirect(`/login?${params.toString()}`);
}

export async function verifyLoginCode(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "").trim();
  const next = String(formData.get("next") || "");

  if (!email || !code) {
    redirect("/login?mode=code&error=Isi email dan kode login.");
  }

  const otp = await db.loginOtp.findFirst({
    where: {
      email,
      codeHash: hashLoginCode(email, code),
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otp) {
    redirect(
      `/login?mode=code&email=${encodeURIComponent(email)}&error=Kode login tidak valid atau sudah expired.`
    );
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    redirect("/login?mode=code&error=Akun belum ditemukan.");
  }

  await db.loginOtp.update({
    where: { id: otp.id },
    data: {
      consumedAt: new Date(),
    },
  });

  await createAuthSession(user.id);
  redirect(next || (await getPostLoginPath(user.id)));
}

export async function logout() {
  await destroyCurrentSession();
  revalidatePath("/", "layout");
  redirect("/login");
}
