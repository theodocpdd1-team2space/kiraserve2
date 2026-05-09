import type { ElementType } from "react";
import { randomUUID } from "crypto";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CalendarCheck,
  Clock,
  LayoutGrid,
  MapPin,
  Network,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import ChurchAppShell from "@/components/ChurchAppShell";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
    scheduleId: string;
  }>;
};

type ScheduleCell = {
  columnId: string;
  churchMemberId?: string | null;
  displayName?: string | null;
  email?: string | null;
};

type ScheduleRow = {
  id: string;
  servingRoleId?: string | null;
  label: string;
  cells: ScheduleCell[];
};

type ScheduleColumn = {
  id: string;
  label: string;
  startTime?: string | null;
  endTime?: string | null;
};

type ScheduleGroup = {
  id: string;
  title: string;
  date?: string | null;
  note?: string | null;
  columns: ScheduleColumn[];
  rows: ScheduleRow[];
};

type ScheduleTableJson = {
  type: string;
  version: number;
  groups: ScheduleGroup[];
};

type DivisionMemberForAssignment = {
  churchMemberId: string;
  churchMember: {
    id: string;
    user: {
      name: string | null;
      email: string;
    };
    memberServingRoles: Array<{
      servingRoleId: string;
    }>;
  };
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function dateISO(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function safeTableJson(value: unknown, type: string): ScheduleTableJson {
  if (
    value &&
    typeof value === "object" &&
    "groups" in value &&
    Array.isArray((value as Partial<ScheduleTableJson>).groups)
  ) {
    const table = value as Partial<ScheduleTableJson>;

    return {
      type: typeof table.type === "string" ? table.type : type,
      version: typeof table.version === "number" ? table.version : 1,
      groups: (table.groups || []).map((group) => ({
        id: group.id,
        title: group.title,
        date: group.date || null,
        note: group.note || "",
        columns: Array.isArray(group.columns) ? group.columns : [],
        rows: Array.isArray(group.rows)
          ? group.rows.map((row) => ({
              ...row,
              cells: Array.isArray(row.cells) ? row.cells : [],
            }))
          : [],
      })),
    };
  }

  return {
    type,
    version: 1,
    groups: [],
  };
}

function builderId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

async function getScheduleForBuilder(tenantSlug: string, scheduleId: string) {
  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return null;

  const schedule = await db.divisionSchedule.findFirst({
    where: {
      id: scheduleId,
      churchId: church.id,
    },
    include: {
      division: {
        include: {
          servingRoles: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!schedule) return null;

  return { church, schedule };
}

function buildRows(servingRoles: Array<{ id: string; name: string }>) {
  return servingRoles.map((role) => ({
    id: `row-${role.id}`,
    servingRoleId: role.id,
    label: role.name,
    cells: [],
  }));
}

function createColumnsForType(
  scheduleType: string,
  serviceDate: Date,
  startTime?: string | null,
  endTime?: string | null
): ScheduleColumn[] {
  if (scheduleType === "SINGLE_SESSION") {
    return [
      {
        id: "col-single",
        label: startTime ? `Petugas ${startTime}` : "Petugas",
        startTime: startTime || null,
        endTime: endTime || null,
      },
    ];
  }

  if (scheduleType === "MULTI_SERVICE_DAY") {
    return [
      { id: "col-service-1", label: "Ibadah 1", startTime: startTime || "07:00", endTime: null },
      { id: "col-service-2", label: "Ibadah 2", startTime: "10:00", endTime: null },
      { id: "col-service-3", label: "Ibadah 3", startTime: "17:00", endTime: null },
    ];
  }

  if (scheduleType === "CUSTOM_TABLE") {
    return [
      { id: "col-1", label: "Session 1", startTime: startTime || null, endTime: endTime || null },
      { id: "col-2", label: "Session 2", startTime: null, endTime: null },
      { id: "col-3", label: "Session 3", startTime: null, endTime: null },
    ];
  }

  return [0, 7, 14, 21].map((offset, index) => {
    const date = addDays(serviceDate, offset);
    return {
      id: `col-week-${index + 1}`,
      label: formatDateShort(date),
      startTime: startTime || null,
      endTime: endTime || null,
    };
  });
}

function createTableTemplate({
  scheduleType,
  serviceDate,
  startTime,
  endTime,
  servingRoles,
}: {
  scheduleType: string;
  serviceDate: Date;
  startTime?: string | null;
  endTime?: string | null;
  servingRoles: Array<{ id: string; name: string }>;
}): ScheduleTableJson {
  const rows = buildRows(servingRoles);

  if (scheduleType === "MONTHLY_MULTI_SERVICE") {
    const groups = [0, 7, 14, 21].map((offset, index) => {
      const date = addDays(serviceDate, offset);

      return {
        id: `group-week-${index + 1}`,
        title: formatDate(date),
        date: dateISO(date),
        note: "",
        columns: [
          { id: `g${index + 1}-service-1`, label: "Ibadah 1", startTime: startTime || "07:00", endTime: null },
          { id: `g${index + 1}-service-2`, label: "Ibadah 2", startTime: "10:00", endTime: null },
          { id: `g${index + 1}-service-3`, label: "Ibadah 3", startTime: "17:00", endTime: null },
        ],
        rows: rows.map((row) => ({ ...row, cells: [] })),
      };
    });

    return {
      type: scheduleType,
      version: 1,
      groups,
    };
  }

  return {
    type: scheduleType,
    version: 1,
    groups: [
      {
        id: "group-main",
        title:
          scheduleType === "SINGLE_SESSION"
            ? "Single Session"
            : scheduleType === "MULTI_SERVICE_DAY"
              ? formatDate(serviceDate)
              : "Weekly Schedule",
        date: dateISO(serviceDate),
        note: "",
        columns: createColumnsForType(scheduleType, serviceDate, startTime, endTime),
        rows,
      },
    ],
  };
}

async function generateTableTemplate(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");

  if (!tenantSlug || !scheduleId) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  const schedule = await db.divisionSchedule.findFirst({
    where: {
      id: scheduleId,
      churchId: church.id,
    },
    include: {
      division: {
        include: {
          servingRoles: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!schedule) return;

  const tableJson = createTableTemplate({
    scheduleType: schedule.scheduleType,
    serviceDate: schedule.serviceDate,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    servingRoles: schedule.division.servingRoles,
  });

  await db.divisionSchedule.update({
    where: { id: schedule.id },
    data: {
      tableJson,
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling/${schedule.id}`);
}

async function addScheduleGroup(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!tenantSlug || !scheduleId || !title) return;

  const result = await getScheduleForBuilder(tenantSlug, scheduleId);

  if (!result) return;

  const { church, schedule } = result;
  const tableJson = safeTableJson(schedule.tableJson, schedule.scheduleType);
  const nextGroup: ScheduleGroup = {
    id: builderId("group"),
    title,
    date: date || null,
    note,
    columns: [],
    rows: [],
  };

  await db.divisionSchedule.update({
    where: { id: schedule.id },
    data: {
      tableJson: {
        ...tableJson,
        groups: [...tableJson.groups, nextGroup],
      },
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling/${schedule.id}`);
}

async function addScheduleColumn(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");
  const groupId = String(formData.get("groupId") || "");
  const label = String(formData.get("label") || "").trim();
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();

  if (!tenantSlug || !scheduleId || !groupId || !label) return;

  const result = await getScheduleForBuilder(tenantSlug, scheduleId);

  if (!result) return;

  const { church, schedule } = result;
  const tableJson = safeTableJson(schedule.tableJson, schedule.scheduleType);
  const nextColumn: ScheduleColumn = {
    id: builderId("col"),
    label,
    startTime: startTime || null,
    endTime: endTime || null,
  };

  const nextGroups = tableJson.groups.map((group) => {
    if (group.id !== groupId) return group;

    return {
      ...group,
      columns: [...group.columns, nextColumn],
    };
  });

  await db.divisionSchedule.update({
    where: { id: schedule.id },
    data: {
      tableJson: {
        ...tableJson,
        groups: nextGroups,
      },
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling/${schedule.id}`);
}

async function addScheduleRow(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");
  const groupId = String(formData.get("groupId") || "");
  const servingRoleId = String(formData.get("servingRoleId") || "");
  const customLabel = String(formData.get("customLabel") || "").trim();

  if (!tenantSlug || !scheduleId || !groupId) return;

  const result = await getScheduleForBuilder(tenantSlug, scheduleId);

  if (!result) return;

  const { church, schedule } = result;
  const selectedRole = servingRoleId
    ? schedule.division.servingRoles.find((role) => role.id === servingRoleId)
    : null;
  const label = customLabel || selectedRole?.name;

  if (!label) return;

  const tableJson = safeTableJson(schedule.tableJson, schedule.scheduleType);
  const nextRow: ScheduleRow = {
    id: selectedRole ? builderId(`row-${selectedRole.id}`) : builderId("row-custom"),
    servingRoleId: selectedRole?.id || null,
    label,
    cells: [],
  };

  const nextGroups = tableJson.groups.map((group) => {
    if (group.id !== groupId) return group;

    return {
      ...group,
      rows: [...group.rows, nextRow],
    };
  });

  await db.divisionSchedule.update({
    where: { id: schedule.id },
    data: {
      tableJson: {
        ...tableJson,
        groups: nextGroups,
      },
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling/${schedule.id}`);
}

async function deleteScheduleGroup(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");
  const groupId = String(formData.get("groupId") || "");

  if (!tenantSlug || !scheduleId || !groupId) return;

  const result = await getScheduleForBuilder(tenantSlug, scheduleId);

  if (!result) return;

  const { church, schedule } = result;
  const tableJson = safeTableJson(schedule.tableJson, schedule.scheduleType);
  const nextGroups = tableJson.groups.filter((group) => group.id !== groupId);

  await db.divisionSchedule.update({
    where: { id: schedule.id },
    data: {
      tableJson: {
        ...tableJson,
        groups: nextGroups,
      },
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling/${schedule.id}`);
}

async function deleteScheduleColumn(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");
  const groupId = String(formData.get("groupId") || "");
  const columnId = String(formData.get("columnId") || "");

  if (!tenantSlug || !scheduleId || !groupId || !columnId) return;

  const result = await getScheduleForBuilder(tenantSlug, scheduleId);

  if (!result) return;

  const { church, schedule } = result;
  const tableJson = safeTableJson(schedule.tableJson, schedule.scheduleType);
  const nextGroups = tableJson.groups.map((group) => {
    if (group.id !== groupId) return group;

    return {
      ...group,
      columns: group.columns.filter((column) => column.id !== columnId),
      rows: group.rows.map((row) => ({
        ...row,
        cells: row.cells.filter((cell) => cell.columnId !== columnId),
      })),
    };
  });

  await db.divisionSchedule.update({
    where: { id: schedule.id },
    data: {
      tableJson: {
        ...tableJson,
        groups: nextGroups,
      },
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling/${schedule.id}`);
}

async function deleteScheduleRow(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");
  const groupId = String(formData.get("groupId") || "");
  const rowId = String(formData.get("rowId") || "");

  if (!tenantSlug || !scheduleId || !groupId || !rowId) return;

  const result = await getScheduleForBuilder(tenantSlug, scheduleId);

  if (!result) return;

  const { church, schedule } = result;
  const tableJson = safeTableJson(schedule.tableJson, schedule.scheduleType);
  const nextGroups = tableJson.groups.map((group) => {
    if (group.id !== groupId) return group;

    return {
      ...group,
      rows: group.rows.filter((row) => row.id !== rowId),
    };
  });

  await db.divisionSchedule.update({
    where: { id: schedule.id },
    data: {
      tableJson: {
        ...tableJson,
        groups: nextGroups,
      },
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling/${schedule.id}`);
}

async function updateScheduleCell(formData: FormData) {
  "use server";

  const tenantSlug = String(formData.get("tenantSlug") || "");
  const scheduleId = String(formData.get("scheduleId") || "");
  const groupId = String(formData.get("groupId") || "");
  const rowId = String(formData.get("rowId") || "");
  const columnId = String(formData.get("columnId") || "");
  const churchMemberId = String(formData.get("churchMemberId") || "");

  if (!tenantSlug || !scheduleId || !groupId || !rowId || !columnId) return;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  });

  if (!church) return;

  const schedule = await db.divisionSchedule.findFirst({
    where: {
      id: scheduleId,
      churchId: church.id,
    },
    include: {
      division: {
        include: {
          servingRoles: {
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true },
          },
          divisionMembers: {
            include: {
              churchMember: {
                include: {
                  user: true,
                  memberServingRoles: {
                    include: {
                      servingRole: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!schedule) return;

  const tableJson = safeTableJson(schedule.tableJson, schedule.scheduleType);

  let selectedMember:
    | {
        id: string;
        user: {
          name: string | null;
          email: string;
        };
      }
    | null = null;

  if (churchMemberId) {
    const divisionMember = schedule.division.divisionMembers.find(
      (item) => item.churchMemberId === churchMemberId
    );

    if (!divisionMember) return;

    selectedMember = divisionMember.churchMember;
  }

  const nextGroups = tableJson.groups.map((group) => {
    if (group.id !== groupId) return group;

    const nextRows = group.rows.map((row) => {
      if (row.id !== rowId) return row;

      const existingCells = Array.isArray(row.cells) ? row.cells : [];
      const otherCells = existingCells.filter((cell) => cell.columnId !== columnId);

      if (!selectedMember) {
        return {
          ...row,
          cells: otherCells,
        };
      }

      return {
        ...row,
        cells: [
          ...otherCells,
          {
            columnId,
            churchMemberId: selectedMember.id,
            displayName: selectedMember.user.name || selectedMember.user.email,
            email: selectedMember.user.email,
          },
        ],
      };
    });

    return {
      ...group,
      rows: nextRows,
    };
  });

  await db.divisionSchedule.update({
    where: { id: schedule.id },
    data: {
      tableJson: {
        ...tableJson,
        groups: nextGroups,
      },
    },
  });

  revalidatePath(`/church/${church.slug}/scheduling/${schedule.id}`);
}

export default async function ScheduleDetailPage({ params }: PageProps) {
  const { tenantSlug, scheduleId } = await params;

  const church = await db.church.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!church) notFound();

  const schedule = await db.divisionSchedule.findFirst({
    where: {
      id: scheduleId,
      churchId: church.id,
    },
    include: {
      division: {
        include: {
          servingRoles: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
            },
          },
          divisionMembers: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              churchMember: {
                include: {
                  user: true,
                  memberServingRoles: {
                    include: {
                      servingRole: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!schedule) notFound();

  const tableJson = safeTableJson(schedule.tableJson, schedule.scheduleType);
  const hasTable = tableJson.groups.length > 0;

  const typeLabel = schedule.scheduleType.replaceAll("_", " ");
  const reminderSummary = schedule.reminderEnabled
    ? "Email reminder aktif"
    : "Reminder off";

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="scheduling">
      <div className="pb-28 pt-5 md:py-8">
        <div className="mb-4">
          <Link
            href={`/church/${church.slug}/scheduling`}
            className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-black/45 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to scheduling
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
                Schedule Table Builder
              </p>
              <h1 className="text-2xl font-black tracking-tight text-black md:text-4xl">
                {schedule.title}
              </h1>
              <p className="mt-1 max-w-3xl text-xs font-bold text-black/45">
                {schedule.division.name} · {typeLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/church/${church.slug}/scheduling?edit=${schedule.id}`}
                className="font-mono flex h-11 items-center justify-center rounded-2xl border border-black/10 bg-white px-5 text-xs font-bold uppercase tracking-[0.1em] text-black shadow-sm hover:bg-black/5"
              >
                Edit Metadata
              </Link>

              <form action={generateTableTemplate}>
                <input type="hidden" name="tenantSlug" value={church.slug} />
                <input type="hidden" name="scheduleId" value={schedule.id} />
                <button
                  type="submit"
                  className="font-mono flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-sm hover:bg-black/90"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {hasTable ? "Regenerate" : "Generate Table"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <section className="mb-4 overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-sm">
          <div className="grid gap-px bg-black/5 sm:grid-cols-2 xl:grid-cols-7">
            <CompactInfo label="Division" value={schedule.division.name} icon={Network} />
            <CompactInfo label="Type" value={typeLabel} icon={LayoutGrid} />
            <CompactInfo label="Date" value={formatDate(schedule.serviceDate)} icon={CalendarCheck} />
            <CompactInfo label="Status" value={schedule.status} icon={BadgeCheck} />
            <CompactInfo
              label="Time"
              value={
                schedule.startTime || schedule.endTime
                  ? `${schedule.startTime || "--:--"} - ${schedule.endTime || "--:--"}`
                  : "Belum diatur"
              }
              icon={Clock}
            />
            <CompactInfo label="Location" value={schedule.location || "Belum diatur"} icon={MapPin} />
            <CompactInfo label="Reminder" value={reminderSummary} icon={Bell} />
          </div>
        </section>

        <AddScheduleGroupForm
          tenantSlug={church.slug}
          scheduleId={schedule.id}
          defaultDate={dateISO(schedule.serviceDate)}
        />

        {!hasTable ? (
          <section className="rounded-[30px] border border-dashed border-black/15 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4F93A] text-black">
              <LayoutGrid className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-black">
              Table belum dibuat
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-relaxed text-black/50">
              Klik Generate Table untuk membuat table awal berdasarkan tipe jadwal dan serving roles dari divisi ini.
            </p>
            <form action={generateTableTemplate} className="mt-6">
              <input type="hidden" name="tenantSlug" value={church.slug} />
              <input type="hidden" name="scheduleId" value={schedule.id} />
              <button
                type="submit"
                className="font-mono inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-black/90"
              >
                <RefreshCcw className="h-4 w-4" />
                Generate Table
              </button>
            </form>
          </section>
        ) : (
          <div className="space-y-6">
            {tableJson.groups.map((group) => (
              <ScheduleGroupTable
                key={group.id}
                tenantSlug={church.slug}
                scheduleId={schedule.id}
                group={group}
                divisionMembers={schedule.division.divisionMembers}
                servingRoles={schedule.division.servingRoles}
              />
            ))}
          </div>
        )}
      </div>
    </ChurchAppShell>
  );
}

function AddScheduleGroupForm({
  tenantSlug,
  scheduleId,
  defaultDate,
}: {
  tenantSlug: string;
  scheduleId: string;
  defaultDate: string;
}) {
  return (
    <section className="mb-6 rounded-[24px] border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#D4F93A] text-black">
          <Plus className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-black">
          Add Group
        </h2>
      </div>

      <form
        action={addScheduleGroup}
        className="grid gap-3 lg:grid-cols-[1.2fr_170px_1.4fr_auto]"
      >
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        <input type="hidden" name="scheduleId" value={scheduleId} />

        <label className="space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black/35">
            Title
          </span>
          <input
            name="title"
            placeholder="Weekly Schedule"
            required
            className="h-11 w-full rounded-2xl border border-black/10 bg-[#FAFAFA] px-4 text-sm font-bold outline-none focus:border-black"
          />
        </label>

        <label className="space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black/35">
            Date
          </span>
          <input
            type="date"
            name="date"
            defaultValue={defaultDate}
            className="h-11 w-full rounded-2xl border border-black/10 bg-[#FAFAFA] px-4 text-sm font-bold outline-none focus:border-black"
          />
        </label>

        <label className="space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black/35">
            Note
          </span>
          <input
            name="note"
            placeholder="Optional note"
            className="h-11 w-full rounded-2xl border border-black/10 bg-[#FAFAFA] px-4 text-sm font-bold outline-none focus:border-black"
          />
        </label>

        <button
          type="submit"
          className="font-mono mt-5 flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-black/90 lg:mt-6"
        >
          <Plus className="h-4 w-4" />
          Add Group
        </button>
      </form>
    </section>
  );
}

function ScheduleGroupTable({
  tenantSlug,
  scheduleId,
  group,
  divisionMembers,
  servingRoles,
}: {
  tenantSlug: string;
  scheduleId: string;
  group: ScheduleGroup;
  divisionMembers: DivisionMemberForAssignment[];
  servingRoles: Array<{ id: string; name: string }>;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-black/10 bg-white p-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-black tracking-tight text-black">
            {group.title}
          </h2>
          <p className="mt-1 text-xs font-medium text-black/45">
            {group.date || "No date"} {group.note ? `· ${group.note}` : ""}
          </p>
        </div>

        <form action={deleteScheduleGroup}>
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <input type="hidden" name="scheduleId" value={scheduleId} />
          <input type="hidden" name="groupId" value={group.id} />
          <button
            type="submit"
            className="font-mono inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete Group
          </button>
        </form>
      </div>

      <div className="grid gap-px border-b border-black/10 bg-black/5 lg:grid-cols-2">
        <div className="bg-[#FAFAFA] p-4">
          <AddScheduleColumnForm
            tenantSlug={tenantSlug}
            scheduleId={scheduleId}
            groupId={group.id}
          />
        </div>
        <div className="bg-[#FAFAFA] p-4">
          <AddScheduleRowForm
            tenantSlug={tenantSlug}
            scheduleId={scheduleId}
            groupId={group.id}
            servingRoles={servingRoles}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-[#FAFAFA]">
              <th className="sticky left-0 z-10 w-[220px] bg-[#FAFAFA] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-black/40">
                Serving Role
              </th>
              {group.columns.map((column) => (
                <th
                  key={column.id}
                  className="min-w-[220px] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-black/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate">{column.label}</div>
                      {(column.startTime || column.endTime) && (
                        <div className="mt-1 font-mono text-[10px] font-bold text-black/30">
                          {column.startTime || "--:--"} - {column.endTime || "--:--"}
                        </div>
                      )}
                    </div>

                    <form action={deleteScheduleColumn} className="shrink-0">
                      <input type="hidden" name="tenantSlug" value={tenantSlug} />
                      <input type="hidden" name="scheduleId" value={scheduleId} />
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="columnId" value={column.id} />
                      <button
                        type="submit"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-black/40 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        title={`Delete column ${column.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-black/5">
            {group.rows.length === 0 ? (
              <tr className="bg-white">
                <td
                  colSpan={group.columns.length + 1}
                  className="px-4 py-8 text-center text-sm font-bold text-black/35"
                >
                  Belum ada row di group ini.
                </td>
              </tr>
            ) : (
              group.rows.map((row) => (
              <tr key={row.id} className="bg-white">
                <td className="sticky left-0 z-10 bg-white px-4 py-4 align-top">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-black tracking-tight text-black">
                        {row.label}
                      </div>
                      <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black/35">
                        {row.servingRoleId ? "Serving Role" : "Custom Row"}
                      </div>
                    </div>

                    <form action={deleteScheduleRow} className="shrink-0">
                      <input type="hidden" name="tenantSlug" value={tenantSlug} />
                      <input type="hidden" name="scheduleId" value={scheduleId} />
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="rowId" value={row.id} />
                      <button
                        type="submit"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-[#FAFAFA] text-black/35 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        title={`Delete row ${row.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </td>

                {group.columns.map((column) => {
                  const cell = row.cells?.find(
                    (item) => item.columnId === column.id
                  );

                  return (
                    <td key={column.id} className="px-4 py-4 align-top">
                      <CellAssignmentForm
                        tenantSlug={tenantSlug}
                        scheduleId={scheduleId}
                        groupId={group.id}
                        row={row}
                        columnId={column.id}
                        currentMemberId={cell?.churchMemberId || ""}
                        currentName={cell?.displayName || ""}
                        divisionMembers={divisionMembers}
                      />
                    </td>
                  );
                })}
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AddScheduleColumnForm({
  tenantSlug,
  scheduleId,
  groupId,
}: {
  tenantSlug: string;
  scheduleId: string;
  groupId: string;
}) {
  return (
    <form action={addScheduleColumn} className="space-y-3">
      <input type="hidden" name="tenantSlug" value={tenantSlug} />
      <input type="hidden" name="scheduleId" value={scheduleId} />
      <input type="hidden" name="groupId" value={groupId} />

      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-black/40" />
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black/40">
          Add Column
        </h3>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_110px_110px_auto]">
        <input
          name="label"
          placeholder="Ibadah 1"
          required
          className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-xs font-bold outline-none focus:border-black"
        />
        <input
          type="time"
          name="startTime"
          className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-xs font-bold outline-none focus:border-black"
        />
        <input
          type="time"
          name="endTime"
          className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-xs font-bold outline-none focus:border-black"
        />
        <button
          type="submit"
          className="font-mono flex h-10 items-center justify-center rounded-2xl bg-black px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white hover:bg-black/90"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function AddScheduleRowForm({
  tenantSlug,
  scheduleId,
  groupId,
  servingRoles,
}: {
  tenantSlug: string;
  scheduleId: string;
  groupId: string;
  servingRoles: Array<{ id: string; name: string }>;
}) {
  return (
    <form action={addScheduleRow} className="space-y-3">
      <input type="hidden" name="tenantSlug" value={tenantSlug} />
      <input type="hidden" name="scheduleId" value={scheduleId} />
      <input type="hidden" name="groupId" value={groupId} />

      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-black/40" />
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black/40">
          Add Row
        </h3>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
        <select
          name="servingRoleId"
          defaultValue=""
          className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-xs font-bold outline-none focus:border-black"
        >
          <option value="">Custom row</option>
          {servingRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <input
          name="customLabel"
          placeholder="Custom label"
          className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-xs font-bold outline-none focus:border-black"
        />
        <button
          type="submit"
          className="font-mono flex h-10 items-center justify-center rounded-2xl bg-black px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white hover:bg-black/90"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function CellAssignmentForm({
  tenantSlug,
  scheduleId,
  groupId,
  row,
  columnId,
  currentMemberId,
  currentName,
  divisionMembers,
}: {
  tenantSlug: string;
  scheduleId: string;
  groupId: string;
  row: ScheduleRow;
  columnId: string;
  currentMemberId: string;
  currentName: string;
  divisionMembers: DivisionMemberForAssignment[];
}) {
  const eligibleMembers = divisionMembers.filter((item) => {
    if (!row.servingRoleId) return true;

    const memberServingRoles = item.churchMember.memberServingRoles || [];
    const hasRole = memberServingRoles.some(
      (memberRole) => memberRole.servingRoleId === row.servingRoleId
    );

    return hasRole;
  });

  const options = eligibleMembers.length > 0 ? eligibleMembers : divisionMembers;

  return (
    <form action={updateScheduleCell} className="space-y-2">
      <input type="hidden" name="tenantSlug" value={tenantSlug} />
      <input type="hidden" name="scheduleId" value={scheduleId} />
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="rowId" value={row.id} />
      <input type="hidden" name="columnId" value={columnId} />

      {currentName ? (
        <div className="mb-2 rounded-2xl bg-[#D4F93A] px-3 py-2 text-sm font-black text-black">
          {currentName}
        </div>
      ) : (
        <div className="mb-2 rounded-2xl border border-dashed border-black/15 bg-[#FAFAFA] px-3 py-2 text-sm font-bold text-black/30">
          Belum diisi
        </div>
      )}

      <div className="flex gap-2">
        <select
          name="churchMemberId"
          defaultValue={currentMemberId}
          className="h-10 min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-3 text-xs font-bold outline-none focus:border-black"
        >
          <option value="">Kosongkan</option>
          {options.map((item) => (
            <option key={item.churchMember.id} value={item.churchMember.id}>
              {item.churchMember.user.name || item.churchMember.user.email}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-white hover:bg-black/90"
          title="Save assignment"
        >
          <Save className="h-4 w-4" />
        </button>
      </div>

      {eligibleMembers.length === 0 && divisionMembers.length > 0 && (
        <p className="text-[10px] font-medium leading-relaxed text-amber-600">
          Belum ada member yang punya serving role ini. Menampilkan semua member divisi.
        </p>
      )}
    </form>
  );
}

function CompactInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 bg-white px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#F4F5EF] text-black">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/35">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-black text-black">
          {value}
        </p>
      </div>
    </div>
  );
}
