import { HistoryEntry } from './history.types';

const HISTORY_KEY = 'userHistory';

export function saveHistoryEntry(entry: HistoryEntry) {
  const history = getHistory();
  history.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getHistory(): HistoryEntry[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}
