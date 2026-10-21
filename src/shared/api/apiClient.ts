import { api } from '@/shared/services/api';
import type { IApiClient, CaseQueryParams, OrderQueryParams } from './types';
import type { Case, Order, Patient, BillingRecord } from '@/shared/types';
import type { PaginatedResult } from '@/shared/types';

export class ApiClient implements IApiClient {
  private baseUrl: string;

  constructor(baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1') {
    this.baseUrl = baseUrl;
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
