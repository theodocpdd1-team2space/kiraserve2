import ChurchAppShell from "@/components/ChurchAppShell";
import ChurchModulePlaceholder from "@/components/ChurchModulePlaceholder";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function DivisionsPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="divisions">
      <ChurchModulePlaceholder
        tenantSlug={tenantSlug}
        eyebrow="Divisions"
        title="Struktur pelayanan gereja."
        description="Atur divisi pelayanan, PIC, koordinator, dan tim ministry sebagai fondasi scheduling KiraServe."
        primaryLabel="Next: Build Divisions CRUD"
        primaryHref={`/church/${tenantSlug}/divisions`}
        features={[
          "List divisi berdasarkan workspace.",
          "Tambah divisi baru.",
          "Edit nama dan PIC divisi.",
          "Delete divisi dengan tenant-safe query.",
        ]}
      />
    </ChurchAppShell>
  );
}