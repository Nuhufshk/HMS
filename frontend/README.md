# Adom Medical Centre — Hospital Management System

A modern, production-quality Hospital Management System (HMS) web application built for hospital
administrators, doctors, nurses, receptionists, pharmacists, laboratory technicians and accountants.

Built as a **frontend + backend** project: the React SPA consumes a REST API
(`hospital/backend`, Express + TypeScript) through a thin `apiClient` — no mock data lives in
the frontend. See the root `hospital/README.md` for the full-stack setup.

## Tech stack

| Layer        | Choice                                   |
| ------------ | ---------------------------------------- |
| Framework    | React 19 + Vite 8 + TypeScript           |
| Styling      | Tailwind CSS v4 (semantic design tokens) |
| Routing      | React Router v7                          |
| Icons        | Lucide React                             |
| Charts       | Recharts                                 |

## Getting started

The frontend talks to the backend over `/api` (proxied by the Vite dev server), so the backend
must be running too. From the `hospital/` root:

```bash
npm run install:all
npm run dev        # starts backend (3001) + frontend (5173)
```

Or from this folder only, with the backend started separately:

```bash
npm install
npm run dev        # frontend dev server on 5173 (expects API on 3001)
npm run build      # typecheck + production build
```

## Demo accounts

| Role                    | Email                              | Password        |
| ----------------------- | ---------------------------------- | --------------- |
| Administrator           | admin@adommedicalcentre.gh         | `admin123`      |
| Doctor                  | doctor@adommedicalcentre.gh        | `doctor123`     |
| Nurse                   | nurse@adommedicalcentre.gh         | `nurse123`      |
| Receptionist            | reception@adommedicalcentre.gh     | `reception123`  |
| Pharmacist              | pharmacy@adommedicalcentre.gh      | `pharmacy123`   |
| Laboratory Technician   | lab@adommedicalcentre.gh           | `lab123`        |
| Accountant              | accountant@adommedicalcentre.gh    | `accountant123` |

The login page lists these accounts — click one to auto-fill the credentials.

## Modules

- **Dashboard** — welcome message, live metrics, appointment trend & patient statistics charts,
  today's appointments, recent patients and activity feed.
- **Patients** — searchable/filterable/sortable table, registration form with validation,
  detailed patient profile with tabs (overview, medical history, appointments, prescriptions,
  lab results, billing, notes) and allergy alerts.
- **Appointments** — today/upcoming/all views plus a monthly calendar; create, edit, reschedule,
  check-in, start, complete and cancel (with confirmation).
- **Doctors & Nurses** — card/table management with add, edit, view, enable/disable; doctor
  profiles with schedule, appointments and assigned patients.
- **Departments** — department cards with heads, staffing levels and detail views.
- **Pharmacy** — medicine inventory with stock alerts (low / out-of-stock / expiring / expired),
  add/edit medicine, and prescription dispensing that decrements stock.
- **Laboratory** — full test workflow: requested → sample collected → processing → completed,
  with result entry, reference ranges and abnormal flags; detail page with a status timeline.
- **Medical Records** — chronological timeline of diagnoses, vitals, notes and treatment plans,
  with an add-record form (vitals grid included).
- **Prescriptions** — multi-medication prescription writer with per-row validation, statuses
  (active / dispensed / completed / cancelled) and cancel confirmation.
- **Billing** — invoices with Ghana cedi (GH₵) formatting, insurance coverage, payment recording,
  professional printable invoice layout, download (as a file) and overdue tracking.
- **Reports** — period-filterable analytics (today / week / month / year / custom): registrations,
  appointments, revenue, department performance, pharmacy sales and lab throughput.
- **Staff** — staff directory with roles, add/edit/view and activate/deactivate (confirmed).
- **Settings** — hospital info, profile, security (password + 2FA), notification preferences and
  appearance (light / dark / system).

## Key features

- **Theming** — Light, Dark and System themes with semantic design tokens, persisted in
  `localStorage`, no flash-of-wrong-theme on load, live switching everywhere (including charts).
