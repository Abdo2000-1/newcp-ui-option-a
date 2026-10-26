#!/usr/bin/env node

/**
 * New CP — Canonical OpenAPI 3.0.3 HTTP Mock Server
 * 
 * Standalone, zero-dependency Node.js HTTP server implementing the official
 * New CP service-instance OpenAPI contract (newcp.openapi.yaml) on port 3000.
 * 
 * Target: Q-B8..Q-B15 Implementation Target
 * Endpoints:
 *   - GET  /health
 *   - GET  /api/v1/catalog/services
 *   - GET  /api/v1/catalog/services/:serviceUuid/form-schema
 *   - GET  /api/v1/catalog/hold-reasons
 *   - GET  /api/v1/lookups/hold-reasons
 *   - GET  /api/v1/lookups/zero-charge-reasons
 *   - GET  /api/v1/orders/:orderUuid/services
 *   - POST /api/v1/orders/:orderUuid/services
 *   - GET  /api/v1/services/:serviceItemUuid
 *   - PATCH /api/v1/services/:serviceItemUuid
 *   - GET  /api/v1/services/:serviceItemUuid/available-transitions
 *   - POST /api/v1/services/:serviceItemUuid/transitions
 *   - GET  /api/v1/services/:serviceItemUuid/history
 *   - GET  /api/v1/orders/:orderUuid/eligible-billed-parties
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// ============================================================================
// In-Memory Storage
// ============================================================================

const catalogServices = [
  {
    uuid: '00000000-0000-0000-0000-000000000003',
    code: 'SVC-BIOMODEL',
    name: 'Biomodel 3D Print',
    itemKind: 'service',
    categoryCode: 'restorative',
    isDigital: false,
    workflowCode: 'WF-REST-01',
    leadTimeDays: 2
  },
  {
    uuid: '00000000-0000-0000-0000-000000000004',
    code: 'SVC-SURG-GUIDE',
    name: 'Surgical Guide Design & Print',
    itemKind: 'service',
    categoryCode: 'surgical',
    isDigital: false,
    workflowCode: 'WF-SURG-01',
    leadTimeDays: 3
  },
  {
    uuid: '00000000-0000-0000-0000-000000000005',
    code: 'SVC-ALIGNER-STEP',
    name: 'Clear Aligner Step',
    itemKind: 'service',
    categoryCode: 'orthodontic',
    isDigital: true,
    workflowCode: 'WF-ORTHO-01',
    leadTimeDays: 1
  },
  {
    uuid: 'cat-waxup-sellable',
    code: 'SVC-DIAG-WAXUP',
    name: 'Diagnostic Digital Waxup',
    itemKind: 'service',
    categoryCode: 'restorative',
    isDigital: true,
    workflowCode: 'WF-REST-01',
    leadTimeDays: 2
  }
];

const holdReasons = [
  {
    code: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
    label: 'Awaiting customer input',
    holdType: 'customer',
    isTemporary: false,
    active: true
  },
  {
    code: 'SYNTHETIC_CUSTOMER_FILE_REUPLOAD',
    label: 'Awaiting scan/file reupload',
    holdType: 'customer',
    isTemporary: false,
    active: true
  },
  {
    code: 'SYNTHETIC_CUSTOMER_PAYMENT_PENDING',
    label: 'Customer payment confirmation pending',
    holdType: 'customer',
    isTemporary: false,
    active: true
  },
  {
    code: 'SYNTHETIC_INTERNAL_QC_HOLD',
    label: 'Internal Quality Control review',
    holdType: 'internal',
    isTemporary: false,
    active: true
  },
  {
    code: 'SYNTHETIC_INTERNAL_ENGINEERING_REVIEW',
    label: 'Engineering/CAD verification required',
    holdType: 'internal',
    isTemporary: false,
    active: true
  }
];

const zeroChargeReasons = [
  {
    code: 'SYNTHETIC_WARRANTY_REMAKE',
    label: 'Warranty remake / Clinician correction',
    active: true,
    description: 'Complimentary remake under clinical warranty terms'
  },
  {
    code: 'SYNTHETIC_CLINICAL_GOODWILL',
    label: 'Clinical goodwill courtesy adjustment',
    active: true,
    description: 'Approved courtesy discount by studio director'
  },
  {
    code: 'SYNTHETIC_MARKETING_PROMOTION',
    label: 'Promotional demonstration case',
    active: true,
    description: 'Marketing campaign or clinical study demonstration'
  },
  {
    code: 'SYNTHETIC_INTERNAL_TRAINING',
    label: 'Internal technician training model',
    active: true,
    description: 'Studio staff training and calibration'
  }
];

// Seed services by order
const servicesStore = new Map();
const historyStore = new Map();
let revisionCounter = 100;

function computeETag(service) {
  const hash = crypto.createHash('md5').update(JSON.stringify(service) + revisionCounter).digest('hex').slice(0, 8);
  return `W/"srv-${service.uuid || service.serviceItemUuid}-${hash}"`;
}

function initSeedServices() {
  const seeds = [
    {
      uuid: 'srv-biomodel-001',
      orderUuid: 'ORD-504901',
      sellableItemUuid: '00000000-0000-0000-0000-000000000003',
      name: 'Biomodel 3D Print (Upper)',
      categoryCode: 'restorative',
      status: 'pending_intake',
      answers: [
        { fieldCode: 'model_type', value: 'solid' },
        { fieldCode: 'jaw_type', value: 'upper' }
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
      lineTotal: '120.00'
    },
    {
      uuid: 'srv-biomodel-002',
      orderUuid: 'ORD-504901',
      sellableItemUuid: '00000000-0000-0000-0000-000000000003',
      name: 'Biomodel 3D Print (Lower)',
      categoryCode: 'restorative',
      status: 'pending_intake',
      answers: [
        { fieldCode: 'model_type', value: 'hollow' },
        { fieldCode: 'jaw_type', value: 'lower' }
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
      lineTotal: '140.00'
    },
    {
      uuid: '00000000-0000-0000-0000-000000000014',
      orderUuid: '00000000-0000-0000-0000-000000000001',
      sellableItemUuid: '00000000-0000-0000-0000-000000000003',
      name: 'Standard Biomodel',
      categoryCode: 'restorative',
      status: 'new',
      answers: [],
      billedToContactUuid: 'contact-dr-smith-01',
      billedPartyOrigin: 'order_default',
      canEditBilledParty: true,
      isBillable: true,
      canEditBillability: true,
      canEditPrice: true,
      currencyCode: 'USD',
      unitPrice: '20.00',
      quantity: 1,
      lineTotal: '20.00'
    }
  ];

  for (const s of seeds) {
    const etag = computeETag(s);
    servicesStore.set(s.uuid, { item: s, etag });
    historyStore.set(s.uuid, [
      {
        fromCode: 'draft',
        toCode: s.status,
        actorUserUuid: '00000000-0000-0000-0000-000000000002',
        occurredAt: new Date(Date.now() - 3600000).toISOString(),
        comment: 'Order intake submission'
      }
    ]);
  }
}

initSeedServices();

// ============================================================================
// HTTP Server Handlers
// ============================================================================

function sendJson(res, statusCode, data, headers = {}) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-Match, X-Tenant-ID',
    'Access-Control-Expose-Headers': 'ETag, Content-Type, X-Request-ID',
    ...headers
  });
  res.end(body);
}

function sendProblem(res, statusCode, code, message, details = {}) {
  sendJson(res, statusCode, {
    code,
    message,
    requestId: 'req-' + crypto.randomUUID().slice(0, 8),
    details
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';
  const method = req.method ? req.method.toUpperCase() : 'GET';

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-Match, X-Tenant-ID',
      'Access-Control-Expose-Headers': 'ETag, Content-Type, X-Request-ID',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  const logTimestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${logTimestamp}] ${method} ${pathname}`);

  try {
    // 1. Health check
    if (pathname === '/health' || pathname === '/api/v1/health') {
      return sendJson(res, 200, {
        status: 'UP',
        timestamp: new Date().toISOString(),
        version: '1.0.0-mock-server',
        service: 'newcp-api-contract-mock'
      });
    }

    // 2. Catalog Services (GET /api/v1/catalog/services)
    if (method === 'GET' && pathname === '/api/v1/catalog/services') {
      let filtered = catalogServices;
      if (parsed.query.categoryCode) {
        filtered = filtered.filter(s => s.categoryCode === parsed.query.categoryCode);
      }
      return sendJson(res, 200, filtered);
    }

    // 3. Dynamic Form Schema (GET /api/v1/catalog/services/:id/form-schema)
    const formSchemaMatch = pathname.match(/^\/api\/v1\/catalog\/services\/([^\/]+)\/form-schema$/);
    if (method === 'GET' && formSchemaMatch) {
      const serviceUuid = formSchemaMatch[1];
      const svc = catalogServices.find(s => s.uuid === serviceUuid);
      return sendJson(res, 200, {
        serviceUuid,
        serviceCode: svc ? svc.code : 'SVC-CUSTOM',
        fields: [
          {
            fieldCode: 'model_type',
            label: 'Biomodel Base Type',
            canonicalType: 'single_select',
            required: true,
            options: [
              { code: 'solid', label: 'Solid Solid-Base Print' },
              { code: 'hollow', label: 'Hollow Honeycomb Shell' }
            ]
          },
          {
            fieldCode: 'jaw_type',
            label: 'Dental Arch (Jaw)',
            canonicalType: 'single_select',
            required: true,
            options: [
              { code: 'upper', label: 'Maxillary (Upper)' },
              { code: 'lower', label: 'Mandibular (Lower)' },
              { code: 'both', label: 'Bimaxillary (Both)' }
            ]
          },
          {
            fieldCode: 'hollow_wall_thickness',
            label: 'Wall Thickness (mm)',
            canonicalType: 'number',
            required: false,
            condition: {
              field: 'model_type',
              op: 'eq',
              value: 'hollow'
            }
          }
        ],
        conditionalRules: [
          {
            targetFieldCode: 'hollow_wall_thickness',
            ruleKind: 'visible',
            condition: { field: 'model_type', op: 'eq', value: 'hollow' }
          }
        ]
      });
    }

    // 4. Hold Reasons (GET /api/v1/catalog/hold-reasons, /api/v1/lookups/hold-reasons)
    if (method === 'GET' && (pathname === '/api/v1/catalog/hold-reasons' || pathname === '/api/v1/lookups/hold-reasons')) {
      let result = holdReasons;
      if (parsed.query.holdType) {
        result = result.filter(r => r.holdType === parsed.query.holdType);
      }
      return sendJson(res, 200, result);
    }

    // 5. Zero-Charge Reasons (GET /api/v1/lookups/zero-charge-reasons)
    if (method === 'GET' && pathname === '/api/v1/lookups/zero-charge-reasons') {
      return sendJson(res, 200, zeroChargeReasons);
    }

    // 6. Eligible Billed Parties (GET /api/v1/orders/:orderUuid/eligible-billed-parties)
    const billedPartiesMatch = pathname.match(/^\/api\/v1\/orders\/([^\/]+)\/eligible-billed-parties$/);
    if (method === 'GET' && billedPartiesMatch) {
      return sendJson(res, 200, [
        {
          contactUuid: 'contact-dr-smith-01',
          role: 'doctor',
          label: 'Dr. John Smith (Ordering Clinician)'
        },
        {
          contactUuid: 'contact-sc-metro-02',
          role: 'scanning_center',
          label: 'Metro Imaging Scanning Center'
        }
      ]);
    }

    // 7. Order Services Listing (GET /api/v1/orders/:orderUuid/services)
    const orderServicesMatch = pathname.match(/^\/api\/v1\/orders\/([^\/]+)\/services$/);
    if (method === 'GET' && orderServicesMatch) {
      const orderUuid = orderServicesMatch[1];
      const norm = (id) => (id || '').replace(/^ORD-/i, '');
      let items = Array.from(servicesStore.values())
        .filter(entry => entry.item.orderUuid === orderUuid || orderUuid === 'all' || norm(entry.item.orderUuid) === norm(orderUuid))
        .map(entry => entry.item);

      // Auto-seed for this order if empty so every order has live contract services!
      if (items.length === 0 && orderUuid !== 'all') {
        const cleanId = orderUuid.toLowerCase().replace(/[^a-z0-9]/g, '');
        const s1Uuid = `srv-${cleanId}-01`;
        const s2Uuid = `srv-${cleanId}-02`;

        const s1 = {
          uuid: s1Uuid,
          serviceItemUuid: s1Uuid,
          orderUuid: orderUuid,
          sellableItemUuid: '00000000-0000-0000-0000-000000000003',
          name: 'Biomodel 3D Print (Upper)',
          categoryCode: 'restorative',
          status: 'pending_intake',
          answers: [
            { fieldCode: 'model_type', value: 'solid' },
            { fieldCode: 'jaw_type', value: 'upper' }
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
          lineTotal: '120.00'
        };
        const s2 = {
          uuid: s2Uuid,
          serviceItemUuid: s2Uuid,
          orderUuid: orderUuid,
          sellableItemUuid: '00000000-0000-0000-0000-000000000004',
          name: 'Surgical Guide Design & Print',
          categoryCode: 'surgical',
          status: 'in_progress',
          answers: [
            { fieldCode: 'guide_support', value: 'tooth_supported' }
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
          lineTotal: '250.00'
        };

        const etag1 = computeETag(s1);
        const etag2 = computeETag(s2);
        servicesStore.set(s1Uuid, { item: s1, etag: etag1 });
        servicesStore.set(s2Uuid, { item: s2, etag: etag2 });
        historyStore.set(s1Uuid, [{ fromCode: 'draft', toCode: 'pending_intake', actorUserUuid: 'mock-clerk-user', occurredAt: new Date().toISOString(), comment: 'Auto-seeded OpenAPI 3.0.3 service instance' }]);
        historyStore.set(s2Uuid, [{ fromCode: 'draft', toCode: 'in_progress', actorUserUuid: 'mock-clerk-user', occurredAt: new Date().toISOString(), comment: 'Auto-seeded OpenAPI 3.0.3 service instance' }]);

        items = [s1, s2];
      }

      const orderETag = `W/"ord-${orderUuid}-${revisionCounter}"`;
      return sendJson(res, 200, items, { 'ETag': orderETag });
    }

    // 8. Order Service Creation (POST /api/v1/orders/:orderUuid/services)
    if (method === 'POST' && orderServicesMatch) {
      const orderUuid = orderServicesMatch[1];
      const body = await parseJsonBody(req);
      if (!body.sellableItemUuid) {
        return sendProblem(res, 422, 'VALIDATION_ERROR', 'sellableItemUuid is mandatory', { field: 'sellableItemUuid' });
      }

      revisionCounter++;
      const newUuid = 'srv-' + crypto.randomUUID().slice(0, 8);
      const unitPrice = body.unitPrice || '100.00';
      const quantity = body.quantity || 1;
      const lineTotal = (parseFloat(unitPrice) * quantity).toFixed(2);

      const newItem = {
        uuid: newUuid,
        serviceItemUuid: newUuid,
        orderUuid,
        sellableItemUuid: body.sellableItemUuid,
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
        redoOfItemUuid: body.redoOfItemUuid || null,
        serviceNotes: body.serviceNotes || null
      };

      const etag = computeETag(newItem);
      servicesStore.set(newUuid, { item: newItem, etag });
      historyStore.set(newUuid, [
        {
          fromCode: 'draft',
          toCode: 'pending_intake',
          actorUserUuid: 'mock-clerk-user',
          occurredAt: new Date().toISOString(),
          comment: 'Created via POST /orders/' + orderUuid + '/services'
        }
      ]);

      return sendJson(res, 201, newItem, { 'ETag': etag });
    }

    // 9. Available Transitions (GET /api/v1/services/:id/available-transitions)
    const availTransitionsMatch = pathname.match(/^\/api\/v1\/services\/([^\/]+)\/available-transitions$/);
    if (method === 'GET' && availTransitionsMatch) {
      const serviceItemUuid = availTransitionsMatch[1];
      const entry = servicesStore.get(serviceItemUuid);
      const currentStatus = entry ? entry.item.status : 'pending_intake';

      if (currentStatus === 'on_hold') {
        return sendJson(res, 200, [
          { transitionId: 201, fromCode: 'on_hold', toCode: 'in_progress', label: 'Resume In Progress' },
          { transitionId: 202, fromCode: 'on_hold', toCode: 'cancelled', label: 'Cancel Service' }
        ]);
      }

      return sendJson(res, 200, [
        { transitionId: 101, fromCode: currentStatus, toCode: 'in_progress', label: 'Start In Progress' },
        { transitionId: 102, fromCode: currentStatus, toCode: 'on_hold', label: 'Place On Hold', requiresHoldDetails: true },
        { transitionId: 103, fromCode: currentStatus, toCode: 'completed', label: 'Complete Service' }
      ]);
    }

    // 10. Execute Transition (POST /api/v1/services/:id/transitions)
    const transitionsMatch = pathname.match(/^\/api\/v1\/services\/([^\/]+)\/transitions$/);
    if (method === 'POST' && transitionsMatch) {
      const serviceItemUuid = transitionsMatch[1];
      const entry = servicesStore.get(serviceItemUuid);
      if (!entry) {
        return sendProblem(res, 404, 'NOT_FOUND', `Service item ${serviceItemUuid} was not found`);
      }

      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return sendProblem(res, 428, 'PRECONDITION_REQUIRED', 'If-Match header is mandatory for workflow transitions');
      }

      if (ifMatch !== entry.etag && ifMatch !== '*') {
        return sendProblem(res, 412, 'STALE_PRECONDITION', 'Resource modified concurrently. If-Match tag does not match current ETag.', {
          serviceItemUuid,
          providedETag: ifMatch,
          currentETag: entry.etag
        });
      }

      const body = await parseJsonBody(req);
      if (!body.transitionId) {
        return sendProblem(res, 422, 'VALIDATION_ERROR', 'A valid numeric transitionId is required', { field: 'transitionId' });
      }

      const isHold = body.transitionId === 102 || body.holdType !== undefined || body.holdReasonCode !== undefined;
      if (isHold) {
        if (!body.holdType || !body.holdReasonCode) {
          return sendProblem(res, 422, 'VALIDATION_ERROR', 'Entering on_hold strictly requires both holdType ("customer" or "internal") and holdReasonCode.', {
            field: !body.holdType ? 'holdType' : 'holdReasonCode'
          });
        }
        if (body.holdType !== 'customer' && body.holdType !== 'internal') {
          return sendProblem(res, 422, 'VALIDATION_ERROR', 'holdType must be strictly "customer" or "internal".', { field: 'holdType' });
        }
      }

      let toCode = 'in_progress';
      if (body.transitionId === 102) toCode = 'on_hold';
      else if (body.transitionId === 103) toCode = 'completed';
      else if (body.transitionId === 201) toCode = 'in_progress';
      else if (body.transitionId === 202) toCode = 'cancelled';

      revisionCounter++;
      const fromCode = entry.item.status;
      entry.item.status = toCode;
      if (toCode === 'on_hold') {
        entry.item.holdType = body.holdType;
        entry.item.holdReasonCode = body.holdReasonCode;
      } else {
        entry.item.holdType = null;
        entry.item.holdReasonCode = null;
      }

      entry.etag = computeETag(entry.item);
      const changedAt = new Date().toISOString();

      const hist = historyStore.get(serviceItemUuid) || [];
      hist.push({
        fromCode,
        toCode,
        actorUserUuid: 'mock-clerk-user',
        occurredAt: changedAt,
        comment: body.comment || (toCode === 'on_hold' ? `Placed on hold (${body.holdType}: ${body.holdReasonCode})` : undefined)
      });
      historyStore.set(serviceItemUuid, hist);

      return sendJson(res, 200, {
        serviceItemUuid,
        fromCode,
        toCode,
        changedAt,
        actorUserUuid: 'mock-clerk-user',
        ...(toCode === 'on_hold' ? { holdType: body.holdType, holdReasonCode: body.holdReasonCode } : {})
      }, { 'ETag': entry.etag });
    }

    // 11. Service History (GET /api/v1/services/:id/history)
    const historyMatch = pathname.match(/^\/api\/v1\/services\/([^\/]+)\/history$/);
    if (method === 'GET' && historyMatch) {
      const serviceItemUuid = historyMatch[1];
      const hist = historyStore.get(serviceItemUuid) || [];
      return sendJson(res, 200, hist);
    }

    // 12. Single Service Item (GET /api/v1/services/:id)
    const singleServiceMatch = pathname.match(/^\/api\/v1\/services\/([^\/]+)$/);
    if (method === 'GET' && singleServiceMatch) {
      const serviceItemUuid = singleServiceMatch[1];
      let entry = servicesStore.get(serviceItemUuid);
      if (!entry) {
        const synthetic = {
          uuid: serviceItemUuid,
          serviceItemUuid: serviceItemUuid,
          orderUuid: 'ORD-504901',
          sellableItemUuid: '00000000-0000-0000-0000-000000000003',
          name: 'Biomodel 3D Print',
          categoryCode: 'restorative',
          status: 'pending_intake',
          answers: [{ fieldCode: 'model_type', value: 'solid' }],
          billedToContactUuid: 'contact-dr-smith-01',
          billedPartyOrigin: 'order_default',
          canEditBilledParty: true,
          isBillable: true,
          canEditBillability: true,
          canEditPrice: true,
          currencyCode: 'USD',
          unitPrice: '120.00',
          quantity: 1,
          lineTotal: '120.00'
        };
        const etag = computeETag(synthetic);
        entry = { item: synthetic, etag };
        servicesStore.set(serviceItemUuid, entry);
        historyStore.set(serviceItemUuid, [
          {
            fromCode: 'draft',
            toCode: 'pending_intake',
            actorUserUuid: 'mock-clerk-user',
            occurredAt: new Date().toISOString(),
            comment: 'OpenAPI 3.0.3 synthetic instance'
          }
        ]);
      }
      return sendJson(res, 200, entry.item, { 'ETag': entry.etag });
    }

    // 13. Service Edit (PATCH /api/v1/services/:id)
    if (method === 'PATCH' && singleServiceMatch) {
      const serviceItemUuid = singleServiceMatch[1];
      const entry = servicesStore.get(serviceItemUuid);
      if (!entry) {
        return sendProblem(res, 404, 'NOT_FOUND', `Service item ${serviceItemUuid} was not found`);
      }

      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return sendProblem(res, 428, 'PRECONDITION_REQUIRED', 'If-Match header containing the current ETag is required to edit a service item.');
      }

      if (ifMatch !== entry.etag && ifMatch !== '*') {
        return sendProblem(res, 412, 'STALE_PRECONDITION', 'Resource modified concurrently. If-Match tag does not match current ETag.', {
          serviceItemUuid,
          providedETag: ifMatch,
          currentETag: entry.etag
        });
      }

      const patch = await parseJsonBody(req);

      // Check Zero-Charge constraint
      const effPriceStr = patch.unitPrice !== undefined ? patch.unitPrice : entry.item.unitPrice;
      const effQty = patch.quantity !== undefined ? patch.quantity : entry.item.quantity;
      const effTotal = parseFloat(effPriceStr) * effQty;

      if (effTotal === 0) {
        const reason = patch.zeroChargeReasonCode !== undefined ? patch.zeroChargeReasonCode : entry.item.zeroChargeReasonCode;
        if (!reason || !reason.trim()) {
          return sendProblem(res, 422, 'ZERO_CHARGE_REASON_REQUIRED', 'When line total is $0.00, a zeroChargeReasonCode is strictly mandatory (Q-B10).', {
            field: 'zeroChargeReasonCode'
          });
        }
      }

      // Apply patch
      if (patch.answers) entry.item.answers = patch.answers;
      if (patch.isBillable !== undefined) entry.item.isBillable = patch.isBillable;
      if (patch.billedToContactUuid) {
        entry.item.billedToContactUuid = patch.billedToContactUuid;
        entry.item.billedPartyOrigin = 'user_selected';
      }
      if (patch.unitPrice !== undefined) entry.item.unitPrice = patch.unitPrice;
      if (patch.quantity !== undefined) entry.item.quantity = patch.quantity;
      if (effPriceStr && effQty) {
        entry.item.lineTotal = effTotal.toFixed(2);
      }
      if (patch.zeroChargeReasonCode !== undefined) entry.item.zeroChargeReasonCode = patch.zeroChargeReasonCode;
      if (patch.zeroChargeNote !== undefined) entry.item.zeroChargeNote = patch.zeroChargeNote;
      if (patch.serviceNotes !== undefined) entry.item.serviceNotes = patch.serviceNotes;

      revisionCounter++;
      entry.etag = computeETag(entry.item);

      return sendJson(res, 200, entry.item, { 'ETag': entry.etag });
    }

    // Default 404
    sendProblem(res, 404, 'ROUTE_NOT_FOUND', `Path ${pathname} with method ${method} is not covered by the New CP OpenAPI mock server.`);
  } catch (err) {
    console.error('Mock server internal error:', err);
    sendProblem(res, 500, 'INTERNAL_SERVER_ERROR', err.message || 'Internal server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`  New CP OpenAPI 3.0.3 HTTP Mock Server is LIVE!`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`  Base API:     http://localhost:${PORT}/api/v1`);
  console.log(`================================================================`);
});
