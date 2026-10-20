# Automated Testing Strategy: newcp-ui-option-a

**Status:** Testing Infrastructure Baseline  
**Target Runner:** Vitest + React Testing Library + Mock Service Worker (MSW)  

---

## 1. Scope & Layering

The testing suite covers four distinct verification tiers:
1. **Domain Unit Tests (`test/unit/`):** Pure TypeScript logic (pricing algorithms, status decoders, registration verdict transitions, voucher ledger arithmetic).
2. **Component Tests (`test/components/`):** Atomic UI controls, forms, validation states, accessibility attributes (`aria-*`), and keyboard navigation.
3. **API & Contract Tests (`test/contract/`):** Mock Service Worker (MSW) handlers validating frontend request payloads against OpenAPI 3.0.3 schemas.
4. **End-to-End Tests (`test/e2e/`):** Critical clinical journeys (case creation, 3D odontogram interaction, treatment plan approval gate).

---

## 2. Directory Structure

```text
test/
├── setup.ts              # Global test setup and browser API polyfills
├── unit/                 # Domain logic unit tests
├── components/           # UI component tests
├── contract/             # OpenAPI contract mocks (MSW)
└── README.md             # This document
```

---

## 3. Running Tests (Upon Vitest Installation)

When Vitest is added to `package.json` in follow-up implementation tasks:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in interactive UI mode
npm run test:ui
```
