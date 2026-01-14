import { UpcomingEvent } from '../../Dashboard.types';

export interface UpcomingEventsProps {
  events: UpcomingEvent[];
  maxItems?: number;
  showDate?: boolean;
  title?: string;
  emptyMessage?: string;
  className?: string;
}
