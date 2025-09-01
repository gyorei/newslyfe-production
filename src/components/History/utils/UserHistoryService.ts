import { HistoryEntry } from './history.types';
import { saveHistoryEntry, getHistory } from './historyStorage';

export class UserHistoryService {
  static logVisit(entry: HistoryEntry) {
    saveHistoryEntry(entry);
  }

  static getAllHistory(): HistoryEntry[] {
    return getHistory();
  }
}
