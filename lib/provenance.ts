import { db } from "@/lib/db";

export type ProvenanceStatus = "actual" | "modeled" | "blended";

export interface ProvenanceDataset {
  key: string;
  source: "actual" | "sample" | "none";
  as_of: string | null;
}

export interface Provenance {
  status: ProvenanceStatus;
  datasets: ProvenanceDataset[];
  note?: string;
}

export interface WidgetPayload<T> {
  data: T;
  provenance: Provenance;
}

interface RegistryRow {
  dataset_key: string;
  active_source: "actual" | "sample" | "none";
  loaded_at: string | null;
  display_name: string;
  notes: string | null;
}

export async function getRegistry(): Promise<Map<string, RegistryRow>> {
  const { rows } = await db.query<RegistryRow>(
    "SELECT dataset_key, active_source, loaded_at, display_name, notes FROM app.dataset_registry"
  );
  return new Map(rows.map((r) => [r.dataset_key, r]));
}

/**
 * Compose a widget's provenance from the datasets that feed it.
 * - all inputs actual            -> "actual"
 * - sample inputs, real totals   -> "blended"  (totalsReal = true)
 * - primary measure is modeled   -> "modeled"  (totalsReal = false)
 */
export function provenanceFor(
  registry: Map<string, RegistryRow>,
  datasetKeys: string[],
  opts: { totalsReal?: boolean; note?: string } = {}
): Provenance {
  const datasets: ProvenanceDataset[] = datasetKeys.map((key) => {
    const row = registry.get(key);
    return {
      key,
      source: row?.active_source ?? "none",
      as_of: row?.loaded_at ? new Date(row.loaded_at).toISOString().slice(0, 10) : null
    };
  });
  const allActual = datasets.every((d) => d.source === "actual");
  const status: ProvenanceStatus = allActual
    ? "actual"
    : opts.totalsReal !== false
      ? "blended"
      : "modeled";
  return { status, datasets, note: opts.note };
}

export const TARGET_TOTAL = Number(process.env.ICTA_TARGET_TOTAL ?? 20_000_000);
