/**
 * In-Browser OpenAPI 3.0.3 Contract Engine
 * 
 * Provides an in-browser execution layer for all 14 OpenAPI contract operations.
 * When running in local development or deployed to static hosting (GitHub Pages),
 * this engine transparently intercepts fetch calls to /api/v1/* and /health,
 * executing the official contract business rules:
 *   - Concurrency: ETag generation, 428 Precondition Required, 412 Stale Precondition
 *   - Workflow: Q-B9 atomic on_hold requirements (holdType + holdReasonCode)
 *   - Pricing: Q-B10 zeroChargeReasonCode mandatory when unitPrice is 0.00
 *   - Payer: F07 item-level payer target attribution
 *   - Form Schemas: Dynamic form definitions & conditional visibility
 *   - Persistence: Automatically persists to localStorage so changes remain across page reloads!
 */

import type {
  CatalogService,
  FormDefinition,
  HoldReasonOption,
  ZeroChargeReason,
  BilledPartyChoice,
  ServiceItem,
  HistoryEvent,
} from './contractTypes';

const STORAGE_KEY = 'newcp_openapi_contract_v1';

// Initial Catalog Services
const INITIAL_CATALOG: CatalogService[] = [
  {
    uuid: '00000000-0000-0000-0000-000000000003',
    code: 'SVC-BIOMODEL',
    name: 'Biomodel 3D Print',
    itemKind: 'service',
    categoryCode: 'restorative',
    isDigital: false,
    workflowCode: 'WF-REST-01',
    leadTimeDays: 2,
  } as any,
  {
    uuid: '00000000-0000-0000-0000-000000000004',
    code: 'SVC-SURG-GUIDE',
    name: 'Surgical Guide Design & Print',
    itemKind: 'service',
    categoryCode: 'surgical',
    isDigital: false,
    workflowCode: 'WF-SURG-01',
    leadTimeDays: 3,
  } as any,
  {
    uuid: '00000000-0000-0000-0000-000000000005',
    code: 'SVC-ALIGNER-STEP',
    name: 'Clear Aligner Step',
    itemKind: 'service',
    categoryCode: 'orthodontic',
    isDigital: true,
    workflowCode: 'WF-ORTHO-01',
    leadTimeDays: 1,
  } as any,
  {
    uuid: 'cat-waxup-sellable',
    code: 'SVC-DIAG-WAXUP',
    name: 'Diagnostic Digital Waxup',
    itemKind: 'service',
    categoryCode: 'restorative',
    isDigital: true,
    workflowCode: 'WF-REST-01',
    leadTimeDays: 2,
  } as any,
];

// Initial Hold Reasons
const INITIAL_HOLD_REASONS: HoldReasonOption[] = [
  {
    code: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
    label: 'Awaiting customer input',
    holdType: 'customer',
    isTemporary: false,
    active: true,
  },
  {
    code: 'SYNTHETIC_CUSTOMER_FILE_REUPLOAD',
    label: 'Awaiting scan/file reupload',
    holdType: 'customer',
    isTemporary: false,
    active: true,
  },
  {
    code: 'SYNTHETIC_CUSTOMER_PAYMENT_PENDING',
    label: 'Customer payment confirmation pending',
    holdType: 'customer',
    isTemporary: false,
    active: true,
  },
  {
    code: 'SYNTHETIC_INTERNAL_CLINICAL_REVIEW',
    label: 'Internal clinical specialist review required',
    holdType: 'internal',
    isTemporary: true,
    active: true,
  },
  {
    code: 'SYNTHETIC_INTERNAL_TECH_ESCALATION',
    label: 'Internal technician calibration escalation',
    holdType: 'internal',
    isTemporary: true,
    active: true,
  },
  {
    code: 'SYNTHETIC_LAB_CAPACITY_OVERFLOW',
    label: 'Laboratory production capacity overflow',
    holdType: 'internal',
    isTemporary: true,
    active: true,
  },
  {
    code: 'SYNTHETIC_LAB_EQUIPMENT_MAINTENANCE',
    label: 'Milling machine maintenance cycle',
    holdType: 'internal',
    isTemporary: true,
    active: true,
  },
];

