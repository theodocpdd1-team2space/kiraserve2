import ChurchAppShell from "@/components/ChurchAppShell";
import ChurchModulePlaceholder from "@/components/ChurchModulePlaceholder";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function SchedulingPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="scheduling">
      <ChurchModulePlaceholder
        tenantSlug={tenantSlug}
        eyebrow="Smart Scheduling"
        title="Jadwal pelayanan mingguan."
        description="Buat jadwal pelayanan per sesi ibadah, divisi, role, dan pelayan dengan conflict warning."
        features={[
          "Create schedule mingguan.",
          "Assign pelayan ke role.",
          "Conflict warning untuk jadwal bentrok.",
          "Share WhatsApp dan Google Calendar future.",
        ]}
      />
    </ChurchAppShell>
  );
}