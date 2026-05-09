import Link from "next/link";
import { redirect } from "next/navigation";
import { Church, UserPlus } from "lucide-react";

async function goToChurchRegister(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  if (!tenantSlug) return;

  redirect(`/church/${tenantSlug}/join`);
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#F6F7F1] px-4 py-8 text-black md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-[30px] border border-black/10 bg-white p-6 shadow-sm md:p-9">
          <Link href="/" className="mb-8 inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4F93A] text-xl font-black text-black">
              K
            </span>
            <span className="text-xl font-black tracking-tight">KiraServe</span>
          </Link>

          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-[#D4F93A]">
            <UserPlus className="h-6 w-6" />
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Register sebagai jemaat
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-black/50">
            Masukkan slug workspace gereja. Setelah submit, kamu akan diarahkan
            ke form registrasi member untuk approval admin.
          </p>

          <form action={goToChurchRegister} className="mt-7 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/45">
                Church Slug
              </span>
              <div className="relative">
                <Church className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                <input
                  name="tenantSlug"
                  placeholder="gereja-test-kiraserve"
                  required
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-10 pr-3 text-sm font-medium outline-none transition-shadow placeholder:text-black/30 focus:border-black focus:ring-4 focus:ring-[#D4F93A]/20"
                />
              </div>
            </label>

            <button
              type="submit"
              className="font-mono mt-5 flex h-12 items-center justify-center rounded-2xl bg-black px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-black/90 md:mt-6"
            >
              Continue
            </button>
          </form>

          <div className="mt-6 border-t border-black/10 pt-5 text-sm font-bold text-black/50">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-black hover:underline">
              Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