// Initial Zero Charge Reasons
const INITIAL_ZERO_CHARGE_REASONS: ZeroChargeReason[] = [
  {
    code: 'SYNTHETIC_CLINICAL_REDO',
    label: 'Warranty redo under clinical guarantee',
    active: true,
    description: 'Complimentary remake due to clinical or margin adjustment',
  },
  {
    code: 'SYNTHETIC_LAB_ERROR',
    label: 'Laboratory processing re-fabrication',
    active: true,
    description: 'Internal lab defect or milling failure remake',
  },
  {
    code: 'SYNTHETIC_MARKETING_PROMOTION',
    label: 'Promotional demonstration case',
    active: true,
    description: 'Marketing campaign or clinical study demonstration',
  },
  {
    code: 'SYNTHETIC_INTERNAL_TRAINING',
    label: 'Internal technician training model',
    active: true,
    description: 'Studio staff training and calibration',
  },
];

// Initial Dynamic Form Schemas
const FORM_SCHEMAS: Record<string, any> = {
  '00000000-0000-0000-0000-000000000003': {
    service: INITIAL_CATALOG[0],
    fields: [
      {
        uuid: 'f-bio-01',
        code: 'model_type',
        label: 'Biomodel Base Architecture',
        type: 'single_select',
        required: true,
        options: [
          { code: 'solid', label: 'Solid Solid-Base Die Print' },
          { code: 'hollow', label: 'Hollow Honeycomb Shell (Drain Holes)' },
        ],
        defaultValue: 'solid',
      },
      {
        uuid: 'f-bio-02',
        code: 'jaw_type',
        label: 'Dental Arch (Jaw)',
        type: 'single_select',
        required: true,
        options: [
          { code: 'upper', label: 'Maxillary (Upper Arch)' },
          { code: 'lower', label: 'Mandibular (Lower Arch)' },
          { code: 'both', label: 'Bimaxillary (Both Arches)' },
        ],
        defaultValue: 'upper',
      },
      {
        uuid: 'f-bio-03',
        code: 'hollow_wall_thickness',
        label: 'Hollow Shell Wall Thickness (mm)',
        type: 'number',
        required: true,
        defaultValue: '2.0',
        conditionalRules: [
          {
            
            ruleKind: 'visible',
            condition: { field: 'model_type', op: 'eq', value: 'hollow' },
          },
        ],
      },
      {
        uuid: 'f-bio-04',
        code: 'include_soft_tissue',
        label: 'Include Flexible Gingiva Mask',
        type: 'boolean',
        required: false,
        defaultValue: 'false',
      },
    ],
  },
  '00000000-0000-0000-0000-000000000004': {
    service: INITIAL_CATALOG[1],
    fields: [
      {
        uuid: 'f-sg-01',
        code: 'guide_support',
        label: 'Guide Support Topology',
        type: 'single_select',
        required: true,
        options: [
          { code: 'tooth_supported', label: 'Tooth-Supported (Min. 4 stable teeth)' },
          { code: 'bone_supported', label: 'Bone-Supported (Fully Edentulous)' },
          { code: 'mucosa_supported', label: 'Mucosa-Supported (Dual CT Scan)' },
        ],
        defaultValue: 'tooth_supported',
      },
      {
        uuid: 'f-sg-02',
        code: 'sleeve_brand',
        label: 'Master Implant Sleeve System',
        type: 'single_select',
        required: true,
        options: [
          { code: 'straumann_guided', label: 'Straumann Guided Surgery' },
          { code: 'nobel_biocare', label: 'Nobel Biocare Guided' },
          { code: 'biohorizons', label: 'BioHorizons Guided' },
          { code: 'zimmer_biomet', label: 'Zimmer Biomet Navigator' },
          { code: 'universal_open', label: 'Universal 5.0mm Stepped Sleeve' },
        ],
        defaultValue: 'straumann_guided',
      },
      {
        uuid: 'f-sg-03',
        code: 'implant_count',
        label: 'Number of Planned Implant Sites',
        type: 'number',
        required: true,
        defaultValue: '1',
      },
      {
        uuid: 'f-sg-04',
        code: 'anchor_pins',
        label: 'Lateral Fixation Anchor Pins',
        type: 'boolean',
        required: false,
        defaultValue: 'false',
      },
    ],
  },
  '00000000-0000-0000-0000-000000000005': {
    service: INITIAL_CATALOG[2],
    fields: [
      {
        uuid: 'f-al-01',
        code: 'step_number',
        label: 'Aligner Stage / Step #',
        type: 'number',
        required: true,
        defaultValue: '1',
      },
      {
        uuid: 'f-al-02',
        code: 'arch',
        label: 'Target Dental Arch',
        type: 'single_select',
        required: true,
        options: [
          { code: 'upper', label: 'Upper Only' },
          { code: 'lower', label: 'Lower Only' },
          { code: 'both', label: 'Dual Arch Setup' },
        ],
        defaultValue: 'both',
      },
      {
        uuid: 'f-al-03',
        code: 'sheet_material',
        label: 'Thermoforming Sheet Material',
        type: 'single_select',
        required: true,
        options: [
          { code: 'duran_075', label: 'Duran 0.75mm (Standard Stiff)' },
          { code: 'zendura_flx', label: 'Zendura FLX Multi-Layer Elastomeric' },
          { code: 'bioplast_10', label: 'Bioplast 1.0mm (Soft Comfort)' },
        ],
        defaultValue: 'zendura_flx',
      },
    ],
  },
};

