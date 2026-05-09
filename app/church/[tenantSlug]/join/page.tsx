import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { ArrowLeft, CheckCircle2, Church, UserPlus } from "lucide-react";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
  searchParams?: Promise<{
    submitted?: string;
    error?: string;
  }>;
};

async function registerChurchMember(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!tenantSlug || !name || !email || password.length < 8) {
    redirect(`/church/${tenantSlug}/join?error=invalid`);
  }

  if (password !== confirmPassword) {
    redirect(`/church/${tenantSlug}/join?error=password`);
  }

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!church) redirect(`/church/${tenantSlug}/join?error=church`);

  const passwordHash = await bcrypt.hash(password, 12);
  const existingUser = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  const user = existingUser
    ? await db.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          phone: phone || null,
          ...(!existingUser.passwordHash ? { passwordHash } : {}),
        },
      })
    : await db.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          passwordHash,
        },
      });

  const existingMember = await db.churchMember.findUnique({
    where: {
      churchId_userId: {
        churchId: church.id,
        userId: user.id,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingMember) {
    if (existingMember.status !== "ACTIVE") {
      await db.churchMember.update({
        where: { id: existingMember.id },
        data: {
          status: "INVITED",
        },
      });
    }
  } else {
    await db.churchMember.create({
      data: {
        churchId: church.id,
        userId: user.id,
        role: "MEMBER",
        status: "INVITED",
        memberCode: null,
      },
    });
  }

  redirect(`/church/${church.slug}/join?submitted=1`);
}

export default async function JoinChurchPage({
  params,
  searchParams,
}: PageProps) {
  const { tenantSlug } = await params;
  const query = (await searchParams) || {};

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: {
      slug: true,
      name: true,
    },
  });

  if (!church) notFound();

  const submitted = query.submitted === "1";
  const errorMessage =
    query.error === "password"
      ? "Password dan konfirmasi belum sama."
      : query.error === "invalid"
        ? "Lengkapi data wajib dan gunakan password minimal 8 karakter."
        : query.error
          ? "Registrasi belum berhasil. Coba lagi sebentar lagi."
          : "";

  return (
    <main className="min-h-screen bg-[#F6F7F1] px-4 py-8 text-black md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between bg-black p-7 text-white md:p-9">
            <div>
              <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/50 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                KiraServe
              </Link>

              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
                <Church className="h-6 w-6" />
              </div>

              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Member Registration
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                {church.name}
              </h1>
              <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-white/55">
                Daftar sebagai jemaat. Admin gereja akan review dan approve.
                NIJ dibuat otomatis setelah approval jika sistem NIJ memakai
                mode auto generate.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-medium leading-relaxed text-white/55">
              Setelah registrasi kamu bisa login, tetapi akses penuh dan NIJ
              menunggu approval admin.
            </div>
          </div>

          <div className="p-6 md:p-9">
            {submitted ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4F93A] text-black">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-black">
                  Registrasi terkirim
                </h2>
                <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-black/50">
                  Data kamu masuk ke daftar pending. Admin gereja tinggal approve
                  untuk mengaktifkan status member dan NIJ.
                </p>
                <Link
                  href="/login"
                  className="font-mono mt-6 flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-black/90"
                >
                  Login
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-black">
                    Daftar Member
                  </h2>
                  <p className="mt-1 text-sm font-medium text-black/45">
                    Isi data dasar untuk masuk daftar approval admin.
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {errorMessage}
                  </div>
                )}

                <form action={registerChurchMember} className="grid gap-4">
                  <input type="hidden" name="tenantSlug" value={church.slug} />

                  <JoinField
                    label="Full Name"
                    name="name"
                    placeholder="Nama lengkap"
                    required
                  />
                  <JoinField
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="nama@email.com"
                    required
                  />
                  <JoinField
                    label="WhatsApp Number"
                    name="phone"
                    placeholder="0812xxxxxxxx"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <JoinField
                      label="Password"
                      name="password"
                      type="password"
                      placeholder="Minimal 8 karakter"
                      required
                    />
                    <JoinField
                      label="Confirm"
                      name="confirmPassword"
                      type="password"
                      placeholder="Ulangi password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="font-mono mt-2 flex h-12 items-center justify-center rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-black/90"
                  >
                    Submit Registration
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function JoinField({
  label,
  name,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/45">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        minLength={type === "password" ? 8 : undefined}
        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow placeholder:text-black/30 focus:border-black focus:ring-4 focus:ring-[#D4F93A]/20"
      />
    </label>
  );
}
