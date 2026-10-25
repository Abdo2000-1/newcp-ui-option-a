import { describe, it, expect } from 'vitest';
import {
  ApiClientError,
  AuthenticationError,
  TenantAccessDeniedError,
  ClinicalApprovalRequiredError,
  ProblemError,
  PreconditionRequiredError,
  PreconditionFailedError,
  ValidationError,
  normalizeProblemError
} from '../errors';
import type {
  Problem,
  CatalogService,
  FormField,
  ConditionalFieldRule,
  ServiceItem,
  CreateServiceItem,
  PatchServiceItem,
  AvailableTransition,
  TransitionRequest,
  TransitionResult,
  BilledPartyChoice,
  ZeroChargeReason
} from '../contractTypes';

describe('T-API-001: OpenAPI Contract Types & Error Normalization', () => {
  describe('Typed Contract Error Normalization & Status Mapping', () => {
    it('normalizes 428 PreconditionRequiredError with code and message', () => {
      const problem: Problem = {
        code: 'IF_MATCH_REQUIRED',
        message: 'Mutation requires an If-Match header with aggregate ETag',
        requestId: 'req-428-abc'
      };

      const err = normalizeProblemError(428, problem);
      expect(err).toBeInstanceOf(PreconditionRequiredError);
      expect(err).toBeInstanceOf(ProblemError);
      expect(err).toBeInstanceOf(ApiClientError);
      expect(err.status).toBe(428);
      expect(err.message).toBe('Mutation requires an If-Match header with aggregate ETag');
      if (err instanceof ProblemError) {
        expect(err.code).toBe('IF_MATCH_REQUIRED');
        expect(err.requestId).toBe('req-428-abc');
      }
    });

    it('normalizes 412 PreconditionFailedError with stale ETag message', () => {
      const problem: Problem = {
        code: 'STALE_AGGREGATE_CONFLICT',
        message: 'The service instance was modified concurrently by another clerk',
        requestId: 'req-412-xyz'
      };

      const err = normalizeProblemError(412, problem);
      expect(err).toBeInstanceOf(PreconditionFailedError);
      expect(err.status).toBe(412);
      if (err instanceof PreconditionFailedError) {
        expect(err.code).toBe('STALE_AGGREGATE_CONFLICT');
        expect(err.requestId).toBe('req-412-xyz');
      }
    });

    it('normalizes 422 ValidationError and extracts details.field for ZERO_CHARGE_REASON_REQUIRED', () => {
      const problem: Problem = {
        code: 'ZERO_CHARGE_REASON_REQUIRED',
        message: 'A zero final line total requires a zeroChargeReasonCode',
        requestId: 'req-422-val',
        details: {
          field: 'zeroChargeReasonCode',
          reason: 'Total is 0.00 but no valid reason code was supplied'
        }
      };

      const err = normalizeProblemError(422, problem);
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.status).toBe(422);
      if (err instanceof ValidationError) {
        expect(err.code).toBe('ZERO_CHARGE_REASON_REQUIRED');
        expect(err.field).toBe('zeroChargeReasonCode');
        expect(err.details?.field).toBe('zeroChargeReasonCode');
        expect(err.details?.reason).toContain('Total is 0.00');
        expect(err.requestId).toBe('req-422-val');
      }
    });

    it('normalizes 422 ValidationError for HOLD_DETAILS_REQUIRED', () => {
      const problem: Problem = {
        code: 'HOLD_DETAILS_REQUIRED',
        message: 'Entering on_hold requires both holdType and holdReasonCode atomically',
        details: {
          field: 'holdType'
        }
      };

      const err = normalizeProblemError(422, problem);
      expect(err).toBeInstanceOf(ValidationError);
      if (err instanceof ValidationError) {
        expect(err.code).toBe('HOLD_DETAILS_REQUIRED');
        expect(err.field).toBe('holdType');
      }
    });

    it('preserves existing error regressions (401, 403, 409)', () => {
      const err401 = normalizeProblemError(401, { code: 'UNAUTHORIZED', message: 'Session expired' });
      expect(err401).toBeInstanceOf(AuthenticationError);
      expect(err401.status).toBe(401);

      const err403 = normalizeProblemError(403, { code: 'FORBIDDEN', message: 'Tenant mismatch' });
      expect(err403).toBeInstanceOf(TenantAccessDeniedError);
      expect(err403.status).toBe(403);

      const err409 = normalizeProblemError(409, { code: 'CLINICAL_APPROVAL_REQUIRED', message: 'Needs approval' });
      expect(err409).toBeInstanceOf(ClinicalApprovalRequiredError);
      expect(err409.status).toBe(409);
    });

    it('falls back to generic ProblemError when encountering unmapped HTTP status', () => {
      const err500 = normalizeProblemError(500, { code: 'INTERNAL_ERROR', message: 'Database failed' });
      expect(err500).toBeInstanceOf(ProblemError);
      expect(err500.status).toBe(500);
      if (err500 instanceof ProblemError) {
        expect(err500.code).toBe('INTERNAL_ERROR');
      }
    });

    it('handles non-Problem fallback gracefully when receiving plain string or unknown payload', () => {
      const err = normalizeProblemError(400, 'Bad Request string');
      expect(err).toBeInstanceOf(ProblemError);
      expect(err.status).toBe(400);
      expect(err.message).toBe('Bad Request string');
      if (err instanceof ProblemError) {
        expect(err.code).toBe('HTTP_400');
      }
    });
  });

  describe('Contract Type Model Validations (Compile-Time & Fixture Conformance)', () => {
    it('creates compliant CatalogService and FormField definitions', () => {
      const service: CatalogService = {
        uuid: '11111111-1111-4111-8111-111111111111',
        code: 'BIOMODEL',
        name: '3D Printed Biomodel',
        itemKind: 'service',
        isDigital: false,
        workflowCode: 'WF_BIOMODEL_STANDARD',
        leadTimeDays: 2
      };

      const rule: ConditionalFieldRule = {
        ruleKind: 'visible',
        condition: {
          op: 'eq',
          field: 'model_type',
          value: 'hollow'
        }
      };

      const field: FormField = {
        uuid: '22222222-2222-4222-8222-222222222222',
        code: 'hollow_wall_thickness',
        label: 'Wall Thickness (mm)',
        type: 'number',
        required: true,
        options: [],
        validation: { min: 1.5, max: 4.0 },
        conditionalRules: [rule]
      };

      expect(service.code).toBe('BIOMODEL');
      expect(field.type).toBe('number');
      expect(rule.ruleKind).toBe('visible');
    });

    it('creates compliant ServiceItem with F07 provenance and independent billability', () => {
      const item: ServiceItem = {
        uuid: '33333333-3333-4333-8333-333333333333',
        orderUuid: '44444444-4444-4444-8444-444444444444',
        sellableItemUuid: '55555555-5555-4555-8555-555555555555',
        status: 'in_production',
        answers: [
          { fieldCode: 'teeth_selected', optionCodes: ['11', '21'] },
          { fieldCode: 'patient_notes', value: 'Rush case' }
        ],
        billedToContactUuid: '66666666-6666-4666-8666-666666666666',
        billedPartyOrigin: 'order_default',
        isBillable: true,
        unitPrice: '150.00',
        quantity: 1,
        lineTotal: '150.00'
      };

      expect(item.billedPartyOrigin).toBe('order_default');
      expect(item.isBillable).toBe(true);
      expect(item.answers.length).toBe(2);
    });

    it('creates compliant ZeroChargeReason and BilledPartyChoice records', () => {
      const reason: ZeroChargeReason = {
        code: 'REDO_WARRANTY',
        label: 'Clinical Redo / Warranty Remake',
        active: true
      };

      const party: BilledPartyChoice = {
        contactUuid: '77777777-7777-4777-8777-777777777777',
        role: 'doctor',
        label: 'Dr. Gregory House'
      };

      expect(reason.active).toBe(true);
      expect(party.role).toBe('doctor');
    });
  });
});
