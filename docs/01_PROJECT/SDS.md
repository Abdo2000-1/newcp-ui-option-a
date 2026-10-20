# Project Software Design Specification (SDS): 3DDX CP PRO MAX

**Document Identifier:** `SDS-3DDX-PROJECT-2026-V1.0`  
**Classification:** Enterprise Software Engineering & Architecture Specification  
**Standard Compliance:** IEEE Std 1016-2009 (Systems and Software Engineering — Software Design Descriptions)  
**Scope:** Whole-Project Frontend Architecture (`newcp-ui-option-a`)  
**Workspace:** `H:\3DDX\DEMO\newcp-ui-option-a`  
**Primary Domain Authority:** `H:\3DDX\02 Backend\New DB V3\03 BUSINESS_GUIDE.html`  
**API Specification:** OpenAPI 3.0.3 (`openapi/newcp.openapi.yaml` pending formal ingestion)  

---

## 1. Introduction & Executive Architectural Overview

This Software Design Specification (SDS) defines the structural, behavioral, and engineering architecture for the **3DDX CP PRO MAX Frontend** (`newcp-ui-option-a`). 

The primary design goal is transitioning the application from a coupled, mock-dependent prototype into a resilient, enterprise-grade clinical frontend governed by **Clean Architecture** and **Ports & Adapters (Hexagonal Architecture)** principles.

*Component Specification Note:* A pre-existing component-level SDS (`docs/90_PRODUCT_REFERENCE/SDS_SOFTWARE_DESIGN_SPECIFICATION.md`) governs the isolated Three.js 3D Odontogram rendering engine. This document establishes the **system-wide architecture** covering state management, network transport, security, domain invariants, containerization, and CI/CD engineering.

---

## 2. Current Architecture vs. Target Clean Architecture

### 2.1 Current-State Architecture (POC Baseline)
In the current implementation:
- **Presentation & State Coupling:** UI pages (`src/pages/*.tsx`) import the singleton `store` (`src/services/store.ts`) directly.
- **LocalStorage as Single Source of Truth:** `ReactiveStore` synchronizes all entity mutations to browser `localStorage` under `dentalab_store_*`.
- **Static JSON Fetching:** `src/services/api.ts` performs direct `fetch()` calls against static JSON files in `/data/*.json` and simulates database joins and filtering in client memory.
- **Generic Data Models:** The domain models in `src/types/index.ts` use generic string enumerations (`OrderStatus = 'New' | 'Review' | 'Design' ...`) which contradict the product-specific status codes defined by the 3DDX Business Guide.

```
[Current POC Flow]
[React UI Page] <---> [ReactiveStore (localStorage)] <---> [api.ts (fetch '/data/*.json')]
```

### 2.2 Target Architecture (Clean Architecture / Hexagonal)
The target architecture enforces a strict unidirectional dependency rule: **Dependencies point inward. Inner layers know nothing of outer layers.**

```
+-----------------------------------------------------------------------------------+
| 1. PRESENTATION LAYER (React Components, Tailwind UI, Three.js 3D Viewers)       |
+-----------------------------------------------------------------------------------+
                                          | uses
                                          v
+-----------------------------------------------------------------------------------+
| 2. APPLICATION LAYER (Use Cases, State Selectors, Query/Mutation Hooks)          |
+-----------------------------------------------------------------------------------+
                     | uses                               | uses
                     v                                    v
+---------------------------------------+  +----------------------------------------+
| 3. DOMAIN LAYER (Pure TypeScript)     |  | 4. INFRASTRUCTURE & TRANSPORT ADAPTERS |
| - Service Line Entities & Invariants  |  | - OpenAPI 3.0.3 HTTP Client (Axios/Ky) |
| - Registration Verdict State Machine  |  | - Auth & Token Store (Web Crypto/RAM)  |
| - Voucher Ledger Calculator           |  | - Mock Service Worker (MSW) Adapter    |
| - Product Status Decoders             |  | - S3/GCS Direct Upload Engine          |
+---------------------------------------+  +----------------------------------------+
```

---

## 3. High-Level UML Architecture & System Components

