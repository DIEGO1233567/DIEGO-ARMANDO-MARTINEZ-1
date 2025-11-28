export type DataValue = string | number | null;

export interface DataRow {
  [key: string]: DataValue;
}

export interface FinancialRow {
  id: string;
  concept: string; // Asunto
  type: string; // Tipo (Category)
  segment: string; // Calculated Segment (Business Unit) or 'Liverpool' fallback
  impactType: string; // BG/ER
  amount: number; // The row total (or max value logic depending on source)
  details: Record<string, number>; // Specific values per business unit
  originalRow?: DataRow; // Optional to allow removing it for storage optimization
}

export type ThemeMode = 'operative' | 'corporate';

export interface ColumnMetadata {
  key: string;
  type: string;
  label: string;
}

export interface DashboardState {
  data: FinancialRow[];
  segments: string[];
  types: string[];
  isLoaded: boolean;
  datasetName: string;
  lastUpdated: string;
}