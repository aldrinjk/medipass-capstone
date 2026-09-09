# MediPass Patient Mobile Application (`apps/mobile`)

**Module Owner**: Team Member 1 (Patient Mobile Experience & Clinical Profile)  
**Assigned Branch**: `feature/mobile-patient-experience`  
**Architecture Revision**: Rev 2 (Expo + Supabase PostgreSQL + Flyway + Spring Boot)

---

## 1. Overview
The MediPass mobile app is an authenticated patient-facing application built with **React Native**, **Expo SDK**, **Expo Router**, and **TypeScript**. It enables patients to:
- Register, login, and automatically restore sessions securely.
- Complete their emergency clinical profile (Demographics, Allergies, Medications, Conditions, and Primary Emergency Contact).
- Configure fine-grained emergency **Sharing Preferences** using the frozen `ShareCategory` enum.
- View active, expired, and revoked **Emergency Passes** with access log audit summaries.
- Store sensitive JWT tokens using **Expo SecureStore** (`expo-secure-store`), never `AsyncStorage`.

> **Note on Boundaries**:  
> - QR code generation and public responder web UI belong to **Team Member 2**.  
> - Spring Boot backend, Flyway migrations, and database schema belong to **Team Members 3 & 4**.  
> - The mobile application connects strictly to the Spring Boot API (`EXPO_PUBLIC_API_BASE_URL`), never directly to Supabase.

---

## 2. Directory Structure

```
apps/mobile/
├── app/                          # Expo Router File-Based Routing
│   ├── _layout.tsx               # Root layout with SafeAreaProvider & AuthProvider
│   ├── index.tsx                 # Session validation & initial route redirector
│   ├── (auth)/                   # Unauthenticated route group
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # Login screen with validation & error states
│   │   └── register.tsx          # Patient registration screen
│   └── (app)/                    # Protected authenticated route group
│       ├── _layout.tsx           # Tab navigation layout (Dashboard, Profile, Sharing, Passes)
│       ├── dashboard.tsx         # Readiness scorecard, active passes, and quick actions
│       ├── sharing.tsx           # Sharing preferences toggles & explanations
│       ├── passes.tsx            # Emergency pass manager & access audit logs
│       └── profile/              # Clinical profile nested stack
│           ├── _layout.tsx
│           ├── index.tsx         # Clinical profile hub menu
│           ├── demographics.tsx  # View/edit demographics, vitals, blood type
│           ├── allergies.tsx     # Allergy CRUD with severity badges & modal
│           ├── medications.tsx   # Medication CRUD with dosage/frequency & modal
│           ├── conditions.tsx    # Conditions CRUD with clinical status & modal
│           └── emergency-contact.tsx # Primary emergency contact form
├── components/                   # Accessible UI primitives (touch targets >= 48px)
│   ├── Button.tsx, Input.tsx, Card.tsx, Badge.tsx, CategoryToggle.tsx,
│   ├── ProgressBar.tsx, LoadingSpinner.tsx, ErrorBanner.tsx, EmptyState.tsx
├── features/                     # Feature-specific forms & cards
│   ├── patient/                  # DemographicsForm, AllergyCard, MedicationCard, etc.
│   └── sharing/                  # SharingPreferencesForm, PassSummaryCard, AccessHistoryList
├── services/                     # HTTP & storage services
│   ├── secureStore.ts            # Sensitive token storage via Expo SecureStore
│   ├── apiClient.ts              # Axios instance + Bearer token injection + 401 refresh
│   ├── authService.ts            # Auth & session restore
│   ├── patientService.ts         # Profile & completeness calculations
│   ├── allergyService.ts         # Allergies CRUD
│   ├── medicationService.ts      # Medications CRUD
│   ├── conditionService.ts       # Conditions CRUD
│   ├── emergencyContactService.ts # Emergency contact GET/PUT
│   ├── sharingService.ts         # Sharing preferences GET/PUT
│   ├── passService.ts            # Passes & access audit logs GET
│   └── mockData.ts               # Synthetic fallback dataset
├── hooks/                        # Custom React hooks (useAuth, usePatientProfile, etc.)
├── types/                        # Domain models, enums & Zod validation schemas
└── __tests__/                    # Automated unit & integration tests
```

---

## 3. Setup & Running Locally

### Prerequisites
- Node.js >= 20
- npm >= 10
- Expo Go app on your physical device (Android or iOS), or an Android emulator

