import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import {
  loginWithPassword,
  requestLoginCode,
  verifyLoginCode,
} from "@/lib/auth-actions";
import { getCurrentUser, getPostLoginPath } from "@/lib/auth";

type PageProps = {
  searchParams?: Promise<{
    mode?: string;
    email?: string;
    error?: string;
    sent?: string;
    devCode?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const query = (await searchParams) || {};
  const currentUser = await getCurrentUser();

  if (currentUser && !query.next) {
    redirect(await getPostLoginPath(currentUser.id));
  }

  const mode = query.mode === "code" ? "code" : "password";
  const email = query.email || "";
  const errorMessage = query.error || "";
  const next = query.next || "";

  return (
    <main className="min-h-screen bg-[#F6F7F1] px-4 py-8 text-black md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-between bg-black p-7 text-white md:p-9">
            <div>
              <Link href="/" className="mb-10 inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4F93A] text-xl font-black text-black">
                  K
                </span>
                <span>
                  <span className="block text-xl font-black tracking-tight">
                    KiraServe
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                    Church OS
                  </span>
                </span>
              </Link>

              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Secure Workspace Login
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
                Masuk ke workspace pelayanan.
              </h1>
              <p className="mt-5 max-w-sm text-sm font-medium leading-relaxed text-white/55">
                Admin dan koordinator masuk ke dashboard operasional. Member dan
                servant diarahkan ke portal pribadi.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-medium leading-relaxed text-white/55">
              Belum punya NIJ? Minta link registrasi gereja atau buka halaman
              register untuk masuk approval admin.
            </div>
          </div>

          <div className="p-6 md:p-9">
            <div className="mb-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
                {mode === "code" ? (
                  <Mail className="h-5 w-5" />
                ) : (
                  <KeyRound className="h-5 w-5" />
                )}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-black">
                {mode === "code" ? "Login via Code" : "Login"}
              </h2>
              <p className="mt-1 text-sm font-medium text-black/45">
                {mode === "code"
                  ? "Gunakan kode OTP dari email untuk masuk tanpa password."
                  : "Masuk dengan email dan password akun KiraServe."}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            )}

            {query.sent === "1" && (
              <div className="mb-5 rounded-2xl border border-[#D4F93A] bg-[#D4F93A]/25 px-4 py-3 text-sm font-bold text-black">
                Kode login sudah dibuat. Cek email kamu.
                {query.devCode && (
                  <span className="mt-1 block font-mono text-xs">
                    Dev code: {query.devCode}
                  </span>
                )}
              </div>
            )}

            {mode === "code" ? (
              <div className="space-y-5">
                <form action={requestLoginCode} className="grid gap-3">
                  <input
                    name="email"
                    type="email"
                    placeholder="nama@email.com"
                    defaultValue={email}
                    required
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow placeholder:text-black/30 focus:border-black focus:ring-4 focus:ring-[#D4F93A]/20"
                  />
                  <button
                    type="submit"
                    className="font-mono flex h-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-xs font-bold uppercase tracking-[0.12em] text-black hover:bg-black/5"
                  >
                    Request Code
                  </button>
                </form>

                <form action={verifyLoginCode} className="grid gap-3">
                  <input type="hidden" name="next" value={next} />
                  <input
                    name="email"
                    type="email"
                    placeholder="nama@email.com"
                    defaultValue={email}
                    required
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow placeholder:text-black/30 focus:border-black focus:ring-4 focus:ring-[#D4F93A]/20"
                  />
                  <input
                    name="code"
                    inputMode="numeric"
                    placeholder="6 digit code"
                    required
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow placeholder:text-black/30 focus:border-black focus:ring-4 focus:ring-[#D4F93A]/20"
                  />
                  <button
                    type="submit"
                    className="font-mono flex h-12 items-center justify-center rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-black/90"
                  >
                    Verify and Login
                  </button>
                </form>
              </div>
            ) : (
              <form action={loginWithPassword} className="grid gap-4">
                <input type="hidden" name="next" value={next} />
                <AuthField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                />
                <AuthField
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                />
                <button
                  type="submit"
                  className="font-mono mt-2 flex h-12 items-center justify-center rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-black/90"
                >
                  Login
                </button>
              </form>
            )}

            <div className="mt-6 grid gap-2 border-t border-black/10 pt-5 text-sm font-bold text-black/50">
              <Link
                href={mode === "code" ? "/login" : "/login?mode=code"}
                className="inline-flex items-center gap-2 hover:text-black"
              >
                <ShieldCheck className="h-4 w-4" />
                {mode === "code"
                  ? "Login pakai password"
                  : "Login via email code / lupa password"}
              </Link>
              <Link href="/register" className="hover:text-black">
                Belum punya NIJ? Register sebagai jemaat
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthField({
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
        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow placeholder:text-black/30 focus:border-black focus:ring-4 focus:ring-[#D4F93A]/20"
      />
    </label>
  );
}