- **Role-based access control** — navigation is filtered per role and every route is guarded at
  the router level with a proper unauthorized state.
- **API service layer** — all data flows through `src/services/*`, which call the backend
  (`hospital/backend`) via `apiClient` (fetch + bearer-token auth). The services expose typed
  methods (getPatients, createAppointment, recordPayment, …) that pages consume — swapping the
  transport never touches components.
- **Realistic Ghanaian demo data** — fictional patients/staff, Ghanaian names, `+233` phone
  numbers, cities, NHIS/private insurance, GHS pricing and realistic medication/lab terminology.
- **Accessibility** — visible keyboard focus, semantic labels, ARIA dialogs, `aria-live` toasts,
  role/status communicated with text + icons + colour (never colour alone).
- **Responsive** — desktop sidebar with collapse, mobile drawer navigation, scrollable tables,
  single-column forms and resizing charts.
- **Code-splitting** — every page is a lazy-loaded route chunk.
- **Backend-ready** — the service layer maps 1:1 to REST endpoints documented in
  `hospital/README.md`.

## Project structure

```
src/
├── assets/                 (static assets)
├── components/
│   ├── ui/                 Button, Input/Select/Textarea/Checkbox/Radio/Switch, Badge, Card,
│   │                       Modal/ConfirmDialog, Dropdown, Tabs, Pagination, DataTable, Avatar,
│   │                       SearchBar, DatePicker, States (loading/empty/error), ThemeToggle
│   ├── common/             Logo, PageHeader, MetricCard, StatusBadge
│   ├── charts/             theme-aware Recharts wrappers + ChartCard + tooltip
│   └── forms/              (form patterns live with their pages; FormField in ui/)
├── layouts/                AppLayout, Sidebar, Navbar
├── pages/                  auth, dashboard, patients, appointments, doctors, nurses,
│                           departments, pharmacy, laboratory, medical-records,
│                           prescriptions, billing, reports, staff, settings, errors
├── routes/                 AppRoutes (code-split), guards (auth + role)
├── hooks/                  useAsyncData, useDebouncedValue
├── services/               mock API layer (patients, appointments, pharmacy, lab, billing, …)
├── types/                  TypeScript domain models (unions, no any)
├── data/                   mock datasets (Ghanaian demo data)
├── utils/                  cn, date helpers, formatting (GHS currency)
├── constants/              roles, navigation/RBAC map, status semantics, options
├── context/                Theme, Auth, Toast, Notification providers
└── styles/                 (global styles live in index.css)
```

## Design system

- **Brand**: emerald green (`#02A864`) with clinical blue (`#2563EB`) as support — derived
  from the reference visual.
- **Sidebar**: brand-green surface with white text in light mode and a **white active pill**
  (emerald text); dark mode keeps a slate-teal surface with a tinted active state.
- **Semantics**: green = success/completed, amber = pending/warning, red = critical/error,
  blue = info/scheduled, violet = processing (used sparingly). Centralised in
  `src/constants/status.ts` — the same tone is reused across every module.
- **Tokens**: `--background`, `--card`, `--muted`, `--primary`, `--success`, `--warning`,
  `--destructive`, `--info`, `--processing` etc., mapped to Tailwind utilities, with dedicated
  dark-theme values.
- **Typography**: Inter with system fallbacks; hierarchy via weight/size, not decoration.

## Testing

The repo includes Playwright smoke tests against the dev server:

```bash
npm run dev            # terminal 1
node scripts/smoke.mjs # terminal 2 — full admin workflow + RBAC
node scripts/roles.mjs # per-role navigation & route blocking (mobile viewport)
```

## Notes

- All data is fictional and lives in the backend's in-memory store — restarting the API resets
  mutations (theme and session preferences persist in the browser).
- The invoice **Print** button opens the browser print dialog with a clean invoice layout.
- Demo credentials/passwords are for development only.
