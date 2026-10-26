#!/usr/bin/env node

/**
 * OpenAPI Contract & Mock Server Integration Verification Script
 * 
 * Executes real HTTP requests against:
 * 1. The running Node.js mock API server (http://localhost:3000)
 * 2. The running Vite frontend dev server reverse-proxy (http://localhost:5173/api/v1)
 * 
 * Verifies all 14 contract endpoints, request methods, query parameters, path parameters,
 * headers (Authorization, X-Tenant-ID, If-Match), ETag response headers, status codes
 * (200, 201, 404, 412, 422, 428), and contract gap routes (session/context, orders, DELETE).
 */

const http = require('http');

const MOCK_BASE = process.env.MOCK_URL || 'http://localhost:3000';
const PROXY_BASE = process.env.FRONTEND_URL || 'http://localhost:5173';

const results = [];

function httpRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const headers = { ...options.headers };
    let bodyData = null;
    if (options.body) {
      bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        let parsedJson = null;
        try {
          parsedJson = JSON.parse(raw);
        } catch {}
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: parsedJson,
          raw
        });
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runTest(testName, fn) {
  process.stdout.write(`  Testing: ${testName}... `);
  try {
    const evidence = await fn();
    results.push({ name: testName, status: 'PASS', evidence });
    console.log('✅ PASS');
  } catch (err) {
    results.push({ name: testName, status: 'FAIL', error: err.message, stack: err.stack });
    console.log(`❌ FAIL: ${err.message}`);
  }
}