### 3.1 Component & Package Architecture Diagram
```mermaid
graph TD
    subgraph Presentation_Layer ["Presentation Layer (React 19 & Tailwind CSS v4)"]
        UI_Pages["Page Views (Cases, Orders, Billing, WorkflowBoard)"]
        UI_Comps["Atomic Design Components (DataTable, Badges, Modals)"]
        CAD_Engine["Clinical Engine (<TeethChart /> 3D WebGL)"]
    end

    subgraph Application_Layer ["Application Layer (Use Cases & Orchestration)"]
        CaseUC["Case Management Use Cases"]
        SgUC["Surgical Guide Workflow Use Cases"]
        RegUC["Registration Verdict Evaluator"]
        BillUC["Voucher & Billing Use Cases"]
        CacheStore["Query Cache / Client State (TanStack Query)"]
    end

    subgraph Domain_Layer ["Domain Core (Pure TypeScript Business Invariants)"]
        DomainEntities["Entities (Account, Case, Order, ServiceInstance)"]
        DomainServices["Domain Services (Implant Pricing, Verdict Evaluator)"]
        StatusDecoders["Service-Line Specific Status Decoders"]
        LedgerRules["Voucher Drawdown & Ledger Calculation"]
    end

    subgraph Infrastructure_Layer ["Infrastructure & Adapters Layer"]
        HttpAdapter["OpenAPI 3.0.3 HTTP Client Adapter"]
        AuthAdapter["OAuth 2.0 PKCE & Session Adapter"]
        MswAdapter["Mock Service Worker (Simulated Mode)"]
        StorageAdapter["Direct Cloud Upload Adapter (S3/GCS)"]
    end

    UI_Pages --> CaseUC
    UI_Pages --> SgUC
    UI_Pages --> BillUC
    UI_Comps --> CAD_Engine
    CaseUC --> DomainEntities
    SgUC --> DomainServices
    SgUC --> StatusDecoders
    BillUC --> LedgerRules
    CaseUC --> CacheStore
    SgUC --> CacheStore
    CacheStore --> HttpAdapter
    HttpAdapter -.-> MswAdapter
    HttpAdapter --> AuthAdapter
    CaseUC --> StorageAdapter
```

---

## 4. Comprehensive UML Class Diagrams

### 4.1 Domain Entity Hierarchy Class Diagram
The core business hierarchy strictly reflects Section 4 and Section 13 of the 3DDX Business Guide:

