import ChurchAppShell from "@/components/ChurchAppShell";
import ChurchModulePlaceholder from "@/components/ChurchModulePlaceholder";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function SettingsPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="settings">
      <ChurchModulePlaceholder
        tenantSlug={tenantSlug}
        eyebrow="Settings"
        title="Pengaturan workspace gereja."
        description="Atur profil gereja, branding, kontak PIC, public page, dan preferensi operasional KiraServe."
        features={[
          "Edit profil gereja.",
          "Edit logo dan warna branding future.",
          "Atur PIC dan kontak.",
          "Custom domain future.",
        ]}
      />
    </ChurchAppShell>
  );
}