#!/usr/bin/env python3
"""Optional REAL HTTP API smoke tests. NEVER auto-run. Default safe read-only.
Requires approved isolated staging backend, test-only token and actual tenant/service/order UUIDs.
Mutating tests need --allow-mutations and NEWCP_TEST_ENV=isolated-staging.
This does not interact with the database directly and cannot replace V3 DB/role validation.
"""
import os,json,argparse,urllib.request,urllib.error,uuid,sys
P=argparse.ArgumentParser();P.add_argument('--allow-mutations',action='store_true');args=P.parse_args()
base=os.getenv('NEWCP_BASE_URL','').rstrip('/')
token=os.getenv('NEWCP_TEST_TOKEN','')
service=os.getenv('NEWCP_TEST_SERVICE_UUID','')
order=os.getenv('NEWCP_TEST_ORDER_UUID','')
if not all([base,token,service,order]):
 print('BLOCKED: provide NEWCP_BASE_URL, NEWCP_TEST_TOKEN, NEWCP_TEST_SERVICE_UUID, NEWCP_TEST_ORDER_UUID for approved isolated staging');sys.exit(2)
if not base.startswith(('http://localhost:','http://127.0.0.1:','https://')):
 print('BLOCKED: backend URL must be localhost or HTTPS');sys.exit(2)
if args.allow_mutations and os.getenv('NEWCP_TEST_ENV')!='isolated-staging':
 print('BLOCKED: mutating tests require NEWCP_TEST_ENV=isolated-staging');sys.exit(2)

def call(method,path,payload=None,extra_headers=None):
 data=None if payload is None else json.dumps(payload).encode()
 req=urllib.request.Request(base+path,method=method,data=data,headers={'Authorization':'Bearer '+token,'Accept':'application/json',**({'Content-Type':'application/json'} if payload is not None else {}),**(extra_headers or {})})
 try:
  with urllib.request.urlopen(req,timeout=20) as resp:
   return resp.status,json.loads(resp.read().decode())
 except urllib.error.HTTPError as ex:
  print('HTTP FAIL',method,path,ex.code)
  raise

def ensure_uuid(s):return str(uuid.UUID(s))
for x in (service,order):ensure_uuid(x)
print('Read-only contract check on configured backend:',base)
code,form=call('GET',f'/api/v1/catalog/services/{service}/form-schema')
assert code==200 and isinstance(form,dict) and isinstance(form.get('fields'),list)
code,items=call('GET',f'/api/v1/orders/{order}/services')
assert code==200 and isinstance(items,list)
print('PASS read-only endpoints; form fields:',len(form['fields']),'item count:',len(items))
if not args.allow_mutations:
 print('SKIPPED write tests (pass --allow-mutations in approved isolated staging)');sys.exit(0)
create=os.getenv('NEWCP_VALID_CREATE_JSON','')
if not create:
 print('BLOCKED mutating tests: NEWCP_VALID_CREATE_JSON must be a valid tenant-mapped form request with safe test-only values');sys.exit(2)
body=json.loads(create)
assert body['sellableItemUuid']==service, 'Create request must match selected catalog UUID'
assert isinstance(body['answers'],list)
a,b=[] , []
for label in ('A','B'):
 code,resp=call('POST',f'/api/v1/orders/{order}/services',body,{'Idempotency-Key':f'integration-{uuid.uuid4()}'})
 assert code==201 and resp['sellableItemUuid']==service and resp['orderUuid']==order
 (a if label=='A' else b).append(resp)
assert a[0]['uuid']!=b[0]['uuid'],'Failed same-type service independence'
code,after=call('GET',f'/api/v1/orders/{order}/services')
assert any(x['uuid']==a[0]['uuid'] for x in after)
assert any(x['uuid']==b[0]['uuid'] for x in after)
print('PASS live repeated same-type create/list (two real staging writes). Edit/transition/tenant negative tests remain dedicated follow-up checks.')
