export interface PhysicalPackageIntake {
  packageId: string;
  orderId: string;
  trackingNumber: string;
  receivedDate: string;
  contents: {
    maxillaModel: boolean;
    mandibleModel: boolean;
    maxillaImpression: boolean;
    mandibleImpression: boolean;
    biteRegistration: boolean;
    otherDiscs: boolean;
  };
  pouredInHouse: boolean;
  laserScanned: boolean;
  binArchiveLocation: string; // e.g. "BIN-B-142"
  operatorId: string;
}

export interface ModelWorkReportItem {
  id: string;
  caseNumber: string;
  doctorName: string;
  receivedAt: string;
  scannedAt?: string;
  status: 'Awaiting Models' | 'On its way' | 'In Progress' | 'Done';
  binLocation?: string;
}
