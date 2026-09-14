import { notFound } from "next/navigation";
import { VotersComparisonPage } from "@/components/dashboard/pages/VotersComparisonPage";
import type { Year } from "@/lib/years";

export default async function Page({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  if (year !== "2019" && year !== "2009") notFound();
  return <VotersComparisonPage year={year as Year} />;
}
