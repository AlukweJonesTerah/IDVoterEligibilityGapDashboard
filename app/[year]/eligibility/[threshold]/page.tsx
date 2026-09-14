import { notFound } from "next/navigation";
import { EligibilityPage } from "@/components/dashboard/pages/EligibilityPage";
import { THRESHOLDS, type Year } from "@/lib/years";

export default async function Page({ params }: { params: Promise<{ year: string; threshold: string }> }) {
  const { year, threshold } = await params;
  if (year !== "2019" && year !== "2009") notFound();
  if (!THRESHOLDS[year as Year].includes(threshold)) notFound();
  return <EligibilityPage year={year as Year} threshold={Number(threshold)} />;
}
