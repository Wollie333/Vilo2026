import { ActivityItem } from '../../Dashboard.types';

export interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  showViewAll?: boolean;
  viewAllHref?: string;
  onViewAll?: () => void;
  emptyMessage?: string;
  className?: string;
}
