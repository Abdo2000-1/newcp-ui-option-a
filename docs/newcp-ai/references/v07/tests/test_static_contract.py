#!/usr/bin/env python3
"""Offline tests only: NOT PostgreSQL/Express/React integration tests."""
import unittest,csv,json,re,hashlib
from pathlib import Path
import yaml
from jsonschema import Draft4Validator
B=Path(__file__).resolve().parents[1]
SQL=B/'evidence/v3_migrations'

def json_refs(document):
    out=[]
    def visit(obj):
        if isinstance(obj,dict):
            for k,v in obj.items():
                if k=='$ref':out.append(v)
                else:visit(v)
        elif isinstance(obj,list):
            for x in obj:visit(x)
    visit(document);return out

class StaticChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec=yaml.safe_load((B/'contracts/newcp-demo.openapi.yaml').read_text())
        cls.examples=json.loads((B/'fixtures/synthetic_contract_examples.json').read_text())
    def test_openapi_version_and_paths(self):
        self.assertEqual(self.spec['openapi'],'3.0.3')
        self.assertEqual(len(self.spec['paths']),7)
        self.assertEqual(len({p.get('operationId') for path in self.spec['paths'].values() for p in path.values()}),9)
    def test_references_are_resolved(self):
        schemas=self.spec['components']['schemas']
        for ref in json_refs(self.spec):
            self.assertTrue(ref.startswith('#/components/schemas/'))
            self.assertIn(ref.split('/')[-1],schemas)
    def test_reference_schema_shapes(self):
        for schema in self.spec['components']['schemas'].values():
            Draft4Validator.check_schema(schema)
    def test_example_request_response_against_contract(self):
        schemas=self.spec['components']['schemas']
        from referencing import Registry,Resource
        from referencing.jsonschema import DRAFT4
        registry=Registry()
        for k,s in schemas.items():registry=registry.with_resource('https://example.test/NewCP/schema/'+k,Resource.from_contents(s,default_specification=DRAFT4))
        import jsonschema
        for k,item in [('CreateServiceItem',self.examples['sampleCreateRequest']),('ServiceItem',self.examples['sampleCreatedService']),('TransitionResult',self.examples['sampleTransition'])]:
            schema=schemas[k]
            # Use jsonschema's base schema document to resolve embedded OpenAPI-style refs
            resolver=jsonschema.RefResolver.from_schema(self.spec)
            jsonschema.validate(item,schema,resolver=resolver)
    def test_ddl_mapping_verified(self):
        rows=list(csv.DictReader((B/'mappings/01_verified_ddl_columns.csv').read_text().splitlines()))
        self.assertGreaterEqual(len(rows),100)
        missing=[(r['table'],r['column']) for r in rows if r['status']!='DDL_VERIFIED']
        self.assertEqual(missing,[],f'Unmatched mapping: {missing}')
        for r in rows:
            source=(SQL/r['migration_file']).read_text().splitlines()
            self.assertIn(r['column'],source[int(r['line'])-1])
    def test_service_multiplicity_not_prevented_by_composite_unique(self):
        src=(SQL/'V011__orders_tables.sql').read_text()
        block=src.split('CREATE TABLE orders.order_items (',1)[1].split(');',1)[0]
        self.assertIn('uq_order_items__order_id__line_number',block)
        self.assertNotRegex(block,r'UNIQUE\s*\(order_id\s*,\s*sellable_item_id\)')
    def test_precharge_billed_party_not_falsely_mapped(self):
        ddl=(SQL/'V011__orders_tables.sql').read_text().split('CREATE TABLE orders.order_items (',1)[1].split(');',1)[0]
        self.assertNotIn('billed_to_contact_id',ddl)
        self.assertIn('Bill To / intended payer intentionally excluded',self.spec['components']['schemas']['CreateServiceItem']['description'])
    def test_form_source_coverage(self):
        rows=list(csv.DictReader((B/'mappings/02_connect_fields_to_v3_resolution.csv').read_text().splitlines()))
        self.assertEqual(len(rows),75)
        self.assertEqual({r['selected_service'] for r in rows},{'conversion','biomodel','implant_analog_model'})
        self.assertTrue(all(r['v3_field_code']=='UNRESOLVED' for r in rows))
    def test_safe_sql_only(self):
        sql=(B/'mappings/03_READ_ONLY_TENANT_DISCOVERY.sql').read_text()
        self.assertIn('BEGIN TRANSACTION READ ONLY',sql)
        self.assertIn('ROLLBACK',sql)
        self.assertIn("set_config('app.tenant_id'",sql)
        self.assertNotRegex(sql,re.compile(r'(?mi)^\s*(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)\s'))
    def test_partial_drizzle_source_columns(self):
        s=(B/'drizzle/v3-demo-scope.schema.ts').read_text()
        self.assertIn('orderItems = orders.table',s)
        self.assertIn('fieldValues = orders.table',s)
        self.assertNotIn("billedToContactId:",s)
        self.assertIn('itemKind',s)

if __name__=='__main__':unittest.main(verbosity=2)
