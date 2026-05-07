"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users2,
  Zap,
} from "lucide-react";

const planMap: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro Ministry",
};

type Division = {
  id: number;
  name: string;
  picName: string;
  picPhone: string;
};

export default function ActivatePage() {
  return (
    <Suspense fallback={<ActivateLoading />}>
      <ActivateContent />
    </Suspense>
  );
}

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planCode = searchParams.get("plan") || "growth";
  const planName = planMap[planCode] || "Growth";

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [churchName, setChurchName] = useState("");
  const [churchAddress, setChurchAddress] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [adminName, setAdminName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [divisions, setDivisions] = useState<Division[]>([
    { id: 1, name: "Worship", picName: "", picPhone: "" },
  ]);

  const progress = useMemo(() => {
    if (step <= 4) return `${(step / 4) * 100}%`;
    return "100%";
  }, [step]);

  const quickDivisions = [
    "Worship",
    "Multimedia",
    "Usher",
    "Kids Ministry",
    "Youth",
    "Prayer",
    "Hospitality",
  ];

  const addDivision = (name = "") => {
    setDivisions((current) => [
      ...current,
      { id: Date.now(), name, picName: "", picPhone: "" },
    ]);
  };

  const updateDivision = (
    id: number,
    field: keyof Division,
    value: string
  ) => {
    setDivisions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeDivision = (id: number) => {
    setDivisions((current) => current.filter((item) => item.id !== id));
  };

  const submitActivation = async () => {
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Password dan confirm password belum sama.");
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    setStep(5);

    try {
      const response = await fetch("/api/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planCode,
          churchName,
          churchAddress,
          picEmail,
          picPhone,
          adminName,
          password,
          confirmPassword,
          divisions: divisions
            .filter((division) => division.name.trim())
            .map((division) => ({
              name: division.name.trim(),
              picName: division.picName.trim(),
              picPhone: division.picPhone.trim(),
            })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(result.message || "Aktivasi gagal. Coba lagi.");
        setStep(4);
        setIsSubmitting(false);
        return;
      }

      setStep(6);

      setTimeout(() => {
        router.push(result.redirectTo || "/dashboard");
      }, 1200);
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan koneksi saat aktivasi.");
      setStep(4);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#0B0D0F] selection:bg-[#D4F93A]">
      <nav className="fixed top-0 z-[100] w-full border-b border-black/[0.04] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-[-0.05em]">
            KiraServe<span className="text-[#A3E635]">.</span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <Link
              href="/pricing"
              className="text-[13px] font-medium text-black/50 hover:text-black"
            >
              Pricing
            </Link>
            <Link
              href={`/checkout?plan=${planCode}`}
              className="text-[13px] font-medium text-black/50 hover:text-black"
            >
              Checkout
            </Link>
            <span className="text-[13px] font-medium text-black">
              Activation
            </span>
          </div>

          <Link
            href={`/checkout?plan=${planCode}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#0B0D0F] px-5 py-2.5 text-[13px] font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Checkout
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-24 pt-36 md:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-20 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[#D4F93A]/20 blur-[120px]" />

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"
          >
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.02] px-4 py-1.5 text-[13px] font-medium">
                <Sparkles className="h-4 w-4 text-[#A3E635]" />
                Tenant activation
              </div>

              <h1 className="text-5xl font-bold leading-[0.95] tracking-[-0.055em] md:text-7xl lg:text-[100px]">
                Aktivasi. <br />
                <span className="font-serif italic text-black/30">
                  Gerejamu.
                </span>
              </h1>
            </div>

            <div className="rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.25)]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/30">
                Selected Plan
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-4xl font-bold tracking-[-0.05em]">
                  {planName}
                </p>
                <span className="w-fit rounded-full bg-[#D4F93A] px-4 py-2 text-[13px] font-bold text-black">
                  Trial 14 Hari
                </span>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[32px] bg-[#0B0D0F] p-7 text-white">
                <p className="text-xl font-bold tracking-[-0.05em]">
                  KiraServe
                </p>
                <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-white/30">
                  Workspace setup
                </p>

                <div className="mt-8 space-y-2">
                  <StepItem
                    number="1"
                    title="Profil Gereja"
                    active={step === 1}
                    done={step > 1}
                  />
                  <StepItem
                    number="2"
                    title="Akun Admin"
                    active={step === 2}
                    done={step > 2}
                  />
                  <StepItem
                    number="3"
                    title="Divisi Awal"
                    active={step === 3}
                    done={step > 3}
                  />
                  <StepItem
                    number="4"
                    title="Review"
                    active={step === 4}
                    done={step > 4}
                  />
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <ShieldCheck className="mb-4 h-5 w-5 text-[#D4F93A]" />
                  <p className="font-semibold">Tenant-safe setup</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/35">
                    Setiap gereja akan punya workspace, role access, dan data
                    operasional sendiri.
                  </p>
                </div>
              </div>
            </aside>

            <div>
              {step <= 4 && (
                <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                  <div
                    className="h-full rounded-full bg-[#0B0D0F] transition-all duration-500"
                    style={{ width: progress }}
                  />
                </div>
              )}

              <div className="overflow-hidden rounded-[32px] border border-black/[0.08] bg-white shadow-[0_32px_80px_-45px_rgba(0,0,0,0.25)]">
                <div className="p-8 md:p-10">
                  {errorMessage && step <= 4 && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                      {errorMessage}
                    </div>
                  )}

                  {step === 1 && (
                    <StepShell
                      icon={Building2}
                      title="Profil Gereja"
                      desc="Isi data dasar gereja dan kontak utama PIC sistem."
                    >
                      <Field
                        label="Nama Gereja / Komunitas"
                        placeholder="Misal: Gereja Satu Jam Saja"
                        value={churchName}
                        onChange={setChurchName}
                      />
                      <Field
                        label="Alamat Gereja"
                        placeholder="Alamat lengkap gereja"
                        value={churchAddress}
                        onChange={setChurchAddress}
                      />
                      <div className="grid gap-5 md:grid-cols-2">
                        <Field
                          label="Email PIC Gereja"
                          placeholder="admin@gereja.com"
                          value={picEmail}
                          onChange={setPicEmail}
                        />
                        <Field
                          label="Nomor PIC Gereja"
                          placeholder="0895xxxxxxxx"
                          value={picPhone}
                          onChange={setPicPhone}
                        />
                      </div>
                    </StepShell>
                  )}

                  {step === 2 && (
                    <StepShell
                      icon={UserRound}
                      title="Buat Akun Admin"
                      desc="Akun ini akan menjadi Church Owner untuk workspace gereja."
                    >
                      <Field
                        label="Nama Admin"
                        placeholder="Nama PIC / admin utama"
                        value={adminName}
                        onChange={setAdminName}
                      />

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-black/65">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) =>
                              setPassword(event.target.value)
                            }
                            placeholder="Minimal 8 karakter"
                            className="w-full rounded-2xl border border-black/[0.08] bg-[#F9FAF9] px-4 py-4 pr-12 outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white focus:ring-4 focus:ring-[#D4F93A]/25"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-black/35"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Field
                        label="Confirm Password"
                        placeholder="Ulangi password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                      />

                      {password &&
                        confirmPassword &&
                        password !== confirmPassword && (
                          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                            Password dan confirm password belum sama.
                          </div>
                        )}
                    </StepShell>
                  )}

                  {step === 3 && (
                    <StepShell
                      icon={Network}
                      title="Tambahkan Divisi"
                      desc="Tambahkan divisi awal dan PIC divisi. Bisa diedit lagi nanti."
                    >
                      <div>
                        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-black/30">
                          Quick Add
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {quickDivisions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => addDivision(item)}
                              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-black/55 transition hover:border-[#D4F93A] hover:bg-[#D4F93A] hover:text-black"
                            >
                              + {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {divisions.map((division, index) => (
                          <div
                            key={division.id}
                            className="rounded-3xl border border-black/[0.08] bg-[#F9FAF9] p-5"
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <p className="font-bold">Divisi {index + 1}</p>
                              {divisions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeDivision(division.id)}
                                  className="text-sm font-semibold text-red-500"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                              <input
                                value={division.name}
                                onChange={(event) =>
                                  updateDivision(
                                    division.id,
                                    "name",
                                    event.target.value
                                  )
                                }
                                placeholder="Nama divisi"
                                className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 outline-none placeholder:text-black/30 focus:border-black"
                              />
                              <input
                                value={division.picName}
                                onChange={(event) =>
                                  updateDivision(
                                    division.id,
                                    "picName",
                                    event.target.value
                                  )
                                }
                                placeholder="Nama PIC"
                                className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 outline-none placeholder:text-black/30 focus:border-black"
                              />
                              <input
                                value={division.picPhone}
                                onChange={(event) =>
                                  updateDivision(
                                    division.id,
                                    "picPhone",
                                    event.target.value
                                  )
                                }
                                placeholder="Nomor PIC"
                                className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 outline-none placeholder:text-black/30 focus:border-black"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addDivision()}
                        className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white"
                      >
                        + Tambah Divisi Manual
                      </button>
                    </StepShell>
                  )}

                  {step === 4 && (
                    <StepShell
                      icon={Users2}
                      title="Review Aktivasi"
                      desc="Cek ulang data sebelum workspace trial dibuat."
                    >
                      <div className="grid gap-3">
                        <ReviewRow label="Plan" value={planName} />
                        <ReviewRow
                          label="Nama Gereja"
                          value={churchName || "-"}
                        />
                        <ReviewRow
                          label="Alamat"
                          value={churchAddress || "-"}
                        />
                        <ReviewRow
                          label="PIC Email"
                          value={picEmail || "-"}
                        />
                        <ReviewRow
                          label="PIC Phone"
                          value={picPhone || "-"}
                        />
                        <ReviewRow label="Admin" value={adminName || "-"} />
                        <ReviewRow
                          label="Divisi"
                          value={`${
                            divisions.filter((item) => item.name).length
                          } divisi`}
                        />
                      </div>

                      <div className="rounded-3xl bg-[#D4F93A]/25 p-5">
                        <p className="font-bold">
                          Trial 14 hari akan aktif setelah aktivasi selesai.
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-black/50">
                          Setelah aktivasi sukses, workspace akan dibuat di
                          database dan diarahkan ke dashboard gereja.
                        </p>
                      </div>
                    </StepShell>
                  )}

                  {step === 5 && (
                    <div className="py-12 text-center">
                      <div className="relative mx-auto mb-10 flex h-44 w-44 items-center justify-center">
                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-dashed border-black" />
                        <div className="absolute inset-5 rounded-full border-4 border-[#D4F93A]/35" />
                        <div className="absolute inset-10 rounded-full bg-[#D4F93A] blur-xl" />
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#D4F93A]">
                          <Rocket className="h-10 w-10" />
                        </div>
                      </div>

                      <h2 className="text-5xl font-bold tracking-[-0.055em] md:text-7xl">
                        Ready to serve better?
                      </h2>
                      <p className="mx-auto mt-5 max-w-md leading-relaxed text-black/50">
                        KiraServe sedang menyiapkan workspace gerejamu.
                      </p>

                      <div className="mx-auto mt-8 max-w-lg rounded-3xl bg-[#0B0D0F] p-6 text-left font-mono text-xs text-[#D4F93A]">
                        <p>&gt; Initializing workspace setup...</p>
                        <p>&gt; Creating secure tenant boundary...</p>
                        <p>&gt; Setting up ministry divisions...</p>
                        <p>&gt; Activating trial subscription...</p>
                        <p>&gt; Preparing dashboard experience...</p>
                      </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="py-14 text-center">
                      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#D4F93A]">
                        <Check className="h-12 w-12" />
                      </div>

                      <h2 className="text-5xl font-bold tracking-[-0.055em] md:text-7xl">
                        Workspace siap.
                      </h2>
                      <p className="mx-auto mt-5 max-w-md leading-relaxed text-black/50">
                        Mengarahkan ke dashboard gereja...
                      </p>
                    </div>
                  )}
                </div>

                {step <= 4 && (
                  <div className="flex items-center justify-between border-t border-black/[0.06] bg-[#F9FAF9] px-8 py-5">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage("");
                        setStep((value) => Math.max(1, value - 1));
                      }}
                      className={`rounded-full px-5 py-3 text-sm font-semibold text-black/45 hover:text-black ${
                        step === 1 ? "invisible" : ""
                      }`}
                    >
                      Kembali
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setErrorMessage("");
                        if (step < 4) setStep((value) => value + 1);
                        else submitActivation();
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-7 py-4 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        step === 4
                          ? "bg-[#D4F93A] text-black"
                          : "bg-black text-white"
                      }`}
                    >
                      {isSubmitting
                        ? "Memproses..."
                        : step === 4
                          ? "Aktivasi Sekarang"
                          : "Lanjut"}
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : step === 4 ? (
                        <Zap className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ActivateLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex items-center gap-3 rounded-3xl border border-black/[0.08] bg-white p-8 font-bold shadow-xl">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading activation...
      </div>
    </main>
  );
}

function StepItem({
  number,
  title,
  active,
  done,
}: {
  number: string;
  title: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
        active
          ? "bg-[#D4F93A] text-black"
          : done
            ? "bg-white/10 text-white"
            : "text-white/35"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
          active
            ? "bg-black text-white"
            : done
              ? "bg-[#D4F93A] text-black"
              : "bg-white/10"
        }`}
      >
        {done ? <Check className="h-4 w-4" /> : number}
      </span>
      <span className="font-semibold">{title}</span>
    </div>
  );
}

function StepShell({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
        <Icon className="h-6 w-6" />
      </div>

      <h2 className="text-4xl font-bold tracking-[-0.05em] md:text-6xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-black/50">{desc}</p>

      <div className="mt-8 space-y-5">{children}</div>
    </motion.div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-black/65">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-black/[0.08] bg-[#F9FAF9] px-4 py-4 outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white focus:ring-4 focus:ring-[#D4F93A]/25"
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-[#F9FAF9] p-4">
      <p className="text-sm font-semibold text-black/35">{label}</p>
      <p className="text-right font-semibold text-black">{value}</p>
    </div>
  );
}