/**
 * TypeScript típusdefiníciók a TabNotifications rendszerhez
 * Egyszerűsített verzió - csak Badge funkció
 */

// Badge komponens props
export interface TabNotificationProps {
  count: number;
  visible?: boolean;
  animated?: boolean;
}

// Alap notification állapot - minimális verzió a Badge működéséhez
export interface NewNewsState {
  hasNew: boolean;
  count: number;
  lastCheck: Date;
}

// Egyszerűsített hook return típus
export interface UseTabNotificationsReturn {
  newNewsCount: number;
  hasNewNews: boolean;
}
