import { db } from "@/lib/db";

export type ProvenanceStatus = "actual" | "partial" | "blended" | "modeled" | "unavailable";

export interface ProvenanceDataset {
  key: string;
  source: "actual" | "partial" | "sample" | "none";
  as_of: string | null;
}

export interface Provenance {
  status: ProvenanceStatus;
  datasets: ProvenanceDataset[];
  note?: string;
  /** Honest denominator for partial data, e.g. "gender known for 9,1xx of 10,868 pooled records". */
  coverage?: string;
}

export interface WidgetPayload<T> {
  data: T;
  provenance: Provenance;
}

export interface RegistryRow {
  dataset_key: string;
  active_source: "actual" | "partial" | "sample" | "none";
  loaded_at: string | null;
  display_name: string;
  notes: string | null;
  coverage_count: number | null;
  coverage_denominator: number | null;
  coverage_note: string | null;
}

export async function getRegistry(): Promise<Map<string, RegistryRow>> {
  const { rows } = await db.query<RegistryRow>(
    `SELECT dataset_key, active_source, loaded_at, display_name, notes,
            coverage_count, coverage_denominator, coverage_note
     FROM app.dataset_registry`
  );
  return new Map(rows.map((r) => [r.dataset_key, r]));
}

/**
 * Compose a widget's provenance from the datasets that feed it.
 * Derived status (overridable via opts.status):
 *  - all inputs actual              -> "actual"
 *  - any input partial              -> "partial"
 *  - any input none (and needed)    -> "unavailable"
 *  - sample inputs, real totals     -> "blended"
 *  - primary measure modeled        -> "modeled"
 */
export function provenanceFor(
  registry: Map<string, RegistryRow>,
  datasetKeys: string[],
  opts: { totalsReal?: boolean; note?: string; status?: ProvenanceStatus; coverage?: string } = {}
): Provenance {
  const datasets: ProvenanceDataset[] = datasetKeys.map((key) => {
    const row = registry.get(key);
    return {
      key,
      source: row?.active_source ?? "none",
      as_of: row?.loaded_at ? new Date(row.loaded_at).toISOString().slice(0, 10) : null
    };
  });

  let status: ProvenanceStatus;
  if (opts.status) {
    status = opts.status;
  } else if (datasets.every((d) => d.source === "actual")) {
    status = "actual";
  } else if (datasets.some((d) => d.source === "partial")) {
    status = "partial";
  } else if (datasets.some((d) => d.source === "none")) {
    status = "unavailable";
  } else {
    status = opts.totalsReal !== false ? "blended" : "modeled";
  }

  return { status, datasets, note: opts.note, coverage: opts.coverage };
}

export const TARGET_TOTAL = Number(process.env.ICTA_TARGET_TOTAL ?? 20_000_000);