```mermaid
classDiagram
    direction TB

    class Account {
        +string accountId
        +string companyName
        +AccountType accountType
        +PriceBook priceBook
        +string defaultCurrency
        +VoucherLedger voucherLedger
        +SpecialRequest[] specialRequests
        +boolean isSuspended
        +getAvailableCredit() Money
    }

    class Patient {
        +string patientCode
        +string owningClientId
        +string legacyKey
        +Date createdAt
        +requestIdentityAccess(string purpose) PatientIdentity
    }

    class PatientIdentity {
        +string patientCode
        +string fullName
        +Date dateOfBirth
        +Gender gender
        +string contactPhone
        +string contactEmail
    }

    class Case {
        +string caseId
        +string caseNumber
        +string patientCode
        +string accountId
        +string clinicalIntent
        +ArchSelection archSelection
        +CasePairingType pairingType
        +Order[] orders
        +addOrder(Order order) void
    }

    class Order {
        +string orderId
        +string orderNumber
        +string caseId
        +string billedAccountId
        +Date submissionDate
        +Priority priority
        +ServiceInstance[] serviceLines
        +Document[] uploadedFiles
        +boolean isCharged
        +Date chargedAt
    }

    class ServiceInstance {
        <<abstract>>
        +string instanceId
        +string orderId
        +ServiceType serviceType
        +string assignedTechnicianId
        +integer rawStatusCode
        +Date dueDate
        +boolean isLocked
        +Money unitPrice
        +StatusHistory[] history
        +lockWork(string userId) void
        +unlockWork(string reason) void
        +getStatusLabel()* string
    }

    class SurgicalGuideService {
        +GuideSupport supportType
        +integer implantCount
        +ImplantSite[] implantSites
        +SleeveSpecification[] sleeves
        +boolean isPrePositioningGuide
        +DeliveryMode deliveryMode
        +boolean doctorApproved
        +Date approvedAt
        +string approvalEvidence
        +LoanerKit loanerKit
        +BatchRecord batchRecord
        +submitDoctorApproval(ApprovalPayload proof) void
        +getStatusLabel() string
    }

    class ConversionService {
        +ConversionType conversionType
        +boolean nerveMappingRequired
        +boolean mandibularNerveMapped
        +string planningSoftware
        +Document cafFile
        +getStatusLabel() string
    }

    class ModelWorkService {
        +PackageIntake packageDetails
        +LaserScan laserScanData
        +PhysicalArchiveBin archiveBin
        +boolean pouredInHouse
        +getStatusLabel() string
    }

    class TreatmentPlanService {
        +PlanningMode planningMode
        +boolean isReluAIPlanning
        +FineTuningSession ftSession
        +Document planDicom
        +scheduleFineTuning(Date datetime) void
        +getStatusLabel() string
    }

    class RestorationService {
        +RestorationType restoType
        +RestorationStage stage
        +ShadeSpecification shade
        +string material
        +RetentionType retention
        +getStatusLabel() string
    }

    class VoucherLedger {
        +string voucherId
        +string accountId
        +Money openingBalance
        +Money currentBalance
        +integer casesRemaining
        +Date expirationDate
        +VoucherTransaction[] transactions
        +drawdownCredit(Money amount, integer cases) VoucherTransaction
        +reverseTransaction(string txId, string reason) void
    }

    class VoucherTransaction {
        +string transactionId
        +string voucherId
        +string serviceInstanceId
        +TransactionType txType
        +Money amount
        +integer casesDeducted
        +Date timestamp
        +string operatorNote
    }

    class CustomerSupportTask {
        +string taskId
        +string accountId
        +string orderId
        +TaskTrigger trigger
        +string description
        +Date dueDate
        +TaskPriority priority
        +TaskStatus status
        +extendDueDate(Date newDate, string reason) void
        +resolveTask(string resolutionNotes) void
    }

    Account "1" *-- "0..*" Case : owns
    Account "1" *-- "0..1" VoucherLedger : holds
    Patient "1" <.. "1" Case : clinically references
    Patient "1" ..> "0..1" PatientIdentity : isolated identity
    Case "1" *-- "1..*" Order : contains
    Order "1" *-- "1..*" ServiceInstance : encompasses
    ServiceInstance <|-- SurgicalGuideService
    ServiceInstance <|-- ConversionService
    ServiceInstance <|-- ModelWorkService
    ServiceInstance <|-- TreatmentPlanService
    ServiceInstance <|-- RestorationService
    VoucherLedger "1" *-- "0..*" VoucherTransaction : records
    Order "1" ..> "0..*" CustomerSupportTask : triggers
```

### 4.2 Clean Architecture Class Structure (Ports & Adapters)
```mermaid
classDiagram
    direction LR

    class ISurgicalGuideUseCase {
        <<interface>>
        +createGuideOrder(CreateGuideDTO dto) Promise~GuideDetails~
        +submitRegistrationOption(string instanceId, RegistrationVerdictDTO verdict) Promise~void~
        +recordDoctorApproval(string instanceId, ApprovalDTO proof) Promise~ServiceInstance~
        +fetchProductionBatch(string instanceId) Promise~BatchRecord~
    }

    class SurgicalGuideInteractor {
        -ISurgicalGuideRepository guideRepo
        -IRegistrationValidator validator
        -INotificationPort notifier
        +createGuideOrder(CreateGuideDTO dto) Promise~GuideDetails~
        +submitRegistrationOption(string instanceId, RegistrationVerdictDTO verdict) Promise~void~
        +recordDoctorApproval(string instanceId, ApprovalDTO proof) Promise~ServiceInstance~
        +fetchProductionBatch(string instanceId) Promise~BatchRecord~
    }

    class ISurgicalGuideRepository {
        <<interface>>
        +findById(string instanceId) Promise~SurgicalGuideService~
        +save(SurgicalGuideService guide) Promise~void~
        +recordApproval(string instanceId, ApprovalPayload payload) Promise~void~
    }

    class OpenApiGuideHttpAdapter {
        -HttpClient client
        +findById(string instanceId) Promise~SurgicalGuideService~
        +save(SurgicalGuideService guide) Promise~void~
        +recordApproval(string instanceId, ApprovalPayload payload) Promise~void~
    }

    class MswSimulatedGuideAdapter {
        -InMemoryDatabase db
        +findById(string instanceId) Promise~SurgicalGuideService~
        +save(SurgicalGuideService guide) Promise~void~
        +recordApproval(string instanceId, ApprovalPayload payload) Promise~void~
    }

    class UseSurgicalGuideViewModel {
        +guideData SurgicalGuideService
        +isLoading boolean
        +isApproving boolean
        +error string
        +onApprovePlan(ApprovalProof proof) void
        +onSubmitOption(RegistrationOption option) void
    }

    ISurgicalGuideUseCase <|.. SurgicalGuideInteractor
    SurgicalGuideInteractor --> ISurgicalGuideRepository
    ISurgicalGuideRepository <|.. OpenApiGuideHttpAdapter
    ISurgicalGuideRepository <|.. MswSimulatedGuideAdapter
    UseSurgicalGuideViewModel --> ISurgicalGuideUseCase
```

