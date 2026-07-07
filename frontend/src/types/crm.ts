export interface CRMRecord {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: string | null;
  crm_note: string | null;
  data_source: string | null;
  possession_time: string | null;
  description: string | null;
}

export interface SkippedRecord {
  row: Record<string, unknown>;
  reason: string;
}

export interface ImportResponse {
  imported: CRMRecord[];
  skipped: SkippedRecord[];
  total_imported: number;
  total_skipped: number;
}