async function main() {
  console.log('========================================================================');
  console.log('  New CP React Option A — OpenAPI Mock Server Live Verification');
  console.log(`  Target Mock Server:     ${MOCK_BASE}`);
  console.log(`  Target Frontend Proxy:  ${PROXY_BASE}`);
  console.log('========================================================================\n');

  // Section 1: Health Probes
  console.log('--- 1. Health Probe Endpoints ---');
  await runTest('GET /health (direct mock server)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data?.status !== 'UP') throw new Error(`Expected status UP, got ${res.data?.status}`);
    return { status: res.status, service: res.data?.service };
  });

  await runTest('GET /api/v1/health (via frontend proxy)', async () => {
    const res = await httpRequest(`${PROXY_BASE}/api/v1/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data?.status !== 'UP') throw new Error(`Expected status UP, got ${res.data?.status}`);
    return { status: res.status, proxied: true };
  });

  // Section 2: Catalog Endpoints
  console.log('\n--- 2. Catalog Service Endpoints ---');
  await runTest('GET /api/v1/catalog/services (list all)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/catalog/services`, {
      headers: {
        'Authorization': 'Bearer mock-token-cs-user',
        'X-Tenant-ID': '1'
      }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected non-empty array');
    return { count: res.data.length, firstService: res.data[0].code };
  });

  await runTest('GET /api/v1/catalog/services?categoryCode=restorative (query filter)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/catalog/services?categoryCode=restorative`, {
      headers: { 'Authorization': 'Bearer mock-token-cs-user' }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const nonRestorative = res.data.filter(s => s.categoryCode !== 'restorative');
    if (nonRestorative.length > 0) throw new Error('Query parameter filtering failed');
    return { count: res.data.length, category: 'restorative' };
  });

  await runTest('GET /api/v1/catalog/services/:uuid/form-schema (dynamic schema)', async () => {
    const serviceUuid = '00000000-0000-0000-0000-000000000003';
    const res = await httpRequest(`${MOCK_BASE}/api/v1/catalog/services/${serviceUuid}/form-schema`, {
      headers: { 'Authorization': 'Bearer mock-token-cs-user' }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.fields || !Array.isArray(res.data.fields)) throw new Error('Expected fields array');
    if (!res.data.conditionalRules) throw new Error('Expected conditionalRules');
    return { fieldCount: res.data.fields.length, conditionalRulesCount: res.data.conditionalRules.length };
  });

  // Section 3: Lookups & Reasons
  console.log('\n--- 3. Lookups & Reasons Endpoints ---');
  await runTest('GET /api/v1/catalog/hold-reasons (all hold reasons)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/catalog/hold-reasons`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected hold reasons array');
    return { count: res.data.length };
  });

  await runTest('GET /api/v1/catalog/hold-reasons?holdType=customer (customer hold reasons)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/catalog/hold-reasons?holdType=customer`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const nonCustomer = res.data.filter(r => r.holdType !== 'customer');
    if (nonCustomer.length > 0) throw new Error('holdType filtering failed');
    return { count: res.data.length, holdType: 'customer' };
  });

  await runTest('GET /api/v1/lookups/hold-reasons (lookup alias path)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/lookups/hold-reasons`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    return { count: res.data.length };
  });

  await runTest('GET /api/v1/lookups/zero-charge-reasons (Q-B10 reasons)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/lookups/zero-charge-reasons`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected zero-charge reasons');
    return { count: res.data.length, sampleCode: res.data[0].code };
  });

  // Section 4: Eligible Billed Parties (F07 proposal)
  console.log('\n--- 4. Eligible Billed Parties Endpoints (F07) ---');
  await runTest('GET /api/v1/orders/:orderUuid/eligible-billed-parties', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/orders/ORD-504901/eligible-billed-parties`, {
      headers: { 'Authorization': 'Bearer mock-token-cs-user' }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected eligible parties');
    return { count: res.data.length, sampleRole: res.data[0].role };
  });

  // Section 5: Order Service Instances CRUD & Concurrency
  console.log('\n--- 5. Order Service Instances CRUD & Concurrency ---');
  let currentETag = '';
  let testServiceUuid = '';

  await runTest('GET /api/v1/orders/:orderUuid/services (list + ETag)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/orders/ORD-504901/services`, {
      headers: { 'Authorization': 'Bearer mock-token-cs-user' }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const etag = res.headers['etag'];
    if (!etag) throw new Error('Expected ETag header in response');
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected services array');
    testServiceUuid = res.data[0].uuid;
    return { count: res.data.length, orderETag: etag, firstServiceUuid: testServiceUuid };
  });

  await runTest('POST /api/v1/orders/:orderUuid/services (422 missing sellableItemUuid)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/orders/ORD-504901/services`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer mock-token-cs-user' },
      body: { serviceNotes: 'Missing item' }
    });
    if (res.status !== 422) throw new Error(`Expected 422, got ${res.status}`);
    if (res.data?.code !== 'VALIDATION_ERROR') throw new Error(`Expected VALIDATION_ERROR code, got ${res.data?.code}`);
    return { status: 422, code: res.data?.code };
  });

  let createdServiceUuid = '';
  let createdETag = '';
  await runTest('POST /api/v1/orders/:orderUuid/services (201 create service item)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/orders/ORD-504901/services`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer mock-token-cs-user' },
      body: {
        sellableItemUuid: '00000000-0000-0000-0000-000000000003',
        unitPrice: '125.00',
        quantity: 1,
        billedToContactUuid: 'contact-dr-smith-01',
        answers: [{ fieldCode: 'model_type', value: 'solid' }]
      }
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (!res.data.uuid) throw new Error('Expected created service item uuid');
    createdServiceUuid = res.data.uuid;
    createdETag = res.headers['etag'];
    if (!createdETag) throw new Error('Expected ETag on created item');
    return { createdUuid: createdServiceUuid, etag: createdETag, lineTotal: res.data.lineTotal };
  });

  await runTest('GET /api/v1/services/:serviceItemUuid (fetch created item + ETag)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}`, {
      headers: { 'Authorization': 'Bearer mock-token-cs-user' }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    currentETag = res.headers['etag'];
    if (!currentETag) throw new Error('Expected ETag header');
    return { uuid: res.data.uuid, status: res.data.status, etag: currentETag };
  });

  await runTest('PATCH /api/v1/services/:serviceItemUuid (428 missing If-Match header)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}`, {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer mock-token-cs-user' },
      body: { quantity: 2 }
    });
    if (res.status !== 428) throw new Error(`Expected 428 Precondition Required, got ${res.status}`);
    return { status: 428, code: res.data?.code };
  });

  await runTest('PATCH /api/v1/services/:serviceItemUuid (412 stale If-Match tag)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer mock-token-cs-user',
        'If-Match': 'W/"stale-revision-999"'
      },
      body: { quantity: 2 }
    });
    if (res.status !== 412) throw new Error(`Expected 412 Stale Precondition, got ${res.status}`);
    return { status: 412, code: res.data?.code };
  });

  await runTest('PATCH /api/v1/services/:serviceItemUuid (422 zero price without zeroChargeReasonCode)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer mock-token-cs-user',
        'If-Match': currentETag
      },
      body: { unitPrice: '0.00' }
    });
    if (res.status !== 422) throw new Error(`Expected 422, got ${res.status}`);
    if (res.data?.code !== 'ZERO_CHARGE_REASON_REQUIRED') throw new Error(`Expected ZERO_CHARGE_REASON_REQUIRED, got ${res.data?.code}`);
    return { status: 422, code: res.data?.code };
  });

  let patchedETag = '';
  await runTest('PATCH /api/v1/services/:serviceItemUuid (200 success with zero charge justification)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer mock-token-cs-user',
        'If-Match': currentETag
      },
      body: {
        unitPrice: '0.00',
        zeroChargeReasonCode: 'SYNTHETIC_WARRANTY_REMAKE',
        zeroChargeNote: 'Remake under clinical warranty terms'
      }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    patchedETag = res.headers['etag'];
    if (!patchedETag || patchedETag === currentETag) throw new Error('Expected rotated ETag header');
    return { status: 200, lineTotal: res.data.lineTotal, rotatedETag: patchedETag };
  });

  // Section 6: Workflow Transitions & Atomic Hold
  console.log('\n--- 6. Workflow Transitions & Atomic Hold ---');
  await runTest('GET /api/v1/services/:serviceItemUuid/available-transitions', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}/available-transitions`, {
      headers: { 'Authorization': 'Bearer mock-token-ops-user' }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected transitions array');
    return { transitionCount: res.data.length, transitions: res.data.map(t => t.label) };
  });

  await runTest('POST /api/v1/services/:id/transitions (428 missing If-Match)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}/transitions`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer mock-token-ops-user' },
      body: { transitionId: 101 }
    });
    if (res.status !== 428) throw new Error(`Expected 428, got ${res.status}`);
    return { status: 428 };
  });

  await runTest('POST /api/v1/services/:id/transitions (412 stale If-Match)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}/transitions`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token-ops-user',
        'If-Match': 'W/"stale-tag"'
      },
      body: { transitionId: 101 }
    });
    if (res.status !== 412) throw new Error(`Expected 412, got ${res.status}`);
    return { status: 412 };
  });

  await runTest('POST /api/v1/services/:id/transitions (422 hold transition missing hold details)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}/transitions`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token-ops-user',
        'If-Match': patchedETag
      },
      body: { transitionId: 102 } // Place On Hold transition
    });
    if (res.status !== 422) throw new Error(`Expected 422, got ${res.status}`);
    return { status: 422, message: res.data?.message };
  });

  let heldETag = '';
  await runTest('POST /api/v1/services/:id/transitions (200 atomic on_hold with hold details)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}/transitions`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token-ops-user',
        'If-Match': patchedETag
      },
      body: {
        transitionId: 102,
        holdType: 'customer',
        holdReasonCode: 'SYNTHETIC_CUSTOMER_AWAITING_INPUT',
        comment: 'Awaiting revised impression scan'
      }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    heldETag = res.headers['etag'];
    if (!heldETag) throw new Error('Expected rotated ETag header');
    if (res.data.toCode !== 'on_hold') throw new Error(`Expected toCode=on_hold, got ${res.data.toCode}`);
    return { status: 200, toCode: res.data.toCode, holdType: res.data.holdType, rotatedETag: heldETag };
  });

  let resumedETag = '';
  await runTest('POST /api/v1/services/:id/transitions (200 resume from on_hold)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}/transitions`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token-ops-user',
        'If-Match': heldETag
      },
      body: {
        transitionId: 201, // Resume In Progress
        comment: 'Scan received, resuming production'
      }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    resumedETag = res.headers['etag'];
    if (res.data.toCode !== 'in_progress') throw new Error(`Expected toCode=in_progress, got ${res.data.toCode}`);
    return { status: 200, toCode: res.data.toCode, rotatedETag: resumedETag };
  });

  // Section 7: Audit History
  console.log('\n--- 7. Audit History Trail ---');
  await runTest('GET /api/v1/services/:serviceItemUuid/history', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}/history`, {
      headers: { 'Authorization': 'Bearer mock-token-qc-user' }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data) || res.data.length < 3) throw new Error('Expected at least 3 history events');
    return { historyCount: res.data.length, events: res.data.map(e => `${e.fromCode}->${e.toCode}`) };
  });

  // Section 8: Missing Operations, Gaps & Guardrail Checks
  console.log('\n--- 8. Contract Gaps & Guardrail Verifications ---');
  await runTest('DELETE /api/v1/services/:id (404 unmapped - no DELETE in OpenAPI)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/services/${createdServiceUuid}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer mock-token-admin' }
    });
    if (res.status !== 404) throw new Error(`Expected 404 Route Not Found, got ${res.status}`);
    return { status: 404, code: res.data?.code, verifiedGap: 'No DELETE defined in approved contract' };
  });

  await runTest('GET /api/v1/session/context (404 unmapped - IAM-006 documented gap)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/session/context`, {
      headers: { 'Authorization': 'Bearer mock-token-user' }
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    return { status: 404, code: res.data?.code, verifiedGap: 'Session context endpoint missing from OpenAPI contract (IAM-006)' };
  });

  await runTest('GET /api/v1/orders (404 unmapped - missing parent orders endpoint)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/orders`, {
      headers: { 'Authorization': 'Bearer mock-token-user' }
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    return { status: 404, code: res.data?.code, verifiedGap: 'Orders collection endpoint missing from contract' };
  });

  await runTest('GET /api/v1/cases (404 unmapped - missing cases endpoint)', async () => {
    const res = await httpRequest(`${MOCK_BASE}/api/v1/cases`, {
      headers: { 'Authorization': 'Bearer mock-token-user' }
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    return { status: 404, code: res.data?.code, verifiedGap: 'Cases endpoint missing from contract' };
  });

  // Section 9: Frontend Proxy Round-Trip for Service Instance
  console.log('\n--- 9. Frontend Proxy Verification (Vite Reverse-Proxy) ---');
  await runTest('GET /api/v1/catalog/services (via Vite proxy port 5173)', async () => {
    const res = await httpRequest(`${PROXY_BASE}/api/v1/catalog/services`, {
      headers: { 'Authorization': 'Bearer mock-token-cs-user' }
    });
    if (res.status !== 200) throw new Error(`Expected 200 via proxy, got ${res.status}`);
    return { status: 200, count: res.data.length, proxied: true };
  });

  await runTest('GET /api/v1/orders/ORD-504901/services (via Vite proxy port 5173)', async () => {
    const res = await httpRequest(`${PROXY_BASE}/api/v1/orders/ORD-504901/services`, {
      headers: { 'Authorization': 'Bearer mock-token-cs-user' }
    });
    if (res.status !== 200) throw new Error(`Expected 200 via proxy, got ${res.status}`);
    if (!res.headers['etag']) throw new Error('Expected ETag via proxy');
    return { status: 200, count: res.data.length, etag: res.headers['etag'], proxied: true };
  });

  // Summary
  console.log('\n========================================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`  VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${results.length})`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