---

## 5. Comprehensive UML Use Case Diagrams

### 5.1 Global System Use Case Model
```mermaid
flowchart TD
    subgraph External_Actors ["External Commercial Actors"]
        Doctor["Dentist / OMFS Doctor"]
        ScanCenter["Scanning Centre"]
        LabPartner["Commercial Lab / Partner"]
        DsoAdmin["DSO Administrator"]
    end

    subgraph Internal_Actors ["Internal Operational Actors"]
        CS["Customer Support (Global)"]
        Planner["Treatment Planner (Cairo)"]
        FineTuner["Fine-Tuner / Clinician (Cairo)"]
        OpsCairo["Operations CAD Tech (Cairo)"]
        BostonTech["Boston Lab Technician (Boston)"]
        BostonShip["Boston Shipping & Logistics (Boston)"]
        FinanceUser["Finance Officer (Global)"]
    end

    subgraph Portal_Boundary ["3DDX CP PRO MAX Platform Boundaries"]
        UC01["Submit Case & Clinical Intent"]
        UC02["Interactive Odontogram Charting"]
        UC03["Upload CBCT Scans & Models"]
        UC04["Evaluate Registration Verdict (Options 1-4)"]
        UC05["3D Conversion & Nerve Canal Mapping"]
        UC06["CoDiagnostiX Virtual Implant Planning"]
        UC07["Conduct Live Fine-Tuning Session"]
        UC08["Approve Surgical Guide (Mandatory Gate)"]
        UC09["Sleeve Placement & CAD Guide Design"]
        UC10["Boston Physical Model Intake & Pouring"]
        UC11["3D Printing, Wash, Cure & QC Verification"]
        UC12["Assemble Loaner Kit & Dispatch Courier"]
        UC13["Process Voucher Drawdown & Charging"]
        UC14["Resolve Event-Driven Support Tasks"]
    end

    Doctor --> UC01
    Doctor --> UC02
    Doctor --> UC03
    Doctor --> UC07
    Doctor --> UC08

    ScanCenter --> UC01
    ScanCenter --> UC03

    LabPartner --> UC01
    LabPartner --> UC08

    DsoAdmin --> UC01
    DsoAdmin --> UC13

    OpsCairo --> UC04
    OpsCairo --> UC05
    OpsCairo --> UC09

    Planner --> UC06
    Planner --> UC09

    FineTuner --> UC07
    FineTuner --> UC08

    BostonTech --> UC10
    BostonTech --> UC11

    BostonShip --> UC12

    FinanceUser --> UC13

    CS --> UC14
    UC04 -.->|Option 3 or 4 Hold| UC14
    UC08 -.->|Unblocks| UC09
    UC09 -.->|Ready for Print| UC11
```

---

## 6. Comprehensive UML Sequence Diagrams

### 6.1 Canonical Surgical Guide Lifecycle Sequence
This sequence demonstrates the full flow from doctor submission to courier dispatch, highlighting the Cairo-Boston separation and the critical approval gate:

