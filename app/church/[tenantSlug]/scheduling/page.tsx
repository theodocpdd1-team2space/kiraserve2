import type { ReactNode } from "react";
import Link from "next/link";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  Clock,
  Eye,
  LayoutGrid,
  MapPin,
  Network,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import ChurchAppShell from "@/components/ChurchAppShell";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
  searchParams?: Promise<{
    q?: string;
    division?: string;
    status?: string;
    type?: string;
    add?: string;
    edit?: string;
  }>;
};

const scheduleStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const scheduleTypes = [
  {
    value: "SINGLE_SESSION",
    label: "Single Session",
    desc: "Untuk 1 sesi pelayanan saja.",
  },
  {
    value: "WEEKLY_BY_DATE",
    label: "Weekly by Date",
    desc: "Untuk jadwal mingguan berdasarkan tanggal.",
  },
  {
    value: "MULTI_SERVICE_DAY",
    label: "Multi Service Day",
    desc: "Untuk 1 hari dengan beberapa ibadah.",
  },
  {
    value: "MONTHLY_MULTI_SERVICE",
    label: "Monthly Multi Service",
    desc: "Untuk jadwal bulanan, beberapa tanggal dan beberapa sesi.",
  },
  {
    value: "CUSTOM_TABLE",
    label: "Custom Table",
    desc: "Untuk retreat, camp, event khusus, atau format bebas.",
  },
] as const;

const visibilityOptions = ["PRIVATE", "PUBLIC_LINK"] as const;

function dateInputValue(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function queryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });

  const output = search.toString();
  return output ? `?${output}` : "";
}

function createInitialTableJson(scheduleType: string) {
  return {
    type: scheduleType,
    version: 1,
    groups: [],
  };
}

function createReminderRules(formData: FormData) {
  const enabled = formData.get("reminderEnabled") === "on";

  if (!enabled) return [];

  const daysBefore = formData
    .getAll("reminderDaysBefore")
    .map(String)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

  const reminderTime = String(formData.get("reminderTime") || "09:00");

  return daysBefore.map((day) => ({
    daysBefore: day,
    time: reminderTime,
    channel: "EMAIL",
  }));
}