interface ContractStorage {
  services: ServiceItem[];
  history: Record<string, HistoryEvent[]>;
  revision: number;
}

function loadStorage(): ContractStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[InBrowserContractEngine] Error loading storage:', err);
  }

  // Initial seed
  const defaultServices: ServiceItem[] = [
    {
      uuid: 'srv-biomodel-001',
      orderUuid: 'ORD-504901',
      sellableItemUuid: '00000000-0000-0000-0000-000000000003',
      name: 'Biomodel 3D Print (Upper)',
      categoryCode: 'restorative',
      status: 'pending_intake',
      answers: [
        { fieldCode: 'model_type', value: 'solid', optionCodes: ['solid'] },
        { fieldCode: 'jaw_type', value: 'upper', optionCodes: ['upper'] },
      ],
      billedToContactUuid: 'contact-dr-smith-01',
      billedPartyOrigin: 'order_default',
      canEditBilledParty: true,
      isBillable: true,
      canEditBillability: true,
      canEditPrice: true,
      currencyCode: 'USD',
      unitPrice: '120.00',
      quantity: 1,
      lineTotal: '120.00',
    } as any,
    {
      uuid: 'srv-biomodel-002',
      orderUuid: 'ORD-504901',
      sellableItemUuid: '00000000-0000-0000-0000-000000000003',
      name: 'Biomodel 3D Print (Lower)',
      categoryCode: 'restorative',
      status: 'in_progress',
      answers: [
        { fieldCode: 'model_type', value: 'hollow', optionCodes: ['hollow'] },
        { fieldCode: 'jaw_type', value: 'lower', optionCodes: ['lower'] },
        { fieldCode: 'hollow_wall_thickness', value: 2.2 },
      ],
      billedToContactUuid: 'contact-dr-smith-01',
      billedPartyOrigin: 'order_default',
      canEditBilledParty: true,
      isBillable: true,
      canEditBillability: true,
      canEditPrice: true,
      currencyCode: 'USD',
      unitPrice: '140.00',
      quantity: 1,
      lineTotal: '140.00',
    } as any,
  ];

  const defaultHistory: Record<string, HistoryEvent[]> = {
    'srv-biomodel-001': [
      {
        fromCode: 'draft',
        toCode: 'pending_intake',
        actorUserUuid: '00000000-0000-0000-0000-000000000002',
        occurredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        comment: 'Initial order submission and verification',
      },
    ],
    'srv-biomodel-002': [
      {
        fromCode: 'draft',
        toCode: 'pending_intake',
        actorUserUuid: '00000000-0000-0000-0000-000000000002',
        occurredAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        comment: 'Initial order submission',
      },
      {
        fromCode: 'pending_intake',
        toCode: 'in_progress',
        actorUserUuid: 'user-lead-tech',
        occurredAt: new Date(Date.now() - 1800000).toISOString(),
        comment: 'Advanced into CAD modeling stage',
      },
    ],
  };

  const initial = { services: defaultServices, history: defaultHistory, revision: 101 };
  saveStorage(initial);
  return initial;
}

