#!/usr/bin/env python3
"""F07 OFFLINE contract/source consistency tests only, not live SQL or web E2E."""
from pathlib import Path
import ast, json, re, unittest
import yaml, jsonschema
ROOT=Path(__file__).resolve().parents[1]

class F07StaticContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.openapi=yaml.safe_load((ROOT/'integration/newcp-demo-f07.openapi.yaml').read_text())
        cls.s=cls.openapi['components']['schemas']
        cls.fixtures=json.loads((ROOT/'fixtures/f07_synthetic_contract_examples.json').read_text())
        cls.sql=(ROOT/'source/migrations/V204__service_level_billed_party.sql').read_text()
    def test_contract_stays_draft_and_versioned(self):
        self.assertEqual(self.openapi['openapi'],'3.0.3')
        self.assertTrue('UNVERIFIED' in self.openapi['x-contract-status'])
        self.assertIn('/api/v1/orders/{orderUuid}/eligible-billed-parties',self.openapi['paths'])
    def test_payer_present_for_create_patch_and_read(self):
        for name in ('CreateServiceItem','PatchServiceItem','ServiceItem'):
            p=self.s[name]['properties']
            self.assertEqual(p['billedToContactUuid']['format'],'uuid')
            self.assertNotIn('billedPartyOrigin',p if name in ('CreateServiceItem','PatchServiceItem') else {})
        self.assertIn('billedPartyOrigin',self.s['ServiceItem']['required'])
    def test_role_choices_and_provenance(self):
        self.assertEqual(self.s['BilledPartyChoice']['properties']['role']['enum'],['doctor','scanning_center'])
        self.assertEqual(set(self.s['BilledPartyOrigin']['enum']),{
             'legacy_explicit','order_default','manual_resolution','user_selected','unresolved_legacy'})
    def test_samples_pass_schema_validation(self):
        from jsonschema import RefResolver
        resolver=RefResolver.from_schema(self.openapi)
        for kind,example in [
          ('CreateServiceItem',self.fixtures['sampleCreateRequest']),
          ('PatchServiceItem',self.fixtures['samplePatchPayerRequest']),
          ('ServiceItem',self.fixtures['sampleCreatedService'])]:
            jsonschema.validate(example,self.s[kind],resolver=resolver)
        arr=self.fixtures['sameTypeInstancesDifferentPayers']
        self.assertNotEqual(arr[0]['uuid'],arr[1]['uuid'])
        self.assertNotEqual(arr[0]['billedToContactUuid'],arr[1]['billedToContactUuid'])
    def test_V204_source_columns_guards_and_owning_table(self):
        for token in ['ADD COLUMN billed_to_contact_id bigint',
                      'ADD COLUMN billed_party_origin varchar(30)',
                      'REFERENCES crm.contacts (id)',
                      'trg_order_items__billed_party_validate',
                      'NEW.billed_to_contact_id IS DISTINCT FROM OLD.billed_to_contact_id',
                      'trg_charges__item_payer',
                      'trg_invoice_lines__item_payer',
                      'trg_order_items__direct_invoice_payer']:
           self.assertIn(token,self.sql)
    def test_stage30_and_stage90_have_payer_gates(self):
        stage30=(ROOT/'source/etl/stage_30_orders.py').read_text()
        stage90=(ROOT/'source/etl/stage_90_finalise.py').read_text()
        for token in ('billed_to_contact_id','billed_party_origin'):
            self.assertIn(token,stage30); self.assertIn(token,stage90)
        self.assertIn('unresolved_legacy',stage90)
        for f in ('billed_party.py','profile_billed_party.py','stage_30_orders.py','stage_90_finalise.py'):
            ast.parse((ROOT/'source/etl'/f).read_text())
    def test_drizzle_and_client_consistent(self):
        s=(ROOT/'integration/v3-demo-f07.schema.ts').read_text()
        c=(ROOT/'integration/newcp-demo-client-f07.ts').read_text()
        for token in ("billedToContactId:bigint('billed_to_contact_id'", "billedPartyOrigin:varchar('billed_party_origin'",'export const contacts'):
            self.assertIn(token,s)
        for token in ('billedToContactUuid','billedPartyOrigin','eligibleBilledParties:'):
            self.assertIn(token,c)
    def test_policy_is_template_not_approved(self):
        p=json.loads((ROOT/'source/etl/billed_party_policy.template.json').read_text())
        self.assertIn('__SET_TO_APPROVED',p['policy_version'])
        self.assertIn('__GENERATED',p['source_domain_sha256'])
        self.assertIn('NOT VERIFIED HERE', (ROOT.parents[1]/'policy/F07_DECISION_AND_RELEASE_GATES.md').read_text())
    def test_read_only_sql(self):
        s=(ROOT/'integration/READ_ONLY_F07_RUNTIME_VERIFICATION.sql').read_text()
        self.assertIn('BEGIN TRANSACTION READ ONLY',s)
        self.assertIn('ROLLBACK;',s)
        self.assertNotRegex(s,re.compile(r'(?mi)^\s*(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)\s'))

if __name__=='__main__':unittest.main(verbosity=2)
