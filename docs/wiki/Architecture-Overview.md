# 🏗️ Architecture Overview

The frontend architecture follows **Clean Architecture** principles and **Feature-Sliced Design (FSD)**:

```
src/
├── app/                  # Application initialization & shell
│   ├── App.tsx           # BrowserRouter & providers bootstrap
│   ├── providers/        # MUI Theme, TanStack Query, ErrorBoundary, Language
│   ├── router/           # Route definitions & lazy-loaded pages
│   └── shell/            # Header, Sidebar, Navigation, Support
├── features/             # Business domain modules
│   ├── auth/             # Login, profile, authentication
│   ├── orders/           # Flow, cases, sub-orders, Kanban board
│   ├── models/           # Task 47 Model Work reports
│   ├── reporting/        # Dashboard, quarterly targets, metrics
│   └── settings/         # Clinics, doctors, scan centers, config
├── shared/               # Reusable cross-feature primitives
│   ├── api/              # OpenAPI typed requests & error models
│   ├── components/       # MUI-based reusable components
│   ├── hooks/            # Custom reusable React hooks
│   ├── utils/            # Clinical formatters & helpers
│   └── types/            # TypeScript domain interfaces
├── theme/                # Central MUI theme tokens & palette
└── test/                 # Test runners, mocks, setup files
```

### Architectural Principles

1. **Explicit Ownership Boundaries**: Cross-feature dependencies flow inward to `shared/`. Features do not directly import private internals of sibling features.
2. **Provider Separation**: UI state, server state (React Query), clinical theme, and language localization operate via discrete providers wrapped in an `ErrorBoundary`.
3. **Type Strictness**: Strict TypeScript compilation enabled with zero implicit `any` escapes.