### Installation
```bash
# 1. Navigate to apps/mobile
cd apps/mobile

# 2. Copy environment template
cp .env.example .env

# 3. Install dependencies
npm install --legacy-peer-deps

# 4. Run automated test suite
npm test

# 5. Verify TypeScript types
npm run typecheck

# 6. Start the Expo development server
npx expo start
```

### Running on Physical Android Device
1. Install **Expo Go** from Google Play Store on your Android phone.
2. Ensure your phone and computer are on the same Wi-Fi network (or use `npx expo start --tunnel`).
3. Scan the QR code in your terminal using the Expo Go camera/scanner.

---

## 4. API Contract & Consumed Endpoints

All calls are routed to `EXPO_PUBLIC_API_BASE_URL` (default: `http://localhost:8080`).

| Category | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/register` | `POST` | Register new patient account |
| | `/api/v1/auth/login` | `POST` | Patient login (stores tokens in SecureStore) |
| | `/api/v1/auth/refresh` | `POST` | Silent JWT token refresh |
| | `/api/v1/auth/logout` | `POST` | Session termination & secure wipe |
| **Profile** | `/api/v1/patients/me` | `GET`, `PUT` | View / update patient demographics |
| **Allergies** | `/api/v1/patients/me/allergies` | `GET`, `POST` | List / add patient allergies |
| | `/api/v1/patients/me/allergies/{id}` | `PUT`, `DELETE` | Update / delete allergy entry |
| **Medications** | `/api/v1/patients/me/medications` | `GET`, `POST` | List / add medication entries |
| | `/api/v1/patients/me/medications/{id}` | `PUT`, `DELETE` | Update / delete medication entry |
| **Conditions** | `/api/v1/patients/me/conditions` | `GET`, `POST` | List / add conditions |
| | `/api/v1/patients/me/conditions/{id}` | `PUT`, `DELETE` | Update / delete condition entry |
| **Emergency Contact** | `/api/v1/patients/me/emergency-contact` | `GET`, `PUT` | Single emergency-contact workflow |
| **Sharing** | `/api/v1/patients/me/sharing-preferences` | `GET`, `PUT` | Read / update shareable category toggles |
| **Passes** | `/api/v1/passes` | `GET`, `POST` | List passes & create new pass |
| | `/api/v1/passes/{id}/revoke` | `POST` | Revoke active emergency pass |
| | `/api/v1/passes/{id}/audit` | `GET` | Access audit trail for pass |

### Frozen Enums
- **`ShareCategory`**: `DEMOGRAPHICS` | `ALLERGIES` | `MEDICATIONS` | `CONDITIONS` | `EMERGENCY_CONTACT`
- **`PassStatus`**: `ACTIVE` | `REVOKED` | `EXPIRED`

---

## 5. Verification & Acceptance Checklist

- [x] **Authentication & Session**:
  - Patient registration with validation (matching passwords, valid email).
  - Login with JWT token storage via Expo SecureStore.
  - Automatic silent session restoration upon reopening app.
  - Full logout with token erasure.
- [x] **Dashboard Readiness**:
  - Profile readiness calculation (0-100%) tracking demographics, allergies, medications, conditions, and contact.
  - Quick statistics grid with deep links.
- [x] **Clinical Profile CRUD**:
  - Demographics view/edit with ISO date validation and blood type pills.
  - Allergy list and modal CRUD with severity badges (`SEVERE`, `MODERATE`, `MILD`).
  - Medication list and modal CRUD with dosage, frequency, route, and instructions.
  - Condition list and modal CRUD with clinical statuses.
  - Emergency contact single view/edit workflow.
- [x] **Sharing Preferences**:
  - Toggle list covering all 5 categories with explicit privacy notes.
  - Persistent save to Spring Boot endpoint.
- [x] **Pass Management & Navigation**:
  - Active pass list and duration selector.
  - Revocation action.
  - Access audit log inspection modal showing timestamp, status, and truncated IP.
- [x] **Offline / Demonstration Support**:
  - Curated synthetic fallback dataset (`mockData.ts`) matching OpenAPI schemas when local backend is not yet started.
- [x] **Automated Tests**:
  - 27 unit and integration tests passing in Jest (`npm test`).
  - Strict TypeScript check passing (`npm run typecheck`).
