import type { Order, Patient, Case, BillingRecord } from '@/types';
import type { PaginatedResult } from '@/shared/types';

export interface CaseQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  clinicId?: string;
}

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  search?: string;
}

export interface RegistrationVerdictPayload {
  option: 1 | 2 | 3 | 4;
  operatorNotes?: string;
  findings?: string[];
  proposedRemedies?: string[];
}

export interface PlanApprovalPayload {
  doctorName: string;
  approvalType: 'portal' | 'email' | 'verbal_session';
  token?: string;
  notes?: string;
}

export interface IApiClient {
  cases: {
    list(params?: CaseQueryParams): Promise<PaginatedResult<Case>>;
    getById(id: string): Promise<Case | undefined>;
  };
  orders: {
    list(params?: OrderQueryParams): Promise<PaginatedResult<Order>>;
    getById(id: string): Promise<Order | undefined>;
  };
  patients: {
    list(): Promise<Patient[]>;
    getById(id: string): Promise<Patient | undefined>;
  };
  billing: {
    list(): Promise<BillingRecord[]>;
  };
}
