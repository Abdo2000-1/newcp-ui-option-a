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
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

export class AuthenticationError extends ApiClientError {
  constructor(message = 'Authentication failed or session expired') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

export class TenantAccessDeniedError extends ApiClientError {
  constructor(message = 'Access to this tenant or clinic is denied') {
    super(403, message);
    this.name = 'TenantAccessDeniedError';
  }
}

export class ClinicalApprovalRequiredError extends ApiClientError {
  constructor(message = 'Physical manufacturing requires verified doctor approval') {
    super(409, message);
    this.name = 'ClinicalApprovalRequiredError';
  }
}
