import ChurchAppShell from "@/components/ChurchAppShell";
import ChurchModulePlaceholder from "@/components/ChurchModulePlaceholder";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function MembersPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="members">
      <ChurchModulePlaceholder
        tenantSlug={tenantSlug}
        eyebrow="Members"
        title="Database jemaat & relawan."
        description="Kelola data jemaat, pelayan, nomor WhatsApp, email, status, dan relasi ke divisi pelayanan."
        primaryLabel="Setup Divisions First"
        primaryHref={`/church/${tenantSlug}/divisions`}
        features={[
          "Tambah jemaat dan pelayan.",
          "Search dan filter member.",
          "Assign member ke divisi.",
          "Status aktif, inactive, atau perlu follow up.",
        ]}
      />
    </ChurchAppShell>
  );
}