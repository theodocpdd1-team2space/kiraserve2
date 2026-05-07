import ChurchAppShell from "@/components/ChurchAppShell";
import ChurchModulePlaceholder from "@/components/ChurchModulePlaceholder";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function EventsPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="events">
      <ChurchModulePlaceholder
        tenantSlug={tenantSlug}
        eyebrow="Events"
        title="Registrasi event gereja."
        description="Kelola retreat, seminar, kelas, dan acara gereja dengan form pendaftaran dan QR check-in future."
        features={[
          "Create event.",
          "Public registration page.",
          "Export peserta.",
          "QR ticket dan check-in future.",
        ]}
      />
    </ChurchAppShell>
  );
}