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
// Contract-Specific RFC 7807 Problem Errors (OpenAPI 3.0.3)
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
  const isProblem = payload && typeof payload === 'object' && 'code' in payload && 'message' in payload;
  const problem: Problem = isProblem
    ? (payload as Problem)
    : { code: `HTTP_${status}`, message: typeof payload === 'string' ? payload : `HTTP Error ${status}` };

  switch (status) {
    case 401:
      return new AuthenticationError(problem.message);
    case 403:
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
