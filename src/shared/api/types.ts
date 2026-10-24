import type { Order, Patient, Case, BillingRecord } from '@/shared/types';
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

// ============================================================================
// Service-Instance Contract & Mock Adapter Types (V0.9.2.2 / Q-B8 Offline MOCK)
// Note: In-memory test double types for service-instance reads and edits.
// These types reflect the provisional V0.9.2.2 target envelope offline.
// ============================================================================

export type FormAnswer = {
  fieldCode: string;
  optionCode?: string;
  optionCodes?: string[];
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueDate?: string;
};

export type BilledPartyOrigin =
  | 'legacy_explicit'
  | 'order_default'
  | 'manual_resolution'
  | 'user_selected'
  | 'unresolved_legacy';

export interface ServiceItem {
  uuid: string;
  orderUuid: string;
  sellableItemUuid: string;
  status: string;
  answers: FormAnswer[];
  lineNumber?: number;
  isRedo?: boolean;
  isBillable: boolean;
  canEditBillability?: boolean;
  isInvoiced?: boolean;
  currencyCode?: string;
  unitPrice?: string;
  quantity?: number;
  lineTotal?: string;
  zeroChargeReasonCode?: string | null;
  zeroChargeNote?: string | null;
  canEditPrice?: boolean;
  serviceNotes?: string;
  billedToContactUuid: string;
  billedPartyOrigin: BilledPartyOrigin;
  canEditBilledParty?: boolean;
}

export interface CreateServiceItem {
  sellableItemUuid: string;
  answers: FormAnswer[];
  isRedo?: boolean;
  isBillable?: boolean;
  redoOfItemUuid?: string;
  serviceNotes?: string;
  billedToContactUuid?: string;
  unitPrice?: string;
  quantity?: number;
  zeroChargeReasonCode?: string;
  zeroChargeNote?: string;
}

export interface PatchServiceItem {
  answers?: FormAnswer[];
  isRedo?: boolean;
  isBillable?: boolean;
  redoOfItemUuid?: string;
  serviceNotes?: string;
  pendingReason?: string;
  billedToContactUuid?: string;
  unitPrice?: string;
  quantity?: number;
  zeroChargeReasonCode?: string | null;
  zeroChargeNote?: string;
}

export type BilledPartyChoice = {
  contactUuid: string;
  role: 'doctor' | 'scanning_center';
  label: string;
};

export type HoldType = 'customer' | 'internal';

export type HoldReasonOption = {
  code: string;
  label: string;
  isTemporary: boolean;
  holdType?: HoldType;
};

export type TransitionRequest = {
  transitionId: number;
  comment?: string;
  holdType?: HoldType;
  holdReasonCode?: string;
};

export interface WithVersion<T> {
  data: T;
  etag: string;
}

export interface IServiceInstanceMockAdapter {
  item(serviceItemUuid: string): Promise<WithVersion<ServiceItem>>;
  edit(serviceItemUuid: string, patch: PatchServiceItem, ifMatch: string): Promise<WithVersion<ServiceItem>>;
  reset(seedItems?: ServiceItem[]): void;
}
