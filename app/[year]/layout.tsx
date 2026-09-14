import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import type { Year } from "@/lib/years";

export default async function YearLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  if (year !== "2019" && year !== "2009") notFound();

  return <PageShell nav={<DashboardNav year={year as Year} />}>{children}</PageShell>;
}