async function createSchedule(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const divisionId = String(formData.get("divisionId") || "");
  const title = String(formData.get("title") || "").trim();
  const serviceDateRaw = String(formData.get("serviceDate") || "");
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const status = String(formData.get("status") || "DRAFT");
  const scheduleType = String(formData.get("scheduleType") || "WEEKLY_BY_DATE");
  const visibility = String(formData.get("visibility") || "PRIVATE");
  const reminderEnabled = formData.get("reminderEnabled") === "on";
  const reminderRules = createReminderRules(formData);

  if (!tenantSlug || !divisionId || !title || !serviceDateRaw) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  const division = await db.churchDivision.findFirst({
    where: {
      id: divisionId,
      churchId: church.id,
    },
    select: { id: true },
  });

  if (!division) return;

  const shareSlug =
    visibility === "PUBLIC_LINK"
      ? `${title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 40)}-${randomUUID().slice(0, 8)}`
      : null;

  const schedule = await db.divisionSchedule.create({
    data: {
      churchId: church.id,
      divisionId: division.id,
      title,
      serviceDate: new Date(`${serviceDateRaw}T00:00:00.000+07:00`),
      startTime: startTime || null,
      endTime: endTime || null,
      location: location || null,
      notes: notes || null,
      status: status as any,
      scheduleType: scheduleType as any,
      visibility: visibility as any,
      shareSlug,
      tableJson: createInitialTableJson(scheduleType),
      reminderEnabled,
      reminderRules,
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling`);
  redirect(`/church/${church.slug}/scheduling/${schedule.id}`);
}

async function updateSchedule(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");
  const divisionId = String(formData.get("divisionId") || "");
  const title = String(formData.get("title") || "").trim();
  const serviceDateRaw = String(formData.get("serviceDate") || "");
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const status = String(formData.get("status") || "DRAFT");
  const scheduleType = String(formData.get("scheduleType") || "WEEKLY_BY_DATE");
  const visibility = String(formData.get("visibility") || "PRIVATE");
  const reminderEnabled = formData.get("reminderEnabled") === "on";
  const reminderRules = createReminderRules(formData);

  if (!tenantSlug || !scheduleId || !divisionId || !title || !serviceDateRaw) {
    return;
  }

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  const division = await db.churchDivision.findFirst({
    where: {
      id: divisionId,
      churchId: church.id,
    },
    select: { id: true },
  });

  if (!division) return;

  const existingSchedule = await db.divisionSchedule.findFirst({
    where: {
      id: scheduleId,
      churchId: church.id,
    },
    select: {
      id: true,
      shareSlug: true,
      visibility: true,
      tableJson: true,
    },
  });

  if (!existingSchedule) return;

  const nextShareSlug =
    visibility === "PUBLIC_LINK"
      ? existingSchedule.shareSlug ||
        `${title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 40)}-${randomUUID().slice(0, 8)}`
      : null;

  await db.divisionSchedule.updateMany({
    where: {
      id: scheduleId,
      churchId: church.id,
    },
    data: {
      divisionId: division.id,
      title,
      serviceDate: new Date(`${serviceDateRaw}T00:00:00.000+07:00`),
      startTime: startTime || null,
      endTime: endTime || null,
      location: location || null,
      notes: notes || null,
      status: status as any,
      scheduleType: scheduleType as any,
      visibility: visibility as any,
      shareSlug: nextShareSlug,
      tableJson: existingSchedule.tableJson || createInitialTableJson(scheduleType),
      reminderEnabled,
      reminderRules,
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling`);
  revalidatePath(`/church/${church.slug}/scheduling/${scheduleId}`);
  redirect(`/church/${church.slug}/scheduling?division=${division.id}`);
}

async function deleteSchedule(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");

  if (!tenantSlug || !scheduleId) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  await db.divisionSchedule.deleteMany({
    where: {
      id: scheduleId,
      churchId: church.id,
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling`);
}

export default async function SchedulingPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params;
  const query = (await searchParams) || {};

  const q = query.q?.trim() || "";
  const selectedDivision = query.division || "";
  const selectedStatus = query.status || "";
  const selectedType = query.type || "";
  const addOpen = query.add === "1";
  const editId = query.edit || "";

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    include: {
      divisions: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: {
              divisionMembers: true,
              servingRoles: true,
            },
          },
        },
      },
      divisionSchedules: {
        where: {
          ...(selectedDivision ? { divisionId: selectedDivision } : {}),
          ...(selectedStatus ? { status: selectedStatus as any } : {}),
          ...(selectedType ? { scheduleType: selectedType as any } : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { location: { contains: q, mode: "insensitive" } },
                  { notes: { contains: q, mode: "insensitive" } },
                  { division: { name: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        include: {
          division: true,
        },
        orderBy: [
          { serviceDate: "asc" },
          { startTime: "asc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  if (!church) notFound();

  const editSchedule = editId
    ? await db.divisionSchedule.findFirst({
        where: {
          id: editId,
          churchId: church.id,
        },
        include: {
          division: true,
        },
      })
    : null;

  const basePath = `/church/${church.slug}/scheduling`;

  const activeSchedules = church.divisionSchedules.filter(
    (schedule) => schedule.status !== "ARCHIVED"
  ).length;

  const publishedSchedules = church.divisionSchedules.filter(
    (schedule) => schedule.status === "PUBLISHED"
  ).length;

  const reminderEnabledCount = church.divisionSchedules.filter(
    (schedule) => schedule.reminderEnabled
  ).length;

  const openAddUrl = `${basePath}${queryString({
    q,
    division: selectedDivision,
    status: selectedStatus,
    type: selectedType,
    add: "1",
  })}`;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="scheduling">
      <div className="pb-28 pt-5 md:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
              Table Builder Scheduling
            </p>
            <h1 className="text-3xl font-black tracking-tight text-black md:text-5xl">
              Scheduling
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/50">
              Buat dokumen jadwal pelayanan per divisi dengan tipe tabel: single session, weekly, multi-service, monthly, dan custom table.
            </p>
          </div>

          <Link
            href={openAddUrl}
            className="font-mono flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-sm hover:bg-black/90"
          >
            <Plus className="h-4 w-4" />
            Add Schedule
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          <MetricCard label="Schedules" value={String(church.divisionSchedules.length)} />
          <MetricCard label="Active" value={String(activeSchedules)} />
          <MetricCard label="Published" value={String(publishedSchedules)} />
          <MetricCard label="Reminder On" value={String(reminderEnabledCount)} />
        </div>

        <section className="mb-6 overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 bg-white p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-black">
                  Filter Schedule
                </h2>
                <p className="text-xs font-medium text-black/40">
                  Filter jadwal berdasarkan divisi, status, dan jenis table.
                </p>
              </div>
            </div>

            <form
              action={basePath}
              className="grid gap-3 md:grid-cols-[1fr_200px_180px_220px_120px]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search schedule..."
                  className="h-11 w-full rounded-2xl border border-black/10 bg-[#FAFAFA] pl-10 pr-4 text-sm font-medium outline-none placeholder:text-black/30 focus:border-black focus:bg-white"
                />
              </div>

              <select
                name="division"
                defaultValue={selectedDivision}
                className="h-11 rounded-2xl border border-black/10 bg-[#FAFAFA] px-4 text-sm font-medium outline-none focus:border-black focus:bg-white"
              >
                <option value="">All divisions</option>
                {church.divisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>

              <select
                name="status"
                defaultValue={selectedStatus}
                className="h-11 rounded-2xl border border-black/10 bg-[#FAFAFA] px-4 text-sm font-medium outline-none focus:border-black focus:bg-white"
              >
                <option value="">All status</option>
                {scheduleStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                name="type"
                defaultValue={selectedType}
                className="h-11 rounded-2xl border border-black/10 bg-[#FAFAFA] px-4 text-sm font-medium outline-none focus:border-black focus:bg-white"
              >
                <option value="">All table types</option>
                {scheduleTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="font-mono h-11 rounded-2xl bg-black px-4 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-black/90"
              >
                Filter
              </button>
            </form>
          </div>

          <div className="flex gap-3 overflow-x-auto bg-[#FAFAFA] p-3">
            <DivisionQuickLink
              href={basePath}
              active={!selectedDivision}
              name="All"
              count={church.divisionSchedules.length}
            />

            {church.divisions.map((division) => (
              <DivisionQuickLink
                key={division.id}
                href={`${basePath}?division=${division.id}`}
                active={selectedDivision === division.id}
                name={division.name}
                count={
                  church.divisionSchedules.filter(
                    (schedule) => schedule.divisionId === division.id
                  ).length
                }
              />
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 bg-white p-4 md:p-5">
            <h2 className="text-lg font-black tracking-tight text-black">
              Schedule Documents{" "}
              <span className="ml-1 text-black/25">
                {church.divisionSchedules.length}
              </span>
            </h2>
            <p className="text-xs font-medium text-black/40">
              Jadwal akan dibuka sebagai table document/builder di halaman detail.
            </p>
          </div>

          {church.divisionSchedules.length > 0 ? (
            <div className="grid gap-3 bg-[#FAFAFA] p-3 md:grid-cols-2 xl:grid-cols-3">
              {church.divisionSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  tenantSlug={church.slug}
                  schedule={schedule}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#FAFAFA] px-6 py-16">
              <EmptyState />
            </div>
          )}
        </section>

        {(addOpen || editSchedule) && (
          <ModalShell closeHref={basePath}>
            <div className="mx-auto max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
              <div className="border-b border-black/5 p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-black">
                      {editSchedule ? "Edit Schedule" : "Add Schedule"}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-black/45">
                      Pilih jenis table dari awal supaya builder nanti bisa generate format jadwal yang sesuai.
                    </p>
                  </div>

                  <Link
                    href={basePath}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black/10"
                  >
                    <X className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <form
                action={editSchedule ? updateSchedule : createSchedule}
                className="grid max-h-[70vh] gap-5 overflow-y-auto p-5 md:grid-cols-2 md:p-7"
              >
                <input type="hidden" name="tenantSlug" value={church.slug} />
                {editSchedule && (
                  <input type="hidden" name="scheduleId" value={editSchedule.id} />
                )}

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-black/45">
                    Division
                  </span>
                  <select
                    name="divisionId"
                    defaultValue={editSchedule?.divisionId || selectedDivision || ""}
                    required
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow focus:border-black focus:ring-4 focus:ring-black/5"
                  >
                    <option value="">Pilih divisi</option>
                    {church.divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </label>

                <Field
                  label="Schedule Title"
                  name="title"
                  placeholder="Jadwal Multimedia Juni 2026"
                  defaultValue={editSchedule?.title || ""}
                  required
                />

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-black/45">
                    Service Date / Start Date
                  </span>
                  <input
                    name="serviceDate"
                    type="date"
                    required
                    defaultValue={
                      editSchedule ? dateInputValue(editSchedule.serviceDate) : ""
                    }
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow focus:border-black focus:ring-4 focus:ring-black/5"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-black/45">
                    Table Type
                  </span>
                  <div className="grid gap-2 md:grid-cols-2">
                    {scheduleTypes.map((type) => (
                      <label
                        key={type.value}
                        className="flex cursor-pointer gap-3 rounded-2xl border border-black/10 bg-[#FAFAFA] p-4 hover:bg-white"
                      >
                        <input
                          type="radio"
                          name="scheduleType"
                          value={type.value}
                          defaultChecked={
                            editSchedule
                              ? editSchedule.scheduleType === type.value
                              : type.value === "WEEKLY_BY_DATE"
                          }
                          className="mt-1"
                        />
                        <span>
                          <span className="block text-sm font-black text-black">
                            {type.label}
                          </span>
                          <span className="mt-1 block text-xs font-medium leading-relaxed text-black/45">
                            {type.desc}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </label>

                <Field
                  label="Start Time"
                  name="startTime"
                  type="time"
                  placeholder="07:00"
                  defaultValue={editSchedule?.startTime || ""}
                />

                <Field
                  label="End Time"
                  name="endTime"
                  type="time"
                  placeholder="09:00"
                  defaultValue={editSchedule?.endTime || ""}
                />

                <Field
                  label="Location"
                  name="location"
                  placeholder="Main Hall"
                  defaultValue={editSchedule?.location || ""}
                />

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-black/45">
                    Status
                  </span>
                  <select
                    name="status"
                    defaultValue={editSchedule?.status || "DRAFT"}
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow focus:border-black focus:ring-4 focus:ring-black/5"
                  >
                    {scheduleStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-black/45">
                    Visibility
                  </span>
                  <select
                    name="visibility"
                    defaultValue={editSchedule?.visibility || "PRIVATE"}
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none transition-shadow focus:border-black focus:ring-4 focus:ring-black/5"
                  >
                    {visibilityOptions.map((visibility) => (
                      <option key={visibility} value={visibility}>
                        {visibility.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-black/10 bg-[#FAFAFA] p-4 md:col-span-2">
                  <label className="flex items-start gap-3">
                    <input
                      name="reminderEnabled"
                      type="checkbox"
                      defaultChecked={editSchedule?.reminderEnabled || false}
                      className="mt-1 h-4 w-4 rounded border-black/20"
                    />
                    <span>
                      <span className="block text-sm font-black text-black">
                        Enable email reminder
                      </span>
                      <span className="mt-1 block text-xs font-medium leading-relaxed text-black/45">
                        Reminder akan dipakai nanti saat sistem email/cron sudah aktif.
                      </span>
                    </span>
                  </label>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px]">
                    <div className="grid grid-cols-3 gap-2">
                      {[7, 3, 1].map((day) => (
                        <label
                          key={day}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-bold text-black"
                        >
                          <input
                            type="checkbox"
                            name="reminderDaysBefore"
                            value={String(day)}
                            defaultChecked
                          />
                          H-{day}
                        </label>
                      ))}
                    </div>

                    <input
                      name="reminderTime"
                      type="time"
                      defaultValue="09:00"
                      className="h-11 rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium outline-none focus:border-black"
                    />
                  </div>
                </div>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-black/45">
                    Notes
                  </span>
                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Catatan pelayanan..."
                    defaultValue={editSchedule?.notes || ""}
                    className="w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-medium outline-none transition-shadow placeholder:text-black/30 focus:border-black focus:ring-4 focus:ring-black/5"
                  />
                </label>

                <div className="col-span-full flex justify-end gap-3 border-t border-black/5 pt-5">
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
                    {editSchedule ? "Save" : "Create & Open Builder"}
                  </button>
                </div>
              </form>
            </div>
          </ModalShell>
        )}
      </div>
    </ChurchAppShell>
  );
}

function ScheduleCard({
  tenantSlug,
  schedule,
}: {
  tenantSlug: string;
  schedule: {
    id: string;
    title: string;
    serviceDate: Date;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    notes: string | null;
    status: string;
    scheduleType: string;
    visibility: string;
    reminderEnabled: boolean;
    division: {
      name: string;
    };
  };
}) {
  const typeLabel =
    scheduleTypes.find((type) => type.value === (schedule.scheduleType || "WEEKLY_BY_DATE"))?.label ||
    "Weekly by Date";

  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
            <LayoutGrid className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-black tracking-tight text-black">
              {schedule.title}
            </h3>
            <p className="truncate text-sm font-medium text-black/45">
              {schedule.division.name}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Link
            href={`/church/${tenantSlug}/scheduling?edit=${schedule.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
          >
            <Pencil className="h-4 w-4" />
          </Link>

          <form action={deleteSchedule}>
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <input type="hidden" name="scheduleId" value={schedule.id} />
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="mb-4 grid gap-2 rounded-2xl bg-[#FAFAFA] p-3">
        <InfoRow icon={CalendarCheck} label="Date" value={formatDate(schedule.serviceDate)} />
        <InfoRow
          icon={Clock}
          label="Time"
          value={
            schedule.startTime || schedule.endTime
              ? `${schedule.startTime || "--:--"} - ${schedule.endTime || "--:--"}`
              : "Belum diatur"
          }
        />
        <InfoRow icon={MapPin} label="Location" value={schedule.location || "Belum diatur"} />
        <InfoRow icon={LayoutGrid} label="Table" value={typeLabel} />
        <InfoRow icon={Eye} label="Visibility" value={(schedule.visibility || "PRIVATE").replaceAll("_", " ")} />
        <InfoRow
          icon={Bell}
          label="Reminder"
          value={schedule.reminderEnabled ? "Email reminder aktif" : "Off"}
        />
      </div>

      <div className="flex gap-2">
        <Link
          href={`/church/${tenantSlug}/scheduling/${schedule.id}`}
          className="font-mono flex h-11 flex-1 items-center justify-center rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-black/90"
        >
          Open Builder
        </Link>
      </div>
    </div>
  );
}

function DivisionQuickLink({
  href,
  active,
  name,
  count,
}: {
  href: string;
  active?: boolean;
  name: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-[180px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm transition ${
        active
          ? "border-black bg-black text-white"
          : "border-black/10 bg-white text-black hover:bg-black/[0.04]"
      }`}
    >
      <span className="truncate text-sm font-black">{name}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-black ${
          active ? "bg-[#D4F93A] text-black" : "bg-black/5 text-black/45"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-black/35" />
      <p className="min-w-0 text-sm">
        <span className="font-bold text-black/35">{label}: </span>
        <span className="font-bold text-black">{value}</span>
      </p>
    </div>
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
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-black/30">
        <CalendarCheck className="h-6 w-6" />
      </div>
      <p className="text-base font-black text-black">No schedule found</p>
      <p className="mt-1 text-sm font-medium text-black/45">
        Tambahkan dokumen jadwal pertama untuk mulai membuat table builder.
      </p>
    </div>
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

function ModalShell({
  children,
  closeHref,
}: {
  children: ReactNode;
  closeHref: string;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
      <Link href={closeHref} className="absolute inset-0" scroll={false} />

      <div className="relative z-10 flex w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}
