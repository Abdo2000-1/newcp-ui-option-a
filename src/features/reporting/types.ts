export interface RadiologyReportPayload {
  reportId: string;
  orderId: string;
  radiologistId: string;
  radiologistName: string;
  topics: {
    pathologyRuleOut: boolean;
    implantPlanning: boolean;
    existingImplants: boolean;
    sinusEvaluation: boolean;
    tmjEvaluation: boolean;
    airwayEvaluation: boolean;
  };
  excludeFromRadiologistPayment: boolean;
  isRedo: boolean;
  completedAt?: string;
}

export interface VolumeMetric {
  month: string;
  guides: number;
  reports: number;
  conversions: number;
  restorations: number;
}
