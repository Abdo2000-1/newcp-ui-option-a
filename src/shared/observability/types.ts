/**
 * ============================================================================
 * NEW CP OBSERVABILITY - TELEMETRY EVENT CONTRACT & TYPES
 * ============================================================================
 *
 * AUTHORITATIVE SPECIFICATION:
 * - docs/06_OPERATIONS/observability/README.md
 * - docs/06_OPERATIONS/observability/posthog.md
 * - docs/06_OPERATIONS/observability/telemetry-event-contract.md
 * - .agents/rules/observability.md
 */

export type TelemetryEnvironment = 'development' | 'staging' | 'production' | 'test';

export interface TelemetryConfig {
  telemetryEnabled: boolean;
  posthog: {
    enabled: boolean;
    key?: string;
    host: string;
    captureInDev: boolean;
    trackEmail: boolean;
  };
  sentry: {
    enabled: boolean;
    dsn?: string;
    environment?: string;
    release?: string;
    tracesSampleRate: number;
    trackEmail: boolean;
  };
  environment: TelemetryEnvironment;
}

// Bounded low-volume events per telemetry-event-contract.md
export type AllowedEventName =
  | 'page_view'
  | 'user_logged_in'
  | 'user_logged_out'
  | 'navigation_clicked'
  | 'report_opened'
  | 'report_filtered'
  | 'report_exported'
  | 'workflow_action_completed'
  | 'feature_flag_variant_seen';

export interface BaseEventProperties {
  environment?: string;
  route_name?: string;
  route_path?: string;
  module?: string;
  user_id?: string;
  tenant_id?: number;
  correlation_id?: string;
  [key: string]: unknown;
}

export interface PageViewProperties extends BaseEventProperties {
  route_name: string;
  route_path: string;
  module: string;
}

export interface UserAuthProperties extends BaseEventProperties {
  user_id: string;
  role?: string;
}

export interface NavigationProperties extends BaseEventProperties {
  navigation_key: string;
  route: string;
  module: string;
}

export interface ReportProperties extends BaseEventProperties {
  report_key: string;
  route?: string;
  module?: string;
  filter_type?: string;
  format?: string;
}

export interface WorkflowActionProperties extends BaseEventProperties {
  action_key: string;
  module: string;
}

export interface FeatureFlagProperties extends BaseEventProperties {
  flag_key: string;
  variant: string;
}

export type EventPropertiesMap = {
  page_view: PageViewProperties;
  user_logged_in: UserAuthProperties;
  user_logged_out: BaseEventProperties;
  navigation_clicked: NavigationProperties;
  report_opened: ReportProperties;
  report_filtered: ReportProperties;
  report_exported: ReportProperties;
  workflow_action_completed: WorkflowActionProperties;
  feature_flag_variant_seen: FeatureFlagProperties;
};

export interface UserTraits {
  role?: string;
  tenantId?: number;
  family?: string;
  email?: string;
  [key: string]: unknown;
}

export interface IPostHogClient {
  init?: (apiKey: string, config?: Record<string, unknown>) => void;
  capture: (eventName: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, userProperties?: Record<string, unknown>) => void;
  reset: () => void;
  isFeatureEnabled?: (key: string) => boolean | undefined;
  getFeatureFlag?: (key: string) => string | boolean | undefined;
}
