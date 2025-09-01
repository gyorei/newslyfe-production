/**
 * TabNotifications - Export központ
 *
 * A tab notification rendszer egyszerűsített változata - csak Badge
 */

// Badge komponens exportok
export { TabBadge as TabNotificationBadge } from './TabBadge/TabBadge';
export type { TabBadgeProps as TabNotificationBadgeProps } from './TabBadge/TabBadge';

// Hook exportok
export { useTabNotifications } from './hooks/useTabNotifications';

// Shared típusok és konstansok
export type { NewNewsState, TabNotificationProps, UseTabNotificationsReturn } from './shared/types';

export { NOTIFICATION_CONSTANTS, CSS_CLASSES, MOCK_CATEGORIES } from './shared/constants';
