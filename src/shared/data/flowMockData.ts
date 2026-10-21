export interface SubServiceItem {
  id: string;
  type: string;
  typeCode: string;
  title: string;
  subtitle?: string;
  billTo: string;
  maxilla: string;
  mandible: string;
  format: string;
  amount: number;
  vouchers: string;
  receivedTime: string;
  sentTime: string;
  updateTime: string;
  chargedOn: string;
  hasActionAlert: boolean;
  actionLabel: string;
  actionButtonText?: string;
  changeRequest: string;
  csTask: {
    status: 'Assign' | 'Assigned';
    assignee?: string;
    time?: string;
  };
}

export interface MasterWorkflowOrder {
  id: string;
  serial: number;
  orderNum: string;
  source: string; // 'Via CP' | 'Via Connect' | 'CaseXchange' | 'Vatech' | 'Planmeca' | 'Jmorita' | 'Prexion'
  senderTool?: string;
  scanCenter: string;
  doctorName: string;
  doctorSub: string;
  patientName: string;
  patientSub: string;
  isLocked: boolean;
  notes: string;
  archiveDate: string;
  services: SubServiceItem[];
}

export const MASTER_WORKFLOW_ORDERS: MasterWorkflowOrder[] = [
  // 1. Case 504901 (Via CP, Bishoy Mina, Intra-Oral + 2x TP) - Case A: Both scans uploaded, IO/TP In Progress in Yellow
  {
    id: '504901',
    serial: 1,
    orderNum: '504901',
    source: 'Via CP',
    scanCenter: 'California Imaging Diagnostics Hub',
    doctorName: 'Dr. Bishoy Mina',
    doctorSub: 'TE',
    patientName: 'Test Add order',
    patientSub: 'Add SG Date',
    isLocked: true,
    notes: 'Inter. 2026-09-28',
    archiveDate: '2026-09-28',
    services: [
      {
        id: 'srv-101',
        type: 'Intra-Oral',
        typeCode: 'IO',
        title: 'Intra-Oral Scan',
        subtitle: 'STL Mesh',
        billTo: 'California Diagnostics CC: Master, 9903',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 0,
        vouchers: 'N/A',
        receivedTime: 'Mon Sep 28 14.13.07 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Sep 28 14.30',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'shrouk', time: '2026-09-28 14:14 -0400' }
      },
      {
        id: 'srv-102',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan #1 (Maxilla)',
        subtitle: 'Co-Dx Plan',
        billTo: 'California Diagnostics CC: Master, 9903',
        maxilla: 'Quadrant',
        mandible: 'None',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Mon Sep 28 14.13.07 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Sep 28 15:00',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      },
      {
        id: 'srv-103',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan #2 (Mandible)',
        subtitle: 'Co-Dx Plan',
        billTo: 'California Diagnostics CC: Master, 9903',
        maxilla: 'None',
        mandible: 'Quadrant',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Mon Sep 28 14.13.07 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Sep 28 15:00',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 2. Case 504900 (Via Connect, Rashad Hussein) - Case B: CBCT missing, STL uploaded -> TP No Scans (Red Alert), IO Pending(yes) in Orange
  {
    id: '504900',
    serial: 2,
    orderNum: '504900',
    source: 'Via Connect',
    scanCenter: 'None',
    doctorName: 'Rashad Hussein',
    doctorSub: 'Add SG Date',
    patientName: 'patient RH',
    patientSub: 'Unlock',
    isLocked: false,
    notes: 'SALES Rashad',
    archiveDate: '2026-09-22',
    services: [
      {
        id: 'srv-201',
        type: 'Temp Restoration',
        typeCode: 'FMP',
        title: 'Temp Restoration',
        subtitle: 'FMP',
        billTo: 'Rashad Hussein CC: VISA, 9903',
        maxilla: 'None',
        mandible: 'Mandible',
        format: 'None',
        amount: 575,
        vouchers: 'N/A',
        receivedTime: 'Tue Sep 22 15:52:43 -0400',
        sentTime: 'Not Yet',
        updateTime: 'No Updates',
        chargedOn: 'Not Yet',
        hasActionAlert: true,
        actionLabel: 'No Scans Uploaded',
        actionButtonText: 'Upload scans\nFill FMP Form',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      },
      {
        id: 'srv-202',
        type: 'Intra-Oral',
        typeCode: 'IO',
        title: 'Intra-Oral Scan',
        subtitle: 'IO Mesh',
        billTo: 'Rashad Hussein CC: VISA, 9903',
        maxilla: 'None',
        mandible: 'Mandible',
        format: 'STL',
        amount: 0,
        vouchers: 'N/A',
        receivedTime: 'Tue Sep 22 15:52:43 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Sep 22 16:00',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Pending (yes)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'shrouk', time: '2026-09-22 16:10' }
      },
      {
        id: 'srv-203',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: 'CAM Print',
        billTo: 'Rashad Hussein CC: VISA, 9903',
        maxilla: 'None',
        mandible: 'Mandible',
        format: 'coDiagnostiX',
        amount: 285,
        vouchers: 'N/A',
        receivedTime: 'Tue Sep 22 15:52:43 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Sep 23 10:15',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Reviewing order',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'omar', time: '2026-09-23 09:30' }
      }
    ]
  },

  // 3. Case 504902 (Sender Tool: Vatech - Black Badge) - Case C: STLs missing, CBCT uploaded -> IO No Scans (Red Alert), TP In progress
  {
    id: '504902',
    serial: 3,
    orderNum: '504902',
    source: 'Vatech',
    senderTool: 'Vatech',
    scanCenter: 'Boston Diagnostics Hub',
    doctorName: 'Dr. Alan Grant',
    doctorSub: 'TE',
    patientName: 'Sarah Connor',
    patientSub: 'Add SG Date',
    isLocked: true,
    notes: 'Missing STLs - Assigned CS follow up',
    archiveDate: '2026-09-29',
    services: [
      {
        id: 'srv-301',
        type: 'Intra-Oral',
        typeCode: 'IO',
        title: 'Intra-Oral Scan',
        subtitle: 'Scan Missing',
        billTo: 'Boston Diagnostics Hub',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'STL',
        amount: 0,
        vouchers: 'N/A',
        receivedTime: 'Wed Sep 29 11:20:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Sep 29 11:35',
        chargedOn: 'Not Yet',
        hasActionAlert: true,
        actionLabel: 'No Scans Uploaded',
        actionButtonText: 'Upload IO File',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'Maestro Agent', time: '2026-09-29 11:30' }
      },
      {
        id: 'srv-302',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Co-Dx Plan',
        billTo: 'Boston Diagnostics Hub',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Wed Sep 29 11:20:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Sep 29 12:00',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'In progress',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 4. Case 504903 (Sender Tool: Planmeca - Black Badge) - Normal Flow: Guide design (OPS)
  {
    id: '504903',
    serial: 4,
    orderNum: '504903',
    source: 'Planmeca',
    senderTool: 'Planmeca',
    scanCenter: 'Align Chicago CAD Lab',
    doctorName: 'Dr. Marcus Vance',
    doctorSub: 'NY Smile Center',
    patientName: 'Bruce Wayne',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Sleeve design approved - In OPS guide design',
    archiveDate: '2026-10-01',
    services: [
      {
        id: 'srv-401',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: 'Guide Design (OPS)',
        billTo: 'Align Chicago CAD Lab',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 285,
        vouchers: 'N/A',
        receivedTime: 'Thu Oct 01 09:15:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 01 14:20',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Guide design (OPS)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'OPS Team', time: '2026-10-01 10:00' }
      }
    ]
  },

  // 5. Case 504904 (Sender Tool: Jmorita - Black Badge) - Normal Flow: Sleeve design (TP)
  {
    id: '504904',
    serial: 5,
    orderNum: '504904',
    source: 'Jmorita',
    senderTool: 'Jmorita',
    scanCenter: 'California Imaging Center',
    doctorName: 'Dr. Elena Rostova',
    doctorSub: 'TE',
    patientName: 'Clark Kent',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Dr confirmed plan -> Switched to Sleeve design',
    archiveDate: '2026-10-02',
    services: [
      {
        id: 'srv-501',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Sleeve Design',
        billTo: 'California Imaging Center',
        maxilla: 'No',
        mandible: 'Yes',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Fri Oct 02 10:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 02 11:45',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Sleeve design (TP)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'TP Coord', time: '2026-10-02 10:30' }
      }
    ]
  },

  // 6. Case 504905 (Sender Tool: Prexion - Black Badge) - Normal Flow: Printing and shipping (Boston)
  {
    id: '504905',
    serial: 6,
    orderNum: '504905',
    source: 'Prexion',
    senderTool: 'Prexion',
    scanCenter: 'Boston Diagnostics Hub',
    doctorName: 'Dr. Gregory House',
    doctorSub: 'Princeton Dental',
    patientName: 'Diana Prince',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'CAM printed, final QC passed -> Ready for shipping',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-601',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: '3D CAM Print',
        billTo: 'Princeton Dental CC: AMEX',
        maxilla: 'Yes',
        mandible: 'Yes',
        format: 'coDiagnostiX',
        amount: 320,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 08:30:00 -0400',
        sentTime: 'Oct 03 16:00',
        updateTime: 'Oct 03 16:30',
        chargedOn: 'Oct 03 16:45',
        hasActionAlert: false,
        actionLabel: 'Printing and shipping (Boston)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'Boston CAM', time: '2026-10-03 14:00' }
      }
    ]
  },

  // 7. Case 504906 (CaseXchange - White Badge) - No session case (Caf file sent already planned: only IO and SG)
  {
    id: '504906',
    serial: 7,
    orderNum: '504906',
    source: 'CaseXchange',
    scanCenter: 'CaseXchange Orders Mail',
    doctorName: 'Dr. Lisa Cuddy',
    doctorSub: 'Endo & Implant',
    patientName: 'Tony Stark',
    patientSub: 'Add SG Date',
    isLocked: false,
    notes: 'No session requested - Caf downloaded to BSB server',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-701',
        type: 'Intra-Oral',
        typeCode: 'IO',
        title: 'Intra-Oral Scan',
        subtitle: 'Caf Synced',
        billTo: 'CaseXchange Dr. Cuddy',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 0,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 11:15:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 11:30',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'Maestros', time: '2026-10-03 11:20' }
      },
      {
        id: 'srv-702',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: 'CAM Print',
        billTo: 'CaseXchange Dr. Cuddy',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 285,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 11:15:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 12:00',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Reviewing order',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 8. Case 504907 (CaseXchange - White Badge) - With session case (TP Type Review & status In progress)
  {
    id: '504907',
    serial: 8,
    orderNum: '504907',
    source: 'CaseXchange',
    scanCenter: 'CaseXchange Orders Mail',
    doctorName: 'Dr. James Wilson',
    doctorSub: 'TE',
    patientName: 'Natasha Romanoff',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Dr booked Fine Tuner (FT) session',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-801',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Type: Review (FT Session)',
        billTo: 'CaseXchange Dr. Wilson',
        maxilla: 'Quadrant',
        mandible: 'None',
        format: 'coDiagnostiX',
        amount: 250,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 13:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 13:40',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'In progress',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'FT Coordinator', time: '2026-10-03 13:10' }
      }
    ]
  },

  // 9. Case 504908 (Via CP) - Conversion Order added (CONV done by OPS department)
  {
    id: '504908',
    serial: 9,
    orderNum: '504908',
    source: 'Via CP',
    scanCenter: 'Dallas Imaging Hub',
    doctorName: 'Dr. Eric Foreman',
    doctorSub: 'TE',
    patientName: 'Barry Allen',
    patientSub: 'Add SG Date',
    isLocked: false,
    notes: 'Dr requested 3D DICOM conversion for CoDx',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-901',
        type: 'Model Work',
        typeCode: 'CONV',
        title: '3D DICOM Conversion',
        subtitle: 'OPS Department',
        billTo: 'Dallas Imaging Hub',
        maxilla: 'Yes',
        mandible: 'Yes',
        format: 'DICOM to STL',
        amount: 120,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 14:10:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 14:45',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'In progress (OPS)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'OPS Agent', time: '2026-10-03 14:15' }
      }
    ]
  },

  // 10. Case 504909 (Via Connect) - Guided Full Mouth Restoration (GFMR: Wax-up before Planning, PMMA after guide design)
  {
    id: '504909',
    serial: 10,
    orderNum: '504909',
    source: 'Via Connect',
    scanCenter: 'Miami Dental Studio',
    doctorName: 'Dr. Allison Cameron',
    doctorSub: 'Prosthodontics',
    patientName: 'Arthur Curry',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'GFMR full mouth: Wax-up in NY page before planning',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-1001',
        type: 'Temp Restoration',
        typeCode: 'GFMR',
        title: 'GFMR Full Mouth',
        subtitle: 'Digital Wax-up',
        billTo: 'Miami Dental Studio',
        maxilla: 'Yes',
        mandible: 'Yes',
        format: 'coDiagnostiX',
        amount: 850,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 14:50:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 15:20',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Wax-up NY (Not Yet)',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 11. Case 504910 (Via CP) - Radiology Report (RAD assigned to Radiologists)
  {
    id: '504910',
    serial: 11,
    orderNum: '504910',
    source: 'Via CP',
    scanCenter: '3DDX Boston Radiology Hub',
    doctorName: 'Dr. Robert Chase',
    doctorSub: 'Oral Surgeon',
    patientName: 'Peter Parker',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Pathology & nerve canal tracing report requested',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-1101',
        type: 'Radiology Report',
        typeCode: 'RAD',
        title: 'Full Radiology CBCT Report',
        subtitle: 'Assigned Radiologist',
        billTo: 'Dr. Robert Chase',
        maxilla: 'Yes',
        mandible: 'Yes',
        format: 'PDF Report',
        amount: 175,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 15:10:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 15:35',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Assigned to Radiologist',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'Dr. Radiologist', time: '2026-10-03 15:15' }
      }
    ]
  },

  // 12. Case 504911 (Via Connect) - Digital Design Only (Nothing sent to Boston)
  {
    id: '504911',
    serial: 12,
    orderNum: '504911',
    source: 'Via Connect',
    scanCenter: 'New York Imaging Lab',
    doctorName: 'Dr. Chris Taub',
    doctorSub: 'TE',
    patientName: 'Stephen Strange',
    patientSub: 'Add SG Date',
    isLocked: false,
    notes: 'Digital designs only - Direct export to doctor',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-1201',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Digital Guide File Only',
        subtitle: 'Direct Download',
        billTo: 'New York Imaging Lab',
        maxilla: 'None',
        mandible: 'Mandible',
        format: 'STL Digital',
        amount: 180,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 15:40:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 16:00',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Direct to Doctor (Digital)',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 13. Case 504912 (Vatech - Black Badge) - Waiting confirmation
  {
    id: '504912',
    serial: 13,
    orderNum: '504912',
    source: 'Vatech',
    senderTool: 'Vatech',
    scanCenter: 'Align Chicago CAD Lab',
    doctorName: 'Dr. Lawrence Kutner',
    doctorSub: 'TE',
    patientName: 'Wade Wilson',
    patientSub: 'Unlock',
    isLocked: false,
    notes: 'Confirmation email sent to Dr -> Awaiting reply',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-1301',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Email Dispatched',
        billTo: 'Align Chicago CAD Lab',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 16:00:00 -0400',
        sentTime: 'Oct 03 16:15',
        updateTime: 'Oct 03 16:20',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Waiting confirmation',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'TP Coord', time: '2026-10-03 16:05' }
      }
    ]
  },

  // 14. Case 504913 (Planmeca - Black Badge) - Multi-TP Cases
  {
    id: '504913',
    serial: 14,
    orderNum: '504913',
    source: 'Planmeca',
    senderTool: 'Planmeca',
    scanCenter: 'Boston Diagnostics Hub',
    doctorName: 'Dr. Remy Hadley',
    doctorSub: 'TE',
    patientName: 'Matt Murdock',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Dual Arch Maxilla & Mandible TP',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-1401',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan #1 (Maxilla)',
        subtitle: 'Dual Arch',
        billTo: 'Boston Diagnostics Hub',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 16:30:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 16:45',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      },
      {
        id: 'srv-1402',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan #2 (Mandible)',
        subtitle: 'Dual Arch',
        billTo: 'Boston Diagnostics Hub',
        maxilla: 'No',
        mandible: 'Yes',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 16:30:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 16:45',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 15. Case 504914 (Jmorita - Black Badge) - Case A: Reviewing order
  {
    id: '504914',
    serial: 15,
    orderNum: '504914',
    source: 'Jmorita',
    senderTool: 'Jmorita',
    scanCenter: 'California Imaging Center',
    doctorName: 'Dr. Amber Volakis',
    doctorSub: 'TE',
    patientName: 'Jessica Jones',
    patientSub: 'Add SG Date',
    isLocked: true,
    notes: 'CBCT & STLs verified by CS Maestro',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-1501',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: 'Straumann Kit',
        billTo: 'California Imaging Center',
        maxilla: 'Yes',
        mandible: 'None',
        format: 'coDiagnostiX',
        amount: 285,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 16:50:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 17:05',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Reviewing order',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 16. Case 504915 (Prexion - Black Badge) - Case B: Missing scans, Alert
  {
    id: '504915',
    serial: 16,
    orderNum: '504915',
    source: 'Prexion',
    senderTool: 'Prexion',
    scanCenter: 'Dallas Imaging Hub',
    doctorName: 'Dr. Jeffrey Cole',
    doctorSub: 'Implantology',
    patientName: 'Luke Cage',
    patientSub: 'Unlock',
    isLocked: false,
    notes: 'Missing CBCT archive',
    archiveDate: '2026-10-03',
    services: [
      {
        id: 'srv-1601',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Awaiting Scans',
        billTo: 'Dallas Imaging Hub',
        maxilla: 'Yes',
        mandible: 'None',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sat Oct 03 17:10:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 03 17:15',
        chargedOn: 'Not Yet',
        hasActionAlert: true,
        actionLabel: 'No Scans Uploaded',
        actionButtonText: 'Upload CBCT',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 17. Case 504916 (CaseXchange - White Badge) - FT Session
  {
    id: '504916',
    serial: 17,
    orderNum: '504916',
    source: 'CaseXchange',
    scanCenter: 'CaseXchange Portal',
    doctorName: 'Dr. Travis Brennan',
    doctorSub: 'TE',
    patientName: 'Danny Rand',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Fine Tuner Session scheduled',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-1701',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Type: Review',
        billTo: 'CaseXchange Dr. Brennan',
        maxilla: 'No',
        mandible: 'Yes',
        format: 'coDiagnostiX',
        amount: 250,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 09:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 09:30',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'In progress',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'FT Coordinator', time: '2026-10-04 09:10' }
      }
    ]
  },

  // 18. Case 504917 (Via CP) - 3D Printed Model (MOD)
  {
    id: '504917',
    serial: 18,
    orderNum: '504917',
    source: 'Via CP',
    scanCenter: 'NYC Dental Hub',
    doctorName: 'Dr. Henry Dobson',
    doctorSub: 'Ortho',
    patientName: 'Frank Castle',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Digital study model for clear aligners',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-1801',
        type: 'Model Work',
        typeCode: 'MOD',
        title: '3D Printed Study Model',
        subtitle: 'Model Work',
        billTo: 'NYC Dental Hub',
        maxilla: 'Yes',
        mandible: 'Yes',
        format: 'STL 3D Print',
        amount: 140,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 10:15:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 10:45',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'In progress',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 19. Case 504918 (Via Connect) - Dual TP + Guide design
  {
    id: '504918',
    serial: 19,
    orderNum: '504918',
    source: 'Via Connect',
    scanCenter: 'Albuquerque Imaging Hub',
    doctorName: 'Dr. Samira Terzi',
    doctorSub: 'TE',
    patientName: 'Walter White',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Anterior implant guide with teeth seating',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-1901',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: 'Guide design (OPS)',
        billTo: 'Albuquerque Imaging Hub',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 285,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 11:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 11:30',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Guide design (OPS)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'OPS Team', time: '2026-10-04 11:15' }
      }
    ]
  },

  // 20. Case 504919 (Vatech - Black Badge) - Printing and shipping (Boston)
  {
    id: '504919',
    serial: 20,
    orderNum: '504919',
    source: 'Vatech',
    senderTool: 'Vatech',
    scanCenter: 'Boston Diagnostics Hub',
    doctorName: 'Dr. Michael Adams',
    doctorSub: 'Oral Surgeon',
    patientName: 'Jesse Pinkman',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Printed on Formlabs 4B - Shipped with tracking',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2001',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: 'Dispatched',
        billTo: 'Boston Diagnostics Hub',
        maxilla: 'None',
        mandible: 'Yes',
        format: 'coDiagnostiX',
        amount: 310,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 11:30:00 -0400',
        sentTime: 'Oct 04 15:00',
        updateTime: 'Oct 04 15:30',
        chargedOn: 'Oct 04 15:35',
        hasActionAlert: false,
        actionLabel: 'Printing and shipping (Boston)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'Boston CAM', time: '2026-10-04 14:00' }
      }
    ]
  },

  // 21. Case 504920 (Planmeca - Black Badge) - Sleeve design (TP)
  {
    id: '504920',
    serial: 21,
    orderNum: '504920',
    source: 'Planmeca',
    senderTool: 'Planmeca',
    scanCenter: 'Santa Fe Dental Hub',
    doctorName: 'Dr. Sarah Connor',
    doctorSub: 'TE',
    patientName: 'Saul Goodman',
    patientSub: 'Add SG Date',
    isLocked: false,
    notes: 'Sleeve diameter 5.0mm Straumann BLT',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2101',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Sleeve Alignment',
        billTo: 'Santa Fe Dental Hub',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 12:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 12:40',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Sleeve design (TP)',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 22. Case 504921 (Jmorita - Black Badge) - Waiting confirmation
  {
    id: '504921',
    serial: 22,
    orderNum: '504921',
    source: 'Jmorita',
    senderTool: 'Jmorita',
    scanCenter: 'Los Pollos Imaging Center',
    doctorName: 'Dr. Thomas Wayne',
    doctorSub: 'TE',
    patientName: 'Gustavo Fring',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Confirmation email delivered to clinician',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2201',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Pending Approval',
        billTo: 'Los Pollos Imaging Center',
        maxilla: 'Quadrant',
        mandible: 'None',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 12:30:00 -0400',
        sentTime: 'Oct 04 12:45',
        updateTime: 'Oct 04 12:50',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Waiting confirmation',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'TP Coord', time: '2026-10-04 12:40' }
      }
    ]
  },

  // 23. Case 504922 (Prexion - Black Badge) - OPS Registration
  {
    id: '504922',
    serial: 23,
    orderNum: '504922',
    source: 'Prexion',
    senderTool: 'Prexion',
    scanCenter: 'Texas Implant Facility',
    doctorName: 'Dr. Martha Wayne',
    doctorSub: 'TE',
    patientName: 'Hank Schrader',
    patientSub: 'Add SG Date',
    isLocked: false,
    notes: 'Surface matching CBCT with optical scan',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2301',
        type: 'Intra-Oral',
        typeCode: 'IO',
        title: 'Intra-Oral Scan',
        subtitle: 'OPS Registration',
        billTo: 'Texas Implant Facility',
        maxilla: 'Yes',
        mandible: 'Yes',
        format: 'STL',
        amount: 0,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 13:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 13:20',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 24. Case 504923 (CaseXchange - White Badge) - No session case
  {
    id: '504923',
    serial: 24,
    orderNum: '504923',
    source: 'CaseXchange',
    scanCenter: 'CaseXchange Mail Gateway',
    doctorName: 'Dr. Alfred Pennyworth',
    doctorSub: 'TE',
    patientName: 'Skyler White',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Plan submitted by Dr directly in CoDx',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2401',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: 'Reviewing Order',
        billTo: 'CaseXchange Dr. Alfred',
        maxilla: 'No',
        mandible: 'Yes',
        format: 'coDiagnostiX',
        amount: 285,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 13:30:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 13:45',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Reviewing order',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 25. Case 504924 (Via CP) - Radiology Report
  {
    id: '504924',
    serial: 25,
    orderNum: '504924',
    source: 'Via CP',
    scanCenter: 'Gotham Diagnostics Lab',
    doctorName: 'Dr. Lucius Fox',
    doctorSub: 'Radiologist',
    patientName: 'Mike Ehrmantraut',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Maxillary sinus volume review',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2501',
        type: 'Radiology Report',
        typeCode: 'RAD',
        title: 'Full Radiology CBCT Report',
        subtitle: 'Sinus Elevation Analysis',
        billTo: 'Gotham Diagnostics Lab',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'PDF Report',
        amount: 175,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 14:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 14:25',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Assigned to Radiologist',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'Dr. Radiologist', time: '2026-10-04 14:05' }
      }
    ]
  },

  // 26. Case 504925 (Via Connect) - GFMR PMMA Stage
  {
    id: '504925',
    serial: 26,
    orderNum: '504925',
    source: 'Via Connect',
    scanCenter: 'Wexler & McGill Smiles',
    doctorName: 'Dr. James Gordon',
    doctorSub: 'Prosthodontics',
    patientName: 'Kim Wexler',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'PMMA temp provisional after guide design',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2601',
        type: 'Temp Restoration',
        typeCode: 'GFMR',
        title: 'GFMR Full Mouth (PMMA)',
        subtitle: 'Milled Provisional',
        billTo: 'Wexler & McGill Smiles',
        maxilla: 'Yes',
        mandible: 'Yes',
        format: 'coDiagnostiX',
        amount: 750,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 14:30:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 15:00',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Modifying guide design NY',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 27. Case 504926 (Vatech - Black Badge) - Digital design only
  {
    id: '504926',
    serial: 27,
    orderNum: '504926',
    source: 'Vatech',
    senderTool: 'Vatech',
    scanCenter: 'Hamlin Dental Group',
    doctorName: 'Dr. Harvey Dent',
    doctorSub: 'TE',
    patientName: 'Howard Hamlin',
    patientSub: 'Add SG Date',
    isLocked: false,
    notes: 'Digital guide STL export for in-office printing',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2701',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Digital Guide File Only',
        subtitle: 'Direct Export',
        billTo: 'Hamlin Dental Group',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'STL Digital',
        amount: 180,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 15:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 15:20',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Direct to Doctor (Digital)',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 28. Case 504927 (Planmeca - Black Badge) - CoDx Plan In Progress
  {
    id: '504927',
    serial: 28,
    orderNum: '504927',
    source: 'Planmeca',
    senderTool: 'Planmeca',
    scanCenter: 'McGill Periodontics',
    doctorName: 'Dr. Rachel Dawes',
    doctorSub: 'TE',
    patientName: 'Chuck McGill',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Planning 3 implants #3, #4, #5',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2801',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Co-Dx Plan',
        billTo: 'McGill Periodontics',
        maxilla: 'Quadrant',
        mandible: 'None',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 15:30:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 15:55',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 29. Case 504928 (Jmorita - Black Badge) - CONV 3D Conversion
  {
    id: '504928',
    serial: 29,
    orderNum: '504928',
    source: 'Jmorita',
    senderTool: 'Jmorita',
    scanCenter: 'Salamanca Diagnostics',
    doctorName: 'Dr. Jonathan Crane',
    doctorSub: 'TE',
    patientName: 'Lalo Salamanca',
    patientSub: 'Add SG Date',
    isLocked: false,
    notes: 'OPS conversion order added to suborders',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-2901',
        type: 'Model Work',
        typeCode: 'CONV',
        title: '3D DICOM Conversion',
        subtitle: 'OPS Task',
        billTo: 'Salamanca Diagnostics',
        maxilla: 'No',
        mandible: 'Yes',
        format: 'DICOM to STL',
        amount: 120,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 16:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 16:25',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'In progress (OPS)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'OPS Agent', time: '2026-10-04 16:10' }
      }
    ]
  },

  // 30. Case 504929 (Prexion - Black Badge) - Missing STLs, CS Task assigned
  {
    id: '504929',
    serial: 30,
    orderNum: '504929',
    source: 'Prexion',
    senderTool: 'Prexion',
    scanCenter: 'Varga Dental Hub',
    doctorName: 'Dr. Edward Nygma',
    doctorSub: 'TE',
    patientName: 'Nacho Varga',
    patientSub: 'Unlock',
    isLocked: false,
    notes: 'CS Agent assigned to follow up on missing STLs',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-3001',
        type: 'Intra-Oral',
        typeCode: 'IO',
        title: 'Intra-Oral Scan',
        subtitle: 'Missing STLs',
        billTo: 'Varga Dental Hub',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'STL',
        amount: 0,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 16:30:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 16:40',
        chargedOn: 'Not Yet',
        hasActionAlert: true,
        actionLabel: 'No Scans Uploaded',
        actionButtonText: 'Upload IO File',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'shrouk', time: '2026-10-04 16:35' }
      }
    ]
  },

  // 31. Case 504930 (CaseXchange - White Badge) - Caf file verified, In progress
  {
    id: '504930',
    serial: 31,
    orderNum: '504930',
    source: 'CaseXchange',
    scanCenter: 'CaseXchange Hub',
    doctorName: 'Dr. Oswald Cobblepot',
    doctorSub: 'TE',
    patientName: 'Tuco Salamanca',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Caf file downloaded to Pt folder on BSB',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-3101',
        type: 'Intra-Oral',
        typeCode: 'IO',
        title: 'Intra-Oral Scan',
        subtitle: 'Caf Synced',
        billTo: 'CaseXchange Hub',
        maxilla: 'Yes',
        mandible: 'No',
        format: 'coDiagnostiX',
        amount: 0,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 17:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 17:15',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 32. Case 504931 (Via CP) - Printing in Boston
  {
    id: '504931',
    serial: 32,
    orderNum: '504931',
    source: 'Via CP',
    scanCenter: 'Boston Diagnostics Hub',
    doctorName: 'Dr. Selina Kyle',
    doctorSub: 'Oral Surgeon',
    patientName: 'Hector Salamanca',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'In Boston printing queue - Slot #14',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-3201',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: 'Form 4B Print',
        billTo: 'Boston Diagnostics Hub',
        maxilla: 'None',
        mandible: 'Mandible',
        format: 'coDiagnostiX',
        amount: 285,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 17:20:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 17:40',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Printing and shipping (Boston)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'Boston CAM', time: '2026-10-04 17:25' }
      }
    ]
  },

  // 33. Case 504932 (Via Connect) - Waiting Dr confirmation
  {
    id: '504932',
    serial: 33,
    orderNum: '504932',
    source: 'Via Connect',
    scanCenter: 'Connect Doctor Portal',
    doctorName: 'Dr. Pamela Isley',
    doctorSub: 'TE',
    patientName: 'Don Eladio',
    patientSub: 'Add SG Date',
    isLocked: false,
    notes: 'Special request: Send confirmation email',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-3301',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Email Sent',
        billTo: 'Connect Dr. Isley',
        maxilla: 'Yes',
        mandible: 'None',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 17:45:00 -0400',
        sentTime: 'Oct 04 17:55',
        updateTime: 'Oct 04 18:00',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Waiting confirmation',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'shrouk', time: '2026-10-04 17:50' }
      }
    ]
  },

  // 34. Case 504933 (Vatech - Black Badge) - Multi-TP Case
  {
    id: '504933',
    serial: 34,
    orderNum: '504933',
    source: 'Vatech',
    senderTool: 'Vatech',
    scanCenter: 'Align Chicago CAD Lab',
    doctorName: 'Dr. Victor Fries',
    doctorSub: 'TE',
    patientName: 'Todd Alquist',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Full mouth multi-plan prescription',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-3401',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan #1 (Maxilla)',
        subtitle: 'Multi-TP',
        billTo: 'Align Chicago CAD Lab',
        maxilla: 'Yes',
        mandible: 'None',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 18:10:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 18:30',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      },
      {
        id: 'srv-3402',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan #2 (Mandible)',
        subtitle: 'Multi-TP',
        billTo: 'Align Chicago CAD Lab',
        maxilla: 'None',
        mandible: 'Yes',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 18:10:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 18:30',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'IN PROGRESS',
        changeRequest: '-',
        csTask: { status: 'Assign' }
      }
    ]
  },

  // 35. Case 504934 (Planmeca - Black Badge) - Reviewing order
  {
    id: '504934',
    serial: 35,
    orderNum: '504934',
    source: 'Planmeca',
    senderTool: 'Planmeca',
    scanCenter: 'Boston Diagnostics Hub',
    doctorName: 'Dr. Harleen Quinzel',
    doctorSub: 'TE',
    patientName: 'Lydia Rodarte',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Maestro checking case special requests and pricing',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-3501',
        type: 'Surgical Guide',
        typeCode: 'SG',
        title: 'Surgical Guide',
        subtitle: 'Reviewing Order',
        billTo: 'Boston Diagnostics Hub',
        maxilla: 'Yes',
        mandible: 'None',
        format: 'coDiagnostiX',
        amount: 285,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 18:40:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 18:50',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Reviewing order',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'Maestros', time: '2026-10-04 18:42' }
      }
    ]
  },

  // 36. Case 504935 (Jmorita - Black Badge) - Sleeve design
  {
    id: '504935',
    serial: 36,
    orderNum: '504935',
    source: 'Jmorita',
    senderTool: 'Jmorita',
    scanCenter: 'California Imaging Center',
    doctorName: 'Dr. Waylon Jones',
    doctorSub: 'TE',
    patientName: 'Jack Welker',
    patientSub: 'Lock',
    isLocked: true,
    notes: 'Sleeve offset 9.0mm configured in CoDx',
    archiveDate: '2026-10-04',
    services: [
      {
        id: 'srv-3601',
        type: 'Treatment Plan',
        typeCode: 'TP',
        title: 'Treatment Plan',
        subtitle: 'Sleeve design (TP)',
        billTo: 'California Imaging Center',
        maxilla: 'None',
        mandible: 'Mandible',
        format: 'coDiagnostiX',
        amount: 200,
        vouchers: 'N/A',
        receivedTime: 'Sun Oct 04 19:00:00 -0400',
        sentTime: 'Not Yet',
        updateTime: 'Oct 04 19:15',
        chargedOn: 'Not Yet',
        hasActionAlert: false,
        actionLabel: 'Sleeve design (TP)',
        changeRequest: '-',
        csTask: { status: 'Assigned', assignee: 'TP Team', time: '2026-10-04 19:05' }
      }
    ]
  }
];
