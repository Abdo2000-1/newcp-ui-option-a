import type { Order, SubOrder, OrderStatus, Priority } from '@/types';

export interface ServiceLineItem {
  id: string;
  orderId: string;
  serviceType: 'surgical-guide' | 'conversion' | 'model-work' | 'treatment-plan' | 'restoration' | 'ismile' | 'radiology-report';
  status: string;
  rawStatusCode: number;
  assignedTechnician?: string;
  dueDate: string;
  isLocked: boolean;
}

export type { Order, SubOrder, OrderStatus, Priority };
