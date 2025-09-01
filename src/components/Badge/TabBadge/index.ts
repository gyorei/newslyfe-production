/**
 * Badge komponens export központ
 *
 * A TabBadge komponens és típusainak exportja
 */

export { TabBadge } from './TabBadge';
export type { TabBadgeProps } from './TabBadge';

// Re-export a komponens típusát is
import type { TabBadgeProps } from './TabBadge';
export type { TabBadgeProps as BadgeProps };

// Visszafelé kompatibilitás
export { TabBadge as TabNotificationBadge } from './TabBadge';
export type { TabBadgeProps as TabNotificationBadgeProps } from './TabBadge';
