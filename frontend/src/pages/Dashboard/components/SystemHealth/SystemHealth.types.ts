import { SystemHealthIndicator } from '../../Dashboard.types';

export interface SystemHealthProps {
  indicators: SystemHealthIndicator[];
  title?: string;
  className?: string;
}
