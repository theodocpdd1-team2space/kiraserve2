import ChurchAppShell from "@/components/ChurchAppShell";
import ChurchModulePlaceholder from "@/components/ChurchModulePlaceholder";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function BillingPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  return (
    <ChurchAppShell tenantSlug={tenantSlug} active="billing">
      <ChurchModulePlaceholder
        tenantSlug={tenantSlug}
        eyebrow="Billing"
        title="Plan, trial, dan subscription."
        description="Kelola status trial, paket aktif, pembayaran manual, invoice, dan restore policy."
        features={[
          "Trial 14 hari.",
          "Plan Starter, Growth, dan Pro Ministry.",
          "Manual payment status.",
          "Grace period dan maintenance mode future.",
        ]}
      />
    </ChurchAppShell>
  );
}