function saveStorage(storage: ContractStorage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (err) {
    console.warn('[InBrowserContractEngine] Error saving storage:', err);
  }
}

function computeETag(item: ServiceItem, revision: number): string {
  const code = (item.uuid || '').slice(-6) + revision;
  return `W/"srv-${item.uuid}-${code}"`;
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function problemResponse(status: number, code: string, message: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({
      type: 'https://newcp.3ddx.com/errors/' + code.toLowerCase(),
      title: code,
      status,
      detail: message,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    }
  );
}

/**
 * Handle in-browser contract execution for a given request.
 */
export async function handleInBrowserContractRequest(
  pathname: string = "",
  method: string,
  searchParams: URLSearchParams,
  reqHeaders: Headers,
  bodyText?: string
): Promise<Response | null> {
  // Normalize path
  const path = (pathname || "").replace(/^.*\/api\/v1/, '/api/v1');

  // 1. Health check
  if (method === 'GET' && (path === '/health' || pathname.endsWith('/health'))) {
    return jsonResponse({
      status: 'UP',
      timestamp: new Date().toISOString(),
      version: '1.0.0-in-browser-contract',
      service: 'newcp-api-contract-mock',
    });
  }

  // Must match /api/v1
  if (!path.startsWith('/api/v1')) {
    return null;
  }

  const storage = loadStorage();

  // 2. Catalog Services (GET /api/v1/catalog/services)
  if (method === 'GET' && path === '/api/v1/catalog/services') {
    const category = searchParams.get('categoryCode');
    let results = INITIAL_CATALOG;
    if (category) {
      results = results.filter((s: any) => s.categoryCode === category);
    }
    return jsonResponse(results);
  }

  // 3. Dynamic Form Schema (GET /api/v1/catalog/services/:id/form-schema)
  const formSchemaMatch = path.match(/^\/api\/v1\/catalog\/services\/([^\/]+)\/form-schema$/);
  if (method === 'GET' && formSchemaMatch) {
    const serviceUuid = formSchemaMatch[1];
    const schema = FORM_SCHEMAS[serviceUuid] || {
      service: INITIAL_CATALOG.find((s) => s.uuid === serviceUuid) || INITIAL_CATALOG[0],
      fields: [
        {
          uuid: 'f-def-01',
          code: 'standard_notes',
          label: 'Clinical Prescription Notes',
          type: 'text',
          required: false,
          defaultValue: '',
        },
      ],
    };
    return jsonResponse(schema);
  }

  // 4. Hold Reasons (GET /api/v1/catalog/hold-reasons & GET /api/v1/lookups/hold-reasons)
  if (
    method === 'GET' &&
    (path === '/api/v1/catalog/hold-reasons' || path === '/api/v1/lookups/hold-reasons')
  ) {
    const holdType = searchParams.get('holdType');
    let list = INITIAL_HOLD_REASONS;
    if (holdType) {
      list = list.filter((r) => (r.holdType as string) === holdType);
    }
    return jsonResponse(list);
  }

  // 5. Zero-Charge Reasons (GET /api/v1/lookups/zero-charge-reasons)
  if (method === 'GET' && path === '/api/v1/lookups/zero-charge-reasons') {
    return jsonResponse(INITIAL_ZERO_CHARGE_REASONS);
  }

  // 6. Eligible Billed Parties (GET /api/v1/orders/:orderUuid/eligible-billed-parties)
  const billedPartiesMatch = path.match(/^\/api\/v1\/orders\/([^\/]+)\/eligible-billed-parties$/);
  if (method === 'GET' && billedPartiesMatch) {
    return jsonResponse([
      {
        contactUuid: 'contact-dr-smith-01',
        role: 'doctor',
        label: 'Dr. John Smith (Ordering Clinician)',
      },
      {
        contactUuid: 'contact-sc-metro-02',
        role: 'scanning_center',
        label: 'Metro Imaging Scanning Center Hub',
      },
      {
        contactUuid: 'contact-clinic-primary',
        role: 'clinic',
        label: 'Downtown Dental Associates Clinic',
      },
    ]);
  }

  // 7. Order Services Listing (GET /api/v1/orders/:orderUuid/services)
  const orderServicesMatch = path.match(/^\/api\/v1\/orders\/([^\/]+)\/services$/);
  if (method === 'GET' && orderServicesMatch) {
    const orderUuid = orderServicesMatch[1];
    const norm = (id: string) => (id || '').replace(/^ORD-/i, '');

    let items = storage.services.filter(
      (s) =>
        s.orderUuid === orderUuid ||
        orderUuid === 'all' ||
        norm(s.orderUuid) === norm(orderUuid)
    );

    // Auto-seed if empty for this order so all orders have contract services
    if (items.length === 0 && orderUuid !== 'all') {
      const clean = orderUuid.toLowerCase().replace(/[^a-z0-9]/g, '');
      const s1: ServiceItem = {
        uuid: `srv-${clean}-01`,
        orderUuid,
        sellableItemUuid: '00000000-0000-0000-0000-000000000003',
        name: 'Biomodel 3D Print (Upper)',
        categoryCode: 'restorative',
        status: 'pending_intake',
        answers: [
          { fieldCode: 'model_type', value: 'solid', optionCodes: ['solid'] },
          { fieldCode: 'jaw_type', value: 'upper', optionCodes: ['upper'] },
        ],
        billedToContactUuid: 'contact-dr-smith-01',
        billedPartyOrigin: 'order_default',
        canEditBilledParty: true,
        isBillable: true,
        canEditBillability: true,
        canEditPrice: true,
        currencyCode: 'USD',
        unitPrice: '120.00',
        quantity: 1,
        lineTotal: '120.00',
      } as any;

      const s2: ServiceItem = {
        uuid: `srv-${clean}-02`,
        orderUuid,
        sellableItemUuid: '00000000-0000-0000-0000-000000000004',
        name: 'Surgical Guide Design & Print',
        categoryCode: 'surgical',
        status: 'in_progress',
        answers: [
          { fieldCode: 'guide_support', value: 'tooth_supported', optionCodes: ['tooth_supported'] },
          { fieldCode: 'sleeve_brand', value: 'straumann_guided', optionCodes: ['straumann_guided'] },
        ],
        billedToContactUuid: 'contact-dr-smith-01',
        billedPartyOrigin: 'order_default',
        canEditBilledParty: true,
        isBillable: true,
        canEditBillability: true,
        canEditPrice: true,
        currencyCode: 'USD',
        unitPrice: '250.00',
        quantity: 1,
        lineTotal: '250.00',
      } as any;

      storage.services.push(s1, s2);
      storage.history[s1.uuid] = [
        {
          fromCode: 'draft',
          toCode: 'pending_intake',
          actorUserUuid: 'user-clerk',
          occurredAt: new Date().toISOString(),
          comment: 'Auto-seeded OpenAPI 3.0.3 contract instance',
        },
      ];
      storage.history[s2.uuid] = [
        {
          fromCode: 'draft',
          toCode: 'in_progress',
          actorUserUuid: 'user-clerk',
          occurredAt: new Date().toISOString(),
          comment: 'Auto-seeded OpenAPI 3.0.3 contract instance',
        },
      ];
      saveStorage(storage);
      items = [s1, s2];
    }

    const orderETag = `W/"ord-${orderUuid}-${storage.revision}"`;
    return jsonResponse(items, 200, { ETag: orderETag });
  }

  // 8. Order Service Creation (POST /api/v1/orders/:orderUuid/services)
  if (method === 'POST' && orderServicesMatch) {
    const orderUuid = orderServicesMatch[1];
    let body: any = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return problemResponse(400, 'BAD_REQUEST', 'Invalid JSON body');
    }

    if (!body.sellableItemUuid) {
      return problemResponse(422, 'VALIDATION_ERROR', 'sellableItemUuid is mandatory', {
        field: 'sellableItemUuid',
      });
    }

    storage.revision++;
    const newUuid = 'srv-' + Math.floor(100000 + Math.random() * 900000);
    const catItem = INITIAL_CATALOG.find((c) => c.uuid === body.sellableItemUuid);
    const unitPrice = body.unitPrice || '100.00';
    const quantity = body.quantity || 1;
    const lineTotal = (parseFloat(unitPrice) * quantity).toFixed(2);

    const newItem: ServiceItem = {
      uuid: newUuid,
      serviceItemUuid: newUuid,
      orderUuid,
      sellableItemUuid: body.sellableItemUuid,
      name: catItem ? catItem.name : 'Custom Service',
      categoryCode: (catItem as any)?.categoryCode || 'restorative',
      status: 'pending_intake',
      answers: body.answers || [],
      billedToContactUuid: body.billedToContactUuid || 'contact-dr-smith-01',
      billedPartyOrigin: body.billedToContactUuid ? 'user_selected' : 'order_default',
      canEditBilledParty: true,
      isBillable: body.isBillable !== undefined ? body.isBillable : true,
      canEditBillability: true,
      canEditPrice: true,
      currencyCode: 'USD',
      unitPrice,
      quantity,
      lineTotal,
      zeroChargeReasonCode: body.zeroChargeReasonCode || null,
      zeroChargeNote: body.zeroChargeNote || null,
      isRedo: body.isRedo || false,
    } as any;

    storage.services.push(newItem);
    storage.history[newUuid] = [
      {
        fromCode: 'draft',
        toCode: 'pending_intake',
        actorUserUuid: 'user-clerk',
        occurredAt: new Date().toISOString(),
        comment: `Created service item via POST /orders/${orderUuid}/services`,
      },
    ];
    saveStorage(storage);

    const etag = computeETag(newItem, storage.revision);
    return jsonResponse(newItem, 201, { ETag: etag });
  }

  // 9. Available Transitions (GET /api/v1/services/:id/available-transitions)
  const availTransitionsMatch = path.match(/^\/api\/v1\/services\/([^\/]+)\/available-transitions$/);
  if (method === 'GET' && availTransitionsMatch) {
    const serviceUuid = availTransitionsMatch[1];
    const svc = storage.services.find((s) => s.uuid === serviceUuid);
    const status = svc ? svc.status : 'pending_intake';

    if (status === 'on_hold') {
      return jsonResponse([
        { transitionId: 201, fromCode: 'on_hold', toCode: 'in_progress', label: 'Resume In Progress' },
        { transitionId: 202, fromCode: 'on_hold', toCode: 'cancelled', label: 'Cancel Service' },
      ]);
    }

    return jsonResponse([
      { transitionId: 101, fromCode: status, toCode: 'in_progress', label: 'Start In Progress' },
      { transitionId: 102, fromCode: status, toCode: 'on_hold', label: 'Place On Hold (Q-B9)' },
      { transitionId: 103, fromCode: status, toCode: 'completed', label: 'Mark Completed' },
      { transitionId: 104, fromCode: status, toCode: 'cancelled', label: 'Cancel Service' },
    ]);
  }

  // 10. Execute Transition (POST /api/v1/services/:id/transitions)
  const execTransitionMatch = path.match(/^\/api\/v1\/services\/([^\/]+)\/transitions$/);
  if (method === 'POST' && execTransitionMatch) {
    const serviceUuid = execTransitionMatch[1];
    const svc = storage.services.find((s) => s.uuid === serviceUuid);
    if (!svc) {
      return problemResponse(404, 'NOT_FOUND', `Service item ${serviceUuid} not found`);
    }

    const ifMatch = reqHeaders.get('if-match');
    const currentETag = computeETag(svc, storage.revision);
    if (!ifMatch) {
      return problemResponse(
        428,
        'PRECONDITION_REQUIRED',
        'If-Match header with current ETag is required to execute a transition.'
      );
    }
    if (ifMatch !== currentETag && ifMatch !== '*') {
      return problemResponse(
        412,
        'STALE_PRECONDITION',
        'Service instance has been concurrently updated. If-Match does not match current ETag.',
        { serviceUuid, providedETag: ifMatch, currentETag }
      );
    }

    let body: any = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return problemResponse(400, 'BAD_REQUEST', 'Invalid JSON body');
    }

    const { targetStatusCode, holdType, holdReasonCode, comment } = body;
    if (!targetStatusCode) {
      return problemResponse(422, 'VALIDATION_ERROR', 'targetStatusCode is mandatory');
    }

    // Mandatory Q-B9 atomic check
    if (targetStatusCode === 'on_hold') {
      if (!holdType || !holdReasonCode) {
        return problemResponse(
          422,
          'MANDATORY_HOLD_REQUIREMENTS_MISSING',
          'holdType and holdReasonCode are required atomically when transitioning to on_hold (Q-B9).',
          { targetStatusCode: 'on_hold', requiredFields: ['holdType', 'holdReasonCode'] }
        );
      }
      svc.holdType = holdType;
      svc.holdReasonCode = holdReasonCode;
    } else {
      svc.holdType = undefined as any;
      svc.holdReasonCode = undefined as any;
    }

    const prevStatus = svc.status;
    svc.status = targetStatusCode;
    storage.revision++;

    if (!storage.history[serviceUuid]) {
      storage.history[serviceUuid] = [];
    }
    storage.history[serviceUuid].push({
      fromCode: prevStatus,
      toCode: targetStatusCode,
      actorUserUuid: 'user-clerk',
      occurredAt: new Date().toISOString(),
      comment: comment || `Status transitioned from ${prevStatus} to ${targetStatusCode}`,
    });
    saveStorage(storage);

    const nextETag = computeETag(svc, storage.revision);
    return jsonResponse(
      {
        transitionResult: 'SUCCESS',
        serviceItemUuid: serviceUuid,
        previousStatus: prevStatus,
        currentStatus: targetStatusCode,
        etag: nextETag,
      },
      200,
      { ETag: nextETag }
    );
  }

  // 11. History (GET /api/v1/services/:id/history)
  const historyMatch = path.match(/^\/api\/v1\/services\/([^\/]+)\/history$/);
  if (method === 'GET' && historyMatch) {
    const serviceUuid = historyMatch[1];
    const hist = storage.history[serviceUuid] || [
      {
        fromCode: 'draft',
        toCode: 'pending_intake',
        actorUserUuid: 'user-clerk',
        occurredAt: new Date().toISOString(),
        comment: 'Initial creation',
      },
    ];
    return jsonResponse(hist);
  }

  // 12. Single Service Item (GET /api/v1/services/:id)
  const singleServiceMatch = path.match(/^\/api\/v1\/services\/([^\/]+)$/);
  if (method === 'GET' && singleServiceMatch) {
    const serviceUuid = singleServiceMatch[1];
    let svc = storage.services.find((s) => s.uuid === serviceUuid);
    if (!svc) {
      svc = {
        uuid: serviceUuid,
        serviceItemUuid: serviceUuid,
        orderUuid: 'ORD-504901',
        sellableItemUuid: '00000000-0000-0000-0000-000000000003',
        name: 'Biomodel 3D Print',
        categoryCode: 'restorative',
        status: 'pending_intake',
        answers: [{ fieldCode: 'model_type', value: 'solid', optionCodes: ['solid'] }],
        billedToContactUuid: 'contact-dr-smith-01',
        billedPartyOrigin: 'order_default',
        canEditBilledParty: true,
        isBillable: true,
        canEditBillability: true,
        canEditPrice: true,
        currencyCode: 'USD',
        unitPrice: '120.00',
        quantity: 1,
        lineTotal: '120.00',
      } as any;
      storage.services.push(svc!);
      saveStorage(storage);
    }
    const etag = computeETag(svc!, storage.revision);
    return jsonResponse(svc, 200, { ETag: etag });
  }

  // 13. Service Edit (PATCH /api/v1/services/:id)
  if (method === 'PATCH' && singleServiceMatch) {
    const serviceUuid = singleServiceMatch[1];
    const svc = storage.services.find((s) => s.uuid === serviceUuid);
    if (!svc) {
      return problemResponse(404, 'NOT_FOUND', `Service item ${serviceUuid} not found`);
    }

    const ifMatch = reqHeaders.get('if-match');
    const currentETag = computeETag(svc, storage.revision);
    if (!ifMatch) {
      return problemResponse(
        428,
        'PRECONDITION_REQUIRED',
        'If-Match header with current ETag is required to edit service item.'
      );
    }
    if (ifMatch !== currentETag && ifMatch !== '*') {
      return problemResponse(
        412,
        'STALE_PRECONDITION',
        'Resource modified concurrently. If-Match tag does not match current ETag.',
        { serviceUuid, providedETag: ifMatch, currentETag }
      );
    }

    let patch: any = {};
    try {
      patch = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return problemResponse(400, 'BAD_REQUEST', 'Invalid JSON body');
    }

    // Mandatory Q-B10 check: if price is 0.00, zeroChargeReasonCode is required
    const targetPrice = patch.unitPrice !== undefined ? patch.unitPrice : svc.unitPrice;
    if (parseFloat(targetPrice) === 0 && !patch.zeroChargeReasonCode && !svc.zeroChargeReasonCode) {
      return problemResponse(
        422,
        'ZERO_CHARGE_REASON_MANDATORY',
        'zeroChargeReasonCode is mandatory when setting unitPrice to 0.00 (Q-B10).',
        { field: 'zeroChargeReasonCode' }
      );
    }

    if (patch.unitPrice !== undefined) svc.unitPrice = patch.unitPrice;
    if (patch.quantity !== undefined) svc.quantity = patch.quantity;
    svc.lineTotal = (parseFloat(svc.unitPrice || '0') * (svc.quantity || 1)).toFixed(2);

    if (patch.zeroChargeReasonCode !== undefined) svc.zeroChargeReasonCode = patch.zeroChargeReasonCode;
    if (patch.zeroChargeNote !== undefined) (svc as any).zeroChargeNote = patch.zeroChargeNote;
    if (patch.isBillable !== undefined) svc.isBillable = patch.isBillable;
    if (patch.billedToContactUuid !== undefined) {
      svc.billedToContactUuid = patch.billedToContactUuid;
      svc.billedPartyOrigin = 'user_selected';
    }
    if (patch.answers !== undefined) svc.answers = patch.answers;

    storage.revision++;
    if (!storage.history[serviceUuid]) {
      storage.history[serviceUuid] = [];
    }
    storage.history[serviceUuid].push({
      fromCode: svc.status,
      toCode: svc.status,
      actorUserUuid: 'user-clerk',
      occurredAt: new Date().toISOString(),
      comment: `Updated pricing/payer/answers via PATCH /services/${serviceUuid}`,
    });
    saveStorage(storage);

    const nextETag = computeETag(svc, storage.revision);
    return jsonResponse(svc, 200, { ETag: nextETag });
  }

  return null;
}

