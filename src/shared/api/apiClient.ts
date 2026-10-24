import { api } from '@/shared/services/api';
import type {
  IApiClient,
  CaseQueryParams,
  OrderQueryParams,
  ApiClientOptions,
  IServiceInstanceMockAdapter,
  PatchServiceItem,
  ServiceItem,
  WithVersion,
} from './types';
import type { Case, Order, Patient, BillingRecord } from '@/shared/types';
import type { PaginatedResult } from '@/shared/types';
import { ServiceInstanceMockAdapter } from './serviceInstanceMockAdapter';

export class ApiClient implements IApiClient {
  private baseUrl: string;
  private readonly adapter: IServiceInstanceMockAdapter;

  /**
   * EXPLICIT BOUNDARY: MOCK / NOT_INTEGRATED
   * Offline mock service-instance boundary conforming to V0.9.2.2 / Q-B8.
   * Delegates all read, edit, and reset calls directly to the injected or default offline mock adapter.
   * Does NOT make network calls, database transactions, or browser storage writes.
   * F07 service-level payer persistence remains blocked in current V3 schema.
   */
  public readonly offlineMockServiceInstances: IServiceInstanceMockAdapter;

  constructor(
    baseUrlOrOptions?: string | ApiClientOptions,
    mockServiceInstances?: IServiceInstanceMockAdapter
  ) {
    if (typeof baseUrlOrOptions === 'object' && baseUrlOrOptions !== null) {
      this.baseUrl = baseUrlOrOptions.baseUrl || (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';
      this.adapter = baseUrlOrOptions.mockServiceInstances ?? new ServiceInstanceMockAdapter();
    } else {
      this.baseUrl = baseUrlOrOptions || (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';
      this.adapter = mockServiceInstances ?? new ServiceInstanceMockAdapter();
    }

    this.offlineMockServiceInstances = {
      item: (serviceItemUuid: string): Promise<WithVersion<ServiceItem>> => {
        return this.adapter.item(serviceItemUuid);
      },
      edit: (
        serviceItemUuid: string,
        patch: PatchServiceItem,
        ifMatch: string
      ): Promise<WithVersion<ServiceItem>> => {
        return this.adapter.edit(serviceItemUuid, patch, ifMatch);
      },
      reset: (seedItems?: ServiceItem[]): void => {
        this.adapter.reset(seedItems);
      },
    };
  }

  public cases = {
    list: async (params?: CaseQueryParams): Promise<PaginatedResult<Case>> => {
      const items = await api.getCases();
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const filtered = params?.search
        ? items.filter(c => c.caseNumber.toLowerCase().includes(params.search!.toLowerCase()) || c.title.toLowerCase().includes(params.search!.toLowerCase()))
        : items;
      return {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    },
    getById: async (id: string): Promise<Case | undefined> => {
      return api.getCaseById(id);
    },
  };

  public orders = {
    list: async (params?: OrderQueryParams): Promise<PaginatedResult<Order>> => {
      const items = await api.getOrders();
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const filtered = params?.search
        ? items.filter(o => o.orderNumber.toLowerCase().includes(params.search!.toLowerCase()))
        : items;
      return {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    },
    getById: async (id: string): Promise<Order | undefined> => {
      return api.getOrderById(id);
    },
  };

  public patients = {
    list: async (): Promise<Patient[]> => {
      return api.getPatients();
    },
    getById: async (id: string): Promise<Patient | undefined> => {
      return api.getPatientById(id);
    },
  };

  public billing = {
    list: async (): Promise<BillingRecord[]> => {
      return api.getBilling();
    },
  };
}

export const apiClient = new ApiClient();
