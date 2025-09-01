export interface HistoryEntry {
  timestamp: number;
  searchTerm: string;
  country?: string;
  source?: string;
  url?: string;
}
