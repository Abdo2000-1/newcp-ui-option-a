import type { IHttpTransport } from './httpTransport';
import type { IServiceClient } from './serviceClient';
import { serviceClient } from './serviceClient';
import type { WithVersion } from './types';
import type {
  BilledPartyChoice,
  ServiceItem,
} from './contractTypes';
import {
  PreconditionRequiredError,
  PermissionDeniedError,
  ValidationError,
} from './errors';

export const PROPOSAL_PENDING_BACKEND_REVIEW = 'PROPOSAL_PENDING_BACKEND_REVIEW';

export interface IPayerClient {
  readonly status: typeof PROPOSAL_PENDING_BACKEND_REVIEW;
  getEligibleBilledParties(orderUuid: string): Promise<BilledPartyChoice[]>;
  assignBilledParty(
    serviceItemUuid: string,
    billedToContactUuid: string,
    ifMatch?: string
  ): Promise<WithVersion<ServiceItem>>;
  validatePayerAssignment(
    currentService: ServiceItem,
    billedToContactUuid: string,
    eligibleParties: BilledPartyChoice[]
  ): void;
}

export class PayerClient implements IPayerClient {
  public readonly status = PROPOSAL_PENDING_BACKEND_REVIEW;
  private transport?: IHttpTransport;
  private srvClient: IServiceClient;
  private enableMocks: boolean;

  constructor(transport?: IHttpTransport, srvClient: IServiceClient = serviceClient, enableMocks = true) {
    this.transport = transport;
    this.srvClient = srvClient;
    this.enableMocks = enableMocks;
  }

  public async getEligibleBilledParties(orderUuid: string): Promise<BilledPartyChoice[]> {
    if (this.transport) {
      try {
        const res = await this.transport.get<BilledPartyChoice[]>(
          `/orders/${orderUuid}/eligible-billed-parties`
        );
        return res.data;
      } catch (err) {
        if (!this.enableMocks) throw err;
      }
    }

    // Explicit MOCK / PROPOSAL_PENDING_BACKEND_REVIEW fallback
    // Returns eligible order doctor and scanning center contacts within tenant
    return [
      {
        contactUuid: 'contact-dr-smith-01',
        role: 'doctor',
        label: 'Dr. John Smith (Ordering Clinician)',
      },
      {
        contactUuid: 'contact-sc-metro-02',
        role: 'scanning_center',
        label: 'Metro Imaging Scanning Center',
      },
    ];
  }

  public validatePayerAssignment(
    currentService: ServiceItem,
    billedToContactUuid: string,
    eligibleParties: BilledPartyChoice[]
  ): void {
    if (currentService.canEditBilledParty === false) {
      throw new PermissionDeniedError(
        'Payer assignment cannot be modified for this service item (locked by invoice or permissions).'
      );
    }

    if (!billedToContactUuid || typeof billedToContactUuid !== 'string' || billedToContactUuid.trim() === '') {
      throw new ValidationError({
        code: 'VALIDATION_ERROR',
        message: 'A valid billedToContactUuid is required.',
        details: { field: 'billedToContactUuid' },
      });
    }

    const isEligible = eligibleParties.some(p => p.contactUuid === billedToContactUuid);
    if (!isEligible) {
      throw new ValidationError({
        code: 'INVALID_BILLED_PARTY',
        message: 'The selected contact is not in the list of eligible billed parties for this order.',
        details: { field: 'billedToContactUuid', eligible: eligibleParties.map(p => p.contactUuid) },
      });
    }
  }

  public async assignBilledParty(
    serviceItemUuid: string,
    billedToContactUuid: string,
    ifMatch?: string
  ): Promise<WithVersion<ServiceItem>> {
    if (!ifMatch) {
      throw new PreconditionRequiredError('An If-Match header is required for payer assignment.');
    }

    const item = await this.srvClient.get(serviceItemUuid);
    const eligible = await this.getEligibleBilledParties(item.data.orderUuid);
    this.validatePayerAssignment(item.data, billedToContactUuid, eligible);

    // Patch item; client sends billedToContactUuid, server/adapter assigns origin 'user_selected'
    return this.srvClient.edit(
      serviceItemUuid,
      { billedToContactUuid },
      ifMatch
    );
  }
}

export const payerClient = new PayerClient();
