import type { Problem, ProblemDetails } from './contractTypes';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly type?: string;
  public readonly detail?: string;
  public readonly instance?: string;

  constructor(status: number, message: string, detail?: string, type?: string, instance?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.detail = detail;
    this.type = type;
    this.instance = instance;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends ApiClientError {
  constructor(message = 'Authentication failed or session expired') {
    super(401, message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TenantAccessDeniedError extends ApiClientError {
  constructor(message = 'Access to this tenant or clinic is denied') {
    super(403, message);
    this.name = 'TenantAccessDeniedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ClinicalApprovalRequiredError extends ApiClientError {
  constructor(message = 'Physical manufacturing requires verified doctor approval') {
    super(409, message);
    this.name = 'ClinicalApprovalRequiredError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ============================================================================
// Contract-Specific RFC 7807 Problem Errors (OpenAPI 3.0.3 & IAM Supplement)
// ============================================================================

export class ProblemError extends ApiClientError {
  public readonly code: string;
  public readonly requestId?: string;
  public readonly details?: ProblemDetails;
  public readonly problem: Problem;

  constructor(status: number, problem: Problem) {
    super(status, problem.message || `Problem occurred with status ${status}`);
    this.name = 'ProblemError';
    this.code = problem.code || 'UNKNOWN_ERROR';
    this.requestId = problem.requestId;
    this.details = problem.details;
    this.problem = problem;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AccessNotAssignedError extends ProblemError {
  constructor(problem: Problem | string = 'Your account is authenticated, but access has not been assigned yet.') {
    const p: Problem = typeof problem === 'string'
      ? { code: 'ACCESS_NOT_ASSIGNED', message: problem }
      : problem;
    super(403, p);
    this.name = 'AccessNotAssignedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TenantNotAssignedError extends ProblemError {
  constructor(problem: Problem | string = 'Explicit internal tenant assignment is missing') {
    const p: Problem = typeof problem === 'string'
      ? { code: 'TENANT_NOT_ASSIGNED', message: problem }
      : problem;
    super(403, p);
    this.name = 'TenantNotAssignedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SessionExpiredError extends ProblemError {
  constructor(problem: Problem | string = 'Session has expired due to inactivity or max lifetime') {
    const p: Problem = typeof problem === 'string'
      ? { code: 'SESSION_EXPIRED', message: problem }
      : problem;
    super(401, p);
    this.name = 'SessionExpiredError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationRequiredError extends ProblemError {
  constructor(problem: Problem | string = 'Authentication is required to access this resource') {
    const p: Problem = typeof problem === 'string'
      ? { code: 'AUTHENTICATION_REQUIRED', message: problem }
      : problem;
    super(401, p);
    this.name = 'AuthenticationRequiredError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InsufficientPermissionsError extends ProblemError {
  constructor(problem: Problem | string = 'You do not have access to this action') {
    const p: Problem = typeof problem === 'string'
      ? { code: 'PERMISSION_DENIED', message: problem }
      : problem;
    super(403, p);
    this.name = 'InsufficientPermissionsError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PermissionDeniedError extends ProblemError {
  constructor(problem: Problem | string = 'Operation not permitted with current permissions') {
    const p: Problem = typeof problem === 'string'
      ? { code: 'PERMISSION_DENIED', message: problem }
      : problem;
    super(403, p);
    this.name = 'PermissionDeniedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PreconditionRequiredError extends ProblemError {
  constructor(problem: Problem | string = 'Mutation requires an If-Match header matching the current resource version') {
    const p: Problem = typeof problem === 'string'
      ? { code: 'PRECONDITION_REQUIRED', message: problem }
      : problem;
    super(428, p);
    this.name = 'PreconditionRequiredError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PreconditionFailedError extends ProblemError {
  constructor(problem: Problem | string = 'Resource has been modified by another clerk. Reload to see the latest version') {
    const p: Problem = typeof problem === 'string'
      ? { code: 'STALE_PRECONDITION', message: problem }
      : problem;
    super(412, p);
    this.name = 'PreconditionFailedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends ProblemError {
  public readonly field?: string;

  constructor(problem: Problem | string = 'Request payload validation failed') {
    const p: Problem = typeof problem === 'string'
      ? { code: 'VALIDATION_ERROR', message: problem }
      : problem;
    super(422, p);
    this.name = 'ValidationError';
    this.field = p.details?.field;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Normalizes an HTTP error response or Problem JSON payload into a typed error class.
 */
export function normalizeProblemError(status: number, payload?: unknown): ApiClientError {
  // Support v0.9.8 auth error envelope: { error: Problem }
  let extractedPayload = payload;
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof (payload as Record<string, unknown>).error === 'object' &&
    (payload as Record<string, unknown>).error !== null
  ) {
    extractedPayload = (payload as Record<string, unknown>).error;
  }

  const isProblem = extractedPayload && typeof extractedPayload === 'object' && ('code' in extractedPayload || 'message' in extractedPayload);
  const problem: Problem = isProblem
    ? {
        code: (extractedPayload as Record<string, any>).code || `HTTP_${status}`,
        message: (extractedPayload as Record<string, any>).message || `HTTP Error ${status}`,
        ...(extractedPayload as Record<string, any>),
      }
    : { code: `HTTP_${status}`, message: typeof payload === 'string' ? payload : `HTTP Error ${status}` };

  switch (status) {
    case 401:
      if (problem.code === 'SESSION_EXPIRED') return new SessionExpiredError(problem);
      if (problem.code === 'AUTHENTICATION_REQUIRED') return new AuthenticationRequiredError(problem);
      return new AuthenticationError(problem.message);
    case 403:
      if (problem.code === 'ACCESS_NOT_ASSIGNED') return new AccessNotAssignedError(problem);
      if (problem.code === 'TENANT_NOT_ASSIGNED') return new TenantNotAssignedError(problem);
      if (problem.code === 'PERMISSION_DENIED') return new InsufficientPermissionsError(problem);
      return new TenantAccessDeniedError(problem.message);
    case 409:
      return new ClinicalApprovalRequiredError(problem.message);
    case 412:
      return new PreconditionFailedError(problem);
    case 422:
      return new ValidationError(problem);
    case 428:
      return new PreconditionRequiredError(problem);
    default:
      return new ProblemError(status, problem);
  }
}

export function isProblemError(err: unknown): err is ProblemError {
  return err instanceof ProblemError;
}

export function isAccessNotAssignedError(err: unknown): err is AccessNotAssignedError {
  return err instanceof AccessNotAssignedError;
}

export function isSessionExpiredError(err: unknown): err is SessionExpiredError {
  return err instanceof SessionExpiredError;
}

export function isPreconditionFailedError(err: unknown): err is PreconditionFailedError {
  return err instanceof PreconditionFailedError;
}

export function isPreconditionRequiredError(err: unknown): err is PreconditionRequiredError {
  return err instanceof PreconditionRequiredError;
}