```mermaid
sequenceDiagram
    autonumber
    actor Doctor as Dentist (Doctor)
    participant Portal as Frontend UI
    participant CairoOps as Cairo Operations (CAD)
    participant BostonLab as Boston Lab (Physical)
    participant Planner as Cairo Planning Team
    participant CS as Customer Support
    participant Finance as Finance System

    Doctor->>Portal: Submits Case, Charts Teeth & Uploads CBCT
    Portal->>CairoOps: Dispatches 3D Conversion Order
    CairoOps->>CairoOps: Converts DICOM & Maps Mandibular Canal
    
    par Physical Courier Intake (Boston)
        Doctor->>BostonLab: Sends Stone Impression / Physical Model
        BostonLab->>BostonLab: Scans Barcode, Pours Model & Laser Scans
        BostonLab->>Portal: Uploads Optical Model STL & Bins Physical Package
    and Digital Registration (Cairo)
        CairoOps->>CairoOps: Registers Optical STL onto CBCT
        CairoOps->>Portal: Submits Registration Verdict (Option 1: Clean)
    end

    Portal->>Planner: Unlocks Treatment Plan Order
    Planner->>Planner: Positions Virtual Implants in CoDiagnostiX
    Planner->>Portal: Sets Plan Status to "Ready" (Code 13)

    Planner->>Doctor: Schedules & Conducts Fine-Tuning Video Call
    
    critical Mandatory Approval Gate (No Manufacturing Before Doctor Sign-off)
        Doctor->>Portal: Clicks "Approve Treatment Plan" (or Confirms Email)
        Portal->>Portal: Validates Cryptographic Approval Token
    end

    Portal->>Planner: Unlocks Sleeve Design (Code 38)
    Planner->>Planner: Positions Titanium Sleeves & Prints Instruction Sheet
    Planner->>CairoOps: Hands off to Planning QC (Code 47)
    CairoOps->>CairoOps: Models Guide CAD Body (Code 39)
    CairoOps->>Portal: Uploads Sliced Build File

    Portal->>BostonLab: Routes to Formlabs/Carbon 3D Printer (Code 42)
    BostonLab->>BostonLab: 3D Prints Guide, IPA Wash & UV Curing Oven
    BostonLab->>BostonLab: Seats Titanium Sleeves & Tests on Fitting Surface (FS)
    BostonLab->>BostonLab: Packages Guide, Protocol & Scans Outbound Loaner Kit
    BostonLab->>Portal: Confirms Shipment with Tracking Number (Code 40)

    Portal->>Finance: Enters Daily Charging Cycle (Closed + Uncharged)
    Finance->>Finance: Deducts Voucher Credit (or Charges Credit Card)
```

### 6.2 Registration Options 1–4 Decision Sequence
```mermaid
sequenceDiagram
    autonumber
    actor Tech as Operations CAD Tech (Cairo)
    participant UI as Frontend Registration Screen
    participant Engine as Registration State Engine
    participant Email as Comms Notification Service
    participant CSTasks as Customer Support Task Engine
    actor Doctor as Clinician (Doctor)

    Tech->>UI: Inspects STL alignment on CBCT
    
    alt Option 1: Clean Alignment
        Tech->>UI: Selects Option 1 (Clean) & Uploads Merge File
        UI->>Engine: Advance status to Planning (Code 12)
        Engine-->>UI: Workflow Unblocked
    else Option 2: Clean with Clinical Finding
        Tech->>UI: Selects Option 2 + Notes (e.g. slight artifact)
        UI->>Engine: Advance status to Planning
        Engine->>CSTasks: Log Informational Note to Account History
        Engine-->>UI: Workflow Unblocked
    else Option 3: Usable with Compromise (Clinical Hold)
        Tech->>UI: Selects Option 3 + Standard Findings + Proposed Remedies
        UI->>Engine: Set Case Status to "On Hold" (Code 41)
        Engine->>Email: Send Doctor Email with Clickable Option Links
        Engine->>CSTasks: Raise Urgent CS Task: "Chase Doctor Verdict (Option 3)"
        Doctor->>Email: Clicks Selected Solution Link
        Email->>CSTasks: Update Task with Doctor Selection
        CSTasks->>Engine: Release Hold with Doctor Instruction
    else Option 4: Unusable Scans (Hard Block)
        Tech->>UI: Selects Option 4 (Unusable Scans / Mismatched Anatomy)
        UI->>Engine: Set Case Status to "Hard Block" (Code 41)
        Note over Engine: DOWNSTREAM FILE UPLOAD SUPPRESSED
        Engine->>Email: Send Urgent Retake Request to Doctor
        Engine->>CSTasks: Raise Task: "Request New Scans/Impressions"
    end
```

