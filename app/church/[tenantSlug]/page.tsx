import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function ChurchRootPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  redirect(`/church/${tenantSlug}/dashboard`);
}