export interface ConversionTask {
  conversionId: string;
  orderId: string;
  arch: 'Maxilla' | 'Mandible' | 'Both';
  conversionType: 'basic' | 'custom';
  mandibularNerveMapped: boolean;
  softwareTarget: 'CoDiagnostiX' | 'Simplant' | 'Generic';
  status: 'No Scans' | 'In Progress' | 'Download';
  outputFileUrl?: string;
  technicianNotes?: string;
}