### 6.3 Immutable Voucher Ledger Transaction Sequence
```mermaid
sequenceDiagram
    autonumber
    actor Doctor as Client Doctor
    participant Portal as Client Portal UI
    participant Ledger as Voucher Ledger Domain Engine
    participant Billing as Billing & Invoicing Service
    actor Finance as Finance Officer

    Doctor->>Portal: Purchases 10-Case Surgical Guide Voucher Package
    Portal->>Billing: Process Payment Gateway Transaction
    Billing->>Ledger: POST Issue Transaction (+$2,500.00, +10 Cases)
    Ledger->>Ledger: Append Immutable Entry (Type: ISSUE)
    Note over Ledger: Balance = $2,500.00 (10 Cases)

    loop Case Completion
        Portal->>Ledger: Service SG-901 Closed -> Request Drawdown
        Ledger->>Ledger: Verify Drawdown Priority:<br/>1. General Credit<br/>2. Oldest Voucher<br/>3. Pre-purchased Cases First
        Ledger->>Ledger: Append Immutable Entry (Type: REDEEM, -$250.00, -1 Case)
        Note over Ledger: Balance Updated to $2,250.00 (9 Cases)
    end

    opt Manual Correction / Refund
        Finance->>Portal: Case SG-901 Cancelled prior to printing
        Portal->>Ledger: POST Reversal Request (SG-901, Reason: Cancelled)
        Ledger->>Ledger: Append Compensating Entry (Type: REFUND, +$250.00, +1 Case)
        Note over Ledger: Balance Restored to $2,500.00 (10 Cases)
    end
```

### 6.4 Authentication, PKCE, Token Refresh & Tenant Isolation Sequence
```mermaid
sequenceDiagram
    autonumber
    actor User as Authenticated Clinician
    participant App as React Frontend SPA
    participant Interceptor as Axios/Fetch Interceptor
    participant AuthServ as Identity Backend (OAuth 2.0 PKCE)
    participant Api as Protected API Gateway

    User->>App: Clicks "Sign in with Google"
    App->>AuthServ: Initiates OAuth 2.0 PKCE Authorization
    AuthServ-->>App: Redirect with Authorization Code
    App->>AuthServ: POST /auth/token (Code + Code Verifier)
    AuthServ-->>App: HTTP 200 OK (AccessToken in Body, RefreshToken in HttpOnly Cookie)
    App->>App: Store AccessToken in Memory (Never in LocalStorage)

    User->>App: Navigates to Cases List
    App->>Interceptor: GET /api/v1/cases
    Interceptor->>Interceptor: Inject "Authorization: Bearer <token>" & "X-Tenant-ID: clinic_42"
    Interceptor->>Api: Forward HTTP Request
    Api-->>Interceptor: HTTP 200 OK (Tenant-Scoped Cases Data)
    Interceptor-->>App: Render Data

    opt Silent Token Refresh on 401 Expiration
        App->>Interceptor: GET /api/v1/orders
        Interceptor->>Api: Forward HTTP Request with Expired Token
        Api-->>Interceptor: HTTP 401 Unauthorized
        Interceptor->>AuthServ: POST /auth/refresh (Sends HttpOnly Cookie)
        AuthServ-->>Interceptor: New AccessToken
        Interceptor->>Interceptor: Update In-Memory Token
        Interceptor->>Api: Re-execute Original Request with New Token
        Api-->>Interceptor: HTTP 200 OK
        Interceptor-->>App: Transparently Render Orders
    end
```

---

## 7. Comprehensive UML State Machine & Activity Diagrams

### 7.1 Surgical Guide Service-Line State Machine (`stateDiagram-v2`)
State integers reflect the exact 3DDX product vocabulary:

