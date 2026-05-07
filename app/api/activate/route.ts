import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createUniqueChurchSlug } from "@/lib/slug";

const activationSchema = z.object({
  planCode: z.enum(["starter", "growth", "pro"]).default("growth"),

  churchName: z.string().min(2, "Nama gereja wajib diisi"),
  churchAddress: z.string().optional(),
  picEmail: z.string().email("Email PIC tidak valid"),
  picPhone: z.string().min(6, "Nomor PIC wajib diisi"),

  adminName: z.string().min(2, "Nama admin wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string().min(8, "Confirm password minimal 8 karakter"),

  divisions: z
    .array(
      z.object({
        name: z.string().min(1, "Nama divisi wajib diisi"),
        picName: z.string().optional(),
        picPhone: z.string().optional(),
      })
    )
    .min(1, "Minimal 1 divisi"),
});

const planSeed = {
  starter: {
    code: "starter",
    name: "Starter",
    price: 9900,
    description: "Untuk gereja kecil atau tim pelayanan awal.",
  },
  growth: {
    code: "growth",
    name: "Growth",
    price: 27900,
    description: "Untuk gereja aktif dengan operasional pelayanan mingguan.",
  },
  pro: {
    code: "pro",
    name: "Pro Ministry",
    price: 49000,
    description: "Untuk gereja berkembang dengan kebutuhan sistem lengkap.",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = activationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Data aktivasi belum lengkap.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.password !== data.confirmPassword) {
      return NextResponse.json(
        {
          ok: false,
          message: "Password dan confirm password belum sama.",
        },
        { status: 400 }
      );
    }

    const selectedPlan = planSeed[data.planCode];

    const result = await db.$transaction(async (tx) => {
      await tx.plan.upsert({
        where: { code: selectedPlan.code },
        update: {
          name: selectedPlan.name,
          price: selectedPlan.price,
          description: selectedPlan.description,
        },
        create: {
          code: selectedPlan.code,
          name: selectedPlan.name,
          price: selectedPlan.price,
          description: selectedPlan.description,
          billingCycle: "monthly",
          features: [],
        },
      });

      const existingUser = await tx.user.findUnique({
        where: { email: data.picEmail.toLowerCase() },
        select: { id: true },
      });

      if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      const slug = await createUniqueChurchSlug(tx, data.churchName);
      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await tx.user.create({
        data: {
          name: data.adminName,
          email: data.picEmail.toLowerCase(),
          phone: data.picPhone,
          passwordHash,
        },
      });

      const church = await tx.church.create({
        data: {
          name: data.churchName,
          slug,
          address: data.churchAddress || null,
          picName: data.adminName,
          picEmail: data.picEmail.toLowerCase(),
          picPhone: data.picPhone,
          status: "TRIAL",
        },
      });

      await tx.churchMember.create({
        data: {
          churchId: church.id,
          userId: user.id,
          role: "CHURCH_OWNER",
        },
      });

      await tx.churchDivision.createMany({
        data: data.divisions
          .filter((division) => division.name.trim())
          .map((division) => ({
            churchId: church.id,
            name: division.name.trim(),
            picName: division.picName?.trim() || null,
            picPhone: division.picPhone?.trim() || null,
          })),
      });

      const now = new Date();
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      await tx.subscription.create({
        data: {
          churchId: church.id,
          planCode: selectedPlan.code,
          status: "TRIALING",
          trialStartedAt: now,
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
        },
      });

      await tx.activationRequest.create({
        data: {
          churchId: church.id,
          planCode: selectedPlan.code,
          paymentStatus: "DUMMY",
          activationStatus: "completed",
          rawPayload: {
            churchName: data.churchName,
            churchAddress: data.churchAddress,
            picEmail: data.picEmail,
            picPhone: data.picPhone,
            adminName: data.adminName,
            divisions: data.divisions,
          },
        },
      });

      return {
        tenantSlug: church.slug,
      };
    });

    return NextResponse.json({
      ok: true,
      message: "Workspace gereja berhasil dibuat.",
      tenantSlug: result.tenantSlug,
      redirectTo: `/church/${result.tenantSlug}/dashboard`,
    });
  } catch (error) {
    console.error("Activation error:", error);

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Email ini sudah terdaftar. Silakan login atau gunakan email lain.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Terjadi kesalahan saat aktivasi workspace.",
      },
      { status: 500 }
    );
  }
}