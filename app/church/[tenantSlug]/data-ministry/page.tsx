import ChurchAppShell from "@/components/ChurchAppShell";
import ChurchModulePlaceholder from "@/components/ChurchModulePlaceholder";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function DataMinistryPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="data-ministry">
      <ChurchModulePlaceholder
        tenantSlug={tenantSlug}
        eyebrow="Data Ministry"
        title="Attendance & ministry reports."
        description="Pantau kehadiran ibadah, volunteer attendance, dan pertumbuhan pelayanan melalui dashboard data."
        features={[
          "Attendance counter.",
          "Total per ibadah.",
          "Grafik mingguan dan bulanan.",
          "Export report future.",
        ]}
      />
    </ChurchAppShell>
  );
}