```mermaid
stateDiagram-v2
    [*] --> ReviewingOrder: Intake Submission (Code 36)
    
    ReviewingOrder --> OnHold: Intake Check Failed / Scans Missing
    ReviewingOrder --> WaitingConfirmation: Plan Ready & Sent to Doctor (Code 37)
    
    OnHold --> ReviewingOrder: Scans Received / Blocker Resolved
    
    state "Clinical Consultation & Approval" as ApprovalPhase {
        WaitingConfirmation --> SleeveDesign: Doctor Approval Confirmed (Code 38)
        WaitingConfirmation --> OnHold: Doctor Rejects / Mod Request (Code 41)
    }

    state "Cairo CAD Engineering" as CairoPhase {
        SleeveDesign --> TP_QC: Sleeves Placed (Code 47)
        TP_QC --> GuideDesign: QC Passed (Code 39)
        TP_QC --> SleeveDesign: QC Rejected
        GuideDesign --> AwaitingModifications: Design Change Needed (Code 46)
        AwaitingModifications --> GuideDesign: Changes Applied
    }

    state "Boston Physical Manufacturing" as BostonPhase {
        GuideDesign --> GuidePrinting: File Sliced & Queued to Printer (Code 42)
        GuidePrinting --> Shipped: Washed, Cured, Sleeve Seated, QC Passed (Code 40)
    }

    Shipped --> [*]: Courier Delivered & Invoiced
```

### 7.2 Registration Verdict Activity Diagram
```mermaid
flowchart TD
    Start([Optical Scan & CBCT Available]) --> CheckSupport{Determine Guide Support Type}
    
    CheckSupport -- Bone-Supported --> CheckPPG{Is Pre-Positioning Guide PPG Flagged?}
    CheckPPG -- No --> SkipReg[Bypass Registration -> Advance to Planning]
    CheckPPG -- Yes --> MandatoryReg[Registration Mandatory]
    
    CheckSupport -- Tooth-Supported --> STLReg[Perform Optical Model STL Registration]
    CheckSupport -- Tissue-Supported --> DualScanReg[Perform Dual-Scan Denture Registration]
    
    STLReg --> EvalVerdict{Evaluate Surface Match}
    DualScanReg --> EvalVerdict
    MandatoryReg --> EvalVerdict

    EvalVerdict -- Clean Match --> Opt1[Option 1: Upload File -> Advance to Planning]
    EvalVerdict -- Acceptable with Artifact --> Opt2[Option 2: Advance to Planning -> Notify CS]
    EvalVerdict -- Partial Discrepancy --> Opt3[Option 3: Clinical Hold -> Send Email with Clickable Choices -> Create CS Task]
    EvalVerdict -- Severe Distortion / Wrong Arch --> Opt4[Option 4: Hard Block -> Suppress File Upload -> Demand Retake Scans]

    Opt3 --> AwaitChoice{Doctor Responds to Email?}
    AwaitChoice -- Doctor Selects Solution --> ReleaseOpt3[Release Hold with Documented Decision]
    ReleaseOpt3 --> SkipReg

    Opt4 --> AwaitRetake{New Scans Provided?}
    AwaitRetake -- Fresh Scans Uploaded --> Start
    
    Opt1 --> Finish([Ready for CoDiagnostiX Planning])
    Opt2 --> Finish
    SkipReg --> Finish
```

### 7.3 Boston Regulated Manufacturing Activity Flow
```mermaid
flowchart TD
    A([Doctor Approval Confirmed]) --> B[Generate Production Work Order & Barcode]
    B --> C[Verify Printer Queue & Allocate Formlabs/Carbon Printer]
    C --> D[Log Resin Batch Lot Number & Start 3D Print Job]
    D --> E[Remove Platform & Submerge in Stage 1 IPA Wash Bath]
    E --> F[Stage 2 Pure IPA Wash Bath - 10 min]
    F --> G[Dry with Compressed Air & Transfer to UV Curing Oven]
    G --> H[Run UV Curing Oven Cycle: 60°C for 30 min]
    H --> I[Carefully Clip and Polish Support Tips]
    I --> J[Seat Surgical Stainless Steel / Titanium Guide Sleeves]
    J --> K[Retrieve Physical Stone Model from Shelf Bin Archive]
    K --> L{Test Seating on Fitting Surface FS}
    L -- Rocking / Incomplete Seating --> M[Reject Build -> Log Internal Redo -> Return to Guide Design]
    L -- Passive, Stable Seating Passed --> N[Assemble Instruction Sheet & Extra Pins]
    N --> O{Loaner Drill Kit Ordered?}
    O -- Yes --> P[Scan Kit Serial Number & Generate Return Label]
    O -- No --> Q[Pack into Padded Shipping Box]
    P --> Q
    Q --> R[Scan Final Shipping Label & Dispatch via FedEx/UPS]
    R --> S([Order Status: Shipped - Code 40])
```