/**
 * Initializes the global in-browser contract engine interceptor.
 * If running on localhost and the node mock-server is up, it defers to network,
 * but falls back gracefully if the local server is down or when deployed on GitHub Pages.
 */
import { getApiConfig } from './config';

export function initInBrowserContractEngine(): void {
  if (typeof window === 'undefined') return;
  const cfg = getApiConfig();
  if (cfg.mode !== 'MOCK_BROWSER') return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Check if this is an API contract endpoint
    const isContractUrl =
      urlStr.includes('/api/v1/') ||
      urlStr.endsWith('/health') ||
      urlStr.includes(':3000/api/v1/') ||
      urlStr.includes(':3000/health');

    if (!isContractUrl) {
      return originalFetch(input, init);
    }

    const url = new URL(urlStr, window.location.origin);
    const method = (init?.method || 'GET').toUpperCase();
    const headers = new Headers(init?.headers);
    let bodyText: string | undefined = undefined;

    if (init?.body) {
      if (typeof init.body === 'string') {
        bodyText = init.body;
      } else if (init.body instanceof Blob) {
        bodyText = await init.body.text();
      }
    }

    // If running on localhost and not a simulated offline mode, try the real network server first
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const networkResponse = await originalFetch(input, init);
        // If the server responded with 200..499, it's an active server
        return networkResponse;
      } catch (err) {
        // Local server unreachable: fall through to in-browser engine seamlessly!
      }
    }

    // Execute in-browser contract engine
    const contractResponse = await handleInBrowserContractRequest(
      url.pathname || "",
      method,
      url.searchParams,
      headers,
      bodyText
    );

    if (contractResponse) {
      return contractResponse;
    }

    return originalFetch(input, init);
  };

  console.log('✅ In-Browser OpenAPI 3.0.3 Contract Engine active (Q-B8..Q-B15 compliant)');
}
