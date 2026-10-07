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
- View active, expired, and revoked **Emergency Passes** with responder-accountability audit summaries (outcome, responder identity metadata, verification method, device label, trace code, and masked phone digits when applicable).
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
│           ├── demographics.tsx  # View/edit full name, birth date, gender, phone
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
│   └── mockData.ts               # Opt-in synthetic dataset (EXPO_PUBLIC_USE_MOCKS=true)
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

# 2. Copy environment template and set your API URL
cp .env.example .env
# Simulator: http://localhost:8080
# Physical phone on Expo Go: http://<laptop-LAN-IP>:8080 (same Wi-Fi)

# 3. Install dependencies
npm install --legacy-peer-deps

# 4. Run automated test suite
npm test

# 5. Verify TypeScript types
npm run typecheck

# 6. Start the Expo development server
npx expo start
```

### Running on a Physical Device (Expo Go)
1. Install **Expo Go** from the App Store or Google Play.
2. Put the phone and laptop on the **same Wi-Fi**.
3. Set `EXPO_PUBLIC_API_BASE_URL=http://<laptop-LAN-IP>:8080` in `.env`.
   - `localhost` on the phone is the phone itself, not the laptop API.
   - `npx expo start --tunnel` only tunnels the Expo bundler. It does **not** make `localhost:8080` on the phone reach Spring Boot on your laptop.
4. Scan the Expo QR code.

Keep `EXPO_PUBLIC_USE_MOCKS=false` unless you explicitly want local synthetic data. Mock mode never turns on just because `__DEV__` is true or the API URL is missing.

---

## 4. API Contract & Consumed Endpoints

All calls are routed to `EXPO_PUBLIC_API_BASE_URL`. On a simulator this is often `http://localhost:8080`. On a physical device it must be `http://<laptop-LAN-IP>:8080`.

| Category | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/register` | `POST` | Register new patient account |
| | `/api/v1/auth/login` | `POST` | Patient login (stores tokens in SecureStore) |
| | `/api/v1/auth/me` | `GET` | Validate stored tokens and load `{ id, email, role }` |
| | `/api/v1/auth/refresh` | `POST` | Rotate refresh token; persist both `accessToken` and `refreshToken` |
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
| | `/api/v1/passes/{id}/rotate` | `POST` | Rotate pass token and return a new `publicUrl` |
| **Access logs** | `/api/v1/patients/me/access-logs` | `GET` | Patient-visible responder access history, including outcome, responder metadata, verification method, device label, trace code, and timestamp |

### Frozen Enums
- **`ShareCategory`**: `DEMOGRAPHICS` | `ALLERGIES` | `MEDICATIONS` | `CONDITIONS` | `EMERGENCY_CONTACT`
- **`PassStatus`**: `ACTIVE` | `REVOKED` | `EXPIRED`

---

## Sharing and pass-scope authority

The Sharing screen persists the patient's selected `ShareCategory` values to the backend. The Passes screen refreshes those preferences when focused and again immediately before pass creation.

The backend is the final authority: `EmergencyPassService` reads the server-stored sharing preferences when issuing a new pass and does not trust a stale/tampered client category list. This prevents a disabled category from being reintroduced into a newly generated QR pass.

## 5. Verification & Acceptance Checklist

- [x] **Authentication & Session**:
  - Register with email + password, then login, save tokens, and load `/api/v1/auth/me`.
  - Login stores `accessToken` and `refreshToken` in Expo SecureStore (no patient ID).
  - Session restore validates stored tokens with `GET /api/v1/auth/me`.
  - Refresh token rotation persists both tokens from `/api/v1/auth/refresh`.
  - Full logout with token erasure.
- [x] **Dashboard Readiness**:
  - Profile readiness from backend fields: full name, birth date, gender, phone, allergies, medications, conditions, and emergency contact.
- [x] **Clinical Profile CRUD**:
  - Demographics: `fullName`, `birthDate`, `gender`, `phone`.
  - Allergies: `substance`, `reaction`, `severity`.
  - Medications: `name`, `dosage`, `frequency`.
  - Conditions: `name`, `status`, `notes`.
  - Emergency contact: `name`, `relationship`, `phone`.
- [x] **Sharing Preferences**:
  - Toggle list covering all 5 categories with descriptions that match backend fields.
- [x] **Pass Management & Navigation**:
  - Create, revoke, and rotate active passes.
  - `publicUrl` is shown only after create/rotate (list metadata does not include it).
  - Access logs show `accessedAt`, outcome, responder name/role/organization when supplied, verification method, masked phone digits, browser-visible device label, and `MP-...` trace code. The backend does not persist the responder's IP address or full phone number.
- [x] **Mocks**:
  - Opt-in only via `EXPO_PUBLIC_USE_MOCKS=true`.
- [x] **Automated Tests**:
  - Contract tests for auth, refresh rotation, API errors, DTOs, and no silent mocks.
  - Strict TypeScript check (`npm run typecheck`).