---

## 8. Authentication, Tenant Isolation & Privacy Boundaries

### 8.1 Tenant Context Resolution
- The application enforces strict multi-tenant boundaries. Every outgoing API request carries an authenticated `X-Tenant-ID` header.
- For Dental Support Organizations (DSOs), switching clinics triggers an automatic eviction of the React Query cache to prevent cross-tenant data bleed.

### 8.2 Anonymized Patient Privacy Architecture
In compliance with Section 13.9 of the 3DDX Business Guide:
1. `clinical.patients` contains only `patient_code` and `client_id`.
2. Real patient identities (name, phone, DOB) are isolated in `clinical.patient_identities`.
3. The frontend never displays patient names in standard lists. Clicking "Show Identity" prompts the user for a clinical purpose, dispatching a logged audit event before returning the identity token.

---

## 9. Docker and Containerization Strategy

### 9.1 Multi-Stage Production Dockerfile Design
```dockerfile
# Stage 1: Build Environment
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit
COPY . .
RUN npm run build

# Stage 2: Hardened Nginx Runtime
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/dist .
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### 9.2 Custom Nginx Routing & Security Headers (`deploy/nginx.conf`)
- **SPA Fallback Routing:** `try_files $uri $uri/ /index.html;` ensures React Router deep linking functions without 404 errors.
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

---

## 10. Automated Testing Strategy

| Test Level | Target Framework | Scope & Coverage Targets | Execution Trigger |
|---|---|---|---|
| **Unit Tests** | Vitest | Pure domain functions, pricing calculators, status decoders, voucher drawdowns. Target: > 90% logic coverage. | Pre-commit / CI PR |
| **Component Tests** | Vitest + React Testing Library | UI components, form validations, accessibility keyboard traps, empty/error state handling. | Pre-commit / CI PR |
| **Contract / API Tests** | MSW + Vitest | Verifies that frontend API adapters correctly parse backend JSON payloads against OpenAPI schemas. | CI PR |
| **End-to-End (E2E)** | Playwright (Future Phase) | Critical user journeys: Case creation -> 3D Odontogram -> Approval Gate -> Billing dispatch. | Nightly / Pre-release |

---

## 11. Security, Compliance & Observability

1. **Zero Client Secrets:** All authentication exchanges use OAuth PKCE or server-side session cookies. No API private keys exist in client code.
2. **Cross-Site Scripting (XSS) Mitigation:** React's built-in JSX escaping prevents HTML injection. Raw SVG/HTML rendering is strictly prohibited without DOMPurify sanitization.
3. **Structured Telemetry:** Production errors caught by React Error Boundaries are transmitted with correlation IDs, route context, and anonymized user IDs.

---

## 12. Architectural Decisions Requiring Human Approval

The following critical decisions require explicit sign-off from the Technical Lead and Product Owner before code execution:
1. **Selection of Unit Testing Engine:** Formal adoption of Vitest over Jest for alignment with Vite.
2. **Adoption of TanStack Query:** Replacing `ReactiveStore` with React Query for server-state synchronization.
3. **OpenAPI Specification Freeze:** Confirmation of the final OpenAPI 3.0.3 contract from the backend engineering team.
4. **Approval of FMP/GFMP Status Sequences:** Finalizing the open business question regarding whether FMP/GFMP are independent services, order forms, or bundled workflows.

---

*Authored under Task T-000 governance. Canonical project-level software design specification for `newcp-ui-option-a`.*